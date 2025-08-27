# TaskMaster AI - Agent Workflow Guide

## 🎯 Overview

This guide provides the complete workflow for agents working within the TaskMaster AI coordination system. All processes have been enhanced with priority-based conflict resolution, exclusive capability handling, tool enforcement, and comprehensive analytics.

## 🚀 Enhanced Coordination Features

### ✅ Current Implementation Status

- **Exclusive Capability Checks**: Agents with exclusive flags are prioritized automatically
- **Priority-Based Conflict Resolution**: Clear hierarchy prevents agent conflicts
- **Tool Enforcement Integration**: Security validation for all tool access
- **Enhanced Coordination Logging**: 100-decision limit with analytics
- **Tag Context Validation**: Automated isolation verification

## 🔄 Complete Agent Workflow

### Phase 1: Pre-Work Validation (MANDATORY)

**Duration**: 5-10 minutes  
**Status Requirement**: Task must be `pending` or `deferred`

#### 1.1 Environment Validation
```bash
# Check git status
git status
git pull origin main

# Verify dependencies
npm install
npm run build  # Verify build succeeds
```

#### 1.2 TaskMaster Context Setup
```bash
# Switch to agent role context
task-master use-tag --name=<agent-role>

# Understand the task
task-master show <task-id>
task-master validate-dependencies

# Verify tag context
task-master list-tags
```

#### 1.3 Agent Registration & Task Claiming
```bash
# Register with coordination system
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <roleName>

# Claim the task
task-master set-status --id=<task-id> --status=in-progress

# Document start of work
task-master update-subtask --id=<task-id> --prompt="AGENT: <role> - Pre-work checklist completed ✅
Environment: Git clean, dependencies installed, build successful
Context: Task details reviewed, dependencies validated
Tools: All required MCP tools verified and accessible
Ready to begin implementation."
```

### Phase 2: Implementation (AGENT-SPECIFIC)

**Status Requirement**: Task must be `in-progress`  
**Duration**: Variable based on task complexity

#### 2.1 Follow Role-Specific Guidelines

##### Frontend Architect
- Focus on JavaScript architecture and performance
- Use `mcp__design-system__*` and `mcp__performance-monitoring__*`
- Prioritize architectural decisions and system design

##### UI Developer  
- Focus on visual components and user experience
- Use `mcp__accessibility__*` and `mcp__user-testing__*`
- Implement responsive design and accessibility features

##### Backend Agent
- Focus on server-side logic and APIs
- Use `mcp__docker__*` and database tools
- Handle authentication and data management

##### Integration Specialist
- Focus on API connections and data flow
- Use `mcp__http__*` and validation tools
- Coordinate between frontend and backend systems

##### QA Specialist
- Focus on testing and quality assurance
- Use `mcp__accessibility__*`, `mcp__user-testing__*`, `mcp__puppeteer__*`
- Validate functionality and user experience

##### Server Agent (Highest Priority)
- Focus on infrastructure and deployment
- **Exclusive access** to all tools for infrastructure tasks
- Handle deployment, monitoring, and system operations

#### 2.2 Progress Documentation
```bash
# Regular progress updates (recommended every 30 minutes)
task-master update-subtask --id=<task-id> --prompt="AGENT: <role> - Progress: <detailed update>
- What was accomplished
- Current status
- Next steps
- Any blockers or decisions needed"
```

#### 2.3 Tool Usage Validation
Before using any MCP tool:
```bash
# Check tool permissions (if unsure)
node .taskmaster/agents/tool-enforcement.cjs validate

# Use tools according to role authorization
# See Tool Authorization Matrix in main documentation
```

### Phase 3: Post-Work Validation (MANDATORY)

**Duration**: 10-15 minutes  
**Requirement**: Task implementation complete, ready for validation

#### 3.1 Code Quality Validation
```bash
# Run ESLint on modified files
mcp__eslint__lint-files [list-of-modified-files]

# Run tests
npm test

# Verify build
npm run build

# Type checking (if applicable)
npx tsc --noEmit
```

