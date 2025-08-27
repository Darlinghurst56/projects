#!/usr/bin/env node

/**
 * Agent Telemetry Tracker
 * Minimal tracking integration with existing LiteLLM and TaskMaster infrastructure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AgentTelemetryTracker {
    constructor() {
        this.telemetryPath = '.taskmaster/telemetry';
        this.ensureTelemetryDir();
        this.sessionId = `session-${Date.now()}`;
    }

    ensureTelemetryDir() {
        if (!fs.existsSync(this.telemetryPath)) {
            fs.mkdirSync(this.telemetryPath, { recursive: true });
        }
    }

    /**
     * Track LLM usage for an agent action
     * Integrates with TaskMaster's existing telemetry
     */
    trackLLMUsage(agentId, taskId, action, metadata = {}) {
        const timestamp = new Date().toISOString();
        const usage = {
            timestamp,
            sessionId: this.sessionId,
            agentId,
            taskId,
            action,
            metadata: {
                ...metadata,
                // Add agent-specific context
                agentRole: this.getAgentRole(agentId),
                taskContext: this.getTaskContext(taskId)
            }
        };

        // Log to agent-specific file
        const logFile = path.join(this.telemetryPath, `${agentId}-usage.jsonl`);
        fs.appendFileSync(logFile, JSON.stringify(usage) + '\n');

        // Also log to consolidated file for analysis
        const consolidatedFile = path.join(this.telemetryPath, 'all-agents-usage.jsonl');
        fs.appendFileSync(consolidatedFile, JSON.stringify(usage) + '\n');

        return usage;
    }

    /**
     * Extract telemetry from TaskMaster's built-in telemetry
     * Uses the existing telemetry output we saw in task creation
     */
    parseTaskMasterTelemetry(telemetryOutput) {
        // Extract from the telemetry box format TaskMaster already provides
        const providerMatch = telemetryOutput.match(/Provider:\s*(\w+)/);
        const modelMatch = telemetryOutput.match(/Model:\s*([\w-\.]+)/);
        const tokensMatch = telemetryOutput.match(/Tokens:\s*(\d+)\s*\(Input:\s*(\d+),\s*Output:\s*(\d+)\)/);
        const costMatch = telemetryOutput.match(/Est\. Cost:\s*\$([0-9\.]+)/);

        return {
            provider: providerMatch ? providerMatch[1] : null,
            model: modelMatch ? modelMatch[1] : null,
            totalTokens: tokensMatch ? parseInt(tokensMatch[1]) : 0,
            inputTokens: tokensMatch ? parseInt(tokensMatch[2]) : 0,
            outputTokens: tokensMatch ? parseInt(tokensMatch[3]) : 0,
            estimatedCost: costMatch ? parseFloat(costMatch[1]) : 0
        };
    }

    /**
     * Enhanced executeTaskMasterCommand with automatic telemetry tracking
     */
    executeWithTracking(agentId, command, taskId = null, action = 'command') {
        const startTime = Date.now();
        let result = null;
        let error = null;

        try {
            // Execute the command
            result = execSync(`task-master ${command}`, { 
                encoding: 'utf8',
                timeout: 30000
            });

            // Extract telemetry if present
            const telemetry = this.parseTaskMasterTelemetry(result);
            
            // Track the usage
            this.trackLLMUsage(agentId, taskId, action, {
                command,
                executionTimeMs: Date.now() - startTime,
                success: true,
                ...telemetry
            });

            return result;
        } catch (err) {
            error = err.message;
            
            // Track failed usage
            this.trackLLMUsage(agentId, taskId, action, {
                command,
                executionTimeMs: Date.now() - startTime,
                success: false,
                error: error
            });

            throw err;
        }
    }

    /**
     * Get usage summary for an agent
     */
    getAgentUsageSummary(agentId, days = 7) {
        const logFile = path.join(this.telemetryPath, `${agentId}-usage.jsonl`);
        
        if (!fs.existsSync(logFile)) {
            return { totalCalls: 0, totalTokens: 0, totalCost: 0, actions: [] };
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
        const recentEntries = lines
            .map(line => JSON.parse(line))
            .filter(entry => new Date(entry.timestamp) > cutoffDate);

        const summary = {
            agentId,
            period: `${days} days`,
            totalCalls: recentEntries.length,
            totalTokens: recentEntries.reduce((sum, entry) => sum + (entry.metadata.totalTokens || 0), 0),
            totalCost: recentEntries.reduce((sum, entry) => sum + (entry.metadata.estimatedCost || 0), 0),
            actions: [...new Set(recentEntries.map(entry => entry.action))],
            models: [...new Set(recentEntries.map(entry => entry.metadata.model).filter(Boolean))],
            providers: [...new Set(recentEntries.map(entry => entry.metadata.provider).filter(Boolean))],
            averageResponseTime: recentEntries.reduce((sum, entry) => sum + (entry.metadata.executionTimeMs || 0), 0) / recentEntries.length || 0
        };

        return summary;
    }

    /**
     * Get system-wide usage report
     */
    getSystemUsageReport(days = 7) {
        const agents = ['orchestrator-agent', 'frontend-agent', 'backend-agent', 'devops-agent', 'qa-specialist'];
        const report = {
            period: `${days} days`,
            timestamp: new Date().toISOString(),
            agents: {},
            totals: {
                calls: 0,
                tokens: 0,
                cost: 0
            }
        };

        agents.forEach(agentId => {
            const summary = this.getAgentUsageSummary(agentId, days);
            report.agents[agentId] = summary;
            report.totals.calls += summary.totalCalls;
            report.totals.tokens += summary.totalTokens;
            report.totals.cost += summary.totalCost;
        });

        return report;
    }

    // Helper methods
    getAgentRole(agentId) {
        const roles = {
            'orchestrator-agent': 'coordination',
            'frontend-agent': 'ui-development', 
            'backend-agent': 'api-development',
            'devops-agent': 'infrastructure',
            'qa-specialist': 'testing'
        };
        return roles[agentId] || 'unknown';
    }

    getTaskContext(taskId) {
        try {
            // Get task details from TaskMaster
            const result = execSync(`task-master show ${taskId}`, { encoding: 'utf8' });
            const lines = result.split('\n');
            
            // Extract project info if available
            const projectLine = lines.find(line => line.includes('PROJECT:'));
            return projectLine ? projectLine.trim() : 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }
}

// CLI usage
if (require.main === module) {
    const tracker = new AgentTelemetryTracker();
    const [,, command, agentId, days] = process.argv;

    if (command === 'summary' && agentId) {
        console.log(JSON.stringify(tracker.getAgentUsageSummary(agentId, days ? parseInt(days) : 7), null, 2));
    } else if (command === 'report') {
        console.log(JSON.stringify(tracker.getSystemUsageReport(days ? parseInt(days) : 7), null, 2));
    } else {
        console.log('Usage:');
        console.log('  node agent-telemetry-tracker.js summary <agentId> [days]');
        console.log('  node agent-telemetry-tracker.js report [days]');
    }
}

module.exports = { AgentTelemetryTracker };