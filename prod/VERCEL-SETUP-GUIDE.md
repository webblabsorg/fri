# Vercel Deployment Setup Guide

**Project:** Frith AI - Legal AI Platform  
**Repository:** https://github.com/webblabsorg/fri.git  
**Date:** December 9, 2025

---

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Create Vercel Account

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub account
4. Complete account setup

---

### Step 2: Import Project

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Find `webblabsorg/fri` in the list
4. Click "Import"

---

### Step 3: Configure Project

**Framework Preset:** Next.js (auto-detected) ✓

**Root Directory:** `dev`  
⚠️ IMPORTANT: Change this from `.` to `dev`

**Build Command:** `npm run build` (auto-detected) ✓

**Output Directory:** `.next` (auto-detected) ✓

**Install Command:** `npm install` (auto-detected) ✓

---

### Step 4: Environment Variables

Click "Environment Variables" and add these:

#### Required Variables (Copy from .env.local)

```env
DATABASE_URL
(Copy the full PostgreSQL connection string from your .env file)

NEXTAUTH_URL
https://your-project-name.vercel.app
(Vercel will show you this URL - update it after first deployment)

NEXTAUTH_SECRET
(Copy from .env file - the long random string)
```

#### Placeholder Variables (Add real keys when ready)

```env
ANTHROPIC_API_KEY=sk-ant-placeholder
GOOGLE_AI_API_KEY=AIza-placeholder
RESEND_API_KEY=re_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
```

**Environment:** Select "Production, Preview, and Development" for all

---

### Step 5: Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://fri-[random].vercel.app`

---

### Step 6: Run Database Migrations

After first deployment, run migrations on production database:

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
cd C:\Users\Plange\Downloads\Projects\frith\dev
vercel link

# Run migrations
vercel env pull .env.production
npx prisma migrate deploy
npx prisma db seed
```

**Option B: Using Local with Production DB**

```bash
# Temporarily use production DATABASE_URL
# Run migrations
npx prisma migrate deploy --schema=./prisma/schema.prisma
npx prisma db seed
```

---

### Step 7: Update Environment Variable

1. Go back to Vercel dashboard
2. Go to Settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual Vercel URL:
   ```
   https://fri-[your-project].vercel.app
   ```
4. Redeploy (Deployments → ··· → Redeploy)

---

## 🌐 Custom Domain Setup (Optional)

### Step 1: Add Domain

1. Go to Settings → Domains
2. Add domain: `frithai.com`
3. Add domain: `www.frithai.com`

### Step 2: Configure DNS

**If using Vercel Nameservers (Recommended):**
1. Copy nameservers from Vercel
2. Update at your domain registrar
3. Wait 24-48 hours for propagation

**If using External DNS:**

Add these records at your domain registrar:

```
Type    Name    Value
A       @       76.76.19.61
CNAME   www     cname.vercel-dns.com
```

### Step 3: Update Environment Variables

Update `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to use your custom domain:

```env
NEXTAUTH_URL=https://frithai.com
NEXT_PUBLIC_SITE_URL=https://frithai.com
```

Redeploy after updating.

---

## 🔀 Branch Deployments

### Production (main branch)
- URL: https://frithai.com (or your Vercel URL)
- Auto-deploys on push to `main`
- Uses Production environment variables

### Preview (dev branch)
- URL: https://fri-git-dev-[project].vercel.app
- Auto-deploys on push to `dev`
- Uses Preview environment variables

### PR Previews
- Auto-deploys for each pull request
- Unique URL per PR
- Automatic cleanup when PR is closed

---

## 🔐 Security Checklist

Before going live:

- [ ] Generate strong NEXTAUTH_SECRET (32+ characters)
- [ ] Use production DATABASE_URL (not pooler URL if possible)
- [ ] Set up real email service (Resend API key)
- [ ] Configure Stripe with live keys (after testing)
- [ ] Enable Vercel's security headers
- [ ] Set up error tracking (Sentry)
- [ ] Configure rate limiting
- [ ] Review all environment variables

---

## 📊 Post-Deployment

### Verify Deployment

