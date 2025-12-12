# FRITH AI - TOOL #241: LEGAL WEB SEARCH & EVIDENCE DISCOVERY

**AI-Powered Online Legal Research & Evidence Discovery Tool**  
**Version:** 1.0  
**Category:** Legal Research & Discovery  
**Tool Number:** 241  
**Development Phase:** Phase 12.5 (New Sprint)

---

## DESIGN SYSTEM REQUIREMENTS

### Color Scheme (MANDATORY)

**Primary Colors:**
- **Deep Black:** `#000000` - Primary background color
- **Deep White:** `#FFFFFF` - Primary element/font color

---

## EXECUTIVE SUMMARY

The **Legal Web Search & Evidence Discovery** tool is an AI-powered online research assistant that enables legal professionals to search the web for evidence, case law, news, public records, social media, and other relevant information related to their clients and matters. This tool goes beyond traditional legal research by combining web search capabilities with AI analysis to surface relevant, admissible evidence.

### Key Differentiators
- **Legal-Focused Search:** Optimized for legal research, not general web search
- **Evidence Scoring:** AI rates potential evidentiary value
- **Admissibility Analysis:** Flags potential admissibility issues
- **Source Verification:** Validates source credibility
- **Citation Generation:** Auto-generates proper citations
- **Matter Integration:** Links findings directly to matters

---

## TOOL SPECIFICATION

### Tool ID & Classification

| Attribute | Value |
|-----------|-------|
| **Tool Number** | 241 |
| **Tool Name** | Legal Web Search & Evidence Discovery |
| **Short Name** | LegalWebSearch |
| **Category** | Legal Research & Discovery |
| **Subcategory** | Evidence Discovery |
| **AI Model** | Claude Sonnet / Claude Opus |
| **Availability** | Professional, Advanced, Enterprise |

### Tool Description

**Short Description:**
AI-powered web search tool for finding evidence, case law, news, public records, and relevant information for legal matters.

**Full Description:**
The Legal Web Search & Evidence Discovery tool combines advanced web search capabilities with AI-powered analysis to help legal professionals find and evaluate online evidence. Unlike generic search engines, this tool understands legal context, evaluates evidentiary value, checks source credibility, and integrates findings directly into your matter files.

---

## FEATURES

### Core Features

#### 1. Multi-Source Search
- **Web Search:** General web content via search APIs
- **News Search:** News articles, press releases
- **Academic Search:** Legal journals, law reviews
- **Court Records:** Public court filings, dockets
- **Government Records:** Public records, regulatory filings
- **Social Media:** Public social media posts (with compliance)
- **Corporate Records:** SEC filings, business registrations
- **Property Records:** Real estate, liens, judgments

#### 2. Search Modes

**Quick Search:**
- Simple keyword search
- Fast results
- Basic relevance ranking

**Deep Search:**
- Multi-source comprehensive search
- AI-enhanced query expansion
- Semantic search capabilities
- Related term discovery

**Targeted Search:**
- Person search (background, social media, news)
- Company search (filings, news, litigation)
- Property search (ownership, liens, history)
- Case search (related cases, appeals, citations)

**Monitoring Search:**
- Set up alerts for ongoing monitoring
- New results notification
- Daily/weekly digest

#### 3. AI Analysis Features

**Relevance Scoring:**
- AI rates relevance to matter (1-100)
- Explains relevance reasoning
- Highlights key passages

**Evidence Scoring:**
- Potential evidentiary value (High/Medium/Low)
- Type of evidence (documentary, testimonial, demonstrative)
- Suggested use (impeachment, corroboration, direct evidence)

**Admissibility Analysis:**
- Hearsay concerns
- Authentication requirements
- Best evidence rule considerations
- Privilege issues
- Spoliation risks

**Source Credibility:**
- Source reputation score
- Bias detection
- Fact-check cross-reference
- Publication date verification

**Citation Generation:**
- Bluebook format
- ALWD format
- Custom format
- URL archiving (Wayback Machine integration)

#### 4. Matter Integration

**Direct Filing:**
- Save results to matter
- Categorize findings
- Add notes and tags

**Evidence Linking:**
- Link to existing evidence
- Create evidence chains
- Build timelines

**Report Generation:**
- Research summary report
- Evidence inventory
- Source list with citations

---

## USER INTERFACE

