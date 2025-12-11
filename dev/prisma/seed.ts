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
  if (process.env.NODE_ENV !== 'production') {
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
  }

  // ============================================================================
  // TEST USER & ORGANIZATION (for development)
  // ============================================================================
  if (process.env.NODE_ENV !== 'production') {
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
  }

  // ============================================================================
  // HELP CENTER - Categories & Articles
  // ============================================================================
  console.log('📚 Creating help center content...')

  const helpCategories = [
    { name: 'Getting Started', slug: 'getting-started', description: 'Learn the basics of Frith AI', order: 1 },
    { name: 'Features & Tools', slug: 'features-tools', description: 'Explore our 240+ AI tools', order: 2 },
    { name: 'Billing & Plans', slug: 'billing', description: 'Manage your subscription', order: 3 },
    { name: 'Account Settings', slug: 'account', description: 'Customize your profile', order: 4 },
    { name: 'Troubleshooting', slug: 'troubleshooting', description: 'Fix common issues', order: 5 },
  ]

  const createdCategories: any[] = []
  for (const cat of helpCategories) {
    const category = await prisma.helpCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    createdCategories.push(category)
  }

  // Sample articles for each category
  const articles = [
    // Getting Started
    {
      categoryId: createdCategories[0].id,
      title: 'How to run your first AI tool',
      slug: 'how-to-run-first-tool',
      content: `## Welcome to Frith AI!\n\nThis guide will help you run your first AI tool.\n\n### Step 1: Browse the Tool Catalog\nNavigate to the Dashboard and click "All Tools" to see our complete catalog of 240+ AI tools.\n\n### Step 2: Select a Tool\nClick on any tool to view its details, input requirements, and sample outputs.\n\n### Step 3: Enter Your Input\nProvide the required information in the input form. Each tool has different requirements.\n\n### Step 4: Run the Tool\nClick "Run Tool" and wait for the AI to process your request.\n\n### Step 5: View Results\nOnce complete, you can view, edit, copy, or export your results.\n\nNeed help? Contact support anytime!`,
      excerpt: 'Learn how to run your first AI-powered legal tool in 5 simple steps',
      published: true,
      featured: true,
      views: 245,
      helpfulVotes: 42,
    },
    {
      categoryId: createdCategories[0].id,
      title: 'Creating your account',
      slug: 'creating-account',
      content: `## Creating Your Frith AI Account\n\nSign up in minutes and start using AI tools immediately.\n\n### Registration\n1. Click "Sign Up" on the homepage\n2. Enter your name, email, and password\n3. Accept the terms of service\n4. Click "Create Account"\n\n### Email Verification\nCheck your email for a verification link. Click it to activate your account.\n\n### Choose Your Plan\nSelect from Free, Pro, Professional, or Enterprise plans based on your needs.`,
      excerpt: 'Step-by-step guide to creating your Frith AI account',
      published: true,
      views: 189,
      helpfulVotes: 35,
    },
    // Features & Tools
    {
      categoryId: createdCategories[1].id,
      title: 'Understanding tool outputs',
      slug: 'understanding-tool-outputs',
      content: `## Tool Outputs Explained\n\nEvery tool run generates detailed outputs with provenance information.\n\n### What You'll See\n- **Main Output**: The AI-generated result\n- **Sources**: Citations and references used\n- **AI Model**: Which model processed your request\n- **Tokens Used**: Computational resources consumed\n- **Confidence Score**: Reliability indicator\n\n### Actions You Can Take\n- Copy to clipboard\n- Export to Word/PDF\n- Save to project\n- Share with team\n- Rate output quality`,
      excerpt: 'Learn how to interpret and use tool outputs effectively',
      published: true,
      featured: true,
      views: 156,
      helpfulVotes: 28,
    },
    {
      categoryId: createdCategories[1].id,
      title: 'Exporting results to Word',
      slug: 'export-to-word',
      content: `## Exporting to Microsoft Word\n\nEasily export any tool output to a formatted Word document.\n\n### Steps\n1. Run your tool and view the output\n2. Click the "Export" button\n3. Select "Microsoft Word (.docx)"\n4. The file will download automatically\n5. Open in Word for further editing\n\n### Formatting\nExported documents maintain:\n- Headings and structure\n- Citations and footnotes\n- Tables and lists\n- Professional formatting`,
      excerpt: 'Export AI-generated documents to Microsoft Word format',
      published: true,
      views: 134,
      helpfulVotes: 24,
    },
    // Billing & Plans
    {
      categoryId: createdCategories[2].id,
      title: 'Understanding pricing plans',
      slug: 'pricing-plans',
      content: `## Frith AI Pricing Plans\n\n### Free Plan\n- 3 tools\n- 10 runs per month\n- Gemini Flash AI\n- Community support\n\n### Pro Plan - $79/month\n- 15 tools\n- 500 runs per month\n- Claude Haiku AI\n- Email support\n\n### Professional - $199/month\n- 35 tools\n- 2,000 runs per month\n- Claude Sonnet AI\n- Priority support\n\n### Enterprise - $499/month\n- 240+ tools\n- Unlimited runs\n- Claude Opus AI\n- Dedicated support\n\n**45-day money-back guarantee on all paid plans**`,
      excerpt: 'Compare our pricing plans and find the right fit',
      published: true,
      featured: true,
      views: 298,
      helpfulVotes: 56,
    },
    {
      categoryId: createdCategories[2].id,
      title: 'How to upgrade your plan',
      slug: 'upgrade-plan',
      content: `## Upgrading Your Plan\n\nUpgrade anytime to access more tools and features.\n\n### Steps\n1. Go to Dashboard → Billing\n2. Click "Upgrade Plan"\n3. Select your desired tier\n4. Enter payment information\n5. Confirm upgrade\n\n### What Happens Next\n- Immediate access to new tier\n- Pro-rated billing\n- No downtime\n- Keep all your data`,
      excerpt: 'Upgrade your subscription to unlock more features',
      published: true,
      views: 145,
      helpfulVotes: 27,
    },
    {
      categoryId: createdCategories[2].id,
      title: 'Refund policy and money-back guarantee',
      slug: 'refund-policy',
      content: `## 45-Day Money-Back Guarantee\n\nTry Frith AI risk-free with our industry-leading guarantee.\n\n### Our Promise\nIf you're not satisfied within 45 days of your initial subscription, we'll refund your payment—no questions asked.\n\n### How to Request a Refund\n1. Contact support within 45 days\n2. Provide your reason (optional)\n3. We'll process immediately\n4. Refund appears in 5-7 business days\n\n### Terms\n- Applies to first subscription only\n- Full refund of subscription fee\n- Keep access until period ends`,
      excerpt: 'Learn about our 45-day money-back guarantee',
      published: true,
      views: 112,
      helpfulVotes: 19,
    },
    // Account Settings
    {
      categoryId: createdCategories[3].id,
      title: 'Changing your password',
      slug: 'change-password',
      content: `## Changing Your Password\n\nUpdate your password anytime from account settings.\n\n### Steps\n1. Go to Dashboard → Settings\n2. Click "Security" tab\n3. Enter current password\n4. Enter new password\n5. Confirm new password\n6. Click "Update Password"\n\n### Password Requirements\n- Minimum 8 characters\n- At least one uppercase letter\n- At least one number\n- At least one special character`,
      excerpt: 'How to update your account password',
      published: true,
      views: 98,
      helpfulVotes: 15,
    },
    // Troubleshooting
    {
      categoryId: createdCategories[4].id,
      title: 'Tool not running - Common issues',
      slug: 'tool-not-running',
      content: `## Troubleshooting Tool Runs\n\nIf a tool isn't running, try these solutions.\n\n### Common Issues\n\n#### 1. Quota Exceeded\n- Check your monthly limit\n- Upgrade plan if needed\n- Wait for monthly reset\n\n#### 2. Input Validation Error\n- Review required fields\n- Check character limits\n- Remove special characters\n\n#### 3. Network Issues\n- Refresh the page\n- Check internet connection\n- Try different browser\n\n#### 4. System Maintenance\n- Check status page\n- Wait a few minutes\n- Contact support if persistent`,
      excerpt: 'Fix common issues when tools won\'t run',
      published: true,
      views: 87,
      helpfulVotes: 16,
    },
    {
      categoryId: createdCategories[4].id,
      title: 'Contacting support',
      slug: 'contact-support',
      content: `## Getting Help from Support\n\nOur team is here to help 24/7.\n\n### Submit a Ticket\n1. Click "Support" in the header\n2. Click "Submit Ticket"\n3. Fill in the form:\n   - Subject\n   - Category\n   - Priority\n   - Detailed description\n4. Attach screenshots if helpful\n5. Submit\n\n### Response Times\n- Free: 48 hours\n- Pro: 24 hours\n- Professional: 12 hours\n- Enterprise: 4 hours\n\n### Other Options\n- Browse Help Center\n- Check System Status\n- Email: support@frithai.com`,
      excerpt: 'How to contact support and get help',
      published: true,
      views: 165,
      helpfulVotes: 29,
    },
  ]

  for (const article of articles) {
    await prisma.helpArticle.upsert({
      where: { slug: article.slug },
      update: {},
      create: article,
    })
  }

  console.log(`✅ Help center: ${helpCategories.length} categories, ${articles.length} articles`)

  // ============================================================================
  // VIDEO TUTORIALS
  // ============================================================================
  if (process.env.NODE_ENV !== 'production') {
    console.log('🎥 Creating video tutorials...')

    const videos = [
    {
      title: 'Getting Started with Frith AI',
      slug: 'getting-started-intro',
      description: 'A complete walkthrough of the platform and your first tool run',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Mock URL
      thumbnail: null,
      duration: 180,
      category: 'getting-started',
      published: true,
      order: 1,
    },
    {
      title: 'Contract Review in 60 Seconds',
      slug: 'contract-review-demo',
      description: 'Watch how AI analyzes a contract and identifies risks',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: null,
      duration: 90,
      category: 'tools',
      published: true,
      order: 2,
    },
    {
      title: 'Legal Research Made Easy',
      slug: 'legal-research-tutorial',
      description: 'Learn how to conduct legal research with AI assistance',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: null,
      duration: 240,
      category: 'tools',
      published: true,
      order: 3,
    },
  ]

    for (const video of videos) {
      await prisma.videoTutorial.upsert({
        where: { slug: video.slug },
        update: {},
        create: video,
      })
    }

    console.log(`✅ Video tutorials: ${videos.length}`)
  }

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
