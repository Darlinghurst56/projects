# TaskMaster Dashboard API Design

## 🎯 API Endpoints for Multi-Agent Coordination

### **Core TaskMaster Integration Endpoints**

#### **Agent Management**
```http
GET /api/agents                    # List all available agent tags
GET /api/agents/{tag}              # Get specific agent tag details
POST /api/agents/{tag}/switch      # Switch to agent context
GET /api/agents/current            # Get current active agent context
```

#### **Task Operations**
```http
GET /api/tasks                     # Get all tasks (with filters)
GET /api/tasks/{id}                # Get specific task details
POST /api/tasks                    # Create new task
PUT /api/tasks/{id}                # Update task
PUT /api/tasks/{id}/status         # Update task status
POST /api/tasks/{id}/claim         # Claim task for current agent
POST /api/tasks/{id}/subtasks      # Add subtask
```

#### **Multi-Agent Coordination**
```http
GET /api/coordination/status       # Get overall coordination status
GET /api/coordination/priority     # Get agent priority hierarchy
POST /api/coordination/handoff     # Hand off task between agents
GET /api/coordination/conflicts    # Check for task conflicts
```

#### **Real-time Updates**
```http
GET /api/stream                    # SSE endpoint for real-time updates
WebSocket /ws                      # WebSocket for bidirectional communication
```

---

## 📊 Request/Response Formats

### **GET /api/agents**
```json
{
  "agents": [
    {
      "name": "server-agent",
      "description": "Exclusive server operations and deployment coordination",
      "priority": 1,
      "taskCount": 16,
      "completedTasks": 9,
      "statusBreakdown": {
        "in-progress": 5,
        "done": 8,
        "pending": 2
      },
      "isCurrent": true
    }
  ],
  "currentAgent": "server-agent",
  "totalAgents": 9
}
```

### **GET /api/tasks**
```json
{
  "tasks": [
    {
      "id": "1",
      "title": "QA Testing: DNS Analytics Widget",
      "description": "Perform QA testing on DNS Analytics Widget functionality",
      "status": "in-progress",
      "priority": "high",
      "assignedAgent": "qa-specialist",
      "sourceTag": "server-agent",
      "dependencies": [14, 15, 16],
      "subtasks": [
        {
          "id": "1.1",
          "title": "UI Developer Dashboard Testing Complete",
          "status": "done",
          "assignedAgent": "ui-developer"
        }
      ],
      "createdAt": "2025-07-05T09:25:03.035Z",
      "updatedAt": "2025-07-07T20:22:06.962Z"
    }
  ],
  "filter": {
    "status": "all",
    "agent": "all",
    "priority": "all"
  },
  "pagination": {
    "total": 76,
    "page": 1,
    "limit": 20
  },
  "stats": {
    "total": 76,
    "completed": 32,
    "inProgress": 12,
    "pending": 32,
    "completionPercentage": 42
  }
}
```

### **POST /api/tasks/{id}/claim**
```json
{
  "taskId": "5",
  "agentName": "integration-specialist",
  "claimedAt": "2025-07-07T20:25:00.000Z",
  "previousStatus": "pending",
  "newStatus": "in-progress",
  "attribution": "AGENT: integration-specialist - Claimed task for API integration work"
}
```

### **WebSocket Message Format**
```json
{
  "type": "task:updated",
  "data": {
    "taskId": "3",
    "status": "in-progress",
    "agent": "integration-specialist",
    "timestamp": "2025-07-07T20:25:00.000Z",
    "change": "status_changed"
  }
}
```

---

## 🔧 Implementation Architecture

### **Backend Stack**
- **Framework**: Express.js with TypeScript
- **TaskMaster Integration**: Child process execution of TaskMaster CLI
- **Real-time**: WebSocket (ws package) + Server-Sent Events
- **Data**: In-memory caching with TaskMaster as source of truth
- **Security**: API key authentication, CORS configuration

### **Data Flow**
```
Dashboard Widget → API Endpoint → TaskMaster CLI → Response → Widget Update
                                      ↓
                              WebSocket Broadcast → All Clients
```

### **Error Handling**
```json
{
  "error": {
    "code": "TASKMASTER_ERROR",
    "message": "Failed to execute TaskMaster command",
    "details": "task-master set-status failed: Task not found",
    "timestamp": "2025-07-07T20:25:00.000Z"
  }
}
```

---

## 🚀 Implementation Plan

### **Phase 1: Core API Server** (Current)
1. **Express.js setup** with TypeScript configuration
2. **Basic endpoints** for agent and task operations
3. **TaskMaster CLI integration** via child_process
4. **Error handling** and logging framework

### **Phase 2: Real-time Features**
1. **WebSocket server** for live updates
2. **Event broadcasting** for multi-agent coordination
3. **Dashboard integration** testing

### **Phase 3: Advanced Features**
1. **Task conflict detection** and resolution
2. **Agent priority enforcement** in API
3. **Performance optimization** and caching
4. **Production deployment** configuration

---

## 📋 API Testing Strategy

### **Unit Tests**
- TaskMaster CLI integration functions
- Data transformation and validation
- Error handling scenarios

### **Integration Tests**
- Full API endpoint workflows
- WebSocket connection and messaging
- Dashboard widget integration

### **Load Tests**
- Multiple concurrent dashboard clients
- High-frequency task updates
- WebSocket connection limits

This API design enables the dashboard to replace fallback data with real TaskMaster integration while supporting full multi-agent coordination capabilities.