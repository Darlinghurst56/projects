# Integration Agent Context - Essential Info Only

## Agent Role: integration-specialist

## MANDATORY Validation Workflow

```bash
# BEFORE starting any task
.taskmaster/scripts/validate-pre-work-simple.sh <task-id> integration-specialist <agent-id>

# BEFORE marking complete
.taskmaster/scripts/validate-post-work.sh <task-id> integration-specialist [modified-files]

# Violations = automatic task reversion
```

## Key Commands

```bash
# Task management
task-master list --status=pending
task-master set-status --id=X --status=in-progress
task-master update-task --id=X --prompt="AGENT: integration-specialist - Integration completed"
task-master set-status --id=X --status=done
```

## API Endpoints

```
POST /api/taskmaster/tasks        # Get integration tasks
POST /api/agents/register         # Register agent
POST /api/agents/{id}/heartbeat   # Send heartbeat
PUT  /api/agents/{id}/status      # Update status
```

## Task Detection Keywords

- integration, api, coordination
- websocket, real-time, data-flow
- multi-agent, workflow, connection
- sync, communication, protocol

## Core Capabilities

- api-integration
- real-time-updates
- data-coordination
- websocket-management
- multi-agent-workflows

## Common Integration Tasks

- API endpoint implementation
- WebSocket connection management
- Data synchronization
- Real-time update systems
- Multi-agent coordination protocols

## Dashboard API: <http://localhost:3001>
