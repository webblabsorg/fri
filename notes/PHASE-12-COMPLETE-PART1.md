# FRITH AI - PHASE 12: COMPLETE LEGAL ERP PLATFORM
## Part 1: Financial Core & Trust Accounting

**From AI Tool Platform to Industry-Leading Legal ERP**  
**Version:** 3.0  
**Timeline:** Months 19-21 (12 weeks)  
**Goal:** Build enterprise-grade financial management with IOLTA compliance

---

## DESIGN SYSTEM REQUIREMENTS

### Color Scheme (MANDATORY)

**Primary Colors:**
- **Deep Black:** `#000000` - Primary background color
- **Deep White:** `#FFFFFF` - Primary element/font color

**Application Rules:**
- **Landing Page (Homepage):** Deep black background, white elements/fonts ONLY
- **User Dashboard:** Deep black background, white elements/fonts ONLY
- **Admin Dashboard:** Deep black background, white elements/fonts ONLY
- **Resources/Support Center:** Deep black background, white elements/fonts ONLY

**Dark/Light Mode Toggle:**
- **Dark Mode (Default):** Deep black (`#000000`) background, white (`#FFFFFF`) elements
- **Light Mode:** Deep white (`#FFFFFF`) background, deep black (`#000000`) elements

**No Other Colors Allowed** in core UI surfaces. Accent colors may only be used for:
- Status indicators (success/error/warning) - use subtle variations
- Charts and data visualizations
- Third-party integrations

```css
/* CSS Variables */
:root {
  --color-background: #000000;
  --color-foreground: #FFFFFF;
  --color-surface: #0A0A0A;
  --color-border: #1A1A1A;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A0A0A0;
}

[data-theme="light"] {
  --color-background: #FFFFFF;
  --color-foreground: #000000;
  --color-surface: #F5F5F5;
  --color-border: #E5E5E5;
  --color-text-primary: #000000;
  --color-text-secondary: #606060;
}
```

---

## EXECUTIVE SUMMARY

Phase 12 transforms Frith AI from a 240-tool AI platform into a comprehensive Legal ERP system. This phase focuses on the **Financial Core** - the foundation that enables law firms to manage trust accounting, billing, invoicing, and expense management with full IOLTA compliance.

**Key Deliverables:**
- Trust Accounting with IOLTA compliance (all 50 US states + international)
- Three-way reconciliation (automated)
- Full billing & invoicing system (LEDES/UTBMS support)
- Expense management with AI receipt scanning
- General ledger & chart of accounts
- Multi-currency support (190+ currencies)
- AI financial monitoring (fraud detection, compliance alerts)

---

## SPRINT 12.1: FINANCIAL MANAGEMENT CORE
**Timeline:** Weeks 1-12 (Months 19-21)  
**Team:** Backend (3), Frontend (2), Compliance (1), AI Engineer (1)

---

### Session 12.1.1: Chart of Accounts & General Ledger
**Timeline:** Weeks 1-2  
**Owner:** Backend Lead + Finance Consultant

#### Deliverables

**D-12.1.1.1: AI-Powered Chart of Accounts Setup**
- [ ] Pre-configured templates by practice area:
  - Litigation firms
  - Corporate/Transactional firms
  - IP/Patent practices
  - Estate planning
  - Criminal defense
  - Immigration
  - Family law
- [ ] AI suggests account structure based on:
  - Firm size (solo, small, mid, large)
  - Jurisdiction (US, UK, Canada, EU, etc.)
  - Practice areas selected
- [ ] Multi-currency support (190+ currencies with real-time exchange rates)
- [ ] Account hierarchy (parent/child relationships)

**D-12.1.1.2: General Ledger Implementation**
- [ ] Double-entry bookkeeping (GAAP/IFRS compliant)
- [ ] Multi-entity/multi-office support
- [ ] Automatic journal entries from:
  - Billing transactions
  - Expense entries
  - Trust transfers
  - Payment receipts
- [ ] AI flags unusual transactions (potential errors or fraud)
- [ ] Audit trail for all entries

**D-12.1.1.3: AI Financial Features**
- [ ] AI categorizes expenses automatically (learns from user corrections)
- [ ] Predictive cash flow forecasting (3-month rolling forecast)
- [ ] Smart expense splitting (shared costs across matters/clients)
- [ ] Anomaly detection for unusual patterns

#### Database Schema

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
  description     String?
  normalBalance   String   // debit, credit
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  parent       ChartOfAccount? @relation("AccountHierarchy", fields: [parentId], references: [id])
  children     ChartOfAccount[] @relation("AccountHierarchy")
  transactions GeneralLedgerEntry[]
  
  @@unique([organizationId, accountNumber])
}

