# FRITH AI - PHASE 12: COMPLETE LEGAL ERP PLATFORM
## Part 2: Client Lifecycle & Matter Management

**From AI Tool Platform to Industry-Leading Legal ERP**  
**Version:** 3.0  
**Timeline:** Months 22-24 (12 weeks)  
**Goal:** Build comprehensive client lifecycle management from intake to case closure

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

## SPRINT 12.2: CLIENT LIFECYCLE MANAGEMENT
**Timeline:** Weeks 1-12 (Months 22-24)  
**Team:** Backend (3), Frontend (2), AI Engineer (1)

---

### Session 12.2.1: Lead Management System
**Timeline:** Weeks 1-3  
**Owner:** Backend Lead + Marketing Lead

#### Deliverables

**D-12.2.1.1: Lead Capture**
- [ ] Web forms (embedded on firm website)
- [ ] Chatbot integration (from Phase 6)
- [ ] Phone call logging (Twilio integration)
- [ ] Email leads (forwarding to leads@firm.com)
- [ ] Referral tracking (who referred this lead)
- [ ] Social media lead capture (LinkedIn, Facebook)
- [ ] QR code lead capture (for events)

**D-12.2.1.2: Lead Qualification**
- [ ] Custom intake questionnaires (per practice area)
- [ ] Conflict check integration (automatic)
- [ ] AI lead scoring (1-100, predict conversion probability)
- [ ] Lead source tracking (Google Ads, referral, organic)
- [ ] Budget qualification
- [ ] Urgency assessment

**D-12.2.1.3: Lead Nurturing**
- [ ] Automated follow-up sequences (email drip campaigns)
- [ ] Task assignments (schedule consultation call)
- [ ] Lead status pipeline (New → Contacted → Qualified → Converted)
- [ ] Lead aging alerts (no contact in 7 days)
- [ ] SMS follow-up integration
- [ ] Calendar booking integration (Calendly, Cal.com)

**D-12.2.1.4: AI Lead Features**
- [ ] **AI Lead Scorer:** Predicts conversion probability based on:
  - Matter type + firm's historical win rate
  - Lead source quality
  - Response time to inquiry
  - Budget vs. estimated fees
  - Urgency indicators
- [ ] **Smart Lead Routing:** Auto-assigns leads to best attorney:
  - Practice area match
  - Attorney availability
  - Historical conversion rate
  - Workload balance
  - Language preferences
- [ ] **AI Intake Assistant:** Pre-fills intake forms using:
  - Data from chatbot conversation
  - Public records (if personal injury, pulls police reports)
  - Social media enrichment (LinkedIn, if corporate client)
  - Previous interactions

#### Database Schema

```prisma
model Lead {
  id              String   @id @default(uuid())
  leadNumber      String   // Auto-generated: LEAD-2025-0001
  organizationId  String
  
  // Contact Info
  firstName       String
  lastName        String
  email           String
  phone           String?
  alternatePhone  String?
  preferredContact String? // email, phone, sms
  
  // Company (for business leads)
  company         String?
  jobTitle        String?
  companySize     String?  // 1-10, 11-50, 51-200, 201-500, 500+
  
  // Legal Matter
  practiceArea    String   // litigation, estate_planning, etc.
  matterType      String?  // personal_injury, contract_dispute, etc.
  description     String?  // Brief summary of legal issue
  urgency         String?  // low, medium, high, urgent
  
  // Qualification
  budget          Decimal? @db.Decimal(15, 2)
  budgetRange     String?  // under_5k, 5k_25k, 25k_100k, over_100k
  timeline        String?  // immediate, 1_month, 3_months, 6_months
  hasRetainedAttorney Boolean @default(false)
  
  // Source & Attribution
  leadSource      String   // website, referral, google_ads, phone, chatbot
  leadSourceDetail String? // Specific campaign, referrer name
  referredBy      String?  // Name of referrer
  referredByContactId String? // Link to contact if referrer is client
  utmSource       String?
  utmMedium       String?
  utmCampaign     String?
  landingPage     String?
  
  // AI Scoring
  aiScore         Int?     // 1-100 lead quality score
  aiScoreFactors  Json?    // Breakdown of score factors
  aiScoredAt      DateTime?
  
  // Assignment
  assignedTo      String?  // Attorney ID
  assignedAt      DateTime?
  assignedBy      String?
  
  // Status
  status          String   @default("new") // new, contacted, qualified, proposal_sent, converted, lost, disqualified
  substatus       String?  // More granular status
  lostReason      String?  // price, timing, chose_competitor, no_response, conflict, etc.
  disqualifyReason String?
  
  // Conversion
  convertedToClientId String?
  convertedToMatterId String?
  convertedAt     DateTime?
  convertedBy     String?
  
  // Conflict Check
  conflictCheckStatus String? // pending, clear, conflict_found
  conflictCheckDate DateTime?
  conflictCheckBy String?
  conflictNotes   String?
  
  // Timestamps
  capturedAt      DateTime @default(now())
  firstContactedAt DateTime?
  lastContactedAt DateTime?
  nextFollowUpAt  DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization    @relation(fields: [organizationId], references: [id])
  activities   LeadActivity[]
  notes        LeadNote[]
  intakeResponses IntakeResponse[]
  
  @@unique([organizationId, leadNumber])
  @@index([organizationId, status])
  @@index([organizationId, assignedTo])
}

model LeadActivity {
  id          String   @id @default(uuid())
  leadId      String
  activityType String  // email_sent, email_received, call_made, call_received, meeting, form_submission, chatbot, sms
  direction   String?  // inbound, outbound
  subject     String?
  description String
  outcome     String?  // connected, voicemail, no_answer, scheduled_callback
  duration    Int?     // Duration in seconds (for calls)
  userId      String?  // Who performed activity
  isAutomated Boolean  @default(false)
  metadata    Json?    // Additional activity data
  occurredAt  DateTime @default(now())
  createdAt   DateTime @default(now())
  
  lead Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)
}

model LeadNote {
  id          String   @id @default(uuid())
  leadId      String
  note        String
  isPinned    Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  lead Lead @relation(fields: [leadId], references: [id], onDelete: Cascade)
}

model IntakeForm {
  id              String   @id @default(uuid())
  organizationId  String
  formName        String
  practiceArea    String?  // If specific to practice area
  description     String?
  fields          Json     // Form field definitions
  isActive        Boolean  @default(true)
  isDefault       Boolean  @default(false)
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  responses    IntakeResponse[]
}

model IntakeResponse {
  id          String   @id @default(uuid())
  formId      String
  leadId      String?
  contactId   String?
  responses   Json     // Field responses
  submittedAt DateTime @default(now())
  ipAddress   String?
  userAgent   String?
  
  form    IntakeForm @relation(fields: [formId], references: [id])
  lead    Lead?      @relation(fields: [leadId], references: [id])
  contact Contact?   @relation(fields: [contactId], references: [id])
}

model LeadNurtureCampaign {
  id              String   @id @default(uuid())
  organizationId  String
  campaignName    String
  practiceArea    String?
  triggerType     String   // new_lead, status_change, time_based
  triggerConditions Json
  steps           Json     // Array of campaign steps (emails, tasks, delays)
  isActive        Boolean  @default(true)
  createdBy       String
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  enrollments  CampaignEnrollment[]
}

model CampaignEnrollment {
  id          String   @id @default(uuid())
  campaignId  String
  leadId      String
  currentStep Int      @default(0)
  status      String   @default("active") // active, completed, paused, cancelled
  enrolledAt  DateTime @default(now())
  completedAt DateTime?
  pausedAt    DateTime?
  
  campaign LeadNurtureCampaign @relation(fields: [campaignId], references: [id])
}
```

