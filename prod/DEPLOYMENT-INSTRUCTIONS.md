# Frith AI - Deployment Instructions

**Project:** Frith AI - Legal AI Platform  
**Repository:** https://github.com/webblabsorg/fri.git  
**Status:** Phase 1 Sprint 1.1-1.2 Complete  
**Last Updated:** December 9, 2025

---

## Current Status

### ✅ Completed
- Phase 0: Foundation & Setup (complete)
- Phase 1 Sprint 1.1: Authentication system (complete)
- Phase 1 Sprint 1.2: Dashboard shell, password reset, tool catalog, settings (complete)

### 🟡 Pending
- Dependencies installation
- Database migrations
- Database seeding
- Sprint 1.3: AI integration
- Sprint 1.4: Payment integration

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+ installed
- Git installed
- Neon PostgreSQL account (database already configured)

### Step 1: Clone and Install

```bash
# Clone the repository
cd C:\Users\plange\Downloads\projects\frith\dev

# Install dependencies
npm install

# Or if peer dependency issues:
npm install --legacy-peer-deps
```

### Step 2: Environment Variables

The `.env.local` file is already configured with:
- ✅ Neon database connection
- ✅ NextAuth secret
- 🟡 API keys (placeholders - need real keys for production)

File location: `dev/.env.local`

### Step 3: Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database (26 categories + 5 sample tools + test user)
npm run db:seed
```

### Step 4: Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

### Step 5: Test Authentication

1. **Sign Up**
   - Go to http://localhost:3000/signup
   - Fill in the form
   - Check console for verification link

2. **Email Verification**
   - Copy the verification URL from console
   - Paste in browser
   - Should redirect to dashboard

3. **Sign In**
   - Go to http://localhost:3000/signin
   - Use credentials from signup
   - Should redirect to dashboard

4. **Test Other Features**
   - Password reset: http://localhost:3000/request-reset
   - Tool catalog: http://localhost:3000/dashboard/tools
   - Settings: http://localhost:3000/dashboard/settings

---

## Available Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript checking
npm run format           # Format with Prettier

# Database
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test data
npm run db:studio        # Open Prisma Studio GUI
npm run db:push          # Push schema (dev only)

# Testing
npm run test             # Run tests (when implemented)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

---

## Database Schema

### Tables Created (20+)
- **Auth:** User, Session, EmailVerification, PasswordReset
- **Multi-Tenant:** Organization, OrganizationMember, Workspace, WorkspaceMember
- **Tools:** Category (26), Tool (5 samples), ToolRun, Favorite
- **Projects:** Project
- **Support:** SupportTicket, TicketMessage
- **Chatbot:** ChatbotConversation, ChatbotMessage
- **Billing:** Transaction, Refund
- **Audit:** AuditLog

### Test Data (After Seeding)
- 26 tool categories
- 5 sample tools
- 1 test organization: "Test Law Firm"
- 1 test user: admin@testlawfirm.com / Test123!@#
- 1 test workspace: "My Workspace"

---

## Features Implemented

### Authentication (Sprint 1.1)
- ✅ User registration with email/password
- ✅ Email verification flow
- ✅ Sign in with session cookies
- ✅ Password reset flow (complete)
- ✅ Account lockout (5 failed attempts)
- ✅ Sign out functionality
- ✅ Session management

### User Interface (Sprint 1.2)
- ✅ Dashboard home page
- ✅ Tool catalog with search and filters
- ✅ User settings (profile, security, preferences)
- ✅ Password reset pages (request, form, confirmation)
- ✅ Responsive design (mobile-first)

### API Endpoints
- ✅ POST /api/auth/signup
- ✅ POST /api/auth/signin
- ✅ POST /api/auth/signout
- ✅ POST /api/auth/verify-email
- ✅ PUT /api/auth/verify-email (resend)
- ✅ POST /api/auth/request-reset
- ✅ POST /api/auth/reset-password
- ✅ GET /api/auth/session
- ✅ GET /api/tools (with filters)
- ✅ GET /api/categories
- ✅ GET /api/health

---

## Troubleshooting

### Issue: Prisma not recognized

**Solution:**
```bash
# Option 1: Install dependencies
npm install

# Option 2: Use npx
npx prisma generate
npx prisma migrate dev
```

### Issue: Database connection error

**Solution:**
- Check `.env.local` has correct DATABASE_URL
- Verify Neon database is active
- Test connection:
  ```bash
  npx prisma studio
  ```

### Issue: Port 3000 already in use

**Solution (Windows):**
```powershell
# Find process on port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Issue: Module not found errors

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## Production Deployment

### Vercel Deployment

1. **Connect Repository**
   - Go to https://vercel.com
   - Import Git Repository
   - Select `webblabsorg/fri`
   - Root directory: `dev/`

2. **Configure Environment Variables**
   Add all variables from `.env.example`:
   - DATABASE_URL
   - NEXTAUTH_SECRET
   - NEXTAUTH_URL
   - ANTHROPIC_API_KEY (when ready)
   - GOOGLE_AI_API_KEY (when ready)
   - RESEND_API_KEY (for production emails)
   - STRIPE keys (when ready)

3. **Deploy**
   - Production: `main` branch → frithai.com
   - Staging: `dev` branch → dev preview

4. **Run Migrations**
   ```bash
   # Via Vercel CLI
   vercel env pull .env.local
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Database Backup

Neon automatically backs up your database:
- Daily backups (7-day retention)
- Point-in-time recovery available
- Manual backups recommended before major changes

---

## Security Checklist

Before production:
- [ ] Change all placeholder API keys
- [ ] Generate new NEXTAUTH_SECRET
- [ ] Configure Resend for real emails
- [ ] Set up Stripe webhooks
- [ ] Enable HTTPS (Vercel auto)
- [ ] Configure CORS properly
- [ ] Set up error monitoring (Sentry)
- [ ] Review environment variables
- [ ] Test all auth flows
- [ ] Enable rate limiting

---

## Next Steps

### Sprint 1.3: AI Integration (Pending)
- [ ] Install Anthropic SDK
- [ ] Install Google AI SDK
- [ ] Create AI model service
- [ ] Implement tool execution engine
- [ ] Build first working tool
- [ ] Add cost tracking

### Sprint 1.4: Payment Integration (Pending)
- [ ] Set up Stripe account
- [ ] Create Stripe products
- [ ] Implement checkout flow
- [ ] Build billing dashboard
- [ ] Add subscription management
- [ ] Implement webhooks

---

## Support

- **Documentation:** `/notes/` folder
- **Issues:** https://github.com/webblabsorg/fri/issues
- **Roadmap:** `/notes/development-phases-roadmap.md`

---

## Important Files

```
dev/
├── .env.local                   # Environment variables ✅
├── package.json                 # Dependencies ✅
├── prisma/
│   ├── schema.prisma           # Database schema ✅
│   └── seed.ts                 # Seed data ✅
├── app/
│   ├── (auth)/                 # Auth pages ✅
│   ├── api/                    # API routes ✅
│   └── dashboard/              # Dashboard pages ✅
├── components/ui/              # UI components ✅
└── lib/                        # Utilities ✅
```

---

**Status:** Ready for local testing  
**Dependencies:** Need to run `npm install`  
**Database:** Need to run migrations + seed  
**Production:** Ready for Vercel deployment (after testing)

---

© 2025 Frith AI. All rights reserved.
