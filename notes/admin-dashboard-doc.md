# Admin Dashboard Documentation
**Platform:** Frith AI - Legal AI Platform  
**Domain:** https://frithai.com/admin  
**Tech Stack:** Next.js, Tailwind CSS, Shadcn UI, Neon PostgreSQL, Vercel  
**Access:** Super Admin and Organization Admin roles only

---

## 1. Overview

The Admin Dashboard is a powerful management interface for Frith AI administrators to monitor platform health, manage users and organizations, oversee billing, handle support tickets, and configure system settings.

### Admin Types

**1. Super Admin (Platform Admin)**
- Frith AI internal staff
- Full access to all features
- Can manage all organizations
- Can access all data (with audit logging)

**2. Organization Admin**
- Law firm/company administrators
- Manage their organization only
- User management, billing, workspace configuration
- Limited to their org's data

---

## 2. Admin Dashboard Architecture

### 2.1 Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Header (Admin Context Indicator + User Menu)                │
├──────────┬───────────────────────────────────────────────────┤
│          │                                                    │
│  Left    │     Center Panel (Main Content)                   │
│  Sidebar │                                                    │
│  (240px) │                                                    │
│          │     [Analytics, Tables, Forms]                    │
│  [Nav]   │                                                    │
│          │                                                    │
└──────────┴───────────────────────────────────────────────────┘
```

### 2.2 Color Scheme
- **Warning Banner:** Red/orange top banner indicating admin mode
- **Accent Color:** Different from main app (e.g., amber/orange vs blue)
- **Dark Mode:** Option for admins (easier on eyes for long sessions)

---

## 3. Header (Admin Dashboard)

### 3.1 Header Components

**Left:**
- **Admin Badge:** "🛡️ ADMIN MODE" (red/amber background)
- **Context Switcher:** Dropdown to switch between organizations (Super Admin only)
  - "All Organizations"
  - "Organization: [Org Name]"

**Center:**
- **Global Search:** Search users, orgs, tickets, transactions

**Right:**
- **Notifications** (bell icon)
- **Quick Actions** (+ icon)
  - Create Organization
  - Add User
  - Send Announcement
- **User Menu** (avatar)
  - Back to User Dashboard
  - Admin Settings
  - Audit Logs
  - Sign Out

---

## 4. Left Sidebar (Navigation)

### 4.1 Navigation Structure

**Dashboard Section:**
1. **Overview** 📊 (default view)
2. **Analytics** 📈

**User Management:**
3. **Users** 👥
4. **Organizations** 🏢
5. **Workspaces** 💼
6. **Teams** 👨‍👩‍👧‍👦

**Platform Management:**
7. **AI Tools** 🤖
8. **Tool Runs** ⚙️
9. **API Usage** 🔌

**Financial:**
10. **Billing** 💳
11. **Subscriptions** 📋
12. **Transactions** 💰
13. **Invoices** 🧾

**Support:**
14. **Support Tickets** 🎫
15. **Live Chat** 💬 (if enabled)
16. **Feedback** 💡

**Content Management:**
17. **Blog Posts** ✍️
18. **Help Center Articles** 📚
19. **Announcements** 📢

**System:**
20. **Settings** ⚙️
21. **Integrations** 🔗
22. **Audit Logs** 📜
23. **System Status** 🟢

**Divider**

24. **Exit Admin Mode** → Returns to user dashboard

---

## 5. Overview Dashboard (Home)

### 5.1 Route
`/admin` or `/admin/overview`

### 5.2 Layout: Metric Cards + Charts + Recent Activity

---

### 5.3 Key Metrics (Top Row - 4 Cards)

**Card 1: Total Users**
- **Number:** 5,247
- **Change:** +12.5% from last month
- **Sparkline:** 7-day user growth trend
- **Link:** "View All Users →"

**Card 2: Active Subscriptions**
- **Number:** 1,834
- **Change:** +8.2% from last month
- **Breakdown:** Free (3,413), Starter (520), Pro (1,200), Advanced (114)

**Card 3: Monthly Revenue (MRR)**
- **Number:** $247,850
- **Change:** +15.3% from last month
- **Sparkline:** Revenue trend

**Card 4: Tool Runs Today**
- **Number:** 18,423
- **Change:** +5.1% from yesterday
- **Avg per user:** 3.5 runs

---

### 5.4 Charts Section (Middle)

**Chart 1: User Growth (Line Chart)**
- X-axis: Last 30 days
- Y-axis: New signups, Active users
- Toggle: Day / Week / Month / Year

**Chart 2: Revenue Breakdown (Stacked Bar Chart)**
- X-axis: Last 12 months
- Y-axis: Revenue by plan tier
- Hover: Show exact amounts

**Chart 3: Tool Usage (Horizontal Bar Chart)**
- Top 10 most-used tools this month
- Shows tool name + run count

---

### 5.5 Recent Activity Feed (Right Column)

**Activity Types:**
- New user signups
- Plan upgrades
- Support tickets created
- System alerts (errors, downtimes)
- Large transactions (> $1,000)

**Each item shows:**
- Icon (based on type)
- Description (e.g., "John Doe upgraded to Professional")
- Timestamp
- Link to detail view

---

### 5.6 Alerts & Warnings (Top of Dashboard)

**Alert Types:**
- 🔴 Critical: API downtime, payment processor issues
- 🟠 Warning: High error rate, nearing API limits
- 🟡 Info: Scheduled maintenance, new feature release

**Alert Card:**
- Priority badge
- Message
- Time detected
- Actions: "View Details" / "Dismiss"

---

## 6. Analytics

### 6.1 Route
`/admin/analytics`

### 6.2 Advanced Analytics Dashboard

**Date Range Selector (Top):**
- Presets: Today, Last 7 days, Last 30 days, Last 90 days, Custom
- Compare to previous period checkbox

---

### 6.3 Analytics Sections

**User Metrics:**
- Total Users
- New Users (this period)
- Active Users (DAU, WAU, MAU)
- Churn Rate
- Retention Cohorts (table view)
- User Lifetime Value (LTV)

**Engagement Metrics:**
- Avg. Sessions per User
- Avg. Session Duration
- Tool Runs per User per Day
- Most Popular Tools
- Feature Adoption Rates (% users using workspaces, templates, etc.)

**Conversion Metrics:**
- Signup → Email Verification rate
- Free → Paid conversion rate
- Trial → Paid conversion rate (if applicable)
- Upgrade rates (Starter → Pro → Advanced)
- Downgrade rates

**Revenue Metrics:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- ARPU (Average Revenue Per User)
- Churn MRR
- Net Revenue Retention
- Revenue by Plan Tier (pie chart)

**Technical Metrics:**
- API Uptime (99.x%)
- Avg. Tool Execution Time
- Error Rate (%)
- Claude API Cost per Tool Run
- Database Query Performance

**Support Metrics:**
- Open Tickets
- Avg. Response Time
- Avg. Resolution Time
- CSAT (Customer Satisfaction Score)

---

### 6.4 Export Options
- Export as CSV
- Export as PDF Report
- Schedule Email Reports (daily/weekly/monthly)

---

## 7. Users Management

### 7.1 Route
`/admin/users`

### 7.2 Users Table

**Columns:**
- Avatar
- Name (sortable)
- Email (sortable)
- Organization (link)
- Role (User, Admin, Super Admin)
- Subscription Tier (Free, Starter, Pro, Advanced)
- Status (Active, Suspended, Banned)
- Email Verified (✓/✗)
- Last Login (sortable)
- Signed Up (sortable)
- Actions (dropdown)

**Table Features:**
- **Search:** By name, email, organization
- **Filters:**
  - Subscription tier (multi-select)
  - Status (multi-select)
  - Email verified (yes/no)
  - Date range (signup, last login)
- **Sort:** By any column
- **Pagination:** 25/50/100 per page
- **Bulk Actions:**
  - Export selected users (CSV)
  - Send email to selected users
  - Suspend/unsuspend selected users

---

### 7.3 User Actions (Dropdown)

- **View Profile** → Opens user detail page
- **Impersonate User** → Log in as this user (audit logged)
- **Edit User** → Update name, email, role
- **Reset Password** → Send password reset email
- **Suspend Account** → Temporarily disable
- **Ban Account** → Permanently disable
- **Delete Account** → Permanent deletion (with confirmation)
- **View Audit Log** → See all user actions

---

### 7.4 User Detail Page

**Route:** `/admin/users/:id`

**Layout: Tabbed Interface**

**Tab 1: Profile**
- Basic Info: Name, Email, Phone (if provided)
- Organization: Link to org page
- Role: Dropdown to change role
- Status: Active / Suspended / Banned (toggle)
- Created: Date + time
- Last Login: Date + time
- Email Verified: Yes/No
- 2FA Enabled: Yes/No
- **Actions:**
  - Save Changes
  - Reset Password
  - Impersonate User
  - Suspend/Unsuspend
  - Delete User

**Tab 2: Subscription**
- Current Plan: Name, price, billing cycle
- Stripe Customer ID: Link to Stripe dashboard
- Subscription Status: Active, Canceled, Past Due
- Next Billing Date
- Payment Method: Last 4 digits of card
- **Usage Stats:**
  - Queries Used: 147 / 300
  - Storage Used: 2.3 GB / 10 GB
- **Actions:**
  - Change Plan
  - Cancel Subscription
  - Refund Last Payment
  - Apply Discount/Credit

**Tab 3: Activity**
- Tool Runs: List of all tool executions
  - Tool name, timestamp, status, tokens used
  - Filter by date, tool, status
- Logins: List of all login events
  - Timestamp, IP address, location, device
- Projects Created: Count + list

**Tab 4: Billing History**
- List of all transactions
- Invoice downloads
- Refund history

**Tab 5: Support**
- Open Tickets: Count + list
- Resolved Tickets
- Feedback Submitted
- **Actions:**
  - Create Ticket on Behalf of User
  - Send Email

**Tab 6: Audit Log**
- All actions by this user (timestamped)
- Filter by event type

---

## 8. Organizations Management

### 8.1 Route
`/admin/organizations`

### 8.2 Organizations Table

**Columns:**
- Logo
- Name (sortable)
- Type (Law Firm, Corporate, Solo, etc.)
- Plan Tier (Starter, Pro, Advanced, Enterprise)
- Seats: Used / Total
- MRR (Monthly Revenue from this org)
- Status (Active, Trial, Canceled)
- Owner (admin user)
- Created Date (sortable)
- Actions

**Filters:**
- Plan tier
- Status
- Date range (created)
- Revenue range (MRR)

---

### 8.3 Organization Detail Page

**Route:** `/admin/organizations/:id`

**Tab 1: Overview**
- Name, Logo
- Type (dropdown)
- Plan Tier
- Billing Email
- Address
- Website
- Created Date
- Owner (link to user)
- **Stats:**
  - Total Users: 47
  - Active Users (last 30 days): 39
  - Total Tool Runs (all time): 12,450
  - MRR: $9,450

**Tab 2: Users**
- List of all users in this org
- Table: Name, Email, Role, Last Login
- **Actions:**
  - Add User to Org
  - Remove User from Org

**Tab 3: Workspaces**
- List of workspaces in this org
- Workspace name, owner, members count

**Tab 4: Subscription**
- Plan details
- Seats: 47 / 50 (can adjust)
- Billing cycle: Monthly / Annual
- Next billing date
- Payment method
- **Actions:**
  - Change Plan
  - Add/Remove Seats
  - Apply Discount
  - Cancel Subscription

**Tab 5: Billing History**
- All invoices and payments
- Downloadable invoices

**Tab 6: Settings**
- Custom branding (logo, colors) - Enterprise only
- SSO configuration (SAML, OAuth)
- API access settings
- Security settings (enforce 2FA, IP whitelist)

---

## 9. Workspaces Management

### 9.1 Route
`/admin/workspaces`

### 9.2 Workspaces Table

**Columns:**
- Name
- Organization (link)
- Type (Personal, Team)
- Owner
- Members Count
- Projects Count
- Created Date
- Actions

**Actions:**
- View Details
- Edit
- Delete

---

## 10. AI Tools Management

### 10.1 Route
`/admin/tools`

### 10.2 Tools Table

**Columns:**
- Tool Name (sortable)
- Category
- Pricing Tier (Free, Pro, Advanced)
- AI Model (Haiku, Sonnet, Opus)
- Status (Active, Draft, Disabled)
- Usage Count (total runs)
- Avg. Execution Time
- Avg. Cost per Run
- Created Date
- Actions

**Filters:**
- Category
- Pricing tier
- Status
- AI model

---

### 10.3 Tool Actions

- **View Details** → Tool detail page
- **Edit Tool** → Update config
- **Duplicate Tool** → Create variant
- **Disable Tool** → Hide from users (for maintenance)
- **View Usage Stats** → Analytics for this tool
- **Delete Tool** (with confirmation)

---

### 10.4 Tool Detail Page

**Route:** `/admin/tools/:id`

**Tab 1: Configuration**
- Tool Name
- Slug (URL-friendly)
- Description (rich text)
- Category (dropdown)
- Pricing Tier (dropdown)
- AI Model (dropdown: Haiku, Sonnet, Opus)
- Input Type (text, document, audio)
- Output Type (text, DOCX, PDF)
- Prompt Template (code editor)
- Max Tokens
- Temperature (0-1)
- Status (Active, Draft, Disabled)
- Popular (checkbox - show on homepage)
- **Save Changes**

**Tab 2: Usage Statistics**
- Total Runs: 15,247
- Unique Users: 2,341
- Avg. Runs per User: 6.5
- Success Rate: 98.2%
- Avg. Execution Time: 18.5s
- Avg. Tokens Used: 1,250
- Chart: Usage over time (line chart)

**Tab 3: Recent Runs**
- Table of last 100 runs
- User, input snippet, status, timestamp
- Click to view full run details

**Tab 4: Feedback**
- User ratings (👍👎)
- Comments/issues reported
- Sentiment analysis

---

### 10.5 Add New Tool

**Button:** "+ Create Tool" (top-right)

**Form (same as Edit Tool):**
- Fill in all configuration fields
- Test tool before publishing
- Save as Draft or Publish

---

## 11. Tool Runs

### 11.1 Route
`/admin/tool-runs`

### 11.2 Tool Runs Table

**Columns:**
- Run ID
- User (link)
- Tool (link)
- Status (Success, Failed, In Progress)
- Execution Time (ms)
- Tokens Used
- Cost ($)
- Timestamp (sortable)
- Actions

**Filters:**
- Status
- Tool (multi-select)
- User (search)
- Date range
- Cost range

**Bulk Actions:**
- Export as CSV
- Refund selected runs (if billed)

---

### 11.3 Tool Run Detail

**Route:** `/admin/tool-runs/:id`

**Display:**
- Run ID
- User (link to profile)
- Tool (link to tool page)
- Status
- Timestamp
- Execution Time
- AI Model Used
- Tokens: Input (X), Output (Y), Total (Z)
- Cost: $X.XX
- **Input:**
  - Full text input
  - Uploaded files (if any)
- **Output:**
  - Full text output
  - Generated files (if any)
- **Logs:**
  - API request/response (raw JSON)
  - Error messages (if failed)
- **Actions:**
  - Rerun (for debugging)
  - Mark as Fraudulent (if abuse detected)
  - Refund User

---

## 12. API Usage

### 12.1 Route
`/admin/api-usage`

### 12.2 API Usage Dashboard

**Overview Cards:**
- **Total Calls Today:** 45,230
- **Success Rate:** 99.1%
- **Avg. Response Time:** 1,247ms
- **Total Cost (Claude API):** $1,247.50

**Charts:**
- **Requests Over Time:** Line chart (last 24 hours)
- **Requests by Endpoint:** Pie chart
- **Response Times:** Histogram
- **Error Rates:** Line chart

**API Endpoints Table:**
- Endpoint
- Method (GET, POST, etc.)
- Calls (count)
- Avg. Response Time
- Error Rate (%)
- Last Called

**Error Logs:**
- Timestamp
- Endpoint
- User (if authenticated)
- Error Message
- Stack Trace (collapsible)
- Status Code

---

## 13. Billing & Subscriptions

### 13.1 Route
`/admin/billing`

### 13.2 Billing Dashboard

**Overview Cards:**
- **MRR (Monthly Recurring Revenue):** $247,850
- **New MRR (This Month):** +$18,450
- **Churned MRR:** -$3,200
- **Net MRR Growth:** +$15,250

**Subscriptions Breakdown:**
- Free: 3,413 (0 MRR)
- Starter: 520 ($41,080 MRR)
- Professional: 1,200 ($238,800 MRR)
- Advanced: 114 ($56,886 MRR)

**Charts:**
- Revenue by Plan (Pie Chart)
- MRR Growth (Line Chart, 12 months)
- Churn Rate (Line Chart)

---

## 14. Transactions

### 14.1 Route
`/admin/transactions`

### 14.2 Transactions Table

**Columns:**
- Transaction ID
- User/Organization (link)
- Amount
- Status (Success, Pending, Failed, Refunded)
- Payment Method (Card ending in XXXX)
- Type (Subscription, Upgrade, Refund)
- Stripe Charge ID (link to Stripe)
- Date (sortable)
- Actions

**Filters:**
- Status
- Type
- Amount range
- Date range
- Payment method

**Actions:**
- View Details
- Issue Refund
- Download Invoice
- Resend Invoice Email

---

## 15. Invoices

### 15.1 Route
`/admin/invoices`

### 15.2 Invoices Table

**Columns:**
- Invoice Number
- User/Organization (link)
- Amount
- Status (Paid, Pending, Overdue, Void)
- Issue Date
- Due Date
- Actions

**Actions:**
- View/Download PDF
- Send Reminder Email
- Mark as Paid (manual)
- Void Invoice

---

## 16. Support Tickets

### 16.1 Route
`/admin/support/tickets`

### 16.2 Tickets Table

**Columns:**
- Ticket ID
- Subject (truncated)
- User (link)
- Status (Open, In Progress, Waiting on User, Resolved, Closed)
- Priority (Low, Medium, High, Urgent)
- Assigned To (admin user)
- Last Updated
- Created Date
- Actions

**Filters:**
- Status (multi-select)
- Priority
- Assigned To (dropdown: All, Unassigned, Me, Other Admins)
- Date range

**Actions:**
- View Ticket
- Assign to Me
- Close Ticket

---

### 16.3 Ticket Detail Page

**Route:** `/admin/support/tickets/:id`

**Left Panel (Ticket Thread):**
- **Subject:** Ticket subject
- **User Info:** Name, email, plan, link to profile
- **Conversation Thread:**
  - Messages from user (left-aligned)
  - Messages from admin (right-aligned, with admin name)
  - Timestamps
  - Attachments (if any)
- **Reply Box (bottom):**
  - Rich text editor
  - Attach files
  - Internal note toggle (visible only to admins)
  - Actions: Send, Save as Draft

**Right Panel (Ticket Metadata):**
- **Status:** Dropdown (Open, In Progress, Waiting on User, Resolved, Closed)
- **Priority:** Dropdown (Low, Medium, High, Urgent)
- **Assigned To:** Dropdown (admin users)
- **Tags:** Multi-select (Bug, Feature Request, Billing, Account Issue, etc.)
- **Created:** Date + time
- **Last Updated:** Date + time
- **SLA Status:** 
  - First Response: ✓ Met (2 hours)
  - Resolution: ⏳ 18 hours remaining
- **Actions:**
  - Close Ticket
  - Delete Ticket
  - Merge with Another Ticket
  - Escalate to Engineering

**Activity Log (collapsible):**
- All status changes, assignments, tags added
- Timestamp + admin who made change

---

## 17. Live Chat (Future Feature)

### 17.1 Route
`/admin/live-chat`

### 17.2 Live Chat Interface

**Layout:**
- **Left:** List of active chats (sorted by wait time)
- **Center:** Chat conversation
- **Right:** User info + context

**Features:**
- Real-time messaging
- Typing indicators
- Canned responses (saved templates)
- Transfer chat to another admin
- End chat (auto-creates ticket for follow-up)

---

## 18. Feedback

### 18.1 Route
`/admin/feedback`

### 18.2 Feedback Table

**Columns:**
- Feedback ID
- User (link)
- Type (Bug, Feature Request, General)
- Message (truncated)
- Rating (1-5 stars, if provided)
- Status (New, Reviewing, Planned, Completed, Won't Fix)
- Votes (upvotes from other users, if public feedback board)
- Created Date
- Actions

**Filters:**
- Type
- Status
- Rating
- Date range

**Actions:**
- View Details
- Change Status
- Reply to User
- Add to Roadmap

---

## 19. Blog Posts (Content Management)

### 19.1 Route
`/admin/blog`

### 19.2 Blog Posts Table

**Columns:**
- Title
- Author (admin user)
- Status (Draft, Published, Scheduled)
- Category (Legal Tech, AI, Practice Tips, Product Updates)
- Views
- Published Date
- Actions

**Actions:**
- Edit Post
- View on Site (preview)
- Unpublish
- Delete

---

### 19.3 Create/Edit Blog Post

**Route:** `/admin/blog/new` or `/admin/blog/:id/edit`

**Form:**
- **Title** (required)
- **Slug** (auto-generated, editable)
- **Featured Image** (upload)
- **Excerpt** (short summary for SEO)
- **Content** (rich text editor with markdown support)
- **Author** (dropdown, defaults to logged-in admin)
- **Category** (dropdown)
- **Tags** (multi-select)
- **SEO Settings (collapsible):**
  - Meta Title
  - Meta Description
  - Focus Keyword
- **Status:**
  - Save as Draft
  - Publish Now
  - Schedule for Later (date picker)

---

## 20. Help Center Articles

### 20.1 Route
`/admin/help-center`

### 20.2 Help Articles Table

**Columns:**
- Title
- Category (Getting Started, Features, Billing, etc.)
- Status (Draft, Published)
- Views
- Helpful Votes (Yes/No ratio)
- Last Updated
- Actions

**Actions:**
- Edit Article
- View on Help Center
- Unpublish
- Delete

---

## 21. Announcements

### 21.1 Route
`/admin/announcements`

### 21.2 Purpose
- Send platform-wide or targeted announcements
- Shown as banners in user dashboard or via email

### 21.3 Announcements Table

**Columns:**
- Title
- Type (Info, Warning, Alert)
- Target Audience (All Users, Paid Users, Free Users, Specific Orgs)
- Status (Draft, Active, Scheduled, Ended)
- Start Date
- End Date
- Actions

**Actions:**
- Edit
- Activate/Deactivate
- Delete

---

### 21.4 Create Announcement

**Form:**
- **Title** (required)
- **Message** (rich text)
- **Type:** Dropdown (Info, Warning, Alert) → affects color
- **Target Audience:**
  - All Users
  - Free Users
  - Paid Users (specific tiers)
  - Specific Organizations (multi-select)
- **Display Method:**
  - In-app banner (dashboard)
  - Email
  - Both
- **Schedule:**
  - Start Date/Time
  - End Date/Time (optional, or "Until dismissed")
- **Actions:**
  - Save as Draft
  - Publish Now
  - Schedule

---

## 22. Settings

### 22.1 Route
`/admin/settings`

### 22.2 Settings Tabs

**1. General**
- Platform Name: "Frith AI"
- Support Email: support@frithai.com
- Contact Email: hello@frithai.com
- Maintenance Mode (toggle - disables user access)
- Allow New Signups (toggle)

**2. Email**
- Email Provider: Resend
- API Key (masked)
- From Name: "Frith AI"
- From Email: noreply@frithai.com
- Test Email (send test to admin)

**3. Payment**
- Stripe API Keys (Live, Test)
- PayPal API Keys
- Default Currency: USD
- Tax Settings (enable/disable, rates by region)

**4. AI Configuration**
- Claude API Key (masked)
- Default Model: Sonnet 4.5
- Token Limits by Plan:
  - Free: 2,000 per query
  - Starter: 10,000
  - Professional: 50,000
  - Advanced: 200,000
- Rate Limiting: X queries per hour per user

**5. Security**
- Session Timeout: 30 minutes (configurable)
- Enforce 2FA for Admins (toggle)
- IP Whitelist for Admin Access (textarea)
- Password Policy (min length, complexity)

**6. Notifications**
- Admin Notification Preferences:
  - New user signup (toggle)
  - New subscription (toggle)
  - Support ticket created (toggle)
  - System errors (toggle)
  - High-value transaction (> $X) (toggle)

---

## 23. Integrations

### 23.1 Route
`/admin/integrations`

### 23.2 Integration Management

**Connected Services:**
- Stripe (billing)
- Resend (email)
- Claude API (AI)
- Neon (database)
- Vercel (hosting)
- Google Analytics
- Sentry (error tracking)

**Each Integration Card:**
- Service name + logo
- Status (Connected / Not Connected)
- Configuration button
- Test Connection button
- Disconnect button

---

## 24. Audit Logs

### 24.1 Route
`/admin/audit-logs`

### 24.2 Audit Logs Table

**Purpose:** Track all admin actions for security and compliance

**Columns:**
- Timestamp (sortable)
- Admin User (who performed action)
- Event Type (User Edited, Tool Disabled, Subscription Changed, etc.)
- Target (user, org, tool, etc. + link to detail)
- IP Address
- User Agent
- Details (JSON, collapsible)

**Filters:**
- Date range
- Admin user (multi-select)
- Event type (multi-select)
- Target type (User, Org, Tool, etc.)

**Export:**
- Export as CSV (for compliance audits)

---

## 25. System Status

### 25.1 Route
`/admin/system-status`

### 25.2 System Health Dashboard

**Service Status (Green/Yellow/Red indicators):**
- **Web Application:** 🟢 Operational
- **API:** 🟢 Operational
- **Database (Neon):** 🟢 Operational
- **Claude AI API:** 🟢 Operational
- **Email Service (Resend):** 🟢 Operational
- **Payment Processing (Stripe):** 🟡 Degraded Performance
- **File Storage:** 🟢 Operational

**Uptime Stats:**
- Last 24 hours: 99.95%
- Last 7 days: 99.87%
- Last 30 days: 99.92%

**Recent Incidents:**
- List of past incidents with resolution status

**Scheduled Maintenance:**
- Upcoming maintenance windows

**Real-time Metrics:**
- Current Active Users: 1,247
- Requests per Minute: 3,450
- Avg. Response Time: 185ms
- Error Rate: 0.05%

**Actions:**
- Report Incident
- Schedule Maintenance
- View Detailed Logs

---

## 26. Admin User Management

### 26.1 Route
`/admin/admins`

### 26.2 Admin Users Table

**Columns:**
- Name
- Email
- Role (Super Admin, Support Admin, Content Admin)
- Last Login
- Status (Active, Inactive)
- Actions

**Actions:**
- Edit Admin
- Change Role
- Deactivate
- View Audit Log

---

### 26.3 Admin Roles & Permissions

**Super Admin:**
- Full access to everything

**Support Admin:**
- Users, Organizations, Tickets, Live Chat
- Read-only access to Billing

**Content Admin:**
- Blog Posts, Help Center, Announcements
- No access to Users, Billing, or System Settings

**Finance Admin:**
- Billing, Subscriptions, Transactions, Invoices
- Read-only access to Users

---

## 27. Quick Actions & Bulk Operations

### 27.1 Quick Actions (Throughout Admin)

**Floating Action Button (FAB):**
- Create User
- Create Organization
- Send Announcement
- Create Support Ticket (on behalf of user)
- Add Blog Post

### 27.2 Bulk Operations

**On Users Table:**
- Select multiple users → Actions dropdown:
  - Export as CSV
  - Send Email
  - Change Plan
  - Suspend/Activate
  - Apply Discount

**On Tickets Table:**
- Select multiple tickets → Actions:
  - Assign to Admin
  - Close All
  - Change Priority

---

## 28. Impersonate User Feature

### 28.1 Purpose
- Debug user issues by logging in as them
- View dashboard exactly as they see it

### 28.2 Flow
1. Admin clicks "Impersonate User" on user profile
2. Confirmation modal: "You are about to log in as [User Name]. This action is logged."
3. Admin is logged into user dashboard
4. **Warning Banner (top of screen):** 
   - "You are impersonating [User Name]" (red background)
   - Button: "Exit Impersonation"
5. All actions logged in audit trail
6. Click "Exit Impersonation" → return to admin dashboard

### 28.3 Security
- Only Super Admins and Support Admins can impersonate
- All actions during impersonation logged with admin user ID
- User receives email: "An admin accessed your account for support purposes on [Date]"

---

## 29. Reports & Exports

### 29.1 Route
`/admin/reports`

### 29.2 Pre-built Reports

**1. User Growth Report**
- New signups by day/week/month
- Activation rate (verified email)
- Chart + CSV export

**2. Revenue Report**
- MRR, ARR, Net Revenue
- By plan tier, by month
- Chart + CSV export

**3. Churn Report**
- Churn rate by plan
- Reasons for cancellation (if collected)
- Chart + CSV export

**4. Tool Usage Report**
- Most/least used tools
- Usage by plan tier
- Avg. execution time, success rate
- CSV export

**5. Support Report**
- Tickets created, resolved
- Avg. response time, resolution time
- CSAT scores
- CSV export

---

### 29.3 Custom Reports (Future)

**Report Builder:**
- Select metrics (users, revenue, tools, etc.)
- Apply filters (date range, plan, org)
- Choose visualization (table, line chart, bar chart, pie chart)
- Save report for future use
- Schedule email delivery (daily/weekly/monthly)

---

## 30. Mobile Responsiveness (Admin Dashboard)

### 30.1 Design Considerations

**Admins primarily use desktop**, but basic mobile support needed for:
- Checking system status
- Viewing/responding to support tickets
- Approving urgent actions

**Mobile Layout:**
- Hamburger menu (left sidebar collapses)
- Tables switch to card view (stacked)
- Charts resize responsively
- Touch-friendly buttons (min 44px)

---

## 31. Security Best Practices

### 31.1 Admin Access Security

**Authentication:**
- Enforce strong passwords (min 16 chars for admins)
- Require 2FA for all admin accounts
- IP whitelist for admin access (optional, but recommended)
- Auto-logout after 30 minutes of inactivity

**Authorization:**
- Role-based access control (RBAC)
- Principle of least privilege
- Regular permission audits

**Audit Logging:**
- Log every admin action (who, what, when, where)
- Immutable logs (cannot be deleted or edited)
- Regular log reviews
- Export logs for compliance

**Data Protection:**
- Mask sensitive data (passwords, API keys, credit cards)
- Encrypt sensitive fields in database
- Limit PII exposure in admin UI

---

## 32. Performance Optimization

### 32.1 Performance Targets

**Admin Dashboard Load Time:** < 2s
**Table Rendering:** < 500ms (for 1000 rows)
**Chart Rendering:** < 1s

### 32.2 Optimization Techniques

- Server-side pagination (don't load all users at once)
- Lazy loading for charts
- Database indexing on frequently queried columns
- Caching (Redis) for dashboard metrics
- Background jobs for heavy operations (exports, reports)

---

## 33. Database Schema (Admin-Specific Tables)

### 33.1 Admin Users Table
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  role VARCHAR(50), -- super_admin, support_admin, content_admin
  permissions JSONB, -- granular permissions
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 33.2 Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  admin_user_id UUID REFERENCES admin_users(id),
  event_type VARCHAR(100), -- user_edited, tool_disabled, etc.
  target_type VARCHAR(50), -- user, org, tool
  target_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 33.3 Announcements Table
```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50), -- info, warning, alert
  target_audience JSONB, -- all, paid, specific orgs
  display_method VARCHAR(50), -- banner, email, both
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(50), -- draft, active, ended
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 34. API Endpoints (Admin)

