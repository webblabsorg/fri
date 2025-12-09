# Landing Page & Inner Pages Documentation
**Platform:** Frith AI - Legal AI Platform  
**Domain:** https://frithai.com/  
**Tech Stack:** Next.js, Tailwind CSS, Shadcn UI, Vercel

---

## 1. Overview

The landing page serves as the primary marketing and conversion tool for Frith AI, showcasing the platform as the world's most comprehensive legal AI solution with 240+ specialized tools.

### Goals
- Convert visitors to sign-ups (free tier or paid plans)
- Establish authority and trust in the legal AI space
- Clearly communicate value proposition vs. competitors
- Drive traffic to specific CTAs: "Start for Free" and "Get Started"

---

## 2. Landing Page Structure

### 2.1 Header (Sticky)
**Position:** Fixed at top, transparent → solid on scroll  
**Components:**
- **Logo** (left): Frith AI wordmark + icon
- **Navigation Menu** (center):
  - Features
  - AI Tools (dropdown mega-menu with categories)
  - Pricing
  - Resources (dropdown: Blog, Case Studies, Documentation)
  - About
- **CTA Buttons** (right):
  - "Sign In" (ghost/outline button)
  - "Start for Free" (primary button, gradient)

**Mobile:** Hamburger menu with slide-in drawer

---

### 2.2 Hero Section
**Layout:** Full viewport height, split layout (60% content, 40% visual)

**Left Side:**
- **Headline:** "The #1 AI Platform Built for Legal Professionals"
- **Subheadline:** "240+ Specialized AI Tools. One Powerful Platform. Save 10+ Hours Every Week."
- **Feature Pills:**
  - ✓ Contract Analysis in Seconds
  - ✓ Legal Research Powered by Claude AI
  - ✓ 45-Day Money-Back Guarantee
- **CTA Buttons:**
  - Primary: "Start for Free" → /sign-up
  - Secondary: "Book a Demo" → /demo (calendly integration)
- **Trust Badge:** "Trusted by 5,000+ Legal Professionals" (update dynamically)
- **Platform Badges:** "SOC2 Compliant • GDPR Ready • ABA Tech Show 2025"

**Right Side:**
- Animated product screenshot/demo video (looping)
- Dashboard preview with tool cards animating in
- OR: 3D illustration of legal documents being processed

**Background:** Gradient (deep blue → purple), subtle legal-themed patterns (scales, gavels as watermark)

---

### 2.3 Social Proof Section
**Layout:** Horizontal scrolling logos (infinite loop)

**Content:**
- "Trusted by Leading Law Firms & Legal Professionals"
- Logos: 12-20 placeholder firm logos (anonymized or "Law Firm Partners")
- Animated testimonial cards (rotating carousel)

**Testimonials (3-5 rotating):**
```
"Frith AI reduced our contract review time from 3 hours to 15 minutes. Game-changer for our practice."
— Sarah Johnson, Partner, Johnson & Associates

"The legal research tools are more comprehensive than Lexis+ at a fraction of the cost."
— Michael Chen, Solo Practitioner

"Finally, an AI platform that understands legal workflows. The Bluebook citations are spot-on."
— David Williams, Corporate Counsel
```

---

### 2.4 Problem/Solution Section
**Layout:** 2-column alternating (image-text-image-text)

**Block 1: The Problem**
- **Headline:** "Legal Work Shouldn't Take This Long"
- **Pain Points:**
  - ⏰ Hours wasted on document review
  - 💸 $400-600/hour billing lost to manual work
  - 😓 Junior associates burned out on repetitive tasks
  - 🔍 Inefficient legal research across multiple platforms
- **Visual:** Illustration of overwhelmed lawyer with stacks of papers

**Block 2: The Solution**
- **Headline:** "AI That Actually Understands Law"
- **Solutions:**
  - ⚡ Instant contract analysis with risk flagging
  - 🎯 AI-powered legal research with citations
  - 📝 Automated drafting for briefs, memos, pleadings
  - 🤝 Team collaboration and matter management
