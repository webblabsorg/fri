# Frith AI - Legal AI Platform

The #1 AI-Powered Legal Assistant Platform with 240+ Specialized Tools

## Overview

Frith AI is a comprehensive legal AI platform designed specifically for legal professionals, law firms, corporate legal departments, and legal tech enthusiasts. With 240+ specialized AI tools across 26 categories, Frith AI empowers lawyers to work smarter, faster, and more accurately.

## Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Components:** Shadcn UI
- **Language:** TypeScript
- **State Management:** React Context / Zustand
- **Forms:** React Hook Form + Zod validation

### Backend
- **Runtime:** Node.js 20+
- **API:** Next.js API Routes (serverless)
- **Database:** Neon PostgreSQL (serverless)
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **WebSocket:** Socket.io (for real-time chat)

### AI Integration
- **Primary Models:** Anthropic Claude API (Haiku, Sonnet, Opus)
- **Free Tier:** Google Gemini 1.5 Flash
- **Vector DB:** Pinecone or pgvector (Neon extension)

### Infrastructure
- **Hosting:** Vercel (frontend + API)
- **Database:** Neon (PostgreSQL)
- **File Storage:** Vercel Blob or AWS S3
- **Email:** Resend
- **Payments:** Stripe + PayPal

### Version Control
- **Repository:** https://github.com/webblabsorg/fri.git
- **Organization:** webblabsorg
- **Branching Strategy:** 
  - `main` - Production-ready code
  - `dev` - Development/staging branch
  - Feature branches: `feature/[feature-name]`
  - Bugfix branches: `bugfix/[bug-name]`

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- Git installed
- GitHub account with access to webblabsorg/fri

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/webblabsorg/fri.git
   cd fri
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your credentials:
   - Database URL (Neon PostgreSQL)
   - NextAuth secret
   - API keys (Claude, Gemini, Stripe, Resend)

4. **Initialize the database:**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Run type checking
npm run type-check

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Format code with Prettier
npm run format

# Database migrations
npx prisma migrate dev
npx prisma migrate deploy
npx prisma db seed

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Project Structure

```
fri/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages (grouped route)
│   │   ├── signin/
│   │   ├── signup/
│   │   └── verify-email/
│   ├── (dashboard)/         # Dashboard pages (grouped route)
│   │   ├── dashboard/
│   │   ├── tools/
│   │   ├── projects/
│   │   └── workspaces/
│   ├── api/                 # API routes
│   │   ├── auth/
│   │   ├── tools/
│   │   ├── user/
│   │   └── admin/
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── ui/                  # Shadcn UI components
│   ├── auth/                # Authentication components
│   ├── dashboard/           # Dashboard components
│   ├── tools/               # Tool-related components
│   └── layout/              # Layout components
├── lib/                     # Utility functions
│   ├── api/                 # API utilities
│   ├── auth.ts              # Authentication utilities
│   ├── db.ts                # Database client
│   ├── utils.ts             # General utilities
│   └── validations/         # Zod schemas
├── prisma/                  # Prisma ORM
│   ├── schema.prisma        # Database schema
│   ├── migrations/          # Database migrations
│   └── seed.ts              # Seed data script
├── public/                  # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
├── styles/                  # Global styles
│   └── globals.css
├── types/                   # TypeScript types
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example             # Example environment variables
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── prettier.config.js
└── README.md
```

## Features

### For Users
- **240+ AI-Powered Tools** across 26 legal categories
- **Workspace Collaboration** with team members
- **Project Management** for organizing legal work
- **Tool History & Favorites** for quick access
- **Document Management** with version control
- **Advanced Search** across all tool outputs
- **Export Options** (PDF, DOCX, TXT, JSON)

### For Admins
- **User Management** (CRUD operations, search, filters)
- **Organization Management** (multi-tenant support)
- **Analytics Dashboard** (users, revenue, tool usage)
- **Support Ticket System** (manage customer inquiries)
- **Billing & Transactions** (subscription management)
- **System Monitoring** (API health, error tracking)
- **Audit Logs** (track all user actions)

### AI Models by Tier
- **Free Tier:** Google Gemini 1.5 Flash (limited tools)
- **Pro Tier:** Claude 3.5 Haiku (faster responses)
- **Professional Tier:** Claude 3.5 Sonnet (balanced quality)
- **Enterprise Tier:** Claude Opus 4.0 (highest quality)

## Pricing

- **Free:** $0 - 3 tools, 10 runs/month
- **Pro:** $79/month - 15 tools, 500 runs/month
- **Professional:** $199/month - 35 tools, 2,000 runs/month
- **Enterprise:** $499/month - 240+ tools, unlimited runs

**45-Day Money-Back Guarantee** on all paid plans

## Development Workflow

1. **Pick a task** from GitHub Issues or Projects board
2. **Create a feature branch:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and commit regularly:
   ```bash
   git add .
   git commit -m "feat(scope): description of changes"
   ```
4. **Push your branch:**
   ```bash
   git push -u origin feature/your-feature-name
   ```
5. **Create a Pull Request** on GitHub:
   - Base: `dev`
   - Compare: `feature/your-feature-name`
   - Fill in PR template
   - Request reviewers
6. **Address review feedback** and merge when approved

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Build process, tooling, dependencies
- `perf:` - Performance improvements

**Example:**
```bash
git commit -m "feat(auth): implement email verification flow

- Add email verification token generation
- Create verification email template
- Add verification endpoint
- Update user model with emailVerified field

Closes #123"
```

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## Deployment

### Staging (dev branch)
Automatic deployment to Vercel on push to `dev` branch.
- URL: Vercel preview URL

### Production (main branch)
Automatic deployment to Vercel on push to `main` branch.
- URL: https://frithai.com

### Manual Deployment
```bash
npm run build
vercel --prod
```

## Environment Variables

Required environment variables (see `.env.example`):

```env
# App
NEXT_PUBLIC_SITE_URL=https://frithai.com
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/database

# Authentication
NEXTAUTH_URL=https://frithai.com
NEXTAUTH_SECRET=your-secret-here

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@frithai.com

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Monitoring
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...

# Analytics
GOOGLE_ANALYTICS_ID=G-...
```

## Documentation

- **Planning Docs:** `/notes/` folder
  - `development-phases-roadmap.md` - Complete development roadmap
  - `ai-agents.md` - 240+ tool specifications
  - `technical-specifications-ai-models.md` - AI model configurations
  - `landing-page-doc.md` - Landing page specifications
  - `auth-pages-doc.md` - Authentication system specs
  - `user-dashboard-complete.md` - User dashboard specs
  - `admin-dashboard-doc.md` - Admin dashboard specs
  - `support-helpdesk-doc.md` - Support system specs
  - `ai-chatbot-doc.md` - AI chatbot specifications
  - `github-workflow.md` - Git workflow and guidelines

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read our [GitHub Workflow Guide](../notes/github-workflow.md) for detailed contribution guidelines.

## Security

- **Report vulnerabilities** to security@frithai.com
- **Do NOT commit** API keys, secrets, or credentials
- **Use environment variables** for all sensitive data
- **Enable 2FA** on your GitHub account

## License

Proprietary - © 2025 Frith AI. All rights reserved.

## Support

- **Documentation:** https://docs.frithai.com
- **Support:** support@frithai.com
- **Issues:** https://github.com/webblabsorg/fri/issues

## Team

Developed by the Frith AI team.

---

**Current Phase:** Phase 0 - Foundation & Setup  
**Last Updated:** December 9, 2025  
**Version:** 0.1.0
