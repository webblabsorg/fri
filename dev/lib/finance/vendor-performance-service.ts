import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// VENDOR PERFORMANCE SERVICE
// AI-powered vendor performance tracking and predictive vendor selection
// ============================================================================

export interface VendorPerformanceMetrics {
  vendorId: string
  vendorName: string
  vendorType: string
  
  // Payment metrics
  totalInvoices: number
  totalPaid: number
  avgPaymentDays: number | null
  onTimePaymentRate: number // 0-100%
  
  // Quality metrics
  rating: number | null // 0-5
  disputeCount: number
  disputeRate: number // 0-100%
  
  // Cost metrics
  avgInvoiceAmount: number
  totalSpend: number
  
  // Calculated performance score (0-100)
  performanceScore: number
  
  // Flags
  isPreferred: boolean
  isActive: boolean
}

export interface VendorRecommendation {
  vendorId: string
  vendorName: string
  vendorType: string
  performanceScore: number
  avgCost: number
  reasoning: string[]
  confidence: number
}

/**
 * Calculate vendor performance metrics
 */
export async function calculateVendorPerformance(
  organizationId: string,
  vendorId: string
): Promise<VendorPerformanceMetrics> {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, organizationId },
  })

  if (!vendor) {
    throw new Error('Vendor not found')
  }

  // Get payment history
  const payments = await prisma.vendorPayment.findMany({
    where: {
      organizationId,
      vendorId,
      status: 'completed',
    },
    include: {
      bill: true,
    },
  })

  // Calculate on-time payment rate
  let onTimeCount = 0
  let lateCount = 0

  for (const payment of payments) {
    if (payment.bill) {
      const dueDate = new Date(payment.bill.dueDate)
      const paymentDate = new Date(payment.paymentDate)
      if (paymentDate <= dueDate) {
        onTimeCount++
      } else {
        lateCount++
      }
    }
  }

  const totalPayments = onTimeCount + lateCount
  const onTimePaymentRate = totalPayments > 0 ? (onTimeCount / totalPayments) * 100 : 100

  // Get bills for cost analysis
  const bills = await prisma.vendorBill.findMany({
    where: {
      organizationId,
      vendorId,
    },
  })

  const totalSpend = bills.reduce((sum, b) => sum + Number(b.totalAmount), 0)
  const avgInvoiceAmount = bills.length > 0 ? totalSpend / bills.length : 0

  // Count disputes (bills with issues - simplified: cancelled or with notes containing 'dispute')
  const disputeCount = bills.filter(
    (b) => b.status === 'cancelled' || (b.notes && b.notes.toLowerCase().includes('dispute'))
  ).length
  const disputeRate = bills.length > 0 ? (disputeCount / bills.length) * 100 : 0

  // Calculate performance score (0-100)
  let performanceScore = 50 // Base score

  // Rating contribution (up to 25 points)
  if (vendor.rating) {
    performanceScore += (Number(vendor.rating) / 5) * 25
  }

  // On-time payment rate contribution (up to 20 points)
  performanceScore += (onTimePaymentRate / 100) * 20

  // Low dispute rate contribution (up to 15 points)
  performanceScore += ((100 - disputeRate) / 100) * 15

  // Volume/relationship contribution (up to 10 points)
  const volumeScore = Math.min(10, (vendor.totalInvoices / 50) * 10)
  performanceScore += volumeScore

  // Preferred vendor bonus (5 points)
  if (vendor.isPreferred) {
    performanceScore += 5
  }

  // Cap at 100
  performanceScore = Math.min(100, Math.round(performanceScore))

  return {
    vendorId: vendor.id,
    vendorName: vendor.name,
    vendorType: vendor.vendorType,
    totalInvoices: vendor.totalInvoices,
    totalPaid: Number(vendor.totalPaid),
    avgPaymentDays: vendor.avgPaymentDays,
    onTimePaymentRate: Math.round(onTimePaymentRate),
    rating: vendor.rating ? Number(vendor.rating) : null,
    disputeCount,
    disputeRate: Math.round(disputeRate),
    avgInvoiceAmount: Math.round(avgInvoiceAmount * 100) / 100,
    totalSpend: Math.round(totalSpend * 100) / 100,
    performanceScore,
    isPreferred: vendor.isPreferred,
    isActive: vendor.isActive,
  }
}

/**
 * Update vendor rating based on performance
 */
export async function updateVendorRating(
  organizationId: string,
  vendorId: string
): Promise<number> {
  const metrics = await calculateVendorPerformance(organizationId, vendorId)

  // Convert performance score to 5-star rating
  const newRating = (metrics.performanceScore / 100) * 5
  const roundedRating = Math.round(newRating * 10) / 10 // Round to 1 decimal

  await prisma.vendor.update({
    where: { id: vendorId },
    data: { rating: new Decimal(roundedRating) },
  })

  return roundedRating
}

