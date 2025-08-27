/**
 * Working Copy Controller - Option C Implementation
 * Manages the working-tasks.json file as a bridge between TaskMaster and UI
 */

const fs = require('fs');
const path = require('path');
const express = require('express');

class WorkingCopyController {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.router = express.Router();
        this.workingTasksFile = path.join(projectRoot, '.taskmaster/working-tasks.json');
        this.tasksFile = path.join(projectRoot, '.taskmaster/tasks/tasks.json');
        this.setupRoutes();
    }

    setupRoutes() {
        // Get working copy tasks
        this.router.get('/tasks', (req, res) => {
            try {
                const workingTasks = this.loadWorkingTasks();
                res.json({
                    success: true,
                    tasks: workingTasks.tasks || [],
                    agents: workingTasks.agents || {},
                    lastSync: workingTasks.lastSync,
                    lastModified: workingTasks.lastModified,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Sync from TaskMaster to working copy
        this.router.post('/sync/from-taskmaster', (req, res) => {
            try {
                const result = this.syncFromTaskMaster();
                res.json({
                    success: true,
                    message: 'Synced from TaskMaster to working copy',
                    taskCount: result.taskCount,
                    agentCount: result.agentCount,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Sync from working copy to TaskMaster
        this.router.post('/sync/to-taskmaster', (req, res) => {
            try {
                const result = this.syncToTaskMaster();
                res.json({
                    success: true,
                    message: 'Synced from working copy to TaskMaster',
                    updatedTasks: result.updatedTasks,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Assign task in working copy
        this.router.post('/tasks/:id/assign', (req, res) => {
            try {
                const { id } = req.params;
                const { agentId, reasoning } = req.body;
                
                if (!agentId) {
                    return res.status(400).json({
                        success: false,
                        error: 'agentId is required'
                    });
                }

                const result = this.assignTaskInWorkingCopy(id, agentId, reasoning);
                res.json({
                    success: true,
                    taskId: id,
                    agentId: agentId,
                    result: result,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Update task status in working copy
        this.router.patch('/tasks/:id/status', (req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.body;
                
                if (!status) {
                    return res.status(400).json({
                        success: false,
                        error: 'status is required'
                    });
                }

                const result = this.updateTaskStatusInWorkingCopy(id, status);
                res.json({
                    success: true,
                    taskId: id,
                    status: status,
                    result: result,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get sync status
        this.router.get('/sync/status', (req, res) => {
            try {
                const status = this.getSyncStatus();
                res.json({
                    success: true,
                    sync: status,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    /**
     * Load working tasks from working-tasks.json
     */
    loadWorkingTasks() {
        if (!fs.existsSync(this.workingTasksFile)) {
            // Initialize empty working copy
            const initialData = {
                tasks: [],
                agents: {},
                lastSync: null,
                lastModified: new Date().toISOString(),
                metadata: {
                    version: '1.0.0',
                    type: 'working-copy'
                }
            };
            fs.writeFileSync(this.workingTasksFile, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        
        return JSON.parse(fs.readFileSync(this.workingTasksFile, 'utf8'));
    }

    /**
     * Save working tasks to working-tasks.json
     */
    saveWorkingTasks(data) {
        data.lastModified = new Date().toISOString();
        fs.writeFileSync(this.workingTasksFile, JSON.stringify(data, null, 2));
    }

    /**
     * Sync from TaskMaster JSON to working copy
     */
    syncFromTaskMaster() {
        if (!fs.existsSync(this.tasksFile)) {
            throw new Error('TaskMaster tasks file not found');
        }

        const tasksData = JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
        const workingData = this.loadWorkingTasks();

        // Extract tasks from master workspace
        const masterTasks = tasksData.master?.tasks || [];
        
        // Load agent data
        const agentsFile = path.join(this.projectRoot, '.taskmaster/agents/agents.json');
        let agentsData = {};
        if (fs.existsSync(agentsFile)) {
            const agents = JSON.parse(fs.readFileSync(agentsFile, 'utf8'));
            agents.forEach(agent => {
                agentsData[agent.id] = {
                    name: agent.name || agent.id,
                    capabilities: agent.capabilities || [],
                    status: agent.status || 'active',
                    assignedTasks: agent.assignedTasks || []
                };
            });
        }

        // Update working copy
        workingData.tasks = masterTasks;
        workingData.agents = agentsData;
        workingData.lastSync = new Date().toISOString();

        this.saveWorkingTasks(workingData);

        return {
            taskCount: masterTasks.length,
            agentCount: Object.keys(agentsData).length
        };
    }

    /**
     * Sync from working copy to TaskMaster
     */
    syncToTaskMaster() {
        const workingData = this.loadWorkingTasks();
        
        if (!fs.existsSync(this.tasksFile)) {
            throw new Error('TaskMaster tasks file not found');
        }

        const tasksData = JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
        
        // Update master workspace with working copy tasks
        if (!tasksData.master) {
            tasksData.master = { tasks: [] };
        }
        
        tasksData.master.tasks = workingData.tasks;

        // Save back to TaskMaster
        fs.writeFileSync(this.tasksFile, JSON.stringify(tasksData, null, 2));

        // Update agents file
        const agentsFile = path.join(this.projectRoot, '.taskmaster/agents/agents.json');
        if (fs.existsSync(agentsFile)) {
            const agents = JSON.parse(fs.readFileSync(agentsFile, 'utf8'));
            
            // Update agent assignments from working copy
            agents.forEach(agent => {
                if (workingData.agents[agent.id]) {
                    agent.assignedTasks = workingData.agents[agent.id].assignedTasks || [];
                    agent.status = workingData.agents[agent.id].status || 'active';
                    agent.lastUpdated = new Date().toISOString();
                }
            });
            
            fs.writeFileSync(agentsFile, JSON.stringify(agents, null, 2));
        }

        return {
            updatedTasks: workingData.tasks.length
        };
    }

    /**
     * Assign task to agent in working copy
     */
    assignTaskInWorkingCopy(taskId, agentId, reasoning) {
        const workingData = this.loadWorkingTasks();
        
        // Find task
        const task = workingData.tasks.find(t => t.id.toString() === taskId.toString());
        if (!task) {
            throw new Error(`Task ${taskId} not found in working copy`);
        }

        // Update task assignment
        if (!task.agentMetadata) {
            task.agentMetadata = {};
        }
        
        task.agentMetadata.assignedAgent = agentId;
        task.agentMetadata.assignedAt = new Date().toISOString();
        task.agentMetadata.reasoning = reasoning || 'Assigned via working copy';
        task.status = 'in-progress';

        // Update agent assignments
        if (!workingData.agents[agentId]) {
            workingData.agents[agentId] = {
                name: agentId,
                capabilities: [],
                status: 'active',
                assignedTasks: []
            };
        }
        
        if (!workingData.agents[agentId].assignedTasks.includes(taskId)) {
            workingData.agents[agentId].assignedTasks.push(taskId);
        }

        this.saveWorkingTasks(workingData);

        return {
            assigned: true,
            task: task,
            agent: workingData.agents[agentId]
        };
    }

    /**
     * Update task status in working copy
     */
    updateTaskStatus(taskId, status, agentId = null, completionNotes = null) {
        const workingData = this.loadWorkingTasks();
        
        // Find task
        const task = workingData.tasks.find(t => t.id.toString() === taskId.toString());
        if (!task) {
            throw new Error(`Task ${taskId} not found in working copy`);
        }

        // Update task status
        task.status = status;
        
        // Add completion metadata
        if (agentId) {
            if (!task.agentMetadata) {
                task.agentMetadata = {};
            }
            task.agentMetadata.completedBy = agentId;
            task.agentMetadata.completedAt = new Date().toISOString();
        }
        
        if (completionNotes) {
            task.completionNotes = completionNotes;
        }

        // If task is being marked as done, remove it from agent's assigned tasks
        if (status === 'done' && agentId && workingData.agents[agentId]) {
            const agent = workingData.agents[agentId];
            agent.assignedTasks = agent.assignedTasks.filter(t => t.toString() !== taskId.toString());
            agent.status = agent.assignedTasks.length > 0 ? 'active' : 'available';
        }

        this.saveWorkingTasks(workingData);

        return {
            updated: true,
            task: task,
            newStatus: status
        };
    }


    /**
     * Get sync status between working copy and TaskMaster
     */
    getSyncStatus() {
        const workingData = this.loadWorkingTasks();
        
        let taskmasterModified = null;
        if (fs.existsSync(this.tasksFile)) {
            const stats = fs.statSync(this.tasksFile);
            taskmasterModified = stats.mtime.toISOString();
        }

        const workingModified = workingData.lastModified;
        const lastSync = workingData.lastSync;

        return {
            workingCopy: {
                exists: fs.existsSync(this.workingTasksFile),
                lastModified: workingModified,
                taskCount: workingData.tasks?.length || 0
            },
            taskmaster: {
                exists: fs.existsSync(this.tasksFile),
                lastModified: taskmasterModified
            },
            sync: {
                lastSync: lastSync,
                needsSync: !lastSync || (taskmasterModified && taskmasterModified > lastSync)
            }
        };
    }

    getRouter() {
        return this.router;
    }
}

module.exports = WorkingCopyController;