# FRITH AI - PHASE 14: MARKETPLACE, ECOSYSTEM & API PLATFORM

**From AI Tool Platform to Industry-Leading Legal ERP**  
**Version:** 3.0  
**Timeline:** Months 35-38 (16 weeks)  
**Goal:** Build partner ecosystem, marketplace, and developer platform

---

## DESIGN SYSTEM REQUIREMENTS

### Color Scheme (MANDATORY)

**Primary Colors:**
- **Deep Black:** `#000000` - Primary background color
- **Deep White:** `#FFFFFF` - Primary element/font color

**Application Rules:**
- All UI surfaces must use deep black background with white elements
- Dark/Light mode toggle switches between black/white backgrounds
- No accent colors on core UI (landing page, dashboards, support center)

---

## EXECUTIVE SUMMARY

Phase 14 transforms FRITH from a standalone platform into an ecosystem. This phase builds the infrastructure for third-party developers, partners, and integrations to extend the platform's capabilities.

**Key Deliverables:**
- App Marketplace (third-party integrations)
- Developer Portal with comprehensive documentation
- Partner Program infrastructure
- Template & Form Marketplace
- Revenue sharing and billing infrastructure
- Community features

---

## SPRINT 14.1: APP MARKETPLACE
**Timeline:** Weeks 1-6 (Months 35-36)  
**Team:** Backend (2), Frontend (2), DevOps (1)

---

### Session 14.1.1: Marketplace Infrastructure
**Timeline:** Weeks 1-3  
**Owner:** Backend Lead + Frontend Lead

#### Deliverables

**D-14.1.1.1: App Listing System**
- [ ] App submission workflow
- [ ] App review process
- [ ] App versioning
- [ ] App categories (integrations, AI tools, templates, utilities)
- [ ] App search and discovery
- [ ] Featured apps
- [ ] App ratings and reviews

**D-14.1.1.2: App Installation**
- [ ] One-click installation
- [ ] Permission requests (OAuth scopes)
- [ ] Configuration wizard
- [ ] App settings management
- [ ] Uninstallation with data cleanup

**D-14.1.1.3: App Types**
- [ ] **Integrations:** Connect to external services
- [ ] **AI Tools:** Custom AI-powered tools
- [ ] **Widgets:** Dashboard widgets
- [ ] **Themes:** UI customization
- [ ] **Workflows:** Pre-built automation

**D-14.1.1.4: Marketplace UI**
- [ ] Browse marketplace
- [ ] App detail pages
- [ ] Installation flow
- [ ] Installed apps management
- [ ] App settings

#### Database Schema

