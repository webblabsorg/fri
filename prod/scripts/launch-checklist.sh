#!/bin/bash

# ============================================================================
# Frith AI - Public Launch Checklist Script
# Run this before going live to verify all systems are ready
# ============================================================================

set -e

echo "🚀 Frith AI Public Launch Checklist"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}!${NC} $1"
    ((WARN++))
}

# ============================================================================
# Environment Variables
# ============================================================================
echo "📋 Checking Environment Variables..."

if [ -n "$DATABASE_URL" ]; then
    check_pass "DATABASE_URL is set"
else
    check_fail "DATABASE_URL is not set"
fi

if [ -n "$NEXTAUTH_SECRET" ]; then
    check_pass "NEXTAUTH_SECRET is set"
else
    check_fail "NEXTAUTH_SECRET is not set"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    check_pass "ANTHROPIC_API_KEY is set"
else
    check_fail "ANTHROPIC_API_KEY is not set"
fi

if [ -n "$STRIPE_SECRET_KEY" ]; then
    check_pass "STRIPE_SECRET_KEY is set"
else
    check_fail "STRIPE_SECRET_KEY is not set"
fi

if [ -n "$RESEND_API_KEY" ]; then
    check_pass "RESEND_API_KEY is set"
else
    check_fail "RESEND_API_KEY is not set"
fi

if [ -n "$SENTRY_DSN" ]; then
    check_pass "SENTRY_DSN is set"
else
    check_warn "SENTRY_DSN is not set (error tracking disabled)"
fi

if [ -n "$NEXT_PUBLIC_GA_ID" ]; then
    check_pass "NEXT_PUBLIC_GA_ID is set"
else
    check_warn "NEXT_PUBLIC_GA_ID is not set (analytics disabled)"
fi

echo ""

# ============================================================================
# Database Connection
# ============================================================================
echo "🗄️  Checking Database..."

if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null; then
        check_pass "Database connection successful"
    else
        check_fail "Database connection failed"
    fi
else
    check_warn "psql not installed, skipping database check"
fi

echo ""

# ============================================================================
# Build Check
# ============================================================================
echo "🔨 Checking Build..."

if [ -d ".next" ]; then
    check_pass "Next.js build exists"
else
    check_fail "Next.js build not found - run 'npm run build'"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================
echo "===================================="
echo "📊 Summary"
echo "===================================="
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo -e "${RED}Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ Ready for launch!${NC}"
    exit 0
else
    echo -e "${RED}✗ Fix the above issues before launching${NC}"
    exit 1
fi
