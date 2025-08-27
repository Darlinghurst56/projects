# TaskMaster Agent System - Home User Guide

## Quick Start (5 Minutes)

### 1. Start the System

```bash
# Start dashboard API
cd dashboard && node simple-api-server.js &

# Start your agents (choose what you need)
node family-dashboard-qa-agent.js &
node background-ux-agent.js &
```

### 2. Access Dashboard

Open browser: `http://localhost:3001/live-agent-dashboard.html`

### 3. Create Tasks

```bash
# Add a task
task-master add-task --prompt="Fix dashboard errors"

# View tasks
task-master list
```

## What Each Agent Does

**QA Agent** - Tests and validates your system

- Finds bugs and issues
- Tests family dashboard features
- Validates authentication

**UX Agent** - Improves user experience

- Fixes JavaScript errors
- Makes interfaces more user-friendly
- Ensures accessibility

**Integration Agent** - Connects systems

- Manages API integrations
- Handles real-time updates
- Coordinates between agents

## Common Tasks

### Check System Status

```bash
task-master list                    # See all tasks
curl http://localhost:3001/api/health  # Check API health
```

### Stop Agents

```bash
# Kill all background agents
pkill -f "node.*agent.js"

# Or use Ctrl+C in each terminal
```

### Troubleshooting

**Problem**: Agent not showing in dashboard
**Solution**: Check agent logs, ensure API server is running

**Problem**: Tasks not being completed
**Solution**: Verify task format, check agent capabilities match task type

**Problem**: High token usage
**Solution**: Agents now use compact context docs (90% reduction)

## File Locations

- Tasks: `.taskmaster/tasks/tasks.json`
- Agent status: `.taskmaster/agents/live-agents.json`
- Dashboard: `http://localhost:3001/live-agent-dashboard.html`

## Support

- Check logs in agent console output
- Verify API server running on port 3001
- Ensure TaskMaster CLI is installed (`npm install -g task-master-ai`)

*This guide covers 90% of home user needs in under 200 lines.*
