# Integration Testing Documentation

## Overview

This directory contains comprehensive integration tests for the Underwater Archaeology Learning Games platform. The tests validate the complete user journey from registration to certification, cross-browser compatibility, mobile responsiveness, and performance.

## Test Coverage

### 1. User Journey Tests (`user-journey.cy.ts`)

- **Requirements**: 1.1, 4.2, 5.2
- **Coverage**:
  - Complete user flow from landing page to game access
  - Progress tracking across game sessions
  - Certification eligibility and status
  - All 5 game types accessibility
  - Game session flow for each game type

### 2. Mobile Responsiveness Tests (`mobile-responsiveness.cy.ts`)

- **Requirements**: 1.1, 1.3
- **Coverage**:
  - Phone viewport (375x812 - iPhone X)
  - Tablet viewport (768x1024 - iPad)
  - Touch-friendly interfaces
  - Responsive layouts
  - Touch interactions and gestures
  - Mobile navigation
  - Performance on mobile devices

### 3. Cross-Browser Compatibility Tests (`cross-browser.cy.ts`)

- **Requirements**: 1.1
- **Coverage**:
  - Core functionality across browsers
  - Interactive elements consistency
  - CSS styling and layout rendering
  - Media and asset loading
  - JavaScript features support
  - Performance across browsers
  - Error handling

### 4. Performance Tests (`performance.cy.ts`)

- **Requirements**: 1.1, 4.2
- **Coverage**:
  - Page load times
  - Real-time updates (30-second requirement)
  - Navigation speed
  - Resource loading efficiency
  - Memory usage
  - Network condition handling
  - Concurrent user simulation

## Running Tests

### Prerequisites

1. Ensure the development server is running:

   ```bash
   npm run dev
   ```

2. Ensure Convex backend is running:
   ```bash
   npx convex dev
   ```

### Run Tests in Interactive Mode

```bash
npm run cypress:open
```

### Run Tests in Headless Mode

```bash
npx cypress run
```

### Run Specific Test File

```bash
npx cypress run --spec "cypress/e2e/user-journey.cy.ts"
```

### Run Tests with Emulator

```bash
npm run cypress:emulate
```

## Test Structure

Each test file follows this structure:

1. **Description**: Clear documentation of what is being tested
2. **Requirements**: References to specific requirements from requirements.md
3. **Test Cases**: Organized by functionality
4. **Assertions**: Validates expected behavior

## Browser Support

Tests are designed to run on:

- Chrome (default)
- Firefox
- Edge
- Electron (Cypress default)

To run on specific browsers:

```bash
npx cypress run --browser chrome
npx cypress run --browser firefox
npx cypress run --browser edge
```

## Mobile Testing

Mobile tests use these viewports:

- **Phone**: 375x812 (iPhone X)
- **Tablet**: 768x1024 (iPad)

Custom viewports can be set in individual tests:

```typescript
cy.viewport(375, 812); // iPhone X
cy.viewport(768, 1024); // iPad
cy.viewport(1280, 720); // Desktop
```

## Performance Benchmarks

Expected performance metrics:

- Landing page: < 2 seconds
- Challenges page: < 3 seconds
- Game pages: < 3 seconds
- Progress updates: < 30 seconds (Requirement 4.2)
- Navigation: < 2 seconds

## Test Data

Tests use data-testid attributes for reliable element selection:

- `data-testid="artifact-gallery"`
- `data-testid="excavation-grid"`
- `data-testid="tool-selector"`
- `data-testid="documentation-panel"`
- `data-testid="progress-tracker"`
- `data-testid="site-mapper"`
- `data-testid="report-builder"`
- `data-testid="timeline-interface"`
- `data-testid="context-cards"`
- `data-testid="conservation-workbench"`
- `data-testid="process-selector"`

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Cypress Tests
  run: |
    npm run dev &
    npx wait-on http://localhost:3000
    npm run cypress:run
```

## Troubleshooting

### Tests Failing Due to Timeouts

- Increase timeout in test: `cy.get('element', { timeout: 10000 })`
- Check if dev server is running
- Verify Convex backend is connected

### Elements Not Found

- Verify data-testid attributes are present in components
- Check if element is rendered conditionally
- Use `cy.wait()` if element loads asynchronously

### Cross-Browser Issues

- Check browser console for errors
- Verify CSS compatibility
- Test JavaScript features support

## Best Practices

1. **Use data-testid**: Always use data-testid for element selection
2. **Wait for visibility**: Use `.should('be.visible')` instead of `.should('exist')`
3. **Clean state**: Clear cookies and localStorage before each test
4. **Descriptive names**: Use clear, descriptive test names
5. **Requirements**: Always reference requirements in test descriptions
6. **Assertions**: Include meaningful assertions that validate requirements

## Maintenance

- Update tests when UI changes
- Add new tests for new features
- Keep test data synchronized with application data
- Review and update performance benchmarks regularly
- Ensure all requirements are covered by tests
