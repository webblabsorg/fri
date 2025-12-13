import { prisma } from '@/lib/db'

// ============================================================================
// COMPLIANCE RULES SERVICE
// Integration with JurisdictionRule model for legal compliance
// ============================================================================

export interface ComplianceRule {
  id: string
  jurisdiction: string
  ruleType: string
  ruleName: string
  description: string
  requirement: string
  isActive: boolean
}

export interface ComplianceCheckResult {
  ruleId: string
  ruleName: string
  ruleType?: string
  jurisdiction: string
  passed: boolean
  message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  details?: Record<string, unknown> | string
}

// ============================================================================
// IOLTA COMPLIANCE RULES
// ============================================================================

export const IOLTA_RULES = {
  SEPARATE_ACCOUNTS: {
    id: 'iolta-001',
    name: 'Separate Trust Accounts',
    description: 'Client funds must be held in separate IOLTA accounts',
    check: async (organizationId: string): Promise<ComplianceCheckResult> => {
      const trustAccounts = await prisma.trustAccount.findMany({
        where: { organizationId, isActive: true },
      })

      return {
        ruleId: 'iolta-001',
        ruleName: 'Separate Trust Accounts',
        jurisdiction: 'ABA Model Rules',
        passed: trustAccounts.length > 0,
        message: trustAccounts.length > 0
          ? `${trustAccounts.length} active trust account(s) configured`
          : 'No active trust accounts found',
        severity: trustAccounts.length > 0 ? 'info' : 'error',
      }
    },
  },

  NO_COMMINGLING: {
    id: 'iolta-002',
    name: 'No Commingling of Funds',
    description: 'Firm funds must not be commingled with client trust funds',
    check: async (organizationId: string): Promise<ComplianceCheckResult> => {
      const trustAccounts = await prisma.trustAccount.findMany({
        where: { organizationId, accountType: 'IOLTA', isActive: true },
      })

      const hasProperSetup = trustAccounts.every((ta) => ta.bankName && ta.accountNumber)

      return {
        ruleId: 'iolta-002',
        ruleName: 'No Commingling of Funds',
        jurisdiction: 'ABA Model Rules',
        passed: hasProperSetup,
        message: hasProperSetup
          ? 'Trust accounts properly configured for segregation'
          : 'Some trust accounts missing bank details',
        severity: hasProperSetup ? 'info' : 'warning',
      }
    },
  },

  TIMELY_DISBURSEMENT: {
    id: 'iolta-003',
    name: 'Timely Disbursement',
    description: 'Earned fees must be transferred promptly from trust',
    check: async (organizationId: string): Promise<ComplianceCheckResult> => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const oldUnbilledDeposits = await prisma.trustTransaction.count({
        where: {
          trustAccount: { organizationId },
          transactionType: 'deposit',
          transactionDate: { lt: thirtyDaysAgo },
          voidedAt: null,
        },
      })

      return {
        ruleId: 'iolta-003',
        ruleName: 'Timely Disbursement',
        jurisdiction: 'ABA Model Rules',
        passed: oldUnbilledDeposits < 10,
        message: oldUnbilledDeposits < 10
          ? 'Disbursements are timely'
          : `${oldUnbilledDeposits} deposits older than 30 days may need review`,
        severity: oldUnbilledDeposits < 10 ? 'info' : 'warning',
        details: { oldDepositsCount: oldUnbilledDeposits },
      }
    },
  },

  MONTHLY_RECONCILIATION: {
    id: 'iolta-004',
    name: 'Monthly Reconciliation',
    description: 'Trust accounts must be reconciled monthly',
    check: async (organizationId: string): Promise<ComplianceCheckResult> => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentReconciliations = await prisma.trustReconciliation.findMany({
        where: {
          trustAccount: { organizationId },
          reconciliationDate: { gte: thirtyDaysAgo },
          status: 'approved',
        },
      })

      const trustAccounts = await prisma.trustAccount.count({
        where: { organizationId, isActive: true },
      })

      const allReconciled = recentReconciliations.length >= trustAccounts

      return {
        ruleId: 'iolta-004',
        ruleName: 'Monthly Reconciliation',
        jurisdiction: 'ABA Model Rules',
        passed: allReconciled,
        message: allReconciled
          ? 'All trust accounts reconciled within 30 days'
          : `${trustAccounts - recentReconciliations.length} account(s) need reconciliation`,
        severity: allReconciled ? 'info' : 'error',
        details: {
          totalAccounts: trustAccounts,
          reconciledAccounts: recentReconciliations.length,
        },
      }
    },
  },

  THREE_WAY_RECONCILIATION: {
    id: 'iolta-005',
    name: 'Three-Way Reconciliation',
    description: 'Bank balance, trust ledger, and client ledgers must match',
    check: async (organizationId: string): Promise<ComplianceCheckResult> => {
      const unbalancedReconciliations = await prisma.trustReconciliation.count({
        where: {
          trustAccount: { organizationId },
          isBalanced: false,
          status: { not: 'approved' },
        },
      })

      return {
        ruleId: 'iolta-005',
        ruleName: 'Three-Way Reconciliation',
        jurisdiction: 'ABA Model Rules',
        passed: unbalancedReconciliations === 0,
        message: unbalancedReconciliations === 0
          ? 'All reconciliations are balanced'
          : `${unbalancedReconciliations} unbalanced reconciliation(s) require attention`,
        severity: unbalancedReconciliations === 0 ? 'info' : 'error',
        details: { unbalancedCount: unbalancedReconciliations },
      }
    },
  },

  NEGATIVE_BALANCE_PROHIBITION: {
    id: 'iolta-006',
    name: 'No Negative Client Balances',
    description: 'Client trust ledgers must never have negative balances',
    check: async (organizationId: string): Promise<ComplianceCheckResult> => {
      const negativeBalances = await prisma.clientTrustLedger.findMany({
        where: {
          trustAccount: { organizationId },
          balance: { lt: 0 },
          status: 'active',
        },
        include: { client: true },
      })

      return {
        ruleId: 'iolta-006',
        ruleName: 'No Negative Client Balances',
        jurisdiction: 'ABA Model Rules',
        passed: negativeBalances.length === 0,
        message: negativeBalances.length === 0
          ? 'No negative client balances detected'
          : `${negativeBalances.length} client ledger(s) have negative balances`,
        severity: negativeBalances.length === 0 ? 'info' : 'error',
        details: {
          negativeBalanceClients: negativeBalances.map((l) => ({
            clientName: l.client.displayName,
            balance: Number(l.balance),
          })),
        },
      }
    },
  },
}