#### API Endpoints

```
# Leads
POST   /api/leads                             - Create lead
GET    /api/leads                             - List leads (with filters)
GET    /api/leads/:id                         - Get lead details
PATCH  /api/leads/:id                         - Update lead
DELETE /api/leads/:id                         - Delete lead
POST   /api/leads/:id/assign                  - Assign lead to attorney
POST   /api/leads/:id/convert                 - Convert lead to client/matter
POST   /api/leads/:id/disqualify              - Disqualify lead
POST   /api/leads/:id/conflict-check          - Run conflict check

# Lead Activities
POST   /api/leads/:id/activities              - Log activity
GET    /api/leads/:id/activities              - Get lead activities
POST   /api/leads/:id/notes                   - Add note
GET    /api/leads/:id/notes                   - Get notes

# AI Features
POST   /api/leads/:id/ai-score                - Calculate AI score
GET    /api/leads/ai/routing-suggestion       - Get routing suggestion
POST   /api/leads/:id/ai-enrich               - Enrich lead data

# Intake Forms
POST   /api/intake-forms                      - Create intake form
GET    /api/intake-forms                      - List intake forms
GET    /api/intake-forms/:id                  - Get form details
PATCH  /api/intake-forms/:id                  - Update form
POST   /api/intake-forms/:id/submit           - Submit form response

# Nurture Campaigns
POST   /api/lead-campaigns                    - Create campaign
GET    /api/lead-campaigns                    - List campaigns
POST   /api/leads/:id/enroll-campaign         - Enroll lead in campaign

# Reports
GET    /api/leads/reports/pipeline            - Pipeline report
GET    /api/leads/reports/conversion          - Conversion report
GET    /api/leads/reports/source-analysis     - Source analysis
```

#### Acceptance Criteria
- [ ] Lead capture from all sources works in real-time
- [ ] AI lead scoring accuracy > 70% (measured by conversion)
- [ ] Conflict check completes in < 5 seconds
- [ ] Lead routing suggestions accuracy > 80%
- [ ] Nurture campaign emails send within 1 minute of trigger
- [ ] UI follows deep black/white color scheme

---

### Session 12.2.2: Contact & Client Management (CRM)
**Timeline:** Weeks 4-6  
**Owner:** Backend Lead + Frontend Lead

#### Deliverables

**D-12.2.2.1: Contact Database**
- [ ] Clients, prospects, referral sources, opposing counsel
- [ ] Individual + organization contacts
- [ ] Relationship mapping (family members, business partners)
- [ ] Contact tagging (VIP, high-value, difficult, etc.)
- [ ] Multi-language contact info (international clients)
- [ ] Contact merge/deduplication
- [ ] Contact import (CSV, vCard)

