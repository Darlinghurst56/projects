/**
 * Dynamic Tool Restriction Framework
 * Manages agent tool access based on roles and security policies
 */

const fs = require('fs');
const path = require('path');

class ToolRestrictionFramework {
    constructor(configPath = '.taskmaster/agents/tool-restrictions.json') {
        this.configPath = configPath;
        this.restrictions = this.loadRestrictions();
        this.agentRoles = this.loadAgentRoles();
    }

    /**
     * Load tool restrictions configuration
     */
    loadRestrictions() {
        try {
            if (fs.existsSync(this.configPath)) {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            }
            return this.getDefaultRestrictions();
        } catch (error) {
            console.warn('Failed to load tool restrictions, using defaults:', error.message);
            return this.getDefaultRestrictions();
        }
    }

    /**
     * Load agent role definitions
     */
    loadAgentRoles() {
        const rolesPath = '.taskmaster/agents/roles.json';
        try {
            if (fs.existsSync(rolesPath)) {
                return JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
            }
            return this.getDefaultRoles();
        } catch (error) {
            console.warn('Failed to load agent roles, using defaults:', error.message);
            return this.getDefaultRoles();
        }
    }

    /**
     * Default tool restrictions for agent roles
     */
    getDefaultRestrictions() {
        return {
            // 5-AGENT SYSTEM: Consolidated from 7-agent system
            "orchestrator-master": {
                "allowed": [
                    "ALL_TOOLS"  // When human-approved
                ],
                "denied": [],
                "restricted": [],
                "humanApprovalRequired": true,
                "suggestOnly": true,
                "consolidatedFrom": ["server-agent", "devops-agent"],
                "notes": "V1: Can only suggest actions to human for approval"
            },
            "backend-dev": {
                "allowed": [
                    "Read", "Write", "Edit", "MultiEdit",
                    "mcp__filesystem__*",
                    "mcp__github__*",
                    "mcp__fetch__*",
                    "mcp__http__*",
                    "mcp__docker__*",
                    "mcp__task-master-ai__*",
                    "mcp__eslint__*",
                    "Bash"
                ],
                "denied": [
                    "mcp__playwright__*"  // UI testing not backend focus
                ],
                "restricted": [],
                "consolidatedFrom": ["backend-agent", "integration-specialist"],
                "notes": "Full backend capabilities including API integration"
            },
            "frontend-dev": {
                "allowed": [
                    "Read", "Write", "Edit", "MultiEdit",
                    "mcp__filesystem__*",
                    "mcp__vite__*",
                    "mcp__tailwindcss__*",
                    "mcp__shadcn_ui__*",
                    "mcp__playwright__*",
                    "mcp__eslint__*",
                    "mcp__task-master-ai__get_*",
                    "mcp__task-master-ai__update_*",
                    "mcp__task-master-ai__set_*",
                    "Bash"
                ],
                "denied": [
                    "mcp__docker__*",
                    "mcp__task-master-ai__delete_*",
                    "mcp__task-master-ai__remove_*"
                ],
                "restricted": [
                    "mcp__github__*",
                    "mcp__task-master-ai__*"
                ],
                "consolidatedFrom": ["frontend-architect", "ui-developer"],
                "notes": "Full frontend capabilities from architecture to UI implementation"
            },
            "documentation-agent": {
                "allowed": [
                    "Read", "Write", "Edit", "MultiEdit",
                    "mcp__filesystem__*",
                    "mcp__task-master-ai__*",
                    "mcp__eslint__*",
                    "Bash"
                ],
                "denied": [
                    "mcp__docker__*",
                    "mcp__playwright__*",
                    "mcp__github__*"
                ],
                "restricted": [],
                "consolidatedFrom": ["new-role"],
                "notes": "Focus on documentation creation and maintenance"
            },
            "qa-agent": {
                "allowed": [
                    "Read", "Write", "Edit", "MultiEdit",
                    "mcp__filesystem__*",
                    "mcp__eslint__*",
                    "mcp__playwright__*",
                    "mcp__accessibility__*",
                    "mcp__user-testing__*",
                    "mcp__performance-monitoring__*",
                    "mcp__github__*",
                    "mcp__task-master-ai__get_*",
                    "mcp__task-master-ai__update_*",
                    "mcp__task-master-ai__set_*",
                    "Bash"
                ],
                "denied": [
                    "mcp__docker__*",
                    "mcp__task-master-ai__delete_*",
                    "mcp__task-master-ai__remove_*"
                ],
                "restricted": [
                    "mcp__task-master-ai__*"
                ],
                "enhancedFrom": ["qa-specialist"],
                "operationalControls": {
                    "heartbeatRequired": true,
                    "resourceMonitoring": true,
                    "loopDetection": true,
                    "24-7-operations": true
                },
                "notes": "Enhanced QA capabilities with 24/7 operational monitoring"
            },
            
            // LEGACY ROLE MAPPINGS (for backward compatibility)
            "server-agent": {
                "redirect": "orchestrator-master",
                "deprecated": true
            },
            "devops-agent": {
                "redirect": "orchestrator-master", 
                "deprecated": true
            },
            "backend-agent": {
                "redirect": "backend-dev",
                "deprecated": true
            },
            "integration-specialist": {
                "redirect": "backend-dev",
                "deprecated": true
            },
            "frontend-architect": {
                "redirect": "frontend-dev",
                "deprecated": true
            },
            "ui-developer": {
                "redirect": "frontend-dev",
                "deprecated": true
            },
            "qa-specialist": {
                "redirect": "qa-agent",
                "deprecated": true
            }
        };
    }

