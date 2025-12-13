import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getInvoicePdfData } from '@/lib/finance/billing-service'
import { getOrganizationBranding } from '@/lib/branding'
import PDFDocument from 'pdfkit'

interface InvoiceTemplate {
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  fontFamily: string
  headerHtml: string | null
  footerHtml: string | null
  termsTemplate: string | null
  showLogo: boolean
  showPaymentInfo: boolean
  showUtbmsCodes: boolean
  paperSize: string
  dateFormat: string
  currencyFormat: string
  language: string
}

const DEFAULT_TEMPLATE: InvoiceTemplate = {
  logoUrl: null,
  primaryColor: '#000000',
  accentColor: '#3B82F6',
  fontFamily: 'Helvetica',
  headerHtml: null,
  footerHtml: null,
  termsTemplate: null,
  showLogo: true,
  showPaymentInfo: true,
  showUtbmsCodes: false,
  paperSize: 'LETTER',
  dateFormat: 'MM/DD/YYYY',
  currencyFormat: 'symbol',
  language: 'en',
}

function formatDate(date: Date, format: string): string {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`
    default: // MM/DD/YYYY
      return `${month}/${day}/${year}`
  }
}

function formatCurrency(amount: number, currency: string, format: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', CHF: 'CHF',
  }
  const symbol = symbols[currency] || currency
  const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  
  switch (format) {
    case 'code':
      return `${formatted} ${currency}`
    case 'both':
      return `${symbol}${formatted} ${currency}`
    default: // symbol
      return `${symbol}${formatted}`
  }
}

export const runtime = 'nodejs'

async function renderInvoicePdf(
  data: Awaited<ReturnType<typeof getInvoicePdfData>>,
  template: InvoiceTemplate,
  branding: { logoUrl: string | null; companyName: string } | null
) {
  if (!data) {
    throw new Error('Missing invoice PDF data')
  }

  const paperSizes: Record<string, [number, number]> = {
    LETTER: [612, 792],
    A4: [595.28, 841.89],
    LEGAL: [612, 1008],
  }
  const [width, height] = paperSizes[template.paperSize] || paperSizes.LETTER

  const doc = new PDFDocument({
    size: [width, height],
    margin: 50,
    info: {
      Title: `Invoice ${data.invoice.invoiceNumber}`,
      Author: data.organization.name,
    },
  })

  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk as Buffer))

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', (err) => reject(err))
  })

  const fontBold = `${template.fontFamily}-Bold`
  const fontRegular = template.fontFamily
  const currency = data.invoice.currency || 'USD'
  const money = (n: number) => formatCurrency(n, currency, template.currencyFormat)
  const fmtDate = (d: Date) => formatDate(d, template.dateFormat)

  // Header with branding
  const logoUrl = template.logoUrl || branding?.logoUrl
  if (template.showLogo && logoUrl) {
    // Note: In production, fetch and embed the logo image
    // For now, we'll just show the company name prominently
  }

  doc.font(fontBold).fontSize(18).text(branding?.companyName || data.organization.name, { align: 'left' })
  doc.moveDown(0.25)
  doc.font(fontRegular).fontSize(12).text(`Invoice: ${data.invoice.invoiceNumber}`)
  doc.text(`Issue Date: ${fmtDate(data.invoice.issueDate)}`)
  doc.text(`Due Date: ${fmtDate(data.invoice.dueDate)}`)
  doc.text(`Status: ${data.invoice.status.replace(/_/g, ' ').toUpperCase()}`)
  if (data.invoice.currency !== 'USD') {
    doc.text(`Currency: ${data.invoice.currency}`)
  }

  doc.moveDown(1)
  doc.font(fontBold).fontSize(12).text('Bill To:')
  doc.font(fontRegular).text(data.client.displayName)
  if (data.client.email) {
    doc.text(data.client.email)
  }

  doc.moveDown(1)
  doc.font(fontBold).fontSize(12).text('Line Items', { underline: true })
  doc.moveDown(0.5)

  // Table layout
  const startX = doc.x
  let y = doc.y
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  
  const showUtbms = template.showUtbmsCodes
  const colDesc = Math.floor(pageWidth * (showUtbms ? 0.40 : 0.55))
  const colUtbms = showUtbms ? Math.floor(pageWidth * 0.15) : 0
  const colQty = Math.floor(pageWidth * 0.10)
  const colRate = Math.floor(pageWidth * 0.15)
  const colAmt = Math.floor(pageWidth * 0.20)

  const drawRow = (desc: string, utbms: string, qty: string, rate: string, amt: string, bold?: boolean) => {
    if (y > doc.page.height - doc.page.margins.bottom - 60) {
      doc.addPage()
      y = doc.page.margins.top
    }

    doc.font(bold ? fontBold : fontRegular).fontSize(10)
    doc.text(desc, startX, y, { width: colDesc })
    if (showUtbms) {
      doc.text(utbms, startX + colDesc, y, { width: colUtbms })
    }
    const offset = showUtbms ? colDesc + colUtbms : colDesc
    doc.text(qty, startX + offset, y, { width: colQty, align: 'right' })
    doc.text(rate, startX + offset + colQty, y, { width: colRate, align: 'right' })
    doc.text(amt, startX + offset + colQty + colRate, y, { width: colAmt, align: 'right' })
    y += 16
  }

  drawRow('Description', showUtbms ? 'UTBMS' : '', 'Qty', 'Rate', 'Amount', true)
  doc.moveTo(startX, y).lineTo(startX + pageWidth, y).stroke()
  y += 8

  for (const li of data.lineItems) {
    const utbmsCode = [li.utbmsTaskCode, li.utbmsActivityCode, li.utbmsExpenseCode].filter(Boolean).join('/')
    drawRow(
      li.description,
      utbmsCode,
      String(li.quantity),
      money(li.rate),
      money(li.amount)
    )
  }

  y += 10
  doc.moveTo(startX, y).lineTo(startX + pageWidth, y).stroke()
  y += 10

  drawRow('', '', '', 'Subtotal', money(data.invoice.subtotal), true)
  if (data.invoice.taxAmount > 0) {
    drawRow('', '', '', 'Tax', money(data.invoice.taxAmount), true)
  }
  drawRow('', '', '', 'Total', money(data.invoice.totalAmount), true)
  drawRow('', '', '', 'Balance Due', money(data.invoice.balanceDue), true)

  // Payment info
  if (template.showPaymentInfo) {
    y += 20
    doc.font(fontBold).fontSize(11).text('Payment Information', startX, y)
    y += 14
    doc.font(fontRegular).fontSize(10)
    doc.text(`Payment Terms: ${data.invoice.paymentTerms || 'Due on Receipt'}`, startX, y)
  }

  // Notes
  const notes = data.invoice.notes || template.termsTemplate
  if (notes) {
    y = doc.y + 20
    doc.font(fontBold).fontSize(11).text('Notes', startX, y)
    y += 14
    doc.font(fontRegular).fontSize(10).text(notes, startX, y, { width: pageWidth })
  }

  // Terms & Conditions
  const terms = data.invoice.termsAndConditions || template.termsTemplate
  if (terms) {
    doc.addPage()
    doc.font(fontBold).fontSize(12).text('Terms & Conditions')
    doc.moveDown(0.5)
    doc.font(fontRegular).fontSize(10).text(terms)
  }

  // Footer
  if (template.footerHtml) {
    // In production, render HTML footer
    // For now, add simple text footer on last page
    const footerY = doc.page.height - doc.page.margins.bottom - 30
    doc.font(fontRegular).fontSize(8).text(
      template.footerHtml.replace(/<[^>]*>/g, ''),
      doc.page.margins.left,
      footerY,
      { width: pageWidth, align: 'center' }
    )
  }

  doc.end()
  return done
}

export async function GET(
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

    const pdfData = await getInvoicePdfData(invoiceId, organizationId)

    if (!pdfData) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Get template (use default or specified)
    const templateId = searchParams.get('templateId')
    let template: InvoiceTemplate = DEFAULT_TEMPLATE

    if (templateId) {
      const dbTemplate = await prisma.invoiceTemplate.findFirst({
        where: { id: templateId, organizationId },
      })
      if (dbTemplate) {
        template = {
          logoUrl: dbTemplate.logoUrl,
          primaryColor: dbTemplate.primaryColor,
          accentColor: dbTemplate.accentColor,
          fontFamily: dbTemplate.fontFamily,
          headerHtml: dbTemplate.headerHtml,
          footerHtml: dbTemplate.footerHtml,
          termsTemplate: dbTemplate.termsTemplate,
          showLogo: dbTemplate.showLogo,
          showPaymentInfo: dbTemplate.showPaymentInfo,
          showUtbmsCodes: dbTemplate.showUtbmsCodes,
          paperSize: dbTemplate.paperSize,
          dateFormat: dbTemplate.dateFormat,
          currencyFormat: dbTemplate.currencyFormat,
          language: dbTemplate.language,
        }
      }
    } else {
      // Try to get default template
      const defaultTemplate = await prisma.invoiceTemplate.findFirst({
        where: { organizationId, isDefault: true },
      })
      if (defaultTemplate) {
        template = {
          logoUrl: defaultTemplate.logoUrl,
          primaryColor: defaultTemplate.primaryColor,
          accentColor: defaultTemplate.accentColor,
          fontFamily: defaultTemplate.fontFamily,
          headerHtml: defaultTemplate.headerHtml,
          footerHtml: defaultTemplate.footerHtml,
          termsTemplate: defaultTemplate.termsTemplate,
          showLogo: defaultTemplate.showLogo,
          showPaymentInfo: defaultTemplate.showPaymentInfo,
          showUtbmsCodes: defaultTemplate.showUtbmsCodes,
          paperSize: defaultTemplate.paperSize,
          dateFormat: defaultTemplate.dateFormat,
          currencyFormat: defaultTemplate.currencyFormat,
          language: defaultTemplate.language,
        }
      }
    }

    // Get organization branding
    const branding = await getOrganizationBranding(organizationId)

    const pdfBuffer = await renderInvoicePdf(pdfData, template, {
      logoUrl: branding.logoUrl,
      companyName: branding.companyName,
    })
    const pdfArrayBuffer = new ArrayBuffer(pdfBuffer.byteLength)
    new Uint8Array(pdfArrayBuffer).set(pdfBuffer)
    const filename = `${pdfData.invoice.invoiceNumber}.pdf`

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
