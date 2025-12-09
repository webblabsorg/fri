# Frith AI - Legal AI Platform

The #1 AI-Powered Legal Assistant Platform with 240+ Specialized Tools

## Overview

Frith AI is a comprehensive legal AI platform designed specifically for legal professionals, law firms, corporate legal departments, and legal tech enthusiasts. With 240+ specialized AI tools across 26 categories, Frith AI empowers lawyers to work smarter, faster, and more accurately.

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
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

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- Git installed
- GitHub access to webblabsorg/fri

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

4. **Initialize the database:**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Available Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
npm run format       # Format code
npm run test         # Run tests
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
dev/
├── app/              # Next.js App Router
│   ├── api/         # API routes
│   ├── layout.tsx   # Root layout
│   └── page.tsx     # Landing page
├── components/       # React components
├── lib/             # Utilities
│   ├── db.ts        # Prisma client
│   └── utils.ts     # Helper functions
├── prisma/          # Database
│   ├── schema.prisma # Schema
│   └── seed.ts      # Seed data
└── [config files]
```

## Database Schema

The application uses a comprehensive multi-tenant database schema with:
- **Users & Authentication** (User, Session, EmailVerification, PasswordReset)
- **Multi-Tenant** (Organization, OrganizationMember, Workspace, WorkspaceMember)
- **Tools** (Category, Tool, ToolRun, Favorite)
- **Projects** (Project management)
- **Support** (SupportTicket, TicketMessage)
- **Chatbot** (ChatbotConversation, ChatbotMessage)
- **Billing** (Transaction, Refund)
- **Audit** (AuditLog)

## Features

- 240+ AI-Powered Legal Tools across 26 categories
- Multi-tenant organization support
- Workspace collaboration
- Project management
- Tool execution with multiple AI models
- Support ticket system
- AI chatbot for lead generation
- Comprehensive audit logging

## Development Status

**Current Phase:** Phase 2 - Marketing Site  
**Status:** ✅ COMPLETE  
**Repository:** https://github.com/webblabsorg/fri.git

### Phase 0: Foundation ✅ COMPLETE
- Next.js 15 with TypeScript
- Tailwind CSS + Shadcn UI
- Database schema (multi-tenant)
- API structure foundation

### Phase 1: Core Infrastructure ✅ COMPLETE
- Authentication system (signup, signin, password reset)
- User dashboard shell
- AI integration (Claude, Gemini)
- Stripe payment integration
- User settings and billing pages

### Phase 2: Marketing Site ✅ COMPLETE
- Landing page with Hero, Features, Tool Categories, Pricing, FAQ
- Inner pages: Features, Pricing, AI Tools Directory
- Legal pages: Terms of Service, Privacy Policy
- 240+ AI tools catalog across 15 practice areas
- Fully responsive design
- SEO-ready metadata

### Next Phase: Phase 3 - User Dashboard MVP
- Select and implement 20 MVP tools
- Tool execution engine
- Output management (export, save)
- History and favorites
- Projects system

## Test Credentials

**Test User:**
- Email: admin@testlawfirm.com
- Password: Test123!@#
- Organization: Test Law Firm (Professional tier)

## Environment Variables

See `.env.example` for required environment variables including:
- Database URL
- NextAuth configuration
- AI API keys (Anthropic, Google)
- Email service (Resend)
- Payment processors (Stripe, PayPal)

## Contributing

1. Create a feature branch from `dev`
2. Make your changes
3. Run tests and linting
4. Create a pull request to `dev` branch

Follow conventional commit messages: `feat:`, `fix:`, `docs:`, etc.

## License

Proprietary - © 2025 Frith AI. All rights reserved.

## Support

- Documentation: https://docs.frithai.com
- Issues: https://github.com/webblabsorg/fri/issues
- Email: support@frithai.com

---

**Version:** 0.1.0  
**Last Updated:** December 9, 2025
