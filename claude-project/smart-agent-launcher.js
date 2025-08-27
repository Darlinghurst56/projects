#!/usr/bin/env node

/**
 * Smart Agent Launcher
 * Launches agents with intelligent timeout based on activity monitoring
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const LIVE_AGENTS_FILE = '.taskmaster/agents/live-agents.json';
const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes of inactivity
const HEARTBEAT_CHECK_INTERVAL = 30000; // Check every 30 seconds

class SmartAgentLauncher {
    constructor() {
        this.runningAgents = new Map();
        this.lastActivity = new Map();
        this.monitoringInterval = null;
    }

    async launchAgent(agentFile, agentId = null) {
        const agentPath = path.resolve(agentFile);
        
        // Extract agent ID from filename if not provided
        if (!agentId) {
            if (agentFile.includes('family-dashboard-qa')) {
                agentId = 'family-dashboard-qa-001';
            } else if (agentFile.includes('background-ux')) {
                agentId = 'ux-specialist-background-001';
            } else if (agentFile.includes('background-integration')) {
                agentId = 'integration-specialist-background-001';
            }
        }

        console.log(`🚀 Launching agent: ${agentFile} (ID: ${agentId})`);

        // Spawn the agent process
        const agent = spawn('node', [agentPath], {
            stdio: 'inherit',
            detached: false
        });

        // Track the agent
        this.runningAgents.set(agentId, {
            process: agent,
            file: agentFile,
            startTime: Date.now(),
            lastActivity: Date.now()
        });

        // Update last activity
        this.lastActivity.set(agentId, Date.now());

        // Handle agent exit
        agent.on('exit', (code) => {
            console.log(`📊 Agent ${agentId} exited with code ${code}`);
            this.runningAgents.delete(agentId);
            this.lastActivity.delete(agentId);
        });

        agent.on('error', (error) => {
            console.error(`❌ Agent ${agentId} error:`, error);
            this.runningAgents.delete(agentId);
            this.lastActivity.delete(agentId);
        });

        // Start monitoring if not already running
        if (!this.monitoringInterval) {
            this.startMonitoring();
        }

        return agentId;
    }

    async startMonitoring() {
        console.log('🔍 Starting intelligent agent monitoring...');
        
        this.monitoringInterval = setInterval(async () => {
            await this.checkAgentActivity();
        }, HEARTBEAT_CHECK_INTERVAL);

        // Handle process shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    async checkAgentActivity() {
        try {
            // Read live agents file to check for activity
            const liveAgentsData = await this.readLiveAgents();
            const currentTime = Date.now();

            for (const [agentId, agentInfo] of this.runningAgents) {
                const liveAgent = liveAgentsData.agents[agentId];
                
                if (liveAgent) {
                    // Check if agent had recent heartbeat
                    const lastHeartbeat = new Date(liveAgent.lastHeartbeat).getTime();
                    const timeSinceHeartbeat = currentTime - lastHeartbeat;
                    
                    // Update last activity if recent heartbeat
                    if (timeSinceHeartbeat < HEARTBEAT_CHECK_INTERVAL * 2) {
                        this.lastActivity.set(agentId, currentTime);
                        console.log(`💓 Agent ${agentId} active (heartbeat ${Math.round(timeSinceHeartbeat/1000)}s ago)`);
                    }

                    // Check if agent is working on a task
                    if (liveAgent.status === 'working' || liveAgent.currentTask) {
                        this.lastActivity.set(agentId, currentTime);
                        console.log(`🔧 Agent ${agentId} working on task ${liveAgent.currentTask}`);
                    }
                }

                // Check for inactivity timeout
                const lastActivity = this.lastActivity.get(agentId);
                const inactivityTime = currentTime - lastActivity;

                if (inactivityTime > INACTIVITY_TIMEOUT) {
                    console.log(`⏰ Agent ${agentId} inactive for ${Math.round(inactivityTime/1000)}s, shutting down...`);
                    this.terminateAgent(agentId);
                } else {
                    const remainingTime = Math.round((INACTIVITY_TIMEOUT - inactivityTime) / 1000);
                    console.log(`📊 Agent ${agentId} active, ${remainingTime}s until timeout`);
                }
            }

            // Stop monitoring if no agents running
            if (this.runningAgents.size === 0) {
                console.log('📊 No agents running, stopping monitoring');
                this.stopMonitoring();
            }

        } catch (error) {
            console.error('❌ Error checking agent activity:', error);
        }
    }

    async readLiveAgents() {
        try {
            const data = await fs.readFile(LIVE_AGENTS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return { agents: {} };
        }
    }

    terminateAgent(agentId) {
        const agentInfo = this.runningAgents.get(agentId);
        if (agentInfo) {
            console.log(`🛑 Terminating agent ${agentId}`);
            agentInfo.process.kill('SIGTERM');
            this.runningAgents.delete(agentId);
            this.lastActivity.delete(agentId);
        }
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    shutdown() {
        console.log('🛑 Shutting down agent launcher...');
        
        // Terminate all running agents
        for (const [agentId, agentInfo] of this.runningAgents) {
            console.log(`🛑 Terminating agent ${agentId}`);
            agentInfo.process.kill('SIGTERM');
        }

        this.stopMonitoring();
        process.exit(0);
    }

    async getStatus() {
        const liveAgentsData = await this.readLiveAgents();
        
        console.log('📊 Agent Status:');
        console.log(`Running: ${this.runningAgents.size}`);
        console.log(`Registered: ${Object.keys(liveAgentsData.agents).length}`);
        
        for (const [agentId, agentInfo] of this.runningAgents) {
            const runtime = Math.round((Date.now() - agentInfo.startTime) / 1000);
            const inactivity = Math.round((Date.now() - this.lastActivity.get(agentId)) / 1000);
            console.log(`  ${agentId}: Running ${runtime}s, inactive ${inactivity}s`);
        }
    }
}

// CLI Interface
const launcher = new SmartAgentLauncher();

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node smart-agent-launcher.js <command> [options]');
        console.log('Commands:');
        console.log('  launch <agent-file>  - Launch an agent with smart timeout');
        console.log('  status              - Show agent status');
        console.log('  quick               - Launch all 3 agents quickly');
        console.log('');
        console.log('Examples:');
        console.log('  node smart-agent-launcher.js launch family-dashboard-qa-agent.js');
        console.log('  node smart-agent-launcher.js launch background-ux-agent.js');
        console.log('  node smart-agent-launcher.js quick');
        return;
    }

    const command = args[0];

    switch (command) {
        case 'launch':
            if (args.length < 2) {
                console.error('❌ Please specify agent file to launch');
                return;
            }
            await launcher.launchAgent(args[1]);
            break;

        case 'status':
            await launcher.getStatus();
            break;

        case 'quick':
            console.log('🚀 Launching all 3 agents...');
            await launcher.launchAgent('family-dashboard-qa-agent.js');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await launcher.launchAgent('background-ux-agent.js');
            await new Promise(resolve => setTimeout(resolve, 1000));
            await launcher.launchAgent('background-integration-agent.js');
            break;

        default:
            console.error(`❌ Unknown command: ${command}`);
    }
}

main().catch(console.error);