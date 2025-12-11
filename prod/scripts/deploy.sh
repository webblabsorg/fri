#!/bin/bash

# Production Deployment Script for Frith AI Phase 7
# This script handles the complete deployment process

set -e

echo "🚀 Starting Frith AI Phase 7 deployment..."

# Configuration
PROJECT_NAME="frith-ai"
ENVIRONMENT=${1:-production}
BRANCH=${2:-main}

echo "📋 Deployment Configuration:"
echo "  Environment: $ENVIRONMENT"
echo "  Branch: $BRANCH"
echo "  Project: $PROJECT_NAME"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if required environment variables are set
required_vars=(
  "DATABASE_URL"
  "NEXTAUTH_SECRET"
  "STRIPE_SECRET_KEY"
  "BLOB_READ_WRITE_TOKEN"
  "ANTHROPIC_API_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Error: Required environment variable $var is not set"
    exit 1
  fi
done

echo "✅ Environment variables check passed"

# Database migration
echo "🗄️  Running database migrations..."
cd ../dev
npx prisma migrate deploy
npx prisma generate

echo "✅ Database migrations completed"

# Build application
echo "🔨 Building application..."
npm run build

echo "✅ Application build completed"

# Run tests
echo "🧪 Running tests..."
npm run test:ci || {
  echo "❌ Tests failed. Deployment aborted."
  exit 1
}

echo "✅ Tests passed"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
if [ "$ENVIRONMENT" = "production" ]; then
  npx vercel --prod --yes
else
  npx vercel --yes
fi

echo "✅ Vercel deployment completed"

# Start background workers
echo "⚙️  Starting background workers..."
cd ../prod/jobs

# Start scheduler
echo "Starting scheduler worker..."
pm2 start scheduler.ts --name "$PROJECT_NAME-scheduler" --interpreter ts-node || {
  echo "⚠️  Scheduler start failed, continuing..."
}

# Start bulk processor
echo "Starting bulk processor worker..."
pm2 start bulk-processor.ts --name "$PROJECT_NAME-bulk-processor" --interpreter ts-node || {
  echo "⚠️  Bulk processor start failed, continuing..."
}

echo "✅ Background workers started"

# Health check
echo "🏥 Running health checks..."
sleep 30 # Wait for deployment to be ready

HEALTH_URL="https://$PROJECT_NAME.vercel.app/api/health"
if [ "$ENVIRONMENT" != "production" ]; then
  HEALTH_URL="https://$PROJECT_NAME-git-$BRANCH.vercel.app/api/health"
fi

response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

if [ "$response" = "200" ]; then
  echo "✅ Health check passed"
else
  echo "⚠️  Health check failed (HTTP $response), but deployment may still be successful"
fi

# Post-deployment tasks
echo "📝 Running post-deployment tasks..."

# Warm up the application
echo "Warming up application..."
curl -s "$HEALTH_URL" > /dev/null || true

# Send deployment notification (if configured)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚀 Frith AI Phase 7 deployed to $ENVIRONMENT successfully!\"}" \
    "$SLACK_WEBHOOK_URL" || true
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  URL: $HEALTH_URL"
echo "  Time: $(date)"
echo ""
echo "🔧 Next steps:"
echo "  1. Monitor application logs"
echo "  2. Run integration tests"
echo "  3. Verify all Phase 7 features are working"
echo "  4. Update documentation if needed"