```prisma
model MarketplaceApp {
  id              String   @id @default(uuid())
  developerId     String   // Developer organization ID
  
  // App Info
  appName         String
  appSlug         String   @unique
  shortDescription String
  fullDescription String   @db.Text
  
  // Categorization
  category        String   // integration, ai_tool, widget, theme, workflow
  subcategory     String?
  tags            String[]
  
  // Branding
  iconUrl         String
  screenshotUrls  String[]
  videoUrl        String?
  
  // Pricing
  pricingType     String   // free, paid, freemium
  price           Decimal? @db.Decimal(10, 2)
  pricingPeriod   String?  // monthly, yearly, one_time
  trialDays       Int?
  
  // Technical
  appType         String   // oauth, webhook, iframe, native
  manifestUrl     String?
  webhookUrl      String?
  oauthConfig     Json?
  permissions     String[] // Required permissions
  
  // Requirements
  minPlanRequired String?  // Minimum Frith plan required
  
  // Status
  status          String   @default("draft") // draft, pending_review, approved, rejected, published, suspended
  reviewNotes     String?
  publishedAt     DateTime?
  
  // Metrics
  installCount    Int      @default(0)
  activeInstalls  Int      @default(0)
  avgRating       Decimal? @db.Decimal(2, 1)
  reviewCount     Int      @default(0)
  
  // Versioning
  currentVersion  String
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  developer    Organization @relation(fields: [developerId], references: [id])
  versions     AppVersion[]
  installations AppInstallation[]
  reviews      AppReview[]
}

model AppVersion {
  id          String   @id @default(uuid())
  appId       String
  
  version     String   // Semantic versioning: 1.0.0
  changelog   String?
  
  // Technical
  manifestUrl String?
  
  // Status
  status      String   @default("draft") // draft, pending_review, approved, published
  
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  
  app MarketplaceApp @relation(fields: [appId], references: [id])
  
  @@unique([appId, version])
}

model AppInstallation {
  id              String   @id @default(uuid())
  appId           String
  organizationId  String
  
  // Installation
  installedVersion String
  installedBy     String
  installedAt     DateTime @default(now())
  
  // Configuration
  config          Json?
  
  // OAuth tokens (if OAuth app)
  accessToken     String?  // Encrypted
  refreshToken    String?  // Encrypted
  tokenExpiresAt  DateTime?
  
  // Status
  status          String   @default("active") // active, suspended, uninstalled
  uninstalledAt   DateTime?
  uninstalledBy   String?
  
  // Trial
  trialEndsAt     DateTime?
  
  updatedAt       DateTime @updatedAt
  
  app          MarketplaceApp @relation(fields: [appId], references: [id])
  organization Organization   @relation(fields: [organizationId], references: [id])
  
  @@unique([appId, organizationId])
}

model AppReview {
  id          String   @id @default(uuid())
  appId       String
  userId      String
  organizationId String
  
  rating      Int      // 1-5
  title       String?
  review      String?
  
  // Response
  developerResponse String?
  respondedAt DateTime?
  
  isVerified  Boolean  @default(false) // Verified installation
  isHidden    Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  app  MarketplaceApp @relation(fields: [appId], references: [id])
  user User          @relation(fields: [userId], references: [id])
  
  @@unique([appId, userId])
}
```

#### API Endpoints

```
# Marketplace Browse
GET    /api/marketplace/apps                  - List apps
GET    /api/marketplace/apps/:slug            - Get app details
GET    /api/marketplace/apps/:slug/reviews    - Get app reviews
GET    /api/marketplace/categories            - List categories
GET    /api/marketplace/featured              - Get featured apps

# Installation
POST   /api/marketplace/apps/:slug/install    - Install app
DELETE /api/marketplace/apps/:slug/uninstall  - Uninstall app
GET    /api/marketplace/installed             - List installed apps
PATCH  /api/marketplace/installed/:appId/config - Update app config

# Reviews
POST   /api/marketplace/apps/:slug/reviews    - Submit review
PATCH  /api/marketplace/apps/:slug/reviews/:id - Update review
DELETE /api/marketplace/apps/:slug/reviews/:id - Delete review

# Developer (for app developers)
POST   /api/marketplace/developer/apps        - Submit app
GET    /api/marketplace/developer/apps        - List my apps
PATCH  /api/marketplace/developer/apps/:id    - Update app
POST   /api/marketplace/developer/apps/:id/versions - Submit new version
POST   /api/marketplace/developer/apps/:id/publish - Request publish
```

#### Acceptance Criteria
- [ ] App installation < 10 seconds
- [ ] Marketplace search returns results < 1 second
- [ ] OAuth flow completes successfully
- [ ] App permissions enforced correctly
- [ ] UI follows deep black/white color scheme

---

### Session 14.1.2: Developer Portal
**Timeline:** Weeks 4-6  
**Owner:** Backend Lead + Technical Writer

#### Deliverables

**D-14.1.2.1: Developer Documentation**
- [ ] Getting started guide
- [ ] API reference (auto-generated from OpenAPI)
- [ ] Authentication guide
- [ ] Webhooks documentation
- [ ] SDK documentation
- [ ] Code samples
- [ ] Tutorials

**D-14.1.2.2: Developer Console**
- [ ] App management dashboard
- [ ] API key management
- [ ] Webhook configuration
- [ ] Analytics (API usage, installs)
- [ ] Sandbox environment
- [ ] Testing tools

