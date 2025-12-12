import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createJournalEntry, getJournalEntries } from '@/lib/finance/finance-service'

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
    const status = searchParams.get('status') || undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await getJournalEntries(organizationId, {
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 })
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
    const { organizationId, journalType, description, postedDate, entries } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: user.id,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!journalType || !description || !postedDate || !entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Journal type, description, posted date, and entries are required' },
        { status: 400 }
      )
    }

    const validTypes = ['standard', 'adjusting', 'closing', 'reversing']
    if (!validTypes.includes(journalType)) {
      return NextResponse.json(
        { error: `Journal type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (entries.length < 2) {
      return NextResponse.json(
        { error: 'Journal entry must have at least 2 line items' },
        { status: 400 }
      )
    }

    for (const entry of entries) {
      if (!entry.accountId || (entry.debit === undefined && entry.credit === undefined)) {
        return NextResponse.json(
          { error: 'Each entry must have an accountId and either debit or credit' },
          { status: 400 }
        )
      }
    }

    const journalEntry = await createJournalEntry({
      organizationId,
      journalType,
      description,
      postedDate: new Date(postedDate),
      entries: entries.map((e: { accountId: string; debit?: number; credit?: number; description?: string; referenceId?: string; referenceType?: string }) => ({
        accountId: e.accountId,
        debit: e.debit || 0,
        credit: e.credit || 0,
        description: e.description || description,
        referenceId: e.referenceId,
        referenceType: e.referenceType,
      })),
      createdBy: user.id,
    })

    return NextResponse.json({ journalEntry }, { status: 201 })
  } catch (error) {
    console.error('Error creating journal entry:', error)
    if ((error as Error).message?.includes('must balance')) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
  }
}
