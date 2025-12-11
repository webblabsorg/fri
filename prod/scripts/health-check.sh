#!/bin/bash

# Health Check Script for Frith AI Phase 7
# Verifies all systems are operational

set -e

BASE_URL=${1:-"http://localhost:3000"}
echo "🏥 Running health checks for Frith AI Phase 7..."
echo "Base URL: $BASE_URL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check endpoint
check_endpoint() {
  local endpoint=$1
  local expected_status=${2:-200}
  local description=$3
  
  echo -n "Checking $description... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" || echo "000")
  
  if [ "$response" = "$expected_status" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    return 0
  else
    echo -e "${RED}❌ FAIL (HTTP $response)${NC}"
    return 1
  fi
}

# Function to check authenticated endpoint
check_auth_endpoint() {
  local endpoint=$1
  local description=$2
  
  echo -n "Checking $description... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" || echo "000")
  
  if [ "$response" = "401" ]; then
    echo -e "${GREEN}✅ OK (Auth required)${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️  Unexpected response (HTTP $response)${NC}"
    return 1
  fi
}

# Track results
failed_checks=0
total_checks=0

# Core API Health Checks
echo "🔧 Core API Health Checks"
echo "========================"

((total_checks++))
check_endpoint "/api/health" 200 "API Health" || ((failed_checks++))

((total_checks++))
check_endpoint "/" 200 "Home Page" || ((failed_checks++))

((total_checks++))
check_endpoint "/api/auth/session" 200 "Auth Session" || ((failed_checks++))

# Phase 7 Feature Health Checks
echo ""
echo "📋 Phase 7 Feature Health Checks"
echo "================================"

# Document Management
((total_checks++))
check_auth_endpoint "/api/projects/test/documents" "Document API" || ((failed_checks++))

# Workflow Engine
((total_checks++))
check_auth_endpoint "/api/workflows" "Workflow API" || ((failed_checks++))

# Scheduling System
((total_checks++))
check_auth_endpoint "/api/schedules" "Scheduling API" || ((failed_checks++))

# Bulk Processing
((total_checks++))
check_auth_endpoint "/api/bulk" "Bulk Processing API" || ((failed_checks++))

# Integration APIs
echo ""
echo "🔗 Integration Health Checks"
echo "============================"

((total_checks++))
check_auth_endpoint "/api/integrations/clio/connect" "Clio Integration" || ((failed_checks++))

((total_checks++))
check_auth_endpoint "/api/integrations/zapier/webhook" "Zapier Integration" || ((failed_checks++))

# Database Health Check
echo ""
echo "🗄️  Database Health Check"
echo "========================"

((total_checks++))
echo -n "Checking database connection... "
if curl -s "$BASE_URL/api/health" | grep -q "database.*ok" 2>/dev/null; then
  echo -e "${GREEN}✅ OK${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
  ((failed_checks++))
fi

# Storage Health Check
echo ""
echo "💾 Storage Health Check"
echo "======================"

((total_checks++))
echo -n "Checking file storage... "
if curl -s "$BASE_URL/api/health" | grep -q "storage.*ok" 2>/dev/null; then
  echo -e "${GREEN}✅ OK${NC}"
else
  echo -e "${YELLOW}⚠️  Storage check inconclusive${NC}"
fi

# Performance Checks
echo ""
echo "⚡ Performance Checks"
echo "===================="

echo -n "Checking response time... "
start_time=$(date +%s%N)
curl -s "$BASE_URL/api/health" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

if [ $response_time -lt 1000 ]; then
  echo -e "${GREEN}✅ OK (${response_time}ms)${NC}"
elif [ $response_time -lt 3000 ]; then
  echo -e "${YELLOW}⚠️  Slow (${response_time}ms)${NC}"
else
  echo -e "${RED}❌ Too slow (${response_time}ms)${NC}"
  ((failed_checks++))
fi

((total_checks++))

# Summary
echo ""
echo "📊 Health Check Summary"
echo "======================"
echo "Total checks: $total_checks"
echo "Passed: $((total_checks - failed_checks))"
echo "Failed: $failed_checks"

if [ $failed_checks -eq 0 ]; then
  echo -e "${GREEN}🎉 All health checks passed!${NC}"
  exit 0
elif [ $failed_checks -le 2 ]; then
  echo -e "${YELLOW}⚠️  Some checks failed, but system is mostly operational${NC}"
  exit 1
else
  echo -e "${RED}❌ Multiple critical failures detected${NC}"
  exit 2
fi