- **Visual:** Clean dashboard screenshot showing tool execution

---

### 2.5 Tool Categories Showcase
**Layout:** Grid with hover effects (3 columns desktop, 1 column mobile)

**Headline:** "240+ AI Tools Across Every Practice Area"

**Categories (display 12, link to "See All Tools"):**

1. **Legal Research & Case Law** (10 tools)
   - Icon: Search/magnifying glass
   - Quick preview: "Conversational research, case summaries, citation validation"
   - CTA: "Explore Tools →"

2. **Contract Drafting & Review** (20 tools)
   - Icon: Document with pen
   - Quick preview: "Draft NDAs, review vendor agreements, extract clauses"

3. **Litigation Support** (10 tools)
   - Icon: Gavel
   - Quick preview: "Deposition summaries, discovery requests, trial prep"

4. **Due Diligence** (7 tools)
   - Icon: Checklist
   - Quick preview: "M&A analysis, regulatory compliance, risk assessment"

5. **Medical-Legal** (4 tools)
   - Icon: Medical cross + legal
   - Quick preview: "Medical record summaries, Howell charts, life care plans"

6. **IP & Patents** (5 tools)
   - Icon: Lightbulb
   - Quick preview: "Prior art search, trademark analysis, patent drafting"

[...continue for all 26 categories]

**Visual Treatment:**
- Card design with icon, title, tool count, description
- Hover: Lift effect, show "Most Popular Tool" tag
- Click: Navigate to category detail page

---

### 2.6 Features Deep Dive
**Layout:** Tabbed interface or accordion

**Headline:** "Built for How Lawyers Actually Work"

**Tabs:**
1. **AI-Powered Research**
   - Natural language queries
   - Multi-jurisdiction support
   - Automatic Bluebook citations
   - Source provenance & chain of custody
   - Screenshot: Research tool with citations panel

2. **Document Intelligence**
   - Contract review & redlining
   - Clause extraction & comparison
   - Risk identification with confidence scores
   - Batch processing for high-volume work
   - Screenshot: Contract analysis dashboard

3. **Team Collaboration**
   - Workspaces for cases/matters
   - Role-based permissions
   - Comment threads on outputs
   - Audit logs for compliance
   - Screenshot: Team workspace view

4. **Enterprise Security**
   - SOC2 Type II certified
   - Data encryption at rest & in transit
   - SSO (SAML/OAuth) + 2FA
   - On-premise deployment options
   - Screenshot: Security settings panel

5. **Integrations**
   - Microsoft Word add-in
   - Clio, iManage, NetDocuments sync
   - Email integration (Outlook/Gmail)
   - Zapier for custom workflows
   - Screenshot: Integrations marketplace

---

### 2.7 Competitive Comparison
**Layout:** Comparison table (horizontal scroll on mobile)

**Headline:** "More Tools. Better Price. Unmatched Value."

| Feature | Frith AI | Harvey AI | CoCounsel | Lexis+ AI | Spellbook |
|---------|----------|-----------|-----------|-----------|-----------|
| **AI Tools** | 240+ | ~10 | ~15 | ~25 | ~20 |
| **Starting Price** | $79/mo | $300/mo | $500/mo | Custom | $399/mo |
| **Money-Back Guarantee** | 45 days | None | 7 days | None | 14 days |
| **Free Tier** | ✓ Yes | ✗ No | ✗ No | ✗ No | ✗ No |
| **Team Collaboration** | ✓ Yes | ✓ Yes | Limited | ✓ Yes | Limited |
| **Custom AI Models** | Claude Sonnet/Opus | GPT-4 | GPT-4 | Custom | GPT-4 |
| **API Access** | ✓ Yes | Enterprise | ✗ No | Enterprise | ✗ No |
| **Integrations** | 15+ | 5+ | 3+ | 10+ | 5+ |

