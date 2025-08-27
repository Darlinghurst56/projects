#!/usr/bin/env node

/**
 * TaskMaster AI - Capability-Based Auto-Assignment System
 * Intelligent task assignment based on agent capabilities and task requirements
 */

const fs = require('fs');
const path = require('path');

class CapabilityMatcher {
    constructor() {
        this.agentCapabilities = {
            'orchestrator-agent': {
                capabilities: ['coordination', 'developer-interface', 'web-research', 'file-creation', 'project-management', 'task-routing', 'multi-agent-workflow'],
                keywords: ['orchestrate', 'coordinate', 'manage', 'priority', 'workflow', 'progress', 'conflict', 'feedback', 'developer-interface', 'routing', 'handoff', 'delegation'],
                exclusiveCapabilities: ['coordination', 'developer-interface', 'multi-agent-workflow'],
                priority: 1, // Higher priority for coordination tasks
                confidence: 0.95
            },
            'frontend-agent': {
                capabilities: ['react', 'typescript', 'css', 'html', 'ui-components', 'responsive-design', 'accessibility', 'web-research', 'state-management'],
                keywords: ['frontend', 'react', 'typescript', 'vite', 'component', 'widget', 'style', 'css', 'html', 'visual', 'layout', 'tailwind', 'responsive', 'accessibility', 'ui', 'ux', 'hooks', 'context'],
                exclusiveCapabilities: ['react', 'typescript', 'css', 'ui-components'],
                priority: 2,
                confidence: 0.90
            },
            'backend-agent': {
                capabilities: ['nodejs', 'express', 'api', 'database', 'authentication', 'data-processing', 'server-logic', 'web-research', 'middleware'],
                keywords: ['backend', 'api', 'server', 'express', 'nodejs', 'database', 'auth', 'data', 'integration', 'service', 'endpoint', 'middleware', 'cors', 'routes'],
                exclusiveCapabilities: ['nodejs', 'express', 'api', 'server-logic'],
                priority: 2,
                confidence: 0.90
            },
            'devops-agent': {
                capabilities: ['deployment', 'docker', 'ci-cd', 'infrastructure', 'server-management', 'build-systems', 'monitoring'],
                keywords: ['server', 'deploy', 'docker', 'start', 'stop', 'run', 'build', 'npm', 'devops', 'infrastructure', 'ci', 'cd', 'monitoring', 'health', 'logs'],
                exclusiveCapabilities: ['deployment', 'docker', 'infrastructure', 'server-management'],
                priority: 3, // Lower priority unless specifically needed
                confidence: 0.85
            },
            'qa-specialist': {
                capabilities: ['testing', 'validation', 'quality-assurance', 'debugging', 'accessibility-testing', 'web-testing', 'performance-testing'],
                keywords: ['test', 'validate', 'qa', 'quality', 'debug', 'verify', 'check', 'accessibility', 'performance', 'e2e', 'unit', 'integration'],
                exclusiveCapabilities: ['testing', 'validation', 'quality-assurance'],
                priority: 2,
                confidence: 0.88
            }
        };

        this.taskPatterns = {
            'high-priority': {
                keywords: ['urgent', 'critical', 'important', 'high', 'asap', 'immediate'],
                priorityBoost: 2
            },
            'coordination': {
                keywords: ['coordinate', 'orchestrate', 'manage', 'assign', 'route', 'workflow'],
                requiredAgent: 'orchestrator-agent'
            },
            'ui-development': {
                keywords: ['component', 'ui', 'interface', 'frontend', 'react', 'css', 'html'],
                preferredAgent: 'frontend-agent'
            },
            'api-development': {
                keywords: ['api', 'endpoint', 'server', 'backend', 'database', 'auth'],
                preferredAgent: 'backend-agent'
            },
            'testing': {
                keywords: ['test', 'validate', 'qa', 'quality', 'debug'],
                preferredAgent: 'qa-specialist'
            },
            'deployment': {
                keywords: ['deploy', 'docker', 'build', 'ci', 'cd', 'infrastructure'],
                preferredAgent: 'devops-agent'
            }
        };
    }

    /**
     * Analyze task content to extract keywords and requirements
     */
    analyzeTask(task) {
        const content = `${task.title || ''} ${task.description || ''} ${task.details || ''}`.toLowerCase();
        
        const analysis = {
            keywords: [],
            patterns: [],
            priority: task.priority || 'medium',
            complexity: this.estimateComplexity(content),
            requiredCapabilities: [],
            preferredAgent: null,
            requiredAgent: null,
            confidence: 0,
            reasoning: []
        };

        // Extract keywords from all agent capabilities
        Object.values(this.agentCapabilities).forEach(agent => {
            agent.keywords.forEach(keyword => {
                if (content.includes(keyword)) {
                    analysis.keywords.push(keyword);
                    analysis.reasoning.push(`Found keyword '${keyword}' in task content`);
                }
            });
        });

        // Match task patterns
        Object.entries(this.taskPatterns).forEach(([patternName, pattern]) => {
            const matches = pattern.keywords.filter(keyword => content.includes(keyword));
            if (matches.length > 0) {
                analysis.patterns.push({
                    name: patternName,
                    matches,
                    strength: matches.length / pattern.keywords.length
                });

                // Apply pattern effects
                if (pattern.requiredAgent) {
                    analysis.requiredAgent = pattern.requiredAgent;
                }
                if (pattern.preferredAgent) {
                    analysis.preferredAgent = pattern.preferredAgent;
                }
                if (pattern.priorityBoost) {
                    analysis.priority = this.boostPriority(analysis.priority, pattern.priorityBoost);
                }
            }
        });

        return analysis;
    }

