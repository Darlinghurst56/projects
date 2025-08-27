# Unified URL Structure - TaskMaster Dashboard System

## Overview

The TaskMaster Dashboard system now provides a unified entry point at `http://localhost:3001/` that routes to all dashboard components. This consolidates the previously scattered URLs across multiple servers and ports.

## URL Structure

### Main Entry Point
- **URL**: `http://localhost:3001/`
- **Purpose**: Unified dashboard hub with navigation to all components
- **Features**: 
  - Visual dashboard selection interface
  - System status indicators
  - Responsive design for mobile/desktop
  - Accessibility support with keyboard navigation

### Dashboard Routes

#### 1. Family Dashboard
- **URL**: `http://localhost:3001/dashboard`
- **Alternative**: `http://localhost:3001/dashboard.html`
- **Purpose**: DNS monitoring and family internet management
- **Features**:
  - Control D DNS integration
  - Family member profiles
  - DNS analytics and reports
  - Connection pause/test controls

#### 2. Agent Coordination Dashboard
- **URL**: `http://localhost:3001/agent-dashboard`
- **Alternative**: `http://localhost:3001/agent-dashboard.html`
- **Purpose**: TaskMaster agent management and coordination
- **Features**:
  - Agent registry and status monitoring
  - Task assignment interface
  - Multi-agent coordination
  - Real-time TaskMaster API integration

#### 3. Live Agent Monitor
- **URL**: `http://localhost:3001/live-agent-dashboard`
- **Alternative**: `http://localhost:3001/live-agent-dashboard.html`
- **Purpose**: Real-time agent monitoring and control
- **Features**:
  - Live agent status updates
  - Performance metrics
  - Agent control interface
  - Quick task assignment

### API Routes

#### Core API Endpoints
- **Base URL**: `http://localhost:3001/api`
- **Health Check**: `/api/health`
- **Agents**: `/api/agents`
- **Tasks**: `/api/tasks`
- **Coordination**: `/api/coordination`

#### Agent Management
- `GET /api/agents` - List all agents
- `GET /api/agents/:tag` - Get specific agent
- `POST /api/agents/:tag/switch` - Switch agent context

#### Task Operations
- `GET /api/tasks` - List tasks with filtering
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id/status` - Update task status
- `POST /api/tasks/:id/claim` - Claim task for agent

#### Coordination
- `GET /api/coordination/status` - System coordination status
- `GET /api/coordination/priority` - Agent priority hierarchy

### WebSocket Connection
- **URL**: `ws://localhost:3001/ws`
- **Purpose**: Real-time updates for all dashboard components
- **Features**:
  - Live agent status updates
  - Task assignment notifications
  - System status changes

## Migration from Previous Structure

### Old Structure (Multiple Ports)
```
http://localhost:8000/dashboard.html    -> Family Dashboard
http://localhost:5173/                  -> Vite Dev Server
http://localhost:3001/                  -> API Server Only
```

### New Structure (Single Port)
```
http://localhost:3001/                  -> Unified Hub
http://localhost:3001/dashboard         -> Family Dashboard
http://localhost:3001/agent-dashboard   -> Agent Coordination
http://localhost:3001/live-agent-dashboard -> Live Monitor
http://localhost:3001/api/*            -> API Endpoints
```

## Technical Implementation

### Server Configuration
- **Port**: 3001 (configurable via `API_PORT` environment variable)
- **Static Files**: Served from dashboard directory
- **Routing**: Express.js with specific route handlers
- **WebSocket**: Real-time updates via ws library

### Entry Point Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
- **Status Indicators**: Real-time system health monitoring
- **Error Handling**: Graceful degradation if services unavailable

### Security Considerations
- **CORS**: Configured for local development
- **Helmet**: Security headers for production
- **Rate Limiting**: Not implemented (consider for production)

## Usage Instructions

### Starting the System
1. Navigate to the dashboard directory:
   ```bash
   cd /mnt/d/Projects/claude-project/dashboard
   ```

2. Start the unified server:
   ```bash
   node api-server.js
   ```

3. Access the dashboard hub:
   ```
   http://localhost:3001/
   ```

### Direct Dashboard Access
You can also access dashboards directly:
- Family Dashboard: `http://localhost:3001/dashboard`
- Agent Dashboard: `http://localhost:3001/agent-dashboard`
- Live Monitor: `http://localhost:3001/live-agent-dashboard`

### API Integration
All dashboards now use the unified API server for data:
- TaskMaster integration via REST API
- Real-time updates via WebSocket
- Centralized agent and task management

## Testing

The system includes comprehensive routing tests:
```bash
node test-unified-routing.js
```

This tests all routes and endpoints to ensure proper functionality.

## Future Enhancements

1. **Authentication**: Add user authentication for multi-user support
2. **Custom Routing**: Allow users to customize dashboard layout
3. **Plugin System**: Support for third-party dashboard widgets
4. **Mobile App**: PWA support for mobile dashboard access
5. **Performance**: Implement caching and CDN for production

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Solution: Change `API_PORT` environment variable or stop conflicting process

2. **TaskMaster Command Errors**
   - Solution: Ensure TaskMaster CLI is properly installed and configured
   - The system uses fallback data if TaskMaster is unavailable

3. **WebSocket Connection Failed**
   - Solution: Check firewall settings and ensure port 3001 is accessible

4. **Dashboard Not Loading**
   - Solution: Verify all HTML files exist in the dashboard directory
   - Check browser console for JavaScript errors

### Health Checks

The system provides multiple health check endpoints:
- `/api/health` - Overall system health
- System status indicators on main dashboard
- Real-time WebSocket connection status

## Support

For issues or questions:
1. Check the browser console for JavaScript errors
2. Review server logs for API errors
3. Verify TaskMaster CLI functionality
4. Test individual dashboard components

---

**Last Updated**: 2025-07-11
**Version**: 1.0.0
**Server**: Node.js with Express
**Port**: 3001 (default)