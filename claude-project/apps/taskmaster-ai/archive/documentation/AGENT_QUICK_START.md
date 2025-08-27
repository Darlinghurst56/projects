# TaskMaster Agent System - Quick Start Guide

**🚀 Essential info for new agents - READ THIS FIRST**

## What Is This System?

The TaskMaster Agent System is a **5-agent coordination platform** where AI agents collaborate on software development tasks with **human oversight**.

## 🎯 Current System (5 Agents)

1. **Orchestrator Agent** (Priority 1) - Human interface & project manager proxy, **suggest-only mode**
2. **QA Specialist** (Priority 2) - Testing, validation & quality assurance  
3. **Backend Agent** (Priority 3) - APIs, databases, server logic, Node.js
4. **Frontend Agent** (Priority 4) - UI, React, TypeScript, components
5. **DevOps Agent** (Priority 5) - Infrastructure, deployment, Docker (EXCLUSIVE)

## 🔑 Key Rules You MUST Know

### Human Approval Required
- **Orchestrator suggestions need human approval** - this is V1 constraint
- Use CLI: `suggest`, `approve`, `reject` commands
- Never bypass human approval for orchestrator actions

### Agent Priorities
- **Higher priority = first choice on tasks**
- Priority conflicts resolved automatically  
- Stay in your lane - don't do other agents' work

### Tool Restrictions
- **Each agent has specific tool access** - security enforced
- QA: `mcp__playwright__*`, `mcp__accessibility__*`
- Backend: `mcp__database__*`, `mcp__http-client__*` 
- Frontend: `mcp__design-system__*`, `mcp__user-testing__*`
- **Orchestrator has ALL_TOOLS access**

## 🚀 How To Start

### 1. Launch System
```bash
cd claude-project/apps/taskmaster-ai
node taskmaster-api-server.js  # Starts on localhost:3001
```

### 2. Check Agent Status
```bash
curl http://localhost:3001/api/agents  # See all 5 agents
curl http://localhost:3001/api/status  # System health
```

### 3. Basic Workflow
```bash
# Orchestrator suggests task assignment
node coordination-workflow.cjs suggest <taskId>

# Human approves/rejects  
node coordination-workflow.cjs approve <taskId>
node coordination-workflow.cjs reject <taskId>

# Agent executes approved task
```

## 📁 Key Files (Don't Touch Unless You Know What You're Doing)

- `.taskmaster/agents/agent-roles.json` - **5-agent configuration**
- `.taskmaster/agents/coordination-workflow.cjs` - **754 lines of coordination logic**  
- `.taskmaster/agents/tool-restriction-framework.cjs` - **Security & permissions**

## ⚡ Legacy Compatibility

**Old 7-agent system automatically maps to new 5-agent:**
- `server-agent` + `devops-agent` → `orchestrator-master`
- `backend-agent` + `integration-specialist` → `backend-dev`
- `frontend-architect` + `ui-developer` → `frontend-dev`
- `qa-specialist` → `qa-agent`

## 🔍 Quick Troubleshooting

**Problem: Agent can't access tool**
- Check `.taskmaster/agents/tool-restriction-framework.cjs`
- Verify your agent role has permission for that tool pattern

**Problem: Task assignment conflicts** 
- Higher priority agent wins automatically
- Check `agent-roles.json` for priority values (1-5)

**Problem: Orchestrator bypassing human approval**
- This violates V1 constraint - system should prevent this
- Check `humanApprovalRequired: true` in agent-roles.json

**Problem: System not responding**
- Check if API server is running on port 3001
- Verify all config files exist in `.taskmaster/agents/`

## 💡 Pro Tips

1. **Read the priority hierarchy** - don't fight it, work with it
2. **Orchestrator is suggest-only** - human must approve everything  
3. **Tool patterns use wildcards** - `mcp__tool__*` means all tool functions
4. **Legacy role names still work** - system automatically translates
5. **Audit logs in tool-usage.log** - check if you need to debug permissions

## 🎯 Your Role

**Find your agent role** and understand your scope:
- **QA**: Focus on testing, validation, accessibility
- **Backend**: APIs, databases, server logic, integrations  
- **Frontend**: UI/UX, components, styling, user experience
- **Documentation**: Code docs, system explanations, knowledge base
- **Orchestrator**: Coordinate everything, but **suggest-only to human**

---

**🚨 CRITICAL: This is a PRODUCTION system with 132 active tasks. Don't break existing workflows!**

*Need more detail? See full documentation, but start here first.* 