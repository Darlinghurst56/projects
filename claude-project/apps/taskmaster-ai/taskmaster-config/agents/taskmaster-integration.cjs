#!/usr/bin/env node

/**
 * TaskMaster Integration Module
 * Provides integration between TaskMaster CLI and the web dashboard
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class TaskMasterIntegration {
    constructor(projectRoot = null) {
        this.projectRoot = projectRoot || process.cwd();
        this.taskMasterPath = 'task-master';
    }

    /**
     * Execute TaskMaster CLI command
     */
    async executeCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const child = spawn(this.taskMasterPath, [command, ...args], {
                cwd: this.projectRoot,
                stdio: 'pipe'
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                } else {
                    reject(new Error(`Command failed: ${stderr}`));
                }
            });
        });
    }

    /**
     * Get all tasks from TaskMaster
     * Simple approach: Use the CLI wrapper for consistency
     */
    async getTasks() {
        try {
            // Read tasks directly from JSON file (simplified for MVP)
            const tasksPath = path.join(this.projectRoot, '.taskmaster/tasks/tasks.json');
            const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
            
            // Get tasks from master workspace
            const tasks = tasksData.master?.tasks || [];
            
            return {
                currentTag: 'master',
                tasks: tasks
            };
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return null;
        }
    }

    /**
     * Parse TaskMaster list output
     */
    parseTaskList(output) {
        const tasks = [];
        const lines = output.split('\n');
        
        for (const line of lines) {
            if (line.trim() && !line.startsWith('🏷️') && !line.startsWith('[')) {
                // Simple parsing - would need to be enhanced based on actual output format
                const taskMatch = line.match(/(\d+)\.\s+(.+)/);
                if (taskMatch) {
                    tasks.push({
                        id: taskMatch[1],
                        title: taskMatch[2],
                        status: 'pending',
                        assignedAgent: null
                    });
                }
            }
        }
        
        return tasks;
    }

    /**
     * Assign agent to a task
     */
    async assignAgentToTask(taskId, agentId) {
        try {
            await this.executeCommand('update-task', [
                '--id', taskId,
                '--prompt', `Assigned to agent: ${agentId}`
            ]);
            return true;
        } catch (error) {
            console.error('Error assigning agent to task:', error);
            return false;
        }
    }

    /**
     * Auto-assign all unassigned tasks to available agents
     */
    async autoAssignAllTasks() {
        const tasks = await this.getTasks();
        
        // Check for both unassigned tasks AND avoid reassigning already assigned tasks
        const unassignedTasks = tasks.filter(task => 
            !task.assignedAgent && 
            !task.agentMetadata?.assignedAgent &&
            task.status === 'pending'
        );
        
        if (unassignedTasks.length === 0) {
            console.log('No unassigned tasks found for auto-assignment');
            return 0;
        }
        
        // Get available agents (not in cooldown)
        const AgentCoordination = require('./coordination-workflow.cjs');
        const coordination = new AgentCoordination(this.projectRoot);
        const availableAgents = coordination.agents.filter(agent => 
            agent.status === 'available' && 
            !agent.cooldownUntil || 
            new Date(agent.cooldownUntil) < new Date()
        );
        
        if (availableAgents.length === 0) {
            console.log('No available agents for auto-assignment');
            return 0;
        }
        
        let agentIndex = 0;
        let assignedCount = 0;
        
        for (const task of unassignedTasks) {
            const agent = availableAgents[agentIndex % availableAgents.length];
            const success = await this.assignAgentToTask(task.id, agent.id);
            if (success) {
                assignedCount++;
                console.log(`Assigned task ${task.id} to agent ${agent.id}`);
            }
            agentIndex++;
        }
        
        return assignedCount;
    }

    /**
     * Get next task to work on
     */
    async getNextTask() {
        try {
            const output = await this.executeCommand('next');
            return this.parseNextTask(output);
        } catch (error) {
            console.error('Error getting next task:', error);
            return null;
        }
    }

    /**
     * Parse next task output
     */
    parseNextTask(output) {
        const lines = output.split('\n');
        for (const line of lines) {
            const taskMatch = line.match(/(\d+)\.\s+(.+)/);
            if (taskMatch) {
                return {
                    id: taskMatch[1],
                    title: taskMatch[2],
                    status: 'pending'
                };
            }
        }
        return null;
    }

    /**
     * Update task status
     */
    async updateTaskStatus(taskId, status) {
        try {
            await this.executeCommand('set-status', [
                '--id', taskId,
                '--status', status
            ]);
            return true;
        } catch (error) {
            console.error('Error updating task status:', error);
            return false;
        }
    }

    /**
     * Add new task
     */
    async addTask(prompt, priority = 'medium') {
        try {
            await this.executeCommand('add-task', [
                '--prompt', prompt,
                '--priority', priority
            ]);
            return true;
        } catch (error) {
            console.error('Error adding task:', error);
            return false;
        }
    }
}

module.exports = TaskMasterIntegration;