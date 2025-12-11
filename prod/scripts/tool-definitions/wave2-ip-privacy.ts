/**
 * Wave 2: Intellectual Property & Privacy Tools (20 tools)
 */
export const WAVE2_IP_PRIVACY_TOOLS = [
  {
    name: 'Patent Application Drafter',
    slug: 'patent-application-drafter',
    description: 'Draft patent applications with claims and specifications',
    category: 'intellectual-property',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'enterprise',
    promptTemplate: `Draft a patent application for:

{{input}}

Include:
1. **Title of Invention**
2. **Cross-References**: Related applications
3. **Field of Invention**
4. **Background**: Prior art, problems solved
5. **Summary of Invention**
6. **Brief Description of Drawings**
7. **Detailed Description**: Best mode
8. **Claims**:
   - Independent claims
   - Dependent claims
9. **Abstract**`,
    systemPrompt: 'You are a patent attorney with technical expertise. Draft claims that are both broad and defensible.',
    maxTokens: 8000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Patent Claim Analyzer',
    slug: 'patent-claim-analyzer',
    description: 'Analyze patent claims for scope and validity',
    category: 'intellectual-property',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze these patent claims:

{{input}}

Provide:
1. **Claim Scope**: What is covered
2. **Claim Elements**: Breakdown of limitations
3. **Validity Issues**: Potential 101, 102, 103 problems
4. **Infringement Analysis**: What would infringe
5. **Design-Around Options**: How to avoid
6. **Claim Amendments**: Suggested improvements`,
    systemPrompt: 'You are a patent litigator analyzing claim scope.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Trademark Search Report',
    slug: 'trademark-search-report',
    description: 'Analyze trademark availability and conflicts',
    category: 'intellectual-property',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze trademark availability for:

{{input}}

Evaluate:
1. **Proposed Mark**: Description and class
2. **Identical Marks**: Direct conflicts
3. **Similar Marks**: Likelihood of confusion
4. **Common Law Usage**: Unregistered uses
5. **Domain Availability**: Web presence
6. **Risk Assessment**: Low/Medium/High
7. **Recommendations**: Proceed, modify, or abandon`,
    systemPrompt: 'You are a trademark attorney conducting clearance searches.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Trademark Application Drafter',
    slug: 'trademark-application-drafter',
    description: 'Draft trademark applications for USPTO filing',
    category: 'intellectual-property',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a trademark application:

{{input}}

Include:
1. **Mark**: Word mark or design description
2. **Owner Information**: Name, address, entity type
3. **Goods/Services**: Proper classification
4. **Filing Basis**: Use in commerce or ITU
5. **Specimen**: Description of use
6. **Dates of Use**: First use, commerce
7. **Declaration**: Required statements`,
    systemPrompt: 'You are a trademark attorney preparing USPTO filings.',
    maxTokens: 3000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Copyright Registration Helper',
    slug: 'copyright-registration-helper',
    description: 'Prepare copyright registration applications',
    category: 'intellectual-property',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'pro',
    promptTemplate: `Prepare copyright registration for:

{{input}}

Include:
1. **Work Type**: Literary, visual, musical, etc.
2. **Title**: Of the work
3. **Author Information**: Name, citizenship, work for hire
4. **Claimant**: Copyright owner
5. **Year of Completion**
6. **Publication Status**: Published or unpublished
7. **Deposit Requirements**: What to submit`,
    systemPrompt: 'You are an IP attorney handling copyright registrations.',
    maxTokens: 2000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'IP Assignment Drafter',
    slug: 'ip-assignment-drafter',
    description: 'Draft IP assignment agreements',
    category: 'intellectual-property',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft an IP Assignment Agreement:

{{input}}

Include:
1. **Parties**: Assignor and assignee
2. **Assigned IP**: Specific identification
3. **Consideration**: Payment terms
4. **Representations**: Title, no encumbrances
5. **Warranties**: Non-infringement
6. **Further Assurances**: Cooperation
7. **Recordation**: Filing requirements`,
    systemPrompt: 'You are an IP transactions attorney.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Trade Secret Audit',
    slug: 'trade-secret-audit',
    description: 'Audit trade secret protection measures',
    category: 'intellectual-property',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Audit trade secret protection for:

{{input}}

Evaluate:
1. **Identification**: What qualifies as trade secret
2. **Reasonable Measures**: Current protections
3. **Access Controls**: Who has access
4. **NDAs**: Coverage and enforcement
5. **Employee Agreements**: IP assignment, non-compete
6. **Gaps**: Missing protections
7. **Recommendations**: Improvements needed`,
    systemPrompt: 'You are a trade secret attorney conducting protection audits.',
    maxTokens: 4000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'GDPR Compliance Checker',
    slug: 'gdpr-compliance-checker',
    description: 'Analyze data practices for GDPR compliance',
    category: 'cybersecurity',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze GDPR compliance for:

{{input}}

Check:
1. **Lawful Basis**: For each processing activity
2. **Data Subject Rights**: Implementation status
3. **Privacy Notices**: Completeness
4. **Consent Mechanisms**: Validity
5. **Data Transfers**: Safeguards in place
6. **Security Measures**: Technical and organizational
7. **Breach Procedures**: Response plan
8. **DPO**: Requirement and appointment
9. **Records of Processing**: Documentation
10. **Compliance Score**: Overall assessment`,
    systemPrompt: 'You are a GDPR compliance expert.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'CCPA Compliance Analyzer',
    slug: 'ccpa-compliance-analyzer',
    description: 'Analyze California Consumer Privacy Act compliance',
    category: 'cybersecurity',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze CCPA compliance for:

{{input}}

Evaluate:
1. **Applicability**: Does CCPA apply
2. **Consumer Rights**: Right to know, delete, opt-out
3. **Privacy Policy**: Required disclosures
4. **Do Not Sell**: Implementation
5. **Service Provider Contracts**: Required terms
6. **Verification Procedures**: Identity confirmation
7. **Training**: Employee awareness
8. **Compliance Gaps**: Issues found`,
    systemPrompt: 'You are a privacy attorney specializing in CCPA.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Data Processing Agreement Drafter',
    slug: 'data-processing-agreement-drafter',
    description: 'Draft GDPR-compliant data processing agreements',
    category: 'cybersecurity',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a Data Processing Agreement:

{{input}}

Include (GDPR Article 28):
1. **Subject Matter and Duration**
2. **Nature and Purpose of Processing**
3. **Type of Personal Data**
4. **Categories of Data Subjects**
5. **Controller Instructions**
6. **Confidentiality**
7. **Security Measures**
8. **Sub-Processors**: Approval, flow-down
9. **Data Subject Rights**: Assistance
10. **Audit Rights**
11. **Data Return/Deletion**
12. **Standard Contractual Clauses**: If transfers`,
    systemPrompt: 'You are a privacy attorney drafting GDPR-compliant agreements.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Privacy Impact Assessment',
    slug: 'privacy-impact-assessment',
    description: 'Conduct privacy impact assessments for new projects',
    category: 'cybersecurity',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Conduct a Privacy Impact Assessment for:

{{input}}

Analyze:
1. **Project Description**: What is being done
2. **Data Flows**: What data, where it goes
3. **Necessity**: Is processing necessary
4. **Proportionality**: Is it proportionate
5. **Risks Identified**: To data subjects
6. **Mitigation Measures**: How to address risks
7. **Consultation**: DPO or authority input
8. **Recommendations**: Proceed, modify, or stop`,
    systemPrompt: 'You are a privacy professional conducting PIAs.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Data Breach Response Plan',
    slug: 'data-breach-response-plan',
    description: 'Create data breach response and notification plans',
    category: 'cybersecurity',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Create a data breach response plan for:

{{input}}

Include:
1. **Incident Response Team**: Roles and contacts
2. **Detection and Reporting**: How breaches are identified
3. **Containment**: Immediate steps
4. **Assessment**: Scope and impact
5. **Notification Requirements**: By jurisdiction
6. **Notification Templates**: For regulators and individuals
7. **Documentation**: What to record
8. **Post-Incident Review**: Lessons learned`,
    systemPrompt: 'You are a cybersecurity attorney specializing in breach response.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Cookie Consent Analyzer',
    slug: 'cookie-consent-analyzer',
    description: 'Analyze cookie consent mechanisms for compliance',
    category: 'cybersecurity',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'pro',
    promptTemplate: `Analyze cookie consent for:

{{input}}

Evaluate:
1. **Cookie Categories**: Essential, analytics, marketing
2. **Consent Mechanism**: Banner, preferences
3. **Pre-Checked Boxes**: Compliance issue
4. **Withdrawal**: Easy to withdraw
5. **Cookie Policy**: Completeness
6. **Third-Party Cookies**: Disclosed
7. **Compliance Score**: GDPR/ePrivacy`,
    systemPrompt: 'You are a privacy attorney reviewing cookie compliance.',
    maxTokens: 3000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Cybersecurity Policy Drafter',
    slug: 'cybersecurity-policy-drafter',
    description: 'Draft comprehensive cybersecurity policies',
    category: 'cybersecurity',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a cybersecurity policy for:

{{input}}

Include:
1. **Purpose and Scope**
2. **Roles and Responsibilities**
3. **Access Control**: Authentication, authorization
4. **Data Classification**
5. **Acceptable Use**
6. **Incident Response**
7. **Business Continuity**
8. **Vendor Management**
9. **Training Requirements**
10. **Compliance Monitoring**`,
    systemPrompt: 'You are a cybersecurity attorney drafting policies.',
    maxTokens: 6000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'HIPAA Compliance Checker',
    slug: 'hipaa-compliance-checker',
    description: 'Analyze HIPAA compliance for healthcare organizations',
    category: 'compliance',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze HIPAA compliance for:

{{input}}

Evaluate:
1. **Covered Entity Status**: CE or BA
2. **Privacy Rule**: Notice, authorizations
3. **Security Rule**: Administrative, physical, technical
4. **Breach Notification**: Procedures
5. **BAAs**: Required agreements
6. **Minimum Necessary**: Implementation
7. **Training**: Workforce training
8. **Risk Analysis**: Conducted and documented
9. **Gaps**: Compliance issues found`,
    systemPrompt: 'You are a healthcare privacy attorney.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'SOC 2 Readiness Assessment',
    slug: 'soc2-readiness-assessment',
    description: 'Assess readiness for SOC 2 compliance',
    category: 'compliance',
    inputType: 'structured',
    outputType: 'text',
    pricingTier: 'enterprise',
    promptTemplate: `Assess SOC 2 readiness for:

{{input}}

Evaluate Trust Service Criteria:
1. **Security**: Common criteria
2. **Availability**: Uptime commitments
3. **Processing Integrity**: Accuracy
4. **Confidentiality**: Data protection
5. **Privacy**: Personal information
6. **Control Gaps**: Missing controls
7. **Remediation Plan**: Steps to compliance
8. **Timeline**: Estimated readiness`,
    systemPrompt: 'You are a compliance consultant specializing in SOC 2.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'Open Source License Analyzer',
    slug: 'open-source-license-analyzer',
    description: 'Analyze open source license compliance',
    category: 'intellectual-property',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'professional',
    promptTemplate: `Analyze open source licenses in:

{{input}}

Evaluate:
1. **Licenses Identified**: GPL, MIT, Apache, etc.
2. **Copyleft Obligations**: Viral licenses
3. **Attribution Requirements**: What must be included
4. **Patent Grants**: IP implications
5. **Compatibility**: License conflicts
6. **Commercial Use**: Restrictions
7. **Compliance Checklist**: Required actions`,
    systemPrompt: 'You are an IP attorney specializing in open source licensing.',
    maxTokens: 4000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'Software License Drafter',
    slug: 'software-license-drafter',
    description: 'Draft software license agreements',
    category: 'intellectual-property',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'professional',
    promptTemplate: `Draft a software license agreement:

{{input}}

Include:
1. **License Grant**: Scope, exclusivity
2. **Restrictions**: Prohibited uses
3. **Fees**: Pricing model
4. **Support and Maintenance**
5. **Warranties**: Performance, non-infringement
6. **Limitation of Liability**
7. **Term and Termination**
8. **Audit Rights**
9. **Source Code**: Escrow if applicable`,
    systemPrompt: 'You are a technology transactions attorney.',
    maxTokens: 5000,
    temperature: 0.4,
    wave: 2,
  },
  {
    name: 'IP Portfolio Analyzer',
    slug: 'ip-portfolio-analyzer',
    description: 'Analyze IP portfolios for gaps and opportunities',
    category: 'intellectual-property',
    inputType: 'text',
    outputType: 'text',
    pricingTier: 'enterprise',
    promptTemplate: `Analyze this IP portfolio:

{{input}}

Evaluate:
1. **Portfolio Overview**: Patents, trademarks, copyrights
2. **Coverage Gaps**: Unprotected innovations
3. **Maintenance Status**: Upcoming deadlines
4. **Licensing Opportunities**: Monetization
5. **Enforcement History**: Past actions
6. **Competitive Analysis**: Competitor portfolios
7. **Recommendations**: Strategic improvements`,
    systemPrompt: 'You are an IP strategist advising on portfolio management.',
    maxTokens: 5000,
    temperature: 0.5,
    wave: 2,
  },
  {
    name: 'DMCA Takedown Generator',
    slug: 'dmca-takedown-generator',
    description: 'Generate DMCA takedown notices',
    category: 'intellectual-property',
    inputType: 'structured',
    outputType: 'document',
    pricingTier: 'pro',
    promptTemplate: `Generate a DMCA takedown notice:

{{input}}

Include all required elements:
1. **Identification of Work**: Copyrighted material
2. **Infringing Material**: URL and description
3. **Contact Information**: Complainant details
4. **Good Faith Statement**
5. **Accuracy Statement**
6. **Signature**: Physical or electronic
7. **Perjury Statement**: Under penalty`,
    systemPrompt: 'You are an IP attorney drafting DMCA notices.',
    maxTokens: 2000,
    temperature: 0.3,
    wave: 2,
  },
]
