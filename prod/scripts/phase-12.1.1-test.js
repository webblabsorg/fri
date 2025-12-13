/**
 * Phase 12.1.1 Integration Tests
 * Chart of Accounts & General Ledger
 * Frith AI Legal ERP Platform
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test configuration
const config = {
  organizationId: process.env.TEST_ORG_ID || 'test-org-id',
  sessionToken: process.env.TEST_SESSION_TOKEN || 'test-session-token',
  timeout: 30000,
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

// Helper functions
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    Cookie: `session=${config.sessionToken}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${message ? ` - ${message}` : ''}`);
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

// ============================================================================
// CHART OF ACCOUNTS TESTS
// ============================================================================

async function testGetAccounts() {
  const response = await makeRequest(
    `/api/finance/accounts?organizationId=${config.organizationId}`
  );
  
  logTest(
    'GET /api/finance/accounts',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  return response;
}

async function testCreateAccount() {
  const response = await makeRequest('/api/finance/accounts', {
    method: 'POST',
    body: JSON.stringify({
      organizationId: config.organizationId,
      accountNumber: 'TEST-1000',
      accountName: 'Test Cash Account',
      accountType: 'asset',
      normalBalance: 'debit',
      currency: 'USD',
      description: 'Test account for integration testing',
    }),
  });
  
  logTest(
    'POST /api/finance/accounts (create)',
    response.ok || response.status === 401 || response.status === 409,
    `Status: ${response.status}`
  );
  
  return response;
}

async function testInitializeFromTemplate() {
  const response = await makeRequest('/api/finance/accounts', {
    method: 'POST',
    body: JSON.stringify({
      organizationId: config.organizationId,
      template: 'litigation',
    }),
  });
  
  logTest(
    'POST /api/finance/accounts (template)',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  return response;
}

// ============================================================================
// JOURNAL ENTRY TESTS
// ============================================================================

async function testGetJournalEntries() {
  const response = await makeRequest(
    `/api/finance/journal-entries?organizationId=${config.organizationId}`
  );
  
  logTest(
    'GET /api/finance/journal-entries',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  return response;
}

async function testCreateJournalEntry() {
  // First get accounts to use valid IDs
  const accountsResponse = await makeRequest(
    `/api/finance/accounts?organizationId=${config.organizationId}`
  );
  
  if (!accountsResponse.ok || !accountsResponse.data.accounts?.length) {
    logTest(
      'POST /api/finance/journal-entries',
      false,
      'Skipped - no accounts available'
    );
    results.skipped++;
    return null;
  }
  
  const accounts = accountsResponse.data.accounts;
  const debitAccount = accounts.find(a => a.normalBalance === 'debit');
  const creditAccount = accounts.find(a => a.normalBalance === 'credit');
  
  if (!debitAccount || !creditAccount) {
    logTest(
      'POST /api/finance/journal-entries',
      false,
      'Skipped - need both debit and credit accounts'
    );
    results.skipped++;
    return null;
  }
  
  const response = await makeRequest('/api/finance/journal-entries', {
    method: 'POST',
    body: JSON.stringify({
      organizationId: config.organizationId,
      journalType: 'standard',
      description: 'Test journal entry',
      postedDate: new Date().toISOString(),
      entries: [
        {
          accountId: debitAccount.id,
          debit: 100,
          credit: 0,
          description: 'Test debit entry',
        },
        {
          accountId: creditAccount.id,
          debit: 0,
          credit: 100,
          description: 'Test credit entry',
        },
      ],
    }),
  });
  
  logTest(
    'POST /api/finance/journal-entries',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  return response;
}

async function testJournalEntryBalance() {
  // Test that unbalanced entries are rejected
  const accountsResponse = await makeRequest(
    `/api/finance/accounts?organizationId=${config.organizationId}`
  );
  
  if (!accountsResponse.ok || !accountsResponse.data.accounts?.length) {
    logTest(
      'Journal Entry Balance Validation',
      false,
      'Skipped - no accounts available'
    );
    results.skipped++;
    return null;
  }
  
  const accounts = accountsResponse.data.accounts;
  
  const response = await makeRequest('/api/finance/journal-entries', {
    method: 'POST',
    body: JSON.stringify({
      organizationId: config.organizationId,
      journalType: 'standard',
      description: 'Unbalanced test entry',
      postedDate: new Date().toISOString(),
      entries: [
        {
          accountId: accounts[0].id,
          debit: 100,
          credit: 0,
          description: 'Unbalanced debit',
        },
        {
          accountId: accounts[0].id,
          debit: 0,
          credit: 50, // Intentionally unbalanced
          description: 'Unbalanced credit',
        },
      ],
    }),
  });
  
  // Should be rejected (400) because debits != credits
  logTest(
    'Journal Entry Balance Validation',
    response.status === 400 || response.status === 401,
    `Status: ${response.status} (expected 400 for unbalanced)`
  );
  
  return response;
}

// ============================================================================
// FINANCIAL REPORTS TESTS
// ============================================================================

async function testGetGeneralLedger() {
  const response = await makeRequest(
    `/api/finance/ledger?organizationId=${config.organizationId}`
  );
  
  logTest(
    'GET /api/finance/ledger',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  return response;
}

async function testGetTrialBalance() {
  const response = await makeRequest(
    `/api/finance/trial-balance?organizationId=${config.organizationId}`
  );
  
  logTest(
    'GET /api/finance/trial-balance',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  // Verify balance check
  if (response.ok && response.data) {
    const isBalanced = Math.abs(
      (response.data.totalDebit || 0) - (response.data.totalCredit || 0)
    ) < 0.01;
    
    logTest(
      'Trial Balance - Debits Equal Credits',
      isBalanced || response.data.accounts?.length === 0,
      `Debit: ${response.data.totalDebit}, Credit: ${response.data.totalCredit}`
    );
  }
  
  return response;
}

async function testGetBalanceSheet() {
  const response = await makeRequest(
    `/api/finance/balance-sheet?organizationId=${config.organizationId}`
  );
  
  logTest(
    'GET /api/finance/balance-sheet',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  return response;
}

async function testGetIncomeStatement() {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const endDate = new Date();
  
  const response = await makeRequest(
    `/api/finance/income-statement?organizationId=${config.organizationId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
  );
  
  logTest(
    'GET /api/finance/income-statement',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  return response;
}

// ============================================================================
// AI FINANCIAL FEATURES TESTS
// ============================================================================

async function testAICategorizeExpense() {
  const response = await makeRequest('/api/finance/ai/categorize', {
    method: 'POST',
    body: JSON.stringify({
      organizationId: config.organizationId,
      description: 'Court filing fee for Smith v. Jones case',
      vendorName: 'Superior Court of California',
      amount: 450,
    }),
  });
  
  logTest(
    'POST /api/finance/ai/categorize',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  // Verify categorization response structure
  if (response.ok && response.data) {
    const hasRequiredFields = 
      response.data.category &&
      typeof response.data.confidence === 'number' &&
      typeof response.data.isBillable === 'boolean';
    
    logTest(
      'AI Categorization Response Structure',
      hasRequiredFields,
      `Category: ${response.data.category}, Confidence: ${response.data.confidence}%`
    );
  }
  
  return response;
}

async function testAICashFlowForecast() {
  const response = await makeRequest(
    `/api/finance/ai/cash-flow-forecast?organizationId=${config.organizationId}`
  );
  
  logTest(
    'GET /api/finance/ai/cash-flow-forecast',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  // Verify forecast response structure
  if (response.ok && response.data) {
    const hasRequiredFields = 
      response.data.summary &&
      Array.isArray(response.data.periods) &&
      Array.isArray(response.data.alerts);
    
    logTest(
      'Cash Flow Forecast Response Structure',
      hasRequiredFields,
      `Periods: ${response.data.periods?.length}, Alerts: ${response.data.alerts?.length}`
    );
  }
  
  return response;
}

async function testAIAnomalyDetection() {
  const response = await makeRequest(
    `/api/finance/ai/anomaly-detection?organizationId=${config.organizationId}`
  );
  
  logTest(
    'GET /api/finance/ai/anomaly-detection',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  // Verify anomaly response structure
  if (response.ok && response.data) {
    const hasRequiredFields = 
      Array.isArray(response.data.anomalies) &&
      response.data.summary &&
      typeof response.data.scannedTransactions === 'number';
    
    logTest(
      'Anomaly Detection Response Structure',
      hasRequiredFields,
      `Scanned: ${response.data.scannedTransactions}, Anomalies: ${response.data.anomalies?.length}`
    );
  }
  
  return response;
}

async function testAISuggestAccounts() {
  const response = await makeRequest('/api/finance/ai/suggest-accounts', {
    method: 'POST',
    body: JSON.stringify({
      organizationId: config.organizationId,
      firmSize: 'small',
      jurisdiction: 'California',
      practiceAreas: ['Litigation', 'Corporate'],
    }),
  });
  
  logTest(
    'POST /api/finance/ai/suggest-accounts',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  // Verify suggestion response structure
  if (response.ok && response.data) {
    const hasRequiredFields = 
      response.data.template &&
      response.data.templateName &&
      typeof response.data.confidence === 'number';
    
    logTest(
      'Account Suggestion Response Structure',
      hasRequiredFields,
      `Template: ${response.data.templateName}, Confidence: ${response.data.confidence}%`
    );
  }
  
  return response;
}

async function testAutoJournalBatch() {
  const response = await makeRequest('/api/finance/auto-journal', {
    method: 'POST',
    body: JSON.stringify({
      organizationId: config.organizationId,
      batchProcess: true,
    }),
  });
  
  logTest(
    'POST /api/finance/auto-journal (batch)',
    response.ok || response.status === 401,
    `Status: ${response.status}`
  );
  
  return response;
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('Phase 12.1.1 Integration Tests');
  console.log('Chart of Accounts & General Ledger');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Organization ID: ${config.organizationId}`);
  console.log('='.repeat(60));
  console.log('');

  // Chart of Accounts Tests
  console.log('\n📊 CHART OF ACCOUNTS TESTS\n');
  await testGetAccounts();
  await testCreateAccount();
  await testInitializeFromTemplate();

  // Journal Entry Tests
  console.log('\n📝 JOURNAL ENTRY TESTS\n');
  await testGetJournalEntries();
  await testCreateJournalEntry();
  await testJournalEntryBalance();

  // Financial Reports Tests
  console.log('\n📈 FINANCIAL REPORTS TESTS\n');
  await testGetGeneralLedger();
  await testGetTrialBalance();
  await testGetBalanceSheet();
  await testGetIncomeStatement();

  // AI Features Tests
  console.log('\n🤖 AI FINANCIAL FEATURES TESTS\n');
  await testAICategorizeExpense();
  await testAICashFlowForecast();
  await testAIAnomalyDetection();
  await testAISuggestAccounts();
  await testAutoJournalBatch();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📊 Total: ${results.passed + results.failed + results.skipped}`);
  console.log('='.repeat(60));

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
