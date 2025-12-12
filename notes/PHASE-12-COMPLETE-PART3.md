# FRITH AI - PHASE 12: COMPLETE LEGAL ERP PLATFORM
## Part 3: Workflow & Productivity

**From AI Tool Platform to Industry-Leading Legal ERP**  
**Version:** 3.0  
**Timeline:** Months 25-27 (12 weeks)  
**Goal:** Build comprehensive workflow automation, time tracking, and communication systems

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

## SPRINT 12.3: WORKFLOW & PRODUCTIVITY
**Timeline:** Weeks 1-12 (Months 25-27)  
**Team:** Backend (2), Frontend (2), AI Engineer (1)

---

### Session 12.3.1: Calendar & Scheduling
**Timeline:** Weeks 1-3  
**Owner:** Frontend Lead + Backend Lead

#### Deliverables

**D-12.3.1.1: Multi-View Calendar**
- [ ] Day, week, month, agenda views
- [ ] Attorney-specific calendars (color-coded by attorney)
- [ ] Matter-specific calendars (all events for a case)
- [ ] Court calendar overlay (hearing dates)
- [ ] Resource calendar (conference rooms, equipment)
- [ ] Team availability view
- [ ] Mini calendar for quick navigation

**D-12.3.1.2: Event Types**
- [ ] Court appearances (with travel time calculation)
- [ ] Client meetings (in-office, virtual, phone)
- [ ] Depositions
- [ ] Mediation/arbitration
- [ ] Internal meetings
- [ ] Deadlines (from deadline management)
- [ ] Personal time off / vacation
- [ ] Blocked time (focus time)
- [ ] Reminders

**D-12.3.1.3: Scheduling Features**
- [ ] Drag-and-drop scheduling
- [ ] Recurring events (daily, weekly, monthly, custom)
- [ ] Multi-attendee scheduling (find common availability)
- [ ] Room booking (conference rooms)
- [ ] Video conference link generation (Zoom, Teams, Google Meet)
- [ ] Travel time calculation (Google Maps integration)
- [ ] Buffer time between events
- [ ] Conflict detection and resolution

**D-12.3.1.4: Calendar Integrations**
- [ ] Sync with Google Calendar (two-way)
- [ ] Sync with Outlook/Microsoft 365 (two-way)
- [ ] Sync with Apple iCal
- [ ] Court calendar imports (PACER, state courts)
- [ ] Client portal calendar (share selected events)

**D-12.3.1.5: AI Calendar Features**
- [ ] **AI Scheduling Assistant:** Suggests optimal meeting times:
  - Considers attorney preferences
  - Avoids scheduling conflicts
  - Factors in travel time
  - Recommends meeting length based on matter complexity
- [ ] **Smart Reminder System:** Context-aware reminders:
  - Reminds about document prep before hearings
  - Suggests agenda items based on matter status
  - Alerts if preparation incomplete
- [ ] **Predictive Calendar Blocking:** AI blocks time for:
  - Deep work (legal research, brief writing)
  - Anticipated tasks based on deadlines
  - Buffer time between meetings

#### Database Schema