**D-12.2.2.2: Client Onboarding**
- [ ] E-signature engagement letters (DocuSign integration)
- [ ] Conflict check (automatic against all matters)
- [ ] Client portal access setup
- [ ] Initial retainer collection (trust account deposit)
- [ ] Welcome email automation
- [ ] Onboarding checklist per client type
- [ ] KYC/AML verification (for applicable jurisdictions)

**D-12.2.2.3: Client Communication Log**
- [ ] All emails, calls, meetings in one timeline
- [ ] Automatic logging (from email sync, calendar)
- [ ] Notes & file attachments
- [ ] Client portal messages
- [ ] Communication preferences tracking

**D-12.2.2.4: AI CRM Features**
- [ ] **AI Relationship Manager:** Suggests actions:
  - "Client's birthday is tomorrow—send a card"
  - "No contact in 90 days—schedule check-in call"
  - "Client mentioned opening new business—offer corporate services"
- [ ] **Smart Conflict Check:** AI-powered fuzzy matching:
  - Identifies potential conflicts (similar names, related entities)
  - Searches aliases, DBAs, former names
  - Cross-references adverse parties in past matters
- [ ] **Client Health Score:** Predicts client satisfaction & retention risk:
  - Based on communication frequency, invoice payment patterns
  - Alerts if client likely to churn (switch firms)

#### Database Schema

```prisma
model Contact {
  id              String   @id @default(uuid())
  contactNumber   String   // Auto-generated: CON-0001
  organizationId  String
  
  // Type
  contactType     String   // client, prospect, referral_source, opposing_counsel, vendor, expert_witness, other
  entityType      String   // individual, organization
  
  // Individual fields
  prefix          String?  // Mr., Mrs., Dr., etc.
  firstName       String?
  middleName      String?
  lastName        String?
  suffix          String?  // Jr., III, Esq., etc.
  nickname        String?
  
  // Organization fields
  companyName     String?
  companyType     String?  // corporation, llc, partnership, sole_proprietor
  industry        String?
  
  // Display
  displayName     String   // Computed: "John Smith" or "Acme Corp"
  sortName        String   // For sorting: "Smith, John"
  
  // Contact Info
  email           String?
  emailSecondary  String?
  phone           String?
  phoneType       String?  // mobile, work, home
  alternatePhone  String?
  alternatePhoneType String?
  fax             String?
  website         String?
  
  // Address
  address1        String?
  address2        String?
  city            String?
  state           String?
  postalCode      String?
  country         String   @default("US")
  
  // Mailing Address (if different)
  mailingAddress1 String?
  mailingAddress2 String?
  mailingCity     String?
  mailingState    String?
  mailingPostalCode String?
  mailingCountry  String?
  
  // Preferences
  language        String   @default("en") // ISO 639-1 code
  timezone        String?
  preferredContact String? // email, phone, mail
  doNotContact    Boolean  @default(false)
  doNotEmail      Boolean  @default(false)
  doNotCall       Boolean  @default(false)
  doNotMail       Boolean  @default(false)
  
  // Client-specific
  clientSince     DateTime?
  clientStatus    String?  // active, inactive, former
  billingContact  Boolean  @default(false)
  
  // Referral
  referralSource  String?
  referredBy      String?  // Contact ID
  
  // AI Scores
  aiHealthScore   Int?     // 1-100 client health
  aiHealthFactors Json?
  aiScoredAt      DateTime?
  
  // Tags & Categories
  tags            String[] // ["VIP", "High-Value", "Difficult"]
  categories      String[] // Practice areas of interest
  
  // Dates
  birthDate       DateTime?
  anniversaryDate DateTime?
  
  // Social
  linkedInUrl     String?
  twitterHandle   String?
  
  // Notes
  notes           String?
  
  // Status
  isActive        Boolean  @default(true)
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization       @relation(fields: [organizationId], references: [id])
  
  // Relations
  matters         MatterClient[]
  invoices        Invoice[]
  payments        Payment[]
  activities      Activity[]
  trustLedgers    ClientTrustLedger[]
  expenses        Expense[]
  communications  Communication[]
  
  // Relationships
  relationshipsFrom ContactRelationship[] @relation("ContactA")
  relationshipsTo   ContactRelationship[] @relation("ContactB")
  
  // Organization members (if organization)
  members         ContactMember[]       @relation("Organization")
  memberOf        ContactMember[]       @relation("Member")
  
  @@unique([organizationId, contactNumber])
  @@index([organizationId, contactType])
  @@index([organizationId, displayName])
}

model ContactRelationship {
  id             String   @id @default(uuid())
  contactAId     String
  contactBId     String
  relationship   String   // spouse, parent, child, sibling, business_partner, employee, employer, etc.
  inverseRelationship String? // For bidirectional: if A is "parent" of B, B is "child" of A
  isPrimary      Boolean  @default(false)
  notes          String?
  startDate      DateTime?
  endDate        DateTime?
  createdAt      DateTime @default(now())
  
  contactA Contact @relation("ContactA", fields: [contactAId], references: [id], onDelete: Cascade)
  contactB Contact @relation("ContactB", fields: [contactBId], references: [id], onDelete: Cascade)
  
  @@unique([contactAId, contactBId, relationship])
}

model ContactMember {
  id              String   @id @default(uuid())
  organizationContactId String // The organization
  memberContactId String        // The individual
  role            String?       // CEO, CFO, General Counsel, etc.
  department      String?
  isPrimary       Boolean  @default(false)
  startDate       DateTime?
  endDate         DateTime?
  createdAt       DateTime @default(now())
  
  organizationContact Contact @relation("Organization", fields: [organizationContactId], references: [id], onDelete: Cascade)
  memberContact       Contact @relation("Member", fields: [memberContactId], references: [id], onDelete: Cascade)
  
  @@unique([organizationContactId, memberContactId])
}

model ClientOnboarding {
  id              String   @id @default(uuid())
  organizationId  String
  contactId       String
  matterId        String?
  
  // Checklist
  checklistTemplate String?
  checklistItems  Json     // Array of checklist items with status
  
  // Documents
  engagementLetterSent Boolean @default(false)
  engagementLetterSentAt DateTime?
  engagementLetterSigned Boolean @default(false)
  engagementLetterSignedAt DateTime?
  engagementLetterDocId String?
  
  // Conflict Check
  conflictCheckCompleted Boolean @default(false)
  conflictCheckDate DateTime?
  conflictCheckResult String? // clear, conflict_found, waiver_obtained
  
  // Portal
  portalAccessCreated Boolean @default(false)
  portalAccessCreatedAt DateTime?
  portalInviteSent Boolean @default(false)
  portalInviteSentAt DateTime?
  
  // Retainer
  retainerRequested Boolean @default(false)
  retainerAmount Decimal? @db.Decimal(15, 2)
  retainerReceived Boolean @default(false)
  retainerReceivedAt DateTime?
  
  // Welcome
  welcomeEmailSent Boolean @default(false)
  welcomeEmailSentAt DateTime?
  
  // KYC/AML (if applicable)
  kycRequired Boolean @default(false)
  kycCompleted Boolean @default(false)
  kycCompletedAt DateTime?
  kycDocuments Json?
  
  // Status
  status          String   @default("in_progress") // in_progress, completed, cancelled
  completedAt     DateTime?
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  contact      Contact      @relation(fields: [contactId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
}
```

