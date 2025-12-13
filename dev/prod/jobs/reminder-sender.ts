/**
 * Payment Reminder Sender Background Job
 * Processes due reminders and sends emails
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ReminderToSend {
  id: string
  invoiceId: string
  reminderType: string
  emailTo: string
  emailSubject: string
  emailBody: string
  invoice: {
    invoiceNumber: string
    organizationId: string
    status: string
    balanceDue: number
  }
}

async function getDueReminders(): Promise<ReminderToSend[]> {
  const now = new Date()

  const reminders = await prisma.paymentReminder.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: { lte: now },
    },
    include: {
      invoice: {
        select: {
          invoiceNumber: true,
          organizationId: true,
          status: true,
          balanceDue: true,
        },
      },
    },
  })

  return reminders
    .filter((r) => r.invoice.status !== 'paid' && Number(r.invoice.balanceDue) > 0)
    .map((r) => ({
      id: r.id,
      invoiceId: r.invoiceId,
      reminderType: r.reminderType,
      emailTo: r.emailTo,
      emailSubject: r.emailSubject,
      emailBody: r.emailBody,
      invoice: {
        invoiceNumber: r.invoice.invoiceNumber,
        organizationId: r.invoice.organizationId,
        status: r.invoice.status,
        balanceDue: Number(r.invoice.balanceDue),
      },
    }))
}

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  // In production, integrate with email service (Resend, SendGrid, etc.)
  // For now, log the email
  console.log(`[ReminderSender] Sending email to: ${to}`)
  console.log(`[ReminderSender] Subject: ${subject}`)
  console.log(`[ReminderSender] Body preview: ${body.substring(0, 100)}...`)

  // TODO: Implement actual email sending
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'billing@yourdomain.com',
  //   to,
  //   subject,
  //   text: body,
  // })

  return true
}

async function markReminderSent(reminderId: string, invoiceId: string): Promise<void> {
  await prisma.$transaction([
    prisma.paymentReminder.update({
      where: { id: reminderId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    }),
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        lastReminderAt: new Date(),
        reminderCount: { increment: 1 },
      },
    }),
  ])
}

async function markReminderFailed(reminderId: string, error: string): Promise<void> {
  // Don't mark as failed, keep as scheduled for retry
  // But log the error
  console.error(`[ReminderSender] Failed to send reminder ${reminderId}: ${error}`)
}

export async function processReminders(): Promise<{
  processed: number
  sent: number
  failed: number
  skipped: number
}> {
  console.log('[ReminderSender] Starting reminder processing')

  const reminders = await getDueReminders()
  console.log(`[ReminderSender] Found ${reminders.length} due reminders`)

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const reminder of reminders) {
    // Skip if invoice is already paid
    if (reminder.invoice.status === 'paid' || reminder.invoice.balanceDue <= 0) {
      console.log(`[ReminderSender] Skipping reminder ${reminder.id} - invoice already paid`)
      await prisma.paymentReminder.update({
        where: { id: reminder.id },
        data: { status: 'cancelled' },
      })
      skipped++
      continue
    }

    try {
      const success = await sendEmail(
        reminder.emailTo,
        reminder.emailSubject,
        reminder.emailBody
      )

      if (success) {
        await markReminderSent(reminder.id, reminder.invoiceId)
        sent++
        console.log(`[ReminderSender] Sent reminder ${reminder.id} for invoice ${reminder.invoice.invoiceNumber}`)
      } else {
        await markReminderFailed(reminder.id, 'Email send returned false')
        failed++
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await markReminderFailed(reminder.id, errorMessage)
      failed++
    }
  }

  console.log(`[ReminderSender] Completed: ${sent} sent, ${failed} failed, ${skipped} skipped`)

  return {
    processed: reminders.length,
    sent,
    failed,
    skipped,
  }
}

export async function runReminderJob(): Promise<void> {
  try {
    const result = await processReminders()
    console.log('[ReminderSender] Job completed:', result)
  } catch (error) {
    console.error('[ReminderSender] Job failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// CLI entry point
if (require.main === module) {
  console.log('[ReminderSender] Starting reminder sender job')
  runReminderJob()
    .then(() => {
      console.log('[ReminderSender] Job finished successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('[ReminderSender] Job failed:', error)
      process.exit(1)
    })
}
