# HTTP/Fetch MCP Server Integration Guide

## Overview

This document describes the complete HTTP/Fetch MCP server integration for the Claude Project Dashboard, providing enhanced API calling capabilities with caching, error handling, and reusable client configurations.

## Installation Summary

### 1. MCP Server Installation

- **Package**: `zcaceres/fetch-mcp` (third-party HTTP MCP server)
- **Location**: `/mcp-servers/fetch-mcp/`
- **Build**: TypeScript compiled to JavaScript in `dist/` directory
- **Configuration**: Updated `.mcp.json` with absolute path to built server

### 2. HTTP Client Configuration

- **Main Config**: `/config/http-client.json` - Complete configuration file
- **Client Module**: `/config/http-client.js` - JavaScript HTTP client implementation
- **Environment**: `.env.example` - API key configuration template

## Features Implemented

### Core HTTP Client Capabilities

1. **Enhanced Fetch Client** (`HttpClient` class)
   - Built on native fetch API with advanced features
   - Automatic retry logic with exponential backoff
   - Comprehensive error handling and validation
   - Request/response logging and monitoring

2. **Intelligent Caching System**
   - In-memory cache with configurable TTL
   - URL pattern-based cache rules
   - Automatic cache invalidation
   - Cache statistics and management

3. **Security & Validation**
   - Domain allowlist/blocklist
   - HTTPS enforcement
   - Certificate validation
   - Request size limits

4. **Rate Limiting**
   - Per-domain request limits
   - Configurable time windows
   - Automatic throttling
   - Burst protection

### API Client Configurations

Pre-configured API clients for common services:

1. **Weather API** (OpenWeatherMap)
   - Base URL: `https://api.openweathermap.org/data/2.5`
   - Authentication: Query parameter (`appid`)
   - Cache TTL: 10 minutes
   - Endpoints: current weather, forecast, history

2. **News API**
   - Base URL: `https://newsapi.org/v2`
   - Authentication: Header (`X-API-Key`)
   - Cache TTL: 15 minutes
   - Endpoints: headlines, everything, sources

3. **Testing APIs**
   - JSONPlaceholder: No auth, general testing
   - HTTPBin: No auth, HTTP testing utilities

### Error Handling Strategy

1. **Retry Logic**
   - Retryable errors: Network, timeout, rate limit, server errors
   - Non-retryable: Invalid URL, auth errors, client errors
   - Exponential backoff: 1s, 2s, 4s delays
   - Maximum 3 retry attempts

2. **Fallback Mechanisms**
   - Demo data for API failures
   - Graceful degradation
   - User-friendly error messages
   - Comprehensive error logging

## File Structure

```
/config/
├── http-client.json          # Main configuration file
├── http-client.js           # HTTP client implementation
└── http-client-test.js      # Test suite for HTTP client

/dashboard/
├── js/
│   └── http-api-integration.js  # Dashboard API manager
└── test-http-integration.html   # Integration test page

/mcp-servers/
└── fetch-mcp/              # MCP server installation
    ├── dist/
    │   └── index.js         # Compiled MCP server
    └── src/                 # TypeScript source

/.env.example                # Environment variables template
/.mcp.json                  # Updated MCP configuration
```

## Configuration Details

### HTTP Client Settings

```json
{
  "settings": {
    "defaultTimeout": 30000,
    "retryAttempts": 3,
    "retryDelayMs": 1000,
    "enableCaching": true,
    "defaultCacheTtl": 300000,
    "userAgent": "Claude-Project-Dashboard/1.0.0"
  }
}
```

### Caching Rules

- **API Responses**: 5 minutes cache for `/api/*` endpoints
- **Static Content**: 1 hour cache for CSS/JS/JSON files
- **Dynamic Content**: 1 minute cache for weather/news data

### Security Configuration

- **Allowed Domains**: Whitelist of trusted API providers
- **Blocked Domains**: Blacklist for malicious sites
- **HTTPS Required**: Enforced for all requests
- **Certificate Validation**: Full SSL verification
- **Max Redirects**: Limited to 5 redirects

## Usage Examples

### Basic HTTP Request

```javascript
import { httpClient } from './config/http-client.js';

// Simple GET request
const data = await httpClient.fetch('https://api.example.com/data');

// POST request with options
const result = await httpClient.fetch('https://api.example.com/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});
```

### API Client Usage