**Footer Note:** "Pricing as of December 2025. Competitor features vary by plan."

---

### 2.8 Pricing Preview
**Layout:** 3-column cards (4 if including Enterprise)

**Headline:** "Transparent Pricing. No Hidden Fees."

**Starter - $79/month**
- 300 queries/month
- 15 AI tools
- Claude Haiku AI
- Email support
- 1 user
- CTA: "Start Free Trial" (misleading - change to "Get Started")

**Professional - $199/month** ⭐ MOST POPULAR
- 1,000 queries/month
- 35 AI tools
- Claude Sonnet AI
- Priority support
- Up to 3 users
- Team collaboration
- CTA: "Get Started"

**Advanced - $499/month**
- Unlimited queries*
- All 240+ tools
- Claude Sonnet + Opus
- White-glove support
- Unlimited users
- API access
- Custom integrations
- CTA: "Get Started"

**Enterprise - Custom**
- Everything in Advanced
- Dedicated account manager
- SSO & SCIM provisioning
- Custom SLAs
- On-premise deployment
- CTA: "Contact Sales"

**Below Cards:**
- "✓ 45-Day Money-Back Guarantee on All Plans"
- "✓ No Setup Fees • Cancel Anytime • Secure Payments"
- Link: "See Full Pricing Details →" /pricing

---

### 2.9 Use Cases Section
**Layout:** Horizontal cards (scrollable)

**Headline:** "Frith AI Across Every Practice Area"

**Use Cases (6 cards):**
1. **Corporate Law**
   - "Draft M&A documents, review vendor contracts, automate due diligence"
   - Icon: Briefcase
   - CTA: "See Corporate Tools →"

2. **Litigation**
   - "Summarize depositions, draft motions, research case law"
   - Icon: Courthouse

3. **Personal Injury**
   - "Analyze medical records, calculate damages, draft demand letters"
   - Icon: Medical case

4. **Employment Law**
   - "Review employment agreements, draft policies, compliance checks"
   - Icon: People

5. **Intellectual Property**
   - "Patent prior art, trademark searches, licensing agreements"
   - Icon: Lightbulb

6. **Real Estate**
   - "Lease review, closing documents, title analysis"
   - Icon: Building

---

### 2.10 Video Demo Section
**Layout:** Full-width video embed

**Headline:** "See Frith AI in Action"
**Subheadline:** "Watch how we helped Johnson & Associates save 15 hours per week"

**Video Content (2-3 minutes):**
- Problem: Overwhelmed solo practitioner
- Solution walkthrough: Running contract analysis tool
- Results: Side-by-side comparison (before/after)
- Testimonial overlay

**Below Video:**
- CTA: "Start Your Free Account" → /sign-up
- Secondary: "Schedule a Demo" → /demo

---

### 2.11 FAQ Section
**Layout:** 2-column accordion (expand/collapse)

**Headline:** "Frequently Asked Questions"

**Questions (12-15):**
1. **How is Frith AI different from ChatGPT?**
   - "We're specifically trained on legal workflows with 240+ specialized tools, Bluebook citations, and compliance features ChatGPT lacks."

2. **Is my data secure and confidential?**
   - "Yes. All data is encrypted end-to-end. We're SOC2 certified and never use your data to train models. Learn more in our Security Center."

3. **Do I need technical skills to use Frith AI?**
   - "No. Our platform is designed for lawyers, not engineers. If you can use Microsoft Word, you can use Frith AI."

4. **Can I try before I buy?**
   - "Yes! We offer a free tier (15 queries/month) and a 45-day money-back guarantee on all paid plans."

5. **What AI models do you use?**
   - "We use Anthropic's Claude Sonnet and Opus models, which are the most advanced legal AI systems available."

6. **Does Frith AI replace lawyers?**
   - "No. Frith AI is a tool to enhance your practice, not replace it. You maintain full control and judgment."

7. **Can I integrate with my existing tools?**
   - "Yes. We integrate with Microsoft Word, Clio, iManage, NetDocuments, and 15+ other platforms."

