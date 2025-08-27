/**
 * Tool Enforcement Engine
 * Integrates with Claude Code MCP to enforce tool restrictions
 */

const { ToolRestrictionFramework } = require('./tool-restriction-framework.cjs');
const fs = require('fs');
const path = require('path');

class ToolEnforcementEngine {
    constructor() {
        this.framework = new ToolRestrictionFramework();
        this.currentAgent = null;
        this.auditLog = [];
        this.logPath = '.taskmaster/agents/tool-usage.log';
    }

    /**
     * Set the current agent context
     */
    setCurrentAgent(agentRole, agentId = null) {
        this.currentAgent = {
            role: agentRole,
            id: agentId || `${agentRole}-${Date.now()}`,
            sessionStart: new Date().toISOString()
        };
        this.logActivity('agent_session_start', { agent: this.currentAgent });
    }

    /**
     * Enforce tool restrictions before tool execution
     */
    enforceTool(toolName, parameters = {}) {
        if (!this.currentAgent) {
            this.logActivity('tool_denied', { 
                tool: toolName, 
                reason: 'no_agent_context',
                parameters: this.sanitizeParameters(parameters)
            });
            return {
                allowed: false,
                reason: 'No agent context set. Use setCurrentAgent() first.',
                code: 'NO_AGENT_CONTEXT'
            };
        }

        const allowed = this.framework.isToolAllowed(this.currentAgent.role, toolName);
        const result = {
            allowed,
            agent: this.currentAgent,
            tool: toolName,
            timestamp: new Date().toISOString()
        };

        if (allowed) {
            this.logActivity('tool_allowed', {
                agent: this.currentAgent.role,
                tool: toolName,
                parameters: this.sanitizeParameters(parameters)
            });
            result.reason = 'Tool allowed for agent role';
            result.code = 'ALLOWED';
        } else {
            this.logActivity('tool_denied', {
                agent: this.currentAgent.role,
                tool: toolName,
                reason: 'role_restriction',
                parameters: this.sanitizeParameters(parameters)
            });
            result.reason = `Tool ${toolName} not allowed for role ${this.currentAgent.role}`;
            result.code = 'ROLE_RESTRICTION';
        }

        return result;
    }

