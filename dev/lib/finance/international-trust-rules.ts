import { prisma } from '@/lib/db'

// ============================================================================
// INTERNATIONAL TRUST ACCOUNTING RULES
// Support for UK, Canada, Australia, EU jurisdictions
// ============================================================================

export interface InternationalJurisdiction {
  code: string
  name: string
  country: string
  region?: string
  currency: string
  regulatoryBody: string
  trustAccountType: string
  reconciliationFrequency: number // days
  recordRetentionYears: number
  interestDistribution: 'client' | 'regulator' | 'charity' | 'none'
  specialRequirements: string[]
}

// ============================================================================
// UK SOLICITORS REGULATION AUTHORITY (SRA) RULES
// ============================================================================

export const UK_JURISDICTIONS: InternationalJurisdiction[] = [
  {
    code: 'UK-EW',
    name: 'England & Wales',
    country: 'United Kingdom',
    region: 'England & Wales',
    currency: 'GBP',
    regulatoryBody: 'Solicitors Regulation Authority (SRA)',
    trustAccountType: 'Client Account',
    reconciliationFrequency: 35, // At least every 5 weeks
    recordRetentionYears: 6,
    interestDistribution: 'client',
    specialRequirements: [
      'Must maintain separate client account at authorized bank',
      'Client money must be paid into client account promptly',
      'Interest must be paid to clients where fair and reasonable',
      'Reconciliation at least every 5 weeks',
      'Annual accountant report required',
      'Must notify SRA of any breaches',
    ],
  },
  {
    code: 'UK-SC',
    name: 'Scotland',
    country: 'United Kingdom',
    region: 'Scotland',
    currency: 'GBP',
    regulatoryBody: 'Law Society of Scotland',
    trustAccountType: 'Client Account',
    reconciliationFrequency: 30,
    recordRetentionYears: 10,
    interestDistribution: 'client',
    specialRequirements: [
      'Separate client account required',
      'Monthly reconciliation required',
      'Annual certificate of compliance',
      'Interest payable to clients',
    ],
  },
  {
    code: 'UK-NI',
    name: 'Northern Ireland',
    country: 'United Kingdom',
    region: 'Northern Ireland',
    currency: 'GBP',
    regulatoryBody: 'Law Society of Northern Ireland',
    trustAccountType: 'Client Account',
    reconciliationFrequency: 30,
    recordRetentionYears: 6,
    interestDistribution: 'client',
    specialRequirements: [
      'Client account must be designated',
      'Monthly reconciliation',
      'Annual accountant certificate',
    ],
  },
]

// ============================================================================
// CANADIAN LAW SOCIETY RULES
// ============================================================================

export const CANADA_JURISDICTIONS: InternationalJurisdiction[] = [
  {
    code: 'CA-ON',
    name: 'Ontario',
    country: 'Canada',
    region: 'Ontario',
    currency: 'CAD',
    regulatoryBody: 'Law Society of Ontario',
    trustAccountType: 'Mixed Trust Account',
    reconciliationFrequency: 30,
    recordRetentionYears: 10,
    interestDistribution: 'charity', // Law Foundation of Ontario
    specialRequirements: [
      'Trust account at approved financial institution',
      'Monthly reconciliation required',
      'Interest paid to Law Foundation of Ontario',
      'Trust account supervision required',
      'Annual filing with Law Society',
      'Cash transactions over $7,500 require verification',
    ],
  },
  {
    code: 'CA-BC',
    name: 'British Columbia',
    country: 'Canada',
    region: 'British Columbia',
    currency: 'CAD',
    regulatoryBody: 'Law Society of British Columbia',
    trustAccountType: 'Pooled Trust Account',
    reconciliationFrequency: 30,
    recordRetentionYears: 10,
    interestDistribution: 'charity', // Law Foundation of BC
    specialRequirements: [
      'Trust account at designated savings institution',
      'Monthly reconciliation',
      'Interest to Law Foundation of BC',
      'Trust report filing required',
    ],
  },
  {
    code: 'CA-AB',
    name: 'Alberta',
    country: 'Canada',
    region: 'Alberta',
    currency: 'CAD',
    regulatoryBody: 'Law Society of Alberta',
    trustAccountType: 'General Trust Account',
    reconciliationFrequency: 30,
    recordRetentionYears: 10,
    interestDistribution: 'charity', // Alberta Law Foundation
    specialRequirements: [
      'Trust account at approved financial institution',
      'Monthly reconciliation',
      'Interest to Alberta Law Foundation',
      'Annual trust safety report',
    ],
  },
  {
    code: 'CA-QC',
    name: 'Quebec',
    country: 'Canada',
    region: 'Quebec',
    currency: 'CAD',
    regulatoryBody: 'Barreau du Québec',
    trustAccountType: 'Compte en fidéicommis',
    reconciliationFrequency: 30,
    recordRetentionYears: 10,
    interestDistribution: 'charity', // Fondation du Barreau
    specialRequirements: [
      'Trust account at Quebec financial institution',
      'Monthly reconciliation',
      'Interest to Fondation du Barreau',
      'Annual inspection compliance',
    ],
  },
]