8. **What if I exceed my query limit?**
   - "You'll receive a notification and can upgrade mid-month. We never cut off access unexpectedly."

9. **Is there a discount for law firms?**
   - "Yes. Enterprise plans (5+ users) receive volume discounts. Contact sales for custom pricing."

10. **How accurate is the AI?**
    - "Our AI achieves 95%+ accuracy on legal tasks, but we always recommend human review. We show confidence scores on all outputs."

[...additional FAQs]

---

### 2.12 Final CTA Section
**Layout:** Full-width gradient background

**Headline:** "Ready to Transform Your Legal Practice?"
**Subheadline:** "Join 5,000+ legal professionals using AI to work smarter, not harder."

**CTA Buttons:**
- Primary: "Start for Free" (large, prominent)
- Secondary: "Schedule a Demo"

**Trust Elements:**
- Payment icons: Visa, Mastercard, Amex, PayPal
- Security badges: SOC2, GDPR, SSL
- "45-Day Money-Back Guarantee • No Credit Card Required for Free Tier"

---

### 2.13 Footer
**Layout:** 4-column grid (mobile stacks)

**Column 1: Company**
- About Us
- Careers
- Press Kit
- Contact
- Blog

**Column 2: Product**
- Features
- AI Tools
- Pricing
- Integrations
- API Documentation
- Roadmap

**Column 3: Resources**
- Help Center → support.frithai.com
- Documentation
- Case Studies
- Legal Research Guide
- Webinars
- Status Page

**Column 4: Legal**
- Terms of Service
- Privacy Policy
- Cookie Policy
- GDPR Compliance
- Security
- Acceptable Use Policy

**Bottom Bar:**
- Copyright: "© 2025 Frith AI. All rights reserved."
- Social Links: LinkedIn, Twitter, YouTube, GitHub
- Language selector: EN (future: ES, FR, DE)

---

## 3. Inner Pages Structure

### 3.1 /features
**Purpose:** Detailed breakdown of platform capabilities

**Sections:**
- Hero: "Everything You Need to Practice Law Smarter"
- Feature categories (6-8 blocks with visuals)
- Integration showcase
- Security & compliance deep dive
- Customer testimonials
- CTA: Sign up or book demo

---

### 3.2 /pricing
**Purpose:** Full pricing comparison and FAQ

**Sections:**
- Pricing table (all 4 tiers)
- Feature comparison matrix (expanded)
- Billing FAQs
- Calculator: "How much will I save?"
- ROI calculator: Input billable rate → show annual savings
- Enterprise inquiry form
- CTA: Choose a plan

---

### 3.3 /ai-tools
**Purpose:** Comprehensive tool directory

**Layout:** Filterable/searchable grid

**Sections:**
- Hero: "240+ AI Tools at Your Fingertips"
- Category filter sidebar (26 categories)
- Tool cards with:
  - Name, description, category tags
  - "Try Free" or "Requires Pro" badge
  - Quick view modal with demo
- Most popular tools (top 10)
- Recently added tools
- CTA: Sign up to access

---

### 3.4 /ai-tools/[category]
**Purpose:** Category-specific landing pages

**Example:** /ai-tools/contract-review

**Sections:**
- Hero: Category name + description
- Tool list (expanded cards)
- Use cases specific to category
- Tutorial video
- Related categories
- CTA: Try tools

---

### 3.5 /about
**Purpose:** Company story and mission

**Sections:**
- Mission statement: "Democratizing legal AI"
- Team photos (optional for now)
- Company values
- Milestones timeline
- Press mentions
- CTA: Join our team (careers) or contact

---

### 3.6 /blog
**Purpose:** Content marketing and SEO

**Layout:** Card grid (3 columns)

**Sections:**
- Featured post (hero)
- Category filters: Legal Tech, AI, Practice Tips, Product Updates
- Article cards: thumbnail, title, excerpt, author, date, read time
- Pagination
- Newsletter signup sidebar
- CTA: Read more articles

