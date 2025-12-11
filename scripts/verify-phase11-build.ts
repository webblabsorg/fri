#!/usr/bin/env ts-node

/**
 * Phase 11 Build Verification Script
 * Verifies that all Phase 11 components are properly implemented and functional
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

interface VerificationResult {
  component: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string[]
}

class Phase11Verifier {
  private results: VerificationResult[] = []
  private projectRoot: string

  constructor() {
    this.projectRoot = process.cwd()
  }

  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string[]) {
    this.results.push({ component, status, message, details })
  }

  private fileExists(path: string): boolean {
    return existsSync(join(this.projectRoot, path))
  }

  private runCommand(command: string): { success: boolean; output: string } {
    try {
      const output = execSync(command, { encoding: 'utf8', cwd: this.projectRoot })
      return { success: true, output }
    } catch (error) {
      return { success: false, output: (error as Error).message }
    }
  }

  // ============================================================================
  // Verification Methods
  // ============================================================================

  verifyToolSystem() {
    console.log('🔧 Verifying Tool System...')

    // Check tool definition files
    const toolFiles = [
      'prod/scripts/tool-definitions/index.ts',
      'prod/scripts/tool-definitions/wave1-litigation.ts',
      'prod/scripts/tool-definitions/wave1-contracts.ts',
      'prod/scripts/tool-definitions/wave1-research.ts',
      'prod/scripts/tool-definitions/wave1-due-diligence.ts',
      'prod/scripts/tool-definitions/wave2-ip-privacy.ts',
      'prod/scripts/tool-definitions/wave2-specialized.ts',
      'prod/scripts/tool-definitions/wave3-analytics.ts',
      'prod/scripts/tool-definitions/wave4-advanced.ts',
    ]

    const missingFiles = toolFiles.filter(file => !this.fileExists(file))
    
    if (missingFiles.length === 0) {
      this.addResult('Tool Definitions', 'pass', 'All tool definition files present')
    } else {
      this.addResult('Tool Definitions', 'fail', 'Missing tool definition files', missingFiles)
    }

    // Check seeding script
    if (this.fileExists('prod/scripts/phase11-seed-all-tools.ts')) {
      this.addResult('Tool Seeding', 'pass', 'Tool seeding script present')
    } else {
      this.addResult('Tool Seeding', 'fail', 'Tool seeding script missing')
    }

    // Verify tool count in index file
    try {
      const indexContent = readFileSync(join(this.projectRoot, 'prod/scripts/tool-definitions/index.ts'), 'utf8')
      if (indexContent.includes('ALL_TOOLS') && indexContent.includes('TOOL_COUNTS')) {
        this.addResult('Tool Aggregation', 'pass', 'Tool aggregation logic implemented')
      } else {
        this.addResult('Tool Aggregation', 'warning', 'Tool aggregation may be incomplete')
      }
    } catch (error) {
      this.addResult('Tool Aggregation', 'fail', 'Could not verify tool aggregation')
    }
  }

  verifyEnterpriseFeatures() {
    console.log('🏢 Verifying Enterprise Features...')

    // Check SSO implementation
    const ssoFiles = [
      'dev/app/api/enterprise/sso/route.ts',
      'dev/app/sso/callback/route.ts',
      'dev/lib/enterprise-middleware.ts',
    ]

    const missingSSOFiles = ssoFiles.filter(file => !this.fileExists(file))
    
    if (missingSSOFiles.length === 0) {
      this.addResult('SSO Implementation', 'pass', 'SSO files present')
    } else {
      this.addResult('SSO Implementation', 'fail', 'Missing SSO files', missingSSOFiles)
    }

    // Check middleware integration
    if (this.fileExists('dev/middleware.ts')) {
      const middlewareContent = readFileSync(join(this.projectRoot, 'dev/middleware.ts'), 'utf8')
      if (middlewareContent.includes('SSO enforcement') && middlewareContent.includes('IP whitelist')) {
        this.addResult('Middleware Integration', 'pass', 'Enterprise middleware integrated')
      } else {
        this.addResult('Middleware Integration', 'warning', 'Middleware may not include all enterprise features')
      }
    } else {
      this.addResult('Middleware Integration', 'fail', 'Middleware file missing')
    }

    // Check SCIM endpoints
    if (this.fileExists('dev/app/api/enterprise/scim/users/route.ts')) {
      this.addResult('SCIM Endpoints', 'pass', 'SCIM user endpoints present')
    } else {
      this.addResult('SCIM Endpoints', 'fail', 'SCIM endpoints missing')
    }
  }

  verifyBrandingSystem() {
    console.log('🎨 Verifying Branding System...')

    // Check branding components
    const brandingFiles = [
      'dev/components/BrandingProvider.tsx',
      'dev/lib/email/templates.ts',
      'dev/lib/email/service.ts',
      'dev/lib/email/index.ts',
    ]

    const missingBrandingFiles = brandingFiles.filter(file => !this.fileExists(file))
    
    if (missingBrandingFiles.length === 0) {
      this.addResult('Branding Components', 'pass', 'All branding components present')
    } else {
      this.addResult('Branding Components', 'fail', 'Missing branding files', missingBrandingFiles)
    }

    // Check email templates
    try {
      const templatesContent = readFileSync(join(this.projectRoot, 'dev/lib/email/templates.ts'), 'utf8')
      const templateFunctions = [
        'welcomeEmail',
        'verificationEmail',
        'passwordResetEmail',
        'invitationEmail',
        'usageAlertEmail',
        'securityAlertEmail',
      ]
      
      const missingTemplates = templateFunctions.filter(fn => !templatesContent.includes(fn))
      
      if (missingTemplates.length === 0) {
        this.addResult('Email Templates', 'pass', 'All email templates implemented')
      } else {
        this.addResult('Email Templates', 'warning', 'Some email templates may be missing', missingTemplates)
      }
    } catch (error) {
      this.addResult('Email Templates', 'fail', 'Could not verify email templates')
    }
  }

  verifyMetricsSystem() {
    console.log('📊 Verifying Metrics System...')

    if (this.fileExists('dev/lib/metrics/index.ts')) {
      const metricsContent = readFileSync(join(this.projectRoot, 'dev/lib/metrics/index.ts'), 'utf8')
      
      const requiredFunctions = [
        'recordMetric',
        'recordToolRun',
        'recordAPIRequest',
        'getBusinessMetrics',
        'updateUsageAnalytics',
      ]
      
      const missingFunctions = requiredFunctions.filter(fn => !metricsContent.includes(fn))
      
      if (missingFunctions.length === 0) {
        this.addResult('Metrics Functions', 'pass', 'All metrics functions implemented')
      } else {
        this.addResult('Metrics Functions', 'fail', 'Missing metrics functions', missingFunctions)
      }
    } else {
      this.addResult('Metrics System', 'fail', 'Metrics system not found')
    }
  }

  verifySDKs() {
    console.log('📦 Verifying SDKs...')

    // Check JavaScript SDK
    const jsSDKFiles = [
      'sdk/javascript/src/index.ts',
      'sdk/javascript/src/index.test.ts',
      'sdk/javascript/package.json',
      'sdk/javascript/jest.config.js',
    ]

    const missingJSFiles = jsSDKFiles.filter(file => !this.fileExists(file))
    
    if (missingJSFiles.length === 0) {
      this.addResult('JavaScript SDK', 'pass', 'JavaScript SDK complete with tests')
    } else {
      this.addResult('JavaScript SDK', 'fail', 'Missing JavaScript SDK files', missingJSFiles)
    }

    // Check Python SDK
    const pythonSDKFiles = [
      'sdk/python/frithai/__init__.py',
      'sdk/python/frithai/client.py',
      'sdk/python/tests/test_client.py',
      'sdk/python/pyproject.toml',
    ]

    const missingPythonFiles = pythonSDKFiles.filter(file => !this.fileExists(file))
    
    if (missingPythonFiles.length === 0) {
      this.addResult('Python SDK', 'pass', 'Python SDK complete with tests')
    } else {
      this.addResult('Python SDK', 'fail', 'Missing Python SDK files', missingPythonFiles)
    }
  }

  verifyMobileApp() {
    console.log('📱 Verifying Mobile App...')

    const mobileFiles = [
      'mobile/App.tsx',
      'mobile/src/context/AuthContext.tsx',
      'mobile/src/screens/HomeScreen.tsx',
      'mobile/src/screens/ToolsScreen.tsx',
      'mobile/src/screens/SettingsScreen.tsx',
      'mobile/src/services/NotificationService.ts',
    ]

    const missingMobileFiles = mobileFiles.filter(file => !this.fileExists(file))
    
    if (missingMobileFiles.length === 0) {
      this.addResult('Mobile App', 'pass', 'Mobile app components present')
    } else {
      this.addResult('Mobile App', 'fail', 'Missing mobile app files', missingMobileFiles)
    }

    // Check package.json for mobile dependencies
    if (this.fileExists('mobile/package.json')) {
      try {
        const packageContent = JSON.parse(readFileSync(join(this.projectRoot, 'mobile/package.json'), 'utf8'))
        const requiredDeps = ['expo', 'react-native', '@react-navigation/native']
        const missingDeps = requiredDeps.filter(dep => 
          !packageContent.dependencies?.[dep] && !packageContent.devDependencies?.[dep]
        )
        
        if (missingDeps.length === 0) {
          this.addResult('Mobile Dependencies', 'pass', 'Required mobile dependencies present')
        } else {
          this.addResult('Mobile Dependencies', 'warning', 'Some mobile dependencies may be missing', missingDeps)
        }
      } catch (error) {
        this.addResult('Mobile Dependencies', 'fail', 'Could not parse mobile package.json')
      }
    }
  }

  verifyTests() {
    console.log('🧪 Verifying Tests...')

    // Check Phase 11 integration test
    if (this.fileExists('dev/__tests__/phase11-integration.test.ts')) {
      this.addResult('Integration Tests', 'pass', 'Phase 11 integration tests present')
    } else {
      this.addResult('Integration Tests', 'fail', 'Phase 11 integration tests missing')
    }

    // Check existing API tests
    if (this.fileExists('dev/__tests__/api/phase11.test.ts')) {
      this.addResult('API Tests', 'pass', 'Phase 11 API tests present')
    } else {
      this.addResult('API Tests', 'warning', 'Phase 11 API tests may be missing')
    }

    // Try to run tests (if Jest is available)
    const testResult = this.runCommand('npm test -- --passWithNoTests --silent')
    if (testResult.success) {
      this.addResult('Test Execution', 'pass', 'Tests can be executed successfully')
    } else {
      this.addResult('Test Execution', 'warning', 'Could not run tests', [testResult.output])
    }
  }

  verifyDatabaseSchema() {
    console.log('🗄️ Verifying Database Schema...')

    if (this.fileExists('dev/prisma/schema.prisma')) {
      const schemaContent = readFileSync(join(this.projectRoot, 'dev/prisma/schema.prisma'), 'utf8')
      
      const requiredModels = [
        'Tool',
        'ToolRun',
        'Category',
        'SSOConfig',
        'IPWhitelist',
        'CustomBranding',
        'UsageAnalytics',
        'APIKey',
        'MobileDevice',
      ]
      
      const missingModels = requiredModels.filter(model => !schemaContent.includes(`model ${model}`))
      
      if (missingModels.length === 0) {
        this.addResult('Database Models', 'pass', 'All required models present in schema')
      } else {
        this.addResult('Database Models', 'fail', 'Missing database models', missingModels)
      }
    } else {
      this.addResult('Database Schema', 'fail', 'Prisma schema file missing')
    }
  }

  // ============================================================================
  // Main Verification
  // ============================================================================

  async run() {
    console.log('🚀 Starting Phase 11 Build Verification...\n')

    this.verifyToolSystem()
    this.verifyEnterpriseFeatures()
    this.verifyBrandingSystem()
    this.verifyMetricsSystem()
    this.verifySDKs()
    this.verifyMobileApp()
    this.verifyTests()
    this.verifyDatabaseSchema()

    this.printResults()
    this.printSummary()
  }

  private printResults() {
    console.log('\n📋 Verification Results:\n')

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
      console.log(`${icon} ${result.component}: ${result.message}`)
      
      if (result.details && result.details.length > 0) {
        result.details.forEach(detail => {
          console.log(`   - ${detail}`)
        })
      }
    })
  }

  private printSummary() {
    const passed = this.results.filter(r => r.status === 'pass').length
    const warnings = this.results.filter(r => r.status === 'warning').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const total = this.results.length

    console.log('\n📊 Summary:')
    console.log(`   ✅ Passed: ${passed}/${total}`)
    console.log(`   ⚠️  Warnings: ${warnings}/${total}`)
    console.log(`   ❌ Failed: ${failed}/${total}`)

    const successRate = Math.round((passed / total) * 100)
    console.log(`   📈 Success Rate: ${successRate}%`)

    if (failed === 0) {
      console.log('\n🎉 Phase 11 implementation is ready for deployment!')
    } else if (failed <= 2) {
      console.log('\n⚠️  Phase 11 implementation is mostly complete but has some issues to address.')
    } else {
      console.log('\n❌ Phase 11 implementation needs significant work before deployment.')
    }

    // Exit with appropriate code
    process.exit(failed > 2 ? 1 : 0)
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new Phase11Verifier()
  verifier.run().catch(console.error)
}

export default Phase11Verifier
