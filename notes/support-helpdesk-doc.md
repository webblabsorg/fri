# Support, Help Desk & Documentation
**Platform:** Frith AI - Legal AI Platform  
**Domain:** https://support.frithai.com  
**Tech Stack:** Next.js, Tailwind CSS, Shadcn UI, Neon PostgreSQL, Zendesk/Intercom (or custom)

---

## 1. Overview

The Support Center is a comprehensive self-service knowledge base and ticketing system that helps users find answers quickly, submit support requests, and get assistance with Frith AI.

### Goals
1. Reduce support ticket volume through self-service
2. Provide instant answers to common questions
3. Enable easy ticket submission for complex issues
4. Build trust through transparent, helpful documentation
5. Collect feedback to improve product

---

## 2. Support Center Architecture

### 2.1 Components
- **Public Help Center** (searchable knowledge base)
- **Ticket Submission System** (authenticated users)
- **Live Chat Widget** (optional, future)
- **Status Page** (system uptime and incidents)
- **Community Forum** (future)

### 2.2 Access Levels
- **Public:** Anyone can browse help articles and status page
- **Authenticated Users:** Can submit tickets, view ticket history
- **Admin:** Can manage articles, respond to tickets (in admin dashboard)

---

## 3. Homepage: Support Center

### 3.1 Route
`https://support.frithai.com/`

### 3.2 Layout

**Header:**
- **Logo:** Frith AI (links back to frithai.com)
- **Navigation:**
  - Help Center
  - Submit a Ticket
  - System Status
  - Community (future)
  - Contact Us
- **Right:**
  - **Search Icon** (expands to search bar)
  - **Sign In** (if not logged in)
  - **User Avatar** (if logged in) → My Tickets, Sign Out

---

### 3.3 Hero Section

**Background:** Gradient or branded color

**Content:**
- **Headline:** "How can we help you?"
- **Subheadline:** "Search our knowledge base or submit a ticket"
- **Search Bar (Prominent):**
  - Large input field (70% width, centered)
  - Placeholder: "Search for help..."
  - Real-time suggestions as you type
  - Icon: Magnifying glass
  - Keyboard shortcut: `/` to focus
- **Below Search:**
  - "Popular searches: Contract analysis, Billing, API access, Tool errors"

---

### 3.4 Quick Links (Icon Grid)

**Layout:** 3-4 columns, icon cards

**Cards:**
1. **Getting Started** 📘
   - "New to Frith AI? Start here"
   - Link: `/help/getting-started`

2. **Features & Tools** 🛠️
   - "Learn about our 240+ AI tools"
   - Link: `/help/features`

3. **Billing & Plans** 💳
   - "Manage your subscription"
   - Link: `/help/billing`

4. **Troubleshooting** 🔧
   - "Fix common issues"
   - Link: `/help/troubleshooting`

5. **API Documentation** 🔌 (if Advanced/Enterprise plan)
   - "Developer resources"
   - Link: `/help/api-docs`

6. **Security & Compliance** 🔒
   - "Data protection and privacy"
   - Link: `/help/security`

---

### 3.5 Popular Articles (Below Quick Links)

**Section Title:** "Popular Articles"

**Layout:** List or card grid (3 columns)

**Each Article Card:**
- Title (linked)
- Excerpt (2 lines)
- Category badge
- View count
- Helpful votes (👍 X • 👎 Y)

**Examples:**
- "How to run your first AI tool"
- "Understanding your subscription limits"
- "How to export tool outputs to Word"
- "Setting up team workspaces"
- "Troubleshooting tool execution errors"

---

### 3.6 Contact Options (Bottom Section)

**Headline:** "Can't find what you're looking for?"

**CTA Cards (2-3 options):**

1. **Submit a Ticket** 🎫
   - "Get help from our support team"
   - Response time: "< 24 hours"
   - Button: "Submit Ticket"

2. **Live Chat** 💬 (if enabled)
   - "Chat with us now"
   - Status: "Available" or "Offline (opens at 9am EST)"
   - Button: "Start Chat"

3. **Email Support** 📧
   - "Send us an email"
   - support@frithai.com
   - Button: "Send Email" (opens email client)

---

### 3.7 Footer

