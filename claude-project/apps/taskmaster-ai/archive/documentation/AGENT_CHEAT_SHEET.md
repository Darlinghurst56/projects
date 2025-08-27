# TaskMaster Agent System - Cheat Sheet

## 🔥 Critical Info (READ FIRST)

**What:** 5-agent coordination system with human oversight  
**Port:** localhost:3001  
**Mode:** Orchestrator = suggest-only (V1 constraint)  
**Tasks:** 132 active (PRODUCTION system)

## 🎯 5 Agents & Priorities

1. **Orchestrator Agent** (P1) - Coordinate everything, **HUMAN APPROVAL REQUIRED**
2. **QA Specialist** (P2) - Testing, validation, quality assurance
3. **Backend Agent** (P3) - APIs, databases, Node.js  
4. **Frontend Agent** (P4) - UI, React, TypeScript, components
5. **DevOps Agent** (P5) - Infrastructure, deployment, Docker (EXCLUSIVE)

## ⚡ Quick Commands

```bash
# Start system
node taskmaster-api-server.js

# Check status  
curl http://localhost:3001/api/status

# Orchestrator workflow (HUMAN APPROVAL!)
node coordination-workflow.cjs suggest <taskId>
node coordination-workflow.cjs approve <taskId>  
node coordination-workflow.cjs reject <taskId>
```

## 🔒 Tool Access (Security Enforced)

- **Orchestrator:** ALL_TOOLS
- **QA:** `mcp__playwright__*`, `mcp__accessibility__*`
- **Backend:** `mcp__database__*`, `mcp__http-client__*`
- **Frontend:** `mcp__design-system__*`, `mcp__user-testing__*`
- **Docs:** Documentation tools

## 🚨 Critical Rules

1. **NEVER bypass human approval for orchestrator**
2. **Higher priority = wins conflicts automatically**
3. **Stay in your role lane**  
4. **Don't touch core config files**
5. **System is LIVE with 132 tasks**

## 📁 Core Files (DON'T TOUCH)

- `agent-roles.json` - 5-agent config
- `coordination-workflow.cjs` - 754 lines coordination logic
- `tool-restriction-framework.cjs` - Security

## 🔄 Legacy Auto-Maps to New

- `server-agent` + `devops-agent` → `orchestrator-master`
- `backend-agent` + `integration-specialist` → `backend-dev`  
- `frontend-architect` + `ui-developer` → `frontend-dev`
- `qa-specialist` → `qa-agent`

## 🆘 Quick Fixes

- **Tool denied:** Check `tool-restriction-framework.cjs`
- **Conflicts:** Higher priority wins (check `agent-roles.json`)
- **No approval:** Orchestrator MUST get human approval
- **Server down:** Check port 3001, restart `taskmaster-api-server.js`

---

**👤 YOUR JOB:** Find your role above → Do only that work → Follow priority hierarchy → Get human approval if you're orchestrator

*Full guide: AGENT_QUICK_START.md | Complete docs: EXISTING_FEATURES_DOCUMENTATION.md* 