**D-14.1.2.3: SDKs**
- [ ] JavaScript/TypeScript SDK
- [ ] Python SDK
- [ ] .NET SDK (for legal tech)
- [ ] SDK documentation
- [ ] SDK examples

**D-14.1.2.4: Developer Support**
- [ ] Developer forum
- [ ] Support tickets for developers
- [ ] Office hours / Q&A sessions
- [ ] Developer newsletter

#### Database Schema

```prisma
model DeveloperAccount {
  id              String   @id @default(uuid())
  organizationId  String   @unique
  
  // Developer Info
  developerName   String
  developerEmail  String
  website         String?
  
  // Verification
  isVerified      Boolean  @default(false)
  verifiedAt      DateTime?
  
  // Agreement
  agreedToTerms   Boolean  @default(false)
  agreedAt        DateTime?
  
  // Payout
  payoutMethod    String?  // stripe, paypal, bank_transfer
  payoutDetails   Json?    // Encrypted
  
  // Status
  status          String   @default("active") // active, suspended
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
}

model SandboxEnvironment {
  id              String   @id @default(uuid())
  developerId     String
  
  // Sandbox
  sandboxName     String
  sandboxUrl      String
  
  // Data
  seedData        Json?    // Seed data configuration
  
  // Limits
  expiresAt       DateTime
  
  status          String   @default("active")
  
  createdAt       DateTime @default(now())
  
  developer DeveloperAccount @relation(fields: [developerId], references: [id])
}
```

#### API Endpoints

```
# Developer Account
POST   /api/developer/register                - Register as developer
GET    /api/developer/account                 - Get developer account
PATCH  /api/developer/account                 - Update developer account

# API Keys (for developers)
POST   /api/developer/api-keys                - Create API key
GET    /api/developer/api-keys                - List API keys
DELETE /api/developer/api-keys/:id            - Revoke API key

# Sandbox
POST   /api/developer/sandbox                 - Create sandbox
GET    /api/developer/sandbox                 - List sandboxes
DELETE /api/developer/sandbox/:id             - Delete sandbox

# Analytics
GET    /api/developer/analytics/api-usage     - Get API usage stats
GET    /api/developer/analytics/installs      - Get install stats
GET    /api/developer/analytics/revenue       - Get revenue stats
```

#### Acceptance Criteria
- [ ] Documentation covers all API endpoints
- [ ] SDKs published to npm, PyPI
- [ ] Sandbox creation < 30 seconds
- [ ] Developer onboarding < 10 minutes
- [ ] UI follows deep black/white color scheme

---

## SPRINT 14.2: TEMPLATE & FORM MARKETPLACE
**Timeline:** Weeks 7-10 (Month 37)  
**Team:** Backend (1), Frontend (2)

---

### Session 14.2.1: Template Marketplace
**Timeline:** Weeks 7-8  
**Owner:** Frontend Lead

#### Deliverables

**D-14.2.1.1: Document Templates**
- [ ] Template submission
- [ ] Template categories (contracts, pleadings, letters)
- [ ] Practice area filtering
- [ ] Jurisdiction filtering
- [ ] Template preview
- [ ] Template purchase/download

**D-14.2.1.2: Workflow Templates**
- [ ] Pre-built workflow templates
- [ ] Workflow import
- [ ] Workflow customization
- [ ] Workflow sharing

**D-14.2.1.3: Form Templates**
- [ ] Intake form templates
- [ ] Client questionnaires
- [ ] Form builder templates
- [ ] Form import

#### Database Schema