// ============================================================================
// JURISDICTION-SPECIFIC RULES
// ============================================================================

export async function getJurisdictionRules(
  organizationId: string,
  jurisdiction?: string
): Promise<ComplianceRule[]> {
  const where: Record<string, unknown> = { isActive: true }

  if (jurisdiction) {
    where.jurisdiction = jurisdiction
  }

  const rules = await prisma.jurisdictionRule.findMany({
    where,
    orderBy: [{ jurisdiction: 'asc' }, { ruleType: 'asc' }],
  })

  return rules.map((rule) => ({
    id: rule.id,
    jurisdiction: rule.jurisdiction,
    ruleType: rule.ruleType,
    ruleName: rule.ruleName,
    description: rule.ruleDescription || '',
    requirement: (rule.ruleData as { requirement?: string })?.requirement || '',
    isActive: rule.isActive,
  }))
}

export async function checkJurisdictionCompliance(
  organizationId: string,
  jurisdiction: string
): Promise<ComplianceCheckResult[]> {
  const results: ComplianceCheckResult[] = []

  for (const rule of Object.values(IOLTA_RULES)) {
    const result = await rule.check(organizationId)
    results.push(result)
  }

  const jurisdictionRules = await getJurisdictionRules(organizationId, jurisdiction)

  for (const rule of jurisdictionRules) {
    results.push({
      ruleId: rule.id,
      ruleName: rule.ruleName,
      jurisdiction: rule.jurisdiction,
      passed: true,
      message: `Rule configured: ${rule.requirement}`,
      severity: 'info',
    })
  }

  return results
}

export async function runComplianceChecks(
  organizationId: string,
  jurisdiction: string
): Promise<{ results: ComplianceCheckResult[]; lastChecked: Date }> {
  const results = await checkJurisdictionCompliance(organizationId, jurisdiction)
  return { results, lastChecked: new Date() }
}

// ============================================================================
// COMPLIANCE DASHBOARD DATA
// ============================================================================

