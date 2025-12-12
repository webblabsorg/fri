# FRITH AI - PHASE 12: COMPLETE LEGAL ERP PLATFORM
## Part 4: Intelligence Layer & Global Platform

**From AI Tool Platform to Industry-Leading Legal ERP**  
**Version:** 3.0  
**Timeline:** Months 28-30 (12 weeks)  
**Goal:** Build advanced document management, analytics, integrations, and global features

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

## SPRINT 12.4: INTELLIGENCE & GLOBAL PLATFORM
**Timeline:** Weeks 1-12 (Months 28-30)  
**Team:** Backend (3), Frontend (2), AI Engineer (1), DevOps (1)

---

### Session 12.4.1: Documents & Knowledge Management
**Timeline:** Weeks 1-4  
**Owner:** Backend Lead + Frontend Lead

#### Deliverables

**D-12.4.1.1: Document Repository**
- [ ] Matter-based document storage
- [ ] Version control (track all changes)
- [ ] Document tagging (pleadings, discovery, evidence, etc.)
- [ ] Full-text search (search inside PDFs, DOCX)
- [ ] Document preview (no download needed)
- [ ] Folder hierarchy
- [ ] Document check-in/check-out

**D-12.4.1.2: Document Assembly**
- [ ] Template library (contracts, pleadings, letters)
- [ ] Mail merge (fill templates with client/matter data)
- [ ] Conditional logic (if litigation → include clause X)
- [ ] E-signature integration (DocuSign, HelloSign)
- [ ] Clause library (reusable clauses)
- [ ] Document generation from AI tools

**D-12.4.1.3: Collaboration**
- [ ] Real-time co-editing (like Google Docs)
- [ ] Comments & annotations
- [ ] Review workflows (draft → review → approve → finalize)
- [ ] External sharing (share with clients, opposing counsel)
- [ ] Share links with expiration and password

**D-12.4.1.4: Document Security**
- [ ] Encryption at rest and in transit
- [ ] Access controls (who can view/edit)
- [ ] Watermarking (mark as "Confidential")
- [ ] Audit trail (who accessed when)
- [ ] Retention policies
- [ ] Secure deletion

**D-12.4.1.5: AI Document Features**
- [ ] **AI Document Analyzer:** Automatically extracts:
  - Key dates (deadlines, signatures, effective dates)
  - Parties (plaintiff, defendant, contract parties)
  - Dollar amounts (damages, contract value)
  - Obligations & clauses
- [ ] **Smart Document Organization:** AI suggests:
  - Document type
  - Matter assignment
  - Tags
- [ ] **Document Comparison (Redlining):** AI-powered:
  - Compare two versions side-by-side
  - Highlight changes
  - Summarize key changes in plain English
- [ ] **Privilege Log Generator:** AI scans documents and:
  - Identifies privileged documents
  - Auto-generates privilege log
  - Flags potentially responsive but privileged documents

#### Database Schema

