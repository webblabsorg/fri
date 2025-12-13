import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getInvoicePdfData } from '@/lib/finance/billing-service'
import PDFDocument from 'pdfkit'

export const runtime = 'nodejs'

async function renderInvoicePdf(data: Awaited<ReturnType<typeof getInvoicePdfData>>) {
  if (!data) {
    throw new Error('Missing invoice PDF data')
  }

  const doc = new PDFDocument({
    size: 'LETTER',
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

  // Header
  doc.fontSize(18).text(data.organization.name, { align: 'left' })
  doc.moveDown(0.25)
  doc.fontSize(12).text(`Invoice: ${data.invoice.invoiceNumber}`)
  doc.text(`Issue Date: ${new Date(data.invoice.issueDate).toLocaleDateString()}`)
  doc.text(`Due Date: ${new Date(data.invoice.dueDate).toLocaleDateString()}`)
  doc.text(`Status: ${data.invoice.status}`)

  doc.moveDown(1)
  doc.fontSize(12).text(`Bill To: ${data.client.displayName}`)
  if (data.client.email) {
    doc.text(`Email: ${data.client.email}`)
  }

  doc.moveDown(1)
  doc.fontSize(12).text('Line Items', { underline: true })
  doc.moveDown(0.5)

  // Simple table layout
  const startX = doc.x
  let y = doc.y
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const colDesc = Math.floor(pageWidth * 0.55)
  const colQty = Math.floor(pageWidth * 0.10)
  const colRate = Math.floor(pageWidth * 0.15)
  const colAmt = Math.floor(pageWidth * 0.20)

  const drawRow = (desc: string, qty: string, rate: string, amt: string, bold?: boolean) => {
    if (y > doc.page.height - doc.page.margins.bottom - 60) {
      doc.addPage()
      y = doc.page.margins.top
    }

    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
    doc.text(desc, startX, y, { width: colDesc })
    doc.text(qty, startX + colDesc, y, { width: colQty, align: 'right' })
    doc.text(rate, startX + colDesc + colQty, y, { width: colRate, align: 'right' })
    doc.text(amt, startX + colDesc + colQty + colRate, y, { width: colAmt, align: 'right' })
    y += 16
  }

  drawRow('Description', 'Qty', 'Rate', 'Amount', true)
  doc.moveTo(startX, y).lineTo(startX + pageWidth, y).stroke()
  y += 8

  for (const li of data.lineItems) {
    drawRow(
      li.description,
      String(li.quantity),
      li.rate.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      li.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })
    )
  }

  y += 10
  doc.moveTo(startX, y).lineTo(startX + pageWidth, y).stroke()
  y += 10

  const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2 })

  drawRow('', '', 'Subtotal', money(data.invoice.subtotal), true)
  drawRow('', '', 'Tax', money(data.invoice.taxAmount), true)
  drawRow('', '', 'Total', money(data.invoice.totalAmount), true)
  drawRow('', '', 'Balance Due', money(data.invoice.balanceDue), true)

  if (data.invoice.notes) {
    y += 16
    doc.font('Helvetica-Bold').fontSize(11).text('Notes', startX, y)
    y += 14
    doc.font('Helvetica').fontSize(10).text(data.invoice.notes, startX, y, { width: pageWidth })
  }

  if (data.invoice.termsAndConditions) {
    doc.addPage()
    doc.font('Helvetica-Bold').fontSize(12).text('Terms & Conditions')
    doc.moveDown(0.5)
    doc.font('Helvetica').fontSize(10).text(data.invoice.termsAndConditions)
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

    const pdfBuffer = await renderInvoicePdf(pdfData)
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
