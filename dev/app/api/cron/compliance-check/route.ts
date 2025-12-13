import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { runComplianceChecks } from '@/lib/finance/compliance-rules'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cron endpoint for running compliance checks across all organizations.
 * Should be triggered every minute (or on a schedule) by an external cron service.
 * Creates Notification records for any compliance violations detected.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const organizations = await prisma.organization.findMany({
      where: { status: 'active' },
      select: { id: true, name: true },
    })

    const results: Array<{
      organizationId: string
      alertsCreated: number
      errors: string[]
    }> = []

    for (const org of organizations) {
      const orgErrors: string[] = []
      let alertsCreated = 0

      try {
        const jurisdiction = 'ABA'
        const complianceResult = await runComplianceChecks(org.id, jurisdiction)

        for (const check of complianceResult.results) {
          if (!check.passed && (check.severity === 'critical' || check.severity === 'error')) {
            const existingAlert = await prisma.notification.findFirst({
              where: {
                type: 'compliance_alert',
                title: check.ruleName,
                read: false,
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
              },
            })

            if (!existingAlert) {
              const adminMember = await prisma.organizationMember.findFirst({
                where: { organizationId: org.id, role: 'owner', status: 'active' },
                select: { userId: true },
              })
              if (adminMember) {
                await prisma.notification.create({
                  data: {
                    userId: adminMember.userId,
                    type: 'compliance_alert',
                    title: check.ruleName,
                    message: typeof check.details === 'string' ? check.details : `Compliance check failed: ${check.ruleName}`,
                    actionUrl: '/dashboard/finance/trust/compliance',
                    data: {
                      organizationId: org.id,
                      ruleType: check.ruleType || 'unknown',
                      severity: check.severity,
                      jurisdiction,
                      checkedAt: new Date().toISOString(),
                    },
                  },
                })
                alertsCreated++
              }
            }
          }
        }
      } catch (err) {
        orgErrors.push(err instanceof Error ? err.message : String(err))
      }

      results.push({
        organizationId: org.id,
        alertsCreated,
        errors: orgErrors,
      })
    }

    const totalAlerts = results.reduce((sum, r) => sum + r.alertsCreated, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)

    return NextResponse.json({
      success: true,
      checkedAt: new Date().toISOString(),
      organizationsChecked: organizations.length,
      totalAlertsCreated: totalAlerts,
      totalErrors,
      results,
    })
  } catch (error) {
    console.error('Compliance cron error:', error)
    return NextResponse.json(
      { error: 'Compliance check failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