```prisma
model Document {
  id              String   @id @default(uuid())
  documentNumber  String   // Auto-generated: DOC-2025-0001
  organizationId  String
  
  // Location
  folderId        String?
  matterId        String?
  
  // Document Info
  documentName    String
  description     String?
  documentType    String?  // pleading, contract, correspondence, evidence, template
  documentSubtype String?
  
  // File
  fileUrl         String
  fileSize        Int
  mimeType        String
  originalFileName String
  
  // Version Control
  version         Int      @default(1)
  parentDocId     String?  // For version control
  isLatestVersion Boolean  @default(true)
  
  // Metadata
  tags            String[]
  customMetadata  Json?
  
  // Privilege
  isPrivileged    Boolean  @default(false)
  privilegeType   String?  // attorney_client, work_product, joint_defense
  privilegeReason String?
  
  // Confidentiality
  confidentialityLevel String @default("internal") // public, internal, confidential, highly_confidential
  
  // Status
  status          String   @default("active") // active, archived, deleted
  isTemplate      Boolean  @default(false)
  isDraft         Boolean  @default(false)
  
  // Check-in/Check-out
  isCheckedOut    Boolean  @default(false)
  checkedOutBy    String?
  checkedOutAt    DateTime?
  
  // AI Extracted Data
  aiExtractedData Json?    // Dates, parties, amounts extracted by AI
  aiAnalyzedAt    DateTime?
  
  // Sharing
  shareLinks      DocumentShareLink[]
  
  // Access
  uploadedBy      String
  lastAccessedBy  String?
  lastAccessedAt  DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization      @relation(fields: [organizationId], references: [id])
  folder       DocumentFolder?   @relation(fields: [folderId], references: [id])
  matter       Matter?           @relation(fields: [matterId], references: [id])
  parentDoc    Document?         @relation("DocumentVersions", fields: [parentDocId], references: [id])
  versions     Document[]        @relation("DocumentVersions")
  comments     DocumentComment[]
  accessLogs   DocumentAccessLog[]
  
  @@unique([organizationId, documentNumber])
  @@index([organizationId, matterId])
  @@index([organizationId, folderId])
}

model DocumentFolder {
  id              String   @id @default(uuid())
  organizationId  String
  matterId        String?
  
  folderName      String
  parentFolderId  String?
  path            String   // Full path: /Matter/Discovery/Depositions
  
  isSystemFolder  Boolean  @default(false) // System-created folders
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
  parentFolder DocumentFolder? @relation("FolderHierarchy", fields: [parentFolderId], references: [id])
  subfolders   DocumentFolder[] @relation("FolderHierarchy")
  documents    Document[]
}

model DocumentComment {
  id          String   @id @default(uuid())
  documentId  String
  userId      String
  comment     String
  pageNumber  Int?
  coordinates Json?    // {x, y, width, height} for annotation position
  isResolved  Boolean  @default(false)
  resolvedBy  String?
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id])
  replies  DocumentCommentReply[]
}

model DocumentCommentReply {
  id          String   @id @default(uuid())
  commentId   String
  userId      String
  reply       String
  createdAt   DateTime @default(now())
  
  comment DocumentComment @relation(fields: [commentId], references: [id], onDelete: Cascade)
}

model DocumentTemplate {
  id              String   @id @default(uuid())
  organizationId  String
  
  templateName    String
  description     String?
  category        String?  // contract, pleading, letter, form
  practiceArea    String?
  
  // Template Content
  fileUrl         String?  // For file-based templates
  content         String?  @db.Text // For text-based templates
  contentFormat   String   @default("docx") // docx, html, markdown
  
  // Variables
  variables       Json     // Array of variable definitions
  conditionalLogic Json?   // Conditional sections
  
  // Clause Library
  clauses         DocumentClause[]
  
  isActive        Boolean  @default(true)
  isShared        Boolean  @default(true)
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
}

model DocumentClause {
  id              String   @id @default(uuid())
  organizationId  String
  templateId      String?
  
  clauseName      String
  clauseText      String   @db.Text
  category        String?  // indemnification, limitation_of_liability, termination
  practiceArea    String?
  
  // Variations
  variations      Json?    // Alternative versions of this clause
  
  isActive        Boolean  @default(true)
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  template     DocumentTemplate? @relation(fields: [templateId], references: [id])
}

model DocumentShareLink {
  id              String   @id @default(uuid())
  documentId      String
  
  shareToken      String   @unique
  shareType       String   // view, download, edit
  
  // Security
  password        String?  // Hashed
  expiresAt       DateTime?
  maxDownloads    Int?
  downloadCount   Int      @default(0)
  
  // Recipient
  recipientEmail  String?
  recipientName   String?
  
  // Watermark
  addWatermark    Boolean  @default(false)
  watermarkText   String?
  
  isActive        Boolean  @default(true)
  createdBy       String
  createdAt       DateTime @default(now())
  lastAccessedAt  DateTime?
  
  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
}

model DocumentAccessLog {
  id          String   @id @default(uuid())
  documentId  String
  userId      String?
  action      String   // view, download, edit, share, delete
  ipAddress   String?
  userAgent   String?
  accessedAt  DateTime @default(now())
  
  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
}

model PrivilegeLog {
  id              String   @id @default(uuid())
  organizationId  String
  matterId        String
  
  // Document
  documentId      String?
  documentDescription String
  documentDate    DateTime?
  
  // Privilege
  privilegeType   String   // attorney_client, work_product, joint_defense
  privilegeBasis  String   // Description of privilege basis
  
  // Parties
  author          String?
  recipients      String[]
  
  // Review
  reviewedBy      String?
  reviewedAt      DateTime?
  
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  matter       Matter       @relation(fields: [matterId], references: [id])
}
```

#### API Endpoints

```
# Documents
POST   /api/documents                         - Upload document
GET    /api/documents                         - List documents
GET    /api/documents/:id                     - Get document details
PATCH  /api/documents/:id                     - Update document metadata
DELETE /api/documents/:id                     - Delete document
GET    /api/documents/:id/download            - Download document
GET    /api/documents/:id/preview             - Get preview URL

# Versions
GET    /api/documents/:id/versions            - Get version history
POST   /api/documents/:id/versions            - Upload new version
GET    /api/documents/:id/versions/:version   - Get specific version

# Check-in/Check-out
POST   /api/documents/:id/checkout            - Check out document
POST   /api/documents/:id/checkin             - Check in document
POST   /api/documents/:id/cancel-checkout     - Cancel checkout

# Folders
POST   /api/documents/folders                 - Create folder
GET    /api/documents/folders                 - List folders
PATCH  /api/documents/folders/:id             - Update folder
DELETE /api/documents/folders/:id             - Delete folder
POST   /api/documents/:id/move                - Move document to folder

# Comments
POST   /api/documents/:id/comments            - Add comment
GET    /api/documents/:id/comments            - Get comments
POST   /api/documents/comments/:id/resolve    - Resolve comment
POST   /api/documents/comments/:id/reply      - Reply to comment

# Sharing
POST   /api/documents/:id/share               - Create share link
GET    /api/documents/:id/shares              - Get share links
DELETE /api/documents/shares/:id              - Revoke share link
GET    /api/documents/shared/:token           - Access shared document

# Templates
POST   /api/document-templates                - Create template
GET    /api/document-templates                - List templates
POST   /api/document-templates/:id/generate   - Generate document from template

# Clauses
POST   /api/document-clauses                  - Create clause
GET    /api/document-clauses                  - List clauses
GET    /api/document-clauses/search           - Search clauses

# AI Features
POST   /api/documents/:id/ai/analyze          - AI analyze document
POST   /api/documents/:id/ai/extract          - Extract key data
POST   /api/documents/ai/compare              - Compare two documents
POST   /api/documents/:id/ai/privilege-check  - Check for privilege
GET    /api/matters/:id/privilege-log         - Get privilege log
```

