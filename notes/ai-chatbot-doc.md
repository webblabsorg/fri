# AI Chatbot Documentation
**Platform:** Frith AI - Legal AI Platform  
**Purpose:** Lead Generation, Conversion, Customer Support  
**Tech Stack:** Claude API, Next.js, WebSocket (Socket.io), Neon PostgreSQL  
**Placement:** frithai.com, app.frithai.com, support.frithai.com

---

## 1. Executive Summary

The AI Chatbot is a multi-purpose conversational agent powered by Claude AI that serves three critical functions:
1. **Lead Generation:** Engage website visitors, qualify leads
2. **Conversion:** Guide prospects through signup and upgrade decisions
3. **Support:** Answer user questions, reduce support ticket volume

### Goals
- Capture 30% more leads compared to static forms
- Increase free-to-paid conversion by 15%
- Reduce support ticket volume by 40%
- Provide 24/7 instant responses
- Collect valuable user insights (pain points, feature requests)

---

## 2. Chatbot Architecture

### 2.1 Technical Stack
- **AI Engine:** Claude 3.5 Sonnet (via Anthropic API)
- **Backend:** Next.js API Routes + WebSocket (Socket.io)
- **Frontend:** React component (widget)
- **Database:** Neon PostgreSQL (conversation logs, lead data)
- **Knowledge Base:** Vector embeddings (help articles, FAQs)
- **Integration:** CRM (HubSpot, Salesforce) for lead capture

### 2.2 Architecture Diagram
```
User Browser
    ↓
Chat Widget (React Component)
    ↓
WebSocket Connection (Socket.io)
    ↓
Next.js API Route (/api/chat)
    ↓
Claude API (AI Processing)
    ↓
Knowledge Base (Vector Search - Pinecone or pgvector)
    ↓
Response to User
    ↓
Log to Database (Neon)
```

---

## 3. Chatbot Widget Design

### 3.1 Widget Placement

**Where it appears:**
- **Marketing Site (frithai.com):** All pages except /sign-up, /sign-in
- **User Dashboard (app.frithai.com):** Contextual help (opt-in)
- **Support Center (support.frithai.com):** All pages
- **Admin Dashboard:** No chatbot (admins use ticket system)

### 3.2 Widget States

**State 1: Collapsed (Default)**
- **Position:** Bottom-right corner (fixed)
- **Appearance:** Circular button (64px diameter)
- **Icon:** Chat bubble with AI sparkle icon
- **Badge:** Red dot if unread message or notification
- **Label (optional):** "Need help?" (small text above button)
- **Animation:** Subtle pulse every 10 seconds (attention-getter)

**State 2: Expanded (Active Chat)**
- **Position:** Bottom-right corner (fixed)
- **Size:** 400px width × 600px height (desktop)
- **Size (Mobile):** Full screen or 90% height
- **Shadow:** Large shadow for depth
- **Z-index:** High (always on top)

---

### 3.3 Widget Header

**Header Components:**
- **Avatar:** Frith AI logo or bot character (48px circle)
- **Name:** "Frith Assistant" or "Legal AI Assistant"
- **Status Indicator:** 🟢 Online (always, since AI)
- **Subtitle:** "Powered by Claude AI"
- **Actions (Right):**
  - Minimize button (collapse to button)
  - Close button (X)

**Header Style:**
- Background: Brand gradient (blue → purple)
- Text: White
- Height: 80px

---

### 3.4 Chat Body