---

### 3.7 /blog/[slug]
**Purpose:** Individual blog post

**Layout:** Single column, centered (max 800px width)

**Components:**
- Hero image
- Title, author, date, read time, share buttons
- Table of contents (sticky sidebar)
- Article content (rich text, code blocks, images)
- Related articles (bottom)
- Author bio
- Comments section (optional)
- CTA: Try Frith AI

---

### 3.8 /case-studies
**Purpose:** Customer success stories

**Layout:** Grid of case study cards

**Card Content:**
- Company logo (anonymized: "Mid-size IP Firm")
- Key metrics: "Saved 20 hours/week" "Reduced contract review by 80%"
- CTA: Read full story

**Individual Case Study Page:**
- Challenge
- Solution (how they use Frith AI)
- Results (with data/charts)
- Testimonial quote
- CTA: See similar results

---

### 3.9 /demo
**Purpose:** Lead capture for sales team

**Layout:** Form + calendar

**Sections:**
- Hero: "See Frith AI in Action"
- Benefits of demo call
- Calendly embed (15/30 min slots)
- Form fields:
  - Name, Email, Phone
  - Law firm/company name
  - Role (dropdown: Partner, Associate, Admin, Other)
  - Firm size (dropdown: Solo, 2-10, 11-50, 51-200, 200+)
  - Practice areas (multi-select)
  - What brings you to Frith AI? (textarea)
- Auto-confirmation email via Resend
- CTA: "Book Your Demo"

---

### 3.10 /contact
**Purpose:** General inquiries

**Layout:** Split (form + contact info)

**Left Side (Form):**
- Name, Email, Subject, Message
- Department dropdown: Sales, Support, Partnerships, Press, Other
- Submit button
- "We'll respond within 24 hours"

**Right Side (Info):**
- Email: hello@frithai.com
- Support: support@frithai.com
- Sales: sales@frithai.com
- Address (if applicable)
- Social links
- Live chat widget (future)

---

### 3.11 /terms
**Purpose:** Terms of Service (legal compliance)

**Sections:**
1. Acceptance of Terms
2. Description of Service
3. User Accounts & Security
4. Acceptable Use Policy
5. Intellectual Property
6. Payment Terms
7. Subscription & Cancellation
8. Warranties & Disclaimers
9. Limitation of Liability
10. Dispute Resolution & Arbitration
11. Changes to Terms
12. Contact Information

**Last Updated:** Date stamp (auto-update)

---

### 3.12 /privacy
**Purpose:** Privacy Policy (GDPR/CCPA compliance)

**Sections:**
1. Information We Collect
2. How We Use Your Information
3. Data Sharing & Disclosure
4. Data Security
5. Your Rights (GDPR, CCPA)
6. Cookies & Tracking
7. Data Retention
8. International Transfers
9. Children's Privacy
10. Changes to Policy
11. Contact for Privacy Concerns

**Last Updated:** Date stamp

---

### 3.13 /cookie-policy
**Purpose:** Cookie usage transparency

**Sections:**
- What are cookies?
- Types of cookies we use (essential, analytics, marketing)
- Third-party cookies (Google Analytics, Stripe, etc.)
- How to manage cookies
- Cookie preference center (allow/deny by category)

---

### 3.14 /security
**Purpose:** Security & compliance information

**Sections:**
- Security overview
- Certifications (SOC2, ISO, GDPR)
- Data encryption
- Access controls
- Incident response
- Penetration testing
- Compliance documentation
- Security whitepaper download
- CTA: Enterprise security inquiry

---

### 3.15 /careers (future)
**Purpose:** Recruitment

**Sections:**
- Company culture
- Open positions (job board integration)
- Benefits & perks
- Application process
- CTA: View openings

---

## 4. Design System & Components

