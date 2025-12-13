import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { suggestAccountStructure } from '@/lib/finance/ai-financial-service'

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
    const { organizationId, firmSize, jurisdiction, practiceAreas } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (!firmSize || !jurisdiction || !practiceAreas) {
      return NextResponse.json(
        { error: 'Firm size, jurisdiction, and practice areas are required' },
        { status: 400 }
      )
    }

    const validSizes = ['solo', 'small', 'mid', 'large']
    if (!validSizes.includes(firmSize)) {
      return NextResponse.json(
        { error: `Firm size must be one of: ${validSizes.join(', ')}` },
        { status: 400 }
      )
    }

    if (!Array.isArray(practiceAreas)) {
      return NextResponse.json({ error: 'Practice areas must be an array' }, { status: 400 })
    }

    const suggestion = await suggestAccountStructure(
      firmSize as 'solo' | 'small' | 'mid' | 'large',
      jurisdiction,
      practiceAreas
    )

    return NextResponse.json(suggestion)
  } catch (error) {
    console.error('Error suggesting account structure:', error)
    return NextResponse.json({ error: 'Failed to suggest account structure' }, { status: 500 })
  }
}
