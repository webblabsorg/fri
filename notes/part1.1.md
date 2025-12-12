
> **Goal:** Turn **Frith** into the go-to, fully-branded, enterprise-grade legal practice platform. It must be more feature rich and legally-focused than Clio, MyCase, and PracticePanther, and leverage our 240 AI tools to deliver measurable time and cost savings for law firms and legal professionals worldwide.
>
> **Context:** We already have an MVP roadmap and platform foundation (Phases 0–11 in `development-phases-roadmap.md`). Continue the roadmap from **Phase 12** and add the product, admin, landing page and pricing updates below. See the roadmap for prior scope and assumptions. 
>
> **Instructions (deliverables):**
>
> 1. For each of the 12 dashboard tabs listed below, produce:
>
>    * A prioritized list of **product features** (core UX / UI / data flows).
>    * A prioritized list of **AI-powered features** (how our AI tools are used, model selection, quality checks, provenance).
>    * Acceptancecriteria / success metrics for each feature.
> 2. Add any **new tabs/menus** that materially improve competitiveness (suggested below).
> 3. Provide specific **Admin Dashboard** changes and the exact Marketing/Landing page sections to advertise the new capabilities.
> 4. Produce an updated **Pricing** plan (tier matrix + add-ons + billing model) that maps features to tiers, and includes credits/usage and enterprise options.
> 5. Provide exact content to append to `development-phases-roadmap.md` starting at **Phase 12** (Phases 12–15 recommended), including timelines, owners, deliverables and acceptance criteria.
> 6. Ensure full **multilingual, multi-currency, timezone/date-formatting** and **data residency / compliance** considerations are included for global rollout.
>
> **Operations constraints & notes:**
>
> * Keep legal-risk mitigations front and center: audit trails, exportable provenance, human-in-loop signs, disclaimers for draft legal docs, opt-out for training, secure file handling, trust accounting.
> * AI quality gates: use the existing evaluation framework (benchmarks, regression tests, manual legal review — from Phase 3) for every tool before it ships to users.
> * Deliver output in 3 formats: (A) product-feature lists per tab, (B) admin/landing/pricing copy and (C) roadmap snippet for phases 12–15 in markdown ready to append to `development-phases-roadmap.md`.
> * Do not assume any jurisdictional legal advice; where tools produce legal documents, the UI must require user confirmation and include a clear “review by a licensed lawyer” statement.
>
> **Target audience for this prompt:** product managers, engineering leads, AI/prompt-engineers, legal SME reviewers, UX designers, marketing.

---

## The 12 tabs — Feature sets & AI features

Below: for each original tab I list (A) Product features, (B) AI features and (C) Acceptance metrics.

> Note: Items marked **[Must ship]** are must-have for MVP parity; **[Differentiator]** are competitive features that make Frith stand out.

---

### 1) Calendar

A. Product features

* Shared firm calendar + matter-specific calendars. (Calendar overlay)
* Court / hearing integrations (court deadlines, e-filing windows).
* Matter-level court date metadata (judge, location, docket number).
* Smart conflict-checking (calendar + client conflicts).
* Sync with Google/Outlook/iCal; timezone-aware invites.
* Court rules reminder engine (automated deadlines by jurisdiction). **[Differentiator]**
* Drag & drop rescheduling, recurring events, attachments (orders, summons).
* Client-facing portal calendar (select events visible to clients only).

B. AI features

* Auto-summarize hearing notes after the meeting (AI transcript -> summary).
* Smart-suggest calendar events from case documents and emails.
* Deadline risk scoring (AI predicts likelihood of missing required filings).
* Natural-language scheduling: “Schedule a status call next Tuesday with client X at 2pm GMT.”
* Auto-categorize events (hearing, client meeting, filing deadline) using ML.

C. Acceptance metrics

* Calendar sync success > 99% reliability.
* AI-suggested events accuracy > 92% in tests.
* Reduction in missed deadlines (beta): target -40% for pilot firms.

---

### 2) Tasks

A. Product features

* Matter-linked tasks with dependencies, subtasks, and time estimates.
* Task templates (pre-built for common legal workflows: intake, e-discovery, close).
* Assign, reassign, SLA timers, priority, and automated reminders.
* Time-tracking per task (billable vs non-billable).
* Kanban and list views.
* Bulk task actions + CSV import/export.
* Task-level attachments + comments.

B. AI features

* Auto-generate task lists from documents (e.g., contract review → list of issues to resolve).
* Smart-prioritization (AI scores urgency based on deadlines & SLA).
* Auto-assign suggestions (AI recommends assignee based on workload & expertise).
* Task summarization & extraction of next actions from meeting transcripts.

C. Acceptance metrics

* Auto-generated task precision > 85% (evaluated on sample cases).
* Average time to assign from suggestion < 2 minutes in trials.

