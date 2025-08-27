#!/usr/bin/env node

/**
 * TaskMaster HTTP API Server
 * Provides REST endpoints for dashboard integration
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
// Ensure we're working from the correct directory
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const TaskMasterIntegration = require(path.join(PROJECT_ROOT, '.taskmaster/agents/taskmaster-integration.cjs'));
const AgentCoordinationWorkflow = require(path.join(PROJECT_ROOT, '.taskmaster/agents/coordination-workflow.cjs'));
const DeveloperApprovalAPI = require(path.join(PROJECT_ROOT, 'app/developer-interface/api/developer-approval-endpoints.js'));
const SafeTaskProcessor = require('./safe-task-processor');
const APIv2Router = require('../api/v2/index');
const SyncManager = require('../api/v2/working-copy/sync-manager');

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(PROJECT_ROOT, 'app/dashboard')));
app.use('/app', express.static(path.join(PROJECT_ROOT, 'app')));
app.use('/mission-control', express.static(path.join(PROJECT_ROOT, 'app/mission-control')));

// Initialize TaskMaster integration with error handling
let taskmaster;
let agentCoordination;
let developerApprovalAPI;
let safeTaskProcessor;
let apiv2Router;
let syncManager;
try {
  taskmaster = new TaskMasterIntegration(PROJECT_ROOT);
  agentCoordination = new AgentCoordinationWorkflow(PROJECT_ROOT);
  developerApprovalAPI = new DeveloperApprovalAPI(agentCoordination);
  safeTaskProcessor = new SafeTaskProcessor();
  apiv2Router = new APIv2Router(PROJECT_ROOT, agentCoordination);
  syncManager = new SyncManager(PROJECT_ROOT, {
    autoSync: true,
    syncInterval: 30000, // 30 seconds
    conflictResolution: 'working-copy-wins'
  });
  console.log('✅ TaskMaster integration initialized');
  console.log('✅ Agent coordination system initialized');
  console.log('✅ Developer approval API initialized');
  console.log('✅ Safe task processor initialized');
  console.log('✅ API v2 router initialized');
  console.log('✅ Working copy sync manager initialized');
} catch (error) {
  console.error('❌ Failed to initialize TaskMaster integration:', error.message);
  console.error('Server will start but TaskMaster features may not work');
}

// Dynamic route loader for hot-reload capability
let developerInterfaceRoutes = new Map();

// Load developer interface routes
function loadDeveloperInterfaceRoutes() {
  try {
    // Clear existing routes
    developerInterfaceRoutes.clear();
    
    // Add developer interface dashboard route
    developerInterfaceRoutes.set('/developer-interface', (req, res) => {
      res.sendFile(path.join(PROJECT_ROOT, 'app/developer-interface/web/enhanced-dashboard.html'));
    });
    
    // Add debug route
    developerInterfaceRoutes.set('/debug', (req, res) => {
      res.sendFile(path.join(PROJECT_ROOT, 'app/developer-interface/web/debug.html'));
    });
    
    // Note: Agent management and Mission Control routes now redirect to /agents
    
    // Add any additional developer interface routes
    console.log('✅ Developer interface routes loaded');
  } catch (error) {
    console.error('❌ Failed to load developer interface routes:', error);
  }
}

// Serve developer interface dashboard (with hot-reload)
app.get('/developer-interface', (req, res) => {
  if (developerInterfaceRoutes.has('/developer-interface')) {
    developerInterfaceRoutes.get('/developer-interface')(req, res);
  } else {
    res.sendFile(path.join(PROJECT_ROOT, 'app/developer-interface/web/enhanced-dashboard.html'));
  }
});

// Redirect old agent management interface to consolidated agents
app.get('/agent-management', (req, res) => {
  res.redirect(301, '/agents');
});

// Serve agent roles configuration (read-only)
app.get('/agent-roles.json', (req, res) => {
  try {
    const agentRolesPath = path.join(PROJECT_ROOT, '.taskmaster/agents/agent-roles.json');
    if (fs.existsSync(agentRolesPath)) {
      res.sendFile(agentRolesPath);
    } else {
      res.status(404).json({ error: 'Agent roles configuration not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to load agent configuration' });
  }
});

// Redirect old Mission Control interface to consolidated agents  
app.get('/mission-control', (req, res) => {
  res.redirect(301, '/agents');
});

// Serve debug page (with hot-reload)
app.get('/debug', (req, res) => {
  if (developerInterfaceRoutes.has('/debug')) {
    developerInterfaceRoutes.get('/debug')(req, res);
  } else {
    res.sendFile(path.join(PROJECT_ROOT, 'app/developer-interface/web/debug.html'));
  }
});

// Hot-reload endpoint for routes
app.post('/api/admin/reload-routes', (req, res) => {
  try {
    loadDeveloperInterfaceRoutes();
    
    // Reload developer approval API if needed
    if (developerApprovalAPI) {
      console.log('🔄 Reloading developer approval API routes...');
    }
    
    res.json({
      success: true,
      message: 'Routes reloaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reloading routes:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Telemetry Dashboard API
app.get('/api/telemetry/dashboard', async (req, res) => {
  try {
    const { AgentTelemetryTracker } = require('../../.taskmaster/agents/agent-telemetry-tracker.js');
    const tracker = new AgentTelemetryTracker();
    const report = tracker.getSystemUsageReport(7); // 7 days
    
    // Transform data for dashboard
    const dashboardData = {
      costs: {
        total: report.totals.cost,
        google: 0,
        perplexity: 0,
        claude: 0,
        ollama: 0
      },
      tokens: {
        total: report.totals.tokens,
        input: Math.floor(report.totals.tokens * 0.6), // Estimate
        output: Math.floor(report.totals.tokens * 0.4)
      },
      performance: {
        totalCalls: report.totals.calls,
        avgResponseTime: Object.values(report.agents).reduce((sum, agent) => 
          sum + (agent.averageResponseTime || 0), 0) / Object.keys(report.agents).length || 0,
        successRate: 0.95 // Default to 95%
      },
      agents: report.agents
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Telemetry dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/telemetry/export', async (req, res) => {
  try {
    const { AgentTelemetryTracker } = require('../../.taskmaster/agents/agent-telemetry-tracker.js');
    const tracker = new AgentTelemetryTracker();
    const report = tracker.getSystemUsageReport(30); // 30 days for export
    
    res.json({
      exportDate: new Date().toISOString(),
      period: '30 days',
      summary: report,
      detailedData: {
        // Include raw telemetry data for analysis
        agents: report.agents,
        totals: report.totals
      }
    });
  } catch (error) {
    console.error('Telemetry export error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/telemetry/clear', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const telemetryDir = path.join(PROJECT_ROOT, '.taskmaster/telemetry');
    
    // Clear all telemetry log files
    if (fs.existsSync(telemetryDir)) {
      const files = fs.readdirSync(telemetryDir);
      files.forEach(file => {
        if (file.endsWith('.jsonl')) {
          fs.writeFileSync(path.join(telemetryDir, file), '');
        }
      });
    }
    
    res.json({ success: true, message: 'Telemetry data cleared' });
  } catch (error) {
    console.error('Telemetry clear error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Model Provider Testing API
app.post('/api/models/test/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { execSync } = require('child_process');
    
    let testResult = { success: false, message: '', error: '' };
    
    switch (provider) {
      case 'claude-code':
        // Test TaskMaster basic functionality (Claude Code is built-in)
        try {
          const result = execSync('task-master list', { encoding: 'utf8', timeout: 10000 });
          testResult = { success: true, message: 'Built-in access working, task listing successful' };
        } catch (error) {
          testResult = { success: false, error: 'TaskMaster CLI not accessible' };
        }
        break;
        
      case 'google':
        // Test Google Gemini
        try {
          const result = execSync('task-master research "test" --detail=minimal', { encoding: 'utf8', timeout: 15000 });
          if (result.includes('gemini') || result.length > 10) {
            testResult = { success: true, message: 'Google Gemini API responding' };
          } else {
            testResult = { success: false, error: 'No response from Google Gemini' };
          }
        } catch (error) {
          testResult = { success: false, error: 'Google API key may be invalid or quota exceeded' };
        }
        break;
        
      case 'perplexity':
        // Test Perplexity by checking if key is configured
        const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;
        if (hasPerplexityKey) {
          testResult = { success: true, message: 'API key configured, ready for research operations' };
        } else {
          testResult = { success: false, error: 'API key not configured' };
        }
        break;
        
      case 'ollama':
        // Test Ollama local connection
        try {
          const http = require('http');
          const ollamaHost = process.env.OLLAMA_HOST || '192.168.1.74:11434';
          const [host, port] = ollamaHost.split(':');
          
          const options = {
            hostname: host,
            port: parseInt(port),
            path: '/api/tags',
            method: 'GET',
            timeout: 5000
          };
          
          const req = http.request(options, (response) => {
            if (response.statusCode === 200) {
              testResult = { success: true, message: `Local server accessible at ${ollamaHost}` };
            } else {
              testResult = { success: false, error: `Server responded with status ${response.statusCode}` };
            }
            res.json(testResult);
          });
          
          req.on('error', (error) => {
            testResult = { success: false, error: `Connection failed: ${error.message}` };
            res.json(testResult);
          });
          
          req.on('timeout', () => {
            testResult = { success: false, error: 'Connection timeout' };
            res.json(testResult);
          });
          
          req.end();
          return; // Don't send response twice
        } catch (error) {
          testResult = { success: false, error: error.message };
        }
        break;
        
      default:
        testResult = { success: false, error: 'Unknown provider' };
    }
    
    res.json(testResult);
  } catch (error) {
    console.error('Model test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API v2 Routes (Simplified API with Agent Intelligence)
if (apiv2Router) {
  app.use('/api/v2', apiv2Router.getRouter());
}

// Developer Approval API Routes (Legacy)
if (developerApprovalAPI) {
  app.use('/api/developer-approval', developerApprovalAPI.getRouter());
}

// Initialize developer interface routes
loadDeveloperInterfaceRoutes();

// Claude Chat Integration API
app.post('/api/claude-chat', (req, res) => {
  try {
    const { message, context = 'general' } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Mock Claude integration - in production this would:
    // 1. Send message to Claude with system context
    // 2. Parse Claude's response for actionable items
    // 3. Execute appropriate API calls
    // 4. Return results
    
    const response = {
      success: true,
      claudeResponse: `I understand you want to: "${message}". This is a mock response - in production I would parse this and execute the appropriate actions.`,
      suggestedActions: [
        {
          type: 'task_assignment',
          description: 'Based on your message, I would suggest creating a task assignment',
          parameters: {
            taskId: 'extracted-from-message',
            agentId: 'suggested-agent',
            reasoning: 'Extracted reasoning from natural language'
          }
        }
      ],
      context
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Legacy API Routes - Moved to /api/v2/ for Option C Implementation
// Tasks, agents, coordination endpoints now consolidated in API v2

/**
 * GET /api/cleanup/status - Get cleanup job status
 */
