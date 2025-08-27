#!/usr/bin/env node

/**
 * TaskMaster AI - Workflow Visualizer
 * ASCII-based workflow visualization for terminal
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
const Table = require('cli-table3');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

class WorkflowVisualizer {
    constructor() {
        this.workflows = this.loadWorkflows();
        this.selectedWorkflow = null;
    }

    loadWorkflows() {
        // Predefined workflows
        return {
            'feature-development': {
                name: 'Feature Development',
                description: 'Complete feature implementation workflow',
                steps: [
                    { agent: 'orchestrator-agent', action: 'Analyze Requirements', type: 'decision' },
                    { agent: 'backend-agent', action: 'Create API Endpoints', type: 'development' },
                    { agent: 'frontend-agent', action: 'Build UI Components', type: 'development' },
                    { agent: 'qa-specialist', action: 'Write & Run Tests', type: 'testing' },
                    { agent: 'devops-agent', action: 'Deploy to Staging', type: 'deployment' }
                ]
            },
            'bug-fix': {
                name: 'Bug Fix Workflow',
                description: 'Identify and fix bugs',
                steps: [
                    { agent: 'qa-specialist', action: 'Reproduce Bug', type: 'testing' },
                    { agent: 'orchestrator-agent', action: 'Assign to Developer', type: 'decision' },
                    { agent: 'backend-agent', action: 'Fix Issue', type: 'development' },
                    { agent: 'qa-specialist', action: 'Verify Fix', type: 'testing' }
                ]
            },
            'code-review': {
                name: 'Code Review Process',
                description: 'Automated code review and improvement',
                steps: [
                    { agent: 'orchestrator-agent', action: 'Identify Changes', type: 'decision' },
                    { agent: 'qa-specialist', action: 'Run Static Analysis', type: 'testing' },
                    { agent: 'backend-agent', action: 'Review Code Quality', type: 'review' },
                    { agent: 'frontend-agent', action: 'Check UI Standards', type: 'review' }
                ]
            }
        };
    }

    displayHeader() {
        console.clear();
        console.log(boxen(
            chalk.bold.white('🔄 Workflow Visualizer') + '\n' +
            chalk.gray('Visual workflow builder for multi-agent tasks'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'cyan',
                margin: 1
            }
        ));
    }

    async selectWorkflow() {
        const choices = Object.entries(this.workflows).map(([key, workflow]) => ({
            name: `${workflow.name} - ${chalk.gray(workflow.description)}`,
            value: key
        }));

        choices.push(
            { type: 'separator' },
            { name: chalk.green('+ Create New Workflow'), value: 'new' },
            { name: chalk.gray('← Back'), value: 'back' }
        );

        const { selection } = await inquirer.prompt([{
            type: 'list',
            name: 'selection',
            message: 'Select a workflow to visualize:',
            choices
        }]);

        if (selection === 'new') {
            await this.createNewWorkflow();
        } else if (selection !== 'back') {
            this.selectedWorkflow = this.workflows[selection];
            await this.visualizeWorkflow();
        }
    }

    async visualizeWorkflow() {
        this.displayHeader();
        console.log(chalk.bold(`📋 ${this.selectedWorkflow.name}\n`));

        // ASCII workflow visualization
        this.drawWorkflowDiagram();

        // Step details table
        const table = new Table({
            head: ['Step', 'Agent', 'Action', 'Type', 'Status'],
            style: { head: [], border: ['grey'] }
        });

        this.selectedWorkflow.steps.forEach((step, index) => {
            table.push([
                `${index + 1}`,
                this.getAgentIcon(step.agent) + ' ' + this.getAgentName(step.agent),
                step.action,
                this.getTypeIcon(step.type) + ' ' + step.type,
                chalk.gray('Ready')
            ]);
        });

        console.log('\n' + chalk.bold('📊 Workflow Steps'));
        console.log(table.toString());

        // Actions
        console.log('\n' + chalk.bold('⚡ Actions'));
        console.log('[R] Run Workflow | [S] Simulate | [E] Edit | [B] Back');

        await this.handleWorkflowActions();
    }

    drawWorkflowDiagram() {
        console.log(chalk.bold('🔄 Workflow Diagram'));
        console.log('');

        this.selectedWorkflow.steps.forEach((step, index) => {
            const isLast = index === this.selectedWorkflow.steps.length - 1;
            const agent = this.getAgentIcon(step.agent);
            const arrow = isLast ? '' : '\n    ↓\n';
            
            console.log(`  ${agent} ${chalk.cyan(this.getAgentName(step.agent))}`);
            console.log(`  ${chalk.gray('└─')} ${step.action}`);
            console.log(arrow);
        });
    }

    async createNewWorkflow() {
        const { name } = await inquirer.prompt([{
            type: 'input',
            name: 'name',
            message: 'Workflow name:',
            validate: input => input.length > 0
        }]);

        const { description } = await inquirer.prompt([{
            type: 'input',
            name: 'description',
            message: 'Description:',
            default: 'Custom workflow'
        }]);

        const steps = [];
        let addMore = true;

        while (addMore) {
            console.log('\n' + chalk.bold(`Step ${steps.length + 1}`));
            
            const { agent } = await inquirer.prompt([{
                type: 'list',
                name: 'agent',
                message: 'Select agent:',
                choices: [
                    { name: '🎯 Orchestrator', value: 'orchestrator-agent' },
                    { name: '🎨 Frontend', value: 'frontend-agent' },
                    { name: '🔧 Backend', value: 'backend-agent' },
                    { name: '🚀 DevOps', value: 'devops-agent' },
                    { name: '🔍 QA Specialist', value: 'qa-specialist' }
                ]
            }]);

            const { action } = await inquirer.prompt([{
                type: 'input',
                name: 'action',
                message: 'Action description:',
                validate: input => input.length > 0
            }]);

            const { type } = await inquirer.prompt([{
                type: 'list',
                name: 'type',
                message: 'Action type:',
                choices: ['decision', 'development', 'testing', 'deployment', 'review']
            }]);

            steps.push({ agent, action, type });

            const { more } = await inquirer.prompt([{
                type: 'confirm',
                name: 'more',
                message: 'Add another step?',
                default: true
            }]);

            addMore = more;
        }

        // Save workflow
        const workflowKey = name.toLowerCase().replace(/\s+/g, '-');
        this.workflows[workflowKey] = { name, description, steps };
        
        console.log(chalk.green('\n✓ Workflow created successfully!'));
        
        this.selectedWorkflow = this.workflows[workflowKey];
        await this.visualizeWorkflow();
    }

    async simulateWorkflow() {
        console.log('\n' + chalk.bold('🎬 Simulating Workflow...'));
        
        for (let i = 0; i < this.selectedWorkflow.steps.length; i++) {
            const step = this.selectedWorkflow.steps[i];
            const agent = this.getAgentName(step.agent);
            
            console.log(`\n${chalk.gray(`[Step ${i + 1}]`)} ${this.getAgentIcon(step.agent)} ${chalk.cyan(agent)}`);
            console.log(`${chalk.gray('├─')} Action: ${step.action}`);
            console.log(`${chalk.gray('├─')} Status: ${chalk.yellow('Running...')}`);
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log(`${chalk.gray('└─')} Status: ${chalk.green('✓ Complete')}`);
        }
        
        console.log('\n' + chalk.green.bold('✓ Workflow simulation complete!'));
        console.log(chalk.gray('Press any key to continue...'));
        
        await new Promise(resolve => {
            process.stdin.once('data', resolve);
        });
    }

    async handleWorkflowActions() {
        const readline = require('readline');
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);

        return new Promise((resolve) => {
            const handler = async (str, key) => {
                if (key.ctrl && key.name === 'c') {
                    process.exit();
                }

                switch(key.name) {
                    case 'r':
                        console.log('\n' + chalk.yellow('Running workflow...'));
                        // Would trigger actual workflow execution
                        await new Promise(r => setTimeout(r, 2000));
                        console.log(chalk.green('✓ Workflow started!'));
                        break;
                    case 's':
                        await this.simulateWorkflow();
                        await this.visualizeWorkflow();
                        break;
                    case 'e':
                        console.log('\n' + chalk.yellow('Edit mode not yet implemented'));
                        break;
                    case 'b':
                    case 'escape':
                        process.stdin.removeListener('keypress', handler);
                        resolve();
                        return;
                }
            };

            process.stdin.on('keypress', handler);
        });
    }

    getAgentIcon(agentId) {
        const icons = {
            'orchestrator-agent': '🎯',
            'frontend-agent': '🎨',
            'backend-agent': '🔧',
            'devops-agent': '🚀',
            'qa-specialist': '🔍'
        };
        return icons[agentId] || '🤖';
    }

    getAgentName(agentId) {
        const names = {
            'orchestrator-agent': 'Orchestrator',
            'frontend-agent': 'Frontend',
            'backend-agent': 'Backend',
            'devops-agent': 'DevOps',
            'qa-specialist': 'QA Specialist'
        };
        return names[agentId] || agentId;
    }

    getTypeIcon(type) {
        const icons = {
            'decision': '🤔',
            'development': '💻',
            'testing': '🧪',
            'deployment': '🚀',
            'review': '👀'
        };
        return icons[type] || '📋';
    }

    async run() {
        while (true) {
            this.displayHeader();
            await this.selectWorkflow();
            
            // Check if user wants to exit
            const { exit } = await inquirer.prompt([{
                type: 'confirm',
                name: 'exit',
                message: 'Exit workflow visualizer?',
                default: false
            }]);

            if (exit) break;
        }
    }
}

// CLI entry point
if (require.main === module) {
    const visualizer = new WorkflowVisualizer();
    visualizer.run()
        .then(() => {
            console.log(chalk.gray('\nGoodbye!'));
            process.exit(0);
        })
        .catch(console.error);
}

module.exports = WorkflowVisualizer;