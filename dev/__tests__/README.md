# Frith AI - Testing Documentation

## Overview

This directory contains the test suite for Frith AI. We use Jest as our testing framework with React Testing Library for component tests.

## Test Structure

```
__tests__/
├── api/                 # API route tests
│   ├── search.test.ts
│   └── templates.test.ts
├── components/          # Component tests
│   └── SaveToProjectModal.test.tsx
├── integration/         # Integration tests
│   └── auth-flow.test.ts
└── lib/                 # Library/utility tests
    └── ai/
        ├── evaluator.test.ts
        ├── prompt-builder.test.ts
        └── tool-executor.test.ts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- search.test.ts
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should return 401"
```

## Test Categories

### 1. API Route Tests (`__tests__/api/`)

Tests for Next.js API routes covering:
- Authentication and authorization
- Request validation
- Response formatting
- Error handling
- Database interactions

**Example:**
```typescript
describe('Search API', () => {
  it('should return 401 if not authenticated', async () => {
    const response = await GET(request)
    expect(response.status).toBe(401)
  })
})
```

### 2. Component Tests (`__tests__/components/`)

Tests for React components using React Testing Library:
- Component rendering
- User interactions
- State management
- Props handling
- Event callbacks

**Example:**
```typescript
it('should call onClose when cancel is clicked', () => {
  render(<SaveToProjectModal isOpen={true} onClose={mockOnClose} />)
  fireEvent.click(screen.getByText(/Cancel/i))
  expect(mockOnClose).toHaveBeenCalled()
})
```

### 3. Integration Tests (`__tests__/integration/`)

End-to-end workflow tests:
- Authentication flows
- Multi-step processes
- Cross-module interactions
- Real-world scenarios

**Example:**
```typescript
describe('Authentication Flow Integration', () => {
  it('should hash and verify password', async () => {
    const hash = await hashPassword('password')
    expect(await verifyPassword('password', hash)).toBe(true)
  })
})
```

### 4. Library Tests (`__tests__/lib/`)

Unit tests for utility functions and services:
- AI prompt building
- Evaluation system
- Tool execution
- Model services

**Example:**
```typescript
it('should build email drafter prompt', () => {
  const result = buildPrompt('EMAIL_DRAFTER', context)
  expect(result).toHaveProperty('system')
  expect(result).toHaveProperty('user')
})
```

## Mocking

### Mocking Modules

```typescript
jest.mock('@/lib/auth', () => ({
  getSessionUser: jest.fn(),
}))
```

### Mocking Fetch

```typescript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ data: 'mock' }),
  })
)
```

### Mocking Prisma

```typescript
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))
```

## Coverage Goals

We aim for the following coverage thresholds:
- **Branches:** 50%
- **Functions:** 50%
- **Lines:** 50%
- **Statements:** 50%

Current coverage areas:
- ✅ API routes (search, templates, projects)
- ✅ Authentication flow
- ✅ AI prompt builder
- ✅ Component interactions
- ⏳ Evaluation system (partial)
- ⏳ Tool executor (partial)

## Best Practices

### 1. Test Naming
Use descriptive test names that explain the behavior:
```typescript
it('should return 401 if not authenticated', ...)
it('should filter templates by category', ...)
it('should create valid JWT token', ...)
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should verify correct password', async () => {
  // Arrange
  const password = 'TestPassword123!'
  const hash = await hashPassword(password)
  
  // Act
  const isValid = await verifyPassword(password, hash)
  
  // Assert
  expect(isValid).toBe(true)
})
```

### 3. Clean Up
Always clean up after tests:
```typescript
afterEach(() => {
  jest.clearAllMocks()
})
```

### 4. Mock External Dependencies
Never make real API calls or database queries in tests:
```typescript
jest.mock('@/lib/db')
jest.mock('@anthropic-ai/sdk')
```

### 5. Test Edge Cases
```typescript
it('should handle empty context gracefully', ...)
it('should reject expired JWT token', ...)
it('should return 400 if query is too short', ...)
```

## Writing New Tests

### For API Routes:
1. Mock authentication
2. Mock database calls
3. Test success cases
4. Test error cases
5. Test validation

### For Components:
1. Test rendering
2. Test user interactions
3. Test props handling
4. Test callbacks
5. Test conditional rendering