#### API Endpoints

```
# Contacts
POST   /api/contacts                          - Create contact
GET    /api/contacts                          - List contacts
GET    /api/contacts/:id                      - Get contact details
PATCH  /api/contacts/:id                      - Update contact
DELETE /api/contacts/:id                      - Deactivate contact
POST   /api/contacts/merge                    - Merge duplicate contacts
POST   /api/contacts/import                   - Import contacts (CSV)
GET    /api/contacts/:id/export               - Export contact (vCard)

# Relationships
POST   /api/contacts/:id/relationships        - Add relationship
GET    /api/contacts/:id/relationships        - Get relationships
DELETE /api/contacts/:id/relationships/:relId - Remove relationship

# Organization Members
POST   /api/contacts/:id/members              - Add member to organization
GET    /api/contacts/:id/members              - Get organization members

# Client Onboarding
POST   /api/contacts/:id/onboarding           - Start onboarding
GET    /api/contacts/:id/onboarding           - Get onboarding status
PATCH  /api/contacts/:id/onboarding           - Update onboarding
POST   /api/contacts/:id/onboarding/send-engagement - Send engagement letter
POST   /api/contacts/:id/onboarding/create-portal - Create portal access

# AI Features
POST   /api/contacts/:id/ai-health-score      - Calculate health score
GET    /api/contacts/ai/suggestions           - Get relationship suggestions
POST   /api/contacts/ai/conflict-check        - Run AI conflict check
GET    /api/contacts/ai/duplicates            - Find potential duplicates

# Communication
GET    /api/contacts/:id/communications       - Get all communications
GET    /api/contacts/:id/timeline             - Get activity timeline
```

#### Acceptance Criteria
- [ ] Contact merge preserves all related data
- [ ] Conflict check searches across all matters and contacts
- [ ] AI health score updates automatically on activity
- [ ] Duplicate detection accuracy > 90%
- [ ] Client portal invitation sends within 1 minute
- [ ] UI follows deep black/white color scheme

---

### Session 12.2.3: Cases & Matters Management
**Timeline:** Weeks 7-9  
**Owner:** Backend Lead + Frontend Lead

#### Deliverables

**D-12.2.3.1: Matter Setup**
- [ ] Matter types by practice area (litigation, transactional, estate, etc.)
- [ ] Custom matter numbering (firm-specific format)
- [ ] Multi-client matters (joint representation)
- [ ] Matter stages/phases (discovery, trial, settlement)
- [ ] Opposing parties & counsel tracking
- [ ] Jurisdiction & venue
- [ ] Matter templates for quick setup

**D-12.2.3.2: Matter Dashboard**
- [ ] At-a-glance matter status
- [ ] Key dates & deadlines
- [ ] Financial summary (budget vs. actual, trust balance)
- [ ] Recent activity feed
- [ ] Team members assigned
- [ ] Quick actions (log time, add expense, create task)

**D-12.2.3.3: Matter Workflows**
- [ ] Checklists per matter type
- [ ] Automatic task creation on matter open
- [ ] Stage transitions trigger actions
- [ ] Matter close checklist
- [ ] Post-matter review workflow

**D-12.2.3.4: AI Matter Features**
- [ ] **AI Matter Setup:** Auto-populates matter details:
  - Extracts info from intake forms
  - Suggests practice area & matter type
  - Recommends team assignment
