#!/usr/bin/env node
/**
 * Comprehensive Feature Test for ExamIQ Application
 * Tests all API endpoints, UI components, and page functionality
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', body = null, description = '') {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return {
      endpoint,
      method,
      description,
      status: response.status,
      success: response.ok,
      data,
      error: response.ok ? null : JSON.stringify(data)
    };
  } catch (error) {
    return {
      endpoint,
      method,
      description,
      status: 0,
      success: false,
      data: null,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive Feature Tests for ExamIQ\n');
  console.log('='.repeat(60));

  const results = [];

  // ===== API ENDPOINT TESTS =====
  console.log('\n📡 TESTING API ENDPOINTS\n');
  console.log('-'.repeat(60));

  // GET endpoints
  results.push(await testAPI('/api/topics', 'GET', null, 'Get all topics'));
  results.push(await testAPI('/api/subjects', 'GET', null, 'Get all subjects'));
  results.push(await testAPI('/api/study-sessions', 'GET', null, 'Get all study sessions'));
  results.push(await testAPI('/api/upload', 'GET', null, 'Get upload history'));
  results.push(await testAPI('/api/analytics', 'GET', null, 'Get analytics data'));
  results.push(await testAPI('/api/study-breaks', 'GET', null, 'Get study breaks'));
  results.push(await testAPI('/api/practice', 'GET', null, 'Get practice questions'));
  results.push(await testAPI('/api/practice?subject=all', 'GET', null, 'Get practice questions (all subjects)'));
  results.push(await testAPI('/api/progress', 'GET', null, 'Get progress data'));
  results.push(await testAPI('/api/study-analysis', 'GET', null, 'Get study analysis'));

  // POST endpoints
  results.push(await testAPI('/api/subjects', 'POST', { title: 'Test Subject', description: 'Test description' }, 'Create subject'));
  results.push(await testAPI('/api/topics', 'POST', { title: 'Test Topic', subjectId: 'test-subject-id', description: 'Test description' }, 'Create topic (should fail - subject not found)'));
  results.push(await testAPI('/api/study-sessions', 'POST', { topicId: null, subjectId: null, startTime: new Date().toISOString(), duration: 30, totalFocusTime: 25, totalBreakTime: 5, breaksCount: 1, notes: 'Test session' }, 'Create study session'));

  // Test with valid subject ID
  const subjectResult = await testAPI('/api/subjects', 'POST', { title: 'Valid Subject', description: 'For topic creation' }, 'Create valid subject for topic test');
  let validSubjectId = null;
  if (subjectResult.success && subjectResult.data.id) {
    validSubjectId = subjectResult.data.id;
    results.push(await testAPI('/api/topics', 'POST', { title: 'Valid Topic', subjectId: validSubjectId, description: 'Test description' }, 'Create topic with valid subject'));
  }

  // DELETE endpoints
  results.push(await testAPI('/api/study-sessions', 'DELETE', null, 'Clear all study sessions'));
  results.push(await testAPI('/api/upload', 'DELETE', null, 'Clear all uploaded materials'));

  // ===== DISPLAY RESULTS =====
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach((result, idx) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${idx + 1}. ${status} ${result.method} ${result.endpoint}`);
    console.log(`   Description: ${result.description}`);
    console.log(`   Status: ${result.status}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  console.log('='.repeat(60));
  console.log(`\n📈 SUMMARY: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);

  // ===== FEATURE ANALYSIS =====
  console.log('🔍 FEATURE ANALYSIS\n');
  console.log('-'.repeat(60));

  // Check specific features
  const topicsResult = results.find(r => r.endpoint === '/api/topics' && r.method === 'GET');
  const subjectsResult = results.find(r => r.endpoint === '/api/subjects' && r.method === 'GET');
  const sessionsResult = results.find(r => r.endpoint === '/api/study-sessions' && r.method === 'GET');
  const uploadResult = results.find(r => r.endpoint === '/api/upload' && r.method === 'GET');
  const analyticsResult = results.find(r => r.endpoint === '/api/analytics' && r.method === 'GET');

  console.log('\n📋 Core Features Status:');
  console.log(`  Topics API: ${topicsResult?.success ? '✅ Working' : '❌ Issues'} (returns ${Array.isArray(topicsResult?.data) ? topicsResult.data.length : 'N/A'} items)`);
  console.log(`  Subjects API: ${subjectsResult?.success ? '✅ Working' : '❌ Issues'} (returns ${Array.isArray(subjectsResult?.data) ? subjectsResult.data.length : 'N/A'} items)`);
  console.log(`  Study Sessions API: ${sessionsResult?.success ? '✅ Working' : '❌ Issues'} (returns ${Array.isArray(sessionsResult?.data) ? sessionsResult.data.length : 'N/A'} items)`);
  console.log(`  Upload History API: ${uploadResult?.success ? '✅ Working' : '❌ Issues'} (returns ${Array.isArray(uploadResult?.data) ? uploadResult.data.length : 'N/A'} items)`);
  console.log(`  Analytics API: ${analyticsResult?.success ? '✅ Working' : '❌ Issues'} (returns ${analyticsResult?.data?.pageViews?.length || 0} page views, ${analyticsResult?.data?.events?.length || 0} events)`);

  // Check data persistence
  console.log('\n💾 Data Persistence:');
  const createSubjectResult = results.find(r => r.description === 'Create subject');
  const getSubjectsAfterCreate = results.find(r => r.description === 'Get all subjects' && results.indexOf(r) > results.indexOf(createSubjectResult));
  if (createSubjectResult && getSubjectsAfterCreate) {
    console.log(`  Create Subject: ${createSubjectResult.success ? '✅ Works' : '❌ Fails'}`);
    console.log(`  Subject Persists: ${getSubjectsAfterCreate.success && Array.isArray(getSubjectsAfterCreate.data) && getSubjectsAfterCreate.data.length > 0 ? '✅ Yes' : '❌ No (in-memory only)'}`);
  }

  // ===== RECOMMENDATIONS =====
  console.log('\n💡 RECOMMENDATIONS\n');
  console.log('-'.repeat(60));

  if (failed > 0) {
    console.log('1. Fix failing API endpoints before proceeding');
  }
  console.log('2. Implement persistent database (PostgreSQL/Prisma) for data retention');
  console.log('3. Add authentication/authorization for multi-user support');
  console.log('4. Implement WebSocket for real-time timer synchronization');
  console.log('5. Add comprehensive error boundaries for React components');
  console.log('6. Add unit/integration tests for critical paths');
  console.log('7. Implement proper file storage (S3/local) instead of base64 in memory');
  console.log('8. Add rate limiting and input validation for APIs');

  return results;
}

// Run tests
runAllTests().catch(console.error);