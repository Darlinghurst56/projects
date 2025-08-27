#!/usr/bin/env node

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api/agents/register';

const AGENTS = [
  {
    agentId: 'orchestrator-agent',
    role: 'orchestrator-agent',
  },
  {
    agentId: 'frontend-agent',
    role: 'frontend-agent',
  },
  {
    agentId: 'backend-agent',
    role: 'backend-agent',
  },
  {
    agentId: 'devops-agent',
    role: 'devops-agent',
  },
  {
    agentId: 'qa-specialist',
    role: 'qa-specialist',
  },
];

async function registerAgent(agent) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Registered: ${agent.agentId}`);
    } else {
      console.error(`❌ Failed: ${agent.agentId} - ${data.error || data.message}`);
    }
  } catch (err) {
    console.error(`❌ Error registering ${agent.agentId}:`, err.message);
  }
}

(async () => {
  for (const agent of AGENTS) {
    await registerAgent(agent);
  }
})(); 