**Columns:**

**Column 1: Support Resources**
- Help Center Home
- Getting Started
- API Docs
- System Status
- Submit Ticket

**Column 2: Product**
- Features
- Pricing
- Changelog
- Roadmap

**Column 3: Company**
- About Us
- Blog
- Careers
- Contact

**Column 4: Legal**
- Terms of Service
- Privacy Policy
- Security

**Bottom:**
- Copyright © 2025 Frith AI
- Social links (Twitter, LinkedIn)

---

## 4. Help Center (Knowledge Base)

### 4.1 Route
`/help` or `/help/categories`

### 4.2 Category Structure (Organized Content)

**Categories (with subcategories):**

**1. Getting Started** 📘
- Welcome to Frith AI
- Creating your account
- Verifying your email
- First login and onboarding
- Running your first AI tool
- Understanding the dashboard

**2. Features & Tools** 🛠️
- Overview of 240+ AI tools
- Tool categories explained
- How to search and filter tools
- Running a tool (step-by-step)
- Understanding tool outputs
- Saving and exporting results
- Using templates
- Tool troubleshooting

**3. Workspaces & Projects** 💼
- What are workspaces?
- Creating and managing projects
- Adding team members to projects
- Organizing tool runs
- Document management

**4. Team Collaboration** 👥
- Inviting team members
- Setting roles and permissions
- Sharing tool outputs
- Commenting and mentions
- Team workspaces

**5. Billing & Subscriptions** 💳
- Understanding pricing plans
- Upgrading or downgrading
- Payment methods
- Invoices and receipts
- Canceling your subscription
- Refund policy (45-day guarantee)
- Usage limits and overages

**6. Account Settings** ⚙️
- Updating profile information
- Changing password
- Enabling two-factor authentication
- Notification preferences
- Privacy settings
- Deleting your account

**7. Integrations** 🔌
- Connecting Microsoft Word
- Connecting Clio
- Email integrations
- API access (Advanced/Enterprise)
- Zapier automation
- Troubleshooting integrations

**8. Security & Compliance** 🔒
- Data encryption
- GDPR compliance
- SOC2 certification
- Data retention policies
- Right to be forgotten
- Security best practices

**9. Troubleshooting** 🔧
- Common error messages
- Tool not running
- Slow performance
- Login issues
- Payment failures
- Email not received
- Integration connection issues

**10. API Documentation** 🔌 (Advanced/Enterprise)
- API overview
- Authentication
- Endpoints reference
- Rate limits
- Code examples (Python, JavaScript)
- Webhooks
- SDKs

---

### 4.3 Category Landing Page

**Route:** `/help/categories/[category-slug]`

**Example:** `/help/categories/getting-started`

**Layout:**

**Header:**
- Category name (H1)
- Category description (1-2 sentences)
- Icon (large)

**Article List:**
- All articles in this category
- Sorted by: Popular / Recent / A-Z
- Each article:
  - Title (linked)
  - Excerpt
  - Last updated date
  - View count
  - Helpful votes

**Sidebar (Right):**
- **Related Categories** (links to other categories)
- **Popular Articles in This Category**
- **Contact Support** (CTA button)

---

### 4.4 Article Page

**Route:** `/help/articles/[article-slug]`

**Example:** `/help/articles/how-to-run-your-first-tool`

**Layout:**

**Left Panel (70%):**

**Header:**
- **Article Title (H1)**
- **Metadata:**
  - Category badge (linked)
  - Last updated: Date
  - Read time: X min
  - Views: X
- **Actions:**
  - Print icon
  - Share icon (copy link)
  - Bookmark (for logged-in users)

**Article Content:**
- Rich text (HTML/Markdown)
- Images, videos (embedded)
- Code blocks (syntax highlighted)
- Collapsible sections (for long articles)
- Table of contents (if long article, sticky sidebar)
- Inline help tips (callout boxes)

**Components:**
- **Info Boxes:** Blue background for tips
- **Warning Boxes:** Yellow for cautions
- **Error Boxes:** Red for important warnings
- **Video Embeds:** YouTube, Loom, Vimeo
- **Screenshots:** With annotations

**Article Footer:**