### Search Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  LEGAL WEB SEARCH & EVIDENCE DISCOVERY                    [?]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Matter: [Smith v. Jones - Case #2025-CV-1234        ▼]        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Search for evidence, cases, news, public records...     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Search Mode:  ○ Quick  ● Deep  ○ Targeted  ○ Monitor          │
│                                                                 │
│  Sources:  ☑ Web  ☑ News  ☑ Courts  ☑ Gov Records              │
│            ☐ Social Media  ☐ Corporate  ☐ Property             │
│                                                                 │
│  Date Range: [Last 5 years ▼]    Jurisdiction: [California ▼]  │
│                                                                 │
│  [🔍 Search]                                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  RESULTS (47 found)                          Sort: [Relevance] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📰 NEWS | Relevance: 94 | Evidence: HIGH                │   │
│  │                                                          │   │
│  │ "Company X Faces Multiple Lawsuits Over Product Defect" │   │
│  │ Los Angeles Times - March 15, 2024                       │   │
│  │                                                          │   │
│  │ AI Analysis: Highly relevant - mentions defendant's      │   │
│  │ prior knowledge of defect. Potential impeachment         │   │
│  │ evidence. Hearsay concerns for truth of matter.          │   │
│  │                                                          │   │
│  │ [View] [Save to Matter] [Generate Citation] [Archive]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚖️ COURT | Relevance: 89 | Evidence: HIGH               │   │
│  │                                                          │   │
│  │ "Doe v. Company X" - Similar product liability case      │   │
│  │ CA Superior Court - Settled 2023                         │   │
│  │                                                          │   │
│  │ AI Analysis: Similar fact pattern. Defendant's prior     │   │
│  │ litigation may show notice. Request full docket.         │   │
│  │                                                          │   │
│  │ [View] [Save to Matter] [Generate Citation] [Get Docket] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Results Detail View

```
┌─────────────────────────────────────────────────────────────────┐
│  RESULT DETAIL                                           [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Title: Company X Faces Multiple Lawsuits Over Product Defect  │
│  Source: Los Angeles Times                                      │
│  Date: March 15, 2024                                           │
│  URL: https://latimes.com/business/story/2024-03-15/...        │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  AI ANALYSIS                                                    │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Relevance Score: 94/100                                        │
│  Evidence Value: HIGH                                           │
│  Source Credibility: 92/100 (Major newspaper, verified)         │
│                                                                 │
│  Key Findings:                                                  │
│  • Article mentions defendant knew of defect since 2022         │
│  • Quotes internal memo (potential discovery target)            │
│  • Names whistleblower employee (potential witness)             │
│  • References FDA investigation                                 │
│                                                                 │
│  Admissibility Notes:                                           │
│  ⚠️ Hearsay: Statements in article are hearsay if offered      │
│     for truth. Consider as leads for admissible evidence.       │
│  ✓ Authentication: Newspaper article easily authenticated       │
│  ⚠️ Best Evidence: Obtain original memo referenced              │
│                                                                 │
│  Suggested Actions:                                             │
│  1. Subpoena internal memo referenced in article                │
│  2. Locate and interview whistleblower employee                 │
│  3. FOIA request for FDA investigation documents                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  CITATION                                                       │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Bluebook: Jane Smith, Company X Faces Multiple Lawsuits Over  │
│  Product Defect, L.A. TIMES, Mar. 15, 2024, https://...        │
│                                                                 │
│  [Copy Citation] [Archive URL] [Save to Matter] [Print]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## DATABASE SCHEMA

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
  
  // Sources
  sources         String[] // web, news, courts, gov, social, corporate, property
  
  // Filters
  dateRangeStart  DateTime?
  dateRangeEnd    DateTime?
  jurisdiction    String?
  language        String?
  
  // Results
  resultCount     Int      @default(0)
  
  // AI Enhancement
  expandedQuery   String?  // AI-expanded query terms
  relatedTerms    String[]
  
  // Status
  status          String   @default("pending") // pending, processing, completed, failed
  
  // Timestamps
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
  sourceType      String   // web, news, court, gov, social, corporate, property
  sourceUrl       String
  sourceDomain    String
  
  // Content
  title           String
  snippet         String   @db.Text
  fullContent     String?  @db.Text
  publishedDate   DateTime?
  author          String?
  
  // AI Analysis
  relevanceScore  Int      // 0-100
  evidenceValue   String   // high, medium, low, none
  evidenceType    String?  // documentary, testimonial, demonstrative
  suggestedUse    String?  // impeachment, corroboration, direct
  
  // Credibility
  credibilityScore Int?    // 0-100
  biasIndicators  String[]
  factCheckStatus String?  // verified, disputed, unverified
  
  // Admissibility
  admissibilityNotes Json? // {hearsay, authentication, bestEvidence, privilege}
  
  // Key Extractions
  keyFindings     String[]
  mentionedEntities Json?  // {people, companies, dates, amounts}
  suggestedActions String[]
  
  // Citation
  citationBluebook String?
  citationAlwd    String?
  
  // Archive
  archivedUrl     String?  // Wayback Machine or internal archive
  archivedAt      DateTime?
  
  // User Actions
  isSaved         Boolean  @default(false)
  savedToMatterId String?
  userNotes       String?
  userTags        String[]
  
  createdAt       DateTime @default(now())
  
  query WebSearchQuery @relation(fields: [queryId], references: [id], onDelete: Cascade)
  
  @@index([queryId, relevanceScore])
}

model WebSearchMonitor {
  id              String   @id @default(uuid())
  organizationId  String
  userId          String
  matterId        String?
  
  // Monitor Config
  monitorName     String
  queryText       String
  sources         String[]
  
  // Schedule
  frequency       String   // daily, weekly, realtime
  
  // Notifications
  notifyEmail     Boolean  @default(true)
  notifyInApp     Boolean  @default(true)
  minRelevanceScore Int    @default(70)
  
  // Status
  isActive        Boolean  @default(true)
  lastRunAt       DateTime?
  nextRunAt       DateTime?
  
  // Results
  totalResults    Int      @default(0)
  newResults      Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
  matter       Matter?      @relation(fields: [matterId], references: [id])
}

model WebSearchArchive {
  id              String   @id @default(uuid())
  organizationId  String
  resultId        String?
  
  originalUrl     String
  archivedContent String   @db.Text
  archivedHtml    String?  @db.Text
  screenshot      String?  // URL to screenshot
  
  // Metadata
  capturedAt      DateTime @default(now())
  contentHash     String   // For integrity verification
  
  // Legal
  certificationData Json?  // For authentication purposes
  
  organization Organization @relation(fields: [organizationId], references: [id])
}
```

