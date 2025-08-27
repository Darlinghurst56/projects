/**
 * TaskMaster API Client
 * Provides integration with the TaskMaster API for dashboard widgets
 */

class TaskMasterApiClient {
    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    async getWithCache(endpoint) {
        const cacheKey = endpoint;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        const data = await this.makeRequest(endpoint);
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    }

    // Health and status
    async getHealth() {
        return await this.getWithCache('/api/health');
    }

    // Task management
    async getTasks(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/api/tasks${queryString ? '?' + queryString : ''}`;
        return await this.getWithCache(endpoint);
    }

    async getTask(id) {
        return await this.getWithCache(`/api/tasks/${id}`);
    }

    async claimTask(id) {
        return await this.makeRequest(`/api/tasks/${id}/claim`, {
            method: 'POST'
        });
    }

    // Agent management
    async getAgents() {
        return await this.getWithCache('/api/agents');
    }

    // Coordination
    async getCoordinationStatus() {
        return await this.getWithCache('/api/coordination/status');
    }

    async getCoordinationPriority() {
        return await this.getWithCache('/api/coordination/priority');
    }

    // Sync operations
    async getSyncStatus() {
        return await this.getWithCache('/api/sync/status');
    }

    async triggerSync() {
        return await this.makeRequest('/api/sync/taskmaster', {
            method: 'POST'
        });
    }

    // Dashboard-specific data aggregation
    async getDashboardData() {
        try {
            const [health, tasks, agents, coordination] = await Promise.all([
                this.getHealth(),
                this.getTasks({ limit: 10 }),
                this.getAgents(),
                this.getCoordinationStatus()
            ]);

            return {
                health,
                tasks: tasks.tasks || [],
                stats: tasks.stats || {},
                agents: agents.agents || [],
                coordination,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            return this.getEmptyDashboardData();
        }
    }

    getEmptyDashboardData() {
        return {
            health: { status: 'unknown', tasks: 0, agents: 0 },
            tasks: [],
            stats: { total: 0, completed: 0, inProgress: 0, pending: 0 },
            agents: [],
            coordination: { totalAgents: 0, availableAgents: 0 },
            timestamp: new Date().toISOString()
        };
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Mock Control D API methods for compatibility
    async getProfile() {
        const agents = await this.getAgents();
        return {
            name: 'TaskMaster Dashboard',
            status: 'active',
            agents: agents.agents || [],
            total_agents: agents.totalAgents || 0
        };
    }

    async getDevices() {
        const coordination = await this.getCoordinationStatus();
        return {
            devices: coordination.agents || [],
            total: coordination.totalAgents || 0
        };
    }

    async getAnalytics(timeRange = '24h') {
        const tasks = await this.getTasks();
        const stats = tasks.stats || {};
        
        return {
            timeRange,
            total_queries: stats.total || 0,
            blocked_queries: stats.completed || 0,
            allowed_queries: stats.pending || 0,
            top_blocked: [],
            top_allowed: [],
            timestamp: new Date().toISOString()
        };
    }
}

// Make available globally for widget compatibility
window.TaskMasterApiClient = TaskMasterApiClient;
window.ControlDApiClient = TaskMasterApiClient; // Backward compatibility

// Export for ES6 modules
export default TaskMasterApiClient;