model GeneralLedgerEntry {
  id            String   @id @default(uuid())
  organizationId String
  accountId     String
  journalId     String   // Groups related entries
  debit         Decimal  @db.Decimal(15, 2)
  credit        Decimal  @db.Decimal(15, 2)
  description   String
  referenceId   String?  // Links to invoice, expense, trust transfer
  referenceType String?  // invoice, expense, trust_transfer, manual
  currency      String   @default("USD")
  exchangeRate  Decimal? @db.Decimal(10, 6)
  baseCurrencyAmount Decimal? @db.Decimal(15, 2)
  postedDate    DateTime
  fiscalYear    Int
  fiscalPeriod  Int      // 1-12 for months
  isReconciled  Boolean  @default(false)
  reconciledAt  DateTime?
  reconciledBy  String?
  createdBy     String
  createdAt     DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  account      ChartOfAccount @relation(fields: [accountId], references: [id])
  journal      JournalEntry @relation(fields: [journalId], references: [id])
}

model JournalEntry {
  id              String   @id @default(uuid())
  organizationId  String
  journalNumber   String   // Auto-generated: JE-2025-0001
  journalType     String   // standard, adjusting, closing, reversing
  description     String
  postedDate      DateTime
  status          String   @default("draft") // draft, posted, reversed
  totalDebit      Decimal  @db.Decimal(15, 2)
  totalCredit     Decimal  @db.Decimal(15, 2)
  createdBy       String
  approvedBy      String?
  approvedAt      DateTime?
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  entries      GeneralLedgerEntry[]
  
  @@unique([organizationId, journalNumber])
}
```

#### API Endpoints

```
POST   /api/finance/accounts              - Create account
GET    /api/finance/accounts              - List accounts (with hierarchy)
GET    /api/finance/accounts/:id          - Get account details
PATCH  /api/finance/accounts/:id          - Update account
DELETE /api/finance/accounts/:id          - Deactivate account

POST   /api/finance/journal-entries       - Create journal entry
GET    /api/finance/journal-entries       - List journal entries
GET    /api/finance/journal-entries/:id   - Get journal entry
POST   /api/finance/journal-entries/:id/post - Post journal entry
POST   /api/finance/journal-entries/:id/reverse - Reverse journal entry

GET    /api/finance/ledger                - Get general ledger
GET    /api/finance/trial-balance         - Get trial balance
GET    /api/finance/balance-sheet         - Get balance sheet
GET    /api/finance/income-statement      - Get income statement
```

#### Acceptance Criteria
- [ ] Chart of accounts supports unlimited hierarchy depth
- [ ] All journal entries balance (debits = credits)
- [ ] Multi-currency transactions convert correctly
- [ ] AI categorization accuracy > 85%
- [ ] Cash flow forecast accuracy > 80% (measured after 3 months)
- [ ] UI follows deep black/white color scheme

---

### Session 12.1.2: Trust Accounting & IOLTA Compliance
**Timeline:** Weeks 3-6  
**Owner:** Backend Lead + Compliance Consultant

#### Deliverables

**D-12.1.2.1: IOLTA Account Management**
- [ ] Separate trust ledger per client/matter
- [ ] Operating account separation (zero commingling)
- [ ] Multi-bank account support (different banks per state/jurisdiction)
- [ ] Interest calculation and distribution (IOLTA rules)
- [ ] Support for all 50 US state bar rules
- [ ] International trust accounting (UK, Canada, Australia, EU)

**D-12.1.2.2: Three-Way Reconciliation (Automated)**
- [ ] Bank statement import (CSV, OFX, QFX formats)
- [ ] Bank statement vs. Trust ledger reconciliation
- [ ] Trust ledger vs. Client ledger reconciliation
- [ ] Daily automated reconciliation option
- [ ] AI flags discrepancies instantly
- [ ] One-click generate reconciliation reports (audit-ready)
- [ ] Historical reconciliation archive

**D-12.1.2.3: Trust Transaction Management**
- [ ] Deposit client funds (retainers, settlements)
- [ ] Transfer to operating account (earned fees only)
- [ ] Disburse to third parties (court costs, experts)
- [ ] Refund unearned fees
- [ ] AI prevents overdrafts on client sub-ledgers
- [ ] Batch transaction processing
- [ ] Check printing integration

**D-12.1.2.4: Compliance & Reporting**
- [ ] Compliance with all 50 state bar rules database
- [ ] Automatic compliance checks:
  - Negative balance prevention
  - Commingling detection
  - Dormant account alerts
  - Interest distribution compliance
- [ ] Generate ABA-required reports:
  - Client ledger detail
  - Trust reconciliation report
  - Trust transaction register
  - Interest distribution report
- [ ] Complete audit trail (every transaction logged)
- [ ] Integration with LawPay for compliant credit card processing

**D-12.1.2.5: AI Trust Accounting Features**
- [ ] **AI Trust Monitor:** Real-time alerts for:
  - Potential commingling detected
  - Client sub-ledger negative balance warning
  - Unusual withdrawal patterns (fraud detection)
  - Missing reconciliation (sends alerts to admin)
  - Dormant account notifications
- [ ] **Smart Fee Transfer:** AI suggests optimal timing to transfer earned fees
- [ ] **Predictive Trust Balance:** Forecasts when client trust will be depleted
- [ ] **Compliance Risk Score:** AI rates each account's compliance risk

#### Database Schema

```prisma
model TrustAccount {
  id              String   @id @default(uuid())
  organizationId  String
  accountName     String   // e.g., "IOLTA Account - Bank of America"
  bankName        String
  accountNumber   String   // Encrypted
  routingNumber   String?  // Encrypted
  accountType     String   @default("IOLTA") // IOLTA, client_trust, escrow
  currency        String   @default("USD")
  currentBalance  Decimal  @db.Decimal(15, 2) @default(0)
  lastReconciledBalance Decimal? @db.Decimal(15, 2)
  lastReconciledDate DateTime?
  isActive        Boolean  @default(true)
  jurisdiction    String   // e.g., "California", "New York"
  stateBarId      String?  // State bar identifier
  interestRate    Decimal? @db.Decimal(5, 4) // For interest-bearing accounts
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization    Organization @relation(fields: [organizationId], references: [id])
  transactions    TrustTransaction[]
  clientLedgers   ClientTrustLedger[]
  reconciliations TrustReconciliation[]
  bankStatements  BankStatement[]
}

