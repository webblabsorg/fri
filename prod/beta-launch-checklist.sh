#!/bin/bash

# Frith AI - Beta Launch Checklist Script
# Phase 9: Pre-launch verification
# Run this script before launching to beta users

echo "========================================"
echo "Frith AI - Beta Launch Checklist"
echo "Phase 9: Pre-launch Verification"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
    ((WARNINGS++))
}

echo "1. Environment Variables"
echo "------------------------"

# Check required environment variables
ENV_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "ANTHROPIC_API_KEY" "STRIPE_SECRET_KEY" "RESEND_API_KEY")

for var in "${ENV_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        check_pass "$var is set"
    else
        check_fail "$var is not set"
    fi
done

echo ""
echo "2. Database Connection"
echo "----------------------"

# Test database connection (requires psql or similar)
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
        check_pass "Database connection successful"
    else
        check_fail "Database connection failed"
    fi
else
    check_warn "psql not installed - manual database check required"
fi

echo ""
echo "3. Build Status"
echo "---------------"

# Check if build succeeds
cd ../dev
if npm run build &> /dev/null; then
    check_pass "Build successful"
else
    check_fail "Build failed"
fi

echo ""
echo "4. Test Status"
echo "--------------"

# Run tests
if npm test &> /dev/null; then
    check_pass "All tests passing"
else
    check_fail "Some tests failing"
fi

echo ""
echo "5. Type Check"
echo "-------------"

if npx tsc --noEmit &> /dev/null; then
    check_pass "TypeScript types valid"
else
    check_fail "TypeScript errors found"
fi

echo ""
echo "6. Lint Check"
echo "-------------"

if npm run lint &> /dev/null; then
    check_pass "No lint errors"
else
    check_warn "Lint warnings present"
fi

echo ""
echo "========================================"
echo "Summary"
echo "========================================"
echo -e "${GREEN}Passed${NC}: $PASSED"
echo -e "${RED}Failed${NC}: $FAILED"
echo -e "${YELLOW}Warnings${NC}: $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Ready for beta launch!${NC}"
    exit 0
else
    echo -e "${RED}✗ Not ready for launch. Please fix failed checks.${NC}"
    exit 1
fi
