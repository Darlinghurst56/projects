# Mandatory Agent Pre-Work Checklist

## Overview
This checklist MUST be completed by all agents before starting work on any task. This ensures proper context, tool availability, and prevents conflicts in the multi-agent environment.

## ⚠️ CRITICAL REQUIREMENT
**NO AGENT SHALL BEGIN WORK ON A TASK UNLESS ALL ITEMS IN THIS CHECKLIST ARE VERIFIED AND DOCUMENTED.**

---

## 📋 Pre-Work Checklist

### 1. Environment Verification ✅

#### Git Repository State
- [ ] **Clean Working Directory**: `git status` shows no uncommitted changes
- [ ] **Latest Code**: `git pull origin main` completed successfully
- [ ] **Correct Branch**: Working on appropriate branch for task
- [ ] **No Conflicts**: No merge conflicts or unresolved issues

**Required Commands**:
```bash
git status
git pull origin main
git log --oneline -5  # Review recent commits
```

#### Project Dependencies
- [ ] **Dependencies Installed**: `npm install` or equivalent completed
- [ ] **Build Success**: Project builds without errors
- [ ] **Server Start**: Development server can start (if applicable)
- [ ] **Tool Availability**: Required MCP tools accessible

**Required Commands**:
```bash
npm install
npm run build    # or project-specific build command
npm run dev      # verify server starts (if applicable)
```

### 2. TaskMaster Context Setup ✅

#### Task Understanding
- [ ] **Task Details**: Full task description and requirements understood
- [ ] **Dependencies**: All task dependencies identified and status checked
- [ ] **Acceptance Criteria**: Clear understanding of completion requirements
- [ ] **Complexity Assessment**: Task complexity and time estimate reviewed

**Required Commands**:
```bash
task-master show <task-id>                    # Get full task details
task-master validate-dependencies             # Check dependency status
task-master complexity-report                # Review complexity analysis
```

#### Agent Role Verification
- [ ] **Correct Workspace**: Switched to appropriate agent tag context
- [ ] **Tool Access**: Required tools available in current role
- [ ] **Skill Match**: Task requirements match agent capabilities
- [ ] **Conflict Check**: No other agents working on conflicting tasks

**Required Commands**:
```bash
task-master use-tag --name=<agent-role>       # Switch to correct context
task-master list-tags                         # Verify available roles
task-master list --status=in-progress         # Check for conflicts
```

### 3. Project Context Analysis ✅

#### Codebase Familiarization
- [ ] **Related Files**: Identified all files that will be modified
- [ ] **Architecture**: Understood relevant code architecture
- [ ] **Patterns**: Reviewed existing code patterns and conventions
- [ ] **Documentation**: Read relevant documentation and comments

**Required Actions**:
```bash
# Use Read tool to examine relevant files
# Use Grep tool to search for related patterns
# Review CLAUDE.md for project-specific guidelines
```

#### Integration Points
- [ ] **API Contracts**: Understood API interfaces and contracts
- [ ] **Data Flow**: Mapped data flow and state management
- [ ] **Side Effects**: Identified potential side effects of changes
- [ ] **Testing Strategy**: Planned testing approach for changes

### 4. Tool and Resource Verification ✅

#### MCP Tool Access
- [ ] **Core Tools**: `mcp__task-master-ai__*` tools accessible
- [ ] **Role-Specific Tools**: Required tools for agent role available
- [ ] **Testing Tools**: Testing and validation tools accessible
- [ ] **Security Tools**: Security scanning tools available

**Role-Specific Tool Verification**:
- **Frontend Architect**: `mcp__design-system__*`, `mcp__performance-monitoring__*`
- **UI Developer**: `mcp__accessibility__*`, `mcp__user-testing__*`, `mcp__design-system__*`
- **Backend Agent**: Database tools, API testing tools
- **Integration Specialist**: API tools, data validation tools
- **QA Specialist**: `mcp__accessibility__*`, `mcp__user-testing__*`, `mcp__puppeteer__*`
- **DevOps Agent**: `mcp__docker__*`, infrastructure tools

#### Documentation Access
- [ ] **CLAUDE.md**: Project instructions reviewed
- [ ] **README.md**: Project setup and usage understood
- [ ] **API Docs**: Relevant API documentation accessible
- [ ] **Architecture Docs**: System architecture documentation reviewed

### 5. Coordination and Communication ✅

#### Agent Registration
- [ ] **Agent Registration**: Registered in coordination system
- [ ] **Role Assignment**: Confirmed role assignment in system
- [ ] **Task Claiming**: Task marked as in-progress with agent attribution
- [ ] **Communication Setup**: Ready to log progress and communicate

