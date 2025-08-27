# Contributing to Home Dashboard

This document outlines the coding standards, documentation requirements, and contribution guidelines for the Home Dashboard project.

## Table of Contents

- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Documentation Requirements](#documentation-requirements)
- [Code Review Process](#code-review-process)
- [Testing Requirements](#testing-requirements)
- [Security Guidelines](#security-guidelines)

## Development Setup

### Prerequisites

- Node.js 18+ and npm 8+
- Git with proper configuration
- Access to required external services (Google APIs, Ollama, n8n)

### Initial Setup

```bash
# Clone and setup
git clone [repository-url]
cd home-dashboard
npm install

# Environment configuration
cp .env.example .env
# Edit .env with your configuration

# Start development
npm run dev
```

## Coding Standards

### JavaScript/JSX Standards

#### Function Documentation (JSDoc Required)

All functions must include JSDoc comments with the following minimum elements:

```javascript
/**
 * Brief description of what the function does
 * @param {type} paramName - Description of parameter
 * @param {type} [optionalParam] - Description of optional parameter
 * @returns {type} Description of return value
 * @throws {ErrorType} Description of when this error is thrown
 * @example
 * // Example usage
 * const result = functionName(param1, param2);
 */
function functionName(paramName, optionalParam) {
  // Implementation
}
```

#### React Component Documentation

```javascript
/**
 * Component description explaining its purpose and behavior
 * @param {Object} props - Component props
 * @param {string} props.title - The title to display
 * @param {Function} [props.onAction] - Optional callback function
 * @param {boolean} [props.isVisible=true] - Whether component is visible
 * @returns {JSX.Element} The rendered component
 * @example
 * <MyComponent 
 *   title="Dashboard" 
 *   onAction={handleAction}
 *   isVisible={true} 
 * />
 */
const MyComponent = ({ title, onAction, isVisible = true }) => {
  // Component implementation
};
```

#### API Function Documentation

```javascript
/**
 * Fetches user dashboard data from the API
 * @param {string} userId - The unique identifier for the user
 * @param {Object} [options={}] - Optional configuration
 * @param {boolean} [options.includeMetrics=false] - Whether to include metrics
 * @param {number} [options.timeout=5000] - Request timeout in milliseconds
 * @returns {Promise<Object>} Promise resolving to dashboard data
 * @throws {ValidationError} When userId is invalid
 * @throws {NetworkError} When API request fails
 * @example
 * try {
 *   const data = await fetchDashboardData('user123', { includeMetrics: true });
 *   console.log(data.widgets);
 * } catch (error) {
 *   handleError(error);
 * }
 */
async function fetchDashboardData(userId, options = {}) {
  // Implementation
}
```

### Code Style Guidelines

#### Naming Conventions

- **Files**: Use kebab-case for files (`user-dashboard.js`, `api-client.js`)
- **Components**: Use PascalCase (`UserDashboard.jsx`, `ApiClient.js`)
- **Functions**: Use camelCase (`getUserData`, `validateInput`)
- **Constants**: Use SCREAMING_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **CSS Classes**: Use kebab-case (`user-widget`, `api-status`)

#### File Organization

```
src/
├── components/           # React components
│   ├── common/          # Reusable components
│   ├── widgets/         # Dashboard widgets
│   └── layout/          # Layout components
├── services/            # API and external service integrations
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── config/              # Configuration files
└── styles/              # CSS and styling files
```

#### Import Organization

```javascript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Internal services and utilities
import { apiClient } from '../services/api-client';
import { validateInput } from '../utils/validation';

// 3. Components
import UserWidget from './UserWidget';
import StatusIndicator from '../common/StatusIndicator';

// 4. Styles
import './Dashboard.css';
```

## Documentation Requirements

### README Files

Each major directory should contain a README.md explaining:
- Purpose and scope
- Key files and their functions
- Usage examples
- Dependencies and requirements

### Code Comments

#### Inline Comments

Use inline comments sparingly and only for complex business logic:

```javascript
// Complex calculation for network performance scoring
// Based on DNS response times and network metrics
const performanceScore = calculateNetworkPerformance(dnsMetrics, networkStats);
```

#### TODO Comments

Format TODO comments consistently:

```javascript
// TODO: Implement caching for API responses (Priority: Medium)
// TODO: Add error boundary for widget crashes (Priority: High)
// TODO: Optimize DNS polling interval based on network conditions (Priority: Low)
```

### API Documentation

Document all API endpoints in the following format:

```javascript
/**
 * @api {get} /api/dns/status Get DNS monitoring status
 * @apiName GetDnsStatus
 * @apiGroup DNS
 * @apiVersion 1.0.0
 * 
 * @apiDescription Retrieves current DNS monitoring status and metrics
 * 
 * @apiParam {string} [timeRange=24h] Time range for metrics (1h, 6h, 24h, 7d)
 * @apiParam {boolean} [includeHistory=false] Include historical data
 * 
 * @apiSuccess {Object} status DNS monitoring status
 * @apiSuccess {boolean} status.isHealthy Overall DNS health status
 * @apiSuccess {number} status.averageLatency Average response time in ms
 * @apiSuccess {Array} status.resolvers List of active DNS resolvers
 * 
 * @apiError (400) ValidationError Invalid time range parameter
 * @apiError (500) ServerError Internal server error
 * 
 * @apiExample {curl} Example usage:
 * curl -X GET "http://localhost:3000/api/dns/status?timeRange=6h&includeHistory=true"
 * 
 * @apiExample {javascript} JavaScript usage:
 * const status = await fetch('/api/dns/status?timeRange=6h');
 * const data = await status.json();
 */
```

## Code Review Process

### Pre-Review Checklist

Before submitting code for review:

- [ ] All functions have proper JSDoc documentation
- [ ] Code follows naming conventions
- [ ] No TODO comments for critical issues
- [ ] Error handling is implemented
- [ ] Tests are written and passing
- [ ] Linting passes without errors
- [ ] Security considerations are addressed

### Review Criteria

Code reviews should check for:

1. **Documentation Quality**
   - JSDoc completeness and accuracy
   - Code comments clarity
   - README updates if needed

2. **Code Quality**
   - Adherence to style guidelines
   - Proper error handling
   - Security best practices

3. **Functionality**
   - Code meets requirements
   - Edge cases are handled
   - Performance considerations

## Testing Requirements

### Unit Tests

Write unit tests for:
- Utility functions
- API service functions
- React component logic
- Custom hooks

```javascript
/**
 * @jest-environment jsdom
 */
describe('validateUserInput', () => {
  /**
   * Test input validation with valid data
   */
  it('should validate correct user input', () => {
    const input = { name: 'John', email: 'john@example.com' };
    const result = validateUserInput(input);
    expect(result.isValid).toBe(true);
  });

  /**
   * Test input validation with invalid email
   */
  it('should reject invalid email format', () => {
    const input = { name: 'John', email: 'invalid-email' };
    const result = validateUserInput(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });
});
```

### Integration Tests

Use Playwright for end-to-end testing:

```javascript
/**
 * Test DNS monitoring widget functionality
 */
test('DNS monitoring widget displays status correctly', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Wait for DNS widget to load
  await page.waitForSelector('[data-testid="dns-widget"]');
  
  // Verify status display
  const status = await page.textContent('[data-testid="dns-status"]');
  expect(status).toBeTruthy();
});
```

## Security Guidelines

### Authentication and Authorization

- Always validate user input
- Use JWT tokens with appropriate expiration
- Implement rate limiting
- Never expose sensitive data in client-side code

### Environment Variables

- Never commit secrets to version control
- Use strong, unique secrets in production
- Document all required environment variables
- Validate environment configuration on startup

### API Security

```javascript
/**
 * Secure API endpoint example with validation and rate limiting
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
async function secureEndpoint(req, res) {
  try {
    // Input validation
    const validatedInput = validateApiInput(req.body);
    if (!validatedInput.isValid) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Authorization check
    if (!req.user || !hasPermission(req.user, 'read_data')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Process request
    const result = await processRequest(validatedInput.data);
    res.json(result);
  } catch (error) {
    // Log error without exposing details
    logger.error('API endpoint error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Commit Message Format

Use conventional commit format:

```
type(scope): brief description

Detailed explanation if needed.

- Add bullet points for multiple changes
- Reference issues: Fixes #123
- Include breaking changes: BREAKING CHANGE: description
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(dns): add latency monitoring widget
fix(auth): resolve JWT expiration handling
docs(api): update DNS endpoint documentation
```

## Resources

- [JSDoc Documentation](https://jsdoc.app/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Questions and Support

For questions about these guidelines or help with implementation:
1. Check existing documentation first
2. Review similar implementations in the codebase
3. Ask for clarification in code review comments
4. Update this document if guidelines need clarification