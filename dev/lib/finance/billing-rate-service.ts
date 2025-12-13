import { prisma } from '@/lib/db'

export interface ResolvedRate {
  rate: number
  currency: string
  source: 'matter' | 'client' | 'user' | 'matter_type' | 'default'
  billingRateId?: string
}

export interface RateResolutionContext {
  organizationId: string
  userId: string
  matterId?: string
  clientId?: string
  matterType?: string
  date?: Date
}

/**
 * Resolve the billing rate for a time entry based on hierarchy:
 * 1. Matter-specific rate (highest priority)
 * 2. Client-specific rate
 * 3. User-specific rate
 * 4. Matter type rate
 * 5. Organization default rate (lowest priority)
 */
export async function resolveBillingRate(ctx: RateResolutionContext): Promise<ResolvedRate | null> {
  const effectiveDate = ctx.date || new Date()

  const baseWhere = {
    organizationId: ctx.organizationId,
    effectiveDate: { lte: effectiveDate },
    OR: [
      { expirationDate: null },
      { expirationDate: { gte: effectiveDate } },
    ],
  }

  // 1. Matter-specific rate (user + matter)
  if (ctx.matterId) {
    const matterRate = await prisma.billingRate.findFirst({
      where: {
        ...baseWhere,
        userId: ctx.userId,
        matterId: ctx.matterId,
      },
      orderBy: { effectiveDate: 'desc' },
    })

    if (matterRate) {
      return {
        rate: Number(matterRate.rate),
        currency: matterRate.currency,
        source: 'matter',
        billingRateId: matterRate.id,
      }
    }
  }

  // 2. Client-specific rate (user + client)
  if (ctx.clientId) {
    const clientRate = await prisma.billingRate.findFirst({
      where: {
        ...baseWhere,
        userId: ctx.userId,
        clientId: ctx.clientId,
        matterId: null,
      },
      orderBy: { effectiveDate: 'desc' },
    })

    if (clientRate) {
      return {
        rate: Number(clientRate.rate),
        currency: clientRate.currency,
        source: 'client',
        billingRateId: clientRate.id,
      }
    }
  }

  // 3. User-specific rate (user only, no client/matter)
  const userRate = await prisma.billingRate.findFirst({
    where: {
      ...baseWhere,
      userId: ctx.userId,
      clientId: null,
      matterId: null,
      matterType: null,
    },
    orderBy: { effectiveDate: 'desc' },
  })

  if (userRate) {
    return {
      rate: Number(userRate.rate),
      currency: userRate.currency,
      source: 'user',
      billingRateId: userRate.id,
    }
  }

  // 4. Matter type rate
  if (ctx.matterType) {
    const matterTypeRate = await prisma.billingRate.findFirst({
      where: {
        ...baseWhere,
        userId: null,
        matterType: ctx.matterType,
      },
      orderBy: { effectiveDate: 'desc' },
    })

    if (matterTypeRate) {
      return {
        rate: Number(matterTypeRate.rate),
        currency: matterTypeRate.currency,
        source: 'matter_type',
        billingRateId: matterTypeRate.id,
      }
    }
  }

  // 5. Organization default rate
  const defaultRate = await prisma.billingRate.findFirst({
    where: {
      ...baseWhere,
      isDefault: true,
      userId: null,
      clientId: null,
      matterId: null,
    },
    orderBy: { effectiveDate: 'desc' },
  })

  if (defaultRate) {
    return {
      rate: Number(defaultRate.rate),
      currency: defaultRate.currency,
      source: 'default',
      billingRateId: defaultRate.id,
    }
  }

  return null
}

/**
 * Resolve billing rate for a time entry, fetching matter/client info as needed
 */
export async function resolveTimeEntryRate(
  organizationId: string,
  userId: string,
  matterId: string,
  date?: Date
): Promise<ResolvedRate | null> {
  // Fetch matter to get client and matter type
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, organizationId },
    select: { clientId: true, matterType: true },
  })

  if (!matter) {
    return null
  }

  return resolveBillingRate({
    organizationId,
    userId,
    matterId,
    clientId: matter.clientId,
    matterType: matter.matterType || undefined,
    date,
  })
}

/**
 * Get unbilled time entries (WIP) for a matter, with resolved rates
 */
export async function getWipTimeEntries(
  organizationId: string,
  matterId: string
): Promise<Array<{
  id: string
  userId: string
  date: Date
  hours: number
  rate: number
  amount: number
  description: string
  utbmsTaskCode: string | null
  utbmsActivityCode: string | null
  resolvedRate?: ResolvedRate
}>> {
  const entries = await prisma.timeEntry.findMany({
    where: {
      organizationId,
      matterId,
      isBillable: true,
      isBilled: false,
      status: 'approved',
    },
    orderBy: { date: 'asc' },
  })

  // Resolve rates for each entry
  const matter = await prisma.matter.findFirst({
    where: { id: matterId, organizationId },
    select: { clientId: true, matterType: true },
  })

  const results = await Promise.all(
    entries.map(async (entry) => {
      const resolvedRate = await resolveBillingRate({
        organizationId,
        userId: entry.userId,
        matterId,
        clientId: matter?.clientId,
        matterType: matter?.matterType || undefined,
        date: entry.date,
      })

      // Use resolved rate if available and different from stored rate
      const effectiveRate = resolvedRate?.rate ?? Number(entry.rate)
      const effectiveAmount = Number(entry.hours) * effectiveRate

      return {
        id: entry.id,
        userId: entry.userId,
        date: entry.date,
        hours: Number(entry.hours),
        rate: effectiveRate,
        amount: effectiveAmount,
        description: entry.description,
        utbmsTaskCode: entry.utbmsTaskCode,
        utbmsActivityCode: entry.utbmsActivityCode,
        resolvedRate: resolvedRate || undefined,
      }
    })
  )

  return results
}

/**
 * Generate invoice line items from WIP time entries
 */
export async function generateInvoiceLineItemsFromWip(
  organizationId: string,
  matterId: string
): Promise<Array<{
  itemType: 'time_entry'
  description: string
  quantity: number
  rate: number
  utbmsTaskCode?: string
  utbmsActivityCode?: string
  timeEntryId: string
  serviceDate: Date
}>> {
  const wipEntries = await getWipTimeEntries(organizationId, matterId)

  return wipEntries.map((entry) => ({
    itemType: 'time_entry' as const,
    description: entry.description,
    quantity: entry.hours,
    rate: entry.rate,
    utbmsTaskCode: entry.utbmsTaskCode || undefined,
    utbmsActivityCode: entry.utbmsActivityCode || undefined,
    timeEntryId: entry.id,
    serviceDate: entry.date,
  }))
}
