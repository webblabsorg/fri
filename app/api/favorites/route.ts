import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch user's favorites
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      favorites: favorites.map(fav => ({
        id: fav.id,
        toolId: fav.toolId,
        createdAt: fav.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Favorites fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}

// POST - Add a favorite
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const body = await request.json()
    const { toolId } = body

    if (!toolId || typeof toolId !== 'string') {
      return NextResponse.json(
        { error: 'Tool ID is required' },
        { status: 400 }
      )
    }

    // Check if already favorited (unique constraint will also catch this)
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_toolId: {
          userId: user.id,
          toolId: toolId,
        },
      },
    })

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Tool already favorited' },
        { status: 409 }
      )
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        toolId: toolId,
      },
    })

    return NextResponse.json({
      favorite: {
        id: favorite.id,
        toolId: favorite.toolId,
        createdAt: favorite.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Favorite creation error:', error)
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a favorite (by toolId in query params)
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Get toolId from query params
    const { searchParams } = new URL(request.url)
    const toolId = searchParams.get('toolId')

    if (!toolId) {
      return NextResponse.json(
        { error: 'Tool ID is required' },
        { status: 400 }
      )
    }

    // Delete the favorite
    const deletedFavorite = await prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        toolId: toolId,
      },
    })

    if (deletedFavorite.count === 0) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Favorite removed',
    })
  } catch (error) {
    console.error('Favorite deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}
