#!/usr/bin/env node

/**
 * TaskMaster HTTP API Server
 * Provides REST endpoints for dashboard integration
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

// Ensure we're working from the correct directory
const PROJECT_ROOT = __dirname;
const TaskMasterIntegration = require(path.join(PROJECT_ROOT, '.taskmaster/agents/taskmaster-integration.cjs'));
const AgentCoordinationWorkflow = require(path.join(PROJECT_ROOT, '.taskmaster/agents/coordination-workflow.cjs'));

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-TaskMaster-Key']
}));
app.use(express.json());
app.use(express.static(path.join(PROJECT_ROOT, 'dashboard')));

// Initialize TaskMaster integration with error handling
let taskmaster;
let agentCoordination;
try {
  taskmaster = new TaskMasterIntegration(PROJECT_ROOT);
  agentCoordination = new AgentCoordinationWorkflow(PROJECT_ROOT);
  console.log('✅ TaskMaster integration initialized');
  console.log('✅ Agent coordination system initialized');
} catch (error) {
  console.error('❌ Failed to initialize TaskMaster integration:', error.message);
  console.error('Server will start but TaskMaster features may not work');
}

// API Routes

/**
 * GET /api/tasks - Get all tasks
 */
app.get('/api/tasks', (req, res) => {
  try {
    const { status, withSubtasks } = req.query;
    const tasks = taskmaster.getTasks();
    
    if (!tasks) {
      return res.status(500).json({ error: 'Failed to read tasks' });
    }

    let filteredTasks = tasks.tasks;
    
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }

    res.json({
      tasks: filteredTasks,
      metadata: {
        total: filteredTasks.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/tasks/unassigned - Get unassigned pending tasks
 */
app.get('/api/tasks/unassigned', (req, res) => {
  try {
    const tasks = taskmaster.getTasks();
    
    if (!tasks) {
      return res.status(500).json({ error: 'Failed to read tasks' });
    }

    const unassigned = tasks.tasks.filter(task => 
      task.status === 'pending' && 
      !task.agentMetadata?.assignedAgent
    );

    res.json({
      tasks: unassigned,
      count: unassigned.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching unassigned tasks:', error);
    res.status(500).json({ error: 'Failed to fetch unassigned tasks' });
  }
});

/**
 * POST /api/tasks/:id/assign - Assign agent to task
 */
app.post('/api/tasks/:id/assign', (req, res) => {
  try {
    const taskId = req.params.id;
    const result = taskmaster.assignAgentToTask(taskId);
    
    if (result) {
      res.json({
        success: true,
        assignment: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({ error: `Task ${taskId} not found` });
    }
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

/**
 * POST /api/agents/auto-assign - Auto-assign all unassigned tasks
 */
app.post('/api/agents/auto-assign', (req, res) => {
  try {
    taskmaster.autoAssignAllTasks();
    
    // Get updated task list
    const tasks = taskmaster.getTasks();
    const assigned = tasks.tasks.filter(task => 
      task.agentMetadata?.assignedAgent
    );

    res.json({
      success: true,
      message: 'Auto-assignment completed',
      assignedCount: assigned.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in auto-assignment:', error);
    res.status(500).json({ error: 'Auto-assignment failed' });
  }
});

/**
 * GET /api/agents/workload - Get agent workload summary
 */
app.get('/api/agents/workload', (req, res) => {
  try {
    const tasks = taskmaster.getTasks();
    
    if (!tasks) {
      return res.status(500).json({ error: 'Failed to read tasks' });
    }

    const workload = {};
    
    // Initialize workload for all agents
    const SimpleAgentAssigner = require('./.taskmaster/agents/simple-assignment.cjs');
    const assigner = new SimpleAgentAssigner();
    
    for (const agentId of Object.keys(assigner.agents)) {
      workload[agentId] = { 
        count: 0, 
        tasks: [],
        agentName: assigner.getAgent(agentId).name
      };
    }

    // Count assigned tasks
    const countTask = (task) => {
      const agentId = task.agentMetadata?.assignedAgent;
      if (agentId && workload[agentId] && task.status !== 'done') {
        workload[agentId].count++;
        workload[agentId].tasks.push({
          id: task.id,
          title: task.title,
          status: task.status
        });
      }

      if (task.subtasks) {
        task.subtasks.forEach(subtask => countTask(subtask));
      }
    };

    tasks.tasks.forEach(task => countTask(task));

    res.json({
      workload,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching workload:', error);
    res.status(500).json({ error: 'Failed to fetch workload' });
  }
});

// Agent Management API Endpoints

/**
 * GET /api/agents - Get all registered agents
 */
app.get('/api/agents', (req, res) => {
  try {
    if (!agentCoordination) {
      return res.status(500).json({ error: 'Agent coordination system not initialized' });
    }

    const agentData = agentCoordination.getCoordinationStatus();
    const agents = Object.entries(agentData.agentDetails || {}).map(([id, data]) => ({
      id,
      role: data.role,
      status: data.status,
      registeredAt: data.registeredAt,
      lastActivity: data.lastActivity,
      currentTag: data.currentTag || null
    }));

    res.json({
      agents,
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

/**
 * POST /api/agents/register - Register a new agent
 */
app.post('/api/agents/register', async (req, res) => {
  try {
    if (!agentCoordination) {
      return res.status(500).json({ error: 'Agent coordination system not initialized' });
    }

    const { agentId, role } = req.body;
    
    if (!agentId || !role) {
      return res.status(400).json({ error: 'agentId and role are required' });
    }

    await agentCoordination.registerAgent(agentId, role);
    
    const registrationData = {
      message: `Agent ${agentId} registered successfully`,
      agentId,
      role,
      timestamp: new Date().toISOString()
    };

    // Broadcast agent registration via WebSocket
    broadcastToClients({
      type: 'agent_registered',
      payload: {
        agentId,
        role,
        timestamp: registrationData.timestamp
      }
    });
    
    res.status(201).json(registrationData);
  } catch (error) {
    console.error('Error registering agent:', error);
    res.status(400).json({ error: error.message || 'Failed to register agent' });
  }
});

/**
 * PUT /api/agents/:id/status - Update agent status
 */
app.put('/api/agents/:id/status', (req, res) => {
  try {
    if (!agentCoordination) {
      return res.status(500).json({ error: 'Agent coordination system not initialized' });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive', 'error', 'maintenance'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (active, inactive, error, maintenance)' });
    }

    const agentData = agentCoordination.getCoordinationStatus();
    if (!agentData.agentDetails[id]) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Update agent status
    agentData.agentDetails[id].status = status;
    agentData.agentDetails[id].lastActivity = new Date().toISOString();
    
    // Save the updated state
    agentCoordination.state = agentData;
    agentCoordination.saveCoordinationState();

    const responseData = {
      message: `Agent ${id} status updated to ${status}`,
      agentId: id,
      status,
      timestamp: new Date().toISOString()
    };

    // Broadcast status update via WebSocket
    broadcastToClients({
      type: 'agent_status_update',
      payload: {
        agentId: id,
        status,
        timestamp: responseData.timestamp
      }
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error updating agent status:', error);
    res.status(500).json({ error: 'Failed to update agent status' });
  }
});

/**
 * POST /api/agents/:id/assign-task - Assign task to specific agent
 */
app.post('/api/agents/:id/assign-task', async (req, res) => {
  try {
    if (!agentCoordination || !taskmaster) {
      return res.status(500).json({ error: 'Agent coordination or TaskMaster not initialized' });
    }

    const { id: agentId } = req.params;
    const { taskId, priority } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }

    const agentData = agentCoordination.getCoordinationStatus();
    if (!agentData.agentDetails[agentId]) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Verify task exists
    const tasks = taskmaster.getTasks();
    const task = tasks.tasks.find(t => t.id.toString() === taskId.toString());
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Record task assignment
    if (!agentCoordination.state.taskAssignments) {
      agentCoordination.state.taskAssignments = {};
    }
    
    agentCoordination.state.taskAssignments[taskId] = {
      agentId,
      assignedAt: new Date().toISOString(),
      status: 'assigned',
      priority: priority || 'medium'
    };

    agentCoordination.saveCoordinationState();

    const assignmentData = {
      taskId,
      agentId,
      taskTitle: task.title,
      assignedAt: new Date().toISOString(),
      priority: priority || 'medium'
    };

    // Broadcast task assignment via WebSocket
    broadcastToClients({
      type: 'task_assigned',
      payload: assignmentData
    });

    res.json({
      message: `Task ${taskId} assigned to agent ${agentId}`,
      assignment: assignmentData
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

/**
 * GET /api/coordination/status - Get overall coordination system status
 */
app.get('/api/coordination/status', (req, res) => {
  try {
    if (!agentCoordination) {
      return res.status(500).json({ error: 'Agent coordination system not initialized' });
    }

    const status = agentCoordination.getCoordinationStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching coordination status:', error);
    res.status(500).json({ error: 'Failed to fetch coordination status' });
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
 * POST /api/litellm/usage - Track LiteLLM usage for TaskMaster
 */
app.post('/api/litellm/usage', (req, res) => {
  try {
    const apiKey = req.headers['x-taskmaster-key'];
    
    // Verify API key
    if (apiKey !== process.env.TASKMASTER_API_KEY && apiKey !== 'taskmaster-secret') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { model, task_id, prompt_tokens, completion_tokens, cost } = req.body;
    
    // Log usage data
    console.log('LiteLLM Usage:', {
      model,
      task_id,
      prompt_tokens,
      completion_tokens,
      cost,
      timestamp: new Date().toISOString()
    });

    // If taskmaster is available, update task with usage info
    if (taskmaster && task_id) {
      try {
        const updateResult = taskmaster.updateSubtask(task_id, {
          prompt: `LLM Usage: ${model} - ${prompt_tokens + completion_tokens} tokens - $${cost}`
        });
      } catch (error) {
        console.error('Failed to update task with usage:', error);
      }
    }

    res.json({ success: true, message: 'Usage tracked' });
  } catch (error) {
    console.error('Error tracking LiteLLM usage:', error);
    res.status(500).json({ error: 'Failed to track usage' });
  }
});

/**
 * POST /api/litellm/errors - Track LiteLLM errors for TaskMaster
 */
app.post('/api/litellm/errors', (req, res) => {
  try {
    const apiKey = req.headers['x-taskmaster-key'];
    
    // Verify API key
    if (apiKey !== process.env.TASKMASTER_API_KEY && apiKey !== 'taskmaster-secret') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { model, task_id, error, error_type } = req.body;
    
    // Log error data
    console.error('LiteLLM Error:', {
      model,
      task_id,
      error,
      error_type,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Error tracked' });
  } catch (error) {
    console.error('Error tracking LiteLLM error:', error);
    res.status(500).json({ error: 'Failed to track error' });
  }
});

/**
 * GET /api/server/status - Comprehensive server monitoring endpoint
 */
app.get('/api/server/status', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // WebSocket connection count
    const wsConnections = clients.size;
    
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
        webSocket: {
          status: wss ? 'active' : 'inactive',
          connections: wsConnections,
          endpoint: `ws://localhost:${PORT}/ws`
        },
        http: {
          status: 'active',
          endpoint: `http://localhost:${PORT}`
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

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, 'dashboard', 'agent-dashboard.html'));
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

// WebSocket Setup
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection from:', req.socket.remoteAddress);
  clients.add(ws);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection_established',
    payload: { message: 'Connected to TaskMaster real-time updates' }
  }));
  
  // Handle messages from client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleWebSocketMessage(ws, message);
    } catch (error) {
      console.error('Invalid WebSocket message:', error);
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// WebSocket message handler
function handleWebSocketMessage(ws, message) {
  const { type, payload } = message;
  
  switch (type) {
    case 'heartbeat_response':
      // Client responded to heartbeat, no action needed
      break;
    case 'subscribe_agents':
      // Client wants to subscribe to agent updates
      ws.agentSubscription = true;
      break;
    case 'subscribe_tasks':
      // Client wants to subscribe to task updates
      ws.taskSubscription = true;
      break;
    default:
      console.log('Unknown WebSocket message type:', type);
  }
}

// Broadcast message to all connected clients
function broadcastToClients(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Broadcast to specific subscription
function broadcastToSubscribers(message, subscriptionType) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client[subscriptionType]) {
      client.send(messageStr);
    }
  });
}

// Heartbeat to keep connections alive
setInterval(() => {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'heartbeat' }));
    }
  });
}, 30000); // Every 30 seconds

// Enhanced API endpoints with WebSocket notifications

// Override some endpoints to add WebSocket broadcasting
const originalAgentStatusHandler = app._router.stack.find(layer => 
  layer.route && layer.route.path === '/api/agents/:id/status'
);

// Start server
server.listen(PORT, () => {
  console.log(`TaskMaster API Server running on http://localhost:${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}/`);
  console.log(`API health check: http://localhost:${PORT}/api/health`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});

module.exports = { app, server, broadcastToClients, broadcastToSubscribers };