```prisma
model TemplateMarketplace {
  id              String   @id @default(uuid())
  sellerId        String   // Organization or individual
  
  // Template Info
  templateName    String
  templateSlug    String   @unique
  description     String
  
  // Type
  templateType    String   // document, workflow, form, checklist
  
  // Categorization
  practiceArea    String?
  jurisdiction    String?
  category        String?
  tags            String[]
  
  // Content
  previewUrl      String?
  templateData    Json     // Template content
  
  // Pricing
  pricingType     String   // free, paid
  price           Decimal? @db.Decimal(10, 2)
  
  // Status
  status          String   @default("draft")
  publishedAt     DateTime?
  
  // Metrics
  downloadCount   Int      @default(0)
  avgRating       Decimal? @db.Decimal(2, 1)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  seller       Organization @relation(fields: [sellerId], references: [id])
  purchases    TemplatePurchase[]
}

model TemplatePurchase {
  id          String   @id @default(uuid())
  templateId  String
  buyerId     String   // Organization ID
  
  price       Decimal  @db.Decimal(10, 2)
  
  purchasedAt DateTime @default(now())
  
  template TemplateMarketplace @relation(fields: [templateId], references: [id])
  buyer    Organization        @relation(fields: [buyerId], references: [id])
  
  @@unique([templateId, buyerId])
}
```

#### API Endpoints

```
# Template Marketplace
GET    /api/marketplace/templates             - List templates
GET    /api/marketplace/templates/:slug       - Get template details
POST   /api/marketplace/templates/:slug/purchase - Purchase template
GET    /api/marketplace/templates/purchased   - List purchased templates

# Template Selling
POST   /api/marketplace/templates/sell        - Submit template for sale
GET    /api/marketplace/templates/my-templates - List my templates
PATCH  /api/marketplace/templates/:id         - Update template
```

#### Acceptance Criteria
- [ ] Template preview renders correctly
- [ ] Template import works seamlessly
- [ ] Payment processing works
- [ ] UI follows deep black/white color scheme

---

## SPRINT 14.3: PARTNER PROGRAM
**Timeline:** Weeks 11-14 (Month 38)  
**Team:** Backend (1), Business Development (1)

---

### Session 14.3.1: Partner Infrastructure
**Timeline:** Weeks 11-12  
**Owner:** Backend Lead + Business Development

#### Deliverables

**D-14.3.1.1: Partner Types**
- [ ] **Referral Partners:** Earn commission on referrals
- [ ] **Implementation Partners:** Certified implementers
- [ ] **Technology Partners:** Integration partners
- [ ] **Reseller Partners:** White-label resellers

**D-14.3.1.2: Partner Portal**
- [ ] Partner registration
- [ ] Partner dashboard
- [ ] Referral tracking
- [ ] Commission tracking
- [ ] Marketing materials
- [ ] Training resources

**D-14.3.1.3: Revenue Sharing**
- [ ] Commission calculation
- [ ] Payout processing
- [ ] Revenue reports
- [ ] Tax documentation (1099)

#### Database Schema

```prisma
model Partner {
  id              String   @id @default(uuid())
  
  // Partner Info
  partnerName     String
  partnerType     String   // referral, implementation, technology, reseller
  
  // Contact
  contactName     String
  contactEmail    String
  phone           String?
  website         String?
  
  // Company
  companyName     String?
  companyAddress  String?
  taxId           String?  // Encrypted
  
  // Agreement
  agreementSignedAt DateTime?
  commissionRate  Decimal  @db.Decimal(5, 2) // Percentage
  
  // Status
  status          String   @default("pending") // pending, approved, active, suspended
  tier            String   @default("bronze") // bronze, silver, gold, platinum
  
  // Payout
  payoutMethod    String?
  payoutDetails   Json?    // Encrypted
  minimumPayout   Decimal  @db.Decimal(10, 2) @default(100)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  referrals    Referral[]
  commissions  Commission[]
}

model Referral {
  id              String   @id @default(uuid())
  partnerId       String
  
  // Referral
  referralCode    String   @unique
  
  // Lead
  leadEmail       String?
  leadCompany     String?
  
  // Conversion
  convertedOrganizationId String?
  convertedAt     DateTime?
  
  // Status
  status          String   @default("pending") // pending, converted, expired
  
  expiresAt       DateTime
  createdAt       DateTime @default(now())
  
  partner Partner @relation(fields: [partnerId], references: [id])
  convertedOrganization Organization? @relation(fields: [convertedOrganizationId], references: [id])
}

model Commission {
  id              String   @id @default(uuid())
  partnerId       String
  referralId      String?
  
  // Commission
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  
  // Source
  sourceType      String   // subscription, one_time, renewal
  sourceId        String?
  
  // Status
  status          String   @default("pending") // pending, approved, paid
  
  approvedAt      DateTime?
  paidAt          DateTime?
  payoutId        String?
  
  createdAt       DateTime @default(now())
  
  partner Partner @relation(fields: [partnerId], references: [id])
}

model Payout {
  id              String   @id @default(uuid())
  partnerId       String
  
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  
  payoutMethod    String
  payoutReference String?
  
  status          String   @default("pending") // pending, processing, completed, failed
  
  processedAt     DateTime?
  failureReason   String?
  
  createdAt       DateTime @default(now())
  
  partner Partner @relation(fields: [partnerId], references: [id])
  commissions Commission[]
}
```

