#!/usr/bin/env node

/**
 * Orchestrator Agent - Task Coordinator
 * 
 * Purpose: Multi-agent coordination and developer interaction
 * Role: Acts as task coordinator, suggests tasks/fixes to developer for approval
 * 
 * Capabilities:
 * - Task routing and agent assignment
 * - Priority management and conflict resolution  
 * - Progress tracking across all agents
 * - Developer interface for task suggestions and approvals
 * - Multi-agent workflow coordination
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Agent Configuration
const AGENT_CONFIG = {
    id: 'orchestrator-agent',
    name: 'Orchestrator Agent',
    role: 'orchestrator-agent',
    workspace: 'orchestrator-agent-copy',
    timeout: 180000, // 3 minutes
    developerInterface: true,
    coordinationMode: true
};

// Agent Mappings for Task Routing
const AGENT_ROUTING = {
    'frontend-agent': {
        keywords: ['frontend', 'react', 'typescript', 'vite', 'component', 'widget', 'style', 'css', 'html', 'visual', 'layout', 'tailwind', 'responsive', 'accessibility', 'ui', 'ux'],
        priority: 4
    },
    'backend-agent': {
        keywords: ['backend', 'api', 'server', 'express', 'nodejs', 'database', 'auth', 'data', 'integration', 'service'],
        priority: 3
    },
    'devops-agent': {
        keywords: ['server', 'deploy', 'docker', 'start', 'stop', 'run', 'build', 'npm', 'devops', 'infrastructure', 'ci', 'cd'],
        priority: 5,
        exclusive: true
    },
    'qa-specialist': {
        keywords: ['test', 'validate', 'qa', 'quality', 'debug', 'verify', 'check', 'accessibility', 'performance'],
        priority: 2
    }
};

class OrchestratorAgent {
    constructor() {
        this.agentId = `${AGENT_CONFIG.id}-${Date.now()}`;
        this.startTime = Date.now();
        this.tasksHandled = 0;
        this.suggestions = [];
        this.conflicts = [];
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [ORCHESTRATOR] [${type}] ${message}`);
    }

    // Execute TaskMaster commands
    executeTaskMasterCommand(command) {
        try {
            const result = execSync(`task-master ${command}`, { 
                encoding: 'utf8',
                cwd: process.cwd()
            });
            return result.trim();
        } catch (error) {
            this.log(`Command failed: ${command} - ${error.message}`, 'ERROR');
            return null;
        }
    }

    // Switch to orchestrator workspace
    switchToWorkspace() {
        this.log(`Switching to workspace: ${AGENT_CONFIG.workspace}`);
        const result = this.executeTaskMasterCommand(`use-tag ${AGENT_CONFIG.workspace}`);
        if (result) {
            this.log(`Workspace switched successfully`);
        }
        return result;
    }

    // Analyze task and determine best agent assignment
    analyzeTaskForAgent(task) {
        const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
        const scores = {};

        // Score each agent based on keyword matches
        for (const [agentId, agentInfo] of Object.entries(AGENT_ROUTING)) {
            let score = 0;
            let keywordMatches = [];

            for (const keyword of agentInfo.keywords) {
                if (taskText.includes(keyword)) {
                    score += 1;
                    keywordMatches.push(keyword);
                }
            }

            scores[agentId] = {
                score,
                priority: agentInfo.priority,
                keywordMatches,
                exclusive: agentInfo.exclusive || false
            };
        }

        // Find best match
        let bestAgent = null;
        let bestScore = 0;

        for (const [agentId, agentScore] of Object.entries(scores)) {
            // Prioritize exclusive agents for their keywords
            const adjustedScore = agentScore.exclusive && agentScore.score > 0 
                ? agentScore.score * 2 
                : agentScore.score;

            if (adjustedScore > bestScore) {
                bestScore = adjustedScore;
                bestAgent = agentId;
            }
        }

        return {
            recommendedAgent: bestAgent,
            reasoning: bestAgent ? `Matched keywords: ${scores[bestAgent].keywordMatches.join(', ')}` : 'No clear match',
            allScores: scores
        };
    }

    // Get pending tasks that need assignment
    getPendingTasks() {
        this.log('Fetching pending tasks for review...');
        const result = this.executeTaskMasterCommand('list --status=pending');
        
        if (!result) return [];

        // Parse task list (basic parsing - adjust based on actual format)
        const tasks = [];
        const lines = result.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            // Basic task parsing - adjust format as needed
            if (line.includes('#')) {
                const match = line.match(/#(\d+(?:\.\d+)?)\s*-\s*(.+)/);
                if (match) {
                    tasks.push({
                        id: match[1],
                        title: match[2].trim(),
                        status: 'pending'
                    });
                }
            }
        }

        return tasks;
    }

    // Get tasks currently in progress
    getInProgressTasks() {
        this.log('Checking in-progress tasks...');
        const result = this.executeTaskMasterCommand('list --status=in-progress');
        return result || 'No in-progress tasks';
    }

    // Suggest task assignment to human
    suggestTaskAssignment(task, recommendation) {
        const suggestion = {
            type: 'task_assignment',
            taskId: task.id,
            taskTitle: task.title,
            recommendedAgent: recommendation.recommendedAgent,
            reasoning: recommendation.reasoning,
            timestamp: new Date().toISOString()
        };

        this.suggestions.push(suggestion);

        // Create human-readable suggestion
        const suggestionText = `ORCHESTRATOR: Suggests assigning task #${task.id} to ${recommendation.recommendedAgent} - ${recommendation.reasoning}`;
        
        this.log(`Suggestion: ${suggestionText}`);
        
        // Update task with orchestrator suggestion
        this.executeTaskMasterCommand(`update-task --id=${task.id} --prompt="${suggestionText}"`);

        return suggestion;
    }

    // Monitor and report progress
    generateProgressReport() {
        this.log('Generating progress report...');
        
        const pendingTasks = this.getPendingTasks();
        const inProgressTasks = this.getInProgressTasks();

        const report = {
            timestamp: new Date().toISOString(),
            pendingCount: pendingTasks.length,
            inProgressSummary: inProgressTasks,
            suggestionsCount: this.suggestions.length,
            conflictsCount: this.conflicts.length,
            tasksHandled: this.tasksHandled
        };

        const humanReport = `ORCHESTRATOR: Progress Report - ${pendingTasks.length} pending tasks, ${this.suggestions.length} suggestions made, ${this.tasksHandled} tasks handled this session`;
        
        this.log(`Progress Report: ${humanReport}`);
        
        return report;
    }

    // Handle conflicts between agents
    handleConflict(conflictData) {
        const conflict = {
            type: 'agent_conflict',
            data: conflictData,
            timestamp: new Date().toISOString(),
            resolution: 'escalated_to_human'
        };

        this.conflicts.push(conflict);

        const conflictText = `ORCHESTRATOR: Needs human decision on conflict - ${JSON.stringify(conflictData)}`;
        this.log(`Conflict escalated: ${conflictText}`, 'WARN');

        return conflict;
    }

    // Main orchestration workflow
    async orchestrate() {
        this.log('Starting orchestration session...');

        try {
            // Switch to orchestrator workspace
            this.switchToWorkspace();

            // Get pending tasks
            const pendingTasks = this.getPendingTasks();
            this.log(`Found ${pendingTasks.length} pending tasks`);

            // Process each pending task
            for (const task of pendingTasks.slice(0, 5)) { // Limit to 5 tasks per session
                this.log(`Analyzing task #${task.id}: ${task.title}`);
                
                const recommendation = this.analyzeTaskForAgent(task);
                
                if (recommendation.recommendedAgent) {
                    this.suggestTaskAssignment(task, recommendation);
                    this.tasksHandled++;
                } else {
                    this.log(`No clear agent assignment for task #${task.id}`, 'WARN');
                }

                // Small delay between tasks
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Generate progress report
            this.generateProgressReport();

            // Check for conflicts (placeholder - implement based on actual conflict detection)
            // this.checkForConflicts();

        } catch (error) {
            this.log(`Orchestration error: ${error.message}`, 'ERROR');
        }
    }

    // Register agent as active
    registerAgent() {
        const liveAgentsPath = '.taskmaster/agents/live-agents.json';
        let liveAgents = {};

        try {
            if (fs.existsSync(liveAgentsPath)) {
                liveAgents = JSON.parse(fs.readFileSync(liveAgentsPath, 'utf8'));
            }
        } catch (error) {
            this.log(`Could not read live agents file: ${error.message}`, 'WARN');
        }

        liveAgents[this.agentId] = {
            ...AGENT_CONFIG,
            pid: process.pid,
            startTime: this.startTime,
            lastActive: Date.now()
        };

        try {
            fs.writeFileSync(liveAgentsPath, JSON.stringify(liveAgents, null, 2));
            this.log(`Agent registered: ${this.agentId}`);
        } catch (error) {
            this.log(`Could not write live agents file: ${error.message}`, 'ERROR');
        }
    }

    // Unregister agent
    unregisterAgent() {
        const liveAgentsPath = '.taskmaster/agents/live-agents.json';
        
        try {
            if (fs.existsSync(liveAgentsPath)) {
                const liveAgents = JSON.parse(fs.readFileSync(liveAgentsPath, 'utf8'));
                delete liveAgents[this.agentId];
                fs.writeFileSync(liveAgentsPath, JSON.stringify(liveAgents, null, 2));
                this.log(`Agent unregistered: ${this.agentId}`);
            }
        } catch (error) {
            this.log(`Could not unregister agent: ${error.message}`, 'ERROR');
        }
    }

    // Get agent routing configuration (needed by API)
    getAgentRouting() {
        return AGENT_ROUTING;
    }
}

// Main execution
async function main() {
    const orchestrator = new OrchestratorAgent();
    
    // Handle graceful shutdown
    const cleanup = () => {
        orchestrator.log('Shutting down orchestrator agent...');
        orchestrator.unregisterAgent();
        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Register agent
    orchestrator.registerAgent();

    // Set timeout
    const timeout = setTimeout(() => {
        orchestrator.log('Timeout reached, shutting down...');
        cleanup();
    }, AGENT_CONFIG.timeout);

    try {
        // Main orchestration loop
        await orchestrator.orchestrate();
        
        orchestrator.log('Orchestration session completed successfully');
        
    } catch (error) {
        orchestrator.log(`Fatal error: ${error.message}`, 'ERROR');
    } finally {
        clearTimeout(timeout);
        cleanup();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Orchestrator agent failed:', error);
        process.exit(1);
    });
}

module.exports = OrchestratorAgent;