/**
 * Simple Agent Assignment for Home Dashboard MVP
 * Assigns tasks to agents based on keyword matching and exclusive capabilities
 */

const agentRoles = require('./agent-roles.json');

class SimpleAgentAssigner {
  constructor() {
    this.agents = agentRoles.agents;
    this.priorityOrder = [
      'server-agent',
      'devops-agent', 
      'integration-specialist',
      'frontend-architect',
      'ui-developer',
      'qa-specialist'
    ];
  }

  /**
   * Assign an agent to a task based on exclusive capabilities and keywords
   * @param {Object} task - Task object with title and description
   * @returns {string} - Agent ID
   */
  assignAgent(task) {
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    
    // STEP 1: Check for exclusive capabilities first
    const exclusiveMatch = this.checkExclusiveCapabilities(task, taskText);
    if (exclusiveMatch) {
      return exclusiveMatch;
    }
    
    // STEP 2: Regular keyword matching with priority handling
    let matches = [];

    for (const [agentId, agent] of Object.entries(this.agents)) {
      let score = 0;
      
      for (const keyword of agent.keywords) {
        if (taskText.includes(keyword)) {
          score += 1;
        }
      }

      // Bonus for tool alignment
      if (agent.tools) {
        for (const tool of agent.tools) {
          if (taskText.includes(tool.replace('mcp__', '').replace('__*', ''))) {
            score += 2;
          }
        }
      }

      if (score > 0) {
        matches.push({ agent: agentId, score });
      }
    }

    // STEP 3: Handle multiple matches with priority
    if (matches.length > 1) {
      return this.resolvePriorityConflict(matches);
    } else if (matches.length === 1) {
      return matches[0].agent;
    }

    // Default fallback
    return 'ui-developer';
  }

  /**
   * Check for exclusive capabilities that override regular assignment
   * @param {Object} task - Task object
   * @param {string} taskText - Lowercase task text
   * @returns {string|null} - Agent ID if exclusive match found
   */
  checkExclusiveCapabilities(task, taskText) {
    for (const [agentId, agent] of Object.entries(this.agents)) {
      if (agent.exclusive) {
        // Check if task matches exclusive agent's domain
        const hasKeywordMatch = agent.keywords.some(keyword => 
          taskText.includes(keyword)
        );
        
        if (hasKeywordMatch) {
          console.log(`🔒 Exclusive assignment: ${agentId} (${agent.name})`);
          return agentId;
        }
      }
    }
    return null;
  }

  /**
   * Resolve conflicts when multiple agents match using priority order
   * @param {Array} matches - Array of {agent, score} objects
   * @returns {string} - Selected agent ID
   */
  resolvePriorityConflict(matches) {
    // Sort matches by score first, then by priority
    matches.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score wins
      }
      
      // If scores are equal, use priority order
      const aPriority = this.priorityOrder.indexOf(a.agent);
      const bPriority = this.priorityOrder.indexOf(b.agent);
      
      // Lower index = higher priority
      return aPriority - bPriority;
    });

    const winner = matches[0];
    console.log(`⚖️  Priority resolution: ${winner.agent} (score: ${winner.score})`);
    return winner.agent;
  }

  /**
   * Get agent info by ID
   * @param {string} agentId 
   * @returns {Object} Agent details
   */
  getAgent(agentId) {
    return this.agents[agentId] || null;
  }
}

// Simple CLI usage
if (require.main === module) {
  const assigner = new SimpleAgentAssigner();
  
  // Example tasks
  const examples = [
    { title: "Fix DNS widget styling", description: "The DNS status widget needs CSS fixes" },
    { title: "Connect weather API", description: "Integrate backend service for weather data" },
    { title: "Test dashboard login", description: "Validate PIN authentication works correctly" }
  ];

  console.log("Agent Assignment Examples:\n");
  examples.forEach(task => {
    const agent = assigner.assignAgent(task);
    console.log(`Task: "${task.title}"`);
    console.log(`Assigned to: ${assigner.getAgent(agent).name}\n`);
  });
}

module.exports = SimpleAgentAssigner;