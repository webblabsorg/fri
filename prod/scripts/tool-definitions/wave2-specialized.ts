/**
 * Wave 2: Specialized Practice Area Tools (25 tools)
 */
export const WAVE2_SPECIALIZED_TOOLS = [
  {
    name: 'Medical Record Summarizer',
    slug: 'medical-record-summarizer',
    description: 'Summarize medical records for legal proceedings',
    category: 'medical-legal',
    inputType: 'document',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Summarize these medical records:

{{input}}

Provide:
1. **Patient Demographics**: Name, DOB, relevant history
2. **Chronological Summary**: Date-by-date treatment
3. **Diagnoses**: All conditions identified
4. **Treatments**: Procedures, medications
5. **Provider Notes**: Key observations
6. **Causation Analysis**: Injury relationship
7. **Prognosis**: Future treatment needs
8. **Key Documents**: Most important records`,
    systemPrompt: 'You are a medical-legal expert. Use proper medical terminology.',
    maxTokens: 6000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Medical Chronology Builder',
    slug: 'medical-chronology-builder',
    description: 'Create detailed medical chronologies for litigation',
    category: 'medical-legal',
    inputType: 'document',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Create a medical chronology from:

{{input}}

Format as table:
| Date | Provider | Facility | Summary | Bates # |

Include:
1. All medical encounters
2. Diagnostic tests and results
3. Medications prescribed
4. Referrals made
5. Patient complaints
6. Treatment recommendations`,
    systemPrompt: 'You are a legal nurse consultant creating medical chronologies.',
    maxTokens: 6000,
    temperature: 0.3,
    wave: 2,
  },
  {
    name: 'Life Care Plan Analyzer',
    slug: 'life-care-plan-analyzer',
    description: 'Analyze life care plans for damages calculations',
    category: 'medical-legal',
    inputType: 'document',
    outputType: 'text',
    pricingTier: 'enterprise',
    promptTemplate: `Analyze this life care plan:

{{input}}

Evaluate:
1. **Methodology**: Appropriate standards used
2. **Medical Necessity**: Each item justified
3. **Cost Estimates**: Reasonable and current
4. **Duration**: Life expectancy basis
5. **Gaps**: Missing care needs
6. **Excessive Items**: Potentially inflated
7. **Cross-Examination Points**: Weaknesses`,
    systemPrompt: 'You are a life care plan expert.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Immigration Form Preparer',
    slug: 'immigration-form-preparer',
    description: 'Prepare immigration forms and petitions',
    category: 'immigration',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Prepare immigration form:

{{input}}

Provide:
1. **Form Identification**: Correct form number
2. **Required Information**: All fields
3. **Supporting Documents**: Checklist
4. **Filing Instructions**: Where and how
5. **Fees**: Current filing fees
6. **Processing Times**: Expected timeline
7. **Common Errors**: What to avoid`,
    systemPrompt: 'You are an immigration attorney preparing USCIS forms.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Visa Eligibility Analyzer',
    slug: 'visa-eligibility-analyzer',
    description: 'Analyze eligibility for various visa categories',
    category: 'immigration',
    inputType: 'structured',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze visa eligibility for:

{{input}}

Evaluate:
1. **Visa Categories**: All potentially applicable
2. **Eligibility Analysis**: Requirements met/unmet
3. **Best Option**: Recommended category
4. **Timeline**: Processing expectations
5. **Risks**: Potential issues
6. **Alternative Strategies**: Backup options`,
    systemPrompt: 'You are an immigration attorney advising on visa options.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Asylum Case Analyzer',
    slug: 'asylum-case-analyzer',
    description: 'Analyze asylum claims and supporting evidence',
    category: 'immigration',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze this asylum case:

{{input}}

Evaluate:
1. **Protected Ground**: Race, religion, nationality, PSG, political opinion
2. **Persecution**: Past or well-founded fear
3. **Nexus**: Connection to protected ground
4. **Country Conditions**: Supporting evidence
5. **Credibility Issues**: Potential concerns
6. **Bars to Asylum**: One-year, firm resettlement
7. **Corroborating Evidence**: What to gather`,
    systemPrompt: 'You are an asylum attorney analyzing claims.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Bankruptcy Means Test Calculator',
    slug: 'bankruptcy-means-test-calculator',
    description: 'Calculate Chapter 7 means test eligibility',
    category: 'bankruptcy',
    inputType: 'structured',
    outputType: 'json',
    pricingTier: 'pro',
    promptTemplate: `Calculate means test for:

{{input}}

Provide:
1. **Current Monthly Income**: Calculation
2. **Median Income Comparison**: By state/household
3. **Allowed Deductions**: IRS standards
4. **Disposable Income**: Net result
5. **Chapter 7 Eligibility**: Pass/fail
6. **Chapter 13 Option**: If 7 fails
7. **Recommendations**: Best path forward`,
    systemPrompt: 'You are a bankruptcy attorney calculating means tests.',
    maxTokens: 3000,
    temperature: 0.3,
    wave: 2,
  },
  {
    name: 'Bankruptcy Petition Preparer',
    slug: 'bankruptcy-petition-preparer',
    description: 'Prepare bankruptcy petition schedules',
    category: 'bankruptcy',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Prepare bankruptcy schedules for:

{{input}}

Complete:
1. **Schedule A/B**: Property
2. **Schedule C**: Exemptions
3. **Schedule D**: Secured creditors
4. **Schedule E/F**: Priority and unsecured
5. **Schedule G**: Executory contracts
6. **Schedule H**: Codebtors
7. **Schedule I**: Income
8. **Schedule J**: Expenses
9. **SOFA**: Statement of Financial Affairs`,
    systemPrompt: 'You are a bankruptcy attorney preparing petitions.',
    maxTokens: 6000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Tax Controversy Analyzer',
    slug: 'tax-controversy-analyzer',
    description: 'Analyze tax disputes and resolution options',
    category: 'tax-law',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze this tax controversy:

{{input}}

Evaluate:
1. **Issue Identification**: Tax positions at issue
2. **Legal Analysis**: Applicable law
3. **Hazards of Litigation**: Likelihood of success
4. **Resolution Options**: Audit, appeals, litigation
5. **Settlement Strategies**: Negotiation approach
6. **Penalty Abatement**: Reasonable cause
7. **Statute of Limitations**: Timing issues`,
    systemPrompt: 'You are a tax controversy attorney.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Estate Planning Questionnaire',
    slug: 'estate-planning-questionnaire',
    description: 'Generate comprehensive estate planning intake questionnaires',
    category: 'specialized-areas',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'pro',
    promptTemplate: `Generate estate planning questionnaire for:

{{input}}

Include sections:
1. **Personal Information**: Client and family
2. **Assets**: Real property, accounts, business
3. **Liabilities**: Debts and obligations
4. **Beneficiaries**: Who inherits what
5. **Fiduciaries**: Executors, trustees, guardians
6. **Healthcare Directives**: Wishes
7. **Special Circumstances**: Blended families, special needs`,
    systemPrompt: 'You are an estate planning attorney.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Trust Drafter',
    slug: 'trust-drafter',
    description: 'Draft revocable and irrevocable trusts',
    category: 'specialized-areas',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a trust agreement:

{{input}}

Include:
1. **Trust Name and Type**
2. **Settlor Declaration**
3. **Trust Property**: Initial funding
4. **Beneficiaries**: Primary and contingent
5. **Distributions**: Standards and timing
6. **Trustee Powers**: Administrative provisions
7. **Successor Trustees**
8. **Amendment/Revocation**: If revocable
9. **Tax Provisions**: GST, income
10. **Spendthrift Clause**`,
    systemPrompt: 'You are an estate planning attorney drafting trusts.',
    maxTokens: 6000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Probate Checklist Generator',
    slug: 'probate-checklist-generator',
    description: 'Generate probate administration checklists',
    category: 'specialized-areas',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'pro',
    promptTemplate: `Generate probate checklist for:

{{input}}

Include:
1. **Initial Steps**: Death certificate, will
2. **Court Filings**: Petition, notices
3. **Asset Inventory**: Identification and valuation
4. **Creditor Claims**: Notice and payment
5. **Tax Filings**: Estate and income
6. **Distributions**: To beneficiaries
7. **Final Accounting**: Court approval
8. **Timeline**: Key deadlines`,
    systemPrompt: 'You are a probate attorney.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Divorce Financial Analyzer',
    slug: 'divorce-financial-analyzer',
    description: 'Analyze marital finances for divorce proceedings',
    category: 'family-law',
    inputType: 'structured',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze divorce finances:

{{input}}

Evaluate:
1. **Marital vs Separate Property**: Classification
2. **Asset Valuation**: Current values
3. **Hidden Assets**: Red flags
4. **Debt Allocation**: Responsibility
5. **Income Analysis**: Both parties
6. **Support Calculations**: Alimony, child support
7. **Tax Implications**: Filing status, transfers
8. **Settlement Options**: Scenarios`,
    systemPrompt: 'You are a family law financial expert.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Child Custody Evaluator',
    slug: 'child-custody-evaluator',
    description: 'Analyze custody factors and best interests',
    category: 'family-law',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze custody factors:

{{input}}

Evaluate best interests:
1. **Child's Wishes**: Age-appropriate
2. **Parent-Child Relationship**: Each parent
3. **Stability**: Home, school, community
4. **Mental/Physical Health**: All parties
5. **Domestic Violence**: History
6. **Co-Parenting Ability**: Cooperation
7. **Parenting Plan**: Recommended schedule
8. **Legal vs Physical Custody**: Recommendations`,
    systemPrompt: 'You are a family law attorney analyzing custody.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Prenuptial Agreement Drafter',
    slug: 'prenuptial-agreement-drafter',
    description: 'Draft prenuptial and postnuptial agreements',
    category: 'family-law',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a prenuptial agreement:

{{input}}

Include:
1. **Recitals**: Purpose and disclosures
2. **Separate Property**: Definition and treatment
3. **Marital Property**: Division rules
4. **Spousal Support**: Waiver or terms
5. **Debt Allocation**
6. **Death Provisions**: Estate rights
7. **Sunset Clause**: If applicable
8. **Full Disclosure**: Schedules of assets`,
    systemPrompt: 'You are a family law attorney drafting prenups.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Criminal Sentencing Analyzer',
    slug: 'criminal-sentencing-analyzer',
    description: 'Analyze sentencing guidelines and options',
    category: 'criminal-law',
    inputType: 'structured',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze sentencing for:

{{input}}

Evaluate:
1. **Offense Level**: Base and adjustments
2. **Criminal History**: Category calculation
3. **Guidelines Range**: Months
4. **Departures**: Grounds for variance
5. **Mandatory Minimums**: If applicable
6. **Mitigation Factors**: Arguments
7. **Sentencing Recommendation**: Strategy`,
    systemPrompt: 'You are a criminal defense attorney analyzing sentencing.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Criminal Discovery Analyzer',
    slug: 'criminal-discovery-analyzer',
    description: 'Analyze criminal discovery for defense strategy',
    category: 'criminal-law',
    inputType: 'document',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze criminal discovery:

{{input}}

Identify:
1. **Key Evidence**: Strongest prosecution evidence
2. **Weaknesses**: Gaps in prosecution case
3. **Brady Material**: Exculpatory evidence
4. **Witness Issues**: Credibility problems
5. **Suppression Issues**: 4th/5th/6th Amendment
6. **Defense Theories**: Viable defenses
7. **Investigation Needs**: What to develop`,
    systemPrompt: 'You are a criminal defense attorney reviewing discovery.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Environmental Compliance Checker',
    slug: 'environmental-compliance-checker',
    description: 'Check environmental regulatory compliance',
    category: 'environmental',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Check environmental compliance for:

{{input}}

Evaluate:
1. **Applicable Regulations**: Federal, state, local
2. **Permits Required**: Air, water, waste
3. **Reporting Obligations**: TRI, EPCRA
4. **Compliance Status**: Current standing
5. **Violations**: Potential issues
6. **Remediation**: Required actions
7. **Enforcement Risk**: Likelihood`,
    systemPrompt: 'You are an environmental attorney.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Real Estate Due Diligence',
    slug: 'real-estate-due-diligence',
    description: 'Conduct real estate transaction due diligence',
    category: 'real-estate',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Conduct due diligence for:

{{input}}

Review:
1. **Title**: Ownership, encumbrances
2. **Survey**: Boundaries, easements
3. **Zoning**: Current and permitted uses
4. **Environmental**: Phase I findings
5. **Leases**: Tenant obligations
6. **Contracts**: Service agreements
7. **Permits**: Building, occupancy
8. **Issues Identified**: Red flags`,
    systemPrompt: 'You are a real estate attorney conducting due diligence.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Commercial Lease Analyzer',
    slug: 'commercial-lease-analyzer',
    description: 'Analyze commercial lease terms and negotiate',
    category: 'real-estate',
    inputType: 'document',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze this commercial lease:

{{input}}

Evaluate:
1. **Rent Structure**: Base, CAM, escalations
2. **Term**: Initial and options
3. **Use Clause**: Restrictions
4. **Exclusives**: Protected uses
5. **Assignment/Subletting**: Flexibility
6. **Maintenance**: Landlord vs tenant
7. **Default Provisions**: Cure periods
8. **Negotiation Points**: Key issues`,
    systemPrompt: 'You are a commercial real estate attorney.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Securities Disclosure Analyzer',
    slug: 'securities-disclosure-analyzer',
    description: 'Analyze SEC disclosure requirements',
    category: 'corporate-law',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'enterprise',
    promptTemplate: `Analyze securities disclosure for:

{{input}}

Evaluate:
1. **Disclosure Requirements**: Applicable rules
2. **Material Information**: What must be disclosed
3. **Risk Factors**: Required disclosures
4. **MD&A**: Management discussion
5. **Related Party**: Transactions
6. **Timing**: Filing deadlines
7. **Liability Exposure**: Potential issues`,
    systemPrompt: 'You are a securities attorney.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Corporate Governance Advisor',
    slug: 'corporate-governance-advisor',
    description: 'Advise on corporate governance best practices',
    category: 'corporate-law',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Advise on corporate governance:

{{input}}

Address:
1. **Board Composition**: Independence, diversity
2. **Committees**: Audit, compensation, nominating
3. **Fiduciary Duties**: Care, loyalty
4. **Conflicts of Interest**: Policies
5. **Executive Compensation**: Best practices
6. **Shareholder Rights**: Engagement
7. **Recommendations**: Improvements`,
    systemPrompt: 'You are a corporate governance expert.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Employee Handbook Drafter',
    slug: 'employee-handbook-drafter',
    description: 'Draft comprehensive employee handbooks',
    category: 'employment-law',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft an employee handbook for:

{{input}}

Include:
1. **Welcome and At-Will**: Introduction
2. **EEO and Anti-Harassment**: Policies
3. **Employment Policies**: Classification, hours
4. **Compensation**: Pay practices
5. **Benefits**: Overview
6. **Time Off**: PTO, leaves
7. **Conduct**: Standards, discipline
8. **Safety**: Workplace safety
9. **Technology**: Acceptable use
10. **Acknowledgment**: Receipt form`,
    systemPrompt: 'You are an employment attorney drafting handbooks.',
    maxTokens: 8000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Workplace Investigation Guide',
    slug: 'workplace-investigation-guide',
    description: 'Guide workplace investigations for HR and legal',
    category: 'employment-law',
    inputType: 'text',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Create investigation plan for:

{{input}}

Include:
1. **Scope**: What to investigate
2. **Investigator**: Who should conduct
3. **Witnesses**: Who to interview
4. **Documents**: What to collect
5. **Interview Questions**: For each witness
6. **Timeline**: Investigation schedule
7. **Confidentiality**: Protections
8. **Report Template**: Findings format`,
    systemPrompt: 'You are an employment attorney guiding investigations.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'ADA Accommodation Analyzer',
    slug: 'ada-accommodation-analyzer',
    description: 'Analyze ADA accommodation requests',
    category: 'employment-law',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze ADA accommodation request:

{{input}}

Evaluate:
1. **Disability**: Qualifying condition
2. **Essential Functions**: Job requirements
3. **Requested Accommodation**: What is asked
4. **Interactive Process**: Steps taken
5. **Reasonable Accommodations**: Options
6. **Undue Hardship**: Analysis
7. **Recommendation**: Grant, modify, or deny`,
    systemPrompt: 'You are an employment attorney specializing in ADA.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 2,
  },
]
