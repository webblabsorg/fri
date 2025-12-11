#!/usr/bin/env tsx

/**
 * Phase 8: Comprehensive Prisma Type Audit Script
 * Identifies and reports all Prisma query type mismatches across the codebase
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

interface PrismaIssue {
  file: string
  line: number
  issue: string
  severity: 'error' | 'warning' | 'info'
  suggestion: string
}

interface AuditReport {
  totalFiles: number
  totalIssues: number
  issues: PrismaIssue[]
  summary: {
    errors: number
    warnings: number
    info: number
  }
}

class PrismaAuditor {
  private issues: PrismaIssue[] = []
  private devPath: string

  constructor(devPath: string) {
    this.devPath = devPath
  }

  async auditCodebase(): Promise<AuditReport> {
    console.log('🔍 Starting comprehensive Prisma audit...')
    
    // Find all TypeScript files
    const files = await glob('**/*.{ts,tsx}', {
      cwd: this.devPath,
      ignore: ['node_modules/**', 'dist/**', '.next/**', 'coverage/**'],
    })

    console.log(`📁 Found ${files.length} TypeScript files to audit`)

    for (const file of files) {
      await this.auditFile(path.join(this.devPath, file))
    }

    return this.generateReport(files.length)
  }

  private async auditFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      const relativePath = path.relative(this.devPath, filePath)

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineNumber = i + 1

        // Check for common Prisma issues
        this.checkPrismaImports(line, relativePath, lineNumber)
        this.checkPrismaQueries(line, relativePath, lineNumber)
        this.checkTypeAssertions(line, relativePath, lineNumber)
        this.checkMissingIncludes(line, relativePath, lineNumber)
        this.checkWhereClauseTypes(line, relativePath, lineNumber)
        this.checkDataTypes(line, relativePath, lineNumber)
        this.checkRelationQueries(line, relativePath, lineNumber)
      }
    } catch (error) {
      console.warn(`⚠️  Could not read file: ${filePath}`)
    }
  }

  private checkPrismaImports(line: string, file: string, lineNumber: number): void {
    // Check for missing or incorrect Prisma imports
    if (line.includes('prisma.') && !line.includes('import')) {
      const hasImport = line.includes('@/lib/db') || line.includes('prisma')
      if (!hasImport) {
        this.addIssue({
          file,
          line: lineNumber,
          issue: 'Prisma usage without proper import',
          severity: 'error',
          suggestion: 'Add: import { prisma } from "@/lib/db"'
        })
      }
    }
  }

  private checkPrismaQueries(line: string, file: string, lineNumber: number): void {
    // Check for type casting issues
    if (line.includes('prisma') && line.includes('as any')) {
      this.addIssue({
        file,
        line: lineNumber,
        issue: 'Using "as any" type assertion with Prisma',
        severity: 'warning',
        suggestion: 'Consider proper typing or regenerating Prisma client'
      })
    }

    // Check for missing await on async operations
    const asyncMethods = ['create', 'update', 'delete', 'findMany', 'findUnique', 'findFirst', 'upsert', 'count']
    for (const method of asyncMethods) {
      if (line.includes(`prisma.`) && line.includes(`.${method}(`) && !line.includes('await')) {
        this.addIssue({
          file,
          line: lineNumber,
          issue: `Missing await for async Prisma method: ${method}`,
          severity: 'error',
          suggestion: `Add await before prisma.*.${method}()`
        })
      }
    }
  }

  private checkTypeAssertions(line: string, file: string, lineNumber: number): void {
    // Check for unsafe type assertions
    if (line.includes('prisma') && (line.includes('as unknown') || line.includes('as any'))) {
      this.addIssue({
        file,
        line: lineNumber,
        issue: 'Unsafe type assertion with Prisma query',
        severity: 'warning',
        suggestion: 'Use proper Prisma types or regenerate client'
      })
    }
  }

  private checkMissingIncludes(line: string, file: string, lineNumber: number): void {
    // Check for potential missing includes in relations
    if (line.includes('.user') || line.includes('.project') || line.includes('.workspace')) {
      if (line.includes('findMany') || line.includes('findUnique')) {
        if (!line.includes('include:') && !line.includes('select:')) {
          this.addIssue({
            file,
            line: lineNumber,
            issue: 'Accessing relation without include/select',
            severity: 'info',
            suggestion: 'Consider adding include/select for related data'
          })
        }
      }
    }
  }

  private checkWhereClauseTypes(line: string, file: string, lineNumber: number): void {
    // Check for potential type mismatches in where clauses
    if (line.includes('where:') && line.includes('userId:')) {
      if (!line.includes('user.id') && !line.includes('"') && !line.includes("'")) {
        this.addIssue({
          file,
          line: lineNumber,
          issue: 'Potential type mismatch in userId where clause',
          severity: 'warning',
          suggestion: 'Ensure userId is properly typed as string'
        })
      }
    }
  }

  private checkDataTypes(line: string, file: string, lineNumber: number): void {
    // Check for common data type issues
    if (line.includes('data:') && line.includes('createdAt:')) {
      if (!line.includes('new Date()') && !line.includes('Date.now()')) {
        this.addIssue({
          file,
          line: lineNumber,
          issue: 'Potential date type mismatch',
          severity: 'warning',
          suggestion: 'Use new Date() for DateTime fields'
        })
      }
    }

    // Check for JSON field usage
    if (line.includes('Json') || line.includes('JsonValue')) {
      this.addIssue({
        file,
        line: lineNumber,
        issue: 'JSON field usage detected',
        severity: 'info',
        suggestion: 'Ensure proper JSON type handling and validation'
      })
    }
  }

  private checkRelationQueries(line: string, file: string, lineNumber: number): void {
    // Check for potential N+1 query issues
    if (line.includes('for (') && line.includes('prisma.')) {
      this.addIssue({
        file,
        line: lineNumber,
        issue: 'Potential N+1 query in loop',
        severity: 'warning',
        suggestion: 'Consider using batch queries or includes'
      })
    }
  }

  private addIssue(issue: PrismaIssue): void {
    this.issues.push(issue)
  }

  private generateReport(totalFiles: number): AuditReport {
    const summary = {
      errors: this.issues.filter(i => i.severity === 'error').length,
      warnings: this.issues.filter(i => i.severity === 'warning').length,
      info: this.issues.filter(i => i.severity === 'info').length,
    }

    return {
      totalFiles,
      totalIssues: this.issues.length,
      issues: this.issues,
      summary,
    }
  }
}

