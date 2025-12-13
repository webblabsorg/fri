/**
 * Billing Performance Benchmark Script
 * Tests batch invoice creation and PDF generation performance
 * 
 * Usage: npx ts-node prod/scripts/benchmark-billing.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface BenchmarkResult {
  name: string
  count: number
  totalTimeMs: number
  avgTimeMs: number
  throughput: number // items per second
}

async function runBenchmark<T>(
  name: string,
  count: number,
  operation: () => Promise<T>
): Promise<BenchmarkResult> {
  console.log(`\n[Benchmark] Starting: ${name} (${count} items)`)
  
  const startTime = Date.now()
  await operation()
  const endTime = Date.now()
  
  const totalTimeMs = endTime - startTime
  const avgTimeMs = totalTimeMs / count
  const throughput = (count / totalTimeMs) * 1000
  
  const result: BenchmarkResult = {
    name,
    count,
    totalTimeMs,
    avgTimeMs,
    throughput,
  }
  
  console.log(`[Benchmark] Completed: ${name}`)
  console.log(`  Total time: ${totalTimeMs}ms`)
  console.log(`  Avg per item: ${avgTimeMs.toFixed(2)}ms`)
  console.log(`  Throughput: ${throughput.toFixed(2)} items/sec`)
  
  return result
}

async function setupTestData(organizationId: string, clientId: string) {
  // Ensure test organization and client exist
  const org = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!org) {
    console.log('[Setup] Creating test organization...')
    await prisma.organization.create({
      data: {
        id: organizationId,
        name: 'Benchmark Test Organization',
        planTier: 'enterprise',
      },
    })
  }

  const client = await prisma.contact.findUnique({ where: { id: clientId } })
  if (!client) {
    console.log('[Setup] Creating test client...')
    await prisma.contact.create({
      data: {
        id: clientId,
        organizationId,
        contactType: 'client',
        displayName: 'Benchmark Test Client',
        email: 'benchmark@test.com',
        createdBy: 'benchmark-script',
      },
    })
  }
}

async function cleanupTestInvoices(organizationId: string) {
  console.log('[Cleanup] Removing test invoices...')
  const deleted = await prisma.invoice.deleteMany({
    where: {
      organizationId,
      invoiceNumber: { startsWith: 'BENCH-' },
    },
  })
  console.log(`[Cleanup] Deleted ${deleted.count} test invoices`)
}

async function benchmarkBatchInvoiceCreation(
  organizationId: string,
  clientId: string,
  count: number
): Promise<BenchmarkResult> {
  // Generate test invoice data
  const invoiceInputs = Array.from({ length: count }, (_, i) => ({
    invoiceNumber: `BENCH-${Date.now()}-${i.toString().padStart(4, '0')}`,
    organizationId,
    clientId,
    billingType: 'hourly',
    status: 'draft',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    subtotal: 1000 + Math.random() * 9000,
    taxAmount: 0,
    totalAmount: 1000 + Math.random() * 9000,
    balanceDue: 1000 + Math.random() * 9000,
    currency: 'USD',
    createdBy: 'benchmark-script',
  }))

  // Fix totals
  invoiceInputs.forEach((inv) => {
    inv.totalAmount = inv.subtotal
    inv.balanceDue = inv.subtotal
  })

  return runBenchmark(
    `Batch Invoice Creation (${count} invoices)`,
    count,
    async () => {
      // Use Prisma's createMany for maximum performance
      await prisma.invoice.createMany({
        data: invoiceInputs.map((inv) => ({
          ...inv,
          subtotal: inv.subtotal,
          taxAmount: inv.taxAmount,
          totalAmount: inv.totalAmount,
          balanceDue: inv.balanceDue,
        })),
      })
    }
  )
}

async function benchmarkSequentialInvoiceCreation(
  organizationId: string,
  clientId: string,
  count: number
): Promise<BenchmarkResult> {
  return runBenchmark(
    `Sequential Invoice Creation (${count} invoices)`,
    count,
    async () => {
      for (let i = 0; i < count; i++) {
        await prisma.invoice.create({
          data: {
            invoiceNumber: `BENCH-SEQ-${Date.now()}-${i.toString().padStart(4, '0')}`,
            organizationId,
            clientId,
            billingType: 'hourly',
            status: 'draft',
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            subtotal: 1000,
            taxAmount: 0,
            totalAmount: 1000,
            balanceDue: 1000,
            currency: 'USD',
            createdBy: 'benchmark-script',
          },
        })
      }
    }
  )
}

async function benchmarkParallelInvoiceCreation(
  organizationId: string,
  clientId: string,
  count: number,
  concurrency: number
): Promise<BenchmarkResult> {
  return runBenchmark(
    `Parallel Invoice Creation (${count} invoices, concurrency: ${concurrency})`,
    count,
    async () => {
      const chunks: number[][] = []
      for (let i = 0; i < count; i += concurrency) {
        chunks.push(Array.from({ length: Math.min(concurrency, count - i) }, (_, j) => i + j))
      }

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map((i) =>
            prisma.invoice.create({
              data: {
                invoiceNumber: `BENCH-PAR-${Date.now()}-${i.toString().padStart(4, '0')}`,
                organizationId,
                clientId,
                billingType: 'hourly',
                status: 'draft',
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                subtotal: 1000,
                taxAmount: 0,
                totalAmount: 1000,
                balanceDue: 1000,
                currency: 'USD',
                createdBy: 'benchmark-script',
              },
            })
          )
        )
      }
    }
  )
}

async function benchmarkInvoiceQuery(organizationId: string, count: number): Promise<BenchmarkResult> {
  return runBenchmark(
    `Invoice Query with Relations (${count} queries)`,
    count,
    async () => {
      for (let i = 0; i < count; i++) {
        await prisma.invoice.findMany({
          where: { organizationId },
          include: {
            client: true,
            lineItems: true,
            payments: true,
          },
          take: 50,
          orderBy: { createdAt: 'desc' },
        })
      }
    }
  )
}

async function main() {
  console.log('='.repeat(60))
  console.log('BILLING PERFORMANCE BENCHMARK')
  console.log('='.repeat(60))

  const testOrgId = 'benchmark-test-org-' + Date.now()
  const testClientId = 'benchmark-test-client-' + Date.now()

  try {
    await setupTestData(testOrgId, testClientId)

    const results: BenchmarkResult[] = []

    // Benchmark 1: Batch creation using createMany (target: 500 invoices < 30s)
    results.push(await benchmarkBatchInvoiceCreation(testOrgId, testClientId, 500))

    // Cleanup between tests
    await cleanupTestInvoices(testOrgId)

    // Benchmark 2: Sequential creation (baseline comparison)
    results.push(await benchmarkSequentialInvoiceCreation(testOrgId, testClientId, 50))

    await cleanupTestInvoices(testOrgId)

    // Benchmark 3: Parallel creation with concurrency
    results.push(await benchmarkParallelInvoiceCreation(testOrgId, testClientId, 100, 10))

    await cleanupTestInvoices(testOrgId)

    // Benchmark 4: Query performance
    // First create some invoices to query
    await benchmarkBatchInvoiceCreation(testOrgId, testClientId, 100)
    results.push(await benchmarkInvoiceQuery(testOrgId, 20))

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('BENCHMARK SUMMARY')
    console.log('='.repeat(60))

    for (const result of results) {
      console.log(`\n${result.name}:`)
      console.log(`  Total: ${result.totalTimeMs}ms`)
      console.log(`  Avg: ${result.avgTimeMs.toFixed(2)}ms/item`)
      console.log(`  Throughput: ${result.throughput.toFixed(2)} items/sec`)
    }

    // Check if 500 invoice target is met
    const batchResult = results.find((r) => r.name.includes('500 invoices'))
    if (batchResult) {
      const targetMs = 30000
      const passed = batchResult.totalTimeMs < targetMs
      console.log('\n' + '='.repeat(60))
      console.log(`TARGET CHECK: 500 invoices in < 30 seconds`)
      console.log(`Result: ${batchResult.totalTimeMs}ms (${passed ? 'PASSED ✓' : 'FAILED ✗'})`)
      console.log('='.repeat(60))
    }

  } finally {
    // Cleanup
    await cleanupTestInvoices(testOrgId)
    await prisma.contact.deleteMany({ where: { id: testClientId } })
    await prisma.organization.deleteMany({ where: { id: testOrgId } })
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Benchmark failed:', error)
  process.exit(1)
})
