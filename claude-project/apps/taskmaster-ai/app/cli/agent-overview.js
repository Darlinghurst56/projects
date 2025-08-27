#!/usr/bin/env node

/**
 * TaskMaster AI - Simple Agent Overview
 * Single-user terminal interface for monitoring all agents
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
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AgentOverview {
    constructor() {
        this.refreshInterval = 5000; // 5 seconds
        this.agents = this.loadAgentDefinitions();
        this.isRunning = true;
    }

    loadAgentDefinitions() {
        // Define all possible agents (can add more here)
        return {
            'orchestrator-agent': {
                name: 'Orchestrator',
                role: 'Project Coordinator',
                color: chalk.blue,
                icon: '🎯'
            },
            'frontend-agent': {
                name: 'Frontend Dev',
                role: 'UI/React Developer',
                color: chalk.cyan,
                icon: '🎨'
            },
            'backend-agent': {
                name: 'Backend Dev',
                role: 'API/Server Developer',
                color: chalk.green,
                icon: '🔧'
            },
            'devops-agent': {
                name: 'DevOps',
                role: 'Infrastructure/Deploy',
                color: chalk.yellow,
                icon: '🚀'
            },
            'qa-specialist': {
                name: 'QA Specialist',
                role: 'Testing/Quality',
                color: chalk.magenta,
                icon: '🔍'
            }
            // Add more agents here as needed
        };
    }

    getAgentStatus(agentId) {
        try {
            // Check if agent process is running
            const result = execSync(`ps aux | grep "${agentId}.js" | grep -v grep`, { encoding: 'utf8' });
            if (result.trim()) {
                // Extract PID and memory usage
                const parts = result.trim().split(/\s+/);
                const pid = parts[1];
                const memory = parts[5];
                return {
                    status: 'running',
                    pid,
                    memory,
                    uptime: this.getUptime(pid)
                };
            }
        } catch (error) {
            // Process not found
        }
        return { status: 'stopped' };
    }

    getUptime(pid) {
        try {
            const result = execSync(`ps -o etime= -p ${pid}`, { encoding: 'utf8' });
            return result.trim();
        } catch (error) {
            return 'N/A';
        }
    }

    getCurrentTask(agentId) {
        try {
            // Check coordination state
            const coordPath = path.join(process.cwd(), '.taskmaster/agents/coordination.json');
            if (fs.existsSync(coordPath)) {
                const coordination = JSON.parse(fs.readFileSync(coordPath, 'utf8'));
                
                // Find assigned tasks for this agent
                const agentData = coordination.agents?.find(a => a.id === agentId);
                if (agentData && agentData.assignedTasks?.length > 0) {
                    const taskId = agentData.assignedTasks[0];
                    
                    // Get task details
                    const tasksPath = path.join(process.cwd(), '.taskmaster/tasks/tasks.json');
                    if (fs.existsSync(tasksPath)) {
                        const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
                        const task = tasks.tasks?.find(t => t.id == taskId);
                        if (task) {
                            return {
                                id: task.id,
                                title: task.title,
                                status: task.status
                            };
                        }
                    }
                }
            }
        } catch (error) {
            // Silent fail
        }
        return null;
    }

    displayHeader() {
        console.clear();
        console.log(boxen(
            chalk.bold.white('🤖 TaskMaster AI - Agent Overview') + '\n' +
            chalk.gray('System Status Monitor | Single User Mode'),
            {
                padding: 1,
                borderStyle: 'round',
                borderColor: 'cyan',
                margin: 1
            }
        ));
    }

    displayAgentCards() {
        const table = new Table({
            head: [
                chalk.white('Agent'),
                chalk.white('Status'),
                chalk.white('PID'),
                chalk.white('Memory'),
                chalk.white('Uptime'),
                chalk.white('Current Task')
            ],
            style: {
                head: [],
                border: ['grey']
            }
        });

        Object.entries(this.agents).forEach(([agentId, agentInfo]) => {
            const status = this.getAgentStatus(agentId);
            const currentTask = this.getCurrentTask(agentId);
            
            const statusDisplay = status.status === 'running' 
                ? chalk.green('● Running') 
                : chalk.gray('○ Stopped');
            
            const taskDisplay = currentTask 
                ? `#${currentTask.id} - ${currentTask.title.substring(0, 30)}...`
                : chalk.gray('Idle');

            table.push([
                `${agentInfo.icon} ${agentInfo.name}`,
                statusDisplay,
                status.pid || '-',
                status.memory || '-',
                status.uptime || '-',
                taskDisplay
            ]);
        });

        console.log(table.toString());
    }

    displaySystemHealth() {
        // Simple system health indicators
        try {
            const loadAvg = require('os').loadavg()[0].toFixed(2);
            const freeMemory = (require('os').freemem() / 1024 / 1024 / 1024).toFixed(2);
            const totalMemory = (require('os').totalmem() / 1024 / 1024 / 1024).toFixed(2);
            
            console.log('\n' + chalk.bold('📊 System Health'));
            console.log(`CPU Load: ${loadAvg} | Memory: ${freeMemory}GB / ${totalMemory}GB free`);
        } catch (error) {
            // Silent fail
        }
    }

    displayQuickActions() {
        console.log('\n' + chalk.bold('⚡ Quick Actions'));
        console.log(chalk.gray('Press [S] to start an agent | [X] to stop an agent | [T] to view tasks | [Q] to quit'));
    }

    async handleKeypress() {
        // Check if we're in a TTY environment
        if (!process.stdin.isTTY) {
            console.log('\nNon-TTY environment detected. Interactive mode disabled.');
            console.log('Use Ctrl+C to exit.');
            return;
        }

        try {
            const readline = require('readline');
            readline.emitKeypressEvents(process.stdin);
            process.stdin.setRawMode(true);

            process.stdin.on('keypress', async (str, key) => {
                if (key.ctrl && key.name === 'c') {
                    process.exit();
                }

                switch(key.name) {
                    case 's':
                        // Start agent
                        console.log('\nStarting agent manager...');
                        try {
                            execSync('node simple-agent-manager.js start-with-coordination backend-agent', { stdio: 'inherit' });
                        } catch (error) {
                            console.error('Error starting agent:', error.message);
                        }
                        break;
                    case 'x':
                        // Stop agent
                        console.log('\nStopping agents...');
                        try {
                            execSync('node simple-agent-manager.js stop-all', { stdio: 'inherit' });
                        } catch (error) {
                            console.error('Error stopping agents:', error.message);
                        }
                        break;
                    case 't':
                        // View tasks
                        console.log('\nOpening task router...');
                        try {
                            execSync('node human-interface/cli/task-router.js', { stdio: 'inherit' });
                        } catch (error) {
                            console.error('Error opening task router:', error.message);
                        }
                        break;
                    case 'q':
                        this.isRunning = false;
                        process.exit();
                        break;
                }
            });
        } catch (error) {
            console.error('Error setting up keypress handling:', error.message);
            console.log('Interactive mode disabled. Use Ctrl+C to exit.');
        }
    }

    async run() {
        // Set up keypress handling
        this.handleKeypress();

        // Main display loop
        while (this.isRunning) {
            this.displayHeader();
            this.displayAgentCards();
            this.displaySystemHealth();
            this.displayQuickActions();
            
            // Wait before refresh
            await new Promise(resolve => setTimeout(resolve, this.refreshInterval));
        }
    }
}

// Run the overview
if (require.main === module) {
    const overview = new AgentOverview();
    overview.run().catch(console.error);
}

module.exports = AgentOverview;