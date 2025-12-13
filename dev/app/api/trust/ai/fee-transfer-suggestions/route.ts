import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getSmartFeeTransferSuggestions } from '@/lib/finance/ai-trust-monitor'

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
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })
    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const suggestions = await getSmartFeeTransferSuggestions(organizationId)

    const totalSuggestedAmount = suggestions.reduce(
      (sum, s) => sum + s.suggestedTransferAmount,
      0
    )

    return NextResponse.json({
      success: true,
      suggestions,
      summary: {
        totalSuggestions: suggestions.length,
        totalSuggestedAmount,
        highConfidence: suggestions.filter((s) => s.confidence >= 80).length,
        mediumConfidence: suggestions.filter((s) => s.confidence >= 60 && s.confidence < 80).length,
        lowConfidence: suggestions.filter((s) => s.confidence < 60).length,
      },
    })
  } catch (error) {
    console.error('Error getting fee transfer suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to get fee transfer suggestions' },
      { status: 500 }
    )
  }
}
