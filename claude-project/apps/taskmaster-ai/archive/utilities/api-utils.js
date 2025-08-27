/**
 * API Configuration Utilities
 * Helper functions and convenience methods for API client usage
 * 
 * Integration Specialist Implementation
 */

import { APIClientFactory, getApiConfig } from './api-client-config.js';

/**
 * Pre-configured API clients for common use cases
 */
class DashboardAPIClients {
  constructor() {
    this.clients = {};
    this.initialized = false;
  }
  
  /**
   * Initialize all API clients
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Create Control D client
      this.clients.controld = APIClientFactory.create('controld');
      
      // Create TaskMaster client
      this.clients.taskmaster = APIClientFactory.create('taskmaster');
      
      // Create Agent Coordination client
      this.clients.coordination = APIClientFactory.create('coordination');
      
      // Create External APIs client
      this.clients.external = APIClientFactory.create('external');
      
      this.initialized = true;
      
      // Emit initialization event
      if (window.eventBus) {
        window.eventBus.emit('api:clients:initialized', {
          clients: Object.keys(this.clients),
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('✅ API clients initialized:', Object.keys(this.clients));
      
    } catch (error) {
      console.error('❌ Failed to initialize API clients:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific API client
   */
  getClient(type) {
    if (!this.initialized) {
      throw new Error('API clients not initialized. Call initialize() first.');
    }
    
    if (!this.clients[type]) {
      throw new Error(`Unknown API client type: ${type}`);
    }
    
    return this.clients[type];
  }
  
  /**
   * Control D API Methods
   */
  async getControlDAnalytics(timeRange = '24h') {
    const client = this.getClient('controld');
    return await client.request('analytics', {
      method: 'GET',
      headers: { 'X-Time-Range': timeRange }
    });
  }
  
  async getControlDStatus() {
    const client = this.getClient('controld');
    return await client.request('status');
  }
  
  async pauseControlD(duration = null) {
    const client = this.getClient('controld');
    return await client.request('pause', {
      method: 'POST',
      body: JSON.stringify({ duration })
    });
  }
  
  async resumeControlD() {
    const client = this.getClient('controld');
    return await client.request('resume', {
      method: 'POST'
    });
  }
  
  async testControlDConnection() {
    const client = this.getClient('controld');
    return await client.request('test', {
      method: 'POST'
    });
  }
  
  /**
   * TaskMaster API Methods
   */
  async getTaskMasterTags() {
    const client = this.getClient('taskmaster');
    return await client.request('tags');
  }
  
  async getTaskMasterTasks(tag = null) {
    const client = this.getClient('taskmaster');
    const url = tag ? `tasks?tag=${encodeURIComponent(tag)}` : 'tasks';
    return await client.request(url);
  }
  
  async updateTaskMasterTask(taskId, prompt) {
    const client = this.getClient('taskmaster');
    return await client.request('updateTask', {
      method: 'POST',
      body: JSON.stringify({ taskId, prompt })
    });
  }
  
  async switchTaskMasterTag(tagName) {
    const client = this.getClient('taskmaster');
    return await client.request('useTag', {
      method: 'POST',
      body: JSON.stringify({ tagName })
    });
  }
  
  async getNextTaskMasterTask() {
    const client = this.getClient('taskmaster');
    return await client.request('nextTask');
  }
  
  /**
   * Agent Coordination API Methods
   */
  async getAgents() {
    const client = this.getClient('coordination');
    return await client.request('agents');
  }
  
  async assignTask(taskId, agentId) {
    const client = this.getClient('coordination');
    return await client.request('assign', {
      method: 'POST',
      body: JSON.stringify({ taskId, agentId })
    });
  }
  
  async updateAgentStatus(agentId, status, metadata = {}) {
    const client = this.getClient('coordination');
    return await client.request('status', {
      method: 'POST',
      body: JSON.stringify({ agentId, status, metadata })
    });
  }
  
