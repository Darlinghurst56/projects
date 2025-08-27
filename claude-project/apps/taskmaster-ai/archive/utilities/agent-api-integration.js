/**
 * Agent API Integration - Home Vibe Coder Standards
 * Connects agent coordination widgets with TaskMaster and coordination APIs
 */

class AgentAPIIntegration {
    constructor() {
        this.baseUrl = '/api'; // In real implementation, this would be your API endpoint
        this.eventBus = window.eventBus || new EventBus();
        this.coordinationPath = '../.agent-coordination';
        this.pollingInterval = 30000; // 30 seconds
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // 2 seconds
        this.setupEventListeners();
        this.initializeWebSocket();
    }

    setupEventListeners() {
        // Listen for widget requests
        this.eventBus.on('agent:fetch:requested', (data) => this.fetchAgents(data));
        this.eventBus.on('task:fetch:requested', (data) => this.fetchTasks(data));
        this.eventBus.on('task:assign:requested', (data) => this.assignTask(data));
        this.eventBus.on('agent:status:update:requested', (data) => this.updateAgentStatus(data));
        this.eventBus.on('coordination:status:requested', () => this.fetchCoordinationStatus());
        this.eventBus.on('agent:register:requested', (data) => this.registerAgent(data));
    }

    /**
     * Fetch agents from coordination system
     */
    async fetchAgents() {
        try {
            const data = await this.fetchRealAgents();
            this.eventBus.emit('agents:fetched', { agents: data });
            return { agents: data };
        } catch (error) {
            console.error('Failed to fetch agents:', error);
            this.eventBus.emit('api:error', { type: 'fetch_agents', error: error.message });
            throw error;
        }
    }