---

### 3) Cases (matters)

A. Product features

* Matter record with status, parties, jurisdiction, practice area, custom fields.
* Matter timeline (chronological events, filings, correspondence).
* Matter-level billing snapshot (unbilled, billed, trust account).
* Document repository scoped to matter, tags, versions, OCR.
* Matter templates & cloning (create new matter from template).
* Role-based matter access (partners, associates, externals).
* Confidential flagging and privilege tagging.

B. AI features

* Auto-extract key matter metadata from uploaded pleading (parties, dates, statute).
* Risk scoring (probability of favorable outcome or exposure estimates).
* Auto-populate matter intake forms from emails/attachments.
* Matter comparator: show similar matters in firm history and outcomes.
* Summarize long dockets in a one-page executive summary.

C. Acceptance metrics

* Metadata extraction accuracy > 90% for core fields.
* Matter similarity suggestions relevant > 80% in user testing.

---

### 4) Contacts

A. Product features

* Unified contact database (clients, opposing counsel, experts), company hierarchies.
* Merge / duplicate detection.
* Contact permissions (private v shared).
* Enrichment (firm, role, address) and manual/CSV import.
* Client portal contact record.

B. AI features

* Auto-enrich contacts from public sources; flag potential conflicts.
* Suggested client outreach / warm intro templates tailored per contact.
* Sentiment and relationship scoring from communications.

C. Acceptance metrics

* Duplicate merge accuracy > 95%.
* Enrichment precision > 88% across tested regions.

---

### 5) Activities (audit & activity feed)

A. Product features

* Chronological feed of actions (logins, edits, runs, document changes).
* Filterable by user, matter, date, action type.
* Downloadable audit logs for compliance & billing disputes.
* Per-item activity comments & resolution markers.

B. AI features

* Anomaly detection: flag unusual activity patterns (possible data exfiltration).
* Auto-classify activity by severity/impact (security, billing, admin).
* Natural-language incident summarization for admins.

C. Acceptance metrics

* Real-time feed < 2s latency.
* Anomaly detection true positive rate > 85% in trials.

---

### 6) Accounts (finance & billing)

A. Product features

* Timekeeping and invoicing (trust accounting, matter-level billing).
* Integration with accounting systems (Xero, QuickBooks).
* Batch invoicing, e-billing, payment links.
* Client trust ledger, compliance checks, escrow management.
* Expense capture and approvals.
* Tax handling and invoice templates per jurisdiction.

B. AI features

* Automatic time-capture suggestions (from calendar, docs, emails).
* Smart invoice review: detect under/overbilling, duplicate line items.
* Predict churn risk from payment patterns.
* Auto-categorize expenses and suggest cost allocations.

C. Acceptance metrics

* Invoice generation time reduced by 60% vs baseline in pilot firms.
* Trust-account reconciliation accuracy > 99% reconciliation.

---

### 7) Documents (DMS)

A. Product features

* Central DMS with folder trees, tagging, full-text search, OCR, version control.
* Document templates and clause library.
* Redaction tools, document comparison, annotations.
* Secure external sharing with watermarking and expiry.
* Integrations: Word add-in (insert AI outputs), NetDocuments/iManage connectors.

B. AI features

* Clause extraction and clause-level risk analysis.
* Contract redlining assistant (auto-explain proposed changes).
* Auto-drafting from template + facts (NDA, SLA, engagement letter).
* Cross-doc consistency checks (name, defined terms, indemnities).
* Citations & precedent lookup (with provenance links).

C. Acceptance metrics

* Clause extraction accuracy > 90% on sample contracts.
* Auto-drafts pass legal SME review at > 85% acceptance for simple doc types.

---

### 8) Communications

A. Product features

* Unified inbox: emails, client portal messages, SMS, and phone notes (integrate Twilio).
* Templates, macros, mass communications (opt-in/out).
* Secure client messaging with read receipts and attachments.
* Email threading per matter.

B. AI features

* Auto-draft replies and escalation suggestions (tone options).
* Summarize long email threads into action items.
* Detect sensitive content and suggest encryption/warning.
* Auto-tag communications to matters & tasks.

C. Acceptance metrics

* Auto-tagging accuracy > 92%.
* Email-summarization usefulness rated 4/5 by pilot users.

---

### 9) Leads (CRM)

A. Product features

* Intake forms, lead pipeline, conversion flows.
* Lead scoring, source attribution, demo-booking integration.
* Conversion funnels and automated nurture sequences.

B. AI features

* Auto-prioritize leads by fit & revenue potential.
* Auto-generate follow-up emails and suggested next steps.
* Convert intake documents into matter templates when qualified.

C. Acceptance metrics

* Lead-to-client conversion uplift target +15% after automations.

