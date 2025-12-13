import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get trust balance (sum of all client trust ledger balances)
    const trustBalanceResult = await prisma.clientTrustLedger.aggregate({
      where: { trustAccount: { organizationId } },
      _sum: { balance: true },
    })
    const trustBalance = Number(trustBalanceResult._sum?.balance || 0)

    // Get outstanding AR (sum of balance due for sent/viewed/overdue invoices)
    const outstandingARResult = await prisma.invoice.aggregate({
      where: {
        organizationId,
        status: { in: ['sent', 'viewed', 'overdue'] },
      },
      _sum: { balanceDue: true },
    })
    const outstandingAR = Number(outstandingARResult._sum?.balanceDue || 0)

    // Get unbilled WIP (sum of time entries not yet invoiced)
    const unbilledWIPResult = await prisma.timeEntry.aggregate({
      where: {
        organizationId,
        isBilled: false,
        isBillable: true,
      },
      _sum: { amount: true },
    })
    const unbilledWIP = Number(unbilledWIPResult._sum?.amount || 0)

    // Get monthly revenue (sum of payments for current month)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const monthlyRevenueResult = await prisma.payment.aggregate({
      where: {
        organizationId,
        status: 'completed',
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    })
    const monthlyRevenue = Number(monthlyRevenueResult._sum?.amount || 0)

    // Get compliance alerts (trust accounts needing reconciliation)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const complianceAlerts = await prisma.trustAccount.count({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { lastReconciledDate: null },
          { lastReconciledDate: { lt: thirtyDaysAgo } },
        ],
      },
    })

    // Get recent activity
    const recentPayments = await prisma.payment.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        invoice: { select: { invoiceNumber: true } },
        client: { select: { displayName: true } },
      },
    })

    const recentInvoices = await prisma.invoice.findMany({
      where: { organizationId, status: { in: ['sent', 'viewed'] } },
      orderBy: { sentAt: 'desc' },
      take: 5,
      include: { client: { select: { displayName: true } } },
    })

    const recentActivity = [
      ...recentPayments.map((p) => ({
        id: p.id,
        type: 'payment' as const,
        description: `Payment received${p.invoice ? ` - ${p.invoice.invoiceNumber}` : ''} (${p.client.displayName})`,
        amount: Number(p.amount),
        date: p.paymentDate.toISOString().split('T')[0],
      })),
      ...recentInvoices.map((i) => ({
        id: i.id,
        type: 'invoice' as const,
        description: `Invoice sent - ${i.invoiceNumber} (${i.client.displayName})`,
        amount: Number(i.totalAmount),
        date: (i.sentAt || i.createdAt).toISOString().split('T')[0],
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    return NextResponse.json({
      stats: {
        trustBalance,
        outstandingAR,
        unbilledWIP,
        monthlyRevenue,
        complianceAlerts,
      },
      recentActivity,
    })
  } catch (error) {
    console.error('Error fetching finance dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