// ============================================================================
// AUSTRALIAN LAW SOCIETY RULES
// ============================================================================

export const AUSTRALIA_JURISDICTIONS: InternationalJurisdiction[] = [
  {
    code: 'AU-NSW',
    name: 'New South Wales',
    country: 'Australia',
    region: 'New South Wales',
    currency: 'AUD',
    regulatoryBody: 'Law Society of New South Wales',
    trustAccountType: 'General Trust Account',
    reconciliationFrequency: 30,
    recordRetentionYears: 7,
    interestDistribution: 'regulator', // Public Purpose Fund
    specialRequirements: [
      'Trust account at authorized deposit-taking institution',
      'Monthly reconciliation',
      'Interest to Public Purpose Fund',
      'External examiner report annually',
      'Trust money must be deposited within 3 business days',
    ],
  },
  {
    code: 'AU-VIC',
    name: 'Victoria',
    country: 'Australia',
    region: 'Victoria',
    currency: 'AUD',
    regulatoryBody: 'Law Institute of Victoria',
    trustAccountType: 'General Trust Account',
    reconciliationFrequency: 30,
    recordRetentionYears: 7,
    interestDistribution: 'regulator', // Victorian Legal Services Board
    specialRequirements: [
      'Trust account at approved ADI',
      'Monthly reconciliation',
      'Interest to Victorian Legal Services Board',
      'Annual external examination',
    ],
  },
  {
    code: 'AU-QLD',
    name: 'Queensland',
    country: 'Australia',
    region: 'Queensland',
    currency: 'AUD',
    regulatoryBody: 'Queensland Law Society',
    trustAccountType: 'General Trust Account',
    reconciliationFrequency: 30,
    recordRetentionYears: 7,
    interestDistribution: 'regulator', // Legal Practitioner Interest on Trust Accounts Fund
    specialRequirements: [
      'Trust account at authorized institution',
      'Monthly reconciliation',
      'Interest to LPITAF',
      'Annual trust account audit',
    ],
  },
]

// ============================================================================
// EUROPEAN UNION JURISDICTIONS
// ============================================================================

export const EU_JURISDICTIONS: InternationalJurisdiction[] = [
  {
    code: 'EU-DE',
    name: 'Germany',
    country: 'Germany',
    region: 'Federal',
    currency: 'EUR',
    regulatoryBody: 'Bundesrechtsanwaltskammer (BRAK)',
    trustAccountType: 'Anderkonto (Escrow Account)',
    reconciliationFrequency: 30,
    recordRetentionYears: 10,
    interestDistribution: 'client',
    specialRequirements: [
      'Separate Anderkonto for each client matter',
      'Interest belongs to client',
      'Professional liability insurance required',
      'Strict separation of client and firm funds',
    ],
  },
  {
    code: 'EU-FR',
    name: 'France',
    country: 'France',
    region: 'National',
    currency: 'EUR',
    regulatoryBody: 'Conseil National des Barreaux (CNB)',
    trustAccountType: 'CARPA Account',
    reconciliationFrequency: 30,
    recordRetentionYears: 10,
    interestDistribution: 'charity', // CARPA
    specialRequirements: [
      'Funds must pass through CARPA',
      'CARPA handles all client fund transactions',
      'Interest used for legal aid',
      'Strict anti-money laundering compliance',
    ],
  },
  {
    code: 'EU-NL',
    name: 'Netherlands',
    country: 'Netherlands',
    region: 'National',
    currency: 'EUR',
    regulatoryBody: 'Nederlandse Orde van Advocaten (NOvA)',
    trustAccountType: 'Derdengeldrekening',
    reconciliationFrequency: 30,
    recordRetentionYears: 7,
    interestDistribution: 'client',
    specialRequirements: [
      'Third-party funds account (Derdengeldrekening)',
      'Foundation structure required for trust account',
      'Interest to clients',
      'Annual audit required',
    ],
  },
  {
    code: 'EU-IE',
    name: 'Ireland',
    country: 'Ireland',
    region: 'National',
    currency: 'EUR',
    regulatoryBody: 'Law Society of Ireland',
    trustAccountType: 'Client Account',
    reconciliationFrequency: 30,
    recordRetentionYears: 6,
    interestDistribution: 'client',
    specialRequirements: [
      'Client account at authorized credit institution',
      'Monthly reconciliation',
      'Interest payable to clients',
      'Annual accountant report',
      'Compensation Fund contribution',
    ],
  },
  {
    code: 'EU-ES',
    name: 'Spain',
    country: 'Spain',
    region: 'National',
    currency: 'EUR',
    regulatoryBody: 'Consejo General de la Abogacía Española',
    trustAccountType: 'Cuenta de Terceros',
    reconciliationFrequency: 30,
    recordRetentionYears: 6,
    interestDistribution: 'client',
    specialRequirements: [
      'Separate third-party account',
      'Client funds must be segregated',
      'Interest to clients',
      'Professional liability insurance required',
    ],
  },
  {
    code: 'EU-IT',
    name: 'Italy',
    country: 'Italy',
    region: 'National',
    currency: 'EUR',
    regulatoryBody: 'Consiglio Nazionale Forense (CNF)',
    trustAccountType: 'Conto Terzi',
    reconciliationFrequency: 30,
    recordRetentionYears: 10,
    interestDistribution: 'client',
    specialRequirements: [
      'Dedicated third-party account',
      'Strict segregation of funds',
      'Interest belongs to client',
      'Anti-money laundering compliance',
    ],
  },
]

