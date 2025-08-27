# Dynamic Tool Restriction Framework

A comprehensive security framework for managing agent tool access based on roles and security policies in the Claude Code environment.

## Overview

The Dynamic Tool Restriction Framework provides:

- **Role-based tool access control** for different agent types
- **Real-time enforcement** of tool restrictions during execution
- **Audit logging** and security monitoring
- **Violation pattern detection** for security analysis
- **Dynamic restriction management** through CLI utilities

## Components

### 1. ToolRestrictionFramework (`tool-restriction-framework.js`)

Core framework for managing tool restrictions:

```javascript
const { ToolRestrictionFramework } = require('./tool-restriction-framework');

const framework = new ToolRestrictionFramework();

// Check if agent can use tool
const allowed = framework.isToolAllowed('frontend-architect', 'mcp__docker__start');

// Get allowed tools for role
const tools = framework.getAllowedTools('frontend-architect');

// Add new restriction
framework.addToolRestriction('ui-developer', 'mcp__new__tool', 'allowed');
```

### 2. ToolEnforcementEngine (`tool-enforcement.js`)

Real-time enforcement and audit logging:

```javascript
const { ToolEnforcementEngine } = require('./tool-enforcement');

const enforcer = new ToolEnforcementEngine();

// Set agent context
enforcer.setCurrentAgent('integration-specialist', 'agent-123');

// Enforce tool usage
const result = enforcer.enforceTool('mcp__docker__start', { image: 'nginx' });
if (result.allowed) {
    // Execute tool
} else {
    console.log(result.reason);
}

// Generate security report
const report = enforcer.generateSecurityReport();
```

## Agent Roles and Permissions

### Frontend Architect

- **Focus**: JavaScript architecture and core module design
- **Allowed**: ESLint, file operations
- **Denied**: Docker, destructive TaskMaster operations
- **Restricted**: TaskMaster read/update operations

### UI Developer  

- **Focus**: CSS, HTML, and visual component development
- **Allowed**: ESLint, Playwright, styling tools
- **Denied**: Docker, destructive operations
- **Restricted**: GitHub operations, TaskMaster operations

### Integration Specialist

- **Focus**: API connections, data flow, backend integration
- **Allowed**: Full Docker access, HTTP tools, TaskMaster operations
- **Denied**: Playwright (UI testing not their focus)
- **Restricted**: None (highest privilege level)

### QA Specialist

- **Focus**: Testing, validation, quality assurance
- **Allowed**: ESLint, Playwright, read-only TaskMaster operations
- **Denied**: Docker, destructive TaskMaster operations
- **Restricted**: TaskMaster write operations

### Coordination Agent

- **Focus**: Agent coordination and task management
- **Allowed**: Full TaskMaster access, GitHub operations, file operations
- **Denied**: Docker, Playwright
- **Restricted**: None

## CLI Usage

### Project Restrict Tools Utility

```bash
# Check if role can use tool
node tool-restriction-framework.js check frontend-architect mcp__docker__start

# List restrictions for role
node tool-restriction-framework.js list ui-developer

# Add tool restriction
node tool-restriction-framework.js add qa-specialist mcp__selenium__* allowed

# Remove tool restriction  
node tool-restriction-framework.js remove frontend-architect mcp__test__tool

# Generate restriction report
node tool-restriction-framework.js report
```

### Tool Enforcement Testing

```bash
# Test enforcement for specific role/tool
node tool-enforcement.js test frontend-architect mcp__docker__start

# Generate security report
node tool-enforcement.js report

# Show violation patterns
node tool-enforcement.js violations
```

## Configuration Files

### Tool Restrictions (`tool-restrictions.json`)

```json
{
  "frontend-architect": {
    "allowed": ["Read", "Write", "mcp__eslint__*"],
    "denied": ["mcp__docker__*", "mcp__task-master-ai__delete_*"],
    "restricted": ["mcp__task-master-ai__*"]
  }
}
```

### Agent Roles (`roles.json`)

```json
{
  "frontend-architect": {
    "description": "JavaScript architecture and core module design",
    "capabilities": ["react", "javascript", "architecture"],
    "priority": "high"
  }
}
```

## Security Features

### Audit Logging

- All tool access attempts logged with timestamps
- Parameter sanitization for sensitive data
- Agent session tracking
- Success/failure status recording

### Violation Detection

- Repeated violation pattern analysis
- Agent behavior monitoring
- Time-based violation clustering
- Automated security reporting

### Real-time Enforcement

- Pre-execution tool validation
- Role-based access control
- Dynamic restriction updates
- Graceful denial with detailed reasons

## Testing

Run the comprehensive test suite:

```bash
# Install dependencies (if using npm)
npm install jest

# Run tests
npx jest __tests__/tool-restriction.test.js

# Run with coverage
npx jest --coverage __tests__/tool-restriction.test.js
```

Test coverage includes:
- Tool permission validation
- Wildcard pattern matching
- Dynamic restriction management
- Enforcement engine functionality
- Security reporting
- Violation pattern detection
- Parameter sanitization
- Integration scenarios

## Integration with Claude Code

### MCP Hook Integration

The framework provides hooks for integration with Claude Code's MCP system:

```javascript
const { MCPToolHook } = require('./tool-enforcement');

const hook = new MCPToolHook();

// Before tool execution
const permission = hook.beforeToolExecution(toolName, parameters, context);
if (!permission.allowed) {
    throw new Error(permission.reason);
}

// After tool execution
hook.afterToolExecution(toolName, result, context);
```

### Context Integration

Agent context can be extracted from Claude Code sessions:

```javascript
// Extract from Claude Code context
const agentRole = context.agentRole || determineRoleFromTask(context.task);
const agentId = context.sessionId || context.agentId;

enforcer.setCurrentAgent(agentRole, agentId);
```

## Security Best Practices

1. **Principle of Least Privilege**: Each agent role has minimal necessary permissions
2. **Audit Everything**: All tool access attempts are logged
3. **Pattern Detection**: Automated detection of suspicious behavior
4. **Dynamic Updates**: Restrictions can be updated without restart
5. **Sanitization**: Sensitive parameters are automatically redacted
6. **Fail Secure**: Unknown tools/roles are denied by default

## Monitoring and Alerts

### Generate Daily Security Report

```bash
# Add to crontab for daily security reports
0 9 * * * cd /path/to/project && node .taskmaster/agents/tool-enforcement.js report > security-$(date +\%Y\%m\%d).json
```

### Monitor Violations

```bash
# Check for repeated violations
node tool-enforcement.js violations | jq '.repeated[] | select(.count > 5)'
```

### Track Agent Activity

```bash
# Monitor specific agent
node tool-enforcement.js report | jq '.agentActivity["frontend-architect"]'
```

## Future Enhancements

- Web-based management dashboard
- Real-time violation alerts
- Machine learning-based anomaly detection
- Integration with external SIEM systems
- Role hierarchy and inheritance
- Time-based restriction policies
- Geographic access controls
- Tool usage quotas and rate limiting

## TODO

- [ ] Integrate MCPToolHook in all agent workflows for pre/post tool execution enforcement and logging.

## NOTE

- Puppeteer is not supported on ARM and should not be installed again. Use Playwright for all browser automation and UI testing tasks.