/**
 * Phase 8: AI Regression Testing Script
 * 
 * Tests AI tool quality against baseline benchmarks from Phase 3.
 * 
 * Prerequisites:
 *   - Set ANTHROPIC_API_KEY environment variable
 *   - Node.js 18+
 * 
 * Usage:
 *   node prod/ai-regression-test.js
 *   node prod/ai-regression-test.js --tool legal-email-drafter
 *   node prod/ai-regression-test.js --dry-run
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  outputDir: path.join(__dirname, 'ai-regression-results'),
  dryRun: process.argv.includes('--dry-run'),
  specificTool: process.argv.find(arg => arg.startsWith('--tool='))?.split('=')[1],
};

// Phase 3 Baseline Benchmarks
const PHASE3_BASELINES = {
  'legal-email-drafter': {
    avgTokens: 150,
    maxTokens: 300,
    avgCost: 0.01,
    qualityThreshold: 0.85,
    expectedPatterns: ['Dear', 'Sincerely', 'regards'],
  },
  'contract-analyzer': {
    avgTokens: 300,
    maxTokens: 600,
    avgCost: 0.025,
    qualityThreshold: 0.85,
    expectedPatterns: ['clause', 'term', 'provision', 'agreement'],
  },
  'document-summarizer': {
    avgTokens: 200,
    maxTokens: 400,
    avgCost: 0.015,
    qualityThreshold: 0.85,
    expectedPatterns: ['summary', 'key points', 'main'],
  },
  'legal-research-assistant': {
    avgTokens: 400,
    maxTokens: 800,
    avgCost: 0.035,
    qualityThreshold: 0.80,
    expectedPatterns: ['case', 'precedent', 'statute', 'law'],
  },
  'compliance-checker': {
    avgTokens: 250,
    maxTokens: 500,
    avgCost: 0.02,
    qualityThreshold: 0.85,
    expectedPatterns: ['compliance', 'requirement', 'regulation'],
  },
};

// Test cases for each tool
const TEST_CASES = {
  'legal-email-drafter': [
    {
      name: 'Standard client email',
      input: {
        recipient: 'John Smith',
        subject: 'Contract Review Update',
        context: 'Following up on the employment contract review we discussed last week.',
        tone: 'professional',
      },
    },
    {
      name: 'Urgent matter notification',
      input: {
        recipient: 'Jane Doe',
        subject: 'Urgent: Filing Deadline Tomorrow',
        context: 'Reminder about the court filing deadline for the Johnson case.',
        tone: 'urgent',
      },
    },
  ],
  'contract-analyzer': [
    {
      name: 'Employment contract analysis',
      input: {
        contractText: 'This Employment Agreement is entered into between ABC Corp and John Doe. The Employee agrees to work for a period of 2 years with a salary of $100,000 annually. Non-compete clause applies for 1 year after termination.',
        analysisType: 'full',
      },
    },
  ],
  'document-summarizer': [
    {
      name: 'Legal brief summary',
      input: {
        document: 'The plaintiff alleges that the defendant breached the contract by failing to deliver goods as specified. The contract dated January 1, 2024 clearly states delivery within 30 days. Defendant claims force majeure due to supply chain issues.',
        length: 'brief',
      },
    },
  ],
  'legal-research-assistant': [
    {
      name: 'Case law research',
      input: {
        query: 'What are the key precedents for breach of contract in California?',
        jurisdiction: 'California',
      },
    },
  ],
  'compliance-checker': [
    {
      name: 'GDPR compliance check',
      input: {
        document: 'Our company collects user email addresses for marketing purposes. We store data on US servers and share with third-party advertisers.',
        regulations: ['GDPR'],
      },
    },
  ],
};

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  config: CONFIG,
  tools: {},
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  },
};

/**
 * Mock AI call for dry-run mode
 */
function mockAICall(toolId, input) {
  const baseline = PHASE3_BASELINES[toolId];
  const tokensUsed = baseline.avgTokens + Math.floor(Math.random() * 50) - 25;
  
  return {
    output: `[MOCK] Generated output for ${toolId} with input: ${JSON.stringify(input).substring(0, 100)}...`,
    tokensUsed,
    cost: (tokensUsed / 1000) * 0.003,
    model: 'claude-3-sonnet-20240229',
    latency: 500 + Math.random() * 1000,
  };
}

/**
 * Call the AI service (real or mock)
 */
async function callAI(toolId, input) {
  if (CONFIG.dryRun) {
    return mockAICall(toolId, input);
  }
  
  // In production, this would call the actual API
  // For now, we'll use the mock
  console.log(`  [INFO] Using mock AI for ${toolId} (set up real API integration for production)`);
  return mockAICall(toolId, input);
}

/**
 * Evaluate output quality
 */
