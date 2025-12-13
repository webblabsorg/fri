import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    const accessToken = await prisma.invoiceAccessToken.findUnique({
      where: { token },
      include: {
        invoice: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
            client: {
              select: {
                displayName: true,
                email: true,
              },
            },
            lineItems: {
              orderBy: { lineNumber: 'asc' },
              select: {
                description: true,
                quantity: true,
                rate: true,
                amount: true,
              },
            },
          },
        },
      },
    })

    if (!accessToken) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
    }

    if (accessToken.expiresAt && new Date() > accessToken.expiresAt) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
    }

    const invoice = accessToken.invoice

    if (!['sent', 'viewed', 'overdue', 'paid', 'partially_paid'].includes(invoice.status)) {
      return NextResponse.json({ error: 'Invoice is not available' }, { status: 404 })
    }

    if (!accessToken.usedAt) {
      await prisma.$transaction([
        prisma.invoiceAccessToken.update({
          where: { id: accessToken.id },
          data: { usedAt: new Date() },
        }),
        prisma.invoice.update({
          where: { id: invoice.id },
          data: { viewedAt: invoice.viewedAt || new Date(), status: invoice.status === 'sent' ? 'viewed' : invoice.status },
        }),
      ])
    }

    const orgSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            `org:${invoice.organizationId}:stripe:enabled`,
            `org:${invoice.organizationId}:lawpay:enabled`,
            `org:${invoice.organizationId}:paypal:enabled`,
          ],
        },
      },
    })

    const paymentMethods = {
      stripe: orgSettings.some((s) => s.key.includes('stripe') && s.value === 'true'),
      lawpay: orgSettings.some((s) => s.key.includes('lawpay') && s.value === 'true'),
      paypal: orgSettings.some((s) => s.key.includes('paypal') && s.value === 'true'),
    }

    if (!paymentMethods.stripe && !paymentMethods.lawpay && !paymentMethods.paypal) {
      paymentMethods.stripe = !!process.env.STRIPE_SECRET_KEY
      paymentMethods.lawpay = !!process.env.LAWPAY_API_KEY
      paymentMethods.paypal = !!process.env.PAYPAL_CLIENT_ID
    }

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate.toISOString(),
        subtotal: Number(invoice.subtotal),
        taxAmount: Number(invoice.taxAmount),
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        balanceDue: Number(invoice.balanceDue),
        currency: invoice.currency,
        notes: invoice.notes,
        termsAndConditions: invoice.termsAndConditions,
        organization: {
          name: invoice.organization.name,
          logoUrl: null,
        },
        client: {
          displayName: invoice.client.displayName,
          email: invoice.client.email,
        },
        lineItems: invoice.lineItems.map((li) => ({
          description: li.description,
          quantity: Number(li.quantity),
          rate: Number(li.rate),
          amount: Number(li.amount),
        })),
        paymentMethods,
      },
    })
  } catch (error) {
    console.error('Error fetching public invoice:', error)
    return NextResponse.json({ error: 'Failed to load invoice' }, { status: 500 })
  }
}