#### API Endpoints

```
# Partner Portal
POST   /api/partners/register                 - Register as partner
GET    /api/partners/account                  - Get partner account
PATCH  /api/partners/account                  - Update partner account

# Referrals
POST   /api/partners/referrals                - Create referral link
GET    /api/partners/referrals                - List referrals
GET    /api/partners/referrals/:code/track    - Track referral (public)

# Commissions
GET    /api/partners/commissions              - List commissions
GET    /api/partners/commissions/summary      - Get commission summary

# Payouts
GET    /api/partners/payouts                  - List payouts
POST   /api/partners/payouts/request          - Request payout

# Admin
GET    /api/admin/partners                    - List all partners
PATCH  /api/admin/partners/:id                - Update partner status
POST   /api/admin/partners/:id/approve        - Approve partner
```

#### Acceptance Criteria
- [ ] Referral tracking works correctly
- [ ] Commission calculation accurate
- [ ] Payout processing works
- [ ] UI follows deep black/white color scheme

---

## SPRINT 14.4: COMMUNITY FEATURES
**Timeline:** Weeks 15-16 (Month 38)  
**Team:** Backend (1), Frontend (1)

---

### Session 14.4.1: Community Platform
**Timeline:** Weeks 15-16  
**Owner:** Frontend Lead

#### Deliverables

**D-14.4.1.1: Community Forum**
- [ ] Discussion categories
- [ ] Question & answer format
- [ ] Upvoting/downvoting
- [ ] Best answer marking
- [ ] User reputation system
- [ ] Moderation tools

**D-14.4.1.2: Knowledge Sharing**
- [ ] User-contributed articles
- [ ] Tips & tricks
- [ ] Use case sharing
- [ ] Success stories

**D-14.4.1.3: Events**
- [ ] Webinar listings
- [ ] User group meetings
- [ ] Conference information
- [ ] Event registration

#### Database Schema

