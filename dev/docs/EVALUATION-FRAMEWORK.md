# AI Evaluation Framework

## Overview

The AI Evaluation Framework automatically assesses the quality of AI-generated legal outputs using a comprehensive set of metrics. Every tool run is evaluated immediately after generation, with scores stored in the database and displayed to users.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Execute Route                         │
│  1. User submits input                                       │
│  2. AI generates output                                      │
│  3. OutputEvaluator.evaluate() ← AUTOMATIC                  │
│  4. Score saved to database                                  │
│  5. Score returned in response                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              OutputEvaluator (lib/ai/evaluation/)            │
│                                                              │
│  Calculates 8 quality metrics:                              │
│  - Completeness  - Citations                                │
│  - Clarity       - Relevance                                │
│  - Structure     - Accuracy                                 │
│  - Legal Soundness - Tone                                   │
│                                                              │
│  Returns: EvaluationResult (score 0-100, pass/fail)         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Database (ToolRun model)                    │
│  - evaluationScore: Float (0-100)                           │
│  - evaluationData: Json (detailed metrics)                  │
│  - evaluatedAt: DateTime                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    UI Display                                │
│  History Page: Quality badge (🟢 🟡 🔴)                      │
│  Provenance Panel: Detailed scores + pass/fail              │
└─────────────────────────────────────────────────────────────┘
```

## Quality Metrics

### 1. Completeness (0-100)

**Measures:** Whether the output is thorough and substantial.

**Scoring:**
- Word count: 500+ words = 40pts, 300-499 = 30pts, 150-299 = 20pts
- Has conclusion/summary: +20pts
- Multiple paragraphs (3+): +20pts
- Has headers/structure: +20pts

**Good Example:**
```
[500+ words with multiple sections, headers, and a conclusion]
Score: 90-100/100
```

**Poor Example:**
```
This is a brief answer.
Score: 20-30/100
```

### 2. Clarity (0-100)

**Measures:** Readability and understandability.

**Scoring:**
- Starts at 100, penalties applied:
  - Average sentence length >40 words: -20pts
  - Average sentence length >30 words: -10pts
  - Missing proper punctuation: -10pts
  - High repetition (unique word ratio <0.3): -20pts
  - No proper capitalization: -10pts

**Good Example:**
```
The contract contains three key provisions. First, the payment terms...
Score: 90-100/100
```

**Poor Example:**
```
the contract has stuff in it and things that might be important and you should look at them and think about what they mean and consider if they are good or bad
Score: 50-60/100
```

### 3. Structure (0-100)

**Measures:** Organization and formatting.

**Scoring:**
- Has headers/sections: +30pts
- Has bullet points or numbered lists: +20pts
- Multiple paragraphs (4+): +25pts, (2-3): +15pts
- Flow indicators (first, next, however, therefore): +15pts
- Introduction + conclusion: +10pts

**Good Example:**
```
# Legal Memo

## Issue
[Clear issue statement]

## Analysis
[Organized analysis with sections]

## Conclusion
[Clear conclusion]

