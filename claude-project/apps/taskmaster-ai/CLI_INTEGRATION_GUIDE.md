# CLI Integration Guide - TaskMaster AI

**Version**: Post-consolidation (January 2025)  
**System**: Single source of truth integration  
**Synchronization**: Working copy pattern for real-time sync

## Overview

The TaskMaster AI system achieves seamless integration between the **TaskMaster CLI** and **Web Interface** through a unified working copy pattern that ensures both access the same underlying data in real-time.

## Data Flow Architecture

### Single Source of Truth Implementation

The system maintains consistency through three key data layers:

```
┌─────────────────┐    ┌─────────────────┐
│   TaskMaster    │    │   Web Interface │
│      CLI        │    │    (4 Pages)    │
│                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │ Real-time Sync       │
          │ (<30 seconds)        │
          │                      │
     ┌────▼──────────────────────▼────┐
     │     Working Copy Layer         │
     │   /working-tasks.json          │
     │   - Real-time task state       │
     │   - Agent assignments          │
     │   - Status updates             │
     │   - Metadata tracking          │
     └────────────┬───────────────────┘
                  │
                  │ Persistent Storage
                  │
     ┌────────────▼───────────────────┐
     │     Master Data Layer          │
     │   /.taskmaster/tasks/          │
     │   - Permanent task storage     │
     │   - Historical data            │
     │   - Backup and recovery        │
     └────────────────────────────────┘
```

### Working Copy Pattern Benefits

✅ **Real-time Synchronization**: CLI changes appear in web interface within 30 seconds  
✅ **Conflict Prevention**: Single authoritative source eliminates data conflicts  
✅ **Performance**: Fast access to current state without database queries  
✅ **Reliability**: Automatic fallback to master data if working copy fails

## CLI Commands & Web Interface Mapping

### Task Management Commands

| CLI Command | Web Interface Location | Synchronization |
|-------------|----------------------|----------------|
| `task-master list` | `/tasks` - Task list and filters | ✅ Immediate |
| `task-master show <id>` | `/tasks` - Expandable task cards | ✅ Immediate |
| `task-master set-status --id=X --status=done` | `/tasks` + `/agents` - Status badges | ✅ <30 seconds |
| `task-master update-task --id=X --prompt="..."` | `/tasks` - Task details section | ✅ <30 seconds |

### Agent Management Commands

| CLI Command | Web Interface Location | Synchronization |
|-------------|----------------------|----------------|
| `task-master use-tag <workspace>` | `/agents` - Agent assignments | ✅ <30 seconds |
| `task-master next` | `/agents` - Available task assignments | ✅ Immediate |
| Task assignment via CLI | `/agents` - Agent status and task count | ✅ <30 seconds |

### System Status Commands

| CLI Command | Web Interface Location | Synchronization |
|-------------|----------------------|----------------|
| System health checks | `/` - Home dashboard metrics | ✅ Real-time |
| Agent status queries | `/agents` - System overview panel | ✅ <30 seconds |

## API Integration Points

### Unified API v2 Endpoints

Both CLI and web interface use the same API v2 endpoints:

```javascript
// Task Operations (both CLI and web use these)
GET  /api/v2/tasks              // Load task list
POST /api/v2/tasks/{id}/assign  // Assign task to agent  
POST /api/v2/tasks/{id}/status  // Update task status
GET  /api/v2/workspace          // Get working copy state

// Agent Operations (both CLI and web use these)
GET  /api/v2/agents             // Load agent list
POST /api/v2/agents/{id}/start  // Start agent
POST /api/v2/agents/{id}/stop   // Stop agent
POST /api/v2/agents/health-check // System health

// Working Copy Sync (automatic background sync)
GET  /api/v2/working-copy       // Current working state
PUT  /api/v2/working-copy/tasks/{id}  // Update working copy
```

## Real-time Synchronization Details

### Working Copy Structure

The working copy file (`/working-tasks.json`) contains the current authoritative state:

```json
{
  "tasks": [
    {
      "id": 16,
      "title": "Task Title",
      "status": "done",
      "agentMetadata": {
        "assignedAgent": "qa-specialist",
        "assignedAt": "2025-07-21T14:47:20.938Z",
        "completedBy": "qa-specialist",
        "completedAt": "2025-07-21T15:13:22.656Z"
      }
    }
  ],
  "agents": {
    "qa-specialist": {
      "status": "available",
      "assignedTasks": []
    }
  },
  "lastSync": "2025-07-21T10:57:03.550Z",
  "lastModified": "2025-07-21T15:21:18.070Z"
}
```

