# Agent Code Review Guide - Home Dashboard

## Project Context for Code Review Agents

### Current Status: Phase 2 Enhancement Focus
- **Technical Foundation**: Complete and production-ready
- **Current Phase**: Enhancement and polish of existing features
- **Priority**: Performance optimization, UX improvements, integration reliability

## Specific Review Priorities (Based on Agent Analysis)

### 1. Performance Optimization (HIGH PRIORITY)

**Focus Areas:**
- Dashboard widget loading times
- WebSocket connection efficiency  
- API call optimization opportunities
- Frontend bundle size analysis
- React component re-render issues

**Key Files to Review:**
- `src/components/Dashboard.jsx` - Main dashboard component
- `src/hooks/useWebSocket.js` - WebSocket management
- `server/routes/dns.js` - DNS monitoring performance
- `server/routes/google.js` - Google API efficiency
- `src/services/api.js` - API client optimization
- `vite.config.js` - Bundle configuration

**Look For:**
- Unnecessary re-renders in React components
- Missing React.memo() or useMemo() optimizations
- Large bundle sizes or unused dependencies
- Inefficient API polling patterns
- WebSocket connection management issues

### 2. Integration Improvements (HIGH PRIORITY)

**Focus Areas:**
- Google OAuth token management (CRITICAL)
- Circuit breaker implementation for service failures
- Enhanced error handling for better UX
- Ollama AI context enhancement
- n8n webhook infrastructure

**Key Files to Review:**
- `server/routes/google.js` - Google API integration
- `server/routes/ai.js` - Ollama AI integration
- `server/routes/auth.js` - Authentication flows
- `src/config/index.js` - Configuration management
- `server/middleware/errorHandler.js` - Error handling
- `src/services/api.js` - API service layer

**Look For:**
- Missing token refresh logic for Google APIs
- Lack of circuit breaker patterns for external services
- Insufficient error handling and user feedback
- Missing retry mechanisms for failed requests
- Hardcoded configuration values

### 3. Code Quality & Maintainability (MEDIUM PRIORITY)

**Focus Areas:**
- Documentation and commenting standards
- Code organization and structure
- Security best practices
- Testing coverage

**Key Files to Review:**
- All React components in `src/components/`
- Server routes in `server/routes/`
- Middleware in `server/middleware/`
- Configuration files

**Look For:**
- Missing JSDoc comments on public functions
- Inconsistent error handling patterns
- Security vulnerabilities (credential exposure, XSS, etc.)
- Complex functions that need refactoring
- Missing input validation

## Phase 2 Enhancement Priorities

### Week 1-2 (Immediate)
1. **Google OAuth Token Management** - Critical for production reliability
2. **Circuit Breaker Implementation** - Prevent cascade failures
3. **Enhanced Error Handling** - Better user experience during failures

### Week 3-4 (Short-term)
1. **Ollama Context Enhancement** - Better AI conversation quality
2. **Authentication Flow Unification** - Streamlined user experience
3. **Basic n8n Webhook Infrastructure** - Foundation for automation

### Month 2 (Medium-term)
1. **Advanced AI Features** - Streaming, model switching, family profiles
2. **Complete n8n Integration** - Full workflow automation
3. **Performance Optimizations** - Connection pooling, caching, rate limiting

## Current Architecture Overview

### Frontend (React 18 + Vite)
```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dns/            # DNS monitoring widgets
│   ├── google/         # Google services widgets
│   ├── ai/             # AI chat interface
│   └── layout/         # Layout components
├── services/
│   ├── api.js          # Unified API client
├── hooks/
│   └── useWebSocket.js # WebSocket management
└── config/
    └── index.js        # Configuration management
```

### Backend (Node.js + Express + Socket.IO)
```
server/
├── routes/             # API routes
│   ├── auth.js         # Authentication
│   ├── google.js       # Google services
│   ├── ai.js           # AI chat
│   ├── dns.js          # DNS monitoring
│   └── system.js       # System status
├── middleware/         # Express middleware
│   ├── auth.js         # Auth middleware
│   ├── errorHandler.js # Error handling
│   └── logger.js       # Request logging
└── index.js           # Main server file
```

## Review Guidelines for Agents

### Security Review Focus
- Check for credential exposure in logs or client code
- Validate input sanitization and XSS prevention
- Review authentication and authorization patterns
- Examine rate limiting and brute force protection

### Performance Review Focus
- Identify bottlenecks in data fetching and rendering
- Review caching strategies and implementation
- Check for memory leaks in WebSocket connections
- Analyze bundle size and loading performance

### Integration Review Focus
- Examine error handling for external service failures
- Review retry logic and circuit breaker patterns
- Check token management and refresh flows
- Validate webhook and real-time update reliability

### Documentation Review Focus
- Ensure public APIs have JSDoc comments
- Check that complex business logic is documented
- Verify configuration options are documented
- Review inline comments for clarity and accuracy

## Common Issues to Watch For

1. **React Performance Issues**:
   - Components re-rendering unnecessarily
   - Missing dependency arrays in useEffect
   - Large objects in state causing re-renders

2. **API Integration Issues**:
   - Missing error handling for network failures
   - Lack of loading states for better UX
   - Inefficient polling instead of WebSocket updates

3. **Security Concerns**:
   - Client-side storage of sensitive data
   - Missing input validation on API endpoints
   - Inadequate rate limiting

4. **Code Organization Issues**:
   - Large components that should be split
   - Business logic mixed with presentation
   - Inconsistent naming conventions

## Testing Context

The project has comprehensive testing infrastructure:
- Live UX testing (mandatory - build fails if dashboard doesn't work)
- Playwright e2e tests
- Accessibility testing
- Performance validation

When reviewing code, consider:
- Will changes break existing tests?
- Do new features need additional test coverage?
- Are performance requirements still met?

## Family Context (Important for UX Reviews)

- **Target Users**: Family of 4 (2 adults, 2 children)
- **Devices**: Windows/iOS family devices
- **Use Cases**: Family coordination, homework help, network monitoring
- **Accessibility**: Must be usable by children and adults

This context should inform UX and interface decisions during code review.

---

**Use this guide to focus your code review efforts on the most impactful improvements for the home-dashboard project's Phase 2 enhancement goals.**