#### Acceptance Criteria
- [ ] Document upload supports files up to 100MB
- [ ] Full-text search returns results in < 2 seconds
- [ ] Version control maintains complete history
- [ ] AI extraction accuracy > 85%
- [ ] Document comparison highlights all changes
- [ ] UI follows deep black/white color scheme

---

### Session 12.4.2: Reports & Analytics
**Timeline:** Weeks 5-7  
**Owner:** Backend Lead + Frontend Lead

#### Deliverables

**D-12.4.2.1: Pre-Built Reports**
- [ ] Financial reports (P&L, balance sheet, cash flow)
- [ ] Trust account reports (client ledgers, reconciliation)
- [ ] Time & billing reports (WIP, AR aging, collections)
- [ ] Attorney productivity (hours by attorney, realization rate)
- [ ] Matter profitability (revenue vs. cost per matter)
- [ ] Client reports (top clients by revenue, at-risk clients)
- [ ] Lead/intake reports (conversion rates, source analysis)

**D-12.4.2.2: Custom Report Builder**
- [ ] Drag-and-drop report designer
- [ ] Filter by date, practice area, attorney, etc.
- [ ] Grouping & aggregation
- [ ] Calculated fields
- [ ] Export to Excel, PDF, CSV
- [ ] Schedule reports (email monthly report to partners)
- [ ] Save and share reports

**D-12.4.2.3: Dashboards**
- [ ] Executive dashboard (firm-wide metrics)
- [ ] Attorney dashboard (personal performance)
- [ ] Practice group dashboard (department metrics)
- [ ] Financial dashboard (revenue, expenses, profitability)
- [ ] Real-time data updates
- [ ] Customizable widgets
- [ ] Dashboard sharing

**D-12.4.2.4: AI Analytics Features**
- [ ] **Predictive Analytics:** AI forecasts:
  - Revenue (next quarter, year-end)
  - Cash flow (predict low cash months)
  - Attorney utilization (predict burnout risk)
  - Client lifetime value
- [ ] **Anomaly Detection:** AI flags unusual patterns:
  - Revenue drop
  - Excessive write-offs
  - Slow-paying clients
- [ ] **Benchmarking:** AI compares firm to industry standards:
  - Realization rate
  - Overhead ratio
  - Lawyer-to-staff ratio
  - Provides recommendations

#### Database Schema

```prisma
model Report {
  id              String   @id @default(uuid())
  organizationId  String
  
  reportName      String
  description     String?
  reportType      String   // financial, time_billing, productivity, client, custom
  reportCategory  String?
  
  // Definition
  dataSource      String   // matters, time_entries, invoices, etc.
  columns         Json     // Column definitions
  filters         Json     // Filter conditions
  groupBy         Json?    // Grouping configuration
  sortBy          Json?    // Sort configuration
  calculations    Json?    // Calculated fields
  
  // Visualization
  chartType       String?  // table, bar, line, pie, area
  chartConfig     Json?
  
  // Schedule
  isScheduled     Boolean  @default(false)
  scheduleFrequency String? // daily, weekly, monthly
  scheduleCron    String?  // Cron expression
  scheduleTimezone String?
  recipients      String[] // Email addresses
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  
  // Access
  isShared        Boolean  @default(false)
  sharedWith      String[] // User IDs
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  exports      ReportExport[]
}

model ReportExport {
  id          String   @id @default(uuid())
  reportId    String
  format      String   // pdf, xlsx, csv
  fileUrl     String
  fileSize    Int
  status      String   @default("pending") // pending, processing, completed, failed
  errorMessage String?
  requestedBy String
  requestedAt DateTime @default(now())
  completedAt DateTime?
  expiresAt   DateTime
  
  report Report @relation(fields: [reportId], references: [id], onDelete: Cascade)
}

model Dashboard {
  id              String   @id @default(uuid())
  organizationId  String
  
  dashboardName   String
  description     String?
  dashboardType   String   // executive, attorney, practice_group, custom
  
  // Layout
  layout          Json     // Widget positions and sizes
  widgets         DashboardWidget[]
  
  // Access
  isDefault       Boolean  @default(false)
  isShared        Boolean  @default(false)
  sharedWith      String[]
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
}

model DashboardWidget {
  id          String   @id @default(uuid())
  dashboardId String
  
  widgetType  String   // metric, chart, table, list
  widgetName  String
  
  // Data
  dataSource  String
  query       Json     // Query configuration
  
  // Display
  chartType   String?
  chartConfig Json?
  
  // Position
  positionX   Int
  positionY   Int
  width       Int
  height      Int
  
  // Refresh
  refreshInterval Int?  // Seconds
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  dashboard Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
}

model AnalyticsSnapshot {
  id              String   @id @default(uuid())
  organizationId  String
  snapshotDate    DateTime
  snapshotType    String   // daily, weekly, monthly
  
  // Metrics
  metrics         Json     // All metrics for this period
  
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  
  @@unique([organizationId, snapshotDate, snapshotType])
}

model AIForecast {
  id              String   @id @default(uuid())
  organizationId  String
  
  forecastType    String   // revenue, cash_flow, utilization
  forecastPeriod  String   // monthly, quarterly, yearly
  
  // Predictions
  predictions     Json     // Array of {date, value, confidence}
  
  // Model Info
  modelVersion    String
  accuracy        Decimal? @db.Decimal(5, 2) // Historical accuracy
  
  generatedAt     DateTime @default(now())
  expiresAt       DateTime
  
  organization Organization @relation(fields: [organizationId], references: [id])
}
```