1. Visit your Vercel URL
2. Test signup flow
3. Check email verification (console logs won't work in production)
4. Test signin
5. Browse tool catalog
6. Check dashboard

### Configure Email (Resend)

1. Go to https://resend.com/signup
2. Create account
3. Add domain: frithai.com
4. Verify domain (add DNS records)
5. Get API key
6. Add to Vercel environment variables:
   ```
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=noreply@frithai.com
   ```
7. Redeploy

### Monitor Application

1. Go to Vercel Dashboard
2. Check "Analytics" tab
3. Check "Logs" for errors
4. Set up alerts for downtime

---

## 🔧 Troubleshooting

### Build Fails

**Error:** "Cannot find module 'xyz'"
- Check package.json has all dependencies
- Try: `npm install` locally and push

**Error:** "Prisma Client not generated"
- Add to package.json scripts:
  ```json
  "postinstall": "prisma generate"
  ```

### Database Connection Fails

**Error:** "Can't reach database"
- Check DATABASE_URL is correct
- Use pooler URL for Vercel: `...-pooler.c-3.us-east-1.aws.neon.tech`
- Check Neon allows connections from 0.0.0.0/0

### Authentication Issues

**Error:** "NextAuth URL mismatch"
- Ensure NEXTAUTH_URL matches your actual Vercel URL
- Redeploy after changing environment variables

### Environment Variables Not Working

**Error:** "undefined" in production
- Variables must be set in Vercel dashboard
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Redeploy after adding/changing variables

---

## 📱 Mobile & Performance

### Enable Vercel Analytics

1. Go to Analytics tab
2. Enable Web Analytics (free)
3. Enable Speed Insights (free)
4. View real-time performance data

### Optimize Images

Images are automatically optimized by Vercel.

### Enable Caching

Add to `next.config.ts`:

```typescript
export default {
  images: {
    domains: ['frithai.com'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60' },
        ],
      },
    ]
  },
}
```

---

## 🎯 Recommended Settings

### Vercel Project Settings

**General:**
- Build & Development Settings → Root Directory: `dev`
- Node.js Version: 20.x (recommended)

**Git:**
- Production Branch: `main`
- Preview Branch: `dev` and all branches

**Environment Variables:**
- Production: Use live API keys
- Preview: Use test API keys
- Development: Use local test keys

---

## 💰 Vercel Pricing

**Hobby Plan (Free):**
- ✓ Unlimited deployments
- ✓ 100GB bandwidth/month
- ✓ SSL certificates
- ✓ Custom domains (1)
- ✓ Analytics

**Pro Plan ($20/month):**
- ✓ 1TB bandwidth/month
- ✓ Advanced analytics
- ✓ Password protection
- ✓ Custom domains (unlimited)
- ✓ Team collaboration

**Upgrade when:** 
- You exceed 100GB bandwidth
- You need team features
- You want advanced analytics

---

## 🔄 CI/CD Workflow

Your automatic deployment workflow:

```
Developer → Git Push → GitHub → Vercel → Deployed
                                    ↓
                              Build & Test
                                    ↓
                              Generate Prisma
                                    ↓
                              Build Next.js
                                    ↓
                              Deploy to Edge
```

**Automatic on every push to:**
- `main` → Production deployment
- `dev` → Preview deployment
- `feature/*` → Preview deployment
- Pull requests → PR preview

---

## 📝 Post-Setup Checklist

- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Root directory set to `dev`
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] First deployment successful
- [ ] Application accessible via Vercel URL
- [ ] Authentication tested on production
- [ ] Tool catalog loads correctly
- [ ] (Optional) Custom domain configured
- [ ] (Optional) Email service configured (Resend)
- [ ] Analytics enabled
- [ ] Error monitoring set up

---

## 🆘 Support

**Vercel Support:**
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support
- Community: https://github.com/vercel/vercel/discussions

**Project Issues:**
- GitHub: https://github.com/webblabsorg/fri/issues
- Docs: Check `/prod/` folder

---

## 🎉 Success!

Once deployed, your application will be available at:
- **Production:** https://your-project.vercel.app
- **Preview (dev):** https://fri-git-dev-project.vercel.app

**Automatic deployments on every push!** 🚀

---

**Setup Time:** ~5-10 minutes  
**Status:** Ready for deployment  
**Next:** Test production deployment, then continue with Sprint 1.3

© 2025 Frith AI. All rights reserved.