- [ ] **Predictive Case Outcomes:** AI analyzes:
  - Similar past cases (win rate, settlement range)
  - Judge history (favorable/unfavorable rulings)
  - Opposing counsel patterns
  - Provides probability of success + estimated value
- [ ] **Smart Budget Forecasting:** Predicts total matter cost:
  - Based on matter type, complexity, court
  - Compares to historical similar matters
  - Alerts if over budget

#### Database Schema

```prisma
model Matter {
  id                String   @id @default(uuid())
  matterNumber      String   // e.g., "2025-LIT-001"
  organizationId    String
  
  // Basic Info
  matterName        String
  description       String?
  practiceArea      String   // litigation, corporate, estate_planning, etc.
  matterType        String   // civil_litigation, contract_negotiation, will_drafting
  matterSubtype     String?
  
  // Status
  status            String   @default("active") // active, pending, on_hold, closed, archived
  stage             String?  // intake, discovery, trial, settlement, appeal, closed
  substage          String?
  statusReason      String?  // Reason for current status
  
  // Dates
  openDate          DateTime @default(now())
  closeDate         DateTime?
  statuteOfLimitations DateTime?
  targetCloseDate   DateTime?
  
  // Team
  leadAttorneyId    String
  originatingAttorneyId String? // For origination credit
  responsibleAttorneyId String?
  supervisingAttorneyId String?
  
  // Court/Jurisdiction
  jurisdiction      String?
  venue             String?  // Court name
  courtId           String?
  caseNumber        String?  // Court-assigned case number
  judge             String?
  department        String?  // Court department/division
  
  // Financial
  billingType       String   @default("hourly") // hourly, fixed_fee, contingency, hybrid, pro_bono
  budget            Decimal? @db.Decimal(15, 2)
  budgetAlertThreshold Decimal? @db.Decimal(5, 2) // Alert at X% of budget
  estimatedValue    Decimal? @db.Decimal(15, 2)
  actualValue       Decimal? @db.Decimal(15, 2) // Final value (settlement, judgment)
  
  // Contingency
  isContingency     Boolean  @default(false)
  contingencyRate   Decimal? @db.Decimal(5, 2) // 33.33%
  contingencyType   String?  // standard, sliding_scale
  
  // AI Predictions
  aiSuccessProbability Int?  // 1-100% AI prediction
  aiSuccessFactors  Json?
  aiEstimatedCost   Decimal? @db.Decimal(15, 2)
  aiEstimatedDuration Int?   // Days
  aiAnalyzedAt      DateTime?
  
  // Conflict Check
  conflictCheckDate DateTime?
  conflictCheckBy   String?
  conflictCheckResult String? // clear, conflict_found, waiver_obtained
  conflictNotes     String?
  
  // Referral
  referralSource    String?
  referralFee       Decimal? @db.Decimal(5, 2) // Percentage
  referralContactId String?
  
  // Custom Fields
  customFields      Json?
  
  // Notes
  notes             String?
  internalNotes     String?  // Not visible to clients
  
  // Timestamps
  lastActivityAt    DateTime?
  createdBy         String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  organization Organization  @relation(fields: [organizationId], references: [id])
  court        Court?        @relation(fields: [courtId], references: [id])
  
  // Relations
  clients          MatterClient[]
  teamMembers      MatterTeamMember[]
  opposingParties  OpposingParty[]
  tasks            Task[]
  activities       Activity[]
  documents        Document[]
  invoices         Invoice[]
  expenses         Expense[]
  timeEntries      TimeEntry[]
  trustLedgers     ClientTrustLedger[]
  dockets          DocketEntry[]
  deadlines        Deadline[]
  calendarEvents   CalendarEvent[]
  communications   Communication[]
  notes            MatterNote[]
  statusHistory    MatterStatusHistory[]
  
  @@unique([organizationId, matterNumber])
  @@index([organizationId, status])
  @@index([organizationId, practiceArea])
  @@index([leadAttorneyId])
}

model MatterClient {
  id        String   @id @default(uuid())
  matterId  String
  clientId  String
  isPrimary Boolean  @default(false)
  role      String?  // plaintiff, defendant, petitioner, respondent, beneficiary, etc.
  billingContact Boolean @default(false)
  notes     String?
  addedAt   DateTime @default(now())
  addedBy   String
  
  matter Matter  @relation(fields: [matterId], references: [id], onDelete: Cascade)
  client Contact @relation(fields: [clientId], references: [id])
  
  @@unique([matterId, clientId])
}

model MatterTeamMember {
  id          String   @id @default(uuid())
  matterId    String
  userId      String
  role        String   // lead_attorney, associate, paralegal, secretary, of_counsel
  isPrimary   Boolean  @default(false)
  billingRate Decimal? @db.Decimal(15, 2) // Override rate for this matter
  permissions Json?    // Specific permissions for this matter
  addedAt     DateTime @default(now())
  addedBy     String
  removedAt   DateTime?
  
  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id])
  
  @@unique([matterId, userId])
}

model OpposingParty {
  id             String   @id @default(uuid())
  matterId       String
  name           String
  entityType     String   // individual, organization
  role           String?  // defendant, respondent, opposing_party, co-defendant
  
  // Contact Info
  email          String?
  phone          String?
  address        String?
  
  // Counsel
  isRepresented  Boolean  @default(false)
  counselName    String?
  counselFirm    String?
  counselEmail   String?
  counselPhone   String?
  counselAddress String?
  
  // Dates
  servedDate     DateTime?
  answeredDate   DateTime?
  
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
}

model MatterNote {
  id          String   @id @default(uuid())
  matterId    String
  noteType    String   @default("general") // general, strategy, research, client_communication
  title       String?
  content     String
  isPinned    Boolean  @default(false)
  isPrivate   Boolean  @default(false) // Not visible to all team members
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
}

model MatterStatusHistory {
  id          String   @id @default(uuid())
  matterId    String
  fromStatus  String?
  toStatus    String
  fromStage   String?
  toStage     String?
  reason      String?
  changedBy   String
  changedAt   DateTime @default(now())
  
  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
}

model MatterTemplate {
  id              String   @id @default(uuid())
  organizationId  String
  templateName    String
  practiceArea    String
  matterType      String?
  description     String?
  
  // Default values
  defaultBillingType String?
  defaultBudget   Decimal? @db.Decimal(15, 2)
  
  // Checklist
  checklistItems  Json?    // Array of checklist items
  
  // Auto-create tasks
  autoTasks       Json?    // Array of task templates
  
  // Default team roles
  defaultRoles    Json?    // Required roles for this matter type
  
  isActive        Boolean  @default(true)
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
}
```

