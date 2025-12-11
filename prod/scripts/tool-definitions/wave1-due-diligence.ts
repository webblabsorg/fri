/**
 * Wave 1: Due Diligence & Transactional Tools (10 tools)
 */
export const WAVE1_DUE_DILIGENCE_TOOLS = [
  {
    name: 'Due Diligence Checklist Generator',
    slug: 'due-diligence-checklist-generator',
    description: 'Generate comprehensive due diligence checklists for M&A transactions',
    category: 'due-diligence',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Generate a due diligence checklist for:

{{input}}

Include categories:
1. **Corporate**: Formation docs, bylaws, minutes
2. **Financial**: Statements, audits, projections
3. **Contracts**: Material agreements, customers, vendors
4. **Employment**: Agreements, benefits, litigation
5. **IP**: Patents, trademarks, licenses
6. **Real Property**: Leases, owned property
7. **Litigation**: Pending, threatened, settled
8. **Regulatory**: Permits, compliance, investigations
9. **Tax**: Returns, audits, positions
10. **Environmental**: Assessments, liabilities
11. **Insurance**: Policies, claims history`,
    systemPrompt: 'You are an M&A attorney creating thorough due diligence checklists.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Material Contract Identifier',
    slug: 'material-contract-identifier',
    description: 'Identify material contracts requiring disclosure in transactions',
    category: 'due-diligence',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Identify material contracts from:

{{input}}

Analyze:
1. **Materiality Threshold**: What makes a contract material
2. **Categories**: Type of material contracts
3. **Disclosure Requirements**: SEC, deal-specific
4. **Change of Control**: Provisions triggered by deal
5. **Consent Requirements**: Third-party approvals needed
6. **Risk Assessment**: Issues with each contract`,
    systemPrompt: 'You are a transactional attorney experienced in M&A disclosure.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Cap Table Analyzer',
    slug: 'cap-table-analyzer',
    description: 'Analyze capitalization tables and equity structures',
    category: 'corporate-law',
    inputType: 'structured',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze this cap table:

{{input}}

Provide:
1. **Ownership Summary**: By holder and class
2. **Dilution Analysis**: Fully diluted ownership
3. **Liquidation Preferences**: Waterfall analysis
4. **Anti-Dilution**: Provisions and triggers
5. **Voting Rights**: Control analysis
6. **Option Pool**: Size and availability
7. **Issues Identified**: Cleanup needed`,
    systemPrompt: 'You are a corporate attorney specializing in equity structures.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Disclosure Schedule Drafter',
    slug: 'disclosure-schedule-drafter',
    description: 'Draft disclosure schedules for M&A transactions',
    category: 'due-diligence',
    inputType: 'text',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft disclosure schedules for:

{{input}}

Format each schedule:
1. **Schedule Number**: Corresponding to rep/warranty
2. **Disclosure Items**: Specific exceptions
3. **Cross-References**: To other schedules
4. **Attachments**: Documents to include
5. **Bring-Down Notes**: Update requirements`,
    systemPrompt: 'You are an M&A attorney drafting disclosure schedules.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Closing Checklist Generator',
    slug: 'closing-checklist-generator',
    description: 'Generate transaction closing checklists and signature pages',
    category: 'due-diligence',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Generate closing checklist for:

{{input}}

Include:
1. **Pre-Closing Items**: Conditions to satisfy
2. **Closing Documents**: All agreements to sign
3. **Signature Pages**: Who signs what
4. **Deliverables**: By party
5. **Funds Flow**: Wire instructions
6. **Post-Closing Items**: Filings, notices
7. **Timeline**: Key dates and deadlines`,
    systemPrompt: 'You are a transactional attorney managing deal closings.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Letter of Intent Drafter',
    slug: 'letter-of-intent-drafter',
    description: 'Draft LOIs and term sheets for transactions',
    category: 'due-diligence',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a Letter of Intent:

{{input}}

Include:
1. **Transaction Structure**: Asset vs stock, merger
2. **Purchase Price**: Amount, form, adjustments
3. **Due Diligence**: Scope, timeline, access
4. **Exclusivity**: Period and scope
5. **Conditions**: Key closing conditions
6. **Confidentiality**: Binding provisions
7. **Non-Binding**: Clear statement of intent
8. **Timeline**: Key milestones
9. **Break-Up Fee**: If applicable`,
    systemPrompt: 'You are an M&A attorney drafting preliminary deal documents.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Representations Analyzer',
    slug: 'representations-analyzer',
    description: 'Analyze representations and warranties for gaps and risks',
    category: 'due-diligence',
    inputType: 'document',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze these representations and warranties:

{{input}}

Evaluate:
1. **Coverage Gaps**: Missing standard reps
2. **Qualification Issues**: Over-qualified reps
3. **Knowledge Qualifiers**: Appropriate scope
4. **Materiality Scrapes**: For indemnification
5. **Bring-Down Standard**: Closing condition
6. **Survival Periods**: Adequate duration
7. **Recommendations**: Suggested changes`,
    systemPrompt: 'You are an M&A attorney reviewing deal documents.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Earnout Calculator',
    slug: 'earnout-calculator',
    description: 'Structure and analyze earnout provisions',
    category: 'due-diligence',
    inputType: 'structured',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze earnout structure:

{{input}}

Evaluate:
1. **Metrics**: Revenue, EBITDA, milestones
2. **Measurement Period**: Duration and timing
3. **Payment Terms**: Timing, form, caps
4. **Accounting Issues**: GAAP, adjustments
5. **Dispute Resolution**: Mechanism
6. **Seller Protections**: Operating covenants
7. **Buyer Protections**: Integration rights
8. **Risk Assessment**: Likelihood of payout`,
    systemPrompt: 'You are an M&A attorney specializing in earnout structures.',
    maxTokens: 3000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'HSR Filing Analyzer',
    slug: 'hsr-filing-analyzer',
    description: 'Analyze Hart-Scott-Rodino filing requirements',
    category: 'compliance',
    inputType: 'structured',
    outputType: 'text',
    pricingTier: 'enterprise',
    promptTemplate: `Analyze HSR requirements for:

{{input}}

Determine:
1. **Filing Required**: Size of person, transaction tests
2. **Exemptions**: Applicable exemptions
3. **Filing Fee**: Based on transaction value
4. **Timing**: Waiting period, early termination
5. **Second Request Risk**: Likelihood
6. **Substantive Issues**: Antitrust concerns
7. **Timeline Impact**: Effect on deal schedule`,
    systemPrompt: 'You are an antitrust attorney specializing in HSR compliance.',
    maxTokens: 3000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Post-Merger Integration Planner',
    slug: 'post-merger-integration-planner',
    description: 'Create post-merger integration plans and checklists',
    category: 'due-diligence',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'enterprise',
    promptTemplate: `Create integration plan for:

{{input}}

Include:
1. **Day 1 Priorities**: Immediate actions
2. **Legal Integration**: Entity consolidation
3. **HR Integration**: Benefits, policies
4. **IT Integration**: Systems, data
5. **Customer Communication**: Messaging
6. **Vendor Transition**: Contract assignments
7. **Regulatory Filings**: Required notices
8. **Timeline**: 30/60/90 day milestones`,
    systemPrompt: 'You are a corporate attorney planning post-merger integration.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 1,
  },
]