---

## API ENDPOINTS

```
# Web Search
POST   /api/ai-tools/web-search                    - Execute search
GET    /api/ai-tools/web-search/queries            - List past queries
GET    /api/ai-tools/web-search/queries/:id        - Get query details
GET    /api/ai-tools/web-search/queries/:id/results - Get query results

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
POST   /api/ai-tools/web-search/monitors/:id/run   - Run monitor now

# Targeted Searches
POST   /api/ai-tools/web-search/person             - Person search
POST   /api/ai-tools/web-search/company            - Company search
POST   /api/ai-tools/web-search/property           - Property search
POST   /api/ai-tools/web-search/case               - Case search

# Archives
GET    /api/ai-tools/web-search/archives           - List archives
GET    /api/ai-tools/web-search/archives/:id       - Get archived content
POST   /api/ai-tools/web-search/archives/:id/certify - Generate certification
```

---

## AI PROMPTS

### Search Query Expansion Prompt

```
You are a legal research assistant helping expand a search query for maximum effectiveness.

Original Query: {{query}}
Matter Type: {{matterType}}
Practice Area: {{practiceArea}}
Jurisdiction: {{jurisdiction}}

Expand this query by:
1. Adding relevant legal terms and synonyms
2. Including related concepts
3. Suggesting Boolean operators
4. Identifying key entities to search for

Return:
- Expanded query string
- List of related search terms
- Suggested targeted searches (people, companies, etc.)
```

### Evidence Analysis Prompt

```
You are a legal evidence analyst evaluating a web search result for evidentiary value.

Search Result:
Title: {{title}}
Source: {{source}}
Date: {{date}}
Content: {{content}}

Matter Context:
Type: {{matterType}}
Key Issues: {{keyIssues}}
Parties: {{parties}}

Analyze this result and provide:

1. RELEVANCE SCORE (0-100): How relevant is this to the matter?

2. EVIDENCE VALUE (High/Medium/Low/None): Potential evidentiary value

3. EVIDENCE TYPE: Documentary, testimonial lead, demonstrative, or other

4. SUGGESTED USE: Impeachment, corroboration, direct evidence, background

5. KEY FINDINGS: List specific facts or statements that are relevant

6. MENTIONED ENTITIES: People, companies, dates, amounts mentioned

7. ADMISSIBILITY ANALYSIS:
   - Hearsay concerns
   - Authentication requirements
   - Best evidence considerations
   - Privilege issues

8. SUGGESTED ACTIONS: What follow-up should the attorney take?

9. CREDIBILITY ASSESSMENT: Source reliability and potential bias

Format your response as structured JSON.
```

