#!/usr/bin/env node

/**
 * Simple Telemetry Dashboard
 * View agent LLM usage and costs in terminal
 */

const { AgentTelemetryTracker } = require('./agent-telemetry-tracker.js');
const { execSync } = require('child_process');

class TelemetryDashboard {
    constructor() {
        this.tracker = new AgentTelemetryTracker();
    }

    /**
     * Display system usage in a simple terminal dashboard
     */
    displayDashboard(days = 7) {
        console.clear();
        console.log('╭─────────────────────────────────────────────────────────────╮');
        console.log('│                 🤖 Agent Telemetry Dashboard                 │');
        console.log('╰─────────────────────────────────────────────────────────────╯');
        console.log('');

        const report = this.tracker.getSystemUsageReport(days);
        
        // System totals
        console.log(`📊 System Overview (${days} days):`);
        console.log(`   Total API Calls: ${report.totals.calls}`);
        console.log(`   Total Tokens: ${report.totals.tokens.toLocaleString()}`);
        console.log(`   Total Cost: $${report.totals.cost.toFixed(4)}`);
        console.log('');

        // Agent breakdown
        console.log('🤖 Agent Usage:');
        console.log('┌─────────────────────┬───────┬──────────┬──────────┬───────────┐');
        console.log('│ Agent               │ Calls │ Tokens   │ Cost ($) │ Avg Time  │');
        console.log('├─────────────────────┼───────┼──────────┼──────────┼───────────┤');

        Object.entries(report.agents).forEach(([agentId, summary]) => {
            const name = agentId.replace('-agent', '').replace('-specialist', '');
            const calls = summary.totalCalls.toString();
            const tokens = summary.totalTokens.toLocaleString();
            const cost = summary.totalCost.toFixed(4);
            const avgTime = Math.round(summary.averageResponseTime || 0) + 'ms';

            console.log(`│ ${this.pad(name, 19)} │ ${this.pad(calls, 5)} │ ${this.pad(tokens, 8)} │ ${this.pad(cost, 8)} │ ${this.pad(avgTime, 9)} │`);
        });

        console.log('└─────────────────────┴───────┴──────────┴──────────┴───────────┘');
        console.log('');

        // Model usage
        const allModels = new Set();
        const allProviders = new Set();
        Object.values(report.agents).forEach(agent => {
            if (agent.models) {
                agent.models.forEach(model => allModels.add(model));
            }
            if (agent.providers) {
                agent.providers.forEach(provider => allProviders.add(provider));
            }
        });

        if (allModels.size > 0) {
            console.log('🧠 Models Used: ' + Array.from(allModels).join(', '));
        }
        if (allProviders.size > 0) {
            console.log('🌐 Providers: ' + Array.from(allProviders).join(', '));
        }
        console.log('');

        // Cost analysis
        this.displayCostAnalysis(report);
        
        console.log('');
        console.log('📈 Commands:');
        console.log('   node telemetry-dashboard.js [days]     - This dashboard');
        console.log('   node agent-telemetry-tracker.js report - JSON report');
        console.log('   npm run agents:system-status          - Live agent status');
        console.log('');
    }

    displayCostAnalysis(report) {
        const totalCost = report.totals.cost;
        if (totalCost === 0) {
            console.log('💰 No costs recorded (likely using free models)');
            return;
        }

        console.log('💰 Cost Analysis:');
        
        // Cost per agent
        const costByAgent = Object.entries(report.agents)
            .filter(([, summary]) => summary.totalCost > 0)
            .sort(([, a], [, b]) => b.totalCost - a.totalCost);

        costByAgent.forEach(([agentId, summary]) => {
            const percentage = ((summary.totalCost / totalCost) * 100).toFixed(1);
            const name = agentId.replace('-agent', '').replace('-specialist', '');
            console.log(`   ${name}: $${summary.totalCost.toFixed(4)} (${percentage}%)`);
        });

        // Projected monthly cost
        const dailyCost = totalCost / Math.max(report.period.split(' ')[0], 1);
        const monthlyCost = dailyCost * 30;
        console.log(`   📅 Projected monthly: $${monthlyCost.toFixed(2)}`);
    }

    /**
     * Pad string to specified length
     */
    pad(str, length) {
        return str.toString().padEnd(length).substring(0, length);
    }

    /**
     * Live monitoring mode (updates every 30 seconds)
     */
    startLiveMonitoring() {
        console.log('🔄 Starting live monitoring (Ctrl+C to stop)...\n');
        
        const updateInterval = setInterval(() => {
            this.displayDashboard();
        }, 30000);

        // Initial display
        this.displayDashboard();

        // Handle Ctrl+C
        process.on('SIGINT', () => {
            clearInterval(updateInterval);
            console.log('\n👋 Monitoring stopped');
            process.exit(0);
        });
    }

    /**
     * Export data for external analysis
     */
    exportData(filename = null) {
        const timestamp = new Date().toISOString().split('T')[0];
        const file = filename || `.taskmaster/telemetry/export-${timestamp}.json`;
        
        const data = {
            exportDate: new Date().toISOString(),
            systemReport: this.tracker.getSystemUsageReport(30), // 30 days
            agentDetails: {}
        };

        // Add detailed data for each agent
        ['orchestrator-agent', 'frontend-agent', 'backend-agent', 'devops-agent', 'qa-specialist'].forEach(agentId => {
            data.agentDetails[agentId] = this.tracker.getAgentUsageSummary(agentId, 30);
        });

        require('fs').writeFileSync(file, JSON.stringify(data, null, 2));
        console.log(`📁 Data exported to: ${file}`);
        return file;
    }
}

// CLI usage
if (require.main === module) {
    const dashboard = new TelemetryDashboard();
    const [,, command, arg] = process.argv;

    switch (command) {
        case 'live':
            dashboard.startLiveMonitoring();
            break;
        case 'export':
            dashboard.exportData(arg);
            break;
        default:
            const days = command ? parseInt(command) : 7;
            dashboard.displayDashboard(days);
            break;
    }
}