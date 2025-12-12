import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

// POST /api/web-search/archives/:id/certify - Generate certification for archive
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await getSessionUser(sessionToken)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const archive = await prisma.webSearchArchive.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!archive) {
      return NextResponse.json(
        { error: 'Archive not found' },
        { status: 404 }
      )
    }

    // Generate certification data
    const certificationTimestamp = new Date().toISOString()
    const contentToHash = archive.archivedContent || archive.archivedHtml || ''
    const contentHash = crypto
      .createHash('sha256')
      .update(contentToHash)
      .digest('hex')

    const certification = {
      version: '1.0',
      archiveId: archive.id,
      originalUrl: archive.originalUrl,
      capturedAt: archive.createdAt.toISOString(),
      certifiedAt: certificationTimestamp,
      captureMethod: archive.captureMethod || 'local',
      userId: user.id,
      integrity: {
        algorithm: 'SHA-256',
        contentHash,
        storedHash: archive.contentHash,
        hashMatch: contentHash === archive.contentHash,
      },
      metadata: {
        contentLength: contentToHash.length,
        resultId: archive.resultId,
      },
    }

    // Store certification data in archive
    await prisma.webSearchArchive.update({
      where: { id },
      data: {
        certificationData: certification,
      },
    })

    return NextResponse.json({
      success: true,
      certification,
    })
  } catch (error) {
    console.error('Certify archive error:', error)
    return NextResponse.json(
      { error: 'Failed to certify archive' },
      { status: 500 }
    )
  }
}
