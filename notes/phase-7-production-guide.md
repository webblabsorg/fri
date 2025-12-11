# Phase 7 Production Deployment Guide

## Overview

This guide covers the complete production deployment of Frith AI Phase 7, including all advanced features, integrations, and background services.

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone <repository-url>
cd frith/dev
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your production values

# 3. Setup database
npx prisma migrate deploy
npx prisma generate

# 4. Deploy
cd ../prod/scripts
chmod +x deploy.sh
./deploy.sh production
```

## 📋 Prerequisites

### Required Services

1. **Database**: PostgreSQL 14+ (Recommended: Supabase, Railway, or AWS RDS)
2. **File Storage**: Vercel Blob or AWS S3
3. **Email Service**: Resend or SendGrid
4. **Payment Processing**: Stripe
5. **Hosting**: Vercel (recommended) or any Node.js hosting

### Optional Services (Phase 7 Features)

1. **Redis**: For job queues and caching (Upstash recommended)
2. **Background Jobs**: PM2 or similar process manager
3. **Monitoring**: Sentry for error tracking
4. **Analytics**: Google Analytics or similar

## 🔧 Environment Configuration

### Core Variables

```bash
# App Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-here

# AI APIs
ANTHROPIC_API_KEY=sk-ant-your-key-here
GOOGLE_AI_API_KEY=AIza-your-key-here

# File Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_your-token-here

# Payment Processing
STRIPE_SECRET_KEY=sk_live_your-key-here
STRIPE_PUBLISHABLE_KEY=pk_live_your-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-key-here
```

### Phase 7 Integration Variables

```bash
# Clio Integration
CLIO_CLIENT_ID=your-clio-client-id
CLIO_CLIENT_SECRET=your-clio-client-secret

# Zapier Integration
ZAPIER_CLIENT_ID=your-zapier-client-id
ZAPIER_CLIENT_SECRET=your-zapier-client-secret

# Job Processing
REDIS_URL=redis://your-redis-url:6379
WORKER_CONCURRENCY=5

# Rate Limiting
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

## 🗄️ Database Setup

### 1. Create Database

```sql
-- Create database
CREATE DATABASE frith_ai_production;

-- Create user (if needed)
CREATE USER frith_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE frith_ai_production TO frith_user;
```

### 2. Run Migrations

```bash
# Set DATABASE_URL in .env
DATABASE_URL=postgresql://frith_user:password@host:5432/frith_ai_production

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 3. Seed Data (Optional)

```bash
# Run seed script if you have one
npx prisma db seed
```

## 🌐 Vercel Deployment

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Configure Project

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Set environment variables
vercel env add NEXTAUTH_SECRET
vercel env add DATABASE_URL
# ... add all other environment variables
```

### 3. Deploy

```bash
# Deploy to production
vercel --prod
```

### 4. Configure Domains

```bash
# Add custom domain
vercel domains add your-domain.com
```

## ⚙️ Background Workers Setup

Phase 7 includes background workers for scheduling and bulk processing.

### 1. Setup PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start workers
cd prod/jobs
pm2 start scheduler.ts --name "frith-scheduler" --interpreter ts-node
pm2 start bulk-processor.ts --name "frith-bulk-processor" --interpreter ts-node

# Save PM2 configuration
pm2 save
pm2 startup
```

### 2. Monitor Workers

```bash
# Check status
pm2 status

# View logs
pm2 logs frith-scheduler
pm2 logs frith-bulk-processor

# Restart workers
pm2 restart all
```

## 🔗 Integration Setup

### Clio Integration

1. **Register Application**: Go to Clio Developer Portal
2. **Get Credentials**: Obtain Client ID and Secret
3. **Configure Redirect**: Set redirect URI to `https://your-domain.com/api/integrations/clio/callback`
4. **Set Environment Variables**:
   ```bash
   CLIO_CLIENT_ID=your-client-id
   CLIO_CLIENT_SECRET=your-client-secret
   ```

### Zapier Integration

1. **Create Zapier App**: Use Zapier Developer Platform
2. **Configure Webhooks**: Point to your API endpoints
3. **Set Authentication**: Use API key authentication
4. **Test Integration**: Create test Zaps

### Microsoft Word Add-in

