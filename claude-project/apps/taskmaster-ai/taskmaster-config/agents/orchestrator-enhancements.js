#!/usr/bin/env node

/**
 * Orchestrator Enhancements - Minimal improvements using TaskMaster v0.21.0
 * Drop-in replacement functions for orchestrator-agent.js
 */

const { execSync } = require('child_process');
const { enhanceTestStrategy, getAgentModelConfig } = require('./test-strategy-enhancer.js');

/**
 * Enhanced task analysis using TaskMaster AI research
 * Replaces keyword-based matching with AI-powered analysis
 */
async function analyzeTaskForAgentAI(task, availableAgents) {
    try {
        // Use TaskMaster research to determine best agent
        const prompt = `Which agent should handle this task? Task: "${task.title} - ${task.description || ''}". 
Available agents: ${availableAgents.join(', ')}. 
Consider: frontend (React/UI), backend (APIs), devops (deployment/infrastructure), qa-specialist (testing).
Respond with just the agent name.`;

        const result = execSync(`task-master research "${prompt}" --detail=minimal`, {
            encoding: 'utf8',
            timeout: 10000
        }).trim();
        
        // Extract agent name from response
        const agentMatch = result.match(/(frontend-agent|backend-agent|devops-agent|qa-specialist|orchestrator-agent)/i);
        const recommendedAgent = agentMatch ? agentMatch[0].toLowerCase() : null;
        
        return {
            recommendedAgent,
            reasoning: `AI analysis: ${result.substring(0, 100)}...`,
            enhanced: true
        };
    } catch (error) {
        // Fallback to original keyword method
        return null;
    }
}

/**
 * Enhanced task update with better test strategies
 */
function enhanceTaskTestStrategy(taskId, currentStrategy, taskDetails) {
    try {
        // Determine task type from details
        const taskType = taskDetails.toLowerCase();
        const enhanced = enhanceTestStrategy(currentStrategy, taskType);
        
        // Update task with enhanced test strategy
        if (enhanced !== currentStrategy) {
            execSync(`task-master update-task --id=${taskId} --prompt="Enhanced test strategy: ${enhanced}"`, {
                encoding: 'utf8',
                timeout: 10000
            });
            return true;
        }
    } catch (error) {
        console.error('Failed to enhance test strategy:', error.message);
    }
    return false;
}

/**
 * Configure agent-specific models in TaskMaster
 */
function configureAgentModel(agentId) {
    const modelConfig = getAgentModelConfig(agentId);
    
    try {
        // Create agent-specific config
        const configPath = `.taskmaster/agents/models/${agentId}.json`;
        require('fs').mkdirSync(require('path').dirname(configPath), { recursive: true });
        require('fs').writeFileSync(configPath, JSON.stringify({
            models: {
                main: modelConfig
            }
        }, null, 2));
        
        return modelConfig;
    } catch (error) {
        console.error('Failed to configure agent model:', error.message);
        return null;
    }
}

/**
 * Minimal orchestrator improvements
 * Add this to orchestrator-agent.js after line 90:
 * 
 * const { analyzeTaskForAgentAI, enhanceTaskTestStrategy } = require('../../.taskmaster/agents/orchestrator-enhancements.js');
 * 
 * Then in analyzeTaskForAgent method, add at the beginning:
 * 
 * // Try AI-powered analysis first
 * const aiAnalysis = await analyzeTaskForAgentAI(task, Object.keys(AGENT_ROUTING));
 * if (aiAnalysis && aiAnalysis.recommendedAgent) {
 *     return aiAnalysis;
 * }
 * // Continue with existing keyword logic...
 */

module.exports = {
    analyzeTaskForAgentAI,
    enhanceTaskTestStrategy,
    configureAgentModel
};