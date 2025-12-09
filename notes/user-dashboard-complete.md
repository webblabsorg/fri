# User Dashboard - Complete Documentation
**Platform:** Frith AI - Legal AI Platform  
**Domain:** https://app.frithai.com  
**Tech Stack:** Next.js App Router, Tailwind CSS, Shadcn UI, Neon PostgreSQL, Claude AI API

---

## 1. Executive Summary

The User Dashboard is the core workspace where legal professionals interact with 240+ AI tools. It must balance power (comprehensive tool access) with simplicity (easy discovery and use).

### Primary Goals
1. Make 240 tools feel organized and discoverable
2. Enable fast execution of legal workflows
3. Promote collaboration and team features
4. Drive upgrade conversions (free → paid)
5. Maintain enterprise security and compliance

---

## 2. Dashboard Architecture

### 2.1 Layout Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  Header (fixed, 64px height)                                │
├──────────┬──────────────────────────────────────┬──────────┤
│          │                                      │          │
│  Left    │     Center Panel (Main)              │  Right   │
│  Sidebar │                                      │  Sidebar │
│  (260px) │                                      │ (320px)  │
│          │                                      │(collaps.)│
│  [Nav]   │     [Tool Grid / Content]            │ [Details]│
│          │                                      │          │
│          │                                      │          │
│          │                                      │          │
└──────────┴──────────────────────────────────────┴──────────┘
```

### 2.2 Responsive Breakpoints
- **Desktop (1280px+):** 3-panel layout
- **Tablet (768-1279px):** 2-panel (hide right sidebar, collapsible left)
- **Mobile (< 768px):** Single panel, hamburger menu

---

## 3. Header (Top Navigation)

### 3.1 Header Components

**Left Section:**
- Hamburger icon (toggle left sidebar visibility)
- Logo: "Frith AI" (click → home/all tools)

**Center Section:**
- **Global Search Bar** (70% width of center)
  - Placeholder: "Search 240+ AI tools..."
  - Icon: Magnifying glass
  - Shortcut: Cmd/Ctrl + K to focus
  - **Smart Search Features:**
    - Real-time suggestions as you type
    - Categories: Tools, Projects, History, Templates
    - Recent searches shown first
    - Popular tools highlighted
  - **Search Results Dropdown:**
    - Grouped by type (Tools, Projects, Recent Runs)
    - Click to navigate or run tool directly
    - Keyboard navigation (↑↓ arrows, Enter)

**Right Section:**
- **Quick New Button** (+ icon)
  - Dropdown menu:
    - New Project/Case
    - Run Tool (popular tools list)
    - Upload Document
    - Create Template
- **Notifications Bell** (with badge count)
  - Dropdown shows recent notifications
  - Types: Tool run complete, team mention, billing alert, system update
- **User Avatar** (dropdown menu)
  - User name + role badge
  - Divider
  - My Profile
  - Settings
  - Billing & Subscription
  - Help Center
  - Divider
  - Sign Out

### 3.2 Header Styling
- Background: White with subtle border-bottom
- Height: 64px (fixed)
- Shadow: Small shadow on scroll
- Sticky: Always visible at top

---

## 4. Left Sidebar (Navigation)

### 4.1 Sidebar Structure

**Width:** 260px (expanded), 64px (collapsed), hidden (mobile)

**Sections (top to bottom):**

1. **Logo Area** (if hamburger not in header)
2. **Primary Navigation Items**
3. **Workspace Switcher**
4. **Bottom Actions**

---

### 4.2 Primary Navigation Items

**1. All AI Tools** 🏠
- Icon: Grid icon
- Route: `/dashboard` (default view)
- Shows: Complete tool grid with filters

**2. Categories** 📁
- Icon: Folder icon
- Expandable accordion (click to expand/collapse)
- Shows: List of 26 categories
- Each category item:
  - Name
  - Tool count badge (e.g., "12")
  - Hover: Expands to show top 5 tools
  - Click category name: Navigate to category page
  - Click tool name: Navigate to tool detail

**Category List (collapsed by default):**
```
▸ Legal Research & Case Law (10)
▸ Contract Drafting (12)
▸ Contract Review (8)
▸ Litigation Support (10)
▸ Due Diligence (7)
▸ IP & Patents (5)
▸ Medical-Legal (4)
▸ Client Management (5)
▸ Compliance (6)
▸ Billing & Time (3)
▸ [... 16 more categories]
```

**3. Favorites / Starred** ⭐
- Icon: Star icon
- Shows: User's pinned/favorite tools
- Empty state: "Pin your frequently used tools here"

**4. Workspaces** 💼
- Icon: Briefcase
- Shows: Personal + team workspaces
- Dropdown to switch between workspaces
- Current workspace highlighted

**5. Projects / Cases** 📂
- Icon: Folder tree
- Shows: User's case folders
- Expandable tree structure
- Click: Navigate to project detail view

**6. History** 🕐
- Icon: Clock icon
- Shows: Recent tool runs (last 50)
- Filter by date, tool, status

**7. Templates** 📄
- Icon: Document template
- Shows: Saved prompt templates
- User-created + firm templates

**8. Integrations** 🔌
- Icon: Puzzle piece
- Shows: Connected apps (Word, Clio, iManage, etc.)
- Badge: "3 connected"

---

**Divider Line**

---

**9. Billing & Subscriptions** 💳
- Icon: Credit card
- Shows: Current plan, usage, upgrade options

**10. Team & Users** 👥 (if admin/team plan)
- Icon: People
- Shows: Team members, invitations, roles

**11. Support** 💬
- Icon: Question mark circle
- Links to: Help Center, Submit Ticket, Live Chat

---

**Bottom Section (persistent):**

**User Profile Quick Access:**
- Avatar thumbnail
- Name (truncated if needed)
- Plan badge: "Free" / "Pro" / "Advanced"
- Click: Expand menu (Profile, Settings, Sign Out)

---

### 4.3 Sidebar Collapsed State

When collapsed (64px width):
- Show only icons
- Tooltip on hover shows full name
- Avatar shown at bottom

---

## 5. Center Panel (Main Content Area)

### 5.1 Default View: All Tools Grid

**Top Toolbar:**
- **Breadcrumb:** Home > All Tools (or current category)
- **View Switcher:** Grid / List view toggle
- **Filters Button:** Opens filter drawer
- **Sort Dropdown:** Popular / Newest / A-Z / Most Used

**Filter Options (when opened):**
- Category (multi-select)
- Industry (Litigation, Corporate, IP, etc.)
- Input Type (Text, Document, Audio)
- Output Type (Text, DOCX, PDF)
- Pricing Tier (Free / Pro / Advanced)
- Compliance Rating (GDPR, SOC2)

---

### 5.2 Tool Grid Layout

**Grid Configuration:**
- **Columns:** 4 (desktop 1280+), 3 (tablet), 2 (mobile landscape), 1 (mobile portrait)
- **Rows per page:** 12 (default), options: 6, 12, 24, 48
- **Pagination:** Bottom of page (page numbers + next/prev)
- **OR Infinite Scroll** (user preference)

---

### 5.3 Tool Card Design

**Card Dimensions:** 280px width × 220px height

**Card Structure:**

**Top Section (60%):**
- **Tool Icon/Image** (top-left, 48×48px)
- **Tool Name** (2 lines max, 18px bold)
- **Category Badge** (pill-shaped, colored by category)
- **New Badge** (if released < 30 days ago)
- **Popular Badge** (if in top 20 most-used)

**Middle Section (30%):**
- **Description** (3 lines max, 14px gray text)
- **Usage Stats:** "Used 47 times" or "Last used 2 days ago"

**Bottom Section (10%, CTA):**
- **Primary Button:** "Run" (full width, primary color)
- **Secondary Actions (on hover):**
  - Star icon (add to favorites)
  - Three-dot menu:
    - View Details
    - Add to Workspace
    - Schedule Run
    - Share with Team
    - View Documentation

**Card States:**
- **Hover:** Lift effect (shadow), show secondary actions
- **Locked (if plan doesn't allow):**
  - Overlay: "Requires Professional Plan"
  - Button: "Upgrade to Unlock"

---

### 5.4 Tool Card Variants

**For Free Users:**
- Show all 240 tools
- Gray out/lock tools not in their plan
- Tooltip: "Upgrade to Professional to use this tool"

**For Paid Users:**
- All tools accessible
- Highlight premium features

---

### 5.5 Suggested Tools Section

**Position:** Top of tool grid (above "All Tools")

**Layout:** Horizontal carousel (scroll)

**Title:** "Recommended for you" or "Popular in your practice area"

**Logic:**
- Show 8-12 tools based on:
  - User's role (from signup)
  - Recently used categories
  - Popular tools in firm (if team account)
  - Trending tools across platform

---

### 5.6 Empty States

**No Tools Found (after filter):**
- Illustration: Empty folder
- Message: "No tools match your filters"
- CTA: "Clear filters" or "Browse all tools"

**First-Time User:**
- Message: "Welcome! You have access to 240+ AI tools. Let's start with the most popular ones."
- CTA: "Take a quick tour" (onboarding)

---

## 6. Tool Detail View

### 6.1 Navigation
- Click tool card → Opens tool detail (modal OR dedicated page)
- Route: `/dashboard/tools/[tool-slug]`

### 6.2 Tool Detail Layout

**Left Panel (60%):**

**Header:**
- Tool name (H1)
- Category badge
- Pricing tier badge ("Free" / "Pro" / "Advanced")
- Favorite button (star icon)

**Description:**
- Full description (2-3 paragraphs)
- **Use cases:** Bullet list of 3-5 scenarios
- **Key features:** Bullet list of capabilities

**How to Use:**
- Step-by-step instructions
- Example inputs/outputs
- Best practices

**Sample Prompts (expandable):**
- Pre-written prompts for common tasks
- Click to load into input area

**Input Area:**
- **Prompt Template** (if tool has structured inputs)
- **Free-form Text Area** (for flexible tools)
- **File Upload** (if tool accepts documents)
  - Supported formats: PDF, DOCX, TXT
  - Max size: 10MB
- **Advanced Options (collapsible):**
  - Model selection (Haiku / Sonnet / Opus)
  - Output format (Text / DOCX / PDF)
  - Tone (Formal / Neutral / Persuasive)
  - Jurisdiction (if relevant)

**CTA:**
- **Primary Button:** "Run Tool" (large, prominent)
- **Secondary Actions:**
  - Save as Template
  - Add to Workspace
  - Schedule for Later

---

**Right Panel (40%):**

**At a Glance:**
- AI Model: Claude Sonnet 4.5
- Avg. Run Time: 15-30 seconds
- Output Format: Text, DOCX
- Compliance: GDPR, SOC2

**Your Activity:**
- Times used: 12
- Last used: 2 days ago
- Avg. usage: 3x/week

**Recent Runs:**
- List of last 5 runs for this tool
- Click to reopen output

**Related Tools:**
- 3-5 similar or complementary tools
- CTA: "Try this instead"

**Team Notes (if team account):**
- Shared notes/tips from team members
- Add note button

**Help & Resources:**
- Video tutorial (if available)
- Documentation link
- Report issue button

---

### 6.3 Tool Execution Flow

**Step 1: User clicks "Run Tool"**
- Show loading state: "Running... Estimated time: 20s"
- Progress bar (if tool supports streaming)
- Token usage estimate (if visible to user)

**Step 2: Output Displayed**
- Streaming output (appears in real-time)
- Show in editable text area
- Syntax highlighting (if code/legal citations)

**Step 3: Output Panel**

**Top Actions Bar:**
- **Copy** (copy to clipboard)
- **Export** (download as DOCX, PDF, TXT)
- **Share** (share with teammate or external)
- **Add to Project** (save to case folder)
- **Rate Output** (👍👎 for feedback)

**Output Content:**
- Full text output (editable)
- **Provenance Panel** (collapsible):
  - Sources cited (for research tools)
  - Confidence scores (if applicable)
  - Model version used
  - Run timestamp
  - Redaction suggestions (if PII detected)

**Citation List (for legal research tools):**
- Bluebook-formatted citations
- Clickable links to cases
- Shepardize/validation status

**Bottom Actions:**
- **Re-run with Changes** (edit input and run again)
- **Start New Run** (clear and start fresh)
- **Create Document** (convert to formal document)

---

### 6.4 Output History

**After tool runs:**
- Output automatically saved to History
- Associated with project (if run within project context)
- Searchable and filterable

---

## 7. Workspaces & Projects

### 7.1 Workspace Concept

**Definition:** A workspace is a container for projects, tools, and team members.

**Types:**
- **Personal Workspace** (default, every user has one)
- **Team Workspace** (shared with team, created by admin)

**Workspace Switcher:**
- Dropdown in left sidebar (below Categories)
- Shows: Personal + all team workspaces user belongs to
- Click to switch context

---

### 7.2 Workspace View

**Route:** `/dashboard/workspaces/[workspace-id]`

**Layout:**

**Header:**
- Workspace name (editable if admin)
- Description (optional)
- Members count
- Settings button (admin only)

**Tabs:**
1. **Pinned Tools** - Tools frequently used in this workspace
2. **Projects/Cases** - All projects in this workspace
3. **Team Activity** - Recent runs, edits, shares by team
4. **Settings** (admin only) - Members, permissions, workspace config

---

### 7.3 Projects / Cases

**Definition:** A project is a folder that groups related tool runs, documents, and notes.

**Use Case:** 
- Litigation case: "Smith v. Johnson Defamation"
- Corporate transaction: "Acme Corp M&A Due Diligence"
- Client matter: "Jones Employment Agreement"

---

### 7.4 Project Structure

**Route:** `/dashboard/projects/[project-id]`

**Project Header:**
- **Project Name** (editable)
- **Status Badge:** Active / Closed / Archived
- **Privacy:** Private / Team / Firm-wide
- **Members:** Avatars of assigned team members
- **Actions:** Edit, Share, Archive, Delete

**Project Tabs:**

**1. Overview**
- Description
- Key dates (created, deadline)
- Activity feed (timeline of all actions)

**2. Documents**
- Uploaded files (PDFs, contracts, evidence)
- Generated outputs from tools
- Version control (if file edited)

**3. Tool Runs**
- All tool executions within this project
- Filterable by tool, date, user
- Click to reopen output

**4. Notes & Comments**
- Shared notes among team
- Thread-based comments
- @mentions to notify team members

**5. Tasks** (optional)
- To-do list for project
- Assign tasks to team members
- Due dates and status tracking

---

### 7.5 Creating a Project

**Trigger:** Click "+ New Project" in sidebar or header

**Modal Form:**
- **Project Name** (required)
- **Description** (optional, rich text)
- **Workspace** (dropdown)
- **Privacy:**
  - Private (only me)
  - Team (workspace members)
  - Firm (all org members)
- **Members** (multi-select from team)
- **Tags** (optional, for categorization)

**CTA:** "Create Project"

---

## 8. History

### 8.1 Route
`/dashboard/history`

### 8.2 Layout

**Filters (top):**
- Date range (last 7 days, 30 days, custom)
- Tool (multi-select)
- Project (if run within project)
- Status (Success / Failed / In Progress)
- User (if team account)

**View Options:**
- List view (default)
- Timeline view (chronological)

---

### 8.3 History List Items

**Each item shows:**
- Tool icon + name
- Input snippet (first 50 chars)
- Timestamp (e.g., "2 hours ago")
- Status badge (Success / Failed)
- Project tag (if applicable)
- Actions:
  - Reopen (view full output)
  - Rerun (with same inputs)
  - Export
  - Delete

---

## 9. Templates Library

### 9.1 Route
`/dashboard/templates`

### 9.2 Template Types

**1. Prompt Templates**
- Pre-configured inputs for tools
- Example: "Standard NDA Draft" (for contract drafting tool)

**2. Document Templates**
- Reusable document structures
- Example: "Motion to Dismiss Template"

---

### 9.3 Template Card

**Card shows:**
- Template name
- Tool it's associated with
- Times used
- Created by (user or firm)
- Visibility (Personal / Team / Firm)

**Actions:**
- Use Template (loads into tool)
- Edit Template
- Duplicate
- Share
- Delete

---

### 9.4 Creating a Template

**Trigger:** After running a tool successfully

**Flow:**
1. Click "Save as Template"
2. Modal opens:
   - Template Name
   - Description
   - Visibility (Personal / Team / Firm)
   - Save
3. Template added to library

---

## 10. Integrations

### 10.1 Route
`/dashboard/integrations`

### 10.2 Supported Integrations

**Document Management:**
- Microsoft Word (add-in)
- Google Docs (extension)
- iManage
- NetDocuments
- Dropbox
- OneDrive

**Practice Management:**
- Clio Manage
- MyCase
- PracticePanther

**Email:**
- Outlook
- Gmail

**Other:**
- Zapier (custom workflows)
- Slack (notifications)

---

### 10.3 Integration Cards

**Each card shows:**
- Service logo
- Service name
- Connection status (Connected / Not Connected)
- Description
- Actions:
  - Connect (if not connected)
  - Configure
  - Disconnect

---

### 10.4 Integration Setup Flow

**Example: Microsoft Word Integration**

1. Click "Connect" on Word card
2. Authorize Frith AI to access Word
3. Download Frith AI Word add-in
4. Configure sync settings:
   - Auto-save outputs to Word
   - Default save location
5. Test connection
6. Save settings

---

## 11. Billing & Subscriptions

### 11.1 Route
`/dashboard/billing`

### 11.2 Layout

**Current Plan Section:**
- Plan name (Free / Starter / Professional / Advanced)
- Price (monthly/annual)
- Next billing date
- **CTA:** "Upgrade Plan" or "Manage Subscription"

**Usage Dashboard:**
- **Queries Used:** 147 / 300 this month
- **Storage Used:** 2.3 GB / 10 GB
- **Team Seats:** 3 / 5
- Progress bars for each metric
- **Overage Warning:** (if near limit)

**Features Comparison:**
- Table comparing current plan vs higher tiers
- Highlight: "Upgrade to unlock unlimited queries"

**Billing History:**
- List of past invoices
- Download PDF button
- Date, amount, status (Paid / Pending)

**Payment Method:**
- Current card (last 4 digits)
- Expiry date
- "Update Payment Method" button

**Subscription Actions:**
- Change Plan (upgrade/downgrade)
- Add/Remove Seats
- Switch to Annual (save 20%)
- Cancel Subscription
- Download Tax Invoice

---

## 12. Team & Users (Admin Only)

### 12.1 Route
`/dashboard/team`

### 12.2 Team Dashboard

**Members List:**
- Table view:
  - Name
  - Email
  - Role (Admin / Member / Viewer)
  - Last Active
  - Status (Active / Invited / Suspended)
  - Actions (Edit, Remove)

**Invite Members:**
- Button: "+ Invite Team Member"
- Modal:
  - Email (required)
  - Role (dropdown)
  - Workspace access (multi-select)
  - Custom message (optional)
  - Send Invitation

**Pending Invitations:**
- List of sent invites
- Resend or cancel option

**Role Management:**
- Define custom roles
- Set permissions per role
- Tool access restrictions

---

## 13. Settings

### 13.1 Route
`/dashboard/settings`

### 13.2 Settings Sections

**Tabs:**

**1. Profile**
- Name
- Email (verified badge)
- Firm/Company Name
- Role
- Avatar upload
- Save Changes

**2. Account Security**
- Change Password
- Two-Factor Authentication (Enable/Disable)
- Active Sessions (view and revoke)
- Login History
- Account Deletion (with warnings)

**3. Preferences**
- Language (EN, ES, FR, DE)
- Time Zone
- Date Format
- Number Format
- Theme (Light / Dark / Auto)
- Email Notifications (toggles for each type)

**4. Notifications**
- Email Preferences:
  - Tool run completed ✓
  - Team mentions ✓
  - Billing alerts ✓
  - Product updates ✓
  - Marketing emails ✗
- Push Notifications (browser)
- Slack notifications (if integrated)

**5. Privacy & Data**
- Data Retention Policy
- Export My Data (GDPR)
- Delete My Account
- Privacy Settings:
  - Allow Frith AI to analyze my usage for improvements
  - Share anonymized data for product research

**6. API & Developer** (Advanced plan only)
- API Key (generate/revoke)
- API Documentation link
- Webhook configuration
- Usage limits and quotas

---

## 14. Onboarding Flow

### 14.1 Trigger
- First login after email verification
- Route: `/dashboard/welcome`

### 14.2 Onboarding Steps

**Step 1: Welcome Screen**
- Headline: "Welcome to Frith AI, [Name]! 🎉"
- Subheadline: "Let's get you set up in 2 minutes"
- CTA: "Get Started"

**Step 2: Persona Selection**
- Question: "What best describes your role?"
- Options (cards):
  - Solo Practitioner
  - Associate
  - Partner
  - General Counsel
  - Paralegal / Legal Ops
  - Other
- CTA: "Continue"

**Step 3: Practice Areas**
- Question: "What areas do you focus on? (Select all that apply)"
- Options (checkboxes):
  - Litigation
  - Corporate / M&A
  - Intellectual Property
  - Employment Law
  - Real Estate
  - Family Law
  - Personal Injury
  - Criminal Defense
  - Tax Law
  - Estate Planning
  - Other
- CTA: "Continue"

**Step 4: Import or Upload (Optional)**
- Question: "Want to import existing documents or connect tools?"
- Options:
  - Upload a contract to analyze (file upload)
  - Connect Microsoft Word
  - Connect Clio
  - Skip for now
- CTA: "Continue" or "Skip"

**Step 5: Recommended Tools**
- Based on selections, show 6 curated tools
- Headline: "We picked these tools for you"
- Each tool card: Name, description, "Try it now" button
- Option to star/favorite directly
- CTA: "Continue to Dashboard"

**Step 6: First Tool Run (Guided)**
- Headline: "Let's run your first tool"
- Select a simple tool (e.g., "Legal Email Drafter")
- Pre-fill sample input
- Guide through execution
- Show output
- Celebrate: "Great job! You're all set 🎉"
- CTA: "Go to Dashboard"

---

### 14.3 Onboarding Checklist (Persistent)

**After onboarding, show checklist widget in dashboard:**
- ✓ Verify email
- ✓ Complete profile
- ⬜ Run your first tool
- ⬜ Create a project
- ⬜ Invite a team member (if applicable)
- ⬜ Connect an integration

**Progress Bar:** "3/6 Complete"

**Dismissible:** User can collapse or dismiss

---

## 15. Right Sidebar (Context Panel)

### 15.1 Behavior
- **Collapsible:** Click icon to hide/show
- **Context-Aware:** Content changes based on main panel selection

### 15.2 Content Types

**When Tool Selected:**
- Tool details
- Documentation quick view
- Recent runs
- Related tools

**When Project Selected:**
- Project info
- Team members
- Recent activity
- Quick actions

**Default (No Selection):**
- Quick stats (usage this month, most-used tools)
- Tips & tricks
- What's new (product updates)
- Help resources

---

## 16. Notifications System

### 16.1 Notification Types

**1. Tool Run Complete**
- "Your Contract Analysis is ready"
- Action: View Output

**2. Team Mention**
- "@John mentioned you in Project Alpha"
- Action: View Comment

**3. Billing Alert**
- "You've used 90% of your monthly queries"
- Action: Upgrade Plan

**4. System Update**
- "New tool released: IP Patent Analyzer"
- Action: Try Now

**5. Collaboration**
- "Sarah shared a template with you"
- Action: View Template

---

### 16.2 Notification Center (Dropdown from bell icon)

**Layout:**
- Header: "Notifications" with "Mark all as read"
- List of notifications (most recent first)
- Each notification:
  - Icon (based on type)
  - Message
  - Timestamp (e.g., "5 min ago")
  - Read/unread indicator (blue dot)
  - Action button (if applicable)
- Footer: "View All Notifications" → `/dashboard/notifications`

---

## 17. Collaboration Features

### 17.1 Sharing Tool Outputs

**Flow:**
1. User runs tool, gets output
2. Clicks "Share" button
3. Modal opens:
   - **Share With:**
     - Team members (multi-select)
     - External email (enter email)
   - **Permissions:**
     - Can view
     - Can edit
     - Can comment
   - **Message** (optional)
   - **Expiry** (optional, for external shares)
   - Send

**Recipient Receives:**
- Email notification with link
- Link opens shared output (read-only or editable based on permission)

---

### 17.2 Commenting on Outputs

**Within Project Context:**
- Each tool run has a "Comments" section
- Thread-based comments
- @mentions to notify team members
- Rich text formatting
- Attachments allowed

---

### 17.3 Live Collaboration (Future)

**Co-editing outputs in real-time:**
- Multiple users edit same output simultaneously
- See collaborators' cursors
- Changes synced instantly
- Conflict resolution

---

## 18. Advanced Features

### 18.1 Tool Chaining (Future)

**Concept:** Run multiple tools in sequence

**Example Workflow:**
1. Upload contract → Run "Contract Analysis"
2. Output → Feed into "Risk Assessment"
3. Output → Feed into "Redlining Suggestions"
4. Final output → Export to Word

**UI:** Visual workflow builder (drag-and-drop)

---

### 18.2 Scheduled Runs

**Use Case:** Run recurring reports or analyses

**Setup:**
- Select tool
- Configure inputs (or use template)
- Set schedule (daily, weekly, monthly)
- Set delivery (email, save to project)

**Management:** View and edit scheduled runs in Settings

---

### 18.3 Bulk Processing

**Use Case:** Run same tool on 100+ documents

**Flow:**
1. Select tool
2. Upload batch of files (ZIP or folder)
3. Configure settings
4. Run (background job)
5. Receive notification when complete
6. Download results as ZIP

---

## 19. Mobile Experience

### 19.1 Responsive Design

**Layout Adjustments:**
- Single-column layout
- Hamburger menu (left sidebar collapses)
- Bottom navigation bar (Home, Search, New, History, Profile)
- Swipe gestures (swipe right to open sidebar)

---

### 19.2 Mobile-Specific Features

**Simplified Tool Cards:**
- Larger touch targets
- Essential info only
- Tap to expand details

**Voice Input (Future):**
- Dictate prompts instead of typing
- Useful for on-the-go use

**Offline Mode (Future):**
- Cache recent tool runs for offline viewing
- Queue tool runs when back online

---

## 20. Performance & Optimization

### 20.1 Performance Targets
- **Tool grid load:** < 1s
- **Tool execution start:** < 500ms
- **Output streaming:** Real-time (as AI generates)
- **Navigation:** < 200ms (instant feel)

### 20.2 Optimization Techniques
- **Lazy loading:** Load tools as user scrolls
- **Code splitting:** Split by route
- **Image optimization:** WebP with fallbacks
- **Caching:** Cache tool metadata, user settings
- **CDN:** Static assets served from Vercel CDN
- **Database indexing:** Optimize Neon queries

---

## 21. Accessibility

### 21.1 WCAG 2.1 AA Compliance
- Keyboard navigation (Tab, Shift+Tab, Enter, Esc)
- Screen reader support (ARIA labels, semantic HTML)
- Focus indicators on all interactive elements
- Color contrast ≥ 4.5:1
- Skip navigation links
- Text resizable up to 200%

### 21.2 Keyboard Shortcuts
- `Cmd/Ctrl + K` → Global search
- `Cmd/Ctrl + N` → New project
- `Cmd/Ctrl + /` → Show shortcuts help
- `Esc` → Close modal/drawer
- `↑↓` → Navigate lists
- `Enter` → Select/activate

---

## 22. Security & Compliance

### 22.1 Data Security
- All data encrypted at rest (AES-256)
- All data encrypted in transit (TLS 1.3)
- No data used to train AI models (contractual guarantee with Anthropic)
- Regular security audits
- Penetration testing (annual)

### 22.2 Compliance Features
- **Audit Logs:** Every action logged (who, what, when, where)
- **Data Residency:** Option to store data in specific regions (EU, US)
- **Data Export:** GDPR-compliant data export
- **Data Deletion:** Right to be forgotten (delete all user data)
- **Access Controls:** Role-based permissions, principle of least privilege
- **Session Management:** Automatic logout after 30 min inactivity (configurable)

---

## 23. Analytics & Insights (Dashboard)

### 23.1 User Analytics Page
**Route:** `/dashboard/analytics` (Professional plan and above)

**Metrics Shown:**
- Tools used this month (chart)
- Time saved (estimated based on tool usage)
- Most productive times (heatmap)
- Top tools used
- Projects completed
- Team collaboration stats (if team account)

**Goal:** Help users understand their usage and ROI

---

## 24. Help & Support

### 24.1 In-App Help

**Help Button (? icon in header):**
- Dropdown:
  - Search Help Center
  - Getting Started Guide
  - Video Tutorials
  - Keyboard Shortcuts
  - Submit Feedback
  - Report Bug
  - Contact Support

**Contextual Help:**
- Tooltip icons next to complex features
- Inline help text
- Video tutorials embedded in tool detail pages

---

### 24.2 Live Chat Widget (Future)
- Bottom-right corner
- Chat with support team
- AI-powered initial responses
- Escalate to human if needed

---

## 25. Error Handling

### 25.1 Error Types

**Tool Execution Errors:**
- API timeout: "The AI took too long to respond. Please try again."
- Rate limit hit: "You've reached your query limit for this month. Upgrade to continue."
- Invalid input: "Please check your input and try again. [Specific error message]"
- Model error: "There was an issue processing your request. Our team has been notified."

**Network Errors:**
- Offline: "You're offline. Some features may not work."
- Connection lost: "Connection lost. Retrying..." (auto-retry)

**Permission Errors:**
- Insufficient permissions: "You don't have permission to access this tool. Contact your admin."
- Plan limitation: "This feature requires a Professional plan. [Upgrade Now]"

---

### 25.2 Error UI
- **Toast notifications** for minor errors (disappear after 5s)
- **Alert banners** for important errors (persist until dismissed)
- **Error pages** for critical errors (500, 404)
- **Empty states** for no data scenarios

---

## 26. Database Schema (Key Tables)

### 26.1 Tools Table
```sql
CREATE TABLE tools (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  input_type VARCHAR(50), -- text, document, audio
  output_type VARCHAR(50), -- text, docx, pdf
  pricing_tier VARCHAR(50), -- free, professional, advanced
  ai_model VARCHAR(50), -- haiku, sonnet, opus
  popular BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 26.2 Tool Runs Table
```sql
CREATE TABLE tool_runs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tool_id UUID REFERENCES tools(id),
  project_id UUID REFERENCES projects(id),
  input_text TEXT,
  input_files JSONB, -- array of file URLs
  output_text TEXT,
  output_files JSONB,
  status VARCHAR(50), -- pending, running, completed, failed
  ai_model_used VARCHAR(50),
  tokens_used INT,
  run_time_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 26.3 Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  privacy VARCHAR(50) DEFAULT 'private', -- private, team, firm
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 26.4 Workspaces Table
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- personal, team
  org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 26.5 Templates Table
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tool_id UUID REFERENCES tools(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  input_template TEXT,
  visibility VARCHAR(50), -- personal, team, firm
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 27. API Endpoints

### 27.1 Tool Endpoints
```javascript
GET    /api/tools                 // List all tools (with filters)
GET    /api/tools/:id             // Get tool details
POST   /api/tools/:id/run         // Execute tool
GET    /api/tools/:id/runs        // Get run history for tool
GET    /api/tools/popular         // Get popular tools
GET    /api/tools/recommended     // Get personalized recommendations
```

### 27.2 Project Endpoints
```javascript
GET    /api/projects              // List user's projects
POST   /api/projects              // Create project
GET    /api/projects/:id          // Get project details
PATCH  /api/projects/:id          // Update project
DELETE /api/projects/:id          // Delete project
GET    /api/projects/:id/runs     // Get tool runs in project
POST   /api/projects/:id/documents // Upload document to project
```

### 27.3 Workspace Endpoints
```javascript
GET    /api/workspaces            // List user's workspaces
POST   /api/workspaces            // Create workspace (admin only)
GET    /api/workspaces/:id        // Get workspace details
PATCH  /api/workspaces/:id        // Update workspace (admin only)
GET    /api/workspaces/:id/members // Get workspace members
POST   /api/workspaces/:id/members // Invite member (admin only)
```

---

## 28. Launch Checklist

### Pre-Launch
- [ ] All 240 tools catalogued and configured
- [ ] Tool execution working (API integration with Claude)
- [ ] User authentication working
- [ ] Billing integration (Stripe/PayPal) tested
- [ ] Onboarding flow tested
- [ ] Mobile responsiveness verified
- [ ] Accessibility audit passed
- [ ] Performance targets met (Lighthouse 95+)
- [ ] Security audit completed
- [ ] Analytics tracking configured
- [ ] Help documentation written
- [ ] Error handling tested
- [ ] Load testing completed (simulate 1000 concurrent users)

### Post-Launch (Week 1)
- [ ] Monitor error rates
- [ ] Track user onboarding completion
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Monitor API costs (Claude API usage)
- [ ] Track conversion rates (free → paid)

---

## 29. Success Metrics (KPIs)

### User Engagement
- **Daily Active Users (DAU)**
- **Tools run per user per day** (target: 5+)
- **Time spent in dashboard** (target: 15+ min)
- **Onboarding completion rate** (target: 80%+)

### Conversion
- **Free → Paid conversion** (target: 2-5%)
- **Trial → Paid conversion** (if trials exist)
- **Upgrade rate** (Starter → Pro → Advanced)

### Retention
- **Day 1 retention** (target: 60%+)
- **Day 7 retention** (target: 40%+)
- **Day 30 retention** (target: 25%+)
- **Churn rate** (target: < 5%/month)

### Product Usage
- **Most used tools** (top 10)
- **Least used tools** (identify for improvement/removal)
- **Feature adoption rates** (workspaces, templates, integrations)

---

## 30. Future Roadmap

### Phase 2 (Months 3-6)
- Mobile app (iOS/Android)
- Advanced collaboration (co-editing)
- Tool chaining (workflows)
- Scheduled runs
- Enhanced analytics dashboard
- White-label options for enterprises

### Phase 3 (Months 6-12)
- API marketplace (allow custom tools)
- Community forum
- Certification program
- Advanced AI models (custom fine-tuning)
- Multi-language support (Spanish, French, German)
- Voice input/output

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Status:** Ready for Design & Development  
**Next Steps:** Begin UI/UX design, then frontend implementation
