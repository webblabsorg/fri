/**
 * Phase 11: Generate 220 Tools from ai-agents.md
 * Usage: npx ts-node phase11-generate-tools.ts [--wave=1] [--dry-run]
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Tool definitions by category and wave
const TOOLS = [
  // Wave 1: Litigation, Contracts, Research, Due Diligence, Corporate, Employment
  { name: 'Case Timeline Generator', category: 'Litigation', wave: 1, hours: 16 },
  { name: 'Deposition Summary Tool', category: 'Litigation', wave: 1, hours: 20 },
  { name: 'Expert Witness Finder', category: 'Litigation', wave: 1, hours: 24 },
  { name: 'Settlement Calculator', category: 'Litigation', wave: 1, hours: 16 },
  { name: 'Discovery Request Generator', category: 'Litigation', wave: 1, hours: 16 },
  { name: 'NDA Generator Pro', category: 'Contracts', wave: 1, hours: 16 },
  { name: 'Employment Agreement Builder', category: 'Contracts', wave: 1, hours: 24 },
  { name: 'SaaS Agreement Drafter', category: 'Contracts', wave: 1, hours: 24 },
  { name: 'Partnership Agreement Builder', category: 'Contracts', wave: 1, hours: 24 },
  { name: 'Case Law Analyzer', category: 'Research', wave: 1, hours: 32 },
  { name: 'Statute Interpreter', category: 'Research', wave: 1, hours: 32 },
  { name: 'Legal Precedent Finder', category: 'Research', wave: 1, hours: 32 },
  { name: 'M&A Due Diligence Checklist', category: 'Due Diligence', wave: 1, hours: 32 },
  { name: 'Contract Portfolio Review', category: 'Due Diligence', wave: 1, hours: 32 },
  { name: 'Board Resolution Drafter', category: 'Corporate', wave: 1, hours: 16 },
  { name: 'Shareholder Agreement Builder', category: 'Corporate', wave: 1, hours: 32 },
  { name: 'Employee Handbook Builder', category: 'Employment', wave: 1, hours: 32 },
  { name: 'Discrimination Claim Analyzer', category: 'Employment', wave: 1, hours: 32 },
  // Wave 2: IP, Medical-Legal, Cybersecurity, International, Financial, Real Estate, Tax
  { name: 'Patent Application Drafter', category: 'IP & Patents', wave: 2, hours: 40 },
  { name: 'Prior Art Searcher', category: 'IP & Patents', wave: 2, hours: 32 },
  { name: 'Trademark Clearance Tool', category: 'IP & Patents', wave: 2, hours: 24 },
  { name: 'Medical Record Summarizer', category: 'Medical-Legal', wave: 2, hours: 32 },
  { name: 'Personal Injury Calculator', category: 'Medical-Legal', wave: 2, hours: 24 },
  { name: 'Privacy Policy Generator', category: 'Cybersecurity', wave: 2, hours: 16 },
  { name: 'GDPR Compliance Checker', category: 'Cybersecurity', wave: 2, hours: 32 },
  { name: 'Data Breach Response Tool', category: 'Cybersecurity', wave: 2, hours: 32 },
  { name: 'Cross-Border Transaction Advisor', category: 'International', wave: 2, hours: 40 },
  { name: 'Sanctions Screening Tool', category: 'International', wave: 2, hours: 32 },
  { name: 'Financial Statement Analyzer', category: 'Financial', wave: 2, hours: 32 },
  { name: 'Fraud Detection Tool', category: 'Financial', wave: 2, hours: 40 },
  { name: 'Purchase Agreement Drafter', category: 'Real Estate', wave: 2, hours: 24 },
  { name: 'Title Review Tool', category: 'Real Estate', wave: 2, hours: 32 },
  { name: 'Tax Planning Advisor', category: 'Tax', wave: 2, hours: 40 },
  // Wave 3: Alternative Legal, Education, Crisis, Niche, Family, Estate, Environmental
  { name: 'Legal Project Manager', category: 'Alternative Legal', wave: 3, hours: 24 },
  { name: 'Document Automation Builder', category: 'Alternative Legal', wave: 3, hours: 40 },
  { name: 'CLE Course Generator', category: 'Education', wave: 3, hours: 24 },
  { name: 'Bar Exam Prep Helper', category: 'Education', wave: 3, hours: 40 },
  { name: 'Crisis Response Planner', category: 'Crisis', wave: 3, hours: 32 },
  { name: 'Cannabis Law Advisor', category: 'Niche', wave: 3, hours: 32 },
  { name: 'Cryptocurrency Legal Tool', category: 'Niche', wave: 3, hours: 40 },
  { name: 'Divorce Settlement Calculator', category: 'Family', wave: 3, hours: 32 },
  { name: 'Child Custody Evaluator', category: 'Family', wave: 3, hours: 32 },
  { name: 'Will Drafter Pro', category: 'Estate', wave: 3, hours: 24 },
  { name: 'Trust Builder', category: 'Estate', wave: 3, hours: 32 },
  { name: 'Environmental Impact Assessor', category: 'Environmental', wave: 3, hours: 40 },
  { name: 'ESG Compliance Tool', category: 'Environmental', wave: 3, hours: 40 },
  // Wave 4: Emerging Technologies
  { name: 'AI Ethics Advisor', category: 'Emerging Tech', wave: 4, hours: 40 },
  { name: 'Blockchain Contract Analyzer', category: 'Emerging Tech', wave: 4, hours: 40 },
  { name: 'Smart Contract Auditor', category: 'Emerging Tech', wave: 4, hours: 48 },
  { name: 'Deepfake Detection Tool', category: 'Emerging Tech', wave: 4, hours: 48 },
  { name: 'Metaverse Legal Advisor', category: 'Emerging Tech', wave: 4, hours: 40 },
  { name: 'NFT Legal Helper', category: 'Emerging Tech', wave: 4, hours: 32 },
]

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const waveArg = args.find(a => a.startsWith('--wave='))
  const targetWave = waveArg ? parseInt(waveArg.split('=')[1]) : undefined

  console.log(`Generating tools${targetWave ? ` for wave ${targetWave}` : ''}${dryRun ? ' (dry run)' : ''}`)

  const tools = targetWave ? TOOLS.filter(t => t.wave === targetWave) : TOOLS
  console.log(`Tools to create: ${tools.length}`)

  if (dryRun) {
    tools.forEach(t => console.log(`  - ${t.name} (${t.category})`))
    return
  }

  // Create waves
  for (const waveNum of [1, 2, 3, 4]) {
    const waveTools = TOOLS.filter(t => t.wave === waveNum)
    await prisma.toolWave.upsert({
      where: { waveNumber: waveNum },
      update: { targetCount: waveTools.length },
      create: { waveNumber: waveNum, name: `Wave ${waveNum}`, targetCount: waveTools.length, status: 'planned' },
    })
  }

  // Create tool expansions
  for (const tool of tools) {
    const wave = await prisma.toolWave.findFirst({ where: { waveNumber: tool.wave } })
    if (!wave) continue

    await prisma.toolExpansion.upsert({
      where: { waveId_name: { waveId: wave.id, name: tool.name } },
      update: {},
      create: {
        waveId: wave.id,
        name: tool.name,
        category: tool.category,
        complexity: tool.hours > 30 ? 'high' : tool.hours > 16 ? 'medium' : 'low',
        estimatedHours: tool.hours,
        specSource: 'ai-agents.md',
        status: 'planned',
        priority: 0,
      },
    })
  }

  console.log('Done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