    /**
     * Fetch tasks from TaskMaster
     */
    async fetchTasks(filter = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (filter.status) queryParams.append('status', filter.status);
            if (filter.withSubtasks) queryParams.append('withSubtasks', 'true');
            
            const response = await fetch(`${this.baseUrl}/tasks?${queryParams}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.eventBus.emit('tasks:fetched', data);
            return data;
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            this.eventBus.emit('api:error', { type: 'fetch_tasks', error: error.message });
            throw error;
        }
    }

    /**
     * Assign a task to an agent
     */
    async assignTask(assignmentData) {
        try {
            const { taskId, agentId, task, agent, priority } = assignmentData;
            
            const response = await fetch(`${this.baseUrl}/agents/${agentId}/assign-task`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    taskId,
                    priority: priority || 'medium'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Emit success event
            this.eventBus.emit('task:assigned:success', {
                taskId,
                agentId,
                result
            });
            
            return result;
        } catch (error) {
            console.error('Failed to assign task:', error);
            this.eventBus.emit('api:error', { type: 'assign_task', error: error.message });
            throw error;
        }
    }

    /**
     * Update agent status
     */
    async updateAgentStatus(statusData) {
        try {
            const { agentId, status, metadata } = statusData;
            
            const response = await fetch(`${this.baseUrl}/agents/${agentId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status,
                    metadata
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            this.eventBus.emit('agent:status:updated', {
                agentId,
                status,
                timestamp: new Date().toISOString(),
                result
            });
            
            return result;
        } catch (error) {
            console.error('Failed to update agent status:', error);
            this.eventBus.emit('api:error', { type: 'update_status', error: error.message });
            throw error;
        }
    }

    /**
     * Fetch coordination system status
     */
    async fetchCoordinationStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/coordination/status`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.eventBus.emit('coordination:status:fetched', data);
            return data;
        } catch (error) {
            console.error('Failed to fetch coordination status:', error);
            this.eventBus.emit('api:error', { type: 'fetch_coordination_status', error: error.message });
            throw error;
        }
    }

    /**
     * Register a new agent
     */
    async registerAgent(registrationData) {
        try {
            const { agentId, role } = registrationData;
            
            const response = await fetch(`${this.baseUrl}/agents/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    agentId,
                    role
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            this.eventBus.emit('agent:registered:success', {
                agentId,
                role,
                result
            });
            
            return result;
        } catch (error) {
            console.error('Failed to register agent:', error);
            this.eventBus.emit('api:error', { type: 'register_agent', error: error.message });
            throw error;
        }
    }

    /**
     * Start automatic polling for real-time updates
     */
    startPolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
        }
        
        this.pollingTimer = setInterval(() => {
            this.fetchAgents().catch(err => console.warn('Polling error:', err));
            this.fetchCoordinationStatus().catch(err => console.warn('Coordination polling error:', err));
        }, this.pollingInterval);
    }

    /**
     * Stop automatic polling
     */
    stopPolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }
    }

    /**
     * Initialize WebSocket connection for real-time updates
     */
    initializeWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        try {
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('✅ WebSocket connected');
                this.reconnectAttempts = 0;
                this.eventBus.emit('websocket:connected');
            };
            
            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
            
            this.websocket.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.eventBus.emit('websocket:disconnected');
                this.handleWebSocketReconnect();
            };
            
            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.eventBus.emit('websocket:error', error);
            };
            
        } catch (error) {
            console.warn('WebSocket not available, falling back to polling:', error.message);
            this.startPolling();
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleWebSocketMessage(data) {
        const { type, payload } = data;
        
        switch (type) {
            case 'agent_status_update':
                this.eventBus.emit('agent:status:updated', payload);
                break;
                
            case 'agent_registered':
                this.eventBus.emit('agent:registered:success', payload);
                break;
                
            case 'task_assigned':
                this.eventBus.emit('task:assigned:success', payload);
                break;
                
            case 'coordination_status_update':
                this.eventBus.emit('coordination:status:fetched', payload);
                break;
                
            case 'agents_update':
                this.eventBus.emit('agents:fetched', payload);
                break;
                
            case 'heartbeat':
                // Send heartbeat response
                this.sendWebSocketMessage({ type: 'heartbeat_response' });
                break;
                
            default:
                console.log('Unknown WebSocket message type:', type, payload);
        }
    }

    /**
     * Send message via WebSocket
     */
    sendWebSocketMessage(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    /**
     * Handle WebSocket reconnection
     */
    handleWebSocketReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
            
            console.log(`Attempting WebSocket reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
            
            setTimeout(() => {
                this.initializeWebSocket();
            }, delay);
        } else {
            console.warn('Max WebSocket reconnection attempts reached, falling back to polling');
            this.startPolling();
        }
    }

    /**
     * Close WebSocket connection
     */
    closeWebSocket() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
    }

    /**
     * Fetch real agent data from TaskMaster API
     */
    async fetchRealAgents() {
        try {
            // Get real agents from TaskMaster API
            const response = await fetch(`${this.baseUrl}/api/agents`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data.agents || [];
        } catch (error) {
            console.error('Failed to fetch real agents:', error.message);
            throw new Error('Real agent data unavailable');
        }
    }

    /**
     * Fetch real task data from TaskMaster
     */
    async fetchRealTasks(filter = {}) {
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (filter.status) params.append('status', filter.status);
            if (filter.priority) params.append('priority', filter.priority);
            if (filter.unassigned) params.append('unassigned', 'true');
            
            const response = await fetch(`${this.baseUrl}/api/taskmaster/tasks?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.tasks || [];
        } catch (error) {
            console.error('Failed to fetch real tasks:', error.message);
            throw new Error('Real task data unavailable');
        }
    }

    /**
     * Real task assignment via coordination API
     */
    async assignTaskToAgent(assignmentData) {
        const { taskId, agentId, task } = assignmentData;
        
        try {
            const response = await fetch(`${this.baseUrl}/api/agents/${agentId}/assign-task`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    taskId,
                    priority: task.priority,
                    capabilities: task.capabilities,
                    estimatedTime: task.estimatedTime
                })
            });
            
            if (!response.ok) {
                throw new Error(`Assignment failed: HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            // Update TaskMaster with assignment
            await this.updateTaskMasterAssignment(taskId, agentId, task);
            
            return result;
        } catch (error) {
            console.error('Failed to assign task:', error.message);
            throw new Error(`Task assignment failed: ${error.message}`);
        }
    }

    /**
     * Real agent status update
     */
    async updateAgentStatus(statusData) {
        const { agentId, status, metadata } = statusData;
        
        try {
            const response = await fetch(`${this.baseUrl}/api/agents/${agentId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status,
                    metadata,
                    updatedAt: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`Status update failed: HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to update agent status:', error.message);
            throw new Error(`Status update failed: ${error.message}`);
        }
    }

    /**
     * Update TaskMaster with assignment metadata
     */
    async updateTaskMasterAssignment(taskId, agentId, task) {
        // In real implementation, this would call TaskMaster update-subtask API
        console.log(`TaskMaster update: Task ${taskId} assigned to ${agentId}`);
        
        const updateMessage = `Task assigned to ${agentId} via agent coordination system.

Agent Assignment Details:
- Agent: ${agentId}
- Capabilities Match: ${task.capabilities.join(', ')}
- Estimated Time: ${task.estimatedTime}
- Priority: ${task.priority}
- Assignment Time: ${new Date().toISOString()}

🤖 Generated via Agent Coordination Dashboard`;

        // Emit event that could be picked up by TaskMaster integration
        this.eventBus.emit('taskmaster:update:requested', {
            taskId,
            updateType: 'assignment',
            message: updateMessage,
            agentId
        });
    }

    /**
     * Start polling for real-time updates
     */
    startPolling() {
        setInterval(async () => {
            try {
                const [agents, tasks] = await Promise.all([
                    this.fetchAgents(),
                    this.fetchTasks({ unassigned: true })
                ]);
                
                this.eventBus.emit('polling:update', {
                    agents,
                    tasks,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.warn('Polling update failed:', error);
            }
        }, this.pollingInterval);
    }

    /**
     * Manual refresh trigger
     */
    async refreshAll() {
        try {
            this.eventBus.emit('api:refresh:started');
            
            const [agents, tasks] = await Promise.all([
                this.fetchAgents(),
                this.fetchTasks()
            ]);
            
            this.eventBus.emit('api:refresh:completed', {
                agents,
                tasks,
                timestamp: new Date().toISOString()
            });
            
            return { agents, tasks };
        } catch (error) {
            this.eventBus.emit('api:refresh:failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Get coordination system health
     */
    async getSystemHealth() {
        try {
            // In real implementation, this would check:
            // - Agent coordination system status
            // - TaskMaster API connectivity
            // - MCP server health
            // - File system access
            
            return {
                status: 'healthy',
                components: {
                    coordinationSystem: { status: 'online', uptime: '3h 24m' },
                    taskMaster: { status: 'online', lastSync: '30s ago' },
                    mcpServers: { status: 'online', activeServers: 8 },
                    fileSystem: { status: 'online', writeable: true }
                },
                lastCheck: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'degraded',
                error: error.message,
                lastCheck: new Date().toISOString()
            };
        }
    }
}

// Initialize API integration
window.agentAPI = new AgentAPIIntegration();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentAPIIntegration;
}