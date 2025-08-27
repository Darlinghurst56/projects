/**
 * Unit Tests for TaskMaster API Integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskMasterAPI } from '../../../src/api/taskmaster-integration.js';
import { testUtils } from '../../setup.js';

describe('TaskMaster API Integration', () => {
  let taskmaster;
  let mockExec;

  beforeEach(() => {
    // Mock child_process exec
    mockExec = vi.fn();
    vi.mock('child_process', () => ({
      exec: mockExec
    }));

    taskmaster = new TaskMasterAPI('/test/project/root');
  });

  describe('Task Management', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high'
      };

      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('add-task')) {
          callback(null, { stdout: JSON.stringify({ id: '123', ...taskData }) });
        }
      });

      const result = await taskmaster.createTask(taskData);
      
      expect(result).toMatchObject({
        id: '123',
        ...taskData
      });
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('task-master add-task'),
        expect.any(Function)
      );
    });

    it('should handle task creation errors', async () => {
      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error('Command failed'), null);
      });

      await expect(taskmaster.createTask({})).rejects.toThrow('Command failed');
    });

    it('should get tasks with filters', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'pending' },
        { id: '2', title: 'Task 2', status: 'done' }
      ];

      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('get-tasks')) {
          callback(null, { stdout: JSON.stringify(mockTasks) });
        }
      });

      const result = await taskmaster.getTasks({ status: 'pending' });
      
      expect(result).toEqual(mockTasks);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('--status=pending'),
        expect.any(Function)
      );
    });

    it('should update task status', async () => {
      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('set-status')) {
          callback(null, { stdout: JSON.stringify({ success: true }) });
        }
      });

      const result = await taskmaster.setTaskStatus('123', 'done');
      
      expect(result.success).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('--id=123 --status=done'),
        expect.any(Function)
      );
    });
  });

  describe('Agent Coordination', () => {
    it('should register agent with role', async () => {
      mockExec.mockImplementation((cmd, callback) => {
        callback(null, { stdout: 'Agent registered successfully' });
      });

      const result = await taskmaster.registerAgent('agent-1', 'frontend-agent');
      
      expect(result).toBe('Agent registered successfully');
    });

    it('should handle task handoff between agents', async () => {
      mockExec.mockImplementation((cmd, callback) => {
        callback(null, { stdout: JSON.stringify({ handoffId: 'h123' }) });
      });

      const result = await taskmaster.handoffTask('123', 'frontend-agent', 'backend-agent');
      
      expect(result.handoffId).toBe('h123');
    });
  });

  describe('Configuration Management', () => {
    it('should validate project configuration', async () => {
      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('models')) {
          callback(null, { 
            stdout: JSON.stringify({
              main: 'claude-3-sonnet',
              research: 'claude-opus',
              fallback: 'gemini-2.0-flash'
            })
          });
        }
      });

      const config = await taskmaster.getConfiguration();
      
      expect(config.main).toBe('claude-3-sonnet');
      expect(config.research).toBe('claude-opus');
      expect(config.fallback).toBe('gemini-2.0-flash');
    });

    it('should handle configuration errors gracefully', async () => {
      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error('Config not found'), null);
      });

      await expect(taskmaster.getConfiguration()).rejects.toThrow('Config not found');
    });
  });

  describe('Error Handling', () => {
    it('should retry failed commands', async () => {
      let callCount = 0;
      mockExec.mockImplementation((cmd, callback) => {
        callCount++;
        if (callCount < 3) {
          callback(new Error('Temporary failure'), null);
        } else {
          callback(null, { stdout: '{"success": true}' });
        }
      });

      const result = await taskmaster.createTask({ title: 'Test' });
      
      expect(callCount).toBe(3);
      expect(result.success).toBe(true);
    });

    it('should fail after max retries', async () => {
      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error('Persistent failure'), null);
      });

      await expect(
        taskmaster.createTask({ title: 'Test' })
      ).rejects.toThrow('Persistent failure');
    });
  });
});