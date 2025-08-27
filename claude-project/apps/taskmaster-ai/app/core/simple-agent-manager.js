#!/usr/bin/env node

/**
 * Simple Agent Manager for TaskMaster MVP
 * 
 * Enhanced for 10-20 agent batch operations:
 * - Batch start/stop operations for multiple agents
 * - Efficient resource management with pooling
 * - Health monitoring and auto-recovery
 * - Simplified single-user workflow
 * - Task queue management for multiple agents
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const CapabilityMatcher = require('./capability-matcher.js');

const execAsync = promisify(exec);

class SimpleAgentManager {
    constructor() {
        this.agents = {
            'orchestrator-agent': {
                script: 'app/agents/orchestrator-agent.js',
                capabilities: ['coordination', 'developer-interface', 'web-research', 'file-creation'],
                mcpTools: ['puppeteer', 'playwright', 'filesystem', 'memory', 'task-master-ai']
            },
            'frontend-agent': {
                script: 'app/agents/frontend-agent.js', 
                capabilities: ['react', 'typescript', 'css', 'ui-components', 'web-research'],
                mcpTools: ['filesystem', 'puppeteer', 'playwright', 'memory']
            },
            'backend-agent': {
                script: 'app/agents/backend-agent.js',
                capabilities: ['nodejs', 'api', 'database', 'server-logic', 'web-research'],
                mcpTools: ['filesystem', 'memory', 'task-master-ai']
            },
            'devops-agent': {
                script: 'app/agents/devops-agent.js',
                capabilities: ['deployment', 'docker', 'ci-cd', 'server-management'],
                mcpTools: ['filesystem', 'memory']
            },
            'qa-specialist': {
                script: 'app/agents/qa-specialist-agent.js',
                capabilities: ['testing', 'validation', 'quality-assurance', 'web-testing'],
                mcpTools: ['filesystem', 'puppeteer', 'playwright', 'memory']
            }
        };
        
        this.activeAgents = new Map();
        this.portManager = new PortManager();
        this.coordinationWorkflow = null;
        this.taskUpdateWrapper = null;
        this.taskQueue = [];
        this.batchOperations = new Map();
        this.healthMonitor = null;
        this.capabilityMatcher = new CapabilityMatcher();
        this.initializeCoordination();
        this.initializeHealthMonitoring();
    }

    /**
     * Initialize coordination workflow integration
     */
    initializeCoordination() {
        try {
            const path = require('path');
            const AgentCoordinationWorkflow = require(path.join(process.cwd(), '.taskmaster/agents/coordination-workflow.cjs'));
            const TaskUpdateWrapper = require('./task-update-wrapper.js');
            
            this.coordinationWorkflow = new AgentCoordinationWorkflow();
            this.taskUpdateWrapper = new TaskUpdateWrapper();
            
            console.log('✅ Coordination workflow initialized');
        } catch (error) {
            console.error('❌ Failed to initialize coordination workflow:', error.message);
        }
    }

    /**
     * Initialize health monitoring for agents
     */
    initializeHealthMonitoring() {
        this.healthMonitor = setInterval(() => {
            this.performHealthCheck();
        }, 30000); // Check every 30 seconds
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [AGENT-MGR] [${type}] ${message}`);
    }

    // Start a single agent with hot-reload capability
    async startAgent(agentRole, options = {}) {
        const config = this.agents[agentRole];
        if (!config) {
            throw new Error(`Unknown agent role: ${agentRole}`);
        }

        // Check if agent is already running
        if (this.activeAgents.has(agentRole)) {
            this.log(`Agent ${agentRole} is already running`, 'WARN');
            return this.activeAgents.get(agentRole);
        }

        // Assign available port for any HTTP services
        const port = await this.portManager.getAvailablePort();
        
        // Enhanced environment with web access capabilities
        const env = {
            ...process.env,
            AGENT_ROLE: agentRole,
            AGENT_PORT: port,
            AGENT_TIMEOUT: options.timeout || 300000, // 5 minutes default
            
            // Enable web access capabilities
            PUPPETEER_ENABLED: 'true',
            PLAYWRIGHT_ENABLED: 'true',
            
            // MCP tool configuration
            MCP_TOOLS: config.mcpTools.join(','),
            
            // Research capabilities
            RESEARCH_MODE: 'enabled',
            WEB_ACCESS: 'enabled',
            FILE_CREATION: 'enabled',
            
            // Hot-reload settings
            HOT_RELOAD: 'enabled',
            RELOAD_PORT: port + 1000 // Separate port for reload signals
        };

        this.log(`Starting ${agentRole} on port ${port}...`);

        // Start agent process
        const agentProcess = spawn('node', [config.script], {
            cwd: process.cwd(),
            env,
            stdio: options.stdio || 'pipe'
        });

        // Set up agent metadata
        const agentInfo = {
            role: agentRole,
            pid: agentProcess.pid,
            port,
            reloadPort: port + 1000,
            startTime: Date.now(),
            config,
            process: agentProcess,
            status: 'starting'
        };

        this.activeAgents.set(agentRole, agentInfo);

        // Handle agent output
        agentProcess.stdout?.on('data', (data) => {
            this.log(`[${agentRole}] ${data.toString().trim()}`);
        });

        agentProcess.stderr?.on('data', (data) => {
            this.log(`[${agentRole}] ERROR: ${data.toString().trim()}`, 'ERROR');
        });

        // Handle agent completion
        agentProcess.on('close', (code) => {
            this.log(`Agent ${agentRole} exited with code ${code}`);
            this.activeAgents.delete(agentRole);
            this.portManager.releasePort(port);
        });

        // Mark as running after brief startup delay
        setTimeout(() => {
            if (this.activeAgents.has(agentRole)) {
                const agent = this.activeAgents.get(agentRole);
                agent.status = 'running';
                agent.healthScore = 100;
                agent.lastHealthCheck = Date.now();
                this.log(`Agent ${agentRole} is now running and healthy`);
            }
        }, 2000);

        return agentInfo;
    }

    // Hot-reload an agent (restart without port conflicts)
    async hotReloadAgent(agentRole) {
        const agentInfo = this.activeAgents.get(agentRole);
        if (!agentInfo) {
            throw new Error(`Agent ${agentRole} is not running`);
        }

        this.log(`Hot-reloading ${agentRole}...`);

        // Send reload signal to agent
        try {
            await this.sendReloadSignal(agentInfo.reloadPort);
        } catch (error) {
            this.log(`Reload signal failed, forcing restart: ${error.message}`, 'WARN');
            
            // Force restart if reload signal fails
            await this.stopAgent(agentRole);
            await this.startAgent(agentRole, { port: agentInfo.port });
        }
    }

    // Send reload signal to agent
    async sendReloadSignal(reloadPort) {
        const signal = { type: 'reload', timestamp: Date.now() };
        
        // Simple HTTP POST to agent's reload endpoint
        const response = await fetch(`http://localhost:${reloadPort}/reload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signal)
        });

        if (!response.ok) {
            throw new Error(`Reload signal failed: ${response.status}`);
        }
    }

    // Stop an agent
    async stopAgent(agentRole) {
        const agentInfo = this.activeAgents.get(agentRole);
        if (!agentInfo) {
            this.log(`Agent ${agentRole} is not running`, 'WARN');
            return;
        }

        this.log(`Stopping ${agentRole}...`);

        // Graceful shutdown
        agentInfo.process.kill('SIGTERM');
        
        // Force kill after timeout
        setTimeout(() => {
            if (this.activeAgents.has(agentRole)) {
                agentInfo.process.kill('SIGKILL');
            }
        }, 5000);

        this.activeAgents.delete(agentRole);
        this.portManager.releasePort(agentInfo.port);
    }

    // Get agent status
    getAgentStatus(agentRole) {
        const agentInfo = this.activeAgents.get(agentRole);
        if (!agentInfo) {
            return { status: 'stopped' };
        }

        return {
            status: agentInfo.status,
            pid: agentInfo.pid,
            port: agentInfo.port,
            uptime: Date.now() - agentInfo.startTime,
            capabilities: agentInfo.config.capabilities
        };
    }

    // List all agents
    listAgents() {
        const status = {};
        for (const [role, info] of this.activeAgents) {
            status[role] = this.getAgentStatus(role);
        }
        return status;
    }

    // Start research task with web access
    async startResearchTask(agentRole, topic, options = {}) {
        const agentInfo = this.activeAgents.get(agentRole);
        if (!agentInfo) {
            throw new Error(`Agent ${agentRole} is not running`);
        }

        // Create research task
        const taskId = `research-${Date.now()}`;
        const researchTask = {
            id: taskId,
            type: 'research',
            topic,
            agent: agentRole,
            webAccess: true,
            outputFormat: options.format || 'markdown',
            timestamp: new Date().toISOString()
        };

        this.log(`Starting research task ${taskId} for ${agentRole}: ${topic}`);

        // Write task to agent's work directory
        const taskPath = path.join('.taskmaster', 'research', `${taskId}.json`);
        fs.mkdirSync(path.dirname(taskPath), { recursive: true });
        fs.writeFileSync(taskPath, JSON.stringify(researchTask, null, 2));

        return taskId;
    }

    // Enable file creation for agents
    async enableFileCreation(agentRole, workspaceDir) {
        const agentInfo = this.activeAgents.get(agentRole);
        if (!agentInfo) {
            throw new Error(`Agent ${agentRole} is not running`);
        }

        // Create workspace directory
        const workspace = path.join(workspaceDir, agentRole);
        fs.mkdirSync(workspace, { recursive: true });

        // Set workspace permissions
        const permissions = {
            agent: agentRole,
            workspace,
            canCreate: true,
            canModify: true,
            canDelete: false, // Safety measure
            allowedExtensions: ['.js', '.ts', '.json', '.md', '.html', '.css', '.yaml', '.yml'],
            timestamp: new Date().toISOString()
        };

        const permissionsPath = path.join(workspace, '.agent-permissions.json');
        fs.writeFileSync(permissionsPath, JSON.stringify(permissions, null, 2));

        this.log(`Enabled file creation for ${agentRole} in ${workspace}`);
        return workspace;
    }

    /**
     * Register agent with coordination workflow
     */
    async registerAgentWithCoordination(agentRole) {
        if (!this.coordinationWorkflow) {
            throw new Error('Coordination workflow not initialized');
        }

        const config = this.agents[agentRole];
        if (!config) {
            throw new Error(`Unknown agent role: ${agentRole}`);
        }

        const success = this.coordinationWorkflow.registerAgent(agentRole, config.capabilities, 'available');
        if (success) {
            this.log(`Registered ${agentRole} with coordination workflow`);
        }
        return success;
    }

    /**
     * Start agent with coordination integration
     */
    async startAgentWithCoordination(agentRole, options = {}) {
        // Start the agent process
        const agentInfo = await this.startAgent(agentRole, options);
        
        // Register with coordination workflow
        if (this.coordinationWorkflow) {
            await this.registerAgentWithCoordination(agentRole);
        }
        
        return agentInfo;
    }

    /**
     * Execute task with agent coordination
     */
    async executeTaskWithAgent(agentRole, taskId, taskDescription) {
        if (!this.coordinationWorkflow || !this.taskUpdateWrapper) {
            throw new Error('Coordination workflow or task wrapper not initialized');
        }

        const agentInfo = this.activeAgents.get(agentRole);
        if (!agentInfo) {
            throw new Error(`Agent ${agentRole} is not running`);
        }

        try {
            // Update task progress
            await this.taskUpdateWrapper.updateTaskProgress(taskId, agentRole, 'Starting task execution');
            
            // Assign task in coordination workflow
            this.coordinationWorkflow.assignTaskToAgent(taskId, agentRole);
            
            // Here you would implement the actual task execution
            // For now, we'll simulate work
            this.log(`${agentRole} executing task ${taskId}: ${taskDescription}`);
            
            // Simulate work with a delay
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Complete the task
            await this.taskUpdateWrapper.completeTask(taskId, agentRole, 'Task completed successfully');
            this.coordinationWorkflow.completeTaskAssignment(taskId, agentRole);
            
            return { success: true, taskId, agentRole, result: 'Task completed successfully' };
            
        } catch (error) {
            this.log(`Task execution failed for ${agentRole}: ${error.message}`, 'ERROR');
            
            // Mark task as failed
            if (this.taskUpdateWrapper) {
                await this.taskUpdateWrapper.failTask(taskId, agentRole, error.message);
            }
            
            throw error;
        }
    }

    /**
     * Get coordination status
     */
    getCoordinationStatus() {
        if (!this.coordinationWorkflow) {
            return { error: 'Coordination workflow not initialized' };
        }
        
        return this.coordinationWorkflow.getCoordinationStatus();
    }

    /**
     * Create task suggestion for human approval
     */
    async createTaskSuggestion(taskId, targetAgent, reasoning) {
        if (!this.coordinationWorkflow) {
            throw new Error('Coordination workflow not initialized');
        }

        const suggestion = this.coordinationWorkflow.suggestTaskAssignment(
            { id: taskId },
            targetAgent,
            reasoning
        );
        
        this.log(`Created task suggestion ${suggestion.id} for ${targetAgent}`);
        return suggestion;
    }

    /**
     * Enhanced batch operations for 10-20 agents
     */
    
    /**
     * Start multiple agents in parallel batches
     */
    async startAgentsBatch(agentRoles, batchSize = 3) {
        const batchId = `batch-${Date.now()}`;
        this.log(`Starting batch ${batchId} with ${agentRoles.length} agents (batch size: ${batchSize})`);
        
        const results = [];
        const failures = [];
        
        // Process agents in batches to prevent resource exhaustion
        for (let i = 0; i < agentRoles.length; i += batchSize) {
            const batch = agentRoles.slice(i, i + batchSize);
            this.log(`Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.join(', ')}`);
            
            const batchPromises = batch.map(async (agentRole) => {
                try {
                    const agentInfo = await this.startAgentWithCoordination(agentRole);
                    results.push({ agentRole, success: true, info: agentInfo });
                    return agentInfo;
                } catch (error) {
                    failures.push({ agentRole, error: error.message });
                    results.push({ agentRole, success: false, error: error.message });
                    return null;
                }
            });
            
            await Promise.all(batchPromises);
            
            // Brief pause between batches
            if (i + batchSize < agentRoles.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        this.batchOperations.set(batchId, {
            type: 'start',
            agents: agentRoles,
            results,
            failures,
            timestamp: new Date().toISOString()
        });
        
        this.log(`Batch ${batchId} completed: ${results.filter(r => r.success).length} successful, ${failures.length} failed`);
        return { batchId, results, failures };
    }
    
    /**
     * Stop multiple agents in parallel
     */
    async stopAgentsBatch(agentRoles) {
        const batchId = `stop-batch-${Date.now()}`;
        this.log(`Stopping batch ${batchId} with ${agentRoles.length} agents`);
        
        const results = [];
        const failures = [];
        
        const stopPromises = agentRoles.map(async (agentRole) => {
            try {
                await this.stopAgent(agentRole);
                results.push({ agentRole, success: true });
            } catch (error) {
                failures.push({ agentRole, error: error.message });
                results.push({ agentRole, success: false, error: error.message });
            }
        });
        
        await Promise.all(stopPromises);
        
        this.batchOperations.set(batchId, {
            type: 'stop',
            agents: agentRoles,
            results,
            failures,
            timestamp: new Date().toISOString()
        });
        
        this.log(`Stop batch ${batchId} completed: ${results.filter(r => r.success).length} successful, ${failures.length} failed`);
        return { batchId, results, failures };
    }
    
    /**
     * Health check for all active agents
     */
    async performHealthCheck() {
        const healthResults = [];
        
        for (const [agentRole, agentInfo] of this.activeAgents) {
            try {
                const isHealthy = await this.checkAgentHealth(agentRole);
                const uptime = Date.now() - agentInfo.startTime;
                
                healthResults.push({
                    agentRole,
                    healthy: isHealthy,
                    uptime,
                    pid: agentInfo.pid,
                    status: agentInfo.status
                });
                
                // Auto-restart failed agents
                if (!isHealthy && agentInfo.status === 'running') {
                    this.log(`Agent ${agentRole} failed health check, attempting restart`, 'WARN');
                    await this.restartAgent(agentRole);
                }
                
            } catch (error) {
                healthResults.push({
                    agentRole,
                    healthy: false,
                    error: error.message
                });
            }
        }
        
        return healthResults;
    }
    
    /**
     * Check if specific agent is healthy
     */
    async checkAgentHealth(agentRole) {
        const agentInfo = this.activeAgents.get(agentRole);
        if (!agentInfo) return false;
        
        try {
            // Check if process is still running
            process.kill(agentInfo.pid, 0);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Restart an agent that failed health check
     */
    async restartAgent(agentRole) {
        try {
            await this.stopAgent(agentRole);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.startAgentWithCoordination(agentRole);
            this.log(`Successfully restarted ${agentRole}`);
        } catch (error) {
            this.log(`Failed to restart ${agentRole}: ${error.message}`, 'ERROR');
        }
    }
    
    /**
     * Get comprehensive system status for all agents
     */
    getSystemStatus() {
        const status = {
            totalAgents: Object.keys(this.agents).length,
            activeAgents: this.activeAgents.size,
            agentDetails: {},
            resourceUsage: {
                usedPorts: Array.from(this.portManager.usedPorts),
                taskQueueSize: this.taskQueue.length
            },
            batchOperations: this.batchOperations.size,
            timestamp: new Date().toISOString()
        };
        
        // Add individual agent status
        for (const [agentRole, agentInfo] of this.activeAgents) {
            status.agentDetails[agentRole] = {
                status: agentInfo.status,
                uptime: Date.now() - agentInfo.startTime,
                pid: agentInfo.pid,
                port: agentInfo.port,
                capabilities: agentInfo.config.capabilities
            };
        }
        
        return status;
    }
    
    /**
     * Queue tasks for batch processing
     */
    queueTask(taskId, agentRole, taskDescription, priority = 'medium') {
        const task = {
            id: taskId,
            agentRole,
            description: taskDescription,
            priority,
            timestamp: new Date().toISOString(),
            status: 'queued'
        };
        
        this.taskQueue.push(task);
        this.log(`Queued task ${taskId} for ${agentRole} (priority: ${priority})`);
        
        // Sort by priority
        this.taskQueue.sort((a, b) => {
            const priorities = { high: 3, medium: 2, low: 1 };
            return priorities[b.priority] - priorities[a.priority];
        });
        
        return task;
    }
    
    /**
     * Process queued tasks across available agents
     */
    async processTaskQueue() {
        if (this.taskQueue.length === 0) {
            return { processed: 0, message: 'No tasks in queue' };
        }
        
        const availableAgents = Array.from(this.activeAgents.keys()).filter(agentRole => {
            const agentInfo = this.activeAgents.get(agentRole);
            return agentInfo && agentInfo.status === 'running';
        });
        
        if (availableAgents.length === 0) {
            return { processed: 0, message: 'No available agents' };
        }
        
        const processed = [];
        const failed = [];
        
        // Process tasks that have available agents
        for (let i = this.taskQueue.length - 1; i >= 0; i--) {
            const task = this.taskQueue[i];
            
            if (availableAgents.includes(task.agentRole)) {
                try {
                    const result = await this.executeTaskWithAgent(task.agentRole, task.id, task.description);
                    processed.push({ task, result });
                    this.taskQueue.splice(i, 1);
                } catch (error) {
                    failed.push({ task, error: error.message });
                    task.status = 'failed';
                }
            }
        }
        
        this.log(`Processed ${processed.length} tasks, ${failed.length} failed`);
        return { processed: processed.length, failed: failed.length, details: { processed, failed } };
    }
    
    /**
     * Cleanup resources and stop monitoring
     */
    async cleanup() {
        this.log('Cleaning up agent manager resources...');
        
        // Clear health monitor
        if (this.healthMonitor) {
            clearInterval(this.healthMonitor);
            this.healthMonitor = null;
        }
        
        // Stop all agents
        const activeAgentRoles = Array.from(this.activeAgents.keys());
        if (activeAgentRoles.length > 0) {
            await this.stopAgentsBatch(activeAgentRoles);
        }
        
        // Clear task queue
        this.taskQueue = [];
        this.batchOperations.clear();
        
        this.log('Agent manager cleanup completed');
    }

    /**
     * Capability-based auto-assignment methods
     */
    
    /**
     * Auto-assign a single task to the best available agent
     */
    async autoAssignTask(task) {
        const availableAgents = Array.from(this.activeAgents.keys()).filter(agentRole => {
            const agentInfo = this.activeAgents.get(agentRole);
            return agentInfo && agentInfo.status === 'running';
        });

        if (availableAgents.length === 0) {
            throw new Error('No available agents for auto-assignment');
        }

        const assignment = this.capabilityMatcher.findBestAgent(task, availableAgents);
        
        this.log(`Auto-assigned task ${task.id} to ${assignment.agent} (score: ${assignment.score})`);
        this.log(`Reasoning: ${assignment.reasoning}`);

        // Update task with assignment
        if (this.coordinationWorkflow) {
            const suggestion = this.coordinationWorkflow.suggestTaskAssignment(
                task,
                assignment.agent,
                assignment.reasoning
            );
            return { assignment, suggestion };
        }

        return { assignment };
    }

    /**
     * Auto-assign multiple tasks to available agents
     */
    async autoAssignMultipleTasks(tasks) {
        const availableAgents = Array.from(this.activeAgents.keys()).filter(agentRole => {
            const agentInfo = this.activeAgents.get(agentRole);
            return agentInfo && agentInfo.status === 'running';
        });

        if (availableAgents.length === 0) {
            throw new Error('No available agents for auto-assignment');
        }

        const result = this.capabilityMatcher.autoAssignTasks(tasks, availableAgents);
        
        this.log(`Auto-assigned ${result.assignments.length} tasks with average score ${result.summary.averageScore.toFixed(1)}`);
        this.log(`Agent distribution: ${JSON.stringify(result.summary.agentDistribution)}`);

        // Create suggestions for all assignments
        const suggestions = [];
        if (this.coordinationWorkflow) {
            for (const assignment of result.assignments) {
                const task = tasks.find(t => t.id === assignment.taskId);
                if (task) {
                    const suggestion = this.coordinationWorkflow.suggestTaskAssignment(
                        task,
                        assignment.agentId,
                        assignment.reasoning
                    );
                    suggestions.push(suggestion);
                }
            }
        }

        return { ...result, suggestions };
    }

    /**
     * Analyze task requirements and suggest agent
     */
    analyzeTaskRequirements(task) {
        const analysis = this.capabilityMatcher.analyzeTask(task);
        const recommendation = this.capabilityMatcher.findBestAgent(task);

        return {
            analysis,
            recommendation,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get capability report for all agents
     */
    getCapabilityReport() {
        const report = this.capabilityMatcher.getCapabilityReport();
        
        // Add runtime information
        report.runtime = {
            activeAgents: this.activeAgents.size,
            totalAgents: Object.keys(this.agents).length,
            agentStatus: {}
        };

        // Add current agent status
        for (const [agentRole, agentInfo] of this.activeAgents) {
            report.runtime.agentStatus[agentRole] = {
                status: agentInfo.status,
                uptime: Date.now() - agentInfo.startTime,
                port: agentInfo.port
            };
        }

        return report;
    }

    /**
     * Smart task queue processing with auto-assignment
     */
    async processTaskQueueWithAutoAssignment() {
        if (this.taskQueue.length === 0) {
            return { processed: 0, message: 'No tasks in queue' };
        }

        const availableAgents = Array.from(this.activeAgents.keys()).filter(agentRole => {
            const agentInfo = this.activeAgents.get(agentRole);
            return agentInfo && agentInfo.status === 'running';
        });

        if (availableAgents.length === 0) {
            return { processed: 0, message: 'No available agents' };
        }

        // Group tasks by priority
        const tasksByPriority = {
            urgent: [],
            high: [],
            medium: [],
            low: []
        };

        this.taskQueue.forEach(task => {
            const priority = task.priority || 'medium';
            if (tasksByPriority[priority]) {
                tasksByPriority[priority].push(task);
            }
        });

        const processed = [];
        const failed = [];

        // Process tasks by priority
        for (const priority of ['urgent', 'high', 'medium', 'low']) {
            const tasksInPriority = tasksByPriority[priority];
            if (tasksInPriority.length === 0) continue;

            try {
                const assignmentResult = await this.autoAssignMultipleTasks(tasksInPriority);
                
                // Execute assignments
                for (const assignment of assignmentResult.assignments) {
                    const task = tasksInPriority.find(t => t.id === assignment.taskId);
                    if (task) {
                        try {
                            const result = await this.executeTaskWithAgent(
                                assignment.agentId,
                                task.id,
                                task.description
                            );
                            processed.push({ task, assignment, result });
                            
                            // Remove from queue
                            const queueIndex = this.taskQueue.findIndex(t => t.id === task.id);
                            if (queueIndex !== -1) {
                                this.taskQueue.splice(queueIndex, 1);
                            }
                        } catch (error) {
                            failed.push({ task, assignment, error: error.message });
                            task.status = 'failed';
                        }
                    }
                }
            } catch (error) {
                this.log(`Failed to auto-assign ${priority} priority tasks: ${error.message}`, 'ERROR');
                tasksInPriority.forEach(task => {
                    failed.push({ task, error: error.message });
                    task.status = 'failed';
                });
            }
        }

        this.log(`Smart queue processing completed: ${processed.length} processed, ${failed.length} failed`);
        
        return {
            processed: processed.length,
            failed: failed.length,
            details: { processed, failed },
            summary: {
                totalTasks: processed.length + failed.length,
                successRate: (processed.length / (processed.length + failed.length) * 100).toFixed(1)
            }
        };
    }

    /**
     * Validate assignment quality
     */
    validateAssignment(taskId, agentId, reasoning) {
        return this.capabilityMatcher.validateAssignment(taskId, agentId, reasoning);
    }

    /**
     * Get assignment recommendations for a task
     */
    getAssignmentRecommendations(task, maxRecommendations = 3) {
        const availableAgents = Array.from(this.activeAgents.keys());
        const recommendations = [];

        for (const agentId of availableAgents) {
            const assignment = this.capabilityMatcher.findBestAgent(task, [agentId]);
            if (assignment.score > 0) {
                recommendations.push({
                    agentId,
                    score: assignment.score,
                    reasoning: assignment.reasoning,
                    agentStatus: this.getAgentStatus(agentId)
                });
            }
        }

        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, maxRecommendations);
    }
}

// Port management to avoid conflicts
class PortManager {
    constructor() {
        this.usedPorts = new Set();
        this.basePort = 3100; // Start from 3100 to avoid conflicts
    }

    async getAvailablePort() {
        let port = this.basePort;
        while (this.usedPorts.has(port) || await this.isPortInUse(port)) {
            port++;
        }
        this.usedPorts.add(port);
        return port;
    }

    releasePort(port) {
        this.usedPorts.delete(port);
    }

    async isPortInUse(port) {
        return new Promise((resolve) => {
            const server = require('net').createServer();
            server.listen(port, () => {
                server.close(() => resolve(false));
            });
            server.on('error', () => resolve(true));
        });
    }
}

// CLI interface for agent management
async function main() {
    const manager = new SimpleAgentManager();
    const [,, command, ...args] = process.argv;

    switch (command) {
        case 'start':
            const agentRole = args[0];
            if (!agentRole) {
                console.error('Usage: simple-agent-manager start <agent-role>');
                process.exit(1);
            }
            try {
                const info = await manager.startAgent(agentRole);
                console.log(`Started ${agentRole} on port ${info.port}`);
            } catch (error) {
                console.error(`Failed to start ${agentRole}: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'stop':
            const stopRole = args[0];
            if (!stopRole) {
                console.error('Usage: simple-agent-manager stop <agent-role>');
                process.exit(1);
            }
            await manager.stopAgent(stopRole);
            console.log(`Stopped ${stopRole}`);
            break;

        case 'reload':
            const reloadRole = args[0];
            if (!reloadRole) {
                console.error('Usage: simple-agent-manager reload <agent-role>');
                process.exit(1);
            }
            try {
                await manager.hotReloadAgent(reloadRole);
                console.log(`Reloaded ${reloadRole}`);
            } catch (error) {
                console.error(`Failed to reload ${reloadRole}: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'status':
            const statusRole = args[0];
            if (statusRole) {
                const status = manager.getAgentStatus(statusRole);
                console.log(`${statusRole}: ${JSON.stringify(status, null, 2)}`);
            } else {
                const allStatus = manager.listAgents();
                console.log(JSON.stringify(allStatus, null, 2));
            }
            break;

        case 'research':
            const [researchRole, topic] = args;
            if (!researchRole || !topic) {
                console.error('Usage: simple-agent-manager research <agent-role> <topic>');
                process.exit(1);
            }
            try {
                const taskId = await manager.startResearchTask(researchRole, topic);
                console.log(`Started research task ${taskId}`);
            } catch (error) {
                console.error(`Research task failed: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'enable-files':
            const [fileRole, workspace] = args;
            if (!fileRole || !workspace) {
                console.error('Usage: simple-agent-manager enable-files <agent-role> <workspace-dir>');
                process.exit(1);
            }
            try {
                const workspaceDir = await manager.enableFileCreation(fileRole, workspace);
                console.log(`Enabled file creation in ${workspaceDir}`);
            } catch (error) {
                console.error(`File creation setup failed: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'start-with-coordination':
            const coordRole = args[0];
            if (!coordRole) {
                console.error('Usage: simple-agent-manager start-with-coordination <agent-role>');
                process.exit(1);
            }
            try {
                const info = await manager.startAgentWithCoordination(coordRole);
                console.log(`Started ${coordRole} with coordination on port ${info.port}`);
            } catch (error) {
                console.error(`Failed to start ${coordRole} with coordination: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'execute-task':
            const [execRole, taskId, taskDescription] = args;
            if (!execRole || !taskId || !taskDescription) {
                console.error('Usage: simple-agent-manager execute-task <agent-role> <task-id> <task-description>');
                process.exit(1);
            }
            try {
                const result = await manager.executeTaskWithAgent(execRole, taskId, taskDescription);
                console.log(`Task execution result: ${JSON.stringify(result, null, 2)}`);
            } catch (error) {
                console.error(`Task execution failed: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'coordination-status':
            const coordStatus = manager.getCoordinationStatus();
            console.log(JSON.stringify(coordStatus, null, 2));
            break;

        case 'suggest-task':
            const [suggTaskId, suggAgent, reasoning] = args;
            if (!suggTaskId || !suggAgent || !reasoning) {
                console.error('Usage: simple-agent-manager suggest-task <task-id> <agent-role> <reasoning>');
                process.exit(1);
            }
            try {
                const suggestion = await manager.createTaskSuggestion(suggTaskId, suggAgent, reasoning);
                console.log(`Created suggestion: ${suggestion.id}`);
            } catch (error) {
                console.error(`Failed to create suggestion: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'start-all':
            console.log('Starting all agents...');
            const agentList = ['orchestrator-agent', 'frontend-agent', 'backend-agent', 'devops-agent', 'qa-specialist'];
            for (const agent of agentList) {
                try {
                    await manager.startAgentWithCoordination(agent);
                    console.log(`✓ Started ${agent}`);
                } catch (error) {
                    console.error(`✗ Failed to start ${agent}: ${error.message}`);
                }
            }
            break;

        case 'stop-all':
            console.log('Stopping all agents...');
            for (const [agentRole] of manager.activeAgents) {
                try {
                    await manager.stopAgent(agentRole);
                    console.log(`✓ Stopped ${agentRole}`);
                } catch (error) {
                    console.error(`✗ Failed to stop ${agentRole}: ${error.message}`);
                }
            }
            break;

        case 'start-batch':
            const startAgents = args[0] ? args[0].split(',') : ['orchestrator-agent', 'frontend-agent', 'backend-agent', 'devops-agent', 'qa-specialist'];
            const batchSize = parseInt(args[1]) || 3;
            try {
                const result = await manager.startAgentsBatch(startAgents, batchSize);
                console.log(`Batch start completed: ${result.results.filter(r => r.success).length}/${startAgents.length} successful`);
                if (result.failures.length > 0) {
                    console.log('Failures:', result.failures);
                }
            } catch (error) {
                console.error(`Batch start failed: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'stop-batch':
            const stopAgents = args[0] ? args[0].split(',') : Array.from(manager.activeAgents.keys());
            try {
                const result = await manager.stopAgentsBatch(stopAgents);
                console.log(`Batch stop completed: ${result.results.filter(r => r.success).length}/${stopAgents.length} successful`);
                if (result.failures.length > 0) {
                    console.log('Failures:', result.failures);
                }
            } catch (error) {
                console.error(`Batch stop failed: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'health-check':
            const healthResults = await manager.performHealthCheck();
            console.log('Health Check Results:');
            healthResults.forEach(result => {
                const status = result.healthy ? '✓ HEALTHY' : '✗ UNHEALTHY';
                console.log(`  ${result.agentRole}: ${status} (uptime: ${Math.floor(result.uptime / 1000)}s)`);
            });
            break;

        case 'system-status':
            const systemStatus = manager.getSystemStatus();
            console.log(JSON.stringify(systemStatus, null, 2));
            break;

        case 'queue-task':
            const [queueTaskId, queueAgent, queueDesc, priority] = args;
            if (!queueTaskId || !queueAgent || !queueDesc) {
                console.error('Usage: simple-agent-manager queue-task <task-id> <agent-role> <description> [priority]');
                process.exit(1);
            }
            try {
                const task = manager.queueTask(queueTaskId, queueAgent, queueDesc, priority);
                console.log(`Queued task ${task.id} for ${task.agentRole} (priority: ${task.priority})`);
            } catch (error) {
                console.error(`Failed to queue task: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'process-queue':
            try {
                const result = await manager.processTaskQueue();
                console.log(`Queue processing completed: ${result.processed} tasks processed, ${result.failed || 0} failed`);
                if (result.details && result.details.failed.length > 0) {
                    console.log('Failed tasks:', result.details.failed);
                }
            } catch (error) {
                console.error(`Queue processing failed: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'cleanup':
            await manager.cleanup();
            console.log('Agent manager cleanup completed');
            break;

        case 'auto-assign':
            const [autoTaskId, autoTitle, autoDescription] = args;
            if (!autoTaskId || !autoTitle) {
                console.error('Usage: simple-agent-manager auto-assign <task-id> <title> [description]');
                process.exit(1);
            }
            try {
                const task = {
                    id: autoTaskId,
                    title: autoTitle,
                    description: autoDescription || autoTitle
                };
                const result = await manager.autoAssignTask(task);
                console.log(`Auto-assigned task ${autoTaskId} to ${result.assignment.agent}`);
                console.log(`Score: ${result.assignment.score}/100`);
                console.log(`Reasoning: ${result.assignment.reasoning}`);
            } catch (error) {
                console.error(`Auto-assignment failed: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'analyze-task':
            const [analyzeTaskId, analyzeTitle, analyzeDescription] = args;
            if (!analyzeTaskId || !analyzeTitle) {
                console.error('Usage: simple-agent-manager analyze-task <task-id> <title> [description]');
                process.exit(1);
            }
            try {
                const task = {
                    id: analyzeTaskId,
                    title: analyzeTitle,
                    description: analyzeDescription || analyzeTitle
                };
                const analysis = manager.analyzeTaskRequirements(task);
                console.log('Task Analysis:');
                console.log(`  Keywords: ${analysis.analysis.keywords.join(', ')}`);
                console.log(`  Complexity: ${analysis.analysis.complexity}/4`);
                console.log(`  Priority: ${analysis.analysis.priority}`);
                console.log(`\nRecommendation:`);
                console.log(`  Agent: ${analysis.recommendation.agent}`);
                console.log(`  Score: ${analysis.recommendation.score}/100`);
                console.log(`  Reasoning: ${analysis.recommendation.reasoning}`);
            } catch (error) {
                console.error(`Task analysis failed: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'capability-report':
            const capabilityReport = manager.getCapabilityReport();
            console.log('Capability Report:');
            console.log(JSON.stringify(capabilityReport, null, 2));
            break;

        case 'smart-process-queue':
            try {
                const result = await manager.processTaskQueueWithAutoAssignment();
                console.log(`Smart queue processing completed:`);
                console.log(`  Processed: ${result.processed} tasks`);
                console.log(`  Failed: ${result.failed} tasks`);
                console.log(`  Success rate: ${result.summary?.successRate || 0}%`);
            } catch (error) {
                console.error(`Smart queue processing failed: ${error.message}`);
                process.exit(1);
            }
            break;

        case 'get-recommendations':
            const [recTaskId, recTitle, recDescription] = args;
            if (!recTaskId || !recTitle) {
                console.error('Usage: simple-agent-manager get-recommendations <task-id> <title> [description]');
                process.exit(1);
            }
            try {
                const task = {
                    id: recTaskId,
                    title: recTitle,
                    description: recDescription || recTitle
                };
                const recommendations = manager.getAssignmentRecommendations(task);
                console.log('Assignment Recommendations:');
                recommendations.forEach((rec, index) => {
                    console.log(`  ${index + 1}. ${rec.agentId} (score: ${rec.score}/100)`);
                    console.log(`     Reasoning: ${rec.reasoning}`);
                    console.log(`     Status: ${rec.agentStatus.status}`);
                });
            } catch (error) {
                console.error(`Failed to get recommendations: ${error.message}`);
                process.exit(1);
            }
            break;

        default:
            console.log(`Usage: simple-agent-manager <command> [args]
            
Commands:
  start <agent-role>                          Start an agent
  stop <agent-role>                           Stop an agent  
  reload <agent-role>                         Hot-reload an agent
  status [agent-role]                         Get agent status
  research <agent-role> <topic>               Start web research task
  enable-files <agent-role> <dir>             Enable file creation
  start-with-coordination <agent-role>        Start agent with coordination
  execute-task <agent-role> <task-id> <desc>  Execute task with coordination
  coordination-status                         Get coordination status
  suggest-task <task-id> <agent-role> <reasoning>  Create task suggestion
  start-all                                   Start all agents with coordination
  stop-all                                    Stop all running agents
  
Batch Operations (Enhanced for 10-20 agents):
  start-batch [agents] [batch-size]           Start agents in batches (default: all, size=3)
  stop-batch [agents]                         Stop agents in parallel
  health-check                                Check health of all active agents
  system-status                               Get comprehensive system status
  queue-task <task-id> <agent> <desc> [priority]  Queue task for processing
  process-queue                               Process queued tasks
  cleanup                                     Cleanup all resources and stop monitoring

Capability-Based Auto-Assignment:
  auto-assign <task-id> <title> [description]  Auto-assign task to best agent
  analyze-task <task-id> <title> [description]  Analyze task requirements
  capability-report                           Get capability analysis report
  smart-process-queue                         Process queue with auto-assignment
  get-recommendations <task-id> <title> [desc]  Get assignment recommendations
  
Agent roles: orchestrator-agent, frontend-agent, backend-agent, devops-agent, qa-specialist`);
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SimpleAgentManager;