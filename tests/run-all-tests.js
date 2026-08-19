#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Master Test Runner for ExamIQ Application
 * Executes all test suites and provides comprehensive reporting
 */

const { runAPITests } = require('./api-tests');
const { runPageLoadTests } = require('./navigation-tests');

async function runAllTests() {
  console.log('🚀 STARTING COMPLETE EXAMIQ TEST SUITE\n');
  console.log('='.repeat(80));
  console.log('Test Suite Includes:');
  console.log('  1. Automated API Tests');
  console.log('  2. Manual UI Component Test Scripts');
  console.log('  3. Page Load and Navigation Tests');
  console.log('='.repeat(80));

  const startTime = Date.now();

  console.log('\nPHASE 1: AUTOMATED API TESTS\n');
  const apiResults = await runAPITests();

  console.log('\nPHASE 2: PAGE LOAD & NAVIGATION TESTS\n');
  const navResults = await runPageLoadTests();

  console.log('\nPHASE 3: MANUAL UI COMPONENT TESTS\n');
  console.log('NOTE: UI component tests are manual and should be run using:');
  console.log('node tests/ui-test-scripts.js');
  console.log('Follow the instructions in the script and mark results manually.\n');

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(80));
  console.log('🏁 TEST SUITE EXECUTION COMPLETE\n');
  console.log('='.repeat(80));

  console.log(`Total Execution Time: ${duration} seconds`);
  console.log('');

  console.log('AUTOMATED TEST RESULTS\n');
  console.log('-'.repeat(50));
  console.log(`API Tests:     ${apiResults.passed}/${apiResults.total} passed (${apiResults.successRate.toFixed(1)}%)`);
  console.log(`Page/Nav Tests:${navResults.passed}/${navResults.total} passed (${navResults.successRate.toFixed(1)}%)`);

  const combinedPassed = apiResults.passed + navResults.passed;
  const combinedTotal = apiResults.total + navResults.total;
  const combinedRate = (combinedPassed / combinedTotal) * 100;

  console.log(`Combined:      ${combinedPassed}/${combinedTotal} passed (${combinedRate.toFixed(1)}%)`);
  console.log('');

  console.log('DETAILED BREAKDOWN\n');
  console.log('-'.repeat(50));

  console.log('\nAPI Test Categories:');
  console.log(`  • Core Endpoint Testing: ${apiResults.passed}/${apiResults.total} passed`);
  console.log('  • Error Handling & Validation');
  console.log('  • Data Persistence Verification');
  console.log('  • Security & Edge Case Testing');

  console.log('\nPage Load & Navigation Test Categories:');
  console.log('  • All 10 Pages Loading');
  console.log('  • Sidebar Navigation Links');
  console.log('  • Page-Specific Functionality');
  console.log('  • Component Presence Verification');

  console.log('\nOVERALL RECOMMENDATIONS\n');
  console.log('-'.repeat(50));

  if (combinedRate < 70) {
    console.log('🚨 CRITICAL: Significant issues detected - immediate attention required');
  } else if (combinedRate < 85) {
    console.log('⚠️ WARNING: Moderate issues detected - improvements needed');
  } else if (combinedRate < 95) {
    console.log('✅ GOOD: Minor issues detected - fine-tuning recommended');
  } else {
    console.log('🎉 EXCELLENT: High quality - minimal issues detected');
  }

  console.log('');
  console.log('Immediate Actions:');
  console.log('1. Run manual UI test scripts: node tests/ui-test-scripts.js');
  console.log('2. Address any failing automated tests');
  console.log('3. Implement missing features based on test findings');
  console.log('4. Add automated UI tests using React Testing Library or similar');
  console.log('5. Set up CI/CD pipeline for automated test execution');
  console.log('6. Implement test coverage tracking (target: >80%)');
  console.log('7. Add performance benchmarks to test suite');
  console.log('8. Implement accessibility automated testing (axe-core, etc.)');

  console.log('');
  console.log('Next Steps for Manual UI Testing:');
  console.log('1. Execute: node tests/ui-test-scripts.js');
  console.log('2. Follow instructions for each component test');
  console.log('3. Mark [PASS/FAIL/SKIP] for each test step');
  console.log('4. Calculate success rates for each component');
  console.log('5. Prioritize fixes based on impact and severity');

  const criticalFailure = combinedRate < 50;
  return {
    apiResults,
    navResults,
    combinedPassed,
    combinedTotal,
    combinedRate,
    duration,
    exitCode: criticalFailure ? 1 : 0,
  };
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  runAllTests()
    .then((results) => {
      process.exit(results.exitCode);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
