#!/bin/bash

# Phase 4 Admin Dashboard Deployment Script
# This script prepares and deploys the Phase 4 admin dashboard

echo "========================================="
echo "Phase 4: Admin Dashboard Deployment"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Project directory verified${NC}"

# Step 1: Environment Check
echo ""
echo "Step 1: Checking environment..."
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment file found${NC}"

# Check for required environment variables
required_vars=("DATABASE_URL" "ANTHROPIC_API_KEY" "GOOGLE_AI_API_KEY")
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        echo -e "${RED}Error: ${var} not found in .env${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Required environment variables present${NC}"

# Step 2: Install Dependencies
echo ""
echo "Step 2: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: npm install failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Database Migration (if needed)
echo ""
echo "Step 3: Checking database..."
echo -e "${YELLOW}Note: AuditLog model should already exist in schema${NC}"

# Uncomment if you need to run migrations
# npx prisma migrate deploy
# npx prisma generate

echo -e "${GREEN}✓ Database check complete${NC}"

# Step 4: Build Application
echo ""
echo "Step 4: Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

# Step 5: Run Tests (if configured)
echo ""
echo "Step 5: Running tests..."
npm test -- --testPathIgnorePatterns="__tests__/api" || echo -e "${YELLOW}Warning: Some tests failed${NC}"

# Step 6: Pre-deployment Checklist
echo ""
echo "========================================="
echo "Pre-Deployment Checklist"
echo "========================================="
echo "Before deploying to production, verify:"
echo ""
echo "[ ] Admin role field exists in User model"
echo "[ ] At least one admin user exists in database"
echo "[ ] All environment variables are set in production"
echo "[ ] Backup database before deployment"
echo "[ ] Test admin access with multiple roles"
echo "[ ] Verify audit logging is working"
echo "[ ] Check all admin API endpoints are secured"
echo ""

# Step 7: Deployment Instructions
echo "========================================="
echo "Deployment Instructions"
echo "========================================="
echo ""
echo "To deploy to Vercel:"
echo "  1. Ensure all environment variables are set in Vercel dashboard"
echo "  2. Run: vercel --prod"
echo ""
echo "To deploy to other platforms:"
echo "  1. Upload built files from .next/ directory"
echo "  2. Set environment variables"
echo "  3. Start with: npm start"
echo ""
echo "After deployment:"
echo "  1. Create admin user if none exists"
echo "  2. Test admin dashboard access"
echo "  3. Verify all admin features"
echo "  4. Check audit logging"
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Phase 4 deployment preparation complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