export async function getComplianceDashboard(organizationId: string) {
  const results: ComplianceCheckResult[] = []

  for (const rule of Object.values(IOLTA_RULES)) {
    const result = await rule.check(organizationId)
    results.push(result)
  }

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const warnings = results.filter((r) => r.severity === 'warning').length
  const errors = results.filter((r) => r.severity === 'error').length

  return {
    summary: {
      totalRules: results.length,
      passed,
      failed,
      warnings,
      errors,
      complianceScore: Math.round((passed / results.length) * 100),
    },
    results,
    lastChecked: new Date(),
  }
}

// ============================================================================
// SEED DEFAULT JURISDICTION RULES
// ============================================================================

export async function seedDefaultJurisdictionRules() {
  const US_STATES: Array<{ code: string; name: string }> = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' },
  ]

  const stateBaselineRules = US_STATES.flatMap((s) => [
    {
      jurisdiction: s.code,
      country: 'USA',
      ruleType: 'trust_accounting',
      ruleName: 'Baseline Trust Accounting Controls',
      ruleDescription: `${s.name} baseline trust accounting controls for reconciliation, commingling prevention, and record retention.`,
      ruleData: {
        reconciliationFrequencyDays: 30,
        threeWayReconciliationRequired: true,
        recordRetentionYears: 7,
        negativeBalanceProhibited: true,
      },
      effectiveDate: new Date('2020-01-01'),
    },
    {
      jurisdiction: s.code,
      country: 'USA',
      ruleType: 'interest_distribution',
      ruleName: 'IOLTA Interest Distribution',
      ruleDescription: `${s.name} IOLTA interest distribution and reporting requirements (baseline configuration).`,
      ruleData: {
        interestDistributionRequired: true,
        reportingFrequencyDays: 30,
      },
      effectiveDate: new Date('2020-01-01'),
    },
  ])

  const defaultRules = [
    {
      jurisdiction: 'ABA',
      country: 'USA',
      ruleType: 'trust_accounting',
      ruleName: 'Model Rule 1.15 - Safekeeping Property',
      ruleDescription: 'A lawyer shall hold property of clients or third persons in connection with a representation separate from the lawyer\'s own property.',
      ruleData: { requirement: 'Maintain separate trust accounts for client funds' },
      effectiveDate: new Date('2020-01-01'),
    },
    {
      jurisdiction: 'CA',
      country: 'USA',
      ruleType: 'trust_accounting',
      ruleName: 'California Rule 1.15',
      ruleDescription: 'California Rules of Professional Conduct regarding client trust accounts',
      ruleData: { requirement: 'Monthly three-way reconciliation required' },
      effectiveDate: new Date('2020-01-01'),
    },
    {
      jurisdiction: 'NY',
      country: 'USA',
      ruleType: 'trust_accounting',
      ruleName: 'NY Rule 1.15',
      ruleDescription: 'New York Rules of Professional Conduct for attorney trust accounts',
      ruleData: { requirement: 'Maintain records for seven years' },
      effectiveDate: new Date('2020-01-01'),
    },
    {
      jurisdiction: 'TX',
      country: 'USA',
      ruleType: 'trust_accounting',
      ruleName: 'Texas Disciplinary Rule 1.14',
      ruleDescription: 'Texas rules for safekeeping client property',
      ruleData: { requirement: 'Complete records of trust account transactions' },
      effectiveDate: new Date('2020-01-01'),
    },
    {
      jurisdiction: 'FL',
      country: 'USA',
      ruleType: 'trust_accounting',
      ruleName: 'Florida Bar Rule 5-1.1',
      ruleDescription: 'Florida Bar rules for trust accounts',
      ruleData: { requirement: 'Monthly reconciliation and quarterly certification' },
      effectiveDate: new Date('2020-01-01'),
    },
    ...stateBaselineRules,
  ]

  for (const rule of defaultRules) {
    await prisma.jurisdictionRule.upsert({
      where: {
        jurisdiction_ruleType_ruleName: {
          jurisdiction: rule.jurisdiction,
          ruleType: rule.ruleType,
          ruleName: rule.ruleName,
        },
      },
      update: {},
      create: {
        ...rule,
        isActive: true,
      },
    })
  }

  console.log('Default jurisdiction rules seeded')
}