Score: 90-100/100
```

**Poor Example:**
```
Everything in one long paragraph without any organization or headers just continuous text.
Score: 10-20/100
```

### 4. Citations (0-100)

**Measures:** Proper legal references (for research tools).

**Scoring:**
- Case citations (e.g., "123 F.3d 456"): +40pts
- Statute citations (e.g., "42 U.S.C. § 1983"): +20pts
- General citations with years: +20pts
- Multiple case citations (3+): +20pts

**Good Example:**
```
As held in Brown v. Board of Education, 347 U.S. 483 (1954), separate educational facilities are inherently unequal. This principle was reaffirmed in subsequent cases...
Score: 90-100/100
```

**Poor Example:**
```
The Supreme Court decided this issue in favor of the plaintiffs.
Score: 0-10/100
```

### 5. Relevance (0-100)

**Measures:** How well output addresses the input.

**Scoring based on keyword overlap:**
- 50%+ overlap: 100pts
- 30-49% overlap: 80pts
- 20-29% overlap: 60pts
- 10-19% overlap: 40pts
- <10% overlap: 20pts

**Example:**
```
Input: "contract breach damages liability"
Output: "The contract breach resulted in damages due to liability..."
Score: 100/100 (high keyword overlap)
```

### 6. Accuracy (0-100)

**Measures:** Correctness and lack of errors.

**Scoring:**
- Starts at 100, penalties applied:
  - Contains placeholders ([TODO], XXX, [INSERT]): -30pts
  - Incomplete sentences (..., --): -20pts
  - Missing legal disclaimer (except client communication): -10pts

**Good Example:**
```
[Complete, polished output with legal disclaimer]
Score: 90-100/100
```

**Poor Example:**
```
[TODO: Add case name here]
The plaintiff XXX sued for...
Score: 40-50/100
```

### 7. Legal Soundness (0-100)

**Measures:** Professional legal tone and terminology.

**Scoring:**
- Starts at 100, penalties applied:
  - Casual language (gonna, wanna, cool): -20pts
  - Missing legal terminology: -15pts
  - Inappropriate guarantees (guarantee, promise, 100%): -25pts

**Good Example:**
```
Pursuant to the terms of the agreement, the party hereto shall...
Score: 90-100/100
```

**Poor Example:**
```
Yeah so the contract is gonna be fine and I guarantee you'll definitely win.
Score: 40-50/100
```

### 8. Tone (0-100)

**Measures:** Appropriate professional tone (for client communication).

**Scoring:**
- Base score: 80pts
- Professional markers (Dear, Sincerely, Regards): +20pts
- Polite language (please, kindly, appreciate): +10pts
- Proper paragraph breaks: +10pts
- Aggressive language (must, demand, unacceptable): -20pts

**Good Example:**
```
Dear Client,

I hope this finds you well. Please find attached...

Best regards,
Attorney Name
Score: 100/100
```

**Poor Example:**
```
You must pay immediately. This is unacceptable.
Score: 60-70/100
```

## Category Thresholds

Different tool categories have different quality thresholds:

| Category | Threshold | Required Metrics | Rationale |
|----------|-----------|------------------|-----------|
| **Legal Research** | 85% | accuracy, relevance, citations, completeness | High stakes, must be accurate with proper citations |
| **Contract Review** | 90% | accuracy, completeness, legalSoundness | Critical risk analysis requires highest quality |
| **Litigation Support** | 85% | accuracy, relevance, completeness | Court documents must be thorough and accurate |
| **Document Drafting** | 80% | structure, clarity, completeness, legalSoundness | Formal documents need good structure and clarity |
| **Corporate** | 80% | accuracy, structure, legalSoundness | Business documents need professionalism |
| **Employment** | 80% | accuracy, clarity, legalSoundness | Clear policies and documents |
| **IP** | 85% | accuracy, relevance, completeness | Technical and requires thoroughness |
| **Client Communication** | 75% | clarity, tone, relevance | Focus on clear, professional communication |
| **Real Estate** | 80% | accuracy, structure, completeness | Transactional documents need completeness |
| **Default** | 75% | accuracy, relevance, completeness | General baseline |

## Overall Score Calculation

The overall score is calculated by:
1. Evaluating all required metrics for the tool's category
2. Averaging the scores of required metrics
3. Rounding to nearest integer

**Example (Legal Research):**
- Accuracy: 90/100
- Relevance: 85/100
- Citations: 88/100
- Completeness: 85/100
- **Overall: (90+85+88+85)/4 = 87/100**

**Pass/Fail:**
- Pass: Overall score >= category threshold
- Fail: Overall score < category threshold

## Feedback Generation

The system automatically generates feedback when scores are low:

**Completeness < 50:**
- "Output appears incomplete or too brief"

**Clarity < 70:**
- "Output could be clearer and more readable"

**Citations < 50:**
- "Missing proper citations or legal references"

**Any metric < 70:**
- "{Metric} score is low ({score}/100) - needs improvement"

**All metrics good:**
- "Output meets quality standards"

## API Integration

### Execute Route Response

```typescript
{
  "success": true,
  "executionId": "uuid",
  "content": "...",
  "evaluation": {
    "score": 87,
    "passed": true,
    "threshold": 85
  }
}
```

### Database Storage

```typescript
interface ToolRun {
  evaluationScore: number        // 87
  evaluationData: {              // Full EvaluationResult
    score: 87,
    passed: true,
    threshold: 85,
    metrics: {
      accuracy: 90,
      relevance: 85,
      citations: 88,
      completeness: 85
    },
    feedback: ["Output meets quality standards"]
  }
  evaluatedAt: Date
}
```

## UI Display

### History Page

Shows quality badge with color coding:
- 🟢 **Green (85+):** Excellent quality
- 🟡 **Yellow (70-84):** Good quality
- 🔴 **Red (<70):** Needs improvement

Example:
```
Quality: 87/100 🟢
```

### Provenance Panel

Shows detailed evaluation:
```
Quality Score: 87/100 ✓ Passed
Threshold: 85/100
```

## Testing

### Run Evaluation Tests

```bash
npx tsx scripts/test-evaluation.ts
```

### Benchmark Datasets

Located in `lib/ai/evaluation/benchmarks.ts`:
- Legal Research (2 benchmarks)
- Document Drafting (1 benchmark)
- Client Communication (1 benchmark)
- Contract Review (1 benchmark)

Each benchmark includes:
- Sample input
- Expected high-quality output
- Expected minimum score
- Category and tool ID

## Usage Examples

### Manual Evaluation

```typescript
import { OutputEvaluator } from '@/lib/ai/evaluation'

