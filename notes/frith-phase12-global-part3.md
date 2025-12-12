# FRITH AI - PHASE 12 PART 3: GLOBAL FEATURES & UPDATED PRICING

---

## Module 11: Integrations & API Ecosystem (continued)

**Core Integrations (continued):**
- [ ] **Communication (continued):**
  - Outlook (email & calendar)
  - Slack (team messaging)
  - Microsoft Teams
  
- [ ] **Legal Research:**
  - Westlaw integration (search, cite-checking)
  - LexisNexis
  - Fastcase
  - Link research to matters automatically
  
- [ ] **E-Filing:**
  - File & ServeXpress
  - Tyler Technologies Odyssey File & Serve
  - State-specific e-filing systems
  
- [ ] **Payment Processing:**
  - LawPay (IOLTA-compliant)
  - Stripe
  - PayPal
  
- [ ] **CRM/Marketing:**
  - HubSpot (already built)
  - Salesforce
  - Mailchimp
  
- [ ] **Productivity:**
  - Zapier (already built)
  - Make (formerly Integromat)
  - Custom webhooks

**API Ecosystem:**
- [ ] **Public API:**
  - RESTful API (OpenAPI/Swagger docs)
  - GraphQL API (for complex queries)
  - Authentication (OAuth 2.0, API keys)
  - Rate limiting (1000 requests/hour)
  - Webhooks (real-time notifications)
  
- [ ] **Developer Portal:**
  - API documentation
  - Code examples (JavaScript, Python, cURL)
  - SDKs (JavaScript, Python, Ruby)
  - Sandbox environment
  - API usage analytics

**AI Integration Features:**
- **Smart Integration Mapping:** AI suggests field mappings:
  - When connecting QuickBooks, AI maps Frith accounts → QB accounts
  - Learns from user corrections
- **Integration Health Monitor:** AI checks:
  - Connection status (detects broken integrations)
  - Data sync errors (flags mismatches)
  - Suggests fixes (missing field mapping)

---

## GLOBAL PLATFORM FEATURES
**Timeline:** Weeks 10-12 (Month 30)

---

### Multi-Language Support

**Supported Languages (Phase 1 - 15 languages):**
- English (US, UK, Australia)
- Spanish (Spain, Latin America)
- French (France, Canada)
- German
- Italian
- Portuguese (Brazil, Portugal)
- Mandarin Chinese (Simplified, Traditional)
- Japanese
- Korean
- Arabic
- Hindi
- Dutch

**Implementation:**
- [ ] **UI Translation:**
  - i18n library (react-i18next)
  - Translation files for all UI strings
  - Right-to-left (RTL) support (Arabic, Hebrew)
  - Date/time formatting per locale
  - Number formatting (1,000.00 vs. 1.000,00)
  
- [ ] **Content Translation:**
  - Help articles translated (professional human translation)
  - Email templates translated
  - Legal document templates (per jurisdiction)
  
- [ ] **AI Multilingual:**
  - AI tools work in all supported languages
  - Input in French → Output in French
  - AI can translate documents (e.g., Spanish contract → English)

**Database Schema:**
```prisma
model Translation {
  id         String   @id @default(uuid())
  key        String   // e.g., "dashboard.welcome"
  language   String   // ISO 639-1 code (e.g., "es", "fr")
  value      String
  context    String?  // UI, email, help_article
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@unique([key, language])
}
```

---

### Multi-Currency Support

**Supported Currencies (190+ via exchange rate API):**
- All major currencies (USD, EUR, GBP, JPY, CNY, INR, etc.)
- Real-time exchange rates (updated hourly)
- Historical exchange rates (for past transactions)

**Implementation:**
- [ ] **Currency Settings:**
  - Firm base currency (e.g., USD)
  - Per-matter currency (if international client)
  - Per-invoice currency (bill client in their currency)
  - Bank account currencies (multi-currency trust accounts)
  
- [ ] **Exchange Rate Management:**
  - Integration with exchange rate API (e.g., Open Exchange Rates)
  - Automatic rate updates
  - Manual rate override (for contract rates)
  - Historical rate tracking (for tax/accounting)
  
