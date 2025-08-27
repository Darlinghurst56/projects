#!/usr/bin/env node

/**
 * TaskMaster AI - Developer Task Router
 * Interactive CLI for task assignment and agent coordination
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

class DeveloperTaskRouter {
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
            chalk.blue.bold('🤖 TaskMaster AI - Developer Interface') + '\n' +
            chalk.gray('Interactive task routing and agent coordination'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'blue',
                backgroundColor: '#001122'
            }
        ));
        console.log();
    }

    async getAvailableTasks() {
        try {
            const result = execSync('task-master list --format=json', { 
                encoding: 'utf8',
                timeout: 10000 
            });
            return JSON.parse(result || '[]');
        } catch (error) {
            console.log(chalk.yellow('⚠️  Could not fetch tasks from TaskMaster CLI. Using mock data.'));
            return [
                { 
                    id: '2.1', 
                    title: 'Create responsive navigation component with React and Tailwind CSS',
                    status: 'pending', 
                    priority: 'high',
                    project: 'PROJECT: House AI - Family Home Page | SUBPROJECT: Home Page UI System',
                    keywords: ['frontend', 'react', 'component', 'tailwind', 'responsive']
                },
                { 
                    id: '3.2', 
                    title: 'Implement OAuth 2.0 authentication system with JWT tokens',
                    status: 'pending', 
                    priority: 'high',
                    project: 'PROJECT: House AI - Family Home Page | SUBPROJECT: Authentication System',
                    keywords: ['backend', 'api', 'auth', 'database', 'nodejs']
                },
                { 
                    id: '4.1', 
                    title: 'Set up Docker containerization for production deployment',
                    status: 'pending', 
                    priority: 'medium',
                    project: 'PROJECT: TaskMaster Agent System | SUBPROJECT: Agent Coordination',
                    keywords: ['devops', 'docker', 'deploy', 'infrastructure'],
                    exclusive: true
                },
                { 
                    id: '5.3', 
                    title: 'Write accessibility tests for navigation components',
                    status: 'pending', 
                    priority: 'low',
                    project: 'PROJECT: House AI - Family Home Page | SUBPROJECT: Home Page UI System',
                    keywords: ['qa', 'test', 'accessibility', 'validate']
                }
            ];
        }
    }

    async displaySystemStatus() {
        console.log(chalk.bold('\n📊 System Status'));
        console.log('─'.repeat(50));
        
        const agents = Object.keys(this.agentRoles.agents);
        const availableAgents = this.coordinationWorkflow ? 
            this.coordinationWorkflow.getAvailableAgents().length : 
            agents.length;

        console.log(`${chalk.green('●')} Total Agents: ${agents.length}`);
        console.log(`${chalk.green('●')} Available Agents: ${availableAgents}`);
        console.log(`${chalk.yellow('●')} Busy Agents: ${agents.length - availableAgents}`);
        
        if (this.coordinationWorkflow) {
            const pendingSuggestions = this.coordinationWorkflow.getPendingSuggestions();
            if (pendingSuggestions.length > 0) {
                console.log(`${chalk.red('●')} Pending Approvals: ${pendingSuggestions.length}`);
            }
        }
        console.log();
    }

    formatAgentChoice(agentId, agent) {
        const status = this.coordinationWorkflow ? 
            this.coordinationWorkflow.getAgents().find(a => a.id === agentId)?.status || 'unknown' :
            'available';
        
        const statusColor = {
            'available': chalk.green,
            'busy': chalk.yellow,
            'cooldown': chalk.blue,
            'error': chalk.red
        }[status] || chalk.gray;

        const exclusiveFlag = agent.exclusive ? chalk.red(' [EXCLUSIVE]') : '';
        
        return {
            name: `${statusColor('●')} ${agent.name}${exclusiveFlag} - ${agent.description}`,
            value: agentId,
            short: agent.name
        };
    }

    async selectTask() {
        const tasks = await this.getAvailableTasks();
        
        if (tasks.length === 0) {
            console.log(chalk.yellow('📭 No pending tasks found.'));
            return null;
        }

        const taskChoices = tasks.map(task => ({
            name: `Task ${task.id} - ${task.title} ${chalk.gray(`(${task.priority})`)}${task.exclusive ? chalk.red(' [EXCLUSIVE]') : ''}\n  ${chalk.blue(task.project || '')}`,
            value: task,
            short: `Task ${task.id}`
        }));

        const { selectedTask } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedTask',
            message: '📋 Select a task to route:',
            choices: [
                ...taskChoices,
                { type: 'separator' },
                { name: chalk.gray('← Back to main menu'), value: null }
            ],
            pageSize: 10
        }]);

        return selectedTask;
    }

    async selectAgent(task) {
        const agents = this.agentRoles.agents;
        const agentChoices = Object.entries(agents).map(([id, agent]) => 
            this.formatAgentChoice(id, agent)
        );

        // Add capability matching hints
        console.log(boxen(
            chalk.blue(`Task: ${task.title}\n`) +
            chalk.gray(`ID: ${task.id} | Priority: ${task.priority}`),
            { padding: 1, borderStyle: 'round' }
        ));

        const { selectedAgent } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedAgent',
            message: '🤖 Select agent for this task:',
            choices: [
                ...agentChoices,
                { type: 'separator' },
                { name: chalk.gray('← Back to task selection'), value: null }
            ]
        }]);

        return selectedAgent;
    }

    async getAssignmentReasoning(task, agentId) {
        const agent = this.agentRoles.agents[agentId];
        
        const { reasoning } = await inquirer.prompt([{
            type: 'input',
            name: 'reasoning',
            message: '💭 ORCHESTRATOR reasoning for this assignment:',
            default: `ORCHESTRATOR: Task matches ${agentId} capabilities (${agent.capabilities.slice(0, 3).join(', ')}). Keywords: ${task.keywords ? task.keywords.slice(0, 3).join(', ') : 'task-related'}`
        }]);

        return reasoning;
    }

    async confirmAssignment(task, agentId, reasoning) {
        const agent = this.agentRoles.agents[agentId];
        
        console.log(boxen(
            chalk.bold('🤖 ORCHESTRATOR Assignment Summary\n') +
            chalk.blue(`Task ${task.id}: ${task.title}\n`) +
            chalk.cyan(`${task.project || ''}\n`) +
            chalk.green(`Target Agent: ${agent.name} (${agentId})\n`) +
            chalk.yellow(`Workspace: task-master use-tag ${agentId}\n`) +
            chalk.gray(`Reasoning: ${reasoning}`) +
            (task.exclusive ? chalk.red('\n⚠️  EXCLUSIVE ASSIGNMENT') : ''),
            { padding: 1, borderStyle: 'double', borderColor: 'green' }
        ));

        const { confirmed } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirmed',
            message: '✅ Proceed with this assignment?',
            default: true
        }]);

        return confirmed;
    }

    async executeAssignment(task, agentId, reasoning) {
        const spinner = require('ora')('Assigning task to agent...').start();
        
        try {
            if (this.coordinationWorkflow) {
                // Use human approval workflow
                const suggestion = this.coordinationWorkflow.suggestTaskAssignment(task, agentId, reasoning);
                spinner.succeed('Task assignment suggested to orchestrator');
                
                console.log(boxen(
                    chalk.yellow('🤖 ORCHESTRATOR SUGGESTION\n') +
                    chalk.blue(`Suggestion ID: ${suggestion.id}\n`) +
                    chalk.gray('Use human approval interface to approve/reject'),
                    { padding: 1, borderStyle: 'round', borderColor: 'yellow' }
                ));
            } else {
                // Direct assignment fallback
                execSync(`task-master set-status --id=${task.id} --status=in-progress`, { stdio: 'pipe' });
                spinner.succeed('Task assigned directly');
            }
        } catch (error) {
            spinner.fail(`Assignment failed: ${error.message}`);
        }
    }

    async handlePendingApprovals() {
        if (!this.coordinationWorkflow) {
            console.log(chalk.yellow('⚠️  Coordination workflow not available'));
            return;
        }

        const pendingSuggestions = this.coordinationWorkflow.getPendingSuggestions();
        
        if (pendingSuggestions.length === 0) {
            console.log(chalk.green('✅ No pending approvals'));
            return;
        }

        console.log(chalk.bold('\n🔔 Pending Approvals'));
        console.log('─'.repeat(50));

        for (const suggestion of pendingSuggestions) {
            console.log(boxen(
                chalk.blue(`Task: ${suggestion.taskId}\n`) +
                chalk.green(`Target Agent: ${suggestion.targetAgent}\n`) +
                chalk.gray(`Reasoning: ${suggestion.reasoning}\n`) +
                chalk.yellow(`Suggested: ${new Date(suggestion.timestamp).toLocaleString()}`),
                { padding: 1, borderStyle: 'round' }
            ));

            const { action } = await inquirer.prompt([{
                type: 'list',
                name: 'action',
                message: `What would you like to do with suggestion ${suggestion.id}?`,
                choices: [
                    { name: '✅ Approve', value: 'approve' },
                    { name: '❌ Reject', value: 'reject' },
                    { name: '⏭️  Skip for now', value: 'skip' }
                ]
            }]);

            if (action === 'approve') {
                const { comment } = await inquirer.prompt([{
                    type: 'input',
                    name: 'comment',
                    message: 'Add approval comment (optional):'
                }]);

                const result = this.coordinationWorkflow.approveSuggestion(suggestion.id, comment);
                console.log(result.success ? 
                    chalk.green('✅ Suggestion approved and task assigned') :
                    chalk.red(`❌ Approval failed: ${result.error}`)
                );
            } else if (action === 'reject') {
                const { reason } = await inquirer.prompt([{
                    type: 'input',
                    name: 'reason',
                    message: 'Reason for rejection:',
                    validate: input => input.length > 0 || 'Please provide a reason'
                }]);

                const result = this.coordinationWorkflow.rejectSuggestion(suggestion.id, reason);
                console.log(result.success ? 
                    chalk.yellow('❌ Suggestion rejected') :
                    chalk.red(`❌ Rejection failed: ${result.error}`)
                );
            }
        }
    }

    async showMainMenu() {
        const { action } = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            message: '🎯 What would you like to do?',
            choices: [
                { name: '📋 Route a task to an agent', value: 'route' },
                { name: '🔔 Review pending approvals', value: 'approvals' },
                { name: '📊 View system status', value: 'status' },
                { name: '🤖 Manage agents', value: 'agents' },
                { type: 'separator' },
                { name: '🚪 Exit', value: 'exit' }
            ]
        }]);

        return action;
    }

    async run() {
        this.displayWelcome();
        await this.displaySystemStatus();

        while (true) {
            try {
                const action = await this.showMainMenu();

                switch (action) {
                    case 'route':
                        const task = await this.selectTask();
                        if (!task) break;

                        const agentId = await this.selectAgent(task);
                        if (!agentId) break;

                        const reasoning = await this.getAssignmentReasoning(task, agentId);
                        
                        const confirmed = await this.confirmAssignment(task, agentId, reasoning);
                        if (confirmed) {
                            await this.executeAssignment(task, agentId, reasoning);
                        }
                        break;

                    case 'approvals':
                        await this.handlePendingApprovals();
                        break;

                    case 'status':
                        await this.displaySystemStatus();
                        break;

                    case 'agents':
                        console.log(chalk.yellow('🚧 Agent management coming soon...'));
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
    const router = new DeveloperTaskRouter();
    router.run().catch(error => {
        console.error(chalk.red('Fatal error:', error));
        process.exit(1);
    });
}

module.exports = DeveloperTaskRouter;