# Beta Ops Runbook

**Purpose:** Step-by-step guide for operating the Frith AI beta launch during Week 37.  
**Audience:** Founders, admins, and support team.  
**Last Updated:** December 11, 2025

---

## Table of Contents

1. [Pre-Launch Checklist](#1-pre-launch-checklist)
2. [Inviting Beta Users](#2-inviting-beta-users)
3. [Monitoring the Beta](#3-monitoring-the-beta)
4. [Handling Support Tickets](#4-handling-support-tickets)
5. [Collecting Feedback](#5-collecting-feedback)
6. [Triggering 7-Day Surveys](#6-triggering-7-day-surveys)
7. [Daily Standup Checklist](#7-daily-standup-checklist)
8. [Emergency Procedures](#8-emergency-procedures)

---

## 1. Pre-Launch Checklist

### Access the Checklist

1. Sign in as an **admin** user.
2. Navigate to `/admin/beta`.
3. Click the **Pre-Launch Checklist** tab.

### Review Each Category

| Category | What to Check |
|----------|---------------|
| **Infrastructure** | All items should be ✅ (DB, env vars, SSL, CDN, status page, monitoring). |
| **Content** | Tools seeded (20+), categories, help articles, marketing pages, blog posts. |
| **Testing** | Smoke test passed, payment flow tested, email delivery tested. |
| **Monitoring** | Sentry active, analytics configured, BetterStack uptime monitoring. |
| **Legal** | Terms and privacy pages published. |
| **Beta Progress** | Shows current beta user count vs 100 target. |

### Manual Checks

Some items require manual verification:

- **Database Backup:** Log into Neon dashboard → verify daily backups enabled.
- **Status Page:** Confirm `STATUS_PAGE_URL` env var is set and page is live.
- **Smoke Test:** Manually run 2-3 tools in production to verify end-to-end flow.

### Readiness Gate

- **All automated checks must be ✅** before inviting users.
- **Readiness %** should be 100% (or close, with only manual items pending).

---

## 2. Inviting Beta Users

### Via Admin Dashboard

1. Go to `/admin/beta`.
2. Click **Invite Beta User** button (top right).
3. Fill in:
   - **Email:** Required.
   - **Name:** Optional (personalizes the email).
4. Click **Send Invitation**.

### What Happens

- An invitation record is created in the database.
- An **invitation email** is sent via Resend with:
  - Beta incentives (3-month free Professional plan, Early Adopter badge).
  - Link to accept: `https://yoursite.com/invite/{token}`.
- The invitation expires in **7 days**.

### When User Accepts

- User clicks the link → signs in or creates account.
- System automatically:
  - Sets `isBetaUser = true`.
  - Sets `earlyAdopter = true`.
  - Sets `subscriptionTier = 'professional'`.
  - Sets `betaTrialEndsAt` to 3 months from now.
- User sees **⭐ Early Adopter** badge in their dashboard sidebar.

### Bulk Invitations

For inviting many users at once, use the API directly:

```bash
# Example: Invite via curl (replace with your admin session cookie)
curl -X POST https://yoursite.com/api/admin/beta/users \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{"email": "user@example.com", "name": "John Smith"}'
```

Or create a simple script that loops through a CSV of emails.

---

## 3. Monitoring the Beta

### Access Metrics Dashboard

1. Go to `/admin/beta`.
2. View the **Key Metrics** cards at the top:
   - **Beta Users:** Current count / 100 target with progress bar.
   - **Tool Runs:** Total runs and success rate.
   - **Support Tickets:** Open tickets count.
   - **System Health:** Healthy / Warning / Critical indicator.

### Metrics Breakdown

Click the **Activity** tab for detailed metrics:

| Metric | What It Tells You |
|--------|-------------------|
| `users.betaUsers` | How many users have accepted beta invitations. |
| `users.earlyAdopters` | Users with the Early Adopter badge. |
| `toolUsage.errorRate` | % of tool runs that failed. Target: < 1%. |
| `support.slaWithin4h` | % of tickets responded to within 4 hours. Target: 100%. |
| `feedback.surveyResponses` | How many users completed the 7-day survey. |
| `payments.failedRate` | % of payment attempts that failed. Target: < 2%. |

### Period Selection

Use the period dropdown (default: 7 days) to view:
- **24h:** Real-time monitoring on launch day.
- **7d:** Weekly trends.
- **30d:** Full beta period overview.

### External Monitoring

- **Sentry:** Check for new errors at `sentry.io/your-org`.
- **BetterStack:** Verify uptime at `betterstack.com`.
- **Vercel:** Check deployment status and function logs.

---

## 4. Handling Support Tickets

### SLA Target

**Respond to all tickets within 4 hours.**

### Workflow

1. Check `/admin/support` (or your ticketing system) regularly.
2. Prioritize by severity:
   - **Critical:** Payment issues, data loss, security → respond immediately.
   - **High:** Tool failures, login issues → respond within 1 hour.
   - **Medium:** UI bugs, feature questions → respond within 4 hours.
   - **Low:** Feature requests, nice-to-haves → respond within 24 hours.
3. Log your first response to start the SLA timer.

### Tracking SLA

The beta dashboard shows:
- **Average Response Time:** How long on average to first response.
- **SLA < 4h %:** Percentage of tickets meeting the 4-hour target.

---

## 5. Collecting Feedback

### In-App Feedback Widget

- The **FeedbackWidget** is automatically mounted on all dashboard pages.
- Users can submit:
  - General feedback
  - Feature requests
  - Bug reports
  - Tool-specific feedback
  - Usability feedback
- All submissions go to the `Feedback` table.

### Viewing Feedback

1. Go to `/admin/beta`.
2. Click the **Feedback** tab.
3. View:
   - Total feedback count.
   - Average rating.
   - Survey responses count.
   - Breakdown by type.

### Exporting Feedback

For detailed analysis, query the database directly:

```sql
SELECT type, subject, message, rating, created_at
FROM "Feedback"
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 6. Triggering 7-Day Surveys

### When to Send

Send survey emails to users who:
- Signed up **7+ days ago**.
- Have **not yet completed** a survey.

### How to Trigger

**Option 1: API Call**

```bash
curl -X POST https://yoursite.com/api/admin/beta/surveys \
  -H "Cookie: session=YOUR_ADMIN_SESSION"
```

Response:
```json
{
  "success": true,
  "totalCandidates": 25,
  "surveysSent": 18
}
```

**Option 2: Scheduled Job (Future)**

Set up a cron job to run this endpoint daily during the beta period.

### Survey Flow

1. User receives email with link to `/beta/survey?user={userId}`.
2. User completes NPS survey (0-10 scale) + satisfaction questions.
3. Response is saved as `Feedback` with `type: 'survey'`.

### Tracking Survey Completion

- Check `feedback.surveyResponses` in the metrics dashboard.
- Target: At least 50% of beta users should complete the survey.

---

## 7. Daily Standup Checklist

Run through this checklist each morning during beta week:

### Morning Check (9 AM)

- [ ] **Errors:** Check Sentry for new errors overnight.
- [ ] **Uptime:** Verify BetterStack shows 100% uptime.
- [ ] **Metrics:** Review `/admin/beta` dashboard:
  - New signups?
  - Error rate still < 1%?
  - Any open support tickets?
- [ ] **Tickets:** Respond to any tickets from overnight.

### Midday Check (1 PM)

- [ ] **Tool Usage:** Are users actively running tools?
- [ ] **Feedback:** Any new feedback submissions?
- [ ] **Payments:** Any failed payments to investigate?

### Evening Check (6 PM)

- [ ] **Day Summary:** Note key metrics for standup.
- [ ] **Tickets:** Ensure all tickets have first response.
- [ ] **Bugs:** Log any bugs found for fixing.

### Daily Standup Agenda (15 min)

1. **Metrics Review:** Beta users, tool runs, error rate.
2. **Issues:** Any critical bugs or user complaints?
3. **Fixes:** What did we fix today?
4. **Tomorrow:** What's the priority for tomorrow?

---

## 8. Emergency Procedures

### Critical Bug Found

1. **Assess Impact:** How many users affected?
2. **Communicate:** Post on status page if widespread.
3. **Fix:** Deploy hotfix immediately.
4. **Notify:** Email affected users if needed.

### Payment System Down

1. **Check Stripe Dashboard:** Is Stripe having issues?
2. **Check Logs:** Look for errors in `/api/stripe/webhook`.
3. **Fallback:** Temporarily disable paid features if needed.
4. **Communicate:** Email affected users.

### Database Issues

1. **Check Neon Dashboard:** Is the database healthy?
2. **Restore from Backup:** If data loss, restore from latest backup.
3. **Notify Users:** If downtime > 5 minutes, post on status page.

### High Error Rate (> 5%)

1. **Check Sentry:** Identify the failing endpoint/tool.
2. **Rollback:** If recent deploy caused it, rollback immediately.
3. **Disable Feature:** If one tool is failing, temporarily disable it.
4. **Investigate:** Fix root cause before re-enabling.

---

## Quick Reference

### Key URLs

| Page | URL |
|------|-----|
| Beta Dashboard | `/admin/beta` |
| Support Tickets | `/admin/support` |
| User Management | `/admin/users` |
| Beta Survey | `/beta/survey` |

### Key API Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Get Checklist | GET | `/api/admin/beta/checklist` |
| Get Metrics | GET | `/api/admin/beta/metrics?period=7d` |
| Invite User | POST | `/api/admin/beta/users` |
| Trigger Surveys | POST | `/api/admin/beta/surveys` |

### Key Environment Variables

Ensure these are set in production:

```
DATABASE_URL=...
NEXTAUTH_SECRET=...
ANTHROPIC_API_KEY=...
STRIPE_SECRET_KEY=...
RESEND_API_KEY=...
SENTRY_DSN=...
BETTERSTACK_API_KEY=...
STATUS_PAGE_URL=...
NEXT_PUBLIC_SITE_URL=...
```

---

## Contacts

| Role | Name | Contact |
|------|------|---------|
| Tech Lead | [Your Name] | [email/slack] |
| Support Lead | [Name] | [email/slack] |
| On-Call | [Rotation] | [pager/slack] |

---

**Good luck with the beta launch! 🚀**
