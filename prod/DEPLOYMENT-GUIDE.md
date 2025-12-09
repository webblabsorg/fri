# Phase 4: Admin Dashboard - Deployment Guide

**Version:** 1.0.0  
**Date:** December 9, 2025  
**Phase:** 4 - Admin Dashboard

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are set in your production environment:

```bash
# Required for Phase 4
DATABASE_URL="postgresql://..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="AIza..."
SESSION_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 2. Database Requirements

- PostgreSQL database with all Phase 3 tables
- AuditLog model must exist (already in schema)
- At least one admin user (see creation instructions below)

### 3. Admin User Setup

You MUST create at least one admin user before accessing the admin dashboard.

**Option A: SQL Script (Recommended)**
```bash
# Edit prod/create-admin-user.sql with your details
# Then run against your database:
psql $DATABASE_URL -f prod/create-admin-user.sql
```

**Option B: Update Existing User**
```sql
-- Update an existing user to admin
UPDATE "User" 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

**Option C: Through Application (Future)**
- A user management tool will be added in Phase 5

---

## 🚀 Deployment Steps

### Step 1: Prepare Application

```bash
# Navigate to project directory
cd dev/

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build application
npm run build
```

### Step 2: Run Tests

```bash
# Run test suite (excluding API tests)
npm test -- --testPathIgnorePatterns="__tests__/api"

# All tests should pass
```

### Step 3: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables in Vercel dashboard
# Go to: Project Settings > Environment Variables
```

### Step 4: Deploy to Other Platforms

**Netlify:**
```bash
# Build command: npm run build
# Publish directory: .next
# Set environment variables in Netlify dashboard
```

**Docker:**
```bash
# Build Docker image
docker build -t frith-ai:phase-4 .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e ANTHROPIC_API_KEY="..." \
  frith-ai:phase-4
```

**Traditional Server:**
```bash
# Upload .next/ folder and node_modules/
# Or run npm install on server
npm install --production

# Start application
npm start
# Or use PM2 for process management
pm2 start npm --name "frith-ai" -- start
```

---

## ✅ Post-Deployment Verification

### 1. Basic Health Checks

```bash
# Check application is running
curl https://your-domain.com

# Check API health
curl https://your-domain.com/api/health

# Check database connection (should return status)
curl https://your-domain.com/api/auth/session
```

### 2. Admin Access Verification

1. **Sign in with admin credentials**
   - Go to: https://your-domain.com/signin
   - Use the admin email/password you created

2. **Access admin dashboard**
   - Go to: https://your-domain.com/admin
   - Should see red warning banner "ADMIN MODE"
   - Should see admin sidebar navigation

3. **Test admin features:**
   - [ ] Dashboard loads with metrics
   - [ ] Users page displays user list
   - [ ] User search and filters work
   - [ ] User detail page loads
   - [ ] Tools page shows all 20 tools
   - [ ] System status page displays services
   - [ ] Audit logs page loads and shows logs
   - [ ] Can export audit logs as CSV

### 3. Security Verification

- [ ] Non-admin users cannot access `/admin`
- [ ] Non-admin users redirected to `/dashboard`
- [ ] Unauthenticated users redirected to `/signin`
- [ ] Admin actions are logged to audit trail
- [ ] Warning banner is visible throughout admin area

### 4. Performance Checks

- [ ] Dashboard loads in < 3 seconds
- [ ] User list loads with 50+ users
- [ ] Filters and search respond quickly
- [ ] Analytics queries complete in reasonable time

---

## 🐛 Troubleshooting

### Issue: Cannot Access Admin Dashboard

**Symptoms:** Redirected to `/dashboard` when visiting `/admin`

**Solution:**
1. Verify user has `admin` or `super_admin` role:
   ```sql
   SELECT email, role FROM "User" WHERE email = 'your-email@example.com';
   ```
2. If role is `user`, update it:
   ```sql
   UPDATE "User" SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. Sign out and sign back in

### Issue: Analytics Not Loading

**Symptoms:** Dashboard shows loading spinner or 0 for all metrics

**Solution:**
1. Check database connection
2. Verify Prisma client is generated: `npx prisma generate`
3. Check browser console for errors
4. Verify API endpoint: `curl https://your-domain.com/api/admin/analytics/overview`

