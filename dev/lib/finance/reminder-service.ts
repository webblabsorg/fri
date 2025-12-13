/**
 * Invoice Reminder Service
 * AI-scheduled reminders with background sender job support
 */

import { prisma } from '@/lib/db'

export interface ReminderSchedule {
  reminderType: 'first' | 'second' | 'final' | 'custom'
  daysAfterDue: number
  emailSubject: string
  emailBody: string
}

const DEFAULT_REMINDER_SCHEDULES: ReminderSchedule[] = [
  {
    reminderType: 'first',
    daysAfterDue: 7,
    emailSubject: 'Payment Reminder: Invoice {invoiceNumber} is Past Due',
    emailBody: `Dear {clientName},

This is a friendly reminder that Invoice {invoiceNumber} for {amount} was due on {dueDate}.

Please remit payment at your earliest convenience.

If you have already sent payment, please disregard this notice.

Thank you for your business.

Best regards,
{organizationName}`,
  },
  {
    reminderType: 'second',
    daysAfterDue: 14,
    emailSubject: 'Second Notice: Invoice {invoiceNumber} - Payment Overdue',
    emailBody: `Dear {clientName},

This is a second reminder that Invoice {invoiceNumber} for {amount} is now {daysOverdue} days past due.

Please arrange payment immediately to avoid any late fees or service interruptions.

If you are experiencing difficulties, please contact us to discuss payment arrangements.

Best regards,
{organizationName}`,
  },
  {
    reminderType: 'final',
    daysAfterDue: 30,
    emailSubject: 'Final Notice: Invoice {invoiceNumber} - Immediate Payment Required',
    emailBody: `Dear {clientName},

FINAL NOTICE: Invoice {invoiceNumber} for {amount} is now {daysOverdue} days past due.

Immediate payment is required to avoid further action. Please contact us immediately if you need to discuss payment options.

Best regards,
{organizationName}`,
  },
]

/**
 * Schedule reminders for an invoice based on AI analysis or default schedule
 */
export async function scheduleInvoiceReminders(
  invoiceId: string,
  options?: {
    customSchedule?: ReminderSchedule[]
    aiSuggestedSchedule?: boolean
  }
): Promise<{ scheduled: number; reminders: Array<{ id: string; scheduledFor: Date; reminderType: string }> }> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      organization: true,
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  // Cancel any existing scheduled reminders
  await prisma.paymentReminder.updateMany({
    where: { invoiceId, status: 'scheduled' },
    data: { status: 'cancelled' },
  })

  const schedules = options?.customSchedule || DEFAULT_REMINDER_SCHEDULES
  const clientEmail = invoice.client.billingEmail || invoice.client.email

  if (!clientEmail) {
    throw new Error('Client has no email address')
  }

  const createdReminders: Array<{ id: string; scheduledFor: Date; reminderType: string }> = []

  for (const schedule of schedules) {
    const scheduledFor = new Date(invoice.dueDate)
    scheduledFor.setDate(scheduledFor.getDate() + schedule.daysAfterDue)

    // Don't schedule reminders in the past
    if (scheduledFor <= new Date()) {
      continue
    }

    // Replace placeholders in subject and body
    const daysOverdue = schedule.daysAfterDue
    const replacements: Record<string, string> = {
      '{invoiceNumber}': invoice.invoiceNumber,
      '{clientName}': invoice.client.displayName,
      '{amount}': `${invoice.currency} ${Number(invoice.balanceDue).toFixed(2)}`,
      '{dueDate}': invoice.dueDate.toLocaleDateString(),
      '{daysOverdue}': String(daysOverdue),
      '{organizationName}': invoice.organization.name,
    }

    let emailSubject = schedule.emailSubject
    let emailBody = schedule.emailBody

    for (const [placeholder, value] of Object.entries(replacements)) {
      emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), value)
      emailBody = emailBody.replace(new RegExp(placeholder, 'g'), value)
    }

    const reminder = await prisma.paymentReminder.create({
      data: {
        invoiceId,
        reminderType: schedule.reminderType,
        scheduledFor,
        emailTo: clientEmail,
        emailSubject,
        emailBody,
        status: 'scheduled',
      },
    })

    createdReminders.push({
      id: reminder.id,
      scheduledFor: reminder.scheduledFor,
      reminderType: reminder.reminderType,
    })
  }

  return {
    scheduled: createdReminders.length,
    reminders: createdReminders,
  }
}

/**
 * AI-suggested reminder schedule based on invoice and client history
 */
export async function getAiSuggestedReminderSchedule(
  invoiceId: string
): Promise<ReminderSchedule[]> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  // Get client's payment history
  const clientPayments = await prisma.payment.findMany({
    where: { clientId: invoice.clientId },
    include: { invoice: true },
    orderBy: { paymentDate: 'desc' },
    take: 10,
  })

  // Calculate average days to pay
  const paymentDelays = clientPayments
    .filter((p) => p.invoice)
    .map((p) => {
      const dueDate = p.invoice!.dueDate
      const paymentDate = p.paymentDate
      return Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    })

  const avgDelay = paymentDelays.length > 0
    ? paymentDelays.reduce((a, b) => a + b, 0) / paymentDelays.length
    : 0

  // Adjust schedule based on client behavior
  if (avgDelay <= 0) {
    // Client typically pays on time - use gentler, later reminders
    return [
      { ...DEFAULT_REMINDER_SCHEDULES[0], daysAfterDue: 10 },
      { ...DEFAULT_REMINDER_SCHEDULES[1], daysAfterDue: 21 },
      { ...DEFAULT_REMINDER_SCHEDULES[2], daysAfterDue: 45 },
    ]
  } else if (avgDelay <= 14) {
    // Client pays slightly late - use standard schedule
    return DEFAULT_REMINDER_SCHEDULES
  } else {
    // Client often pays very late - use more aggressive schedule
    return [
      { ...DEFAULT_REMINDER_SCHEDULES[0], daysAfterDue: 3 },
      { ...DEFAULT_REMINDER_SCHEDULES[1], daysAfterDue: 7 },
      { ...DEFAULT_REMINDER_SCHEDULES[2], daysAfterDue: 14 },
    ]
  }
}

/**
 * Get due reminders that need to be sent
 */
export async function getDueReminders(): Promise<Array<{
  id: string
  invoiceId: string
  reminderType: string
  emailTo: string
  emailSubject: string
  emailBody: string
  invoice: {
    invoiceNumber: string
    organizationId: string
  }
}>> {
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

  // Filter out reminders for paid invoices
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
      },
    }))
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(reminderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const reminder = await tx.paymentReminder.update({
      where: { id: reminderId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    })

    // Update invoice reminder tracking
    await tx.invoice.update({
      where: { id: reminder.invoiceId },
      data: {
        lastReminderAt: new Date(),
        reminderCount: { increment: 1 },
      },
    })
  })
}

/**
 * Cancel all scheduled reminders for an invoice
 */
export async function cancelInvoiceReminders(invoiceId: string): Promise<number> {
  const result = await prisma.paymentReminder.updateMany({
    where: { invoiceId, status: 'scheduled' },
    data: { status: 'cancelled' },
  })

  return result.count
}

/**
 * Get reminder history for an invoice
 */
export async function getInvoiceReminderHistory(invoiceId: string) {
  return prisma.paymentReminder.findMany({
    where: { invoiceId },
    orderBy: { scheduledFor: 'asc' },
  })
}