- [ ] **Currency Conversion:**
  - Automatic conversion for reports (convert all to base currency)
  - Conversion tracking (original amount + converted amount stored)
  - Gain/loss calculation (foreign currency transactions)

**Database Updates:**
```prisma
// Add to all models with monetary amounts:
model Invoice {
  // ... existing fields
  currency        String   @default("USD") // ISO 4217 code
  exchangeRate    Decimal? @db.Decimal(10, 4) // Rate at time of invoice
  baseCurrencyAmount Decimal? @db.Decimal(15, 2) // Converted to firm base currency
}

model ExchangeRate {
  id          String   @id @default(uuid())
  fromCurrency String  // USD
  toCurrency   String  // EUR
  rate        Decimal  @db.Decimal(10, 4)
  rateDate    DateTime
  source      String   @default("api") // api, manual
  createdAt   DateTime @default(now())
  
  @@unique([fromCurrency, toCurrency, rateDate])
}
```

**Currency Features:**
- [ ] Currency selector on all financial inputs
- [ ] Real-time conversion display (enter $1000 USD → shows €920 EUR equivalent)
- [ ] Financial reports in multiple currencies (view P&L in USD or EUR)
- [ ] Currency gain/loss reporting (for accounting)

---

### Multi-Jurisdiction Support

**Legal Compliance per Jurisdiction:**

**Phase 1 Jurisdictions:**
- United States (50 states + DC, federal)
- United Kingdom (England & Wales, Scotland, Northern Ireland)
- Canada (10 provinces + 3 territories)
- Australia (6 states + 2 territories)
- European Union (27 member states)
- India
- South Africa
- Singapore
- Hong Kong

**Implementation:**
- [ ] **Jurisdiction Rules Engine:**
  - Bar rules database (ethical rules per jurisdiction)
  - Court rules (filing deadlines, formatting requirements)
  - Trust accounting rules (IOLTA compliance varies by state/country)
  - Tax rules (VAT, GST, sales tax)
  
- [ ] **Jurisdiction Settings:**
  - Firm primary jurisdiction
  - Per-matter jurisdiction (can differ)
  - Multi-jurisdiction matters (e.g., international litigation)
  
- [ ] **Compliance Automation:**
  - Deadline calculations adjust per jurisdiction (e.g., "30 days" in CA vs. "1 month" in UK)
  - Document templates per jurisdiction (US vs. UK engagement letters)
  - Invoice formatting per jurisdiction (VAT number required in EU)

**Database Schema:**
```prisma
model Jurisdiction {
  id               String   @id @default(uuid())
  country          String
  state            String?  // For US, Canada, Australia
  jurisdictionName String   // "California" or "England & Wales"
  isoCode          String?  // ISO 3166-2 code
  barRules         Json?    // Ethical rules, trust accounting rules
  courtRules       Json?    // Filing requirements, deadlines
  taxRules         Json?    // Tax rates, requirements
  currency         String   // Primary currency for this jurisdiction
  language         String   // Primary language
  createdAt        DateTime @default(now())
  
  @@unique([country, state])
}

model OrganizationJurisdiction {
  id              String   @id @default(uuid())
  organizationId  String
  jurisdictionId  String
  isPrimary       Boolean  @default(false)
  licenseNumber   String?  // Bar license number
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  organization Organization @relation(fields: [organizationId], references: [id])
  jurisdiction Jurisdiction @relation(fields: [jurisdictionId], references: [id])
  
  @@unique([organizationId, jurisdictionId])
}
```

---

## UPDATED PRICING MODEL
**Aligned with Full Practice Management Features**

---

### NEW TIER STRUCTURE (5 Tiers)

**1. FREE TIER - "Solo Starter"**
- **Price:** $0/month
- **Target:** Solo practitioners, students, trying platform
- **AI Tools:** 5 tools/month (from basic categories)
- **AI Model:** Google Gemini
- **Features:**
  - 1 user
  - 5 active matters
  - 500 MB storage
  - Basic calendar
  - Basic task management
  - Contact management (100 contacts)
  - Email integration (read-only)
  - Help center access
- **Limitations:**
  - No billing/invoicing
  - No trust accounting
  - No time tracking
  - No document assembly
  - Frith branding on client portal