    /**
     * Default agent role definitions
     */
    getDefaultRoles() {
        return {
            "frontend-architect": {
                "description": "JavaScript architecture and core module design",
                "capabilities": ["react", "javascript", "architecture", "modules"],
                "priority": "high"
            },
            "ui-developer": {
                "description": "CSS, HTML, and visual component development",
                "capabilities": ["css", "html", "ui", "components", "styling"],
                "priority": "medium"
            },
            "integration-specialist": {
                "description": "API connections, data flow, and backend integration",
                "capabilities": ["api", "integration", "backend", "data-flow"],
                "priority": "high"
            },
            "qa-specialist": {
                "description": "Testing, validation, and quality assurance",
                "capabilities": ["testing", "validation", "qa", "quality"],
                "priority": "medium"
            },
            "coordination-agent": {
                "description": "Agent coordination and task management",
                "capabilities": ["coordination", "task-management", "routing"],
                "priority": "critical"
            }
        };
    }

    /**
     * Check if an agent role is allowed to use a specific tool
     */
    isToolAllowed(agentRole, toolName) {
        const restrictions = this.restrictions[agentRole];
        if (!restrictions) {
            console.warn(`Unknown agent role: ${agentRole}`);
            return false;
        }

        // Check explicit denials first
        if (this.matchesPattern(toolName, restrictions.denied)) {
            return false;
        }

        // Check explicit allowances
        if (this.matchesPattern(toolName, restrictions.allowed)) {
            return true;
        }

        // Check restricted tools (may require additional validation)
        if (this.matchesPattern(toolName, restrictions.restricted)) {
            return this.validateRestrictedTool(agentRole, toolName);
        }

        // Default deny for unlisted tools
        return false;
    }

    /**
     * Match tool name against patterns (supports wildcards)
     */
    matchesPattern(toolName, patterns) {
        return patterns.some(pattern => {
            if (pattern.endsWith('*')) {
                const prefix = pattern.slice(0, -1);
                return toolName.startsWith(prefix);
            }
            return toolName === pattern;
        });
    }

    /**
     * Validate restricted tools with additional checks
     */
    validateRestrictedTool(agentRole, toolName) {
        // Additional validation logic for restricted tools
        if (toolName.includes('delete') || toolName.includes('remove')) {
            console.warn(`Restricted operation ${toolName} attempted by ${agentRole}`);
            return false;
        }

        // Allow most restricted tools with logging
        console.log(`Restricted tool ${toolName} accessed by ${agentRole}`);
        return true;
    }