**Required Commands**:
```bash
# Register agent in coordination system
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <roleName>

# Claim task and add agent attribution
task-master set-status --id=<task-id> --status=in-progress
task-master update-subtask --id=<task-id> --prompt="AGENT: <role> - Starting task implementation. Pre-work checklist completed ✅"
```

#### Handoff Preparation
- [ ] **Handoff Context**: Prepared to receive handoffs from other agents
- [ ] **Documentation Ready**: Ready to document work for future handoffs
- [ ] **Collaboration Setup**: Prepared to collaborate with other agents
- [ ] **Conflict Resolution**: Plan for resolving potential conflicts

### 6. Quality and Security Preparation ✅

#### Security Readiness
- [ ] **Credential Management**: No hardcoded credentials or secrets
- [ ] **Security Review**: Planned security considerations for changes
- [ ] **Access Control**: Proper access control measures planned
- [ ] **Data Protection**: Data privacy and protection measures considered

#### Quality Standards
- [ ] **Code Standards**: Familiar with project coding standards
- [ ] **Testing Strategy**: Testing approach planned and prepared
- [ ] **Performance Impact**: Performance implications considered
- [ ] **Accessibility**: Accessibility requirements understood (if applicable)

---

## 🚀 Pre-Work Workflow

### Step 1: Environment Setup
```bash
# 1. Check git status and sync
git status
git pull origin main

# 2. Install dependencies and verify build
npm install
npm run build

# 3. Start development server (if applicable)
npm run dev
```

### Step 2: TaskMaster Context
```bash
# 1. Switch to correct agent context
task-master use-tag --name=<agent-role>

# 2. Review task details
task-master show <task-id>

# 3. Check dependencies
task-master validate-dependencies

# 4. Claim task
task-master set-status --id=<task-id> --status=in-progress
```

### Step 3: Agent Registration
```bash
# 1. Register in coordination system
node .taskmaster/agents/coordination-workflow.cjs register <agentId> <roleName>

# 2. Document start of work
task-master update-subtask --id=<task-id> --prompt="AGENT: <role> - Pre-work checklist completed ✅
Environment: Git clean, dependencies installed, build successful
Context: Task details reviewed, dependencies validated
Tools: All required MCP tools verified and accessible
Ready to begin implementation."
```

### Step 4: Final Verification
```bash
# Verify all systems ready
echo "✅ Pre-work checklist complete - Ready to begin task implementation"
```

---

## 🔧 Tool Verification Matrix

### Universal Tools (All Agents)
- [ ] `mcp__task-master-ai__*` - Task management
- [ ] `Edit` - File editing
- [ ] `Read` - File reading  
- [ ] `Bash` - Command execution
- [ ] `mcp__eslint__*` - Code quality

### Role-Specific Tools

#### Frontend Architect
- [ ] `mcp__design-system__*` - Design system management
- [ ] `mcp__performance-monitoring__*` - Performance metrics
- [ ] `mcp__accessibility__*` - Accessibility validation

#### UI Developer  
- [ ] `mcp__accessibility__*` - WCAG compliance
- [ ] `mcp__user-testing__*` - User journey testing
- [ ] `mcp__design-system__*` - UI components

#### Backend Agent
- [ ] Database connection tools
- [ ] API testing tools
- [ ] Server monitoring tools

#### Integration Specialist
- [ ] API integration tools
- [ ] Data validation tools
- [ ] Service coordination tools

#### QA Specialist
- [ ] `mcp__accessibility__*` - Accessibility testing
- [ ] `mcp__user-testing__*` - User journey validation
- [ ] `mcp__puppeteer__*` - Browser automation
- [ ] `mcp__performance-monitoring__*` - Performance testing

#### DevOps Agent
- [ ] `mcp__docker__*` - Container management
- [ ] Infrastructure tools
- [ ] Deployment tools

---

## 🚨 Pre-Work Failure Protocol

If any pre-work checklist item fails:

1. **Stop Work**: Do not proceed with task implementation
2. **Document Issue**: Record specific failure and context
3. **Resolve Dependency**: Address underlying issue
4. **Notify Team**: If issue affects other agents or system
5. **Retry Checklist**: Complete full checklist after resolution

**Failure Documentation**:
```bash
task-master update-task --id=<task-id> --prompt="PRE-WORK FAILURE: <specific issue>
Item failed: <checklist item>
Impact: <description of impact>
Resolution: <steps taken to resolve>
Status: <resolved/escalated/blocked>"
```

---

## 📊 Quality Metrics

Track and report monthly:
- Pre-work checklist compliance rate
- Average time to complete pre-work
- Most common pre-work failures
- Process improvement opportunities

---

**Version**: 1.0  
**Effective Date**: January 2025  
**Mandatory For**: All Claude Code agents  
**Review Cycle**: Monthly  
**Maintained By**: Task Management Team