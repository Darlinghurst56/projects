/**
 * Integration Tests for Multi-Agent Coordination
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { testUtils } from '../setup.js';

describe('Agent Coordination Integration', () => {
  let testProjectRoot;
  let taskmaster;

  beforeEach(async () => {
    // Create temporary test project
    testProjectRoot = await testUtils.createTempFile('test-project-' + Date.now(), '');
    await fs.mkdir(testProjectRoot, { recursive: true });
    
    // Initialize TaskMaster in test project
    taskmaster = {
      exec: (command) => {
        return new Promise((resolve, reject) => {
          const child = spawn('task-master', command.split(' '), {
            cwd: testProjectRoot,
            stdio: 'pipe'
          });
          
          let stdout = '';
          let stderr = '';
          
          child.stdout.on('data', (data) => {
            stdout += data.toString();
          });
          
          child.stderr.on('data', (data) => {
            stderr += data.toString();
          });
          
          child.on('close', (code) => {
            if (code === 0) {
              resolve({ stdout, stderr });
            } else {
              reject(new Error(`Command failed: ${stderr}`));
            }
          });
        });
      }
    };
  });

  afterEach(async () => {
    // Cleanup test project
    if (testProjectRoot) {
      await fs.rmdir(testProjectRoot, { recursive: true, force: true });
    }
  });

  describe('Agent Registration and Role Management', () => {
    it('should register multiple agents with different roles', async () => {
      // Register frontend agent
      const frontendResult = await taskmaster.exec('use-tag frontend-agent');
      expect(frontendResult.stdout).toContain('frontend-agent');
      
      // Register backend agent
      const backendResult = await taskmaster.exec('use-tag backend-agent');
      expect(backendResult.stdout).toContain('backend-agent');
      
      // List available tags/roles
      const tagsResult = await taskmaster.exec('tags');
      expect(tagsResult.stdout).toContain('frontend-agent');
      expect(tagsResult.stdout).toContain('backend-agent');
    });

    it('should prevent role conflicts', async () => {
      // Try to register same agent with different role
      await taskmaster.exec('use-tag frontend-agent');
      
      // Should handle gracefully when switching roles
      const result = await taskmaster.exec('use-tag backend-agent');
      expect(result.stdout).not.toContain('error');
    });
  });

  describe('Task Assignment and Handoff', () => {
    beforeEach(async () => {
      // Setup test tasks
      await taskmaster.exec('add-task --prompt="Create login form" --research');
      await taskmaster.exec('add-task --prompt="Implement auth API" --research');
    });

    it('should assign tasks to appropriate agents', async () => {
      // Frontend agent claims UI task
      await taskmaster.exec('use-tag frontend-agent');
      const tasks = await taskmaster.exec('list --status=pending');
      
      const taskData = JSON.parse(tasks.stdout);
      const uiTask = taskData.find(t => t.title.includes('login form'));
      
      if (uiTask) {
        await taskmaster.exec(`set-status --id=${uiTask.id} --status=in-progress`);
        
        const updatedTask = await taskmaster.exec(`show ${uiTask.id}`);
        expect(JSON.parse(updatedTask.stdout).status).toBe('in-progress');
      }
    });

    it('should handle task handoff between agents', async () => {
      // Frontend agent starts task
      await taskmaster.exec('use-tag frontend-agent');
      const task = await taskmaster.exec('add-task --prompt="UI component needing backend API"');
      const taskId = JSON.parse(task.stdout).id;
      
      await taskmaster.exec(`set-status --id=${taskId} --status=in-progress`);
      
      // Add handoff note
      await taskmaster.exec(`update-task --id=${taskId} --prompt="AGENT: frontend-agent - UI complete, needs backend API integration"`);
      
      // Backend agent accepts handoff
      await taskmaster.exec('use-tag backend-agent');
      await taskmaster.exec(`update-task --id=${taskId} --prompt="AGENT: backend-agent - Taking over for API implementation"`);
      
      // Verify handoff was recorded
      const updatedTask = await taskmaster.exec(`show ${taskId}`);
      const taskData = JSON.parse(updatedTask.stdout);
      
      expect(taskData.details || taskData.description).toContain('frontend-agent');
      expect(taskData.details || taskData.description).toContain('backend-agent');
    });
  });

  describe('Cross-Agent Communication', () => {
    it('should share context between agents via tasks', async () => {
      // Frontend agent documents requirements
      await taskmaster.exec('use-tag frontend-agent');
      const task = await taskmaster.exec('add-task --prompt="Dashboard widget with real-time data"');
      const taskId = JSON.parse(task.stdout).id;
      
      await taskmaster.exec(`update-task --id=${taskId} --prompt="AGENT: frontend-agent - Widget requires WebSocket connection on /ws/dashboard endpoint"`);
      
      // Backend agent reads requirements and responds
      await taskmaster.exec('use-tag backend-agent');
      await taskmaster.exec(`update-task --id=${taskId} --prompt="AGENT: backend-agent - WebSocket endpoint implemented, emits 'dashboard-update' events every 30s"`);
      
      // DevOps agent adds deployment notes
      await taskmaster.exec('use-tag devops-agent');
      await taskmaster.exec(`update-task --id=${taskId} --prompt="AGENT: devops-agent - WebSocket configured in nginx proxy, load balancer sticky sessions enabled"`);
      
      // Verify all agents contributed
      const finalTask = await taskmaster.exec(`show ${taskId}`);
      const taskData = JSON.parse(finalTask.stdout);
      const details = taskData.details || taskData.description || '';
      
      expect(details).toContain('frontend-agent');
      expect(details).toContain('backend-agent');
      expect(details).toContain('devops-agent');
      expect(details).toContain('WebSocket');
    });
  });

  describe('Dependency Management', () => {
    it('should respect task dependencies across agents', async () => {
      // Backend agent creates API task
      await taskmaster.exec('use-tag backend-agent');
      const apiTask = await taskmaster.exec('add-task --prompt="User authentication API"');
      const apiTaskId = JSON.parse(apiTask.stdout).id;
      
      // Frontend agent creates UI task that depends on API
      await taskmaster.exec('use-tag frontend-agent');
      const uiTask = await taskmaster.exec('add-task --prompt="Login form component"');
      const uiTaskId = JSON.parse(uiTask.stdout).id;
      
      // Add dependency
      await taskmaster.exec(`add-dependency --id=${uiTaskId} --depends-on=${apiTaskId}`);
      
      // Verify dependency is respected
      const nextTask = await taskmaster.exec('next');
      const nextTaskData = JSON.parse(nextTask.stdout);
      
      // Should get API task first since UI depends on it
      expect(nextTaskData.id).toBe(apiTaskId);
      
      // Complete API task
      await taskmaster.exec('use-tag backend-agent');
      await taskmaster.exec(`set-status --id=${apiTaskId} --status=done`);
      
      // Now UI task should be available
      const nextTaskAfter = await taskmaster.exec('next');
      const nextTaskAfterData = JSON.parse(nextTaskAfter.stdout);
      
      expect(nextTaskAfterData.id).toBe(uiTaskId);
    });
  });

  describe('Git Synchronization', () => {
    beforeEach(async () => {
      // Initialize git in test project
      await taskmaster.exec('git init');
      await taskmaster.exec('git config user.email "test@example.com"');
      await taskmaster.exec('git config user.name "Test User"');
    });

    it('should handle concurrent git operations', async () => {
      // Multiple agents working simultaneously
      const operations = [
        async () => {
          await taskmaster.exec('use-tag frontend-agent');
          await taskmaster.exec('add-task --prompt="Frontend task 1"');
          return 'frontend-complete';
        },
        async () => {
          await taskmaster.exec('use-tag backend-agent');
          await taskmaster.exec('add-task --prompt="Backend task 1"');
          return 'backend-complete';
        },
        async () => {
          await taskmaster.exec('use-tag devops-agent');
          await taskmaster.exec('add-task --prompt="DevOps task 1"');
          return 'devops-complete';
        }
      ];
      
      // Run operations concurrently
      const results = await Promise.all(operations.map(op => op()));
      
      expect(results).toContain('frontend-complete');
      expect(results).toContain('backend-complete');
      expect(results).toContain('devops-complete');
      
      // Verify all tasks were created
      const allTasks = await taskmaster.exec('list');
      const tasksData = JSON.parse(allTasks.stdout);
      
      expect(tasksData.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from agent failures', async () => {
      // Simulate agent failure during task execution
      await taskmaster.exec('use-tag frontend-agent');
      const task = await taskmaster.exec('add-task --prompt="Task that will fail"');
      const taskId = JSON.parse(task.stdout).id;
      
      await taskmaster.exec(`set-status --id=${taskId} --status=in-progress`);
      
      // Simulate failure note
      await taskmaster.exec(`update-task --id=${taskId} --prompt="AGENT: frontend-agent - ERROR: Encountered blocking issue, need assistance"`);
      
      // Another agent can take over
      await taskmaster.exec('use-tag backend-agent');
      await taskmaster.exec(`update-task --id=${taskId} --prompt="AGENT: backend-agent - Taking over failed task, investigating issue"`);
      
      // Verify task is still trackable
      const recoveredTask = await taskmaster.exec(`show ${taskId}`);
      const taskData = JSON.parse(recoveredTask.stdout);
      
      expect(taskData.status).toBe('in-progress');
      expect(taskData.details || taskData.description).toContain('ERROR');
      expect(taskData.details || taskData.description).toContain('Taking over');
    });
  });
});