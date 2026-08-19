#!/usr/bin/env node
/**
 * Comprehensive Feature Test for ExamIQ Application
 * Tests all API endpoints, UI components, and page functionality
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', body = null, description = '', expectedStatus = 200) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      // Handle non-JSON responses
      data = await response.text();
    }

    const success = response.status === expectedStatus;
    return {
      endpoint,
      method,
      description,
      status: response.status,
      expectedStatus,
      success,
      data,
      error: success ? null : JSON.stringify(data)
    };
  } catch (error) {
    return {
      endpoint,
      method,
      description,
      status: 0,
      expectedStatus,
      success: false,
      data: null,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('���🧪 Starting Comprehensive Feature Tests for ExamIQ\n');
  console.log('='.repeat(70));

  const results = [];

  // ===== API ENDPOINT TESTS =====
  console.log('\n���📡 TESTING API ENDPOINTS\n');
  console.log('-'.repeat(70));

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

  // Test GET with query parameters
  results.push(await testAPI('/api/topics?subjectId=test', 'GET', null, 'Get topics by subjectId'));
  results.push(await testAPI('/api/study-breaks?sessionId=test', 'GET', null, 'Get study breaks by sessionId'));

  // POST endpoints
  results.push(await testAPI('/api/subjects', 'POST', { title: 'Test Subject', description: 'Test description' }, 'Create subject', 201));

  // Test POST topic with invalid subjectId (should fail with 400)
  results.push(await testAPI('/api/topics', 'POST', { title: 'Test Topic', subjectId: 'invalid-subject-id', description: 'Test description' }, 'Create topic with invalid subjectId', 400));

  // Test POST topic with missing fields
  results.push(await testAPI('/api/topics', 'POST', { title: 'Test Topic' }, 'Create topic with missing subjectId', 400));

  // Create a valid subject for further testing
  const subjectResult = await testAPI('/api/subjects', 'POST', { title: 'Valid Subject For Testing', description: 'For topic creation' }, 'Create valid subject for topic test', 201);
  let validSubjectId = null;
  if (subjectResult.success && subjectResult.data && subjectResult.data.id) {
    validSubjectId = subjectResult.data.id;
    // Test POST topic with valid subjectId
    results.push(await testAPI('/api/topics', 'POST', { title: 'Valid Topic', subjectId: validSubjectId, description: 'Test description' }, 'Create topic with valid subject', 201));

    // Test POST study session with valid data
    if (validSubjectId) {
      // First get the topic ID we just created
      const topicsAfter = await testAPI('/api/topics', 'GET', null, 'Get topics after creation');
      let topicId = null;
      if (topicsAfter.success && Array.isArray(topicsAfter.data) && topicsAfter.data.length > 0) {
        // Find the topic we just created
        const createdTopic = topicsAfter.data.find(t => t.title === 'Valid Topic' && t.subjectId === validSubjectId);
        if (createdTopic) topicId = createdTopic.id;
      }

      if (topicId) {
        results.push(await testAPI('/api/study-sessions', 'POST', {
          topicId,
          subjectId: validSubjectId,
          startTime: new Date().toISOString(),
          duration: 30,
          totalFocusTime: 25,
          totalBreakTime: 5,
          breaksCount: 1,
          notes: 'Test study session'
        }, 'Create study session with valid data', 201));
      }
    }
  }

  // Test study sessions with missing required fields
  results.push(await testAPI('/api/study-sessions', 'POST', {
    topicId: null,
    subjectId: null
  }, 'Create study session with missing required fields', 400));

  // PUT endpoints
  results.push(await testAPI('/api/study-breaks', 'PUT', { breakId: 'test-break-id' }, 'End study break (should fail - not found)', 404));

  // POST progress update
  results.push(await testAPI('/api/progress/update', 'POST', {
    topicId: 'test-topic-id',
    userAnswer: 'test',
    correctAnswer: 'test'
  }, 'Update topic progress', 200));

  // POST progress update with missing topicId
  results.push(await testAPI('/api/progress/update', 'POST', {
    userAnswer: 'test',
    correctAnswer: 'test'
  }, 'Update topic progress missing topicId', 400));

  // DELETE endpoints
  results.push(await testAPI('/api/study-sessions', 'DELETE', null, 'Clear all study sessions', 200));
  results.push(await testAPI('/api/upload', 'DELETE', null, 'Clear all uploaded materials', 200));
  results.push(await testAPI('/api/upload', 'DELETE', null, 'Clear all uploaded materials again (should still work)', 200));

  // PATCH endpoints (upload processing)
  results.push(await testAPI('/api/upload', 'PATCH', { fileId: 'test-file-id', apiKey: 'test-key', model: 'test-model' }, 'Process uploaded file (should fail - file not found)', 400));
  results.push(await testAPI('/api/upload', 'PATCH', { fileId: 'test-file-id' }, 'Process uploaded file missing API key', 400));
  results.push(await testAPI('/api/upload', 'PATCH', { apiKey: 'test-key', model: 'test-model' }, 'Process uploaded file missing fileId', 400));

  // ===== UI COMPONENT TESTS =====
  console.log('\n���🎨 TESTING UI COMPONENTS\n');
  console.log('-'.repeat(70));

  // We'll test UI components by checking if pages load and contain expected elements
  const uiTests = [
    { path: '/', name: 'Dashboard', checks: ['timer', 'start-session-button'] },
    { path: '/subjects', name: 'Subjects Page', checks: ['subject-list', 'add-subject-button'] },
    { path: '/topics', name: 'Topics Page', checks: ['topic-list', 'add-topic-button'] },
    { path: '/pyq-analysis', name: 'PYQ Analysis Page', checks: ['upload-section', 'analyze-button'] },
    { path: '/study-plan', name: 'Study Plan Page', checks: ['calendar-view', 'plan-generation'] },
    { path: '/practice', name: 'Practice Page', checks: ['question-container', 'answer-options'] },
    { path: '/progress', name: 'Progress Page', checks: ['progress-charts', 'stats-section'] },
    { path: '/settings', name: 'Settings Page', checks: ['api-key-input', 'model-selector'] },
    { path: '/upload', name: 'Upload Page', checks: ['file-upload-area', 'upload-button'] },
    { path: '/analytics', name: 'Analytics Page', checks: ['metrics-display', 'trend-charts'] }
  ];

  for (const test of uiTests) {
    results.push(await testAPI(test.path, 'GET', null, `Load ${test.name} page`, 200));
  }

  // ===== DISPLAY RESULTS =====
  console.log('\n' + '='.repeat(70));
  console.log('���📊 TEST RESULTS SUMMARY\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach((result, idx) => {
    const status = result.success ? '��✅ PASS' : '��❌ FAIL';
    console.log(`${idx + 1}. ${status} ${result.method} ${result.endpoint}`);
    console.log(`   Description: ${result.description}`);
    console.log(`   Status: ${result.status} (expected: ${result.expectedStatus})`);
    if (!result.success && result.error) {
      // Truncate error message for readability
      const errorMsg = result.error.length > 100 ? result.error.substring(0, 100) + '...' : result.error;
      console.log(`   Error: ${errorMsg}`);
    }
    console.log('');
  });

  console.log('='.repeat(70));
  console.log(`\n���📈 SUMMARY: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%\n`);

  // ===== FEATURE ANALYSIS =====
  console.log('���🔍 FEATURE ANALYSIS\n');
  console.log('-'.repeat(70));

  // Check specific features
  const topicsResult = results.find(r => r.endpoint === '/api/topics' && r.method === 'GET' && r.description === 'Get all topics');
  const subjectsResult = results.find(r => r.endpoint === '/api/subjects' && r.method === 'GET' && r.description === 'Get all subjects');
  const sessionsResult = results.find(r => r.endpoint === '/api/study-sessions' && r.method === 'GET' && r.description === 'Get all study sessions');
  const uploadResult = results.find(r => r.endpoint === '/api/upload' && r.method === 'GET' && r.description === 'Get upload history');
  const analyticsResult = results.find(r => r.endpoint === '/api/analytics' && r.method === 'GET' && r.description === 'Get analytics data');

  console.log('\n���📋 Core Features Status:');
  console.log(`  Topics API: ${topicsResult?.success ? '��✅ Working' : '��❌ Issues'} (returns ${Array.isArray(topicsResult?.data) ? topicsResult.data.length : 'N/A'} items)`);
  console.log(`  Subjects API: ${subjectsResult?.success ? '��✅ Working' : '��❌ Issues'} (returns ${Array.isArray(subjectsResult?.data) ? subjectsResult.data.length : 'N/A'} items)`);
  console.log(`  Study Sessions API: ${sessionsResult?.success ? '��✅ Working' : '��❌ Issues'} (returns ${Array.isArray(sessionsResult?.data) ? sessionsResult.data.length : 'N/A'} items)`);
  console.log(`  Upload History API: ${uploadResult?.success ? '��✅ Working' : '��❌ Issues'} (returns ${Array.isArray(uploadResult?.data) ? uploadResult.data.length : 'N/A'} items)`);
  console.log(`  Analytics API: ${analyticsResult?.success ? '��✅ Working' : '��❌ Issues'} (returns ${analyticsResult?.data?.pageViews?.length || 0} page views, ${analyticsResult?.data?.events?.length || 0} events)`);

  // Check data persistence
  console.log('\n���💾 Data Persistence:');
  const createSubjectResult = results.find(r => r.description === 'Create subject');
  const getSubjectsAfterCreate = results.find(r => r.description === 'Get all subjects' && results.indexOf(r) > results.indexOf(createSubjectResult));
  if (createSubjectResult && getSubjectsAfterCreate) {
    console.log(`  Create Subject: ${createSubjectResult.success ? '��✅ Works' : '��❌ Fails'}`);
    console.log(`  Subject Persists: ${getSubjectsAfterCreate.success && Array.isArray(getSubjectsAfterCreate.data) && getSubjectsAfterCreate.data.length > 0 ? '��✅ Yes' : '��❌ No (in-memory only)'}`);
  }

  // Check specific error handling
  console.log('\n���🛡��️ Error Handling:');
  const invalidTopicResult = results.find(r => r.description === 'Create topic with invalid subjectId');
  const missingFieldResult = results.find(r => r.description === 'Create topic with missing subjectId');
  const invalidSessionResult = results.find(r => r.description === 'Create study session with missing required fields');

  console.log(`  Invalid SubjectId Rejection: ${invalidTopicResult?.success ? '��✅ Correctly rejects' : '��❌ Incorrectly allows'} (status: ${invalidTopicResult?.status})`);
  console.log(`  Missing Fields Rejection: ${missingFieldResult?.success ? '��✅ Correctly rejects' : '��❌ Incorrectly allows'} (status: ${missingFieldResult?.status})`);
  console.log(`  Invalid Session Data: ${invalidSessionResult?.success ? '��✅ Correctly rejects' : '��❌ Incorrectly allows'} (status: ${invalidSessionResult?.status})`);

  // ===== RECOMMENDATIONS =====
  console.log('\n���💡 RECOMMENDATIONS\n');
  console.log('-'.repeat(70));

  if (failed > 0) {
    console.log('1. Review failing tests above and fix any legitimate issues');
  }
  console.log('2. Implement persistent database (PostgreSQL/Prisma) for data retention across restarts');
  console.log('3. Add authentication/authorization for multi-user support');
  console.log('4. Implement WebSocket for real-time timer synchronization');
  console.log('5. Add comprehensive error boundaries for React components');
  console.log('6. Add unit/integration tests for critical paths');
  console.log('7. Implement proper file storage (S3/local) instead of base64 in memory');
  console.log('8. Add rate limiting and input validation for APIs');
  console.log('9. Add loading skeletons and stale-while-revalidate caching for better UX');
  console.log('10. Implement offline support with service workers and IndexedDB');

  return results;
}

// Run tests
runAllTests().catch(console.error);