    /**
     * Validate tool access for an agent role with detailed security check
     */
    validateToolAccess(agentRole, toolName, context = {}) {
        const restrictions = this.restrictions[agentRole];
        if (!restrictions) {
            console.warn(`Security violation: Unknown agent role: ${agentRole}`);
            return {
                allowed: false,
                reason: 'Unknown agent role',
                security: 'VIOLATION',
                timestamp: new Date().toISOString()
            };
        }

        // Handle role redirects for legacy compatibility
        if (restrictions.redirect) {
            return this.validateToolAccess(restrictions.redirect, toolName, context);
        }

        // Check explicit denials first
        if (this.matchesPattern(toolName, restrictions.denied || [])) {
            return {
                allowed: false,
                reason: 'Tool explicitly denied for this role',
                security: 'DENIED',
                agentRole,
                toolName,
                timestamp: new Date().toISOString()
            };
        }

        // Special handling for ALL_TOOLS access
        if (restrictions.allowed && restrictions.allowed.includes('ALL_TOOLS')) {
            if (restrictions.humanApprovalRequired && !context.humanApproved) {
                return {
                    allowed: false,
                    reason: 'Human approval required for ALL_TOOLS access',
                    security: 'APPROVAL_REQUIRED',
                    agentRole,
                    toolName,
                    timestamp: new Date().toISOString()
                };
            }
            return {
                allowed: true,
                reason: 'ALL_TOOLS access granted',
                security: 'GRANTED',
                agentRole,
                toolName,
                timestamp: new Date().toISOString()
            };
        }

        // Check explicit allowances
        if (this.matchesPattern(toolName, restrictions.allowed || [])) {
            return {
                allowed: true,
                reason: 'Tool explicitly allowed for this role',
                security: 'GRANTED',
                agentRole,
                toolName,
                timestamp: new Date().toISOString()
            };
        }

        // Check restricted tools (may require additional validation)
        if (this.matchesPattern(toolName, restrictions.restricted || [])) {
            const restrictedResult = this.validateRestrictedTool(agentRole, toolName);
            return {
                allowed: restrictedResult,
                reason: restrictedResult ? 'Restricted tool validation passed' : 'Restricted tool validation failed',
                security: restrictedResult ? 'CONDITIONAL' : 'RESTRICTED',
                agentRole,
                toolName,
                timestamp: new Date().toISOString()
            };
        }

        // Default deny for unlisted tools
        return {
            allowed: false,
            reason: 'Tool not in allowed list for this role',
            security: 'DEFAULT_DENY',
            agentRole,
            toolName,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get all tools available for a specific agent role
     */
    getToolsForRole(agentRole) {
        const restrictions = this.restrictions[agentRole];
        if (!restrictions) {
            return {
                allowed: [],
                denied: [],
                restricted: [],
                error: 'Unknown agent role'
            };
        }

        // Handle role redirects for legacy compatibility
        if (restrictions.redirect) {
            return this.getToolsForRole(restrictions.redirect);
        }

        const result = {
            agentRole,
            allowed: restrictions.allowed || [],
            denied: restrictions.denied || [],
            restricted: restrictions.restricted || [],
            humanApprovalRequired: restrictions.humanApprovalRequired || false,
            suggestOnly: restrictions.suggestOnly || false,
            notes: restrictions.notes || '',
            timestamp: new Date().toISOString()
        };

        // Add universal tools to allowed list
        const universalTools = ['Edit', 'Read', 'Bash', 'Glob', 'Grep', 'mcp__memory__*', 'mcp__filesystem__*', 'mcp__task-master-ai__*'];
        result.allowed = [...new Set([...result.allowed, ...universalTools])];

        return result;
    }

    /**
     * Get allowed tools for an agent role
     */
    getAllowedTools(agentRole) {
        const toolsInfo = this.getToolsForRole(agentRole);
        return toolsInfo.allowed || [];
    }

    /**
     * Get denied tools for an agent role
     */
    getDeniedTools(agentRole) {
        const restrictions = this.restrictions[agentRole];
        if (!restrictions) {
            return [];
        }
        return restrictions.denied || [];
    }

    /**
     * Add a new tool restriction
     */
    addToolRestriction(agentRole, toolName, permission) {
        if (!this.restrictions[agentRole]) {
            this.restrictions[agentRole] = { allowed: [], denied: [], restricted: [] };
        }

        const restrictions = this.restrictions[agentRole];
        
        // Remove from other lists
        ['allowed', 'denied', 'restricted'].forEach(list => {
            const index = restrictions[list].indexOf(toolName);
            if (index > -1) {
                restrictions[list].splice(index, 1);
            }
        });

        // Add to appropriate list
        if (restrictions[permission]) {
            restrictions[permission].push(toolName);
        }

        this.saveRestrictions();
    }

    /**
     * Remove a tool restriction
     */
    removeToolRestriction(agentRole, toolName) {
        const restrictions = this.restrictions[agentRole];
        if (!restrictions) return;

        ['allowed', 'denied', 'restricted'].forEach(list => {
            const index = restrictions[list].indexOf(toolName);
            if (index > -1) {
                restrictions[list].splice(index, 1);
            }
        });

        this.saveRestrictions();
    }

    /**
     * Save restrictions to file
     */
    saveRestrictions() {
        try {
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.restrictions, null, 2));
        } catch (error) {
            console.error('Failed to save tool restrictions:', error.message);
        }
    }

