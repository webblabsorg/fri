/**
 * Bulk Processing Worker
 * 
 * Processes bulk jobs by extracting ZIP files, running tools on each file,
 * and creating result ZIP files.
 */

import { PrismaClient } from '@prisma/client'
import { uploadFile, downloadFile } from '../../dev/lib/storage/storage-service'

const prisma = new PrismaClient()

interface BulkJob {
  id: string
  name: string
  toolId: string
  config: any
  status: string
  inputZipKey: string
  outputZipKey?: string
  totalFiles: number
  processedFiles: number
  successfulFiles: number
  failedFiles: number
  createdById: string
  workspaceId?: string
  organizationId?: string
}

interface BulkJobFile {
  id: string
  bulkJobId: string
  fileName: string
  status: string
  inputText?: string
  outputText?: string
  errorMsg?: string
  tokensUsed?: number
  cost?: number
}

export class BulkProcessor {
  private isRunning = false

  /**
   * Start the bulk processor
   */
  async start() {
    if (this.isRunning) {
      console.log('[BulkProcessor] Already running')
      return
    }

    this.isRunning = true
    console.log('[BulkProcessor] Starting bulk processor')

    // Process jobs immediately and then every 30 seconds
    await this.processPendingJobs()
    
    const interval = setInterval(async () => {
      if (this.isRunning) {
        await this.processPendingJobs()
      } else {
        clearInterval(interval)
      }
    }, 30 * 1000) // Check every 30 seconds
  }

  /**
   * Stop the processor
   */
  stop() {
    console.log('[BulkProcessor] Stopping bulk processor')
    this.isRunning = false
  }

  /**
   * Process all pending bulk jobs
   */
  private async processPendingJobs() {
    try {
      const pendingJobs = await prisma.bulkJob.findMany({
        where: {
          status: 'pending',
        },
        orderBy: { createdAt: 'asc' },
        take: 5, // Process up to 5 jobs at once
      })

      console.log(`[BulkProcessor] Found ${pendingJobs.length} pending jobs`)

      for (const job of pendingJobs) {
        await this.processJob(job)
      }
    } catch (error) {
      console.error('[BulkProcessor] Error processing pending jobs:', error)
    }
  }

