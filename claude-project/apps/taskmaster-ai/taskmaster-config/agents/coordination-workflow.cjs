#!/usr/bin/env node

/**
 * Agent Coordination Workflow Module
 * Manages agent registration, task assignment, and coordination workflows
 */

const fs = require('fs');
const path = require('path');

class AgentCoordinationWorkflow {
    constructor(projectRoot = null) {
        this.projectRoot = projectRoot || process.cwd();
        this.agentsFile = path.join(this.projectRoot, '.taskmaster/agents/agents.json');
        this.coordinationFile = path.join(this.projectRoot, '.taskmaster/agents/coordination.json');
        this.agents = this.loadAgents();
        this.coordinationState = this.loadCoordinationState();
        
        // Cache for file timestamps to avoid unnecessary reloads
        this.agentsFileTimestamp = null;
        this.coordinationFileTimestamp = null;
        
        // Initialize cleanup jobs and workflow optimization
        try {
            const TaskCleanupJobs = require('../../app/core/task-cleanup-jobs.js');
            this.cleanupJobs = new TaskCleanupJobs(this.projectRoot);
            this.cleanupJobs.start();
        } catch (error) {
            console.warn('Task cleanup jobs not available:', error.message);
            this.cleanupJobs = null;
        }
        
        // Workflow optimization features
        this.workflowMetrics = {
            totalAssignments: 0,
            successfulAssignments: 0,
            averageAssignmentTime: 0,
            agentUtilization: {}
        };
        this.optimizationEnabled = true;
    }

    /**
     * Load agents from file with caching
     */
    loadAgents() {
        try {
            if (fs.existsSync(this.agentsFile)) {
                const stats = fs.statSync(this.agentsFile);
                const currentTimestamp = stats.mtime.getTime();
                
                // Only reload if file has changed
                if (this.agentsFileTimestamp === currentTimestamp && this.agents.length > 0) {
                    return this.agents;
                }
                
                console.log(`🔍 Loading agents from: ${this.agentsFile}`);
                const data = fs.readFileSync(this.agentsFile, 'utf8');
                const agents = JSON.parse(data);
                console.log(`📊 Loaded ${agents.length} agents from file`);
                
                this.agentsFileTimestamp = currentTimestamp;
                return agents;
            } else {
                console.log(`⚠️  Agents file not found: ${this.agentsFile}`);
            }
        } catch (error) {
            console.error('Error loading agents:', error);
        }
        return [];
    }

    /**
     * Save agents to file
     */
    saveAgents() {
        try {
            fs.writeFileSync(this.agentsFile, JSON.stringify(this.agents, null, 2));
        } catch (error) {
            console.error('Error saving agents:', error);
        }
    }

