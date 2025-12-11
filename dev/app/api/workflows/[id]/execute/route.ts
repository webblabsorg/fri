import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'
import { executeWorkflow } from '@/lib/workflows/engine'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/workflows/[id]/execute
 * Execute a workflow
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: workflowId } = await context.params
    const body = await request.json()
    const { input } = body

    // Execute the workflow
    const workflowRun = await executeWorkflow(workflowId, user.id, input)

    return NextResponse.json({
      success: true,
      workflowRun,
      message: 'Workflow execution started',
    })
  } catch (error) {
    console.error('[API] Execute workflow error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }
      if (error.message.includes('not active')) {
        return NextResponse.json({ error: 'Workflow is not active' }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    )
  }
}
