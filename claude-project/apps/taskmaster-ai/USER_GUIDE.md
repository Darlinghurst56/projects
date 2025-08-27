# TaskMaster AI User Guide

**Version**: Post-consolidation (January 2025)  
**System**: Single-user development tool  
**Port**: 3010 (updated from 3001)

## System Overview

TaskMaster AI is a **developer coordination tool** with 4 main interfaces consolidated from the original 6 overlapping interfaces for better usability and single source of truth.

### Core Purpose
- **Primary**: Help YOU coordinate development tasks for building software
- **Target User**: Single developer (not enterprise/multi-user)
- **Use Case**: Coordinate 5-agent system (Frontend, Backend, DevOps, QA, Orchestrator) for development projects

## Interface Navigation

The system now has **4 consolidated interfaces** (reduced from 6):

### 1. Home Dashboard (`/`) 
**Purpose**: System overview and quick actions

**Key Features**:
- System health monitoring (API, CLI, uptime)
- Agent system overview (total, active, coordination status)
- Task overview (total, completed, in-progress, pending)
- Quick action cards to navigate to other interfaces
- Real-time metrics with 30-second auto-refresh

**User Flow**: Entry point → View system status → Navigate to specific interface

### 2. Tasks Interface (`/tasks`)
**Purpose**: Task management and monitoring

**Key Features**:
- Task list with filtering (status, priority, search)
- Task statistics badges (done, in-progress, pending, cancelled)
- Expandable task cards with full details
- Real-time updates every 30 seconds
- Single source of truth: Uses `/api/v2/tasks` endpoint

**User Flow**: View all tasks → Filter by criteria → Expand for details → Monitor progress

### 3. Agents Interface (`/agents`) **[CONSOLIDATED]**
**Purpose**: Agent management and monitoring

**Key Features**:
- **Combined functionality** from previous Agent Management + Mission Control
- Agent cards showing status, capabilities, and assigned tasks
- System metrics (total/active/idle/offline agents)
- Quick actions: Start/Stop all agents, Health check
- Individual agent management (start/stop, configure)
- Real-time agent status with 30-second refresh

**User Flow**: View agent overview → Manage individual agents → Monitor system health

### 4. Developer Interface (`/developer-interface`)
**Purpose**: Advanced system monitoring and configuration

**Key Features**:
- Enhanced telemetry and system monitoring
- Model configuration and advanced settings
- Performance metrics and health checks
- Technical system details for developers

**User Flow**: Access advanced features → Monitor performance → Configure system settings

## Navigation Improvements

### Standardized Navigation
All pages now include consistent navigation with:
- Breadcrumb navigation showing current location
- Consistent menu structure across all interfaces
- Mobile-responsive design
- Standard styling and interaction patterns

### Removed Redundant Interfaces
- **Agent Management** → Merged into `/agents`
- **Mission Control** → Merged into `/agents`
- **Old URLs redirect** to new consolidated interfaces

## Data Consistency

### Single Source of Truth
All interfaces now use **API v2 endpoints** exclusively:

- **Tasks**: `/api/v2/tasks` and `/api/v2/workspace`
- **Agents**: `/api/v2/agents` with working copy integration
- **Health**: `/api/health` for system status
- **Configuration**: `/api/v2/agents/{id}/config`

### Working Copy Pattern
- Task assignments update both `working-copy` and permanent storage
- Ensures real-time consistency between CLI and web interface
- Single location for task/agent state management

## CLI Integration

### TaskMaster CLI Commands
The web interfaces complement these CLI operations:

```bash
# Task Management
task-master list                    # View in /tasks interface
task-master next                    # Shows in agent assignments
task-master show <id>               # Detailed view in task cards
task-master set-status --id=X --status=done  # Updates web interface

# Agent Operations  
task-master use-tag <workspace>     # Reflected in /agents interface
```

### Synchronization
- CLI changes appear in web interface within 30 seconds
- Web interface changes immediately update working copy
- Both use same underlying API v2 endpoints

## System Health & Monitoring

### Health Status Display
Consistent across all interfaces:
- **System Healthy**: All agents active, APIs responsive
- **System Warning**: Some agents idle, minor issues detected
- **System Degraded**: Multiple agents offline, API delays
- **System Offline**: Critical systems down

### Real-time Updates
- All interfaces auto-refresh every 30 seconds
- Manual refresh buttons available
- Toast notifications for status changes
- Loading states during data fetching

## Task Management Workflow

### Complete E2E Task Assignment Process
1. **View Tasks** (`/tasks`): Browse and filter available tasks
2. **Agent Assignment** (`/agents`): Assign tasks to appropriate agents
3. **Monitor Progress** (`/tasks` + `/agents`): Track execution status
4. **Completion**: Verify results and mark complete

### Task States
- **Pending**: Awaiting assignment or execution
- **In Progress**: Currently being worked on
- **Done**: Successfully completed
- **Cancelled**: Stopped or abandoned

## Best Practices

### For Single User Operation
- Monitor system health via Home Dashboard
- Use task filtering to focus on relevant work
- Regularly check agent status and assignments
- Leverage CLI for quick operations, web for monitoring

### Interface Usage Patterns
- **Daily workflow**: Home → Tasks → Agents
- **Task focused**: Tasks interface with filters
- **Agent focused**: Agents interface for system management
- **Debug/Config**: Developer interface for troubleshooting

### Data Integrity
- All task updates go through working copy pattern
- Agent assignments are immediately synchronized
- Single source of truth prevents conflicting states

## Troubleshooting

### Common Issues
1. **Data not updating**: Check API health on Home Dashboard
2. **Agent status inconsistent**: Use Health Check button in Agents interface  
3. **Task assignments missing**: Verify working copy synchronization
4. **Navigation not working**: Clear browser cache, all URLs now use v2 endpoints

### Error Handling
- Toast notifications show success/error messages
- Retry buttons available for failed operations
- Error states clearly displayed with actionable solutions
- Real-time status indicators prevent confusion

## System Architecture

### Port Configuration
- **Current Port**: 3010 (updated from 3001)
- **Health Endpoint**: `http://localhost:3010/api/health`
- **Main Interface**: `http://localhost:3010/`

### API Structure
```
/api/v2/
├── tasks/                  # Task management
├── agents/                 # Agent management  
├── workspace/              # Working copy data
└── orchestrator/           # Agent coordination
```

### File Structure
```
app/
├── web/                    # Main interfaces
│   ├── index.html         # Home Dashboard
│   ├── tasks.html         # Task management
│   ├── agents.html        # Agent management (consolidated)
│   └── components/        # Shared navigation
├── developer-interface/    # Advanced interface
└── api/v2/                # Unified API endpoints
```

---

## Quick Reference

### Interface URLs
- Home: `http://localhost:3010/`
- Tasks: `http://localhost:3010/tasks`
- Agents: `http://localhost:3010/agents`
- Developer: `http://localhost:3010/developer-interface`

### Key Features
- ✅ Single source of truth for all data
- ✅ Real-time synchronization between CLI and web
- ✅ Consolidated interfaces (4 instead of 6)
- ✅ Consistent navigation and UX patterns
- ✅ Comprehensive error handling and status feedback

### Support
- System health monitoring via Home Dashboard
- Error states with retry options
- Toast notifications for all operations
- Consistent status indicators across all interfaces