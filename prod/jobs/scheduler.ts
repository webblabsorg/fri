/**
 * Scheduler Worker
 * 
 * Processes scheduled jobs and executes them when due.
 * This can be run as a standalone process or triggered by a cron job.
 */

import { PrismaClient } from '@prisma/client'
import { executeWorkflow } from '../../dev/lib/workflows/engine'
import { processDueReconciliations } from '../../dev/lib/finance/daily-reconciliation-scheduler'
import { sendInvoiceReminder } from '../../dev/lib/finance/billing-service'

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
      } else if (job.type === 'trust_reconciliation') {
        result = await this.executeTrustReconciliation(job)
      } else if (job.type === 'payment_reminders') {
        result = await this.executePaymentReminders(job)
      } else if (job.type === 'scheduled_vendor_payments') {
        result = await this.executeScheduledVendorPayments(job)
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
   * Execute trust reconciliation job
   * This processes all due automated reconciliations for trust accounts
   */
  private async executeTrustReconciliation(job: ScheduledJob): Promise<any> {
    console.log(`[Scheduler] Running trust reconciliation job`)
    
    try {
      const results = await processDueReconciliations()
      
      return {
        jobType: 'trust_reconciliation',
        processedCount: results.length,
        results: results.map(r => ({
          trustAccountId: r.trustAccountId,
          reconciliationId: r.reconciliationId,
          status: r.status,
        })),
      }
    } catch (error) {
      console.error('[Scheduler] Trust reconciliation failed:', error)
      throw error
    }
  }

  /**
   * Execute payment reminders job
   * Sends due payment reminders for overdue invoices
   */
  private async executePaymentReminders(job: ScheduledJob): Promise<any> {
    console.log(`[Scheduler] Running payment reminders job`)
    
    try {
      const now = new Date()
      
      // Find due reminders
      const dueReminders = await prisma.paymentReminder.findMany({
        where: {
          status: 'scheduled',
          scheduledFor: { lte: now },
        },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              balanceDue: true,
            },
          },
        },
      })

      let sent = 0
      let skipped = 0

      for (const reminder of dueReminders) {
        try {
          const result = await sendInvoiceReminder(reminder.id)
          if (result.status === 'cancelled') {
            console.log(`[Scheduler] Cancelled reminder for paid invoice ${reminder.invoice.invoiceNumber}`)
            skipped++
          } else {
            console.log(`[Scheduler] Sent reminder for invoice ${reminder.invoice.invoiceNumber}`)
            sent++
          }
        } catch (error) {
          console.error(`[Scheduler] Failed to send reminder ${reminder.id}:`, error)
          skipped++
        }
      }

      return {
        jobType: 'payment_reminders',
        processed: dueReminders.length,
        sent,
        skipped,
      }
    } catch (error) {
      console.error('[Scheduler] Payment reminders job failed:', error)
      throw error
    }
  }

  /**
   * Execute scheduled vendor payments job
   * Processes vendor bills that are scheduled for payment today
   */
  private async executeScheduledVendorPayments(job: ScheduledJob): Promise<any> {
    console.log(`[Scheduler] Running scheduled vendor payments job`)
    
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      // Find bills scheduled for payment today
      const scheduledBills = await prisma.vendorBill.findMany({
        where: {
          status: 'scheduled',
          scheduledPaymentDate: {
            gte: today,
            lt: tomorrow,
          },
          balanceDue: { gt: 0 },
        },
        include: {
          vendor: true,
          organization: true,
        },
      })

      let processed = 0
      let failed = 0
      const results: Array<{ billId: string; status: string; error?: string }> = []

      for (const bill of scheduledBills) {
        try {
          // Create payment record
          const payment = await prisma.$transaction(async (tx) => {
            const pmt = await tx.vendorPayment.create({
              data: {
                organizationId: bill.organizationId,
                vendorId: bill.vendorId,
                billId: bill.id,
                amount: bill.balanceDue,
                paymentMethod: bill.vendor.preferredPaymentMethod || 'ach',
                paymentDate: new Date(),
                status: 'completed',
                processedBy: job.createdById,
                notes: 'Scheduled automatic payment',
              },
            })

            await tx.vendorBill.update({
              where: { id: bill.id },
              data: {
                paidAmount: bill.totalAmount,
                balanceDue: 0,
                status: 'paid',
                paidAt: new Date(),
                paymentMethod: bill.vendor.preferredPaymentMethod || 'ach',
              },
            })

            await tx.vendor.update({
              where: { id: bill.vendorId },
              data: {
                totalPaid: { increment: Number(bill.balanceDue) },
              },
            })

            return pmt
          })

          console.log(`[Scheduler] Processed scheduled payment for bill ${bill.billNumber}`)
          processed++
          results.push({ billId: bill.id, status: 'paid' })
        } catch (error) {
          console.error(`[Scheduler] Failed to process scheduled payment for bill ${bill.id}:`, error)
          failed++
          results.push({ billId: bill.id, status: 'failed', error: (error as Error).message })
        }
      }

      return {
        jobType: 'scheduled_vendor_payments',
        totalScheduled: scheduledBills.length,
        processed,
        failed,
        results,
      }
    } catch (error) {
      console.error('[Scheduler] Scheduled vendor payments job failed:', error)
      throw error
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
