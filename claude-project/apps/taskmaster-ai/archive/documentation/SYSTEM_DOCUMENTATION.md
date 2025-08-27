# TaskMaster AI - Complete System Documentation

## 🚀 System Overview

TaskMaster AI is a production-ready multi-agent coordination platform enabling autonomous agents to collaborate on tasks with structured workflows, real-time monitoring, and comprehensive task lifecycle management.

### Core Features

- **Multi-Agent Coordination**: Priority-based conflict resolution and intelligent task assignment
- **Exclusive Capability Handling**: Agents with exclusive flags are prioritized for their specialized tasks
- **Tool Enforcement**: Security validation ensures agents only use authorized tools
- **Tag-Based Context Isolation**: Separate workspaces prevent conflicts between agent work
- **Real-Time Monitoring**: Live dashboard with WebSocket updates
- **Comprehensive Audit Trail**: Full logging of agent decisions and coordination outcomes

## 📋 Quick Start

### 1. Basic Setup

```bash
# Install dependencies
npm install

# Start the TaskMaster API server
npm start

# Access dashboard
open http://localhost:3001
```

### 2. System Status Check

```bash
# Check system status
npm run status

# View coordination analytics
node claude-project/apps/taskmaster-ai/taskmaster-api-server.js status
```

## 🎯 Enhanced Agent Coordination System

### Current Implementation

The system includes enhancements for robust multi-agent coordination:

#### 1. **Exclusive Capability Checks**

Agents with exclusive flags (like `server-agent` for infrastructure) are automatically prioritized for relevant tasks.

#### 2. **Priority-Based Conflict Resolution**

Clear hierarchy prevents conflicts:

1. `server-agent` (Highest) - Infrastructure, deployment
2. `devops-agent` - DevOps operations
3. `integration-specialist` - API connections, data flow
4. `frontend-architect` - JavaScript architecture
5. `ui-developer` - Frontend components, UI/UX
6. `qa-specialist` (Lowest) - Testing, validation

#### 3. **Tool Enforcement Integration**

Security validation ensures agents only access authorized tools based on their role.

#### 4. **Enhanced Coordination Logging**

Comprehensive analytics with:

- Priority decision tracking (100-decision limit)
- Handoff rate monitoring
- Conflict resolution outcomes
- System health scoring (0-100)

#### 5. **Tag Context Validation**

Automated validation ensures proper context isolation between agent workspaces.

### Agent Workflow Process

#### Phase 1: Pre-Work Validation (MANDATORY)

**Duration**: 5-10 minutes
**Requirements**:

- Environment validation
- TaskMaster context setup
- Agent registration and task claiming
- Pre-work documentation

```bash
# 1. Environment validation
./scripts/validate-environment.sh

# 2. TaskMaster context setup
task-master use-tag --name=<agent-role>
task-master show <task-id>
task-master validate-dependencies

# 3. Agent registration and task claiming
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <roleName>
task-master set-status --id=<task-id> --status=in-progress

# 4. Pre-work documentation
task-master update-subtask --id=<task-id> --prompt="AGENT: <role> - Pre-work checklist completed ✅"
```

#### Phase 2: Implementation (AGENT-SPECIFIC)

**Requirements**: Follow role-specific implementation guidelines with regular progress updates

```bash
# Implementation work using role-specific tools and patterns
# Regular progress updates required
task-master update-subtask --id=<task-id> --prompt="AGENT: <role> - <progress update>"
```

#### Phase 3: Post-Work Validation (MANDATORY)

**Duration**: 10-15 minutes
**Requirements**: Code quality validation, Git workflow compliance, final documentation

```bash
# 1. Code quality validation
mcp__eslint__lint-files [modified-files]
npm test
npm run build

# 2. Git workflow compliance
git add .
git commit -m "feat: <description> (task <task-id>)"

# 3. Final task documentation
task-master set-status --id=<task-id> --status=done
task-master update-subtask --id=<task-id> --prompt="AGENT: <role> - COMPLETED: <summary>"
```

## 🏗️ Architecture

### Core Components

1. **TaskMaster API Server** (`taskmaster-api-server.js`)
   - REST API on port 3001
   - WebSocket real-time updates
   - Agent coordination and task assignment

2. **Agent Coordination System** (`.taskmaster/agents/`)
   - `coordination-workflow.cjs` - Multi-agent orchestration with priority handling
   - `simple-assignment.cjs` - Enhanced task assignment with exclusive capability checks
   - `taskmaster-integration.cjs` - TaskMaster CLI integration with tool enforcement
   - `tool-enforcement.cjs` - Complete tool restriction framework
   - `role-assignment-protocol.cjs` - Tag context validation and isolation

