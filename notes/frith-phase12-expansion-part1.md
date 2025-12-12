# FRITH AI - PHASE 12: COMPLETE LEGAL PRACTICE MANAGEMENT PLATFORM

**From AI Tool Platform to Industry-Leading Legal Management Suite**  
**Version:** 2.0  
**Timeline:** Months 19-30 (12 months)  
**Goal:** Transform Frith AI into the most advanced, AI-powered legal practice management platform

---

## EXECUTIVE SUMMARY

Frith AI will expand beyond its 240 AI tools to become a comprehensive legal practice management platform that rivals and surpasses Clio, MyCase, and PracticePanther. By integrating AI throughout every aspect of law firm operations—from client intake to financial management—Frith will offer unprecedented automation, intelligence, and efficiency.

**Key Differentiators:**
- **AI-First Architecture:** Every module enhanced with AI (not bolted on)
- **Global-Ready:** Multi-currency, multi-language, multi-jurisdiction
- **Predictive Intelligence:** AI predicts case outcomes, billing issues, resource needs
- **Unified Platform:** Zero switching between systems
- **Smart Automation:** 70% reduction in manual administrative tasks

---

## PHASE 12 OVERVIEW

### Core Modules (12 + 3 New)

**Existing Modules to Enhance:**
1. Calendar & Scheduling
2. Tasks & Workflow Management
3. Cases & Matters Management
4. Contacts & CRM
5. Activities & Time Tracking
6. Accounts & Financial Management
7. Documents & Knowledge Management
8. Communications Hub
9. Leads & Client Intake
10. Reports & Analytics
11. Integrations & API Ecosystem
12. Resources & Support

**New Strategic Modules:**
13. **Trust Accounting & IOLTA Compliance** (Critical for legal)
14. **Court & Docket Management** (AI-powered filing & tracking)
15. **Legal Research Integration** (AI + Westlaw/LexisNexis)

---

## DEVELOPMENT TIMELINE

```
Month 19-21: Financial Core (Trust Accounting, Billing, Accounts)
Month 22-24: Client Lifecycle (Intake, CRM, Cases, Communications)
Month 25-27: Workflow & Productivity (Calendar, Tasks, Time Tracking, Court Management)
Month 28-30: Intelligence Layer (Advanced AI, Analytics, Integrations, Global Features)
```

---

# SPRINT 12.1: FINANCIAL MANAGEMENT CORE
**Timeline:** Months 19-21 (12 weeks)  
**Team:** Backend (3), Frontend (2), Compliance (1), AI Engineer (1)

---

## Module 6: Accounts & Financial Management

### Week 1-2: Chart of Accounts & General Ledger

**Core Accounting Features:**
- [ ] **AI-Powered Chart of Accounts Setup:**
  - Pre-configured templates by practice area (litigation, corporate, IP, etc.)
  - AI suggests account structure based on firm size and jurisdiction
  - Multi-currency support (190+ currencies with real-time exchange rates)
  
- [ ] **General Ledger:**
  - Double-entry bookkeeping (compliant with GAAP/IFRS)
  - Multi-entity/multi-office support
  - Automatic journal entries from billing, expenses, trust transfers
  - AI flags unusual transactions (potential errors or fraud)

**AI Features:**
- AI categorizes expenses automatically (learns from user corrections)
- Predictive cash flow forecasting (3-month rolling forecast)
- Smart expense splitting (shared costs across matters/clients)

**Database Schema:**
```prisma
model ChartOfAccount {
  id              String   @id @default(uuid())
  organizationId  String
  accountNumber   String   // e.g., "1000-Assets-Cash"
  accountName     String
  accountType     String   // asset, liability, equity, revenue, expense
  parentId        String?  // For hierarchical structure
  currency        String   @default("USD")
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  transactions GeneralLedgerEntry[]
}

model GeneralLedgerEntry {
  id          String   @id @default(uuid())
  accountId   String
  debit       Decimal  @db.Decimal(15, 2)
  credit      Decimal  @db.Decimal(15, 2)
  description String
  referenceId String?  // Links to invoice, expense, trust transfer
  referenceType String? // invoice, expense, trust_transfer, manual
  currency    String   @default("USD")
  exchangeRate Decimal? @db.Decimal(10, 4)
  postedDate  DateTime
  createdBy   String
  createdAt   DateTime @default(now())
  
  account ChartOfAccount @relation(fields: [accountId], references: [id])
}
```

