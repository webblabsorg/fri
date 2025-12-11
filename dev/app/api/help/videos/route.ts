import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const featured = searchParams.get('featured') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: any = {
      published: true,
    }

    if (category) {
      where.category = category
    }

    const videos = await prisma.videoTutorial.findMany({
      where,
      orderBy: featured
        ? [{ order: 'asc' }, { views: 'desc' }]
        : [{ createdAt: 'desc' }],
      take: limit,
    })

    return NextResponse.json({ videos, count: videos.length })
  } catch (error) {
    console.error('Error fetching video tutorials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video tutorials' },
      { status: 500 }
    )
  }
}