3. **Task Cleanup Jobs** (`task-cleanup-jobs.js`)
   - Automated resource cleanup
   - Three-tier cleanup strategy (immediate, delayed, archival)
   - Comprehensive lifecycle management

### Enhanced File Structure

```
taskmaster-ai/
├── taskmaster-api-server.js          # Main API server
├── task-cleanup-jobs.js              # Cleanup job processor
├── task-update-wrapper.js            # Robust task update wrapper
├── .taskmaster/
│   ├── agents/                       # Enhanced agent coordination system
│   │   ├── coordination-workflow.cjs  # ✅ Priority-based conflict resolution
│   │   ├── simple-assignment.cjs     # ✅ Exclusive capability handling
│   │   ├── taskmaster-integration.cjs # ✅ Tool enforcement integration
│   │   ├── tool-enforcement.cjs      # ✅ Complete security framework
│   │   ├── role-assignment-protocol.cjs # ✅ Tag context validation
│   │   └── agent-roles.json          # Agent configuration
│   ├── docs/                         # Consolidated documentation
│   └── tasks/                        # Task storage with tag isolation
├── dashboard/                        # Real-time monitoring dashboard
├── config/                          # Configuration files
└── package.json                     # Updated with all commands
```

## 🎮 Agent Roles & Capabilities

### Available Agent Roles

#### 🏗️ Frontend Architect (`frontend-architect`)

- **Focus**: JavaScript architecture, performance optimization, design systems
- **Capabilities**: React architecture, state management, performance optimization
- **Priority**: High for architecture decisions

#### 🎨 UI Developer (`ui-developer`)

- **Focus**: CSS, HTML, visual components, responsive design
- **Capabilities**: Component creation, styling, responsive design, accessibility
- **Priority**: Medium for UI implementation

#### 🔧 Backend Agent (`backend-agent`)

- **Focus**: Server APIs, databases, authentication
- **Capabilities**: API development, database operations, server-side logic
- **Priority**: High for backend operations

#### 🔌 Integration Specialist (`integration-specialist`)

- **Focus**: API connections, data flow, system coordination
- **Capabilities**: API integration, data transformation, system coordination
- **Priority**: High for integration tasks

#### 🧪 QA Specialist (`qa-specialist`)

- **Focus**: Testing, validation, quality assurance
- **Capabilities**: Testing, linting, validation, QA processes
- **Priority**: Medium for quality assurance

#### 🚀 Server Agent (`server-agent`)

- **Focus**: Infrastructure, deployment, server operations
- **Capabilities**: Deployment, infrastructure management, server operations
- **Priority**: Highest (exclusive for infrastructure)

### Agent Commands

#### Basic Agent Operations

```bash
# Switch agent workspace
task-master use-tag <agent-role>

# List tasks in current workspace
task-master list

# Work on tasks
task-master next
task-master show <id>
task-master set-status --id=<id> --status=done
```

#### Agent Coordination Commands

```bash
# Register agent
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <roleName>

# Check coordination status
node .taskmaster/agents/coordination-workflow.cjs status

# View workflow guide
node .taskmaster/agents/coordination-workflow.cjs help
```

## 🔧 Tool Authorization Matrix

### Universal Tools (All Agents)

- `mcp__task-master-ai__*` - Task management and coordination
- `Edit` - File editing operations
- `Read` - File reading operations
- `Bash` - Command execution (limited scope per role)
- `mcp__eslint__*` - Code linting and quality checks

### Role-Specific Tool Authorization

#### Frontend Architect

- `mcp__design-system__*` - Design system management
- `mcp__performance-monitoring__*` - Performance metrics
- `mcp__accessibility__*` - Architecture accessibility validation

#### UI Developer

- `mcp__accessibility__*` - WCAG compliance testing
- `mcp__user-testing__*` - User journey testing
- `mcp__design-system__*` - UI component library access

#### Backend Agent

- `mcp__docker__*` - Container operations
- `mcp__http__*` - API testing and validation
- Database tools and server management

#### Integration Specialist

- `mcp__http__*` - API connections and testing
- `mcp__docker__*` - Container coordination
- Data validation and transformation tools

#### QA Specialist

- `mcp__accessibility__*` - Accessibility testing
- `mcp__user-testing__*` - User experience validation
- `mcp__playwright__*` - Browser automation
- Testing frameworks and validation tools