```javascript
// Weather data
const weather = await httpClient.apiRequest('weatherApi', '/weather', {
  params: { q: 'London', units: 'metric' }
});

// News data
const news = await httpClient.apiRequest('newsApi', '/top-headlines', {
  params: { category: 'technology', country: 'us' }
});
```

### Dashboard Integration

```javascript
import { DashboardApiManager } from './js/http-api-integration.js';

const apiManager = new DashboardApiManager();

// Get weather for dashboard widget
const weather = await apiManager.getWeatherData('New York');

// Check system status
const status = await apiManager.getSystemStatus();

// Test API endpoints
const testResults = await apiManager.testApiEndpoints();
```

## Testing

### Test Suite Components

1. **HTTP Client Tests** (`/config/http-client-test.js`)
   - Basic GET/POST requests
   - Caching functionality
   - Error handling
   - Timeout behavior
   - Security validation

2. **Integration Tests** (`/dashboard/test-http-integration.html`)
   - Visual test interface
   - API endpoint testing
   - System status monitoring
   - MCP server health checks
   - Demo API calls

### Running Tests

```bash
# Run HTTP client test suite
cd /config
node http-client-test.js

# Open integration test page
open dashboard/test-http-integration.html
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# API Keys
WEATHERAPI_API_KEY=your_openweathermap_key
NEWSAPI_API_KEY=your_newsapi_key

# HTTP Client Settings
HTTP_CLIENT_LOG_LEVEL=info
HTTP_CLIENT_CACHE_ENABLED=true
HTTP_CLIENT_RETRY_ENABLED=true

# Dashboard Settings
DASHBOARD_BASE_URL=http://localhost:3000
```

## MCP Server Configuration

Updated `.mcp.json` configuration:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "node",
      "args": ["/absolute/path/to/fetch-mcp/dist/index.js"]
    }
  }
}
```

## Available MCP Tools

The fetch MCP server provides four main tools:

1. **fetch_html** - Retrieve raw HTML content
2. **fetch_json** - Fetch and parse JSON data
3. **fetch_txt** - Get plain text content (HTML stripped)
4. **fetch_markdown** - Convert HTML to Markdown format

Each tool supports:

- Custom headers
- Timeout configuration
- Error handling
- Content transformation

## Monitoring & Logging

### Logging Configuration

- **Level**: Info, warning, error levels
- **Requests**: Full request logging available
- **Responses**: Response status and timing
- **Errors**: Detailed error information
- **Cache**: Cache hit/miss statistics

### Performance Monitoring

- **Response Times**: Track API call durations
- **Cache Hit Rate**: Monitor caching effectiveness
- **Error Rates**: Track API failure rates
- **Rate Limiting**: Monitor request patterns

## Troubleshooting

### Common Issues

1. **MCP Server Not Starting**
   - Check absolute path in `.mcp.json`
   - Verify Node.js installation
   - Check build files in `dist/` directory

2. **API Calls Failing**
   - Verify network connectivity
   - Check API key configuration
   - Review domain allowlist
   - Examine error logs

3. **Caching Issues**
   - Clear cache using `client.clearCache()`
   - Check cache TTL settings
   - Verify cache key generation

4. **Rate Limiting**
   - Review rate limit configuration
   - Check request patterns
   - Implement request spacing

### Debug Mode

Enable debug logging:

```bash
DEBUG=claude-project:* node your-script.js
```

## Future Enhancements

1. **Redis Integration** - External cache for scaling
2. **WebSocket Support** - Real-time API connections
3. **GraphQL Client** - GraphQL API integration
4. **Request Queue** - Background request processing
5. **Metrics Dashboard** - Visual API monitoring
6. **Circuit Breaker** - Advanced failure handling

## Security Considerations

1. **API Key Management**
   - Store in environment variables
   - Never commit to version control
   - Rotate keys regularly
   - Use different keys per environment

2. **Request Validation**
   - Validate all input parameters
   - Sanitize URL components
   - Check response content types
   - Limit request sizes

3. **Network Security**
   - Use HTTPS exclusively
   - Validate SSL certificates
   - Implement request signing
   - Monitor for unusual patterns

## Support

For issues or questions:

1. Check test results in integration test page
2. Review logs for error details
3. Verify configuration settings
4. Test with known-good endpoints
5. Check MCP server status

---

*This integration provides a robust foundation for API communication in the Claude Project Dashboard, with comprehensive error handling, caching, and security features.*
