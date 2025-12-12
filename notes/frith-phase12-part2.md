# FRITH AI - PHASE 12 PART 2: PRODUCTIVITY & INTELLIGENCE LAYERS

---

## Module 14: Court & Docket Management (continued)

**AI Docket Features:**
- **AI Deadline Monitor:** Proactive deadline management:
  - Predicts which deadlines are at risk (based on team workload)
  - Suggests deadline extensions (auto-drafts motion for extension)
  - Calculates optimal filing timing (avoid Friday 5pm filings)
- **Smart Court Calendar:** AI integrates court schedules:
  - Pulls judge's calendar (if publicly available)
  - Suggests best hearing dates (judge availability + team availability)
  - Flags scheduling conflicts
- **Electronic Filing AI Assistant:**
  - Validates documents before filing (format, signatures, exhibits)
  - Suggests corrections (missing certificate of service)
  - Tracks filing status (filed, accepted, rejected)

**Database Schema:**
```prisma
model DocketEntry {
  id              String   @id @default(uuid())
  matterId        String
  entryNumber     Int?     // Court docket entry number
  entryDate       DateTime
  description     String
  documentType    String?  // motion, order, pleading, notice
  filedBy         String?  // party name
  documentUrl     String?  // Link to court document
  nextActionDate  DateTime?
  nextActionDescription String?
  importedFrom    String?  // pacer, manual, e-filing
  createdAt       DateTime @default(now())
  
  matter Matter @relation(fields: [matterId], references: [id])
}

model Deadline {
  id              String   @id @default(uuid())
  matterId        String
  deadlineType    String   // court_imposed, statute_of_limitations, internal
  description     String
  dueDate         DateTime
  dueTime         String?  // "5:00 PM"
  calculationRule String?  // "30 days after service"
  isHardDeadline  Boolean  @default(true)
  status          String   @default("pending") // pending, completed, extended, missed
  assignedTo      String?
  reminderSent    Boolean  @default(false)
  completedAt     DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  
  matter Matter @relation(fields: [matterId], references: [id])
}
```

---

# SPRINT 12.3: WORKFLOW & PRODUCTIVITY
**Timeline:** Months 25-27 (12 weeks)  
**Team:** Backend (2), Frontend (2), AI Engineer (1)

---

## Module 1: Calendar & Scheduling

### Week 1-3: Advanced Legal Calendar

**Core Calendar Features:**
- [ ] **Multi-View Calendar:**
  - Day, week, month, agenda views
  - Attorney-specific calendars (color-coded)
  - Matter-specific calendars (all events for a case)
  - Court calendar overlay (hearing dates)
  
- [ ] **Event Types:**
  - Court appearances (with travel time)
  - Client meetings (in-office, virtual, phone)
  - Depositions
  - Mediation/arbitration
  - Internal deadlines
  - Personal time off
  
- [ ] **Scheduling Features:**
  - Drag-and-drop scheduling
  - Recurring events
  - Multi-attendee scheduling (find common availability)
  - Room booking (conference rooms)
  - Video conference link generation (Zoom, Teams)
  
- [ ] **Integrations:**
  - Sync with Google Calendar, Outlook, iCal
  - Court calendar imports (PACER, state courts)
  - Conflict detection (double-booking prevention)

**AI Calendar Features:**
- **AI Scheduling Assistant:** Suggests optimal meeting times:
  - Considers attorney preferences (no early mornings for Attorney X)
  - Avoids scheduling conflicts
  - Factors in travel time (if in-person meeting after court)
  - Recommends meeting length based on matter complexity
- **Smart Reminder System:** Context-aware reminders:
  - Reminds about document prep (3 days before hearing)
  - Suggests agenda items (based on matter status)
  - Alerts if preparation incomplete (no witness list filed)
- **Predictive Calendar Blocking:** AI blocks time for:
  - Deep work (legal research, brief writing)
  - Anticipated tasks (discovery responses due next week)
  - Buffer time (between back-to-back meetings)

