#!/usr/bin/env node

/**
 * Enhanced Orchestrator Integration
 * Minimal patch that adds telemetry tracking and LLM switching to existing orchestrator
 */

const { AgentTelemetryTracker } = require('./agent-telemetry-tracker.js');
const { getAgentModelConfig } = require('./test-strategy-enhancer.js');

/**
 * Drop-in replacement for orchestrator's executeTaskMasterCommand method
 * Add this after the existing method in orchestrator-agent.js
 */
class EnhancedOrchestratorAgent {
    constructor(agentId = 'orchestrator-agent') {
        this.agentId = agentId;
        this.tracker = new AgentTelemetryTracker();
        this.modelConfig = getAgentModelConfig(agentId);
    }

    /**
     * Enhanced command execution with telemetry and model selection
     * Replace existing executeTaskMasterCommand method with this
     */
    executeTaskMasterCommand(command, taskId = null, action = 'command') {
        // Add model configuration to command if it's an AI operation
        if (this.isAICommand(command)) {
            command = this.addModelConfig(command);
        }

        // Use tracker's executeWithTracking for automatic telemetry
        return this.tracker.executeWithTracking(this.agentId, command, taskId, action);
    }

    /**
     * Check if command requires AI model configuration
     */
    isAICommand(command) {
        const aiCommands = ['add-task', 'expand', 'research', 'update-task', 'analyze-complexity'];
        return aiCommands.some(cmd => command.includes(cmd));
    }

    /**
     * Add model configuration to AI commands
     * Uses TaskMaster's model configuration system
     */
    addModelConfig(command) {
        // TaskMaster v0.21.0 supports model selection via config
        // Our agent-specific config is already set in test-strategy-enhancer.js
        return command; // Config is handled by .taskmaster/config.json
    }

    /**
     * Enhanced task analysis with tracking
     */
    async analyzeTaskForAgentEnhanced(task) {
        const startTime = Date.now();
        
        try {
            // Use TaskMaster's research capability for agent assignment
            const researchCommand = `research "Which agent should handle: ${task.title}? Available: frontend-agent, backend-agent, devops-agent, qa-specialist. Consider task type and complexity." --detail=minimal`;
            
            const result = this.executeTaskMasterCommand(
                researchCommand, 
                task.id, 
                'agent-assignment'
            );
            
            // Extract agent recommendation
            const agentMatch = result.match(/(frontend-agent|backend-agent|devops-agent|qa-specialist)/i);
            const recommendedAgent = agentMatch ? agentMatch[0].toLowerCase() : null;
            
            // Track successful analysis
            this.tracker.trackLLMUsage(this.agentId, task.id, 'agent-analysis', {
                analysisTimeMs: Date.now() - startTime,
                recommendedAgent,
                taskComplexity: task.complexity || 'unknown',
                success: true
            });

            return {
                recommendedAgent,
                reasoning: `AI analysis: ${result.substring(0, 100)}...`,
                confidence: recommendedAgent ? 'high' : 'low',
                enhanced: true
            };

        } catch (error) {
            // Track failed analysis and fallback to keywords
            this.tracker.trackLLMUsage(this.agentId, task.id, 'agent-analysis', {
                analysisTimeMs: Date.now() - startTime,
                error: error.message,
                success: false,
                fallback: 'keyword-matching'
            });

            return null; // Will trigger fallback to keyword matching
        }
    }

    /**
     * Generate telemetry report for orchestrator decisions
     */
    getTelemetryReport(days = 7) {
        const report = this.tracker.getAgentUsageSummary(this.agentId, days);
        
        // Add orchestrator-specific metrics
        report.orchestratorMetrics = {
            taskAssignments: report.actions.filter(action => action === 'agent-assignment').length,
            taskAnalyses: report.actions.filter(action => action === 'agent-analysis').length,
            averageDecisionTime: report.averageResponseTime,
            costPerDecision: report.totalCost / Math.max(report.totalCalls, 1)
        };

        return report;
    }

    /**
     * Switch model configuration for different task types
     * Minimal implementation using existing TaskMaster config
     */
    switchModelForTask(task) {
        // Different models for different complexity levels
        const complexityModelMap = {
            'simple': 'gemini-2.0-flash',      // Fast, cheap
            'medium': 'claude-3-5-haiku',     // Balanced
            'complex': 'claude-3-5-sonnet'    // Best reasoning
        };

        const taskComplexity = this.assessTaskComplexity(task);
        const preferredModel = complexityModelMap[taskComplexity] || 'gemini-2.0-flash';
        
        // Log model selection
        this.tracker.trackLLMUsage(this.agentId, task.id, 'model-selection', {
            taskComplexity,
            preferredModel,
            reason: `Complexity-based selection: ${taskComplexity}`
        });

        return preferredModel;
    }

    /**
     * Simple task complexity assessment
     */
    assessTaskComplexity(task) {
        const title = task.title.toLowerCase();
        const description = (task.description || '').toLowerCase();
        const text = title + ' ' + description;

        // Simple heuristics
        if (text.includes('complex') || text.includes('integration') || text.includes('system')) {
            return 'complex';
        } else if (text.includes('test') || text.includes('validate') || text.includes('check')) {
            return 'simple';
        } else {
            return 'medium';
        }
    }
}

/**
 * Minimal integration instructions:
 * 
 * 1. In orchestrator-agent.js, add at the top after other requires:
 *    const { EnhancedOrchestratorAgent } = require('../../.taskmaster/agents/enhanced-orchestrator-integration.js');
 * 
 * 2. In the OrchestratorAgent constructor, add:
 *    this.enhancedAgent = new EnhancedOrchestratorAgent(this.agentId);
 * 
 * 3. Replace executeTaskMasterCommand method with:
 *    executeTaskMasterCommand(command, taskId, action) {
 *        return this.enhancedAgent.executeTaskMasterCommand(command, taskId, action);
 *    }
 * 
 * 4. In analyzeTaskForAgent method, add at the beginning:
 *    const enhanced = await this.enhancedAgent.analyzeTaskForAgentEnhanced(task);
 *    if (enhanced && enhanced.recommendedAgent) {
 *        return enhanced;
 *    }
 *    // Continue with existing keyword logic...
 */

module.exports = { EnhancedOrchestratorAgent };