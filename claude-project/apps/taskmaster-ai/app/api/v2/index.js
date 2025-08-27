/**
 * TaskMaster AI - API v2 Main Router
 * Simplified API that preserves agent intelligence while using TaskMaster as single source of truth
 */

const express = require('express');
const path = require('path');

// Import controllers
const WorkspaceController = require('./workspace/workspace-controller');
const AgentsController = require('./agents/agents-controller');
const OrchestratorController = require('./orchestrator/orchestrator-controller');
const MonitoringController = require('./monitoring/monitoring-controller');
const WorkingCopyController = require('./working-copy/working-copy-controller');

class APIv2Router {
    constructor(projectRoot, coordinationWorkflow) {
        this.router = express.Router();
        this.projectRoot = projectRoot;
        this.coordinationWorkflow = coordinationWorkflow;
        this.setupRoutes();
    }

    setupRoutes() {
        // API v2 welcome endpoint
        this.router.get('/', (req, res) => {
            res.json({
                name: 'TaskMaster AI API v2',
                version: '2.0.0',
                description: 'Simplified API preserving agent intelligence with TaskMaster as single source of truth',
                features: [
                    'Workspace-based task assignment',
                    'LLM-powered agent intelligence',
                    'Enhanced orchestrator interface',
                    'Human-understandable workflows',
                    'Direct TaskMaster integration'
                ],
                endpoints: {
                    workspace: '/api/v2/workspace',
                    agents: '/api/v2/agents', 
                    orchestrator: '/api/v2/orchestrator',
                    tasks: '/api/v2/tasks',
                    monitoring: '/api/v2/monitoring',
                    workingCopy: '/api/v2/working-copy'
                },
                timestamp: new Date().toISOString()
            });
        });

        // Initialize controllers
        const workspaceController = new WorkspaceController(this.projectRoot);
        const agentsController = new AgentsController(this.projectRoot, this.coordinationWorkflow);
        const orchestratorController = new OrchestratorController(this.projectRoot, this.coordinationWorkflow);
        const monitoringController = new MonitoringController(this.projectRoot, this.coordinationWorkflow);
        const workingCopyController = new WorkingCopyController(this.projectRoot);

        // Mount controller routes
        this.router.use('/workspace', workspaceController.getRouter());
        this.router.use('/agents', agentsController.getRouter());
        this.router.use('/orchestrator', orchestratorController.getRouter());
        this.router.use('/monitoring', monitoringController.getRouter());
        this.router.use('/working-copy', workingCopyController.getRouter());

        // Tasks endpoint (using working copy for Option C)
        this.router.get('/tasks', (req, res) => {
            try {
                const { status, workspace } = req.query;
                const workingData = workingCopyController.loadWorkingTasks();
                let tasks = workingData.tasks || [];
                
                // Apply status filter if provided
                if (status) {
                    tasks = tasks.filter(task => task.status === status);
                }
                
                res.json({
                    success: true,
                    source: 'working-copy',
                    filter: { status, workspace },
                    count: tasks.length,
                    tasks: tasks,
                    agents: workingData.agents || {},
                    lastSync: workingData.lastSync,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Task assignment endpoint (using working copy for Option C)
        this.router.post('/tasks/:id/assign', (req, res) => {
            try {
                const { id } = req.params;
                const { agentId, workspace, reasoning } = req.body;
                
                if (!agentId) {
                    return res.status(400).json({
                        success: false,
                        error: 'agentId is required'
                    });
                }

                const result = workingCopyController.assignTaskInWorkingCopy(id, agentId, reasoning);
                
                res.json({
                    success: true,
                    source: 'working-copy',
                    taskId: id,
                    assignedTo: agentId,
                    workspace: workspace || 'working-copy',
                    reasoning: reasoning || 'Manual assignment',
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

        // Task status update endpoint
        this.router.post('/tasks/:id/status', (req, res) => {
            try {
                const { id } = req.params;
                const { status, agentId, completionNotes } = req.body;
                
                if (!status) {
                    return res.status(400).json({
                        success: false,
                        error: 'status is required'
                    });
                }

                const result = workingCopyController.updateTaskStatus(id, status, agentId, completionNotes);
                
                res.json({
                    success: true,
                    source: 'working-copy',
                    taskId: id,
                    status: status,
                    updatedBy: agentId,
                    notes: completionNotes,
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

        // System status endpoint
        this.router.get('/status', (req, res) => {
            try {
                const status = this.getSystemStatus();
                
                res.json({
                    success: true,
                    system: status,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Health check endpoint
        this.router.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                api: 'v2',
                services: {
                    taskmaster: this.checkTaskMasterHealth(),
                    agents: this.checkAgentsHealth(),
                    coordination: this.checkCoordinationHealth()
                },
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * Get tasks using TaskMaster JSON files directly
     */
    getTasks(statusFilter, workspaceFilter) {
        try {
            const fs = require('fs');
            const tasksFile = path.join(this.projectRoot, '.taskmaster/tasks/tasks.json');
            
            if (!fs.existsSync(tasksFile)) {
                return [];
            }
            
            const tasksData = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
            let allTasks = [];
            
            // Extract tasks from all workspaces or specific workspace
            const workspaces = workspaceFilter ? [workspaceFilter] : Object.keys(tasksData);
            
            for (const workspace of workspaces) {
                if (tasksData[workspace] && tasksData[workspace].tasks) {
                    const workspaceTasks = tasksData[workspace].tasks.map(task => ({
                        ...task,
                        workspace: workspace
                    }));
                    allTasks.push(...workspaceTasks);
                }
            }
            
            // Apply status filter if provided
            if (statusFilter) {
                allTasks = allTasks.filter(task => task.status === statusFilter);
            }
            
            return allTasks;
        } catch (error) {
            console.error('Error getting tasks:', error);
            return [];
        }
    }

    /**
     * Assign task to agent using workspace
     */
    assignTask(taskId, agentId, workspace, reasoning) {
        try {
            const { execSync } = require('child_process');
            
            // Get or create workspace for agent
            const targetWorkspace = workspace || 'master'; // Use master workspace for now
            
            // Update task status and add assignment info
            const updateCommand = `npx task-master update-task --id=${taskId} --prompt="AGENT ASSIGNED: ${agentId} - ${reasoning || 'Task assignment via API v2'}"`;
            const statusCommand = `npx task-master set-status --id=${taskId} --status=in-progress`;
            
            try {
                execSync(updateCommand, {
                    cwd: this.projectRoot,
                    encoding: 'utf8',
                    timeout: 10000,
                    stdio: 'pipe'
                });
                
                execSync(statusCommand, {
                    cwd: this.projectRoot,
                    encoding: 'utf8', 
                    timeout: 10000,
                    stdio: 'pipe'
                });
            } catch (cmdError) {
                console.warn('TaskMaster command warning:', cmdError.message);
                // Continue with assignment even if commands have issues
            }
            
            // Update workspace mapping
            this.updateWorkspaceMapping(agentId, targetWorkspace);
            
            // Update agents.json to track assignment
            this.updateAgentAssignment(agentId, taskId);
            
            return {
                assigned: true,
                taskId,
                agentId,
                workspace: targetWorkspace,
                reasoning: reasoning || 'Task assignment via API v2',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error assigning task:', error);
            return {
                assigned: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get overall system status
     */
    getSystemStatus() {
        const fs = require('fs');
        
        try {
            // Check TaskMaster files
            const tasksFile = path.join(this.projectRoot, '.taskmaster/tasks/tasks.json');
            const agentsFile = path.join(this.projectRoot, '.taskmaster/agents/agents.json');
            
            const tasksExist = fs.existsSync(tasksFile);
            const agentsExist = fs.existsSync(agentsFile);
            
            let taskCount = 0;
            let agentCount = 0;
            
            if (tasksExist) {
                const tasksData = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
                taskCount = Object.values(tasksData).reduce((total, workspace) => 
                    total + (workspace.tasks ? workspace.tasks.length : 0), 0);
            }
            
            if (agentsExist) {
                const agentsData = JSON.parse(fs.readFileSync(agentsFile, 'utf8'));
                agentCount = agentsData.length;
            }
            
            return {
                taskmaster: {
                    available: tasksExist && agentsExist,
                    taskCount,
                    agentCount
                },
                coordination: {
                    active: !!this.coordinationWorkflow,
                    status: this.coordinationWorkflow?.coordinationState?.status || 'unknown'
                },
                api: {
                    version: '2.0.0',
                    endpoints: 5,
                    uptime: process.uptime()
                }
            };
        } catch (error) {
            return {
                error: error.message,
                healthy: false
            };
        }
    }

    /**
     * Update workspace mapping for agent
     */
    updateWorkspaceMapping(agentId, workspace) {
        try {
            const fs = require('fs');
            const mappingFile = path.join(this.projectRoot, '.taskmaster/agents/workspace-mapping.json');
            
            let mapping = {};
            if (fs.existsSync(mappingFile)) {
                mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
            }
            
            mapping[workspace] = agentId;
            fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
        } catch (error) {
            console.error('Error updating workspace mapping:', error);
        }
    }

    /**
     * Update agent assignment in agents.json
     */
    updateAgentAssignment(agentId, taskId) {
        try {
            const fs = require('fs');
            const agentsFile = path.join(this.projectRoot, '.taskmaster/agents/agents.json');
            
            if (fs.existsSync(agentsFile)) {
                const agents = JSON.parse(fs.readFileSync(agentsFile, 'utf8'));
                const agent = agents.find(a => a.id === agentId);
                
                if (agent) {
                    if (!agent.assignedTasks) {
                        agent.assignedTasks = [];
                    }
                    
                    // Add task if not already assigned
                    if (!agent.assignedTasks.includes(taskId)) {
                        agent.assignedTasks.push(taskId);
                    }
                    
                    agent.lastUpdated = new Date().toISOString();
                    agent.status = 'working';
                    
                    fs.writeFileSync(agentsFile, JSON.stringify(agents, null, 2));
                }
            }
        } catch (error) {
            console.error('Error updating agent assignment:', error);
        }
    }

    /**
     * Health check methods
     */
    checkTaskMasterHealth() {
        try {
            const { execSync } = require('child_process');
            execSync('task-master --version', { 
                cwd: this.projectRoot, 
                timeout: 5000,
                stdio: 'ignore'
            });
            return 'healthy';
        } catch (error) {
            return 'unavailable';
        }
    }

    checkAgentsHealth() {
        try {
            const fs = require('fs');
            const agentsFile = path.join(this.projectRoot, '.taskmaster/agents/agents.json');
            return fs.existsSync(agentsFile) ? 'healthy' : 'missing';
        } catch (error) {
            return 'error';
        }
    }

    checkCoordinationHealth() {
        return this.coordinationWorkflow ? 'active' : 'inactive';
    }

    getRouter() {
        return this.router;
    }
}

module.exports = APIv2Router;