#### Server Agent (Exclusive Access)

- `mcp__docker__*` - Full container management
- `mcp__bash__*` - System administration
- Infrastructure and deployment tools
- **All tools** for infrastructure tasks

## 📊 API Documentation

### Core TaskMaster Integration Endpoints

#### Agent Management

```http
GET /api/agents                    # List all available agent tags
GET /api/agents/{tag}              # Get specific agent tag details
POST /api/agents/{tag}/switch      # Switch to agent context
GET /api/agents/current            # Get current active agent context
```

#### Task Operations

```http
GET /api/tasks                     # Get all tasks (with filters)
GET /api/tasks/{id}                # Get specific task details
POST /api/tasks                    # Create new task
PUT /api/tasks/{id}                # Update task
PUT /api/tasks/{id}/status         # Update task status
POST /api/tasks/{id}/claim         # Claim task for current agent
```

#### Multi-Agent Coordination

```http
GET /api/coordination/status       # Get coordination status with analytics
GET /api/coordination/priority     # Get agent priority hierarchy
POST /api/coordination/handoff     # Hand off task between agents
GET /api/coordination/conflicts    # Check for task conflicts
```

#### Real-time Updates

```http
GET /api/stream                    # SSE endpoint for real-time updates
WebSocket /ws                      # WebSocket for bidirectional communication
```

### Enhanced Response Formats

#### GET /api/coordination/status

```json
{
  "systemHealth": 100,
  "coordinationMetrics": {
    "totalHandoffs": 45,
    "handoffSuccessRate": 95.5,
    "averageHandoffTime": 2.3,
    "priorityOverrides": 12,
    "conflictsResolved": 8
  },
  "priorityDecisions": [
    {
      "timestamp": "2025-01-13T20:49:15.234Z",
      "taskId": "task-123",
      "winningAgent": "server-agent",
      "conflictingAgents": ["ui-developer"],
      "reason": "Priority hierarchy: server-agent > ui-developer"
    }
  ],
  "trends": {
    "handoffRateIncrease": 15.2,
    "conflictReduction": 23.1
  }
}
```

## 🧪 Testing Framework

### Current Test Configuration

The system uses multiple testing frameworks:

- **Playwright** for browser automation
- **Jest** for unit testing
- **ESLint** for code quality
- **Manual QA** processes for comprehensive validation

### Test File Status & Fixes Needed

#### Issues Identified

1. **ES Module Conflicts**: Test files use `require()` in ES module context
2. **Missing Test Dependencies**: Jest/Vitest configuration issues  
3. **MSW Import Errors**: Outdated Mock Service Worker imports
4. **Missing Test Files**: Some referenced test files don't exist

#### Fix Required

```bash
# Convert test files to ES modules or rename to .cjs
# Update MSW imports from 'rest' to current API
# Install proper test dependencies
# Configure test framework properly
```

### Agent Testing Checklist

#### Pre-Work Validation

- [ ] Environment validation complete
- [ ] Git status clean and synced
- [ ] Dependencies installed
- [ ] TaskMaster context setup
- [ ] Agent registration successful

#### Code Quality Validation  

- [ ] ESLint validation passed
- [ ] TypeScript checks (if applicable)
- [ ] Build successful
- [ ] No security issues

#### Post-Work Validation

- [ ] All tests pass
- [ ] Code quality validated
- [ ] Git commit completed
- [ ] Task documentation updated
- [ ] Status set to "done"

## 🔐 Security Features

### Input Validation

- **Zod schema validation**: Robust data structure validation
- **Auto-fixing**: Graceful handling of malformed AI responses
- **Error boundaries**: Prevents individual failures from affecting system

### Tool Enforcement

- **Role-based access control**: Agents can only use authorized tools
- **Real-time enforcement**: Pre-execution tool validation
- **Audit logging**: All tool access attempts logged
- **Violation detection**: Pattern analysis for repeated violations

### Process Isolation

- **Agent cooldowns**: Prevents interference between agents
- **Timeout protection**: Multiple layers of timeout handling
- **Resource cleanup**: Automated prevention of resource leaks

## 📈 Monitoring & Analytics

### System Health Metrics

- **Coordination effectiveness**: 0-100 health score
- **Handoff success rates**: Track agent collaboration efficiency
- **Priority override frequency**: Monitor conflict resolution patterns
- **Task completion velocity**: Measure system productivity

### Real-Time Dashboard