    /**
     * Sanitize parameters for logging (remove sensitive data)
     */
    sanitizeParameters(parameters) {
        const sanitized = { ...parameters };
        const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
        
        Object.keys(sanitized).forEach(key => {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                sanitized[key] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    /**
     * Log tool usage activity
     */
    logActivity(action, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            details
        };

        this.auditLog.push(logEntry);

        // Write to log file
        try {
            const logLine = JSON.stringify(logEntry) + '\n';
            const logDir = path.dirname(this.logPath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            fs.appendFileSync(this.logPath, logLine);
        } catch (error) {
            console.error('Failed to write to audit log:', error.message);
        }
    }

    /**
     * Get recent tool usage for an agent
     */
    getAgentActivity(agentRole, limit = 50) {
        return this.auditLog
            .filter(entry => entry.details.agent === agentRole || 
                           (entry.details.agent && entry.details.agent.role === agentRole))
            .slice(-limit);
    }

    /**
     * Generate security report
     */
    generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            currentAgent: this.currentAgent,
            totalEvents: this.auditLog.length,
            summary: {
                allowed: 0,
                denied: 0,
                violations: []
            },
            agentActivity: {},
            toolUsage: {}
        };

        this.auditLog.forEach(entry => {
            if (entry.action === 'tool_allowed') {
                report.summary.allowed++;
            } else if (entry.action === 'tool_denied') {
                report.summary.denied++;
                report.summary.violations.push({
                    timestamp: entry.timestamp,
                    agent: entry.details.agent,
                    tool: entry.details.tool,
                    reason: entry.details.reason
                });
            }

            // Track agent activity
            const agentKey = entry.details.agent?.role || entry.details.agent || 'unknown';
            if (!report.agentActivity[agentKey]) {
                report.agentActivity[agentKey] = { allowed: 0, denied: 0 };
            }
            if (entry.action === 'tool_allowed') {
                report.agentActivity[agentKey].allowed++;
            } else if (entry.action === 'tool_denied') {
                report.agentActivity[agentKey].denied++;
            }

            // Track tool usage
            const tool = entry.details.tool;
            if (tool) {
                if (!report.toolUsage[tool]) {
                    report.toolUsage[tool] = { allowed: 0, denied: 0 };
                }
                if (entry.action === 'tool_allowed') {
                    report.toolUsage[tool].allowed++;
                } else if (entry.action === 'tool_denied') {
                    report.toolUsage[tool].denied++;
                }
            }
        });

        return report;
    }

    /**
     * Clear audit log (use with caution)
     */
    clearAuditLog() {
        this.auditLog = [];
        try {
            if (fs.existsSync(this.logPath)) {
                fs.unlinkSync(this.logPath);
            }
        } catch (error) {
            console.error('Failed to clear audit log file:', error.message);
        }
    }

    /**
     * Get violation patterns for security analysis
     */
    getViolationPatterns() {
        const violations = this.auditLog.filter(entry => entry.action === 'tool_denied');
        const patterns = {
            byAgent: {},
            byTool: {},
            byTime: {},
            repeated: []
        };

        violations.forEach(violation => {
            const agent = violation.details.agent?.role || violation.details.agent || 'unknown';
            const tool = violation.details.tool;
            const hour = new Date(violation.timestamp).getHours();

            // Group by agent
            patterns.byAgent[agent] = (patterns.byAgent[agent] || 0) + 1;

            // Group by tool
            patterns.byTool[tool] = (patterns.byTool[tool] || 0) + 1;

            // Group by time
            patterns.byTime[hour] = (patterns.byTime[hour] || 0) + 1;

            // Check for repeated violations (same agent + tool)
            const signature = `${agent}:${tool}`;
            const existing = patterns.repeated.find(r => r.signature === signature);
            if (existing) {
                existing.count++;
                existing.lastSeen = violation.timestamp;
            } else {
                patterns.repeated.push({
                    signature,
                    agent,
                    tool,
                    count: 1,
                    firstSeen: violation.timestamp,
                    lastSeen: violation.timestamp
                });
            }
        });

        // Filter to only repeated violations (count > 1)
        patterns.repeated = patterns.repeated.filter(r => r.count > 1);

        return patterns;
    }
}

/**
 * MCP Integration Hook
 * This would be integrated with Claude Code's MCP system
 */
class MCPToolHook {
    constructor() {
        this.enforcer = new ToolEnforcementEngine();
    }

    /**
     * Hook to be called before any MCP tool execution
     */
    beforeToolExecution(toolName, parameters, context) {
        // Extract agent context from Claude Code session
        const agentRole = context.agentRole || 'unknown';
        const agentId = context.agentId || context.sessionId;

        this.enforcer.setCurrentAgent(agentRole, agentId);
        return this.enforcer.enforceTool(toolName, parameters);
    }

    /**
     * Hook to be called after tool execution
     */
    afterToolExecution(toolName, result, context) {
        const agentRole = context.agentRole || 'unknown';
        this.enforcer.logActivity('tool_executed', {
            agent: agentRole,
            tool: toolName,
            success: !result.error,
            error: result.error ? result.error.message : null
        });
    }

    /**
     * Get enforcement status
     */
    getStatus() {
        return {
            currentAgent: this.enforcer.currentAgent,
            recentActivity: this.enforcer.getAgentActivity(
                this.enforcer.currentAgent?.role, 10
            ),
            securityReport: this.enforcer.generateSecurityReport()
        };
    }
}

module.exports = {
    ToolEnforcementEngine,
    MCPToolHook
};

// CLI for testing enforcement
if (require.main === module) {
    const enforcer = new ToolEnforcementEngine();
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'test':
            const [role, tool] = args.slice(1);
            enforcer.setCurrentAgent(role);
            const result = enforcer.enforceTool(tool);
            console.log(JSON.stringify(result, null, 2));
            break;

        case 'report':
            const report = enforcer.generateSecurityReport();
            console.log(JSON.stringify(report, null, 2));
            break;

        case 'violations':
            const patterns = enforcer.getViolationPatterns();
            console.log(JSON.stringify(patterns, null, 2));
            break;

        default:
            console.log(`
Usage: node tool-enforcement.js <command> [args]

Commands:
  test <role> <tool>    Test tool enforcement for role
  report               Generate security report
  violations           Show violation patterns

Examples:
  node tool-enforcement.js test frontend-architect mcp__docker__start
  node tool-enforcement.js report
  node tool-enforcement.js violations
            `);
    }
}