model ClientTrustLedger {
  id              String   @id @default(uuid())
  trustAccountId  String
  clientId        String
  matterId        String?
  ledgerName      String   // Display name for this ledger
  balance         Decimal  @db.Decimal(15, 2) @default(0)
  currency        String   @default("USD")
  status          String   @default("active") // active, dormant, closed
  lastActivityAt  DateTime?
  dormantSince    DateTime?
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
  transactionType String   // deposit, transfer_to_operating, disbursement, refund, interest
  amount          Decimal  @db.Decimal(15, 2)
  runningBalance  Decimal  @db.Decimal(15, 2) // Balance after this transaction
  currency        String   @default("USD")
  description     String
  paymentMethod   String?  // check, wire, credit_card, ach, cash
  checkNumber     String?
  referenceNumber String?  // Invoice ID if transferring earned fees
  payee           String?  // For disbursements
  fromAccount     String?  // For transfers
  toAccount       String?
  transactionDate DateTime
  postedDate      DateTime?
  clearedDate     DateTime?
  isCleared       Boolean  @default(false)
  isReconciled    Boolean  @default(false)
  reconciledDate  DateTime?
  reconciledBy    String?
  voidedAt        DateTime?
  voidedBy        String?
  voidReason      String?
  createdBy       String
  approvedBy      String?
  approvedAt      DateTime?
  createdAt       DateTime @default(now())
  
  trustAccount   TrustAccount       @relation(fields: [trustAccountId], references: [id])
  clientLedger   ClientTrustLedger  @relation(fields: [clientLedgerId], references: [id])
  auditLogs      TrustAuditLog[]
}

model TrustReconciliation {
  id                  String   @id @default(uuid())
  trustAccountId      String
  reconciliationDate  DateTime
  periodStart         DateTime
  periodEnd           DateTime
  bankStatementId     String?
  bankBalance         Decimal  @db.Decimal(15, 2)
  trustLedgerBalance  Decimal  @db.Decimal(15, 2)
  clientLedgersTotal  Decimal  @db.Decimal(15, 2)
  outstandingDeposits Decimal  @db.Decimal(15, 2) @default(0)
  outstandingChecks   Decimal  @db.Decimal(15, 2) @default(0)
  adjustedBankBalance Decimal  @db.Decimal(15, 2)
  isBalanced          Boolean  @default(false)
  discrepancy         Decimal? @db.Decimal(15, 2)
  discrepancyNotes    String?
  status              String   @default("draft") // draft, completed, approved
  notes               String?
  reconciledBy        String
  approvedBy          String?
  approvedAt          DateTime?
  createdAt           DateTime @default(now())
  
  trustAccount TrustAccount @relation(fields: [trustAccountId], references: [id])
  bankStatement BankStatement? @relation(fields: [bankStatementId], references: [id])
}

model BankStatement {
  id              String   @id @default(uuid())
  trustAccountId  String
  statementDate   DateTime
  periodStart     DateTime
  periodEnd       DateTime
  openingBalance  Decimal  @db.Decimal(15, 2)
  closingBalance  Decimal  @db.Decimal(15, 2)
  totalDeposits   Decimal  @db.Decimal(15, 2)
  totalWithdrawals Decimal @db.Decimal(15, 2)
  fileUrl         String?  // Uploaded statement file
  importedAt      DateTime @default(now())
  importedBy      String
  
  trustAccount    TrustAccount @relation(fields: [trustAccountId], references: [id])
  reconciliations TrustReconciliation[]
  transactions    BankStatementTransaction[]
}

model BankStatementTransaction {
  id              String   @id @default(uuid())
  bankStatementId String
  transactionDate DateTime
  description     String
  amount          Decimal  @db.Decimal(15, 2)
  transactionType String   // debit, credit
  checkNumber     String?
  referenceNumber String?
  isMatched       Boolean  @default(false)
  matchedTransactionId String?
  
  bankStatement BankStatement @relation(fields: [bankStatementId], references: [id])
}

model TrustAuditLog {
  id              String   @id @default(uuid())
  trustTransactionId String?
  eventType       String   // created, modified, voided, reconciled, approved
  eventData       Json
  userId          String
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime @default(now())
  
  transaction TrustTransaction? @relation(fields: [trustTransactionId], references: [id])
}

