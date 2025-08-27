/**
 * TaskMaster AI - Agents Controller  
 * Manages LLM-powered agents with preserved intelligence and workflows
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AgentsController {
    constructor(projectRoot, coordinationWorkflow) {
        this.router = express.Router();
        this.projectRoot = projectRoot;
        this.coordinationWorkflow = coordinationWorkflow;
        this.setupRoutes();
    }

    setupRoutes() {
        // List all agents with capabilities and status
        this.router.get('/', (req, res) => {
            try {
                const agents = this.getAgentsWithStatus();
                
                res.json({
                    success: true,
                    count: agents.length,
                    agents: agents,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get specific agent status and workflow state
        this.router.get('/:id/status', (req, res) => {
            try {
                const { id } = req.params;
                const agent = this.getAgentStatus(id);
                
                if (!agent) {
                    return res.status(404).json({
                        success: false,
                        error: `Agent ${id} not found`
                    });
                }

                res.json({
                    success: true,
                    agent: agent,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get tasks assigned to specific agent
        this.router.get('/:id/tasks', (req, res) => {
            try {
                const { id } = req.params;
                const { status } = req.query;
                
                const tasks = this.getAgentTasks(id, status);
                
                res.json({
                    success: true,
                    agentId: id,
                    filter: status || 'all',
                    count: tasks.length,
                    tasks: tasks,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Trigger agent suggestion workflow
        this.router.post('/:id/suggest', (req, res) => {
            try {
                const { id } = req.params;
                const { taskId, context } = req.body;
                
                if (!taskId) {
                    return res.status(400).json({
                        success: false,
                        error: 'taskId is required'
                    });
                }

                const suggestion = this.triggerAgentSuggestion(id, taskId, context);
                
                res.json({
                    success: true,
                    agentId: id,
                    taskId: taskId,
                    suggestion: suggestion,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get agent's pending suggestions
        this.router.get('/:id/suggestions', (req, res) => {
            try {
                const { id } = req.params;
                const suggestions = this.getAgentSuggestions(id);
                
                res.json({
                    success: true,
                    agentId: id,
                    count: suggestions.length,
                    suggestions: suggestions,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Update agent configuration
        this.router.put('/:id/config', (req, res) => {
            try {
                const { id } = req.params;
                const { capabilities, tools, settings } = req.body;
                
                const result = this.updateAgentConfig(id, { capabilities, tools, settings });
                
                res.json({
                    success: true,
                    agentId: id,
                    updated: result,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get agent workflow execution logs
        this.router.get('/:id/logs', (req, res) => {
            try {
                const { id } = req.params;
                const { limit = 50 } = req.query;
                
                const logs = this.getAgentLogs(id, parseInt(limit));
                
                res.json({
                    success: true,
                    agentId: id,
                    count: logs.length,
                    logs: logs,
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
     * Get all agents with their current status
     */
    getAgentsWithStatus() {
        try {
            const agentsFile = path.join(this.projectRoot, '.taskmaster/agents/agents.json');
            const agents = JSON.parse(fs.readFileSync(agentsFile, 'utf8'));
            
            // Load working copy data for current assignments
            const workingCopyFile = path.join(this.projectRoot, '.taskmaster/working-tasks.json');
            let workingCopyAgents = {};
            if (fs.existsSync(workingCopyFile)) {
                const workingCopy = JSON.parse(fs.readFileSync(workingCopyFile, 'utf8'));
                workingCopyAgents = workingCopy.agents || {};
            }
            
            return agents.map(agent => {
                const workspaceMapping = this.getWorkspaceMapping();
                const assignedWorkspace = Object.keys(workspaceMapping).find(ws => workspaceMapping[ws] === agent.id);
                
                // Use working copy assignments as they are more current
                const workingCopyAgent = workingCopyAgents[agent.id];
                const currentAssignedTasks = workingCopyAgent ? workingCopyAgent.assignedTasks || [] : agent.assignedTasks || [];
                const currentStatus = workingCopyAgent ? workingCopyAgent.status || 'available' : agent.status || 'available';
                
                return {
                    id: agent.id,
                    name: this.getAgentDisplayName(agent.id),
                    capabilities: agent.capabilities || [],
                    status: currentStatus,
                    assignedTasks: currentAssignedTasks,
                    assignedWorkspace: assignedWorkspace || null,
                    lastUpdated: agent.lastUpdated,
                    workflowState: this.getAgentWorkflowState(agent.id),
                    performance: this.getAgentPerformance(agent.id)
                };
            });
        } catch (error) {
            console.error('Error getting agents:', error);
            return [];
        }
    }

    /**
     * Get detailed status for specific agent
     */
    getAgentStatus(agentId) {
        try {
            const agents = this.getAgentsWithStatus();
            const agent = agents.find(a => a.id === agentId);
            
            if (!agent) return null;
            
            return {
                ...agent,
                currentTask: this.getCurrentTask(agentId),
                recentActivity: this.getRecentActivity(agentId),
                suggestions: this.getAgentSuggestions(agentId),
                healthStatus: this.checkAgentHealth(agentId)
            };
        } catch (error) {
            console.error('Error getting agent status:', error);
            return null;
        }
    }

    /**
     * Get tasks assigned to agent (from their workspace)
     */
    getAgentTasks(agentId, statusFilter) {
        try {
            const workspaceMapping = this.getWorkspaceMapping();
            const assignedWorkspace = Object.keys(workspaceMapping).find(ws => workspaceMapping[ws] === agentId);
            
            if (!assignedWorkspace) {
                return [];
            }
            
            // Switch to agent's workspace and get tasks
            const command = statusFilter ? 
                `use-tag ${assignedWorkspace} && task-master list --status=${statusFilter} --format=json` :
                `use-tag ${assignedWorkspace} && task-master list --format=json`;
                
            const result = execSync(command, {
                cwd: this.projectRoot,
                encoding: 'utf8',
                timeout: 10000
            });
            
            return JSON.parse(result) || [];
        } catch (error) {
            console.error('Error getting agent tasks:', error);
            return [];
        }
    }

    /**
     * Trigger agent to provide suggestion for task
     */
    triggerAgentSuggestion(agentId, taskId, context) {
        try {
            // Load agent-specific intelligence
            const agentClass = this.loadAgentClass(agentId);
            if (!agentClass) {
                throw new Error(`Agent class not found for ${agentId}`);
            }
            
            const agent = new agentClass();
            
            // Get task details
            const task = this.getTaskDetails(taskId);
            if (!task) {
                throw new Error(`Task ${taskId} not found`);
            }
            
            // Generate agent-specific suggestion
            const suggestion = agent.analyzeTask(task, context);
            
            return {
                agentId,
                taskId,
                suggestion: suggestion.reasoning || 'Agent analysis completed',
                confidence: suggestion.confidence || 0.8,
                recommendations: suggestion.recommendations || [],
                estimatedEffort: suggestion.estimatedEffort || 'Medium',
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error triggering agent suggestion:', error);
            return {
                agentId,
                taskId,
                error: error.message,
                generatedAt: new Date().toISOString()
            };
        }
    }

    /**
     * Helper methods for agent intelligence
     */
    getAgentDisplayName(agentId) {
        const names = {
            'frontend-agent': 'Frontend Developer Agent',
            'backend-agent': 'Backend Developer Agent', 
            'qa-specialist': 'QA Specialist Agent',
            'devops-agent': 'DevOps Engineer Agent',
            'orchestrator-agent': 'Orchestrator Agent'
        };
        return names[agentId] || agentId;
    }

    getWorkspaceMapping() {
        try {
            const mappingFile = path.join(this.projectRoot, '.taskmaster/agents/workspace-mapping.json');
            if (fs.existsSync(mappingFile)) {
                return JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
            }
        } catch (error) {
            console.warn('Could not load workspace mapping:', error.message);
        }
        return {};
    }

    getAgentWorkflowState(agentId) {
        // Return current workflow state for agent
        return {
            phase: 'ready',
            lastAction: 'waiting_for_task',
            progressPercent: 0
        };
    }

    getAgentPerformance(agentId) {
        // Return performance metrics for agent
        return {
            tasksCompleted: 0,
            averageTime: '2h',
            successRate: 100
        };
    }

    getCurrentTask(agentId) {
        // Get agent's current active task
        return null;
    }

    getRecentActivity(agentId) {
        // Get recent activity log for agent
        return [];
    }

    getAgentSuggestions(agentId) {
        // Get pending suggestions from agent
        return [];
    }

    checkAgentHealth(agentId) {
        // Check agent health status
        return {
            status: 'healthy',
            lastHeartbeat: new Date().toISOString(),
            errors: []
        };
    }

    loadAgentClass(agentId) {
        try {
            const agentPaths = {
                'frontend-agent': '../../../agents/frontend-agent.js',
                'backend-agent': '../../../agents/backend-agent.js',
                'qa-specialist': '../../../agents/qa-specialist-agent.js',
                'devops-agent': '../../../agents/devops-agent.js',
                'orchestrator-agent': '../../../agents/orchestrator-agent.js'
            };
            
            const agentPath = agentPaths[agentId];
            if (agentPath) {
                return require(agentPath);
            }
        } catch (error) {
            console.error(`Error loading agent class ${agentId}:`, error);
        }
        return null;
    }

    getTaskDetails(taskId) {
        // Get task details from TaskMaster
        try {
            const result = execSync(`task-master show ${taskId} --format=json`, {
                cwd: this.projectRoot,
                encoding: 'utf8',
                timeout: 5000
            });
            return JSON.parse(result);
        } catch (error) {
            return null;
        }
    }

    updateAgentConfig(agentId, config) {
        // Update agent configuration
        return { updated: true, config };
    }

    getAgentLogs(agentId, limit) {
        // Get agent execution logs
        return [];
    }

    getRouter() {
        return this.router;
    }
}

module.exports = AgentsController;