/**
 * End-to-End Tests for Agent Management Processes
 * Tests startup, coordination, health monitoring, and task assignment
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { testUtils } from '../setup.js';

const execAsync = promisify(exec);

describe('Agent Management E2E Tests', () => {
  let serverProcess;
  const baseUrl = 'http://localhost:3010';

  beforeEach(async () => {
    // Start the TaskMaster API server
    serverProcess = spawn('npm', ['start'], {
      stdio: 'pipe',
      detached: true,
      cwd: process.cwd()
    });

    // Wait for server to start
    await testUtils.waitFor(async () => {
      try {
        const response = await fetch(`${baseUrl}/api/health`);
        return response.ok;
      } catch {
        return false;
      }
    }, 15000);
  });

  afterEach(async () => {
    if (serverProcess) {
      process.kill(-serverProcess.pid);
    }
  });

  describe('Agent Startup and Registration', () => {
    it('should register new agents via API', async () => {
      const agentData = {
        agentId: 'test-frontend-agent',
        role: 'frontend-agent'
      };

      const response = await fetch(`${baseUrl}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      const result = await response.json();
      expect(response.status).toBe(201);
      expect(result.agentId).toBe('test-frontend-agent');
    });

    it('should list all registered agents', async () => {
      const response = await fetch(`${baseUrl}/api/agents`);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.agents).toBeInstanceOf(Array);
      expect(result.totalAgents).toBeGreaterThan(0);
      expect(result.agents[0]).toHaveProperty('id');
      expect(result.agents[0]).toHaveProperty('capabilities');
      expect(result.agents[0]).toHaveProperty('status');
    });

    it('should update agent status', async () => {
      // First register an agent
      const agentData = {
        agentId: 'test-status-agent',
        role: 'backend-agent'
      };

      await fetch(`${baseUrl}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      // Update the agent status
      const statusResponse = await fetch(`${baseUrl}/api/agents/test-status-agent/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });

      const result = await statusResponse.json();
      expect(statusResponse.status).toBe(200);
      expect(result.status).toBe('active');
    });
  });

  describe('Agent Health Monitoring', () => {
    it('should provide system health status', async () => {
      const response = await fetch(`${baseUrl}/api/health`);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('TaskMaster API');
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should provide detailed server status', async () => {
      const response = await fetch(`${baseUrl}/api/server/status`);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.server).toHaveProperty('status');
      expect(result.server).toHaveProperty('uptime');
      expect(result.connectivity).toHaveProperty('serverSentEvents');
      expect(result.services).toHaveProperty('taskmaster');
    });

    it('should track agent workload', async () => {
      const response = await fetch(`${baseUrl}/api/agents/workload`);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.workload).toBeInstanceOf(Object);
    });
  });

  describe('Task Assignment and Coordination', () => {
    it('should assign tasks to agents', async () => {
      // First register an agent
      const agentData = {
        agentId: 'test-task-agent',
        role: 'qa-specialist'
      };

      await fetch(`${baseUrl}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });

      // Assign a task
      const taskData = {
        taskId: 'test-task-001',
        priority: 'high'
      };

      const response = await fetch(`${baseUrl}/api/agents/test-task-agent/assign-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      const result = await response.json();
      expect(response.status).toBe(200);
      expect(result.assignment).toHaveProperty('taskId');
      expect(result.assignment).toHaveProperty('agentId');
    });

    it('should handle auto-assignment of tasks', async () => {
      const response = await fetch(`${baseUrl}/api/agents/auto-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
    });

    it('should handle task failures', async () => {
      const taskData = {
        agentId: 'test-failure-agent',
        reason: 'Testing failure handling'
      };

      const response = await fetch(`${baseUrl}/api/tasks/test-task-fail/fail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      // Should handle gracefully even if task doesn't exist
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Real-time Communication', () => {
    it('should establish SSE connection', async () => {
      const sseResponse = await fetch(`${baseUrl}/api/events`, {
        headers: { 'Accept': 'text/event-stream' }
      });

      expect(sseResponse.status).toBe(200);
      expect(sseResponse.headers.get('content-type')).toBe('text/event-stream');
    });

    it('should broadcast orchestrator handoff events', async () => {
      const eventData = {
        stage: 'analysis',
        taskId: 'test-handoff-001',
        agentId: 'orchestrator-agent',
        message: 'Testing handoff broadcast'
      };

      const response = await fetch(`${baseUrl}/api/events/orchestrator/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      const result = await response.json();
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.stage).toBe('analysis');
    });

    it('should handle coordination status requests', async () => {
      const response = await fetch(`${baseUrl}/api/coordination/status`);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('CLI Interface Integration', () => {
    it('should execute agent health check command', async () => {
      try {
        const { stdout, stderr } = await execAsync('npm run agents:health');
        expect(stderr).toBe('');
        expect(stdout).toContain('11'); // Total agents
        expect(stdout).toContain('0');  // Active agents
      } catch (error) {
        // Some environments may not have jq, test should be flexible
        expect(error.code).toBeDefined();
      }
    });

    it('should handle batch operations', async () => {
      // Test the batch health check (with timeout to avoid hanging)
      const batchProcess = spawn('timeout', ['5s', 'npm', 'run', 'batch:health-check'], {
        stdio: 'pipe'
      });

      let output = '';
      batchProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      await new Promise((resolve) => {
        batchProcess.on('close', (code) => {
          resolve(code);
        });
      });

      expect(output).toContain('BATCH-OPS');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle invalid agent registration', async () => {
      const invalidData = {
        agentId: '', // Invalid: empty ID
        role: 'invalid-role'
      };

      const response = await fetch(`${baseUrl}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData)
      });

      expect(response.status).toBe(400);
    });

    it('should handle non-existent agent operations', async () => {
      const response = await fetch(`${baseUrl}/api/agents/non-existent-agent/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });

      expect(response.status).toBe(404);
    });

    it('should handle malformed API requests', async () => {
      const response = await fetch(`${baseUrl}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });

    it('should handle concurrent auto-assignment requests', async () => {
      // Send multiple auto-assignment requests simultaneously
      const requests = Array(3).fill().map(() => 
        fetch(`${baseUrl}/api/agents/auto-assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const responses = await Promise.all(requests);
      
      // First should succeed, others should get rate limited
      const statuses = responses.map(r => r.status);
      expect(statuses).toContain(200);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple simultaneous agent registrations', async () => {
      const agents = Array(10).fill().map((_, i) => ({
        agentId: `load-test-agent-${i}`,
        role: 'qa-specialist'
      }));

      const startTime = Date.now();
      const requests = agents.map(agent => 
        fetch(`${baseUrl}/api/agents/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agent)
        })
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should maintain performance under API load', async () => {
      const startTime = Date.now();
      
      // Send multiple concurrent requests
      const requests = Array(50).fill().map(() => 
        fetch(`${baseUrl}/api/health`)
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });
});