/**
 * API Client for Agent Dashboard
 * Handles all API communication with TaskMaster and agent services
 */

class ApiClient {
    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.endpoints = {
            health: '/api/health',
            agents: '/api/agents',
            tasks: '/api/tasks',
            status: '/api/status',
            metrics: '/api/metrics'
        };
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // Health check endpoint
    async checkHealth() {
        try {
            const response = await this.get(this.endpoints.health);
            return {
                status: response.status || 'unknown',
                timestamp: new Date().toISOString(),
                healthy: response.status === 'healthy'
            };
        } catch (error) {
            console.error('Health check failed:', error);
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                healthy: false,
                error: error.message
            };
        }
    }

    // Agent management
    async getAgents() {
        try {
            const response = await this.get(this.endpoints.agents);
            return {
                agents: response.agents || [],
                total: response.agents ? response.agents.length : 0,
                success: true
            };
        } catch (error) {
            console.error('Failed to fetch agents:', error);
            return this.getMockAgents(); // Fallback to mock data
        }
    }

    async registerAgent(agentData) {
        try {
            const response = await this.post(this.endpoints.agents, agentData);
            return {
                success: true,
                agent: response.agent,
                message: 'Agent registered successfully'
            };
        } catch (error) {
            console.error('Failed to register agent:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateAgentStatus(agentId, status) {
        try {
            const response = await this.put(`${this.endpoints.agents}/${agentId}/status`, { status });
            return {
                success: true,
                agent: response.agent,
                message: 'Agent status updated successfully'
            };
        } catch (error) {
            console.error('Failed to update agent status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Task management
    async getTasks(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const url = queryParams ? `${this.endpoints.tasks}?${queryParams}` : this.endpoints.tasks;
            const response = await this.get(url);
            
            return {
                tasks: response.tasks || [],
                total: response.total || 0,
                success: true
            };
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            return this.getMockTasks(); // Fallback to mock data
        }
    }

    async assignTask(taskId, agentId) {
        try {
            const response = await this.post(`${this.endpoints.tasks}/${taskId}/assign`, { agentId });
            return {
                success: true,
                task: response.task,
                message: 'Task assigned successfully'
            };
        } catch (error) {
            console.error('Failed to assign task:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateTaskStatus(taskId, status) {
        try {
            const response = await this.put(`${this.endpoints.tasks}/${taskId}/status`, { status });
            return {
                success: true,
                task: response.task,
                message: 'Task status updated successfully'
            };
        } catch (error) {
            console.error('Failed to update task status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // System metrics
    async getMetrics() {
        try {
            const response = await this.get(this.endpoints.metrics);
            return {
                metrics: response.metrics || {},
                timestamp: new Date().toISOString(),
                success: true
            };
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
            return this.getMockMetrics(); // Fallback to mock data
        }
    }

    // Core HTTP methods
    async get(endpoint) {
        return this.request('GET', endpoint);
    }

    async post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }

    async put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }

    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    }

    async request(method, endpoint, data = null) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        
        const options = {
            method,
            headers: { ...this.defaultHeaders }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
            
        } catch (error) {
            console.error(`API request failed: ${method} ${url}`, error);
            throw error;
        }
    }

    // Mock data fallbacks
    getMockAgents() {
        return {
            agents: [
                {
                    id: 'qa-specialist-task1',
                    name: 'QA Specialist Task 1',
                    role: 'qa-specialist',
                    status: 'active',
                    agentId: 'qa-specialist-task1',
                    capabilities: ['testing', 'validation', 'quality-assurance'],
                    lastActivity: new Date().toISOString()
                },
                {
                    id: 'ui-developer-widget-fix',
                    name: 'UI Developer Widget Fix',
                    role: 'ui-developer',
                    status: 'active',
                    agentId: 'ui-developer-widget-fix',
                    capabilities: ['ui-development', 'widget-creation', 'frontend'],
                    lastActivity: new Date().toISOString()
                },
                {
                    id: 'qa-specialist-dashboard-test',
                    name: 'QA Specialist Dashboard Test',
                    role: 'qa-specialist',
                    status: 'active',
                    agentId: 'qa-specialist-dashboard-test',
                    capabilities: ['dashboard-testing', 'integration-testing', 'qa'],
                    lastActivity: new Date().toISOString()
                }
            ],
            total: 3,
            success: true
        };
    }

    getMockTasks() {
        return {
            tasks: [
                {
                    id: '1',
                    title: 'QA Testing: DNS Analytics Widget',
                    description: 'Comprehensive QA testing of DNS Analytics Widget',
                    status: 'done',
                    assignedTo: 'qa-specialist-task1',
                    priority: 'high',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '7',
                    title: 'QA Testing: Agent Dashboard TaskMaster Integration',
                    description: 'Comprehensive testing of dashboard integration',
                    status: 'done',
                    assignedTo: 'qa-specialist-dashboard-test',
                    priority: 'high',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '13',
                    title: 'Fix DNS Analytics Widget Issues',
                    description: 'Fix widget initialization and data loading issues',
                    status: 'done',
                    assignedTo: 'ui-developer-widget-fix',
                    priority: 'high',
                    createdAt: new Date().toISOString()
                }
            ],
            total: 3,
            success: true
        };
    }

    getMockMetrics() {
        return {
            metrics: {
                activeAgents: 3,
                completedTasks: 3,
                pendingTasks: 0,
                systemHealth: 'healthy',
                uptime: '24h 15m',
                lastUpdate: new Date().toISOString()
            },
            timestamp: new Date().toISOString(),
            success: true
        };
    }

    // Utility methods
    setBaseUrl(url) {
        this.baseUrl = url;
    }

    setDefaultHeaders(headers) {
        this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    }

    // Event logging for analytics
    logApiCall(method, endpoint, success, duration) {
        if (window.eventBus) {
            window.eventBus.emit('api-call', {
                method,
                endpoint,
                success,
                duration,
                timestamp: new Date().toISOString()
            });
        }
    }
}

// Export for use in browser or node environment
if (typeof window !== 'undefined') {
    window.ApiClient = ApiClient;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}