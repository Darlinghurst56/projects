#!/usr/bin/env node

/**
 * TaskMaster AI - Batch Operations CLI
 * Convenient batch scripts for single-user efficiency
 */

const { execSync } = require('child_process');
const path = require('path');

class BatchOperations {
    constructor() {
        this.managerScript = path.join(__dirname, '..', 'core', 'simple-agent-manager.js');
        this.serverScript = path.join(__dirname, '..', 'core', 'taskmaster-api-server.js');
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [BATCH-OPS] [${type}] ${message}`);
    }

    execCommand(command, description) {
        this.log(`Executing: ${description}`);
        try {
            const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
            return result;
        } catch (error) {
            this.log(`Command failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Quick startup - API server + all agents
     */
    async quickStart() {
        this.log('Starting TaskMaster AI system...');
        
        try {
            // Start API server in background
            this.log('Starting API server...');
            this.execCommand(`node ${this.serverScript} &`, 'Start API server');
            
            // Wait for server to start
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Start all agents in batch
            this.log('Starting all agents in batch...');
            const result = this.execCommand(`node ${this.managerScript} start-batch`, 'Start all agents');
            this.log('Quick start completed successfully');
            
            return result;
        } catch (error) {
            this.log(`Quick start failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Quick shutdown - stop all agents + API server
     */
    async quickShutdown() {
        this.log('Shutting down TaskMaster AI system...');
        
        try {
            // Stop all agents
            this.log('Stopping all agents...');
            this.execCommand(`node ${this.managerScript} stop-batch`, 'Stop all agents');
            
            // Stop API server
            this.log('Stopping API server...');
            this.execCommand('pkill -f taskmaster-api-server.js', 'Stop API server');
            
            this.log('Quick shutdown completed successfully');
        } catch (error) {
            this.log(`Quick shutdown failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Health check for entire system
     */
    async systemHealthCheck() {
        this.log('Performing system health check...');
        
        try {
            // Check API server
            const apiHealth = this.execCommand('curl -s http://localhost:3001/api/health', 'Check API health');
            this.log('API Server: ' + (apiHealth.includes('healthy') ? 'HEALTHY' : 'UNHEALTHY'));
            
            // Check agent health
            const agentHealth = this.execCommand(`node ${this.managerScript} health-check`, 'Check agent health');
            this.log('Agent Health Check Results:');
            console.log(agentHealth);
            
            // Get system status
            const systemStatus = this.execCommand(`node ${this.managerScript} system-status`, 'Get system status');
            const status = JSON.parse(systemStatus);
            
            this.log(`System Status: ${status.activeAgents}/${status.totalAgents} agents active`);
            
            return {
                api: apiHealth.includes('healthy'),
                agents: status.activeAgents,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.log(`Health check failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Restart entire system
     */
    async systemRestart() {
        this.log('Restarting TaskMaster AI system...');
        
        try {
            await this.quickShutdown();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.quickStart();
            
            this.log('System restart completed successfully');
        } catch (error) {
            this.log(`System restart failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Process task queue across all agents
     */
    async processAllTasks() {
        this.log('Processing all queued tasks...');
        
        try {
            const result = this.execCommand(`node ${this.managerScript} process-queue`, 'Process task queue');
            this.log('Task processing completed');
            console.log(result);
            return result;
        } catch (error) {
            this.log(`Task processing failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Create multiple test tasks for different agents
     */
    async createTestTasks() {
        this.log('Creating test tasks for agents...');
        
        const testTasks = [
            { agent: 'frontend-agent', task: 'Create responsive navigation component', priority: 'high' },
            { agent: 'backend-agent', task: 'Implement REST API endpoints', priority: 'high' },
            { agent: 'devops-agent', task: 'Set up Docker containerization', priority: 'medium' },
            { agent: 'qa-specialist', task: 'Write unit tests for components', priority: 'medium' },
            { agent: 'orchestrator-agent', task: 'Coordinate task assignments', priority: 'low' }
        ];
        
        try {
            for (const [index, task] of testTasks.entries()) {
                const taskId = `test-${Date.now()}-${index}`;
                this.execCommand(
                    `node ${this.managerScript} queue-task ${taskId} ${task.agent} "${task.task}" ${task.priority}`,
                    `Queue task for ${task.agent}`
                );
                this.log(`Queued task ${taskId} for ${task.agent}`);
            }
            
            this.log('All test tasks created successfully');
            return testTasks;
        } catch (error) {
            this.log(`Test task creation failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Development workflow: quick start + test tasks + process
     */
    async devWorkflow() {
        this.log('Starting development workflow...');
        
        try {
            // Quick start system
            await this.quickStart();
            
            // Create test tasks
            await this.createTestTasks();
            
            // Process tasks
            await this.processAllTasks();
            
            // Health check
            await this.systemHealthCheck();
            
            this.log('Development workflow completed successfully');
        } catch (error) {
            this.log(`Development workflow failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Cleanup everything
     */
    async cleanup() {
        this.log('Cleaning up all resources...');
        
        try {
            // Stop all agents and cleanup
            this.execCommand(`node ${this.managerScript} cleanup`, 'Cleanup agents');
            
            // Stop API server
            this.execCommand('pkill -f taskmaster-api-server.js', 'Stop API server');
            
            this.log('Cleanup completed successfully');
        } catch (error) {
            this.log(`Cleanup failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }
}

// CLI interface
async function main() {
    const ops = new BatchOperations();
    const [,, command] = process.argv;

    try {
        switch (command) {
            case 'quick-start':
                await ops.quickStart();
                break;
            
            case 'quick-shutdown':
                await ops.quickShutdown();
                break;
            
            case 'health-check':
                await ops.systemHealthCheck();
                break;
            
            case 'restart':
                await ops.systemRestart();
                break;
            
            case 'process-tasks':
                await ops.processAllTasks();
                break;
            
            case 'create-test-tasks':
                await ops.createTestTasks();
                break;
            
            case 'dev-workflow':
                await ops.devWorkflow();
                break;
            
            case 'cleanup':
                await ops.cleanup();
                break;
            
            default:
                console.log(`Usage: batch-operations <command>

Commands:
  quick-start         Start API server + all agents
  quick-shutdown      Stop all agents + API server
  health-check        Check system health
  restart             Restart entire system
  process-tasks       Process all queued tasks
  create-test-tasks   Create test tasks for all agents
  dev-workflow        Full development workflow
  cleanup             Clean up all resources
`);
                break;
        }
    } catch (error) {
        console.error('Batch operation failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = BatchOperations;