#### API Endpoints

```
# Reports
POST   /api/reports                           - Create report
GET    /api/reports                           - List reports
GET    /api/reports/:id                       - Get report details
PATCH  /api/reports/:id                       - Update report
DELETE /api/reports/:id                       - Delete report
POST   /api/reports/:id/run                   - Run report
POST   /api/reports/:id/export                - Export report
GET    /api/reports/:id/exports               - Get export history

# Pre-built Reports
GET    /api/reports/prebuilt                  - List pre-built reports
GET    /api/reports/prebuilt/:type            - Run pre-built report

# Dashboards
POST   /api/dashboards                        - Create dashboard
GET    /api/dashboards                        - List dashboards
GET    /api/dashboards/:id                    - Get dashboard
PATCH  /api/dashboards/:id                    - Update dashboard
DELETE /api/dashboards/:id                    - Delete dashboard

# Widgets
POST   /api/dashboards/:id/widgets            - Add widget
PATCH  /api/dashboards/:id/widgets/:widgetId  - Update widget
DELETE /api/dashboards/:id/widgets/:widgetId  - Remove widget
GET    /api/dashboards/:id/widgets/:widgetId/data - Get widget data

# AI Analytics
GET    /api/analytics/ai/forecast             - Get AI forecasts
GET    /api/analytics/ai/anomalies            - Get detected anomalies
GET    /api/analytics/ai/benchmarks           - Get benchmarks
GET    /api/analytics/ai/recommendations      - Get recommendations

# Metrics
GET    /api/analytics/metrics                 - Get current metrics
GET    /api/analytics/metrics/history         - Get historical metrics
```

#### Acceptance Criteria
- [ ] Report generation < 10 seconds for typical queries
- [ ] Dashboard widgets update in real-time
- [ ] Export handles 100,000+ rows
- [ ] AI forecast accuracy > 75%
- [ ] Anomaly detection catches 80% of issues
- [ ] UI follows deep black/white color scheme

---

### Session 12.4.3: Integrations & API Ecosystem
**Timeline:** Weeks 8-9  
**Owner:** Backend Lead + DevOps

#### Deliverables

**D-12.4.3.1: Accounting Software**
- [ ] QuickBooks Online integration
- [ ] QuickBooks Desktop integration
- [ ] Xero integration
- [ ] Sync chart of accounts, invoices, expenses

**D-12.4.3.2: Document Management**
- [ ] iManage integration
- [ ] NetDocuments integration
- [ ] SharePoint integration
- [ ] Two-way sync

**D-12.4.3.3: Communication**
- [ ] Gmail (already built)
- [ ] Outlook (email & calendar)
- [ ] Slack integration
- [ ] Microsoft Teams integration

**D-12.4.3.4: Legal Research**
- [ ] Westlaw integration (search, cite-checking)
- [ ] LexisNexis integration
- [ ] Fastcase integration
- [ ] Link research to matters automatically

**D-12.4.3.5: E-Filing**
- [ ] File & ServeXpress integration
- [ ] Tyler Technologies Odyssey integration
- [ ] State-specific e-filing systems

**D-12.4.3.6: Payment Processing**
- [ ] LawPay integration (IOLTA-compliant)
- [ ] Stripe (already built)
- [ ] PayPal integration

**D-12.4.3.7: Productivity**
- [ ] Zapier integration (already built)
- [ ] Make (formerly Integromat) integration
- [ ] Custom webhooks

**D-12.4.3.8: API Ecosystem**
- [ ] RESTful API (OpenAPI/Swagger docs)
- [ ] GraphQL API (for complex queries)
- [ ] Authentication (OAuth 2.0, API keys)
- [ ] Rate limiting
- [ ] Webhooks (real-time notifications)
- [ ] Developer portal
- [ ] SDKs (JavaScript, Python)

#### Database Schema

