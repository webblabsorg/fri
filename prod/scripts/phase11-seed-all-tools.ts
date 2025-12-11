/**
 * Phase 11: Seed All 220 Tools
 * Creates actual Tool records with prompts, not just tracking entries
 * Usage: npx ts-node phase11-seed-all-tools.ts [--wave=1] [--dry-run]
 */

import { PrismaClient } from '@prisma/client'
import { ALL_TOOLS, getToolsByWave, TOOL_COUNTS, type ToolDefinition } from './tool-definitions'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const waveArg = args.find(a => a.startsWith('--wave='))
  const targetWave = waveArg ? parseInt(waveArg.split('=')[1]) : undefined

  console.log(`Seeding tools${targetWave ? ` for wave ${targetWave}` : ''}${dryRun ? ' (dry run)' : ''}`)

  const tools = targetWave ? ALL_TOOLS.filter(t => t.wave === targetWave) : ALL_TOOLS
  console.log(`Tools to create: ${tools.length}`)

  if (dryRun) {
    tools.forEach(t => console.log(`  - ${t.name} (${t.category})`))
    return
  }

  let created = 0, updated = 0

  for (const tool of tools) {
    const category = await prisma.category.findUnique({ where: { slug: tool.category } })
    if (!category) {
      console.log(`  ⚠ Category not found: ${tool.category}`)
      continue
    }

    const existing = await prisma.tool.findUnique({ where: { slug: tool.slug } })
    if (existing) {
      await prisma.tool.update({
        where: { slug: tool.slug },
        data: { ...tool, categoryId: category.id },
      })
      updated++
    } else {
      await prisma.tool.create({
        data: { ...tool, categoryId: category.id },
      })
      created++
    }

    // Link to ToolExpansion if exists
    await prisma.toolExpansion.updateMany({
      where: { name: tool.name },
      data: { status: 'deployed' },
    })
  }

  console.log(`Created: ${created}, Updated: ${updated}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
