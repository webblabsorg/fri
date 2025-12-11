import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin auth
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, status, severity, affectedServices } = body

    const updateData: any = {}

    if (title) updateData.title = title
    if (description) updateData.description = description
    if (status) {
      updateData.status = status
      if (status === 'resolved' && !updateData.resolvedAt) {
        updateData.resolvedAt = new Date()
      }
    }
    if (severity) updateData.severity = severity
    if (affectedServices) updateData.affectedServices = affectedServices

    updateData.updatedAt = new Date()

    const incident = await prisma.systemIncident.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ incident })
  } catch (error) {
    console.error('Error updating incident:', error)
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    )
  }
}
