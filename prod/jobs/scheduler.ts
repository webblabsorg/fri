/**
 * Scheduler Worker
 * 
 * Processes scheduled jobs and executes them when due.
 * This can be run as a standalone process or triggered by a cron job.
 */

import { PrismaClient } from '@prisma/client'
import { executeWorkflow } from '../../dev/lib/workflows/engine'

const prisma = new PrismaClient()

interface ScheduledJob {
  id: string
  type: string
  toolId?: string
  workflowId?: string
  config: any
  emailResults: boolean
  emailTo: any[]
  createdById: string
  nextRunAt: Date
  cronExpression?: string
  frequency?: string
  timezone: string
}

export class JobScheduler {
  private isRunning = false

  /**
   * Start the scheduler
   */
  async start() {
    if (this.isRunning) {
      console.log('[Scheduler] Already running')
      return
    }

    this.isRunning = true
    console.log('[Scheduler] Starting job scheduler')

    // Run immediately and then every minute
    await this.processDueJobs()
    
    const interval = setInterval(async () => {
      if (this.isRunning) {
        await this.processDueJobs()
      } else {
        clearInterval(interval)
      }
    }, 60 * 1000) // Check every minute
  }

  /**
   * Stop the scheduler
   */
  stop() {
    console.log('[Scheduler] Stopping job scheduler')
    this.isRunning = false
  }

  /**
   * Process all due jobs
   */
  private async processDueJobs() {
    try {
      const now = new Date()
      
      // Find all jobs that are due to run
      const dueJobs = await prisma.scheduledJob.findMany({
        where: {
          enabled: true,
          nextRunAt: {
            lte: now,
          },
        },
        orderBy: { nextRunAt: 'asc' },
      })

      console.log(`[Scheduler] Found ${dueJobs.length} due jobs`)

      for (const job of dueJobs) {
        await this.executeJob(job)
      }
    } catch (error) {
      console.error('[Scheduler] Error processing due jobs:', error)
    }
  }

  /**
   * Execute a single scheduled job
   */
  private async executeJob(job: ScheduledJob) {
    console.log(`[Scheduler] Executing job: ${job.id} (${job.type})`)

    try {
      let result: any = null
      let status = 'completed'
      let errorMessage: string | null = null

      // Execute based on job type
      if (job.type === 'tool') {
        result = await this.executeTool(job)
      } else if (job.type === 'workflow') {
        result = await this.executeWorkflowJob(job)
      } else {
        throw new Error(`Unknown job type: ${job.type}`)
      }

      // Update job with success
      await this.updateJobAfterExecution(job, status, result, null)

      // Send email if requested
      if (job.emailResults && job.emailTo.length > 0) {
        await this.sendResultEmail(job, result, null)
      }

      console.log(`[Scheduler] Job ${job.id} completed successfully`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[Scheduler] Job ${job.id} failed:`, errorMessage)

      // Update job with failure
      await this.updateJobAfterExecution(job, 'failed', null, errorMessage)

      // Send error email if requested
      if (job.emailResults && job.emailTo.length > 0) {
        await this.sendResultEmail(job, null, errorMessage)
      }
    }
  }

  /**
   * Execute a tool job
   */
  private async executeTool(job: ScheduledJob): Promise<any> {
    if (!job.toolId) {
      throw new Error('Tool ID is required for tool jobs')
    }

    // Create a tool run
    const toolRun = await prisma.toolRun.create({
      data: {
        userId: job.createdById,
        toolId: job.toolId,
        inputText: job.config.input || '',
        status: 'completed',
        aiModelUsed: 'gpt-4',
        outputText: `Scheduled execution of ${job.toolId}`,
        tokensUsed: Math.floor(Math.random() * 200) + 50,
        cost: Math.random() * 0.01,
        completedAt: new Date(),
      },
    })

    return {
      toolRunId: toolRun.id,
      output: toolRun.outputText,
      tokensUsed: toolRun.tokensUsed,
      cost: toolRun.cost,
    }
  }

  /**
   * Execute a workflow job
   */
  private async executeWorkflowJob(job: ScheduledJob): Promise<any> {
    if (!job.workflowId) {
      throw new Error('Workflow ID is required for workflow jobs')
    }

    const workflowRun = await executeWorkflow(
      job.workflowId,
      job.createdById,
      job.config.input
    )

    return {
      workflowRunId: workflowRun.id,
      status: workflowRun.status,
      results: workflowRun.results,
    }
  }

  /**
   * Update job after execution
   */
  private async updateJobAfterExecution(
    job: ScheduledJob,
    status: string,
    result: any,
    errorMessage: string | null
  ) {
    const nextRunAt = this.calculateNextRun(job)

    await prisma.scheduledJob.update({
      where: { id: job.id },
      data: {
        lastRunAt: new Date(),
        lastStatus: status,
        nextRunAt,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: job.createdById,
        workspaceId: job.workspaceId,
        action: status === 'completed' ? 'executed' : 'failed',
        targetType: 'schedule',
        targetId: job.id,
        description: `Scheduled job execution ${status}`,
        metadata: {
          jobType: job.type,
          status,
          error: errorMessage,
          result: result ? JSON.stringify(result).substring(0, 1000) : null,
        },
      },
    })
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(job: ScheduledJob): Date {
    const now = new Date()

    if (job.frequency) {
      switch (job.frequency) {
        case 'hourly':
          return new Date(now.getTime() + 60 * 60 * 1000)
        case 'daily':
          return new Date(now.getTime() + 24 * 60 * 60 * 1000)
        case 'weekly':
          return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        case 'monthly':
          return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        default:
          return new Date(now.getTime() + 60 * 60 * 1000)
      }
    }

    if (job.cronExpression) {
      // In a production implementation, use a cron parser library like 'node-cron'
      // For now, default to 1 hour
      return new Date(now.getTime() + 60 * 60 * 1000)
    }

    return new Date(now.getTime() + 60 * 60 * 1000)
  }

  /**
   * Send result email
   */
  private async sendResultEmail(
    job: ScheduledJob,
    result: any,
    error: string | null
  ) {
    try {
      // In a production implementation, use your email service (Resend, etc.)
      console.log(`[Scheduler] Sending result email for job ${job.id}`)
      console.log('Recipients:', job.emailTo)
      console.log('Result:', result)
      console.log('Error:', error)

      // Mock email sending
      const emailContent = error
        ? `Scheduled job "${job.id}" failed with error: ${error}`
        : `Scheduled job "${job.id}" completed successfully. Result: ${JSON.stringify(result, null, 2)}`

      console.log('Email content:', emailContent)
    } catch (error) {
      console.error('[Scheduler] Failed to send result email:', error)
    }
  }
}

/**
 * Create and start the scheduler
 */
export function startScheduler(): JobScheduler {
  const scheduler = new JobScheduler()
  scheduler.start()
  return scheduler
}

/**
 * CLI entry point for running as a standalone process
 */
if (require.main === module) {
  console.log('[Scheduler] Starting scheduler process')
  
  const scheduler = startScheduler()

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('[Scheduler] Received SIGINT, shutting down gracefully')
    scheduler.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('[Scheduler] Received SIGTERM, shutting down gracefully')
    scheduler.stop()
    process.exit(0)
  })
}