**Database Schema:**
```prisma
model CalendarEvent {
  id              String   @id @default(uuid())
  organizationId  String
  matterId        String?
  eventType       String   // court_appearance, meeting, deposition, deadline, etc.
  title           String
  description     String?
  location        String?
  isVirtual       Boolean  @default(false)
  meetingLink     String?  // Zoom, Teams link
  startTime       DateTime
  endTime         DateTime
  isAllDay        Boolean  @default(false)
  recurrence      String?  // RRULE format
  attendees       String[] // User IDs
  reminderTime    Int?     // Minutes before event
  courtId         String?  // If court appearance
  roomId          String?  // Conference room booking
  status          String   @default("confirmed") // confirmed, tentative, cancelled
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
}

model Court {
  id          String   @id @default(uuid())
  courtName   String
  courtType   String   // federal_district, state_superior, appellate
  address     String
  city        String
  state       String
  country     String   @default("US")
  phone       String?
  website     String?
  eFilingUrl  String?
  createdAt   DateTime @default(now())
}
```

---

## Module 2: Tasks & Workflow Management

### Week 4-6: Intelligent Task System

**Core Task Features:**
- [ ] **Task Management:**
  - Create, assign, prioritize tasks
  - Matter-linked tasks (all tasks for a case)
  - Subtasks & dependencies (Task B can't start until Task A done)
  - Task templates (standard tasks for matter types)
  - Recurring tasks (monthly billing, quarterly reviews)
  
- [ ] **Workflow Automation:**
  - Matter type workflows (new litigation → 20 automatic tasks)
  - Stage-based workflows (matter moves to "Discovery" → create discovery tasks)
  - Conditional workflows (if settlement rejected → create trial prep tasks)
  - Approval workflows (expense over $500 → manager approval)
  
- [ ] **Task Views:**
  - My Tasks (personal to-do list)
  - Team Tasks (department/practice group)
  - Matter Tasks (all tasks for a case)
  - Overdue Tasks (alerts)
  - Gantt chart (matter timeline view)

**AI Task Features:**
- **AI Task Generator:** Automatically creates tasks based on:
  - Matter type (new estate plan → draft will, create trust, etc.)
  - Documents uploaded (engagement letter signed → send welcome packet)
  - Calendar events (deposition scheduled → prepare witness, create exhibit list)
  - Email content (client email mentions trial → create trial prep checklist)
- **Smart Task Prioritization:** AI reorders task list by:
  - Deadline urgency
  - Matter importance (high-value client)
  - Dependencies (task blocking other tasks)
  - Attorney bandwidth (reassign if overloaded)
- **Predictive Task Duration:** AI estimates task completion time:
  - Based on historical data (legal research usually takes 2 hours)
  - Complexity of matter
  - Attorney experience level
  - Alerts if task running long

**Database Schema:**
```prisma
model Task {
  id              String   @id @default(uuid())
  organizationId  String
  matterId        String?
  title           String
  description     String?
  taskType        String?  // legal_research, document_drafting, court_filing, etc.
  priority        String   @default("medium") // low, medium, high, urgent
  status          String   @default("pending") // pending, in_progress, completed, cancelled
  assignedTo      String?
  assignedBy      String?
  dueDate         DateTime?
  dueTime         String?
  estimatedHours  Decimal? @db.Decimal(5, 2)
  actualHours     Decimal? @db.Decimal(5, 2)
  parentTaskId    String?  // For subtasks
  dependsOn       String[] // Task IDs that must be completed first
  isRecurring     Boolean  @default(false)
  recurrenceRule  String?
  completedAt     DateTime?
  completedBy     String?
  notes           String?
  aiGenerated     Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
  subtasks     Task[]       @relation("ParentTask")
  parentTask   Task?        @relation("ParentTask", fields: [parentTaskId], references: [id])
  timeEntries  TimeEntry[]
}

model Workflow {
  id              String   @id @default(uuid())
  organizationId  String
  name            String
  triggerType     String   // matter_created, matter_stage_change, document_uploaded
  matterType      String?  // litigation, transactional (if matter-specific)
  isActive        Boolean  @default(true)
  steps           Json     // Array of workflow steps
  createdBy       String
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
}
```

---

## Module 5: Activities & Time Tracking

### Week 7-9: Comprehensive Time Tracking

**Core Time Tracking Features:**
- [ ] **Time Entry Methods:**
  - Manual entry (attorney logs time)
  - Timer (start/stop for active work)
  - Automatic capture (AI suggests time entries from activities)
  - Bulk entry (end-of-day time entry)
  - Mobile time entry (app)
  
- [ ] **Time Entry Details:**
  - Matter, task, activity type
  - Billable/non-billable
  - Rate (attorney standard rate or custom)
  - UTBMS codes (task and activity codes for LEDES billing)
  - Description (narrative of work performed)
  
- [ ] **Time Approval Workflow:**
  - Attorney submits time
  - Partner reviews/edits (write-downs/write-ups)
  - Approved time → ready for invoicing

**AI Time Tracking Features:**
- **AI Time Capture:** Automatically suggests time entries:
  - Email reviewed (client email → 0.1 hours, "Review correspondence from client re: discovery")
  - Document edited (contract draft → 1.5 hours, "Draft purchase agreement")
  - Meeting attended (calendar event → 0.5 hours)
  - Phone call logged (CRM → 0.2 hours)
- **Smart Time Rounding:** AI suggests proper time increments:
  - Rounds to 0.1, 0.25, or 0.5 hours (firm policy)
  - Flags excessive rounding (3-minute call → 0.3 hours)
- **Time Entry Quality Check:** AI flags issues before submission:
  - Missing matter (time entry with no matter assigned)
  - Vague description ("Work on case" → suggest more detail)
  - Unusual hours (12 hours in one day → confirm accurate)
  - Duplicate entries (same activity logged twice)
- **Predictive Write-Offs:** AI predicts which time entries likely to be written off:
  - Excessive time for routine tasks
  - Time on non-recoverable work (internal meetings)
  - Suggests adjustments before invoicing

**Database Schema:**
```prisma
model TimeEntry {
  id              String   @id @default(uuid())
  organizationId  String
  userId          String
  matterId        String
  taskId          String?
  activityType    String   // legal_research, drafting, email, phone, court_appearance
  description     String
  hours           Decimal  @db.Decimal(5, 2)
  rate            Decimal  @db.Decimal(10, 2)
  amount          Decimal  @db.Decimal(15, 2) // hours * rate
  isBillable      Boolean  @default(true)
  isBilled        Boolean  @default(false)
  invoiceId       String?
  entryDate       DateTime
  utbmsTaskCode   String?
  utbmsActivityCode String?
  status          String   @default("draft") // draft, submitted, approved, billed
  submittedAt     DateTime?
  approvedBy      String?
  approvedAt      DateTime?
  aiGenerated     Boolean  @default(false)
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
  matter       Matter       @relation(fields: [matterId], references: [id])
  task         Task?        @relation(fields: [taskId], references: [id])
  invoice      Invoice?     @relation(fields: [invoiceId], references: [id])
}

model ActivityLog {
  id              String   @id @default(uuid())
  userId          String
  activityType    String   // email, document, call, meeting, ai_tool
  matterId        String?
  description     String
  duration        Int?     // Seconds
  suggestedTimeEntry Boolean @default(false)
  timeEntryId     String?  // If converted to time entry
  occurredAt      DateTime
  createdAt       DateTime @default(now())
  
  user      User        @relation(fields: [userId], references: [id])
  matter    Matter?     @relation(fields: [matterId], references: [id])
  timeEntry TimeEntry?  @relation(fields: [timeEntryId], references: [id])
}
```

---

## Module 8: Communications Hub

### Week 10-12: Unified Communications

**Core Communication Features:**
- [ ] **Email Integration:**
  - Two-way Gmail/Outlook sync
  - Automatic email filing to matters
  - Email templates (engagement letters, status updates)
  - Mass email campaigns (newsletter to clients)
  - Email tracking (opened, clicked)
  
- [ ] **Phone Integration:**
  - VoIP integration (Twilio, RingCentral)
  - Call logging (automatic to matter)
  - Click-to-call from contact records
  - Call recording (compliance with state laws)
  - Voicemail transcription (AI)
  
- [ ] **SMS/Text Messaging:**
  - Text clients (appointment reminders, updates)
  - Two-way SMS conversations
  - SMS templates
  - Compliance (opt-in/opt-out)
  
- [ ] **Client Portal Messaging:**
  - Secure messaging (attorney ↔ client)
  - File sharing in messages
  - Message read receipts
  - Threaded conversations

**AI Communication Features:**
- **AI Email Assistant:** 
  - Auto-drafts email responses (based on context)
  - Suggests matter assignment (incoming email → links to correct case)
  - Flags urgent emails (client mentions "urgent", "trial tomorrow")
  - Summarizes long email threads
- **Sentiment Analysis:** AI detects client emotions:
  - Angry client email → escalate to partner
  - Confused client → suggest scheduling call
  - Satisfied client → prompt for review/referral
- **Smart Call Routing:** AI routes incoming calls:
  - Identifies caller (from CRM)
  - Routes to assigned attorney
  - If unavailable, offers voicemail or callback scheduling
- **Communication Compliance Monitor:** AI flags potential issues:
  - Confidential info sent to wrong recipient
  - Non-encrypted email to client (sensitive case)
  - Communication with represented party (ethics violation)

**Database Schema:**
```prisma
model Communication {
  id              String   @id @default(uuid())
  organizationId  String
  communicationType String // email, call, sms, portal_message
  direction       String   // inbound, outbound
  fromEmail       String?
  toEmail         String[]
  ccEmail         String[]
  fromPhone       String?
  toPhone         String?
  subject         String?
  body            String?  @db.Text
  matterId        String?
  contactId       String?
  userId          String?  // User who sent/received
  status          String?  // sent, delivered, read, failed
  threadId        String?  // For email threads
  attachments     String[] // File URLs
  recordingUrl    String?  // For call recordings
  transcript      String?  // Call/voicemail transcription
  aiSentiment     String?  // positive, neutral, negative, urgent
  occurredAt      DateTime @default(now())
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
  contact      Contact?     @relation(fields: [contactId], references: [id])
  user         User?        @relation(fields: [userId], references: [id])
}
```

---

# SPRINT 12.4: INTELLIGENCE & GLOBAL PLATFORM
**Timeline:** Months 28-30 (12 weeks)  
**Team:** Backend (3), Frontend (2), AI Engineer (1), DevOps (1)

---

## Module 7: Documents & Knowledge Management

### Week 1-4: Advanced Document System

**Core Document Features:**
- [ ] **Document Repository:**
  - Matter-based document storage
  - Version control (track all changes)
  - Document tagging (pleadings, discovery, evidence, etc.)
  - Full-text search (search inside PDFs, DOCX)
  - Document preview (no download needed)
  
- [ ] **Document Assembly:**
  - Template library (contracts, pleadings, letters)
  - Mail merge (fill templates with client data)
  - Conditional logic (if litigation → include clause X)
  - E-signature integration (DocuSign, HelloSign)
  
- [ ] **Collaboration:**
  - Real-time co-editing (like Google Docs)
  - Comments & annotations
  - Review workflows (draft → review → approve → finalize)
  - External sharing (share with clients, opposing counsel)
  
- [ ] **Document Security:**
  - Encryption at rest and in transit
  - Access controls (who can view/edit)
  - Watermarking (mark as "Confidential")
  - Audit trail (who accessed when)

**AI Document Features:**
- **AI Document Analyzer:** Automatically extracts:
  - Key dates (deadlines, signatures, effective dates)
  - Parties (plaintiff, defendant, contract parties)
  - Dollar amounts (damages, contract value)
  - Obligations & clauses (deliverables, termination rights)
- **Smart Document Organization:** AI suggests:
  - Document type (motion, contract, correspondence)
  - Matter assignment
  - Tags (e.g., "Discovery Request", "Expert Report")
- **Document Comparison (Redlining):** AI-powered:
  - Compare two versions side-by-side
  - Highlight changes (additions, deletions, modifications)
  - Summarize key changes in plain English
- **Privilege Log Generator:** AI scans documents and:
  - Identifies privileged documents (attorney-client, work product)
  - Auto-generates privilege log (for discovery responses)
  - Flags potentially responsive but privileged documents

**Database Schema:**
```prisma
model Document {
  id              String   @id @default(uuid())
  organizationId  String
  matterId        String?
  documentName    String
  documentType    String?  // pleading, contract, correspondence, evidence
  fileUrl         String
  fileSize        Int
  mimeType        String
  version         Int      @default(1)
  parentDocId     String?  // For version control
  tags            String[]
  isPrivileged    Boolean  @default(false)
  privilegeReason String?  // attorney_client, work_product
  uploadedBy      String
  lastAccessedBy  String?
  lastAccessedAt  DateTime?
  isTemplate      Boolean  @default(false)
  aiExtractedData Json?    // Dates, parties, amounts extracted by AI
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization      @relation(fields: [organizationId], references: [id])
  matter       Matter?           @relation(fields: [matterId], references: [id])
  versions     Document[]        @relation("DocumentVersions")
  parentDoc    Document?         @relation("DocumentVersions", fields: [parentDocId], references: [id])
  comments     DocumentComment[]
}

model DocumentComment {
  id         String   @id @default(uuid())
  documentId String
  userId     String
  comment    String
  pageNumber Int?
  coordinates Json?   // {x, y} for annotation position
  createdAt  DateTime @default(now())
  
  document Document @relation(fields: [documentId], references: [id])
  user     User     @relation(fields: [userId], references: [id])
}
```

---

## Module 10: Reports & Analytics

### Week 5-7: Business Intelligence

**Core Reporting Features:**
- [ ] **Pre-Built Reports:**
  - Financial reports (P&L, balance sheet, cash flow)
  - Trust account reports (client ledgers, reconciliation)
  - Time & billing reports (WIP, AR aging, collections)
  - Attorney productivity (hours by attorney, realization rate)
  - Matter profitability (revenue vs. cost per matter)
  - Client reports (top clients by revenue, at-risk clients)
  
- [ ] **Custom Report Builder:**
  - Drag-and-drop report designer
  - Filter by date, practice area, attorney, etc.
  - Grouping & aggregation
  - Export to Excel, PDF, CSV
  - Schedule reports (email monthly report to partners)
  
- [ ] **Dashboards:**
  - Executive dashboard (firm-wide metrics)
  - Attorney dashboard (personal performance)
  - Practice group dashboard (department metrics)
  - Real-time data updates

**AI Analytics Features:**
- **Predictive Analytics:** AI forecasts:
  - Revenue (next quarter, year-end)
  - Cash flow (predict low cash months)
  - Attorney utilization (predict burnout risk)
  - Client lifetime value (predict retention)
- **Anomaly Detection:** AI flags unusual patterns:
  - Revenue drop (practice area decline)
  - Excessive write-offs (attorney or matter issue)
  - Slow-paying clients (collections needed)
- **Benchmarking:** AI compares firm to industry standards:
  - Realization rate (% of billed time collected)
  - Overhead ratio
  - Lawyer-to-staff ratio
  - Provides recommendations for improvement

**Database Schema:**
```prisma
model Report {
  id              String   @id @default(uuid())
  organizationId  String
  reportName      String
  reportType      String   // financial, time_billing, attorney_productivity, custom
  description     String?
  filters         Json     // Report parameters
  schedule        String?  // cron expression for scheduled reports
  recipients      String[] // Email addresses
  lastRunAt       DateTime?
  createdBy       String
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
}
```

---

## Module 11: Integrations & API Ecosystem

### Week 8-9: Platform Integrations

**Core Integrations:**
- [ ] **Accounting Software:**
  - QuickBooks Online/Desktop
  - Xero
  - Sync chart of accounts, invoices, expenses
  
- [ ] **Document Management:**
  - iManage
  - NetDocuments
  - SharePoint
  - Two-way sync
  
- [ ] **Communication:**
  - Gmail (already built)