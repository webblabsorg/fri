import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.helpCategory.findMany({
      where: {
        published: true,
      },
      include: {
        _count: {
          select: {
            articles: {
              where: {
                published: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
