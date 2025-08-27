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
            const response = await fetch(`${this.baseUrl}/agents`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.eventBus.emit('agents:fetched', data);
            return data;
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
     * Simulate agent data fetch (replace with real API call)
     */
    async simulateAgentFetch() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return [
            {
                id: 'server-agent',
                name: 'Server Management Agent',
                role: 'Server Specialist',
                status: 'active',
                capabilities: ['port-allocation', 'process-lifecycle', 'development-servers', 'build-systems'],
                currentTask: 'Managing Vite dev server on port 3000',
                tasksCompleted: 12,
                uptime: Date.now() - (2 * 60 * 60 * 1000),
                lastSeen: Date.now() - (30 * 1000),
                tools: ['npm run *', 'node *', 'mcp__vite__*', 'mcp__docker__*'],
                performance: {
                    avgTaskTime: '15m',
                    successRate: 0.95,
                    utilizationRate: 0.8
                }
            },
            {
                id: 'frontend-agent',
                name: 'Frontend Development Agent',
                role: 'UI Specialist',
                status: 'active',
                capabilities: ['ui-development', 'component-architecture', 'styling-systems', 'accessibility-compliance'],
                currentTask: 'Building agent registry widget',
                tasksCompleted: 8,
                uptime: Date.now() - (1 * 60 * 60 * 1000),
                lastSeen: Date.now() - (60 * 1000),
                tools: ['Edit', 'Write', 'mcp__tailwindcss__*', 'mcp__shadcn-ui__*'],
                performance: {
                    avgTaskTime: '45m',
                    successRate: 0.92,
                    utilizationRate: 0.7
                }
            },
            {
                id: 'backend-agent',
                name: 'Backend Development Agent',
                role: 'API Specialist',
                status: 'idle',
                capabilities: ['api-development', 'database-design', 'authentication-systems', 'security-implementation'],
                currentTask: null,
                tasksCompleted: 5,
                uptime: Date.now() - (30 * 60 * 1000),
                lastSeen: Date.now() - (10 * 60 * 1000),
                tools: ['Edit', 'Write', 'mcp__http__*', 'Bash(curl *)'],
                performance: {
                    avgTaskTime: '30m',
                    successRate: 0.98,
                    utilizationRate: 0.3
                }
            },
            {
                id: 'testing-agent',
                name: 'Quality Assurance Agent',
                role: 'QA Specialist',
                status: 'offline',
                capabilities: ['automated-testing', 'quality-validation', 'performance-testing', 'security-testing'],
                currentTask: null,
                tasksCompleted: 3,
                uptime: 0,
                lastSeen: Date.now() - (45 * 60 * 1000),
                tools: ['mcp__eslint__*', 'mcp__puppeteer__*', 'Bash(test *)', 'Bash(jest *)'],
                performance: {
                    avgTaskTime: '20m',
                    successRate: 0.96,
                    utilizationRate: 0.0
                }
            },
            {
                id: 'orchestrator-agent',
                name: 'Task Orchestration Agent',
                role: 'Coordinator',
                status: 'active',
                capabilities: ['workflow-management', 'task-coordination', 'resource-allocation', 'dependency-resolution'],
                currentTask: 'Coordinating agent assignments for Task 25',
                tasksCompleted: 15,
                uptime: Date.now() - (3 * 60 * 60 * 1000),
                lastSeen: Date.now() - (10 * 1000),
                tools: ['mcp__task-master-ai__*', 'mcp__memory__*', 'mcp__sequential-thinking__*'],
                performance: {
                    avgTaskTime: '10m',
                    successRate: 0.99,
                    utilizationRate: 0.6
                }
            }
        ];
    }

    /**
     * Simulate task data fetch (replace with real TaskMaster API call)
     */
    async simulateTaskFetch(filter = {}) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const allTasks = [
            {
                id: '2.5',
                title: 'Implement Pause/Test Connection Widget',
                description: 'Build the Pause/Test Connection Widget with interactive controls and complete the dashboard system',
                priority: 'high',
                status: 'pending',
                capabilities: ['frontend-development', 'ui-development'],
                estimatedTime: '2h',
                dependencies: ['2.3', '2.4'],
                assignedAgent: null,
                tags: ['widget', 'dashboard', 'ui']
            },
            {
                id: '13',
                title: 'Fix all non-functional buttons in dashboard',
                description: 'Implement proper event handlers for all placeholder buttons in the dashboard',
                priority: 'medium',
                status: 'pending',
                capabilities: ['frontend-development', 'testing'],
                estimatedTime: '1h',
                dependencies: [],
                assignedAgent: null,
                tags: ['bug-fix', 'dashboard', 'interaction']
            },
            {
                id: '15',
                title: 'Fix DNS Analytics Widget blank display issue',
                description: 'Investigate and resolve the DNS Analytics widget displaying blank content instead of expected analytics data',
                priority: 'high',
                status: 'pending',
                capabilities: ['frontend-development', 'api-integration'],
                estimatedTime: '3h',
                dependencies: ['2'],
                assignedAgent: null,
                tags: ['bug-fix', 'analytics', 'api']
            },
            {
                id: '8',
                title: 'Install HTTP/Fetch MCP server for enhanced API integration',
                description: 'Install and configure the HTTP/Fetch MCP server to provide enhanced API calling capabilities',
                priority: 'medium',
                status: 'pending',
                capabilities: ['backend-development', 'api-integration'],
                estimatedTime: '1h',
                dependencies: ['1'],
                assignedAgent: null,
                tags: ['infrastructure', 'api', 'mcp']
            },
            {
                id: '22',
                title: 'Create front-end chat integration for locally hosted Ulana AI system',
                description: 'Build a modern chat interface with real-time messaging capabilities for the Ulana AI system',
                priority: 'low',
                status: 'pending',
                capabilities: ['frontend-development', 'ui-development'],
                estimatedTime: '4h',
                dependencies: ['1'],
                assignedAgent: null,
                tags: ['chat', 'ai', 'integration']
            },
            {
                id: '25.1',
                title: 'Create Agent Capability Registry Module',
                description: 'Develop a JSON-based agent registry system with capability mapping and role definitions',
                priority: 'high',
                status: 'done',
                capabilities: ['backend-development', 'coordination'],
                estimatedTime: '2h',
                dependencies: [],
                assignedAgent: 'orchestrator-agent',
                tags: ['coordination', 'registry', 'completed']
            }
        ];
        
        // Apply filters
        let filteredTasks = allTasks;
        
        if (filter.status) {
            filteredTasks = filteredTasks.filter(task => task.status === filter.status);
        }
        
        if (filter.priority) {
            filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
        }
        
        if (filter.capabilities) {
            filteredTasks = filteredTasks.filter(task => 
                task.capabilities.some(cap => filter.capabilities.includes(cap))
            );
        }
        
        if (filter.unassigned) {
            filteredTasks = filteredTasks.filter(task => !task.assignedAgent);
        }
        
        return filteredTasks;
    }

    /**
     * Simulate task assignment (replace with real coordination API)
     */
    async simulateTaskAssignment(assignmentData) {
        const { taskId, agentId, task } = assignmentData;
        
        // Simulate API delay and processing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`Simulating task assignment: Task ${taskId} → Agent ${agentId}`);
        
        // In real implementation, this would:
        // 1. Validate agent capabilities vs task requirements
        // 2. Check agent availability and workload
        // 3. Update coordination system
        // 4. Notify agent of new assignment
        // 5. Update TaskMaster with assignment metadata
        
        return {
            success: true,
            assignmentId: `assign_${Date.now()}`,
            taskId,
            agentId,
            assignedAt: new Date().toISOString(),
            estimatedCompletion: new Date(Date.now() + (2 * 60 * 60 * 1000)).toISOString(), // 2 hours
            metadata: {
                routing: 'automatic',
                priority: task.priority,
                capabilities: task.capabilities
            }
        };
    }

    /**
     * Simulate agent status update
     */
    async simulateStatusUpdate(statusData) {
        const { agentId, status } = statusData;
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log(`Simulating status update: Agent ${agentId} → ${status}`);
        
        return {
            success: true,
            agentId,
            previousStatus: 'active', // Would be fetched from current state
            newStatus: status,
            updatedAt: new Date().toISOString()
        };
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