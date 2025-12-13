import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: invoiceId } = await params
    const body = await request.json()
    const { organizationId } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: {
        client: true,
        matter: true,
        lineItems: {
          include: { timeEntry: true, expense: true },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // AI Review Analysis
    const suggestions: Array<{
      type: 'warning' | 'suggestion' | 'info'
      category: string
      message: string
      impact?: number
    }> = []

    // 1. Check for missing time entries (compare to calendar - simulated)
    const timeEntryLineItems = invoice.lineItems.filter(li => li.itemType === 'time_entry')
    if (timeEntryLineItems.length === 0 && invoice.billingType === 'hourly') {
      suggestions.push({
        type: 'warning',
        category: 'missing_entries',
        message: 'No time entries found on this hourly invoice. Consider reviewing unbilled time.',
      })
    }

    // 2. Check for rounding opportunities
    for (const li of invoice.lineItems) {
      if (li.itemType === 'time_entry') {
        const hours = Number(li.quantity)
        const fractionalPart = hours % 0.1
        if (fractionalPart > 0 && fractionalPart < 0.05) {
          const roundedHours = Math.floor(hours * 10) / 10
          const difference = (hours - roundedHours) * Number(li.rate)
          suggestions.push({
            type: 'suggestion',
            category: 'rounding',
            message: `Consider rounding ${hours.toFixed(2)} hours to ${roundedHours.toFixed(1)} hours for line item: "${li.description.substring(0, 50)}..."`,
            impact: -difference,
          })
        }
      }
    }

    // 3. Check for potentially write-off-able time (very short entries)
    for (const li of invoice.lineItems) {
      if (li.itemType === 'time_entry' && Number(li.quantity) <= 0.1) {
        suggestions.push({
          type: 'suggestion',
          category: 'write_off',
          message: `Very short time entry (${Number(li.quantity)} hours): "${li.description.substring(0, 50)}..." - consider writing off as courtesy.`,
          impact: -Number(li.amount),
        })
      }
    }

    // 4. Predict payment probability based on client history
    const clientPayments = await prisma.payment.findMany({
      where: {
        clientId: invoice.clientId,
        organizationId,
        status: 'completed',
      },
      include: { invoice: true },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    })

    let paymentProbability = 70 // Default
    if (clientPayments.length > 0) {
      const paidOnTime = clientPayments.filter(p => {
        if (!p.invoice) return true
        return p.paymentDate <= p.invoice.dueDate
      }).length
      paymentProbability = Math.round((paidOnTime / clientPayments.length) * 100)
    }

    // Adjust based on invoice amount
    const totalAmount = Number(invoice.totalAmount)
    if (totalAmount > 10000) {
      paymentProbability = Math.max(50, paymentProbability - 10)
    } else if (totalAmount < 1000) {
      paymentProbability = Math.min(95, paymentProbability + 10)
    }

    // 5. Check for duplicate descriptions
    const descriptions = invoice.lineItems.map(li => li.description.toLowerCase().trim())
    const duplicates = descriptions.filter((desc, idx) => descriptions.indexOf(desc) !== idx)
    if (duplicates.length > 0) {
      suggestions.push({
        type: 'warning',
        category: 'duplicates',
        message: `Found ${duplicates.length} potentially duplicate line item(s). Review for accuracy.`,
      })
    }

    // 6. Check for missing UTBMS codes (for LEDES invoices)
    if (invoice.ledesFormat) {
      const missingCodes = invoice.lineItems.filter(
        li => li.itemType === 'time_entry' && (!li.utbmsTaskCode || !li.utbmsActivityCode)
      )
      if (missingCodes.length > 0) {
        suggestions.push({
          type: 'warning',
          category: 'ledes_compliance',
          message: `${missingCodes.length} time entries missing UTBMS codes. Required for LEDES format.`,
        })
      }
    }

    // 7. Suggest optimal send time
    const dayOfWeek = new Date().getDay()
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      suggestions.push({
        type: 'info',
        category: 'timing',
        message: 'Consider sending this invoice on Monday for better visibility.',
      })
    }

    // Update invoice with AI predictions
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        aiPaymentProbability: paymentProbability,
        aiSuggestedWriteOff: suggestions
          .filter(s => s.category === 'write_off')
          .reduce((sum, s) => sum + Math.abs(s.impact || 0), 0),
      },
    })

    return NextResponse.json({
      invoiceId,
      paymentProbability,
      suggestionsCount: suggestions.length,
      suggestions,
      summary: {
        warnings: suggestions.filter(s => s.type === 'warning').length,
        suggestions: suggestions.filter(s => s.type === 'suggestion').length,
        info: suggestions.filter(s => s.type === 'info').length,
        potentialAdjustment: suggestions.reduce((sum, s) => sum + (s.impact || 0), 0),
      },
    })
  } catch (error) {
    console.error('Error running AI invoice review:', error)
    return NextResponse.json({ error: 'Failed to run AI review' }, { status: 500 })
  }
}