---

### 10) Reports

A. Product features

* Pre-built & custom reports: matter performance, time/billing, utilization, AI cost.
* Scheduled reports, CSV/Excel export, dashboards.
* Per-matter profitability (including AI credits costs).

B. AI features

* Natural-language report builder: “Show me profit by practice area last quarter.”
* Anomaly detection in financials and usage.
* Explainable insights (why profitability dropped — AI narrative).

C. Acceptance metrics

* Report generation < 10s for typical queries.
* NL report builder satisfaction > 4/5 in trials.

---

### 11) Integrations (Third-party apps)

A. Product features

* Out-of-the-box integrations: Google/Microsoft calendars & docs, Clio, iManage, NetDocuments, Xero/QuickBooks, Zapier.
* Webhooks, API keys, developer portal.
* Per-organization integration management.

B. AI features

* "Integration wizard" — AI assists in mapping fields and syncing data.
* Auto-health status & remediation suggestions for failing integrations.

C. Acceptance metrics

* Setup time for common integrations < 15 minutes with wizard.
* Integration reliability > 99% (uptime SLA).

---

### 12) Resources (Support / Knowledge Base / Training)

A. Product features

* Help center, guided walkthroughs, video tutorials, and legal guides.
* In-app help & contextual tips, role-based help content.
* Admin-managed knowledge base, versioned.

B. AI features

* Semantic search across KB & past tickets (vector search).
* Auto-generate KB articles from support threads/tools outputs.
* Onboarding coach (interactive walkthroughs driven by AI).

C. Acceptance metrics

* KB search success (first-click resolution) > 60%.
* Auto-generated KB article accuracy > 80% (human reviewed).

---

## Suggested new tabs / menus (high ROI additions)

* **Client Portal** — secure client view, approvals, billing, e-signature.
* **Time & Billing** (if Accounts is general, split timekeeping into dedicated module).
* **E-Discovery** — upload, dedupe, tagging, predictive coding. **[Differentiator]**
* **Compliance & Trust** — data residency, regulatory reporting, audit export.
* **Marketplace / Tools Store** — buy/enable paid third-party tools or add-ons.
* **Automation / Workflows** — visual tool chaining and scheduled jobs (like Zapier for legal tasks).
* **Developer Portal / API Marketplace** — allow partners to publish tools.

---

## Admin Dashboard updates (must-haves)

* Granular per-organization settings: branding, locale, data-residency options.
* AI cost monitoring and alerts (cost by model, by org, by tool).
* Prompt / tool version control & rollout (feature flags + canary releases).
* Audit & compliance exports (SOCs, GDPR, CCPA ready formats).
* Refunds & 45-day money-back workflow (already included — expand with reasons analytics).
* Admin-run evaluation dashboard showing tool evaluation results, failure rates, and legal-SME review outcomes.

---

## Landing page & marketing updates (what to advertise)

* Hero: “AI for the modern law firm — Contract review, case research, and matter automation — trusted by firms.”
* Feature sections mapped to the 12 tabs with short video demos (15–30s each).
* Security & compliance badge stack: SOC2, ISO27001, GDPR, local data residency.
* Pricing snapshot + ROI calculator (billable hours saved).
* Use-case pages by practice area (litigation, corporate, IP, immigration, etc.)
* Enterprise page: SSO, data residency, white-label, SLA and dedicated support.

---

## Pricing & monetization model (recommended)

### Core ideas

* Hybrid: Seat-based + usage (AI credits) + add-ons for enterprise/white-label. This keeps barrier-to-entry low while aligning revenue with AI cost.

### Suggested tiers

1. **Free** — Single seat, 3 tools (Gemini-quality), 200 AI credits/month, basic docs & KB.
2. **Starter** ($) — Up to 5 seats, 15 tools, 2,000 AI credits/month, email/calendar integrations, basic billing.
3. **Pro** ($$) — Up to 25 seats, 35 tools, 10,000 AI credits/month, advanced DMS, invoicing, analytics, live chat support.
4. **Enterprise** (custom) — SSO, SCIM, dedicated instance or data residency, white-label, unlimited tools, priority SLAs, per-seat pricing, committed AI volume discounts.
5. **Add-ons**: E-Discovery module, Advanced Integrations (iManage), White-label, Additional AI credit packs, On-site/legal-SME training.

### Billing & controls

* AI credits consumed per token and billed monthly (credits included, overage per 1k tokens at tiered rate).
* Cap on monthly AI spend configurable per org (admin safety).
* Discounts for annual prepay; 45-day guarantee policy as per roadmap.
* Trial conversion funnel: credit-expiry reminders + guided workflows.

---

## Multilingual & Multi-currency / Globalization

Features (product + AI):