**Was this article helpful?**
- 👍 Yes (count) • 👎 No (count)
- If "No" clicked: "Tell us how we can improve" (textarea)

**Related Articles:**
- 3-5 related articles (with thumbnails)

**Still need help?**
- Button: "Submit a Ticket" or "Contact Support"

---

**Right Sidebar (30%):**

**On This Page (Table of Contents):**
- Links to H2/H3 headings in article
- Auto-highlight current section as user scrolls

**Related Articles:**
- 3-5 related articles

**Contact Support:**
- CTA: "Need more help? Submit a ticket"

---

### 4.5 Search Results Page

**Route:** `/help/search?q=[query]`

**Layout:**

**Header:**
- Search query shown: "Results for 'contract analysis'"
- Number of results: "12 articles found"
- Sort dropdown: Relevance / Date / Popular

**Results List:**
- **Each result:**
  - **Title** (linked, bolded matches)
  - **Excerpt** (snippet with query term highlighted)
  - **Category badge**
  - **Article URL** (breadcrumb)
  - **Last updated date**

**No Results:**
- Message: "No articles found for '[query]'"
- Suggestions:
  - Check spelling
  - Try different keywords
  - Browse categories
- CTA: "Submit a Ticket" or "Contact Support"

**Sidebar:**
- **Suggested Categories** (based on query)
- **Popular Articles**

---

## 5. Submit a Ticket

### 5.1 Route
`/support/submit-ticket` or `/tickets/new`

### 5.2 Access
- **Logged-in users only** (redirect to sign-in if not authenticated)
- Link user context (email, plan, organization) automatically

### 5.3 Ticket Form

**Header:**
- **Title:** "Submit a Support Ticket"
- **Subtitle:** "We'll respond within 24 hours"

**Form Fields:**

**1. Subject** (required)
- Input type: text
- Placeholder: "Brief description of your issue"
- Example: "Unable to export tool output to Word"

**2. Category** (required)
- Dropdown:
  - General Question
  - Technical Issue
  - Billing & Payments
  - Account & Login
  - Feature Request
  - Bug Report
  - Other

**3. Priority** (required)
- Radio buttons:
  - Low (informational)
  - Medium (issue affecting work, but not blocking)
  - High (blocking work)
  - Urgent (system down, security issue)

**4. Description** (required)
- Textarea (rich text optional)
- Placeholder: "Please describe your issue in detail. Include steps to reproduce if it's a bug."
- Min length: 50 characters

**5. Attachments** (optional)
- File upload (max 10MB per file, up to 5 files)
- Supported formats: PNG, JPG, PDF, TXT, DOCX, CSV
- Drag-and-drop area

**6. Tool or Feature (if applicable)**
- Dropdown: Select the tool related to your issue
- Autocomplete search

**7. System Information (auto-captured, collapsible)**
- Browser: Chrome 120.0
- OS: Windows 10
- Plan: Professional
- User ID: [masked, admin can see]

**Privacy Notice:**
- Checkbox: "I agree to share this information with Frith AI support for troubleshooting purposes."

**CTA Button:**
- **Submit Ticket** (primary button, full width)
- **Loading state:** "Submitting..."

**Below Button:**
- "Need immediate help? [Start Live Chat](/live-chat)" (if enabled)

---

### 5.4 Ticket Submission Success

**After submission, redirect to:** `/tickets/[ticket-id]`

**Success Message:**
- ✅ "Your ticket has been submitted!"
- "Ticket ID: #12345"
- "We'll respond to your email within 24 hours."

**Email Confirmation:**
- Sent to user's registered email
- Subject: "Support Ticket Received: #12345"
- Body:
  ```
  Hi [Name],
  
  Thank you for contacting Frith AI support.
  
  Ticket ID: #12345
  Subject: [Subject]
  Status: Open
  
  We'll review your request and respond within 24 hours.
  
  View or update your ticket: [Link]
  
  Best,
  Frith AI Support Team
  ```

---

## 6. My Tickets (User View)

### 6.1 Route
`/tickets` or `/support/my-tickets`

### 6.2 Access
- Logged-in users only

### 6.3 Tickets List

**Header:**
- **Title:** "My Support Tickets"
- **CTA:** "+ Submit New Ticket"