#### API Endpoints

```
# Matters
POST   /api/matters                           - Create matter
GET    /api/matters                           - List matters
GET    /api/matters/:id                       - Get matter details
PATCH  /api/matters/:id                       - Update matter
DELETE /api/matters/:id                       - Archive matter
POST   /api/matters/:id/close                 - Close matter
POST   /api/matters/:id/reopen                - Reopen matter

# Matter Dashboard
GET    /api/matters/:id/dashboard             - Get dashboard data
GET    /api/matters/:id/timeline              - Get activity timeline
GET    /api/matters/:id/financials            - Get financial summary

# Clients
POST   /api/matters/:id/clients               - Add client to matter
GET    /api/matters/:id/clients               - Get matter clients
DELETE /api/matters/:id/clients/:clientId     - Remove client

# Team
POST   /api/matters/:id/team                  - Add team member
GET    /api/matters/:id/team                  - Get team members
PATCH  /api/matters/:id/team/:userId          - Update team member
DELETE /api/matters/:id/team/:userId          - Remove team member

# Opposing Parties
POST   /api/matters/:id/opposing-parties      - Add opposing party
GET    /api/matters/:id/opposing-parties      - Get opposing parties
PATCH  /api/matters/:id/opposing-parties/:id  - Update opposing party
DELETE /api/matters/:id/opposing-parties/:id  - Remove opposing party

# Notes
POST   /api/matters/:id/notes                 - Add note
GET    /api/matters/:id/notes                 - Get notes
PATCH  /api/matters/:id/notes/:noteId         - Update note
DELETE /api/matters/:id/notes/:noteId         - Delete note

# Templates
POST   /api/matter-templates                  - Create template
GET    /api/matter-templates                  - List templates
POST   /api/matters/from-template             - Create matter from template

# AI Features
POST   /api/matters/:id/ai-analyze            - AI case analysis
GET    /api/matters/:id/ai-similar            - Find similar matters
GET    /api/matters/:id/ai-budget-forecast    - Get budget forecast
```

#### Acceptance Criteria
- [ ] Matter creation from template < 5 seconds
- [ ] AI case outcome prediction accuracy > 65%
- [ ] Budget alerts trigger at configured threshold
- [ ] Stage transitions auto-create configured tasks
- [ ] Matter dashboard loads < 2 seconds
- [ ] UI follows deep black/white color scheme

---

### Session 12.2.4: Court & Docket Management
**Timeline:** Weeks 10-12  
**Owner:** Backend Lead + Compliance Consultant

#### Deliverables

**D-12.2.4.1: Court Calendar Integration**
- [ ] Electronic filing (e-filing) integrations by jurisdiction
- [ ] Automatic docket retrieval (PACER for federal courts)
- [ ] Court appearance tracking
- [ ] Statute of limitations calculator
- [ ] Court holiday calendar

**D-12.2.4.2: Deadline Management**
- [ ] Court-imposed deadlines (response due, filing deadlines)
- [ ] Rule-based deadline calculation (e.g., "30 days after service")
- [ ] Automatic deadline cascading (if trial date changes, update all pre-trial deadlines)
- [ ] Multi-jurisdiction rules database
- [ ] Deadline reminders (email, SMS, push)

**D-12.2.4.3: Electronic Filing**
- [ ] E-filing integrations (File & ServeXpress, Tyler Technologies)
- [ ] Document assembly for court filings
- [ ] Proof of service generation
- [ ] Filing status tracking

**D-12.2.4.4: AI Docket Features**
- [ ] **AI Deadline Monitor:** Proactive deadline management:
  - Predicts which deadlines are at risk
  - Suggests deadline extensions
  - Calculates optimal filing timing
- [ ] **Smart Court Calendar:** AI integrates court schedules:
  - Pulls judge's calendar (if publicly available)
  - Suggests best hearing dates
  - Flags scheduling conflicts
- [ ] **Electronic Filing AI Assistant:**
  - Validates documents before filing
  - Suggests corrections
  - Tracks filing status

