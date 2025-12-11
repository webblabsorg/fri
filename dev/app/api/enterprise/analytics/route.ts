import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const reportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  reportType: z.enum(['usage', 'billing', 'compliance', 'custom']),
  config: z.record(z.any()),
  schedule: z.string().optional(),
  recipients: z.array(z.string().email()).optional(),
  format: z.enum(['pdf', 'csv', 'xlsx']).optional(),
})

// GET - Get analytics data or reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const type = searchParams.get('type') // usage, reports, exports

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Check user has access
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: (session.user as any).id,
      },
    })

    if (!membership && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (type === 'usage') {
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      const where: any = { organizationId }
      if (startDate) where.date = { gte: new Date(startDate) }
      if (endDate) where.date = { ...where.date, lte: new Date(endDate) }

      const analytics = await prisma.usageAnalytics.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 90, // Last 90 days max
      })

      // Calculate summary
      const summary = analytics.reduce(
        (acc, day) => ({
          totalToolRuns: acc.totalToolRuns + day.toolRuns,
          totalTokens: acc.totalTokens + day.tokensUsed,
          totalCost: acc.totalCost + day.aiCost,
          avgErrorRate: acc.avgErrorRate + (day.errorRate || 0),
        }),
        { totalToolRuns: 0, totalTokens: 0, totalCost: 0, avgErrorRate: 0 }
      )

      if (analytics.length > 0) {
        summary.avgErrorRate /= analytics.length
      }

      return NextResponse.json({ analytics, summary })
    }

    if (type === 'reports') {
      const reports = await prisma.customReport.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ reports })
    }

    if (type === 'exports') {
      const exports = await prisma.reportExport.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return NextResponse.json({ exports })
    }

    // Return dashboard summary
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [usageLast30, recentReports, recentExports] = await Promise.all([
      prisma.usageAnalytics.findMany({
        where: {
          organizationId,
          date: { gte: thirtyDaysAgo },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.customReport.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.reportExport.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    return NextResponse.json({
      usage: usageLast30,
      reports: recentReports,
      exports: recentExports,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// POST - Create custom report or request export
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, action, ...data } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Check user has admin access
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: (session.user as any).id,
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!membership && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (action === 'create_report') {
      const validated = reportSchema.parse(data)

      const report = await prisma.customReport.create({
        data: {
          organizationId,
          ...validated,
          createdById: (session.user as any).id,
        },
      })

      return NextResponse.json({ success: true, report })
    }

    if (action === 'request_export') {
      const { exportType, format, filters } = data

      const exportRecord = await prisma.reportExport.create({
        data: {
          organizationId,
          exportType,
          format: format || 'csv',
          filters,
          requestedById: (session.user as any).id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      })

      // In production, this would trigger a background job to generate the export
      // For now, we'll simulate immediate completion
      await prisma.reportExport.update({
        where: { id: exportRecord.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          fileUrl: `/api/enterprise/analytics/download?id=${exportRecord.id}`,
          rowCount: 100, // Simulated
        },
      })

      // Log audit event
      await prisma.enhancedAuditLog.create({
        data: {
          organizationId,
          userId: (session.user as any).id,
          eventType: 'data_export',
          eventCategory: 'data',
          resourceType: 'export',
          resourceId: exportRecord.id,
          action: 'export',
          details: { exportType, format },
        },
      })

      return NextResponse.json({
        success: true,
        export: exportRecord,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating report/export:', error)
    return NextResponse.json(
      { error: 'Failed to create report/export' },
      { status: 500 }
    )
  }
}

// DELETE - Delete custom report
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const organizationId = searchParams.get('organizationId')

    if (!id || !organizationId) {
      return NextResponse.json({ error: 'ID and Organization ID required' }, { status: 400 })
    }

    await prisma.customReport.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}
