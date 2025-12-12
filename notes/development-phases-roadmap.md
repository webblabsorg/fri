# Frith AI - Complete Development Phases Roadmap 
**From 0% to 100%: Comprehensive Development Plan**  
**Version:** 1.0  
**Last Updated:** December 9, 2025  
**Estimated Total Timeline:** 6-9 months to MVP Launch, 12-18 months to Full Platform

---

## Document Overview

This document provides a complete, sequential development roadmap for building Frith AI from the ground up. It integrates all technical specifications from the 7 documentation files and breaks down development into actionable phases, sprints, and tasks.

### How to Use This Document

**For Project Managers:**
- Use phases as milestones for project tracking
- Assign sprints to teams
- Monitor deliverables against acceptance criteria

**For Developers:**
- Follow sequential order (dependencies are critical)
- Reference linked docs for detailed specs
- Check acceptance criteria before marking tasks complete

**For Stakeholders:**
- Understand what gets built when
- Track progress through phases
- Plan marketing/sales activities around launch dates

---

## High-Level Timeline

```
Phase 0: Foundation & Setup (Weeks 1-2)
  ├─ Development environment
  ├─ Tech stack setup
  └─ Team onboarding

Phase 1: Core Infrastructure (Weeks 3-6)
  ├─ Database schema
  ├─ Authentication system
  ├─ API foundation
  └─ Basic UI framework

Phase 2: Marketing Site (Weeks 7-10)
  ├─ Landing page
  ├─ Inner pages
  ├─ SEO optimization
  └─ Payment integration

Phase 3: User Dashboard MVP (Weeks 11-16)
  ├─ Tool catalog system
  ├─ Tool execution engine
  ├─ User onboarding
  └─ 20 core AI tools

Phase 4: Admin Dashboard (Weeks 17-20)
  ├─ User management
  ├─ Analytics
  ├─ Support tickets
  └─ System monitoring

Phase 5: Support System (Weeks 21-24)
  ├─ Help center
  ├─ Ticketing system
  ├─ Knowledge base
  └─ System status page

Phase 6: AI Chatbot (Weeks 25-28)
  ├─ Chat widget
  ├─ Lead capture
  ├─ Support automation
  └─ CRM integration

Phase 7: Advanced Features (Weeks 29-32)
  ├─ Workspaces & projects
  ├─ Team collaboration
  ├─ Integrations (Word, Clio)
  └─ Advanced AI features

Phase 8: Testing & QA (Weeks 33-36)
  ├─ Full platform testing
  ├─ Security audit
  ├─ Performance optimization
  └─ Bug fixes

Phase 9: Beta Launch (Week 37)
  ├─ Soft launch to 100 users
  ├─ Feedback collection
  └─ Iteration

Phase 10: Public Launch (Week 38-40)
  ├─ Marketing campaign
  ├─ Full platform release
  └─ Post-launch support

Phase 11: Scale & Enhance (Months 10-18)
  ├─ Remaining 220 AI tools
  ├─ Enterprise features
  ├─ Mobile apps
  └─ Advanced integrations
```

---

## Team Structure & Roles

### Recommended Team (MVP)

**Core Team (6-8 people):**
1. **Tech Lead / Full-Stack Engineer** (1)
2. **Frontend Engineers** (2) - React/Next.js experts
3. **Backend Engineers** (2) - Node.js, PostgreSQL, API design
4. **UI/UX Designer** (1) - All UI design, prototypes
5. **QA Engineer** (1) - Testing, quality assurance
6. **Product Manager** (1) - Coordination, priorities

**Extended Team (as needed):**
- **DevOps Engineer** (0.5 FTE) - CI/CD, infrastructure
- **AI/ML Engineer** (0.5 FTE) - AI integration, prompt engineering
- **Content Writer** (0.5 FTE) - Help articles, legal content
- **Marketing Manager** (0.5 FTE) - Pre-launch marketing

---

## Technology Stack Summary

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Components:** Shadcn UI
- **State:** React Context / Zustand
- **Forms:** React Hook Form + Zod validation

### Backend
- **Runtime:** Node.js 20+
- **API:** Next.js API Routes (serverless)
- **Database:** Neon PostgreSQL (serverless)
- **ORM:** Prisma or Drizzle ORM
- **Authentication:** NextAuth.js or Clerk
- **WebSocket:** Socket.io (for chat)

### AI Integration
- **Primary:** Anthropic Claude API (Haiku, Sonnet, Opus)
- **Free Tier:** Google Gemini API
- **Vector DB:** Pinecone or pgvector (Neon extension)

### Infrastructure
- **Hosting:** Vercel (frontend + API)
- **Backend Services:** Render or Railway (if needed)
- **Database:** Neon (PostgreSQL)
- **File Storage:** Vercel Blob or AWS S3
- **Email:** Resend
- **Payments:** Stripe + PayPal

### Third-Party Services
- **Analytics:** Vercel Analytics, Google Analytics 4
- **Error Tracking:** Sentry
- **Monitoring:** Vercel Monitoring, BetterStack
- **CRM:** HubSpot (for chatbot leads)

### Version Control
- **Repository:** https://github.com/webblabsorg/fri.git
- **Organization:** webblabsorg
- **Branching Strategy:** 
  - `main` - Production-ready code
  - `dev` - Development/staging branch
  - Feature branches: `feature/[feature-name]`
  - Bugfix branches: `bugfix/[bug-name]`

---

# PHASE 0: Foundation & Setup
**Timeline:** Weeks 1-2 (10 business days)  
**Team:** All  
**Goal:** Establish development environment and project foundation

---

## Sprint 0.1: Project Initialization (Days 1-3)

### Tasks

**Day 1: Repository & Project Setup**

**GitHub Repository:**
- Organization: `webblabsorg`
- Repository: `fri`
- URL: https://github.com/webblabsorg/fri.git

**Tasks:**
- [ ] Initialize Git repository:
  ```bash
  echo "# Frith AI - Legal AI Platform" >> README.md
  git init
  git add README.md
  git commit -m "first commit"
  git branch -M main
  git remote add origin https://github.com/webblabsorg/fri.git
  git push -u origin main
  ```
- [ ] Create development branch: `git checkout -b dev`
- [ ] Initialize Next.js project with TypeScript:
  ```bash
  npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
  ```
- [ ] Configure ESLint, Prettier
- [ ] Set up commit hooks (Husky + lint-staged)
- [ ] Update `README.md` with:
  - Project description
  - Tech stack
  - Setup instructions
  - Development workflow
- [ ] Create `.gitignore` (Next.js standard + environment variables)
- [ ] Set up branch protection rules on GitHub:
  - Require pull request reviews for `main`
  - Require status checks to pass
  - No direct pushes to `main`

**Deliverable:** Working Next.js app with "Hello World" pushed to GitHub

---

**Day 2: Design System Setup**
- [ ] Install Tailwind CSS
- [ ] Configure Tailwind theme (brand colors, fonts)
- [ ] Install Shadcn UI
- [ ] Initialize Shadcn components:
  - Button, Card, Input, Label, Form
  - Dialog, Sheet, Dropdown
  - Table, Badge, Avatar
- [ ] Create design tokens file (`lib/design-tokens.ts`)
- [ ] Set up Storybook (optional, for component docs)

**Deliverable:** Design system ready to use

---

**Day 3: Environment & CI/CD**

**Vercel Setup:**
- [ ] Create Vercel account (or use existing)
- [ ] Link GitHub repository to Vercel:
  - Repository: `webblabsorg/fri`
  - Framework: Next.js (auto-detected)
  - Root directory: `./`