---

### Week 3-6: Trust Accounting & IOLTA Compliance

**Critical Legal Requirement:**

Reference: Trust accounting must prevent commingling of client funds with operating accounts and perform comprehensive three-way reconciliations.

**Core Trust Features:**
- [ ] **IOLTA Account Management:**
  - Separate trust ledger per client/matter
  - Operating account separation (zero commingling)
  - Multi-bank account support (different banks per state)
  - Interest calculation and distribution (IOLTA rules)
  
- [ ] **Three-Way Reconciliation (Automated):**
  - Bank statement vs. Trust ledger vs. Client ledger
  - Daily automated reconciliation
  - AI flags discrepancies instantly
  - One-click generate reconciliation reports (audit-ready)
  
- [ ] **Trust Transaction Management:**
  - Deposit client funds (retainers, settlements)
  - Transfer to operating account (earned fees only)
  - Disburse to third parties (court costs, experts)
  - Refund unearned fees
  - AI prevents overdrafts on client sub-ledgers
  
- [ ] **Compliance & Reporting:**
  - Compliance with IOLA/IOLTA guidelines and all 50 state bar rules
  - Automatic compliance checks (e.g., negative balance prevention)
  - Generate ABA-required reports (client ledger detail, reconciliation)
  - Audit trail (every transaction logged with user, timestamp, reason)
  - Integration with LawPay for compliant credit card processing

**AI Trust Accounting Features:**
- **AI Trust Monitor:** Real-time alerts for compliance violations:
  - Potential commingling detected
  - Client sub-ledger negative balance warning
  - Unusual withdrawal patterns (fraud detection)
  - Missing reconciliation (sends alerts to admin)
- **Smart Fee Transfer:** AI suggests optimal timing to transfer earned fees to operating
- **Predictive Trust Balance:** Forecasts when client trust will be depleted (prompts retainer request)

**Database Schema:**
```prisma
model TrustAccount {
  id              String   @id @default(uuid())
  organizationId  String
  accountName     String   // e.g., "IOLTA Account - Bank of America"
  bankName        String
  accountNumber   String   @db.Encrypt // Encrypted
  routingNumber   String?  @db.Encrypt
  accountType     String   @default("IOLTA") // IOLTA, client_trust
  currency        String   @default("USD")
  currentBalance  Decimal  @db.Decimal(15, 2)
  isActive        Boolean  @default(true)
  stateBar        String?  // e.g., "California State Bar"
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  transactions TrustTransaction[]
  clientLedgers ClientTrustLedger[]
}

model ClientTrustLedger {
  id              String   @id @default(uuid())
  trustAccountId  String
  clientId        String
  matterId        String?
  balance         Decimal  @db.Decimal(15, 2) @default(0)
  currency        String   @default("USD")
  lastActivity    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  trustAccount TrustAccount @relation(fields: [trustAccountId], references: [id])
  client       Contact      @relation(fields: [clientId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
  transactions TrustTransaction[]
  
  @@unique([trustAccountId, clientId, matterId])
}

model TrustTransaction {
  id              String   @id @default(uuid())
  trustAccountId  String
  clientLedgerId  String
  transactionType String   // deposit, transfer_to_operating, disbursement, refund
  amount          Decimal  @db.Decimal(15, 2)
  currency        String   @default("USD")
  description     String
  paymentMethod   String?  // check, wire, credit_card, ach
  checkNumber     String?
  referenceNumber String?  // Invoice ID if transferring earned fees
  fromAccount     String?  // For transfers
  toAccount       String?
  transactionDate DateTime
  postedDate      DateTime?
  reconciledDate  DateTime?
  isReconciled    Boolean  @default(false)
  createdBy       String
  approvedBy      String?
  createdAt       DateTime @default(now())
  
  trustAccount   TrustAccount       @relation(fields: [trustAccountId], references: [id])
  clientLedger   ClientTrustLedger  @relation(fields: [clientLedgerId], references: [id])
  auditLog       AuditLog[]
}

model TrustReconciliation {
  id                  String   @id @default(uuid())
  trustAccountId      String
  reconciliationDate  DateTime
  bankBalance         Decimal  @db.Decimal(15, 2)
  trustLedgerBalance  Decimal  @db.Decimal(15, 2)
  clientLedgersTotal  Decimal  @db.Decimal(15, 2)
  isBalanced          Boolean  @default(false)
  discrepancy         Decimal? @db.Decimal(15, 2)
  notes               String?
  reconciledBy        String
  createdAt           DateTime @default(now())
}
```

