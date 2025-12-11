/**
 * Workflow Execution Engine
 * 
 * Handles the execution of workflows by running each step sequentially
 * and managing the flow of data between steps.
 */

import { prisma } from '@/lib/db'

interface WorkflowStep {
  id: string
  order: number
  toolId: string
  name: string | null
  config: any
  waitForPrevious: boolean
  continueOnError: boolean
}

interface WorkflowRun {
  id: string
  workflowId: string
  userId: string
  status: string
  startedAt: Date
  completedAt: Date | null
  errorMsg?: string | null
  results?: any | null
}

interface StepExecutionResult {
  stepId: string
  status: 'completed' | 'failed' | 'skipped'
  output?: any
  error?: string
  tokensUsed?: number
  cost?: number
  duration?: number
}

interface WorkflowExecutionContext {
  workflowId: string
  runId: string
  userId: string
  initialInput?: any
  stepResults: Map<string, StepExecutionResult>
}

export class WorkflowEngine {
  /**
   * Execute a workflow
   */
  async runWorkflow(
    workflowId: string,
    userId: string,
    initialInput?: any
  ): Promise<WorkflowRun> {
    try {
      // Get workflow with steps
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          steps: {
            orderBy: { order: 'asc' },
          },
        },
      })

      if (!workflow) {
        throw new Error('Workflow not found')
      }

      if (workflow.status !== 'active') {
        throw new Error('Workflow is not active')
      }

      // Create workflow run
      const workflowRun = await prisma.workflowRun.create({
        data: {
          workflowId,
          userId,
          status: 'running',
          startedAt: new Date(),
        },
      })

      // Create execution context
      const context: WorkflowExecutionContext = {
        workflowId,
        runId: workflowRun.id,
        userId,
        initialInput,
        stepResults: new Map(),
      }

      try {
        // Execute steps sequentially
        await this.executeSteps(workflow.steps, context)

        // Update run as completed
        const completedRun = await prisma.workflowRun.update({
          where: { id: workflowRun.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            results: this.collectResults(context),
          },
        })

        return completedRun
      } catch (error) {
        // Update run as failed
        await prisma.workflowRun.update({
          where: { id: workflowRun.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            errorMsg: error instanceof Error ? error.message : 'Unknown error',
            results: this.collectResults(context),
          },
        })

        throw error
      }
    } catch (error) {
      console.error('[WorkflowEngine] Execution error:', error)
      throw error
    }
  }

  /**
   * Execute workflow steps sequentially
   */
  private async executeSteps(
    steps: WorkflowStep[],
    context: WorkflowExecutionContext
  ): Promise<void> {
    for (const step of steps) {
      try {
        // Check if we should wait for previous step
        if (step.waitForPrevious && step.order > 1) {
          const previousStepResult = this.getPreviousStepResult(step.order - 1, context)
          if (previousStepResult?.status === 'failed' && !step.continueOnError) {
            // Skip this step due to previous failure
            context.stepResults.set(step.id, {
              stepId: step.id,
              status: 'skipped',
              error: 'Previous step failed',
            })
            continue
          }
        }

        // Execute the step
        const result = await this.executeStep(step, context)
        context.stepResults.set(step.id, result)

        // If step failed and we shouldn't continue on error, stop execution
        if (result.status === 'failed' && !step.continueOnError) {
          throw new Error(`Step ${step.name} failed: ${result.error}`)
        }
      } catch (error) {
        const errorResult: StepExecutionResult = {
          stepId: step.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
        context.stepResults.set(step.id, errorResult)

        if (!step.continueOnError) {
          throw error
        }
      }
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext
  ): Promise<StepExecutionResult> {
    const startTime = Date.now()

    try {
      // Prepare input for the step
      const stepInput = this.prepareStepInput(step, context)

      // Execute the tool
      const toolResult = await this.executeTool(step.toolId, stepInput, context.userId)

      const duration = Date.now() - startTime

      return {
        stepId: step.id,
        status: 'completed',
        output: toolResult.output,
        tokensUsed: toolResult.tokensUsed,
        cost: toolResult.cost,
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime

      return {
        stepId: step.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      }
    }
  }

  /**
   * Prepare input for a step by resolving placeholders
   */
  private prepareStepInput(step: WorkflowStep, context: WorkflowExecutionContext): any {
    const config = step.config || {}
    let input = config.input || ''

    // Replace placeholders with values from previous steps or initial input
    input = this.resolvePlaceholders(input, context)

    return input
  }

  /**
   * Resolve placeholders in input text
   */
  private resolvePlaceholders(input: string, context: WorkflowExecutionContext): string {
    if (typeof input !== 'string') {
      return input
    }

    let resolved = input

    // Replace {{initial_input}} with the initial workflow input
    if (context.initialInput) {
      resolved = resolved.replace(/\{\{initial_input\}\}/g, String(context.initialInput))
    }

    // Replace {{stepN.output}} with output from step N
    const stepPlaceholderRegex = /\{\{step(\d+)\.output\}\}/g
    resolved = resolved.replace(stepPlaceholderRegex, (match, stepOrder) => {
      const stepResult = this.getStepResultByOrder(parseInt(stepOrder), context)
      return stepResult?.output || ''
    })

    // Replace {{stepN.field}} with specific field from step N output
    const stepFieldRegex = /\{\{step(\d+)\.(\w+)\}\}/g
    resolved = resolved.replace(stepFieldRegex, (match, stepOrder, field) => {
      const stepResult = this.getStepResultByOrder(parseInt(stepOrder), context)
      if (stepResult?.output && typeof stepResult.output === 'object') {
        return stepResult.output[field] || ''
      }
      return ''
    })

    return resolved
  }

  /**
   * Execute a tool (mock implementation)
   */
  private async executeTool(
    toolId: string,
    input: any,
    userId: string
  ): Promise<{ output: any; tokensUsed?: number; cost?: number }> {
    // In a real implementation, this would call your actual tool execution service
    // For now, we'll create a mock tool run and return mock results
    
    try {
      const toolRun = await prisma.toolRun.create({
        data: {
          userId,
          toolId,
          inputText: String(input),
          status: 'completed',
          aiModelUsed: 'gpt-4',
          outputText: `Mock output from ${toolId} with input: ${input}`,
          tokensUsed: Math.floor(Math.random() * 200) + 50,
          cost: Math.random() * 0.01,
          completedAt: new Date(),
        },
      })

      return {
        output: toolRun.outputText,
        tokensUsed: toolRun.tokensUsed || 0,
        cost: toolRun.cost || 0,
      }
    } catch (error) {
      throw new Error(`Failed to execute tool ${toolId}: ${error}`)
    }
  }

  /**
   * Get result from previous step
   */
  private getPreviousStepResult(order: number, context: WorkflowExecutionContext): StepExecutionResult | undefined {
    return this.getStepResultByOrder(order, context)
  }

  /**
   * Get step result by order
   */
  private getStepResultByOrder(order: number, context: WorkflowExecutionContext): StepExecutionResult | undefined {
    for (const [stepId, result] of context.stepResults.entries()) {
      // In a real implementation, you'd need to map step IDs to their order
      // For now, we'll use a simple approach
      if (result.stepId.includes(`step-${order}`)) {
        return result
      }
    }
    return undefined
  }

  /**
   * Collect all step results
   */
  private collectResults(context: WorkflowExecutionContext): any {
    const results: any = {}
    
    for (const [stepId, result] of context.stepResults.entries()) {
      results[stepId] = {
        status: result.status,
        output: result.output,
        error: result.error,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        duration: result.duration,
      }
    }

    return results
  }
}

/**
 * Create a workflow engine instance
 */
export function createWorkflowEngine(): WorkflowEngine {
  return new WorkflowEngine()
}

/**
 * Execute a workflow (convenience function)
 */
export async function executeWorkflow(
  workflowId: string,
  userId: string,
  initialInput?: any
): Promise<WorkflowRun> {
  const engine = createWorkflowEngine()
  return engine.runWorkflow(workflowId, userId, initialInput)
}
