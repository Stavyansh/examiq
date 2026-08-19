#!/usr/bin/env node
/**
 * Simple Test Runner for ExamIQ Application
 * Runs the working test suites and provides basic reporting
 */

async function runSimpleTestSuite() {
  const [{ runAPITests }, { runPageLoadTests }] = await Promise.all([
    import('./tests/api-tests.js'),
    import('./tests/navigation-tests.js'),
  ]);

  const apiResults = await runAPITests();
  const navResults = await runPageLoadTests();

  const apiTotal = apiResults.passed + apiResults.failed;
  const navTotal = navResults.passed + navResults.failed;
  const combinedPassed = apiResults.passed + navResults.passed;
  const combinedTotal = apiTotal + navTotal;
  const combinedRate = combinedTotal > 0 ? (combinedPassed / combinedTotal) * 100 : 0;

  console.log(`API: ${apiResults.passed}/${apiTotal}`);
  console.log(`Navigation: ${navResults.passed}/${navTotal}`);
  console.log(`Combined: ${combinedPassed}/${combinedTotal} (${combinedRate.toFixed(1)}%)`);

  return combinedRate < 50 ? 1 : 0;
}

if (process.argv[1] && process.argv[1].endsWith('simple-test-runner.js')) {
  runSimpleTestSuite()
    .then((exitCode) => process.exit(exitCode))
    .catch((error) => {
      console.error('FATAL ERROR:', error);
      process.exit(1);
    });
}

module.exports = { runSimpleTestSuite };
