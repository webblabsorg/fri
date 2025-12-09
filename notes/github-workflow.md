# GitHub Workflow & Repository Management
**Repository:** https://github.com/webblabsorg/fri.git  
**Organization:** webblabsorg  
**Project:** Frith AI - Legal AI Platform

---

## 1. Repository Structure

```
webblabsorg/fri/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # CI/CD pipeline
│   │   ├── test.yml            # Automated testing
│   │   └── deploy.yml          # Deployment automation
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── sprint_task.md
│   └── PULL_REQUEST_TEMPLATE.md
├── app/                         # Next.js app directory
├── components/                  # React components
├── lib/                         # Utility functions
├── prisma/                      # Database schema & migrations
├── public/                      # Static assets
├── tests/                       # Test files
├── .env.example                 # Example environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

---

## 2. Branching Strategy

### Branch Structure

**Main Branches:**
- `main` - Production-ready code (protected)
- `dev` - Development/staging branch (protected)

**Feature Branches:**
- `feature/[feature-name]` - New features
- Example: `feature/user-authentication`, `feature/tool-execution-engine`

**Bugfix Branches:**
- `bugfix/[bug-name]` - Bug fixes
- Example: `bugfix/login-error`, `bugfix/tool-output-formatting`

**Hotfix Branches:**
- `hotfix/[critical-bug]` - Critical production fixes
- Example: `hotfix/payment-processing-error`

**Release Branches:**
- `release/[version]` - Release preparation
- Example: `release/v1.0.0`, `release/beta-launch`

---

## 3. Git Workflow

### Starting a New Feature

```bash
# Update local repository
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/contract-review-tool

# Work on feature (make commits)
git add .
git commit -m "feat: add contract review tool with risk analysis

- Implement contract upload and parsing
- Add risk identification logic
- Create output formatting
- Add unit tests

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"

# Push to remote
git push -u origin feature/contract-review-tool
```

### Creating a Pull Request

```bash
# Ensure branch is up to date with dev
git checkout dev
git pull origin dev
git checkout feature/contract-review-tool
git merge dev  # Resolve any conflicts

# Push final changes
git push origin feature/contract-review-tool

# Create PR using GitHub CLI (if installed)
gh pr create --base dev --head feature/contract-review-tool \
  --title "Add Contract Review Tool" \
  --body "Implements AI-powered contract review with risk analysis.

## Changes
- Contract upload and parsing
- Risk identification algorithm
- Output formatting with citations
- Unit tests with 95% coverage

## Testing
- Tested with 20 sample contracts
- All evaluation benchmarks passed
- No regression issues

Closes #123"
```

**Or create PR via GitHub UI:**
1. Go to https://github.com/webblabsorg/fri
2. Click "Pull requests" → "New pull request"
3. Base: `dev`, Compare: `feature/contract-review-tool`
4. Fill in title and description
5. Request reviewers
6. Submit

---

## 4. Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Build process, tooling, dependencies
- `perf:` - Performance improvements
- `ci:` - CI/CD pipeline changes

### Examples

```bash
# New feature
git commit -m "feat(auth): implement email verification flow

- Add email verification token generation
- Create verification email template
- Add verification endpoint
- Update user model with emailVerified field"

# Bug fix
git commit -m "fix(tools): correct token counting for Claude API

Tokens were being counted incorrectly for multi-line inputs.
Updated tokenizer to handle newlines properly.

Fixes #456"

# Documentation
git commit -m "docs(readme): add setup instructions for local development"

# Multiple changes
git commit -m "feat(dashboard): add tool favorites and history

- Implement favorites system with star/unstar
- Add history page with filtering
- Create shared ToolCard component
- Add database migrations for favorites table

Closes #789"
```

---

## 5. Branch Protection Rules

### Main Branch (`main`)
- ✅ Require pull request reviews before merging (1+ approvals)
- ✅ Require status checks to pass before merging
  - CI tests must pass
  - Linting must pass
  - Type checking must pass
- ✅ Require conversation resolution before merging
- ✅ Require linear history (no merge commits)
- ✅ No direct pushes to `main`
- ✅ Include administrators in restrictions

### Dev Branch (`dev`)
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ✅ Allow force pushes (for maintainers only)
- ✅ Delete branch on merge

---

## 6. GitHub Actions CI/CD

### Continuous Integration (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main, dev]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_TEST }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

### Deployment (Vercel Auto-Deploy)

Vercel handles deployment automatically when connected to GitHub:
- Push to `main` → Deploy to production (frithai.com)
- Push to `dev` → Deploy to staging
- Open PR → Deploy to preview URL

---

## 7. Issue Tracking

### Issue Labels

**Type:**
- `bug` - Something isn't working
- `feature` - New feature or request
- `enhancement` - Improvement to existing feature
- `documentation` - Documentation improvements
- `question` - Further information requested

**Priority:**
- `priority: critical` - Blocks production or major functionality
- `priority: high` - Important but not blocking
- `priority: medium` - Normal priority
- `priority: low` - Nice to have

**Phase:**
- `phase-0` - Foundation & Setup
- `phase-1` - Core Infrastructure
- `phase-2` - Marketing Site
- `phase-3` - User Dashboard MVP
- `phase-4` - Admin Dashboard
- `phase-5` - Support System
- `phase-6` - AI Chatbot
- `phase-7` - Advanced Features
- `phase-8` - Testing & QA
- `phase-9` - Beta Launch
- `phase-10` - Public Launch
- `phase-11` - Scale & Enhance

**Status:**
- `status: todo` - Not started
- `status: in-progress` - Being worked on
- `status: blocked` - Waiting on dependency
- `status: review` - In code review
- `status: done` - Completed

### Issue Template Example

```markdown
## Description
Brief description of the feature/bug

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests written and passing