const result = OutputEvaluator.evaluate(
  aiOutput,
  userInput,
  'Legal Research',
  'case-law-summarizer'
)

console.log(`Score: ${result.score}/100`)
console.log(`Passed: ${result.passed}`)
console.log(`Feedback: ${result.feedback.join(', ')}`)
```

### Automatic Evaluation (in AI route)

```typescript
// After AI generation
const evaluation = OutputEvaluator.evaluate(
  aiResponse.content,
  JSON.stringify(context),
  toolConfig.category,
  toolId
)

// Save to database
await prisma.toolRun.create({
  data: {
    // ... other fields
    evaluationScore: evaluation.score,
    evaluationData: evaluation,
    evaluatedAt: new Date()
  }
})
```

## Future Enhancements

### Planned Improvements

1. **Machine Learning Integration**
   - Train ML model on human-rated outputs
   - Use model for more nuanced scoring
   - A/B test against rule-based system

2. **Historical Trending**
   - Track tool quality over time
   - Alert on quality degradation
   - Identify prompt improvements needed

3. **User Feedback Loop**
   - Allow users to rate outputs
   - Correlate user ratings with eval scores
   - Adjust thresholds based on feedback

4. **Comparative Analysis**
   - Compare different AI models
   - Track quality by tier (free vs pro)
   - Identify best models per tool type

5. **Expanded Metrics**
   - Jurisdiction-specific evaluation
   - Practice area expertise scoring
   - Ethical consideration checks
   - Bias detection

## Maintenance

### Updating Thresholds

Edit `lib/ai/evaluation/types.ts`:

```typescript
export const CATEGORY_THRESHOLDS = {
  'Legal Research': {
    threshold: 85,  // Adjust as needed
    requiredMetrics: ['accuracy', 'relevance', 'citations', 'completeness']
  }
}
```

### Adding New Metrics

1. Add metric to `EvaluationMetrics` interface in `types.ts`
2. Implement scoring logic in `evaluator.ts`
3. Add to required metrics in category thresholds
4. Update tests and benchmarks
5. Update this documentation

### Adding Benchmarks

Edit `lib/ai/evaluation/benchmarks.ts`:

```typescript
export const NEW_CATEGORY_BENCHMARKS: Benchmark[] = [
  {
    toolId: 'tool-slug',
    toolName: 'Tool Name',
    category: 'Category',
    expectedScore: 85,
    description: 'Description',
    input: 'Sample input',
    expectedOutput: 'High-quality expected output...'
  }
]
```

## Support

For questions or issues with the evaluation framework:
1. Check this documentation
2. Review benchmarks in `benchmarks.ts`
3. Run test suite: `npx tsx scripts/test-evaluation.ts`
4. Examine evaluation logic in `evaluator.ts`

---

**Version:** 1.0  
**Last Updated:** December 9, 2025  
**Maintainer:** Engineering Team