**Background:** Light gray (#F9FAFB) or white

**Message Bubbles:**

**Bot Messages (Left-Aligned):**
- Avatar (small, 32px)
- Bubble: White background, subtle shadow
- Text: Dark gray, 15px
- Timestamp: Light gray, 12px (below bubble)
- Max width: 80% of chat width
- Markdown support (bold, lists, links)
- Code blocks (syntax highlighted)

**User Messages (Right-Aligned):**
- No avatar (or small user avatar if logged in)
- Bubble: Brand color (blue), white text
- Timestamp: Light gray, 12px
- Max width: 80% of chat width

**Typing Indicator:**
- Show when bot is "thinking"
- Animation: Three dots bouncing
- Text: "Frith Assistant is typing..."

**Quick Replies (Buttons):**
- Below bot message
- Horizontally scrollable if many options
- Button style: Outline, brand color border
- Click → Sends that text as user message

---

### 3.5 Chat Input (Footer)

**Input Field:**
- Textarea (auto-expanding, max 5 lines)
- Placeholder: "Ask me anything..."
- Border: Light gray
- Focus: Brand color border

**Buttons:**
- **Attach File Icon** (optional, for support tickets)
- **Send Button:** Paper plane icon (brand color)
  - Disabled until text entered
  - Click or Enter to send

**Footer:**
- Small text: "Powered by Claude AI" (optional)
- Link: "Privacy Policy" (opens modal or new tab)

---

### 3.6 Widget Animations

**Opening Animation:**
- Slide up from bottom-right with ease-out
- Fade in (opacity 0 → 1)
- Duration: 300ms

**Closing Animation:**
- Slide down with ease-in
- Fade out
- Duration: 200ms

**Message Animations:**
- Fade in + slide up (subtle)
- Typing indicator appears immediately
- Message appears after AI response ready

---

## 4. Chatbot Modes & Context

### 4.1 Context Awareness

**The chatbot adapts based on:**
- **Page URL:** Different prompts for homepage vs pricing vs help center
- **User Status:** Anonymous visitor vs logged-in user
- **User Plan:** Free vs paid (if logged in)
- **Conversation History:** Remembers previous messages in session
- **Time on Site:** Trigger proactive messages after X seconds

---

### 4.2 Mode 1: Lead Generation (Marketing Site)

**Trigger:** Visitor on frithai.com (not logged in)

**Goals:**
- Capture email address
- Qualify lead (role, firm size, practice area)
- Book demo or guide to signup

**Example Conversation Flow:**

**Bot (Auto-Open after 30 seconds):**
```
👋 Hi there! I'm Frith Assistant, your AI guide.

I can help you:
• Learn about our 240+ legal AI tools
• See pricing and plans
• Schedule a demo
• Answer any questions

What brings you to Frith AI today?

[Quick Replies]
[Contract Analysis] [Legal Research] [Pricing Info] [Book Demo]
```

**User:** "I need help with contract review"

**Bot:**
```
Great! Our AI-powered contract review tools can:
✓ Analyze contracts in seconds
✓ Flag risky clauses
✓ Suggest redlines
✓ Extract key terms

We have 8 specialized contract tools. Are you currently using any contract review software?

[Quick Replies]
[Yes, switching] [No, first time] [Just exploring]
```

**User:** "No, first time"

**Bot:**
```
Perfect! I can show you how it works.

Quick question: What's your role?

[Quick Replies]
[Solo Practitioner] [Associate] [Partner] [In-House Counsel]
```

**User:** "Solo Practitioner"

**Bot:**
```
Awesome! Many solo practitioners love Frith AI because it saves them 10+ hours per week.

Want to see it in action? I can:
1. Start a free account (no credit card)
2. Schedule a personalized demo

What works better for you?

[Quick Replies]
[Start Free] [Book Demo]
```

**User:** "Start Free"

**Bot:**
```
Great choice! Let's get you started.

What's your email address? I'll send you a secure signup link.

[Input field appears]
```

**User:** *enters email*

**Bot:**
```
Perfect! I just sent a signup link to [email].

Check your inbox and click the link to create your account. You'll have instant access to:
• 15 free AI tool queries per month
• All 240+ tools to explore
• No credit card required

Need help getting started? I'll be here!

[Quick Reply]
[I didn't receive the email] [Take me to login]
```

**Lead Captured:** Save to database and send to CRM (HubSpot/Salesforce)

---

### 4.3 Mode 2: Conversion (Pricing Page / Upgrade)

**Trigger:** Visitor on /pricing or logged-in free user

**Goals:**
- Answer pricing questions
- Compare plans
- Handle objections
- Guide to checkout

**Example Conversation:**

**Bot (Proactive after 15 seconds on pricing page):**
```
👋 Looking at our plans?

I can help you choose the right one! What's most important to you?

[Quick Replies]
[Price] [Features] [Team Size] [Compare Plans]
```

**User:** "Compare plans"

**Bot:**
```
Sure! Here's a quick comparison:

**Starter ($79/mo):**
• 300 queries/month
• 15 AI tools
• Email support

**Professional ($199/mo):** ⭐ Most Popular
• 1,000 queries/month
• 35 AI tools
• Team collaboration
• Priority support

**Advanced ($499/mo):**
• Unlimited queries*
• All 240+ tools
• API access
• White-glove support

Most solo practitioners start with **Professional** and firms choose **Advanced**.

What's your firm size?

[Quick Replies]
[Solo] [2-10 people] [11-50] [50+]
```

**User:** "Solo"

**Bot:**
```
Got it! For solo practitioners, I'd recommend **Professional** ($199/mo).

Here's why:
• 1,000 queries = ~33 per day (plenty for most)
• Team features ready when you hire
• Priority support
• **45-day money-back guarantee** (try risk-free)

Plus, you'll save **10+ billable hours per week**. At $300/hr, that's $12,000/month in recovered time!

Want to upgrade now? I can apply a **10% discount for annual billing**.

[Quick Replies]
[Upgrade to Pro] [Try Free First] [I have a question]
```

**User:** "I have a question"

**Bot:**
```
Of course! What would you like to know?

[Input field]
```

**User:** "Can I cancel anytime?"

**Bot:**
```
Absolutely! You can cancel anytime—no contracts, no cancellation fees.

Plus, we offer a **45-day money-back guarantee**. If you're not satisfied for any reason in the first 45 days, we'll refund your payment. No questions asked.

Ready to give it a try?

[Quick Replies]
[Yes, upgrade now] [I need more time]
```

**User:** "Yes, upgrade now"

**Bot:**
```
Excellent! I'll take you to our secure checkout.

You'll get:
✓ Instant access to Professional plan
✓ 45-day money-back guarantee
✓ Priority support

[Button: Go to Checkout →]

Need help during checkout? I'll be here!
```

---

### 4.4 Mode 3: Customer Support (Logged-In Users)

**Trigger:** User on app.frithai.com or support.frithai.com

**Goals:**
- Answer product questions instantly
- Troubleshoot issues
- Reduce support ticket volume
- Escalate to human agent if needed

**Example Conversation:**

**Bot:**
```
👋 Hi [User Name]! How can I help you today?

[Quick Replies]
[Tool not working] [Billing question] [How to use a feature] [Other]
```

**User:** "Tool not working"

**Bot:**
```
I'm sorry to hear that! Let's figure this out.

Which tool are you having trouble with?

[Input field with autocomplete for tool names]
```

**User:** "Contract Review"

**Bot:**
```
Got it. What's happening when you try to run Contract Review?

[Quick Replies]
[Error message] [Nothing happens] [Slow/stuck] [Wrong output]
```

**User:** "Error message"

**Bot:**
```
Can you tell me what the error message says? Or take a screenshot and attach it here?

[Attach button enabled]
```

**User:** "Invalid file format"

**Bot (searches knowledge base):**
```
Ah, I see the issue! Contract Review accepts these file formats:
• PDF
• DOCX
• TXT

It looks like you might have uploaded a different format. Try converting your file to PDF or DOCX and run it again.

**How to convert:**
[Link: Convert files to PDF]

Did that help?

[Quick Replies]
[Yes, solved!] [No, still stuck] [I need more help]
```

**User:** "Yes, solved!"

**Bot:**
```
Awesome! Glad I could help 🎉

Anything else I can assist with?

[Quick Replies]
[No, I'm good] [Yes, another question]
```

**Bot (if user says "I need more help"):**
```
No problem! I'll connect you with our support team.

Would you like me to:
1. Create a support ticket (response < 24 hours)
2. Start a live chat with an agent (if available)

[Quick Replies]
[Create Ticket] [Live Chat]
```

---

### 4.5 Mode 4: Proactive Engagement

**Triggers:**
- User on page for 30+ seconds (marketing site)
- User on pricing page for 15+ seconds
- User abandons signup form (50% filled)
- User searches help center 3+ times (suggests confusion)

**Proactive Message Examples:**

**On Homepage (30 seconds):**
```
👋 Need help finding something? I can show you:
• How Frith AI works
• Pricing options
• Specific tools for your practice area

[Quick Replies]
[Show me tools] [See pricing] [I'm just browsing]
```

**On Signup Page (Exit Intent):**
```
Wait! Before you go...

Starting your free account takes less than 1 minute, and you'll get instant access to:
• 15 free AI tool queries
• All 240+ tools to explore
• No credit card required

Want to give it a try?

[Quick Replies]
[Yes, sign me up] [No, maybe later]
```

**After 3 Failed Searches:**
```
I noticed you're searching a lot. Can I help you find what you need?

What are you looking for?

[Input field]
```

---

## 5. AI Configuration & Prompts

### 5.1 System Prompt (Base)

```
You are Frith Assistant, an AI customer success agent for Frith AI, the leading legal AI platform with 240+ specialized tools for legal professionals.

Your goals:
1. Help visitors learn about Frith AI
2. Qualify leads and capture emails
3. Guide users to signup or upgrade
4. Answer product questions accurately
5. Troubleshoot issues and reduce support tickets
6. Be friendly, professional, and helpful

Context about Frith AI:
- Platform: 240+ AI legal tools for contract review, legal research, drafting, litigation support, and more
- Pricing: Free (15 queries/mo), Starter ($79/mo), Professional ($199/mo), Advanced ($499/mo)
- Key differentiator: Most comprehensive legal AI platform (competitors have 10-20 tools)
- 45-day money-back guarantee
- Powered by Claude AI (Anthropic)
- Target users: Solo practitioners, law firms, in-house counsel, legal ops

Tone: Professional yet approachable. Use legal terminology when appropriate, but explain complex concepts simply. Use emojis sparingly (1-2 per message max).

Constraints:
- Don't make up features that don't exist
- If you don't know something, say "I'm not sure, but let me connect you with our team"
- Don't provide legal advice (you're a product assistant, not a lawyer)
- Keep messages concise (2-4 sentences, use bullet points)
- Always provide quick reply options when possible

Now, respond to the user's message.
```

### 5.2 Context Injection (Dynamic)

**For each conversation, inject:**
- **Page URL:** "User is currently on: https://frithai.com/pricing"
- **User Status:** "User is logged in as [Name], plan: Free"
- **Previous Messages:** Last 10 messages in conversation
- **User Profile:** If logged in, include: name, email, plan, signup date, usage stats

**Example Context:**
```
Context:
- Page: https://frithai.com/pricing
- User: Anonymous visitor
- Time on page: 45 seconds
- Previous pages: Homepage → Features → Pricing
- No previous conversation

User message: "How much does this cost?"
```

### 5.3 Tool Integration (Function Calling)

**The bot can call functions to:**
- **Search Knowledge Base:** `search_kb(query)` → Returns relevant help articles
- **Get Tool Info:** `get_tool_info(tool_name)` → Returns tool details
- **Create Lead:** `create_lead(email, name, company, role)` → Saves to CRM
- **Check Subscription:** `get_subscription(user_id)` → Returns plan, usage
- **Create Ticket:** `create_support_ticket(user_id, subject, description)` → Creates ticket
- **Send Email:** `send_email(to, subject, body, template)` → Sends via Resend

**Example Flow:**
```
User: "How do I export a tool output to Word?"

Bot (internal):
1. Calls search_kb("export output to word")
2. Gets article: "Exporting Tool Outputs"
3. Responds with answer + link

Bot (response):
"To export a tool output to Microsoft Word:
1. After running a tool, click the 'Export' button
2. Select 'DOCX' format
3. Download the file

[Link: Detailed guide →]

Did that answer your question?"
```

---

## 6. Knowledge Base Integration

### 6.1 Vector Search for Instant Answers

**Implementation:**
- **Vector Database:** Pinecone, Weaviate, or pgvector (Neon extension)
- **Embedding Model:** OpenAI text-embedding-3-small or Anthropic embeddings
- **Content Indexed:**
  - All help center articles
  - FAQ pages
  - Tool descriptions
  - Pricing information
  - User guides

**Search Flow:**
1. User asks question
2. Convert question to vector embedding
3. Search vector DB for similar content
4. Retrieve top 3 most relevant articles
5. Feed to Claude as context
6. Claude generates answer with sources

**Benefits:**
- Instant answers from existing documentation
- No hallucination (grounded in real content)
- Always up-to-date (re-index when docs change)

---

## 7. Lead Capture & CRM Integration

### 7.1 Lead Qualification Criteria

**Qualifying Questions (Asked Naturally in Conversation):**
1. What's your role? (Solo, Associate, Partner, GC, etc.)
2. What's your firm size? (Solo, 2-10, 11-50, 50+)
3. What practice areas? (Litigation, Corporate, IP, etc.)
4. What's your biggest challenge? (Time, accuracy, cost, etc.)
5. Are you currently using any legal tech? (Yes/No, which ones)
6. Timeline to implement? (Urgent, 1-3 months, Just exploring)

**Lead Scoring:**
- High Value: Partner/GC + 11+ people + Urgent timeline
- Medium Value: Associate/Solo + 2-10 people + 1-3 months
- Low Value: Just exploring + No clear need

---

### 7.2 CRM Integration

**Supported CRMs:**
- HubSpot (recommended)
- Salesforce
- Pipedrive
- Custom webhook

**Data Synced to CRM:**
- **Contact Info:** Name, email, company, role
- **Conversation:** Full chat transcript
- **Lead Score:** High/Medium/Low
- **Source:** Which page they came from
- **Intent:** What they were interested in (pricing, demo, specific tool)
- **Timestamp:** When conversation started

**Automation:**
- High-value leads trigger instant email to sales team
- Medium leads added to nurture sequence
- All leads receive follow-up email with resources

---

## 8. Escalation to Human Support

### 8.1 When to Escalate

**Automatic Escalation Triggers:**
- User explicitly asks for human: "I want to talk to a person"
- Bot can't answer after 3 attempts
- Sentiment analysis detects frustration (negative tone)
- Billing or refund request (requires human)
- Security or privacy concern
- Account suspension or ban appeal

**User-Initiated Escalation:**
- "Connect me with support" button always visible in widget menu

---

### 8.2 Escalation Flow

**Option 1: Create Support Ticket**
```
I'll create a support ticket for you. Our team will respond within 24 hours.

What's the best summary of your issue?

[User types description]

[Bot creates ticket and shows ticket ID]

Your ticket #12345 has been created. We'll email you at [email] when we reply.
```

**Option 2: Live Chat with Agent (If Available)**
```
Let me connect you with a human agent.

[Transfer to live chat system]

Agent John has joined the chat.
```

**Option 3: Schedule Call/Demo**
```
Want to chat with someone on our team? Let's schedule a quick call.

[Embed Calendly widget]
```

---

## 9. Analytics & Optimization

### 9.1 Conversation Metrics

**Track (per conversation):**
- Start time, end time, duration
- Number of messages (bot vs user)
- Lead captured (yes/no)
- Conversion (signup/upgrade/demo booked)
- Escalation (ticket created, live chat, none)
- Sentiment (positive/neutral/negative)
- Drop-off point (if user abandons mid-conversation)

### 9.2 Aggregated Metrics (Admin Dashboard)

**Route:** `/admin/chatbot-analytics`

**Metrics:**
- **Conversations Started:** Total count per day/week/month
- **Avg. Conversation Length:** Messages per conversation
- **Lead Capture Rate:** % of conversations that capture email
- **Conversion Rate:** % of conversations that lead to signup/upgrade
- **Containment Rate:** % of conversations resolved without escalation
- **Top Questions:** Most common user queries (word cloud)
- **User Satisfaction:** Based on thumbs up/down at end of conversation

**Charts:**
- Conversations over time (line chart)
- Conversion funnel (visitors → conversations → leads → signups)
- Top intents (bar chart)

---

### 9.3 A/B Testing

**Test Variables:**
- Proactive message timing (30s vs 60s)
- Widget button color/style
- Bot personality (formal vs casual)
- Quick reply options
- Greeting message

**Goal:** Optimize for max conversions

---

## 10. Conversation Management (Admin)

### 10.1 Live Conversation Monitoring

**Route:** `/admin/chatbot/conversations`

**Features:**
- View all active conversations in real-time
- Filter by status (active, ended, escalated)
- Join conversation (admin takes over from bot)
- View conversation history
- Export transcripts

**Live Conversation Table:**
- Columns: User (email or "Anonymous"), Page, Duration, Status, Last Message, Actions
- Click row → View full conversation
- "Take Over" button → Admin can reply manually

---

## 11. User Feedback & Improvement

### 11.1 End-of-Conversation Feedback

**After Conversation Ends (User Closes Widget or Bot Asks):**
```
Thanks for chatting! Was I helpful?

[Quick Replies]
[👍 Yes] [👎 No]
```

**If Yes:**
```
Great! Anything else I can help with?

[Quick Replies]
[No, I'm good] [Yes, one more thing]
```

**If No:**
```
I'm sorry I couldn't help. Can you tell me what went wrong?

[Input field]

[Optional: Connect with human support]
```

**Data Collection:**
- Save feedback (helpful/not helpful)
- Save comments
- Use to improve bot prompts and knowledge base

---

## 12. Privacy & Security

### 12.1 Data Privacy

**User Consent:**
- Before starting conversation, show: "By using this chat, you agree to our [Privacy Policy]. Conversations may be recorded for quality and training."
- Checkbox: "I agree" (required to start)

**Data Handling:**
- All conversations encrypted in transit (TLS)
- Stored encrypted in Neon
- PII (email, name) masked in logs accessible to non-admins
- GDPR compliant (user can request conversation deletion)

**Retention:**
- Conversations stored for 90 days (configurable)
- After 90 days, archived or anonymized

---

### 12.2 Security

**Rate Limiting:**
- Max 20 messages per minute per user (prevent spam/abuse)
- Max 10 conversations per hour per IP (prevent bot abuse)

**Input Validation:**
- Sanitize user inputs (prevent XSS, injection)
- Block malicious links
- Filter profanity (optional)

**Admin Access:**
- Only admins with "Support" or "Super Admin" role can view conversations
- All conversation views logged in audit trail

---

## 13. Database Schema

### 13.1 Conversations Table
```sql
CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id), -- null if anonymous
  session_id VARCHAR(255) UNIQUE NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  lead_captured BOOLEAN DEFAULT false,
  email_captured VARCHAR(255),
  converted BOOLEAN DEFAULT false, -- signup or upgrade
  escalated BOOLEAN DEFAULT false,
  sentiment VARCHAR(50), -- positive, neutral, negative
  feedback VARCHAR(10), -- helpful, not_helpful
  feedback_comment TEXT
);
```

### 13.2 Messages Table
```sql
CREATE TABLE chatbot_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES chatbot_conversations(id),
  sender_type VARCHAR(50), -- user, bot, admin
  sender_id UUID, -- user_id or admin_user_id
  message TEXT NOT NULL,
  intent VARCHAR(100), -- classified intent (pricing, support, demo, etc.)
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 13.3 Leads Table (if not using external CRM)
```sql
CREATE TABLE chatbot_leads (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES chatbot_conversations(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  role VARCHAR(100),
  firm_size VARCHAR(50),
  practice_areas JSONB,
  lead_score VARCHAR(50), -- high, medium, low
  source_page TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 14. API Endpoints

```javascript
// Chat
POST   /api/chatbot/start          // Start new conversation
POST   /api/chatbot/message        // Send message
GET    /api/chatbot/conversation/:id // Get conversation history
POST   /api/chatbot/feedback       // Submit feedback
POST   /api/chatbot/escalate       // Escalate to human

// Admin
GET    /api/admin/chatbot/conversations    // List all conversations
GET    /api/admin/chatbot/analytics        // Get metrics
POST   /api/admin/chatbot/takeover         // Admin takes over conversation
```

---

## 15. Implementation Phases

### Phase 1: MVP (Months 1-2)
- Basic chat widget (collapsed/expanded states)
- Claude API integration
- Lead capture (email only)
- Simple knowledge base (hardcoded FAQs)
- No escalation (show "Contact support" link)
- Analytics: Basic conversation count

**Goal:** Launch on frithai.com homepage only

---

### Phase 2: Enhanced (Months 3-4)
- Vector search knowledge base (index help articles)
- Proactive engagement (trigger after 30s)
- Multi-page deployment (pricing, features, support)
- CRM integration (HubSpot)
- Escalation to support tickets
- Advanced analytics (conversion tracking)

**Goal:** Deployed across all marketing pages

---

### Phase 3: Advanced (Months 5-6)
- Live chat takeover (admin can join conversation)
- Sentiment analysis
- A/B testing framework
- Multi-language support (ES, FR, DE)
- Voice input (optional)
- Mobile optimization

**Goal:** Full-featured chatbot with human handoff

---

## 16. Cost Analysis

### 16.1 Claude API Costs

**Per Conversation:**
- Avg. conversation: 10 messages (5 user, 5 bot)
- Avg. input tokens: 500 per message (including context)
- Avg. output tokens: 300 per message
- Total per conversation: ~4,000 tokens

**Claude Sonnet Pricing (as of Dec 2025):**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

**Cost per conversation:**
- Input: (2,500 tokens × $3) / 1M = $0.0075
- Output: (1,500 tokens × $15) / 1M = $0.0225
- **Total: ~$0.03 per conversation**

**Monthly Cost Projections:**
- 1,000 conversations/month: $30
- 10,000 conversations/month: $300
- 50,000 conversations/month: $1,500

**ROI:**
- If chatbot captures 100 leads/month → 2 conversions (2%) → 2 × $199 (Pro plan) = $398 revenue
- Cost: $300 → **Positive ROI even at low conversion**

---

## 17. Success Metrics (KPIs)

### Lead Generation
- **Goal:** 500 leads captured per month (by Month 6)
- **Metric:** Email capture rate (target: 30% of conversations)

### Conversion
- **Goal:** Increase free-to-paid conversion by 15%
- **Metric:** % of chatbot conversations that lead to signup or upgrade

### Support Deflection
- **Goal:** Reduce support ticket volume by 40%
- **Metric:** % of conversations resolved without escalation (target: 70%)

### User Satisfaction
- **Goal:** 80%+ satisfaction (thumbs up)
- **Metric:** Helpful feedback ratio

---

## 18. Testing Checklist

### Functional Tests
- [ ] Widget loads on all pages
- [ ] Collapsed/expanded states work
- [ ] Messages send and receive correctly
- [ ] Quick replies work
- [ ] Typing indicator appears
- [ ] Lead capture form submits
- [ ] Email confirmation sent
- [ ] CRM integration works (lead syncs)
- [ ] Escalation creates ticket
- [ ] Conversation history persists
- [ ] Feedback submission works

### UX Tests
- [ ] Mobile responsive (full-screen on mobile)
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader accessible (ARIA labels)
- [ ] Fast response times (< 3s)
- [ ] Graceful error handling (network issues)

### Security Tests
- [ ] Input sanitization (no XSS)
- [ ] Rate limiting enforced
- [ ] Conversations encrypted
- [ ] Admin access controlled

---

## 19. Launch Checklist

### Pre-Launch
- [ ] Widget integrated on frithai.com
- [ ] Claude API configured
- [ ] System prompts tested
- [ ] Knowledge base indexed
- [ ] CRM integration tested
- [ ] Analytics tracking configured
- [ ] Mobile responsive
- [ ] Accessibility audit passed
- [ ] Privacy policy updated (mention chatbot)
- [ ] Support team trained (how to take over conversations)

### Post-Launch
- [ ] Monitor conversation volume
- [ ] Track lead capture rate
- [ ] Review conversation transcripts (identify gaps in knowledge)
- [ ] Optimize prompts based on feedback
- [ ] A/B test widget placement/timing

---

## 20. Future Enhancements

### Phase 4+ (12+ months)
- **Voice Chat:** Allow users to speak instead of type
- **Video Responses:** Bot can share video tutorials
- **Personalized Recommendations:** AI suggests specific tools based on user's practice area
- **Multi-Channel:** Integrate chatbot with WhatsApp, Slack, SMS
- **Predictive Lead Scoring:** ML model predicts likelihood to convert
- **Automated Follow-Ups:** Bot sends follow-up email 24 hours after conversation
- **Conversation Summaries:** Auto-generate summary for admin review

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Status:** Ready for Design & Development  
**Priority:** Phase 1 MVP (Lead capture on homepage) → Launch within 2 months