### Issue: Audit Logs Not Recording

**Symptoms:** Audit logs page is empty after admin actions

**Solution:**
1. Verify AuditLog model exists in database
2. Check application logs for errors
3. Test logging manually:
   ```typescript
   import { logAdminAction } from '@/lib/admin'
   await logAdminAction(userId, 'test', 'test', null)
   ```

### Issue: User Search Not Working

**Symptoms:** Search returns no results or errors

**Solution:**
1. Check database indices on User table
2. Verify search parameter is being passed correctly
3. Check API logs for query errors
4. Test API directly: `curl https://your-domain.com/api/admin/users?search=test`

---

## 📊 Monitoring

### Application Monitoring

**Recommended Tools:**
- Vercel Analytics (if deployed to Vercel)
- Sentry for error tracking
- LogRocket for session replay
- New Relic or DataDog for APM

### Database Monitoring

**Key Metrics to Track:**
- Query performance (slow queries)
- Connection pool usage
- Database size growth
- Audit log table size

**Recommended:**
- Enable PostgreSQL slow query log
- Set up query performance monitoring
- Regular database backups

### Admin Activity Monitoring

**Track:**
- Admin login frequency
- Most common admin actions
- Failed admin access attempts
- Audit log volume

**Query Examples:**
```sql
-- Most active admins
SELECT "userId", COUNT(*) as action_count
FROM "AuditLog"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY "userId"
ORDER BY action_count DESC;

-- Most common admin actions
SELECT "eventType", COUNT(*) as count
FROM "AuditLog"
GROUP BY "eventType"
ORDER BY count DESC;
```

---

## 🔐 Security Best Practices

### Admin Account Security

1. **Use strong passwords** for all admin accounts
2. **Enable 2FA** (when implemented in Phase 5)
3. **Limit admin accounts** to only necessary personnel
4. **Regularly audit** admin actions via audit logs
5. **Review and remove** inactive admin accounts

### API Security

1. **All admin endpoints** require authentication
2. **Role verification** on every admin API call
3. **Audit logging** for all sensitive actions
4. **Rate limiting** recommended (add in future)

### Database Security

1. **Use connection pooling** to prevent exhaustion
2. **Enable SSL** for database connections
3. **Regular backups** with point-in-time recovery
4. **Restrict database access** to application only

---

## 📈 Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check system status page
- Review failed admin actions

**Weekly:**
- Review audit logs for suspicious activity
- Check database performance
- Verify backup integrity

**Monthly:**
- Review and archive old audit logs
- Update dependencies
- Performance optimization review
- Security audit

### Database Maintenance

```sql
-- Clean up old audit logs (keep 90 days)
DELETE FROM "AuditLog" 
WHERE "createdAt" < NOW() - INTERVAL '90 days';

-- Vacuum and analyze
VACUUM ANALYZE "AuditLog";
VACUUM ANALYZE "User";
VACUUM ANALYZE "ToolRun";
```

---

## 📞 Support

### Getting Help

- **Documentation:** See `notes/admin-dashboard-doc.md`
- **Issues:** Check GitHub issues for known problems
- **Community:** Join Discord/Slack for community support

### Rollback Procedure

If issues arise after deployment:

1. **Vercel:** Use deployment history to rollback
   ```bash
   vercel rollback
   ```

2. **Traditional Server:**
   ```bash
   # Stop application
   pm2 stop frith-ai
   
   # Restore previous version
   git checkout <previous-commit>
   npm install
   npm run build
   
   # Restart
   pm2 start frith-ai
   ```

3. **Database:** Restore from last known good backup
   ```bash
   pg_restore -d $DATABASE_URL backup.dump
   ```

---

## ✅ Deployment Checklist

Before marking deployment complete:

- [ ] Application builds successfully
- [ ] All tests pass
- [ ] Environment variables set in production
- [ ] Admin user created and verified
- [ ] Admin dashboard accessible
- [ ] All admin features tested
- [ ] Audit logging verified working
- [ ] Security checks passed
- [ ] Performance acceptable
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Rollback procedure tested
- [ ] Team trained on admin features

---

**Deployment Guide Version:** 1.0.0  
**Last Updated:** December 9, 2025  
**Phase:** 4 - Admin Dashboard  
**Status:** ✅ Ready for Production