function evaluateQuality(toolId, output) {
  const baseline = PHASE3_BASELINES[toolId];
  let score = 0;
  const checks = [];
  
  // Check for expected patterns
  const patternsFound = baseline.expectedPatterns.filter(pattern => 
    output.toLowerCase().includes(pattern.toLowerCase())
  );
  const patternScore = patternsFound.length / baseline.expectedPatterns.length;
  score += patternScore * 0.4;
  checks.push({
    name: 'Expected patterns',
    score: patternScore,
    details: `Found ${patternsFound.length}/${baseline.expectedPatterns.length} patterns`,
  });
  
  // Check output length (not too short, not too long)
  const outputLength = output.length;
  const lengthScore = outputLength > 50 && outputLength < 5000 ? 1 : 0.5;
  score += lengthScore * 0.2;
  checks.push({
    name: 'Output length',
    score: lengthScore,
    details: `${outputLength} characters`,
  });
  
  // Check for coherence (basic heuristic: sentences end properly)
  const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const coherenceScore = sentences.length > 0 ? 1 : 0;
  score += coherenceScore * 0.2;
  checks.push({
    name: 'Coherence',
    score: coherenceScore,
    details: `${sentences.length} sentences`,
  });
  
  // Check for professional language (no obvious errors)
  const hasErrors = /\b(undefined|null|error|exception)\b/i.test(output);
  const errorScore = hasErrors ? 0 : 1;
  score += errorScore * 0.2;
  checks.push({
    name: 'No errors',
    score: errorScore,
    details: hasErrors ? 'Contains error indicators' : 'Clean output',
  });
  
  return {
    overallScore: score,
    passed: score >= baseline.qualityThreshold,
    threshold: baseline.qualityThreshold,
    checks,
  };
}

/**
 * Run tests for a single tool
 */
async function testTool(toolId) {
  const baseline = PHASE3_BASELINES[toolId];
  const testCases = TEST_CASES[toolId] || [];
  
  console.log(`\n📋 Testing: ${toolId}`);
  console.log(`   Baseline: ${baseline.avgTokens} tokens, $${baseline.avgCost} avg cost`);
  
  const toolResults = {
    baseline,
    testCases: [],
    summary: {
      passed: 0,
      failed: 0,
      avgTokens: 0,
      avgCost: 0,
      avgLatency: 0,
      avgQuality: 0,
    },
  };
  
  for (const testCase of testCases) {
    console.log(`   🧪 ${testCase.name}...`);
    results.summary.totalTests++;
    
    try {
      const startTime = Date.now();
      const response = await callAI(toolId, testCase.input);
      const latency = Date.now() - startTime;
      
      const quality = evaluateQuality(toolId, response.output);
      
      const testResult = {
        name: testCase.name,
        input: testCase.input,
        output: response.output.substring(0, 500) + (response.output.length > 500 ? '...' : ''),
        metrics: {
          tokensUsed: response.tokensUsed,
          cost: response.cost,
          latency,
          model: response.model,
        },
        quality,
        passed: quality.passed && response.tokensUsed <= baseline.maxTokens,
      };
      
      toolResults.testCases.push(testResult);
      
      if (testResult.passed) {
        console.log(`      ✅ PASSED (quality: ${(quality.overallScore * 100).toFixed(1)}%)`);
        toolResults.summary.passed++;
        results.summary.passed++;
      } else {
        console.log(`      ❌ FAILED (quality: ${(quality.overallScore * 100).toFixed(1)}%)`);
        toolResults.summary.failed++;
        results.summary.failed++;
      }
      
      toolResults.summary.avgTokens += response.tokensUsed;
      toolResults.summary.avgCost += response.cost;
      toolResults.summary.avgLatency += latency;
      toolResults.summary.avgQuality += quality.overallScore;
      
    } catch (error) {
      console.log(`      ⚠️ ERROR: ${error.message}`);
      toolResults.testCases.push({
        name: testCase.name,
        error: error.message,
        passed: false,
      });
      toolResults.summary.failed++;
      results.summary.failed++;
    }
  }
  
  // Calculate averages
  const count = testCases.length || 1;
  toolResults.summary.avgTokens = Math.round(toolResults.summary.avgTokens / count);
  toolResults.summary.avgCost = toolResults.summary.avgCost / count;
  toolResults.summary.avgLatency = Math.round(toolResults.summary.avgLatency / count);
  toolResults.summary.avgQuality = toolResults.summary.avgQuality / count;
  
  // Compare to baseline
  toolResults.comparison = {
    tokensVsBaseline: ((toolResults.summary.avgTokens - baseline.avgTokens) / baseline.avgTokens * 100).toFixed(1) + '%',
    costVsBaseline: ((toolResults.summary.avgCost - baseline.avgCost) / baseline.avgCost * 100).toFixed(1) + '%',
    meetsQualityThreshold: toolResults.summary.avgQuality >= baseline.qualityThreshold,
  };
  
  results.tools[toolId] = toolResults;
  return toolResults;
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('FRITH AI - Phase 8 AI Regression Testing');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN (mock data)' : 'LIVE'}`);
  console.log('');
  
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // Determine which tools to test
  const toolsToTest = CONFIG.specificTool 
    ? [CONFIG.specificTool]
    : Object.keys(PHASE3_BASELINES);
  
  console.log(`Testing ${toolsToTest.length} tool(s): ${toolsToTest.join(', ')}`);
  
  // Run tests
  for (const toolId of toolsToTest) {
    if (!PHASE3_BASELINES[toolId]) {
      console.log(`\n⚠️ Unknown tool: ${toolId}`);
      results.summary.skipped++;
      continue;
    }
    await testTool(toolId);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(`Passed: ${results.summary.passed} ✅`);
  console.log(`Failed: ${results.summary.failed} ❌`);
  console.log(`Skipped: ${results.summary.skipped} ⚠️`);
  console.log(`Pass Rate: ${((results.summary.passed / results.summary.totalTests) * 100 || 0).toFixed(1)}%`);
  
  // Save results
  const outputFile = path.join(CONFIG.outputDir, `regression-${Date.now()}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Results saved to: ${outputFile}`);
  
  // Exit with appropriate code
  const success = results.summary.failed === 0;
  console.log(`\n${success ? '✅ All tests passed!' : '❌ Some tests failed.'}`);
  process.exit(success ? 0 : 1);
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
