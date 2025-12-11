/**
 * Wave 1: Contract Tools (15 tools)
 */
export const WAVE1_CONTRACT_TOOLS = [
  {
    name: 'NDA Generator Pro',
    slug: 'nda-generator-pro',
    description: 'Generate customized NDAs for any business relationship',
    category: 'contract-review',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'pro',
    promptTemplate: `Generate a Non-Disclosure Agreement based on:

{{input}}

Include these sections:
1. **Parties**: Full legal names and addresses
2. **Recitals**: Purpose of the agreement
3. **Definition of Confidential Information**: Comprehensive definition
4. **Obligations of Receiving Party**: Use restrictions, care standards
5. **Exclusions**: What is not confidential
6. **Term**: Duration of obligations
7. **Return of Materials**: Upon termination
8. **Remedies**: Injunctive relief, damages
9. **General Provisions**: Governing law, entire agreement, amendments
10. **Signature Blocks**`,
    systemPrompt: 'You are a corporate attorney drafting enforceable NDAs. Use clear, professional language.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Employment Agreement Builder',
    slug: 'employment-agreement-builder',
    description: 'Create comprehensive employment contracts with all key provisions',
    category: 'employment-law',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft an employment agreement based on:

{{input}}

Include:
1. **Position and Duties**: Title, responsibilities, reporting
2. **Compensation**: Base salary, bonuses, equity
3. **Benefits**: Health, retirement, PTO
4. **Term**: At-will or fixed term
5. **Termination**: For cause, without cause, resignation
6. **Severance**: If applicable
7. **Non-Competition**: Scope, duration, geography
8. **Non-Solicitation**: Employees and customers
9. **Confidentiality**: Trade secrets, proprietary information
10. **IP Assignment**: Work product ownership
11. **Dispute Resolution**: Arbitration or litigation
12. **General Provisions**`,
    systemPrompt: 'You are an employment law attorney drafting balanced, enforceable agreements.',
    maxTokens: 6000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'SaaS Agreement Drafter',
    slug: 'saas-agreement-drafter',
    description: 'Generate SaaS subscription agreements and terms of service',
    category: 'contract-review',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a SaaS Agreement based on:

{{input}}

Include:
1. **Service Description**: What is being provided
2. **Subscription Terms**: Tiers, pricing, renewals
3. **Service Level Agreement**: Uptime, support response
4. **Data Handling**: Security, privacy, processing
5. **Customer Responsibilities**: Acceptable use
6. **Intellectual Property**: Ownership, licenses
7. **Limitation of Liability**: Caps, exclusions
8. **Indemnification**: Mutual obligations
9. **Termination**: For cause, convenience
10. **Data Portability**: Export rights
11. **General Provisions**`,
    systemPrompt: 'You are a technology transactions attorney specializing in SaaS agreements.',
    maxTokens: 6000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Master Services Agreement',
    slug: 'master-services-agreement',
    description: 'Draft MSAs for ongoing service relationships',
    category: 'contract-review',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a Master Services Agreement:

{{input}}

Include:
1. **Scope of Services**: General framework
2. **Statement of Work Process**: How SOWs are created
3. **Pricing and Payment**: Rates, invoicing, terms
4. **Personnel**: Key personnel, subcontractors
5. **Deliverables**: Acceptance criteria
6. **Change Orders**: Process for modifications
7. **Warranties**: Service quality standards
8. **Confidentiality**: Mutual obligations
9. **IP Rights**: Work product ownership
10. **Indemnification**: Mutual protections
11. **Limitation of Liability**
12. **Term and Termination**
13. **Insurance Requirements**`,
    systemPrompt: 'You are a commercial contracts attorney.',
    maxTokens: 7000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Licensing Agreement Generator',
    slug: 'licensing-agreement-generator',
    description: 'Create IP licensing agreements for software, patents, and content',
    category: 'intellectual-property',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a Licensing Agreement:

{{input}}

Include:
1. **Licensed Property**: Description of IP
2. **Grant of License**: Scope, exclusivity, territory
3. **Restrictions**: Prohibited uses
4. **Royalties**: Payment terms, reporting
5. **Quality Control**: Standards, approval rights
6. **IP Ownership**: Retained rights
7. **Warranties**: Title, non-infringement
8. **Infringement**: Enforcement rights
9. **Term and Termination**
10. **Post-Termination**: Wind-down rights`,
    systemPrompt: 'You are an IP licensing attorney.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Partnership Agreement Drafter',
    slug: 'partnership-agreement-drafter',
    description: 'Draft partnership and joint venture agreements',
    category: 'corporate-law',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a Partnership Agreement:

{{input}}

Include:
1. **Partnership Name and Purpose**
2. **Capital Contributions**: Initial and additional
3. **Profit and Loss Allocation**
4. **Management and Voting**: Decision-making
5. **Partner Duties**: Fiduciary obligations
6. **Distributions**: Timing and priority
7. **Transfer Restrictions**: Buy-sell provisions
8. **New Partners**: Admission process
9. **Withdrawal and Expulsion**
10. **Dissolution**: Triggers and process
11. **Non-Compete**: During and after
12. **Dispute Resolution**`,
    systemPrompt: 'You are a business law attorney specializing in partnerships.',
    maxTokens: 6000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Lease Agreement Generator',
    slug: 'lease-agreement-generator',
    description: 'Generate commercial and residential lease agreements',
    category: 'real-estate',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'pro',
    promptTemplate: `Draft a Lease Agreement:

{{input}}

Include:
1. **Parties and Premises**: Description of property
2. **Term**: Start date, duration, renewal
3. **Rent**: Amount, due date, late fees
4. **Security Deposit**: Amount, conditions
5. **Use Restrictions**: Permitted uses
6. **Maintenance**: Landlord vs tenant obligations
7. **Utilities**: Who pays what
8. **Insurance**: Requirements
9. **Alterations**: Approval process
10. **Assignment/Subletting**: Restrictions
11. **Default and Remedies**
12. **Termination**: Notice requirements`,
    systemPrompt: 'You are a real estate attorney.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Consulting Agreement Builder',
    slug: 'consulting-agreement-builder',
    description: 'Create independent contractor and consulting agreements',
    category: 'contract-review',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'pro',
    promptTemplate: `Draft a Consulting Agreement:

{{input}}

Include:
1. **Services**: Scope of work
2. **Independent Contractor Status**: Clear classification
3. **Compensation**: Fees, expenses, invoicing
4. **Term**: Duration, renewal
5. **Confidentiality**: NDA provisions
6. **IP Assignment**: Work product ownership
7. **Non-Solicitation**: If applicable
8. **Insurance**: Requirements
9. **Indemnification**
10. **Termination**: Notice, wind-down`,
    systemPrompt: 'You are a contracts attorney. Ensure proper independent contractor classification.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Purchase Agreement Drafter',
    slug: 'purchase-agreement-drafter',
    description: 'Draft asset and stock purchase agreements',
    category: 'due-diligence',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'enterprise',
    promptTemplate: `Draft a Purchase Agreement:

{{input}}

Include:
1. **Transaction Structure**: Asset vs stock
2. **Purchase Price**: Amount, adjustments
3. **Payment Terms**: Closing, earnout, escrow
4. **Assets/Shares**: What is being acquired
5. **Assumed Liabilities**: What buyer takes on
6. **Representations and Warranties**: Seller and buyer
7. **Covenants**: Pre and post-closing
8. **Conditions to Closing**
9. **Indemnification**: Baskets, caps, survival
10. **Termination Rights**
11. **Schedules and Exhibits**`,
    systemPrompt: 'You are an M&A attorney.',
    maxTokens: 8000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Terms of Service Generator',
    slug: 'terms-of-service-generator',
    description: 'Create website and app terms of service',
    category: 'contract-review',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'pro',
    promptTemplate: `Draft Terms of Service:

{{input}}

Include:
1. **Acceptance of Terms**
2. **Service Description**
3. **User Accounts**: Registration, security
4. **Acceptable Use Policy**
5. **User Content**: Ownership, license
6. **Intellectual Property**
7. **Third-Party Links**
8. **Disclaimers**
9. **Limitation of Liability**
10. **Indemnification**
11. **Termination**
12. **Governing Law**
13. **Dispute Resolution**
14. **Changes to Terms**`,
    systemPrompt: 'You are a technology attorney drafting consumer-facing terms.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Privacy Policy Generator',
    slug: 'privacy-policy-generator',
    description: 'Generate GDPR and CCPA compliant privacy policies',
    category: 'cybersecurity',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'pro',
    promptTemplate: `Draft a Privacy Policy:

{{input}}

Include (GDPR/CCPA compliant):
1. **Information We Collect**: Categories of data
2. **How We Collect**: Sources
3. **How We Use Information**: Purposes
4. **Legal Basis**: For processing (GDPR)
5. **Sharing and Disclosure**: Third parties
6. **Data Retention**: How long kept
7. **Your Rights**: Access, deletion, portability
8. **Security Measures**
9. **International Transfers**
10. **Children's Privacy**
11. **Changes to Policy**
12. **Contact Information**`,
    systemPrompt: 'You are a privacy attorney. Ensure GDPR and CCPA compliance.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 1,
  },
  {
    name: 'Vendor Agreement Analyzer',
    slug: 'vendor-agreement-analyzer',
    description: 'Analyze vendor contracts for risks and issues',
    category: 'contract-review',
    inputType: 'document',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze this vendor agreement:

{{input}}

Evaluate:
1. **Pricing Terms**: Fairness, hidden costs
2. **Service Levels**: Adequacy, remedies
3. **Liability Caps**: Sufficient protection?
4. **Indemnification**: Balanced?
5. **Data Security**: Adequate provisions?
6. **Termination Rights**: Flexibility
7. **Auto-Renewal**: Traps
8. **Key Risks**: Red flags
9. **Negotiation Points**: What to push back on
10. **Overall Assessment**: Approve/Negotiate/Reject`,
    systemPrompt: 'You are a procurement attorney reviewing vendor contracts.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Contract Clause Library',
    slug: 'contract-clause-library',
    description: 'Generate standard contract clauses for any situation',
    category: 'contract-review',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Generate contract clauses for:

{{input}}

Provide:
1. **Standard Version**: Balanced language
2. **Pro-Drafter Version**: Favorable to our client
3. **Fallback Position**: Minimum acceptable
4. **Explanation**: What each version accomplishes
5. **Negotiation Tips**: How to present each version`,
    systemPrompt: 'You are a contracts attorney with extensive drafting experience.',
    maxTokens: 3000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Force Majeure Analyzer',
    slug: 'force-majeure-analyzer',
    description: 'Analyze force majeure clauses and applicability',
    category: 'contract-review',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Analyze this force majeure situation:

{{input}}

Evaluate:
1. **Clause Language**: Scope and triggers
2. **Event Analysis**: Does situation qualify?
3. **Notice Requirements**: What must be done
4. **Mitigation Obligations**: Required steps
5. **Consequences**: Suspension vs termination
6. **Case Law**: Relevant precedents
7. **Recommendation**: Claim viability`,
    systemPrompt: 'You are a contracts litigator experienced in force majeure disputes.',
    maxTokens: 3000,
    temperature: 0.5,
    wave: 1,
  },
  {
    name: 'Contract Comparison Tool',
    slug: 'contract-comparison-tool',
    description: 'Compare two contract versions and highlight differences',
    category: 'contract-review',
    inputType: 'document',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Compare these two contract versions:

{{input}}

Provide:
1. **Material Changes**: Significant differences
2. **Risk Assessment**: How changes affect risk
3. **Favorable Changes**: Improvements
4. **Unfavorable Changes**: Concerns
5. **Missing Provisions**: What was removed
6. **Added Provisions**: What was added
7. **Recommendation**: Accept, negotiate, or reject`,
    systemPrompt: 'You are a contracts attorney skilled at redline review.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 1,
  },
]