### Sync Mechanism

1. **CLI Updates**: Modify working copy immediately
2. **Web Updates**: Modify working copy via API calls  
3. **Auto Refresh**: Web interface polls every 30 seconds
4. **Conflict Resolution**: Last write wins, with timestamp tracking

## Practical Integration Examples

### Example 1: Task Assignment Workflow

**Scenario**: Assign a task using CLI, monitor progress via web interface

```bash
# CLI: Get next available task
$ task-master next
→ Task 18: "Test Family Dashboard with Integrated UX MCPs"

# CLI: Assign to QA specialist
$ task-master set-status --id=18 --status=in-progress

# Web Interface: Navigate to /agents
# Result: Agent card shows task 18 in assigned tasks
# Result: Task count updated in system metrics
# Result: Agent status shows "active" with current assignment
```

**Timeline**:
- CLI command execution: Immediate
- Working copy update: <1 second  
- Web interface reflection: <30 seconds (next auto-refresh)

### Example 2: Task Completion via Web, CLI Verification

**Scenario**: Complete task using web interface, verify via CLI

```bash
# Web Interface: Go to /agents page
# Action: Click "Manage" on agent card
# Action: Mark task as complete via web form

# CLI: Verify the change
$ task-master show 18
→ Status: done
→ Completed by: qa-specialist  
→ Completion time: 2025-07-21T15:13:22.656Z
```

**Timeline**:
- Web form submission: Immediate
- API call processes: <1 second
- Working copy update: <1 second
- CLI reflects change: Immediately (next CLI command)

### Example 3: Multi-interface Monitoring

**Scenario**: Monitor system activity across CLI and web simultaneously

```bash
# Terminal 1: CLI monitoring
$ task-master list
$ watch -n 10 "task-master list | grep 'in-progress'"

# Browser: Open multiple tabs
# Tab 1: /agents - Monitor agent activity
# Tab 2: /tasks - Monitor task progress  
# Tab 3: / - System overview dashboard

# Result: All interfaces show consistent state
# Result: Changes in any interface reflected in all others
```

## Integration Features

### Bidirectional Synchronization

✅ **CLI → Web**: CLI commands immediately update web interface  
✅ **Web → CLI**: Web interface changes immediately available via CLI  
✅ **Real-time Updates**: Both interfaces show current system state  
✅ **Conflict-free**: Single source of truth prevents data conflicts

### Error Handling & Recovery

```bash
# If working copy is corrupted or missing
$ task-master repair-working-copy
→ Rebuilds working copy from master data

# If sync fails
# Web interface shows "Last updated: X minutes ago"
# Manual refresh button available
# Automatic retry mechanism

# If API is down  
# Web interface shows error state with retry options
# CLI falls back to master data files
```

### Performance Optimizations

- **Lazy Loading**: Web interface loads data on demand
- **Caching**: API responses cached for 30 seconds
- **Debouncing**: Multiple rapid CLI commands batched for efficiency
- **Background Sync**: Working copy updates happen asynchronously

## CLI-specific Integration Points

### Task Management Integration

```bash
# List tasks (synced with /tasks interface)
task-master list
task-master list --status=in-progress  # Filtered view

# View detailed task (same data as web expandable cards)
task-master show 18

# Update task status (reflected in web interface)
task-master set-status --id=18 --status=done --agent=qa-specialist

# Add task information (appears in web task details)
task-master update-task --id=18 --prompt="Additional progress notes"
```

### Agent Coordination Integration

```bash
# Switch workspace (affects web agent assignments)
task-master use-tag qa-specialist
task-master use-tag backend-agent

# Get next task (based on current workspace)
task-master next

# View agent status (synced with /agents interface)
task-master agents status
```

### System Information Integration  

```bash
# Health check (synced with home dashboard)
task-master health

# View workspace information (synced with all interfaces)
task-master workspace info

# System statistics (matches web metrics)
task-master stats
```

## Development Workflow Integration

### Typical Daily Usage Pattern

