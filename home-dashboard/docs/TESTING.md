# Testing Guide

## Quick Testing Commands

```bash
# Complete test suite
npm run test:all

# Quick smoke test
npm run test:smoke

# Security tests
npm run test:security

# Performance tests
npm run test:performance

# Installation verification
npm run test:install
```

## Test Categories

### 1. Unit Tests
Test individual components and functions:
```bash
# Run unit tests
npm run test:unit

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### 2. Integration Tests
Test component interactions and API endpoints:
```bash
# Run integration tests
npm run test:integration

# Test specific API endpoints
npm run test:api -- --testNamePattern="auth"
npm run test:api -- --testNamePattern="dns"
npm run test:api -- --testNamePattern="google"
```

### 3. End-to-End Tests
Test complete user journeys:
```bash
# Run E2E tests
npm run test:e2e

# Run specific E2E scenarios
npx playwright test --grep "authentication flow"
npx playwright test --grep "widget functionality"
```

### 4. Performance Tests
```bash
# Load testing
npm run test:performance

# API response time testing
npm run test:api-performance

# Bundle size analysis
npm run analyze
```

### 5. Security Tests
```bash
# Security audit
npm audit --audit-level=moderate

# Authentication security tests
npm run test:auth-security

# Input validation tests
npm run test:validation
```

## Authentication Testing

### PIN Authentication
Test family PIN access levels:
```bash
# Test child basic access (PIN: 123456)
# Test child extended access (PIN: 567890)  
# Test admin access (PIN: 999999)
```

### Google OAuth Testing
```bash
# Test Google sign-in flow
npm run test:google-auth

# Test token refresh
npm run test:token-refresh
```

## Widget Testing

### Core Widgets
- **DNS Status Widget**: Network safety monitoring
- **Google Calendar Widget**: Family calendar integration
- **AI Chat Widget**: Homework help and family assistant
- **System Status Widget**: Dashboard health monitoring

### Widget Test Commands
```bash
# Test all widgets
npm run test:widgets

# Test specific widget
npm run test:widgets -- --testNamePattern="dns"
npm run test:widgets -- --testNamePattern="calendar"
npm run test:widgets -- --testNamePattern="ai-chat"
```

## Browser Testing

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Cross-browser Testing
```bash
# Run tests across browsers
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Mobile Testing
```bash
# Test mobile layouts
npx playwright test --project=mobile-chrome
npx playwright test --project=mobile-safari
```

## Automated Testing

### CI/CD Pipeline
Tests run automatically on:
- Every commit
- Pull requests
- Daily scheduled runs

### Pre-commit Testing
```bash
# Lint check
npm run lint

# Type check
npm run typecheck

# Unit tests
npm run test:unit

# Security audit
npm audit --audit-level=moderate
```

## Test Coverage Goals

- **Overall Coverage**: 80%+
- **Critical Paths**: 90%+
- **API Endpoints**: 85%+
- **Components**: 80%+

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

## Performance Benchmarks

### Load Time Targets
- **Initial page load**: < 3 seconds
- **Widget loading**: < 2 seconds
- **Navigation**: < 1 second

### API Response Targets
- **Authentication**: < 500ms
- **DNS status**: < 300ms
- **Google Calendar**: < 1000ms
- **System status**: < 200ms

## Troubleshooting Tests

### Common Test Failures

**Authentication Tests Failing**
```bash
# Check environment variables
cat .env | grep -E "(GOOGLE_|JWT_|SESSION_)"

# Verify service connectivity
curl -f http://localhost:3000/api/auth/status
```

**Widget Tests Failing**
```bash
# Check external service connectivity
curl -f http://192.168.1.74:11434/api/tags  # Ollama
curl -f http://192.168.1.74:5678/healthz    # n8n
```

**E2E Tests Failing**
```bash
# Check browser installation
npx playwright install

# Run tests with debug mode
npx playwright test --debug

# Generate trace files
npx playwright test --trace on
```

### Test Environment Issues

**Port Conflicts**
```bash
# Kill processes on test ports
lsof -ti:3000,3001,3002,3003 | xargs kill -9

# Use different ports for testing
TEST_PORT=3010 npm run test:e2e
```

**Database Issues**
```bash
# Reset test database
npm run db:reset:test

# Clear test data
rm -rf server/data/test-*
```

## Manual Testing Checklist

### Basic Functionality ✅
- [ ] PIN login works with all family PINs
- [ ] Google OAuth sign-in works
- [ ] All widgets load without errors
- [ ] Navigation between pages works
- [ ] Real-time updates function
- [ ] Logout properly clears session

### Security ✅
- [ ] Unauthorized access is blocked
- [ ] Invalid PINs are rejected
- [ ] XSS attacks are prevented
- [ ] CSRF protection is active
- [ ] JWT tokens are validated

### Performance ✅
- [ ] Page loads within 3 seconds
- [ ] Widgets respond within 2 seconds
- [ ] No memory leaks detected
- [ ] Bundle size is optimized

### Accessibility ✅
- [ ] Screen reader compatible
- [ ] Keyboard navigation works
- [ ] Color contrast meets standards
- [ ] ARIA labels are present

## Continuous Testing

### Development Testing
```bash
# Watch mode during development
npm run test:watch

# Coverage monitoring
npm run test:coverage -- --watch

# Integration testing during development
npm run test:integration -- --watch
```

### Automated Testing Schedule
```bash
# Daily full test suite (runs at 2 AM)
0 2 * * * cd /home/darlinghurstlinux/projects/home-dashboard && npm run test:all

# Weekly security audit (runs Sunday midnight)
0 0 * * 0 cd /home/darlinghurstlinux/projects/home-dashboard && npm audit

# Monthly dependency updates (runs 1st of month)
0 0 1 * * cd /home/darlinghurstlinux/projects/home-dashboard && npm update && npm test
```

---

**Need More Details?** Check `/home/darlinghurstlinux/projects/home-dashboard/archive/docs/` for comprehensive testing documentation and advanced test scenarios.