---

**2. STARTER TIER - "Practice Essentials"**
- **Price:** $79/month per user (billed annually: $948/year)
- **Or:** $99/month per user (billed monthly)
- **Target:** Solo practitioners, small firms (1-3 attorneys)
- **AI Tools:** 50 tools/month (expanded categories)
- **AI Model:** Claude Haiku (fast, cost-effective)
- **Features:**
  - Up to 3 users
  - Unlimited matters
  - 10 GB storage per user
  - **Calendar & Scheduling:**
    - Full calendar (sync with Google/Outlook)
    - Court calendar integration
    - Appointment scheduling
  - **Tasks & Workflow:**
    - Unlimited tasks
    - Basic workflows (5 templates)
    - Task templates
  - **Contact & CRM:**
    - Unlimited contacts
    - Lead management (basic)
    - Client portal (branded)
  - **Time & Billing:**
    - Time tracking (manual + timer)
    - Invoicing (unlimited)
    - Online payments (Stripe)
    - Expense tracking
  - **Documents:**
    - Document storage
    - Version control
    - Basic templates (10)
  - **Communications:**
    - Email integration (two-way)
    - Email templates
  - **Reports:**
    - 10 pre-built reports
    - Basic dashboard
  - **Support:**
    - Email support (24-hour response)
    - Help center
    - Video tutorials

---

**3. PROFESSIONAL TIER - "Full Practice Management"**
- **Price:** $149/month per user (billed annually: $1,788/year)
- **Or:** $179/month per user (billed monthly)
- **Target:** Growing firms (3-10 attorneys), firms needing trust accounting
- **AI Tools:** 150 tools/month (all categories)
- **AI Model:** Claude Sonnet (high quality)
- **Everything in Starter, PLUS:**
  - Up to 10 users
  - 50 GB storage per user
  - **Trust Accounting:**
    - IOLTA compliant (all 50 states)
    - Client trust ledgers
    - Three-way reconciliation (automated)
    - Trust reports
  - **Advanced Billing:**
    - LEDES billing (corporate clients)
    - UTBMS codes
    - Multi-currency invoicing
    - Payment plans
    - Batch invoicing
  - **Advanced Time Tracking:**
    - AI-suggested time entries
    - Mobile time tracking
    - Time approval workflows
  - **Court & Docket:**
    - Docket tracking
    - Deadline calculator
    - E-filing integration (basic)
  - **Advanced Documents:**
    - Document assembly (mail merge)
    - E-signature (50 envelopes/month)
    - Privilege log generator (AI)
  - **Workflow Automation:**
    - Unlimited workflows
    - Conditional logic
    - Approval workflows
  - **Advanced Reports:**
    - 50+ pre-built reports
    - Custom report builder
    - Scheduled reports
  - **Integrations:**
    - QuickBooks integration
    - 10+ integrations (Outlook, Slack, etc.)
  - **Support:**
    - Priority email support (4-hour response)
    - Phone support (business hours)
    - Onboarding assistance

---

**4. ADVANCED TIER - "Enterprise-Grade Practice"**
- **Price:** $249/month per user (billed annually: $2,988/year)
- **Or:** $299/month per user (billed monthly)
- **Target:** Mid-to-large firms (10-50 attorneys), firms with complex needs
- **AI Tools:** Unlimited (fair use: ~500/month per user)
- **AI Model:** Claude Opus (highest quality) + Sonnet
- **Everything in Professional, PLUS:**
  - Up to 50 users
  - 100 GB storage per user
  - **AI Advantages:**
    - Priority AI processing (faster responses)
    - Access to latest AI models (GPT-4, Claude 3.5)
    - Custom AI tool creation (10 custom tools)
  - **Advanced Features:**
    - Multi-entity/multi-office support
    - Advanced trust accounting (multi-bank, multi-currency)
    - Predictive analytics (revenue forecasting, case outcomes)
    - E-signature (unlimited envelopes)
    - Advanced e-filing (all jurisdictions)
    - Legal research integration (Westlaw/LexisNexis)
  - **Collaboration:**
    - Real-time document co-editing
    - Advanced permissions (granular role-based access)
    - External collaboration (with clients, co-counsel)
  - **Customization:**
    - Custom workflows (unlimited)
    - Custom fields
    - Custom reports (unlimited)
    - Branded client portal (remove Frith branding)
    - Custom domain (ai.yourfirm.com)
  - **Integrations:**
    - All integrations (50+)
    - API access (10,000 requests/month)
    - Webhooks
  - **Support:**
    - Dedicated account manager
    - Phone support (24/7)
    - Priority onboarding
    - Quarterly business reviews
  - **Security:**
    - Advanced security features
    - SSO (SAML)
    - Audit logs (enhanced)
    - IP whitelisting