#### 3.2 Git Workflow Compliance
```bash
# Stage changes
git add .

# Commit with proper message format
git commit -m "feat(<component>): <description> (task <task-id>)

- Detailed description of changes
- Any breaking changes
- Testing performed
- Fixes #<issue-number> (if applicable)"
```

#### 3.3 Final Task Documentation
```bash
# Complete task status
task-master set-status --id=<task-id> --status=done

# Final documentation
task-master update-subtask --id=<task-id> --prompt="AGENT: <role> - COMPLETED ✅
Summary: <brief summary of work completed>
Files modified: <list of files>
Testing: <testing performed>
Quality checks: All ESLint, build, and test validations passed
Ready for review and deployment"
```

## 🎮 Agent Priority System

### Priority Hierarchy (Conflict Resolution)

When multiple agents want the same task, resolve using this order:

1. **server-agent** (Highest) - Infrastructure, deployment, server operations
2. **devops-agent** - DevOps operations, containerization
3. **integration-specialist** - API connections, data flow, backend integration
4. **frontend-architect** - JavaScript architecture, design systems
5. **ui-developer** - Frontend components, UI/UX improvements  
6. **qa-specialist** (Lowest) - Testing, validation (waits for implementation)

### Priority Resolution Example
```bash
# If both ui-developer and server-agent want task 123:
# Result: server-agent wins automatically
# Reason: "Priority hierarchy: server-agent > ui-developer"
# Logged in coordination analytics
```

## 🔧 Tool Authorization Matrix

### Universal Tools (All Agents)
- `mcp__task-master-ai__*` - Task management and coordination
- `Edit` - File editing operations
- `Read` - File reading operations  
- `Bash` - Command execution (limited scope per role)
- `mcp__eslint__*` - Code linting and quality checks

### Role-Specific Authorization

#### Frontend Architect
✅ **Allowed**: `mcp__design-system__*`, `mcp__performance-monitoring__*`, `mcp__accessibility__*`  
❌ **Denied**: `mcp__docker__*`, `mcp__puppeteer__*`

#### UI Developer
✅ **Allowed**: `mcp__accessibility__*`, `mcp__user-testing__*`, `mcp__design-system__*`  
❌ **Denied**: `mcp__docker__*`, `mcp__performance-monitoring__*`

#### Backend Agent
✅ **Allowed**: `mcp__docker__*`, `mcp__http__*`, database tools  
❌ **Denied**: `mcp__user-testing__*`, `mcp__puppeteer__*`

#### Integration Specialist
✅ **Allowed**: `mcp__http__*`, `mcp__docker__*`, data validation tools  
❌ **Denied**: `mcp__accessibility__*`, `mcp__puppeteer__*`

#### QA Specialist
✅ **Allowed**: `mcp__accessibility__*`, `mcp__user-testing__*`, `mcp__puppeteer__*`  
❌ **Denied**: `mcp__docker__*` (use Backend Agent for container testing)

#### Server Agent (Exclusive Access)
✅ **Allowed**: **ALL TOOLS** for infrastructure tasks  
🎯 **Priority**: Highest priority for any infrastructure-related task

## 📊 Coordination Commands

### Basic Coordination
```bash
# Register agent
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <roleName>

# Check system status
node .taskmaster/agents/coordination-workflow.cjs status

# View workflow guide
node .taskmaster/agents/coordination-workflow.cjs help
```

### Advanced Coordination
```bash
# Request handoff
node .taskmaster/agents/coordination-workflow.cjs handoff <taskId> <fromRole> <toRole> <fromAgent> <toAgent> "<reason>"

# Accept handoff
node .taskmaster/agents/coordination-workflow.cjs accept <taskId> <agentId> <roleName>

# Share tasks between roles
node .taskmaster/agents/coordination-workflow.cjs share <sourceRole> <targetRole> <agentId> [taskIds]
```