```bash
# Morning: CLI-focused task management
$ task-master use-tag qa-specialist    # Set context
$ task-master next                     # Get next task
$ task-master set-status --id=X --status=in-progress

# During work: Web interface monitoring
# Open /agents tab: Monitor overall system activity  
# Open /tasks tab: Track progress across all tasks
# Open / (home): System health overview

# End of day: CLI task completion
$ task-master set-status --id=X --status=done
$ task-master list --status=done      # Review completed work
```

### Multi-Project Workflow

```bash
# Switch between different project workspaces
$ task-master use-tag family-dashboard    # Family dashboard tasks
$ task-master use-tag infrastructure      # Infrastructure tasks

# Web interface automatically reflects current workspace
# Agent assignments updated based on workspace context
# Task filtering automatically applied
```

## Troubleshooting Integration Issues

### Common Issues & Solutions

**Issue**: Web interface not showing recent CLI changes
```bash
# Solution 1: Check working copy sync status
$ task-master workspace sync-status

# Solution 2: Force sync
$ task-master workspace sync

# Solution 3: Web interface manual refresh
# Click refresh button or reload page
```

**Issue**: CLI not showing recent web changes
```bash
# Solution 1: CLI automatically syncs on next command
$ task-master list  # Forces sync check

# Solution 2: Explicit sync
$ task-master sync
```

**Issue**: Conflicting data between interfaces
```bash
# Solution: Reset working copy from master data
$ task-master workspace reset
# Warning: This overwrites any pending changes
```

### Diagnostic Commands

```bash
# Check integration health
$ task-master integration-status

# View sync history  
$ task-master sync-log

# Test API connectivity
$ curl http://localhost:3010/api/health

# Validate working copy integrity
$ task-master validate-working-copy
```

## Configuration Options

### Sync Settings

Environment variables for integration tuning:

```bash
# Sync frequency (default: 30 seconds)
export TASKMASTER_SYNC_INTERVAL=30

# Working copy location
export TASKMASTER_WORKING_COPY_PATH="./.taskmaster/working-tasks.json"

# API endpoint configuration
export TASKMASTER_API_BASE="http://localhost:3010"

# Enable debug logging for integration
export TASKMASTER_DEBUG_SYNC=true
```

### Web Interface Settings

Update auto-refresh intervals in web interfaces:

```javascript
// Default: 30 seconds auto-refresh
const REFRESH_INTERVAL = 30000;

// Can be customized per interface:
// Home dashboard: 30 seconds (system health)
// Tasks interface: 30 seconds (task progress)  
// Agents interface: 30 seconds (agent status)
// Developer interface: 60 seconds (detailed metrics)
```

## Best Practices

### For Optimal Integration

✅ **Use CLI for rapid task operations** (list, status updates, assignments)  
✅ **Use web interface for monitoring and overview** (system health, progress tracking)  
✅ **Leverage both simultaneously** for comprehensive workflow management  
✅ **Trust the synchronization** - both interfaces show the same authoritative data  

### Performance Tips

- CLI commands are fastest for single operations
- Web interface best for visual oversight and multi-task operations
- Use workspace switching in CLI to focus web interface context
- Manual refresh in web interface if immediate sync needed

### Workflow Recommendations

1. **Start with CLI** to set workspace context and get next task
2. **Monitor via web** interfaces for ongoing system awareness  
3. **Complete via CLI** for speed and automation integration
4. **Review via web** for visual progress tracking and team coordination

---

## Quick Reference

### Key Integration Commands

```bash
# Essential CLI commands that sync with web
task-master list                    # → /tasks interface
task-master next                    # → /agents assignments  
task-master set-status --id=X --status=done  # → Both /tasks and /agents
task-master use-tag workspace       # → /agents context
```

### Key Web Interface Actions

- **Task assignment** (`/agents`) → Immediately available via CLI
- **Status updates** (`/tasks`, `/agents`) → Synced within 30 seconds  
- **System monitoring** (`/`) → Real-time CLI health integration

### Integration Health Check

```bash
# Verify full integration working
$ task-master health
$ curl http://localhost:3010/api/health
# Both should return healthy status

# Test sync functionality
$ task-master list
# Open http://localhost:3010/tasks - should match CLI output
```

**Integration Status**: ✅ **FULLY OPERATIONAL** - CLI and web interface achieve seamless bidirectional synchronization with single source of truth