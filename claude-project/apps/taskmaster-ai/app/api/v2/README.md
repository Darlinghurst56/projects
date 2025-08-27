# TaskMaster AI API v2

Simplified API that preserves LLM-powered agent intelligence while using TaskMaster workspaces as the single source of truth.

## Architecture

- **Workspace-based Assignment**: Use TaskMaster workspaces to assign tasks to agents
- **Agent Intelligence Preserved**: LLM-powered agents maintain their analysis and suggestion capabilities
- **Orchestrator Enhanced**: Special orchestrator agent provides human-understandable workflow suggestions
- **Single Source of Truth**: TaskMaster JSON files are the authoritative data source

## Endpoints

### Workspace Management (`/api/v2/workspace`)
- `GET /current` - Get current workspace
- `GET /list` - List all workspaces with agent mapping
- `POST /switch` - Switch workspace and sync agent assignments
- `POST /create` - Create new workspace

### Agent Management (`/api/v2/agents`)
- `GET /` - List all agents with capabilities and status
- `GET /:id/status` - Get detailed agent status and workflow state
- `GET /:id/tasks` - Get tasks assigned to specific agent
- `POST /:id/suggest` - Trigger agent suggestion workflow
- `GET /:id/suggestions` - Get agent's pending suggestions
- `PUT /:id/config` - Update agent configuration
- `GET /:id/logs` - Get agent workflow execution logs

### Orchestrator Interface (`/api/v2/orchestrator`)
- `GET /suggestions` - Get orchestrator's task assignment suggestions
- `POST /analyze` - Analyze tasks for assignment suggestions
- `POST /suggestions/:id/approve` - Approve orchestrator suggestion
- `POST /suggestions/:id/reject` - Reject orchestrator suggestion
- `GET /workflow` - Get human-readable workflow status
- `GET /progress` - Generate progress report

### Task Operations (`/api/v2/tasks`)
- `GET /` - Get tasks with optional filtering
- `POST /:id/assign` - Assign task to agent with workspace management

### System (`/api/v2`)
- `GET /status` - Overall system status
- `GET /health` - Health check for all services

## Key Features

### 1. Preserved Agent Intelligence
- Each agent retains LLM-powered analysis capabilities
- Agents can provide task-specific suggestions and recommendations
- Workflow states and execution logs are maintained

### 2. Enhanced Orchestrator
- Intelligent task-to-agent matching with confidence scores
- Human-readable explanations for assignment suggestions
- Clear workflow steps and progress tracking

### 3. Workspace Integration
- Direct TaskMaster CLI integration for all operations
- Workspace-to-agent mapping for task assignment
- Real-time synchronization with TaskMaster JSON files

### 4. Human-Understandable Interface
- Clear reasoning for all orchestrator suggestions
- Confidence scores and keyword analysis
- Next steps and workflow guidance

## Usage Examples

### Switch to Agent Workspace
```bash
POST /api/v2/workspace/switch
{
  "workspace": "frontend-tasks",
  "agentId": "frontend-agent"
}
```

### Get Orchestrator Suggestions
```bash
GET /api/v2/orchestrator/suggestions
```

### Trigger Agent Analysis
```bash
POST /api/v2/agents/frontend-agent/suggest
{
  "taskId": "5",
  "context": "React component needs responsive design"
}
```

### Assign Task with Orchestrator Approval
```bash
POST /api/v2/tasks/5/assign
{
  "agentId": "frontend-agent",
  "workspace": "frontend-tasks",
  "reasoning": "Task involves React component development"
}
```

## Benefits

- **80% Less Code**: Simplified from 25+ endpoints to 15 focused endpoints
- **Preserved Intelligence**: All LLM agent capabilities maintained
- **Clear Human Flow**: Orchestrator provides understandable suggestions
- **Single Source Truth**: TaskMaster JSON files are authoritative
- **Easy Maintenance**: Direct CLI integration, no complex state management

## Migration from v1

- Replace complex coordination calls with workspace operations
- Use orchestrator suggestions instead of manual routing
- Leverage agent intelligence endpoints for task analysis
- Monitor system status through simplified health checks