- [ ] Configure environment variables:
  - `NEXT_PUBLIC_SITE_URL` (e.g., https://frithai.com)
  - `DATABASE_URL` (placeholder, update in Day 4)
  - `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
- [ ] Set up automatic deployments:
  - `main` branch → Production (frithai.com)
  - `dev` branch → Staging (dev.frithai.com or Vercel preview URL)
- [ ] Configure preview deployments (per PR)
- [ ] Set up domain:
  - Add custom domain: frithai.com
  - Configure DNS (Vercel provides instructions)
  - Enable automatic SSL (Let's Encrypt)
- [ ] Test deployment with sample page

**GitHub Actions (Optional):**
- [ ] Create `.github/workflows/ci.yml` for automated testing on PR
- [ ] Run linting, type checking, unit tests before merge

**Deliverable:** Auto-deploy pipeline working, site accessible at frithai.com

---

## Sprint 0.2: Database & Backend Setup (Days 4-7)

**Day 4: Database Setup**
- [ ] Create Neon account
- [ ] Create production database
- [ ] Create staging database
- [ ] Install Prisma: `npm install prisma @prisma/client`
- [ ] Initialize Prisma: `npx prisma init`
- [ ] Configure `schema.prisma` with initial User model
- [ ] Run first migration: `npx prisma migrate dev`
- [ ] Generate Prisma Client
- [ ] Test database connection

**Deliverable:** Database connected and accessible

---

**Day 5-6: Multi-Tenant Data Model Design**

Reference: `admin-dashboard-doc.md`, `user-dashboard-complete.md` Section 7

**Design Multi-Tenant Schema:**

Multi-tenancy is critical for law firms and teams. Design the core entities:

- [ ] **Organization Model** (the tenant):
  - `id`, `name`, `type` (law_firm, corporate, solo)
  - `plan_tier`, `seats_total`, `seats_used`
  - `stripe_subscription_id`, `billing_email`
  - `status`, `created_at`
  
- [ ] **OrganizationMember Model** (join table):
  - `id`, `organization_id`, `user_id`
  - `role` (owner, admin, member, viewer)
  - `invited_by`, `invited_at`, `joined_at`
  - `status` (pending, active, suspended)

- [ ] **Workspace Model** (sub-organization units):
  - `id`, `organization_id`, `name`, `type` (personal, team)
  - `owner_id`, `status`

- [ ] **WorkspaceMember Model** (join table):
  - `id`, `workspace_id`, `user_id`
  - `role` (admin, member, viewer)
  - `permissions` (JSONB for granular control)

**Data Model Decisions:**
- [ ] Document: Can a user belong to multiple organizations? (Yes, for consultants)
- [ ] Document: Billing tied to Organization, not User
- [ ] Document: Projects belong to Workspaces (which belong to Organizations)
- [ ] Document: Tool runs can be personal or workspace-scoped

**Migration Strategy:**
- [ ] Phase 1 MVP: Single-user + simple org (1 user = 1 org)
- [ ] Phase 7: Full multi-tenant with invitations, roles, permissions

**Deliverable:** Multi-tenant schema design document

---

**Day 7: Core Database Schema Implementation**

Reference: All documentation files (database schemas)

**Tables to Create (Initial Set):**

Reference: Detailed schemas in `auth-pages-doc.md`, `user-dashboard-complete.md`, `admin-dashboard-doc.md`

```prisma
// schema.prisma

model Organization {
  id                 String    @id @default(uuid())
  name               String
  type               String?   // law_firm, corporate, solo
  planTier           String    @default("free")
  subscriptionStatus String    @default("active")
  seatsTotal         Int       @default(1)
  seatsUsed          Int       @default(0)
  stripeSubscriptionId String?  @unique
  billingEmail       String?
  status             String    @default("active")
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // Relations
  members            OrganizationMember[]
  workspaces         Workspace[]
  projects           Project[]
}

model OrganizationMember {
  id             String    @id @default(uuid())
  organizationId String
  userId         String
  role           String    @default("member") // owner, admin, member, viewer
  invitedBy      String?
  invitedAt      DateTime?
  joinedAt       DateTime?
  status         String    @default("active")
  createdAt      DateTime  @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
}

model User {
  id                 String    @id @default(uuid())
  name               String
  email              String    @unique
  emailVerified      Boolean   @default(false)
  passwordHash       String
  firmName           String?
  role               String    @default("user")
  subscriptionTier   String    @default("free")
  subscriptionStatus String    @default("active")
  stripeCustomerId   String?   @unique
  twoFactorEnabled   Boolean   @default(false)
  twoFactorSecret    String?
  status             String    @default("pending_verification")
  marketingOptIn     Boolean   @default(false)
  failedLoginAttempts Int      @default(0)
  lockedUntil        DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  lastLoginAt        DateTime?

  // Relations
  sessions           Session[]
  toolRuns           ToolRun[]
  projects           Project[]
  tickets            SupportTicket[]
  auditLogs          AuditLog[]
  organizationMembers OrganizationMember[]
  workspaceMembers   WorkspaceMember[]
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  sessionToken String   @unique
  ipAddress    String?
  userAgent    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model EmailVerification {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}

model PasswordReset {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Tool {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String
  categoryId  String
  inputType   String
  outputType  String
  pricingTier String
  aiModel     String   @default("claude-sonnet-4.5")
  popular     Boolean  @default(false)
  status      String   @default("active")
  promptTemplate String @db.Text
  createdAt   DateTime @default(now())

  // Relations
  runs     ToolRun[]
  category Category @relation(fields: [categoryId], references: [id])
}

model Category {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  icon        String?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  tools Tool[]
}

model ToolRun {
  id          String   @id @default(uuid())
  userId      String
  toolId      String
  projectId   String?
  inputText   String   @db.Text
  outputText  String?  @db.Text
  status      String   @default("pending")
  aiModelUsed String
  tokensUsed  Int?
  cost        Float?
  runTimeMs   Int?
  createdAt   DateTime @default(now())

  user    User     @relation(fields: [userId], references: [id])
  tool    Tool     @relation(fields: [toolId], references: [id])
  project Project? @relation(fields: [projectId], references: [id])
}

model Workspace {
  id             String   @id @default(uuid())
  organizationId String?
  name           String
  type           String   @default("personal") // personal, team
  ownerId        String
  status         String   @default("active")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organization Organization?       @relation(fields: [organizationId], references: [id])
  members      WorkspaceMember[]
  projects     Project[]
}

model WorkspaceMember {
  id          String   @id @default(uuid())
  workspaceId String
  userId      String
  role        String   @default("member") // admin, member, viewer
  permissions Json?    // Granular permissions
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
}

model Project {
  id          String   @id @default(uuid())
  workspaceId String?
  name        String
  description String?
  status      String   @default("active")
  privacy     String   @default("private")
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace Workspace? @relation(fields: [workspaceId], references: [id])
  creator   User       @relation(fields: [createdBy], references: [id])
  runs      ToolRun[]
}

model SupportTicket {
  id           String   @id @default(uuid())
  ticketNumber String   @unique
  userId       String
  subject      String
  category     String
  priority     String   @default("medium")
  status       String   @default("open")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  resolvedAt   DateTime?

  user     User            @relation(fields: [userId], references: [id])
  messages TicketMessage[]
}

model TicketMessage {
  id         String   @id @default(uuid())
  ticketId   String
  senderId   String
  senderType String
  message    String   @db.Text
  createdAt  DateTime @default(now())

  ticket SupportTicket @relation(fields: [ticketId], references: [id])
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  eventType  String
  eventData  Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])
}

// ... More models (Workspaces, Templates, ChatbotConversations, etc.)
```

**Tasks:**
- [ ] Create all models in `schema.prisma` (including multi-tenant models above)
- [ ] Run migration: `npx prisma migrate dev --name init`
- [ ] Generate Prisma Client
- [ ] Create seed data script (`prisma/seed.ts`)
- [ ] Seed database with:
  - 26 tool categories (from `ai-agents.md`)
  - 20 initial tools (to be defined in Phase 3 Sprint 3.1)
  - 1 test user + 1 test organization
- [ ] Document database schema (generate ERD diagram)
- [ ] Document multi-tenant data relationships

**Deliverable:** Complete database schema with seed data and multi-tenant foundation

**Note:** Full multi-tenant features (invitations, role management) will be built in Phase 7. Phase 0-6 will use simplified 1-user-per-org model.

---

**Day 7: API Foundation**

**Tasks:**
- [ ] Create API folder structure:
  ```
  app/api/
  ├── auth/
  │   ├── signup/route.ts
  │   ├── signin/route.ts
  │   └── signout/route.ts
  ├── tools/
  │   ├── route.ts
  │   └── [id]/run/route.ts
  ├── user/
  │   └── profile/route.ts
  └── health/route.ts
  ```
- [ ] Create API utilities:
  - `lib/api/response.ts` (standardized responses)
  - `lib/api/middleware.ts` (auth, rate limiting)
  - `lib/api/errors.ts` (error handling)
- [ ] Create health check endpoint: `/api/health`
- [ ] Test API structure with sample endpoints

**Deliverable:** API structure ready for implementation

---

## Sprint 0.3: Authentication Foundation (Days 8-10)

**Day 8: NextAuth.js Setup**

Reference: `auth-pages-doc.md`

**Tasks:**
- [ ] Install NextAuth.js: `npm install next-auth`
- [ ] Create `app/api/auth/[...nextauth]/route.ts`
- [ ] Configure providers:
  - Credentials provider (email/password)
  - Google OAuth (optional, Phase 2)
- [ ] Configure session strategy (JWT)
- [ ] Set up callbacks (jwt, session)
- [ ] Create auth utilities (`lib/auth.ts`):
  - `getServerSession()`
  - `requireAuth()`
  - `hashPassword()`
  - `verifyPassword()`
- [ ] Test authentication flow

**Deliverable:** Working authentication system

---

**Day 9: Password Utilities**

**Tasks:**
- [ ] Install bcrypt: `npm install bcrypt @types/bcrypt`
- [ ] Create password utilities:
  - `hashPassword(password)` - bcrypt with 12 rounds
  - `verifyPassword(password, hash)` - compare
  - `validatePasswordStrength(password)` - check requirements
- [ ] Create email utilities (`lib/email.ts`):
  - Set up Resend API
  - Create email templates
  - `sendVerificationEmail()`
  - `sendPasswordResetEmail()`
- [ ] Test password hashing and email sending

**Deliverable:** Password and email utilities ready

---

**Day 10: Initial Testing & Documentation**

**Tasks:**
- [ ] Write unit tests for utilities (Jest)
- [ ] Test database queries
- [ ] Test API health check
- [ ] Document setup process in README
- [ ] Create `.env.example` file with all variables
- [ ] Team review and feedback session

**Deliverable:** Phase 0 complete, team ready to build

---

## Phase 0 Acceptance Criteria

- ✅ GitHub repository initialized at https://github.com/webblabsorg/fri.git
- ✅ Branch protection rules configured for `main` and `dev` branches
- ✅ Next.js app deployed to Vercel
- ✅ Database connected and migrated
- ✅ Multi-tenant data model designed and documented
- ✅ Organization, OrganizationMember, Workspace models created
- ✅ Seed data populated (categories, test org, test user)
- ✅ Design system configured
- ✅ API structure created
- ✅ Authentication foundation ready
- ✅ All environment variables configured
- ✅ CI/CD pipeline working (GitHub → Vercel auto-deploy)
- ✅ Team trained and aligned on Git workflow

---

# PHASE 1: Core Infrastructure
**Timeline:** Weeks 3-6 (4 weeks)  
**Team:** Full team  
**Goal:** Build authentication system and basic UI framework

---

## Sprint 1.1: Authentication Pages (Week 3)

Reference: `auth-pages-doc.md`

### Day 1-2: Sign Up Page

**Frontend (`app/auth/signup/page.tsx`):**
- [ ] Create split-screen layout component
- [ ] Left side: Branding + testimonials
- [ ] Right side: Sign-up form
- [ ] Form fields (using React Hook Form + Zod):
  - Full Name (required, min 2 chars)
  - Email (required, valid email)
  - Password (required, strength validator)
  - Confirm Password (must match)
  - Firm Name (optional)
  - Role (optional dropdown)
  - Terms checkbox (required)
  - Marketing opt-in (optional)
- [ ] Real-time validation (show errors on blur)
- [ ] Password strength meter component
- [ ] Submit button with loading state
- [ ] "Already have account?" link

**Backend (`app/api/auth/signup/route.ts`):**
- [ ] Validate input (Zod schema)
- [ ] Check if email exists
- [ ] Hash password (bcrypt, 12 rounds)
- [ ] Create user in database
- [ ] Generate verification token (JWT, 24h expiry)
- [ ] Send verification email (Resend)
- [ ] Return success response
- [ ] Handle errors (duplicate email, weak password)

**Email Template (Resend):**
- [ ] Create verification email HTML template
- [ ] Include verification link with token
- [ ] Test email delivery

**Testing:**
- [ ] Unit tests for validation
- [ ] Integration test for signup flow
- [ ] Test duplicate email handling
- [ ] Test email delivery

**Deliverable:** Working sign-up page

---

### Day 3: Email Verification

**Frontend (`app/verify-email/page.tsx`):**
- [ ] "Check your email" page (after signup)
- [ ] Resend verification button (rate limited)
- [ ] Verification success page (`app/verify-email/[token]/page.tsx`)
- [ ] Error handling (expired token)

**Backend (`app/api/auth/verify-email/route.ts`):**
- [ ] Validate token (JWT verification)
- [ ] Check expiration
- [ ] Update user: `emailVerified = true`, `status = 'active'`
- [ ] Create session (auto-login)
- [ ] Return success/error

**Testing:**
- [ ] Test valid token
- [ ] Test expired token
- [ ] Test invalid token
- [ ] Test already verified email

**Deliverable:** Email verification working

---

### Day 4: Sign In Page

**Frontend (`app/auth/signin/page.tsx`):**
- [ ] Split-screen layout (reuse component)
- [ ] Sign-in form:
  - Email (required)
  - Password (required)
  - Remember me (checkbox)
- [ ] "Forgot password?" link
- [ ] Submit button with loading state
- [ ] Error display (invalid credentials)
- [ ] "Don't have account?" link

**Backend (`app/api/auth/signin/route.ts`):**
- [ ] Find user by email
- [ ] Verify password (bcrypt compare)
- [ ] Check email verified
- [ ] Check account not locked
- [ ] Create session (JWT)
- [ ] Log login in audit log
- [ ] Increment failed attempts if wrong password
- [ ] Lock account after 5 failures
- [ ] Return user data + session

**Testing:**
- [ ] Test valid login
- [ ] Test invalid credentials
- [ ] Test unverified email
- [ ] Test account lockout
- [ ] Test remember me

**Deliverable:** Working sign-in page

---

### Day 5: Password Reset

**Pages:**
- [ ] Request reset (`app/auth/reset-password/page.tsx`)
- [ ] Reset link sent (`app/auth/reset-password-sent/page.tsx`)
- [ ] New password form (`app/auth/reset-password/[token]/page.tsx`)
- [ ] Success page

**Backend:**
- [ ] `POST /api/auth/request-reset` - Generate token, send email
- [ ] `POST /api/auth/reset-password` - Validate token, update password

**Testing:**
- [ ] Full password reset flow
- [ ] Expired token handling
- [ ] Security: Always show "email sent" even if email doesn't exist

**Deliverable:** Password reset working

---

## Sprint 1.2: User Dashboard Shell (Week 4)

Reference: `user-dashboard-complete.md`

### Day 1-2: Dashboard Layout

**Components:**
- [ ] Create layout component (`app/dashboard/layout.tsx`)
- [ ] Header component:
  - Logo
  - Global search bar (UI only for now)
  - Notifications bell
  - Quick New button
  - User avatar dropdown
- [ ] Left sidebar component:
  - Navigation items (All Tools, Categories, etc.)
  - Collapsible/expandable
  - Mobile responsive (hamburger menu)
- [ ] Center panel component (children)
- [ ] Protected route HOC (require authentication)

**Routing:**
- [ ] `/dashboard` - Default view (All Tools)
- [ ] `/dashboard/tools` - Tool catalog
- [ ] `/dashboard/tools/[slug]` - Tool detail
- [ ] `/dashboard/history` - Run history
- [ ] `/dashboard/settings` - User settings

**Testing:**
- [ ] Test authentication redirect
- [ ] Test responsive layout
- [ ] Test navigation

**Deliverable:** Dashboard shell ready

---

### Day 3-4: Tool Catalog UI

**Components:**
- [ ] Tool grid component (4-column responsive)
- [ ] Tool card component:
  - Icon, name, description
  - Category badge
  - Usage stats
  - "Run" button
  - Favorite star
  - Three-dot menu
- [ ] Filter sidebar component
- [ ] Sort dropdown
- [ ] Pagination component

**Pages:**
- [ ] All Tools page (`app/dashboard/page.tsx`)
- [ ] Category page (`app/dashboard/categories/[slug]/page.tsx`)

**Backend:**
- [ ] `GET /api/tools` - List tools with filters
- [ ] `GET /api/tools/[id]` - Get tool details
- [ ] `GET /api/categories` - List categories

**Testing:**
- [ ] Test tool listing
- [ ] Test filtering
- [ ] Test pagination
- [ ] Test responsive grid

**Deliverable:** Tool catalog UI functional

---

### Day 5: User Settings Page

**Pages:**
- [ ] Settings layout (`app/dashboard/settings/layout.tsx`)
- [ ] Profile tab
- [ ] Security tab (change password)
- [ ] Preferences tab (notifications)

**Backend:**
- [ ] `GET /api/user/profile` - Get user data
- [ ] `PATCH /api/user/profile` - Update profile
- [ ] `POST /api/user/change-password` - Change password

**Testing:**
- [ ] Test profile update
- [ ] Test password change
- [ ] Test validation

**Deliverable:** User settings working

---

## Sprint 1.3: AI Integration Foundation (Week 5)

Reference: `technical-specifications-ai-models.md`

### Day 1-2: AI Model Service

**Create AIModelService (`lib/ai/model-service.ts`):**
- [ ] Install Anthropic SDK: `npm install @anthropic-ai/sdk`
- [ ] Install Google AI SDK: `npm install @google/generative-ai`
- [ ] Create model wrapper class:
  - `generate(model, prompt, options)`
  - `generateGemini()` - Free tier
  - `generateClaude()` - Paid tiers
  - `calculateCost()` - Token cost calculator
- [ ] Model selection logic:
  - Based on user's subscription tier
  - Route to correct model
- [ ] Error handling (rate limits, API errors)
- [ ] Logging (tokens used, costs)

**Configuration:**
- [ ] Add environment variables:
  - `ANTHROPIC_API_KEY`
  - `GOOGLE_AI_API_KEY`
- [ ] Create model config file (`lib/ai/config.ts`)

**Testing:**
- [ ] Test Gemini API call
- [ ] Test Claude API calls (Haiku, Sonnet)
- [ ] Test cost calculation
- [ ] Test error handling

**Deliverable:** AI service ready to use

---

### Day 3-4: Tool Execution Engine

**Backend (`app/api/tools/[id]/run/route.ts`):**
- [ ] Get tool configuration from database
- [ ] Get user's subscription tier
- [ ] Check query quota (prevent overuse)
- [ ] Select appropriate AI model
- [ ] Build prompt from template + user input
- [ ] Call AI model
- [ ] Save tool run to database:
  - Input, output, tokens, cost, model used
- [ ] Return response (streaming if possible)
- [ ] Update user's quota usage

**Utilities:**
- [ ] Quota checker (`lib/quota.ts`)
- [ ] Prompt builder (`lib/ai/prompt-builder.ts`)

**Testing:**
- [ ] Test tool execution
- [ ] Test quota enforcement
- [ ] Test different user tiers (Free, Starter, Pro)
- [ ] Test error handling

**Deliverable:** Tool execution working

---

### Day 5: First Working Tool

**Create "Legal Email Drafter" Tool:**
- [ ] Tool detail page UI (`app/dashboard/tools/legal-email-drafter/page.tsx`)
- [ ] Input form:
  - Recipient
  - Subject
  - Context (textarea)
  - Tone (dropdown)
- [ ] "Run Tool" button
- [ ] Output display (with streaming)
- [ ] Copy, Export, Save actions

**Testing:**
- [ ] End-to-end test: User runs tool, gets output
- [ ] Test with Free tier (Gemini)
- [ ] Test with Pro tier (Sonnet)
- [ ] Test quota limits

**Deliverable:** First tool fully functional

---

## Sprint 1.4: Payment Integration (Week 6)

Reference: `pricing-model.md`

### Day 1-2: Stripe Setup

**Installation:**
- [ ] Install Stripe: `npm install stripe @stripe/stripe-js`
- [ ] Create Stripe account
- [ ] Get API keys (test + live)
- [ ] Configure environment variables

**Backend Setup:**
- [ ] Create Stripe customer on user signup
- [ ] Store `stripeCustomerId` in User table
- [ ] Create webhook endpoint (`app/api/webhooks/stripe/route.ts`)
- [ ] Handle webhook events:
  - `checkout.session.completed` - Update subscription
  - `invoice.paid` - Log payment
  - `invoice.payment_failed` - Handle failure
  - `customer.subscription.updated` - Update tier
  - `customer.subscription.deleted` - Cancel subscription

**Testing:**
- [ ] Test webhook locally (Stripe CLI)
- [ ] Test customer creation
- [ ] Test subscription events

**Deliverable:** Stripe integration working

---

### Day 3-4: Checkout Flow

**Pages:**
- [ ] Pricing page (if not done)
- [ ] Checkout page (`app/checkout/page.tsx`)
- [ ] Success page (`app/checkout/success/page.tsx`)
- [ ] Cancel page

**Backend:**
- [ ] `POST /api/checkout/create-session` - Create Stripe Checkout session
- [ ] Pass pricing tier, customer ID
- [ ] Return checkout URL
- [ ] Redirect user to Stripe Checkout

**Frontend:**
- [ ] "Upgrade" buttons on pricing page
- [ ] Redirect to checkout
- [ ] Handle success/cancel redirects

**Testing:**
- [ ] Complete checkout with test card
- [ ] Verify subscription created
- [ ] Verify user tier updated
- [ ] Test cancellation

**Deliverable:** Checkout flow working

---

### Day 5: Billing Dashboard

**Page:** `/dashboard/billing`

**Features:**
- [ ] Current plan display
- [ ] Usage stats (queries used / limit)
- [ ] Next billing date
- [ ] Change plan button
- [ ] Cancel subscription button
- [ ] Billing history (invoices)

**Backend:**
- [ ] `GET /api/user/subscription` - Get Stripe subscription
- [ ] `GET /api/user/usage` - Get current month usage
- [ ] `POST /api/subscription/cancel` - Cancel subscription

**Testing:**
- [ ] Test billing page load
- [ ] Test plan change
- [ ] Test cancellation

**Deliverable:** Billing management working

---

## Phase 1 Acceptance Criteria

- ✅ Users can sign up and verify email
- ✅ Users can sign in and reset password
- ✅ User automatically assigned to personal Organization on signup
- ✅ Dashboard layout complete and responsive
- ✅ Tool catalog displays tools with filters
- ✅ At least 1 tool fully functional (Legal Email Drafter)
- ✅ AI integration working (Gemini for Free, Claude for Paid)
- ✅ AI model selection based on subscription tier (per `technical-specifications-ai-models.md`)
- ✅ Stripe checkout functional
- ✅ Users can upgrade/downgrade plans
- ✅ Billing dashboard shows usage and invoices
- ✅ All tests passing

---

# PHASE 2: Marketing Site
**Timeline:** Weeks 7-10 (4 weeks)  
**Team:** Frontend (2), Designer (1), Content Writer (0.5)  
**Goal:** Build public-facing marketing site

Reference: `landing-page-doc.md`

---

## Sprint 2.1: Landing Page (Week 7)

### Day 1-2: Homepage Sections

**Hero Section:**
- [ ] Create Hero component
- [ ] Headline, subheadline, feature pills
- [ ] Primary CTA: "Start for Free"
- [ ] Secondary CTA: "Book a Demo"
- [ ] Background gradient with pattern
- [ ] Animated product screenshot

**Social Proof:**
- [ ] Logo carousel (infinite scroll)
- [ ] Testimonial cards (rotating)

**Problem/Solution:**
- [ ] 2-column alternating layout
- [ ] Text + illustrations

**Deliverable:** Hero and first sections

---

### Day 3: Features & Tool Showcase

**Tool Categories Grid:**
- [ ] 3-column grid (12 categories shown)
- [ ] Each card: Icon, name, tool count, description
- [ ] Link to category page
- [ ] "View All Tools" link

**Features Deep Dive:**
- [ ] Tabbed interface or accordion
- [ ] 5 tabs: Research, Documents, Team, Security, Integrations
- [ ] Screenshots for each tab

**Deliverable:** Feature sections complete

---

### Day 4: Pricing & FAQ

**Pricing Section:**
- [ ] 4 pricing cards (Free, Starter, Pro, Advanced)
- [ ] Feature comparison
- [ ] "Start for Free" / "Get Started" buttons
- [ ] Link to `/pricing` for full details

**FAQ Section:**
- [ ] 2-column accordion
- [ ] 12-15 FAQs
- [ ] Content from docs

**Deliverable:** Pricing and FAQ sections

---

### Day 5: Footer & Final CTA

**Final CTA Section:**
- [ ] Full-width gradient
- [ ] Headline, CTA buttons
- [ ] Trust badges

**Footer:**
- [ ] 4-column layout
- [ ] Links to all pages
- [ ] Social icons
- [ ] Copyright

**Testing:**
- [ ] Mobile responsive
- [ ] All links working
- [ ] Lighthouse score 95+

**Deliverable:** Complete landing page

---

## Sprint 2.2: Inner Pages (Week 8)

### Pages to Create

**Day 1: Features Page (`/features`)**
- [ ] Detailed feature breakdown
- [ ] 6-8 feature sections
- [ ] Screenshots
- [ ] CTA at bottom

**Day 2: Pricing Page (`/pricing`)**
- [ ] Full pricing comparison table (4 tiers, aligned with `pricing-model.md`)
- [ ] Tool count per tier clearly stated (3 / 15 / 35 / 240+)
- [ ] AI model per tier displayed
- [ ] **45-day money-back guarantee** prominently featured
- [ ] ROI calculator (billable hours saved)
- [ ] Expanded FAQ (20+ questions)
- [ ] Fair use policy explanation (Advanced tier)
- [ ] Enterprise inquiry form

**Note:** Ensure all pricing copy matches `pricing-model.md` as source of truth

**Day 3: AI Tools Directory (`/ai-tools`)**
- [ ] Filterable tool grid
- [ ] Category sidebar
- [ ] Search functionality
- [ ] Tool quick view modals

**Day 4: Legal Pages**
- [ ] Terms of Service (`/terms`)
- [ ] Privacy Policy (`/privacy`)
- [ ] Cookie Policy (`/cookie-policy`)
- [ ] Security page (`/security`)

**Day 5: Contact & About**
- [ ] Contact page (`/contact`) - Form + info
- [ ] About page (`/about`) - Mission, team
- [ ] Demo booking page (`/demo`) - Calendly embed

**Deliverable:** All marketing pages complete

---

## Sprint 2.3: Blog & SEO (Week 9)

### Day 1-2: Blog System

**Blog Setup:**
- [ ] Create blog layout (`app/blog/layout.tsx`)
- [ ] Blog listing page (`app/blog/page.tsx`)
- [ ] Blog post page (`app/blog/[slug]/page.tsx`)
- [ ] Use MDX for blog posts
- [ ] Create 5 initial blog posts:
  1. "Introducing Frith AI"
  2. "How AI is Transforming Legal Practice"
  3. "Contract Review in 60 Seconds"
  4. "Legal Research with Claude AI"
  5. "Why We Built Frith AI"

**Deliverable:** Blog system functional

---

### Day 3-4: SEO Optimization

**Technical SEO:**
- [ ] Add metadata to all pages
- [ ] Create `sitemap.xml`
- [ ] Create `robots.txt`
- [ ] Add structured data (JSON-LD):
  - Organization schema
  - HowTo schema (blog posts)
  - FAQ schema
- [ ] Optimize images (WebP, alt text)
- [ ] Add Open Graph tags (social sharing)
- [ ] Twitter Card tags

**Performance:**
- [ ] Optimize Lighthouse score (95+)
- [ ] Image lazy loading
- [ ] Font optimization
- [ ] Code splitting

**Testing:**
- [ ] Test all pages with Lighthouse
- [ ] Test social sharing previews
- [ ] Validate structured data

**Deliverable:** SEO optimized site

---

### Day 5: Analytics & Tracking

**Setup:**
- [ ] Google Analytics 4
- [ ] Vercel Analytics
- [ ] Set up conversion events:
  - Sign up started
  - Sign up completed
  - Demo booked
  - Tool run
  - Upgrade to paid

**Testing:**
- [ ] Test event tracking
- [ ] Verify data in GA4

**Deliverable:** Analytics live

---

## Sprint 2.4: CMS & Content (Week 10)

### Day 1-3: Help Center Foundation

**Setup:**
- [ ] Create help center structure
- [ ] Categories (10 main categories)
- [ ] Write 20 essential articles:
  - Getting Started (5 articles)
  - Using Tools (5 articles)
  - Billing & Plans (5 articles)
  - Troubleshooting (5 articles)

**Backend:**
- [ ] Create HelpArticle model
- [ ] Create HelpCategory model
- [ ] Seed database with articles

**Frontend:**
- [ ] Help center homepage (`support.frithai.com`)
- [ ] Article page
- [ ] Search functionality (basic)

**Deliverable:** Help center foundation

---

### Day 4: Status Page

**Create:** `status.frithai.com`

**Features:**
- [ ] Current system status (manual for now)
- [ ] Components list (Web, API, Database, etc.)
- [ ] Uptime history (placeholder)
- [ ] Incident history

**Backend:**
- [ ] Simple JSON config for status
- [ ] API: `/api/status`

**Deliverable:** Status page live

---

### Day 5: Final Review & Launch Prep

**Tasks:**
- [ ] Full site walkthrough
- [ ] Fix any remaining bugs
- [ ] Test all forms
- [ ] Test all links
- [ ] Mobile testing on real devices
- [ ] Browser compatibility (Chrome, Safari, Firefox)
- [ ] Spelling/grammar check
- [ ] Legal review (terms, privacy)

**Deliverable:** Marketing site ready for launch

---

## Phase 2 Acceptance Criteria

- ✅ Landing page complete and responsive
- ✅ All inner pages built
- ✅ Blog system functional with 5 posts
- ✅ SEO optimized (Lighthouse 95+)
- ✅ Analytics tracking working
- ✅ Help center with 20 articles
- ✅ Status page live
- ✅ All forms tested
- ✅ Legal pages reviewed
- ✅ Site ready for public traffic

---

# PHASE 3: User Dashboard MVP
**Timeline:** Weeks 11-16 (6 weeks)  
**Team:** Full team  
**Goal:** Complete user dashboard with 20 working AI tools

Reference: `user-dashboard-complete.md`

---

## Sprint 3.1: Tool Portfolio Definition & Selection (Week 11, Days 1-2)

Reference: `ai-agents.md` for complete tool catalog (240+ tools)

### Task: Lock Down 20 MVP Tools

**Goal:** Select and finalize the 20 core tools for MVP from the 240+ tool catalog in `ai-agents.md`.

**Process:**
- [ ] Review `ai-agents.md` Section 1-15 (all 240+ tools)
- [ ] Prioritize by:
  - Market demand (most requested by legal professionals)
  - Technical feasibility (prompt complexity, integration requirements)
  - Coverage across categories (ensure breadth)
  - Competitive differentiation (tools competitors don't have)
- [ ] Select 20 MVP tools with clear acceptance criteria:
  - Must cover 8-10 different categories
  - Mix of simple (email drafting) and complex (contract review)
  - At least 3 "wow" tools (e.g., Deposition Summarizer, Patent Prior Art)
- [ ] Document for each tool:
  - Tool name (from `ai-agents.md`)
  - Category
  - Input requirements
  - Output format
  - Prompt template (draft)
  - Success metrics (accuracy target, user satisfaction)
- [ ] Create seed data mapping:
  - Tool ID → Category ID
  - Tool metadata (name, slug, description, pricing tier, AI model)
- [ ] Update database seed script with final 20 tools
- [ ] Align naming/descriptions across:
  - Database
  - Marketing pages
  - Help center articles

**Priority Waves for Remaining 220 Tools (for Phase 11):**
- [ ] Wave 1 (Months 10-11): Next 50 tools (high-demand categories)
- [ ] Wave 2 (Months 11-12): Next 70 tools (specialized practice areas)
- [ ] Wave 3 (Months 13-15): Next 70 tools (niche/advanced features)
- [ ] Wave 4 (Months 15-18): Final 30 tools (experimental/emerging areas)

**Deliverable:** 
- 20 MVP tools locked and documented
- Seed data updated
- Roadmap for remaining 220 tools (Waves 1-4)

---

### Day 3-4: Tool Detail Pages

Reference: `user-dashboard-complete.md` Section 6 for full tool detail specs

**For Each Tool:**
- [ ] Create tool detail page template
- [ ] Sections (see `user-dashboard-complete.md` for detailed specs):
  - Description & use cases
  - Input form (dynamic based on tool config)
  - Sample prompts (collapsible)
  - Advanced options (model selection, output format)
  - Related tools
- [ ] Real-time character/token counter
- [ ] Run button with loading state
- [ ] Display which AI model will be used (based on user's tier)

**Deliverable:** Tool detail page template

---

### Day 5: Output Management

Reference: `user-dashboard-complete.md` Section 6.3 for detailed output specs

**Features:**
- [ ] Output display with syntax highlighting
- [ ] Edit output inline
- [ ] Action bar:
  - Copy to clipboard
  - Export (DOCX, PDF, TXT)
  - Save to project
  - Share with team
  - Rate output (👍👎 for feedback)
- [ ] Citation list (for research tools)
- [ ] Provenance panel:
  - Sources cited
  - AI model used (Gemini/Haiku/Sonnet/Opus)
  - Tokens used
  - Cost (if admin)
  - Confidence scores (if available)
  - Timestamp

**Backend:**
- [ ] Export service (convert to DOCX/PDF)
- [ ] Install libraries: `docx`, `pdfkit`

**Deliverable:** Output management complete

---

## Sprint 3.2: AI Evaluation & Quality Framework (Week 11, Days 6-7 + Week 12, Days 1-2)

Reference: `technical-specifications-ai-models.md` Section 13 (Testing & Validation)

### Goal: Build Reusable AI Quality Assurance System

**Why Critical:** Legal tools require high accuracy. Build evaluation infrastructure before scaling to 240 tools.

### Day 6-7 (Week 11): Evaluation Harness Design

**Tasks:**
- [ ] Design AI evaluation framework:
  - **Benchmark datasets** per tool category:
    - Contract Review: 50 sample contracts with known issues
    - Legal Research: 30 legal questions with verified answers
    - Brief Drafting: 20 fact patterns with expert-written briefs
  - **Evaluation metrics:**
    - Accuracy (% correct responses)
    - Citation correctness (% valid legal citations)
    - Legal reasoning quality (1-10 scale, manual review)
    - Bluebook compliance (for research tools)
    - Output formatting (structure, readability)
  - **Regression testing:** Prompt changes trigger re-evaluation
- [ ] Define acceptance thresholds per tool type:
  - Research tools: 93%+ accuracy
  - Drafting tools: 85%+ quality score
  - Review tools: 90%+ risk identification
- [ ] Create evaluation database schema:
  - `EvaluationDataset` (test cases)
  - `EvaluationRun` (test execution)
  - `EvaluationResult` (scores, pass/fail)
- [ ] Document evaluation process for team

**Deliverable:** Evaluation framework specification

---

### Days 1-2 (Week 12): Evaluation Harness Implementation

**Backend (`/lib/ai/evaluation/`):**
- [ ] `evaluator.ts` - Core evaluation engine
- [ ] `datasets.ts` - Load benchmark datasets
- [ ] `metrics.ts` - Calculate accuracy, quality scores
- [ ] `regression.ts` - Run tests on prompt changes

**CLI Tool:**
- [ ] Create evaluation CLI: `npm run evaluate:tool [tool-id]`
- [ ] Output: Score report, comparison to baseline, pass/fail

**Testing:**
- [ ] Run evaluation on 3-5 sample tools
- [ ] Verify metrics calculated correctly
- [ ] Test regression detection (change prompt → re-evaluate)

**Deliverable:** Working AI evaluation harness

**Note:** This framework will be reused in Phase 11 when building remaining 220 tools.

---

## Sprint 3.3: Onboarding & Core Features (Week 12, Days 3-5)

Reference: `user-dashboard-complete.md` Section 14 for complete onboarding specs

### Day 3-4: History & Favorites

**Pages:**
- [ ] History page (`/dashboard/history`)
- [ ] Favorites page (`/dashboard/favorites`)

**Features:**
- [ ] List all past tool runs with:
  - Tool name, input snippet, status
  - AI model used (display badge: Gemini/Haiku/Sonnet/Opus)
  - Timestamp, tokens used
- [ ] Filters (date, tool, status, AI model)
- [ ] Reopen output
- [ ] Rerun with same inputs
- [ ] Delete runs

**Backend:**
- [ ] `GET /api/tool-runs` - List runs with filters
- [ ] `DELETE /api/tool-runs/[id]` - Delete run

**Deliverable:** History and favorites working

---

## Sprint 3.2: Onboarding Flow (Week 12)

Reference: `user-dashboard-complete.md` Section 14

### Day 1-2: Onboarding Wizard

**Create:** `/dashboard/welcome` (first-time users)

**Steps:**
1. Welcome screen
2. Role selection (Solo, Associate, Partner, etc.)
3. Practice areas (multi-select)
4. Import/connect tools (optional)
5. Recommended tools (based on selections)
6. First tool run (guided)

**Components:**
- [ ] Multi-step wizard component
- [ ] Progress indicator
- [ ] Quick replies / buttons
- [ ] Skip option

**Backend:**
- [ ] Save onboarding preferences
- [ ] Generate recommended tools

**Testing:**
- [ ] Full onboarding flow
- [ ] Test tool recommendation logic

**Deliverable:** Onboarding wizard complete

---

## Sprint 3.4: Build 20 MVP Tools (Weeks 13-14)

Reference: 20 tools selected in Sprint 3.1 from `ai-agents.md`

### Goal: Build 20 MVP Tools (10 per week)

**Process per Tool:**
1. Get tool spec from Sprint 3.1 selection
2. Create/refine prompt template
3. **Run through evaluation harness** (from Sprint 3.2)
4. Test with multiple AI models (Gemini, Haiku, Sonnet)
5. Build custom UI (if needed beyond template)
6. End-to-end testing
7. Document tool (help article)
8. **Verify meets accuracy threshold** (from evaluation framework)

---

### Week 13: Tools 1-10

**Build first 10 tools from Sprint 3.1 selection**

Example tools (actual selection from Sprint 3.1):
- Legal Email Drafter (already built, enhance)
- Contract Review & Risk Analysis
- Legal Memo Writer
- NDA Drafter
- Case Law Summarizer
- Deposition Summarizer
- Discovery Request Drafter
- [3 more from selection]

**For Each Tool:**
- [ ] Create tool record in database
- [ ] Write and test prompt template
- [ ] **Run evaluation suite:**
  - [ ] Accuracy test (vs benchmark dataset)
  - [ ] Quality score (manual review of 10 sample outputs)
  - [ ] Verify meets threshold (e.g., 93% for research, 85% for drafting)
- [ ] Build custom UI (if needed)
- [ ] Test across AI models:
  - [ ] Gemini (free tier) - verify adequate quality
  - [ ] Claude Haiku (starter) - verify improvement
  - [ ] Claude Sonnet (pro) - verify best quality
- [ ] End-to-end testing
- [ ] Create help article

**Quality Gate:** No tool ships unless it passes evaluation threshold.

---

### Week 14: Tools 11-20

**Build remaining 10 tools from Sprint 3.1 selection**

Example tools (actual selection from Sprint 3.1):
- Demand Letter Generator
- Motion to Dismiss Drafter
- Settlement Agreement Generator
- Patent Prior Art Search
- Medical Record Summarizer
- [5 more from selection]

**Same process as Week 13.**

**Deliverable:** 20 MVP tools, all evaluated and meeting quality standards

---

### Testing Strategy

**For Each Tool:**
- [ ] **Automated evaluation** (accuracy, citations, quality)
- [ ] Test with free tier (Gemini) - verify usable
- [ ] Test with paid tiers (Claude Haiku, Sonnet)
- [ ] Test edge cases (very long input, empty input, special characters)
- [ ] Test quota limits (exceed free tier limit)
- [ ] Test token limits per tier
- [ ] **Manual legal review** (sample outputs reviewed by attorney or legal expert)
- [ ] Get feedback from beta users (if available)

**Documentation:**
- [ ] Log evaluation scores in database
- [ ] Track which tools pass/fail quality gates
- [ ] Document any prompt adjustments made

---

## Sprint 3.5: Projects & Organization (Week 15)

Reference: `user-dashboard-complete.md` Section 7

### Day 1-2: Projects/Cases

**Pages:**
- [ ] Projects list (`/dashboard/projects`)
- [ ] Create project modal
- [ ] Project detail page (`/dashboard/projects/[id]`)

**Features:**
- [ ] Create project with name, description
- [ ] Associate tool runs with project
- [ ] Upload documents to project
- [ ] Project timeline (activity feed)
- [ ] Archive/delete project

**Backend:**
- [ ] `GET /api/projects` - List projects
- [ ] `POST /api/projects` - Create project
- [ ] `GET /api/projects/[id]` - Get project details
- [ ] `PATCH /api/projects/[id]` - Update project
- [ ] `DELETE /api/projects/[id]` - Delete project

**Deliverable:** Projects system working

---

### Day 3: Templates Library

**Page:** `/dashboard/templates`

**Features:**
- [ ] List saved templates
- [ ] Create template from tool run
- [ ] Use template (load into tool)
- [ ] Share template (future: with team)
- [ ] Delete template

**Backend:**
- [ ] Template model in database
- [ ] CRUD APIs for templates

**Deliverable:** Templates working

---

### Day 4-5: Search & Filters

**Global Search:**
- [ ] Implement search in header
- [ ] Search across:
  - Tools
  - Projects
  - History
  - Templates
- [ ] Keyboard shortcut (Cmd/Ctrl+K)
- [ ] Real-time results (dropdown)

**Tool Filters:**
- [ ] Multi-select category filter
- [ ] Input type filter
- [ ] Pricing tier filter
- [ ] Sort options (popular, newest, A-Z)

**Backend:**
- [ ] Search API with full-text search
- [ ] Use PostgreSQL full-text search or Algolia

**Deliverable:** Search and filters working

---

## Sprint 3.6: Performance & Polish (Week 16)

### Day 1-2: Streaming Responses

**Goal:** Make tool outputs stream in real-time

**Implementation:**
- [ ] Use Server-Sent Events (SSE) or streaming fetch
- [ ] Claude API supports streaming
- [ ] Update frontend to display tokens as they arrive
- [ ] Show typing indicator before first token

**Deliverable:** Streaming working

---

### Day 3: Loading States & Skeletons

**UI Polish:**
- [ ] Skeleton loaders for tool cards
- [ ] Loading state for tool execution
- [ ] Progress bars for long-running tasks
- [ ] Empty states for all pages
- [ ] Error states with helpful messages

**Deliverable:** Polished UI

---

### Day 4: Performance Optimization

**Tasks:**
- [ ] Lazy load tool cards
- [ ] Optimize images (WebP)
- [ ] Code splitting by route
- [ ] Cache tool metadata
- [ ] Measure performance (Lighthouse)
- [ ] Optimize bundle size

**Target:** Dashboard loads < 2s

**Deliverable:** Performance optimized

---

### Day 5: QA & Bug Fixes

**Tasks:**
- [ ] Full QA pass
- [ ] Test all 20 tools
- [ ] Test all user flows
- [ ] Fix critical bugs
- [ ] Cross-browser testing
- [ ] Mobile testing

**Deliverable:** User dashboard stable

---

## Phase 3 Acceptance Criteria

- ✅ **20 MVP tools selected and locked** from `ai-agents.md` catalog
- ✅ **AI evaluation framework built** (datasets, metrics, regression testing)
- ✅ 20 AI tools fully functional and **meeting quality thresholds:**
  - ✅ Research tools: 93%+ accuracy
  - ✅ Drafting tools: 85%+ quality score
  - ✅ All tools evaluated with benchmark datasets
- ✅ Tool detail pages complete
- ✅ Output management (copy, export, save, provenance with AI model displayed)
- ✅ History and favorites working
- ✅ Onboarding wizard complete
- ✅ Projects system working
- ✅ Templates library functional
- ✅ Global search working
- ✅ Streaming responses implemented
- ✅ Performance optimized
- ✅ All tests passing (including AI evaluation tests)
- ✅ Roadmap defined for remaining 220 tools (4 waves for Phase 11)
- ✅ Ready for beta users

---

# PHASE 4: Admin Dashboard
**Timeline:** Weeks 17-20 (4 weeks)  
**Team:** Backend (2), Frontend (1)  
**Goal:** Build admin dashboard for platform management

Reference: `admin-dashboard-doc.md`

---

## Sprint 4.1: Admin Foundation (Week 17)

### Day 1-2: Admin Layout & Auth

**Setup:**
- [ ] Create admin route: `/admin`
- [ ] Admin layout component
- [ ] Admin-only middleware (check user role)
- [ ] Redirect non-admins to dashboard
- [ ] Warning banner: "ADMIN MODE"

**Navigation:**
- [ ] Admin sidebar with all sections
- [ ] Context switcher (for Super Admins)

**Backend:**
- [ ] Add `role` to User model (if not exists)
- [ ] Roles: `user`, `admin`, `super_admin`
- [ ] Middleware: `requireAdmin()`

**Deliverable:** Admin area accessible (admins only)

---

### Day 3-5: User Management

**Pages:**
- [ ] Users list (`/admin/users`)
- [ ] User detail (`/admin/users/[id]`)

**Features:**
- [ ] Table with all users
- [ ] Filters (tier, status, date)
- [ ] Search by name/email
- [ ] Actions:
  - Edit user
  - Reset password
  - Suspend/ban
  - Delete user
  - Impersonate user

**User Detail Tabs:**
- [ ] Profile
- [ ] Subscription
- [ ] Activity (tool runs)
- [ ] Billing history
- [ ] Support tickets
- [ ] Audit log

**Backend:**
- [ ] `GET /api/admin/users` - List users
- [ ] `GET /api/admin/users/[id]` - User details
- [ ] `PATCH /api/admin/users/[id]` - Update user
- [ ] `DELETE /api/admin/users/[id]` - Delete user
- [ ] `POST /api/admin/users/[id]/impersonate` - Impersonate

**Deliverable:** User management complete

---

## Sprint 4.2: Analytics Dashboard (Week 18)

### Day 1-3: Overview Dashboard

**Page:** `/admin` (default)

**Metrics Cards:**
- [ ] Total Users
- [ ] Active Subscriptions
- [ ] Monthly Revenue (MRR)
- [ ] Tool Runs Today

**Charts:**
- [ ] User growth (line chart)
- [ ] Revenue breakdown (stacked bar)
- [ ] Tool usage (horizontal bar)

**Recent Activity Feed:**
- [ ] New signups
- [ ] Plan upgrades
- [ ] Support tickets

**Backend:**
- [ ] `GET /api/admin/analytics/overview` - Dashboard metrics
- [ ] Calculate metrics from database
- [ ] Cache results (5 min)

**Deliverable:** Admin overview dashboard

---

### Day 4-5: Advanced Analytics

**Page:** `/admin/analytics`

**Sections:**
- [ ] User metrics (DAU, MAU, churn)
- [ ] Engagement metrics (tool runs per user)
- [ ] Conversion metrics (free → paid)
- [ ] Revenue metrics (MRR, ARR, ARPU)
- [ ] Technical metrics (API uptime, errors)

**Features:**
- [ ] Date range selector
- [ ] Export as CSV
- [ ] Charts (using Chart.js or Recharts)

**Backend:**
- [ ] Analytics APIs for each section
- [ ] Complex queries (joins, aggregations)

**Deliverable:** Advanced analytics

---

## Sprint 4.3: Tool & Support Management (Week 19)

### Day 1-2: Tool Management

**Pages:**
- [ ] Tools list (`/admin/tools`)
- [ ] Tool detail (`/admin/tools/[id]`)
- [ ] Create/edit tool form

**Features:**
- [ ] CRUD for tools
- [ ] Configure:
  - Name, slug, description
  - Category
  - Pricing tier
  - AI model
  - Prompt template
  - Status (active/disabled)
- [ ] Usage statistics per tool
- [ ] Duplicate tool

**Backend:**
- [ ] Admin tool CRUD APIs
- [ ] Tool usage analytics

**Deliverable:** Tool management

---

### Day 3-5: Support Ticket System

**Pages:**
- [ ] Tickets list (`/admin/support/tickets`)
- [ ] Ticket detail (`/admin/support/tickets/[id]`)

**Features:**
- [ ] List all tickets
- [ ] Filters (status, priority, assigned)
- [ ] Assign to admin
- [ ] Reply to ticket
- [ ] Internal notes
- [ ] Close ticket

**Ticket Detail:**
- [ ] Conversation thread
- [ ] User info (sidebar)
- [ ] Status/priority dropdowns
- [ ] Reply form

**Backend:**
- [ ] `GET /api/admin/tickets` - List tickets
- [ ] `GET /api/admin/tickets/[id]` - Ticket details
- [ ] `POST /api/admin/tickets/[id]/reply` - Add message
- [ ] `PATCH /api/admin/tickets/[id]` - Update ticket

**Email Notifications:**
- [ ] Send email when admin replies
- [ ] Use Resend

**Deliverable:** Support ticket system

---

## Sprint 4.4: Billing & System (Week 20)

### Day 1-2: Billing Management + Refund Handling

Reference: `pricing-model.md` for 45-day money-back guarantee policy

**Pages:**
- [ ] Transactions (`/admin/transactions`)
- [ ] Invoices (`/admin/invoices`)
- [ ] Refund management (`/admin/refunds`)

**Features:**
- [ ] List all transactions
- [ ] Filter by status, amount, date
- [ ] View transaction details
- [ ] **45-Day Guarantee Tracking:**
  - [ ] Flag subscriptions within 45-day window
  - [ ] Track refund requests by reason
  - [ ] "Guarantee expires in X days" badge
- [ ] **Issue refund with workflow:**
  - [ ] Capture refund reason (dropdown + notes)
  - [ ] Offer alternatives before refunding:
    - Downgrade to lower tier
    - 1 month free extension
    - Connect with support
  - [ ] Process full refund via Stripe
  - [ ] Send refund confirmation email
  - [ ] Log refund reason in database (for analysis)
- [ ] View/download invoices
- [ ] **Refund analytics:**
  - [ ] Refund rate by tier
  - [ ] Common refund reasons
  - [ ] Refunds by month

**Backend:**
- [ ] Fetch transactions from Stripe
- [ ] **Refund API with guarantee validation:**
  - [ ] Check if within 45-day window
  - [ ] Process refund via Stripe API
  - [ ] Update subscription status
  - [ ] Log refund with reason
- [ ] Invoice download
- [ ] **RefundRequest model:**
  - user_id, subscription_id, amount
  - reason (dropdown: not satisfied, too expensive, feature missing, etc.)
  - notes, processed_by, processed_at

**Deliverable:** Billing management with 45-day guarantee workflow

---

### Day 3: System Monitoring

**Page:** `/admin/system-status`

**Features:**
- [ ] Service status (Web, API, Database, AI, Email)
- [ ] Uptime stats (last 24h, 7d, 30d)
- [ ] Recent incidents
- [ ] Scheduled maintenance

**Implementation:**
- [ ] Manual status for now (JSON config)
- [ ] Future: Integrate with monitoring service

**Deliverable:** System status page

---

### Day 4-5: Audit Logs

**Page:** `/admin/audit-logs`

**Features:**
- [ ] List all admin actions
- [ ] Filters (admin user, event type, date)
- [ ] Search
- [ ] Export as CSV

**Backend:**
- [ ] Log all admin actions
- [ ] `GET /api/admin/audit-logs` - List logs

**Deliverable:** Audit logging complete

---

## Phase 4 Acceptance Criteria

- ✅ Admin dashboard accessible (role-based)
- ✅ User management functional
- ✅ Analytics dashboard with key metrics
- ✅ **AI cost monitoring dashboards functional:**
  - ✅ Daily/weekly/monthly spend tracking
  - ✅ Cost per model, tier, user, tool
  - ✅ Margin analysis per tier
  - ✅ Spending alerts configured and tested
- ✅ Tool management (CRUD)
- ✅ Support ticket system working
- ✅ Billing management with **45-day guarantee workflow:**
  - ✅ Refund requests tracked by reason
  - ✅ Guarantee window flagged
  - ✅ Refund analytics available
- ✅ System status page
- ✅ Audit logs tracking admin actions
- ✅ All admin APIs secured
- ✅ Tested with multiple admin roles

---

# PHASE 5: Support System
**Timeline:** Weeks 21-24 (4 weeks)  
**Team:** Backend (1), Frontend (1), Content Writer (0.5)  
**Goal:** Complete help center and support features

Reference: `support-helpdesk-doc.md`

---

## Sprint 5.1: Help Center Enhancement (Week 21)

### Day 1-3: Article System

**Backend:**
- [ ] HelpArticle and HelpCategory models (if not done)
- [ ] CRUD APIs for articles
- [ ] Search API (full-text search)
- [ ] Track views, helpful votes

**Frontend:**
- [ ] Category page with article list
- [ ] Article page with:
  - Table of contents
  - Related articles
  - "Was this helpful?" widget
  - Contact support CTA

**Deliverable:** Article system complete

---

### Day 4-5: Content Creation

**Write 50 Help Articles:**
- [ ] Getting Started (10 articles)
- [ ] Using Tools (15 articles)
- [ ] Billing & Plans (10 articles)
- [ ] Account Settings (10 articles)
- [ ] Troubleshooting (5 articles)

**Format:**
- [ ] Step-by-step guides
- [ ] Screenshots
- [ ] Video tutorials (optional)

**Deliverable:** 50 articles published

---

## Sprint 5.2: Ticketing System (Week 22)

### Day 1-3: User-Facing Ticketing

**Pages:**
- [ ] Submit ticket (`/support/submit-ticket`)
- [ ] My tickets (`/support/my-tickets`)
- [ ] Ticket detail (`/support/tickets/[id]`)

**Features:**
- [ ] Ticket form:
  - Subject, category, priority
  - Description (rich text)
  - Attachments
- [ ] List user's tickets
- [ ] View ticket with conversation
- [ ] Reply to ticket
- [ ] Close ticket

**Backend:**
- [ ] SupportTicket and TicketMessage models (if not done)
- [ ] Ticket CRUD APIs
- [ ] Email notifications

**Deliverable:** User ticketing complete

---

### Day 4-5: Admin Ticket Management

**Already built in Phase 4, but enhance:**
- [ ] SLA tracking (first response, resolution time)
- [ ] Ticket assignment logic
- [ ] Auto-responses (optional)
- [ ] Ticket merging

**Deliverable:** Advanced ticketing features

---

## Sprint 5.3: Knowledge Base & Search (Week 23)

### Day 1-2: Advanced Search

**Implement:**
- [ ] Vector search for help articles (optional: Pinecone)
- [ ] Or: PostgreSQL full-text search
- [ ] Search suggestions (autocomplete)
- [ ] Popular searches tracking

**Frontend:**
- [ ] Enhanced search UI
- [ ] Filters (category, date)
- [ ] Highlighted snippets in results

**Deliverable:** Advanced search working

---

### Day 3-4: Video Tutorials

**Create:**
- [ ] 5-10 video tutorials (Loom or custom)
- [ ] Topics:
  - How to run your first tool
  - Contract review walkthrough
  - Creating projects
  - Team collaboration
  - Billing & plans

**Embed:**
- [ ] Embed videos in help articles
- [ ] Video gallery page

**Deliverable:** Video tutorials

---

### Day 5: Feedback System

**Features:**
- [ ] Article feedback (already built)
- [ ] General feedback form (`/support/feedback`)
- [ ] Feature request tracking

**Backend:**
- [ ] Feedback model
- [ ] API to submit feedback
- [ ] Admin view of feedback

**Deliverable:** Feedback system

---

## Sprint 5.4: System Status & Notifications (Week 24)

**Note on Community Forum and Live Chat:**

Reference: `support-helpdesk-doc.md` Section 9 (Live Chat) and Section 19 (Community Forum)

These features are **deferred to Phase 11 (Scale & Enhance)** or beyond the current 18-month roadmap:

- **Community Forum** (`/community` or `community.frithai.com`):
  - Peer-to-peer support, user-generated content
  - **Rationale for deferral:** Requires moderation resources, critical mass of users
  - **Target:** Month 15+ when user base >5,000
  
- **Human Live Chat** (beyond AI chatbot):
  - Real-time chat with human support agents
  - **Rationale for deferral:** Requires dedicated support staff (Phase 6 AI chatbot handles initial support)
  - **Target:** Month 12+ or when support ticket volume >100/day justifies live staffing

For MVP and initial launch, focus remains on:
- AI chatbot (Phase 6)
- Support ticket system (Phase 5)
- Help center (Phase 5)

---

### Day 1-2: Enhanced Status Page

**Improve:** `status.frithai.com`

**Features:**
- [ ] Real-time status (integrate with monitoring)
- [ ] Incident management:
  - Create incident
  - Update incident
  - Resolve incident
- [ ] Scheduled maintenance announcements
- [ ] Subscribe to updates (email, SMS)

**Backend:**
- [ ] Incident model
- [ ] Status API
- [ ] Email/SMS notifications (Resend + Twilio)

**Deliverable:** Production-ready status page

---

### Day 3-4: Email Notifications

**Templates:**
- [ ] Welcome email (on signup)
- [ ] Email verification
- [ ] Password reset
- [ ] Ticket created/replied
- [ ] Plan upgrade/downgrade
- [ ] Usage limit warnings
- [ ] Billing notifications

**Implementation:**
- [ ] Create all templates in Resend
- [ ] Test all emails
- [ ] Unsubscribe management

**Deliverable:** All email templates

---

### Day 5: Testing & Polish

**Tasks:**
- [ ] Full support system QA
- [ ] Test all ticket flows
- [ ] Test search
- [ ] Test emails
- [ ] Cross-browser testing
- [ ] Mobile testing

**Deliverable:** Support system stable

---

## Phase 5 Acceptance Criteria

- ✅ Help center with 50+ articles
- ✅ Advanced search working
- ✅ User ticketing system functional
- ✅ Admin ticket management enhanced
- ✅ Video tutorials embedded
- ✅ Feedback system working
- ✅ Status page enhanced with incidents
- ✅ All email notifications working
- ✅ Support system fully tested
- ✅ **Community forum and human live chat explicitly deferred** to Phase 11 or beyond

---

# PHASE 6: AI Chatbot
**Timeline:** Weeks 25-28 (4 weeks)  
**Team:** Backend (1), Frontend (1), AI Engineer (0.5)  
**Goal:** Build AI chatbot for lead gen, conversion, support

Reference: `ai-chatbot-doc.md`

---

## Sprint 6.1: Chat Widget (Week 25)

### Day 1-2: Widget UI

**Components:**
- [ ] Chat button (collapsed state)
- [ ] Chat window (expanded)
- [ ] Header (avatar, name, status)
- [ ] Message list
- [ ] Input field
- [ ] Quick reply buttons

**States:**
- [ ] Collapsed
- [ ] Expanded
- [ ] Minimized
- [ ] Typing indicator

**Styling:**
- [ ] Brand colors
- [ ] Responsive (mobile full-screen)
- [ ] Animations (slide up, fade in)

**Deliverable:** Chat widget UI

---

### Day 3-5: Backend & WebSocket

**Setup:**
- [ ] Install Socket.io: `npm install socket.io socket.io-client`
- [ ] Create WebSocket server (separate or Next.js API route)
- [ ] Handle events:
  - `connect` - New user connects
  - `message` - User sends message
  - `disconnect` - User leaves

**Backend Logic:**
- [ ] Create conversation in database
- [ ] Send user message to Claude API
- [ ] Stream response back to user
- [ ] Save conversation

**Models:**
- [ ] ChatbotConversation
- [ ] ChatbotMessage

**Deliverable:** Real-time chat working

---

## Sprint 6.2: AI Integration (Week 26)

### Day 1-3: Chatbot AI Logic

Reference: `ai-chatbot-doc.md` Section 5 (AI Configuration & Prompts)

**System Prompt:**
- [ ] Create comprehensive system prompt (see `ai-chatbot-doc.md` Section 5.1)
- [ ] Context injection:
  - Page URL
  - User status (logged in, tier, AI model access)
  - Previous messages (last 10)
  - User profile (if logged in)

**Function Calling:**
- [ ] Search knowledge base (vector search)
- [ ] Get tool info (from database)
- [ ] Create lead (save to database + CRM)
- [ ] Create support ticket
- [ ] Check subscription (user's tier, usage limits)

**Implementation:**
- [ ] Claude API with function calling (see `ai-chatbot-doc.md` Section 5.3)
- [ ] Handle streaming responses
- [ ] Error handling
- [ ] Use Gemini for free tier users if chatbot is rate-limited

**Deliverable:** AI chatbot intelligent

---

### Day 4-5: Knowledge Base Integration

**Vector Search:**
- [ ] Install Pinecone or use pgvector
- [ ] Index help articles
- [ ] Embed articles (OpenAI embeddings)
- [ ] Search function: `searchKB(query)`
- [ ] Return top 3 relevant articles

**Testing:**
- [ ] Test search accuracy
- [ ] Test with sample questions

**Deliverable:** KB integration working

---

## Sprint 6.3: Lead Capture & CRM (Week 27)

### Day 1-2: Lead Capture

**Flow:**
- [ ] Bot asks for email at appropriate time
- [ ] Validate email format
- [ ] Save lead to database
- [ ] Send confirmation email

**Lead Qualification:**
- [ ] Ask qualifying questions (role, firm size, etc.)
- [ ] Calculate lead score
- [ ] Tag leads (hot, warm, cold)

**Deliverable:** Lead capture working

---

### Day 3-4: CRM Integration

**HubSpot Integration:**
- [ ] Install HubSpot SDK
- [ ] Get API key
- [ ] Push leads to HubSpot:
  - Contact info
  - Conversation transcript
  - Lead score
  - Source page

**Testing:**
- [ ] Test lead creation in HubSpot
- [ ] Verify data accuracy

**Deliverable:** CRM integration live

---

### Day 5: Escalation Logic

**Features:**
- [ ] Detect when to escalate (user asks for human)
- [ ] Create support ticket automatically
- [ ] Offer live chat (if available)
- [ ] Transfer conversation context

**Deliverable:** Escalation working

---

## Sprint 6.4: Deployment & Optimization (Week 28)

### Day 1-2: Multi-Page Deployment

**Deploy Widget:**
- [ ] Marketing site (frithai.com)
- [ ] User dashboard (app.frithai.com)
- [ ] Support site (support.frithai.com)

**Proactive Engagement:**
- [ ] Trigger after 30s on homepage
- [ ] Trigger after 15s on pricing
- [ ] Exit-intent on signup page

**Deliverable:** Widget live everywhere

---

### Day 3-4: Analytics & Optimization

**Track:**
- [ ] Conversations started
- [ ] Lead capture rate
- [ ] Conversion rate (signup/upgrade)
- [ ] Avg. conversation length
- [ ] Top questions

**Admin Dashboard:**
- [ ] Chatbot analytics page
- [ ] Live conversations (admin can monitor)
- [ ] Conversation history

**Deliverable:** Analytics tracking

---

### Day 5: Testing & Refinement

**Tasks:**
- [ ] Test all conversation flows
- [ ] Test lead capture
- [ ] Test escalation
- [ ] Test CRM sync
- [ ] Optimize prompts based on test results
- [ ] A/B test widget placement

**Deliverable:** Chatbot optimized

---

## Phase 6 Acceptance Criteria

- ✅ Chat widget deployed on all sites
- ✅ Real-time messaging working
- ✅ AI responses intelligent and helpful
- ✅ Knowledge base integration working
- ✅ Lead capture functional
- ✅ CRM integration (HubSpot) working
- ✅ Escalation to support tickets working
- ✅ Proactive engagement triggers set
- ✅ Analytics tracking conversations
- ✅ Admin can monitor live chats
- ✅ All tests passing

---

# PHASE 7: Advanced Features
**Timeline:** Weeks 29-32 (4 weeks)  
**Team:** Full team  
**Goal:** Workspaces, collaboration, integrations

Reference: `user-dashboard-complete.md` Sections 7, 10, 17

---

## Sprint 7.1: Full Multi-Tenant Implementation (Week 29)

Reference: Phase 0 multi-tenant schema design, `user-dashboard-complete.md` Section 7

**Goal:** Activate full multi-tenant features (organizations, workspaces, invitations, roles)

### Day 1-3: Organizations & Invitations

**Backend:**
- [ ] Organization management APIs (already in schema from Phase 0)
- [ ] Organization member invitation system:
  - [ ] `POST /api/organizations/[id]/invite` - Send invitation email
  - [ ] Invitation token (JWT, 7-day expiry)
  - [ ] `GET /api/invitations/[token]` - Accept invitation
- [ ] Role management (owner, admin, member, viewer)
- [ ] Billing tied to Organization (update Stripe integration)

**Frontend:**
- [ ] Organization settings page (`/dashboard/organization`)
- [ ] Invite members modal
- [ ] Pending invitations list
- [ ] Role management UI
- [ ] Organization switcher (if user belongs to multiple)

**Email:**
- [ ] Invitation email template (Resend)

**Deliverable:** Full organization management

---

### Day 4-5: Workspaces & Permissions

**Backend:**
- [ ] Workspace CRUD APIs (already in schema from Phase 0)
- [ ] WorkspaceMember management
- [ ] Granular permissions system:
  - Tool access (which tools can each role use)
  - Project access (who can view/edit projects)
  - Billing access (admins only)

**Frontend:**
- [ ] Workspace switcher (sidebar)
- [ ] Create workspace modal
- [ ] Workspace settings page
- [ ] Add members to workspace
- [ ] Permission configuration UI

**Testing:**
- [ ] Test multi-user scenarios
- [ ] Test role-based access control
- [ ] Test workspace isolation (data doesn't leak)

**Deliverable:** Full multi-tenant workspaces working

---

## Sprint 7.2: Team Collaboration (Week 30, Days 1-2)

Reference: `user-dashboard-complete.md` Section 17 (Collaboration Features)

**Features:**
- [ ] Share tool outputs with team members
- [ ] Comment threads on outputs
- [ ] @mentions in comments (trigger notifications)
- [ ] Activity feed per workspace (who did what, when)
- [ ] Live collaboration indicators ("Sarah is viewing this output")

**Backend:**
- [ ] Comments model (if not exists)
- [ ] Notifications model
- [ ] Real-time updates (WebSocket via Socket.io)
- [ ] Permission checks (can user view this output?)

**Frontend:**
- [ ] Comment component with rich text
- [ ] @mention autocomplete
- [ ] Notification dropdown (bell icon)
- [ ] Activity feed component

**Deliverable:** Team collaboration functional

---

### Day 3-5: Enhanced Projects

**Features:**
- [ ] Upload documents to project
- [ ] Project tabs:
  - Overview
  - Documents
  - Tool Runs
  - Notes & Comments
  - Tasks (optional)
- [ ] Project sharing (public links)
- [ ] Project templates

**Backend:**
- [ ] File upload (Vercel Blob or S3)
- [ ] ProjectDocument model
- [ ] Sharing logic

**Deliverable:** Enhanced projects

---

## Sprint 7.3: Document Management (Week 31, Day 1)

**Features:**
- [ ] Document viewer (PDF, DOCX)
- [ ] Version control (track changes)
- [ ] Document comparison (diff view)

**Libraries:**
- [ ] PDF.js for PDF viewing
- [ ] Mammoth.js for DOCX

**Deliverable:** Document management

---

## Sprint 7.4: Integrations (Week 31, Days 2-5)

### Day 2-3: Microsoft Word Add-in

**Create:**
- [ ] Word add-in manifest
- [ ] Add-in UI (task pane)
- [ ] Features:
  - Send selected text to Frith AI
  - Run tool
  - Insert result into document

**Testing:**
- [ ] Test on Windows/Mac
- [ ] Test with Word Online

**Deliverable:** Word add-in (MVP)

---

### Day 4: Clio Integration

**Integration:**
- [ ] Connect to Clio API
- [ ] OAuth flow
- [ ] Sync matters as projects
- [ ] Save tool outputs to Clio documents

**Backend:**
- [ ] Clio API wrapper
- [ ] Sync service

**Deliverable:** Clio integration

---

### Day 5: Zapier Integration

**Setup:**
- [ ] Create Zapier app
- [ ] Triggers:
  - New tool run
  - Tool run completed
- [ ] Actions:
  - Run tool
  - Create project

**Testing:**
- [ ] Test common Zaps

**Deliverable:** Zapier integration

---

## Sprint 7.5: Advanced AI Features (Week 32)

### Day 1-2: Tool Chaining (Workflows)

**Feature:**
- [ ] Run multiple tools in sequence
- [ ] Visual workflow builder (drag-and-drop)
- [ ] Pass output of Tool A to input of Tool B

**Example:**
- Upload contract → Analyze → Extract risks → Draft response

**Deliverable:** Tool chaining (basic)

---

### Day 3: Scheduled Runs

**Feature:**
- [ ] Schedule tool to run at specific time
- [ ] Recurring schedules (daily, weekly)
- [ ] Email results

**Backend:**
- [ ] Job queue (BullMQ or similar)
- [ ] Cron-like scheduler

**Deliverable:** Scheduled runs

---

### Day 4-5: Bulk Processing

**Feature:**
- [ ] Upload multiple files (ZIP)
- [ ] Run same tool on all files
- [ ] Background processing
- [ ] Email when complete
- [ ] Download results as ZIP

**Backend:**
- [ ] Background job processing
- [ ] Progress tracking

**Deliverable:** Bulk processing

---

## Phase 7 Acceptance Criteria

- ✅ **Full multi-tenant system operational:**
  - ✅ Organizations with multiple members
  - ✅ Invitation system working (email invites, role assignment)
  - ✅ Role-based permissions enforced
  - ✅ Billing tied to organizations
- ✅ Workspaces functional with granular permissions
- ✅ Team collaboration (share, comment, @mention, notifications)
- ✅ Enhanced projects with document uploads
- ✅ Document management (viewer, versions)
- ✅ Microsoft Word add-in working
- ✅ Clio integration functional
- ✅ Zapier app published
- ✅ Tool chaining (workflows) basic version
- ✅ Scheduled runs working
- ✅ Bulk processing functional
- ✅ All features tested with multi-user scenarios

---

# PHASE 8: Testing & QA
**Timeline:** Weeks 33-36 (4 weeks)  
**Team:** QA Engineer (lead), all developers  
**Goal:** Comprehensive testing and bug fixes

---

## Sprint 8.1: Functional Testing (Week 33)

### Test Coverage

**Authentication:**
- [ ] Sign up, email verification, sign in
- [ ] Password reset, 2FA (if built)
- [ ] Session management, logout

**User Dashboard:**
- [ ] All 20 tools execute correctly
- [ ] Output export (DOCX, PDF)
- [ ] History, favorites, templates
- [ ] Projects, workspaces
- [ ] Settings, billing

**Admin Dashboard:**
- [ ] User management (CRUD)
- [ ] Tool management
- [ ] Support tickets
- [ ] Analytics
- [ ] Audit logs

**Support:**
- [ ] Help center search
- [ ] Ticket submission
- [ ] Email notifications

**Chatbot:**
- [ ] Conversations
- [ ] Lead capture
- [ ] CRM sync
- [ ] Escalation

**Create Test Cases:**
- [ ] 200+ test cases covering all features
- [ ] Manual testing initially
- [ ] Document bugs in GitHub Issues

**Deliverable:** Test report with bugs

---

## Sprint 8.2: Security Audit (Week 34)

### Security Testing

**Authentication:**
- [ ] Password hashing (bcrypt, 12 rounds)
- [ ] Session security (httpOnly cookies, CSRF tokens)
- [ ] Rate limiting (login, signup, API)
- [ ] Brute force protection (account lockout)

**Authorization:**
- [ ] Role-based access (user, admin, super_admin)
- [ ] **Multi-tenant isolation:** Verify users can't access other orgs' data
- [ ] API endpoint protection (auth middleware)
- [ ] Impersonation logging (audit trail)

**Data Protection:**
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (sanitized inputs, Content Security Policy)
- [ ] CSRF tokens on forms
- [ ] Sensitive data masking (admin logs, API responses)
- [ ] **AI data privacy:** Verify prompts/outputs encrypted in transit and at rest

**API Security:**
- [ ] Rate limiting on all endpoints (per user, per IP)
- [ ] Input validation (Zod schemas everywhere)
- [ ] API key security (environment variables, never logged)
- [ ] **AI API keys:** Anthropic, Google keys secured

**Compliance:**
- [ ] GDPR: Data export, right to deletion, consent management
- [ ] CCPA compliance
- [ ] Terms, Privacy Policy legally reviewed
- [ ] **AI-specific:** Verify compliance with Anthropic and Google data policies

**Multi-Tenant Security:**
- [ ] Test workspace isolation (user A can't see user B's projects)
- [ ] Test organization isolation (org 1 can't access org 2 data)
- [ ] Test role enforcement (members can't access admin functions)

**External Audit (Recommended):**
- [ ] Hire security firm for penetration test
- [ ] Fix all high/critical vulnerabilities before launch

**Deliverable:** Security audit report with all vulnerabilities fixed

---

## Sprint 8.3: Performance Optimization + AI Regression Testing (Week 35)

### Performance Testing

**Load Testing:**
- [ ] Use k6 or Artillery
- [ ] Simulate 1,000 concurrent users
- [ ] Test tool execution under load
- [ ] Test database queries

**Frontend Performance:**
- [ ] Lighthouse scores 95+ on all pages
- [ ] Optimize images (WebP, lazy loading)
- [ ] Code splitting, tree shaking
- [ ] Bundle size < 200KB (initial load)

**Backend Performance:**
- [ ] Database query optimization (indexes)
- [ ] API response times < 200ms (p95)
- [ ] Caching (Redis for frequent queries)

**AI Performance:**
- [ ] Tool execution < 10s (p95)
- [ ] Streaming to reduce perceived latency
- [ ] Retry logic for API failures (exponential backoff)

**AI Regression Testing:**

Reference: Evaluation framework from Phase 3 Sprint 3.2

- [ ] **Run full evaluation suite on all 20 MVP tools:**
  - [ ] Verify accuracy hasn't degraded since Phase 3
  - [ ] Test with current AI models (check for model version updates)
  - [ ] Compare scores to Phase 3 baseline
  - [ ] Flag any tools that dropped below quality threshold
- [ ] **Update benchmark datasets** if needed (add edge cases discovered during beta)
- [ ] **Document evaluation results:**
  - [ ] Which tools passed/failed
  - [ ] Any prompt adjustments needed
  - [ ] Performance vs Phase 3 baseline
- [ ] **Re-test with production API keys** (switch from test to live)

**Quality Gate:** All 20 MVP tools must pass evaluation before public launch.

**Deliverable:** Performance report + optimizations + AI quality assurance report

---

## Sprint 8.4: Bug Fixes & Polish (Week 36)

### Bug Fixing

**Priority 1 (Critical):**
- [ ] Security vulnerabilities
- [ ] Payment issues
- [ ] Data loss bugs
- [ ] Authentication failures

**Priority 2 (High):**
- [ ] Tool execution errors
- [ ] UI breaking bugs
- [ ] Email failures
- [ ] Integration errors

**Priority 3 (Medium):**
- [ ] UI polish issues
- [ ] Mobile responsiveness
- [ ] Minor UX improvements

**Priority 4 (Low):**
- [ ] Nice-to-have features
- [ ] Future enhancements

**Process:**
- [ ] Fix all P1/P2 bugs before launch
- [ ] P3/P4 can be post-launch

**UI Polish:**
- [ ] Consistent spacing, colors
- [ ] Smooth animations
- [ ] Helpful error messages
- [ ] Loading states everywhere

**Deliverable:** Bug-free platform

---

## Phase 8 Acceptance Criteria

- ✅ 200+ test cases executed, documented
- ✅ All P1/P2 bugs fixed
- ✅ Security audit passed (including multi-tenant isolation tests)
- ✅ **AI regression testing passed:**
  - ✅ All 20 MVP tools meet quality thresholds
  - ✅ No degradation from Phase 3 baseline
  - ✅ Evaluation framework validated for Phase 11 use
- ✅ Performance targets met (Lighthouse 95+, API <200ms)
- ✅ Load testing passed (1,000 concurrent users)
- ✅ Cross-browser compatibility (Chrome, Safari, Firefox)
- ✅ Mobile responsive on all pages
- ✅ Accessibility audit (WCAG 2.1 AA)
- ✅ All email templates tested
- ✅ Payment flow tested (Stripe test mode → production)
- ✅ Multi-tenant features tested (organizations, workspaces, invitations)
- ✅ Ready for beta launch

---

# PHASE 9: Beta Launch
**Timeline:** Week 37 (1 week)  
**Team:** Full team + Marketing  
**Goal:** Soft launch to 100 beta users, gather feedback

---

## Sprint 9.1: Beta Preparation

### Day 1: Pre-Launch Checklist

**Infrastructure:**
- [ ] Production database backed up
- [ ] Environment variables configured (production)
- [ ] SSL certificates active
- [ ] CDN configured
- [ ] Error tracking (Sentry) active
- [ ] Monitoring (BetterStack) configured
- [ ] Status page updated

**Content:**
- [ ] All marketing pages finalized
- [ ] Help center articles reviewed
- [ ] Legal pages reviewed (terms, privacy)
- [ ] Blog posts scheduled

**Testing:**
- [ ] Final smoke test in production
- [ ] Test payment (real card in test mode)
- [ ] Test emails (production Resend)

**Deliverable:** Pre-launch ready

---

### Day 2: Beta User Recruitment

**Recruit 100 Beta Users:**
- [ ] Invite via:
  - Personal network
  - LinkedIn
  - Legal tech communities
  - Law school professors
  - Bar associations
- [ ] Offer incentives:
  - Free Professional plan (3 months)
  - Early adopter badge
  - Direct line to founders

**Onboarding:**
- [ ] Send welcome email with instructions
- [ ] Schedule onboarding calls (optional)

**Deliverable:** 100 beta users signed up

---

### Day 3-5: Beta Launch

**Launch Day:**
- [ ] Announce on social media
- [ ] Send emails to beta users
- [ ] Monitor closely:
  - User signups
  - Tool executions
  - Errors (Sentry)
  - Performance (Vercel)
  - Support tickets

**Daily Standups:**
- [ ] Review metrics
- [ ] Fix critical bugs immediately
- [ ] Answer support tickets < 4 hours

**Feedback Collection:**
- [ ] In-app feedback widget
- [ ] Survey after 7 days
- [ ] 1-on-1 user interviews (10 users)

**Deliverable:** Beta launch complete

---

### Day 6-7: Iteration

**Analyze Feedback:**
- [ ] Common issues/complaints
- [ ] Feature requests
- [ ] UI/UX improvements
- [ ] Tool accuracy concerns

**Quick Fixes:**
- [ ] Fix critical bugs
- [ ] Improve tool prompts
- [ ] UI tweaks

**Deliverable:** Feedback incorporated

---

## Phase 9 Acceptance Criteria

- ✅ 100 beta users onboarded
- ✅ Platform stable (< 1% error rate)
- ✅ Users successfully running tools
- ✅ Payment flow working
- ✅ Support tickets responded to < 4 hours
- ✅ Feedback collected (survey responses, interviews)
- ✅ Critical bugs fixed
- ✅ Ready for public launch

---

# PHASE 10: Public Launch
**Timeline:** Weeks 38-40 (3 weeks)  
**Team:** Full team + Marketing  
**Goal:** Full platform launch with marketing push

---

## Sprint 10.1: Launch Preparation (Week 38)

### Marketing Campaign

**Content:**
- [ ] Launch announcement blog post
- [ ] Press release
- [ ] Social media posts (scheduled)
- [ ] Email to waitlist (if any)
- [ ] Product Hunt launch page
- [ ] LinkedIn posts

**Ads:**
- [ ] Google Ads campaigns (search)
- [ ] LinkedIn Ads (legal professionals)
- [ ] Facebook/Instagram (optional)

**Partnerships:**
- [ ] Reach out to legal tech influencers
- [ ] Guest posts on legal blogs
- [ ] Podcast interviews

**Deliverable:** Marketing campaign ready

---

### Launch Infrastructure

**Scaling:**
- [ ] Upgrade Vercel plan (if needed)
- [ ] Upgrade Neon plan (if needed)
- [ ] Monitor API rate limits (Claude, Gemini)
- [ ] Set up auto-scaling (if possible)

**Monitoring:**
- [ ] Double-check all monitoring
- [ ] Set up alerts (Slack/email)
- [ ] 24/7 on-call rotation (team)

**Deliverable:** Infrastructure ready for traffic

---

## Sprint 10.2: Launch Week (Week 39)

### Day 1: Launch Day

**Go Live:**
- [ ] Remove beta badge
- [ ] Open signups to everyone
- [ ] Publish launch blog post
- [ ] Send press release
- [ ] Post on Product Hunt
- [ ] Post on social media (Twitter, LinkedIn)

**Monitor:**
- [ ] Traffic (Google Analytics)
- [ ] Signups
- [ ] Tool runs
- [ ] Errors
- [ ] Server load

**Team Availability:**
- [ ] All hands on deck (respond to support tickets, fix bugs)

**Deliverable:** Launch day successful

---

### Day 2-5: Post-Launch Support

**Daily Tasks:**
- [ ] Monitor metrics
- [ ] Fix bugs as they arise
- [ ] Respond to support tickets (< 4 hours)
- [ ] Engage on social media (respond to comments)
- [ ] Publish follow-up blog posts

**Marketing:**
- [ ] Continue ad campaigns
- [ ] Share user testimonials
- [ ] Post case studies (if any)

**Deliverable:** Stable post-launch

---

### Day 6-7: Retrospective

**Team Meeting:**
- [ ] Review launch metrics
- [ ] What went well?
- [ ] What went wrong?
- [ ] Lessons learned
- [ ] Next priorities

**Deliverable:** Launch retrospective

---

## Sprint 10.3: Post-Launch Iteration (Week 40)

### Analyze Metrics

**Key Metrics (First Week):**
- [ ] Total signups: Target 500+
- [ ] Free → Paid conversion: Target 2-5%
- [ ] Tool runs per user: Target 5+
- [ ] Error rate: Target < 1%
- [ ] User retention (Day 7): Target 40%+

**User Feedback:**
- [ ] Review support tickets (common issues)
- [ ] Review feedback form submissions
- [ ] Survey users (NPS score)

**Deliverable:** Metrics report

---

### Prioritize Improvements

**Fix Issues:**
- [ ] Bugs reported by users
- [ ] Performance bottlenecks
- [ ] Tool accuracy improvements

**Quick Wins:**
- [ ] UI polish based on feedback
- [ ] Additional help articles
- [ ] Tool prompt refinements

**Deliverable:** Improvement backlog

---

## Phase 10 Acceptance Criteria

- ✅ Public launch completed
- ✅ Marketing campaign executed
- ✅ 500+ users signed up (first week)
- ✅ Platform stable (< 1% error rate)
- ✅ Support tickets managed (< 4 hour response)
- ✅ Metrics tracking and reported
- ✅ User feedback analyzed
- ✅ Improvement priorities set
- ✅ Team ready for next phase
- ✅ Git repository clean (no secrets, no large files)
- ✅ GitHub repository protected (branch protection rules enabled)
- ✅ All production code merged to `main` branch

---

# PHASE 11: Scale & Enhance
**Timeline:** Months 10-18 (9 months)  
**Team:** Expanding team  
**Goal:** Complete platform with all 240 tools, enterprise features, mobile apps

---

## Month 10-12: Tools Expansion

Reference: Tool priority waves defined in Phase 3 Sprint 3.1

### Build Remaining 220 Tools (Waves 1-2)

**Wave 1 (Months 10-11): Next 50 Tools**
- [ ] High-demand categories from user feedback and `ai-agents.md`:
  - Litigation Support (remaining tools)
  - Contract Drafting (remaining tools)
  - Legal Research (remaining tools)
  - Due Diligence (remaining tools)
- [ ] Process per tool:
  - [ ] Get spec from Phase 3 Sprint 3.1 priority list
  - [ ] Create prompt template
  - [ ] **Run through evaluation harness** (reuse from Phase 3)
  - [ ] Test with AI models (Gemini, Haiku, Sonnet, Opus)
  - [ ] Verify meets quality threshold
  - [ ] Build custom UI (if needed)
  - [ ] Create help article
  - [ ] Deploy to production
- [ ] Build 25 tools per month (6-7 per week)

**Wave 2 (Month 12): Next 70 Tools**
- [ ] Specialized practice areas from `ai-agents.md`:
  - IP & Patents
  - Medical-Legal
  - Cybersecurity & Privacy
  - International & Cross-Border
  - Financial & Forensic
- [ ] Same process as Wave 1

**Quality Assurance:**
- [ ] **Reuse evaluation framework from Phase 3** for all new tools
- [ ] Automated accuracy testing before deployment
- [ ] User feedback loop (track ratings, iterate on low-scoring tools)
- [ ] A/B test prompts if quality below threshold

**Deliverable:** 140 tools total (20 MVP + 120 new)

---

## Month 13-15: Enterprise Features + Tools Expansion (Waves 3-4)

### Tools Expansion (Continued)

**Wave 3 (Months 13-14): Next 70 Tools**
- [ ] Advanced and niche tools from `ai-agents.md`:
  - Alternative Legal Services
  - Legal Education & Training
  - Crisis Management
  - Specialized Niche (Cannabis, Crypto, Aviation, Maritime, etc.)
- [ ] Same evaluation process

**Wave 4 (Month 15): Final 30 Tools**
- [ ] Experimental and emerging areas from `ai-agents.md`:
  - Legal Metaverse
  - Deepfake Detection
  - Blockchain Smart Contracts
  - AI Ethics
- [ ] Higher risk tolerance (experimental features)
- [ ] Beta tag on these tools

**Deliverable:** All 240+ tools complete and evaluated

### Features

**SSO (Single Sign-On):**
- [ ] SAML 2.0 integration
- [ ] OAuth integration
- [ ] Azure AD, Okta support

**Advanced Security:**
- [ ] IP whitelisting
- [ ] Audit logs (enhanced)
- [ ] Custom data retention policies

**Custom Branding:**
- [ ] White-label options
- [ ] Custom domain (e.g., ai.lawfirm.com)
- [ ] Custom logo, colors

**Advanced Analytics:**
- [ ] Custom reports
- [ ] Data export (all user data)
- [ ] API usage dashboards

**Deliverable:** Enterprise-ready features

---

## Month 16-18: Mobile & Advanced Integrations + Community Features

### Mobile Apps

**iOS App:**
- [ ] React Native or native Swift
- [ ] Core features: Browse tools, run tools, view history
- [ ] Push notifications

**Android App:**
- [ ] React Native or native Kotlin
- [ ] Same features as iOS

**Deliverable:** Mobile apps published

---

### Advanced Integrations

**More Integrations:**
- [ ] Google Docs
- [ ] iManage DMS
- [ ] NetDocuments
- [ ] Slack
- [ ] Microsoft Teams

**API Marketplace:**
- [ ] Allow third-party developers to build tools
- [ ] API documentation
- [ ] SDK (JavaScript, Python)

**Deliverable:** Advanced integrations

---

### Community Features (Optional - Month 17-18)

Reference: Deferred from Phase 5

**Decision Point:** Evaluate if ready to launch community features based on:
- User base size (recommend >5,000 users)
- Support ticket volume (if >100/day, live chat justified)
- Community engagement (forum requests from users)

**If launching:**

**Community Forum** (`community.frithai.com`):
- [ ] Forum software (Discourse or custom)
- [ ] Categories: General, Tips & Tricks, Feature Requests, Bug Reports
- [ ] Moderation system (admins + community moderators)
- [ ] Integration with main platform (SSO)

**Human Live Chat:**
- [ ] Live chat software (Intercom, Zendesk Chat)
- [ ] Hire support team (2-3 agents)
- [ ] Business hours coverage
- [ ] Handoff from AI chatbot to human
- [ ] SLA: < 5 min response time during business hours

**If deferring:**
- Document in roadmap as post-18-month priority
- Continue with AI chatbot + ticket system

**Deliverable:** Community features (if launched) or decision documented

---

## Phase 11 Acceptance Criteria

- ✅ **All 240 tools built, evaluated, and deployed:**
  - ✅ All tools meet quality thresholds (per evaluation framework)
  - ✅ Evaluation framework used for all 220 new tools
  - ✅ Tool catalog aligned with `ai-agents.md`
- ✅ Enterprise features complete (SSO, SCIM, custom branding)
- ✅ Mobile apps published (iOS, Android)
- ✅ Advanced integrations working (10+ services)
- ✅ API marketplace launched (if planned)
- ✅ **Community forum and/or live chat** (if launched, or decision documented)
- ✅ Platform scaled to 10,000+ users
- ✅ **Pricing tiers stable and aligned** with `pricing-model.md`
- ✅ **AI cost monitoring showing profitability** (70%+ margins maintained)
- ✅ Ready for Series A fundraising (if applicable)

---

# Post-Launch: Ongoing Operations

## Monthly Responsibilities

**Product Team:**
- [ ] Release new tools (5-10 per month)
- [ ] Gather user feedback
- [ ] Prioritize features (roadmap)
- [ ] Monitor metrics (DAU, retention, churn)

**Engineering Team:**
- [ ] Fix bugs (weekly sprint)
- [ ] Performance monitoring
- [ ] Security patches
- [ ] Infrastructure maintenance

**Support Team:**
- [ ] Respond to tickets (SLA: < 4 hours)
- [ ] Update help articles
- [ ] Create video tutorials
- [ ] Collect feedback

**Marketing Team:**
- [ ] Content marketing (2-3 blog posts/week)
- [ ] SEO optimization
- [ ] Paid ads campaigns
- [ ] Partnerships & outreach

**Sales Team (Enterprise):**
- [ ] Demo calls
- [ ] Contract negotiations
- [ ] Onboarding enterprise clients
- [ ] Upselling

---

# Success Metrics (Platform KPIs)

## User Acquisition
- **Goal:** 10,000 users by Month 12
- **Metric:** New signups per month
- **Target:** 500/month (Month 3) → 1,500/month (Month 12)

## Activation
- **Goal:** 80% of users run at least one tool
- **Metric:** % users who complete onboarding
- **Target:** 80% within 24 hours of signup

## Engagement
- **Goal:** 5+ tool runs per user per week
- **Metric:** Avg. tool runs per active user
- **Target:** 5+ (indicates value)

## Retention
- **Goal:** 40%+ Day 7 retention, 25%+ Day 30
- **Metric:** % users who return after X days
- **Target:** D7: 40%, D30: 25%, D90: 15%

## Conversion
- **Goal:** 5% free → paid conversion
- **Metric:** % free users who upgrade
- **Target:** 2% (Month 1) → 5% (Month 6)

## Revenue
- **Goal:** $100K MRR by Month 12
- **Metric:** Monthly Recurring Revenue
- **Target:** $5K (Month 3) → $50K (Month 9) → $100K (Month 12)

## Customer Satisfaction
- **Goal:** NPS score 50+
- **Metric:** Net Promoter Score
- **Target:** Survey quarterly, target 50+

---

# Risk Management

## Potential Risks & Mitigation

**1. AI API Costs Spiral**
- **Risk:** Costs exceed projections
- **Mitigation:** Monitor daily, set spending alerts, optimize prompts, cache responses

**2. User Adoption Lower Than Expected**
- **Risk:** Few signups or low engagement
- **Mitigation:** Aggressive marketing, referral program, improve onboarding, add more tools

**3. Security Breach**
- **Risk:** User data compromised
- **Mitigation:** Regular security audits, penetration testing, bug bounty program, insurance

**4. Legal/Compliance Issues**
- **Risk:** Lawsuits, GDPR violations
- **Mitigation:** Legal review of terms/privacy, compliance audits, insurance

**5. Technical Failures (Downtime)**
- **Risk:** Platform goes down, users can't access
- **Mitigation:** Monitoring, auto-scaling, multi-region deployment, incident response plan

**6. Competitor Launches Similar Product**
- **Risk:** Lose market share
- **Mitigation:** Speed to market, more tools (240 vs 10-20), better UX, aggressive pricing

**7. AI Model Provider Issues (Anthropic, Google)**
- **Risk:** API downtime, price increases, terms change
- **Mitigation:** Multi-provider strategy, contract negotiations, fallback models

---

# Budget Estimates

## Development Costs (6-Month MVP)

**Team Salaries (6 months):**
- Tech Lead: $120K/year × 0.5 = $60K
- Frontend Engineers (2): $100K/year × 2 × 0.5 = $100K
- Backend Engineers (2): $100K/year × 2 × 0.5 = $100K
- Designer: $90K/year × 0.5 = $45K
- QA Engineer: $80K/year × 0.5 = $40K
- **Total: $345K**

**Infrastructure (6 months):**
- Vercel (Pro): $20/month × 6 = $120
- Neon (Scale): $50/month × 6 = $300
- Anthropic API: $500/month × 6 = $3,000
- Google AI: $100/month × 6 = $600
- Resend: $20/month × 6 = $120
- Sentry: $25/month × 6 = $150
- Misc (domain, SSL, monitoring): $50/month × 6 = $300
- **Total: $4,590**

**Third-Party Services:**
- Stripe (no upfront cost)
- HubSpot (free tier initially)
- Calendly (free tier)

**Total MVP Cost: ~$350K**

---

## Ongoing Costs (Monthly, Post-Launch)

**Infrastructure:**
- Vercel: $100/month (scaled)
- Neon: $200/month
- AI APIs (1,000 users): $5,000/month
- Email (Resend): $50/month
- Monitoring & misc: $100/month
- **Total: ~$5,450/month**

**Team (Ongoing):**
- Salaries (full team): ~$60K/month
- **Total: ~$65K/month all-in**

**Break-Even:**
- Need $65K MRR to break even
- At $199 avg. per user: 327 paid users

---

# Conclusion

This roadmap provides a complete, actionable plan to build Frith AI from 0 to 100%. By following these phases sequentially, the team will deliver:

✅ **Weeks 1-2:** Foundation (Phase 0)  
✅ **Weeks 3-6:** Core Infrastructure (Phase 1)  
✅ **Weeks 7-10:** Marketing Site (Phase 2)  
✅ **Weeks 11-16:** User Dashboard MVP with 20 tools (Phase 3)  
✅ **Weeks 17-20:** Admin Dashboard (Phase 4)  
✅ **Weeks 21-24:** Support System (Phase 5)  
✅ **Weeks 25-28:** AI Chatbot (Phase 6)  
✅ **Weeks 29-32:** Advanced Features (Phase 7)  
✅ **Weeks 33-36:** Testing & QA (Phase 8)  
✅ **Week 37:** Beta Launch (Phase 9)  
✅ **Weeks 38-40:** Public Launch (Phase 10)  
✅ **Months 10-18:** Scale & Enhance (Phase 11)

**Total Timeline to MVP Public Launch: ~9-10 months**  
**Total Timeline to Full Platform (240 tools): 18 months**

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Status:** Ready for Execution  
**Next Steps:** Kick off Phase 0 with team alignment meeting

---

**Good luck building Frith AI! 🚀**