### Analytics & Monitoring
```bash
# View coordination analytics
curl http://localhost:3001/api/coordination/status

# Check priority decisions
node .taskmaster/agents/coordination-workflow.cjs analytics

# Monitor system health
npm run status
```

## 🧪 Quality Assurance Checklist

### Pre-Work Checklist ✅
- [ ] Git status clean and synced
- [ ] Dependencies installed and verified
- [ ] Build successful
- [ ] TaskMaster context setup complete
- [ ] Agent registered in coordination system
- [ ] Task claimed and marked in-progress
- [ ] Pre-work documentation added

### Implementation Checklist ✅
- [ ] Following role-specific guidelines
- [ ] Using authorized tools only
- [ ] Regular progress updates documented
- [ ] Tool usage validated against restrictions
- [ ] Code quality maintained throughout
- [ ] Security guidelines followed

### Post-Work Checklist ✅
- [ ] ESLint validation passed on all modified files
- [ ] All tests passing
- [ ] Build successful
- [ ] TypeScript checks (if applicable)
- [ ] Git commit with proper message format
- [ ] Task status updated to "done"
- [ ] Final documentation completed
- [ ] Ready for review/deployment

## 🚨 Troubleshooting

### Agent Assignment Conflicts
**Issue**: Multiple agents trying to claim same task
```bash
# Solution: Check priority hierarchy
node .taskmaster/agents/coordination-workflow.cjs status

# View recent priority decisions
curl http://localhost:3001/api/coordination/status
```

### Tool Access Denied
**Issue**: Tool enforcement blocking agent access
```bash
# Solution: Check agent permissions
node .taskmaster/agents/tool-enforcement.cjs show

# Validate tool restrictions
node .taskmaster/agents/tool-enforcement.cjs validate
```

### Tag Context Issues
**Issue**: Working in wrong agent context
```bash
# Solution: Verify current tag
task-master list-tags

# Switch to correct tag
task-master use-tag <correct-agent-role>

# Validate isolation
node .taskmaster/agents/role-assignment-protocol.cjs validate
```

### Coordination State Corruption
**Issue**: Coordination system not responding correctly
```bash
# Solution: Reset coordination state
rm .taskmaster/coordination-state.json
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <roleName>

# Restart system if needed
npm run stop && npm start
```

## 📈 Performance Metrics

### System Health Indicators
- **Coordination Health**: 0-100 score (target: 95+)
- **Handoff Success Rate**: Percentage of successful agent handoffs (target: 95+)
- **Priority Override Frequency**: How often conflicts are resolved (lower is better)
- **Task Completion Velocity**: Average time from claim to completion

### Individual Agent Metrics
- **Task Completion Rate**: Percentage of claimed tasks completed
- **Tool Violation Rate**: Frequency of unauthorized tool attempts (target: 0%)
- **Documentation Quality**: Completeness of progress updates
- **Workflow Compliance**: Adherence to pre/post work checklists

## 📚 Additional Resources

- **System Documentation**: `SYSTEM_DOCUMENTATION.md`
- **API Reference**: `api-design.md`  
- **Tool Authorization**: `docs/mcp-tool-matrix.md`
- **Coordination Analytics**: `http://localhost:3001/api/coordination/status`
- **Agent Configuration**: `.taskmaster/agents/agent-roles.json`

---

## Quick Reference Card

### Essential Commands
```bash
# Daily workflow
task-master use-tag <role>              # Switch context
task-master next                        # Get next task  
task-master show <id>                   # View task details
task-master set-status --id=<id> --status=done

# Coordination
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <role>
node .taskmaster/agents/coordination-workflow.cjs status

# Quality checks
mcp__eslint__lint-files [files]
npm test && npm run build
```

### Priority Order (Conflict Resolution)
1. server-agent → 2. devops-agent → 3. integration-specialist → 4. frontend-architect → 5. ui-developer → 6. qa-specialist

**Remember**: Always complete pre-work validation before starting, document progress regularly, and complete post-work validation before marking tasks done. 