```prisma
model ForumCategory {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  icon        String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  
  posts ForumPost[]
}

model ForumPost {
  id          String   @id @default(uuid())
  categoryId  String
  authorId    String
  
  title       String
  content     String   @db.Text
  
  // Type
  postType    String   @default("discussion") // discussion, question, announcement
  
  // Status
  isPinned    Boolean  @default(false)
  isLocked    Boolean  @default(false)
  isSolved    Boolean  @default(false)
  
  // Metrics
  viewCount   Int      @default(0)
  replyCount  Int      @default(0)
  upvotes     Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  category ForumCategory @relation(fields: [categoryId], references: [id])
  author   User          @relation(fields: [authorId], references: [id])
  replies  ForumReply[]
  votes    ForumVote[]
}

model ForumReply {
  id          String   @id @default(uuid())
  postId      String
  authorId    String
  parentId    String?  // For nested replies
  
  content     String   @db.Text
  
  isBestAnswer Boolean @default(false)
  upvotes     Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  post   ForumPost   @relation(fields: [postId], references: [id])
  author User        @relation(fields: [authorId], references: [id])
  parent ForumReply? @relation("NestedReplies", fields: [parentId], references: [id])
  children ForumReply[] @relation("NestedReplies")
  votes  ForumVote[]
}

model ForumVote {
  id          String   @id @default(uuid())
  userId      String
  postId      String?
  replyId     String?
  
  voteType    Int      // 1 = upvote, -1 = downvote
  
  createdAt   DateTime @default(now())
  
  user  User        @relation(fields: [userId], references: [id])
  post  ForumPost?  @relation(fields: [postId], references: [id])
  reply ForumReply? @relation(fields: [replyId], references: [id])
  
  @@unique([userId, postId])
  @@unique([userId, replyId])
}

model UserReputation {
  id          String   @id @default(uuid())
  userId      String   @unique
  
  points      Int      @default(0)
  level       String   @default("newcomer") // newcomer, contributor, expert, champion
  
  badges      String[]
  
  updatedAt   DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
}
```

#### API Endpoints

```
# Forum
GET    /api/community/categories              - List categories
GET    /api/community/posts                   - List posts
POST   /api/community/posts                   - Create post
GET    /api/community/posts/:id               - Get post
PATCH  /api/community/posts/:id               - Update post
DELETE /api/community/posts/:id               - Delete post

# Replies
POST   /api/community/posts/:id/replies       - Add reply
PATCH  /api/community/replies/:id             - Update reply
DELETE /api/community/replies/:id             - Delete reply
POST   /api/community/replies/:id/best-answer - Mark as best answer

# Voting
POST   /api/community/posts/:id/vote          - Vote on post
POST   /api/community/replies/:id/vote        - Vote on reply

# User
GET    /api/community/users/:id               - Get user profile
GET    /api/community/users/:id/posts         - Get user's posts
GET    /api/community/reputation              - Get my reputation
```

#### Acceptance Criteria
- [ ] Forum posts load < 1 second
- [ ] Voting updates in real-time
- [ ] Reputation calculated correctly
- [ ] UI follows deep black/white color scheme

---

## PHASE 14 SUMMARY

### Deliverables Checklist

| Sprint | Deliverable | Status |
|--------|-------------|--------|
| 14.1.1 | App Listing System | ⬜ Pending |
| 14.1.1 | App Installation | ⬜ Pending |
| 14.1.1 | Marketplace UI | ⬜ Pending |
| 14.1.2 | Developer Documentation | ⬜ Pending |
| 14.1.2 | Developer Console | ⬜ Pending |
| 14.1.2 | SDKs | ⬜ Pending |
| 14.2.1 | Document Templates | ⬜ Pending |
| 14.2.1 | Workflow Templates | ⬜ Pending |
| 14.2.1 | Form Templates | ⬜ Pending |
| 14.3.1 | Partner Types | ⬜ Pending |
| 14.3.1 | Partner Portal | ⬜ Pending |
| 14.3.1 | Revenue Sharing | ⬜ Pending |
| 14.4.1 | Community Forum | ⬜ Pending |
| 14.4.1 | Knowledge Sharing | ⬜ Pending |

### Success Metrics

| Metric | Target |
|--------|--------|
| Marketplace apps | 20+ at launch |
| Developer signups | 100+ |
| Template downloads | 1,000+ |
| Partner signups | 25+ |
| Community posts | 500+ |

### Team Requirements

| Role | Count | Responsibilities |
|------|-------|------------------|
| Backend Engineer | 2 | Marketplace, partner infrastructure |
| Frontend Engineer | 2 | Marketplace UI, developer portal |
| DevOps Engineer | 1 | Sandbox environments |
| Technical Writer | 1 | Documentation |
| Business Development | 1 | Partner program |

---

**Document Version:** 3.0  
**Last Updated:** December 12, 2025  
**Status:** Ready for Development  
**Next Phase:** Phase 15 - Scale, Growth & Global Expansion

---
