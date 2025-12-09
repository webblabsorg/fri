// Prompt template builder for AI tools

export type LegalPromptType =
  | 'EMAIL_DRAFTER'
  | 'CASE_SUMMARIZER'
  | 'CONTRACT_RISK_ANALYZER'
  | 'DEPOSITION_SUMMARIZER'
  | 'LEGAL_MEMO_WRITER'
  | 'LEGAL_ISSUE_SPOTTER'
  | 'DEMAND_LETTER'
  | 'CONTRACT_DRAFTER'
  | 'CONTRACT_CLAUSE_EXTRACTOR'
  | 'CONTRACT_SUMMARY'
  | 'DISCOVERY_REQUEST'
  | 'MOTION_TO_DISMISS'
  | 'DUE_DILIGENCE'
  | 'BOARD_RESOLUTION'
  | 'EMPLOYMENT_CONTRACT'
  | 'TERMINATION_LETTER'
  | 'PATENT_SEARCH'
  | 'CLIENT_UPDATE'
  | 'LEASE_ANALYZER'
  | 'LEGAL_RESEARCH'

interface PromptContext {
  [key: string]: any
}

export function buildPrompt(toolType: string, context: PromptContext): { system: string; user: string } {
  const systemPrompt = getSystemPrompt(toolType)
  const userPrompt = getUserPrompt(toolType, context)

  return {
    system: systemPrompt,
    user: userPrompt,
  }
}

function getSystemPrompt(toolType: string): string {
  const commonPrefix = 'You are an expert legal AI assistant specializing in '

  const prompts: Record<string, string> = {
    'EMAIL_DRAFTER': `${commonPrefix}legal communication and professional correspondence. Your role is to draft clear, professional legal emails with appropriate tone and legal precision. Always maintain attorney-client professionalism and include necessary disclaimers when appropriate.`,

    'CASE_SUMMARIZER': `${commonPrefix}judicial opinion analysis and case law summarization. Your role is to extract key facts, legal issues, holdings, and reasoning from court decisions. Provide concise, accurate summaries that capture the essence of the case while maintaining legal accuracy.`,

    'CONTRACT_RISK_ANALYZER': `${commonPrefix}contract review and risk assessment. Your role is to identify potential risks, unfavorable terms, missing clauses, and unusual provisions in contracts. Provide actionable recommendations and assign risk scores. Focus on legal, financial, and operational risks.`,

    'DEPOSITION_SUMMARIZER': `${commonPrefix}deposition analysis and litigation support. Your role is to create organized, topical summaries of deposition transcripts, identifying key testimony, inconsistencies, and critical admissions. Focus on facts relevant to liability, damages, and credibility.`,

    'LEGAL_MEMO_WRITER': `${commonPrefix}legal research and analysis. Your role is to write comprehensive legal memoranda using the IRAC format (Issue, Rule, Application, Conclusion). Provide thorough analysis with relevant case citations and statutory references.`,

    'LEGAL_ISSUE_SPOTTER': `${commonPrefix}legal analysis and issue identification. Your role is to analyze fact patterns and identify all potential legal issues, claims, and defenses. Consider multiple practice areas and jurisdictions. Provide practical recommendations for next steps.`,

    'DEMAND_LETTER': `${commonPrefix}pre-litigation negotiation and demand letter drafting. Your role is to create persuasive demand letters that clearly state the legal basis for claims, quantify damages, and set reasonable deadlines. Maintain a professional yet firm tone.`,

    'CONTRACT_DRAFTER': `${commonPrefix}contract drafting and agreement preparation. Your role is to create legally sound contracts with clear terms, proper clauses, and appropriate protections for the parties involved. Ensure completeness and legal compliance.`,

    'CONTRACT_CLAUSE_EXTRACTOR': `${commonPrefix}contract analysis and clause identification. Your role is to locate and extract specific clauses from contracts with surrounding context. Provide accurate extraction with proper formatting and references to contract sections.`,

    'CONTRACT_SUMMARY': `${commonPrefix}contract analysis and executive summary preparation. Your role is to create concise summaries highlighting key terms, obligations, dates, payment terms, and risk factors. Focus on information executives and business teams need.`,

    'DISCOVERY_REQUEST': `${commonPrefix}litigation discovery and civil procedure. Your role is to draft comprehensive discovery requests tailored to the case type and jurisdiction. Include standard and case-specific requests that comply with procedural rules.`,

    'MOTION_TO_DISMISS': `${commonPrefix}legal motion practice and procedural law. Your role is to draft persuasive motions to dismiss with solid legal arguments, relevant case citations, and procedural compliance. Focus on the strongest grounds for dismissal.`,

    'DUE_DILIGENCE': `${commonPrefix}transactional law and M&A due diligence. Your role is to review documents for material risks, red flags, and deal issues. Identify financial, legal, regulatory, and operational concerns that could affect transaction value or structure.`,

    'BOARD_RESOLUTION': `${commonPrefix}corporate governance and formal resolutions. Your role is to draft clear, properly formatted board resolutions for corporate actions. Include all necessary recitals, resolutions, and voting language.`,

    'EMPLOYMENT_CONTRACT': `${commonPrefix}employment law and contract drafting. Your role is to create comprehensive employment agreements with appropriate terms for compensation, benefits, duties, confidentiality, non-compete, and termination provisions.`,

    'TERMINATION_LETTER': `${commonPrefix}employment law and termination procedures. Your role is to draft legally compliant termination letters that minimize litigation risk while clearly communicating the termination. Include appropriate language for severance and releases.`,

    'PATENT_SEARCH': `${commonPrefix}intellectual property and patent law. Your role is to analyze patent databases and technical literature for prior art. Assess novelty and patentability of inventions, identifying similar patents and potential obstacles.`,

    'CLIENT_UPDATE': `${commonPrefix}client communication and legal writing. Your role is to translate legal developments into clear, client-friendly language while maintaining accuracy. Provide updates that inform clients of status, next steps, and recommendations.`,

    'LEASE_ANALYZER': `${commonPrefix}real estate law and lease agreements. Your role is to analyze lease agreements identifying key terms, risks, obligations, and unusual provisions. Assess fairness and compliance with landlord-tenant law.`,

    'LEGAL_RESEARCH': `${commonPrefix}legal research and comprehensive legal analysis. Your role is to research case law, statutes, and regulations to answer legal questions. Provide thorough answers with proper citations in Bluebook format where applicable.`,
  }

  return prompts[toolType] || `${commonPrefix}legal analysis and document preparation. Provide accurate, professional legal assistance.`
}