app.get('/api/cleanup/status', (req, res) => {
  try {
    if (!agentCoordination || !agentCoordination.cleanupJobs) {
      return res.status(500).json({ error: 'Cleanup jobs not initialized' });
    }

    const status = agentCoordination.cleanupJobs.getStatus();
    res.json({
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching cleanup status:', error);
    res.status(500).json({ error: 'Failed to fetch cleanup status' });
  }
});

/**
 * POST /api/cleanup/force/:taskId - Force cleanup for specific task
 */
app.post('/api/cleanup/force/:taskId', async (req, res) => {
  try {
    if (!agentCoordination || !agentCoordination.cleanupJobs) {
      return res.status(500).json({ error: 'Cleanup jobs not initialized' });
    }

    const { taskId } = req.params;
    const { type } = req.body; // 'immediate', 'delayed', 'archival', or 'all'
    
    await agentCoordination.cleanupJobs.forceCleanup(taskId, type || 'all');
    
    res.json({
      success: true,
      message: `Forced cleanup completed for task ${taskId}`,
      type: type || 'all',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error forcing cleanup:', error);
    res.status(500).json({ error: 'Failed to force cleanup' });
  }
});

/**
 * GET /api/events - Server-Sent Events endpoint for real-time notifications
 */
app.get('/api/events', (req, res) => {
  try {
    addSSEClient(res);
    
    // Send orchestrator handoff notifications
    broadcastToClients({
      type: 'orchestrator_handoff_ready',
      payload: {
        stage: 'analysis',
        message: 'Orchestrator handoff system ready',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('📡 SSE client connected');
  } catch (error) {
    console.error('Error setting up SSE connection:', error);
    res.status(500).json({ error: 'Failed to establish SSE connection' });
  }
});

/**
 * POST /api/events/orchestrator/handoff - Trigger orchestrator handoff event
 */
app.post('/api/events/orchestrator/handoff', (req, res) => {
  try {
    const { stage, taskId, agentId, message } = req.body;
    
    if (!stage || !taskId) {
      return res.status(400).json({ error: 'stage and taskId are required' });
    }
    
    // Broadcast orchestrator handoff event
    broadcastToClients({
      type: 'orchestrator_handoff',
      payload: {
        stage,
        taskId,
        agentId,
        message: message || `Orchestrator handoff: ${stage}`,
        timestamp: new Date().toISOString()
      }
    });
    
    res.json({
      success: true,
      message: 'Orchestrator handoff event sent',
      stage,
      taskId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering orchestrator handoff:', error);
    res.status(500).json({ error: 'Failed to trigger orchestrator handoff' });
  }
});

/**
 * GET /api/health - Health check with TaskMaster status
 */
app.get('/api/health', (req, res) => {
  let taskmasterStatus = 'unknown';
  try {
    if (taskmaster) {
      const testData = taskmaster.getTasks();
      taskmasterStatus = testData ? 'connected' : 'error';
    } else {
      taskmasterStatus = 'not_initialized';
    }
  } catch (error) {
    taskmasterStatus = 'error';
  }

  res.json({
    status: 'healthy',
    service: 'TaskMaster API',
    taskmaster: taskmasterStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/server/status - Comprehensive server monitoring endpoint
 */
app.get('/api/server/status', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // SSE connection count for single-user mode
    const sseConnections = sseClients.size;
    
    // Agent coordination status
    let coordinationHealth = 'unknown';
    let agentCount = 0;
    try {
      if (agentCoordination) {
        const coordStatus = agentCoordination.getCoordinationStatus();
        agentCount = coordStatus.activeAgents || 0;
        coordinationHealth = agentCount > 0 ? 'healthy' : 'idle';
      }
    } catch (error) {
      coordinationHealth = 'error';
    }
    
    // TaskMaster integration status
    let taskmasterHealth = 'unknown';
    let taskCount = 0;
    try {
      if (taskmaster) {
        const tasks = taskmaster.getTasks();
        if (tasks && tasks.tasks) {
          taskCount = tasks.tasks.length;
          taskmasterHealth = 'connected';
        } else {
          taskmasterHealth = 'error';
        }
      } else {
        taskmasterHealth = 'not_initialized';
      }
    } catch (error) {
      taskmasterHealth = 'error';
    }

    const serverStatus = {
      server: {
        status: 'running',
        port: PORT,
        uptime: process.uptime(),
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      },
      performance: {
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
          external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      },
      connectivity: {
        serverSentEvents: {
          status: 'active',
          connections: sseConnections,
          endpoint: `${req.protocol}://${req.get('host')}/api/events`
        },
        http: {
          status: 'active',
          endpoint: `${req.protocol}://${req.get('host')}`
        }
      },
      services: {
        taskmaster: {
          status: taskmasterHealth,
          taskCount: taskCount
        },
        agentCoordination: {
          status: coordinationHealth,
          activeAgents: agentCount
        }
      },
      endpoints: {
        dashboard: `http://localhost:${PORT}/`,
        health: `http://localhost:${PORT}/api/health`,
        agents: `http://localhost:${PORT}/api/agents`,
        tasks: `http://localhost:${PORT}/api/tasks`,
        coordination: `http://localhost:${PORT}/api/coordination/status`
      }
    };

    res.json(serverStatus);
  } catch (error) {
    console.error('Error generating server status:', error);
    res.status(500).json({ 
      error: 'Failed to generate server status',
      timestamp: new Date().toISOString()
    });
  }
});

// Serve home page
app.get('/', (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, 'app/web', 'index.html'));
});

// Serve tasks page
app.get('/tasks', (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, 'app/web', 'tasks.html'));
});

// Serve consolidated agents interface
app.get('/agents', (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, 'app/web', 'agents.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Server-Sent Events for real-time notifications
let sseClients = new Set();

function addSSEClient(res) {
  sseClients.add(res);
  
  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  // Send initial connection message
  res.write('data: {"type":"connection","message":"SSE connected"}\n\n');
  
  // Handle client disconnect
  res.on('close', () => {
    sseClients.delete(res);
  });
}

function broadcastToClients(message) {
  console.log('📢 Broadcast:', message.type || 'status_update');
  
  // Send to SSE clients
  const eventData = `data: ${JSON.stringify(message)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(eventData);
    } catch (error) {
      console.error('Error sending SSE message:', error);
      sseClients.delete(client);
    }
  });
}

function broadcastToSubscribers(message, subscriptionType) {
  console.log('📢 Notification:', subscriptionType, message.type || 'update');
  
  // Send to SSE clients with subscription type
  const eventData = `data: ${JSON.stringify({
    ...message,
    subscriptionType
  })}\n\n`;
  
  sseClients.forEach(client => {
    try {
      client.write(eventData);
    } catch (error) {
      console.error('Error sending SSE notification:', error);
      sseClients.delete(client);
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`✅ TaskMaster API Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}/`);
  console.log(`🔍 API health check: http://localhost:${PORT}/api/health`);
  console.log(`🧹 Cleanup status: http://localhost:${PORT}/api/cleanup/status`);
  
  // Initialize cleanup jobs health check
  if (agentCoordination && agentCoordination.cleanupJobs) {
    const cleanupStatus = agentCoordination.cleanupJobs.getStatus();
    console.log(`🔧 Cleanup processor: ${cleanupStatus.isRunning ? 'RUNNING' : 'STOPPED'}`);
    console.log(`📋 Cleanup queue size: ${cleanupStatus.queueSize}`);
  }
  
  console.log(`\n🚀 TaskMaster System Ready for Agent Deployment`);
  console.log(`📝 Use: node task-update-wrapper.js --help for agent commands`);
});

module.exports = { app, broadcastToClients, broadcastToSubscribers };