```prisma
model Integration {
  id              String   @id @default(uuid())
  organizationId  String
  
  integrationType String   // quickbooks, xero, imanage, slack, etc.
  integrationName String
  
  // Connection
  status          String   @default("disconnected") // disconnected, connected, error
  connectionData  Json     // Encrypted connection details
  accessToken     String?  // Encrypted
  refreshToken    String?  // Encrypted
  tokenExpiresAt  DateTime?
  
  // Settings
  settings        Json?    // Integration-specific settings
  syncEnabled     Boolean  @default(true)
  syncDirection   String   @default("both") // both, to_external, from_external
  
  // Sync Status
  lastSyncAt      DateTime?
  lastSyncStatus  String?
  lastSyncError   String?
  
  connectedBy     String
  connectedAt     DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  syncLogs     IntegrationSyncLog[]
}

model IntegrationSyncLog {
  id              String   @id @default(uuid())
  integrationId   String
  
  syncType        String   // full, incremental
  direction       String   // to_external, from_external
  
  status          String   // started, completed, failed
  recordsProcessed Int     @default(0)
  recordsCreated  Int      @default(0)
  recordsUpdated  Int      @default(0)
  recordsFailed   Int      @default(0)
  
  errorMessage    String?
  errorDetails    Json?
  
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  
  integration Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
}

model APIKey {
  id              String   @id @default(uuid())
  organizationId  String
  
  keyName         String
  keyHash         String   // Hashed API key
  keyPrefix       String   // First 8 chars for identification
  
  // Permissions
  permissions     String[] // read:matters, write:contacts, etc.
  
  // Rate Limiting
  rateLimit       Int      @default(1000) // Requests per hour
  
  // Status
  isActive        Boolean  @default(true)
  expiresAt       DateTime?
  lastUsedAt      DateTime?
  
  createdBy       String
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  usageLogs    APIUsageLog[]
}

model APIUsageLog {
  id          String   @id @default(uuid())
  apiKeyId    String
  
  endpoint    String
  method      String
  statusCode  Int
  responseTime Int     // Milliseconds
  
  ipAddress   String?
  userAgent   String?
  
  requestedAt DateTime @default(now())
  
  apiKey APIKey @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)
}

model Webhook {
  id              String   @id @default(uuid())
  organizationId  String
  
  webhookName     String
  webhookUrl      String
  secret          String   // For signature verification
  
  // Events
  events          String[] // matter.created, invoice.paid, etc.
  
  // Status
  isActive        Boolean  @default(true)
  
  // Delivery
  lastDeliveryAt  DateTime?
  lastDeliveryStatus String?
  failureCount    Int      @default(0)
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  deliveries   WebhookDelivery[]
}

model WebhookDelivery {
  id          String   @id @default(uuid())
  webhookId   String
  
  event       String
  payload     Json
  
  status      String   // pending, delivered, failed
  statusCode  Int?
  responseBody String?
  errorMessage String?
  
  attempts    Int      @default(0)
  nextRetryAt DateTime?
  
  createdAt   DateTime @default(now())
  deliveredAt DateTime?
  
  webhook Webhook @relation(fields: [webhookId], references: [id], onDelete: Cascade)
}
```

#### API Endpoints

```
# Integrations
GET    /api/integrations                      - List available integrations
GET    /api/integrations/connected            - List connected integrations
POST   /api/integrations/:type/connect        - Connect integration
DELETE /api/integrations/:id                  - Disconnect integration
POST   /api/integrations/:id/sync             - Trigger sync
GET    /api/integrations/:id/logs             - Get sync logs

# API Keys
POST   /api/api-keys                          - Create API key
GET    /api/api-keys                          - List API keys
DELETE /api/api-keys/:id                      - Revoke API key
GET    /api/api-keys/:id/usage                - Get usage stats

# Webhooks
POST   /api/webhooks                          - Create webhook
GET    /api/webhooks                          - List webhooks
PATCH  /api/webhooks/:id                      - Update webhook
DELETE /api/webhooks/:id                      - Delete webhook
GET    /api/webhooks/:id/deliveries           - Get delivery history
POST   /api/webhooks/:id/test                 - Send test event

# Developer Portal
GET    /api/docs                              - API documentation
GET    /api/docs/openapi                      - OpenAPI spec
```

#### Acceptance Criteria
- [ ] Integration setup < 5 minutes
- [ ] Sync completes within 5 minutes for 10,000 records
- [ ] API response time < 200ms (p95)
- [ ] Webhook delivery within 30 seconds
- [ ] Rate limiting works correctly
- [ ] UI follows deep black/white color scheme

---

### Session 12.4.4: Global Platform Features
**Timeline:** Weeks 10-12  
**Owner:** Backend Lead + Frontend Lead

#### Deliverables

**D-12.4.4.1: Multi-Language Support**
- [ ] UI translation (15 languages):
  - English (US, UK, Australia)
  - Spanish (Spain, Latin America)
  - French (France, Canada)
  - German, Italian, Portuguese (Brazil, Portugal)
  - Mandarin Chinese (Simplified, Traditional)
  - Japanese, Korean, Arabic, Hindi, Dutch
