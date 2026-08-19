#!/usr/bin/env node
/**
 * Page Load and Navigation Tests for ExamIQ Application
 * Tests all 10 pages for accessibility, loading states, and navigation functionality
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testPageLoad(path, description, expectedElements = []) {
  try {
    const response = await fetch(`${BASE_URL}${path}`);
    const html = await response.text();

    const success = response.status === 200;
    let missingElements = [];

    if (success && expectedElements.length > 0) {
      missingElements = expectedElements.filter(el => !html.includes(el));
    }

    return {
      path,
      description,
      status: response.status,
      success: success && missingElements.length === 0,
      missingElements,
      responseTime: 0 // Would measure actual time in real implementation
    };
  } catch (error) {
    return {
      path,
      description,
      status: 0,
      success: false,
      error: error.message,
      missingElements: expectedElements
    };
  }
}

async function testNavigationLink(fromPath, toPath, linkText) {
  // In a real implementation, this would use a browser automation tool
  // For now, we'll verify the link exists in the HTML
  try {
    const response = await fetch(`${BASE_URL}${fromPath}`);
    const html = await response.text();

    // Look for the link in the navigation
    const linkPattern = new RegExp(`<a[^>]*href=["']${toPath}["'][^>]*>[^<]*${linkText}[^<]*</a>`, 'i');
    const linkExists = linkPattern.test(html);

    return {
      fromPath,
      toPath,
      linkText,
      success: linkExists,
      description: `Navigate from ${fromPath} to ${toPath} via "${linkText}" link`
    };
  } catch (error) {
    return {
      fromPath,
      toPath,
      linkText,
      success: false,
      error: error.message,
      description: `Navigate from ${fromPath} to ${toPath} via "${linkText}" link`
    };
  }
}

async function runPageLoadTests() {
  console.log('�������������������������������������������🧪 Starting Page Load and Navigation Tests for ExamIQ\n');
  console.log('='.replace('=', 70));

  const results = [];

  // ===== PAGE LOAD TESTS =====
  console.log('\n�������������������������📄 TESTING PAGE LOADING (All 10 Pages)\n');
  console.log('-'.repeat(70));

  const pages = [
    { path: '/', description: 'Dashboard - Main overview with timer, topics, uploads, streaks',
      expectedElements: ['ExamIQ', 'Study Timer', 'Upload Study Materials', 'Streak Tracker'] },
    { path: '/subjects', description: 'Subjects - Subject management',
      expectedElements: ['Subjects', 'Add Subject', 'subject-list'] },
    { path: '/topics', description: 'Topics - Topic listing and creation',
      expectedElements: ['Topics', 'Add Topic', 'topic-list'] },
    { path: '/pyq-analysis', description: 'PYQ Analysis - Previous year question analysis',
      expectedElements: ['PYQ Analysis', 'Upload Study Materials', 'analyze-button'] },
    { path: '/study-plan', description: 'Study Plan - Study scheduling',
      expectedElements: ['Study Plan', 'calendar-view', 'plan-generation'] },
    { path: '/practice', description: 'Practice - Practice question interface',
      expectedElements: ['Practice', 'question-container', 'answer-options'] },
    { path: '/progress', description: 'Progress - Learning analytics and progress tracking',
      expectedElements: ['Progress', 'progress-charts', 'stats-section'] },
    { path: '/settings', description: 'Settings - User preferences and configuration',
      expectedElements: ['Settings', 'api-key-input', 'model-selector'] },
    { path: '/upload', description: 'Upload - File upload and processing',
      expectedElements: ['Upload Materials', 'file-upload-area', 'upload-button'] },
    { path: '/analytics', description: 'Analytics - Detailed performance metrics',
      expectedElements: ['Analytics', 'metrics-display', 'trend-charts'] }
  ];

  for (const page of pages) {
    const result = await testPageLoad(page.path, page.description, page.expectedElements);
    results.push(result);
  }

  // ===== NAVIGATION LINK TESTS =====
  console.log('\n�������������������������������������🔗 TESTING NAVIGATION LINKS\n');
  console.log('-'.repeat(70));

  // Test sidebar navigation from dashboard to all other pages
  const navLinks = [
    { from: '/', to: '/subjects', text: 'Subjects' },
    { from: '/', to: '/topics', text: 'Topics' },
    { from: '/', to: '/pyq-analysis', text: 'PYQ Analysis' },
    { from: '/', to: '/study-plan', text: 'Study Plan' },
    { from: '/', to: '/practice', text: 'Practice' },
    { from: '/', to: '/progress', text: 'Progress' },
    { from: '/', to: '/settings', text: 'Settings' },
    { from: '/', to: '/upload', text: 'Upload Materials' },
    { from: '/', to: '/analytics', text: 'Analytics' }
  ];

  for (const link of navLinks) {
    // Note: This is simplified - real implementation would use browser automation
    const result = await testNavigationLink(link.from, link.to, link.text);
    results.push(result);
  }

  // Test breadcrumb/back navigation
  console.log('\n����������������������� ����������������������������� ���� TESTING PAGE-SPECIFIC FUNCTIONALITY\n');
  console.log('-'.repeat(70));

  // Test dashboard specific functionality
  const dashboardTests = [
    { path: '/', description: 'Dashboard - Timer component presence',
      check: (html) => html.includes('Timer') && html.includes('Start Study Session') },
    { path: '/', description: 'Dashboard - FileUploader component presence',
      check: (html) => html.includes('FileUploader') || html.includes('Upload Study Materials') },
    { path: '/', description: 'Dashboard - StreakTracker component presence',
      check: (html) => html.includes('StreakTracker') || html.includes('Study Streak') },
    { path: '/', description: 'Dashboard - TopicCard components presence',
      check: (html) => html.includes('TopicCard') || html.includes('Study Next') }
  ];

  for (const test of dashboardTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`);
      const html = await response.text();
      const success = test.check(html);

      results.push({
        path: test.path,
        description: test.description,
        status: 200,
        success: success,
        missingElements: success ? [] : ['Component not found or not functioning']
      });
    } catch (error) {
      results.push({
        path: test.path,
        description: test.description,
        status: 0,
        success: false,
        error: error.message,
        missingElements: ['Failed to load page']
      });
    }
  }

  // Test subjects page specific functionality
  const subjectsTests = [
    { path: '/subjects', description: 'Subjects page - Add Subject button',
      check: (html) => html.includes('Add Subject') },
    { path: '/subjects', description: 'Subjects page - Subject list container',
      check: (html) => html.includes('subject-list') || html.includes('grid-cols-') }
  ];

  for (const test of subjectsTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`);
      const html = await response.text();
      const success = test.check(html);

      results.push({
        path: test.path,
        description: test.description,
        status: 200,
        success: success,
        missingElements: success ? [] : ['Element not found']
      });
    } catch (error) {
      results.push({
        path: test.path,
        description: test.description,
        status: 0,
        success: false,
        error: error.message,
        missingElements: ['Failed to load page']
      });
    }
  }

  // ===== DISPLAY RESULTS =====
  console.log('\n' + '='.repeat(70));
  console.log('�������������������������������������������📊 PAGE LOAD & NAVIGATION TEST RESULTS\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach((result, idx) => {
    const status = result.success ? '��������������✅ PASS' : '��������������❌ FAIL';
    console.log(`${idx + 1}. ${status} ${result.description}`);
    if (!result.success) {
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.missingElements && result.missingElements.length > 0) {
        console.log(`   Missing: ${result.missingElements.join(', ')}`);
      }
    }
    console.log('');
  });

  console.log('='.repeat(70));
  console.log(`\n�������������������������������������������📈 SUMMARY: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);

  // ===== PAGE-BY-PAGE BREAKDOWN =====
  console.log('�������������������������������������������📋 PAGE-BY-PAGE BREAKDOWN\n');
  console.log('-'.repeat(70));

  const pageResults = {};
  results.forEach(result => {
    const page = result.path || 'unknown';
    if (!pageResults[page]) {
      pageResults[page] = { passed: 0, failed: 0, tests: [] };
    }
    pageResults[page].tests.push(result);
    if (result.success) {
      pageResults[page].passed++;
    } else {
      pageResults[page].failed++;
    }
  });

  for (const [page, data] of Object.entries(pageResults)) {
    const pageName = page === '/' ? 'Dashboard' :
                    page === '/subjects' ? 'Subjects' :
                    page === '/topics' ? 'Topics' :
                    page === '/pyq-analysis' ? 'PYQ Analysis' :
                    page === '/study-plan' ? 'Study Plan' :
                    page === '/practice' ? 'Practice' :
                    page === '/progress' ? 'Progress' :
                    page === '/settings' ? 'Settings' :
                    page === '/upload' ? 'Upload' :
                    page === '/analytics' ? 'Analytics' : page;

    const total = data.passed + data.failed;
    const rate = total > 0 ? (data.passed / total) * 100 : 0;

    console.log(`${pageName}: ${data.passed}/${total} tests passed (${rate.toFixed(1)}%)`);
    if (data.failed > 0) {
      console.log(`  ������ ���� Failed tests:`);
      data.tests
        .filter(t => !t.success)
        .forEach(t => console.log(`    - ${t.description}`));
    }
  }

  // ===== RECOMMENDATIONS =====
  console.log('\n�������������������������������������������💡 RECOMMENDATIONS\n');
  console.log('-'.repeat(70));

  if (failed > 0) {
    console.log('1. Review failing tests above and fix any legitimate issues');
  }
  console.log('2. Implement proper loading skeletons for better perceived performance');
  console.log('3. Add screen reader announcements for page transitions');
  console.log('4. Implement route transition animations for better UX');
  console.log('5. Add 404 page for invalid routes');
  console.log('6. Implement route guarding for protected pages (when auth added)');
  console.log('7. Add scroll restoration for better navigation experience');
  console.log('8. Implement proper SEO meta tags for each page');
  console.log('9. Add loading indicators for async data fetching');
  console.log('10. Implement graceful degradation for JavaScript-disabled environments');

  return { passed, failed, total: results.length, successRate: (passed / results.length) * 100 };
}

// Run tests if called directly
if (require.main === module) {
  runPageLoadTests().catch(console.error);
}

module.exports = { runPageLoadTests };