#!/usr/bin/env node

/**
 * TaskMaster AI - Workflow Manager
 * Simplified workflow management for single-user operations
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class WorkflowManager {
    constructor() {
        this.projectRoot = path.join(__dirname, '..', '..');
        this.workflows = this.loadWorkflows();
    }

    /**
     * Load predefined workflows
     */
    loadWorkflows() {
        return {
            'morning-startup': {
                description: 'Start system for daily work',
                steps: [
                    { action: 'start-server', description: 'Start API server' },
                    { action: 'start-agents', description: 'Start all agents' },
                    { action: 'health-check', description: 'Verify system health' }
                ]
            },
            'development-session': {
                description: 'Development workflow with test tasks',
                steps: [
                    { action: 'start-server', description: 'Start API server' },
                    { action: 'start-agents', description: 'Start all agents' },
                    { action: 'create-test-tasks', description: 'Create test tasks' },
                    { action: 'process-tasks', description: 'Process task queue' },
                    { action: 'health-check', description: 'Final health check' }
                ]
            },
            'evening-shutdown': {
                description: 'Clean shutdown at end of day',
                steps: [
                    { action: 'process-remaining-tasks', description: 'Process any remaining tasks' },
                    { action: 'health-check', description: 'Final health check' },
                    { action: 'stop-agents', description: 'Stop all agents' },
                    { action: 'stop-server', description: 'Stop API server' },
                    { action: 'cleanup', description: 'Clean up resources' }
                ]
            },
            'quick-test': {
                description: 'Quick system test',
                steps: [
                    { action: 'start-server', description: 'Start API server' },
                    { action: 'start-agents-batch', description: 'Start agents in batch' },
                    { action: 'create-test-tasks', description: 'Create test tasks' },
                    { action: 'process-tasks', description: 'Process tasks' },
                    { action: 'stop-agents', description: 'Stop agents' },
                    { action: 'stop-server', description: 'Stop server' }
                ]
            }
        };
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [WORKFLOW] [${type}] ${message}`);
    }

    /**
     * Execute a workflow step
     */
    async executeStep(step) {
        this.log(`Executing: ${step.description}`);
        
        try {
            switch (step.action) {
                case 'start-server':
                    execSync('npm run start &', { cwd: this.projectRoot, stdio: 'pipe' });
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    break;

                case 'stop-server':
                    execSync('npm run system:stop', { cwd: this.projectRoot, stdio: 'pipe' });
                    break;

                case 'start-agents':
                    execSync('npm run agents:start', { cwd: this.projectRoot, stdio: 'pipe' });
                    break;

                case 'start-agents-batch':
                    execSync('npm run agents:batch-start', { cwd: this.projectRoot, stdio: 'pipe' });
                    break;

                case 'stop-agents':
                    execSync('npm run agents:stop', { cwd: this.projectRoot, stdio: 'pipe' });
                    break;

                case 'health-check':
                    const health = execSync('npm run agents:health-check', { 
                        cwd: this.projectRoot, 
                        encoding: 'utf8', 
                        stdio: 'pipe' 
                    });
                    console.log(health);
                    break;

                case 'create-test-tasks':
                    const batchOps = require('./batch-operations.js');
                    const ops = new batchOps();
                    await ops.createTestTasks();
                    break;

                case 'process-tasks':
                    execSync('npm run agents:process-queue', { cwd: this.projectRoot, stdio: 'pipe' });
                    break;

                case 'process-remaining-tasks':
                    execSync('npm run agents:process-queue', { cwd: this.projectRoot, stdio: 'pipe' });
                    break;

                case 'cleanup':
                    execSync('npm run agents:cleanup', { cwd: this.projectRoot, stdio: 'pipe' });
                    break;

                default:
                    this.log(`Unknown action: ${step.action}`, 'WARN');
            }
            
            this.log(`✓ Completed: ${step.description}`);
            return true;
        } catch (error) {
            this.log(`✗ Failed: ${step.description} - ${error.message}`, 'ERROR');
            return false;
        }
    }

    /**
     * Execute a complete workflow
     */
    async runWorkflow(workflowName) {
        const workflow = this.workflows[workflowName];
        if (!workflow) {
            throw new Error(`Unknown workflow: ${workflowName}`);
        }

        this.log(`Starting workflow: ${workflowName} - ${workflow.description}`);
        
        const results = [];
        for (const step of workflow.steps) {
            const success = await this.executeStep(step);
            results.push({ step, success });
            
            if (!success) {
                this.log(`Workflow failed at step: ${step.description}`, 'ERROR');
                break;
            }
            
            // Brief pause between steps
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const successful = results.filter(r => r.success).length;
        this.log(`Workflow completed: ${successful}/${results.length} steps successful`);
        
        return results;
    }

    /**
     * List available workflows
     */
    listWorkflows() {
        console.log('Available workflows:');
        for (const [name, workflow] of Object.entries(this.workflows)) {
            console.log(`  ${name}: ${workflow.description}`);
            console.log(`    Steps: ${workflow.steps.length}`);
        }
    }

    /**
     * Show workflow details
     */
    showWorkflow(workflowName) {
        const workflow = this.workflows[workflowName];
        if (!workflow) {
            console.error(`Unknown workflow: ${workflowName}`);
            return;
        }

        console.log(`Workflow: ${workflowName}`);
        console.log(`Description: ${workflow.description}`);
        console.log('Steps:');
        workflow.steps.forEach((step, index) => {
            console.log(`  ${index + 1}. ${step.description} (${step.action})`);
        });
    }
}

// CLI interface
async function main() {
    const manager = new WorkflowManager();
    const [,, command, ...args] = process.argv;

    try {
        switch (command) {
            case 'run':
                const workflowName = args[0];
                if (!workflowName) {
                    console.error('Usage: workflow-manager run <workflow-name>');
                    process.exit(1);
                }
                await manager.runWorkflow(workflowName);
                break;
            
            case 'list':
                manager.listWorkflows();
                break;
            
            case 'show':
                const showName = args[0];
                if (!showName) {
                    console.error('Usage: workflow-manager show <workflow-name>');
                    process.exit(1);
                }
                manager.showWorkflow(showName);
                break;
            
            default:
                console.log(`Usage: workflow-manager <command> [args]

Commands:
  run <workflow-name>     Execute a workflow
  list                    List available workflows
  show <workflow-name>    Show workflow details

Available workflows:
  morning-startup         Start system for daily work
  development-session     Development workflow with test tasks
  evening-shutdown        Clean shutdown at end of day
  quick-test             Quick system test
`);
                break;
        }
    } catch (error) {
        console.error('Workflow failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = WorkflowManager;