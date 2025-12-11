/**
 * Support Tickets API Tests
 * 
 * Tests for ticket attachments persistence and merge functionality
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/support/tickets/route'
import { POST as MergePost } from '@/app/api/admin/tickets/[id]/merge/route'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  getSessionUser: jest.fn(),
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  prisma: {
    supportTicket: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ticketMessage: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn(),
  getTicketConfirmationTemplate: jest.fn(),
}))

import { getSessionUser } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { sendEmail, getTicketConfirmationTemplate } from '@/lib/email'

describe('Support Tickets API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  }

  const mockTicket = {
    id: 'ticket-123',
    ticketNumber: 'FRITH-000001',
    userId: 'user-123',
    subject: 'Test Issue',
    category: 'technical',
    priority: 'medium',
    status: 'open',
    attachments: null,
    createdAt: new Date('2025-01-01'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock email functions
    ;(sendEmail as jest.Mock).mockResolvedValue(undefined)
    ;(getTicketConfirmationTemplate as jest.Mock).mockReturnValue('<html>Email template</html>')
  })

  describe('POST /api/support/tickets - Attachments', () => {
    it('should create ticket with attachments', async () => {
      const attachments = [
        {
          name: 'screenshot.png',
          size: 1024000,
          type: 'image/png',
          url: 'mock://uploads/screenshot.png'
        },
        {
          name: 'log.txt',
          size: 2048,
          type: 'text/plain',
          url: 'mock://uploads/log.txt'
        }
      ]

      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.supportTicket.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.supportTicket.create as jest.Mock).mockResolvedValue({
        ...mockTicket,
        attachments,
      })
      ;(prisma.ticketMessage.create as jest.Mock).mockResolvedValue({
        id: 'message-123',
        ticketId: 'ticket-123',
        senderId: 'user-123',
        senderType: 'user',
        message: 'Test message',
      })

      const request = new NextRequest('http://localhost:3000/api/support/tickets', {
        method: 'POST',
        headers: {
          cookie: 'session=valid-session-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Test Issue',
          category: 'technical',
          priority: 'medium',
          message: 'Test message',
          attachments,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ticket.id).toBe('ticket-123')
      expect(data.ticket.ticketNumber).toBe('FRITH-000001')

      // Verify attachments were persisted
      expect(prisma.supportTicket.create).toHaveBeenCalledWith({
        data: {
          ticketNumber: 'FRITH-000001',
          userId: 'user-123',
          subject: 'Test Issue',
          category: 'technical',
          priority: 'medium',
          status: 'open',
          attachments,
        },
      })
    })

    it('should create ticket without attachments when none provided', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.supportTicket.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.supportTicket.create as jest.Mock).mockResolvedValue(mockTicket)
      ;(prisma.ticketMessage.create as jest.Mock).mockResolvedValue({
        id: 'message-123',
        ticketId: 'ticket-123',
        senderId: 'user-123',
        senderType: 'user',
        message: 'Test message',
      })

      const request = new NextRequest('http://localhost:3000/api/support/tickets', {
        method: 'POST',
        headers: {
          cookie: 'session=valid-session-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Test Issue',
          category: 'technical',
          priority: 'medium',
          message: 'Test message',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify attachments field is null when not provided
      expect(prisma.supportTicket.create).toHaveBeenCalledWith({
        data: {
          ticketNumber: 'FRITH-000001',
          userId: 'user-123',
          subject: 'Test Issue',
          category: 'technical',
          priority: 'medium',
          status: 'open',
          attachments: null,
        },
      })
    })

    it('should create ticket with null attachments when empty array provided', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.supportTicket.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.supportTicket.create as jest.Mock).mockResolvedValue(mockTicket)
      ;(prisma.ticketMessage.create as jest.Mock).mockResolvedValue({
        id: 'message-123',
        ticketId: 'ticket-123',
        senderId: 'user-123',
        senderType: 'user',
        message: 'Test message',
      })

      const request = new NextRequest('http://localhost:3000/api/support/tickets', {
        method: 'POST',
        headers: {
          cookie: 'session=valid-session-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          subject: 'Test Issue',
          category: 'technical',
          priority: 'medium',
          message: 'Test message',
          attachments: [],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify empty attachments array results in null
      expect(prisma.supportTicket.create).toHaveBeenCalledWith({
        data: {
          ticketNumber: 'FRITH-000001',
          userId: 'user-123',
          subject: 'Test Issue',
          category: 'technical',
          priority: 'medium',
          status: 'open',
          attachments: null,
        },
      })
    })
  })

  describe('POST /api/admin/tickets/[id]/merge', () => {
    const mockAdminSession = {
      user: {
        id: 'admin-123',
        role: 'admin',
      },
    }

    it('should merge ticket successfully', async () => {
      const sourceTicket = { ...mockTicket, id: 'source-123' }
      const targetTicket = { ...mockTicket, id: 'target-456' }
      const mergedTicket = {
        ...sourceTicket,
        mergedIntoId: 'target-456',
        status: 'closed',
        resolvedAt: new Date(),
      }

      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.supportTicket.findUnique as jest.Mock)
        .mockResolvedValueOnce(sourceTicket)
        .mockResolvedValueOnce(targetTicket)
      ;(prisma.supportTicket.update as jest.Mock).mockResolvedValue(mergedTicket)

      const request = new NextRequest('http://localhost:3000/api/admin/tickets/source-123/merge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetTicketId: 'target-456',
        }),
      })

      const response = await MergePost(request, { params: Promise.resolve({ id: 'source-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.ticket.mergedIntoId).toBe('target-456')
      expect(data.ticket.status).toBe('closed')

      expect(prisma.supportTicket.update).toHaveBeenCalledWith({
        where: { id: 'source-123' },
        data: {
          mergedIntoId: 'target-456',
          status: 'closed',
          resolvedAt: expect.any(Date),
        },
      })
    })

    it('should return 400 when target ticket ID is missing', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)

      const request = new NextRequest('http://localhost:3000/api/admin/tickets/source-123/merge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const response = await MergePost(request, { params: Promise.resolve({ id: 'source-123' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Target ticket ID is required')
    })

    it('should return 400 when trying to merge ticket into itself', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)

      const request = new NextRequest('http://localhost:3000/api/admin/tickets/source-123/merge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetTicketId: 'source-123',
        }),
      })

      const response = await MergePost(request, { params: Promise.resolve({ id: 'source-123' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot merge ticket into itself')
    })

    it('should return 404 when source ticket not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.supportTicket.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTicket)

      const request = new NextRequest('http://localhost:3000/api/admin/tickets/nonexistent/merge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetTicketId: 'target-456',
        }),
      })

      const response = await MergePost(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Source ticket not found')
    })

    it('should return 404 when target ticket not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockAdminSession)
      ;(prisma.supportTicket.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockTicket)
        .mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/admin/tickets/source-123/merge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetTicketId: 'nonexistent',
        }),
      })

      const response = await MergePost(request, { params: Promise.resolve({ id: 'source-123' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Target ticket not found')
    })

    it('should return 401 when not admin', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', role: 'user' },
      })

      const request = new NextRequest('http://localhost:3000/api/admin/tickets/source-123/merge', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          targetTicketId: 'target-456',
        }),
      })

      const response = await MergePost(request, { params: Promise.resolve({ id: 'source-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})
