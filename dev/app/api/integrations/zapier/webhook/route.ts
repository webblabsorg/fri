import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/integrations/zapier/webhook
 * Handle Zapier webhook actions (e.g., "Run tool", "Create project")
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data, zapier_user_id } = body

    // Validate required fields
    if (!action || !data) {
      return NextResponse.json(
        { error: 'Action and data are required' },
        { status: 400 }
      )
    }

    // For security, you might want to validate the request comes from Zapier
    // This could include checking headers, API keys, or webhook signatures

    switch (action) {
      case 'run_tool':
        return await handleRunTool(data)
      
      case 'create_project':
        return await handleCreateProject(data)
      
      case 'get_tool_output':
        return await handleGetToolOutput(data)
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Zapier] Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleRunTool(data: any) {
  const { tool_id, input_text, user_id } = data

  if (!tool_id || !input_text || !user_id) {
    return NextResponse.json(
      { error: 'tool_id, input_text, and user_id are required' },
      { status: 400 }
    )
  }

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // For this example, we'll create a mock tool run
    // In a real implementation, you would call your actual tool execution service
    const toolRun = await prisma.toolRun.create({
      data: {
        userId: user_id,
        toolId: tool_id,
        inputText: input_text,
        status: 'completed',
        aiModelUsed: 'gpt-4',
        outputText: `Mock output for tool ${tool_id} with input: ${input_text}`,
        tokensUsed: 100,
        cost: 0.002,
        completedAt: new Date(),
      },
    })

    // Create Zapier event for potential triggers
    await prisma.zapierEvent.create({
      data: {
        userId: user_id,
        eventType: 'tool_run_completed',
        payload: {
          toolRunId: toolRun.id,
          toolId: tool_id,
          status: 'completed',
          outputText: toolRun.outputText,
          tokensUsed: toolRun.tokensUsed,
          cost: toolRun.cost,
        },
      },
    })

    return NextResponse.json({
      success: true,
      tool_run_id: toolRun.id,
      output: toolRun.outputText,
      status: toolRun.status,
      tokens_used: toolRun.tokensUsed,
      cost: toolRun.cost,
    })
  } catch (error) {
    console.error('[Zapier] Run tool error:', error)
    return NextResponse.json(
      { error: 'Failed to run tool' },
      { status: 500 }
    )
  }
}

async function handleCreateProject(data: any) {
  const { name, description, user_id, workspace_id } = data

  if (!name || !user_id) {
    return NextResponse.json(
      { error: 'name and user_id are required' },
      { status: 400 }
    )
  }

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        createdBy: user_id,
        workspaceId: workspace_id || null,
        status: 'active',
        privacy: 'private',
      },
    })

    // Create Zapier event
    await prisma.zapierEvent.create({
      data: {
        userId: user_id,
        eventType: 'project_created',
        payload: {
          projectId: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          createdAt: project.createdAt,
        },
      },
    })

    return NextResponse.json({
      success: true,
      project_id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      created_at: project.createdAt,
    })
  } catch (error) {
    console.error('[Zapier] Create project error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

async function handleGetToolOutput(data: any) {
  const { tool_run_id } = data

  if (!tool_run_id) {
    return NextResponse.json(
      { error: 'tool_run_id is required' },
      { status: 400 }
    )
  }

  try {
    const toolRun = await prisma.toolRun.findUnique({
      where: { id: tool_run_id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!toolRun) {
      return NextResponse.json(
        { error: 'Tool run not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      tool_run_id: toolRun.id,
      tool_id: toolRun.toolId,
      status: toolRun.status,
      input_text: toolRun.inputText,
      output_text: toolRun.outputText,
      tokens_used: toolRun.tokensUsed,
      cost: toolRun.cost,
      created_at: toolRun.createdAt,
      completed_at: toolRun.completedAt,
      user: toolRun.user,
    })
  } catch (error) {
    console.error('[Zapier] Get tool output error:', error)
    return NextResponse.json(
      { error: 'Failed to get tool output' },
      { status: 500 }
    )
  }
}