1. **Update Manifest**: Replace URLs in `prod/word-addin/manifest.xml`
2. **Deploy Static Files**: Host manifest and assets
3. **Submit to Store**: Follow Microsoft AppSource process

## 📊 Monitoring & Observability

### Health Checks

```bash
# Check application health
curl https://your-domain.com/api/health

# Run comprehensive health check
cd prod/scripts
./health-check.sh https://your-domain.com
```

### Logging

```bash
# View application logs (Vercel)
vercel logs

# View worker logs (PM2)
pm2 logs
```

### Error Tracking

Configure Sentry for error tracking:

```bash
# Add to environment
SENTRY_DSN=https://your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-token
```

## 🔒 Security Considerations

### 1. Environment Variables

- Never commit `.env` files
- Use secure, randomly generated secrets
- Rotate API keys regularly
- Use least-privilege access for database users

### 2. API Security

- All APIs include authentication checks
- Rate limiting is implemented
- Input validation on all endpoints
- CORS properly configured

### 3. File Upload Security

- File type validation
- Size limits enforced
- Virus scanning (recommended)
- Secure file storage

### 4. Integration Security

- OAuth flows properly implemented
- Webhook signature verification
- API key rotation supported
- Secure credential storage

## 📈 Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for Phase 7 tables
CREATE INDEX idx_workflow_runs_user_id ON "WorkflowRun" ("userId");
CREATE INDEX idx_scheduled_jobs_next_run ON "ScheduledJob" ("nextRunAt");
CREATE INDEX idx_bulk_jobs_status ON "BulkJob" ("status");
CREATE INDEX idx_project_documents_project_id ON "ProjectDocument" ("projectId");
```

### 2. Caching Strategy

- Redis for session storage
- CDN for static assets
- Database query caching
- API response caching

### 3. Background Job Optimization

- Process jobs in batches
- Implement job priorities
- Monitor queue lengths
- Scale workers based on load

## 🧪 Testing in Production

### 1. Smoke Tests

```bash
# Run health checks
./prod/scripts/health-check.sh https://your-domain.com

# Test core functionality
curl -X POST https://your-domain.com/api/auth/signin
curl https://your-domain.com/api/tools
```

### 2. Integration Tests

- Test Clio OAuth flow
- Verify Zapier webhooks
- Test file upload/download
- Verify workflow execution

### 3. Load Testing

```bash
# Use tools like Artillery or k6
artillery quick --count 10 --num 5 https://your-domain.com
```

## 🔄 Maintenance & Updates

### 1. Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name feature_name

# Deploy to production
npx prisma migrate deploy
```

### 2. Application Updates

```bash
# Deploy new version
git push origin main
vercel --prod

# Update workers
pm2 restart all
```

### 3. Backup Strategy

- Database: Daily automated backups
- File Storage: Versioned with retention
- Configuration: Store in version control

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify network connectivity
   - Check database user permissions

2. **File Upload Failures**
   - Verify BLOB_READ_WRITE_TOKEN
   - Check file size limits
   - Validate file types

3. **Integration Failures**
   - Verify API credentials
   - Check webhook URLs
   - Test OAuth flows

4. **Worker Issues**
   - Check PM2 status
   - Review worker logs
   - Verify Redis connection

### Debug Commands

```bash
# Check environment variables
vercel env ls

# View recent logs
vercel logs --follow

# Test database connection
npx prisma db pull

# Check worker status
pm2 status
pm2 logs --lines 50
```

## 📞 Support

For production issues:

1. **Check Health Endpoint**: `/api/health`
2. **Review Logs**: Application and worker logs
3. **Monitor Metrics**: Database, API, and worker metrics
4. **Contact Support**: Include health check output and relevant logs

## 🎯 Success Metrics

Monitor these metrics to ensure successful deployment:

- **Uptime**: > 99.9%
- **Response Time**: < 500ms for API calls
- **Error Rate**: < 0.1%
- **Worker Processing**: Jobs processed within SLA
- **Integration Success**: > 95% success rate for external APIs

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Production Guide](https://www.prisma.io/docs/guides/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Clio API Documentation](https://docs.clio.com/)
- [Zapier Platform Documentation](https://platform.zapier.com/docs)