    /**
     * Estimate task complexity based on content
     */
    estimateComplexity(content) {
        const complexityIndicators = {
            'simple': ['simple', 'basic', 'quick', 'easy', 'minor'],
            'medium': ['implement', 'create', 'build', 'develop', 'setup'],
            'complex': ['system', 'architecture', 'integration', 'framework', 'complex', 'advanced'],
            'very-complex': ['enterprise', 'scalable', 'distributed', 'microservices', 'kubernetes']
        };

        let complexity = 1; // Default simple
        
        Object.entries(complexityIndicators).forEach(([level, indicators]) => {
            const matches = indicators.filter(indicator => content.includes(indicator));
            if (matches.length > 0) {
                complexity = Math.max(complexity, 
                    level === 'simple' ? 1 : 
                    level === 'medium' ? 2 : 
                    level === 'complex' ? 3 : 4
                );
            }
        });

        return complexity;
    }

    /**
     * Boost priority level
     */
    boostPriority(currentPriority, boost) {
        const priorities = ['low', 'medium', 'high', 'urgent'];
        const currentIndex = priorities.indexOf(currentPriority);
        const newIndex = Math.min(currentIndex + boost, priorities.length - 1);
        return priorities[newIndex];
    }

    /**
     * Calculate compatibility score between task and agent
     */
    calculateCompatibilityScore(taskAnalysis, agentId) {
        const agent = this.agentCapabilities[agentId];
        if (!agent) return 0;

        let score = 0;
        let factors = {
            keywordMatches: 0,
            capabilityMatches: 0,
            exclusiveMatch: 0,
            patternMatch: 0,
            priorityMatch: 0
        };

        // Keyword matching (40% of score)
        const keywordMatches = taskAnalysis.keywords.filter(keyword => 
            agent.keywords.includes(keyword)
        ).length;
        factors.keywordMatches = (keywordMatches / Math.max(taskAnalysis.keywords.length, 1)) * 40;

        // Capability matching (30% of score)
        const capabilityMatches = taskAnalysis.requiredCapabilities.filter(capability =>
            agent.capabilities.includes(capability)
        ).length;
        factors.capabilityMatches = (capabilityMatches / Math.max(taskAnalysis.requiredCapabilities.length, 1)) * 30;

        // Exclusive capability bonus (20% of score)
        if (agent.exclusiveCapabilities.some(cap => 
            taskAnalysis.keywords.some(keyword => keyword.includes(cap))
        )) {
            factors.exclusiveMatch = 20;
        }

        // Pattern matching (10% of score)
        if (taskAnalysis.requiredAgent === agentId) {
            factors.patternMatch = 10;
        } else if (taskAnalysis.preferredAgent === agentId) {
            factors.patternMatch = 5;
        }

        // Priority matching bonus
        if (taskAnalysis.priority === 'high' || taskAnalysis.priority === 'urgent') {
            factors.priorityMatch = agent.priority === 1 ? 5 : 0;
        }

        score = factors.keywordMatches + factors.capabilityMatches + 
                factors.exclusiveMatch + factors.patternMatch + factors.priorityMatch;

        return {
            score: Math.min(score, 100),
            factors,
            agent: agentId
        };
    }

    /**
     * Find best agent for a task
     */
    findBestAgent(task, availableAgents = null) {
        const taskAnalysis = this.analyzeTask(task);
        const agentsToCheck = availableAgents || Object.keys(this.agentCapabilities);

        // Handle required agent case
        if (taskAnalysis.requiredAgent && agentsToCheck.includes(taskAnalysis.requiredAgent)) {
            return {
                agent: taskAnalysis.requiredAgent,
                score: 100,
                reasoning: `Required agent for ${taskAnalysis.patterns.find(p => p.name === 'coordination')?.name || 'task type'}`,
                analysis: taskAnalysis
            };
        }

        // Calculate compatibility scores for all agents
        const scores = agentsToCheck.map(agentId => 
            this.calculateCompatibilityScore(taskAnalysis, agentId)
        ).sort((a, b) => b.score - a.score);

        const bestMatch = scores[0];
        
        if (bestMatch.score === 0) {
            return {
                agent: 'orchestrator-agent', // Default fallback
                score: 0,
                reasoning: 'No specific match found, defaulting to orchestrator for coordination',
                analysis: taskAnalysis
            };
        }

        return {
            agent: bestMatch.agent,
            score: bestMatch.score,
            reasoning: this.generateReasoning(taskAnalysis, bestMatch),
            analysis: taskAnalysis,
            alternatives: scores.slice(1, 3) // Top 2 alternatives
        };
    }

