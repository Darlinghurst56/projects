#!/usr/bin/env node

/**
 * TaskMaster AI - Main Dashboard
 * Central hub for all agent management and workflow control
 */

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
const inquirer = require('inquirer');
const { execSync } = require('child_process');

class MainDashboard {
    constructor() {
        this.isRunning = true;
    }

    displayWelcome() {
        console.clear();
        console.log(boxen(
            chalk.bold.cyan('🤖 TaskMaster AI - Control Center') + '\n' +
            chalk.gray('Single-user multi-agent coordination system'),
            {
                padding: 1,
                borderStyle: 'double',
                borderColor: 'cyan',
                margin: 1
            }
        ));
    }

    async showMainMenu() {
        const choices = [
            { name: '📊 Agent Overview', value: 'overview' },
            { name: '🤖 Agent Details', value: 'details' },
            { name: '🔄 Workflow Builder', value: 'workflow' },
            { name: '📋 Task Router', value: 'task-router' },
            { name: '⚙️  Agent Manager', value: 'agent-manager' },
            { type: 'separator' },
            { name: '🚀 Start All Agents', value: 'start-all' },
            { name: '🛑 Stop All Agents', value: 'stop-all' },
            { name: '📈 System Status', value: 'status' },
            { type: 'separator' },
            { name: chalk.gray('Exit'), value: 'exit' }
        ];

        const { selection } = await inquirer.prompt([{
            type: 'list',
            name: 'selection',
            message: 'Select an option:',
            choices
        }]);

        return selection;
    }

    async handleSelection(selection) {
        switch (selection) {
            case 'overview':
                console.log('\n' + chalk.yellow('Opening Agent Overview...'));
                execSync('node agent-overview.js', { stdio: 'inherit' });
                break;

            case 'details':
                const agentChoices = [
                    { name: '🎯 Orchestrator Agent', value: 'orchestrator-agent' },
                    { name: '🎨 Frontend Agent', value: 'frontend-agent' },
                    { name: '🔧 Backend Agent', value: 'backend-agent' },
                    { name: '🚀 DevOps Agent', value: 'devops-agent' },
                    { name: '🔍 QA Specialist', value: 'qa-specialist' }
                ];

                const { selectedAgent } = await inquirer.prompt([{
                    type: 'list',
                    name: 'selectedAgent',
                    message: 'Select agent to view details:',
                    choices: agentChoices
                }]);

                console.log('\n' + chalk.yellow(`Opening details for ${selectedAgent}...`));
                execSync(`node agent-details.js ${selectedAgent}`, { stdio: 'inherit' });
                break;

            case 'workflow':
                console.log('\n' + chalk.yellow('Opening Workflow Builder...'));
                execSync('node workflow-visualizer.js', { stdio: 'inherit' });
                break;

            case 'task-router':
                console.log('\n' + chalk.yellow('Opening Task Router...'));
                execSync('node human-interface/cli/task-router.js', { stdio: 'inherit' });
                break;

            case 'agent-manager':
                console.log('\n' + chalk.yellow('Opening Agent Manager...'));
                execSync('node human-interface/cli/agent-manager.js', { stdio: 'inherit' });
                break;

            case 'start-all':
                console.log('\n' + chalk.yellow('Starting all agents...'));
                execSync('node simple-agent-manager.js start-all', { stdio: 'inherit' });
                await this.waitForKeypress();
                break;

            case 'stop-all':
                console.log('\n' + chalk.yellow('Stopping all agents...'));
                execSync('node simple-agent-manager.js stop-all', { stdio: 'inherit' });
                await this.waitForKeypress();
                break;

            case 'status':
                console.log('\n' + chalk.yellow('System Status:'));
                execSync('node simple-agent-manager.js status', { stdio: 'inherit' });
                await this.waitForKeypress();
                break;

            case 'exit':
                this.isRunning = false;
                console.log('\n' + chalk.gray('Goodbye!'));
                break;

            default:
                console.log('\n' + chalk.red('Invalid selection'));
                await this.waitForKeypress();
        }
    }

    async waitForKeypress() {
        console.log('\n' + chalk.gray('Press any key to continue...'));
        await new Promise(resolve => {
            process.stdin.once('data', resolve);
        });
    }

    async run() {
        while (this.isRunning) {
            this.displayWelcome();
            
            try {
                const selection = await this.showMainMenu();
                await this.handleSelection(selection);
            } catch (error) {
                console.error('\n' + chalk.red('Error:'), error.message);
                await this.waitForKeypress();
            }
        }
    }
}

// CLI entry point
if (require.main === module) {
    const dashboard = new MainDashboard();
    dashboard.run().catch(console.error);
}

module.exports = MainDashboard;