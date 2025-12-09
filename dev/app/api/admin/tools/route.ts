import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { isAdmin, logAdminAction } from '@/lib/admin'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const pricingTier = searchParams.get('pricingTier')

    // Build where clause
    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (pricingTier && pricingTier !== 'all') {
      where.pricingTier = pricingTier
    }

    // Fetch tools
    const tools = await prisma.tool.findMany({
      where,
      orderBy: [
        { popular: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        categoryId: true,
        inputType: true,
        outputType: true,
        pricingTier: true,
        aiModel: true,
        popular: true,
        featured: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            runs: true,
          },
        },
      },
    })

    return NextResponse.json({ tools })
  } catch (error) {
    console.error('Admin tools API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await getSessionUser(sessionToken)
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      categoryId,
      inputType,
      outputType,
      pricingTier,
      aiModel,
      promptTemplate,
      systemPrompt,
      maxTokens,
      temperature,
      popular,
      featured,
      status,
    } = body

    // Validate required fields
    if (!name || !slug || !description || !categoryId || !promptTemplate) {
      return NextResponse.json(
        { error: 'Name, slug, description, category, and prompt template are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingTool = await prisma.tool.findUnique({
      where: { slug },
    })

    if (existingTool) {
      return NextResponse.json(
        { error: 'Tool with this slug already exists' },
        { status: 400 }
      )
    }

    // Create tool
    const tool = await prisma.tool.create({
      data: {
        name,
        slug,
        description,
        categoryId,
        inputType: inputType || 'text',
        outputType: outputType || 'text',
        pricingTier: pricingTier || 'free',
        aiModel: aiModel || 'claude-sonnet-4.5',
        promptTemplate,
        systemPrompt,
        maxTokens: maxTokens || 4000,
        temperature: temperature || 0.7,
        popular: popular || false,
        featured: featured || false,
        status: status || 'active',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
      },
    })

    // Log admin action
    await logAdminAction(adminUser.id, 'create_tool', 'tool', tool.id, {
      toolName: name,
      toolSlug: slug,
    })

    return NextResponse.json({ tool })
  } catch (error) {
    console.error('Admin create tool error:', error)
    return NextResponse.json(
      { error: 'Failed to create tool' },
      { status: 500 }
    )
  }
}