- **Live agent status**: Current agent assignments and workloads
- **Task flow visualization**: Real-time task movement between agents
- **Performance metrics**: System responsiveness and efficiency
- **Error tracking**: Coordination failures and resolutions

### Audit Trail

- **Priority decisions**: Complete record of conflict resolutions
- **Agent interactions**: Full history of agent coordination
- **Tool usage**: Security audit of tool access patterns
- **System events**: Comprehensive logging for troubleshooting

## 🚨 Troubleshooting

### Common Issues

#### Agent Assignment Conflicts

```bash
# Check priority hierarchy
node .taskmaster/agents/coordination-workflow.cjs status

# View recent priority decisions
curl http://localhost:3001/api/coordination/status
```

#### Tool Access Denied

```bash
# Check agent tool permissions
node .taskmaster/agents/tool-enforcement.cjs show

# Validate tool restrictions
node .taskmaster/agents/tool-enforcement.cjs validate
```

#### Tag Context Issues

```bash
# Verify current tag
task-master list-tags

# Validate tag isolation
node .taskmaster/agents/role-assignment-protocol.cjs validate
```

### System Recovery

#### Coordination State Reset

```bash
# Reset coordination state
rm .taskmaster/coordination-state.json
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <roleName>
```

#### Clean System Restart

```bash
# Stop all processes
npm run stop

# Clean temporary files
npm run cleanup:force

# Restart system
npm start
```

## 📚 Integration Guides

### Claude Code Integration

#### MCP Configuration

```json
{
  "mcpServers": {
    "taskmaster-ai": {
      "command": "node",
      "args": ["taskmaster-api-server.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

#### Tool Allowlist

```json
{
  "allowedTools": [
    "mcp__task-master-ai__*",
    "mcp__eslint__*",
    "Edit",
    "Read",
    "Bash"
  ]
}
```

### TaskMaster CLI Integration

#### Essential Commands

```bash
# Project management
task-master init                    # Initialize project
task-master parse-prd <file>        # Generate tasks from PRD
task-master models --setup          # Configure AI models

# Daily workflow
task-master list                    # Show all tasks
task-master next                    # Get next task
task-master show <id>               # View task details
task-master set-status --id=<id> --status=done

# Advanced operations
task-master expand --id=<id> --research --force
task-master update --from=<id> --prompt="changes"
task-master research "query" --save-to=<id>
```

## 🎯 Best Practices

### Agent Coordination

1. **Always register** before starting work
2. **Use priority hierarchy** for conflict resolution
3. **Document progress** regularly in subtasks
4. **Validate context** before operations
5. **Complete checklists** before marking tasks done

### Tool Usage

1. **Verify permissions** before tool execution
2. **Use role-appropriate tools** only
3. **Log tool usage** for audit trail
4. **Report violations** immediately
5. **Follow security guidelines** consistently

### Task Management

1. **Switch to correct tag** before starting
2. **Validate dependencies** before claiming
3. **Update progress** regularly
4. **Use atomic commits** for changes
5. **Complete validation** before marking done

## 📋 System Maintenance

### Regular Maintenance Tasks

#### Daily

- Monitor system health metrics
- Review coordination analytics
- Check for failed handoffs
- Validate tag isolation

#### Weekly  

- Clean coordination logs
- Review tool usage patterns
- Update agent configurations
- Analyze priority trends

#### Monthly

- Archive old coordination data
- Review security audit logs
- Update documentation
- Performance optimization review

### Backup & Recovery

#### Backup Critical Data

```bash
# Backup tasks and coordination state
cp .taskmaster/tasks/tasks.json .taskmaster/tasks/tasks-backup-$(date +%Y%m%d).json
cp .taskmaster/coordination-state.json .taskmaster/coordination-state-backup-$(date +%Y%m%d).json
```

#### Recovery Procedures

```bash
# Restore from backup
cp .taskmaster/tasks/tasks-backup-YYYYMMDD.json .taskmaster/tasks/tasks.json
cp .taskmaster/coordination-state-backup-YYYYMMDD.json .taskmaster/coordination-state.json

# Restart coordination system
npm run stop && npm start
```

---

## 📞 Support & Resources

- **System Status**: `npm run status`
- **Documentation**: `.taskmaster/docs/`
- **Logs**: `.taskmaster/logs/`
- **Configuration**: `.taskmaster/config.json`
- **Coordination State**: `.taskmaster/coordination-state.json`

For additional support, refer to individual component documentation in the `.taskmaster/docs/` directory.
