# Prisma Type Safety Validation

Please perform a comprehensive audit of the codebase to identify and fix all Prisma query type mismatches before I push to GitHub. Follow these steps:

## 1. Analyze the Prisma Schema
First, read and understand the complete Prisma schema:
- Read `prisma/schema.prisma`
- Document all models, their fields, and relations
- Note which fields are direct properties vs relations
- Identify field types (String, Int, DateTime, etc.)

## 2. Find All Prisma Queries
Search for all Prisma database queries in the codebase:
- Look for `prisma.*.findMany()`
- Look for `prisma.*.findUnique()`
- Look for `prisma.*.findFirst()`
- Look for `prisma.*.create()`
- Look for `prisma.*.update()`
- Look for `prisma.*.delete()`
- Check all files in `app/api/` directory
- Check all server components and server actions

## 3. Validate Each Query Against Schema
For each query found, verify:
- **Field names match exactly** (e.g., `message` vs `messages`)
- **Relation queries use correct syntax**:
  - Direct relations: `{ relationName: { field: value } }`
  - One-to-many: `{ relationName: { some: { field: value } } }`
- **Where clauses reference existing fields only**
- **Select/include clauses reference valid fields**
- **Nested queries match the schema structure**

## 4. Common Issues to Fix

### Issue Type 1: Wrong Field Names
```typescript
// ❌ WRONG - field doesn't exist
{ message: { contains: query } }

// ✅ CORRECT - use actual field name
{ messages: { some: { content: { contains: query } } } }
```

### Issue Type 2: Incorrect Relation Queries
```typescript
// ❌ WRONG - treating relation as direct field
{ user: { email: { contains: query } } }

// ✅ CORRECT - query through relation properly
{ user: { OR: [{ email: { contains: query } }] } }
```

### Issue Type 3: Missing Relation Syntax
```typescript
// ❌ WRONG - querying one-to-many without 'some'
{ messages: { content: { contains: query } } }

// ✅ CORRECT - use 'some', 'every', or 'none'
{ messages: { some: { content: { contains: query } } } }
```

## 5. Files to Check Specifically
Pay special attention to:
- `app/api/admin/search/route.ts` (already has known issues)
- Any other search/filter endpoints
- User lookup queries
- Admin dashboard queries
- Report generation queries

## 6. Generate Fix Report
For each issue found, provide:
- **File path and line number**
- **Current incorrect code**
- **Corrected code**
- **Explanation of why it was wrong**

## 7. Verify TypeScript Compilation
After making fixes:
- Run `npx prisma generate` to regenerate Prisma Client
- Run `npm run type-check` or `tsc --noEmit` to verify no type errors
- Confirm all Prisma queries pass TypeScript validation

## 8. Create a Summary
Provide a final summary:
- Total queries audited: X
- Issues found and fixed: Y
- Files modified: [list]
- Any queries that need manual review: [list with reasons]

## Expected Output Format
```
## Prisma Query Audit Results

### Schema Analysis
[Summary of models and relations]

### Issues Found and Fixed

#### 1. app/api/admin/search/route.ts:55
**Issue:** Using non-existent field 'message' on SupportTicket model
**Before:**
```typescript
{ message: { contains: query, mode: 'insensitive' } }
```
**After:**
```typescript
{ messages: { some: { content: { contains: query, mode: 'insensitive' } } } }
```
**Reason:** SupportTicket has a one-to-many 'messages' relation, not a direct 'message' field

[Continue for all issues...]

### Summary
- ✅ All type errors resolved
- ✅ TypeScript compilation successful
- ✅ Ready to push to GitHub
```

---

**Note:** Be thorough and check every single Prisma query. Don't skip any files. The goal is zero type errors before pushing to production.