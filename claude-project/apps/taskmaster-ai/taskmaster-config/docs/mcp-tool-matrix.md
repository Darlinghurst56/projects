# MCP Tool Authorization Matrix

## Overview
This document defines which MCP tools each agent role is authorized to use. This ensures proper separation of concerns and prevents agents from accessing tools outside their domain expertise.

## 🛠️ Universal Tools (All Agents)

### Core TaskMaster Tools
- `mcp__task-master-ai__*` - Task management and coordination
- `Edit` - File editing operations
- `Read` - File reading operations
- `Bash` - Command execution (limited scope per role)

### Code Quality Tools
- `mcp__eslint__*` - Code linting and quality checks

---

## 🎯 Role-Specific Tool Authorization

### Frontend Architect (`frontend-architect`)
**Core Domain**: JavaScript architecture, performance, and design systems

**Authorized Tools**:
- `mcp__design-system__*` - Design system management and validation
- `mcp__performance-monitoring__*` - Performance metrics and monitoring
- `mcp__accessibility__*` - Accessibility architecture validation
- `Bash` - Build tools, architecture scripts, performance analysis

**Restricted Tools**:
- `mcp__user-testing__*` - Use UI Developer for user testing
- `mcp__puppeteer__*` - Use QA Specialist for browser automation
- `mcp__docker__*` - Use DevOps Agent for containerization

### UI Developer (`ui-developer`)
**Core Domain**: Visual components, user experience, and frontend testing

**Authorized Tools**:
- `mcp__accessibility__*` - WCAG compliance and accessibility testing
- `mcp__user-testing__*` - User journey and experience testing
- `mcp__design-system__*` - UI component library access
- `Bash` - Frontend build tools, component generators

**Restricted Tools**:
- `mcp__performance-monitoring__*` - Use Frontend Architect for performance architecture
- `mcp__puppeteer__*` - Use QA Specialist for comprehensive browser testing
- `mcp__docker__*` - Use DevOps Agent for containerization

### Backend Agent (`backend-agent`)
**Core Domain**: Server APIs, databases, and backend logic

**Authorized Tools**:
- `mcp__task-master-ai__*` - Task and data management
- `Bash` - Database operations, API testing, server management
- Backend-specific tools (database clients, API testing tools)

**Restricted Tools**:
- `mcp__accessibility__*` - Use Frontend agents for accessibility
- `mcp__user-testing__*` - Use UI Developer for user testing
- `mcp__design-system__*` - Use Frontend agents for design system
- `mcp__puppeteer__*` - Use QA Specialist for browser testing
- `mcp__docker__*` - Use DevOps Agent for containerization

### Integration Specialist (`integration-specialist`)
**Core Domain**: API connections, data flow, and system integration

**Authorized Tools**:
- `mcp__task-master-ai__*` - System coordination and integration
- `Bash` - API testing, data pipeline management, integration scripts
- Integration-specific tools (API clients, data validation tools)

**Restricted Tools**:
- `mcp__accessibility__*` - Use Frontend agents for accessibility
- `mcp__user-testing__*` - Use UI Developer for user testing
- `mcp__design-system__*` - Use Frontend agents for design system
- `mcp__puppeteer__*` - Use QA Specialist for browser testing
- `mcp__docker__*` - Use DevOps Agent for containerization

### QA Specialist (`qa-specialist`)
**Core Domain**: Testing, validation, and quality assurance

**Authorized Tools**:
- `mcp__accessibility__*` - Accessibility testing and validation
- `mcp__user-testing__*` - User journey testing and validation
- `mcp__puppeteer__*` - Browser automation and testing
- `mcp__performance-monitoring__*` - Performance testing and metrics
- `Bash` - Test execution, quality tools, validation scripts

**Restricted Tools**:
- `mcp__design-system__*` - Use Frontend agents for design system management
- `mcp__docker__*` - Use DevOps Agent for containerization

### DevOps Agent (`devops-agent`)
**Core Domain**: Infrastructure, deployment, and system operations

**Authorized Tools**:
- `mcp__docker__*` - Container management and orchestration
- `Bash` - Infrastructure scripts, deployment tools, system operations
- Infrastructure-specific tools (CI/CD, monitoring, deployment)

**Restricted Tools**:
- `mcp__accessibility__*` - Use Frontend agents for accessibility
- `mcp__user-testing__*` - Use UI Developer for user testing
- `mcp__design-system__*` - Use Frontend agents for design system
- `mcp__puppeteer__*` - Use QA Specialist for browser testing
- `mcp__performance-monitoring__*` - Use Frontend Architect for performance architecture

---

## 🔒 Tool Validation Matrix

