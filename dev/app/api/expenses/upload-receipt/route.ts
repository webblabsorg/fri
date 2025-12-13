import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadReceipt, processReceiptOcr } from '@/lib/finance/expense-service'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''

    let organizationId: string
    let expenseId: string
    let receiptUrl: string

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      organizationId = formData.get('organizationId') as string
      expenseId = formData.get('expenseId') as string
      const file = formData.get('file') as File | null

      if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
      }

      if (!expenseId) {
        return NextResponse.json({ error: 'Expense ID required' }, { status: 400 })
      }

      if (!file) {
        return NextResponse.json({ error: 'File is required' }, { status: 400 })
      }

      const member = await prisma.organizationMember.findFirst({
        where: { organizationId, userId: user.id, status: 'active' },
      })

      if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${randomUUID()}.${ext}`
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'receipts', organizationId)

      await mkdir(uploadDir, { recursive: true })
      const filePath = join(uploadDir, filename)
      await writeFile(filePath, buffer)

      receiptUrl = `/uploads/receipts/${organizationId}/${filename}`

      // Pass base64 to OCR for local uploads
      const imageBase64 = buffer.toString('base64')
      const ocrResult = await processReceiptOcr(receiptUrl, imageBase64)

      const expense = await uploadReceipt(expenseId, organizationId, receiptUrl, ocrResult)

      return NextResponse.json({
        expense,
        ocrResult,
        message: ocrResult.confidence > 0
          ? 'Receipt processed successfully'
          : 'Receipt uploaded. OCR processing requires GOOGLE_VISION_API_KEY to be configured.',
      })
    } else {
      const body = await request.json()
      organizationId = body.organizationId
      expenseId = body.expenseId
      receiptUrl = body.receiptUrl

      if (!organizationId) {
        return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
      }

      const member = await prisma.organizationMember.findFirst({
        where: { organizationId, userId: user.id, status: 'active' },
      })

      if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (!expenseId || !receiptUrl) {
        return NextResponse.json(
          { error: 'Expense ID and receipt URL are required' },
          { status: 400 }
        )
      }

      // For remote URLs, use imageUri approach
      const ocrResult = await processReceiptOcr(receiptUrl)

      const expense = await uploadReceipt(expenseId, organizationId, receiptUrl, ocrResult)

      return NextResponse.json({
        expense,
        ocrResult,
        message: ocrResult.confidence > 0
          ? 'Receipt processed successfully'
          : 'Receipt uploaded. OCR processing requires GOOGLE_VISION_API_KEY to be configured.',
      })
    }
  } catch (error) {
    console.error('Error uploading receipt:', error)
    if ((error as Error).message) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 })
  }
}
