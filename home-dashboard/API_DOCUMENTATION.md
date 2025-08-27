# Home Dashboard API Documentation

## Overview

The Home Dashboard API provides comprehensive family coordination services including authentication, Google services integration, AI assistance, DNS monitoring, and system management. The API is designed for a family of 4 with both adults and children accessing the system.

**Base URL:** `http://localhost:3000`  
**API Version:** 2.0.0  
**Authentication:** JWT Bearer tokens  

## Table of Contents

- [Authentication](#authentication)
- [Google Services](#google-services)
- [AI Assistant](#ai-assistant)
- [DNS Monitoring](#dns-monitoring)
- [System Status](#system-status)
- [Error Handling](#error-handling)
- [Circuit Breakers](#circuit-breakers)

---

## Authentication

The authentication system supports two methods: Google OAuth 2.0 and PIN-based authentication for family members.

### POST /auth/login-google

Authenticate using Google OAuth 2.0.

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "accessToken": "ya29.a0AfH6SMA..." // Optional for API access
  "refreshToken": "1//04xXxXxXxX..." // Optional for token refresh
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "picture": "https://lh3.googleusercontent.com/...",
    "method": "google"
  },
  "hasGoogleTokens": true
}
```

**Error Responses:**
- `400` - Missing ID token
- `401` - Invalid Google token

### POST /auth/login-pin

Authenticate using family PIN.

**Request Body:**
```json
{
  "pin": "1234",
  "name": "Family Member"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "family_member_1",
    "name": "Family Member",
    "method": "pin"
  },
  "hasGoogleTokens": false
}
```

**Error Responses:**
- `400` - Missing PIN or name
- `401` - Invalid PIN

### GET /auth/validate

Validate JWT token and check Google token status.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "method": "google"
  },
  "googleTokens": {
    "valid": true,
    "reason": null,
    "scopes": ["email", "profile", "https://www.googleapis.com/auth/calendar"]
  }
}
```

### POST /auth/logout

Logout with optional Google access revocation.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "revokeGoogleAccess": true
}
```

**Response:**
```json
{
  "message": "Logged out successfully",
  "googleAccessRevoked": true
}
```

---

## Google Services

Google API integration with circuit breaker protection. Requires Google OAuth authentication.

### GET /google/calendar/events

Retrieve Google Calendar events.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Query Parameters:**
- `timeMin` (optional): ISO timestamp for earliest event
- `timeMax` (optional): ISO timestamp for latest event  
- `maxResults` (optional): Maximum events to return (default: 10)

**Example Request:**
```
GET /google/calendar/events?maxResults=5&timeMin=2024-01-01T00:00:00Z
```

**Response:**
```json
{
  "events": [
    {
      "id": "event123",
      "summary": "Team Meeting",
      "description": "Weekly team sync",
      "start": "2024-01-15T10:00:00Z",
      "end": "2024-01-15T11:00:00Z",
      "location": "Conference Room A",
      "attendees": [{"email": "john@example.com"}],
      "htmlLink": "https://calendar.google.com/event?eid=..."
    }
  ]
}
```

**Circuit Breaker Fallback:**
```json
{
  "error": "Calendar service temporarily unavailable",
  "message": "Google Calendar is experiencing issues. Please try again later.",
  "fallback": true,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "events": []
}
```

### POST /google/calendar/events

Create a new calendar event.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "summary": "Family Birthday Party",
  "description": "Celebrating Mom's birthday",
  "start": "2024-01-20T18:00:00Z",
  "end": "2024-01-20T21:00:00Z",
  "location": "Home",
  "attendees": ["dad@family.com", "sister@family.com"]
}
```

**Response:**
```json
{
  "event": {
    "id": "new_event_id",
    "summary": "Family Birthday Party",
    // ... full Google Calendar event object
  }
}
```

### GET /google/gmail/messages

Retrieve Gmail messages.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Query Parameters:**
- `q` (optional): Gmail search query (default: "is:unread")
- `maxResults` (optional): Maximum messages (default: 10)

**Response:**
```json
{
  "messages": [
    {
      "id": "msg123",
      "threadId": "thread456",
      "subject": "Important Family Update",
      "from": "family@example.com",
      "date": "Mon, 15 Jan 2024 10:00:00 +0000",
      "snippet": "Don't forget about dinner tonight..."
    }
  ]
}
```

### POST /google/gmail/send

Send email via Gmail.

**Request Body:**
```json
{
  "to": "family@example.com",
  "subject": "Dinner Plans",
  "body": "What should we have for dinner tonight?"
}
```

### GET /google/drive/files

List Google Drive files.

**Query Parameters:**
- `q` (optional): Drive search query (default: "trashed=false")
- `pageSize` (optional): Number of files (default: 10)

**Response:**
```json
{
  "files": [
    {
      "id": "file123",
      "name": "Family Photos 2024",
      "mimeType": "application/vnd.google-apps.folder",
      "size": null,
      "modifiedTime": "2024-01-15T10:00:00.000Z",
      "webViewLink": "https://drive.google.com/drive/folders/..."
    }
  ]
}
```

---

## AI Assistant

Family-focused AI assistant with context enhancement and action parsing.

### POST /ai/chat

Send message to AI assistant.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Request Body:**
```json
{
  "message": "What should we have for dinner tonight?",
  "model": "llama3.2"
}
```

**Response:**
```json
{
  "message": "I'd suggest having pasta with marinara sauce and a side salad. It's quick, family-friendly, and you can add garlic bread for the kids. Would you like me to help you find a recipe?",
  "model": "llama3.2",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "suggestedActions": [
    {
      "type": "search_recipes",
      "label": "Find Recipes",
      "icon": "🍽️",
      "data": { "query": "pasta marinara family" }
    },
    {
      "type": "add_to_shopping",
      "label": "Add to Shopping List", 
      "icon": "🛒",
      "data": { "items": ["pasta", "marinara sauce", "lettuce"] }
    }
  ]
}
```

**Suggested Action Types:**
- `add_to_calendar`: Calendar event suggestions
- `search_recipes`: Meal planning assistance
- `add_to_shopping`: Shopping list items
- `create_reminder`: Reminder suggestions

### GET /ai/chat/history

Get user's chat history.

**Response:**
```json
[
  {
    "role": "user",
    "content": "What's for dinner?",
    "timestamp": "2024-01-15T10:00:00.000Z"
  },
  {
    "role": "assistant", 
    "content": "How about trying a pasta dish...",
    "timestamp": "2024-01-15T10:00:01.000Z",
    "suggestedActions": [...]
  }
]
```

### DELETE /ai/chat/history

Clear user's chat history.

**Response:**
```json
{
  "message": "Chat history cleared"
}
```

### GET /ai/status

Check AI service status and available models.

**Response:**
```json
{
  "connected": true,
  "service": "Ollama",
  "endpoint": "http://192.168.1.74:11434",
  "models": [
    {
      "name": "llama2:latest",
      "size": "3.8GB", 
      "modified": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### GET /ai/models

Get available AI models.

**Response:**
```json
{
  "models": [
    {
      "name": "llama2:latest",
      "size": "3.8GB",
      "modified": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### POST /ai/generate

Direct text generation without family context.

**Request Body:**
```json
{
  "prompt": "Write a short poem about family",
  "model": "llama3.2",
  "stream": false
}
```

**Response:**
```json
{
  "response": "Family is love, laughter, and light...",
  "model": "llama3.2", 
  "done": true,
  "context": [1, 2, 3]
}
```

---

## DNS Monitoring

DNS status monitoring with circuit breaker protection.

### GET /dns/status

Get DNS monitoring status.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "status": "healthy",
  "provider": "Control D",
  "primaryDns": "Auto",
  "secondaryDns": "Auto", 
  "responseTime": 45,
  "lastChecked": "2024-01-15T10:00:00.000Z",
  "uptime": 99.8,
  "analytics": {
    "queries24h": 1250,
    "blocked24h": 180,
    "avgResponseTime": 42
  }
}
```

### GET /dns/analytics

Get DNS analytics data.

**Response:**
```json
{
  "period": "24h",
  "totalQueries": 1250,
  "blockedQueries": 180,
  "blockRate": 14.4,
  "topDomains": [
    {"domain": "google.com", "queries": 45},
    {"domain": "youtube.com", "queries": 38}
  ],
  "queryTypes": {
    "A": 850,
    "AAAA": 320,
    "CNAME": 80
  }
}
```

### POST /dns/lookup

Perform DNS lookup.

**Request Body:**
```json
{
  "domain": "example.com",
  "type": "A"
}
```

**Response:**
```json
{
  "domain": "example.com",
  "type": "A", 
  "result": ["93.184.216.34"],
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

## System Status

System health and circuit breaker monitoring.

### GET /system/status

Get comprehensive system status.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "responseTime": 25,
  "services": {
    "ollama": {
      "status": "healthy",
      "responseTime": 120
    },
    "dns": {
      "status": "healthy", 
      "responseTime": 45
    }
  },
  "system": {
    "hostname": "dashboard-server",
    "platform": "linux",
    "uptime": 86400,
    "loadAverage": [0.5, 0.8, 1.2],
    "totalMemory": 8589934592,
    "freeMemory": 4294967296,
    "nodeVersion": "v18.17.0"
  },
  "circuitBreakers": {
    "summary": {
      "total": 5,
      "healthy": 4,
      "degraded": 1,
      "failed": 0,
      "overallHealth": "degraded"
    },
    "details": {
      "google-calendar": {
        "state": "CLOSED",
        "isHealthy": true,
        "failures": 0
      }
    }
  }
}
```

### GET /system/health

Simple health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "version": "2.0.0"
}
```

### GET /system/circuit-breakers

Get circuit breaker status.

**Response:**
```json
{
  "summary": {
    "total": 5,
    "healthy": 4,
    "degraded": 1, 
    "failed": 0,
    "overallHealth": "degraded"
  },
  "details": {
    "google-calendar": {
      "name": "Google Calendar API",
      "state": "CLOSED",
      "isHealthy": true,
      "failures": 0,
      "failureThreshold": 3,
      "stats": {
        "totalCalls": 45,
        "successfulCalls": 43,
        "failedCalls": 2,
        "successRate": "95.56%"
      }
    }
  }
}
```

### POST /system/circuit-breakers/reset

Reset circuit breakers (admin only).

**Request Body:**
```json
{
  "service": "google-calendar"  // Optional: specific service
}
```

**Response:**
```json
{
  "message": "Circuit breaker reset: google-calendar",
  "service": "google-calendar",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

## Error Handling

All API endpoints follow consistent error response formats.

### Standard Error Response

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",  // Optional error code
  "details": "Additional error details",  // Optional
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error
- `503` - Service Unavailable (circuit breaker open)

### Authentication Errors

```json
{
  "error": "Google authentication expired",
  "code": "GOOGLE_TOKEN_INVALID",
  "reason": "tokens_expired"
}
```

### Circuit Breaker Errors

When services are unavailable due to circuit breaker protection:

```json
{
  "error": "Service temporarily unavailable",
  "message": "Google Calendar is experiencing issues. Please try again later.",
  "fallback": true,
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

## Circuit Breakers

The API implements circuit breaker patterns for all external services to prevent cascade failures and provide graceful degradation.

### Service Circuit Breakers

| Service | Failure Threshold | Time Window | Timeout | Reset Timeout |
|---------|------------------|-------------|---------|---------------|
| Google APIs | 3 failures | 60s | 15s | 30s |
| Ollama AI | 5 failures | 60s | 30s | 60s |
| DNS Resolver | 5 failures | 60s | 10s | 30s |

### Circuit Breaker States

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Circuit tripped, requests fail fast with fallback
- **HALF_OPEN**: Testing recovery, limited requests allowed

### Monitoring Circuit Breakers

Use `/system/circuit-breakers` endpoint to monitor circuit breaker health and manually reset if needed via `/system/circuit-breakers/reset`.

---

## Rate Limiting

API endpoints are protected by rate limiting:

- Window: 15 minutes (900,000ms)
- Max Requests: 100 per window per IP
- Headers included in responses:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

---

## Family Context Features

The API is specifically designed for family use with:

### Family-Specific AI Context
- Optimized for family of 4 (2 adults, 2 children)
- Meal planning and shopping assistance
- Homework and educational help
- Family coordination and scheduling

### Multi-User Authentication
- Google OAuth for adults
- PIN authentication for children
- Shared Google tokens inheritance
- Per-user chat history isolation

### User-Friendly Features
- Simple PIN authentication
- Context-aware AI responses
- Educational assistance capabilities
- Role-based access control

---

This completes the comprehensive API documentation for the Home Dashboard. All endpoints include circuit breaker protection, proper authentication, and family-focused functionality.