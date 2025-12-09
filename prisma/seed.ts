import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // ============================================================================
  // TOOL CATEGORIES (26 Categories - from ai-agents.md)
  // ============================================================================
  console.log('📁 Creating tool categories...')

  const categories = [
    {
      name: 'Legal Research & Case Law',
      slug: 'legal-research',
      description: 'AI-powered legal research, case law search, and citation validation',
      icon: '⚖️',
      sortOrder: 1,
    },
    {
      name: 'Document Drafting & Automation',
      slug: 'document-drafting',
      description: 'Generate contracts, briefs, pleadings, and legal documents',
      icon: '📝',
      sortOrder: 2,
    },
    {
      name: 'Contract Review & Analysis',
      slug: 'contract-review',
      description: 'AI-powered contract analysis, risk identification, and redlining',
      icon: '📋',
      sortOrder: 3,
    },
    {
      name: 'Litigation Support & Discovery',
      slug: 'litigation-support',
      description: 'E-discovery, deposition summaries, and trial preparation',
      icon: '⚖️',
      sortOrder: 4,
    },
    {
      name: 'Due Diligence & Transactional',
      slug: 'due-diligence',
      description: 'M&A due diligence, document review, and transaction support',
      icon: '🔍',
      sortOrder: 5,
    },
    {
      name: 'Legal Research Enhancement',
      slug: 'research-enhancement',
      description: 'Advanced legal research tools and citators',
      icon: '📚',
      sortOrder: 6,
    },
    {
      name: 'Intellectual Property',
      slug: 'intellectual-property',
      description: 'Patent, trademark, and copyright analysis tools',
      icon: '💡',
      sortOrder: 7,
    },
    {
      name: 'Medical-Legal',
      slug: 'medical-legal',
      description: 'Medical record analysis and expert witness tools',
      icon: '🏥',
      sortOrder: 8,
    },
    {
      name: 'Client Management & Intake',
      slug: 'client-management',
      description: 'Client intake, CRM, and relationship management',
      icon: '👥',
      sortOrder: 9,
    },
    {
      name: 'Compliance & Regulatory',
      slug: 'compliance',
      description: 'Regulatory compliance and risk management',
      icon: '✅',
      sortOrder: 10,
    },
    {
      name: 'Billing & Time Management',
      slug: 'billing',
      description: 'Time tracking, billing, and financial management',
      icon: '💰',
      sortOrder: 11,
    },
    {
      name: 'Knowledge Management',
      slug: 'knowledge-management',
      description: 'Internal knowledge bases and precedent libraries',
      icon: '🗂️',
      sortOrder: 12,
    },
    {
      name: 'Specialized Practice Areas',
      slug: 'specialized-areas',
      description: 'Tools for specific practice areas (immigration, bankruptcy, etc.)',
      icon: '🎯',
      sortOrder: 13,
    },
    {
      name: 'Analytics & Insights',
      slug: 'analytics',
      description: 'Legal analytics, judge insights, and case predictions',
      icon: '📊',
      sortOrder: 14,
    },
    {
      name: 'Collaborative & Workflow',
      slug: 'collaborative',
      description: 'Team collaboration and workflow automation',
      icon: '🤝',
      sortOrder: 15,
    },
    {
      name: 'Employment Law',
      slug: 'employment-law',
      description: 'Employment contracts, workplace policies, and HR compliance',
      icon: '👔',
      sortOrder: 16,
    },
    {
      name: 'Real Estate',
      slug: 'real-estate',
      description: 'Real estate transactions, leases, and property law',
      icon: '🏠',
      sortOrder: 17,
    },
    {
      name: 'Corporate Law',
      slug: 'corporate-law',
      description: 'Corporate governance, securities, and business law',
      icon: '🏢',
      sortOrder: 18,
    },
    {
      name: 'Immigration Law',
      slug: 'immigration',
      description: 'Immigration petitions, visa applications, and asylum cases',
      icon: '🌍',
      sortOrder: 19,
    },
    {
      name: 'Family Law',
      slug: 'family-law',
      description: 'Divorce, custody, adoption, and family legal matters',
      icon: '👨‍👩‍👧‍👦',
      sortOrder: 20,
    },
    {
      name: 'Criminal Law',
      slug: 'criminal-law',
      description: 'Criminal defense, prosecution support, and sentencing',
      icon: '🚓',
      sortOrder: 21,
    },
    {
      name: 'Bankruptcy & Restructuring',
      slug: 'bankruptcy',
      description: 'Bankruptcy filings, debt restructuring, and creditor rights',
      icon: '💸',
      sortOrder: 22,
    },
    {
      name: 'Tax Law',
      slug: 'tax-law',
      description: 'Tax planning, compliance, and controversy',
      icon: '📊',
      sortOrder: 23,
    },
    {
      name: 'Environmental Law',
      slug: 'environmental',
      description: 'Environmental compliance, permits, and sustainability',
      icon: '🌱',
      sortOrder: 24,
    },
    {
      name: 'Cybersecurity & Privacy',
      slug: 'cybersecurity',
      description: 'Data privacy, GDPR, CCPA, and cybersecurity compliance',
      icon: '🔒',
      sortOrder: 25,
    },
    {
      name: 'International Law',
      slug: 'international',
      description: 'Cross-border transactions, treaties, and international arbitration',
      icon: '🌐',
      sortOrder: 26,
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
  }

  console.log(`✅ Created ${categories.length} categories`)

  // ============================================================================
  // SAMPLE TOOLS (First 5 for MVP testing - full 240 tools added in Phase 3)
  // ============================================================================
  console.log('🔧 Creating sample tools...')

  const researchCategory = await prisma.category.findUnique({
    where: { slug: 'legal-research' },
  })

  const draftingCategory = await prisma.category.findUnique({
    where: { slug: 'document-drafting' },
  })

  const contractCategory = await prisma.category.findUnique({
    where: { slug: 'contract-review' },
  })

  if (researchCategory && draftingCategory && contractCategory) {
    const tools = [
      {
        name: 'Conversational Legal Research',
        slug: 'conversational-legal-research',
        description:
          'Natural language queries to search case law, statutes, and regulations. Find relevant legal authority using plain English questions.',
        categoryId: researchCategory.id,
        inputType: 'text',
        outputType: 'text',
        pricingTier: 'pro',
        aiModel: 'claude-sonnet-4.5',
        popular: true,
        featured: true,
        promptTemplate: `You are an expert legal research assistant. Analyze the following legal research query and provide comprehensive results with case citations, statutes, and regulations.

Query: {{input}}

Provide:
1. Relevant case law with citations
2. Applicable statutes
3. Regulatory guidance
4. Key holdings and principles
5. Jurisdiction-specific considerations`,
        systemPrompt:
          'You are a legal research expert with access to comprehensive legal databases. Provide accurate citations and thorough analysis.',
        maxTokens: 4000,
        temperature: 0.7,
      },
      {
        name: 'Case Law Summarization',
        slug: 'case-law-summarization',
        description:
          'Instant summaries of judicial opinions with key holdings, reasoning, and practical implications.',
        categoryId: researchCategory.id,
        inputType: 'text',
        outputType: 'text',
        pricingTier: 'free',
        aiModel: 'gemini-1.5-flash',
        popular: true,
        featured: true,
        promptTemplate: `Summarize the following case into a concise 2-3 paragraph summary covering:
1. Key Facts
2. Legal Issue(s)
3. Holding
4. Reasoning
5. Practical Implications

Case: {{input}}`,
        systemPrompt:
          'You are a legal analyst. Provide clear, concise case summaries that capture essential legal principles.',
        maxTokens: 2000,
        temperature: 0.5,
      },
      {
        name: 'Contract Drafting Assistant',
        slug: 'contract-drafting-assistant',
        description:
          'Generate custom contracts from templates or scratch. Create NDAs, employment agreements, service contracts, and more.',
        categoryId: draftingCategory.id,
        inputType: 'text',
        outputType: 'document',
        pricingTier: 'professional',
        aiModel: 'claude-sonnet-4.5',
        popular: true,
        featured: true,
        promptTemplate: `Draft a comprehensive {{contract_type}} contract based on the following requirements:

{{input}}

Include:
1. Parties and recitals
2. Definitions
3. Core terms and conditions
4. Representations and warranties
5. Covenants
6. Termination provisions
7. Dispute resolution
8. Miscellaneous provisions
9. Signature blocks

Format as a professional legal document with proper numbering and structure.`,
        systemPrompt:
          'You are an expert contract attorney. Draft clear, enforceable contracts that protect client interests.',
        maxTokens: 6000,
        temperature: 0.6,
      },
      {
        name: 'Contract Review & Redlining',
        slug: 'contract-review-redlining',
        description:
          'AI-powered contract analysis with suggested edits, risk identification, and clause recommendations.',
        categoryId: contractCategory.id,
        inputType: 'document',
        outputType: 'text',
        pricingTier: 'professional',
        aiModel: 'claude-sonnet-4.5',
        popular: true,
        featured: true,
        promptTemplate: `Review the following contract and provide:

1. RISK ANALYSIS
   - Identify unfavorable terms
   - Flag missing standard clauses
   - Note unusual or concerning provisions

2. SUGGESTED REVISIONS
   - Specific redline recommendations
   - Alternative clause language
   - Rationale for each change

3. COMPLIANCE CHECK
   - Regulatory compliance issues
   - Industry standard deviations

4. OVERALL ASSESSMENT
   - Risk level (Low/Medium/High)
   - Key negotiation points
   - Approval recommendations

Contract: {{input}}`,
        systemPrompt:
          'You are a senior contract attorney. Provide thorough, risk-focused contract analysis.',
        maxTokens: 5000,
        temperature: 0.6,
      },
      {
        name: 'Legal Brief Writer',
        slug: 'legal-brief-writer',
        description:
          'Draft motions, memoranda, and appellate briefs with proper legal citations and persuasive arguments.',
        categoryId: draftingCategory.id,
        inputType: 'text',
        outputType: 'document',
        pricingTier: 'professional',
        aiModel: 'claude-opus-4.0',
        popular: true,
        featured: false,
        promptTemplate: `Draft a {{brief_type}} with the following specifications:

{{input}}

Structure:
1. Caption
2. Introduction
3. Statement of Facts
4. Legal Standard
5. Argument (with subheadings)
6. Conclusion
7. Certificate of Service

Use proper legal writing style with Bluebook citations where applicable.`,
        systemPrompt:
          'You are an experienced litigation attorney. Write persuasive, well-structured legal briefs.',
        maxTokens: 8000,
        temperature: 0.7,
      },
      {
        name: 'Legal Email Drafter',
        slug: 'legal-email-drafter',
        description:
          'Generate professional legal emails with proper tone, formatting, and disclaimers. Perfect for client communications, opposing counsel, and internal correspondence.',
        categoryId: draftingCategory.id,
        inputType: 'text',
        outputType: 'text',
        pricingTier: 'free',
        aiModel: 'gemini-1.5-flash',
        popular: true,
        featured: true,
        promptTemplate: `Draft a professional legal email with the following details:

Purpose: {{purpose}}
Recipient: {{recipient}}
Tone: {{tone}}
Key Points: {{keyPoints}}
Additional Context: {{context}}

Provide a complete, ready-to-send email with:
1. Appropriate greeting
2. Clear subject matter
3. Well-organized key points
4. Professional closing
5. Signature line placeholder
6. Legal disclaimer if appropriate`,
        systemPrompt:
          'You are an expert legal professional assistant specializing in drafting clear, professional legal emails. Your emails are professional, legally precise, and properly formatted.',
        maxTokens: 2000,
        temperature: 0.7,
      },
    ]

    for (const tool of tools) {
      await prisma.tool.upsert({
        where: { slug: tool.slug },
        update: tool,
        create: tool,
      })
    }

    console.log(`✅ Created ${tools.length} sample tools`)
  }

  // ============================================================================
  // TEST USER & ORGANIZATION (for development)
  // ============================================================================
  console.log('👤 Creating test user and organization...')

  const hashedPassword = await bcrypt.hash('Test123!@#', 12)

  const testOrg = await prisma.organization.upsert({
    where: { id: 'test-org-001' },
    update: {},
    create: {
      id: 'test-org-001',
      name: 'Test Law Firm',
      type: 'law_firm',
      planTier: 'professional',
      subscriptionStatus: 'active',
      seatsTotal: 5,
      seatsUsed: 1,
      billingEmail: 'billing@testlawfirm.com',
      status: 'active',
    },
  })

  const testUser = await prisma.user.upsert({
    where: { email: 'admin@testlawfirm.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@testlawfirm.com',
      emailVerified: true,
      passwordHash: hashedPassword,
      firmName: 'Test Law Firm',
      role: 'admin',
      subscriptionTier: 'professional',
      subscriptionStatus: 'active',
      status: 'active',
    },
  })

  // Link user to organization
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: testOrg.id,
        userId: testUser.id,
      },
    },
    update: {},
    create: {
      organizationId: testOrg.id,
      userId: testUser.id,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    },
  })

  // Create personal workspace for test user
  const testWorkspace = await prisma.workspace.create({
    data: {
      organizationId: testOrg.id,
      name: 'My Workspace',
      type: 'personal',
      ownerId: testUser.id,
      status: 'active',
    },
  })

  await prisma.workspaceMember.create({
    data: {
      workspaceId: testWorkspace.id,
      userId: testUser.id,
      role: 'admin',
    },
  })

  console.log('✅ Test user created: admin@testlawfirm.com / Test123!@#')
  console.log(`✅ Test organization: ${testOrg.name}`)
  console.log(`✅ Test workspace: ${testWorkspace.name}`)

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Categories: ${categories.length}`)
  console.log(`   - Sample Tools: 5`)
  console.log(`   - Test Organization: 1`)
  console.log(`   - Test User: 1 (admin@testlawfirm.com / Test123!@#)`)
  console.log(`   - Test Workspace: 1`)
  console.log('\n🚀 Ready to start development!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
