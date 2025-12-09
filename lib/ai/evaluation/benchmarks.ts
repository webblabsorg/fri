/**
 * Benchmark datasets for evaluating tool output quality
 * Each benchmark contains:
 * - input: Sample input for the tool
 * - expectedOutput: High-quality output example
 * - category: Tool category for threshold selection
 * - expectedScore: Minimum acceptable score (0-100)
 */

export interface Benchmark {
  toolId: string
  toolName: string
  category: string
  input: string
  expectedOutput: string
  expectedScore: number
  description: string
}

/**
 * Legal Research Tool Benchmarks
 * Category: Legal Research
 * Threshold: 85%
 */
export const LEGAL_RESEARCH_BENCHMARKS: Benchmark[] = [
  {
    toolId: 'case-law-summarizer',
    toolName: 'Case Law Summarizer',
    category: 'Legal Research',
    expectedScore: 85,
    description: 'High-quality case summary with proper citations',
    input: `Summarize Brown v. Board of Education, 347 U.S. 483 (1954)`,
    expectedOutput: `# Brown v. Board of Education, 347 U.S. 483 (1954)

## Case Overview

Brown v. Board of Education was a landmark Supreme Court case that declared state laws establishing separate public schools for Black and white students to be unconstitutional.

## Facts

The case consolidated several cases from Kansas, South Carolina, Virginia, and Delaware involving Black children who had been denied admission to public schools attended by white children under laws requiring or permitting segregation according to race.

## Issue

Does the segregation of children in public schools solely on the basis of race deprive minority children of equal educational opportunities, even if the physical facilities and other tangible factors are equal?

## Holding

Yes. The Supreme Court held that "separate educational facilities are inherently unequal" and violate the Equal Protection Clause of the Fourteenth Amendment.

## Reasoning

Chief Justice Earl Warren wrote that separating children in schools based solely on race generates a feeling of inferiority that may affect their hearts and minds in a way unlikely ever to be undone. The Court found that in the field of public education, the doctrine of "separate but equal" has no place.

## Significance

This decision overturned Plessy v. Ferguson, 163 U.S. 537 (1896), which had established the "separate but equal" doctrine. Brown v. Board became a major catalyst for the civil rights movement and established that racial segregation in public schools violates the Constitution.

## Citation

Brown v. Board of Education, 347 U.S. 483 (1954).

**Legal Disclaimer:** This summary is for informational purposes only and does not constitute legal advice. Please consult with a qualified attorney for specific legal guidance.`,
  },
  {
    toolId: 'legal-research-assistant',
    toolName: 'Legal Research Assistant',
    category: 'Legal Research',
    expectedScore: 85,
    description: 'Research memo with multiple citations',
    input: `What are the elements of negligence in California?`,
    expectedOutput: `# Elements of Negligence in California

## Overview

In California, negligence is established when a plaintiff proves four essential elements: (1) duty, (2) breach, (3) causation, and (4) damages. See Ortega v. Kmart Corp., 26 Cal. 4th 1200 (2001).

## The Four Elements

### 1. Duty of Care

The defendant owed a legal duty of care to the plaintiff. The existence and scope of duty are questions of law for the court. Rowland v. Christian, 69 Cal. 2d 108 (1968) established that everyone has a duty to use ordinary care to avoid injury to others.

### 2. Breach of Duty

The defendant breached that duty by failing to exercise reasonable care. The standard is whether a reasonably prudent person would have acted differently under similar circumstances. See Constance B. v. State of California, 178 Cal. App. 3d 200 (1986).

### 3. Causation

The defendant's breach was a substantial factor in causing the plaintiff's injury. California requires both:
- Actual cause (cause-in-fact): "but for" the defendant's conduct, the injury would not have occurred
- Proximate cause: the injury was a foreseeable consequence of the breach

See Mitchell v. Gonzales, 54 Cal. 3d 1041 (1991).

### 4. Damages

The plaintiff suffered actual harm or damages as a result. This can include economic damages (medical bills, lost wages) and non-economic damages (pain and suffering). See CACI No. 3900A.

## Burden of Proof

The plaintiff bears the burden of proving each element by a preponderance of the evidence. See Ortega v. Kmart Corp., 26 Cal. 4th 1200 (2001).

## Conclusion

All four elements must be established to succeed in a negligence claim in California. Failure to prove any single element will result in the claim's failure.

**Legal Disclaimer:** This information is for general educational purposes only and does not constitute legal advice. Consult with a qualified California attorney for specific guidance.`,
  },
]

/**
 * Document Drafting Tool Benchmarks
 * Category: Document Drafting
 * Threshold: 80%
 */
