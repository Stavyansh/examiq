# ExamIQ Test Suite

Comprehensive testing suite for the ExamIQ application including automated API tests, manual UI component test scripts, and page load/navigation tests.

## Test Suite Structure

```
tests/
├── api-tests.js              # Automated API tests using Node.js/fetch
├── ui-test-scripts.js        # Manual UI component test scripts
├── navigation-tests.js       # Page load and navigation tests
├── run-all-tests.js          # Master test runner
�└── README.md                 # This file
```

## Test Categories

### 1. Automated API Tests (`api-tests.js`)
Tests all API endpoints with:
- HTTP method validation (GET, POST, PUT, DELETE, PATCH)
- Status code testing (200, 201, 400, 401, 404, 405, 500)
- Input validation and schema testing
- Error handling and edge cases
- Data persistence verification
- Security testing basics

### 2. Manual UI Component Test Scripts (`ui-test-scripts.js`)
Step-by-step manual test procedures for:
- **Timer.tsx**: Study session timer with all states and interactions
- **TopicCard.tsx**: Visual topic display with priority variations
- **Button.tsx**: Reusable button component with all variants and sizes
- **StreakTracker.tsx**: GitHub-style contribution calendar
- **FileUploader.tsx**: File upload component with validation
- **PriorityBadge.tsx**: Priority indicator component

### 3. Page Load and Navigation Tests (`navigation-tests.js`)
Tests for all 10 application pages:
- Dashboard (`/`)
- Subjects (`/subjects`)
- Topics (`/topics`)
- PYQ Analysis (`/pyq-analysis`)
- Study Plan (`/study-plan`)
- Practice (`/practice`)
- Progress (`/progress`)
- Settings (`/settings`)
- Upload (`/upload`)
- Analytics (`/analytics`)

Includes:
- Page load testing
- Navigation link verification
- Page-specific functionality testing
- Component presence verification

## Running the Tests

### Automated Tests
```bash
# Run all automated tests (API + Page Load/Navigation)
node tests/run-all-tests.js

# Run only API tests
node tests/api-tests.js

# Run only page load/navigation tests
node tests/navigation-tests.js
```

### Manual UI Tests
```bash
# Run manual UI component test scripts
node tests/ui-test-scripts.js
```

Follow the instructions in the UI test scripts and mark results manually.

## Test Results

Test results are displayed in the console with:
- � ✅ PASS: Test passed expectations
- �� ❌ FAIL: Test failed expectations
- �� ⏭ SKIP: Test skipped (not applicable)

Each test suite provides:
- Detailed breakdown of passed/failed tests
- Success rate percentages
- Specific failure details and error messages
- Recommendations for improvements

## Expected Outcomes

### API Tests
- Verify all endpoints respond correctly
- Validate proper status codes for success/error cases
- Confirm data validation and sanitization
- Check error handling and edge case management

### UI Component Tests
- Verify visual rendering matches specifications
- Confirm interactive states work correctly
- Validate edge case handling
- Ensure accessibility compliance

### Page Load/Navigation Tests
- Confirm all pages load without errors
- Verify navigation links work correctly
- Validate page-specific functionality
- Ensure proper component integration

## Test Data and State

The tests use the application's built-in mock data system:
- Test user ID: `"user-123"`
- Test subject ID: generated during test execution
- Test topic ID: generated during test execution
- Data persists only for the duration of test execution (in-memory)

## Troubleshooting

### Common Issues
1. **Connection Refused**: Ensure the application is running on `http://localhost:3000`
2. **Port Already in Use**: Change the BASE_URL in test files or free up port 3000
3. **Test Hangs**: Check for infinite loops or missing async/await in application code
4. **False Failures**: Verify test expectations match actual application behavior

### Debugging Tips
- Run individual test files to isolate issues
- Check browser console for frontend errors
- Check server logs for backend errors
- Use debugging statements in test files if needed

## Continuous Integration

To integrate with CI/CD pipelines:

1. Add to `package.json`:
```json
{
  "scripts": {
    "test": "node tests/run-all-tests.js",
    "test:api": "node tests/api-tests.js",
    "test:ui": "node tests/ui-test-scripts.js",
    "test:nav": "node tests/navigation-tests.js"
  }
}
```

2. Run with:
```bash
npm test
```

## Maintenance

### Adding New Tests
1. **API Tests**: Add to `api-tests.js` following existing patterns
2. **UI Tests**: Add new component test functions to `ui-test-scripts.js`
3. **Navigation Tests**: Add new page tests to `navigation-tests.js`

### Updating Tests
When application changes:
1. Update test expectations to match new behavior
2. Remove obsolete tests
3. Add tests for new features
4. Adjust timing-sensitive tests as needed

## Test Coverage Goals

Target test coverage:
- **API Endpoints**: ≥90%
- **UI Components**: ≥80%
- **Page Navigation**: ≥85%
- **Error Handling**: ≥75%

## License

MIT License - see project root LICENSE file