import { prisma } from '../db'

// Web Search quota limits per tier (from AI-TOOL-241 spec)
const WEB_SEARCH_QUOTAS = {
  free: {
    monthlySearches: 0,
    deepSearches: 0,
    monitors: 0,
  },
  starter: {
    monthlySearches: 50,
    deepSearches: 10,
    monitors: 1,
  },
  pro: {
    monthlySearches: 500,
    deepSearches: 100,
    monitors: 10,
  },
  professional: {
    monthlySearches: 500,
    deepSearches: 100,
    monitors: 10,
  },
  advanced: {
    monthlySearches: 2000,
    deepSearches: 500,
    monitors: 50,
  },
  enterprise: {
    monthlySearches: Infinity,
    deepSearches: Infinity,
    monitors: Infinity,
  },
} as const

type TierKey = keyof typeof WEB_SEARCH_QUOTAS

function normalizeTierKey(tier: string | null | undefined): TierKey {
  if (!tier) return 'free'
  const normalized = tier.toLowerCase()
  if (normalized in WEB_SEARCH_QUOTAS) {
    return normalized as TierKey
  }
  return 'free'
}

export interface QuotaCheckResult {
  allowed: boolean
  reason?: string
  usage?: {
    searches: number
    deepSearches: number
    monitors: number
  }
  limits?: {
    monthlySearches: number
    deepSearches: number
    monitors: number
  }
}

export async function checkWebSearchQuota(
  userId: string,
  subscriptionTier: string | null | undefined,
  searchMode: 'quick' | 'deep' | 'targeted' | 'monitor'
): Promise<QuotaCheckResult> {
  const tier = normalizeTierKey(subscriptionTier)
  const limits = WEB_SEARCH_QUOTAS[tier]

  // Free tier cannot use web search
  if (tier === 'free') {
    return {
      allowed: false,
      reason: 'Web Search requires a paid subscription (Starter or higher)',
      limits: {
        monthlySearches: 0,
        deepSearches: 0,
        monitors: 0,
      },
    }
  }

  // Get current month's usage
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [searchCount, deepSearchCount, monitorCount] = await Promise.all([
    prisma.webSearchQuery.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.webSearchQuery.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        searchMode: { in: ['deep', 'targeted'] },
      },
    }),
    prisma.webSearchMonitor.count({
      where: {
        userId,
        isActive: true,
      },
    }),
  ])

  const usage = {
    searches: searchCount,
    deepSearches: deepSearchCount,
    monitors: monitorCount,
  }

  // Check limits based on search mode
  if (searchMode === 'deep' || searchMode === 'targeted') {
    if (deepSearchCount >= limits.deepSearches) {
      return {
        allowed: false,
        reason: `Monthly deep search limit reached (${limits.deepSearches} deep searches)`,
        usage,
        limits: {
          monthlySearches: limits.monthlySearches,
          deepSearches: limits.deepSearches,
          monitors: limits.monitors,
        },
      }
    }
  }

  if (searchCount >= limits.monthlySearches) {
    return {
      allowed: false,
      reason: `Monthly search limit reached (${limits.monthlySearches} searches)`,
      usage,
      limits: {
        monthlySearches: limits.monthlySearches,
        deepSearches: limits.deepSearches,
        monitors: limits.monitors,
      },
    }
  }

  return {
    allowed: true,
    usage,
    limits: {
      monthlySearches: limits.monthlySearches,
      deepSearches: limits.deepSearches,
      monitors: limits.monitors,
    },
  }
}

export async function checkMonitorQuota(
  userId: string,
  subscriptionTier: string | null | undefined
): Promise<QuotaCheckResult> {
  const tier = normalizeTierKey(subscriptionTier)
  const limits = WEB_SEARCH_QUOTAS[tier]

  if (tier === 'free') {
    return {
      allowed: false,
      reason: 'Search monitors require a paid subscription (Starter or higher)',
    }
  }

  const monitorCount = await prisma.webSearchMonitor.count({
    where: {
      userId,
      isActive: true,
    },
  })

  if (monitorCount >= limits.monitors) {
    return {
      allowed: false,
      reason: `Monitor limit reached (${limits.monitors} active monitors)`,
      usage: { searches: 0, deepSearches: 0, monitors: monitorCount },
      limits: {
        monthlySearches: limits.monthlySearches,
        deepSearches: limits.deepSearches,
        monitors: limits.monitors,
      },
    }
  }

  return {
    allowed: true,
    usage: { searches: 0, deepSearches: 0, monitors: monitorCount },
    limits: {
      monthlySearches: limits.monthlySearches,
      deepSearches: limits.deepSearches,
      monitors: limits.monitors,
    },
  }
}

export async function getWebSearchUsageStats(
  userId: string,
  subscriptionTier: string | null | undefined
) {
  const tier = normalizeTierKey(subscriptionTier)
  const limits = WEB_SEARCH_QUOTAS[tier]

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [searchCount, deepSearchCount, monitorCount] = await Promise.all([
    prisma.webSearchQuery.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.webSearchQuery.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        searchMode: { in: ['deep', 'targeted'] },
      },
    }),
    prisma.webSearchMonitor.count({
      where: {
        userId,
        isActive: true,
      },
    }),
  ])

  return {
    tier,
    usage: {
      searches: searchCount,
      deepSearches: deepSearchCount,
      monitors: monitorCount,
    },
    limits: {
      monthlySearches: limits.monthlySearches,
      deepSearches: limits.deepSearches,
      monitors: limits.monitors,
    },
    remaining: {
      searches: Math.max(0, limits.monthlySearches - searchCount),
      deepSearches: Math.max(0, limits.deepSearches - deepSearchCount),
      monitors: Math.max(0, limits.monitors - monitorCount),
    },
  }
}