    /**
     * Generate tool restriction report
     */
    generateReport(agentRole = null) {
        const roles = agentRole ? [agentRole] : Object.keys(this.restrictions);
        const report = {
            timestamp: new Date().toISOString(),
            roles: {}
        };

        roles.forEach(role => {
            const restrictions = this.restrictions[role];
            const roleInfo = this.agentRoles[role];
            
            report.roles[role] = {
                description: roleInfo?.description || 'No description',
                capabilities: roleInfo?.capabilities || [],
                tools: {
                    allowed: restrictions?.allowed?.length || 0,
                    denied: restrictions?.denied?.length || 0,
                    restricted: restrictions?.restricted?.length || 0
                },
                restrictions: restrictions || {}
            };
        });

        return report;
    }
}

/**
 * CLI utility for managing tool restrictions
 */
function projectRestrictTools() {
    const framework = new ToolRestrictionFramework();
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'check':
            const [role, tool] = args.slice(1);
            const allowed = framework.isToolAllowed(role, tool);
            console.log(`Tool ${tool} ${allowed ? 'ALLOWED' : 'DENIED'} for role ${role}`);
            break;

        case 'list':
            const listRole = args[1];
            if (listRole) {
                const allowed = framework.getAllowedTools(listRole);
                const denied = framework.getDeniedTools(listRole);
                console.log(`\nRole: ${listRole}`);
                console.log(`Allowed: ${allowed.join(', ')}`);
                console.log(`Denied: ${denied.join(', ')}`);
            } else {
                console.log(JSON.stringify(framework.restrictions, null, 2));
            }
            break;

        case 'add':
            const [addRole, addTool, permission] = args.slice(1);
            framework.addToolRestriction(addRole, addTool, permission);
            console.log(`Added ${addTool} to ${permission} list for ${addRole}`);
            break;

        case 'remove':
            const [removeRole, removeTool] = args.slice(1);
            framework.removeToolRestriction(removeRole, removeTool);
            console.log(`Removed ${removeTool} restrictions for ${removeRole}`);
            break;

        case 'report':
            const reportRole = args[1];
            const report = framework.generateReport(reportRole);
            console.log(JSON.stringify(report, null, 2));
            break;

        default:
            console.log(`
Usage: node tool-restriction-framework.js <command> [args]

Commands:
  check <role> <tool>        Check if role can use tool
  list [role]                List restrictions for role (or all)
  add <role> <tool> <perm>   Add tool restriction (allowed/denied/restricted)
  remove <role> <tool>       Remove tool restriction
  report [role]              Generate restriction report

Examples:
  node tool-restriction-framework.js check frontend-architect mcp__docker__start
  node tool-restriction-framework.js list ui-developer
  node tool-restriction-framework.js add qa-specialist mcp__selenium__* allowed
  node tool-restriction-framework.js report
            `);
    }
}

// Export for use as module
module.exports = {
    ToolRestrictionFramework,
    projectRestrictTools
};

// CLI execution
if (require.main === module) {
    projectRestrictTools();
}