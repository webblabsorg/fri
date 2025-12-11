import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const waveSchema = z.object({
  waveNumber: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional(),
  targetCount: z.number().int().positive(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

const toolExpansionSchema = z.object({
  waveId: z.string().uuid(),
  name: z.string().min(1),
  category: z.string().min(1),
  priority: z.number().int().optional(),
  specSource: z.string().optional(),
  complexity: z.enum(['low', 'medium', 'high']).optional(),
  estimatedHours: z.number().int().optional(),
})

// GET - List waves and tool expansion progress
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const waveId = searchParams.get('waveId')

    if (waveId) {
      // Get single wave with tools
      const wave = await prisma.toolWave.findUnique({
        where: { id: waveId },
        include: {
          tools: {
            orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
          },
        },
      })

      if (!wave) {
        return NextResponse.json({ error: 'Wave not found' }, { status: 404 })
      }

      // Calculate progress
      const statusCounts = wave.tools.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return NextResponse.json({
        wave,
        progress: {
          total: wave.tools.length,
          planned: statusCounts.planned || 0,
          inDevelopment: statusCounts.in_development || 0,
          testing: statusCounts.testing || 0,
          deployed: statusCounts.deployed || 0,
          percentComplete: wave.tools.length > 0
            ? Math.round((statusCounts.deployed || 0) / wave.tools.length * 100)
            : 0,
        },
      })
    }

    // List all waves with summary
    const waves = await prisma.toolWave.findMany({
      orderBy: { waveNumber: 'asc' },
      include: {
        _count: { select: { tools: true } },
        tools: {
          select: { status: true },
        },
      },
    })

    const wavesWithProgress = waves.map((wave) => {
      const deployed = wave.tools.filter((t) => t.status === 'deployed').length
      return {
        id: wave.id,
        waveNumber: wave.waveNumber,
        name: wave.name,
        description: wave.description,
        targetCount: wave.targetCount,
        actualCount: wave._count.tools,
        deployedCount: deployed,
        status: wave.status,
        startDate: wave.startDate,
        endDate: wave.endDate,
        percentComplete: wave._count.tools > 0
          ? Math.round(deployed / wave._count.tools * 100)
          : 0,
      }
    })

    // Overall stats
    const totalTools = await prisma.tool.count()
    const totalExpansion = await prisma.toolExpansion.count()
    const deployedExpansion = await prisma.toolExpansion.count({
      where: { status: 'deployed' },
    })

    return NextResponse.json({
      waves: wavesWithProgress,
      overall: {
        existingTools: totalTools,
        plannedExpansion: totalExpansion,
        deployedExpansion,
        totalTarget: 240,
        percentToTarget: Math.round((totalTools + deployedExpansion) / 240 * 100),
      },
    })
  } catch (error) {
    console.error('Error fetching tool expansion:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tool expansion data' },
      { status: 500 }
    )
  }
}

// POST - Create wave or add tool to expansion
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, ...data } = body

    if (type === 'wave') {
      const validated = waveSchema.parse(data)

      const wave = await prisma.toolWave.create({
        data: {
          ...validated,
          startDate: validated.startDate ? new Date(validated.startDate) : null,
          endDate: validated.endDate ? new Date(validated.endDate) : null,
        },
      })

      return NextResponse.json({ success: true, wave })
    }

    if (type === 'tool') {
      const validated = toolExpansionSchema.parse(data)

      const tool = await prisma.toolExpansion.create({
        data: validated,
      })

      return NextResponse.json({ success: true, tool })
    }

    // Bulk import tools from spec
    if (type === 'bulk_import') {
      const { waveId, tools } = data

      if (!waveId || !Array.isArray(tools)) {
        return NextResponse.json({ error: 'Invalid bulk import data' }, { status: 400 })
      }

      const created = await prisma.toolExpansion.createMany({
        data: tools.map((t: any, index: number) => ({
          waveId,
          name: t.name,
          category: t.category,
          priority: t.priority || index,
          specSource: t.specSource,
          complexity: t.complexity || 'medium',
          estimatedHours: t.estimatedHours,
        })),
      })

      return NextResponse.json({
        success: true,
        imported: created.count,
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating tool expansion:', error)
    return NextResponse.json(
      { error: 'Failed to create tool expansion' },
      { status: 500 }
    )
  }
}

// PATCH - Update wave or tool status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    if (type === 'wave') {
      const wave = await prisma.toolWave.update({
        where: { id },
        data: {
          ...updates,
          ...(updates.startDate && { startDate: new Date(updates.startDate) }),
          ...(updates.endDate && { endDate: new Date(updates.endDate) }),
        },
      })

      return NextResponse.json({ success: true, wave })
    }

    if (type === 'tool') {
      // Handle status transitions
      const tool = await prisma.toolExpansion.findUnique({ where: { id } })
      if (!tool) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 })
      }

      const updateData: any = { ...updates }

      // Set timestamps based on status
      if (updates.status === 'in_development' && !tool.startedAt) {
        updateData.startedAt = new Date()
      }
      if (updates.status === 'deployed' && !tool.completedAt) {
        updateData.completedAt = new Date()
      }

      const updated = await prisma.toolExpansion.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json({ success: true, tool: updated })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error updating tool expansion:', error)
    return NextResponse.json(
      { error: 'Failed to update tool expansion' },
      { status: 500 }
    )
  }
}

// DELETE - Delete wave or tool from expansion
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID required' }, { status: 400 })
    }

    if (type === 'wave') {
      await prisma.toolWave.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (type === 'tool') {
      await prisma.toolExpansion.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting tool expansion:', error)
    return NextResponse.json(
      { error: 'Failed to delete tool expansion' },
      { status: 500 }
    )
  }
}
