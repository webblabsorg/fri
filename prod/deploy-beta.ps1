# Frith AI - Beta Deployment Script (PowerShell)
# Phase 9: Deploy to production for beta launch

param(
    [switch]$DryRun,
    [switch]$SkipTests,
    [string]$Environment = "production"
)

Write-Host "========================================"
Write-Host "Frith AI - Beta Deployment"
Write-Host "Phase 9: Production Deployment"
Write-Host "========================================"
Write-Host ""

$ErrorActionPreference = "Stop"

# Configuration
$DevPath = Join-Path $PSScriptRoot "..\dev"
$ProdPath = $PSScriptRoot

function Write-Success { param($Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Failure { param($Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "→ $Message" -ForegroundColor Cyan }

# Step 1: Pre-deployment checks
Write-Host "Step 1: Pre-deployment Checks" -ForegroundColor Blue
Write-Host "-----------------------------"

Set-Location $DevPath

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Warning "Uncommitted changes detected"
    if (-not $DryRun) {
        $confirm = Read-Host "Continue anyway? (y/N)"
        if ($confirm -ne "y") {
            Write-Failure "Deployment cancelled"
            exit 1
        }
    }
} else {
    Write-Success "No uncommitted changes"
}

# Step 2: Run tests
if (-not $SkipTests) {
    Write-Host ""
    Write-Host "Step 2: Running Tests" -ForegroundColor Blue
    Write-Host "---------------------"
    
    Write-Info "Running npm test..."
    $testResult = npm test 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "All tests passed"
    } else {
        Write-Failure "Tests failed"
        Write-Host $testResult
        if (-not $DryRun) {
            exit 1
        }
    }
} else {
    Write-Warning "Tests skipped (--SkipTests flag)"
}

# Step 3: Build
Write-Host ""
Write-Host "Step 3: Building Application" -ForegroundColor Blue
Write-Host "----------------------------"

Write-Info "Running npm run build..."
if (-not $DryRun) {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build successful"
    } else {
        Write-Failure "Build failed"
        Write-Host $buildResult
        exit 1
    }
} else {
    Write-Info "[DRY RUN] Would run: npm run build"
}

# Step 4: Type check
Write-Host ""
Write-Host "Step 4: Type Checking" -ForegroundColor Blue
Write-Host "---------------------"

Write-Info "Running TypeScript check..."
$typeCheck = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "No TypeScript errors"
} else {
    Write-Failure "TypeScript errors found"
    Write-Host $typeCheck
    if (-not $DryRun) {
        exit 1
    }
}

# Step 5: Deploy to Vercel
Write-Host ""
Write-Host "Step 5: Deploying to Vercel" -ForegroundColor Blue
Write-Host "---------------------------"

if (-not $DryRun) {
    Write-Info "Deploying to $Environment..."
    
    if ($Environment -eq "production") {
        $deployResult = vercel --prod 2>&1
    } else {
        $deployResult = vercel 2>&1
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deployment successful"
        Write-Host $deployResult
    } else {
        Write-Failure "Deployment failed"
        Write-Host $deployResult
        exit 1
    }
} else {
    Write-Info "[DRY RUN] Would run: vercel --prod"
}

# Step 6: Post-deployment verification
Write-Host ""
Write-Host "Step 6: Post-deployment Verification" -ForegroundColor Blue
Write-Host "------------------------------------"

$siteUrl = $env:NEXT_PUBLIC_SITE_URL
if (-not $siteUrl) {
    $siteUrl = "https://frithai.com"
}

Write-Info "Checking health endpoint..."
if (-not $DryRun) {
    try {
        $healthCheck = Invoke-RestMethod -Uri "$siteUrl/api/health" -TimeoutSec 30
        if ($healthCheck.status -eq "healthy") {
            Write-Success "Health check passed"
        } else {
            Write-Warning "Health check returned unexpected status"
        }
    } catch {
        Write-Warning "Health check failed: $_"
    }
} else {
    Write-Info "[DRY RUN] Would check: $siteUrl/api/health"
}

# Summary
Write-Host ""
Write-Host "========================================"
Write-Host "Deployment Summary" -ForegroundColor Blue
Write-Host "========================================"

if ($DryRun) {
    Write-Warning "This was a DRY RUN - no changes were made"
} else {
    Write-Success "Beta deployment complete!"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Verify the site at $siteUrl"
    Write-Host "2. Check the admin dashboard at $siteUrl/admin/beta"
    Write-Host "3. Begin inviting beta users"
    Write-Host "4. Monitor error tracking (Sentry)"
}

Set-Location $ProdPath
