# Testing Guide

This document explains how to run tests in the Home Dashboard project. The project uses a comprehensive testing setup with Jest for unit/integration tests and Playwright for end-to-end testing.

## Testing Architecture

### Test Types

1. **Unit Tests** - Fast, isolated tests using Jest
2. **Integration Tests** - Tests combining multiple components using Jest
3. **End-to-End (E2E) Tests** - Full browser tests using Playwright
4. **Accessibility Tests** - A11y tests using Playwright + axe-playwright
5. **Visual Regression Tests** - Screenshot comparison tests

### Directory Structure

```
tests/
├── unit/                  # Jest unit tests
├── integration/           # Jest integration tests
├── e2e/                   # Playwright E2E tests
├── accessibility/         # Playwright A11y tests
├── setup/                 # Test configuration
│   └── jest.setup.js      # Jest setup file
├── __mocks__/            # Mock files
│   └── fileMock.js       # Static file mocks
└── helpers/              # Test utilities
    └── test-utils.js     # Playwright helpers
```

## Running Tests

### Quick Commands

```bash
# Run all unit tests (recommended for development)
npm test

# Run tests with watch mode for development
npm run test:watch

# Run all tests (unit + integration + e2e)
npm run test:all

# Quick quality check (lint + unit tests)
npm run test:quick

# Full CI pipeline
npm run test:ci
```

### Specific Test Types

#### Unit Tests (Jest)
```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm test -- tests/unit/api.test.js

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

#### Integration Tests (Jest)
```bash
# Run all integration tests
npm run test:integration

# Run with verbose output
npm run test:integration -- --verbose
```

#### End-to-End Tests (Playwright)
```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run E2E tests with browser visible
npm run test:e2e:headed

# Run E2E tests with Playwright UI
npm run test:e2e:ui

# Run specific E2E test
npm run test:e2e -- tests/e2e/dashboard-startup.spec.js
```

#### Accessibility Tests
```bash
# Run all accessibility tests
npm run test:a11y

# Run specific a11y test
npm run test:a11y -- tests/accessibility/dashboard-a11y.spec.js
```

#### Visual Tests
```bash
# Update visual regression snapshots
npm run test:visual

# Run visual tests
npm run test:e2e -- --grep "visual"
```

### Development Testing
```bash
# Live dashboard validation (requires running server)
npm run test:live

# UX validation tests
npm run test:ux

# Security audit
npm run test:security
```

## Configuration Files

### Jest Configuration
- **File**: `jest.config.js`
- **Setup**: `tests/setup/jest.setup.js`
- **Environment**: jsdom for React component testing
- **Supports**: ES6 modules, JSX, CSS imports (mocked)

### Playwright Configuration
- **File**: `playwright.config.js`
- **Test Directory**: `tests/e2e/` and `tests/accessibility/`
- **Browsers**: Chromium, Firefox
- **Features**: Screenshots, video recording, trace collection

### ESLint Configuration
- **File**: `.eslintrc.js`
- **Coverage**: `src/` and `server/` directories
- **Rules**: React, security, documentation enforcement

## Writing Tests

### Unit Tests (Jest + React Testing Library)

```javascript
// tests/unit/component.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from '../../src/components/MyComponent';

describe('MyComponent', () => {
  test('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```javascript
// tests/e2e/feature.spec.js
import { test, expect } from '@playwright/test';
import { loginWithGoogle } from '../helpers/test-utils';

test('should load dashboard', async ({ page }) => {
  await loginWithGoogle(page);
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});
```

### Accessibility Tests

```javascript
// tests/accessibility/page.spec.js
import { test } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/dashboard');
  await injectAxe(page);
  await checkA11y(page);
});
```

## Test Utilities

### Jest Mocks Available
- `localStorage` and `sessionStorage`
- `fetch` API
- `WebSocket`
- `IntersectionObserver`
- `ResizeObserver`
- CSS imports (via identity-obj-proxy)
- Static files (images, fonts)

### Playwright Helpers
- `loginWithGoogle()` - Mock authentication
- `waitForWidget()` - Wait for widget to load
- `mockApiResponse()` - Mock API calls
- Mock data objects for DNS, Calendar, etc.

## Continuous Integration

The `test:ci` script runs the full test suite suitable for CI/CD:

```bash
npm run test:ci
```

This includes:
1. ESLint checks
2. Unit tests
3. Integration tests  
4. Build verification
5. E2E tests

## Common Issues & Solutions

### Jest Issues

**Problem**: "Cannot use import statement outside a module"
**Solution**: Jest is configured with Babel to handle ES6 imports

**Problem**: "localStorage is not defined"
**Solution**: Mocked in `tests/setup/jest.setup.js`

### Playwright Issues

**Problem**: "Browser not found"
**Solution**: Run `npx playwright install`

**Problem**: "Tests timing out"
**Solution**: Increase timeout in `playwright.config.js` or use `test.setTimeout()`

### Performance

**Problem**: Tests running slowly
**Solutions**:
- Use `npm run test:quick` for development
- Run specific test files: `npm test -- path/to/test.js`
- Use Jest's `--watch` mode

## Best Practices

1. **Test Naming**: Use descriptive test names that explain the expected behavior
2. **Test Structure**: Follow Arrange-Act-Assert pattern
3. **Mocking**: Mock external dependencies and APIs
4. **Cleanup**: Tests should not affect each other
5. **Performance**: Keep unit tests fast, use E2E sparingly
6. **Accessibility**: Include a11y tests for UI components
7. **Documentation**: Document complex test setups and utilities

## Debugging Tests

### Jest Debugging
```bash
# Run single test with debug output
npm test -- --no-cache --verbose tests/unit/specific.test.js

# Use Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debugging
```bash
# Run with browser visible
npm run test:e2e:headed

# Use Playwright inspector
npm run test:e2e:ui

# Generate trace files
npm run test:e2e -- --trace on
```

## Test Coverage

Generate coverage reports:
```bash
npm run test:coverage
```

Coverage thresholds are configured in `jest.config.js`:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%