#### Database Schema

```prisma
model Court {
  id          String   @id @default(uuid())
  courtCode   String   @unique // e.g., "CACD" for Central District of California
  courtName   String
  courtType   String   // federal_district, federal_appellate, federal_supreme, state_trial, state_appellate, state_supreme, bankruptcy, tax, administrative
  level       String   // trial, appellate, supreme
  
  // Location
  address     String?
  city        String
  state       String
  country     String   @default("US")
  postalCode  String?
  
  // Contact
  phone       String?
  fax         String?
  website     String?
  
  // E-Filing
  eFilingEnabled Boolean @default(false)
  eFilingSystem String?  // pacer, file_and_serve, tyler, state_specific
  eFilingUrl  String?
  
  // Rules
  localRules  Json?    // Local court rules
  filingRequirements Json? // Document formatting requirements
  
  // Calendar
  holidayCalendar String? // Reference to holiday calendar
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  matters     Matter[]
  dockets     DocketEntry[]
  judges      Judge[]
}

model Judge {
  id          String   @id @default(uuid())
  courtId     String
  judgeName   String
  judgeTitle  String?  // Chief Judge, Magistrate, etc.
  department  String?
  courtroom   String?
  
  // Preferences
  preferences Json?    // Known preferences, procedures
  
  // Statistics (AI-populated)
  avgCaseDuration Int?  // Average days to resolution
  settlementRate Decimal? @db.Decimal(5, 2)
  plaintiffWinRate Decimal? @db.Decimal(5, 2)
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  court Court @relation(fields: [courtId], references: [id])
}

model DocketEntry {
  id              String   @id @default(uuid())
  matterId        String
  courtId         String?
  
  // Docket Info
  entryNumber     Int?     // Court docket entry number
  entryDate       DateTime
  filedDate       DateTime?
  
  // Content
  description     String
  documentType    String?  // motion, order, pleading, notice, subpoena, etc.
  documentSubtype String?
  
  // Parties
  filedBy         String?  // party name
  filedByRole     String?  // plaintiff, defendant
  
  // Document
  documentId      String?  // Link to Document model
  documentUrl     String?  // External link (PACER, etc.)
  pageCount       Int?
  
  // Next Action
  nextActionDate  DateTime?
  nextActionDescription String?
  
  // Import
  importedFrom    String?  // pacer, manual, e-filing
  externalId      String?  // ID from external system
  
  // Status
  isSealed        Boolean  @default(false)
  
  createdBy       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
  court  Court? @relation(fields: [courtId], references: [id])
}

model Deadline {
  id              String   @id @default(uuid())
  matterId        String
  
  // Deadline Info
  deadlineType    String   // court_imposed, statute_of_limitations, internal, contractual
  category        String?  // filing, response, discovery, trial, appeal
  description     String
  
  // Dates
  dueDate         DateTime
  dueTime         String?  // "5:00 PM"
  timezone        String   @default("America/New_York")
  
  // Calculation
  calculationRule String?  // "30 days after service", "21 days before trial"
  calculationBase String?  // Reference to triggering event
  baseDate        DateTime? // Date calculation is based on
  
  // Jurisdiction
  jurisdictionId  String?
  courtRuleReference String? // e.g., "FRCP 12(a)(1)(A)"
  
  // Properties
  isHardDeadline  Boolean  @default(true) // Cannot be extended
  isCourtDeadline Boolean  @default(false)
  
  // Assignment
  assignedTo      String?
  assignedToSecondary String? // Backup assignee
  
  // Reminders
  reminderDays    Int[]    // Days before deadline to remind [7, 3, 1]
  remindersSent   Json?    // Track which reminders sent
  
  // Status
  status          String   @default("pending") // pending, completed, extended, missed, cancelled
  completedAt     DateTime?
  completedBy     String?
  completionNotes String?
  
  // Extension
  extendedTo      DateTime?
  extensionReason String?
  extensionApprovedBy String?
  
  // AI Risk
  aiRiskScore     Int?     // 1-100, likelihood of missing
  aiRiskFactors   Json?
  
  // Related
  relatedDeadlineId String? // For cascading deadlines
  docketEntryId   String?  // If created from docket entry
  
  notes           String?
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  matter Matter @relation(fields: [matterId], references: [id], onDelete: Cascade)
  relatedDeadline Deadline? @relation("CascadingDeadlines", fields: [relatedDeadlineId], references: [id])
  cascadingDeadlines Deadline[] @relation("CascadingDeadlines")
}

model DeadlineRule {
  id              String   @id @default(uuid())
  organizationId  String?  // Null for system-wide rules
  
  // Rule Definition
  ruleName        String
  ruleCode        String   // e.g., "FRCP_12_A_1_A"
  jurisdiction    String   // federal, state:CA, state:NY
  courtType       String?  // district, appellate, bankruptcy
  
  // Trigger
  triggerEvent    String   // service, filing, order, trial_date
  triggerEventType String? // More specific trigger
  
  // Calculation
  daysCount       Int
  daysType        String   // calendar, business, court
  direction       String   // after, before
  includeStartDate Boolean @default(false)
  
  // Adjustments
  adjustForWeekends Boolean @default(true)
  adjustForHolidays Boolean @default(true)
  
  // Metadata
  description     String?
  citation        String?  // Legal citation
  effectiveDate   DateTime?
  expirationDate  DateTime?
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  organization Organization? @relation(fields: [organizationId], references: [id])
  
  @@unique([ruleCode, jurisdiction])
}

model EFilingSubmission {
  id              String   @id @default(uuid())
  matterId        String
  courtId         String
  
  // Submission
  submissionType  String   // initial_filing, subsequent_filing, service
  documentType    String
  documentTitle   String
  
  // Documents
  documentIds     String[] // Documents being filed
  
  // Filing Details
  filingParty     String
  filingAttorney  String
  
  // Status
  status          String   @default("draft") // draft, submitted, accepted, rejected, processing
  submittedAt     DateTime?
  acceptedAt      DateTime?
  rejectedAt      DateTime?
  rejectionReason String?
  
  // External
  externalSubmissionId String?
  confirmationNumber String?
  filingFee       Decimal? @db.Decimal(10, 2)
  feePaymentStatus String?
  
  // Response
  stampedDocumentUrl String?
  filedDate       DateTime?
  docketEntryNumber Int?
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  matter Matter @relation(fields: [matterId], references: [id])
  court  Court  @relation(fields: [courtId], references: [id])
}
```