model JurisdictionRule {
  id              String   @id @default(uuid())
  jurisdiction    String   // "California", "New York", "England & Wales"
  country         String
  ruleType        String   // trust_accounting, interest_distribution, reporting
  ruleName        String
  ruleDescription String
  ruleData        Json     // Specific rule parameters
  effectiveDate   DateTime
  expirationDate  DateTime?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  @@unique([jurisdiction, ruleType, ruleName])
}
```

#### API Endpoints

```
# Trust Accounts
POST   /api/trust/accounts                    - Create trust account
GET    /api/trust/accounts                    - List trust accounts
GET    /api/trust/accounts/:id                - Get trust account details
PATCH  /api/trust/accounts/:id                - Update trust account
DELETE /api/trust/accounts/:id                - Deactivate trust account

# Client Ledgers
POST   /api/trust/accounts/:id/ledgers        - Create client ledger
GET    /api/trust/accounts/:id/ledgers        - List client ledgers
GET    /api/trust/ledgers/:id                 - Get ledger details
GET    /api/trust/ledgers/:id/transactions    - Get ledger transactions

# Transactions
POST   /api/trust/transactions                - Create transaction
GET    /api/trust/transactions                - List transactions
GET    /api/trust/transactions/:id            - Get transaction details
POST   /api/trust/transactions/:id/void       - Void transaction
POST   /api/trust/transactions/:id/approve    - Approve transaction

# Reconciliation
POST   /api/trust/accounts/:id/reconcile      - Start reconciliation
GET    /api/trust/reconciliations             - List reconciliations
GET    /api/trust/reconciliations/:id         - Get reconciliation details
POST   /api/trust/reconciliations/:id/complete - Complete reconciliation
POST   /api/trust/reconciliations/:id/approve - Approve reconciliation

# Bank Statements
POST   /api/trust/accounts/:id/statements     - Import bank statement
GET    /api/trust/accounts/:id/statements     - List bank statements
POST   /api/trust/statements/:id/match        - Auto-match transactions

# Compliance
GET    /api/trust/compliance/check            - Run compliance check
GET    /api/trust/compliance/alerts           - Get compliance alerts
GET    /api/trust/reports/client-ledger       - Generate client ledger report
GET    /api/trust/reports/reconciliation      - Generate reconciliation report
GET    /api/trust/reports/transaction-register - Generate transaction register
```

#### Acceptance Criteria
- [ ] Three-way reconciliation balances within $0.01
- [ ] Negative balance prevention works 100% of the time
- [ ] All 50 US state bar rules implemented
- [ ] Bank statement import supports CSV, OFX, QFX
- [ ] Auto-matching accuracy > 95%
- [ ] Compliance alerts sent within 1 minute of violation
- [ ] Audit trail captures all changes with user, timestamp, IP
- [ ] Reports generate in < 5 seconds
- [ ] UI follows deep black/white color scheme

---

### Session 12.1.3: Billing & Invoicing
**Timeline:** Weeks 7-9  
**Owner:** Backend Lead + Frontend Lead

#### Deliverables

**D-12.1.3.1: Time & Expense Billing**
- [ ] Hourly billing (by attorney rate)
- [ ] Fixed fee matters
- [ ] Contingency fee tracking (percentage-based)
- [ ] Hybrid billing (mix of hourly + fixed)
- [ ] Automatic time entry from activities (emails, docs, calls)
- [ ] Multiple billing rates per attorney (by client, matter type)
- [ ] Billing rate effective dates (rate changes over time)

**D-12.1.3.2: Invoice Generation**
- [ ] Customizable invoice templates (multi-language)
- [ ] LEDES billing format (for corporate clients)
- [ ] UTBMS codes (task and expense codes)
- [ ] Multi-currency invoicing (bill in client's currency)
- [ ] Batch invoicing (generate 100s of invoices at once)
- [ ] Draft → Review → Approve → Send workflow
- [ ] Invoice preview before sending
- [ ] PDF generation with firm branding

**D-12.1.3.3: Payment Processing**
- [ ] Online payments (credit card, ACH, wire)
- [ ] Payment plans (installments with auto-billing)
- [ ] Trust retainer auto-deduction
- [ ] Late payment reminders (AI-scheduled)
- [ ] Partial payments
- [ ] Payment allocation (apply to specific invoices)
- [ ] Integration: Stripe, LawPay, PayPal

**D-12.1.3.4: AI Billing Features**
- [ ] **AI Invoice Review:** Scans invoices before sending:
  - Flags missing time entries (compares to calendar)
  - Suggests adjustments (round down to nearest 0.1 hour)
  - Identifies potentially write-off-able time
  - Predicts payment probability (client history + amount)
- [ ] **Smart Write-Offs:** AI suggests write-offs based on:
  - Client relationship value
  - Matter profitability
  - Historical write-off patterns
- [ ] **Revenue Forecasting:** Predicts monthly revenue based on:
  - Unbilled time
  - Outstanding invoices
  - Historical collection rates

#### Database Schema

```prisma
model Invoice {
  id              String   @id @default(uuid())
  invoiceNumber   String   // Auto-generated: INV-2025-0001
  organizationId  String
  clientId        String
  matterId        String?
  billingType     String   // hourly, fixed_fee, contingency, hybrid
  status          String   @default("draft") // draft, pending_approval, approved, sent, viewed, paid, overdue, cancelled, written_off
  issueDate       DateTime
  dueDate         DateTime
  paymentTerms    String?  // "Net 30", "Upon Receipt", "Net 15"
  
  // Amounts
  subtotal        Decimal  @db.Decimal(15, 2)
  discountType    String?  // percentage, fixed
  discountValue   Decimal? @db.Decimal(15, 2)
  discountAmount  Decimal  @db.Decimal(15, 2) @default(0)
  taxRate         Decimal? @db.Decimal(5, 4)
  taxAmount       Decimal  @db.Decimal(15, 2) @default(0)
  totalAmount     Decimal  @db.Decimal(15, 2)
  paidAmount      Decimal  @db.Decimal(15, 2) @default(0)
  balanceDue      Decimal  @db.Decimal(15, 2)
  writeOffAmount  Decimal  @db.Decimal(15, 2) @default(0)
  
  // Currency
  currency        String   @default("USD")
  exchangeRate    Decimal? @db.Decimal(10, 6)
  baseCurrencyTotal Decimal? @db.Decimal(15, 2)
  
  // LEDES/UTBMS
  ledesFormat     Boolean  @default(false)
  ledesVersion    String?  // "LEDES98B", "LEDES2000"
  
  // Metadata
  notes           String?
  internalNotes   String?
  termsAndConditions String?
  
  // AI Predictions
  aiPaymentProbability Int?    // 1-100
  aiSuggestedWriteOff Decimal? @db.Decimal(15, 2)
  
  // Timestamps
  sentAt          DateTime?
  viewedAt        DateTime?
  paidAt          DateTime?
  lastReminderAt  DateTime?
  reminderCount   Int      @default(0)
  
  createdBy       String
  approvedBy      String?
  approvedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization    @relation(fields: [organizationId], references: [id])
  client       Contact         @relation(fields: [clientId], references: [id])
  matter       Matter?         @relation(fields: [matterId], references: [id])
  lineItems    InvoiceLineItem[]
  payments     Payment[]
  reminders    PaymentReminder[]
  
  @@unique([organizationId, invoiceNumber])
}