// ============================================================================
// ALL INTERNATIONAL JURISDICTIONS
// ============================================================================

export const ALL_INTERNATIONAL_JURISDICTIONS: InternationalJurisdiction[] = [
  ...UK_JURISDICTIONS,
  ...CANADA_JURISDICTIONS,
  ...AUSTRALIA_JURISDICTIONS,
  ...EU_JURISDICTIONS,
]

// ============================================================================
// JURISDICTION LOOKUP FUNCTIONS
// ============================================================================

export function getJurisdictionByCode(code: string): InternationalJurisdiction | undefined {
  return ALL_INTERNATIONAL_JURISDICTIONS.find((j) => j.code === code)
}

export function getJurisdictionsByCountry(country: string): InternationalJurisdiction[] {
  return ALL_INTERNATIONAL_JURISDICTIONS.filter(
    (j) => j.country.toLowerCase() === country.toLowerCase()
  )
}

export function getJurisdictionsByCurrency(currency: string): InternationalJurisdiction[] {
  return ALL_INTERNATIONAL_JURISDICTIONS.filter(
    (j) => j.currency.toUpperCase() === currency.toUpperCase()
  )
}

// ============================================================================
// SEED INTERNATIONAL JURISDICTION RULES
// ============================================================================

export async function seedInternationalJurisdictionRules() {
  const rules = ALL_INTERNATIONAL_JURISDICTIONS.flatMap((j) => [
    {
      jurisdiction: j.code,
      country: j.country,
      ruleType: 'trust_accounting',
      ruleName: `${j.name} Trust Accounting Rules`,
      ruleDescription: `Trust accounting requirements regulated by ${j.regulatoryBody}`,
      ruleData: {
        trustAccountType: j.trustAccountType,
        reconciliationFrequencyDays: j.reconciliationFrequency,
        recordRetentionYears: j.recordRetentionYears,
        currency: j.currency,
        regulatoryBody: j.regulatoryBody,
        specialRequirements: j.specialRequirements,
      },
      effectiveDate: new Date('2020-01-01'),
    },
    {
      jurisdiction: j.code,
      country: j.country,
      ruleType: 'interest_distribution',
      ruleName: `${j.name} Interest Distribution`,
      ruleDescription: `Interest distribution rules for ${j.name}`,
      ruleData: {
        interestDistribution: j.interestDistribution,
        description: j.interestDistribution === 'client'
          ? 'Interest earned on client funds belongs to the client'
          : j.interestDistribution === 'charity'
          ? 'Interest is distributed to legal aid/charitable foundation'
          : j.interestDistribution === 'regulator'
          ? 'Interest is distributed to regulatory body fund'
          : 'No specific interest distribution requirement',
      },
      effectiveDate: new Date('2020-01-01'),
    },
    {
      jurisdiction: j.code,
      country: j.country,
      ruleType: 'reporting',
      ruleName: `${j.name} Reporting Requirements`,
      ruleDescription: `Reporting and audit requirements for ${j.name}`,
      ruleData: {
        reconciliationFrequencyDays: j.reconciliationFrequency,
        recordRetentionYears: j.recordRetentionYears,
        annualAuditRequired: true,
        regulatoryBody: j.regulatoryBody,
      },
      effectiveDate: new Date('2020-01-01'),
    },
  ])

  for (const rule of rules) {
    await prisma.jurisdictionRule.upsert({
      where: {
        jurisdiction_ruleType_ruleName: {
          jurisdiction: rule.jurisdiction,
          ruleType: rule.ruleType,
          ruleName: rule.ruleName,
        },
      },
      update: {
        ruleDescription: rule.ruleDescription,
        ruleData: rule.ruleData,
      },
      create: {
        ...rule,
        isActive: true,
      },
    })
  }

  console.log(`Seeded ${rules.length} international jurisdiction rules`)
}

