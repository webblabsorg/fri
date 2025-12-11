/**
 * Phase 11: Apply Data Retention Policies
 * 
 * This script applies data retention policies for organizations,
 * deleting data older than the configured retention periods.
 * 
 * Run daily via cron: 0 2 * * * (2 AM daily)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface RetentionStats {
  organizationId: string
  toolRunsDeleted: number
  auditLogsDeleted: number
  documentsDeleted: number
}

async function applyDataRetention(dryRun: boolean = false): Promise<void> {
  console.log(`Applying data retention policies${dryRun ? ' (DRY RUN)' : ''}`)
  console.log('='.repeat(50))

  // Get all organizations with retention policies that have autoDelete enabled
  const policies = await prisma.dataRetentionPolicy.findMany({
    where: { autoDelete: true },
  })

  console.log(`Found ${policies.length} organizations with auto-delete enabled`)

  const stats: RetentionStats[] = []

  for (const policy of policies) {
    console.log(`\nProcessing organization: ${policy.organizationId}`)
    
    const orgStats: RetentionStats = {
      organizationId: policy.organizationId,
      toolRunsDeleted: 0,
      auditLogsDeleted: 0,
      documentsDeleted: 0,
    }

    try {
      // Calculate cutoff dates
      const toolRunsCutoff = new Date()
      toolRunsCutoff.setDate(toolRunsCutoff.getDate() - policy.toolRunsRetention)

      const auditLogsCutoff = new Date()
      auditLogsCutoff.setDate(auditLogsCutoff.getDate() - policy.auditLogsRetention)

      const documentsCutoff = new Date()
      documentsCutoff.setDate(documentsCutoff.getDate() - policy.documentsRetention)

      // Delete old tool runs
      const toolRunsToDelete = await prisma.toolRun.count({
        where: {
          createdAt: { lt: toolRunsCutoff },
          user: {
            organizationMembers: {
              some: { organizationId: policy.organizationId },
            },
          },
        },
      })

      if (!dryRun && toolRunsToDelete > 0) {
        // Get user IDs for this org
        const orgMembers = await prisma.organizationMember.findMany({
          where: { organizationId: policy.organizationId },
          select: { userId: true },
        })
        const userIds = orgMembers.map(m => m.userId)

        await prisma.toolRun.deleteMany({
          where: {
            createdAt: { lt: toolRunsCutoff },
            userId: { in: userIds },
          },
        })
      }
      orgStats.toolRunsDeleted = toolRunsToDelete
      console.log(`  Tool runs to delete: ${toolRunsToDelete} (cutoff: ${toolRunsCutoff.toISOString().split('T')[0]})`)

      // Delete old enhanced audit logs
      const auditLogsToDelete = await prisma.enhancedAuditLog.count({
        where: {
          organizationId: policy.organizationId,
          createdAt: { lt: auditLogsCutoff },
        },
      })

      if (!dryRun && auditLogsToDelete > 0) {
        await prisma.enhancedAuditLog.deleteMany({
          where: {
            organizationId: policy.organizationId,
            createdAt: { lt: auditLogsCutoff },
          },
        })
      }
      orgStats.auditLogsDeleted = auditLogsToDelete
      console.log(`  Audit logs to delete: ${auditLogsToDelete} (cutoff: ${auditLogsCutoff.toISOString().split('T')[0]})`)

      // Delete old documents (project documents)
      const documentsToDelete = await prisma.projectDocument.count({
        where: {
          createdAt: { lt: documentsCutoff },
          project: {
            workspace: {
              organization: { id: policy.organizationId },
            },
          },
        },
      })

      if (!dryRun && documentsToDelete > 0) {
        // Get project IDs for this org
        const projects = await prisma.project.findMany({
          where: {
            workspace: {
              organization: { id: policy.organizationId },
            },
          },
          select: { id: true },
        })
        const projectIds = projects.map(p => p.id)

        await prisma.projectDocument.deleteMany({
          where: {
            createdAt: { lt: documentsCutoff },
            projectId: { in: projectIds },
          },
        })
      }
      orgStats.documentsDeleted = documentsToDelete
      console.log(`  Documents to delete: ${documentsToDelete} (cutoff: ${documentsCutoff.toISOString().split('T')[0]})`)

      // Update last cleanup timestamp
      if (!dryRun) {
        await prisma.dataRetentionPolicy.update({
          where: { id: policy.id },
          data: { lastCleanupAt: new Date() },
        })
      }

      stats.push(orgStats)
    } catch (error) {
      console.error(`  Error processing organization ${policy.organizationId}:`, error)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('SUMMARY')
  console.log('='.repeat(50))
  
  const totalToolRuns = stats.reduce((sum, s) => sum + s.toolRunsDeleted, 0)
  const totalAuditLogs = stats.reduce((sum, s) => sum + s.auditLogsDeleted, 0)
  const totalDocuments = stats.reduce((sum, s) => sum + s.documentsDeleted, 0)

  console.log(`Organizations processed: ${stats.length}`)
  console.log(`Tool runs ${dryRun ? 'to delete' : 'deleted'}: ${totalToolRuns}`)
  console.log(`Audit logs ${dryRun ? 'to delete' : 'deleted'}: ${totalAuditLogs}`)
  console.log(`Documents ${dryRun ? 'to delete' : 'deleted'}: ${totalDocuments}`)

  if (dryRun) {
    console.log('\nThis was a dry run. No data was actually deleted.')
    console.log('Run without --dry-run to apply retention policies.')
  }
}

// Run if called directly
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

applyDataRetention(dryRun)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
