# Quick Start Guide - Integration Tests

## Prerequisites

1. **Install dependencies** (if not already done):

   ```bash
   npm install
   ```

2. **Start the development server**:

   ```bash
   npm run dev
   ```

   This will start both Next.js and Convex dev servers.

3. **Wait for servers to be ready**:
   - Next.js should be running on http://localhost:3000
   - Convex should be connected and syncing

## Running Tests

### Interactive Mode (Recommended for Development)

Open Cypress Test Runner:

```bash
npm run cypress:open
```

This will:

- Open the Cypress UI
- Allow you to select which tests to run
- Show real-time test execution
- Provide debugging tools

### Headless Mode (Recommended for CI/CD)

Run all tests:

```bash
npm run test:integration
```

Run tests on specific browser:

```bash
npm run test:integration:chrome
npm run test:integration:firefox
npm run test:integration:edge
```

Run specific test suite:

```bash
npm run test:integration:mobile
npm run test:integration:performance
```

Run single test file:

```bash
npx cypress run --spec "cypress/e2e/user-journey.cy.ts"
```

## Test Suites

### 1. User Journey Tests

**File**: `cypress/e2e/user-journey.cy.ts`
**Purpose**: Test complete user flow from landing to certification
**Run**: `npx cypress run --spec "cypress/e2e/user-journey.cy.ts"`

### 2. Mobile Responsiveness Tests

**File**: `cypress/e2e/mobile-responsiveness.cy.ts`
**Purpose**: Test mobile and tablet layouts, touch interactions
**Run**: `npm run test:integration:mobile`

### 3. Cross-Browser Tests

**File**: `cypress/e2e/cross-browser.cy.ts`
**Purpose**: Test compatibility across different browsers
**Run**: `npx cypress run --spec "cypress/e2e/cross-browser.cy.ts"`

### 4. Performance Tests

**File**: `cypress/e2e/performance.cy.ts`
**Purpose**: Test page load times and performance metrics
**Run**: `npm run test:integration:performance`

## Viewing Test Results

### In Interactive Mode

- Tests run in real-time in the Cypress UI
- Click on any test to see detailed execution
- Use time-travel debugging to inspect each step

### In Headless Mode

- Results are printed to console
- Screenshots saved to `cypress/screenshots/` on failure
- Videos saved to `cypress/videos/` (if enabled)

## Troubleshooting

### Tests Fail with "Cannot find element"

**Solution**: Ensure data-testid attributes are added to components

```tsx
<div data-testid="component-name">
```

### Tests Timeout

**Solution**:

1. Check if dev server is running
2. Verify Convex is connected
3. Increase timeout: `cy.get('element', { timeout: 10000 })`

### Browser Not Found

**Solution**: Install the browser or use default (Electron)

```bash
npx cypress run --browser electron
```

### Port Already in Use

**Solution**: Stop other processes using port 3000

```bash
lsof -ti:3000 | xargs kill -9
```

## Best Practices

1. **Run tests locally before pushing**: Catch issues early
2. **Use interactive mode for debugging**: Easier to see what's happening
3. **Check test coverage**: Ensure all requirements are tested
4. **Keep tests updated**: Update when UI changes
5. **Review failures carefully**: Don't ignore failing tests

## CI/CD Integration

Tests automatically run on:

- Push to main/develop branches
- Pull requests to main/develop

View results in GitHub Actions tab.

## Need Help?

- Check `cypress/README.md` for detailed documentation
- Check `INTEGRATION_TESTS.md` for test coverage details
- Visit [Cypress Documentation](https://docs.cypress.io/)