## Technical Details
- Files to modify:
- API endpoints:
- Database changes:

## Related Issues
Closes #123
Relates to #456
```

---

## 8. Pull Request Guidelines

### PR Checklist

Before submitting a PR:
- [ ] Code follows project conventions
- [ ] All tests pass locally
- [ ] New features have tests
- [ ] Documentation updated (if applicable)
- [ ] No console.log or debug code
- [ ] No secrets or API keys in code
- [ ] Branch is up to date with base branch
- [ ] Commit messages follow convention
- [ ] PR description is clear and complete

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- How was this tested?
- What test coverage was added?

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)

## Related Issues
Closes #[issue number]
```

---

## 9. Security Best Practices

### Secrets Management

**Never commit:**
- API keys (Anthropic, Google, Stripe, etc.)
- Database credentials
- Authentication secrets
- OAuth client secrets
- Private keys

**Use GitHub Secrets for:**
- CI/CD environment variables
- Deployment credentials
- Third-party API keys

**Add to `.gitignore`:**
```
.env
.env.local
.env.development
.env.production
.env.test
*.pem
*.key
secrets/
```

### Security Scanning

Enable on GitHub:
- **Dependabot:** Automated dependency updates
- **Code scanning:** Detect security vulnerabilities
- **Secret scanning:** Prevent committing secrets

---

## 10. Release Process

### Creating a Release

```bash
# Update version in package.json
npm version minor  # or major, patch

# Create release branch
git checkout -b release/v1.0.0

# Update CHANGELOG.md
# Add release notes

# Commit changes
git add .
git commit -m "chore(release): prepare v1.0.0"

# Push release branch
git push origin release/v1.0.0

# Create PR to main
# After merge, tag the release
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### GitHub Releases

1. Go to https://github.com/webblabsorg/fri/releases
2. Click "Draft a new release"
3. Choose tag: v1.0.0
4. Release title: "Frith AI v1.0.0 - MVP Launch"
5. Add release notes:
   - New features
   - Bug fixes
   - Breaking changes
   - Known issues
6. Attach binaries (if applicable)
7. Publish release

---

## 11. Code Review Guidelines

### For Authors

- Keep PRs small and focused (< 500 lines when possible)
- Write clear PR descriptions
- Add comments for complex logic
- Respond to feedback promptly
- Don't take feedback personally

### For Reviewers

- Review within 24 hours
- Be constructive and respectful
- Ask questions instead of making demands
- Approve when ready, request changes if needed
- Check:
  - Code quality and readability
  - Test coverage
  - Security implications
  - Performance considerations
  - Alignment with architecture

---

## 12. Emergency Procedures

### Production Hotfix

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-payment-bug

# Fix the bug
# Add tests
# Commit

git commit -m "fix(payments): resolve Stripe webhook signature validation

Critical bug causing payment confirmations to fail.
Updated webhook signature verification logic.

Fixes #999"

# Push and create PR to main (skip normal review if critical)
git push origin hotfix/critical-payment-bug

# After merge to main, also merge to dev
git checkout dev
git merge main
git push origin dev
```

### Rolling Back a Deployment

**Vercel:**
1. Go to Vercel dashboard
2. Select project: fri
3. Go to Deployments
4. Find last working deployment
5. Click "..." → "Promote to Production"

**Or via CLI:**
```bash
vercel rollback
```

**Git revert:**
```bash
git revert <commit-hash>
git push origin main
```

---

## 13. Repository Maintenance

### Regular Tasks

**Weekly:**
- Review open PRs
- Update dependencies (`npm outdated`)
- Check GitHub security alerts
- Review open issues

**Monthly:**
- Update major dependencies
- Review and close stale issues
- Archive old branches
- Review GitHub Actions usage

**Quarterly:**
- Security audit
- Performance review
- Documentation update
- License compliance check

---

## 14. Useful Git Commands

### Sync Fork (if team members fork)
```bash
git remote add upstream https://github.com/webblabsorg/fri.git
git fetch upstream
git merge upstream/main
```

### Clean Up Local Branches
```bash
# Delete merged branches
git branch --merged | grep -v "main\|dev" | xargs git branch -d

# Delete remote-tracking branches that no longer exist
git fetch --prune
```

### Undo Last Commit (keep changes)
```bash
git reset --soft HEAD~1
```

### Undo All Local Changes
```bash
git reset --hard HEAD
```

### View File History
```bash
git log --follow -- path/to/file
```

### Interactive Rebase (clean up commits before PR)
```bash
git rebase -i dev
```

---

## 15. Team Collaboration

### Communication Channels

- **GitHub Issues:** Bug reports, feature requests, tasks
- **GitHub Discussions:** General questions, ideas, announcements
- **Pull Requests:** Code review and technical discussions
- **Slack/Discord (if applicable):** Real-time communication

### Development Workflow

1. Pick task from GitHub Projects board
2. Move to "In Progress"
3. Create feature branch
4. Develop + test locally
5. Push branch + create PR
6. Request review
7. Address feedback
8. Merge to dev
9. Move task to "Done"

---

**Document Version:** 1.0  
**Last Updated:** December 9, 2025  
**Repository:** https://github.com/webblabsorg/fri.git  
**Maintained By:** Frith AI Development Team