- [ ] Right-to-left (RTL) support (Arabic, Hebrew)
- [ ] Date/time formatting per locale
- [ ] Number formatting per locale
- [ ] Content translation (help articles, email templates)
- [ ] AI tools work in all supported languages

**D-12.4.4.2: Multi-Currency Support**
- [ ] 190+ currencies via exchange rate API
- [ ] Real-time exchange rates (updated hourly)
- [ ] Historical exchange rates
- [ ] Firm base currency setting
- [ ] Per-matter currency
- [ ] Per-invoice currency
- [ ] Multi-currency trust accounts
- [ ] Currency conversion for reports
- [ ] Gain/loss calculation

**D-12.4.4.3: Multi-Jurisdiction Support**
- [ ] Jurisdiction rules engine
- [ ] Bar rules database (ethical rules per jurisdiction)
- [ ] Court rules (filing deadlines, formatting)
- [ ] Trust accounting rules (IOLTA compliance varies)
- [ ] Tax rules (VAT, GST, sales tax)
- [ ] Document templates per jurisdiction
- [ ] Compliance automation

**D-12.4.4.4: Data Residency**
- [ ] Region selection (US, EU, APAC)
- [ ] Data stored in selected region
- [ ] Compliance with local data protection laws
- [ ] GDPR compliance
- [ ] Data export for compliance

#### Database Schema

```prisma
model Translation {
  id         String   @id @default(uuid())
  key        String   // e.g., "dashboard.welcome"
  language   String   // ISO 639-1 code (e.g., "es", "fr")
  value      String   @db.Text
  context    String?  // UI, email, help_article
  isVerified Boolean  @default(false)
  verifiedBy String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@unique([key, language])
}

model ExchangeRate {
  id          String   @id @default(uuid())
  fromCurrency String  // USD
  toCurrency   String  // EUR
  rate        Decimal  @db.Decimal(18, 8)
  rateDate    DateTime
  source      String   @default("api") // api, manual
  createdAt   DateTime @default(now())
  
  @@unique([fromCurrency, toCurrency, rateDate])
  @@index([fromCurrency, toCurrency])
}

model Jurisdiction {
  id               String   @id @default(uuid())
  country          String
  countryCode      String   // ISO 3166-1 alpha-2
  state            String?  // For US, Canada, Australia
  stateCode        String?  // ISO 3166-2
  jurisdictionName String   // "California" or "England & Wales"
  jurisdictionType String   // state, province, territory, country
  
  // Rules
  barRules         Json?    // Ethical rules, trust accounting rules
  courtRules       Json?    // Filing requirements, deadlines
  taxRules         Json?    // Tax rates, requirements
  trustAccountingRules Json? // IOLTA/trust accounting specifics
  
  // Defaults
  currency         String   // Primary currency for this jurisdiction
  language         String   // Primary language
  timezone         String   // Default timezone
  dateFormat       String   // Date format preference
  
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  @@unique([country, state])
}

model OrganizationLocale {
  id              String   @id @default(uuid())
  organizationId  String   @unique
  
  // Language
  defaultLanguage String   @default("en")
  supportedLanguages String[]
  
  // Currency
  baseCurrency    String   @default("USD")
  
  // Formatting
  dateFormat      String   @default("MM/DD/YYYY")
  timeFormat      String   @default("12h") // 12h, 24h
  numberFormat    String   @default("1,234.56") // 1,234.56 or 1.234,56
  
  // Timezone
  defaultTimezone String   @default("America/New_York")
  
  // Data Residency
  dataRegion      String   @default("us") // us, eu, apac
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
}

model TaxRate {
  id              String   @id @default(uuid())
  organizationId  String?  // Null for system-wide rates
  
  taxName         String   // "California Sales Tax", "UK VAT"
  taxType         String   // sales_tax, vat, gst
  jurisdiction    String
  
  rate            Decimal  @db.Decimal(5, 4) // 0.0825 for 8.25%
  
  // Applicability
  appliesToServices Boolean @default(true)
  appliesToProducts Boolean @default(true)
  
  effectiveDate   DateTime
  expirationDate  DateTime?
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  organization Organization? @relation(fields: [organizationId], references: [id])
}
```

#### API Endpoints

```
# Translations
GET    /api/translations/:language            - Get translations for language
POST   /api/admin/translations                - Add/update translation
GET    /api/admin/translations/status         - Get translation coverage

# Exchange Rates
GET    /api/exchange-rates                    - Get current rates
GET    /api/exchange-rates/convert            - Convert amount
GET    /api/exchange-rates/historical         - Get historical rate

# Jurisdictions
GET    /api/jurisdictions                     - List jurisdictions
GET    /api/jurisdictions/:id                 - Get jurisdiction details
GET    /api/jurisdictions/:id/rules           - Get jurisdiction rules

# Locale Settings
GET    /api/organization/locale               - Get locale settings
PATCH  /api/organization/locale               - Update locale settings

# Tax Rates
GET    /api/tax-rates                         - List tax rates
POST   /api/tax-rates                         - Create tax rate
PATCH  /api/tax-rates/:id                     - Update tax rate
POST   /api/tax-rates/calculate               - Calculate tax for amount
```