    /**
     * Load coordination state
     */
    loadCoordinationState() {
        try {
            if (fs.existsSync(this.coordinationFile)) {
                return JSON.parse(fs.readFileSync(this.coordinationFile, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading coordination state:', error);
        }
        return {
            lastAssignment: null,
            activeWorkflows: [],
            agentMetrics: {}
        };
    }

    /**
     * Save coordination state
     */
    saveCoordinationState() {
        try {
            fs.writeFileSync(this.coordinationFile, JSON.stringify(this.coordinationState, null, 2));
        } catch (error) {
            console.error('Error saving coordination state:', error);
        }
    }

    /**
     * Normalize agent ID to standard format
     */
    normalizeAgentId(agentId) {
        // Standard agent IDs
        const standardIds = {
            'orchestrator-agent': 'orchestrator-agent',
            'frontend-agent': 'frontend-agent',
            'backend-agent': 'backend-agent',
            'devops-agent': 'devops-agent',
            'qa-specialist': 'qa-specialist'
        };
        
        // Direct match
        if (standardIds[agentId]) {
            return standardIds[agentId];
        }
        
        // Pattern matching for variations
        if (agentId.includes('qa') || agentId.includes('test') || agentId.includes('perf')) {
            return 'qa-specialist';
        }
        if (agentId.includes('backend')) {
            return 'backend-agent';
        }
        if (agentId.includes('frontend') || agentId.includes('e2e')) {
            return 'frontend-agent';
        }
        if (agentId.includes('devops')) {
            return 'devops-agent';
        }
        if (agentId.includes('orchestrator')) {
            return 'orchestrator-agent';
        }
        
        // Default fallback - keep original if no pattern matches
        return agentId;
    }

    /**
     * Register a new agent
     */
    registerAgent(agentId, capabilities = [], status = 'available') {
        // Normalize the agent ID to standard format
        const normalizedId = this.normalizeAgentId(agentId);
        
        // If the ID was changed, log it for debugging
        if (normalizedId !== agentId) {
            console.log(`🔄 Normalized agent ID: ${agentId} → ${normalizedId}`);
        }
        
        const existingAgent = this.agents.find(agent => agent.id === normalizedId);
        
        if (existingAgent) {
            existingAgent.capabilities = capabilities;
            existingAgent.status = status;
            existingAgent.lastUpdated = new Date().toISOString();
        } else {
            this.agents.push({
                id: normalizedId,
                capabilities,
                status,
                registeredAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                assignedTasks: []
            });
        }
        
        this.saveAgents();
        return true;
    }

    /**
     * Get all registered agents (with caching)
     */
    getAgents() {
        // Load agents from file (will use cache if file hasn't changed)
        this.agents = this.loadAgents();
        return this.agents;
    }

    /**
     * Get available agents
     */
    getAvailableAgents() {
        return this.agents.filter(agent => agent.status === 'available');
    }

    /**
     * Update agent status
     */
    updateAgentStatus(agentId, status) {
        const normalizedId = this.normalizeAgentId(agentId);
        const agent = this.agents.find(a => a.id === normalizedId);
        if (agent) {
            agent.status = status;
            agent.lastUpdated = new Date().toISOString();
            this.saveAgents();
            return true;
        }
        return false;
    }

    /**
     * Assign task to agent
     */
    assignTaskToAgent(taskId, agentId) {
        const normalizedId = this.normalizeAgentId(agentId);
        const agent = this.agents.find(a => a.id === normalizedId);
        if (agent) {
            if (!agent.assignedTasks.includes(taskId)) {
                agent.assignedTasks.push(taskId);
                agent.status = 'busy';
                agent.lastUpdated = new Date().toISOString();
                
                this.coordinationState.lastAssignment = {
                    taskId,
                    agentId: normalizedId,
                    timestamp: new Date().toISOString()
                };
                
                this.saveAgents();
                this.saveCoordinationState();
                return true;
            }
        }
        return false;
    }

    /**
     * Complete task assignment
     */
    completeTaskAssignment(taskId, agentId) {
        const normalizedId = this.normalizeAgentId(agentId);
        const agent = this.agents.find(a => a.id === normalizedId);
        if (agent) {
            agent.assignedTasks = agent.assignedTasks.filter(id => id !== taskId);
            
            // Add cooldown period before making agent available again
            if (agent.assignedTasks.length === 0) {
                agent.status = 'cooldown';
                agent.cooldownUntil = new Date(Date.now() + 30000).toISOString(); // 30 second cooldown
                
                // Schedule status change to available after cooldown
                setTimeout(() => {
                    const currentAgent = this.agents.find(a => a.id === normalizedId);
                    if (currentAgent && currentAgent.status === 'cooldown') {
                        currentAgent.status = 'available';
                        currentAgent.cooldownUntil = null;
                        this.saveAgents();
                    }
                }, 30000);
            }
            agent.lastUpdated = new Date().toISOString();
            
            // Update metrics
            if (!this.coordinationState.agentMetrics[normalizedId]) {
                this.coordinationState.agentMetrics[normalizedId] = {
                    completedTasks: 0,
                    totalTime: 0
                };
            }
            this.coordinationState.agentMetrics[normalizedId].completedTasks++;
            
            // Schedule cleanup jobs for completed task
            this.cleanupJobs.scheduleTaskCleanup(taskId, { agentId: normalizedId, completedAt: new Date().toISOString() });
            
            this.saveAgents();
            this.saveCoordinationState();
            return true;
        }
        return false;
    }

    /**
     * Get coordination status
     */
    getCoordinationStatus() {
        return {
            totalAgents: this.agents.length,
            availableAgents: this.getAvailableAgents().length,
            busyAgents: this.agents.filter(a => a.status === 'busy').length,
            lastAssignment: this.coordinationState.lastAssignment,
            agentMetrics: this.coordinationState.agentMetrics
        };
    }

    /**
     * Start coordination workflow
     */
    startCoordinationWorkflow(workflowId, tasks = []) {
        const workflow = {
            id: workflowId,
            tasks,
            startTime: new Date().toISOString(),
            status: 'active',
            assignedAgents: []
        };
        
        this.coordinationState.activeWorkflows.push(workflow);
        this.saveCoordinationState();
        return workflow;
    }

    /**
     * Complete coordination workflow
     */
    completeCoordinationWorkflow(workflowId) {
        const workflow = this.coordinationState.activeWorkflows.find(w => w.id === workflowId);
        if (workflow) {
            workflow.status = 'completed';
            workflow.endTime = new Date().toISOString();
            this.saveCoordinationState();
            return true;
        }
        return false;
    }

    /**
     * Get active workflows
     */
    getActiveWorkflows() {
        return this.coordinationState.activeWorkflows.filter(w => w.status === 'active');
    }

    /**
     * Auto-assign tasks based on agent capabilities
     */
    autoAssignTasks(tasks) {
        const availableAgents = this.getAvailableAgents();
        const assignments = [];
        
        for (const task of tasks) {
            // Simple round-robin assignment
            const agent = availableAgents[assignments.length % availableAgents.length];
            if (agent) {
                this.assignTaskToAgent(task.id, agent.id);
                assignments.push({
                    taskId: task.id,
                    agentId: agent.id,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        return assignments;
    }

    /**
     * Get agent performance metrics
     */
    getAgentMetrics(agentId = null) {
        if (agentId) {
            return this.coordinationState.agentMetrics[agentId] || null;
        }
        return this.coordinationState.agentMetrics;
    }

    /**
     * Suggest task assignment to human for approval
     */
    suggestTaskAssignment(task, targetAgent, reasoning = '') {
        const suggestion = {
            id: `suggestion-${Date.now()}`,
            taskId: task.id || task,
            targetAgent,
            reasoning,
            status: 'pending',
            timestamp: new Date().toISOString(),
            suggestedBy: 'orchestrator-agent'
        };

        if (!this.coordinationState.pendingSuggestions) {
            this.coordinationState.pendingSuggestions = [];
        }
        
        this.coordinationState.pendingSuggestions.push(suggestion);
        this.saveCoordinationState();
        
        console.log(`🤖 ORCHESTRATOR: Suggesting assignment of task ${task.id || task} to ${targetAgent}`);
        console.log(`📋 Reasoning: ${reasoning}`);
        console.log(`⏳ Awaiting human approval (suggestion ID: ${suggestion.id})`);
        
        return suggestion;
    }

    /**
     * Approve a task assignment suggestion
     */
    approveSuggestion(suggestionId, humanComment = '') {
        if (!this.coordinationState.pendingSuggestions) {
            return { success: false, error: 'No pending suggestions found' };
        }

        const suggestion = this.coordinationState.pendingSuggestions.find(s => s.id === suggestionId);
        if (!suggestion) {
            return { success: false, error: 'Suggestion not found' };
        }

        suggestion.status = 'approved';
        suggestion.humanComment = humanComment;
        suggestion.approvedAt = new Date().toISOString();

        // Actually assign the task
        const assignmentResult = this.assignTaskToAgent(suggestion.taskId, suggestion.targetAgent);
        
        if (assignmentResult) {
            console.log(`✅ HUMAN APPROVED: Task ${suggestion.taskId} assigned to ${suggestion.targetAgent}`);
            if (humanComment) {
                console.log(`💬 Human comment: ${humanComment}`);
            }
        }

        this.saveCoordinationState();
        return { 
            success: assignmentResult, 
            suggestion,
            message: assignmentResult ? 'Task assigned successfully' : 'Failed to assign task'
        };
    }

    /**
     * Reject a task assignment suggestion
     */
    rejectSuggestion(suggestionId, humanReason = '') {
        if (!this.coordinationState.pendingSuggestions) {
            return { success: false, error: 'No pending suggestions found' };
        }

        const suggestion = this.coordinationState.pendingSuggestions.find(s => s.id === suggestionId);
        if (!suggestion) {
            return { success: false, error: 'Suggestion not found' };
        }

        suggestion.status = 'rejected';
        suggestion.humanReason = humanReason;
        suggestion.rejectedAt = new Date().toISOString();

        console.log(`❌ HUMAN REJECTED: Task ${suggestion.taskId} assignment to ${suggestion.targetAgent}`);
        if (humanReason) {
            console.log(`💬 Human reason: ${humanReason}`);
        }

        this.saveCoordinationState();
        return { success: true, suggestion, message: 'Suggestion rejected' };
    }

    /**
     * Get pending suggestions awaiting human approval
     */
    getPendingSuggestions() {
        return this.coordinationState.pendingSuggestions?.filter(s => s.status === 'pending') || [];
    }

    /**
     * Check agent capability for task assignment
     */
    checkAgentCapability(agentId, task) {
        const agent = this.agents.find(a => a.id === agentId);
        if (!agent) {
            return { capable: false, reason: 'Agent not found' };
        }

        if (agent.status !== 'available') {
            return { capable: false, reason: `Agent status is ${agent.status}` };
        }

        // Basic capability matching
        const taskKeywords = (task.description || task.title || '').toLowerCase();
        const agentCapabilities = agent.capabilities || [];
        
        const matches = agentCapabilities.filter(capability => 
            taskKeywords.includes(capability.toLowerCase())
        );

        return {
            capable: matches.length > 0 || agentCapabilities.includes('general'),
            reason: matches.length > 0 ? `Matches capabilities: ${matches.join(', ')}` : 'No matching capabilities',
            matchedCapabilities: matches,
            agentCapabilities
        };
    }

    /**
     * Reset coordination state
     */
    resetCoordinationState() {
        this.coordinationState = {
            lastAssignment: null,
            activeWorkflows: [],
            agentMetrics: {},
            pendingSuggestions: []
        };
        this.saveCoordinationState();
    }

    /**
     * Get coordination state (API compatibility)
     */
    get state() {
        return this.coordinationState;
    }

    /**
     * Legacy role mapping for backward compatibility
     */
    static get LEGACY_ROLE_MAPPING() {
        return {
            'orchestrator-master': 'orchestrator-agent',
            'qa-agent': 'qa-specialist', 
            'backend-dev': 'backend-agent',
            'frontend-dev': 'frontend-agent',
            'documentation-agent': 'devops-agent',
            'server-agent': 'orchestrator-agent',
            'devops-agent': 'devops-agent',
            'integration-specialist': 'backend-agent',
            'frontend-architect': 'frontend-agent',
            'ui-developer': 'frontend-agent'
        };
    }
}

module.exports = AgentCoordinationWorkflow;