/**
 * Get recommended vendors for a specific type/category
 */
export async function getRecommendedVendors(
  organizationId: string,
  options: {
    vendorType?: string
    category?: string
    maxResults?: number
    minPerformanceScore?: number
  } = {}
): Promise<VendorRecommendation[]> {
  const { vendorType, maxResults = 5, minPerformanceScore = 50 } = options

  // Get active vendors
  const where: Record<string, unknown> = {
    organizationId,
    isActive: true,
  }

  if (vendorType) {
    where.vendorType = vendorType
  }

  const vendors = await prisma.vendor.findMany({
    where,
    orderBy: [
      { isPreferred: 'desc' },
      { rating: 'desc' },
      { totalInvoices: 'desc' },
    ],
    take: maxResults * 2, // Fetch more to filter
  })

  const recommendations: VendorRecommendation[] = []

  for (const vendor of vendors) {
    try {
      const metrics = await calculateVendorPerformance(organizationId, vendor.id)

      if (metrics.performanceScore < minPerformanceScore) {
        continue
      }

      const reasoning: string[] = []

      if (vendor.isPreferred) {
        reasoning.push('Preferred vendor')
      }

      if (metrics.rating && metrics.rating >= 4) {
        reasoning.push(`High rating: ${metrics.rating.toFixed(1)}/5`)
      }

      if (metrics.onTimePaymentRate >= 90) {
        reasoning.push(`${metrics.onTimePaymentRate}% on-time payment history`)
      }

      if (metrics.disputeRate === 0 && metrics.totalInvoices >= 5) {
        reasoning.push('No disputes on record')
      }

      if (metrics.totalInvoices >= 10) {
        reasoning.push(`Established relationship (${metrics.totalInvoices} invoices)`)
      }

      // Calculate confidence based on data availability
      let confidence = 50
      if (metrics.totalInvoices >= 5) confidence += 20
      if (metrics.totalInvoices >= 10) confidence += 10
      if (metrics.rating) confidence += 10
      if (vendor.isPreferred) confidence += 10
      confidence = Math.min(100, confidence)

      recommendations.push({
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorType: vendor.vendorType,
        performanceScore: metrics.performanceScore,
        avgCost: metrics.avgInvoiceAmount,
        reasoning,
        confidence,
      })

      if (recommendations.length >= maxResults) {
        break
      }
    } catch (err) {
      console.warn(`Failed to calculate metrics for vendor ${vendor.id}:`, err)
    }
  }

  // Sort by performance score
  return recommendations.sort((a, b) => b.performanceScore - a.performanceScore)
}

/**
 * Get all vendors with performance metrics
 */
export async function getVendorPerformanceReport(
  organizationId: string,
  options: {
    vendorType?: string
    minInvoices?: number
    sortBy?: 'performanceScore' | 'totalSpend' | 'rating'
    sortOrder?: 'asc' | 'desc'
  } = {}
): Promise<VendorPerformanceMetrics[]> {
  const { vendorType, minInvoices = 0, sortBy = 'performanceScore', sortOrder = 'desc' } = options

  const where: Record<string, unknown> = {
    organizationId,
    isActive: true,
    totalInvoices: { gte: minInvoices },
  }

  if (vendorType) {
    where.vendorType = vendorType
  }

  const vendors = await prisma.vendor.findMany({
    where,
  })

  const metrics: VendorPerformanceMetrics[] = []

  for (const vendor of vendors) {
    try {
      const vendorMetrics = await calculateVendorPerformance(organizationId, vendor.id)
      metrics.push(vendorMetrics)
    } catch (err) {
      console.warn(`Failed to calculate metrics for vendor ${vendor.id}:`, err)
    }
  }

  // Sort results
  metrics.sort((a, b) => {
    let aVal: number, bVal: number

    switch (sortBy) {
      case 'totalSpend':
        aVal = a.totalSpend
        bVal = b.totalSpend
        break
      case 'rating':
        aVal = a.rating || 0
        bVal = b.rating || 0
        break
      default:
        aVal = a.performanceScore
        bVal = b.performanceScore
    }

    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal
  })

  return metrics
}

/**
 * Batch update all vendor ratings
 */
export async function batchUpdateVendorRatings(organizationId: string): Promise<{
  updated: number
  failed: number
}> {
  const vendors = await prisma.vendor.findMany({
    where: {
      organizationId,
      isActive: true,
      totalInvoices: { gte: 1 },
    },
  })

  let updated = 0
  let failed = 0

  for (const vendor of vendors) {
    try {
      await updateVendorRating(organizationId, vendor.id)
      updated++
    } catch (err) {
      console.warn(`Failed to update rating for vendor ${vendor.id}:`, err)
      failed++
    }
  }

  return { updated, failed }
}
