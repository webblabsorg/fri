import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getAllToolConfigs } from '@/lib/tools/tool-configs'

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
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
    }

    const searchTerm = query.trim().toLowerCase()

    // Search tools (from config, not database)
    const allTools = getAllToolConfigs()
    const toolResults = allTools
      .filter(tool => 
        tool.name.toLowerCase().includes(searchTerm) ||
        tool.description.toLowerCase().includes(searchTerm) ||
        tool.category.toLowerCase().includes(searchTerm)
      )
      .slice(0, 5)
      .map(tool => ({
        type: 'tool',
        id: tool.id,
        title: tool.name,
        description: tool.description,
        category: tool.category,
        url: `/dashboard/tools/${tool.id}`,
      }))

    // Search projects
    const projects = await prisma.project.findMany({
      where: {
        createdBy: user.id,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    })

    const projectResults = projects.map(project => ({
      type: 'project',
      id: project.id,
      title: project.name,
      description: project.description || 'No description',
      status: project.status,
      url: `/dashboard/projects/${project.id}`,
    }))

    // Search templates
    const templates = await prisma.template.findMany({
      where: {
        userId: user.id,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { category: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    })

    const templateResults = templates.map(template => ({
      type: 'template',
      id: template.id,
      title: template.name,
      description: template.description || 'No description',
      category: template.category,
      url: `/dashboard/templates`,
    }))

    // Search tool run history
    const toolRuns = await prisma.toolRun.findMany({
      where: {
        userId: user.id,
        OR: [
          { inputText: { contains: searchTerm, mode: 'insensitive' } },
          { outputText: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tool: true,
      },
    })

    const historyResults = toolRuns.map(run => ({
      type: 'history',
      id: run.id,
      title: run.tool.name,
      description: run.inputText.substring(0, 100) + '...',
      status: run.status,
      date: run.createdAt.toISOString(),
      url: `/dashboard/history`,
    }))

    // Combine and return results
    const results = {
      tools: toolResults,
      projects: projectResults,
      templates: templateResults,
      history: historyResults,
      total: toolResults.length + projectResults.length + templateResults.length + historyResults.length,
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
