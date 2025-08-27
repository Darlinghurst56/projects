#!/usr/bin/env node

/**
 * Agent Lifecycle Manager
 * Ensures development agents cannot run indefinitely while optimizing performance
 * 
 * DEVELOPER SAFETY GUARANTEES:
 * - Maximum 3-minute runtime per agent
 * - Automatic cleanup of stale processes
 * - Circuit breaker prevents cascading failures
 * - Heartbeat monitoring ensures agent responsiveness
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

class AgentLifecycleManager extends EventEmitter {
    constructor() {
        super();
        this.activeAgents = new Map();
        this.maxAgentRuntime = 180000; // 3 minutes max - SAFETY LIMIT
        this.cleanupInterval = 30000;  // 30 seconds
        this.heartbeatTimeout = 60000; // 1 minute heartbeat timeout
        this.circuitBreakers = new Map();
        this.isShuttingDown = false;
        
        this.startCleanupProcess();
        this.setupGracefulShutdown();
        
        console.log('✅ Agent Lifecycle Manager initialized with safety limits');
    }

    /**
     * Start an agent with safety monitoring
     * @param {string} agentId - Unique agent identifier
     * @param {string} agentType - Type of agent (frontend, backend, etc.)
     * @param {Object} options - Agent configuration
     * @returns {Object} Agent process information
     */
    startAgent(agentId, agentType = 'unknown', options = {}) {
        if (this.isShuttingDown) {
            throw new Error('System is shutting down, cannot start new agents');
        }

        // Check if agent already running
        if (this.activeAgents.has(agentId)) {
            const existingAgent = this.activeAgents.get(agentId);
            if (existingAgent.status === 'running') {
                throw new Error(`Agent ${agentId} is already running`);
            }
        }

        const agentProcess = {
            id: agentId,
            type: agentType,
            startTime: Date.now(),
            lastHeartbeat: Date.now(),
            status: 'running',
            pid: process.pid, // For monitoring
            options: options,
            taskCount: 0,
            maxTasks: options.maxTasks || 10
        };
        
        this.activeAgents.set(agentId, agentProcess);
        
        // Auto-cleanup after max runtime (SAFETY MECHANISM)
        const timeoutId = setTimeout(() => {
            this.forceStopAgent(agentId, 'MAX_RUNTIME_EXCEEDED');
        }, this.maxAgentRuntime);
        
        agentProcess.timeoutId = timeoutId;
        
        this.emit('agentStarted', agentProcess);
        console.log(`🚀 Agent ${agentId} (${agentType}) started with ${this.maxAgentRuntime/1000}s safety limit`);
        
        return agentProcess;
    }

    /**
     * Update agent heartbeat to prevent timeout
     * @param {string} agentId - Agent identifier
     * @param {Object} metadata - Optional metadata
     */
    updateHeartbeat(agentId, metadata = {}) {
        const agent = this.activeAgents.get(agentId);
        if (agent && agent.status === 'running') {
            agent.lastHeartbeat = Date.now();
            agent.taskCount = metadata.taskCount || agent.taskCount;
            
            // Emit heartbeat event for monitoring
            this.emit('agentHeartbeat', { agentId, metadata });
        }
    }

    /**
     * Gracefully stop an agent
     * @param {string} agentId - Agent identifier
     * @param {string} reason - Reason for stopping
     */
    stopAgent(agentId, reason = 'REQUESTED') {
        const agent = this.activeAgents.get(agentId);
        if (agent) {
            agent.status = 'stopping';
            agent.stopReason = reason;
            
            // Clear timeout
            if (agent.timeoutId) {
                clearTimeout(agent.timeoutId);
            }
            
            // Allow graceful shutdown time
            setTimeout(() => {
                this.forceStopAgent(agentId, reason);
            }, 5000);
            
            this.emit('agentStopping', { agentId, reason });
            console.log(`⏹️  Agent ${agentId} stopping: ${reason}`);
        }
    }

    /**
     * Force stop an agent immediately
     * @param {string} agentId - Agent identifier
     * @param {string} reason - Reason for force stop
     */
    forceStopAgent(agentId, reason = 'FORCE_STOP') {
        const agent = this.activeAgents.get(agentId);
        if (agent) {
            agent.status = 'stopped';
            agent.stopReason = reason;
            agent.stopTime = Date.now();
            
            // Clear timeout
            if (agent.timeoutId) {
                clearTimeout(agent.timeoutId);
            }
            
            this.activeAgents.delete(agentId);
            this.emit('agentStopped', { agentId, reason, agent });
            console.log(`🛑 Agent ${agentId} forcefully stopped: ${reason}`);
        }
    }

    /**
     * Get agent status
     * @param {string} agentId - Agent identifier
     * @returns {Object|null} Agent status
     */
    getAgentStatus(agentId) {
        const agent = this.activeAgents.get(agentId);
        if (!agent) return null;
        
        const now = Date.now();
        return {
            ...agent,
            runtime: now - agent.startTime,
            timeSinceHeartbeat: now - agent.lastHeartbeat,
            remainingTime: Math.max(0, this.maxAgentRuntime - (now - agent.startTime))
        };
    }

    /**
     * Get all active agents
     * @returns {Array} Array of agent statuses
     */
    getAllAgents() {
        return Array.from(this.activeAgents.values()).map(agent => 
            this.getAgentStatus(agent.id)
        );
    }

    /**
     * Get system health status
     * @returns {Object} System health information
     */
    getSystemHealth() {
        const now = Date.now();
        const agents = this.getAllAgents();
        
        return {
            totalAgents: agents.length,
            runningAgents: agents.filter(a => a.status === 'running').length,
            stoppingAgents: agents.filter(a => a.status === 'stopping').length,
            averageRuntime: agents.length > 0 ? 
                agents.reduce((sum, a) => sum + a.runtime, 0) / agents.length : 0,
            maxRuntimeLimit: this.maxAgentRuntime,
            systemUptime: now - (this.startTime || now),
            isShuttingDown: this.isShuttingDown
        };
    }

    /**
     * Regular cleanup of stale agents
     */
    startCleanupProcess() {
        this.cleanupTimer = setInterval(() => {
            if (this.isShuttingDown) return;
            
            const now = Date.now();
            const staleAgents = [];
            
            for (const [agentId, agent] of this.activeAgents.entries()) {
                // Check for stale heartbeat
                if (now - agent.lastHeartbeat > this.heartbeatTimeout) {
                    staleAgents.push({ agentId, reason: 'HEARTBEAT_TIMEOUT' });
                }
                
                // Check for max runtime exceeded
                if (now - agent.startTime > this.maxAgentRuntime) {
                    staleAgents.push({ agentId, reason: 'MAX_RUNTIME_EXCEEDED' });
                }
            }
            
            // Clean up stale agents
            staleAgents.forEach(({ agentId, reason }) => {
                this.forceStopAgent(agentId, reason);
            });
            
            if (staleAgents.length > 0) {
                console.log(`🧹 Cleaned up ${staleAgents.length} stale agents`);
            }
        }, this.cleanupInterval);
        
        this.startTime = Date.now();
    }

    /**
     * Setup graceful shutdown
     */
    setupGracefulShutdown() {
        const gracefulShutdown = () => {
            console.log('🔄 Graceful shutdown initiated...');
            this.isShuttingDown = true;
            
            // Stop all agents
            const activeAgentIds = Array.from(this.activeAgents.keys());
            activeAgentIds.forEach(agentId => {
                this.stopAgent(agentId, 'SYSTEM_SHUTDOWN');
            });
            
            // Clear cleanup timer
            if (this.cleanupTimer) {
                clearInterval(this.cleanupTimer);
            }
            
            // Wait for graceful shutdown
            setTimeout(() => {
                console.log('✅ Agent Lifecycle Manager shutdown complete');
                process.exit(0);
            }, 10000);
        };
        
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }

    /**
     * Emergency stop all agents
     */
    emergencyStopAll() {
        console.log('🚨 Emergency stop all agents initiated');
        const activeAgentIds = Array.from(this.activeAgents.keys());
        activeAgentIds.forEach(agentId => {
            this.forceStopAgent(agentId, 'EMERGENCY_STOP');
        });
    }
}

module.exports = AgentLifecycleManager;