function getUserPrompt(toolType: string, context: PromptContext): string {
  const builders: Record<string, (ctx: PromptContext) => string> = {
    'EMAIL_DRAFTER': (ctx) => `Draft a professional legal email with the following details:

Recipient: ${ctx.recipient}
Subject: ${ctx.subject}
Tone: ${ctx.tone}

Context and key points to address:
${ctx.context}

Please draft a complete email with:
- Appropriate greeting
- Clear, professional body addressing all points
- Proper legal language and tone
- Professional closing
- Include any necessary disclaimers`,

    'CASE_SUMMARIZER': (ctx) => `Summarize the following case:

${ctx.caseText}

${ctx.focusArea ? `Focus particularly on: ${ctx.focusArea}` : ''}

Provide a summary with:
1. Case citation and court
2. Key facts
3. Legal issues presented
4. Holding/Decision
5. Reasoning/Rationale
6. Significance/Impact`,

    'CONTRACT_RISK_ANALYZER': (ctx) => `Analyze the following ${ctx.contractType} contract for risks and issues:

${ctx.contractText}

Review from the perspective of: ${ctx.perspective}

Provide:
1. Overall risk score (Low/Medium/High)
2. Key risk factors identified
3. Unfavorable or unusual terms
4. Missing standard clauses
5. Specific recommendations for negotiation or revision`,

    'DEPOSITION_SUMMARIZER': (ctx) => `Summarize the following deposition transcript:

${ctx.transcript}

Summary format requested: ${ctx.format}

${ctx.focusTopics ? `Focus on these topics: ${ctx.focusTopics.join(', ')}` : ''}

Provide:
- Organized summary by topic or page-line
- Key testimony and admissions
- Inconsistencies or credibility issues
- Important documents referenced`,

    'LEGAL_MEMO_WRITER': (ctx) => `Prepare a legal memorandum addressing the following:

Legal Issue:
${ctx.issue}

Relevant Facts:
${ctx.facts}

Jurisdiction: ${ctx.jurisdiction}

${ctx.clientQuestion ? `Client Question: ${ctx.clientQuestion}` : ''}

Structure the memo using IRAC format:
1. ISSUE: State the legal issue clearly
2. RULE: Identify and explain relevant legal rules, statutes, and case law
3. APPLICATION: Apply the law to the facts
4. CONCLUSION: Provide your legal conclusion and recommendations`,

    'LEGAL_ISSUE_SPOTTER': (ctx) => `Analyze the following fact pattern for legal issues:

${ctx.factPattern}

Jurisdiction: ${ctx.jurisdiction}
${ctx.practiceArea && ctx.practiceArea !== 'All' ? `Focus on: ${ctx.practiceArea} Law` : ''}

Identify:
1. All potential legal claims and causes of action
2. Possible defenses
3. Relevant statutes and legal standards
4. Statute of limitations concerns
5. Damages or remedies available
6. Recommended next steps for client`,

    'DEMAND_LETTER': (ctx) => `Draft a demand letter with the following information:

From (Client): ${ctx.claimant}
To (Recipient): ${ctx.respondent}

Basis of Claim:
${ctx.claimBasis}

Damages Sought: ${ctx.damages}
Response Deadline: ${ctx.deadline} days
Tone: ${ctx.tone}

The demand letter should include:
1. Clear statement of facts
2. Legal basis for the claim
3. Specific damages calculation
4. Deadline for response
5. Consequences of non-compliance
6. Professional closing`,

    'CONTRACT_DRAFTER': (ctx) => `Draft a ${ctx.ndaType} Non-Disclosure Agreement with the following terms:

Disclosing Party: ${ctx.party1}
Receiving Party: ${ctx.party2}

Purpose of Disclosure:
${ctx.purpose}

Confidentiality Term: ${ctx.term}
Governing Law: ${ctx.jurisdiction}

Include:
1. Definitions of confidential information
2. Obligations of receiving party
3. Permitted disclosures
4. Term and survival
5. Remedies for breach
6. General provisions (governing law, severability, etc.)`,

    'CONTRACT_CLAUSE_EXTRACTOR': (ctx) => `Extract the following type of clause from this contract:

Clause Type to Extract: ${ctx.clauseType}

Contract Text:
${ctx.contractText}

For each relevant clause found:
1. Provide the full clause text
2. Note the section/paragraph reference
3. Summarize the key terms
4. Flag any unusual or non-standard language`,

    'CONTRACT_SUMMARY': (ctx) => `Summarize the following contract:

${ctx.contractText}

${ctx.focusAreas && ctx.focusAreas.length > 0 ? `Focus on: ${ctx.focusAreas.join(', ')}` : ''}

Provide a one-page executive summary including:
1. Contract parties and type
2. Key financial terms and payment obligations
3. Important dates (effective date, term, renewal, termination)
4. Main obligations of each party
5. Notable rights and restrictions
6. Risk factors or concerns
7. Recommendations`,

    'DISCOVERY_REQUEST': (ctx) => `Draft ${ctx.requestType} for the following case:

Case Type: ${ctx.caseType}
Jurisdiction: ${ctx.jurisdiction}

Case Facts:
${ctx.facts}

${ctx.specificIssues ? `Specific issues to address: ${ctx.specificIssues}` : ''}

Provide:
1. Properly formatted discovery requests
2. Tailored to case type and facts
3. Compliant with ${ctx.jurisdiction} procedural rules
4. Numbered consecutively
5. Clear and specific language`,

    'MOTION_TO_DISMISS': (ctx) => `Draft a motion to dismiss with the following information:

Complaint Summary:
${ctx.complaintSummary}

Grounds for Dismissal: ${Array.isArray(ctx.dismissalGrounds) ? ctx.dismissalGrounds.join(', ') : ctx.dismissalGrounds}
Court/Jurisdiction: ${ctx.jurisdiction}

Supporting Facts:
${ctx.keyFacts}

The motion should include:
1. Caption and procedural information
2. Introduction and relief sought
3. Statement of facts
4. Legal argument with case citations
5. Conclusion
6. Notice of hearing (if required)`,

    'DUE_DILIGENCE': (ctx) => `Conduct due diligence review of the following documents:

Document Type: ${ctx.documentType}
${ctx.focusAreas && ctx.focusAreas.length > 0 ? `Focus Areas: ${ctx.focusAreas.join(', ')}` : ''}

Documents to Review:
${ctx.documentText}

Provide:
1. Executive summary of findings
2. Material risks identified (categorized by severity)
3. Red flags requiring immediate attention
4. Compliance concerns
5. Recommended deal protections or provisions
6. Items requiring further investigation`,

    'BOARD_RESOLUTION': (ctx) => `Draft a board resolution for the following corporate action:

Company Name: ${ctx.companyName}
Resolution Type: ${ctx.resolutionType}

Action Details:
${ctx.details}

Format the resolution with:
1. Heading with company name and meeting type
2. WHEREAS clauses (recitals)
3. RESOLVED clauses (resolutions)
4. Voting results
5. Certification section`,

    'EMPLOYMENT_CONTRACT': (ctx) => `Draft an ${ctx.employmentType} employment agreement:

Employee: ${ctx.employeeName}
Position: ${ctx.position}
Compensation: ${ctx.salary}
${ctx.benefits ? `Benefits: ${ctx.benefits}` : ''}
Jurisdiction: ${ctx.jurisdiction}

Include:
1. Position and duties
2. Compensation and benefits
3. Work schedule and location
4. Confidentiality obligations
5. ${ctx.employmentType === 'At-Will' ? 'At-will employment statement' : 'Employment term'}
6. Termination provisions
7. Non-compete/non-solicitation (if applicable to ${ctx.jurisdiction})
8. Dispute resolution
9. General provisions`,

    'TERMINATION_LETTER': (ctx) => `Draft a termination letter:

Employee Name: ${ctx.employeeName}
Termination Type: ${ctx.terminationType}
${ctx.reason ? `Reason: ${ctx.reason}` : ''}
${ctx.severance ? `Severance: ${ctx.severance}` : ''}
Jurisdiction: ${ctx.jurisdiction}

The letter should include:
1. Clear statement of termination and effective date
2. ${ctx.reason ? 'Explanation of reason (factual, professional)' : ''}
3. ${ctx.severance ? 'Severance package details' : 'Final paycheck information'}
4. Benefits continuation information (COBRA if applicable)
5. Return of company property
6. Confidentiality reminders
7. Professional closing`,

    'PATENT_SEARCH': (ctx) => `Conduct a prior art search for the following invention:

Technology Area: ${ctx.technologyArea}

Invention Description:
${ctx.inventionDescription}

${ctx.claimsText ? `Proposed Claims:\n${ctx.claimsText}` : ''}

Provide:
1. Summary of invention's novel features
2. Relevant prior art identified
3. Similarity assessment for each reference
4. Patentability assessment
5. Recommendations for claim strategy
6. Additional search suggestions`,

    'CLIENT_UPDATE': (ctx) => `Draft a client status update letter:

Matter Type: ${ctx.matterType}
Tone: ${ctx.tone}

Recent Developments:
${ctx.recentDevelopments}

Next Steps:
${ctx.nextSteps}

Write a professional update letter that:
1. Greets client appropriately
2. Summarizes recent developments in plain language
3. Explains significance and impact
4. Outlines next steps and timeline
5. Invites questions
6. Maintains appropriate ${ctx.tone} tone`,

    'LEASE_ANALYZER': (ctx) => `Analyze the following ${ctx.leaseType} lease agreement:

${ctx.leaseText}

Review from perspective of: ${ctx.perspective}

Provide:
1. Summary of key terms (rent, term, security deposit, etc.)
2. Tenant obligations and restrictions
3. Landlord obligations and rights
4. Maintenance and repair responsibilities
5. Termination and renewal provisions
6. Risk assessment and unusual terms
7. Recommendations for ${ctx.perspective}`,

    'LEGAL_RESEARCH': (ctx) => `Research the following legal question:

${ctx.query}

Jurisdiction: ${ctx.jurisdiction}
${ctx.dateRange ? `Time Period: ${ctx.dateRange}` : ''}
${ctx.focusArea ? `Focus on: ${ctx.focusArea}` : ''}

Provide:
1. Direct answer to the question
2. Relevant case law with citations
3. Applicable statutes and regulations
4. Legal standards and tests
5. Jurisdiction-specific considerations
6. Practical implications
7. Recommendations

Use proper legal citations where applicable.`,
  }

  const builder = builders[toolType]
  if (!builder) {
    return `Please process the following request:\n\n${JSON.stringify(context, null, 2)}`
  }

  return builder(context)
}

// Helper to get AI model based on tier and tool config
export function getAIModelForTier(tier: 'free' | 'starter' | 'pro' | 'advanced', toolAIModels: {
  free: string
  starter: string
  pro: string
  advanced: string
}): string {
  return toolAIModels[tier]
}
