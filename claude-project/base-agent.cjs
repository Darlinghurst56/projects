// Use built-in fetch (available in Node.js 18+)
const fetch = globalThis.fetch || require('node-fetch');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class BaseAgent {
    constructor(config) {
        this.agentId = config.id;
        this.role = config.role;
        this.capabilities = config.capabilities || [];
        this.taskKeywords = config.taskKeywords || [];
        this.apiUrl = config.apiUrl || 'http://localhost:3001';
        this.intervals = config.intervals || {
            heartbeat: 30000,
            taskCheck: 45000
        };
        this.logLevel = config.logLevel || 'info';
        this.isRunning = false;
        this.currentTask = null;
        this.heartbeatInterval = null;
        this.taskInterval = null;
    }

    log(level, message) {
        const levels = { silent: 0, error: 1, info: 2, verbose: 3 };
        if (levels[level] <= levels[this.logLevel]) {
            console.log(`[${new Date().toISOString().slice(11, 19)}] [${this.role}] ${message}`);
        }
    }

    async start() {
        try {
            this.log('info', `Starting agent: ${this.agentId}`);
            await this.registerAgent();
            this.startHeartbeat();
            this.startTaskMonitoring();
            this.isRunning = true;
            this.log('info', 'Agent operational');
        } catch (error) {
            this.log('error', `Startup failed: ${error.message}`);
            throw error;
        }
    }

    async stop() {
        this.log('info', 'Shutting down agent');
        this.isRunning = false;
        if (this.heartbeatInterval) {clearInterval(this.heartbeatInterval);}
        if (this.taskInterval) {clearInterval(this.taskInterval);}
        await this.updateAgentStatus('offline');
    }

    async registerAgent() {
        const registrationData = {
            name: this.agentId,
            role: this.role,
            description: `${this.role} agent`,
            priority: 5
        };

        try {
            const response = await fetch(`${this.apiUrl}/api/agents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registrationData)
            });
            if (!response.ok && response.status !== 409) {
                throw new Error(`Registration failed: ${response.statusText}`);
            }
            this.log('verbose', 'Agent registered successfully');
        } catch (error) {
            throw new Error(`Registration error: ${error.message}`);
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(async () => {
            try {
                await fetch(`${this.apiUrl}/agent-heartbeat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agentId: this.agentId,
                        status: this.currentTask ? 'busy' : 'idle',
                        taskId: this.currentTask?.id
                    })
                });
            } catch (error) {
                this.log('error', `Heartbeat failed: ${error.message}`);
            }
        }, this.intervals.heartbeat);
    }

    startTaskMonitoring() {
        this.taskInterval = setInterval(() => {
            if (!this.currentTask && this.isRunning) {
                this.checkForTasks();
            }
        }, this.intervals.taskCheck);
        
        // Check immediately
        this.checkForTasks();
    }

    async checkForTasks() {
        try {
            const response = await fetch(`${this.apiUrl}/api/taskmaster/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag: this.role })
            });
            const data = await response.json();
            const tasks = data.tasks || data || [];
            
            // Find matching task using keyword matching
            let matchingTask = null;
            
            // Check subtasks first (flatten subtasks for matching)
            for (const task of tasks) {
                if (task.subtasks) {
                    matchingTask = task.subtasks.find(subtask =>
                        subtask.status === 'pending' && 
                        this.taskKeywords.some(keyword => 
                            subtask.title?.toLowerCase().includes(keyword) ||
                            subtask.description?.toLowerCase().includes(keyword) ||
                            subtask.prompt?.toLowerCase().includes(keyword)
                        )
                    );
                    if (matchingTask) {break;}
                }
            }
            
            // If no subtask match, check main tasks
            if (!matchingTask) {
                matchingTask = tasks.find(task => 
                    task.status === 'pending' && 
                    this.taskKeywords.some(keyword => 
                        task.description?.toLowerCase().includes(keyword) ||
                        task.prompt?.toLowerCase().includes(keyword) ||
                        task.title?.toLowerCase().includes(keyword)
                    )
                );
            }

            if (matchingTask) {
                await this.claimTask(matchingTask);
            }
        } catch (error) {
            this.log('error', `Task check failed: ${error.message}`);
        }
    }

    async claimTask(task) {
        try {
            this.log('info', `Claiming task: ${task.id}`);
            
            // Pre-work validation
            const validationResult = await this.validatePreWork(task);
            if (!validationResult.success) {
                this.log('error', `Pre-work validation failed: ${validationResult.message}`);
                return;
            }

            // Update task status
            await execAsync(`task-master set-status --id=${task.id} --status=in-progress`);
            this.currentTask = task;
            await this.updateAgentStatus('busy');

            // Execute task
            const result = await this.executeTask(task);

            // Post-work validation
            this.log('info', `Starting post-work validation for task ${task.id}`);
            const postValidation = await this.validatePostWork(task, result);
            if (!postValidation.success) {
                this.log('error', `Post-work validation failed: ${postValidation.message}`);
                this.log('info', `Resetting task ${task.id} to pending status`);
                await execAsync(`task-master set-status --id=${task.id} --status=pending`);
            } else {
                this.log('info', `Post-work validation passed for task ${task.id}`);
                await execAsync(`task-master set-status --id=${task.id} --status=done`);
                this.log('info', `Task ${task.id} completed successfully`);
            }

            this.currentTask = null;
            await this.updateAgentStatus('idle');
        } catch (error) {
            this.log('error', `Task execution failed: ${error.message}`);
            this.currentTask = null;
            await this.updateAgentStatus('idle');
        }
    }

    async validatePreWork(task) {
        // Override in child classes for specific validation
        return { success: true };
    }

    async validatePostWork(task, result) {
        // Override in child classes for specific validation
        return { success: true };
    }

    async executeTask(task) {
        // Must be implemented by child classes
        throw new Error('executeTask must be implemented by child class');
    }

    async updateAgentStatus(status) {
        try {
            await fetch(`${this.apiUrl}/update-agent-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: this.agentId,
                    status,
                    taskId: this.currentTask?.id
                })
            });
        } catch (error) {
            this.log('error', `Status update failed: ${error.message}`);
        }
    }
}

module.exports = BaseAgent;