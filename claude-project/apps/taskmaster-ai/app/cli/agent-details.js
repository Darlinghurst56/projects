#!/usr/bin/env node

/**
 * TaskMaster AI - Agent Details View
 * Terminal interface for detailed agent information
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
const { execSync } = require('child_process');

class AgentDetailsView {
    constructor(agentId) {
        this.agentId = agentId;
        this.agentConfig = this.loadAgentConfig();
        this.currentTab = 'overview';
    }

    loadAgentConfig() {
        const agents = {
            'orchestrator-agent': {
                name: 'Orchestrator Agent',
                role: 'Project Coordinator',
                description: 'Manages task distribution and agent coordination',
                capabilities: ['coordination', 'human-interface', 'task-routing'],
                tools: ['task-master', 'all MCP tools'],
                autonomyLevel: 'ask-for-approval'
            },
            'frontend-agent': {
                name: 'Frontend Agent',
                role: 'UI/React Developer',
                description: 'Handles frontend development tasks',
                capabilities: ['react', 'typescript', 'css', 'ui-components'],
                tools: ['mcp__vite__*', 'mcp__tailwindcss__*', 'mcp__playwright__*'],
                autonomyLevel: 'act-autonomously'
            },
            'backend-agent': {
                name: 'Backend Agent',
                role: 'API/Server Developer',
                description: 'Manages backend and API development',
                capabilities: ['nodejs', 'api', 'database', 'server-logic'],
                tools: ['mcp__filesystem__*', 'mcp__github__*', 'mcp__fetch__*'],
                autonomyLevel: 'act-autonomously'
            },
            'devops-agent': {
                name: 'DevOps Agent',
                role: 'Infrastructure/Deployment',
                description: 'Handles deployment and infrastructure tasks',
                capabilities: ['deployment', 'docker', 'ci-cd', 'infrastructure'],
                tools: ['mcp__docker__*', 'mcp__filesystem__*'],
                autonomyLevel: 'ask-for-approval',
                exclusive: true
            },
            'qa-specialist': {
                name: 'QA Specialist',
                role: 'Testing/Quality Assurance',
                description: 'Performs testing and quality checks',
                capabilities: ['testing', 'validation', 'accessibility'],
                tools: ['mcp__playwright__*', 'mcp__accessibility-testing__*'],
                autonomyLevel: 'act-autonomously'
            }
        };
        return agents[this.agentId] || {};
    }

    displayHeader() {
        console.clear();
        const exclusiveTag = this.agentConfig.exclusive ? chalk.red(' [EXCLUSIVE]') : '';
        console.log(boxen(
            chalk.bold.white(`🤖 ${this.agentConfig.name}${exclusiveTag}`) + '\n' +
            chalk.gray(this.agentConfig.description),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'cyan',
                margin: 1
            }
        ));
    }

    displayTabs() {
        const tabs = ['overview', 'activity', 'tools', 'config'];
        const tabDisplay = tabs.map(tab => 
            tab === this.currentTab 
                ? chalk.bgCyan.black(` ${tab.toUpperCase()} `)
                : chalk.gray(` ${tab} `)
        ).join(' ');
        
        console.log('\n' + tabDisplay + '\n');
    }

    displayOverviewTab() {
        // Agent Status
        const status = this.getAgentStatus();
        const statusTable = new Table({
            style: { border: ['grey'] }
        });

        statusTable.push(
            [chalk.bold('Status'), status.running ? chalk.green('● Running') : chalk.gray('○ Stopped')],
            [chalk.bold('PID'), status.pid || 'N/A'],
            [chalk.bold('Uptime'), status.uptime || 'N/A'],
            [chalk.bold('Memory'), status.memory || 'N/A'],
            [chalk.bold('CPU'), status.cpu || 'N/A']
        );

        console.log(chalk.bold('📊 Agent Status'));
        console.log(statusTable.toString());

        // Current Task
        const task = this.getCurrentTask();
        if (task) {
            console.log('\n' + chalk.bold('📋 Current Task'));
            console.log(boxen(
                `ID: #${task.id}\n` +
                `Title: ${task.title}\n` +
                `Status: ${task.status}\n` +
                `Priority: ${task.priority}`,
                { padding: 1, borderStyle: 'single' }
            ));
        }

        // Quick Actions
        console.log('\n' + chalk.bold('⚡ Quick Actions'));
        console.log('[P] Pause | [S] Stop | [R] Restart | [L] View Logs');
    }

    displayActivityTab() {
        console.log(chalk.bold('📜 Recent Activity Log'));
        
        const activityTable = new Table({
            head: ['Time', 'Action', 'Status', 'Details'],
            style: { head: [], border: ['grey'] }
        });

        // Mock activity data (would read from actual logs)
        const activities = this.getRecentActivities();
        activities.forEach(activity => {
            activityTable.push([
                chalk.gray(activity.time),
                activity.action,
                this.getStatusIcon(activity.status),
                activity.details.substring(0, 40) + '...'
            ]);
        });

        console.log(activityTable.toString());
    }

    displayToolsTab() {
        console.log(chalk.bold('🛠️  Assigned Tools & Capabilities'));
        
        const toolsTable = new Table({
            head: ['Tool/Capability', 'Type', 'Status'],
            style: { head: [], border: ['grey'] }
        });

        // Capabilities
        this.agentConfig.capabilities?.forEach(cap => {
            toolsTable.push([
                chalk.cyan(cap),
                'Capability',
                chalk.green('✓ Active')
            ]);
        });

        // Tools
        this.agentConfig.tools?.forEach(tool => {
            toolsTable.push([
                chalk.yellow(tool),
                'MCP Tool',
                chalk.green('✓ Enabled')
            ]);
        });

        console.log(toolsTable.toString());
    }

    displayConfigTab() {
        console.log(chalk.bold('⚙️  Agent Configuration'));
        
        const configTable = new Table({
            style: { border: ['grey'] }
        });

        configTable.push(
            [chalk.bold('Name'), this.agentConfig.name],
            [chalk.bold('Role'), this.agentConfig.role],
            [chalk.bold('Autonomy Level'), this.formatAutonomyLevel(this.agentConfig.autonomyLevel)],
            [chalk.bold('Exclusive Operations'), this.agentConfig.exclusive ? chalk.red('Yes') : 'No'],
            [chalk.bold('Script Path'), `${this.agentId}.js`]
        );

        console.log(configTable.toString());

        // File Access Permissions
        console.log('\n' + chalk.bold('📁 File Access Permissions'));
        console.log('Read: ' + chalk.green('/mnt/d/Projects/**'));
        console.log('Write: ' + chalk.yellow('/mnt/d/Projects/y/claude-project/**'));
        console.log('Restricted: ' + chalk.red('System directories'));
    }

    formatAutonomyLevel(level) {
        const levels = {
            'suggest-only': chalk.blue('Suggest Only'),
            'ask-for-approval': chalk.yellow('Ask for Approval'),
            'act-autonomously': chalk.green('Act Autonomously')
        };
        return levels[level] || level;
    }

    getStatusIcon(status) {
        const icons = {
            'success': chalk.green('✓'),
            'failure': chalk.red('✗'),
            'pending': chalk.yellow('⋯'),
            'running': chalk.blue('►')
        };
        return icons[status] || status;
    }

    getAgentStatus() {
        try {
            const result = execSync(`ps aux | grep "${this.agentId}.js" | grep -v grep`, { encoding: 'utf8' });
            if (result.trim()) {
                const parts = result.trim().split(/\s+/);
                return {
                    running: true,
                    pid: parts[1],
                    cpu: parts[2] + '%',
                    memory: parts[5],
                    uptime: execSync(`ps -o etime= -p ${parts[1]}`, { encoding: 'utf8' }).trim()
                };
            }
        } catch (error) {
            // Process not found
        }
        return { running: false };
    }

    getCurrentTask() {
        try {
            const coordPath = path.join(process.cwd(), '.taskmaster/agents/coordination.json');
            if (fs.existsSync(coordPath)) {
                const coordination = JSON.parse(fs.readFileSync(coordPath, 'utf8'));
                const agent = coordination.agents?.find(a => a.id === this.agentId);
                if (agent?.assignedTasks?.length > 0) {
                    const taskId = agent.assignedTasks[0];
                    const tasksPath = path.join(process.cwd(), '.taskmaster/tasks/tasks.json');
                    if (fs.existsSync(tasksPath)) {
                        const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
                        return tasks.tasks?.find(t => t.id == taskId);
                    }
                }
            }
        } catch (error) {
            // Silent fail
        }
        return null;
    }

    getRecentActivities() {
        // Mock data - would read from actual logs
        return [
            { time: '16:45:22', action: 'Task Started', status: 'success', details: 'Started working on task #25' },
            { time: '16:44:18', action: 'File Created', status: 'success', details: 'Created test-component.tsx' },
            { time: '16:43:05', action: 'Tool Execution', status: 'running', details: 'Running playwright tests' },
            { time: '16:42:00', action: 'Task Fetched', status: 'success', details: 'Retrieved new task from queue' },
            { time: '16:40:30', action: 'Heartbeat', status: 'success', details: 'Sent status update to coordinator' }
        ];
    }

    async handleInput() {
        const readline = require('readline');
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);

        process.stdin.on('keypress', (str, key) => {
            if (key.ctrl && key.name === 'c') {
                process.exit();
            }

            switch(key.name) {
                case 'tab':
                    // Cycle through tabs
                    const tabs = ['overview', 'activity', 'tools', 'config'];
                    const currentIndex = tabs.indexOf(this.currentTab);
                    this.currentTab = tabs[(currentIndex + 1) % tabs.length];
                    this.display();
                    break;
                case 'q':
                case 'escape':
                    process.exit();
                    break;
                case 'p':
                    console.log('\nPausing agent...');
                    break;
                case 's':
                    console.log('\nStopping agent...');
                    execSync(`node simple-agent-manager.js stop ${this.agentId}`);
                    break;
                case 'r':
                    console.log('\nRestarting agent...');
                    execSync(`node simple-agent-manager.js reload ${this.agentId}`);
                    break;
                case 'l':
                    console.log('\nOpening logs...');
                    break;
            }
        });
    }

    display() {
        this.displayHeader();
        this.displayTabs();

        switch(this.currentTab) {
            case 'overview':
                this.displayOverviewTab();
                break;
            case 'activity':
                this.displayActivityTab();
                break;
            case 'tools':
                this.displayToolsTab();
                break;
            case 'config':
                this.displayConfigTab();
                break;
        }

        console.log('\n' + chalk.gray('Press [Tab] to switch tabs | [Q] to quit'));
    }

    async run() {
        await this.handleInput();
        this.display();
    }
}

// CLI entry point
if (require.main === module) {
    const agentId = process.argv[2];
    if (!agentId) {
        console.error('Usage: node agent-details.js <agent-id>');
        console.error('Example: node agent-details.js backend-agent');
        process.exit(1);
    }

    const detailsView = new AgentDetailsView(agentId);
    detailsView.run().catch(console.error);
}

module.exports = AgentDetailsView;