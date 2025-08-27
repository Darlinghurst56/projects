/**
 * TaskMaster AI - Enhanced Orchestrator Controller
 * Provides human-understandable interface for orchestrator suggestions and workflows
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

class OrchestratorController {
    constructor(projectRoot, coordinationWorkflow) {
        this.router = express.Router();
        this.projectRoot = projectRoot;
        this.coordinationWorkflow = coordinationWorkflow;
        this.setupRoutes();
    }

    setupRoutes() {
        // Get orchestrator's task assignment suggestions
        this.router.get('/suggestions', (req, res) => {
            try {
                const suggestions = this.getOrchestratorSuggestions();
                const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
                
                res.json({
                    success: true,
                    total: suggestions.length,
                    pending: pendingSuggestions.length,
                    suggestions: pendingSuggestions.map(this.formatSuggestionForHuman.bind(this)),
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Analyze tasks for assignment suggestions
        this.router.post('/analyze', (req, res) => {
            try {
                const { taskIds, forceAnalysis } = req.body;
                
                // Get tasks to analyze
                const tasks = this.getTasksForAnalysis(taskIds);
                const suggestions = [];

                for (const task of tasks) {
                    const suggestion = this.analyzeTaskForAssignment(task);
                    if (suggestion) {
                        suggestions.push(suggestion);
                    }
                }

                res.json({
                    success: true,
                    analyzed: tasks.length,
                    suggestions: suggestions.length,
                    results: suggestions.map(this.formatSuggestionForHuman.bind(this)),
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Approve orchestrator suggestion
        this.router.post('/suggestions/:id/approve', (req, res) => {
            try {
                const { id } = req.params;
                const { notes } = req.body;
                
                const result = this.approveSuggestion(id, notes);
                
                res.json({
                    success: true,
                    suggestionId: id,
                    action: 'approved',
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

        // Reject orchestrator suggestion
        this.router.post('/suggestions/:id/reject', (req, res) => {
            try {
                const { id } = req.params;
                const { reason } = req.body;
                
                const result = this.rejectSuggestion(id, reason);
                
                res.json({
                    success: true,
                    suggestionId: id,
                    action: 'rejected',
                    reason: reason || 'No reason provided',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Get human-readable workflow status
        this.router.get('/workflow', (req, res) => {
            try {
                const workflowStatus = this.getWorkflowStatus();
                
                res.json({
                    success: true,
                    workflow: workflowStatus,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Generate progress report
        this.router.get('/progress', (req, res) => {
            try {
                const report = this.generateProgressReport();
                
                res.json({
                    success: true,
                    report,
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
     * Analyze task for agent assignment using orchestrator intelligence
     */
    analyzeTaskForAssignment(task) {
        try {
            // Get agent routing rules directly without instantiating the agent
            const agentRoles = require(path.join(this.projectRoot, '.taskmaster/agents/agent-roles.json'));
            const agentRouting = {
                'frontend-agent': {
                    keywords: agentRoles.agents['frontend-agent'].keywords,
                    priority: 4
                },
                'backend-agent': {
                    keywords: agentRoles.agents['backend-agent'].keywords,
                    priority: 3
                },
                'qa-specialist': {
                    keywords: agentRoles.agents['qa-specialist'].keywords,
                    priority: 2
                },
                'devops-agent': {
                    keywords: agentRoles.agents['devops-agent'].keywords,
                    priority: 5
                }
            };
            const taskKeywords = this.extractTaskKeywords(task);
            
            // Find best matching agent
            let bestMatch = null;
            let highestScore = 0;
            
            for (const [agentId, agentConfig] of Object.entries(agentRouting)) {
                const score = this.calculateMatchScore(taskKeywords, agentConfig.keywords || []);
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = { agentId, score, config: agentConfig };
                }
            }
            
            if (bestMatch && bestMatch.score > 0.1) { // Lower threshold for MVP testing
                const reasoning = this.generateAssignmentReasoning(task, bestMatch, taskKeywords);
                
                return {
                    id: `suggestion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    taskId: task.id,
                    recommendedAgent: bestMatch.agentId,
                    confidence: bestMatch.score,
                    reasoning: reasoning,
                    keywords: taskKeywords,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error analyzing task:', error);
            return null;
        }
    }

    /**
     * Format suggestion for human understanding
     */
    formatSuggestionForHuman(suggestion) {
        return {
            id: suggestion.id,
            task: {
                id: suggestion.taskId,
                title: this.getTaskTitle(suggestion.taskId)
            },
            recommendation: {
                agent: suggestion.recommendedAgent,
                agentName: this.getAgentDisplayName(suggestion.recommendedAgent),
                confidence: Math.round(suggestion.confidence * 100) + '%'
            },
            reasoning: {
                summary: suggestion.reasoning,
                keywords: suggestion.keywords || [],
                explanation: this.generateHumanExplanation(suggestion)
            },
            workflow: {
                nextSteps: this.getNextSteps(suggestion),
                estimatedTime: this.estimateTaskTime(suggestion),
                dependencies: this.checkTaskDependencies(suggestion.taskId)
            },
            status: suggestion.status,
            createdAt: suggestion.createdAt
        };
    }

    /**
     * Generate human-readable explanation for suggestion
     */
    generateHumanExplanation(suggestion) {
        const agent = suggestion.recommendedAgent;
        const keywords = suggestion.keywords || [];
        
        const explanations = {
            'frontend-agent': `This task involves UI/frontend work. Keywords found: ${keywords.filter(k => ['react', 'component', 'css', 'ui', 'visual'].includes(k)).join(', ')}`,
            'backend-agent': `This task requires backend/API development. Keywords found: ${keywords.filter(k => ['api', 'server', 'database', 'auth'].includes(k)).join(', ')}`,
            'qa-specialist': `This task needs testing and quality assurance. Keywords found: ${keywords.filter(k => ['test', 'qa', 'validate', 'debug'].includes(k)).join(', ')}`,
            'devops-agent': `This task involves deployment or infrastructure. Keywords found: ${keywords.filter(k => ['deploy', 'docker', 'build', 'server'].includes(k)).join(', ')}`
        };
        
        return explanations[agent] || `Recommended for ${agent} based on task analysis.`;
    }

    /**
     * Get next steps for suggestion workflow
     */
    getNextSteps(suggestion) {
        return [
            'Review task requirements and agent capabilities',
            'Approve or modify the assignment',
            'Agent will receive task and begin work',
            'Monitor progress and provide feedback as needed'
        ];
    }

    /**
     * Additional helper methods for orchestrator intelligence
     */
    extractTaskKeywords(task) {
        const text = `${task.title} ${task.description || ''} ${task.details || ''} ${task.testStrategy || ''}`.toLowerCase();
        const keywords = [];
        
        // Define keyword patterns for different agent types
        const patterns = {
            frontend: ['react', 'component', 'ui', 'css', 'html', 'frontend', 'visual', 'layout', 'responsive', 'form', 'dashboard'],
            backend: ['api', 'server', 'database', 'auth', 'backend', 'endpoint', 'service'],
            qa: ['test', 'testing', 'qa', 'quality', 'validate', 'debug', 'verify'],
            devops: ['deploy', 'deployment', 'docker', 'build', 'server', 'infrastructure']
        };
        
        for (const [category, terms] of Object.entries(patterns)) {
            for (const term of terms) {
                if (text.includes(term)) {
                    keywords.push(term);
                }
            }
        }
        
        console.log('Task keywords for task', task.id, ':', keywords);
        return keywords;
    }

    calculateMatchScore(taskKeywords, agentKeywords) {
        if (!taskKeywords.length || !agentKeywords.length) return 0;
        
        const matches = taskKeywords.filter(keyword => 
            agentKeywords.some(agentKeyword => 
                keyword.includes(agentKeyword) || agentKeyword.includes(keyword)
            )
        );
        
        return matches.length / Math.max(taskKeywords.length, agentKeywords.length);
    }

    generateAssignmentReasoning(task, bestMatch, keywords) {
        const agent = bestMatch.agentId;
        const confidence = Math.round(bestMatch.score * 100);
        
        return `Task "${task.title}" matches ${agent} capabilities with ${confidence}% confidence. ` +
               `Key indicators: ${keywords.slice(0, 3).join(', ')}. ` +
               `This agent specializes in ${bestMatch.config.keywords.slice(0, 3).join(', ')} tasks.`;
    }

    // Additional utility methods would be implemented here...
    getOrchestratorSuggestions() {
        // Implementation to get suggestions from coordination workflow
        return this.coordinationWorkflow?.coordinationState?.pendingSuggestions || [];
    }

    getTasksForAnalysis(taskIds) {
        // Get tasks from TaskMaster
        try {
            const tasksPath = path.join(this.projectRoot, '.taskmaster/tasks/tasks.json');
            const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
            const allTasks = tasksData.master?.tasks || [];
            
            if (taskIds && taskIds.length > 0) {
                return allTasks.filter(task => taskIds.includes(String(task.id)));
            }
            
            // Return unassigned tasks if no specific IDs provided
            return allTasks.filter(task => 
                task.status === 'pending' || 
                (task.status === 'in-progress' && !task.assignedTo)
            );
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    getTaskTitle(taskId) {
        // Get actual task title from TaskMaster
        try {
            const tasksPath = path.join(this.projectRoot, '.taskmaster/tasks/tasks.json');
            const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
            const task = tasksData.master?.tasks?.find(t => String(t.id) === String(taskId));
            return task?.title || `Task ${taskId}`;
        } catch (error) {
            return `Task ${taskId}`;
        }
    }

    getAgentDisplayName(agentId) {
        const names = {
            'frontend-agent': 'Frontend Developer',
            'backend-agent': 'Backend Developer', 
            'qa-specialist': 'QA Specialist',
            'devops-agent': 'DevOps Engineer',
            'orchestrator-agent': 'Orchestrator'
        };
        return names[agentId] || agentId;
    }

    approveSuggestion(id, notes) {
        // Implementation for approval workflow
        return { approved: true, notes };
    }

    rejectSuggestion(id, reason) {
        // Implementation for rejection workflow  
        return { rejected: true, reason };
    }

    getWorkflowStatus() {
        // Implementation for workflow status
        return { status: 'active', phase: 'analysis' };
    }

    generateProgressReport() {
        // Implementation for progress reporting
        return { 
            tasksAnalyzed: 0, 
            suggestionsGenerated: 0, 
            approvalsReceived: 0 
        };
    }

    estimateTaskTime(suggestion) {
        return '2-4 hours'; // Placeholder
    }

    checkTaskDependencies(taskId) {
        return []; // Placeholder
    }

    getRouter() {
        return this.router;
    }
}

module.exports = OrchestratorController;