**Compliance Checklist:**
- [ ] ABA Model Rules compliance
- [ ] All 50 state bar rules database (jurisdiction-specific validation)
- [ ] Automatic trust reports (monthly, per state requirements)
- [ ] Integration with state bar IOLTA programs (where applicable)

---

### Week 7-9: Billing & Invoicing

**Core Billing Features:**
- [ ] **Time & Expense Billing:**
  - Hourly billing (by attorney rate)
  - Fixed fee matters
  - Contingency fee tracking (percentage-based)
  - Hybrid billing (mix of hourly + fixed)
  - Automatic time entry from activities (emails, docs, calls)
  
- [ ] **Invoice Generation:**
  - Customizable invoice templates (multi-language)
  - LEDES billing format (for corporate clients)
  - UTBMS codes (task and expense codes)
  - Multi-currency invoicing (bill in client's currency)
  - Batch invoicing (generate 100s of invoices at once)
  
- [ ] **Payment Processing:**
  - Online payments (credit card, ACH, wire)
  - Payment plans (installments with auto-billing)
  - Trust retainer auto-deduction
  - Late payment reminders (AI-scheduled)
  - Integration: Stripe, LawPay, PayPal

**AI Billing Features:**
- **AI Invoice Review:** Scans invoices before sending:
  - Flags missing time entries (compares to calendar)
  - Suggests adjustments (e.g., round down to nearest 0.1 hour)
  - Identifies potentially write-off-able time (excessive research)
  - Predicts payment probability (client history + amount)
- **Smart Write-Offs:** AI suggests write-offs/adjustments based on:
  - Client relationship value
  - Matter profitability
  - Historical write-off patterns
- **Revenue Forecasting:** Predicts monthly revenue based on unbilled time + pipeline

**Database Schema:**
```prisma
model Invoice {
  id              String   @id @default(uuid())
  invoiceNumber   String   @unique // Auto-generated: INV-2025-001
  organizationId  String
  clientId        String
  matterId        String?
  billingType     String   // hourly, fixed_fee, contingency, hybrid
  status          String   @default("draft") // draft, sent, paid, overdue, cancelled
  issueDate       DateTime
  dueDate         DateTime
  subtotal        Decimal  @db.Decimal(15, 2)
  taxAmount       Decimal  @db.Decimal(15, 2) @default(0)
  discountAmount  Decimal  @db.Decimal(15, 2) @default(0)
  totalAmount     Decimal  @db.Decimal(15, 2)
  paidAmount      Decimal  @db.Decimal(15, 2) @default(0)
  balanceDue      Decimal  @db.Decimal(15, 2)
  currency        String   @default("USD")
  exchangeRate    Decimal? @db.Decimal(10, 4)
  paymentTerms    String?  // "Net 30", "Upon Receipt"
  notes           String?
  sentAt          DateTime?
  paidAt          DateTime?
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization    @relation(fields: [organizationId], references: [id])
  client       Contact         @relation(fields: [clientId], references: [id])
  matter       Matter?         @relation(fields: [matterId], references: [id])
  lineItems    InvoiceLineItem[]
  payments     Payment[]
  reminders    PaymentReminder[]
}

model InvoiceLineItem {
  id              String   @id @default(uuid())
  invoiceId       String
  itemType        String   // time_entry, expense, fixed_fee, adjustment
  description     String
  quantity        Decimal  @db.Decimal(10, 2) // Hours or units
  rate            Decimal  @db.Decimal(15, 2)
  amount          Decimal  @db.Decimal(15, 2)
  utbmsCode       String?  // For LEDES billing
  timeEntryId     String?  // Link to time entry
  expenseId       String?  // Link to expense
  taxable         Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  invoice   Invoice    @relation(fields: [invoiceId], references: [id])
  timeEntry TimeEntry? @relation(fields: [timeEntryId], references: [id])
  expense   Expense?   @relation(fields: [expenseId], references: [id])
}

model Payment {
  id              String   @id @default(uuid())
  invoiceId       String
  amount          Decimal  @db.Decimal(15, 2)
  paymentMethod   String   // credit_card, ach, check, wire, trust_transfer
  paymentDate     DateTime
  transactionId   String?  // Stripe/LawPay transaction ID
  referenceNumber String?  // Check number
  notes           String?
  processedBy     String
  createdAt       DateTime @default(now())
  
  invoice Invoice @relation(fields: [invoiceId], references: [id])
}
```

---

### Week 10-12: Expense Management & Accounts Payable

**Core Expense Features:**
- [ ] **Expense Tracking:**
  - Categorized expenses (court fees, expert witnesses, filing fees, etc.)
  - Receipt upload (OCR extraction of amount, vendor, date)
  - Billable vs. non-billable expenses
  - Mileage tracking (GPS integration, IRS rates)
  - Multi-currency expenses (travel)
  
- [ ] **Vendor Management:**
  - Vendor database (expert witnesses, court reporters, process servers)
  - Vendor invoices (approval workflow)
  - 1099 tracking (for tax reporting)
  - Vendor performance ratings (AI-tracked)
  
- [ ] **Accounts Payable:**
  - Bill pay (ACH, check printing, wire)
  - Approval workflows (multi-level for large expenses)
  - Scheduled payments
  - Vendor credits tracking

**AI Expense Features:**
- **AI Receipt Scanner:** OCR + AI extracts:
  - Vendor name, amount, date, tax amount
  - Suggests expense category
  - Links to matter automatically (if mentioned in receipt/notes)
- **Expense Policy Enforcer:** Flags out-of-policy expenses:
  - Meal over limit ($50 default, configurable)
  - Travel without approval
  - Duplicate expense submissions
- **Predictive Vendor Selection:** AI recommends vendors based on:
  - Past performance
  - Cost
  - Availability
  - Matter type

**Database Schema:**
```prisma
model Expense {
  id              String   @id @default(uuid())
  organizationId  String
  matterId        String?
  clientId        String?
  userId          String   // Who incurred the expense
  category        String   // court_fees, expert_witness, travel, etc.
  vendorId        String?
  amount          Decimal  @db.Decimal(15, 2)
  currency        String   @default("USD")
  exchangeRate    Decimal? @db.Decimal(10, 4)
  expenseDate     DateTime
  isBillable      Boolean  @default(true)
  isBilled        Boolean  @default(false)
  invoiceId       String?  // If billed to client
  receiptUrl      String?
  description     String
  paymentMethod   String?  // firm_card, personal, cash
  reimbursed      Boolean  @default(false)
  approvalStatus  String   @default("pending") // pending, approved, rejected
  approvedBy      String?
  approvedAt      DateTime?
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
  vendor       Vendor?      @relation(fields: [vendorId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
  invoice      Invoice?     @relation(fields: [invoiceId], references: [id])
}

model Vendor {
  id              String   @id @default(uuid())
  organizationId  String
  name            String
  vendorType      String   // expert_witness, court_reporter, process_server, etc.
  email           String?
  phone           String?
  address         String?
  taxId           String?  @db.Encrypt // For 1099 reporting
  paymentTerms    String?
  rating          Decimal? @db.Decimal(3, 2) // 0-5.0 stars
  totalPaid       Decimal  @db.Decimal(15, 2) @default(0)
  notes           String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  expenses     Expense[]
}
```

**Deliverables:**
- âœ… Trust accounting with IOLTA compliance (all 50 states)
- âœ… Three-way reconciliation (automated)
- âœ… Full billing & invoicing system (LEDES support)
- âœ… Expense management with AI receipt scanning
- âœ… General ledger & chart of accounts
- âœ… Multi-currency support (190+ currencies)
- âœ… AI financial monitoring (fraud detection, compliance alerts)

---

# SPRINT 12.2: CLIENT LIFECYCLE MANAGEMENT
**Timeline:** Months 22-24 (12 weeks)  
**Team:** Backend (3), Frontend (2), AI Engineer (1)

---

## Module 9: Leads & Client Intake

### Week 1-3: Lead Management System

**Core Lead Features:**
- [ ] **Lead Capture:**
  - Web forms (embedded on firm website)
  - Chatbot integration (from Phase 6)
  - Phone call logging (Twilio integration)
  - Email leads (forwarding to leads@firm.com)
  - Referral tracking (who referred this lead)
  
- [ ] **Lead Qualification:**
  - Custom intake questionnaires (per practice area)
  - Conflict check integration (automatic)
  - AI lead scoring (1-100, predict conversion probability)
  - Lead source tracking (Google Ads, referral, organic)
  
- [ ] **Lead Nurturing:**
  - Automated follow-up sequences (email drip campaigns)
  - Task assignments (schedule consultation call)
  - Lead status pipeline (New â†' Contacted â†' Qualified â†' Converted)
  - Lead aging alerts (no contact in 7 days)

**AI Lead Features:**
- **AI Lead Scorer:** Predicts conversion probability based on:
  - Matter type + firm's historical win rate
  - Lead source quality
  - Response time to inquiry
  - Budget vs. estimated fees
- **Smart Lead Routing:** Auto-assigns leads to best attorney:
  - Practice area match
  - Attorney availability
  - Historical conversion rate
  - Workload balance
- **AI Intake Assistant:** Pre-fills intake forms using:
  - Data from chatbot conversation
  - Public records (if personal injury, pulls police reports)
  - Social media enrichment (LinkedIn, if corporate client)

**Database Schema:**
```prisma
model Lead {
  id              String   @id @default(uuid())
  organizationId  String
  firstName       String
  lastName        String
  email           String
  phone           String?
  company         String?  // For business leads
  practiceArea    String   // litigation, estate_planning, etc.
  leadSource      String   // website, referral, google_ads, phone
  referredBy      String?  // Name of referrer
  description     String?  // Brief summary of legal issue
  budget          Decimal? @db.Decimal(15, 2)
  aiScore         Int?     // 1-100 lead quality score
  status          String   @default("new") // new, contacted, qualified, converted, lost
  assignedTo      String?  // Attorney ID
  convertedToClientId String?
  lostReason      String?
  capturedAt      DateTime @default(now())
  lastContactedAt DateTime?
  convertedAt     DateTime?
  
  organization Organization    @relation(fields: [organizationId], references: [id])
  activities   LeadActivity[]
  notes        LeadNote[]
}

model LeadActivity {
  id          String   @id @default(uuid())
  leadId      String
  activityType String  // email, call, meeting, form_submission
  description String
  userId      String?  // Who performed activity
  occurredAt  DateTime @default(now())
  
  lead Lead @relation(fields: [leadId], references: [id])
}
```

---

### Week 4-6: Contact & Client Management (CRM)

**Core CRM Features:**
- [ ] **Contact Database:**
  - Clients, prospects, referral sources, opposing counsel
  - Individual + organization contacts
  - Relationship mapping (family members, business partners)
  - Contact tagging (VIP, high-value, difficult, etc.)
  - Multi-language contact info (international clients)
  
- [ ] **Client Onboarding:**
  - E-signature engagement letters (DocuSign integration)
  - Conflict check (automatic against all matters)
  - Client portal access setup
  - Initial retainer collection (trust account deposit)
  - Welcome email automation
  
- [ ] **Client Communication Log:**
  - All emails, calls, meetings in one timeline
  - Automatic logging (from email sync, calendar)
  - Notes & file attachments
  - Client portal messages

**AI CRM Features:**
- **AI Relationship Manager:** Suggests actions:
  - "Client's birthday is tomorrow—send a card"
  - "No contact in 90 days—schedule check-in call"
  - "Client mentioned opening new business—offer corporate services"
- **Smart Conflict Check:** AI-powered fuzzy matching:
  - Identifies potential conflicts (similar names, related entities)
  - Searches aliases, DBAs, former names
  - Cross-references adverse parties in past matters
- **Client Health Score:** Predicts client satisfaction & retention risk:
  - Based on communication frequency, invoice payment patterns
  - Alerts if client likely to churn (switch firms)

**Database Schema:**
```prisma
model Contact {
  id              String   @id @default(uuid())
  organizationId  String
  contactType     String   // client, prospect, referral_source, opposing_counsel, vendor
  entityType      String   // individual, organization
  // Individual fields
  firstName       String?
  lastName        String?
  middleName      String?
  // Organization fields
  companyName     String?
  // Common fields
  email           String?
  phone           String?
  alternatePhone  String?
  address         String?
  city            String?
  state           String?
  postalCode      String?
  country         String   @default("US")
  language        String   @default("en") // ISO 639-1 code
  tags            String[] // ["VIP", "High-Value"]
  clientSince     DateTime?
  lastContactDate DateTime?
  aiHealthScore   Int?     // 1-100 client health
  notes           String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization       @relation(fields: [organizationId], references: [id])
  matters      Matter[]
  invoices     Invoice[]
  activities   Activity[]
  relationships ContactRelationship[] @relation("ContactA")
  relatedTo     ContactRelationship[] @relation("ContactB")
}

model ContactRelationship {
  id             String   @id @default(uuid())
  contactAId     String
  contactBId     String
  relationship   String   // spouse, parent, business_partner, employee, etc.
  notes          String?
  createdAt      DateTime @default(now())
  
  contactA Contact @relation("ContactA", fields: [contactAId], references: [id])
  contactB Contact @relation("ContactB", fields: [contactBId], references: [id])
}
```

---

## Module 3: Cases & Matters Management

### Week 7-9: Matter Management Core

**Core Matter Features:**
- [ ] **Matter Setup:**
  - Matter types by practice area (litigation, transactional, estate, etc.)
  - Custom matter numbering (firm-specific format)
  - Multi-client matters (joint representation)
  - Matter stages/phases (discovery, trial, settlement)
  - Opposing parties & counsel tracking
  - Jurisdiction & venue
  
- [ ] **Matter Dashboard:**
  - At-a-glance matter status
  - Key dates & deadlines
  - Financial summary (budget vs. actual, trust balance)
  - Recent activity feed
  - Team members assigned
  
- [ ] **Matter Workflows:**
  - Checklists per matter type (e.g., "New Litigation Matter" checklist)
  - Automatic task creation (file complaint, serve defendant, etc.)
  - Stage transitions trigger actions (move to "Discovery" â†' create interrogatory tasks)

**AI Matter Features:**
- **AI Matter Setup:** Auto-populates matter details:
  - Extracts info from intake forms
  - Suggests practice area & matter type
  - Recommends team assignment (best attorneys for this case type)
- **Predictive Case Outcomes:** AI analyzes:
  - Similar past cases (win rate, settlement range)
  - Judge history (favorable/unfavorable rulings)
  - Opposing counsel patterns
  - Provides probability of success + estimated value
- **Smart Budget Forecasting:** Predicts total matter cost:
  - Based on matter type, complexity, court
  - Compares to historical similar matters
  - Alerts if over budget (real-time tracking)

**Database Schema:**
```prisma
model Matter {
  id                String   @id @default(uuid())
  organizationId    String
  matterNumber      String   @unique // e.g., "2025-LIT-001"
  matterName        String
  practiceArea      String   // litigation, corporate, estate_planning, etc.
  matterType        String   // civil_litigation, contract_negotiation, will_drafting
  description       String?
  status            String   @default("active") // active, pending, closed, archived
  stage             String?  // intake, discovery, trial, settlement, appeal
  openDate          DateTime @default(now())
  closeDate         DateTime?
  leadAttorneyId    String
  originatingAttorneyId String? // For origination credit
  responsibleAttorneyId String?
  jurisdiction      String?
  venue             String?  // Court name
  caseNumber        String?  // Court-assigned case number
  budget            Decimal? @db.Decimal(15, 2)
  estimatedValue    Decimal? @db.Decimal(15, 2)
  aiSuccessProbability Int?  // 1-100% AI prediction
  aiEstimatedCost   Decimal? @db.Decimal(15, 2)
  billingType       String   @default("hourly")
  isContingency     Boolean  @default(false)
  contingencyRate   Decimal? @db.Decimal(5, 2) // 33.33%
  conflictCheckDate DateTime?
  conflictCheckBy   String?
  notes             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  organization Organization  @relation(fields: [organizationId], references: [id])
  clients      MatterClient[]
  teamMembers  MatterTeamMember[]
  opposingParties OpposingParty[]
  tasks        Task[]
  activities   Activity[]
  documents    Document[]
  invoices     Invoice[]
  expenses     Expense[]
  timeEntries  TimeEntry[]
  trustLedgers ClientTrustLedger[]
  dockets      DocketEntry[]
}

model MatterClient {
  id        String   @id @default(uuid())
  matterId  String
  clientId  String
  isPrimary Boolean  @default(false)
  role      String?  // plaintiff, defendant, beneficiary, etc.
  createdAt DateTime @default(now())
  
  matter Matter  @relation(fields: [matterId], references: [id])
  client Contact @relation(fields: [clientId], references: [id])
  
  @@unique([matterId, clientId])
}

model OpposingParty {
  id             String   @id @default(uuid())
  matterId       String
  name           String
  entityType     String   // individual, organization
  counselName    String?
  counselFirm    String?
  counselEmail   String?
  counselPhone   String?
  role           String?  // defendant, respondent, opposing_party
  notes          String?
  createdAt      DateTime @default(now())
  
  matter Matter @relation(fields: [matterId], references: [id])
}
```

---

### Week 10-12: Court & Docket Management (NEW MODULE)

**Why Critical:** Law practice management software should handle legal calendaring and track court appearances.

**Core Docket Features:**
- [ ] **Court Calendar Integration:**
  - Electronic filing (e-filing) integrations by jurisdiction
  - Automatic docket retrieval (PACER for federal courts)
  - Court appearance tracking
  - Statute of limitations calculator
  
- [ ] **Deadline Management:**
  - Court-imposed deadlines (response due, filing deadlines)
  - Rule-based deadline calculation (e.g., "30 days after service")
  - Automatic deadline cascading (if trial date changes, update all pre-trial deadlines)
  - Multi-jurisdiction rules database
  
- [ ] **Electronic Filing:**
  - E-filing integrations (File & ServeXpress, Tyler Technologies)
  - Document assembly for court filings
  - Proof of service