### For Utilities:
1. Test expected behavior
2. Test edge cases
3. Test error handling
4. Test input validation

## Debugging Tests

### Run single test in debug mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand search.test.ts
```

### Use console.log
```typescript
console.log('Response:', await response.json())
```

### Use screen.debug()
```typescript
import { screen } from '@testing-library/react'
screen.debug() // Prints DOM
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployments

Build fails if:
- Any test fails
- Coverage drops below thresholds
- TypeScript errors exist

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Common Issues

### Issue: "Cannot find module '@/..'"
**Solution:** Check `jest.config.js` has correct module mapper

### Issue: "ReferenceError: fetch is not defined"
**Solution:** Ensure `jest.setup.js` mocks global.fetch

### Issue: "TypeError: Cannot read property 'findMany' of undefined"
**Solution:** Mock the entire Prisma client properly

## Test Maintenance

- Update tests when APIs change
- Add tests for new features
- Remove tests for deprecated features
- Keep mocks in sync with implementations
- Review coverage reports regularly

## Phase 3 Test Coverage

### Days 1-9 Feature Tests:
- ✅ Day 1: Output Management (SaveToProjectModal)
- ✅ Day 2: Projects System (API routes)
- ✅ Day 3: Favorites System (integration)
- ✅ Day 4-5: AI Evaluation (evaluator.test.ts)
- ✅ Day 6: Onboarding (component tests)
- ✅ Day 7: Templates (API and component tests)
- ✅ Day 8: Global Search (search.test.ts)
- ✅ Day 9: Streaming (integration)

## Phase 8 Test Coverage (Testing & QA)

### Sprint 8.1: Functional Testing
- ✅ **Authentication** (`functional/auth.test.ts`)
  - Sign up, email verification, sign in
  - Password reset flow
  - Session management and logout
  - Account lockout protection
  - 15+ test cases

- ✅ **Admin Dashboard** (`api/admin-users.test.ts`)
  - User management (CRUD)
  - Role-based access control
  - Audit logging
  - 12+ test cases

- ✅ **Tools API** (`api/tools.test.ts`)
  - Tool catalog listing and filtering
  - Tool execution flow
  - Tool run history
  - 15+ test cases

- ✅ **Support System** (`api/support-tickets.test.ts`)
  - Ticket creation and management
  - Ticket replies and status updates
  - 10+ test cases

### Sprint 8.2: Security Audit
- ✅ **Security Tests** (`security/security-audit.test.ts`)
  - Password security (bcrypt, rounds)
  - Session security (httpOnly, secure cookies)
  - Rate limiting verification
  - Role-based access control
  - Multi-tenant isolation
  - XSS/SQL injection prevention
  - AI data privacy
  - 25+ test cases

### Sprint 8.3: Performance & AI Regression
- ✅ **Performance Tests** (`performance/performance.test.ts`)
  - API response time benchmarks
  - Database query performance
  - Load testing simulation
  - Memory usage checks
  - 20+ test cases

- ✅ **AI Regression** (`performance/performance.test.ts`)
  - Model quality benchmarks
  - Phase 3 baseline comparisons
  - Edge case handling
  - 15+ test cases

### Sprint 8.4: Payment & Email
- ✅ **Stripe Integration** (`api/stripe.test.ts`)
  - Checkout session creation
  - Webhook handling
  - Subscription management
  - 15+ test cases

- ✅ **Email Service** (`lib/email.test.ts`)
  - Verification emails
  - Password reset emails
  - Subscription confirmations
  - Error handling
  - 15+ test cases

### Test Summary
| Category | Test Files | Test Cases |
|----------|------------|------------|
| API Tests | 8 | 80+ |
| Functional Tests | 1 | 15+ |
| Security Tests | 1 | 25+ |
| Performance Tests | 1 | 35+ |
| Integration Tests | 2 | 20+ |
| Component Tests | 3 | 15+ |
| Library Tests | 4 | 30+ |
| **Total** | **20+** | **220+** |

### External Testing Scripts
- `prod/load-test.js` - k6 load testing script (1000 concurrent users)
- `prod/ai-regression-test.js` - AI quality regression testing

Total test files: 20+
Total test cases: 220+
Target Coverage: 80%