#### API Endpoints

```
# Courts
GET    /api/courts                            - List courts
GET    /api/courts/:id                        - Get court details
GET    /api/courts/:id/judges                 - Get court judges
GET    /api/courts/:id/rules                  - Get court rules

# Docket
POST   /api/matters/:id/docket                - Add docket entry
GET    /api/matters/:id/docket                - Get docket entries
PATCH  /api/docket/:id                        - Update docket entry
POST   /api/matters/:id/docket/import         - Import from PACER
POST   /api/matters/:id/docket/sync           - Sync with court system

# Deadlines
POST   /api/matters/:id/deadlines             - Create deadline
GET    /api/matters/:id/deadlines             - Get matter deadlines
GET    /api/deadlines                         - Get all deadlines (firm-wide)
PATCH  /api/deadlines/:id                     - Update deadline
POST   /api/deadlines/:id/complete            - Mark complete
POST   /api/deadlines/:id/extend              - Request extension
DELETE /api/deadlines/:id                     - Cancel deadline

# Deadline Rules
GET    /api/deadline-rules                    - List deadline rules
POST   /api/deadline-rules/calculate          - Calculate deadline from rule

# E-Filing
POST   /api/matters/:id/e-filing              - Create e-filing submission
GET    /api/matters/:id/e-filing              - Get submissions
POST   /api/e-filing/:id/submit               - Submit to court
GET    /api/e-filing/:id/status               - Check status

# AI Features
GET    /api/deadlines/ai/at-risk              - Get at-risk deadlines
POST   /api/matters/:id/ai/deadline-cascade   - Calculate cascading deadlines
```

#### Acceptance Criteria
- [ ] PACER import retrieves complete docket
- [ ] Deadline calculation matches court rules
- [ ] Cascading deadline updates complete in < 10 seconds
- [ ] E-filing validation catches 95% of formatting errors
- [ ] AI risk scoring identifies 80% of missed deadlines in advance
- [ ] UI follows deep black/white color scheme

---

## PHASE 12.2 SUMMARY

### Deliverables Checklist

| Session | Deliverable | Status |
|---------|-------------|--------|
| 12.2.1 | Lead Capture | ⬜ Pending |
| 12.2.1 | Lead Qualification | ⬜ Pending |
| 12.2.1 | Lead Nurturing | ⬜ Pending |
| 12.2.1 | AI Lead Features | ⬜ Pending |
| 12.2.2 | Contact Database | ⬜ Pending |
| 12.2.2 | Client Onboarding | ⬜ Pending |
| 12.2.2 | Communication Log | ⬜ Pending |
| 12.2.2 | AI CRM Features | ⬜ Pending |
| 12.2.3 | Matter Setup | ⬜ Pending |
| 12.2.3 | Matter Dashboard | ⬜ Pending |
| 12.2.3 | Matter Workflows | ⬜ Pending |
| 12.2.3 | AI Matter Features | ⬜ Pending |
| 12.2.4 | Court Calendar Integration | ⬜ Pending |
| 12.2.4 | Deadline Management | ⬜ Pending |
| 12.2.4 | Electronic Filing | ⬜ Pending |
| 12.2.4 | AI Docket Features | ⬜ Pending |

### Success Metrics

| Metric | Target |
|--------|--------|
| Lead conversion rate | > 15% improvement |
| AI lead scoring accuracy | > 70% |
| Conflict check speed | < 5 seconds |
| Client health score accuracy | > 75% |
| AI case outcome prediction | > 65% |
| Deadline compliance rate | > 98% |

### Team Requirements

| Role | Count | Responsibilities |
|------|-------|------------------|
| Backend Engineer | 3 | API development, integrations |
| Frontend Engineer | 2 | UI components, dashboards |
| AI Engineer | 1 | Lead scoring, predictions |
| Compliance Consultant | 1 | Court rules, e-filing |
| QA Engineer | 1 | Testing, validation |

---

**Document Version:** 3.0  
**Last Updated:** December 12, 2025  
**Status:** Ready for Development  
**Next Phase:** Phase 12.3 - Workflow & Productivity

---