#### Acceptance Criteria
- [ ] UI translations 95% complete for pilot languages
- [ ] RTL layout works correctly for Arabic
- [ ] Exchange rates update every hour
- [ ] Currency conversion accurate to 4 decimal places
- [ ] Jurisdiction rules correctly calculate deadlines
- [ ] Data residency options available for Enterprise
- [ ] UI follows deep black/white color scheme

---

## PHASE 12.4 SUMMARY

### Deliverables Checklist

| Session | Deliverable | Status |
|---------|-------------|--------|
| 12.4.1 | Document Repository | ⬜ Pending |
| 12.4.1 | Document Assembly | ⬜ Pending |
| 12.4.1 | Collaboration | ⬜ Pending |
| 12.4.1 | Document Security | ⬜ Pending |
| 12.4.1 | AI Document Features | ⬜ Pending |
| 12.4.2 | Pre-Built Reports | ⬜ Pending |
| 12.4.2 | Custom Report Builder | ⬜ Pending |
| 12.4.2 | Dashboards | ⬜ Pending |
| 12.4.2 | AI Analytics | ⬜ Pending |
| 12.4.3 | Accounting Integrations | ⬜ Pending |
| 12.4.3 | Document Management Integrations | ⬜ Pending |
| 12.4.3 | Communication Integrations | ⬜ Pending |
| 12.4.3 | API Ecosystem | ⬜ Pending |
| 12.4.4 | Multi-Language Support | ⬜ Pending |
| 12.4.4 | Multi-Currency Support | ⬜ Pending |
| 12.4.4 | Multi-Jurisdiction Support | ⬜ Pending |
| 12.4.4 | Data Residency | ⬜ Pending |

### Success Metrics

| Metric | Target |
|--------|--------|
| Document search speed | < 2 seconds |
| AI extraction accuracy | > 85% |
| Report generation time | < 10 seconds |
| AI forecast accuracy | > 75% |
| Integration sync time | < 5 minutes |
| API response time | < 200ms (p95) |
| Translation coverage | > 95% |

### Team Requirements

| Role | Count | Responsibilities |
|------|-------|------------------|
| Backend Engineer | 3 | API development, integrations |
| Frontend Engineer | 2 | UI components, dashboards |
| AI Engineer | 1 | Document analysis, forecasting |
| DevOps Engineer | 1 | Infrastructure, data residency |
| QA Engineer | 1 | Testing, localization testing |

---

## SPRINT 12.5: LEGAL WEB SEARCH & EVIDENCE DISCOVERY (TOOL #241)
**Timeline:** Weeks 13-14 (2 weeks additional)  
**Team:** Backend (1), Frontend (1), AI Engineer (0.5)

---

### Session 12.5.1: Legal Web Search Tool
**Timeline:** Weeks 13-14  
**Owner:** Backend Lead + AI Engineer

#### Overview

