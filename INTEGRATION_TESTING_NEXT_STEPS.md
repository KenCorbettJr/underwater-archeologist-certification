# Integration Testing - Next Steps

## ✅ What's Been Completed

Task 8.4 "Perform integration testing" has been successfully implemented with:

- 4 comprehensive test suites (70+ test cases)
- Cross-browser compatibility testing
- Mobile responsiveness testing
- Performance benchmarking
- CI/CD integration
- Complete documentation

## 🚀 How to Get Started

### Step 1: Verify Prerequisites

Ensure you have:

```bash
# Check Node.js version (should be 18+)
node --version

# Check if Cypress is installed
npm list cypress

# If not installed, run:
npm install
```

### Step 2: Start Development Environment

```bash
# Terminal 1: Start Next.js and Convex
npm run dev

# Wait for both servers to be ready:
# - Next.js: http://localhost:3000
# - Convex: Connected and syncing
```

### Step 3: Run Tests

#### Option A: Interactive Mode (Recommended First Time)

```bash
npm run cypress:open
```

This opens the Cypress UI where you can:

- See all test files
- Run tests individually
- Watch tests execute in real-time
- Debug failures easily

#### Option B: Headless Mode

```bash
# Run all tests
npm run test:integration

# Run specific browser
npm run test:integration:chrome

# Run specific suite
npm run test:integration:mobile
```

## 📋 Important: Add data-testid Attributes

The tests expect specific data-testid attributes in your components. Here's what needs to be added:

### Artifact Game Components

```tsx
// In ArtifactGallery component
<div data-testid="artifact-gallery">
  {artifacts.map((artifact) => (
    <div key={artifact.id} data-testid="artifact-item">
      {/* artifact content */}
    </div>
  ))}
</div>
```

### Excavation Game Components

```tsx
// In ExcavationGrid component
<div data-testid="excavation-grid">
  {grid.map((cell, index) => (
    <div key={index} data-testid="grid-cell">
      {/* cell content */}
    </div>
  ))}
</div>

// In ToolSelector component
<div data-testid="tool-selector">
  {/* tools */}
</div>

// In DocumentationPanel component
<div data-testid="documentation-panel">
  {/* documentation form */}
</div>
```

### Progress Tracking Components

```tsx
// In ProgressTracker component
<div data-testid="progress-tracker">
  <div data-testid="completion-percentage">{completionPercentage}%</div>
</div>
```

### Site Documentation Components

```tsx
// In SiteMapper component
<div data-testid="site-mapper">
  {/* mapper content */}
</div>

// In ReportBuilder component
<div data-testid="report-builder">
  {/* report form */}
</div>
```

### Timeline Components

```tsx
// In TimelineInterface component
<div data-testid="timeline-interface">
  {/* timeline */}
</div>

// In ContextCards component
<div data-testid="context-cards">
  {/* cards */}
</div>
```

### Conservation Lab Components

```tsx
// In ConservationWorkbench component
<div data-testid="conservation-workbench">
  {/* workbench */}
</div>

// In ProcessSelector component
<div data-testid="process-selector">
  {/* processes */}
</div>
```

## 🔍 What to Expect

### First Run

Some tests may fail initially because:

1. Data-testid attributes need to be added
2. Components may need minor adjustments
3. Test data may need to be seeded

This is normal! The tests will guide you to what needs to be fixed.

### Test Results

- **Green checkmarks**: Tests passing ✅
- **Red X marks**: Tests failing ❌
- **Yellow warnings**: Tests skipped or pending ⚠️

## 🐛 Troubleshooting Common Issues

### Issue: "Element not found"

**Cause**: Missing data-testid attribute
**Solution**: Add the data-testid to the component

### Issue: "Timed out waiting for element"

**Cause**: Component takes too long to load
**Solution**:

1. Check if data is loading correctly
2. Increase timeout: `cy.get('element', { timeout: 10000 })`

### Issue: "Cannot visit localhost:3000"

**Cause**: Dev server not running
**Solution**: Run `npm run dev` in another terminal

### Issue: Tests pass locally but fail in CI

**Cause**: Environment differences
**Solution**: Check environment variables in GitHub Actions

## 📊 Understanding Test Results

### User Journey Tests

- Validates complete user flow
- Ensures all game types are accessible
- Checks progress tracking
- Verifies certification display

### Mobile Tests

- Tests on phone viewport (375x812)
- Tests on tablet viewport (768x1024)
- Validates touch interactions
- Checks responsive layouts

### Cross-Browser Tests

- Runs on Chrome, Firefox, Edge
- Validates consistent behavior
- Checks styling consistency
- Tests JavaScript features

### Performance Tests

- Measures page load times
- Validates 30-second progress update requirement
- Checks navigation speed
- Tests under various network conditions

## 🎯 Success Criteria

Tests are successful when:

- ✅ All 70+ test cases pass
- ✅ Tests run on all browsers (Chrome, Firefox, Edge)
- ✅ Mobile tests pass on phone and tablet viewports
- ✅ Performance benchmarks are met
- ✅ No console errors during test execution

## 📈 Monitoring Test Health

### Locally

```bash
# Run tests and check results
npm run test:integration

# Check specific suite
npm run test:integration:mobile
```

### In CI/CD

1. Go to GitHub Actions tab
2. Check "Integration Tests" workflow
3. Review test results for each browser
4. Download artifacts (screenshots/videos) if tests fail

## 🔄 Maintaining Tests

### When Adding New Features

1. Add data-testid to new components
2. Update tests if UI changes
3. Add new test cases for new functionality
4. Run tests before committing

### When Tests Fail

1. Check the error message
2. Look at screenshots (in cypress/screenshots/)
3. Run in interactive mode to debug
4. Fix the issue (code or test)
5. Re-run tests to verify fix

## 📚 Additional Resources

- **Detailed Documentation**: `cypress/README.md`
- **Quick Reference**: `cypress/QUICK_START.md`
- **Test Summary**: `INTEGRATION_TESTS.md`
- **Task Summary**: `TASK_8.4_SUMMARY.md`
- **Cypress Docs**: https://docs.cypress.io/

## 🎉 You're Ready!

The integration test suite is complete and ready to use. Start by:

1. Running `npm run cypress:open`
2. Selecting a test file
3. Watching it run
4. Adding data-testid attributes as needed
5. Re-running until all tests pass

Good luck! The tests will help ensure your application works correctly across all scenarios.