### Citation Generation Prompt

```
Generate a proper legal citation for this web source.

Source Information:
Title: {{title}}
Author: {{author}}
Publication: {{publication}}
Date: {{date}}
URL: {{url}}
Access Date: {{accessDate}}

Generate citations in:
1. Bluebook format (21st edition)
2. ALWD format (7th edition)

Include proper formatting for online sources with URLs.
```

---

## INTEGRATIONS

### Search API Integrations

| Provider | Purpose | Data |
|----------|---------|------|
| **Bing Web Search API** | General web search | Web pages, news |
| **Google Custom Search** | Web search backup | Web pages |
| **NewsAPI** | News articles | News from 80,000+ sources |
| **PACER API** | Federal court records | Dockets, filings |
| **CourtListener** | Court opinions | Case law, opinions |
| **OpenCorporates** | Company data | Business registrations |
| **SEC EDGAR** | SEC filings | 10-K, 10-Q, 8-K |
| **Wayback Machine API** | URL archiving | Archived pages |

### Internal Integrations

- **Matter Management:** Link results to matters
- **Document Management:** Save results as documents
- **Timeline Builder:** Add findings to case timeline
- **Evidence Tracker:** Track evidence chain
- **Task Management:** Create follow-up tasks

---

## COMPLIANCE & ETHICS

### Data Collection Compliance

- **Terms of Service:** Respect website ToS
- **Robots.txt:** Honor robots.txt directives
- **Rate Limiting:** Prevent excessive requests
- **GDPR:** Handle EU data appropriately
- **CCPA:** California privacy compliance

### Legal Ethics

- **Competence:** Tool assists but doesn't replace attorney judgment
- **Confidentiality:** Search queries may reveal client info
- **Evidence Rules:** Admissibility analysis is advisory only
- **Social Media:** Comply with ethics rules on social media research
- **Spoliation:** Archive evidence to prevent spoliation claims

### Disclaimers

- Results are for informational purposes
- Attorney must verify all information
- Admissibility analysis is not legal advice
- Source credibility scores are AI-generated estimates

---

## DEVELOPMENT PHASE

### Sprint 12.5: Legal Web Search Tool
**Timeline:** 2 weeks (added to Phase 12)  
**Team:** Backend (1), Frontend (1), AI Engineer (0.5)

#### Session 12.5.1: Core Search Implementation
**Timeline:** Week 1  
**Owner:** Backend Lead

**Deliverables:**
- [ ] D-12.5.1.1: Search API integrations (Bing, NewsAPI)
- [ ] D-12.5.1.2: Query processing and expansion
- [ ] D-12.5.1.3: Result aggregation and deduplication
- [ ] D-12.5.1.4: Basic relevance scoring

#### Session 12.5.2: AI Analysis & UI
**Timeline:** Week 2  
**Owner:** Frontend Lead + AI Engineer

**Deliverables:**
- [ ] D-12.5.2.1: AI evidence analysis prompts
- [ ] D-12.5.2.2: Admissibility analysis
- [ ] D-12.5.2.3: Citation generation
- [ ] D-12.5.2.4: Search UI (deep black/white theme)
- [ ] D-12.5.2.5: Results detail view
- [ ] D-12.5.2.6: Matter integration

#### Acceptance Criteria
- [ ] Search returns results in < 5 seconds
- [ ] AI analysis accuracy > 85%
- [ ] Citation format correct for Bluebook
- [ ] URL archiving works correctly
- [ ] UI follows deep black/white color scheme

---

## PRICING & USAGE

### Included in Plans

| Plan | Monthly Searches | Deep Searches | Monitors |
|------|------------------|---------------|----------|
| Free | 0 | 0 | 0 |
| Starter | 50 | 10 | 1 |
| Professional | 500 | 100 | 10 |
| Advanced | 2,000 | 500 | 50 |
| Enterprise | Unlimited | Unlimited | Unlimited |

### Add-On Pricing

| Add-On | Price |
|--------|-------|
| Additional 100 searches | $19 |
| Additional 10 monitors | $29/month |
| Premium sources (PACER, SEC) | $49/month |

---

## SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Search completion time | < 5 seconds |
| AI relevance accuracy | > 85% |
| User satisfaction | > 4.5/5 |
| Searches per user/month | > 20 |
| Evidence saved to matters | > 30% of results |

---

**Document Version:** 1.0  
**Last Updated:** December 12, 2025  
**Status:** Ready for Development  
**Tool Number:** 241 of 241

---