model InvoiceLineItem {
  id              String   @id @default(uuid())
  invoiceId       String
  lineNumber      Int
  itemType        String   // time_entry, expense, fixed_fee, adjustment, credit
  description     String
  quantity        Decimal  @db.Decimal(10, 2) // Hours or units
  rate            Decimal  @db.Decimal(15, 2)
  amount          Decimal  @db.Decimal(15, 2)
  
  // LEDES/UTBMS
  utbmsTaskCode   String?  // e.g., "L110" for Fact Investigation
  utbmsActivityCode String? // e.g., "A101" for Plan and Prepare
  utbmsExpenseCode String?  // e.g., "E101" for Copying
  
  // References
  timeEntryId     String?  // Link to time entry
  expenseId       String?  // Link to expense
  
  // Tax
  taxable         Boolean  @default(false)
  taxRate         Decimal? @db.Decimal(5, 4)
  taxAmount       Decimal  @db.Decimal(15, 2) @default(0)
  
  // Dates
  serviceDate     DateTime?
  serviceDateEnd  DateTime? // For date ranges
  
  createdAt       DateTime @default(now())
  
  invoice   Invoice    @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  timeEntry TimeEntry? @relation(fields: [timeEntryId], references: [id])
  expense   Expense?   @relation(fields: [expenseId], references: [id])
}

model Payment {
  id              String   @id @default(uuid())
  organizationId  String
  invoiceId       String?
  clientId        String
  amount          Decimal  @db.Decimal(15, 2)
  currency        String   @default("USD")
  paymentMethod   String   // credit_card, ach, check, wire, cash, trust_transfer
  paymentDate     DateTime
  
  // Payment processor
  processorId     String?  // Stripe/LawPay payment ID
  processorFee    Decimal? @db.Decimal(15, 2)
  netAmount       Decimal? @db.Decimal(15, 2)
  
  // Check details
  checkNumber     String?
  bankName        String?
  
  // Trust transfer
  trustTransactionId String?
  
  // Status
  status          String   @default("completed") // pending, completed, failed, refunded
  failureReason   String?
  
  referenceNumber String?
  notes           String?
  processedBy     String
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  invoice      Invoice?     @relation(fields: [invoiceId], references: [id])
  client       Contact      @relation(fields: [clientId], references: [id])
  allocations  PaymentAllocation[]
}

model PaymentAllocation {
  id          String   @id @default(uuid())
  paymentId   String
  invoiceId   String
  amount      Decimal  @db.Decimal(15, 2)
  createdAt   DateTime @default(now())
  
  payment Payment @relation(fields: [paymentId], references: [id])
}