export const DOCUMENT_DRAFTING_BENCHMARKS: Benchmark[] = [
  {
    toolId: 'legal-memo-writer',
    toolName: 'Legal Memo Writer',
    category: 'Document Drafting',
    expectedScore: 80,
    description: 'Well-structured legal memorandum',
    input: `Write a memo analyzing whether our client can terminate an at-will employee for poor performance`,
    expectedOutput: `MEMORANDUM

TO: Senior Partner
FROM: Associate Attorney
DATE: December 9, 2025
RE: Termination of At-Will Employee for Poor Performance

QUESTION PRESENTED

Whether an employer may lawfully terminate an at-will employee based on documented poor performance without incurring liability for wrongful termination.

BRIEF ANSWER

Yes. An at-will employee may be terminated for poor performance at any time, provided the termination does not violate public policy, anti-discrimination laws, or contractual obligations. To minimize legal risk, the employer should document performance issues and follow established progressive discipline procedures.

FACTS

[Client's specific facts would be inserted here]

DISCUSSION

I. The At-Will Employment Doctrine

Under the at-will employment doctrine, either party may terminate the employment relationship at any time, for any lawful reason or no reason at all, with or without notice. This is the default rule in most U.S. jurisdictions.

However, three major exceptions limit at-will employment:

A. Public Policy Exception

Courts have created a public policy exception prohibiting termination when it violates a clear mandate of public policy. This includes termination for:
- Refusing to commit an illegal act
- Performing a statutory obligation (e.g., jury duty)
- Exercising a statutory right
- Whistleblowing

Poor performance does not implicate public policy concerns and therefore does not fall under this exception.

B. Implied Contract Exception

An implied contract may arise from employer policies, handbooks, or representations that create an expectation of continued employment. If the handbook promises progressive discipline, the employer should follow those procedures to avoid breach of contract claims.

C. Covenant of Good Faith Exception

Some jurisdictions recognize that employers must act in good faith when terminating employees. Termination for documented poor performance generally satisfies this requirement.

II. Anti-Discrimination Considerations

The termination must not be based on protected characteristics under federal law (Title VII, ADA, ADEA) or state anti-discrimination statutes. The employer should ensure:

- Performance issues are documented
- Similar conduct results in similar consequences
- The reason for termination is legitimate and non-discriminatory

III. Best Practices

To minimize litigation risk:

1. Document all performance issues in writing
2. Provide regular feedback and opportunities to improve
3. Follow progressive discipline procedures in the handbook
4. Ensure consistent application of policies
5. Conduct exit interviews professionally

CONCLUSION

The employer may lawfully terminate an at-will employee for poor performance, provided the termination does not violate public policy, anti-discrimination laws, or contractual obligations created by company policies. Following progressive discipline procedures and maintaining thorough documentation will help defend against potential wrongful termination claims.

**Legal Disclaimer:** This memorandum is for internal use only and does not constitute legal advice to the client.`,
  },
]

/**
 * Client Communication Tool Benchmarks
 * Category: Client Communication
 * Threshold: 75%
 */
export const CLIENT_COMMUNICATION_BENCHMARKS: Benchmark[] = [
  {
    toolId: 'legal-email-drafter',
    toolName: 'Legal Email Drafter',
    category: 'Client Communication',
    expectedScore: 75,
    description: 'Professional client email with clear tone',
    input: `Draft an email to a client updating them on the status of their contract review`,
    expectedOutput: `Subject: Update on Your Contract Review

Dear [Client Name],

I hope this email finds you well.

I wanted to provide you with an update on the contract review we discussed during our last meeting.

Current Status

I have completed my initial review of the vendor agreement you forwarded last week. The review focused on liability provisions, payment terms, intellectual property rights, and termination clauses as you requested.

Key Findings

Overall, the contract appears reasonable, but I have identified several areas that warrant discussion:

1. The limitation of liability clause could be strengthened to better protect your interests
2. The payment terms require a 50% advance payment, which may not align with your typical business practices
3. The intellectual property section needs clarification regarding ownership of deliverables

Next Steps

I recommend we schedule a call this week to discuss these findings in detail and determine which provisions we should request to modify. I will prepare a marked-up version of the contract with my proposed revisions for your review.

Please let me know your availability for a 30-minute call later this week. I have openings on Thursday afternoon or Friday morning.

Thank you for the opportunity to assist you with this matter. Please don't hesitate to reach out if you have any questions in the meantime.

Best regards,

[Attorney Name]
[Law Firm Name]
[Contact Information]

**Confidentiality Notice:** This email and any attachments are confidential and may be protected by attorney-client privilege. If you received this in error, please notify us immediately and delete it.`,
  },
]

/**
 * Contract Review Tool Benchmarks
 * Category: Contract Review
 * Threshold: 90%
 */