```javascript
// Users
GET    /api/admin/users
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id
DELETE /api/admin/users/:id
POST   /api/admin/users/:id/impersonate

// Organizations
GET    /api/admin/organizations
GET    /api/admin/organizations/:id
PATCH  /api/admin/organizations/:id
DELETE /api/admin/organizations/:id

// Tools
GET    /api/admin/tools
POST   /api/admin/tools
GET    /api/admin/tools/:id
PATCH  /api/admin/tools/:id
DELETE /api/admin/tools/:id

// Support
GET    /api/admin/tickets
GET    /api/admin/tickets/:id
PATCH  /api/admin/tickets/:id
POST   /api/admin/tickets/:id/reply

// Billing
GET    /api/admin/transactions
GET    /api/admin/invoices
POST   /api/admin/transactions/:id/refund

// Analytics
GET    /api/admin/analytics/overview
GET    /api/admin/analytics/users
GET    /api/admin/analytics/revenue
GET    /api/admin/analytics/tools

// Audit
GET    /api/admin/audit-logs

// System
GET    /api/admin/system-status
POST   /api/admin/announcements
```

---

## 35. Testing Checklist

### Admin Dashboard Testing

- [ ] Only admins can access `/admin` routes
- [ ] Non-admins redirected to login
- [ ] Impersonate user works and logs action
- [ ] All tables paginate correctly
- [ ] All filters work as expected
- [ ] Bulk actions work on selected items
- [ ] Audit logs capture all admin actions
- [ ] Exports (CSV, PDF) generate correctly
- [ ] Charts render with correct data
- [ ] System status shows accurate health
- [ ] Support ticket replies send emails
- [ ] Role-based permissions enforced
- [ ] 2FA required for admin access
- [ ] Session timeout works (30 min)

---

## 36. Future Enhancements

### Phase 2 (6-12 months)
- Advanced analytics (predictive churn, LTV forecasts)
- Custom dashboards (drag-and-drop widgets)
- Automated workflows (e.g., auto-assign tickets based on keywords)
- Slack integration for admin alerts
- Mobile app for admins
- AI-powered insights (anomaly detection, trend analysis)

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Status:** Ready for Design & Development  
**Access Control:** Super Admin and Org Admin roles only
