# Phase 12.1.4: Expense Management & Accounts Payable Deployment Script
# Run this script to deploy Phase 12.1.4 features

param(
    [switch]$SkipMigration,
    [switch]$SkipBuild,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 12.1.4: Expense Management Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed. Please install npm first."
    exit 1
}

$nodeVersion = node --version
Write-Host "  Node.js version: $nodeVersion" -ForegroundColor Gray

# Navigate to dev directory
$devPath = Join-Path $PSScriptRoot "..\..\dev"
if (-not (Test-Path $devPath)) {
    Write-Error "Dev directory not found at: $devPath"
    exit 1
}

Push-Location $devPath

try {
    # Install dependencies
    Write-Host "[2/5] Installing dependencies..." -ForegroundColor Yellow
    if (-not $DryRun) {
        npm install
    } else {
        Write-Host "  [DRY RUN] Would run: npm install" -ForegroundColor Gray
    }

    # Run database migrations
    if (-not $SkipMigration) {
        Write-Host "[3/5] Running database migrations..." -ForegroundColor Yellow
        if (-not $DryRun) {
            npx prisma generate
            npx prisma db push
        } else {
            Write-Host "  [DRY RUN] Would run: npx prisma generate" -ForegroundColor Gray
            Write-Host "  [DRY RUN] Would run: npx prisma db push" -ForegroundColor Gray
        }
    } else {
        Write-Host "[3/5] Skipping database migrations (--SkipMigration)" -ForegroundColor Gray
    }

    # Build application
    if (-not $SkipBuild) {
        Write-Host "[4/5] Building application..." -ForegroundColor Yellow
        if (-not $DryRun) {
            npm run build
        } else {
            Write-Host "  [DRY RUN] Would run: npm run build" -ForegroundColor Gray
        }
    } else {
        Write-Host "[4/5] Skipping build (--SkipBuild)" -ForegroundColor Gray
    }

    # Verify deployment
    Write-Host "[5/5] Verifying deployment..." -ForegroundColor Yellow
    
    $apiRoutes = @(
        "app/api/expenses/route.ts",
        "app/api/expenses/[id]/route.ts",
        "app/api/expenses/[id]/submit/route.ts",
        "app/api/expenses/[id]/approve/route.ts",
        "app/api/expenses/[id]/reject/route.ts",
        "app/api/expenses/upload-receipt/route.ts",
        "app/api/expenses/reports/by-category/route.ts",
        "app/api/expenses/reports/by-matter/route.ts",
        "app/api/expenses/reports/reimbursable/route.ts",
        "app/api/vendors/route.ts",
        "app/api/vendors/[id]/route.ts",
        "app/api/vendors/reports/1099/route.ts",
        "app/api/vendor-bills/route.ts",
        "app/api/vendor-bills/[id]/route.ts",
        "app/api/vendor-bills/[id]/approve/route.ts",
        "app/api/vendor-bills/[id]/pay/route.ts",
        "app/api/vendor-bills/batch-pay/route.ts",
        "app/api/expense-policies/route.ts",
        "app/api/expense-policies/[id]/route.ts"
    )

    $missingRoutes = @()
    foreach ($route in $apiRoutes) {
        if (-not (Test-Path $route)) {
            $missingRoutes += $route
        }
    }

    if ($missingRoutes.Count -gt 0) {
        Write-Warning "Missing API routes:"
        foreach ($route in $missingRoutes) {
            Write-Host "  - $route" -ForegroundColor Red
        }
    } else {
        Write-Host "  All API routes verified!" -ForegroundColor Green
    }

    # Check UI pages
    $uiPages = @(
        "app/dashboard/finance/expenses/page.tsx",
        "app/dashboard/finance/vendors/page.tsx",
        "app/dashboard/finance/vendor-bills/page.tsx"
    )

    foreach ($page in $uiPages) {
        if (Test-Path $page) {
            Write-Host "  UI page verified: $page" -ForegroundColor Green
        } else {
            Write-Warning "  Missing UI page: $page"
        }
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Phase 12.1.4 Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Features deployed:" -ForegroundColor Cyan
    Write-Host "  - Expense tracking with OCR receipt scanning" -ForegroundColor White
    Write-Host "  - Vendor management with 1099 reporting" -ForegroundColor White
    Write-Host "  - Accounts payable with batch payments" -ForegroundColor White
    Write-Host "  - Expense policy enforcement" -ForegroundColor White
    Write-Host "  - Expense reports (by category, matter, reimbursable)" -ForegroundColor White
    Write-Host ""
    Write-Host "Environment variables required:" -ForegroundColor Yellow
    Write-Host "  - GOOGLE_VISION_API_KEY (optional, for OCR)" -ForegroundColor Gray
    Write-Host ""

} finally {
    Pop-Location
}
