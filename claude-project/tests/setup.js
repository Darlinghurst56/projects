/**
 * Test Setup Configuration
 * Shared setup for all test environments (unit, integration, e2e)
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import fs from 'fs';
import path from 'path';

// Mock API handlers
export const handlers = [
  // TaskMaster API mocks
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            id: '1',
            title: 'Test Task',
            status: 'pending',
            agentRole: 'frontend-agent'
          }
        ],
        pagination: { page: 1, limit: 10, total: 1 }
      })
    );
  }),

  rest.post('/api/tasks', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: '2',
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString()
      })
    );
  }),

  rest.get('/api/health', (req, res, ctx) => {
    return res(
      ctx.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 3600,
        memory: { used: 50000000, total: 100000000 }
      })
    );
  }),

  // Dashboard widget API mocks
  rest.get('/api/widgets/dns-status', (req, res, ctx) => {
    return res(
      ctx.json({
        status: 'active',
        profile: 'default',
        lastChecked: new Date().toISOString()
      })
    );
  }),

  rest.get('/api/widgets/task-assignment', (req, res, ctx) => {
    return res(
      ctx.json({
        assignments: [
          { agentId: 'frontend-1', taskCount: 3, role: 'frontend-agent' },
          { agentId: 'backend-1', taskCount: 2, role: 'backend-agent' }
        ]
      })
    );
  }),
];

// Setup MSW server
export const server = setupServer(...handlers);

// Global test setup
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  
  // Setup test environment variables
  process.env.NODE_ENV = 'test';
  process.env.GOOGLE_API_KEY = 'test-google-api-key';
  process.env.SESSION_SECRET = 'test-session-secret';
  
  // Create test directories if they don't exist
  const testDirs = [
    'tests/fixtures',
    'tests/temp',
    'coverage'
  ];
  
  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
});

afterAll(() => {
  server.close();
  
  // Cleanup test files
  if (fs.existsSync('tests/temp')) {
    fs.rmSync('tests/temp', { recursive: true, force: true });
  }
});

beforeEach(() => {
  server.resetHandlers();
});

afterEach(() => {
  // Reset any global state between tests
  if (global.fetch) {
    global.fetch.mockClear?.();
  }
});

// Custom test utilities
export const testUtils = {
  // Create a temporary test file
  createTempFile: (filename, content) => {
    const filepath = path.join('tests/temp', filename);
    fs.writeFileSync(filepath, content);
    return filepath;
  },

  // Load test fixture
  loadFixture: (filename) => {
    const filepath = path.join('tests/fixtures', filename);
    return fs.readFileSync(filepath, 'utf8');
  },

  // Wait for async operations
  waitFor: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (condition()) {
          resolve(true);
        } else if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  },

  // Mock TaskMaster API
  mockTaskMasterAPI: () => {
    return {
      createTask: vi.fn().mockResolvedValue({ id: '123', status: 'pending' }),
      getTasks: vi.fn().mockResolvedValue([]),
      updateTask: vi.fn().mockResolvedValue({ success: true }),
      deleteTask: vi.fn().mockResolvedValue({ success: true })
    };
  }
};