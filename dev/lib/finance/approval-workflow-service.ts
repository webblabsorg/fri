import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// APPROVAL WORKFLOW SERVICE
// Multi-level approval workflows for expenses, vendor bills, invoices
// ============================================================================

export interface CreateWorkflowInput {
  organizationId: string
  name: string
  description?: string
  entityType: 'expense' | 'vendor_bill' | 'invoice'
  levels: {
    levelNumber: number
    name: string
    minAmount?: number
    maxAmount?: number
    categories?: string[]
    approverRole?: string
    approverUserIds?: string[]
    requireAll?: boolean
    autoApprove?: boolean
    escalationHours?: number
  }[]
}

export async function createApprovalWorkflow(input: CreateWorkflowInput) {
  return prisma.approvalWorkflow.create({
    data: {
      organizationId: input.organizationId,
      name: input.name,
      description: input.description,
      entityType: input.entityType,
      isActive: true,
      levels: {
        create: input.levels.map((level) => ({
          levelNumber: level.levelNumber,
          name: level.name,
          minAmount: level.minAmount ? new Decimal(level.minAmount) : null,
          maxAmount: level.maxAmount ? new Decimal(level.maxAmount) : null,
          categories: level.categories?.join(',') || null,
          approverRole: level.approverRole,
          approverUserIds: level.approverUserIds?.join(',') || null,
          requireAll: level.requireAll || false,
          autoApprove: level.autoApprove || false,
          escalationHours: level.escalationHours,
        })),
      },
    },
    include: {
      levels: {
        orderBy: { levelNumber: 'asc' },
      },
    },
  })
}

