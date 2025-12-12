import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  createAccount,
  getAccounts,
  initializeChartOfAccounts,
  ACCOUNT_TEMPLATES,
} from '@/lib/finance/finance-service'

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
    const accountType = searchParams.get('accountType') || undefined
    const isActive = searchParams.get('isActive')
    const includeHierarchy = searchParams.get('includeHierarchy') === 'true'

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const accounts = await getAccounts(organizationId, {
      accountType,
      isActive: isActive ? isActive === 'true' : undefined,
      includeHierarchy,
    })

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
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
    const {
      organizationId,
      accountNumber,
      accountName,
      accountType,
      parentId,
      currency,
      description,
      normalBalance,
      template,
    } = body

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

    if (template && template in ACCOUNT_TEMPLATES) {
      const result = await initializeChartOfAccounts(
        organizationId,
        template as keyof typeof ACCOUNT_TEMPLATES
      )
      return NextResponse.json({
        message: `Created ${result.count} accounts from ${template} template`,
        count: result.count,
      })
    }

    if (!accountNumber || !accountName || !accountType || !normalBalance) {
      return NextResponse.json(
        { error: 'Account number, name, type, and normal balance are required' },
        { status: 400 }
      )
    }

    const validTypes = ['asset', 'liability', 'equity', 'revenue', 'expense']
    if (!validTypes.includes(accountType)) {
      return NextResponse.json(
        { error: `Account type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const validBalances = ['debit', 'credit']
    if (!validBalances.includes(normalBalance)) {
      return NextResponse.json(
        { error: 'Normal balance must be debit or credit' },
        { status: 400 }
      )
    }

    const account = await createAccount({
      organizationId,
      accountNumber,
      accountName,
      accountType,
      parentId,
      currency,
      description,
      normalBalance,
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    if ((error as Error).message?.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Account number already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