async function main() {
  const devPath = path.resolve(__dirname, '../../dev')
  const auditor = new PrismaAuditor(devPath)
  
  try {
    const report = await auditor.auditCodebase()
    
    console.log('\n📊 PRISMA AUDIT REPORT')
    console.log('='.repeat(50))
    console.log(`📁 Files audited: ${report.totalFiles}`)
    console.log(`🔍 Total issues found: ${report.totalIssues}`)
    console.log(`❌ Errors: ${report.summary.errors}`)
    console.log(`⚠️  Warnings: ${report.summary.warnings}`)
    console.log(`ℹ️  Info: ${report.summary.info}`)
    
    if (report.issues.length > 0) {
      console.log('\n🔍 DETAILED ISSUES:')
      console.log('-'.repeat(50))
      
      // Group by severity
      const errorIssues = report.issues.filter(i => i.severity === 'error')
      const warningIssues = report.issues.filter(i => i.severity === 'warning')
      const infoIssues = report.issues.filter(i => i.severity === 'info')
      
      if (errorIssues.length > 0) {
        console.log('\n❌ ERRORS (Must Fix):')
        errorIssues.forEach(issue => {
          console.log(`  📄 ${issue.file}:${issue.line}`)
          console.log(`     Issue: ${issue.issue}`)
          console.log(`     Fix: ${issue.suggestion}`)
          console.log('')
        })
      }
      
      if (warningIssues.length > 0) {
        console.log('\n⚠️  WARNINGS (Should Fix):')
        warningIssues.forEach(issue => {
          console.log(`  📄 ${issue.file}:${issue.line}`)
          console.log(`     Issue: ${issue.issue}`)
          console.log(`     Fix: ${issue.suggestion}`)
          console.log('')
        })
      }
      
      if (infoIssues.length > 0) {
        console.log('\nℹ️  INFO (Consider):')
        infoIssues.forEach(issue => {
          console.log(`  📄 ${issue.file}:${issue.line}`)
          console.log(`     Issue: ${issue.issue}`)
          console.log(`     Fix: ${issue.suggestion}`)
          console.log('')
        })
      }
    } else {
      console.log('\n✅ No Prisma issues found! Codebase looks good.')
    }
    
    // Write detailed report to file
    const reportPath = path.join(__dirname, 'prisma-audit-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Detailed report saved to: ${reportPath}`)
    
    // Exit with error code if critical issues found
    if (report.summary.errors > 0) {
      console.log('\n❌ Critical Prisma issues found. Please fix before proceeding.')
      process.exit(1)
    } else {
      console.log('\n✅ Prisma audit completed successfully!')
      process.exit(0)
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error)
    process.exit(1)
  }
}

// Run audit if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { PrismaAuditor, type PrismaIssue, type AuditReport }