  /**
   * External API Methods
   */
  async getWeatherData(city = 'London', apiKey = null) {
    const client = this.getClient('external');
    const config = getApiConfig('external');
    
    if (!apiKey && config.useMockData) {
      // Return mock weather data
      return {
        name: city,
        main: {
          temp: Math.round(15 + Math.random() * 20),
          feels_like: Math.round(15 + Math.random() * 20),
          humidity: Math.round(40 + Math.random() * 40)
        },
        weather: [{
          main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
          description: 'Mock weather data'
        }],
        _mock: true
      };
    }
    
    const weatherConfig = config.services.weather;
    const url = `${weatherConfig.baseUrl}${weatherConfig.endpoints.current}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    
    return await client.request(url);
  }
  
  async getNewsData(category = 'technology', apiKey = null) {
    const client = this.getClient('external');
    const config = getApiConfig('external');
    
    if (!apiKey && config.useMockData) {
      // Return mock news data
      return {
        status: 'ok',
        articles: [
          { title: 'Mock Tech News 1', description: 'Mock tech article' },
          { title: 'Mock Tech News 2', description: 'Another mock article' }
        ],
        _mock: true
      };
    }
    
    const newsConfig = config.services.news;
    const url = `${newsConfig.baseUrl}${newsConfig.endpoints.headlines}?category=${category}&apiKey=${apiKey}`;
    
    return await client.request(url);
  }
  
  /**
   * System Health Check
   */
  async checkSystemHealth() {
    const results = {
      timestamp: new Date().toISOString(),
      services: {},
      overall: 'unknown'
    };
    
    // Test each service
    const services = ['controld', 'taskmaster', 'coordination'];
    
    for (const service of services) {
      try {
        const client = this.getClient(service);
        const startTime = Date.now();
        
        // Try a simple request
        await client.request('status');
        
        const duration = Date.now() - startTime;
        results.services[service] = {
          status: 'healthy',
          responseTime: duration
        };
      } catch (error) {
        results.services[service] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    // Determine overall health
    const healthyServices = Object.values(results.services)
      .filter(s => s.status === 'healthy').length;
    
    if (healthyServices === services.length) {
      results.overall = 'healthy';
    } else if (healthyServices > 0) {
      results.overall = 'degraded';
    } else {
      results.overall = 'critical';
    }
    
    return results;
  }
  
  /**
   * Bulk data refresh for dashboard
   */
  async refreshDashboardData() {
    try {
      const refreshTasks = [
        this.getControlDStatus(),
        this.getTaskMasterTags(),
        this.getAgents()
      ];
      
      const results = await Promise.allSettled(refreshTasks);
      
      const data = {
        controlD: results[0].status === 'fulfilled' ? results[0].value : null,
        taskMaster: results[1].status === 'fulfilled' ? results[1].value : null,
        agents: results[2].status === 'fulfilled' ? results[2].value : null,
        errors: results.filter(r => r.status === 'rejected').map(r => r.reason.message),
        timestamp: new Date().toISOString()
      };
      
      // Emit refresh event
      if (window.eventBus) {
        window.eventBus.emit('dashboard:data:refreshed', data);
      }
      
      return data;
    } catch (error) {
      console.error('Dashboard data refresh failed:', error);
      throw error;
    }
  }
}

/**
 * Configuration Management Utilities
 */
class ConfigManager {
  constructor() {
    this.configs = new Map();
    this.overrides = new Map();
  }
  
  /**
   * Register a custom configuration
   */
  registerConfig(name, config) {
    this.configs.set(name, config);
  }
  
  /**
   * Set configuration overrides
   */
  setOverrides(type, overrides) {
    this.overrides.set(type, overrides);
  }
  
  /**
   * Get configuration with overrides applied
   */
  getConfig(type, applyOverrides = true) {
    let config = getApiConfig(type);
    
    // Apply custom config if exists
    if (this.configs.has(type)) {
      config = { ...config, ...this.configs.get(type) };
    }
    
    // Apply overrides if requested
    if (applyOverrides && this.overrides.has(type)) {
      config = { ...config, ...this.overrides.get(type) };
    }
    
    return config;
  }
  
  /**
   * Create client with custom configuration
   */
  createClient(type, customConfig = {}) {
    const config = this.getConfig(type);
    const finalConfig = { ...config, ...customConfig };
    
    return APIClientFactory.create(type, finalConfig);
  }
}

/**
 * API Error Handler Utilities
 */
class APIErrorHandler {
  constructor() {
    this.errorHandlers = new Map();
    this.globalHandler = null;
  }
  
  /**
   * Register error handler for specific API type
   */
  registerHandler(type, handler) {
    this.errorHandlers.set(type, handler);
  }
  
  /**
   * Set global error handler
   */
  setGlobalHandler(handler) {
    this.globalHandler = handler;
  }
  
  /**
   * Handle error with appropriate handler
   */
  handleError(type, error, context) {
    // Try specific handler first
    if (this.errorHandlers.has(type)) {
      return this.errorHandlers.get(type)(error, context);
    }
    
    // Fall back to global handler
    if (this.globalHandler) {
      return this.globalHandler(error, context, type);
    }
    
    // Default handling
    console.error(`API Error [${type}] in ${context}:`, error);
    
    // Emit error event
    if (window.eventBus) {
      window.eventBus.emit('api:error', {
        type,
        context,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Create global instances
const dashboardAPIClients = new DashboardAPIClients();
const configManager = new ConfigManager();
const errorHandler = new APIErrorHandler();

// Export utilities
export {
  DashboardAPIClients,
  ConfigManager,
  APIErrorHandler,
  dashboardAPIClients,
  configManager,
  errorHandler
};

// Global access for non-module environments
if (typeof window !== 'undefined') {
  window.DashboardAPI = dashboardAPIClients;
  window.APIConfigManager = configManager;
  window.APIErrorHandler = errorHandler;
  
  // Auto-initialize if requested
  if (window.AUTO_INIT_API !== false) {
    dashboardAPIClients.initialize().catch(console.error);
  }
}