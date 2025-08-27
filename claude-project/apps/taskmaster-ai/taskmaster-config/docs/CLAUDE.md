# TaskMaster AI - Agent Launch Guide

## 🚫 No Mock Data Policy

- The TaskMaster dashboard and all user/developer tools **never use mock or fallback data**.
- All agent/task data is always live and comes from the running API and real agent files.
- If the API returns no agents or an error, the dashboard will display a clear error message (not fake data).
- If you see no agents, check your API server and agent configuration.

## 🚀 Quick Start: How to Launch Agents

### Simple Agent Launch Commands

**Launch Individual Agents:**
```bash
# Launch QA agent for 3 minutes
timeout 180 node family-dashboard-qa-agent.js

# Launch UX agent for 3 minutes  
timeout 180 node background-ux-agent.js

# Launch Integration agent for 3 minutes
timeout 180 node background-integration-agent.js
```

**Available Agent Files:**
- `family-dashboard-qa-agent.js` - QA specialist for House AI testing
- `background-ux-agent.js` - UX/UI developer for design improvements
- `background-integration-agent.js` - Integration specialist for API coordination

**What Happens When You Launch:**
1. Agent registers with dashboard system
2. Monitors for tasks in their domain (QA, UX, Integration)
3. Claims available tasks automatically
4. Validates work before starting
5. Actually marks tasks as DONE in TaskMaster
6. Runs for 3 minutes then goes offline

**Check Agent Status:**
```bash
# View live agents
cat .taskmaster/agents/live-agents.json

# Check task progress
task-master list --status=in-progress
```

---

## 🤖 Autonomous Agent Mode (MANDATORY)

### Critical Requirements for Autonomous Agents

#### 1. Workflow Validation (NO EXCEPTIONS)

**Pre-Work Validation** (BEFORE starting any task):
```bash
.taskmaster/scripts/validate-pre-work.sh <task-id> <agent-role> <agent-id>
```
- ✅ Git clean state
- ✅ Dependencies installed
- ✅ Task accessible
- ✅ MCP tools authorized
- ✅ Agent registered

**Post-Work Validation** (BEFORE marking complete):
```bash
.taskmaster/scripts/validate-post-work.sh <task-id> <agent-role> [modified-files]
```
- ✅ Code quality (ESLint)
- ✅ Tests pass
- ✅ Build successful
- ✅ Security audit
- ✅ Git staged
- ✅ MCP tool audit

**CRITICAL**: Violations = automatic task reversion

#### 2. MCP Tool Restrictions (STRICTLY ENFORCED)

| Agent Role | Authorized Tools | Restricted Tools |
|------------|-----------------|------------------|
| Orchestrator Agent | ALL MCP tools | None (coordination requires full access) |
| Frontend Agent | `mcp__vite__*`, `mcp__tailwindcss__*`, `mcp__shadcn_ui__*`, `mcp__playwright__*`, `mcp__design-system__*`, `mcp__accessibility-testing__*` | `mcp__docker__*`, `mcp__fetch__*` |
| Backend Agent | `mcp__filesystem__*`, `mcp__github__*`, `mcp__fetch__*`, `mcp__eslint__*`, `mcp__sourcery__*` | `mcp__docker__*`, `mcp__vite__*`, `mcp__tailwindcss__*` |
| QA Specialist | `mcp__eslint__*`, `mcp__playwright__*`, `mcp__accessibility-testing__*`, `mcp__user-testing__*`, `mcp__sourcery__*` | `mcp__docker__*`, `mcp__vite__*` |
| DevOps Agent | `mcp__docker__*`, `mcp__filesystem__*`, `mcp__github__*` (EXCLUSIVE) | Frontend/UI tools |

**Universal Tools**: `Edit`, `Read`, `Bash`, `mcp__eslint__*`, `mcp__task-master-ai__*`

#### 3. PROJECT Metadata (MANDATORY)

All tasks MUST include:
```
PROJECT: [Main Project] | SUBPROJECT: [Component]
```

Projects:
- `PROJECT: House AI - Family Home Page | SUBPROJECT: [DNS Analytics Widget System | Authentication System | Home Page UI System]`
- `PROJECT: TaskMaster Agent System | SUBPROJECT: [Agent Coordination | Task Management]`
- `PROJECT: Development Infrastructure | SUBPROJECT: [MCP Tools | Build Tools]`

#### 4. Agent Coordination Protocol

```bash
# Register agent
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <roleName>

# Switch workspace
task-master use-tag <workspace>

# Claim task
task-master set-status --id=<id> --status=in-progress

# Update with agent context
task-master update-task --id=<id> --prompt="AGENT: <role> - <update>"

# Handoff if needed
node .taskmaster/agents/coordination-workflow.cjs handoff <taskId> <fromRole> <toRole>
```

---

## 👤 Developer Mode (Simplified)

### Quick Start

```bash
# Basic Usage
task-master list                    # Show all tasks
task-master next                    # Get next task
task-master show <id>               # View task details
task-master set-status --id=<id> --status=done  # Mark complete

# Workspaces
task-master tags                    # List workspaces
task-master use-tag <workspace>     # Switch workspace
```

### Agent Workspaces

- **`orchestrator-agent`** - Coordination & developer interface
- **`frontend-agent`** - UI/React/TypeScript development  
- **`backend-agent`** - APIs/Node.js/databases
- **`qa-specialist`** - Testing & quality assurance
- **`devops-agent`** - Infrastructure & deployment (EXCLUSIVE)

### Live Dashboard

**Access**: `http://localhost:3001/agent-dashboard.html`

### Simple Workflow

1. Switch workspace: `task-master use-tag [agent-workspace]`
2. Find task: `task-master next`
3. Work on it: `task-master update-task --id=<id> --prompt="progress"`
4. Complete: `task-master set-status --id=<id> --status=done`

---

## 🔧 System Configuration

### Model Setup
- **Main**: Claude 3.5 Sonnet
- **Research**: Claude Opus (FREE)
- **Fallback**: Gemini 2.0 Flash

### File Structure
```
.taskmaster/
├── tasks/tasks.json        # Task database
├── agents/                 # Agent coordination scripts
├── scripts/                # Validation scripts
└── docs/                   # Documentation
```

### Critical Scripts for Agents
- `coordination-workflow.cjs` - Multi-agent orchestration
- `validate-pre-work.sh` - Pre-work validation
- `validate-post-work.sh` - Post-work validation
- `validate-mcp-tool.sh` - Tool authorization

---

**Mode Selection**: Autonomous agents MUST follow Agent Mode. Humans can use either mode.