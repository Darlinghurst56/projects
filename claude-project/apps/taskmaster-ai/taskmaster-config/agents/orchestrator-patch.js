// Minimal patch for orchestrator-agent.js
// Add these lines after line 90 in the original file:

// Import enhancements (add at top of file after other requires)
const { analyzeTaskForAgentAI, enhanceTaskTestStrategy } = require('../../.taskmaster/agents/orchestrator-enhancements.js');

// Modified analyzeTaskForAgent method (replace lines 92-137)
async analyzeTaskForAgent(task) {
    // Try AI-powered analysis first (new)
    const aiAnalysis = await analyzeTaskForAgentAI(task, Object.keys(AGENT_ROUTING));
    if (aiAnalysis && aiAnalysis.recommendedAgent) {
        // Enhance test strategy if needed (new)
        if (task.testStrategy) {
            enhanceTaskTestStrategy(task.id, task.testStrategy, task.title + ' ' + task.description);
        }
        return aiAnalysis;
    }
    
    // Fallback to original keyword matching
    const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
    const scores = {};

    // (rest of original method continues unchanged...)
}