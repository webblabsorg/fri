import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - List user's templates (optionally filter by toolId)
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const toolId = searchParams.get('toolId')
    const category = searchParams.get('category')

    const where: any = { userId: user.id }
    if (toolId) where.toolId = toolId
    if (category) where.category = category

    const templates = await prisma.template.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      templates: templates.map(t => ({
        id: t.id,
        toolId: t.toolId,
        name: t.name,
        description: t.description,
        category: t.category,
        useCount: t.useCount,
        isPublic: t.isPublic,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Templates fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST - Create a new template
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const body = await request.json()
    const { toolId, name, description, content, category, isPublic } = body

    if (!toolId || !name || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: toolId, name, content' },
        { status: 400 }
      )
    }

    const template = await prisma.template.create({
      data: {
        userId: user.id,
        toolId,
        name,
        description: description || null,
        content,
        category: category || null,
        isPublic: isPublic || false,
      },
    })

    return NextResponse.json({
      template: {
        id: template.id,
        toolId: template.toolId,
        name: template.name,
        description: template.description,
        category: template.category,
        useCount: template.useCount,
        isPublic: template.isPublic,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Template creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
