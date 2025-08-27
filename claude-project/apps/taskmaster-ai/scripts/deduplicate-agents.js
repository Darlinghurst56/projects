#!/usr/bin/env node

/**
 * Agent Deduplication Script
 * 
 * Purpose: Remove duplicate agents with the same ID, keeping the most recent one
 * - Identifies agents with duplicate IDs
 * - Keeps the agent with the most recent lastUpdated timestamp
 * - Removes older duplicates
 */

const fs = require('fs');
const path = require('path');

class AgentDeduplication {
    constructor() {
        this.agentsPath = path.join(__dirname, '..', '.taskmaster', 'agents', 'agents.json');
        this.backupPath = path.join(__dirname, '..', '.taskmaster', 'agents', 'agents.json.backup');
    }

    async run() {
        console.log('🔍 Starting Agent Deduplication...\n');

        try {
            // Load current agents
            const agents = this.loadAgents();
            console.log(`📊 Found ${agents.length} agents initially`);

            // Create backup
            this.createBackup(agents);
            console.log('💾 Created backup of current agents');

            // Deduplicate agents
            const deduplicatedAgents = this.deduplicateAgents(agents);
            console.log(`✅ Deduplicated to ${deduplicatedAgents.length} agents`);

            // Save deduplicated agents
            this.saveAgents(deduplicatedAgents);
            console.log('💾 Saved deduplicated agents');

            // Display results
            this.displayResults(agents, deduplicatedAgents);

        } catch (error) {
            console.error('❌ Error during deduplication:', error.message);
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

    deduplicateAgents(agents) {
        const agentGroups = {};
        const removed = [];

        // Group agents by ID
        for (const agent of agents) {
            if (!agentGroups[agent.id]) {
                agentGroups[agent.id] = [];
            }
            agentGroups[agent.id].push(agent);
        }

        // For each group, keep the most recent agent
        const deduplicated = [];
        for (const [agentId, group] of Object.entries(agentGroups)) {
            if (group.length === 1) {
                // No duplicates, keep as is
                deduplicated.push(group[0]);
            } else {
                // Has duplicates, keep the most recent one
                const sortedGroup = group.sort((a, b) => {
                    const dateA = new Date(a.lastUpdated);
                    const dateB = new Date(b.lastUpdated);
                    return dateB - dateA; // Most recent first
                });

                const keptAgent = sortedGroup[0];
                const removedAgents = sortedGroup.slice(1);
                
                deduplicated.push(keptAgent);
                removed.push(...removedAgents);

                console.log(`   - ${agentId}: Kept agent from ${keptAgent.lastUpdated}, removed ${removedAgents.length} duplicates`);
            }
        }

        this.removedAgents = removed;
        return deduplicated;
    }

    saveAgents(agents) {
        fs.writeFileSync(this.agentsPath, JSON.stringify(agents, null, 2));
    }

    displayResults(originalAgents, deduplicatedAgents) {
        console.log('\n📋 Deduplication Results:');
        console.log('========================');

        // Removed agents
        if (this.removedAgents.length > 0) {
            console.log(`\n🗑️  Removed ${this.removedAgents.length} duplicate agents:`);
            this.removedAgents.forEach(agent => {
                console.log(`   - ${agent.id} (registered: ${agent.registeredAt}, last updated: ${agent.lastUpdated})`);
            });
        }

        // Final agent count
        console.log(`\n📊 Final Results:`);
        console.log(`   - Original agents: ${originalAgents.length}`);
        console.log(`   - Deduplicated agents: ${deduplicatedAgents.length}`);
        console.log(`   - Removed duplicates: ${this.removedAgents.length}`);

        // Show final agent list
        console.log(`\n🎯 Final Agent List:`);
        deduplicatedAgents.forEach(agent => {
            console.log(`   - ${agent.id} (${agent.capabilities.join(', ')}) - Last updated: ${agent.lastUpdated}`);
        });

        console.log('\n✅ Agent deduplication completed successfully!');
    }
}

// Run the deduplication
if (require.main === module) {
    const deduplication = new AgentDeduplication();
    deduplication.run().catch(console.error);
}

module.exports = AgentDeduplication; 