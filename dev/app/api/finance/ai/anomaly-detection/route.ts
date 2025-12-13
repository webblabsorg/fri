import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { 
  detectAnomalies, 
  persistAnomalies,
  flagTransactionForReview, 
  resolveAnomaly,
  dismissAnomaly,
  escalateAnomaly,
} from '@/lib/finance/ai-financial-service'

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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const transactionTypes = searchParams.get('transactionTypes')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await detectAnomalies(organizationId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      transactionTypes: transactionTypes ? transactionTypes.split(',') : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error detecting anomalies:', error)
    return NextResponse.json({ error: 'Failed to detect anomalies' }, { status: 500 })
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
    const { organizationId, anomalyId, action, notes, resolution } = body

    // If no anomalyId, run detection and persist
    if (!anomalyId && organizationId) {
      const member = await prisma.organizationMember.findFirst({
        where: { organizationId, userId: user.id, status: 'active' },
      })
      if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const result = await detectAnomalies(organizationId)
      const persisted = await persistAnomalies(organizationId, result.anomalies)
      
      return NextResponse.json({ 
        message: 'Detection complete',
        detected: result.anomalies.length,
        persisted,
        summary: result.summary,
      })
    }

    if (!organizationId || !anomalyId || !action) {
      return NextResponse.json({ error: 'Organization ID, anomaly ID, and action required' }, { status: 400 })
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

    if (action === 'flag') {
      await flagTransactionForReview(organizationId, anomalyId, user.id, notes)
      return NextResponse.json({ message: 'Transaction flagged for review' })
    }

    if (action === 'resolve') {
      if (!resolution) {
        return NextResponse.json({ error: 'Resolution required' }, { status: 400 })
      }
      await resolveAnomaly(organizationId, anomalyId, user.id, resolution, notes)
      return NextResponse.json({ message: 'Anomaly resolved' })
    }

    if (action === 'dismiss') {
      await dismissAnomaly(organizationId, anomalyId, user.id, notes)
      return NextResponse.json({ message: 'Anomaly dismissed' })
    }

    if (action === 'escalate') {
      if (!notes) {
        return NextResponse.json({ error: 'Reason required for escalation' }, { status: 400 })
      }
      await escalateAnomaly(organizationId, anomalyId, user.id, notes)
      return NextResponse.json({ message: 'Anomaly escalated' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing anomaly action:', error)
    return NextResponse.json({ error: 'Failed to process anomaly action' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
    const { anomalyId, action, resolution, notes } = body

    if (!anomalyId || !action) {
      return NextResponse.json({ error: 'Anomaly ID and action required' }, { status: 400 })
    }

    // Get the anomaly to find organizationId
    const anomaly = await prisma.financialAnomaly.findUnique({
      where: { id: anomalyId },
    })

    if (!anomaly) {
      return NextResponse.json({ error: 'Anomaly not found' }, { status: 404 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: {
        organizationId: anomaly.organizationId,
        userId: user.id,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const organizationId = anomaly.organizationId

    if (action === 'resolve') {
      await resolveAnomaly(organizationId, anomalyId, user.id, resolution || 'approved', notes)
      return NextResponse.json({ message: 'Anomaly resolved' })
    }

    if (action === 'dismiss') {
      await dismissAnomaly(organizationId, anomalyId, user.id, notes)
      return NextResponse.json({ message: 'Anomaly dismissed' })
    }

    if (action === 'escalate') {
      await escalateAnomaly(organizationId, anomalyId, user.id, notes || 'Escalated for review')
      return NextResponse.json({ message: 'Anomaly escalated' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating anomaly:', error)
    return NextResponse.json({ error: 'Failed to update anomaly' }, { status: 500 })
  }
}