### Accessibility Testing (`mcp__accessibility__*`)
- ✅ **Frontend Architect** - Architecture-level accessibility decisions
- ✅ **UI Developer** - Component-level accessibility implementation
- ✅ **QA Specialist** - Accessibility testing and validation
- ❌ **Backend Agent** - No frontend accessibility responsibilities
- ❌ **Integration Specialist** - No direct accessibility responsibilities
- ❌ **DevOps Agent** - No accessibility responsibilities

### Performance Monitoring (`mcp__performance-monitoring__*`)
- ✅ **Frontend Architect** - Performance architecture and optimization
- ✅ **QA Specialist** - Performance testing and validation
- ❌ **UI Developer** - Focus on component implementation, not performance architecture
- ❌ **Backend Agent** - Server performance is separate domain
- ❌ **Integration Specialist** - API performance is separate concern
- ❌ **DevOps Agent** - Infrastructure performance is separate domain

### User Testing (`mcp__user-testing__*`)
- ✅ **UI Developer** - User experience implementation and testing
- ✅ **QA Specialist** - User journey testing and validation
- ❌ **Frontend Architect** - Focus on architecture, not user testing
- ❌ **Backend Agent** - No direct user interaction
- ❌ **Integration Specialist** - No direct user interaction
- ❌ **DevOps Agent** - No direct user interaction

### Design System (`mcp__design-system__*`)
- ✅ **Frontend Architect** - Design system architecture and governance
- ✅ **UI Developer** - Design system component implementation
- ❌ **QA Specialist** - Test design system components, don't manage them
- ❌ **Backend Agent** - No design system responsibilities
- ❌ **Integration Specialist** - No design system responsibilities
- ❌ **DevOps Agent** - No design system responsibilities

### Browser Automation (`mcp__puppeteer__*`)
- ✅ **QA Specialist** - Comprehensive browser testing and automation
- ❌ **Frontend Architect** - Focus on architecture, not testing implementation
- ❌ **UI Developer** - Focus on component development, not testing automation
- ❌ **Backend Agent** - No browser testing responsibilities
- ❌ **Integration Specialist** - No browser testing responsibilities
- ❌ **DevOps Agent** - No browser testing responsibilities

### Container Management (`mcp__docker__*`)
- ✅ **DevOps Agent** - Container orchestration and management
- ❌ **Frontend Architect** - No containerization responsibilities
- ❌ **UI Developer** - No containerization responsibilities
- ❌ **Backend Agent** - Use DevOps Agent for container needs
- ❌ **Integration Specialist** - Use DevOps Agent for container needs
- ❌ **QA Specialist** - Use DevOps Agent for container needs

---

## 🚨 Tool Violation Protocol

### Violation Detection
Tools are validated during:
1. **Pre-work validation** - Before task starts
2. **Mid-work monitoring** - During task execution
3. **Post-work validation** - Before task completion

### Violation Response
1. **Immediate**: Block tool usage and log violation
2. **Notification**: Alert agent of tool restriction
3. **Guidance**: Provide correct agent role for tool usage
4. **Escalation**: Repeated violations require review

### Violation Documentation
```bash
# Log tool violation
task-master update-task --id=<task-id> --prompt="TOOL VIOLATION: <agent-role> attempted to use <tool>
Authorized agents for <tool>: <authorized-roles>
Action: Tool usage blocked
Resolution: Coordinate with authorized agent or request role change"
```

---

## 🔄 Cross-Agent Coordination

### When Tools Are Restricted
If an agent needs functionality from a restricted tool:

1. **Identify Authorized Agent**: Check tool matrix for authorized roles
2. **Request Coordination**: Use TaskMaster handoff system
3. **Document Handoff**: Clear handoff reason and requirements
4. **Await Completion**: Wait for authorized agent to complete work
5. **Continue Work**: Resume with completed dependencies

### Handoff Examples
```bash
# Frontend Architect needs browser testing
task-master handoff <task-id> frontend-architect qa-specialist <agent-id> <qa-agent-id> "Need Puppeteer browser testing for performance validation"

# UI Developer needs performance monitoring
task-master handoff <task-id> ui-developer frontend-architect <agent-id> <arch-agent-id> "Need performance monitoring setup for component optimization"
```

---

## 📊 Tool Usage Monitoring

### Monthly Reports
- Tool usage by agent role
- Cross-role coordination frequency
- Tool violation incidents
- Process improvement recommendations

### Optimization Opportunities
- Identify frequently coordinated tools
- Evaluate role boundary adjustments
- Assess tool access efficiency
- Improve handoff processes

---

**Version**: 1.0  
**Effective Date**: January 2025  
**Review Cycle**: Monthly  
**Maintained By**: Task Management Team