#!/usr/bin/env node

/**
 * Agent Cleanup Script
 * 
 * Purpose: Delete test agents and repair agents where name matches agent type
 * - Removes test agents (qa-agent-test, test-001, e2e-test-agent, perf-test-*, etc.)
 * - Fixes agent capabilities to match canonical agent types
 * - Ensures consistent naming and capabilities
 */

const fs = require('fs');
const path = require('path');

// Canonical agent types from agent-roles.json
const CANONICAL_AGENT_TYPES = {
    'orchestrator-agent': 'orchestrator-agent',
    'frontend-agent': 'frontend-agent',
    'backend-agent': 'backend-agent', 
    'devops-agent': 'devops-agent',
    'qa-specialist': 'qa-specialist'
};

// Test agent patterns to remove
const TEST_AGENT_PATTERNS = [
    /^qa-agent-test$/,
    /^test-\d+$/,
    /^e2e-test-agent$/,
    /^perf-test-\d+$/,
    /^.*-test$/,
    /^test-.*$/
];

// Agent ID patterns that should be canonicalized
const AGENT_ID_PATTERNS = [
    { pattern: /^qa-agent-active$/, canonicalType: 'qa-specialist' },
    { pattern: /^qa-specialist-001$/, canonicalType: 'qa-specialist' },
    { pattern: /^backend-agent-001$/, canonicalType: 'backend-agent' },
    { pattern: /^frontend-agent-001$/, canonicalType: 'frontend-agent' },
    { pattern: /^devops-agent-001$/, canonicalType: 'devops-agent' }
];

class AgentCleanup {
    constructor() {
        this.agentsPath = path.join(__dirname, '..', '.taskmaster', 'agents', 'agents.json');
        this.backupPath = path.join(__dirname, '..', '.taskmaster', 'agents', 'agents.json.backup');
    }

    async run() {
        console.log('🧹 Starting Agent Cleanup...\n');

        try {
            // Load current agents
            const agents = this.loadAgents();
            console.log(`📊 Found ${agents.length} agents initially`);

            // Create backup
            this.createBackup(agents);
            console.log('💾 Created backup of current agents');

            // Clean up agents
            const cleanedAgents = this.cleanupAgents(agents);
            console.log(`✅ Cleaned up to ${cleanedAgents.length} agents`);

            // Save cleaned agents
            this.saveAgents(cleanedAgents);
            console.log('💾 Saved cleaned agents');

            // Display results
            this.displayResults(agents, cleanedAgents);

        } catch (error) {
            console.error('❌ Error during cleanup:', error.message);
            process.exit(1);
        }
    }

    loadAgents() {
        if (!fs.existsSync(this.agentsPath)) {
            throw new Error('Agents file not found');
        }
        const data = fs.readFileSync(this.agentsPath, 'utf8');
        return JSON.parse(data);
    }

    createBackup(agents) {
        fs.writeFileSync(this.backupPath, JSON.stringify(agents, null, 2));
    }

    cleanupAgents(agents) {
        const cleaned = [];
        const removed = [];
        const repaired = [];

        for (const agent of agents) {
            // Check if this is a test agent to remove
            if (this.isTestAgent(agent.id)) {
                removed.push(agent);
                continue;
            }

            // Check if agent needs repair (name matches agent type)
            const repairedAgent = this.repairAgent(agent);
            if (repairedAgent !== agent) {
                repaired.push({ original: agent, repaired: repairedAgent });
                cleaned.push(repairedAgent);
            } else {
                cleaned.push(agent);
            }
        }

        this.removedAgents = removed;
        this.repairedAgents = repaired;
        return cleaned;
    }

    isTestAgent(agentId) {
        return TEST_AGENT_PATTERNS.some(pattern => pattern.test(agentId));
    }

    repairAgent(agent) {
        // Check if agent ID matches any canonical agent type
        const canonicalType = CANONICAL_AGENT_TYPES[agent.id];
        if (canonicalType) {
            // Agent ID matches canonical type, ensure capabilities are correct
            if (JSON.stringify(agent.capabilities) !== JSON.stringify([canonicalType])) {
                return {
                    ...agent,
                    capabilities: [canonicalType],
                    lastUpdated: new Date().toISOString()
                };
            }
        }

        // Check if agent ID should be canonicalized
        for (const { pattern, canonicalType } of AGENT_ID_PATTERNS) {
            if (pattern.test(agent.id)) {
                return {
                    ...agent,
                    id: canonicalType,
                    capabilities: [canonicalType],
                    lastUpdated: new Date().toISOString()
                };
            }
        }

        return agent;
    }

    saveAgents(agents) {
        fs.writeFileSync(this.agentsPath, JSON.stringify(agents, null, 2));
    }

    displayResults(originalAgents, cleanedAgents) {
        console.log('\n📋 Cleanup Results:');
        console.log('==================');

        // Removed agents
        if (this.removedAgents.length > 0) {
            console.log(`\n🗑️  Removed ${this.removedAgents.length} test agents:`);
            this.removedAgents.forEach(agent => {
                console.log(`   - ${agent.id} (${Array.isArray(agent.capabilities) ? agent.capabilities.join(', ') : agent.capabilities})`);
            });
        }

        // Repaired agents
        if (this.repairedAgents.length > 0) {
            console.log(`\n🔧 Repaired ${this.repairedAgents.length} agents:`);
            this.repairedAgents.forEach(({ original, repaired }) => {
                console.log(`   - ${original.id} → ${repaired.id}`);
                console.log(`     Capabilities: [${Array.isArray(original.capabilities) ? original.capabilities.join(', ') : original.capabilities}] → [${repaired.capabilities.join(', ')}]`);
            });
        }

        // Final agent count
        console.log(`\n📊 Final Results:`);
        console.log(`   - Original agents: ${originalAgents.length}`);
        console.log(`   - Cleaned agents: ${cleanedAgents.length}`);
        console.log(`   - Removed: ${this.removedAgents.length}`);
        console.log(`   - Repaired: ${this.repairedAgents.length}`);

        // Show final agent list
        console.log(`\n🎯 Final Agent List:`);
        cleanedAgents.forEach(agent => {
            console.log(`   - ${agent.id} (${agent.capabilities.join(', ')})`);
        });

        console.log('\n✅ Agent cleanup completed successfully!');
    }
}

// Run the cleanup
if (require.main === module) {
    const cleanup = new AgentCleanup();
    cleanup.run().catch(console.error);
}

module.exports = AgentCleanup; 