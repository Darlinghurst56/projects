#!/usr/bin/env node

/**
 * Agent Storage System
 * Simple file-based storage for agent registration and status tracking
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AGENTS_DATA_FILE = path.join(__dirname, '..', '.taskmaster', 'agents', 'live-agents.json');
const HEARTBEAT_TIMEOUT = 60000; // 60 seconds

class AgentStorage {
    constructor() {
        this.ensureDataFile();
        this.startHeartbeatCleanup();
    }

    ensureDataFile() {
        const dir = path.dirname(AGENTS_DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (!fs.existsSync(AGENTS_DATA_FILE)) {
            fs.writeFileSync(AGENTS_DATA_FILE, JSON.stringify({
                agents: {},
                lastUpdated: new Date().toISOString()
            }, null, 2));
        }
    }

    loadData() {
        try {
            const data = JSON.parse(fs.readFileSync(AGENTS_DATA_FILE, 'utf8'));
            return data;
        } catch (error) {
            console.error('Error loading agent data:', error);
            return { agents: {}, lastUpdated: new Date().toISOString() };
        }
    }

    saveData(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            fs.writeFileSync(AGENTS_DATA_FILE, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving agent data:', error);
            return false;
        }
    }

    registerAgent(agentData) {
        const { agentId, role, capabilities = [], status = 'idle' } = agentData;
        
        if (!agentId || !role) {
            throw new Error('agentId and role are required');
        }

        const data = this.loadData();
        
        const agent = {
            id: agentId,
            role: role,
            capabilities: capabilities,
            status: status,
            currentTask: null,
            registeredAt: new Date().toISOString(),
            lastHeartbeat: new Date().toISOString(),
            taskHistory: [],
            metrics: {
                tasksCompleted: 0,
                totalUptime: 0,
                averageTaskTime: 0
            }
        };

        data.agents[agentId] = agent;
        
        if (this.saveData(data)) {
            console.log(`Agent registered: ${agentId} (${role})`);
            return agent;
        } else {
            throw new Error('Failed to save agent registration');
        }
    }

    updateAgentStatus(agentId, statusUpdate) {
        const { status, currentTask = null } = statusUpdate;
        
        if (!status) {
            throw new Error('status is required');
        }

        const data = this.loadData();
        
        if (!data.agents[agentId]) {
            throw new Error(`Agent ${agentId} not found`);
        }

        const agent = data.agents[agentId];
        const previousStatus = agent.status;
        const previousTask = agent.currentTask;

        agent.status = status;
        agent.currentTask = currentTask;
        agent.lastHeartbeat = new Date().toISOString();

        // Track task completion
        if (previousStatus === 'working' && status === 'idle' && previousTask) {
            agent.taskHistory.push({
                taskId: previousTask,
                completedAt: new Date().toISOString(),
                duration: this.calculateTaskDuration(agent, previousTask)
            });
            agent.metrics.tasksCompleted++;
        }

        data.agents[agentId] = agent;
        
        if (this.saveData(data)) {
            console.log(`Agent ${agentId} status updated: ${status}`);
            return agent;
        } else {
            throw new Error('Failed to update agent status');
        }
    }

    heartbeat(agentId) {
        const data = this.loadData();
        
        if (!data.agents[agentId]) {
            throw new Error(`Agent ${agentId} not found`);
        }

        data.agents[agentId].lastHeartbeat = new Date().toISOString();
        
        if (this.saveData(data)) {
            return { success: true, timestamp: data.agents[agentId].lastHeartbeat };
        } else {
            throw new Error('Failed to update heartbeat');
        }
    }

    getAgent(agentId) {
        const data = this.loadData();
        const agent = data.agents[agentId];
        
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        return agent;
    }

    getAllAgents() {
        const data = this.loadData();
        return Object.values(data.agents);
    }

    getActiveAgents() {
        const data = this.loadData();
        const now = new Date();
        
        return Object.values(data.agents).filter(agent => {
            const lastHeartbeat = new Date(agent.lastHeartbeat);
            const timeSinceHeartbeat = now - lastHeartbeat;
            return timeSinceHeartbeat < HEARTBEAT_TIMEOUT;
        });
    }

    removeAgent(agentId) {
        const data = this.loadData();
        
        if (!data.agents[agentId]) {
            throw new Error(`Agent ${agentId} not found`);
        }

        delete data.agents[agentId];
        
        if (this.saveData(data)) {
            console.log(`Agent removed: ${agentId}`);
            return true;
        } else {
            throw new Error('Failed to remove agent');
        }
    }

    getAgentsByRole(role) {
        const data = this.loadData();
        return Object.values(data.agents).filter(agent => agent.role === role);
    }

    getAgentsByStatus(status) {
        const data = this.loadData();
        return Object.values(data.agents).filter(agent => agent.status === status);
    }

    getDashboardSummary() {
        const allAgents = this.getAllAgents();
        const activeAgents = this.getActiveAgents();
        
        const summary = {
            total: allAgents.length,
            active: activeAgents.length,
            offline: allAgents.length - activeAgents.length,
            byStatus: this.groupAgentsByStatus(activeAgents),
            byRole: this.groupAgentsByRole(activeAgents),
            metrics: this.calculateSummaryMetrics(allAgents),
            lastUpdated: new Date().toISOString()
        };

        return summary;
    }

    groupAgentsByStatus(agents) {
        return agents.reduce((acc, agent) => {
            acc[agent.status] = (acc[agent.status] || 0) + 1;
            return acc;
        }, {});
    }

    groupAgentsByRole(agents) {
        return agents.reduce((acc, agent) => {
            acc[agent.role] = (acc[agent.role] || 0) + 1;
            return acc;
        }, {});
    }

    calculateSummaryMetrics(agents) {
        const totalTasks = agents.reduce((sum, agent) => sum + agent.metrics.tasksCompleted, 0);
        const averageTasksPerAgent = agents.length > 0 ? totalTasks / agents.length : 0;
        
        return {
            totalTasksCompleted: totalTasks,
            averageTasksPerAgent: Math.round(averageTasksPerAgent * 100) / 100,
            totalRegisteredAgents: agents.length
        };
    }

    calculateTaskDuration(agent, taskId) {
        // Simple duration calculation - in a real implementation, 
        // this would track task start times
        return Math.floor(Math.random() * 3600) + 300; // 5 minutes to 1 hour
    }

    startHeartbeatCleanup() {
        // Clean up stale agents every 2 minutes
        setInterval(() => {
            this.cleanupStaleAgents();
        }, 120000);
    }

    cleanupStaleAgents() {
        const data = this.loadData();
        const now = new Date();
        let cleanedCount = 0;

        Object.keys(data.agents).forEach(agentId => {
            const agent = data.agents[agentId];
            const lastHeartbeat = new Date(agent.lastHeartbeat);
            const timeSinceHeartbeat = now - lastHeartbeat;

            if (timeSinceHeartbeat > HEARTBEAT_TIMEOUT * 2) { // 2x timeout for cleanup
                agent.status = 'offline';
                cleanedCount++;
            }
        });

        if (cleanedCount > 0) {
            this.saveData(data);
            console.log(`Marked ${cleanedCount} agents as offline due to missed heartbeats`);
        }
    }
}

// Export for use in API server
export default AgentStorage;

// Export singleton instance
export const agentStorage = new AgentStorage();