    /**
     * Generate human-readable reasoning for assignment
     */
    generateReasoning(taskAnalysis, bestMatch) {
        const agent = this.agentCapabilities[bestMatch.agent];
        const reasons = [];

        if (bestMatch.factors.keywordMatches > 20) {
            reasons.push(`Strong keyword match (${taskAnalysis.keywords.join(', ')})`);
        }

        if (bestMatch.factors.exclusiveMatch > 0) {
            reasons.push(`Exclusive capability match`);
        }

        if (bestMatch.factors.patternMatch > 0) {
            reasons.push(`Task pattern match`);
        }

        if (taskAnalysis.priority === 'high' && agent.priority === 1) {
            reasons.push(`High priority task requires coordination`);
        }

        return reasons.length > 0 ? reasons.join('; ') : 'Best capability match';
    }

    /**
     * Auto-assign multiple tasks to available agents
     */
    autoAssignTasks(tasks, availableAgents = null) {
        const assignments = [];
        const agentWorkload = {};

        // Initialize workload tracking
        const agentsToUse = availableAgents || Object.keys(this.agentCapabilities);
        agentsToUse.forEach(agent => {
            agentWorkload[agent] = 0;
        });

        // Sort tasks by priority
        const sortedTasks = [...tasks].sort((a, b) => {
            const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
            return priorities[b.priority || 'medium'] - priorities[a.priority || 'medium'];
        });

        for (const task of sortedTasks) {
            const assignment = this.findBestAgent(task, agentsToUse);
            
            // Consider workload balancing
            if (agentWorkload[assignment.agent] >= 3) {
                // Try to find alternative with lower workload
                const alternatives = assignment.alternatives || [];
                for (const alt of alternatives) {
                    if (agentWorkload[alt.agent] < 2 && alt.score > 50) {
                        assignment.agent = alt.agent;
                        assignment.reasoning += ` (workload balanced)`;
                        break;
                    }
                }
            }

            assignments.push({
                taskId: task.id,
                agentId: assignment.agent,
                score: assignment.score,
                reasoning: assignment.reasoning,
                analysis: assignment.analysis
            });

            agentWorkload[assignment.agent]++;
        }

        return {
            assignments,
            workload: agentWorkload,
            summary: {
                totalTasks: tasks.length,
                averageScore: assignments.reduce((sum, a) => sum + a.score, 0) / assignments.length,
                agentDistribution: agentWorkload
            }
        };
    }

    /**
     * Validate assignment quality
     */
    validateAssignment(taskId, agentId, reasoning) {
        const agent = this.agentCapabilities[agentId];
        if (!agent) {
            return {
                valid: false,
                issues: [`Unknown agent: ${agentId}`],
                suggestions: []
            };
        }

        const issues = [];
        const suggestions = [];

        // Check for exclusive capabilities
        const hasExclusiveCapability = agent.exclusiveCapabilities.some(cap =>
            reasoning.toLowerCase().includes(cap)
        );

        if (!hasExclusiveCapability) {
            suggestions.push(`Consider if ${agentId} has the right exclusive capabilities`);
        }

        return {
            valid: issues.length === 0,
            issues,
            suggestions
        };
    }

    /**
     * Get capability report for all agents
     */
    getCapabilityReport() {
        const report = {
            agents: {},
            totalCapabilities: 0,
            capabilityOverlap: {},
            recommendations: []
        };

        Object.entries(this.agentCapabilities).forEach(([agentId, agent]) => {
            report.agents[agentId] = {
                capabilities: agent.capabilities.length,
                exclusiveCapabilities: agent.exclusiveCapabilities.length,
                keywords: agent.keywords.length,
                priority: agent.priority
            };
            report.totalCapabilities += agent.capabilities.length;
        });

        // Calculate capability overlap
        const allCapabilities = Object.values(this.agentCapabilities)
            .flatMap(agent => agent.capabilities);
        
        allCapabilities.forEach(capability => {
            const agentsWithCapability = Object.entries(this.agentCapabilities)
                .filter(([_, agent]) => agent.capabilities.includes(capability))
                .map(([agentId, _]) => agentId);
            
            if (agentsWithCapability.length > 1) {
                report.capabilityOverlap[capability] = agentsWithCapability;
            }
        });

        report.recommendations = this.generateCapabilityRecommendations(report);

        return report;
    }

    /**
     * Generate recommendations for capability improvements
     */
    generateCapabilityRecommendations(report) {
        const recommendations = [];

        // Check for capability gaps
        const commonCapabilities = ['documentation', 'monitoring', 'security'];
        commonCapabilities.forEach(cap => {
            const hasCapability = Object.values(this.agentCapabilities)
                .some(agent => agent.capabilities.includes(cap));
            
            if (!hasCapability) {
                recommendations.push(`Consider adding ${cap} capability to appropriate agents`);
            }
        });

        // Check for over-specialized agents
        Object.entries(report.agents).forEach(([agentId, agentReport]) => {
            if (agentReport.capabilities < 4) {
                recommendations.push(`${agentId} might benefit from additional capabilities`);
            }
        });

        return recommendations;
    }
}

module.exports = CapabilityMatcher;