model PaymentReminder {
  id          String   @id @default(uuid())
  invoiceId   String
  reminderType String  // first, second, final, custom
  scheduledFor DateTime
  sentAt      DateTime?
  emailTo     String
  emailSubject String
  emailBody   String
  status      String   @default("scheduled") // scheduled, sent, cancelled
  createdAt   DateTime @default(now())
  
  invoice Invoice @relation(fields: [invoiceId], references: [id])
}

model BillingRate {
  id              String   @id @default(uuid())
  organizationId  String
  userId          String?  // Attorney
  clientId        String?  // Client-specific rate
  matterId        String?  // Matter-specific rate
  matterType      String?  // Rate by matter type
  rateType        String   // hourly, fixed, contingency
  rate            Decimal  @db.Decimal(15, 2)
  currency        String   @default("USD")
  effectiveDate   DateTime
  expirationDate  DateTime?
  isDefault       Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
}
```

#### API Endpoints

```
# Invoices
POST   /api/billing/invoices                  - Create invoice
GET    /api/billing/invoices                  - List invoices
GET    /api/billing/invoices/:id              - Get invoice details
PATCH  /api/billing/invoices/:id              - Update invoice
DELETE /api/billing/invoices/:id              - Delete draft invoice
POST   /api/billing/invoices/:id/approve      - Approve invoice
POST   /api/billing/invoices/:id/send         - Send invoice
POST   /api/billing/invoices/:id/remind       - Send reminder
POST   /api/billing/invoices/:id/write-off    - Write off invoice
GET    /api/billing/invoices/:id/pdf          - Download PDF

# Batch Operations
POST   /api/billing/invoices/batch            - Batch create invoices
POST   /api/billing/invoices/batch/send       - Batch send invoices

# Payments
POST   /api/billing/payments                  - Record payment
GET    /api/billing/payments                  - List payments
GET    /api/billing/payments/:id              - Get payment details
POST   /api/billing/payments/:id/refund       - Refund payment

# Billing Rates
POST   /api/billing/rates                     - Create billing rate
GET    /api/billing/rates                     - List billing rates
PATCH  /api/billing/rates/:id                 - Update billing rate

# AI Features
POST   /api/billing/invoices/:id/ai-review    - AI review invoice
GET    /api/billing/ai/revenue-forecast       - Get revenue forecast
GET    /api/billing/ai/write-off-suggestions  - Get write-off suggestions

