import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { saveResultToProject } from '@/lib/web-search/web-search-service'

// POST /api/web-search/results/:id/save - Save result to project/matter
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

    // Verify ownership
    const result = await prisma.webSearchResult.findFirst({
      where: { id },
      include: {
        query: {
          select: { userId: true },
        },
      },
    })

    if (!result || result.query.userId !== user.id) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { projectId, notes, tags } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { createdBy: user.id },
          { workspace: { members: { some: { userId: user.id } } } },
          { organization: { members: { some: { userId: user.id } } } },
        ],
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    await saveResultToProject(id, projectId, notes, tags)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save result error:', error)
    return NextResponse.json(
      { error: 'Failed to save result' },
      { status: 500 }
    )
  }
}
