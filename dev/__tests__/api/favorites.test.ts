/**
 * Favorites API Tests
 * 
 * Note: These tests may be skipped in CI due to Next.js environment setup.
 * They verify the core business logic of the favorites API endpoints.
 */

import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/favorites/route'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  getSessionUser: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  prisma: {
    favorite: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

describe('Favorites API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  }

  const mockFavorite = {
    id: 'fav-123',
    userId: 'user-123',
    toolId: 'tool-456',
    createdAt: new Date('2025-01-01'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/favorites', () => {
    it('should return user favorites list', async () => {
      const mockFavorites = [
        mockFavorite,
        {
          id: 'fav-456',
          userId: 'user-123',
          toolId: 'tool-789',
          createdAt: new Date('2025-01-02'),
        },
      ]

      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.findMany as jest.Mock).mockResolvedValue(mockFavorites)

      const request = new NextRequest('http://localhost:3000/api/favorites', {
        method: 'GET',
        headers: {
          cookie: 'session=valid-session-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.favorites).toHaveLength(2)
      expect(data.favorites[0]).toEqual({
        id: 'fav-123',
        toolId: 'tool-456',
        createdAt: '2025-01-01T00:00:00.000Z',
      })
      expect(prisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return 401 when no session cookie', async () => {
      const request = new NextRequest('http://localhost:3000/api/favorites', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when session is invalid', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/favorites', {
        method: 'GET',
        headers: {
          cookie: 'session=invalid-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid session')
    })

    it('should handle database errors', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost:3000/api/favorites', {
        method: 'GET',
        headers: {
          cookie: 'session=valid-session-token',
        },
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch favorites')
    })
  })

  describe('POST /api/favorites', () => {
    it('should create a favorite successfully', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.favorite.create as jest.Mock).mockResolvedValue(mockFavorite)

      const request = new NextRequest('http://localhost:3000/api/favorites', {
        method: 'POST',
        headers: {
          cookie: 'session=valid-session-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ toolId: 'tool-456' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.favorite).toEqual({
        id: 'fav-123',
        toolId: 'tool-456',
        createdAt: '2025-01-01T00:00:00.000Z',
      })
      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          toolId: 'tool-456',
        },
      })
    })

    it('should return 400 when toolId is missing', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/favorites', {
        method: 'POST',
        headers: {
          cookie: 'session=valid-session-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Tool ID is required')
    })

    it('should return 400 when toolId is not a string', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/favorites', {
        method: 'POST',
        headers: {
          cookie: 'session=valid-session-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ toolId: 123 }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Tool ID is required')
    })

    it('should return 409 when tool is already favorited', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.findUnique as jest.Mock).mockResolvedValue(mockFavorite)

      const request = new NextRequest('http://localhost:3000/api/favorites', {
        method: 'POST',
        headers: {
          cookie: 'session=valid-session-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ toolId: 'tool-456' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Tool already favorited')
      expect(prisma.favorite.create).not.toHaveBeenCalled()
    })

    it('should return 401 when not authenticated', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/favorites', {
        method: 'POST',
        headers: {
          cookie: 'session=invalid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ toolId: 'tool-456' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid session')
    })

    it('should handle database errors', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.favorite.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new NextRequest('http://localhost:3000/api/favorites', {
        method: 'POST',
        headers: {
          cookie: 'session=valid-session-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ toolId: 'tool-456' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to add favorite')
    })
  })

  describe('DELETE /api/favorites', () => {
    it('should delete a favorite successfully', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

      const request = new NextRequest(
        'http://localhost:3000/api/favorites?toolId=tool-456',
        {
          method: 'DELETE',
          headers: {
            cookie: 'session=valid-session-token',
          },
        }
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Favorite removed')
      expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          toolId: 'tool-456',
        },
      })
    })

    it('should return 400 when toolId is missing', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/favorites', {
        method: 'DELETE',
        headers: {
          cookie: 'session=valid-session-token',
        },
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Tool ID is required')
    })

    it('should return 404 when favorite not found', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })

      const request = new NextRequest(
        'http://localhost:3000/api/favorites?toolId=tool-999',
        {
          method: 'DELETE',
          headers: {
            cookie: 'session=valid-session-token',
          },
        }
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Favorite not found')
    })

    it('should return 401 when not authenticated', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/favorites?toolId=tool-456',
        {
          method: 'DELETE',
          headers: {
            cookie: 'session=invalid-token',
          },
        }
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid session')
    })

    it('should handle database errors', async () => {
      ;(getSessionUser as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.favorite.deleteMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      const request = new NextRequest(
        'http://localhost:3000/api/favorites?toolId=tool-456',
        {
          method: 'DELETE',
          headers: {
            cookie: 'session=valid-session-token',
          },
        }
      )

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to remove favorite')
    })
  })
})