# Reports
GET    /api/billing/reports/ar-aging          - AR aging report
GET    /api/billing/reports/collections       - Collections report
GET    /api/billing/reports/wip               - Work in progress report
```

#### Acceptance Criteria
- [ ] LEDES export validates against LEDES98B and LEDES2000 specs
- [ ] Batch invoicing handles 500+ invoices in < 30 seconds
- [ ] Payment processing completes in < 3 seconds
- [ ] AI payment probability accuracy > 75%
- [ ] Invoice PDF generation < 2 seconds
- [ ] Multi-currency conversion uses live rates (< 1 hour old)
- [ ] UI follows deep black/white color scheme

---

### Session 12.1.4: Expense Management & Accounts Payable
**Timeline:** Weeks 10-12  
**Owner:** Backend Lead + Frontend Lead

#### Deliverables

**D-12.1.4.1: Expense Tracking**
- [ ] Categorized expenses (court fees, expert witnesses, filing fees, etc.)
- [ ] Receipt upload with OCR extraction
- [ ] Billable vs. non-billable expenses
- [ ] Mileage tracking (GPS integration, IRS rates)
- [ ] Multi-currency expenses (travel)
- [ ] Expense policies (limits, approval thresholds)
- [ ] Mobile expense capture

**D-12.1.4.2: Vendor Management**
- [ ] Vendor database (expert witnesses, court reporters, process servers)
- [ ] Vendor invoices (approval workflow)
- [ ] 1099 tracking (for tax reporting)
- [ ] Vendor performance ratings (AI-tracked)
- [ ] Preferred vendor lists
- [ ] Vendor payment terms

**D-12.1.4.3: Accounts Payable**
- [ ] Bill pay (ACH, check printing, wire)
- [ ] Approval workflows (multi-level for large expenses)
- [ ] Scheduled payments
- [ ] Vendor credits tracking
- [ ] Payment batching

**D-12.1.4.4: AI Expense Features**
- [ ] **AI Receipt Scanner:** OCR + AI extracts:
  - Vendor name, amount, date, tax amount
  - Suggests expense category
  - Links to matter automatically
- [ ] **Expense Policy Enforcer:** Flags out-of-policy expenses:
  - Meal over limit
  - Travel without approval
  - Duplicate expense submissions
- [ ] **Predictive Vendor Selection:** AI recommends vendors based on:
  - Past performance
  - Cost
  - Availability
  - Matter type

#### Database Schema

```prisma
model Expense {
  id              String   @id @default(uuid())
  expenseNumber   String   // Auto-generated: EXP-2025-0001
  organizationId  String
  matterId        String?
  clientId        String?
  userId          String   // Who incurred the expense
  vendorId        String?
  
  // Expense Details
  category        String   // court_fees, expert_witness, travel, meals, etc.
  subcategory     String?
  description     String
  amount          Decimal  @db.Decimal(15, 2)
  currency        String   @default("USD")
  exchangeRate    Decimal? @db.Decimal(10, 6)
  baseCurrencyAmount Decimal? @db.Decimal(15, 2)
  taxAmount       Decimal  @db.Decimal(15, 2) @default(0)
  
  // Dates
  expenseDate     DateTime
  submittedAt     DateTime?
  
  // Billability
  isBillable      Boolean  @default(true)
  isBilled        Boolean  @default(false)
  invoiceLineItemId String?
  markupPercent   Decimal? @db.Decimal(5, 2) // Markup for billing
  billedAmount    Decimal? @db.Decimal(15, 2)
  
  // Receipt
  receiptUrl      String?
  receiptOcrData  Json?    // AI-extracted data
  
  // Mileage
  isMileage       Boolean  @default(false)
  mileageDistance Decimal? @db.Decimal(10, 2)
  mileageRate     Decimal? @db.Decimal(5, 4)
  mileageStart    String?
  mileageEnd      String?
  
  // Payment
  paymentMethod   String?  // firm_card, personal, cash, vendor_invoice
  reimbursed      Boolean  @default(false)
  reimbursedAt    DateTime?
  reimbursementPaymentId String?
  
  // Approval
  status          String   @default("draft") // draft, submitted, pending_approval, approved, rejected, paid
  approvalStatus  String   @default("pending") // pending, approved, rejected
  approvedBy      String?
  approvedAt      DateTime?
  rejectionReason String?
  
  // Policy
  policyViolation Boolean  @default(false)
  policyViolationReason String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
  client       Contact?     @relation(fields: [clientId], references: [id])
  vendor       Vendor?      @relation(fields: [vendorId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
  invoiceLineItem InvoiceLineItem? @relation(fields: [invoiceLineItemId], references: [id])
  
  @@unique([organizationId, expenseNumber])
}

model Vendor {
  id              String   @id @default(uuid())
  organizationId  String
  vendorNumber    String   // Auto-generated: VEN-0001
  name            String
  vendorType      String   // expert_witness, court_reporter, process_server, etc.
  
  // Contact
  email           String?
  phone           String?
  website         String?
  
  // Address
  address1        String?
  address2        String?
  city            String?
  state           String?
  postalCode      String?
  country         String   @default("US")
  
  // Tax
  taxId           String?  // Encrypted - For 1099 reporting
  taxIdType       String?  // EIN, SSN
  is1099Eligible  Boolean  @default(false)
  
  // Payment
  paymentTerms    String?  // Net 30, Net 15, Upon Receipt
  preferredPaymentMethod String? // check, ach, wire
  bankAccountNumber String? // Encrypted
  bankRoutingNumber String? // Encrypted
  
  // Performance
  rating          Decimal? @db.Decimal(3, 2) // 0-5.0 stars
  totalPaid       Decimal  @db.Decimal(15, 2) @default(0)
  totalInvoices   Int      @default(0)
  avgPaymentDays  Int?
  
  // Status
  isPreferred     Boolean  @default(false)
  isActive        Boolean  @default(true)
  notes           String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  expenses     Expense[]
  bills        VendorBill[]
  
  @@unique([organizationId, vendorNumber])
}

model VendorBill {
  id              String   @id @default(uuid())
  billNumber      String
  organizationId  String
  vendorId        String
  matterId        String?
  
  // Amounts
  subtotal        Decimal  @db.Decimal(15, 2)
  taxAmount       Decimal  @db.Decimal(15, 2) @default(0)
  totalAmount     Decimal  @db.Decimal(15, 2)
  paidAmount      Decimal  @db.Decimal(15, 2) @default(0)
  balanceDue      Decimal  @db.Decimal(15, 2)
  currency        String   @default("USD")
  
  // Dates
  billDate        DateTime
  dueDate         DateTime
  receivedDate    DateTime @default(now())
  
  // Status
  status          String   @default("pending") // pending, approved, scheduled, paid, cancelled
  approvalStatus  String   @default("pending")
  approvedBy      String?
  approvedAt      DateTime?
  
  // Payment
  scheduledPaymentDate DateTime?
  paidAt          DateTime?
  paymentMethod   String?
  paymentReference String?
  
  // Documents
  documentUrl     String?
  
  notes           String?
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  vendor       Vendor       @relation(fields: [vendorId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
  lineItems    VendorBillLineItem[]
  payments     VendorPayment[]
}

model VendorBillLineItem {
  id          String   @id @default(uuid())
  billId      String
  description String
  quantity    Decimal  @db.Decimal(10, 2) @default(1)
  unitPrice   Decimal  @db.Decimal(15, 2)
  amount      Decimal  @db.Decimal(15, 2)
  accountId   String?  // Chart of accounts
  matterId    String?
  isBillable  Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  bill VendorBill @relation(fields: [billId], references: [id], onDelete: Cascade)
}

model VendorPayment {
  id              String   @id @default(uuid())
  organizationId  String
  vendorId        String
  billId          String?
  amount          Decimal  @db.Decimal(15, 2)
  currency        String   @default("USD")
  paymentMethod   String   // check, ach, wire
  paymentDate     DateTime
  checkNumber     String?
  referenceNumber String?
  status          String   @default("completed")
  notes           String?
  processedBy     String
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  vendor       Vendor       @relation(fields: [vendorId], references: [id])
  bill         VendorBill?  @relation(fields: [billId], references: [id])
}

model ExpensePolicy {
  id              String   @id @default(uuid())
  organizationId  String
  policyName      String
  category        String?  // Apply to specific category or all
  maxAmount       Decimal? @db.Decimal(15, 2)
  requiresApproval Boolean @default(false)
  approvalThreshold Decimal? @db.Decimal(15, 2)
  requiresReceipt Boolean  @default(true)
  receiptThreshold Decimal? @db.Decimal(15, 2)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
}
```

#### API Endpoints

```
# Expenses
POST   /api/expenses                          - Create expense
GET    /api/expenses                          - List expenses
GET    /api/expenses/:id                      - Get expense details
PATCH  /api/expenses/:id                      - Update expense
DELETE /api/expenses/:id                      - Delete expense
POST   /api/expenses/:id/submit               - Submit for approval
POST   /api/expenses/:id/approve              - Approve expense
POST   /api/expenses/:id/reject               - Reject expense
POST   /api/expenses/upload-receipt           - Upload and OCR receipt

# Vendors
POST   /api/vendors                           - Create vendor
GET    /api/vendors                           - List vendors
GET    /api/vendors/:id                       - Get vendor details
PATCH  /api/vendors/:id                       - Update vendor
DELETE /api/vendors/:id                       - Deactivate vendor

# Vendor Bills
POST   /api/vendor-bills                      - Create vendor bill
GET    /api/vendor-bills                      - List vendor bills
GET    /api/vendor-bills/:id                  - Get bill details
POST   /api/vendor-bills/:id/approve          - Approve bill
POST   /api/vendor-bills/:id/pay              - Pay bill
POST   /api/vendor-bills/batch-pay            - Batch pay bills

# Expense Policies
POST   /api/expense-policies                  - Create policy
GET    /api/expense-policies                  - List policies
PATCH  /api/expense-policies/:id              - Update policy

# Reports
GET    /api/expenses/reports/by-category      - Expenses by category
GET    /api/expenses/reports/by-matter        - Expenses by matter
GET    /api/expenses/reports/reimbursable     - Reimbursable expenses
GET    /api/vendors/reports/1099              - 1099 report
```

#### Acceptance Criteria
- [ ] Receipt OCR accuracy > 90% for amount, date, vendor
- [ ] Expense policy enforcement works in real-time
- [ ] Mileage calculation uses current IRS rates
- [ ] 1099 report generates correctly for tax year
- [ ] Batch payment processing handles 100+ payments
- [ ] Mobile expense capture works offline (sync when online)
- [ ] UI follows deep black/white color scheme

---

## PHASE 12.1 SUMMARY

### Deliverables Checklist

| Session | Deliverable | Status |
|---------|-------------|--------|
| 12.1.1 | Chart of Accounts | ⬜ Pending |
| 12.1.1 | General Ledger | ⬜ Pending |
| 12.1.1 | AI Financial Features | ⬜ Pending |
| 12.1.2 | IOLTA Account Management | ⬜ Pending |
| 12.1.2 | Three-Way Reconciliation | ⬜ Pending |
| 12.1.2 | Trust Transaction Management | ⬜ Pending |
| 12.1.2 | Compliance & Reporting | ⬜ Pending |
| 12.1.2 | AI Trust Monitoring | ⬜ Pending |
| 12.1.3 | Time & Expense Billing | ⬜ Pending |
| 12.1.3 | Invoice Generation | ⬜ Pending |
| 12.1.3 | Payment Processing | ⬜ Pending |
| 12.1.3 | AI Billing Features | ⬜ Pending |
| 12.1.4 | Expense Tracking | ⬜ Pending |
| 12.1.4 | Vendor Management | ⬜ Pending |
| 12.1.4 | Accounts Payable | ⬜ Pending |
| 12.1.4 | AI Expense Features | ⬜ Pending |

### Success Metrics

| Metric | Target |
|--------|--------|
| Trust reconciliation accuracy | 100% (within $0.01) |
| IOLTA compliance rate | 100% |
| Invoice generation time | < 2 seconds |
| Payment processing time | < 3 seconds |
| Receipt OCR accuracy | > 90% |
| AI categorization accuracy | > 85% |
| Cash flow forecast accuracy | > 80% |

### Team Requirements

| Role | Count | Responsibilities |
|------|-------|------------------|
| Backend Engineer | 3 | API development, database, integrations |
| Frontend Engineer | 2 | UI components, forms, reports |
| Compliance Consultant | 1 | IOLTA rules, state bar compliance |
| AI Engineer | 1 | OCR, categorization, predictions |
| QA Engineer | 1 | Testing, compliance verification |

---

**Document Version:** 3.0  
**Last Updated:** December 12, 2025  
**Status:** Ready for Development  
**Next Phase:** Phase 12.2 - Client Lifecycle Management

---