export async function getApprovalWorkflows(
  organizationId: string,
  entityType?: string
) {
  const where: Record<string, unknown> = { organizationId, isActive: true }
  if (entityType) {
    where.entityType = entityType
  }

  return prisma.approvalWorkflow.findMany({
    where,
    include: {
      levels: {
        orderBy: { levelNumber: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getWorkflowById(id: string, organizationId: string) {
  return prisma.approvalWorkflow.findFirst({
    where: { id, organizationId },
    include: {
      levels: {
        orderBy: { levelNumber: 'asc' },
      },
    },
  })
}

export interface SubmitForApprovalInput {
  organizationId: string
  entityType: 'expense' | 'vendor_bill' | 'invoice'
  entityId: string
  amount: number
  description?: string
  requestedBy: string
  category?: string
  metadata?: Record<string, unknown>
}

export async function submitForApproval(input: SubmitForApprovalInput) {
  // Find applicable workflow
  const workflows = await prisma.approvalWorkflow.findMany({
    where: {
      organizationId: input.organizationId,
      entityType: input.entityType,
      isActive: true,
    },
    include: {
      levels: {
        orderBy: { levelNumber: 'asc' },
      },
    },
  })

  if (workflows.length === 0) {
    // No workflow configured - auto-approve
    return { autoApproved: true, request: null }
  }

  // Use first matching workflow (could be enhanced to select based on rules)
  const workflow = workflows[0]

  // Find applicable levels based on amount and category
  const applicableLevels = workflow.levels.filter((level) => {
    const minOk = !level.minAmount || input.amount >= Number(level.minAmount)
    const maxOk = !level.maxAmount || input.amount <= Number(level.maxAmount)
    const categoryOk =
      !level.categories ||
      !input.category ||
      level.categories.split(',').includes(input.category)
    return minOk && maxOk && categoryOk
  })

  if (applicableLevels.length === 0) {
    // No applicable levels - auto-approve
    return { autoApproved: true, request: null }
  }

  // Check if first level auto-approves
  const firstLevel = applicableLevels[0]
  if (firstLevel.autoApprove) {
    return { autoApproved: true, request: null }
  }

  // Create approval request
  const request = await prisma.approvalRequest.create({
    data: {
      organizationId: input.organizationId,
      workflowId: workflow.id,
      entityType: input.entityType,
      entityId: input.entityId,
      requestedBy: input.requestedBy,
      currentLevel: firstLevel.levelNumber,
      status: 'pending',
      amount: new Decimal(input.amount),
      description: input.description,
      metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
    },
    include: {
      workflow: {
        include: {
          levels: true,
        },
      },
    },
  })

  return { autoApproved: false, request }
}

export async function getPendingApprovals(
  organizationId: string,
  approverId: string,
  approverRole?: string
) {
  // Get all pending requests
  const requests = await prisma.approvalRequest.findMany({
    where: {
      organizationId,
      status: 'pending',
    },
    include: {
      workflow: {
        include: {
          levels: true,
        },
      },
      steps: true,
    },
    orderBy: { requestedAt: 'asc' },
  })

  // Filter to requests where user can approve at current level
  return requests.filter((request) => {
    const currentLevel = request.workflow.levels.find(
      (l) => l.levelNumber === request.currentLevel
    )
    if (!currentLevel) return false

    // Check if user can approve
    if (currentLevel.approverRole && approverRole === currentLevel.approverRole) {
      return true
    }
    if (currentLevel.approverUserIds) {
      const userIds = currentLevel.approverUserIds.split(',')
      if (userIds.includes(approverId)) {
        return true
      }
    }
    // If no specific approvers set, allow admins/owners
    if (!currentLevel.approverRole && !currentLevel.approverUserIds) {
      return approverRole === 'owner' || approverRole === 'admin'
    }
    return false
  })
}

export interface ApprovalActionInput {
  requestId: string
  approverId: string
  action: 'approved' | 'rejected' | 'delegated'
  comments?: string
}

export async function processApprovalAction(
  organizationId: string,
  input: ApprovalActionInput
) {
  const request = await prisma.approvalRequest.findFirst({
    where: {
      id: input.requestId,
      organizationId,
      status: 'pending',
    },
    include: {
      workflow: {
        include: {
          levels: {
            orderBy: { levelNumber: 'asc' },
          },
        },
      },
    },
  })

  if (!request) {
    throw new Error('Approval request not found or already processed')
  }

  const currentLevel = request.workflow.levels.find(
    (l) => l.levelNumber === request.currentLevel
  )

  if (!currentLevel) {
    throw new Error('Current approval level not found')
  }

  return prisma.$transaction(async (tx) => {
    // Record the approval step
    await tx.approvalStep.create({
      data: {
        requestId: input.requestId,
        levelId: currentLevel.id,
        approverId: input.approverId,
        action: input.action,
        comments: input.comments,
      },
    })

    if (input.action === 'rejected') {
      // Rejection - mark request as rejected
      await tx.approvalRequest.update({
        where: { id: input.requestId },
        data: {
          status: 'rejected',
          completedAt: new Date(),
          finalApprover: input.approverId,
        },
      })

      return { status: 'rejected', nextLevel: null }
    }

    if (input.action === 'approved') {
      // Find next level
      const nextLevel = request.workflow.levels.find(
        (l) => l.levelNumber > request.currentLevel
      )

      if (nextLevel && !nextLevel.autoApprove) {
        // Move to next level
        await tx.approvalRequest.update({
          where: { id: input.requestId },
          data: {
            currentLevel: nextLevel.levelNumber,
          },
        })

        return { status: 'pending', nextLevel: nextLevel.levelNumber }
      }

      // No more levels or next level auto-approves - fully approved
      await tx.approvalRequest.update({
        where: { id: input.requestId },
        data: {
          status: 'approved',
          completedAt: new Date(),
          finalApprover: input.approverId,
        },
      })

      return { status: 'approved', nextLevel: null }
    }

    return { status: 'pending', nextLevel: request.currentLevel }
  })
}

export async function getApprovalHistory(
  organizationId: string,
  entityType?: string,
  entityId?: string
) {
  const where: Record<string, unknown> = { organizationId }
  if (entityType) where.entityType = entityType
  if (entityId) where.entityId = entityId

  return prisma.approvalRequest.findMany({
    where,
    include: {
      workflow: true,
      steps: {
        orderBy: { actionAt: 'asc' },
      },
    },
    orderBy: { requestedAt: 'desc' },
  })
}

export async function cancelApprovalRequest(
  requestId: string,
  organizationId: string,
  cancelledBy: string
) {
  const request = await prisma.approvalRequest.findFirst({
    where: {
      id: requestId,
      organizationId,
      status: 'pending',
    },
  })

  if (!request) {
    throw new Error('Approval request not found or already processed')
  }

  return prisma.approvalRequest.update({
    where: { id: requestId },
    data: {
      status: 'cancelled',
      completedAt: new Date(),
      finalApprover: cancelledBy,
    },
  })
}