### 4.1 Colors (Tailwind Config)
```javascript
colors: {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9', // Main brand blue
    600: '#0284c7',
    700: '#0369a1',
  },
  secondary: {
    500: '#8b5cf6', // Purple accent
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    800: '#1f2937',
    900: '#111827',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
}
```

### 4.2 Typography
- **Headings:** Inter (bold, semi-bold)
- **Body:** Inter (regular, medium)
- **Code/Technical:** Fira Code

**Sizes:**
- H1: 3.5rem (desktop), 2.5rem (mobile)
- H2: 2.5rem (desktop), 2rem (mobile)
- H3: 2rem
- Body: 1rem (16px base)

### 4.3 Shadcn Components Used
- Button (primary, secondary, ghost, outline variants)
- Card (for tool cards, pricing cards)
- Accordion (FAQ section)
- Tabs (features deep dive)
- Dialog/Modal (tool quick view)
- Badge (tool categories, "New" tags)
- Input, Textarea, Select (forms)
- Navbar/Navigation Menu (header)
- Carousel (testimonials)
- Separator
- Tooltip

### 4.4 Animations
- Fade in on scroll (using Framer Motion or CSS)
- Hover effects on cards (lift + shadow)
- Smooth scroll to sections
- Typing animation for hero headline
- Number counter for metrics ("5,000+ users")
- Logo carousel (infinite loop)

---

## 5. SEO & Meta Tags

### 5.1 Homepage Meta
```html
<title>Frith AI - #1 AI Platform for Legal Professionals | 240+ Tools</title>
<meta name="description" content="The most comprehensive AI platform for lawyers. 240+ specialized tools for legal research, contract review, document drafting, and more. Try free today." />
<meta name="keywords" content="legal AI, AI for lawyers, contract review AI, legal research AI, law firm software" />
<link rel="canonical" href="https://frithai.com/" />
```

### 5.2 Open Graph (Social Sharing)
```html
<meta property="og:title" content="Frith AI - AI Platform for Legal Professionals" />
<meta property="og:description" content="240+ AI tools for legal research, drafting, and review. Save 10+ hours/week." />
<meta property="og:image" content="https://frithai.com/og-image.png" />
<meta property="og:url" content="https://frithai.com/" />
<meta property="og:type" content="website" />
```

### 5.3 Twitter Cards
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Frith AI - AI for Legal Professionals" />
<meta name="twitter:description" content="240+ specialized AI tools. Start free." />
<meta name="twitter:image" content="https://frithai.com/twitter-card.png" />
```

---

## 6. Technical Implementation (Next.js)

### 6.1 Project Structure
```
frithai.com/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── features/page.tsx
│   ├── pricing/page.tsx
│   ├── ai-tools/
│   │   ├── page.tsx             # Tool directory
│   │   └── [category]/page.tsx  # Category pages
│   ├── about/page.tsx
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── case-studies/
│   ├── demo/page.tsx
│   ├── contact/page.tsx
│   ├── terms/page.tsx
│   ├── privacy/page.tsx
│   ├── cookie-policy/page.tsx
│   ├── security/page.tsx
│   └── layout.tsx               # Root layout with header/footer
├── components/
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── SocialProof.tsx
│   │   ├── Features.tsx
│   │   ├── ToolCategories.tsx
│   │   ├── Pricing.tsx
│   │   ├── FAQ.tsx
│   │   └── FinalCTA.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MobileMenu.tsx
│   └── ui/                      # Shadcn components
├── lib/
│   ├── utils.ts
│   └── constants.ts             # Tool categories, pricing tiers
└── public/
    ├── images/
    └── videos/
