/**
 * Standalone evaluation tester
 * Run with: npx tsx scripts/test-evaluation.ts
 */

import { OutputEvaluator } from '../lib/ai/evaluation/evaluator'
import {
  LEGAL_RESEARCH_BENCHMARKS,
  DOCUMENT_DRAFTING_BENCHMARKS,
  CLIENT_COMMUNICATION_BENCHMARKS,
  CONTRACT_REVIEW_BENCHMARKS,
} from '../lib/ai/evaluation/benchmarks'

function testBenchmark(benchmark: any, index: number) {
  console.log(`\n${index}. Testing: ${benchmark.toolName}`)
  console.log(`   Category: ${benchmark.category}`)
  console.log(`   Expected Score: >=${benchmark.expectedScore}`)

  const result = OutputEvaluator.evaluate(
    benchmark.expectedOutput,
    benchmark.input,
    benchmark.category,
    benchmark.toolId
  )

  const passed = result.score >= benchmark.expectedScore && result.passed
  const status = passed ? '✅ PASS' : '❌ FAIL'

  console.log(`   Actual Score: ${result.score}/100 ${status}`)
  console.log(`   Threshold: ${result.threshold}`)
  console.log(`   Passed QA: ${result.passed ? 'Yes' : 'No'}`)

  if (result.metrics.completeness !== undefined) {
    console.log(`   - Completeness: ${result.metrics.completeness}/100`)
  }
  if (result.metrics.clarity !== undefined) {
    console.log(`   - Clarity: ${result.metrics.clarity}/100`)
  }
  if (result.metrics.structure !== undefined) {
    console.log(`   - Structure: ${result.metrics.structure}/100`)
  }
  if (result.metrics.citations !== undefined) {
    console.log(`   - Citations: ${result.metrics.citations}/100`)
  }
  if (result.metrics.relevance !== undefined) {
    console.log(`   - Relevance: ${result.metrics.relevance}/100`)
  }
  if (result.metrics.accuracy !== undefined) {
    console.log(`   - Accuracy: ${result.metrics.accuracy}/100`)
  }
  if (result.metrics.legalSoundness !== undefined) {
    console.log(`   - Legal Soundness: ${result.metrics.legalSoundness}/100`)
  }
  if (result.metrics.tone !== undefined) {
    console.log(`   - Tone: ${result.metrics.tone}/100`)
  }

  if (!passed) {
    console.log(`   Feedback:`)
    result.feedback.forEach((f) => console.log(`   - ${f}`))
  }

  return passed
}

function testLowQualityDetection() {
  console.log(`\n\n=== Testing Low Quality Detection ===`)

  const tests = [
    {
      name: 'Empty output',
      output: '',
      input: 'Test question',
      category: 'Legal Research',
      expectLow: true,
    },
    {
      name: 'Very short output',
      output: 'Yes.',
      input: 'Complex legal question',
      category: 'Legal Research',
      expectLow: true,
    },
    {
      name: 'Output with placeholders',
      output: '[TODO] Add analysis here. XXX review this section.',
      input: 'Analyze this case',
      category: 'Legal Research',
      expectLow: true,
    },
    {
      name: 'Unprofessional tone',
      output: 'Hey, so yeah we looked at your stuff and its gonna need some work.',
      input: 'Draft professional email',
      category: 'Client Communication',
      expectLow: true,
    },
    {
      name: 'No citations in research output',
      output: 'The case was decided in favor of the plaintiff. This is important.',
      input: 'Summarize case law',
      category: 'Legal Research',
      expectLow: true,
    },
  ]

  let passed = 0
  let failed = 0

  tests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`)

    const result = OutputEvaluator.evaluate(
      test.output,
      test.input,
      test.category,
      'test-tool'
    )

    const isLowQuality = result.score < result.threshold || !result.passed
    const testPassed = isLowQuality === test.expectLow

    if (testPassed) {
      console.log(`   ✅ PASS - Correctly identified as low quality`)
      console.log(`   Score: ${result.score}/100 (threshold: ${result.threshold})`)
      passed++
    } else {
      console.log(`   ❌ FAIL - Should have been flagged as low quality`)
      console.log(`   Score: ${result.score}/100 (threshold: ${result.threshold})`)
      failed++
    }
  })

  console.log(`\n   Low Quality Detection: ${passed}/${tests.length} passed`)
  return failed === 0
}

async function main() {
  console.log('===========================================')
  console.log('   AI EVALUATION FRAMEWORK TEST SUITE')
  console.log('===========================================')

  let totalTests = 0
  let passedTests = 0

  // Test Legal Research benchmarks
  console.log('\n\n=== Legal Research Tools (Threshold: 85%) ===')
  LEGAL_RESEARCH_BENCHMARKS.forEach((benchmark, i) => {
    totalTests++
    if (testBenchmark(benchmark, i + 1)) passedTests++
  })

  // Test Document Drafting benchmarks
  console.log('\n\n=== Document Drafting Tools (Threshold: 80%) ===')
  DOCUMENT_DRAFTING_BENCHMARKS.forEach((benchmark, i) => {
    totalTests++
    if (testBenchmark(benchmark, i + 1)) passedTests++
  })

  // Test Client Communication benchmarks
  console.log('\n\n=== Client Communication Tools (Threshold: 75%) ===')
  CLIENT_COMMUNICATION_BENCHMARKS.forEach((benchmark, i) => {
    totalTests++
    if (testBenchmark(benchmark, i + 1)) passedTests++
  })

  // Test Contract Review benchmarks
  console.log('\n\n=== Contract Review Tools (Threshold: 90%) ===')
  CONTRACT_REVIEW_BENCHMARKS.forEach((benchmark, i) => {
    totalTests++
    if (testBenchmark(benchmark, i + 1)) passedTests++
  })

  // Test low quality detection
  const lowQualityPassed = testLowQualityDetection()

  // Summary
  console.log('\n\n===========================================')
  console.log('   TEST SUMMARY')
  console.log('===========================================')
  console.log(`   Benchmark Tests: ${passedTests}/${totalTests} passed`)
  console.log(`   Low Quality Detection: ${lowQualityPassed ? 'PASS' : 'FAIL'}`)
  console.log(`   Overall: ${passedTests === totalTests && lowQualityPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
  console.log('===========================================\n')

  if (passedTests === totalTests && lowQualityPassed) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Test execution failed:', error)
  process.exit(1)
})
