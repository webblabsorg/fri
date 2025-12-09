# Frith AI - Quick Start Guide

**Repository:** https://github.com/webblabsorg/fri.git  
**Phase:** 0 - Foundation Complete  
**Status:** ✅ Ready for Phase 1

---

## 🚀 Quick Start (5 Minutes)

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/webblabsorg/fri.git
cd fri/dev

# Install dependencies
npm install
```

### 2. Set Environment Variables

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local with your credentials
```

**Minimum required for local development:**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/frith
NEXTAUTH_SECRET=your-secret-here
```

### 3. Setup Database

```bash
# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 📁 Project Structure

```
frith/
├── dev/              # Development code (Next.js app)
│   ├── app/         # Next.js App Router
│   ├── lib/         # Utilities
│   ├── prisma/      # Database schema & seed
│   └── [configs]    # TypeScript, Tailwind, etc.
├── notes/           # Documentation & planning
│   ├── development-phases-roadmap.md
│   ├── ai-agents.md (240 tools)
│   ├── technical-specifications-ai-models.md
│   └── [other docs]
└── prod/            # Production scripts & docs
    ├── PHASE-0-COMPLETION.md
    ├── DEPLOYMENT-GUIDE.md
    └── QUICK-START.md
```

---

## 🧪 Test Credentials

**Test User:**
- Email: `admin@testlawfirm.com`
- Password: `Test123!@#`

**Database GUI:**
```bash
npm run db:studio
```

---

## 🛠️ Available Commands

```bash
# Development
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
npm run format       # Format with Prettier

# Database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
npm run db:studio    # Open Prisma Studio GUI
npm run db:generate  # Regenerate Prisma Client

# Testing (to be added)
npm run test         # Run tests
npm run test:watch   # Watch mode
```

---

## 📊 What's Included

### ✅ Completed (Phase 0)

- **Next.js 15** with App Router & TypeScript
- **Tailwind CSS** + Shadcn UI design tokens
- **Prisma ORM** with comprehensive schema (20+ models)
- **Multi-tenant** architecture (Organizations, Workspaces)
- **Tool System** (26 categories, ready for 240 tools)
- **Database** schema with relationships & indexes
- **Seed Data** (test organization, user, 5 sample tools)
- **API Health Check** endpoint
- **Git Workflow** configured (main & dev branches)
- **Documentation** (README, setup guides)

### 🟡 Pending (Phase 1+)

- Neon PostgreSQL database connection
- NextAuth.js authentication
- Vercel deployment
- Sign-up/Sign-in pages
- Tool execution engine
- AI API integration
- Admin dashboard
- Support system
- Payment integration

---

## 🎯 Next Steps

### Immediate (Complete Phase 0)

1. **Set up Neon Database:**
   - Create account at https://neon.tech
   - Create project "Frith AI"
   - Copy connection string to `.env.local`

2. **Run Migrations:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

3. **Deploy to Vercel:**
   - Create account at https://vercel.com
   - Import GitHub repository
   - Configure environment variables
   - Deploy!

### Phase 1 (Weeks 3-6)

- Build authentication system (NextAuth.js)
- Create sign-up/sign-in pages
- Email verification flow
- Password reset flow
- User dashboard foundation

See `/notes/development-phases-roadmap.md` for complete plan.

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.3 |
| Styling | Tailwind CSS 3.4 |
| Components | Shadcn UI |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6 |
| Auth | NextAuth.js |
| AI | Claude (Anthropic) + Gemini (Google) |
| Hosting | Vercel |
| Payments | Stripe + PayPal |
| Email | Resend |

---

## 📚 Documentation

- **Phase 0 Report:** `/prod/PHASE-0-COMPLETION.md`
- **Deployment Guide:** `/prod/DEPLOYMENT-GUIDE.md`
- **Development Roadmap:** `/notes/development-phases-roadmap.md`
- **Tool Catalog:** `/notes/ai-agents.md`
- **Git Workflow:** `/notes/github-workflow.md`

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### Database Connection Error
```bash
# Verify DATABASE_URL in .env.local
# Check Neon database is running
# Run migrations again
npm run db:migrate
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Prisma Client Outdated
```bash
# Regenerate Prisma Client
npm run db:generate
```

---

## 🔗 Links

- **Repository:** https://github.com/webblabsorg/fri
- **Issues:** https://github.com/webblabsorg/fri/issues
- **Vercel:** https://vercel.com/webblabsorg/fri (after deployment)
- **Neon Dashboard:** https://console.neon.tech (after setup)

---

## 💡 Tips

### 1. Database Exploration
Use Prisma Studio to browse/edit data visually:
```bash
npm run db:studio
```

### 2. Hot Reload
Next.js automatically reloads on file changes. No need to restart.

### 3. TypeScript Errors
Run type checking before committing:
```bash
npm run type-check
```

### 4. Code Formatting
Auto-format all files:
```bash
npm run format
```

### 5. Git Workflow
- Always work on `dev` branch
- Create feature branches: `feature/your-feature`
- Merge to `dev` via pull request
- Deploy `main` to production

---

## 📈 Current Stats

- **Phase:** 0 Complete (Days 1-7)
- **Files:** 18 created
- **Database Models:** 20+
- **Categories:** 26 ready
- **Tools:** 5 sample (240 total planned)
- **Commits:** 3 on GitHub
- **Branches:** main, dev

---

## 🎓 Learning Resources

- **Next.js:** https://nextjs.org/learn
- **Prisma:** https://www.prisma.io/docs/getting-started
- **Tailwind:** https://tailwindcss.com/docs
- **TypeScript:** https://www.typescriptlang.org/docs

---

## ⚡ Performance Tips

- Use React Server Components (default in Next.js App Router)
- Implement caching for API routes
- Optimize images with Next.js Image component
- Use Incremental Static Regeneration (ISR)
- Enable edge functions for low latency

---

## 🔒 Security Reminders

- ✅ Never commit `.env*` files
- ✅ Use environment variables for all secrets
- ✅ Rotate API keys regularly
- ✅ Enable 2FA on GitHub, Vercel, Neon accounts
- ✅ Review code for sensitive data before committing
- ✅ Use strong passwords (32+ characters)

---

## 👥 Team

**Project Owner:** Frith AI Team  
**Development:** In Progress  
**Phase:** 0 Complete → Phase 1 Starting

---

**Need Help?**
- Check documentation in `/notes/`
- Review `/prod/PHASE-0-COMPLETION.md`
- Open an issue on GitHub
- Review error logs: Vercel dashboard, Sentry (when configured)

---

**Last Updated:** December 9, 2025  
**Version:** 0.1.0

© 2025 Frith AI. All rights reserved.
