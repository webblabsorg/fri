import { prisma } from '@/lib/db'

/**
 * Optimized database queries with proper indexes and field selection
 */

export const optimizedQueries = {
  /**
   * Get user projects with minimal fields
   */
  async getUserProjectsSummary(userId: string) {
    return prisma.project.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            toolRuns: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50, // Limit results
    })
  },

  /**
   * Get user templates with pagination
   */
  async getUserTemplates(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          usageCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.template.count({ where: { userId } }),
    ])

    return {
      templates,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    }
  },

  /**
   * Get user tool runs with optimized fields
   */
  async getUserToolRuns(userId: string, limit = 50) {
    return prisma.toolRun.findMany({
      where: { userId },
      select: {
        id: true,
        toolId: true,
        status: true,
        createdAt: true,
        completedAt: true,
        evaluationScore: true,
        aiModelUsed: true,
        // Exclude large text fields by default
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },

  /**
   * Get single tool run with full details (only when needed)
   */
  async getToolRunDetails(id: string, userId: string) {
    return prisma.toolRun.findFirst({
      where: { id, userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
  },

  /**
   * Get user statistics (cached query)
   */
  async getUserStats(userId: string) {
    const [projectCount, templateCount, toolRunCount, recentActivity] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.template.count({ where: { userId } }),
      prisma.toolRun.count({ where: { userId, status: 'completed' } }),
      prisma.toolRun.findMany({
        where: { userId, status: 'completed' },
        select: {
          id: true,
          toolId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    return {
      projectCount,
      templateCount,
      toolRunCount,
      recentActivity,
    }
  },

  /**
   * Search with optimized fields
   */
  async searchUserContent(userId: string, query: string) {
    const searchTerm = `%${query}%`

    const [projects, templates, toolRuns] = await Promise.all([
      prisma.project.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          updatedAt: true,
        },
        take: 5,
      }),
      prisma.template.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
        },
        take: 5,
      }),
      prisma.toolRun.findMany({
        where: {
          userId,
          OR: [
            { inputText: { contains: query, mode: 'insensitive' } },
            { outputText: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          toolId: true,
          createdAt: true,
        },
        take: 5,
      }),
    ])

    return { projects, templates, toolRuns }
  },
}

/**
 * Cache wrapper for frequently accessed data
 */
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = CACHE_TTL
): Promise<T> {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data)
  }

  return fn().then((data) => {
    cache.set(key, { data, timestamp: Date.now() })
    return data
  })
}

/**
 * Clear cache for a specific key or all keys
 */
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}