* Locale detection: UI language and local date/time formats auto-set by user preference or org setting.
* Localized legal templates and clause libraries per jurisdiction (country/state level).
* Automatic currency conversion using live rates (display and invoice in local currency); respect locale rounding, VAT/GST fields.
* Multi-currency invoices + consolidated reporting in base currency.
* Translation pipeline: UI translation + AI-assisted translation of documents (with human review). Support RTL languages and locale-sensitive formatting.
* Local legal citation formatting and statute lookups for supported jurisdictions (when available).
* Data residency options (host region) and exportable compliance artifacts.

Acceptance

* UI translations for top 7 languages at launch (English, French, Spanish, Portuguese, Swahili, Arabic, Mandarin) — extend later.
* Currency conversion accuracy per finance rules; taxes shown correctly for 90% of tested jurisdictions in pilot.

---

## Security, Compliance & Legal-risk mitigations

* Encryption at rest & in transit; per-organization keys for Enterprise.
* Audit trails for every AI output: model, prompt template, input, tokens, timestamp, user.
* Option to disable model training on organization's data (opt-out).
* SOC2 / ISO27001 / GDPR / CCPA checklist implementation plan.
* Trust-accounting compliance built into Accounts tab (ledger + reconciliation).
* Legal disclaimer flows and “review by counsel” flags before client deliverables.
* Penetration testing schedule and security SLA.

---

## Roadmap: appendable markdown for `development-phases-roadmap.md` (Phases 12–15)

Use the following snippet to continue the roadmap. Paste directly under Phase 11 in your file.

```
## PHASE 12: Globalization, Compliance & Legal-Grade Validation
**Timeline:** Months 19-22 (4 months)
**Goal:** Make Frith globally-ready and legally-safe for cross-border firms.

### Key deliverables
- Localization: UI + templates for EN/FR/ES/PT/SW/AR/CN; RTL support; localized date/currency formats.
- Data residency choices (region selection, isolated DB per region for Enterprise).
- Jurisdictional template library: legal templates localized to 10 pilot jurisdictions.
- Compliance: SOC2 Type II readiness, GDPR processing addendum, CCPA workflows.
- Legal Validation Program: hire/regulatory counsel review sessions; checklist & acceptance for auto-draft tools.

### Success criteria
- Translation coverage 95% for UI strings in pilot languages.
- Data residency choices available for Enterprise customers.
- Legal SME sign-off for 10 template categories in 10 jurisdictions.

---

## PHASE 13: Enterprise & Partner Integrations
**Timeline:** Months 23-26 (4 months)
**Goal:** Deep enterprise features & partner integrations for large firms.

### Key deliverables
- Advanced SSO/SCIM, SAML 2.0, Okta, Azure AD.
- Enterprise admin controls: policy engine, retention policies, DLP integration.
- Deep DMS integrations (iManage, NetDocuments) and EHR / ERP connectors where relevant.
- Legal process orchestration (tool chaining + workflow automation).
- Sales & onboarding playbook for enterprise clients.

### Success criteria
- 3 enterprise pilot customers onboarded.
- SSO + DMS integration completed and validated.
- SLA and pricing playbook ready.

---

## PHASE 14: Marketplace, Ecosystem & API Platform
**Timeline:** Months 27-30 (3-4 months)
**Goal:** Enable third-party innovation and add-ons.

### Key deliverables
- API Marketplace and Developer Portal, SDKs (JS, Python).
- Partner onboarding, app review; publish first 10 partner apps.
- Billing integration for marketplace purchases.
- Marketplace governance and security review process.

### Success criteria
- 10 published apps and 3 active partner integrations.
- Marketplace revenue >= 5% of MRR within 6 months.

---

## PHASE 15: Scale, Growth & Maturity (Sales + Product)
**Timeline:** Months 31-36 (6 months)
**Goal:** Optimize for scale, profitability, international growth & fundraising readiness.

### Key deliverables
- Mobile apps (iOS/Android) parity with core features.
- Performance & infra scaling to 100k users (kubernetes, autoscaling).
- Pricing optimization past early revenue signals; finalize enterprise packaging.
- Prepare Series A materials (KPIs, TAM, churn analysis).

### Success criteria
- Platform supports 10k+ active organizations with <1% errors.
- MRR growth meeting fundraising targets and gross margins per plan.

```

---

## Quick next steps for your team (practical)

1. Paste the prompt (above) into your internal brief / product tickets and assign owners.
2. Append the Phase 12–15 snippet to `development-phases-roadmap.md`. (I used your existing file for alignment.) 
3. Start workstreams in parallel: Localization + compliance, Admin + AI-cost dashboards, Pricing update + marketing copy.
4. For each AI feature, pair an AI/prompt-engineer with a legal SME to approve output and set evaluation datasets.

---

