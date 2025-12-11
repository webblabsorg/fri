/**
 * Wave 1: Legal Research Tools (10 tools)
 */
export const WAVE1_RESEARCH_TOOLS = [
  {
    name: 'Case Law Analyzer',
    slug: 'case-law-analyzer',
    description: 'Deep analysis of case law with precedent mapping',
    category: 'legal-research',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Analyze this case:

{{input}}

Provide comprehensive analysis:
1. **Case Information**: Citation, court, date, parties
2. **Procedural History**: How case reached this court
3. **Key Holdings**: Primary legal conclusions
4. **Reasoning Analysis**: Court's logic and rationale
5. **Precedents Cited**: Key cases relied upon
6. **Subsequent Treatment**: How later courts treated this case
7. **Practical Implications**: How to use this case`,
    systemPrompt: 'You are a legal research expert with deep case law knowledge. Provide thorough, accurate analysis.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Statute Interpreter',
    slug: 'statute-interpreter',
    description: 'Interpret statutes with legislative history and case applications',
    category: 'legal-research',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Interpret this statute:

{{input}}

Provide:
1. **Plain Meaning**: Textual interpretation
2. **Legislative Intent**: Purpose and history
3. **Key Definitions**: Defined terms
4. **Case Interpretations**: How courts have applied it
5. **Regulatory Guidance**: Agency interpretations
6. **Practical Application**: How to apply in practice
7. **Common Issues**: Frequent interpretation questions`,
    systemPrompt: 'You are a statutory interpretation expert.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Legal Citation Validator',
    slug: 'legal-citation-validator',
    description: 'Validate and format legal citations in Bluebook style',
    category: 'legal-research',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'free',
    promptTemplate: `Validate and correct these legal citations:

{{input}}

For each citation:
1. **Original**: As provided
2. **Corrected**: Proper Bluebook format
3. **Issues Found**: What was wrong
4. **Short Form**: For subsequent references
5. **Parallel Citations**: If applicable`,
    systemPrompt: 'You are a legal citation expert. Apply Bluebook 21st edition rules precisely.',
    maxTokens: 2000,
    temperature: 0.3,
    wave: 1,
  },
  {
    name: 'Jurisdiction Analyzer',
    slug: 'jurisdiction-analyzer',
    description: 'Analyze jurisdiction and venue issues',
    category: 'legal-research',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Analyze jurisdiction for:

{{input}}

Evaluate:
1. **Subject Matter Jurisdiction**: Federal question, diversity
2. **Personal Jurisdiction**: Minimum contacts, consent
3. **Venue**: Proper venue options
4. **Forum Selection**: Contractual provisions
5. **Removal**: If applicable
6. **Strategic Considerations**: Best forum
7. **Potential Challenges**: Likely motions`,
    systemPrompt: 'You are a civil procedure expert.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Legal Issue Spotter',
    slug: 'legal-issue-spotter',
    description: 'Identify all legal issues in a fact pattern',
    category: 'legal-research',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Identify legal issues in:

{{input}}

For each issue:
1. **Issue**: Clear statement
2. **Relevant Law**: Applicable rules
3. **Key Facts**: Facts that trigger the issue
4. **Analysis**: Brief application
5. **Research Needed**: What to investigate further
6. **Priority**: High/Medium/Low importance`,
    systemPrompt: 'You are a legal analyst skilled at issue spotting.',
    maxTokens: 4000,
    temperature: 0.6,
    wave: 1,
  },
  {
    name: 'Regulatory Research Assistant',
    slug: 'regulatory-research-assistant',
    description: 'Research federal and state regulations',
    category: 'compliance',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Research regulations for:

{{input}}

Provide:
1. **Applicable Regulations**: CFR citations
2. **Regulatory Agency**: Which agency has authority
3. **Key Requirements**: Main compliance obligations
4. **Enforcement**: Penalties and enforcement history
5. **Guidance Documents**: Agency interpretations
6. **Recent Changes**: New or proposed rules
7. **Compliance Checklist**: Action items`,
    systemPrompt: 'You are a regulatory compliance expert.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Legal Memo Generator',
    slug: 'legal-memo-generator',
    description: 'Generate comprehensive legal research memos',
    category: 'legal-research',
    inputType: 'text',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a legal research memo on:

{{input}}

Format:
1. **Question Presented**: Issue to be analyzed
2. **Brief Answer**: Conclusion summary
3. **Statement of Facts**: Relevant facts
4. **Discussion**: 
   - Applicable law
   - Analysis
   - Application to facts
5. **Conclusion**: Recommendations`,
    systemPrompt: 'You are a legal research attorney drafting objective analysis.',
    maxTokens: 6000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Precedent Finder',
    slug: 'precedent-finder',
    description: 'Find relevant precedents for your legal argument',
    category: 'legal-research',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Find precedents for:

{{input}}

Provide:
1. **Binding Precedents**: Same jurisdiction
2. **Persuasive Authority**: Other jurisdictions
3. **Distinguishable Cases**: And how to distinguish
4. **Adverse Authority**: Cases against your position
5. **Key Quotes**: Useful language
6. **Citation Strategy**: How to use these cases`,
    systemPrompt: 'You are a legal research specialist.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Legal Dictionary',
    slug: 'legal-dictionary',
    description: 'Define legal terms with context and usage',
    category: 'legal-research',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'free',
    promptTemplate: `Define these legal terms:

{{input}}

For each term:
1. **Definition**: Clear explanation
2. **Latin Origin**: If applicable
3. **Legal Context**: How it's used
4. **Example**: In a sentence
5. **Related Terms**: Similar concepts
6. **Jurisdiction Notes**: If meaning varies`,
    systemPrompt: 'You are a legal terminology expert.',
    maxTokens: 2000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Secondary Source Finder',
    slug: 'secondary-source-finder',
    description: 'Find relevant treatises, law reviews, and secondary sources',
    category: 'research-enhancement',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Find secondary sources for:

{{input}}

Recommend:
1. **Treatises**: Leading treatises on topic
2. **Law Reviews**: Relevant articles
3. **Restatements**: Applicable sections
4. **Practice Guides**: Practical resources
5. **CLE Materials**: Educational content
6. **How to Use**: Strategy for each source`,
    systemPrompt: 'You are a legal research librarian.',
    maxTokens: 3000,
    temperature: 0.5,
    wave: 1,
  },
]
