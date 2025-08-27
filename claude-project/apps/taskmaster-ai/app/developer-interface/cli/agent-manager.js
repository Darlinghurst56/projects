#!/usr/bin/env node

/**
 * TaskMaster AI - Agent Manager CLI
 * Interactive CLI for agent control and monitoring
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
// Use dynamic import for ES module compatibility
let boxen;
try {
    boxen = require('boxen');
    // Test if it's actually a function
    if (typeof boxen !== 'function') {
        throw new Error('boxen is not a function');
    }
} catch (e) {
    // Fallback for ES module imports
    boxen = (text, options = {}) => {
        const padding = ' '.repeat(options.padding || 1);
        const lines = text.split('\n');
        const maxLength = Math.max(...lines.map(line => line.length));
        const border = '─'.repeat(maxLength + (options.padding || 1) * 2);
        
        return `┌${border}┐\n${lines.map(line => `│${padding}${line.padEnd(maxLength)}${padding}│`).join('\n')}\n└${border}┘`;
    };
}
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ora = require('ora');

class AgentManager {
    constructor() {
        this.agentRoles = this.loadAgentRoles();
        this.coordinationWorkflow = this.loadCoordinationWorkflow();
    }

    loadAgentRoles() {
        try {
            const rolesPath = path.join(process.cwd(), '.taskmaster/agents/agent-roles.json');
            return JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
        } catch (error) {
            console.error(chalk.red('❌ Could not load agent roles configuration'));
            return { agents: {} };
        }
    }

    loadCoordinationWorkflow() {
        try {
            const workflowPath = path.join(process.cwd(), '.taskmaster/agents/coordination-workflow.cjs');
            const WorkflowClass = require(workflowPath);
            return new WorkflowClass();
        } catch (error) {
            console.error(chalk.red('❌ Could not load coordination workflow'));
            return null;
        }
    }

    displayWelcome() {
        console.clear();
        console.log(boxen(
            chalk.blue.bold('🤖 Agent Manager') + '\n' +
            chalk.gray('Control and monitor TaskMaster AI agents'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'blue',
                backgroundColor: '#001122'
            }
        ));
        console.log();
    }

    getAgentStatus(agentId) {
        if (!this.coordinationWorkflow) return 'unknown';
        
        const agent = this.coordinationWorkflow.getAgents().find(a => a.id === agentId);
        return agent ? agent.status : 'unregistered';
    }

    getAgentAssignedTasks(agentId) {
        if (!this.coordinationWorkflow) return [];
        
        const agent = this.coordinationWorkflow.getAgents().find(a => a.id === agentId);
        return agent ? agent.assignedTasks : [];
    }

    formatAgentStatus(status) {
        const statusColors = {
            'available': chalk.green('● Available'),
            'busy': chalk.yellow('● Busy'),
            'cooldown': chalk.blue('● Cooldown'),
            'error': chalk.red('● Error'),
            'unregistered': chalk.gray('○ Unregistered'),
            'unknown': chalk.gray('? Unknown')
        };
        return statusColors[status] || chalk.gray('? Unknown');
    }

    displayAgentOverview() {
        console.log(chalk.bold('\n🤖 Agent Overview'));
        console.log('─'.repeat(80));

        const agents = Object.entries(this.agentRoles.agents);
        
        for (const [agentId, agentConfig] of agents) {
            const status = this.getAgentStatus(agentId);
            const assignedTasks = this.getAgentAssignedTasks(agentId);
            const exclusiveFlag = agentConfig.exclusive ? chalk.red(' [EXCLUSIVE]') : '';
            
            console.log(chalk.bold(`\n${agentConfig.name}${exclusiveFlag}`));
            console.log(`  ID: ${chalk.cyan(agentId)}`);
            console.log(`  Status: ${this.formatAgentStatus(status)}`);
            console.log(`  Description: ${chalk.gray(agentConfig.description)}`);
            console.log(`  Capabilities: ${chalk.blue(agentConfig.capabilities.slice(0, 4).join(', '))}${agentConfig.capabilities.length > 4 ? '...' : ''}`);
            
            if (assignedTasks.length > 0) {
                console.log(`  Assigned Tasks: ${chalk.yellow(assignedTasks.join(', '))}`);
            }
            
            if (status === 'cooldown' && this.coordinationWorkflow) {
                const agent = this.coordinationWorkflow.getAgents().find(a => a.id === agentId);
                if (agent && agent.cooldownUntil) {
                    const cooldownEnd = new Date(agent.cooldownUntil);
                    const remainingTime = Math.max(0, Math.ceil((cooldownEnd - new Date()) / 1000));
                    console.log(`  Cooldown: ${chalk.blue(`${remainingTime}s remaining`)}`);
                }
            }
        }
        console.log();
    }

    async selectAgent() {
        const agents = Object.entries(this.agentRoles.agents);
        const agentChoices = agents.map(([agentId, agentConfig]) => {
            const status = this.getAgentStatus(agentId);
            const statusIndicator = this.formatAgentStatus(status);
            
            return {
                name: `${statusIndicator} ${agentConfig.name} - ${agentConfig.description}`,
                value: agentId,
                short: agentConfig.name
            };
        });

        const { selectedAgent } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedAgent',
            message: '🤖 Select an agent:',
            choices: [
                ...agentChoices,
                { type: 'separator' },
                { name: chalk.gray('← Back to main menu'), value: null }
            ]
        }]);

        return selectedAgent;
    }

    async showAgentDetails(agentId) {
        const agentConfig = this.agentRoles.agents[agentId];
        const status = this.getAgentStatus(agentId);
        const assignedTasks = this.getAgentAssignedTasks(agentId);
        
        let registrationInfo = '';
        if (this.coordinationWorkflow) {
            const agent = this.coordinationWorkflow.getAgents().find(a => a.id === agentId);
            if (agent) {
                registrationInfo = `\nRegistered: ${new Date(agent.registeredAt).toLocaleString()}\n` +
                                 `Last Updated: ${new Date(agent.lastUpdated).toLocaleString()}`;
            }
        }

        console.log(boxen(
            chalk.bold.blue(`${agentConfig.name}\n`) +
            chalk.gray(`ID: ${agentId}\n`) +
            `Status: ${this.formatAgentStatus(status)}\n` +
            chalk.gray(`Description: ${agentConfig.description}\n`) +
            chalk.blue(`Capabilities: ${agentConfig.capabilities.join(', ')}\n`) +
            chalk.green(`Tools: ${agentConfig.tools.join(', ')}\n`) +
            (agentConfig.exclusive ? chalk.red('EXCLUSIVE ACCESS AGENT\n') : '') +
            (assignedTasks.length > 0 ? chalk.yellow(`Assigned Tasks: ${assignedTasks.join(', ')}\n`) : '') +
            chalk.gray(registrationInfo),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'blue'
            }
        ));
    }

    async manageAgent(agentId) {
        const agentConfig = this.agentRoles.agents[agentId];
        const status = this.getAgentStatus(agentId);
        
        await this.showAgentDetails(agentId);

        const actions = [
            { name: '📊 View detailed metrics', value: 'metrics' },
            { name: '📝 View activity log', value: 'logs' },
        ];

        if (status === 'unregistered') {
            actions.unshift({ name: '🚀 Register agent', value: 'register' });
        } else {
            if (status === 'available') {
                actions.unshift({ name: '⏸️  Put in cooldown', value: 'cooldown' });
            } else if (status === 'busy') {
                actions.unshift({ name: '⏹️  Force stop tasks', value: 'stop' });
            } else if (status === 'cooldown') {
                actions.unshift({ name: '▶️  Make available', value: 'activate' });
            }
        }

        actions.push(
            { type: 'separator' },
            { name: chalk.gray('← Back to agent list'), value: 'back' }
        );

        const { action } = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            message: `What would you like to do with ${agentConfig.name}?`,
            choices: actions
        }]);

        return action;
    }

    async registerAgent(agentId) {
        const agentConfig = this.agentRoles.agents[agentId];
        const spinner = ora(`Registering ${agentConfig.name}...`).start();

        try {
            if (!this.coordinationWorkflow) {
                throw new Error('Coordination workflow not available');
            }

            const success = this.coordinationWorkflow.registerAgent(
                agentId,
                agentConfig.capabilities,
                'available'
            );

            if (success) {
                spinner.succeed(`${agentConfig.name} registered successfully`);
            } else {
                spinner.fail('Registration failed');
            }
        } catch (error) {
            spinner.fail(`Registration failed: ${error.message}`);
        }
    }

    async changeAgentStatus(agentId, newStatus) {
        const agentConfig = this.agentRoles.agents[agentId];
        const spinner = ora(`Changing ${agentConfig.name} status to ${newStatus}...`).start();

        try {
            if (!this.coordinationWorkflow) {
                throw new Error('Coordination workflow not available');
            }

            const success = this.coordinationWorkflow.updateAgentStatus(agentId, newStatus);

            if (success) {
                spinner.succeed(`${agentConfig.name} status changed to ${newStatus}`);
            } else {
                spinner.fail('Status change failed');
            }
        } catch (error) {
            spinner.fail(`Status change failed: ${error.message}`);
        }
    }

    async viewAgentMetrics(agentId) {
        console.log(chalk.bold(`\n📊 Metrics for ${this.agentRoles.agents[agentId].name}`));
        console.log('─'.repeat(50));

        if (!this.coordinationWorkflow) {
            console.log(chalk.yellow('⚠️  Coordination workflow not available'));
            return;
        }

        const metrics = this.coordinationWorkflow.getAgentMetrics(agentId);
        if (!metrics) {
            console.log(chalk.gray('No metrics available for this agent'));
            return;
        }

        console.log(`Completed Tasks: ${chalk.green(metrics.completedTasks || 0)}`);
        console.log(`Total Time: ${chalk.blue((metrics.totalTime || 0) + 's')}`);
        
        if (metrics.completedTasks > 0) {
            const avgTime = (metrics.totalTime || 0) / metrics.completedTasks;
            console.log(`Average Task Time: ${chalk.cyan(avgTime.toFixed(1) + 's')}`);
        }
    }

    async viewAgentLogs(agentId) {
        console.log(chalk.bold(`\n📝 Activity Log for ${this.agentRoles.agents[agentId].name}`));
        console.log('─'.repeat(50));

        try {
            const logPath = path.join(process.cwd(), '.taskmaster', 'logs', `${agentId}.log`);
            if (fs.existsSync(logPath)) {
                const logs = fs.readFileSync(logPath, 'utf8').split('\n').slice(-20);
                logs.forEach(line => {
                    if (line.trim()) {
                        console.log(chalk.gray(line));
                    }
                });
            } else {
                console.log(chalk.gray('No log file found for this agent'));
            }
        } catch (error) {
            console.log(chalk.red(`Error reading logs: ${error.message}`));
        }
    }

    async showMainMenu() {
        const { action } = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            message: '🎯 What would you like to do?',
            choices: [
                { name: '👀 View agent overview', value: 'overview' },
                { name: '🤖 Manage specific agent', value: 'manage' },
                { name: '📊 View system coordination stats', value: 'stats' },
                { name: '🔄 Refresh agent status', value: 'refresh' },
                { type: 'separator' },
                { name: '🚪 Exit', value: 'exit' }
            ]
        }]);

        return action;
    }

    async showCoordinationStats() {
        console.log(chalk.bold('\n📊 System Coordination Statistics'));
        console.log('─'.repeat(50));

        if (!this.coordinationWorkflow) {
            console.log(chalk.yellow('⚠️  Coordination workflow not available'));
            return;
        }

        const status = this.coordinationWorkflow.getCoordinationStatus();
        const pendingSuggestions = this.coordinationWorkflow.getPendingSuggestions();

        console.log(`Total Agents: ${chalk.green(status.totalAgents)}`);
        console.log(`Available Agents: ${chalk.green(status.availableAgents)}`);
        console.log(`Busy Agents: ${chalk.yellow(status.busyAgents)}`);
        console.log(`Pending Approvals: ${chalk.red(pendingSuggestions.length)}`);

        if (status.lastAssignment) {
            console.log(`\nLast Assignment:`);
            console.log(`  Task: ${chalk.blue(status.lastAssignment.taskId)}`);
            console.log(`  Agent: ${chalk.green(status.lastAssignment.agentId)}`);
            console.log(`  Time: ${chalk.gray(new Date(status.lastAssignment.timestamp).toLocaleString())}`);
        }

        const metrics = this.coordinationWorkflow.getAgentMetrics();
        if (Object.keys(metrics).length > 0) {
            console.log(chalk.bold('\nAgent Performance:'));
            Object.entries(metrics).forEach(([agentId, metric]) => {
                console.log(`  ${agentId}: ${chalk.green(metric.completedTasks)} tasks completed`);
            });
        }
    }

    async run() {
        this.displayWelcome();
        this.displayAgentOverview();

        while (true) {
            try {
                const action = await this.showMainMenu();

                switch (action) {
                    case 'overview':
                        this.displayAgentOverview();
                        break;

                    case 'manage':
                        const agentId = await this.selectAgent();
                        if (!agentId) break;

                        const agentAction = await this.manageAgent(agentId);
                        switch (agentAction) {
                            case 'register':
                                await this.registerAgent(agentId);
                                break;
                            case 'cooldown':
                                await this.changeAgentStatus(agentId, 'cooldown');
                                break;
                            case 'stop':
                                await this.changeAgentStatus(agentId, 'available');
                                break;
                            case 'activate':
                                await this.changeAgentStatus(agentId, 'available');
                                break;
                            case 'metrics':
                                await this.viewAgentMetrics(agentId);
                                break;
                            case 'logs':
                                await this.viewAgentLogs(agentId);
                                break;
                        }
                        break;

                    case 'stats':
                        await this.showCoordinationStats();
                        break;

                    case 'refresh':
                        console.log(chalk.blue('🔄 Refreshing agent status...'));
                        this.coordinationWorkflow = this.loadCoordinationWorkflow();
                        this.displayAgentOverview();
                        break;

                    case 'exit':
                        console.log(chalk.blue('👋 Goodbye!'));
                        process.exit(0);
                }

                // Pause before returning to menu
                await inquirer.prompt([{
                    type: 'input',
                    name: 'continue',
                    message: chalk.gray('Press Enter to continue...')
                }]);

            } catch (error) {
                console.error(chalk.red(`❌ Error: ${error.message}`));
                break;
            }
        }
    }
}

// Run if called directly
if (require.main === module) {
    const manager = new AgentManager();
    manager.run().catch(error => {
        console.error(chalk.red('Fatal error:', error));
        process.exit(1);
    });
}

module.exports = AgentManager;