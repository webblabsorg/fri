/**
 * Send Launch Announcement Emails
 * 
 * This script sends launch announcement emails to all waitlist subscribers.
 * Run with: npx ts-node prod/scripts/send-launch-emails.ts
 * 
 * Options:
 *   --dry-run    Preview without sending
 *   --limit=N    Only send to first N subscribers
 *   --batch=N    Send in batches of N (default: 50)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined
const batchArg = args.find(a => a.startsWith('--batch='))
const batchSize = batchArg ? parseInt(batchArg.split('=')[1]) : 50

async function sendLaunchEmails() {
  console.log('🚀 Frith AI Launch Email Sender')
  console.log('================================')
  console.log('')

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No emails will be sent')
    console.log('')
  }

  // Get pending waitlist entries
  const where = { status: 'pending' }
  const total = await prisma.waitlistEntry.count({ where })
  
  console.log(`📧 Found ${total} pending waitlist entries`)
  
  if (limit) {
    console.log(`📊 Limiting to ${limit} entries`)
  }

  const entries = await prisma.waitlistEntry.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'asc' },
  })

  console.log(`📨 Processing ${entries.length} entries in batches of ${batchSize}`)
  console.log('')

  let sent = 0
  let failed = 0

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize)
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(entries.length / batchSize)}`)

    for (const entry of batch) {
      try {
        if (dryRun) {
          console.log(`  [DRY RUN] Would send to: ${entry.email}`)
        } else {
          // Import dynamically to avoid issues when running outside Next.js
          const { sendWaitlistInviteEmail } = await import('../../dev/lib/email')
          
          const success = await sendWaitlistInviteEmail(entry.email, entry.name || undefined)
          
          if (success) {
            // Update status
            await prisma.waitlistEntry.update({
              where: { id: entry.id },
              data: { status: 'invited', invitedAt: new Date() },
            })
            console.log(`  ✓ Sent to: ${entry.email}`)
            sent++
          } else {
            console.log(`  ✗ Failed: ${entry.email}`)
            failed++
          }
        }
      } catch (error) {
        console.log(`  ✗ Error for ${entry.email}: ${error}`)
        failed++
      }
    }

    // Rate limiting - wait between batches
    if (i + batchSize < entries.length && !dryRun) {
      console.log('  ⏳ Waiting 2 seconds before next batch...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log('')
  console.log('================================')
  console.log('📊 Summary')
  console.log('================================')
  console.log(`✓ Sent: ${sent}`)
  console.log(`✗ Failed: ${failed}`)
  console.log(`📧 Total processed: ${entries.length}`)

  await prisma.$disconnect()
}

sendLaunchEmails().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