---

**5. ENTERPRISE TIER - "Custom Solutions"**
- **Price:** Custom pricing (starting at $10,000/month)
- **Target:** Large law firms (50+ attorneys), legal departments, government
- **AI Tools:** Unlimited (no fair use limits)
- **AI Model:** All models + custom fine-tuned models
- **Everything in Advanced, PLUS:**
  - Unlimited users
  - Unlimited storage (or custom amount)
  - **Enterprise Features:**
    - Custom AI model fine-tuning (trained on firm's data)
    - White-label platform (rebrand as your own)
    - On-premise deployment option
    - Multi-region data residency (EU, US, APAC)
    - Custom integrations (built for you)
    - Advanced API (unlimited requests)
    - Data migration services (from Clio, MyCase, etc.)
  - **Enterprise Security:**
    - SOC 2 Type II compliance
    - HIPAA compliance (if needed)
    - Custom data retention policies
    - Advanced encryption
    - Penetration testing
  - **Enterprise Support:**
    - Dedicated implementation team
    - Custom training programs
    - 24/7 priority support (SLA: 1-hour response)
    - Slack channel with engineering team
    - Quarterly product roadmap input
  - **Custom Development:**
    - Custom features built for your firm
    - Priority feature requests
    - Beta access to new features

---

### UPDATED PRICING PAGE COMPARISON TABLE

| **Feature** | **Free** | **Starter** | **Professional** | **Advanced** | **Enterprise** |
|-------------|---------|------------|-----------------|-------------|---------------|
| **Price (annual)** | $0 | $79/user/mo | $149/user/mo | $249/user/mo | Custom |
| **Users** | 1 | 3 | 10 | 50 | Unlimited |
| **AI Tools/Month** | 5 | 50 | 150 | Unlimited* | Unlimited |
| **AI Model** | Gemini | Claude Haiku | Claude Sonnet | Claude Opus | All + Custom |
| **Storage** | 500 MB | 10 GB/user | 50 GB/user | 100 GB/user | Unlimited |
| **Matters** | 5 | Unlimited | Unlimited | Unlimited | Unlimited |
| **Calendar & Scheduling** | Basic | âœ… | âœ… | âœ… | âœ… |
| **Tasks & Workflow** | Basic | âœ… | âœ… + Automation | âœ… + Advanced | âœ… + Custom |
| **Contact & CRM** | 100 contacts | Unlimited | Unlimited | Unlimited | Unlimited |
| **Time Tracking** | ❌ | âœ… | âœ… + AI | âœ… + Advanced | âœ… |
| **Billing & Invoicing** | ❌ | âœ… | âœ… + LEDES | âœ… + Advanced | âœ… |
| **Trust Accounting** | ❌ | ❌ | âœ… IOLTA | âœ… Multi-bank | âœ… Enterprise |
| **Document Management** | Basic | âœ… | âœ… + Assembly | âœ… + Advanced | âœ… + Custom |
| **E-Signature** | ❌ | ❌ | 50/month | Unlimited | Unlimited |
| **Court & Docket** | ❌ | ❌ | âœ… | âœ… + E-filing | âœ… |
| **Email Integration** | Read-only | Two-way | Two-way | Two-way | Two-way |
| **Integrations** | ❌ | 5 | 10+ | 50+ | All + Custom |
| **Reports** | ❌ | 10 reports | 50+ reports | Custom reports | Custom + API |
| **Multi-language** | ❌ | âœ… | âœ… | âœ… | âœ… |
| **Multi-currency** | ❌ | ❌ | âœ… | âœ… | âœ… |
| **API Access** | ❌ | ❌ | ❌ | âœ… 10K req/mo | âœ… Unlimited |
| **Client Portal** | Basic (branded Frith) | âœ… | âœ… | âœ… Custom domain | âœ… White-label |
| **Support** | Help center | Email (24hr) | Email + Phone | 24/7 + Manager | Dedicated team |
| **Onboarding** | Self-service | Help articles | âœ… Assisted | âœ… Priority | âœ… Custom |

**Note:** *Fair use policy: ~500 AI tool runs per user per month. Enterprise has no limits.

---

### ADD-ONS (All Tiers Except Free)

**Additional User Seats:**
- Starter: +$79/month per additional user
- Professional: +$149/month per additional user
- Advanced: +$249/month per additional user

**Additional Storage:**
- +$10/month per 10 GB (all tiers)

**Additional AI Tools (if exceeded monthly limit):**
- $0.50 per tool run (Haiku)
- $2.00 per tool run (Sonnet)
- $5.00 per tool run (Opus)
- Or upgrade to next tier for unlimited

**E-Signature Envelopes (Professional tier only):**
- +50 envelopes: $25/month
- +100 envelopes: $40/month
- Or upgrade to Advanced for unlimited

**Premium Integrations:**
- Westlaw integration: +$50/month
- LexisNexis integration: +$50/month
- iManage integration: +$100/month
- NetDocuments integration: +$100/month

**Professional Services:**
- Data migration: Starting at $2,500
- Custom workflow setup: $500/workflow
- Training sessions: $200/hour
- Custom development: Custom quote

---

### UPDATED FEATURE COMPARISON: FRITH vs. COMPETITORS

| **Feature** | **Frith AI** | **Clio** | **MyCase** | **PracticePanther** |
|-------------|-------------|---------|----------|---------------------|
| **Starting Price** | $79/user/mo | $39/user/mo | $39/user/mo | $49/user/mo |
| **AI Tools** | âœ… 240+ tools | ❌ Limited AI | ❌ No AI | ❌ Limited AI |
| **AI Models** | âœ… Claude Opus/Sonnet | ❌ | ❌ | ❌ |
| **Trust Accounting** | âœ… IOLTA (50 states) | âœ… | âœ… | âœ… |
| **Document Assembly** | âœ… AI-powered | âœ… | âœ… | âœ… |
| **Court Dockets** | âœ… + AI tracking | âœ… | âœ… | âœ… |
| **Legal Research** | âœ… Integrated + AI | Add-on | Add-on | Add-on |
| **Predictive Analytics** | âœ… AI forecasting | ❌ | ❌ | ❌ |
| **Multi-language** | âœ… 15 languages | Limited | Limited | Limited |
| **Multi-currency** | âœ… 190+ currencies | Limited | Limited | Limited |
| **AI Time Capture** | âœ… Automatic | ❌ | ❌ | ❌ |
| **AI-Powered CRM** | âœ… Smart routing | ❌ | ❌ | ❌ |
| **Custom AI Tools** | âœ… Build your own | ❌ | ❌ | ❌ |
| **API Access** | âœ… GraphQL + REST | âœ… | Limited | Limited |

**Frith AI's Competitive Edge:**
1. **Only platform with 240+ AI legal tools built-in**
2. **AI integrated into every module (not bolt-on)**
3. **Global-ready (multi-language, multi-currency, multi-jurisdiction)**
4. **Predictive intelligence (case outcomes, revenue forecasting)**
5. **Custom AI tool creation (Advanced/Enterprise tiers)**
6. **Most advanced AI models (Claude Opus, fine-tuned models)**

---

## UPDATED ADMIN DASHBOARD
**New Sections & Features**

---

### Enhanced Admin Navigation

**New Menu Structure:**
```
Admin Dashboard
├── Overview (Dashboard)
├── Users & Organizations
│   ├── Users
│   ├── Organizations (firms)
│   ├── Workspaces
│   └── Roles & Permissions
├── Financial Management
│   ├── Subscriptions & Billing
│   ├── Transactions
│   ├── Refunds & Chargebacks
│   ├── Revenue Analytics
│   └── AI Cost Monitoring
├── Platform Management
│   ├── AI Tools
│   ├── Tool Categories
│   ├── Tool Usage Analytics
│   └── AI Model Performance
├── Content Management
│   ├── Help Articles
│   ├── Templates (document templates)
│   ├── Workflows
│   └── Email Templates
├── Support & Tickets
│   ├── Tickets
│   ├── Live Chat (if enabled)
│   └── User Feedback
├── Integrations
│   ├── Active Integrations
│   ├── Integration Health
│   └── API Keys & Webhooks
├── Analytics & Reports
│   ├── Business Metrics
│   ├── User Engagement
│   ├── Feature Adoption
│   └── AI Performance
├── System & Security
│   ├── System Status
│   ├── Audit Logs
│   ├── Security Events
│   └── Compliance Reports
├── Global Settings
│   ├── Currencies
│   ├── Languages
│   ├── Jurisdictions
│   └── Tax Rates
```

---

### New Admin Features

**1. Organization Management (Multi-Tenant Admin):**
- [ ] **Organization List:**
  - All firms using platform
  - Filter by plan tier, status, size
  - Organization health score (usage, satisfaction)
  
- [ ] **Organization Detail:**
  - Firm info (name, address, primary jurisdiction)
  - Subscription (tier, seats, billing)
  - Usage stats (AI tools, storage, API calls)
  - User list (all users in org)
  - Recent activity
  - Support tickets
  
- [ ] **Organization Actions:**
  - Edit organization settings
  - Upgrade/downgrade plan
  - Suspend organization (non-payment)
  - Impersonate organization admin
  - Generate organization report

**2. Global Settings Management:**
- [ ] **Currency Management:**
  - List of supported currencies
  - Exchange rate updates (manual override if needed)
  - Add new currencies
  
- [ ] **Language Management:**
  - Translation status (% complete per language)
  - Add new languages
  - Edit translations (in-app translation editor)
  
- [ ] **Jurisdiction Management:**
  - List of supported jurisdictions
  - Jurisdiction rules (bar rules, court rules)
  - Add new jurisdictions
  - Compliance settings per jurisdiction

**3. AI Model Monitoring:**
- [ ] **AI Usage Dashboard:**
  - Total AI calls (by model: Gemini, Haiku, Sonnet, Opus)
  - Cost per model
  - Average response time
  - Error rate
  
- [ ] **Tool Performance:**
  - Most popular tools
  - User ratings per tool
  - AI accuracy scores (from evaluation framework)
  - Tools needing improvement (low ratings)
  
- [ ] **AI Cost Control:**
  - Set spending limits (daily/monthly)
  - Alerts (if approaching limit)
  - Cost per tier analysis (are we profitable?)

**4. Feature Adoption Tracking:**
- [ ] Track which features users are using:
  - Trust accounting adoption rate
  - Document assembly usage
  - E-filing usage
  - Integration connection rate
  
- [ ] Identify underused features (candidates for improvement or removal)
- [ ] Identify missing features (user requests)

**5. Compliance & Legal:**
- [ ] **GDPR/CCPA Compliance:**
  - Data subject requests (export, delete)
  - Consent management
  - Data processing agreements
  
- [ ] **Bar Compliance Monitoring:**
  - Track trust accounting compliance per org
  - Alert if potential IOLTA violations
  - Generate compliance reports for audits

**6. System Health Monitoring:**
- [ ] **Real-Time Monitoring:**
  - API uptime (Web, Database, AI services)
  - Response times (p50, p95, p99)
  - Error rates
  - Active users (real-time)
  
- [ ] **Alerts:**
  - Slack/email alerts for:
    - System downtime
    - High error rate (>1%)
    - Slow response times (>2s)
    - AI API failures
    - Database connection issues

---

## UPDATED LANDING PAGE
**Reflecting Full Practice Management Capabilities**

---

### Hero Section (Updated)

**Headline:**
"The Only AI-Powered Legal Practice Management Platform You'll Ever Need"

**Subheadline:**
"Manage your entire law firm—clients, cases, finances, documents, and time—all powered by 240+ AI legal tools. Replace 10 different systems with one intelligent platform."

**Feature Pills:**
- âœ… 240 AI Legal Tools
- âœ… Full Practice Management
- âœ… IOLTA Trust Accounting
- âœ… Multi-Language & Currency
- âœ… Court & Docket Tracking
- âœ… Predictive Analytics

**CTA:**
- Primary: "Start Free Trial" → 14-day free trial of Professional tier
- Secondary: "See it in Action" → Video demo or book demo call

---

### Problem/Solution Section (New)

**Problem:**
"Law firms waste 40% of their time on manual administrative tasks and juggle 8-10 different software systems."

**Solution:**
"Frith AI unifies everything—from client intake to invoicing—and automates 70% of routine tasks with AI."

**Statistics:**
- âœ… Save 15 hours per week per attorney
- âœ… Reduce billing errors by 90%
- âœ… Increase collections by 25%
- âœ… Improve client satisfaction by 40%

---

### Feature Showcase (Updated Sections)

**1. AI-Powered Everything**
- 240+ AI legal tools (brief writing, contract review, research)
- AI-suggested time entries (never miss billable hours)
- Predictive case outcomes (AI analyzes similar cases)
- Smart document assembly (auto-fill templates)

**2. Complete Practice Management**
- Case & matter management (track every detail)
- Calendar & scheduling (court appearances, deadlines)
- Tasks & workflows (automate repetitive processes)
- Contact & CRM (manage clients, leads, referrals)

**3. Financial Management**
- Time tracking & billing (invoice clients accurately)
- Trust accounting (IOLTA compliant in all 50 states)
- Expense management (track every dollar)
- Financial reporting (real-time insights)

**4. Document & Communication**
- Document management (version control, collaboration)
- Email integration (Gmail, Outlook—two-way sync)
- Client portal (secure messaging, file sharing)
- E-signature (DocuSign integration)

**5. Court & Compliance**
- Docket tracking (never miss a deadline)
- E-filing integration (file directly with courts)
- Compliance monitoring (ethics, IOLTA rules)
- Multi-jurisdiction support (practice anywhere)

**6. Global-Ready Platform**
- 15 languages (serve clients worldwide)
- 190+ currencies (invoice in any currency)
- Multi-jurisdiction (US, UK, Canada, EU, APAC)
- Local compliance (bar rules per jurisdiction)

---

### Pricing Section (Updated)

**Transparent Pricing, No Hidden Fees**

[Display 4 pricing tiers: Free, Starter, Professional, Advanced]
[Enterprise: "Contact Sales"]

**Include:**
- 45-day money-back guarantee (prominently displayed)
- Annual vs. monthly pricing toggle
- Feature comparison table
- Add-ons (clearly listed)
- ROI calculator (interactive: "How much will you save?")

---

### Social Proof (Updated)

**Trusted by Law Firms Worldwide**

[Logo carousel: 50+ law firms]

**Testimonials:**
- "Frith AI reduced our billing time by 80% and our trust accounting is always reconciled perfectly." — Sarah Johnson, Managing Partner, Johnson & Associates
- "The AI tools are incredible. We draft briefs 3x faster and our client intake is fully automated." — Michael Chen, Solo Practitioner
- "We switched from Clio and never looked back. Frith does everything better and costs less." — Rachel Williams, CFO, Williams Law Group

**Statistics:**
- 10,000+ legal professionals
- $50M+ in invoices processed
- 500,000+ AI tool runs
- 99.9% uptime

---

### FAQ Section (Expanded)

**Add FAQs about new features:**

**Q: How is Frith AI different from Clio or MyCase?**
A: Frith AI is the only platform with 240+ AI legal tools built-in. While Clio and MyCase are practice management software, Frith combines full practice management with advanced AI that can draft documents, conduct research, predict case outcomes, and automate 70% of routine tasks.

**Q: Is Frith AI compliant with IOLTA trust accounting rules?**
A: Yes, Frith AI is fully compliant with IOLTA trust accounting requirements in all 50 US states, plus Canada, UK, and Australia. We support three-way reconciliation, client sub-ledgers, and all required compliance reports.