import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().optional(),
  language: z.string().length(2).default('en'),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#000000'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  fontFamily: z.string().default('Helvetica'),
  headerHtml: z.string().optional().nullable(),
  footerHtml: z.string().optional().nullable(),
  termsTemplate: z.string().optional().nullable(),
  notesTemplate: z.string().optional().nullable(),
  showLogo: z.boolean().default(true),
  showPaymentInfo: z.boolean().default(true),
  showUtbmsCodes: z.boolean().default(false),
  paperSize: z.enum(['LETTER', 'A4', 'LEGAL']).default('LETTER'),
  dateFormat: z.string().default('MM/DD/YYYY'),
  currencyFormat: z.enum(['symbol', 'code', 'both']).default('symbol'),
})

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active' },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const templates = await prisma.invoiceTemplate.findMany({
      where: { organizationId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching invoice templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await getSessionUser(sessionToken)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, ...templateData } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const member = await prisma.organizationMember.findFirst({
      where: { organizationId, userId: user.id, status: 'active', role: { in: ['owner', 'admin'] } },
    })

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const validated = templateSchema.parse(templateData)

    // If setting as default, unset other defaults
    if (validated.isDefault) {
      await prisma.invoiceTemplate.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const template = await prisma.invoiceTemplate.create({
      data: {
        organizationId,
        ...validated,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error creating invoice template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
