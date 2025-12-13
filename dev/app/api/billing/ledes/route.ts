import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  exportToLedes,
  validateLedes,
  getSupportedFormats,
  LedesFormat,
} from '@/lib/finance/ledes-service'

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

    // Return supported formats
    const formats = getSupportedFormats()
    return NextResponse.json({ formats })
  } catch (error) {
    console.error('Error fetching LEDES formats:', error)
    return NextResponse.json({ error: 'Failed to fetch formats' }, { status: 500 })
  }
}

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

    const body = await request.json()
    const { action, invoiceIds, format, content } = body

    if (action === 'export') {
      if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return NextResponse.json(
          { error: 'At least one invoice ID is required' },
          { status: 400 }
        )
      }

      const ledesFormat: LedesFormat = format === 'LEDES2000' ? 'LEDES2000' : 'LEDES98B'

      // Verify user has access to these invoices
      const invoices = await prisma.invoice.findMany({
        where: { id: { in: invoiceIds } },
        select: { organizationId: true },
      })

      if (invoices.length === 0) {
        return NextResponse.json({ error: 'No invoices found' }, { status: 404 })
      }

      const orgIds = [...new Set(invoices.map(i => i.organizationId))]
      
      for (const orgId of orgIds) {
        const member = await prisma.organizationMember.findFirst({
          where: { organizationId: orgId, userId: user.id, status: 'active' },
        })
        if (!member) {
          return NextResponse.json({ error: 'Access denied to one or more invoices' }, { status: 403 })
        }
      }

      const ledesContent = await exportToLedes({
        invoiceIds,
        format: ledesFormat,
        includeExpenses: true,
        includeTimeEntries: true,
      })

      // Return as downloadable file
      const contentType = ledesFormat === 'LEDES2000' 
        ? 'application/xml' 
        : 'text/plain'
      const extension = ledesFormat === 'LEDES2000' ? 'xml' : 'txt'
      const filename = `ledes-export-${new Date().toISOString().split('T')[0]}.${extension}`

      return new NextResponse(ledesContent, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    if (action === 'validate') {
      if (!content) {
        return NextResponse.json(
          { error: 'Content is required for validation' },
          { status: 400 }
        )
      }

      const ledesFormat: LedesFormat = format === 'LEDES2000' ? 'LEDES2000' : 'LEDES98B'
      const result = validateLedes(content, ledesFormat)

      return NextResponse.json({
        format: ledesFormat,
        validation: result,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "export" or "validate"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing LEDES request:', error)
    return NextResponse.json(
      { error: 'Failed to process LEDES request' },
      { status: 500 }
    )
  }
}