export const CONTRACT_REVIEW_BENCHMARKS: Benchmark[] = [
  {
    toolId: 'contract-risk-analyzer',
    toolName: 'Contract Risk Analyzer',
    category: 'Contract Review',
    expectedScore: 90,
    description: 'Comprehensive risk analysis with specific clauses',
    input: `Analyze this NDA: "Company agrees not to disclose Confidential Information. Term is 5 years. Recipient may disclose if required by law."`,
    expectedOutput: `# NDA Risk Analysis Report

## Executive Summary

**Overall Risk Level:** MEDIUM-HIGH

This Non-Disclosure Agreement contains several provisions that present material risk to the Company. Key issues include overly broad confidentiality obligations, extended term duration, and missing critical protections.

## Identified Risks

### HIGH RISK Issues

**1. Overly Broad Confidentiality Definition**
- **Issue:** The agreement lacks a clear definition of "Confidential Information"
- **Risk:** Company may be bound to protect information that should not be confidential
- **Recommendation:** Add specific definition with carve-outs for: (a) publicly available information, (b) information independently developed, (c) information known prior to disclosure, (d) information received from third parties without restriction

**2. Missing Mutual Obligations**
- **Issue:** Agreement appears one-sided - only Company has obligations
- **Risk:** Recipient can freely disclose Company's information while Company is bound
- **Recommendation:** Ensure obligations are mutual if both parties will exchange confidential information

### MEDIUM RISK Issues

**3. Extended Term Duration**
- **Issue:** 5-year confidentiality term is longer than industry standard (typically 2-3 years)
- **Risk:** Unnecessarily extended obligations and potential competitive disadvantage
- **Recommendation:** Negotiate for 2-3 year term, or different terms for different types of information (e.g., 2 years for business information, 5 years for trade secrets)

**4. Incomplete Legal Compulsion Exception**
- **Issue:** "Required by law" exception lacks procedural protections
- **Risk:** Recipient could disclose without giving Company opportunity to object or seek protective order
- **Recommendation:** Add requirement that Recipient must: (a) promptly notify Company of legal demand, (b) cooperate with Company's efforts to obtain protective order, (c) limit disclosure to minimum required

### LOW RISK Issues

**5. Missing Return/Destruction Clause**
- **Issue:** No provision requiring return or destruction of confidential materials upon termination
- **Recommendation:** Add clause requiring return or certified destruction of all confidential information when relationship ends

**6. No Specified Remedies**
- **Issue:** Agreement doesn't address remedies for breach
- **Recommendation:** Include provision stating that breach may cause irreparable harm and money damages may be inadequate, justifying injunctive relief

## Critical Missing Provisions

1. **Definition of Confidential Information** with exclusions
2. **Permitted Use Clause** - what can Recipient do with the information?
3. **Return/Destruction** obligation
4. **No License Grant** - clarify no IP rights are transferred
5. **Governing Law and Venue** clauses
6. **Severability** clause
7. **Entire Agreement** clause

## Recommended Actions

### Immediate Actions
1. Do NOT sign this agreement as written
2. Request mutual obligations if both parties will share information
3. Add clear definition of Confidential Information with carve-outs

### Negotiation Priorities
1. **Must Have:** Proper definition of Confidential Information with standard exclusions
2. **Should Have:** Reduce term to 2-3 years, add notice requirement for legal compulsion
3. **Nice to Have:** Return/destruction clause, injunctive relief language

### Alternative Approach
Consider proposing the Company's standard form NDA, which includes comprehensive protections and has been vetted by counsel.

## Legal Soundness Score: 60/100

This agreement requires substantial revision before execution. The missing definitions and one-sided obligations create significant risk.

**Legal Disclaimer:** This analysis is for informational purposes only and does not constitute legal advice. Any decision to enter into this agreement should be made in consultation with qualified legal counsel.`,
  },
]

/**
 * Combined benchmark dataset
 */
export const ALL_BENCHMARKS: Benchmark[] = [
  ...LEGAL_RESEARCH_BENCHMARKS,
  ...DOCUMENT_DRAFTING_BENCHMARKS,
  ...CLIENT_COMMUNICATION_BENCHMARKS,
  ...CONTRACT_REVIEW_BENCHMARKS,
]

/**
 * Get benchmarks by category
 */
export function getBenchmarksByCategory(category: string): Benchmark[] {
  return ALL_BENCHMARKS.filter((b) => b.category === category)
}

/**
 * Get benchmark by tool ID
 */
export function getBenchmarksByToolId(toolId: string): Benchmark[] {
  return ALL_BENCHMARKS.filter((b) => b.toolId === toolId)
}