```prisma
model CalendarEvent {
  id              String   @id @default(uuid())
  organizationId  String
  
  // Event Info
  title           String
  description     String?
  eventType       String   // court_appearance, meeting, deposition, deadline, pto, blocked, etc.
  eventSubtype    String?
  
  // Timing
  startTime       DateTime
  endTime         DateTime
  timezone        String   @default("America/New_York")
  isAllDay        Boolean  @default(false)
  
  // Recurrence
  isRecurring     Boolean  @default(false)
  recurrenceRule  String?  // RRULE format
  recurrenceEndDate DateTime?
  parentEventId   String?  // For recurring event instances
  
  // Location
  location        String?
  isVirtual       Boolean  @default(false)
  meetingLink     String?  // Zoom, Teams link
  meetingProvider String?  // zoom, teams, google_meet
  roomId          String?  // Conference room booking
  
  // Travel
  includeTravelTime Boolean @default(false)
  travelTimeMinutes Int?
  travelFromLocation String?
  
  // Attendees
  organizerId     String
  attendees       CalendarAttendee[]
  
  // Matter Link
  matterId        String?
  clientId        String?
  
  // Court (if court appearance)
  courtId         String?
  caseNumber      String?
  judge           String?
  courtroom       String?
  
  // Reminders
  reminders       CalendarReminder[]
  
  // Status
  status          String   @default("confirmed") // confirmed, tentative, cancelled
  visibility      String   @default("default") // default, public, private
  showAs          String   @default("busy") // busy, free, tentative, out_of_office
  
  // External Sync
  externalId      String?  // ID from Google/Outlook
  externalProvider String? // google, outlook, apple
  lastSyncedAt    DateTime?
  
  // Metadata
  color           String?  // Override color
  notes           String?
  attachments     String[] // Document IDs
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
  client       Contact?     @relation(fields: [clientId], references: [id])
  court        Court?       @relation(fields: [courtId], references: [id])
  room         ConferenceRoom? @relation(fields: [roomId], references: [id])
  parentEvent  CalendarEvent? @relation("RecurringEvents", fields: [parentEventId], references: [id])
  childEvents  CalendarEvent[] @relation("RecurringEvents")
  
  @@index([organizationId, startTime])
  @@index([matterId])
  @@index([organizerId])
}

model CalendarAttendee {
  id          String   @id @default(uuid())
  eventId     String
  userId      String?  // Internal user
  email       String   // For external attendees
  name        String?
  role        String   @default("attendee") // organizer, attendee, optional
  status      String   @default("pending") // pending, accepted, declined, tentative
  respondedAt DateTime?
  isExternal  Boolean  @default(false)
  
  event CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User?         @relation(fields: [userId], references: [id])
  
  @@unique([eventId, email])
}

model CalendarReminder {
  id          String   @id @default(uuid())
  eventId     String
  reminderType String  // email, push, sms
  minutesBefore Int
  isSent      Boolean  @default(false)
  sentAt      DateTime?
  
  event CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model ConferenceRoom {
  id              String   @id @default(uuid())
  organizationId  String
  roomName        String
  location        String?  // Building, floor
  capacity        Int?
  amenities       String[] // projector, whiteboard, video_conference
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  events       CalendarEvent[]
}

model CalendarSync {
  id              String   @id @default(uuid())
  userId          String
  provider        String   // google, outlook, apple
  accountEmail    String
  accessToken     String   // Encrypted
  refreshToken    String?  // Encrypted
  tokenExpiresAt  DateTime?
  calendarId      String   // External calendar ID
  syncDirection   String   @default("both") // both, to_external, from_external
  lastSyncAt      DateTime?
  syncStatus      String   @default("active") // active, paused, error
  syncError       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, provider, accountEmail])
}
```

#### API Endpoints

```
# Calendar Events
POST   /api/calendar/events                   - Create event
GET    /api/calendar/events                   - List events (with date range)
GET    /api/calendar/events/:id               - Get event details
PATCH  /api/calendar/events/:id               - Update event
DELETE /api/calendar/events/:id               - Delete event
POST   /api/calendar/events/:id/cancel        - Cancel event (notify attendees)

# Recurring Events
POST   /api/calendar/events/:id/update-series - Update all in series
POST   /api/calendar/events/:id/update-future - Update this and future
DELETE /api/calendar/events/:id/delete-series - Delete series

# Attendees
POST   /api/calendar/events/:id/attendees     - Add attendee
DELETE /api/calendar/events/:id/attendees/:attendeeId - Remove attendee
POST   /api/calendar/events/:id/respond       - Respond to invitation

# Availability
GET    /api/calendar/availability             - Get availability for users
POST   /api/calendar/find-time                - Find common available time

# Room Booking
GET    /api/calendar/rooms                    - List conference rooms
GET    /api/calendar/rooms/:id/availability   - Get room availability
POST   /api/calendar/rooms/:id/book           - Book room

# Sync
POST   /api/calendar/sync/connect             - Connect external calendar
GET    /api/calendar/sync                     - Get sync status
POST   /api/calendar/sync/trigger             - Trigger manual sync
DELETE /api/calendar/sync/:id                 - Disconnect calendar

# AI Features
POST   /api/calendar/ai/suggest-time          - AI suggest meeting time
POST   /api/calendar/ai/auto-block            - AI block focus time
GET    /api/calendar/ai/prep-reminders        - Get prep reminders
```

#### Acceptance Criteria
- [ ] Calendar sync completes within 30 seconds
- [ ] Conflict detection works in real-time
- [ ] Recurring events support complex RRULE patterns
- [ ] Room booking prevents double-booking
- [ ] AI scheduling suggestions accuracy > 85%
- [ ] UI follows deep black/white color scheme

---