The **Legal Web Search & Evidence Discovery** tool (Tool #241) is an AI-powered online research assistant that enables legal professionals to search the web for evidence, case law, news, public records, social media, and other relevant information related to their clients and matters.

#### Deliverables

**D-12.5.1.1: Multi-Source Search Engine**
- [ ] Web search integration (Bing API, Google Custom Search)
- [ ] News search integration (NewsAPI)
- [ ] Court records search (PACER, CourtListener)
- [ ] Government records search
- [ ] Corporate records search (SEC EDGAR, OpenCorporates)
- [ ] Query expansion and optimization
- [ ] Result aggregation and deduplication

**D-12.5.1.2: Search Modes**
- [ ] Quick Search (fast keyword search)
- [ ] Deep Search (comprehensive multi-source)
- [ ] Targeted Search (person, company, property, case)
- [ ] Monitoring Search (ongoing alerts)

**D-12.5.1.3: AI Evidence Analysis**
- [ ] Relevance scoring (0-100)
- [ ] Evidence value assessment (High/Medium/Low)
- [ ] Evidence type classification
- [ ] Suggested use (impeachment, corroboration, direct)
- [ ] Key findings extraction
- [ ] Entity extraction (people, companies, dates, amounts)

**D-12.5.1.4: Admissibility Analysis**
- [ ] Hearsay concerns identification
- [ ] Authentication requirements
- [ ] Best evidence rule considerations
- [ ] Privilege issue detection
- [ ] Spoliation risk assessment

**D-12.5.1.5: Source Credibility**
- [ ] Source reputation scoring
- [ ] Bias detection
- [ ] Fact-check cross-reference
- [ ] Publication date verification

**D-12.5.1.6: Citation & Archiving**
- [ ] Bluebook citation generation
- [ ] ALWD citation generation
- [ ] URL archiving (Wayback Machine integration)
- [ ] Screenshot capture for evidence preservation

**D-12.5.1.7: Matter Integration**
- [ ] Save results to matter
- [ ] Link to existing evidence
- [ ] Create follow-up tasks
- [ ] Research summary report generation

**D-12.5.1.8: Search UI**
- [ ] Search interface (deep black/white theme)
- [ ] Results list with AI analysis
- [ ] Result detail view
- [ ] Monitor management dashboard

#### Database Schema

```prisma
model WebSearchQuery {
  id              String   @id @default(uuid())
  organizationId  String
  userId          String
  matterId        String?
  
  // Query
  queryText       String
  searchMode      String   // quick, deep, targeted, monitor
  searchType      String?  // person, company, property, case
  sources         String[] // web, news, courts, gov, social, corporate
  
  // Filters
  dateRangeStart  DateTime?
  dateRangeEnd    DateTime?
  jurisdiction    String?
  
  // Results
  resultCount     Int      @default(0)
  expandedQuery   String?
  relatedTerms    String[]
  
  // Status
  status          String   @default("pending")
  
  createdAt       DateTime @default(now())
  completedAt     DateTime?
  
  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
  results      WebSearchResult[]
}

model WebSearchResult {
  id              String   @id @default(uuid())
  queryId         String
  
  // Source
  sourceType      String
  sourceUrl       String
  sourceDomain    String
  
  // Content
  title           String
  snippet         String   @db.Text
  fullContent     String?  @db.Text
  publishedDate   DateTime?
  author          String?
  
  // AI Analysis
  relevanceScore  Int
  evidenceValue   String
  evidenceType    String?
  suggestedUse    String?
  keyFindings     String[]
  mentionedEntities Json?
  suggestedActions String[]
  
  // Credibility
  credibilityScore Int?
  biasIndicators  String[]
  
  // Admissibility
  admissibilityNotes Json?
  
  // Citation
  citationBluebook String?
  citationAlwd    String?
  archivedUrl     String?
  archivedAt      DateTime?
  
  // User Actions
  isSaved         Boolean  @default(false)
  savedToMatterId String?
  userNotes       String?
  userTags        String[]
  
  createdAt       DateTime @default(now())
  
  query WebSearchQuery @relation(fields: [queryId], references: [id], onDelete: Cascade)
}

model WebSearchMonitor {
  id              String   @id @default(uuid())
  organizationId  String
  userId          String
  matterId        String?
  
  monitorName     String
  queryText       String
  sources         String[]
  frequency       String   // daily, weekly, realtime
  
  notifyEmail     Boolean  @default(true)
  notifyInApp     Boolean  @default(true)
  minRelevanceScore Int    @default(70)
  
  isActive        Boolean  @default(true)
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
}
```

#### API Endpoints

```
# Web Search
POST   /api/ai-tools/web-search                    - Execute search
GET    /api/ai-tools/web-search/queries            - List past queries
GET    /api/ai-tools/web-search/queries/:id        - Get query details
GET    /api/ai-tools/web-search/queries/:id/results - Get results

# Results
GET    /api/ai-tools/web-search/results/:id        - Get result details
POST   /api/ai-tools/web-search/results/:id/save   - Save to matter
POST   /api/ai-tools/web-search/results/:id/archive - Archive URL
POST   /api/ai-tools/web-search/results/:id/cite   - Generate citation

# Monitors
POST   /api/ai-tools/web-search/monitors           - Create monitor
GET    /api/ai-tools/web-search/monitors           - List monitors
PATCH  /api/ai-tools/web-search/monitors/:id       - Update monitor
DELETE /api/ai-tools/web-search/monitors/:id       - Delete monitor

# Targeted Searches
POST   /api/ai-tools/web-search/person             - Person search
POST   /api/ai-tools/web-search/company            - Company search
POST   /api/ai-tools/web-search/property           - Property search
POST   /api/ai-tools/web-search/case               - Case search
```

#### Acceptance Criteria
- [ ] Search returns results in < 5 seconds
- [ ] AI relevance scoring accuracy > 85%
- [ ] Citation format correct for Bluebook/ALWD
- [ ] URL archiving works correctly
- [ ] UI follows deep black/white color scheme
- [ ] Matter integration saves results correctly

---

## PHASE 12.5 SUMMARY (TOOL #241)

### Deliverables Checklist

| Session | Deliverable | Status |
|---------|-------------|--------|
| 12.5.1 | Multi-Source Search Engine | ⬜ Pending |
| 12.5.1 | Search Modes | ⬜ Pending |
| 12.5.1 | AI Evidence Analysis | ⬜ Pending |
| 12.5.1 | Admissibility Analysis | ⬜ Pending |
| 12.5.1 | Source Credibility | ⬜ Pending |
| 12.5.1 | Citation & Archiving | ⬜ Pending |
| 12.5.1 | Matter Integration | ⬜ Pending |
| 12.5.1 | Search UI | ⬜ Pending |

### Success Metrics

| Metric | Target |
|--------|--------|
| Search completion time | < 5 seconds |
| AI relevance accuracy | > 85% |
| Evidence saved to matters | > 30% of results |
| User satisfaction | > 4.5/5 |

---

**Document Version:** 3.1  
**Last Updated:** December 12, 2025  
**Status:** Ready for Development  
**Total AI Tools:** 241  
**Next Phase:** Phase 13 - Enterprise & Partner Integrations

---
