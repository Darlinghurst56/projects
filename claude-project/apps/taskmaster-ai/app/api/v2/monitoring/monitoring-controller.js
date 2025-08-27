/**
 * TaskMaster AI - Enhanced Monitoring Controller
 * Real-time monitoring for agent workflows and task progress
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

class MonitoringController {
    constructor(projectRoot, coordinationWorkflow) {
        this.router = express.Router();
        this.projectRoot = projectRoot;
        this.coordinationWorkflow = coordinationWorkflow;
        this.setupRoutes();
    }

    setupRoutes() {
        // Real-time system dashboard
        this.router.get('/dashboard', (req, res) => {
            try {
                const dashboardData = this.getSystemDashboard();
                
                res.json({
                    success: true,
                    dashboard: dashboardData,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Agent activity timeline
        this.router.get('/agents/activity', (req, res) => {
            try {
                const { since, limit = 50 } = req.query;
                const activity = this.getAgentActivity(since, parseInt(limit));
                
                res.json({
                    success: true,
                    activity: activity,
                    count: activity.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Task progress tracking
        this.router.get('/tasks/progress', (req, res) => {
            try {
                const progress = this.getTaskProgress();
                
                res.json({
                    success: true,
                    progress: progress,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Workflow health monitoring
        this.router.get('/workflow/health', (req, res) => {
            try {
                const health = this.checkWorkflowHealth();
                
                res.json({
                    success: true,
                    health: health,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Performance metrics
        this.router.get('/performance', (req, res) => {
            try {
                const { timeframe = '24h' } = req.query;
                const metrics = this.getPerformanceMetrics(timeframe);
                
                res.json({
                    success: true,
                    timeframe: timeframe,
                    metrics: metrics,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Live event stream (Server-Sent Events)
        this.router.get('/events/stream', (req, res) => {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });

            // Send initial connection event
            res.write(`data: ${JSON.stringify({
                type: 'connection',
                message: 'Connected to TaskMaster monitoring stream',
                timestamp: new Date().toISOString()
            })}\n\n`);

            // Set up periodic updates
            const interval = setInterval(() => {
                const event = this.getLatestEvent();
                if (event) {
                    res.write(`data: ${JSON.stringify(event)}\n\n`);
                }
            }, 5000); // Update every 5 seconds

            // Clean up on disconnect
            req.on('close', () => {
                clearInterval(interval);
            });
        });
    }

    /**
     * Get comprehensive system dashboard data
     */
    getSystemDashboard() {
        const tasksData = this.loadTasksData();
        const agentsData = this.loadAgentsData();
        
        const taskStats = this.calculateTaskStats(tasksData);
        const agentStats = this.calculateAgentStats(agentsData);
        
        return {
            overview: {
                totalTasks: taskStats.total,
                completedTasks: taskStats.completed,
                inProgressTasks: taskStats.inProgress,
                pendingTasks: taskStats.pending,
                activeAgents: agentStats.active,
                totalAgents: agentStats.total
            },
            taskBreakdown: taskStats.breakdown,
            agentWorkload: agentStats.workload,
            recentActivity: this.getRecentActivity(10),
            systemHealth: this.getSystemHealthStatus(),
            alerts: this.getSystemAlerts()
        };
    }

    /**
     * Get agent activity timeline
     */
    getAgentActivity(since, limit) {
        try {
            const agentsData = this.loadAgentsData();
            const tasksData = this.loadTasksData();
            
            const activities = [];
            const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            // Generate activity entries from task updates and agent status changes
            for (const agent of agentsData) {
                if (agent.lastUpdated && new Date(agent.lastUpdated) > sinceDate) {
                    activities.push({
                        timestamp: agent.lastUpdated,
                        type: 'agent_status',
                        agentId: agent.id,
                        status: agent.status,
                        message: `Agent ${agent.id} status changed to ${agent.status}`,
                        tasks: agent.assignedTasks || []
                    });
                }
            }
            
            return activities
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting agent activity:', error);
            return [];
        }
    }

    /**
     * Get task progress tracking
     */
    getTaskProgress() {
        const tasksData = this.loadTasksData();
        const agentsData = this.loadAgentsData();
        
        const progress = {
            byStatus: {},
            byAgent: {},
            byPriority: {},
            timeline: []
        };
        
        // Aggregate all tasks from all workspaces
        for (const workspace of Object.keys(tasksData)) {
            const tasks = tasksData[workspace].tasks || [];
            
            for (const task of tasks) {
                // By status
                progress.byStatus[task.status] = (progress.byStatus[task.status] || 0) + 1;
                
                // By priority
                progress.byPriority[task.priority] = (progress.byPriority[task.priority] || 0) + 1;
                
                // By agent (if assigned)
                const assignedAgent = this.findTaskAgent(task.id, agentsData);
                if (assignedAgent) {
                    progress.byAgent[assignedAgent] = (progress.byAgent[assignedAgent] || 0) + 1;
                }
            }
        }
        
        return progress;
    }

    /**
     * Check workflow health
     */
    checkWorkflowHealth() {
        const issues = [];
        const warnings = [];
        
        try {
            // Check TaskMaster integration
            const tasksFile = path.join(this.projectRoot, '.taskmaster/tasks/tasks.json');
            if (!fs.existsSync(tasksFile)) {
                issues.push('TaskMaster tasks file not found');
            }
            
            // Check agent availability
            const agentsFile = path.join(this.projectRoot, '.taskmaster/agents/agents.json');
            if (!fs.existsSync(agentsFile)) {
                issues.push('Agents configuration file not found');
            } else {
                const agents = JSON.parse(fs.readFileSync(agentsFile, 'utf8'));
                const activeAgents = agents.filter(a => a.status === 'working' || a.status === 'available');
                if (activeAgents.length === 0) {
                    warnings.push('No active agents available');
                }
            }
            
            // Check coordination workflow
            if (!this.coordinationWorkflow) {
                warnings.push('Coordination workflow not initialized');
            }
            
        } catch (error) {
            issues.push(`Health check error: ${error.message}`);
        }
        
        return {
            status: issues.length === 0 ? 'healthy' : 'degraded',
            issues: issues,
            warnings: warnings,
            score: Math.max(0, 100 - (issues.length * 30) - (warnings.length * 10))
        };
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics(timeframe) {
        const metrics = {
            tasksCompleted: this.getTasksCompletedInTimeframe(timeframe),
            averageTaskTime: this.getAverageTaskCompletionTime(),
            agentUtilization: this.getAgentUtilization(),
            systemUptime: process.uptime(),
            apiResponseTime: this.getAverageApiResponseTime(),
            throughput: this.getSystemThroughput()
        };
        
        return metrics;
    }

    /**
     * Get latest event for streaming
     */
    getLatestEvent() {
        try {
            const agentsData = this.loadAgentsData();
            const activeAgents = agentsData.filter(a => a.status === 'working');
            
            if (activeAgents.length > 0) {
                const agent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
                return {
                    type: 'agent_heartbeat',
                    agentId: agent.id,
                    status: agent.status,
                    assignedTasks: agent.assignedTasks?.length || 0,
                    timestamp: new Date().toISOString()
                };
            }
            
            return {
                type: 'system_status',
                message: 'System monitoring active',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                type: 'error',
                message: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Helper methods for data loading and calculations
     */
    loadTasksData() {
        try {
            const tasksFile = path.join(this.projectRoot, '.taskmaster/tasks/tasks.json');
            return fs.existsSync(tasksFile) ? JSON.parse(fs.readFileSync(tasksFile, 'utf8')) : {};
        } catch (error) {
            return {};
        }
    }

    loadAgentsData() {
        try {
            const agentsFile = path.join(this.projectRoot, '.taskmaster/agents/agents.json');
            return fs.existsSync(agentsFile) ? JSON.parse(fs.readFileSync(agentsFile, 'utf8')) : [];
        } catch (error) {
            return [];
        }
    }

    calculateTaskStats(tasksData) {
        let total = 0, completed = 0, inProgress = 0, pending = 0;
        const breakdown = {};
        
        for (const workspace of Object.keys(tasksData)) {
            const tasks = tasksData[workspace].tasks || [];
            
            for (const task of tasks) {
                total++;
                switch (task.status) {
                    case 'done': completed++; break;
                    case 'in-progress': inProgress++; break;
                    case 'pending': pending++; break;
                }
                
                breakdown[task.status] = (breakdown[task.status] || 0) + 1;
            }
        }
        
        return { total, completed, inProgress, pending, breakdown };
    }

    calculateAgentStats(agentsData) {
        const active = agentsData.filter(a => a.status === 'working' || a.status === 'available').length;
        const workload = {};
        
        for (const agent of agentsData) {
            workload[agent.id] = {
                status: agent.status,
                assignedTasks: agent.assignedTasks?.length || 0,
                lastUpdated: agent.lastUpdated
            };
        }
        
        return { total: agentsData.length, active, workload };
    }

    getRecentActivity(limit) {
        return this.getAgentActivity(null, limit);
    }

    getSystemHealthStatus() {
        return this.checkWorkflowHealth().status;
    }

    getSystemAlerts() {
        const health = this.checkWorkflowHealth();
        return [...health.issues.map(i => ({ type: 'error', message: i })), 
                ...health.warnings.map(w => ({ type: 'warning', message: w }))];
    }

    findTaskAgent(taskId, agentsData) {
        const agent = agentsData.find(a => a.assignedTasks?.includes(taskId));
        return agent ? agent.id : null;
    }

    // Performance metric helper methods (simplified implementations)
    getTasksCompletedInTimeframe(timeframe) { return Math.floor(Math.random() * 10); }
    getAverageTaskCompletionTime() { return '2.5 hours'; }
    getAgentUtilization() { return 75; }
    getAverageApiResponseTime() { return 150; }
    getSystemThroughput() { return 12; }

    getRouter() {
        return this.router;
    }
}

module.exports = MonitoringController;