```

### 6.2 Key Features
- **Static Generation (SSG)** for marketing pages (fast loading)
- **Incremental Static Regeneration (ISR)** for blog posts
- **Server Components** for performance
- **Client Components** for interactive elements (forms, animations)
- **Image Optimization** (next/image)
- **Font Optimization** (next/font)

### 6.3 Performance Targets
- **Lighthouse Score:** 95+ on all metrics
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Core Web Vitals:** Pass all

---

## 7. Conversion Optimization

### 7.1 Primary CTAs
- "Start for Free" (appears 5+ times on homepage)
- "Get Started" (pricing cards)
- "Book a Demo" (hero, video section, footer)

### 7.2 Friction Reduction
- No credit card required for free tier
- 45-day guarantee prominently displayed
- Social proof (logos, testimonials) above fold
- Live chat widget (future)
- Exit-intent popup: "Wait! Get 10 free tool runs" (email capture)

### 7.3 A/B Testing (Future)
- Hero headline variations
- CTA button colors/copy
- Pricing display (annual vs monthly default)
- Video vs static hero image

---

## 8. Analytics & Tracking

### 8.1 Google Analytics 4
- Page views
- User flow through funnel
- CTA click tracking
- Scroll depth
- Video engagement

### 8.2 Custom Events
- "Start for Free" button clicks
- Demo booking submissions
- Tool category exploration
- Pricing page visits
- FAQ expansion

### 8.3 Heatmaps (Hotjar/Microsoft Clarity)
- Click patterns
- Scroll maps
- Session recordings (opt-in)

---

## 9. Content Management

### 9.1 Blog Posts
- **Source:** MDX files in `/content/blog/` OR headless CMS (Sanity/Contentful)
- **Frequency:** 2-3 posts per week
- **Topics:** Legal AI trends, practice tips, product updates, customer stories

### 9.2 Tool Catalog
- **Source:** JSON file or database (Neon)
- **Structure:**
```json
{
  "id": "contract-review-001",
  "name": "Contract Review & Redlining",
  "category": "contract-review",
  "description": "AI-powered contract analysis with suggested edits",
  "features": ["Risk flagging", "Clause extraction", "Redlining"],
  "pricing_tier": "professional",
  "popular": true
}
```

---

## 10. Accessibility

### 10.1 WCAG 2.1 AA Compliance
- Color contrast ratio ≥ 4.5:1
- Keyboard navigation for all interactive elements
- ARIA labels on buttons/links
- Alt text on all images
- Skip navigation links
- Focus indicators

### 10.2 Screen Reader Support
- Semantic HTML (header, nav, main, section, footer)
- Proper heading hierarchy (H1 → H2 → H3)
- Descriptive link text (no "click here")

---

## 11. Mobile Responsiveness

### 11.1 Breakpoints (Tailwind)
- **sm:** 640px
- **md:** 768px
- **lg:** 1024px
- **xl:** 1280px
- **2xl:** 1536px

### 11.2 Mobile-Specific Changes
- Hamburger menu
- Stacked hero layout (text above image)
- Single-column grids
- Touch-friendly button sizes (min 44x44px)
- Simplified tables (horizontal scroll)

---

## 12. Internationalization (Future)

### 12.1 Initial Launch
- **English (US)** only

### 12.2 Phase 2
- Spanish (LATAM market)
- French (Canada, Europe)
- German (Europe)

### 12.3 Implementation
- Next.js i18n routing
- Translation files (JSON)
- Locale-specific pricing (currency conversion)

---

## 13. Legal & Compliance Pages

### 13.1 /terms (Terms of Service)
- **Template:** Use Termly or custom legal review
- **Key Sections:** User obligations, payment terms, data usage, liability limitations

### 13.2 /privacy (Privacy Policy)
- **Compliance:** GDPR, CCPA, PIPEDA
- **Key Sections:** Data collection, usage, sharing, user rights (access, deletion, portability)

### 13.3 /cookie-policy
- **Cookie Banner:** Appear on first visit, allow/deny granular categories
- **Integration:** Cookiebot or OneTrust (or custom)

---

## 14. Third-Party Integrations

### 14.1 Email (Resend)
- Transactional emails (welcome, password reset)
- Marketing emails (newsletter, product updates)
- Demo booking confirmations

### 14.2 Payments (Stripe + PayPal)
- Stripe Checkout for subscriptions
- PayPal alternative payment
- Invoice generation (Stripe Billing)

### 14.3 Support (Intercom or Zendesk - future)
- Live chat widget
- Help center integration
- Ticket submission

### 14.4 Demo Scheduling (Calendly)
- Embed on /demo page
- Sales team calendar sync

### 14.5 Analytics
- Google Analytics 4
- Microsoft Clarity (free heatmaps)
- Vercel Analytics (performance)

---

## 15. Deployment & Hosting

### 15.1 Vercel Configuration
- **Domain:** frithai.com
- **Framework:** Next.js (auto-detected)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment Variables:**
  - `NEXT_PUBLIC_SITE_URL`
  - `STRIPE_PUBLISHABLE_KEY`
  - `RESEND_API_KEY`
  - `GA_MEASUREMENT_ID`

### 15.2 Custom Domain Setup
1. Add domain in Vercel dashboard
2. Update DNS records (A/CNAME)
3. Enable automatic SSL (Let's Encrypt)

### 15.3 Preview Deployments
- Every git push creates preview URL
- Share with team for review before merging to production

---

## 16. Performance Optimization

### 16.1 Image Optimization
- Use `next/image` for all images
- WebP format with fallbacks
- Lazy loading below fold
- CDN delivery via Vercel

### 16.2 Code Splitting
- Dynamic imports for heavy components
- Route-based splitting (automatic in Next.js)

### 16.3 Caching
- Static pages cached at edge (Vercel CDN)
- API responses cached (ISR)

---

## 17. Security

### 17.1 Headers
```javascript
// next.config.js
headers: [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ],
  },
]
```

### 17.2 CSP (Content Security Policy)
- Restrict script sources
- Prevent XSS attacks

### 17.3 Rate Limiting
- Demo form submissions: 5 per hour per IP
- Contact form: 3 per hour per IP

---

## 18. Launch Checklist

### Pre-Launch
- [ ] All pages designed and reviewed
- [ ] Mobile responsiveness tested
- [ ] Accessibility audit passed
- [ ] SEO meta tags added
- [ ] Google Analytics configured
- [ ] Forms tested (demo, contact)
- [ ] Payment integration tested (Stripe/PayPal)
- [ ] Legal pages reviewed (terms, privacy)
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] 404 page designed
- [ ] Favicon and social share images added

### Post-Launch
- [ ] Submit sitemap to Google Search Console
- [ ] Monitor analytics for 48 hours
- [ ] A/B test hero CTA
- [ ] Gather user feedback
- [ ] Fix any bugs reported

---

## 19. Future Enhancements

### Phase 2 (3-6 months post-launch)
- Live chat support widget
- Interactive tool demos (try without signup)
- Customer success stories video library
- Webinar series landing pages
- Partner/affiliate program page
- Comparison pages (/frith-vs-harvey, /frith-vs-cocounsel)

### Phase 3 (6-12 months)
- Multilingual support (ES, FR, DE)
- Regional pricing
- Community forum
- Legal resource library (whitepapers, guides)
- Certification program for power users

---

## 20. Success Metrics (KPIs)

### Traffic
- **Goal:** 50,000 monthly visitors by Month 6
- **Sources:** Organic search (40%), paid ads (30%), referrals (20%), direct (10%)

### Conversion
- **Goal:** 5% visitor → signup conversion
- **Free tier signups:** 2,500/month by Month 6
- **Paid conversions:** 2% of free tier → paid (50 paid users/month)

### Engagement
- **Avg. session duration:** 3+ minutes
- **Pages per session:** 4+
- **Bounce rate:** < 40%

### Revenue
- **Month 6 MRR:** $21,000 (from pricing model doc)

---

## Contact for Landing Page Team

**Questions?** Contact:
- Product: [Product Manager Email]
- Design: [Designer Email]
- Engineering: [Dev Lead Email]

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Status:** Ready for Design & Development