// ============================================================================
// INTERNATIONAL COMPLIANCE CHECK
// ============================================================================

export interface InternationalComplianceResult {
  jurisdiction: InternationalJurisdiction
  isCompliant: boolean
  checks: Array<{
    requirement: string
    passed: boolean
    details: string
  }>
  recommendations: string[]
}

export async function checkInternationalCompliance(
  organizationId: string,
  jurisdictionCode: string
): Promise<InternationalComplianceResult> {
  const jurisdiction = getJurisdictionByCode(jurisdictionCode)

  if (!jurisdiction) {
    throw new Error(`Unknown jurisdiction: ${jurisdictionCode}`)
  }

  const checks: InternationalComplianceResult['checks'] = []
  const recommendations: string[] = []

  // Check 1: Trust account exists
  const trustAccounts = await prisma.trustAccount.findMany({
    where: {
      organizationId,
      jurisdiction: jurisdictionCode,
      isActive: true,
    },
  })

  checks.push({
    requirement: `${jurisdiction.trustAccountType} configured`,
    passed: trustAccounts.length > 0,
    details: trustAccounts.length > 0
      ? `${trustAccounts.length} trust account(s) configured for ${jurisdiction.name}`
      : `No trust accounts configured for ${jurisdiction.name}`,
  })

  if (trustAccounts.length === 0) {
    recommendations.push(`Configure a ${jurisdiction.trustAccountType} for ${jurisdiction.name}`)
  }

  // Check 2: Reconciliation frequency
  const reconciliationThreshold = new Date()
  reconciliationThreshold.setDate(reconciliationThreshold.getDate() - jurisdiction.reconciliationFrequency)

  for (const account of trustAccounts) {
    const isReconciled = account.lastReconciledDate && account.lastReconciledDate >= reconciliationThreshold

    checks.push({
      requirement: `Reconciliation within ${jurisdiction.reconciliationFrequency} days`,
      passed: !!isReconciled,
      details: isReconciled
        ? `Account "${account.accountName}" reconciled on ${account.lastReconciledDate?.toLocaleDateString()}`
        : `Account "${account.accountName}" needs reconciliation (last: ${account.lastReconciledDate?.toLocaleDateString() || 'never'})`,
    })

    if (!isReconciled) {
      recommendations.push(`Reconcile "${account.accountName}" to meet ${jurisdiction.regulatoryBody} requirements`)
    }
  }

  // Check 3: Currency match
  for (const account of trustAccounts) {
    const currencyMatch = account.currency === jurisdiction.currency

    checks.push({
      requirement: `Account currency is ${jurisdiction.currency}`,
      passed: currencyMatch,
      details: currencyMatch
        ? `Account "${account.accountName}" uses correct currency (${jurisdiction.currency})`
        : `Account "${account.accountName}" uses ${account.currency}, expected ${jurisdiction.currency}`,
    })

    if (!currencyMatch) {
      recommendations.push(`Consider using ${jurisdiction.currency} for ${jurisdiction.name} trust accounts`)
    }
  }

  // Check 4: No negative balances
  const negativeLedgers = await prisma.clientTrustLedger.findMany({
    where: {
      trustAccount: { organizationId, jurisdiction: jurisdictionCode },
      balance: { lt: 0 },
    },
  })

  checks.push({
    requirement: 'No negative client balances',
    passed: negativeLedgers.length === 0,
    details: negativeLedgers.length === 0
      ? 'All client ledgers have non-negative balances'
      : `${negativeLedgers.length} client ledger(s) have negative balances`,
  })

  if (negativeLedgers.length > 0) {
    recommendations.push('Immediately address negative client balances to maintain compliance')
  }

  const isCompliant = checks.every((c) => c.passed)

  return {
    jurisdiction,
    isCompliant,
    checks,
    recommendations,
  }
}

// ============================================================================
// GET AVAILABLE JURISDICTIONS
// ============================================================================

export function getAvailableJurisdictions(): Array<{
  code: string
  name: string
  country: string
  currency: string
}> {
  return ALL_INTERNATIONAL_JURISDICTIONS.map((j) => ({
    code: j.code,
    name: j.name,
    country: j.country,
    currency: j.currency,
  }))
}

export function getJurisdictionRequirements(code: string): string[] {
  const jurisdiction = getJurisdictionByCode(code)
  return jurisdiction?.specialRequirements || []
}