  /**
   * Process a single bulk job
   */
  private async processJob(job: BulkJob) {
    console.log(`[BulkProcessor] Processing job: ${job.id}`)

    try {
      // Mark job as processing
      await prisma.bulkJob.update({
        where: { id: job.id },
        data: {
          status: 'processing',
          startedAt: new Date(),
        },
      })

      // Download and extract ZIP file
      const files = await this.extractZipFile(job)

      // Create file records
      await this.createFileRecords(job.id, files)

      // Process each file
      await this.processFiles(job, files)

      // Create results ZIP
      const outputZipKey = await this.createResultsZip(job)

      // Mark job as completed
      await prisma.bulkJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          outputZipKey,
        },
      })

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId: job.createdById,
          workspaceId: job.workspaceId,
          action: 'completed',
          targetType: 'bulk_job',
          targetId: job.id,
          description: `Bulk processing job "${job.name}" completed`,
          metadata: {
            totalFiles: job.totalFiles,
            successfulFiles: job.successfulFiles,
            failedFiles: job.failedFiles,
          },
        },
      })

      console.log(`[BulkProcessor] Job ${job.id} completed successfully`)
    } catch (error) {
      console.error(`[BulkProcessor] Job ${job.id} failed:`, error)

      // Mark job as failed
      await prisma.bulkJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMsg: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    }
  }

  /**
   * Extract ZIP file and return list of files
   */
  private async extractZipFile(job: BulkJob): Promise<Array<{ name: string; content: string }>> {
    console.log(`[BulkProcessor] Extracting ZIP for job ${job.id}`)

    // In a real implementation, you would:
    // 1. Download the ZIP file from storage using job.inputZipKey
    // 2. Extract it using a ZIP library like 'yauzl' or 'node-stream-zip'
    // 3. Return the list of files with their content

    // Mock implementation
    const mockFiles = []
    for (let i = 1; i <= job.totalFiles; i++) {
      mockFiles.push({
        name: `file${i}.txt`,
        content: `This is the content of file ${i} from the ZIP archive.`,
      })
    }

    return mockFiles
  }

  /**
   * Create file records in the database
   */
  private async createFileRecords(bulkJobId: string, files: Array<{ name: string; content: string }>) {
    const fileRecords = files.map((file, index) => ({
      bulkJobId,
      fileName: file.name,
      status: 'pending',
      inputText: file.content,
      order: index + 1,
    }))

    await prisma.bulkJobFile.createMany({
      data: fileRecords,
    })
  }

  /**
   * Process all files in the job
   */
  private async processFiles(job: BulkJob, files: Array<{ name: string; content: string }>) {
    console.log(`[BulkProcessor] Processing ${files.length} files for job ${job.id}`)

    let successfulFiles = 0
    let failedFiles = 0

    for (const file of files) {
      try {
        const result = await this.processFile(job, file)
        
        await prisma.bulkJobFile.updateMany({
          where: {
            bulkJobId: job.id,
            fileName: file.name,
          },
          data: {
            status: 'completed',
            outputText: result.output,
            tokensUsed: result.tokensUsed,
            cost: result.cost,
          },
        })

        successfulFiles++
      } catch (error) {
        console.error(`[BulkProcessor] Failed to process file ${file.name}:`, error)

        await prisma.bulkJobFile.updateMany({
          where: {
            bulkJobId: job.id,
            fileName: file.name,
          },
          data: {
            status: 'failed',
            errorMsg: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        failedFiles++
      }

      // Update job progress
      await prisma.bulkJob.update({
        where: { id: job.id },
        data: {
          processedFiles: successfulFiles + failedFiles,
          successfulFiles,
          failedFiles,
        },
      })
    }
  }

  /**
   * Process a single file
   */
  private async processFile(
    job: BulkJob,
    file: { name: string; content: string }
  ): Promise<{ output: string; tokensUsed: number; cost: number }> {
    // In a real implementation, this would call your actual tool execution service
    // For now, we'll create a mock tool run

    const toolRun = await prisma.toolRun.create({
      data: {
        userId: job.createdById,
        toolId: job.toolId,
        inputText: file.content,
        status: 'completed',
        aiModelUsed: 'gpt-4',
        outputText: `Processed output for ${file.name} using ${job.toolId}:\n\n${file.content}\n\n[AI processing complete]`,
        tokensUsed: Math.floor(Math.random() * 200) + 50,
        cost: Math.random() * 0.01,
        completedAt: new Date(),
      },
    })

    return {
      output: toolRun.outputText || '',
      tokensUsed: toolRun.tokensUsed || 0,
      cost: toolRun.cost || 0,
    }
  }

  /**
   * Create results ZIP file
   */
  private async createResultsZip(job: BulkJob): Promise<string> {
    console.log(`[BulkProcessor] Creating results ZIP for job ${job.id}`)

    // Get all processed files
    const files = await prisma.bulkJobFile.findMany({
      where: { bulkJobId: job.id },
      orderBy: { order: 'asc' },
    })

    // In a real implementation, you would:
    // 1. Create a ZIP file with all the results
    // 2. Upload it to storage
    // 3. Return the storage key

    // Mock implementation
    const resultsContent = this.createResultsContent(job, files)
    
    const uploadResult = await uploadFile({
      file: Buffer.from(resultsContent, 'utf-8'),
      fileName: `${job.name}-results.zip`,
      contentType: 'application/zip',
      metadata: {
        bulkJobId: job.id,
        userId: job.createdById,
        type: 'bulk_output',
      },
    })

    return uploadResult.storageKey
  }

  /**
   * Create results content (mock ZIP)
   */
  private createResultsContent(job: BulkJob, files: BulkJobFile[]): string {
    let content = `Bulk Processing Results\n`
    content += `========================\n\n`
    content += `Job: ${job.name}\n`
    content += `Tool: ${job.toolId}\n`
    content += `Total Files: ${job.totalFiles}\n`
    content += `Successful: ${job.successfulFiles}\n`
    content += `Failed: ${job.failedFiles}\n`
    content += `Completed: ${new Date().toISOString()}\n\n`

    content += `File Results:\n`
    content += `=============\n\n`

    for (const file of files) {
      content += `File: ${file.fileName}\n`
      content += `Status: ${file.status}\n`
      if (file.outputText) {
        content += `Output:\n${file.outputText}\n`
      }
      if (file.errorMsg) {
        content += `Error: ${file.errorMsg}\n`
      }
      if (file.tokensUsed) {
        content += `Tokens: ${file.tokensUsed}\n`
      }
      if (file.cost) {
        content += `Cost: $${file.cost.toFixed(4)}\n`
      }
      content += `\n---\n\n`
    }

    return content
  }
}

/**
 * Create and start the bulk processor
 */
export function startBulkProcessor(): BulkProcessor {
  const processor = new BulkProcessor()
  processor.start()
  return processor
}

/**
 * CLI entry point for running as a standalone process
 */
if (require.main === module) {
  console.log('[BulkProcessor] Starting bulk processor process')
  
  const processor = startBulkProcessor()

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('[BulkProcessor] Received SIGINT, shutting down gracefully')
    processor.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('[BulkProcessor] Received SIGTERM, shutting down gracefully')
    processor.stop()
    process.exit(0)
  })
}