### Session 12.3.2: Tasks & Workflow Management
**Timeline:** Weeks 4-6  
**Owner:** Backend Lead + Frontend Lead

#### Deliverables

**D-12.3.2.1: Task Management**
- [ ] Create, assign, prioritize tasks
- [ ] Matter-linked tasks (all tasks for a case)
- [ ] Subtasks & dependencies (Task B can't start until Task A done)
- [ ] Task templates (standard tasks for matter types)
- [ ] Recurring tasks (monthly billing, quarterly reviews)
- [ ] Task tags and categories
- [ ] Task attachments and comments

**D-12.3.2.2: Task Views**
- [ ] My Tasks (personal to-do list)
- [ ] Team Tasks (department/practice group)
- [ ] Matter Tasks (all tasks for a case)
- [ ] Overdue Tasks (alerts)
- [ ] Kanban board view
- [ ] List view with sorting/filtering
- [ ] Gantt chart (matter timeline view)
- [ ] Calendar view (tasks by due date)

**D-12.3.2.3: Workflow Automation**
- [ ] Matter type workflows (new litigation → automatic tasks)
- [ ] Stage-based workflows (matter moves to "Discovery" → create discovery tasks)
- [ ] Conditional workflows (if settlement rejected → create trial prep tasks)
- [ ] Approval workflows (expense over $500 → manager approval)
- [ ] Time-based triggers (if task not completed in 3 days → escalate)
- [ ] Event-based triggers (document uploaded → create review task)

**D-12.3.2.4: AI Task Features**
- [ ] **AI Task Generator:** Automatically creates tasks based on:
  - Matter type (new estate plan → draft will, create trust, etc.)
  - Documents uploaded (engagement letter signed → send welcome packet)
  - Calendar events (deposition scheduled → prepare witness)
  - Email content (client mentions trial → create trial prep checklist)
- [ ] **Smart Task Prioritization:** AI reorders task list by:
  - Deadline urgency
  - Matter importance (high-value client)
  - Dependencies (task blocking other tasks)
  - Attorney bandwidth
- [ ] **Predictive Task Duration:** AI estimates task completion time:
  - Based on historical data
  - Complexity of matter
  - Attorney experience level
  - Alerts if task running long

#### Database Schema

```prisma
model Task {
  id              String   @id @default(uuid())
  taskNumber      String   // Auto-generated: TASK-2025-0001
  organizationId  String
  
  // Task Info
  title           String
  description     String?
  taskType        String?  // legal_research, document_drafting, court_filing, client_communication, etc.
  
  // Priority & Status
  priority        String   @default("medium") // low, medium, high, urgent
  status          String   @default("pending") // pending, in_progress, completed, cancelled, on_hold
  
  // Assignment
  assignedTo      String?
  assignedBy      String?
  assignedAt      DateTime?
  
  // Dates
  dueDate         DateTime?
  dueTime         String?
  startDate       DateTime?
  completedAt     DateTime?
  completedBy     String?
  
  // Time Estimates
  estimatedHours  Decimal? @db.Decimal(5, 2)
  actualHours     Decimal? @db.Decimal(5, 2)
  
  // Hierarchy
  parentTaskId    String?  // For subtasks
  
  // Dependencies
  dependsOn       String[] // Task IDs that must be completed first
  blockedBy       String[] // Tasks blocking this one
  
  // Recurrence
  isRecurring     Boolean  @default(false)
  recurrenceRule  String?
  nextOccurrence  DateTime?
  
  // Links
  matterId        String?
  deadlineId      String?  // If created from deadline
  workflowId      String?  // If created by workflow
  
  // AI
  aiGenerated     Boolean  @default(false)
  aiPriorityScore Int?     // AI-calculated priority
  aiEstimatedHours Decimal? @db.Decimal(5, 2)
  
  // Metadata
  tags            String[]
  notes           String?
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
  parentTask   Task?        @relation("TaskHierarchy", fields: [parentTaskId], references: [id])
  subtasks     Task[]       @relation("TaskHierarchy")
  timeEntries  TimeEntry[]
  comments     TaskComment[]
  attachments  TaskAttachment[]
  
  @@unique([organizationId, taskNumber])
  @@index([organizationId, status])
  @@index([assignedTo, status])
  @@index([matterId])
}

model TaskComment {
  id          String   @id @default(uuid())
  taskId      String
  comment     String
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model TaskAttachment {
  id          String   @id @default(uuid())
  taskId      String
  documentId  String?
  fileName    String
  fileUrl     String
  fileSize    Int
  mimeType    String
  uploadedBy  String
  uploadedAt  DateTime @default(now())
  
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model TaskTemplate {
  id              String   @id @default(uuid())
  organizationId  String
  templateName    String
  description     String?
  taskType        String?
  
  // Default values
  defaultPriority String   @default("medium")
  defaultAssigneeRole String? // Role to assign to
  estimatedHours  Decimal? @db.Decimal(5, 2)
  dueDaysFromStart Int?    // Days after creation
  
  // Subtask templates
  subtasks        Json?    // Array of subtask templates
  
  // Tags
  tags            String[]
  
  isActive        Boolean  @default(true)
  createdBy       String
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
}

model Workflow {
  id              String   @id @default(uuid())
  organizationId  String
  workflowName    String
  description     String?
  
  // Trigger
  triggerType     String   // matter_created, matter_stage_change, document_uploaded, deadline_approaching, manual
  triggerConditions Json   // Conditions for trigger
  
  // Scope
  matterType      String?  // If specific to matter type
  practiceArea    String?
  
  // Steps
  steps           Json     // Array of workflow steps
  
  // Status
  isActive        Boolean  @default(true)
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  executions   WorkflowExecution[]
}

model WorkflowExecution {
  id              String   @id @default(uuid())
  workflowId      String
  matterId        String?
  
  // Execution
  triggeredBy     String   // user_id or "system"
  triggeredAt     DateTime @default(now())
  
  // Status
  status          String   @default("running") // running, completed, failed, cancelled
  currentStep     Int      @default(0)
  stepResults     Json?    // Results of each step
  
  completedAt     DateTime?
  errorMessage    String?
  
  workflow Workflow @relation(fields: [workflowId], references: [id])
}
```

#### API Endpoints

```
# Tasks
POST   /api/tasks                             - Create task
GET    /api/tasks                             - List tasks (with filters)
GET    /api/tasks/:id                         - Get task details
PATCH  /api/tasks/:id                         - Update task
DELETE /api/tasks/:id                         - Delete task
POST   /api/tasks/:id/complete                - Mark complete
POST   /api/tasks/:id/assign                  - Assign task
POST   /api/tasks/:id/duplicate               - Duplicate task

# Subtasks
POST   /api/tasks/:id/subtasks                - Create subtask
GET    /api/tasks/:id/subtasks                - Get subtasks

# Comments & Attachments
POST   /api/tasks/:id/comments                - Add comment
GET    /api/tasks/:id/comments                - Get comments
POST   /api/tasks/:id/attachments             - Add attachment

# Task Templates
POST   /api/task-templates                    - Create template
GET    /api/task-templates                    - List templates
POST   /api/tasks/from-template               - Create task from template

# Workflows
POST   /api/workflows                         - Create workflow
GET    /api/workflows                         - List workflows
GET    /api/workflows/:id                     - Get workflow details
PATCH  /api/workflows/:id                     - Update workflow
POST   /api/workflows/:id/execute             - Manually execute workflow
GET    /api/workflows/:id/executions          - Get execution history

# AI Features
POST   /api/tasks/ai/generate                 - AI generate tasks
POST   /api/tasks/ai/prioritize               - AI prioritize tasks
GET    /api/tasks/ai/suggestions              - Get task suggestions
```

#### Acceptance Criteria
- [ ] Task dependencies prevent completion of blocked tasks
- [ ] Workflow triggers execute within 30 seconds
- [ ] Kanban drag-and-drop updates in real-time
- [ ] AI task generation accuracy > 80%
- [ ] Gantt chart renders 100+ tasks smoothly
- [ ] UI follows deep black/white color scheme

---

### Session 12.3.3: Time Tracking
**Timeline:** Weeks 7-9  
**Owner:** Backend Lead + Frontend Lead

#### Deliverables

**D-12.3.3.1: Time Entry Methods**
- [ ] Manual entry (attorney logs time)
- [ ] Timer (start/stop for active work)
- [ ] Automatic capture (AI suggests time entries from activities)
- [ ] Bulk entry (end-of-day time entry)
- [ ] Mobile time entry (app)
- [ ] Quick entry (keyboard shortcuts)

**D-12.3.3.2: Time Entry Details**
- [ ] Matter, task, activity type
- [ ] Billable/non-billable toggle
- [ ] Rate (attorney standard rate or custom)
- [ ] UTBMS codes (task and activity codes for LEDES billing)
- [ ] Description (narrative of work performed)
- [ ] Date and duration
- [ ] Multiple entries per day

**D-12.3.3.3: Time Approval Workflow**
- [ ] Attorney submits time
- [ ] Partner reviews/edits (write-downs/write-ups)
- [ ] Approved time → ready for invoicing
- [ ] Rejection with comments
- [ ] Batch approval

**D-12.3.3.4: AI Time Tracking Features**
- [ ] **AI Time Capture:** Automatically suggests time entries:
  - Email reviewed → 0.1 hours
  - Document edited → estimated time
  - Meeting attended → calendar duration
  - Phone call logged → call duration
- [ ] **Smart Time Rounding:** AI suggests proper time increments:
  - Rounds to firm policy (0.1, 0.25, 0.5 hours)
  - Flags excessive rounding
- [ ] **Time Entry Quality Check:** AI flags issues:
  - Missing matter
  - Vague description
  - Unusual hours
  - Duplicate entries
- [ ] **Predictive Write-Offs:** AI predicts which entries likely to be written off

#### Database Schema

```prisma
model TimeEntry {
  id              String   @id @default(uuid())
  entryNumber     String   // Auto-generated: TIME-2025-0001
  organizationId  String
  userId          String
  
  // Links
  matterId        String
  taskId          String?
  
  // Activity
  activityType    String   // legal_research, drafting, email, phone, court_appearance, meeting, travel, etc.
  description     String
  
  // Time
  entryDate       DateTime
  startTime       DateTime?
  endTime         DateTime?
  hours           Decimal  @db.Decimal(5, 2)
  
  // Billing
  isBillable      Boolean  @default(true)
  rate            Decimal  @db.Decimal(10, 2)
  amount          Decimal  @db.Decimal(15, 2) // hours * rate
  
  // LEDES/UTBMS
  utbmsTaskCode   String?
  utbmsActivityCode String?
  
  // Status
  status          String   @default("draft") // draft, submitted, approved, rejected, billed
  submittedAt     DateTime?
  approvedBy      String?
  approvedAt      DateTime?
  rejectedBy      String?
  rejectedAt      DateTime?
  rejectionReason String?
  
  // Billing
  isBilled        Boolean  @default(false)
  invoiceLineItemId String?
  
  // Adjustments
  originalHours   Decimal? @db.Decimal(5, 2) // Before write-down
  adjustmentReason String?
  adjustedBy      String?
  adjustedAt      DateTime?
  
  // AI
  aiGenerated     Boolean  @default(false)
  aiSourceType    String?  // email, document, calendar, call
  aiSourceId      String?  // ID of source activity
  aiConfidence    Decimal? @db.Decimal(3, 2) // 0-1 confidence score
  
  // Timer
  isTimerEntry    Boolean  @default(false)
  timerStartedAt  DateTime?
  timerStoppedAt  DateTime?
  
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
  matter       Matter       @relation(fields: [matterId], references: [id])
  task         Task?        @relation(fields: [taskId], references: [id])
  invoiceLineItem InvoiceLineItem? @relation(fields: [invoiceLineItemId], references: [id])
  
  @@unique([organizationId, entryNumber])
  @@index([userId, entryDate])
  @@index([matterId])
  @@index([status])
}

model TimeTimer {
  id              String   @id @default(uuid())
  userId          String
  matterId        String?
  taskId          String?
  activityType    String?
  description     String?
  startedAt       DateTime @default(now())
  pausedAt        DateTime?
  totalPausedSeconds Int    @default(0)
  status          String   @default("running") // running, paused, stopped
  
  user   User    @relation(fields: [userId], references: [id])
  matter Matter? @relation(fields: [matterId], references: [id])
  task   Task?   @relation(fields: [taskId], references: [id])
  
  @@index([userId, status])
}

model ActivityCapture {
  id              String   @id @default(uuid())
  userId          String
  activityType    String   // email, document, call, meeting, ai_tool
  matterId        String?
  
  // Activity Details
  description     String
  duration        Int?     // Seconds
  
  // Source
  sourceType      String   // gmail, outlook, calendar, phone, document
  sourceId        String?  // External ID
  sourceMetadata  Json?
  
  // Time Entry
  suggestedTimeEntry Boolean @default(false)
  timeEntryId     String?  // If converted to time entry
  dismissed       Boolean  @default(false)
  dismissedAt     DateTime?
  
  occurredAt      DateTime
  capturedAt      DateTime @default(now())
  
  user      User        @relation(fields: [userId], references: [id])
  matter    Matter?     @relation(fields: [matterId], references: [id])
  timeEntry TimeEntry?  @relation(fields: [timeEntryId], references: [id])
}

model TimeEntryPolicy {
  id              String   @id @default(uuid())
  organizationId  String
  
  // Rounding
  roundingIncrement Decimal @db.Decimal(3, 2) @default(0.1) // 0.1, 0.25, 0.5
  roundingMethod  String   @default("up") // up, down, nearest
  minimumIncrement Decimal @db.Decimal(3, 2) @default(0.1)
  
  // Requirements
  requireDescription Boolean @default(true)
  minDescriptionLength Int?
  requireMatter   Boolean  @default(true)
  requireActivityType Boolean @default(true)
  requireUtbmsCodes Boolean @default(false)
  
  // Approval
  requireApproval Boolean  @default(false)
  approvalThreshold Decimal? @db.Decimal(5, 2) // Hours above which approval required
  
  // Alerts
  maxDailyHours   Decimal? @db.Decimal(5, 2)
  maxEntryHours   Decimal? @db.Decimal(5, 2)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
}
```

#### API Endpoints

```
# Time Entries
POST   /api/time-entries                      - Create time entry
GET    /api/time-entries                      - List time entries
GET    /api/time-entries/:id                  - Get entry details
PATCH  /api/time-entries/:id                  - Update entry
DELETE /api/time-entries/:id                  - Delete entry
POST   /api/time-entries/:id/submit           - Submit for approval
POST   /api/time-entries/:id/approve          - Approve entry
POST   /api/time-entries/:id/reject           - Reject entry
POST   /api/time-entries/batch-approve        - Batch approve

# Timer
POST   /api/time-entries/timer/start          - Start timer
POST   /api/time-entries/timer/pause          - Pause timer
POST   /api/time-entries/timer/resume         - Resume timer
POST   /api/time-entries/timer/stop           - Stop and create entry
GET    /api/time-entries/timer/active         - Get active timer

# Activity Capture
GET    /api/time-entries/activities           - Get captured activities
POST   /api/time-entries/activities/:id/convert - Convert to time entry
POST   /api/time-entries/activities/:id/dismiss - Dismiss suggestion

# AI Features
GET    /api/time-entries/ai/suggestions       - Get AI suggestions
POST   /api/time-entries/ai/quality-check     - Check entry quality
GET    /api/time-entries/ai/missing           - Find missing time

# Reports
GET    /api/time-entries/reports/by-attorney  - Time by attorney
GET    /api/time-entries/reports/by-matter    - Time by matter
GET    /api/time-entries/reports/utilization  - Utilization report
```

#### Acceptance Criteria
- [ ] Timer syncs across devices in real-time
- [ ] AI time suggestions accuracy > 85%
- [ ] Bulk entry handles 50+ entries
- [ ] UTBMS code validation works correctly
- [ ] Approval workflow notifications send within 1 minute
- [ ] UI follows deep black/white color scheme

---

### Session 12.3.4: Communications Hub
**Timeline:** Weeks 10-12  
**Owner:** Backend Lead + Frontend Lead

#### Deliverables

**D-12.3.4.1: Email Integration**
- [ ] Two-way Gmail sync
- [ ] Two-way Outlook/Microsoft 365 sync
- [ ] Automatic email filing to matters
- [ ] Email templates (engagement letters, status updates)
- [ ] Mass email campaigns (newsletter to clients)
- [ ] Email tracking (opened, clicked)
- [ ] Email scheduling

**D-12.3.4.2: Phone Integration**
- [ ] VoIP integration (Twilio, RingCentral)
- [ ] Call logging (automatic to matter)
- [ ] Click-to-call from contact records
- [ ] Call recording (compliance with state laws)
- [ ] Voicemail transcription (AI)
- [ ] Call notes

**D-12.3.4.3: SMS/Text Messaging**
- [ ] Text clients (appointment reminders, updates)
- [ ] Two-way SMS conversations
- [ ] SMS templates
- [ ] Compliance (opt-in/opt-out, TCPA)
- [ ] SMS scheduling

**D-12.3.4.4: Client Portal Messaging**
- [ ] Secure messaging (attorney ↔ client)
- [ ] File sharing in messages
- [ ] Message read receipts
- [ ] Threaded conversations
- [ ] Message notifications

**D-12.3.4.5: AI Communication Features**
- [ ] **AI Email Assistant:**
  - Auto-drafts email responses
  - Suggests matter assignment
  - Flags urgent emails
  - Summarizes long email threads
- [ ] **Sentiment Analysis:** AI detects client emotions:
  - Angry client → escalate to partner
  - Confused client → suggest scheduling call
  - Satisfied client → prompt for review/referral
- [ ] **Smart Call Routing:** AI routes incoming calls:
  - Identifies caller
  - Routes to assigned attorney
  - Offers voicemail or callback
- [ ] **Communication Compliance Monitor:** AI flags potential issues:
  - Confidential info sent to wrong recipient
  - Non-encrypted email
  - Communication with represented party

#### Database Schema

```prisma
model Communication {
  id              String   @id @default(uuid())
  organizationId  String
  
  // Type
  communicationType String // email, call, sms, portal_message, fax
  direction       String   // inbound, outbound
  
  // Email Fields
  fromEmail       String?
  toEmails        String[]
  ccEmails        String[]
  bccEmails       String[]
  subject         String?
  body            String?  @db.Text
  bodyHtml        String?  @db.Text
  
  // Phone Fields
  fromPhone       String?
  toPhone         String?
  callDuration    Int?     // Seconds
  recordingUrl    String?
  transcript      String?  @db.Text
  voicemailUrl    String?
  
  // SMS Fields
  smsBody         String?
  
  // Links
  matterId        String?
  contactId       String?
  userId          String?  // User who sent/received
  
  // Thread
  threadId        String?  // For email/message threads
  parentId        String?  // Reply to
  
  // Attachments
  attachments     CommunicationAttachment[]
  
  // Status
  status          String?  // sent, delivered, read, failed, answered, missed, voicemail
  deliveredAt     DateTime?
  readAt          DateTime?
  failureReason   String?
  
  // AI Analysis
  aiSentiment     String?  // positive, neutral, negative, urgent
  aiSentimentScore Decimal? @db.Decimal(3, 2)
  aiSummary       String?
  aiActionItems   Json?
  aiMatterSuggestion String? // Suggested matter ID
  
  // External
  externalId      String?  // ID from email provider
  externalProvider String? // gmail, outlook, twilio
  
  // Timestamps
  occurredAt      DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
  contact      Contact?     @relation(fields: [contactId], references: [id])
  user         User?        @relation(fields: [userId], references: [id])
  parent       Communication? @relation("CommunicationThread", fields: [parentId], references: [id])
  replies      Communication[] @relation("CommunicationThread")
  
  @@index([organizationId, communicationType])
  @@index([matterId])
  @@index([contactId])
  @@index([threadId])
}

model CommunicationAttachment {
  id              String   @id @default(uuid())
  communicationId String
  fileName        String
  fileUrl         String
  fileSize        Int
  mimeType        String
  documentId      String?  // If saved to documents
  
  communication Communication @relation(fields: [communicationId], references: [id], onDelete: Cascade)
}

model EmailTemplate {
  id              String   @id @default(uuid())
  organizationId  String
  templateName    String
  category        String?  // engagement, status_update, reminder, marketing
  subject         String
  body            String   @db.Text
  bodyHtml        String?  @db.Text
  
  // Variables
  variables       String[] // Available merge fields
  
  // Settings
  isActive        Boolean  @default(true)
  isShared        Boolean  @default(true) // Shared with team
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
}

model EmailSync {
  id              String   @id @default(uuid())
  userId          String
  provider        String   // gmail, outlook
  accountEmail    String
  accessToken     String   // Encrypted
  refreshToken    String?  // Encrypted
  tokenExpiresAt  DateTime?
  
  // Sync Settings
  syncInbound     Boolean  @default(true)
  syncOutbound    Boolean  @default(true)
  syncFolders     String[] // Folders to sync
  autoFileToMatter Boolean @default(false)
  
  // Status
  lastSyncAt      DateTime?
  syncStatus      String   @default("active")
  syncError       String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, provider, accountEmail])
}

model PhoneNumber {
  id              String   @id @default(uuid())
  organizationId  String
  phoneNumber     String
  phoneType       String   // main, fax, sms, user
  userId          String?  // If assigned to user
  
  // Provider
  provider        String   // twilio, ringcentral
  providerId      String?
  
  // Settings
  forwardTo       String?  // Forward calls to
  voicemailEnabled Boolean @default(true)
  recordCalls     Boolean  @default(false)
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  user         User?        @relation(fields: [userId], references: [id])
}

model SMSOptOut {
  id              String   @id @default(uuid())
  organizationId  String
  phoneNumber     String
  optedOutAt      DateTime @default(now())
  reason          String?
  
  organization Organization @relation(fields: [organizationId], references: [id])
  
  @@unique([organizationId, phoneNumber])
}
```

#### API Endpoints

```
# Communications
GET    /api/communications                    - List communications
GET    /api/communications/:id                - Get communication details
POST   /api/communications/:id/file           - File to matter
DELETE /api/communications/:id                - Delete communication

# Email
POST   /api/communications/email/send         - Send email
POST   /api/communications/email/reply        - Reply to email
GET    /api/communications/email/thread/:id   - Get email thread
POST   /api/communications/email/sync         - Trigger email sync

# Phone
POST   /api/communications/call/initiate      - Initiate call
POST   /api/communications/call/log           - Log call
GET    /api/communications/call/:id/recording - Get recording
GET    /api/communications/call/:id/transcript - Get transcript

# SMS
POST   /api/communications/sms/send           - Send SMS
GET    /api/communications/sms/conversation   - Get SMS conversation
POST   /api/communications/sms/opt-out        - Record opt-out

# Portal Messages
POST   /api/communications/portal/send        - Send portal message
GET    /api/communications/portal/thread/:id  - Get message thread

# Templates
POST   /api/email-templates                   - Create template
GET    /api/email-templates                   - List templates
PATCH  /api/email-templates/:id               - Update template
DELETE /api/email-templates/:id               - Delete template

# AI Features
POST   /api/communications/:id/ai/summarize   - Summarize thread
POST   /api/communications/:id/ai/draft-reply - AI draft reply
GET    /api/communications/ai/urgent          - Get urgent communications
POST   /api/communications/:id/ai/analyze     - Analyze sentiment
```

#### Acceptance Criteria
- [ ] Email sync completes within 60 seconds
- [ ] SMS delivery within 5 seconds
- [ ] Call recording complies with two-party consent states
- [ ] AI sentiment analysis accuracy > 80%
- [ ] Email auto-filing accuracy > 90%
- [ ] UI follows deep black/white color scheme

---

## PHASE 12.3 SUMMARY

### Deliverables Checklist

| Session | Deliverable | Status |
|---------|-------------|--------|
| 12.3.1 | Multi-View Calendar | ⬜ Pending |
| 12.3.1 | Event Types | ⬜ Pending |
| 12.3.1 | Scheduling Features | ⬜ Pending |
| 12.3.1 | Calendar Integrations | ⬜ Pending |
| 12.3.1 | AI Calendar Features | ⬜ Pending |
| 12.3.2 | Task Management | ⬜ Pending |
| 12.3.2 | Task Views | ⬜ Pending |
| 12.3.2 | Workflow Automation | ⬜ Pending |
| 12.3.2 | AI Task Features | ⬜ Pending |
| 12.3.3 | Time Entry Methods | ⬜ Pending |
| 12.3.3 | Time Entry Details | ⬜ Pending |
| 12.3.3 | Time Approval Workflow | ⬜ Pending |
| 12.3.3 | AI Time Tracking | ⬜ Pending |
| 12.3.4 | Email Integration | ⬜ Pending |
| 12.3.4 | Phone Integration | ⬜ Pending |
| 12.3.4 | SMS/Text Messaging | ⬜ Pending |
| 12.3.4 | Client Portal Messaging | ⬜ Pending |
| 12.3.4 | AI Communication Features | ⬜ Pending |

### Success Metrics

| Metric | Target |
|--------|--------|
| Calendar sync reliability | > 99% |
| AI scheduling accuracy | > 85% |
| Task workflow execution | < 30 seconds |
| AI time suggestion accuracy | > 85% |
| Email auto-filing accuracy | > 90% |
| AI sentiment accuracy | > 80% |

### Team Requirements

| Role | Count | Responsibilities |
|------|-------|------------------|
| Backend Engineer | 2 | API development, integrations |
| Frontend Engineer | 2 | UI components, real-time features |
| AI Engineer | 1 | Time capture, sentiment analysis |
| QA Engineer | 1 | Testing, integration testing |

---

**Document Version:** 3.0  
**Last Updated:** December 12, 2025  
**Status:** Ready for Development  
**Next Phase:** Phase 12.4 - Intelligence & Global Platform

---
