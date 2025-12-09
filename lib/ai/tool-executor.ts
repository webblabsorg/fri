import { generateAIResponse, AIGenerateOptions, AIGenerateResult, SubscriptionTier, normalizeTier } from './model-service'
import { buildLegalPrompt, LegalPromptType, PromptContext } from './prompt-builder'
import { prisma } from '../db'

export interface ToolExecutionOptions {
  toolType: LegalPromptType
  context: PromptContext
  userId: string
  toolId: string
  tier: SubscriptionTier
}

export interface ToolExecutionResult extends AIGenerateResult {
  executionId: string
  success: boolean
  error?: string
}

// Execute an AI tool
export async function executeAITool(
  options: ToolExecutionOptions
): Promise<ToolExecutionResult> {
  const { toolType, context, userId, toolId, tier } = options

  try {
    // Get user's subscription tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Normalize tier from database value
    const userTier = normalizeTier(user.subscriptionTier)
    
    // Check if user's tier allows this tool
    if (!isToolAllowedForTier(userTier, tier)) {
      throw new Error('Tool not available for your subscription tier')
    }

    // Check usage quota
    const quotaCheck = await checkUsageQuota(userId, userTier)
    if (!quotaCheck.allowed) {
      throw new Error(quotaCheck.reason || 'Usage quota exceeded')
    }

    // Build prompt from template and context
    const messages = buildLegalPrompt(toolType, context)

    // Generate AI response
    const result = await generateAIResponse({
      messages,
      tier: userTier,
      userId,
      toolId,
    })

    // Create tool run record
    const toolRun = await prisma.toolRun.create({
      data: {
        userId,
        toolId,
        inputText: JSON.stringify(context),
        outputText: result.content,
        tokensUsed: result.tokensUsed.total,
        cost: result.cost,
        aiModelUsed: result.model,
        status: 'completed',
        completedAt: new Date(),
      },
    })

    // Update user's monthly usage
    await updateUsageStats(userId, result.tokensUsed.total, result.cost)

    return {
      ...result,
      executionId: toolRun.id,
      success: true,
    }
  } catch (error) {
    console.error('Tool execution error:', error)

    // Record failed execution
    try {
      const toolRun = await prisma.toolRun.create({
        data: {
          userId: options.userId,
          toolId: options.toolId,
          inputText: JSON.stringify(options.context),
          outputText: '',
          tokensUsed: 0,
          cost: 0,
          aiModelUsed: '',
          status: 'failed',
          errorMsg: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      })

      return {
        content: '',
        tokensUsed: { input: 0, output: 0, total: 0 },
        cost: 0,
        model: '',
        provider: 'anthropic',
        executionId: toolRun.id,
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      }
    } catch (dbError) {
      // If we can't even log the error, return a basic error result
      return {
        content: '',
        tokensUsed: { input: 0, output: 0, total: 0 },
        cost: 0,
        model: '',
        provider: 'anthropic',
        executionId: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      }
    }
  }
}

// Check if a tool is allowed for a subscription tier
function isToolAllowedForTier(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    FREE: 0,
    PRO: 1,
    PROFESSIONAL: 2,
    ENTERPRISE: 3,
  }

  return tierHierarchy[userTier] >= tierHierarchy[requiredTier]
}

// Check usage quota for a user
async function checkUsageQuota(
  userId: string,
  tier: SubscriptionTier
): Promise<{ allowed: boolean; reason?: string }> {
  // Get current month's usage
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const usage = await prisma.toolRun.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
      status: 'completed',
    },
    _count: true,
    _sum: {
      tokensUsed: true,
      cost: true,
    },
  })

  const quotas = getQuotasForTier(tier)

  // Check request limit
  if (usage._count >= quotas.maxRequests) {
    return {
      allowed: false,
      reason: `Monthly request limit reached (${quotas.maxRequests} requests)`,
    }
  }

  // Check token limit
  const tokensUsed = usage._sum.tokensUsed || 0
  if (tokensUsed >= quotas.maxTokens) {
    return {
      allowed: false,
      reason: `Monthly token limit reached (${quotas.maxTokens} tokens)`,
    }
  }

  // Check cost limit
  const costUsed = usage._sum.cost || 0
  if (costUsed >= quotas.maxCost) {
    return {
      allowed: false,
      reason: `Monthly cost limit reached ($${quotas.maxCost})`,
    }
  }

  return { allowed: true }
}

// Get quotas for a subscription tier
function getQuotasForTier(tier: SubscriptionTier) {
  const quotas: Record<SubscriptionTier, { maxRequests: number; maxTokens: number; maxCost: number }> = {
    FREE: {
      maxRequests: 50, // 50 requests per month
      maxTokens: 100000, // 100k tokens per month
      maxCost: 0, // Free tier
    },
    PRO: {
      maxRequests: 1000, // 1000 requests per month
      maxTokens: 5000000, // 5M tokens per month
      maxCost: 100, // $100 per month
    },
    PROFESSIONAL: {
      maxRequests: 5000, // 5000 requests per month
      maxTokens: 20000000, // 20M tokens per month
      maxCost: 500, // $500 per month
    },
    ENTERPRISE: {
      maxRequests: Infinity, // Unlimited
      maxTokens: Infinity, // Unlimited
      maxCost: Infinity, // Unlimited
    },
  }

  return quotas[tier]
}

// Update user's monthly usage statistics
async function updateUsageStats(
  _userId: string,
  _tokens: number,
  _cost: number
): Promise<void> {
  // This could be expanded to track detailed usage metrics
  // For now, the toolRun records serve as the usage log
  // No additional updates needed at this time
}

// Get user's current usage stats
export async function getUserUsageStats(userId: string) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const usage = await prisma.toolRun.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
      status: 'completed',
    },
    _count: true,
    _sum: {
      tokensUsed: true,
      cost: true,
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  })

  const tier = normalizeTier(user?.subscriptionTier)
  const quotas = getQuotasForTier(tier)

  return {
    tier,
    currentPeriod: {
      start: startOfMonth,
      end: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0),
    },
    usage: {
      requests: usage._count,
      tokens: usage._sum.tokensUsed || 0,
      cost: usage._sum.cost || 0,
    },
    quotas,
    remaining: {
      requests: Math.max(0, quotas.maxRequests - usage._count),
      tokens: Math.max(0, quotas.maxTokens - (usage._sum.tokensUsed || 0)),
      cost: Math.max(0, quotas.maxCost - (usage._sum.cost || 0)),
    },
  }
}

// Get tool execution history
export async function getToolHistory(
  userId: string,
  limit: number = 10,
  offset: number = 0
) {
  const history = await prisma.toolRun.findMany({
    where: { userId },
    include: {
      tool: {
        select: {
          name: true,
          slug: true,
          category: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })

  const total = await prisma.toolRun.count({
    where: { userId },
  })

  return {
    history,
    total,
    limit,
    offset,
  }
}