**Filters (Top):**
- Status: All / Open / In Progress / Waiting on Me / Resolved / Closed
- Date range: Last 7 days / 30 days / All time

**Tickets Table:**

**Columns:**
- **Ticket ID** (#12345)
- **Subject** (truncated, linked to detail)
- **Status** (badge)
- **Priority** (badge)
- **Last Updated** (timestamp)
- **Created** (timestamp)

**Actions (per row):**
- View Ticket (button)

**Empty State (No Tickets):**
- Illustration: Empty inbox
- Message: "You haven't submitted any tickets yet."
- CTA: "Submit Your First Ticket"

---

### 6.4 Ticket Detail Page (User View)

**Route:** `/tickets/[ticket-id]`

**Access:** User who created ticket (or admins)

**Layout:**

**Header:**
- **Ticket ID:** #12345
- **Status Badge:** Open / In Progress / Resolved / Closed
- **Priority Badge:** Low / Medium / High / Urgent
- **Subject:** [Subject line]

**Ticket Metadata (Top):**
- Category: Technical Issue
- Created: Dec 9, 2025 at 10:15 AM
- Last Updated: Dec 9, 2025 at 2:30 PM
- Assigned To: Support Agent Name (or "Unassigned")

**Conversation Thread:**

**Layout:** Chat-style (messages stacked)

**User Messages:**
- Left-aligned
- Avatar (user)
- Name + timestamp
- Message content
- Attachments (if any)

**Admin Responses:**
- Right-aligned (or left with distinct color)
- Avatar (admin)
- Admin name + timestamp
- Message content
- Attachments

**Internal Notes (Not Visible to User):**
- Hidden from user, only admins see

---

**Reply Box (Bottom):**

**Field:**
- Textarea (rich text optional)
- Placeholder: "Type your reply..."
- Attach files button

**Actions:**
- **Send Reply** (button)
- **Close Ticket** (button, if user wants to mark as resolved)

**Email Notifications:**
- User receives email when admin replies
- Subject: "Reply to Support Ticket #12345"

---

## 7. System Status Page

### 7.1 Route
`/status` or `https://status.frithai.com` (subdomain recommended)

### 7.2 Purpose
- Transparency: Show real-time system health
- Reduce support load during outages (users check here first)

### 7.3 Layout

**Header:**
- **Title:** "Frith AI System Status"
- **Current Status Indicator:**
  - 🟢 All Systems Operational
  - 🟡 Partial Outage
  - 🔴 Major Outage

---

### 7.4 Service Status (Component List)

**Each component shows status:**

**Components:**
1. **Web Application** (frithai.com)
   - Status: 🟢 Operational
   - Uptime: 99.95% (last 30 days)

2. **API** (api.frithai.com)
   - Status: 🟢 Operational
   - Uptime: 99.87%

3. **User Dashboard** (app.frithai.com)
   - Status: 🟢 Operational

4. **Admin Dashboard**
   - Status: 🟢 Operational

5. **Database** (Neon PostgreSQL)
   - Status: 🟢 Operational

6. **AI Processing** (Claude API)
   - Status: 🟡 Degraded Performance
   - Note: "Slower response times due to high demand"

7. **Email Service** (Resend)
   - Status: 🟢 Operational

8. **Payment Processing** (Stripe)
   - Status: 🟢 Operational

9. **File Storage**
   - Status: 🟢 Operational

---

### 7.5 Incident History

**Section Title:** "Recent Incidents"

**List (Last 30 Days):**
- Each incident:
  - Date + time
  - Component affected
  - Status: Investigating / Identified / Monitoring / Resolved
  - Description
  - Duration
  - Resolution notes (if resolved)

**Example:**
```
Dec 5, 2025 - 14:30 UTC
API - Increased Error Rates
Status: Resolved
Duration: 45 minutes
Description: We experienced elevated error rates on API requests. 
The issue was caused by a database connection pool limit and has been resolved.
```

**Empty State:**
- "No incidents reported in the last 30 days. 🎉"

---

### 7.6 Scheduled Maintenance

**Section:** "Upcoming Maintenance"

**If scheduled:**
- Date + time
- Components affected
- Expected duration
- Impact description

**Example:**
```
Dec 15, 2025 - 02:00-04:00 UTC
API - Database Upgrade
Expected Impact: Brief interruptions to API access
We'll be upgrading our database for improved performance.
```

---

### 7.7 Uptime History (Chart)

**Visual:** 90-day bar chart (each day = 1 bar)
- Green: 100% uptime
- Yellow: 99-99.9%
- Red: < 99%

**Hover:** Show exact uptime % for that day

---

### 7.8 Subscribe to Updates

**Section:** "Get Notified"

**Options:**
- Email notifications (enter email)
- SMS notifications (enter phone)
- Slack webhook
- RSS feed

---

## 8. Live Chat Widget (Optional - Future)

### 8.1 Purpose
- Provide instant support for simple questions
- Reduce ticket volume
- Increase user satisfaction

### 8.2 Implementation
- **Widget:** Bottom-right corner of every page (frithai.com, app.frithai.com, support.frithai.com)
- **Trigger:** Click chat icon to expand
- **Integration Options:**
  - Intercom
  - Zendesk Chat
  - Crisp Chat
  - Custom-built with Socket.io

### 8.3 Chat Widget Features

**Widget States:**
- **Collapsed:** Chat bubble icon with badge (unread count)
- **Expanded:** Chat window (350px × 500px)

**Chat Window:**

**Header:**
- "Chat with us"
- Status: "Online" or "Offline - Leave a message"
- Minimize / Close buttons

**Body:**
- **Welcome Message:**
  - "Hi [Name]! How can we help you today?"
  - Suggested topics (buttons):
    - "Billing question"
    - "Tool not working"
    - "Feature request"
    - "Other"

**Message Thread:**
- User messages (right)
- Agent messages (left)
- Typing indicators ("Agent is typing...")
- Read receipts

**Input Area:**
- Text input
- Attach file button
- Send button
- Emoji picker (optional)

**Footer:**
- "Powered by Frith AI" or integration badge

---

### 8.4 AI-Powered Responses (Phase 2)

**Feature:** Use Claude API to provide instant answers

**Flow:**
1. User asks question in chat
2. AI searches knowledge base for relevant articles
3. AI provides answer with source link
4. Option: "Was this helpful?" → Yes/No
5. If No: "Let me connect you with a human agent"

**Benefits:**
- Instant responses (24/7)
- Reduce human agent workload
- Consistent answers

---

## 9. Community Forum (Future)

### 9.1 Purpose
- Peer-to-peer support
- User-generated content (tips, best practices)
- Build community around Frith AI

### 9.2 Route
`/community` or `https://community.frithai.com`

### 9.3 Features
- **Categories:** General, Tips & Tricks, Feature Requests, Bug Reports, Show & Tell
- **Posts:** Title, body, tags, upvotes/downvotes, comments
- **User Profiles:** Reputation points, badges
- **Moderation:** Admin approval for new posts (initially)

---

## 10. Knowledge Base Management (Admin)

### 10.1 Article Management (in Admin Dashboard)

**Route:** `/admin/help-center` (covered in admin doc)

**Features:**
- Create, edit, delete articles
- Organize into categories
- Set publish status (Draft, Published)
- Track views, helpful votes
- SEO optimization (meta title, description)

---

## 11. Ticket Management (Admin)

### 11.1 Ticket Dashboard (in Admin Dashboard)

**Route:** `/admin/support/tickets` (covered in admin doc)

**Features:**
- View all tickets (table)
- Filter by status, priority, category
- Assign to agents
- Respond to tickets
- Internal notes
- Close tickets
- Merge duplicate tickets

---

## 12. Analytics & Metrics (Admin)

### 12.1 Support Metrics Dashboard

**Route:** `/admin/support/analytics`

**Metrics:**
- **Tickets Created:** Count by day/week/month
- **Tickets Resolved:** Count
- **Open Tickets:** Current count
- **Avg. First Response Time:** Target < 4 hours
- **Avg. Resolution Time:** Target < 24 hours
- **CSAT (Customer Satisfaction):** Based on "Was this helpful?" votes
- **Top Issues:** Most common ticket categories
- **Agent Performance:** Tickets resolved per agent, avg. response time

**Charts:**
- Tickets over time (line chart)
- Tickets by category (pie chart)
- Response time trends (line chart)

---

## 13. Email Templates (Resend)

### 13.1 Ticket Received Confirmation
```
Subject: Support Ticket Received: #[TICKET_ID]

Hi [Name],

Thank you for contacting Frith AI support.

Ticket ID: #[TICKET_ID]
Subject: [SUBJECT]
Status: Open

We've received your request and will respond within 24 hours.

View or update your ticket: [TICKET_URL]

In the meantime, check our Help Center for instant answers:
[HELP_CENTER_URL]

Best,
Frith AI Support Team
```

### 13.2 Agent Reply Notification
```
Subject: Reply to Support Ticket #[TICKET_ID]

Hi [Name],

[AGENT_NAME] has replied to your support ticket:

---
[AGENT_MESSAGE]
---

View and reply to your ticket: [TICKET_URL]

Best,
Frith AI Support Team
```

### 13.3 Ticket Resolved
```
Subject: Support Ticket Resolved: #[TICKET_ID]

Hi [Name],

Your support ticket has been marked as resolved.

Ticket ID: #[TICKET_ID]
Subject: [SUBJECT]

Was our response helpful?
[YES BUTTON] [NO BUTTON]

If you need further assistance, just reply to this email or reopen the ticket.

Best,
Frith AI Support Team
```

---

## 14. SEO Optimization (Help Center)

### 14.1 Article SEO

**Each article should have:**
- **Meta Title:** Unique, descriptive (50-60 chars)
- **Meta Description:** Compelling summary (150-160 chars)
- **URL Slug:** Clean, keyword-rich (e.g., `/how-to-run-ai-tool`)
- **H1 Tag:** One per page, main keyword
- **H2/H3 Tags:** Logical hierarchy
- **Internal Links:** Link to related articles
- **Alt Text:** All images have descriptive alt text

### 14.2 Structured Data (Schema.org)
- Implement HowTo schema for step-by-step guides
- FAQ schema for FAQ-style articles
- Article schema for blog posts

---

## 15. Accessibility (WCAG 2.1 AA)

### 15.1 Requirements
- Keyboard navigation (Tab, Enter, Esc)
- Screen reader support (ARIA labels)
- Color contrast ≥ 4.5:1
- Focus indicators
- Resizable text (up to 200%)
- Descriptive link text (no "click here")

### 15.2 Article Accessibility
- Proper heading hierarchy (H1 → H2 → H3)
- Alt text on images
- Transcripts for videos
- Captions for embedded videos

---

## 16. Performance Optimization

### 16.1 Targets
- Help Center homepage: < 1.5s load time
- Article pages: < 2s load time
- Search results: < 1s

### 16.2 Techniques
- Static generation (SSG) for articles
- Image optimization (WebP)
- Lazy loading images
- CDN delivery (Vercel)
- Search indexing (Algolia or custom)

---

## 17. Search Implementation

### 17.1 Options

**Option 1: Algolia (Recommended)**
- Fast, typo-tolerant search
- Instant results as you type
- Faceted search (filter by category)
- Highlighting of matched terms
- Analytics (track search queries)

**Option 2: Custom Search (Neon Full-Text Search)**
- PostgreSQL full-text search
- Lower cost
- More control
- Requires more development

### 17.2 Search Features
- Real-time suggestions
- Auto-complete
- Spelling correction
- Synonym handling ("billing" → "subscription")
- Search analytics (track what users search for)

---

## 18. Feedback Collection

### 18.1 Article Feedback

**At bottom of each article:**
- "Was this article helpful?" 👍👎
- If "No" clicked:
  - "How can we improve this article?" (textarea)
  - Submit button
  - Thank you message

**Admin View:**
- See feedback for each article
- Use to improve content
- Prioritize articles with low helpful ratio

### 18.2 General Feedback

**Footer link:** "Send Feedback"

**Feedback Form:**
- Type: Bug, Feature Request, General Feedback
- Message (textarea)
- Optional: Email (for follow-up)
- Submit

---

## 19. Database Schema (Support)

### 19.1 Help Articles Table
```sql
CREATE TABLE help_articles (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id UUID REFERENCES help_categories(id),
  status VARCHAR(50) DEFAULT 'draft', -- draft, published
  author_id UUID REFERENCES admin_users(id),
  meta_title VARCHAR(255),
  meta_description TEXT,
  views INT DEFAULT 0,
  helpful_votes INT DEFAULT 0,
  not_helpful_votes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 19.2 Help Categories Table
```sql
CREATE TABLE help_categories (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  parent_id UUID REFERENCES help_categories(id),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 19.3 Support Tickets Table
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL, -- #12345
  user_id UUID REFERENCES users(id),
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, waiting_on_user, resolved, closed
  assigned_to UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

### 19.4 Ticket Messages Table
```sql
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id),
  sender_id UUID, -- user_id or admin_user_id
  sender_type VARCHAR(50), -- user, admin
  message TEXT NOT NULL,
  attachments JSONB, -- array of file URLs
  internal_note BOOLEAN DEFAULT false, -- visible to admins only
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 19.5 Article Feedback Table
```sql
CREATE TABLE article_feedback (
  id UUID PRIMARY KEY,
  article_id UUID REFERENCES help_articles(id),
  user_id UUID REFERENCES users(id),
  helpful BOOLEAN, -- true = helpful, false = not helpful
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 20. API Endpoints (Support)

```javascript
// Help Center
GET    /api/help/articles          // List articles (with filters)
GET    /api/help/articles/:slug    // Get article by slug
GET    /api/help/categories        // List categories
GET    /api/help/search?q=[query]  // Search articles
POST   /api/help/articles/:id/feedback  // Submit article feedback

// Support Tickets (Authenticated)
GET    /api/tickets                // List user's tickets
POST   /api/tickets                // Create new ticket
GET    /api/tickets/:id            // Get ticket details
POST   /api/tickets/:id/messages   // Add message to ticket
PATCH  /api/tickets/:id            // Update ticket (e.g., close)
POST   /api/tickets/:id/attachments // Upload attachment

// System Status (Public)
GET    /api/status                 // Get current system status
GET    /api/status/history         // Get incident history
```

---

## 21. Launch Checklist

### Pre-Launch
- [ ] Write and publish 50+ help articles (cover all major topics)
- [ ] Organize articles into logical categories
- [ ] Set up ticket submission form
- [ ] Configure email notifications (Resend)
- [ ] Test search functionality
- [ ] Set up system status page
- [ ] Create email templates for ticket lifecycle
- [ ] Test mobile responsiveness
- [ ] Accessibility audit (WCAG)
- [ ] SEO optimization (meta tags, schema markup)
- [ ] Analytics setup (Google Analytics, track searches, popular articles)

### Post-Launch
- [ ] Monitor ticket volume and response times
- [ ] Track popular search queries (identify gaps in documentation)
- [ ] Review article feedback (improve low-rated articles)
- [ ] Add more articles based on common tickets
- [ ] A/B test help center layout and CTAs

---

## 22. Success Metrics (KPIs)

### Self-Service Success
- **Help Center Views:** Total article views per month
- **Search-to-Article Clicks:** % of searches that lead to article opens
- **Article Helpfulness:** Ratio of 👍 to 👎 votes
- **Deflection Rate:** % of users who find answer without submitting ticket

### Ticket Metrics
- **Tickets Created:** Count per month
- **First Response Time:** Target < 4 hours
- **Resolution Time:** Target < 24 hours
- **Ticket Volume Trend:** Should decrease as help center improves
- **CSAT Score:** Customer satisfaction (from follow-up surveys)

### Engagement
- **Active Users on Support Site:** Monthly unique visitors
- **Time on Site:** Avg. session duration
- **Return Visitors:** Users who come back to help center

---

## 23. Future Enhancements

### Phase 2 (6-12 months)
- **Live Chat** with AI-powered responses
- **Community Forum** for peer support
- **Video Tutorials** embedded in articles
- **Multilingual Support** (ES, FR, DE)
- **In-App Help Widget** (contextual help in dashboard)
- **Chatbot** for instant answers (next doc covers this)

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Status:** Ready for Design & Development  
**Next:** Integrate with ticketing system (Zendesk, Intercom, or custom)
