/**
 * API Integration Examples
 * Demonstrates how to use the reusable API client configurations
 * 
 * Integration Specialist Implementation
 */

/**
 * Example 1: Basic Control D Integration
 */
async function exampleControlDIntegration() {
  console.log('🔧 Example: Control D Integration');
  
  try {
    // Initialize API clients
    await window.DashboardAPI.initialize();
    
    // Get Control D status
    const status = await window.DashboardAPI.getControlDStatus();
    console.log('Control D Status:', status);
    
    // Get analytics data
    const analytics = await window.DashboardAPI.getControlDAnalytics('24h');
    console.log('Analytics (24h):', analytics);
    
    // Test connection
    const testResult = await window.DashboardAPI.testControlDConnection();
    console.log('Connection Test:', testResult);
    
  } catch (error) {
    console.error('Control D integration error:', error);
  }
}

/**
 * Example 2: TaskMaster Integration
 */
async function exampleTaskMasterIntegration() {
  console.log('📋 Example: TaskMaster Integration');
  
  try {
    // Initialize API clients
    await window.DashboardAPI.initialize();
    
    // Get all tags
    const tags = await window.DashboardAPI.getTaskMasterTags();
    console.log('Available Tags:', tags);
    
    // Switch to a specific tag
    await window.DashboardAPI.switchTaskMasterTag('ui-developer');
    
    // Get tasks for current tag
    const tasks = await window.DashboardAPI.getTaskMasterTasks();
    console.log('Tasks:', tasks);
    
    // Get next available task
    const nextTask = await window.DashboardAPI.getNextTaskMasterTask();
    console.log('Next Task:', nextTask);
    
  } catch (error) {
    console.error('TaskMaster integration error:', error);
  }
}

/**
 * Example 3: Agent Coordination Integration
 */
async function exampleAgentCoordinationIntegration() {
  console.log('🤖 Example: Agent Coordination Integration');
  
  try {
    // Initialize API clients
    await window.DashboardAPI.initialize();
    
    // Get all agents
    const agents = await window.DashboardAPI.getAgents();
    console.log('Available Agents:', agents);
    
    // Update agent status
    await window.DashboardAPI.updateAgentStatus('ui-developer', 'active', {
      currentTask: 'widget-development',
      progress: 75
    });
    
    // Assign task to agent
    const assignment = await window.DashboardAPI.assignTask('task-123', 'ui-developer');
    console.log('Task Assignment:', assignment);
    
  } catch (error) {
    console.error('Agent coordination error:', error);
  }
}

/**
 * Example 4: Custom Configuration
 */
async function exampleCustomConfiguration() {
  console.log('⚙️ Example: Custom Configuration');
  
  try {
    // Create custom configuration for Control D
    const customConfig = {
      timeout: 20000, // 20 seconds
      retries: 5,
      cacheTtl: 120000, // 2 minutes
      headers: {
        'X-Custom-Header': 'MyDashboard',
        'X-Version': '1.0'
      }
    };
    
    // Create client with custom config
    const customClient = window.APIConfigManager.createClient('controld', customConfig);
    
    // Use custom client
    const result = await customClient.request('status');
    console.log('Custom client result:', result);
    
  } catch (error) {
    console.error('Custom configuration error:', error);
  }
}

/**
 * Example 5: Error Handling Setup
 */
function exampleErrorHandlingSetup() {
  console.log('🛡️ Example: Error Handling Setup');
  
  // Register Control D specific error handler
  window.APIErrorHandler.registerHandler('controld', (error, context) => {
    console.error(`Control D Error in ${context}:`, error);
    
    // Show user-friendly message
    if (window.eventBus) {
      window.eventBus.emit('notification:show', {
        type: 'error',
        title: 'Control D Connection Issue',
        message: 'Unable to connect to Control D service. Please check your connection.',
        timeout: 5000
      });
    }
  });
  
  // Register TaskMaster specific error handler
  window.APIErrorHandler.registerHandler('taskmaster', (error, context) => {
    console.error(`TaskMaster Error in ${context}:`, error);
    
    if (window.eventBus) {
      window.eventBus.emit('notification:show', {
        type: 'warning',
        title: 'TaskMaster Issue',
        message: 'TaskMaster is temporarily unavailable. Using cached data.',
        timeout: 3000
      });
    }
  });
  
  // Set global error handler for unhandled errors
  window.APIErrorHandler.setGlobalHandler((error, context, type) => {
    console.error(`API Error [${type}] in ${context}:`, error);
    
    // Log to analytics (if available)
    if (window.analytics) {
      window.analytics.track('api_error', {
        type,
        context,
        error: error.message
      });
    }
  });
}

/**
 * Example 6: Widget Integration Pattern
 */
class ExampleWidget {
  constructor(container) {
    this.container = container;
    this.apiClient = null;
    this.data = null;
    this.refreshInterval = null;
  }
  
  async init() {
    console.log('🔧 Example: Widget Integration Pattern');
    
    try {
      // Initialize API clients
      await window.DashboardAPI.initialize();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadData();
      
      // Set up auto-refresh
      this.startAutoRefresh();
      
      // Render widget
      this.render();
      
    } catch (error) {
      console.error('Widget initialization error:', error);
      this.renderError(error);
    }
  }
  
  setupEventListeners() {
    // Listen for API errors
    if (window.eventBus) {
      window.eventBus.on('api:error', (errorData) => {
        if (errorData.type === 'controld') {
          this.handleApiError(errorData);
        }
      });
      
      // Listen for refresh requests
      window.eventBus.on('widget:refresh', () => {
        this.loadData();
      });
    }
  }
  
  async loadData() {
    try {
      // Load data from multiple sources
      const [status, analytics] = await Promise.all([
        window.DashboardAPI.getControlDStatus(),
        window.DashboardAPI.getControlDAnalytics('1h')
      ]);
      
      this.data = { status, analytics };
      this.render();
      
    } catch (error) {
      console.error('Data loading error:', error);
      this.handleApiError({ error: error.message });
    }
  }
  
  startAutoRefresh() {
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadData();
    }, 30000);
  }
  
  render() {
    if (!this.data) return;
    
    this.container.innerHTML = `
      <div class="example-widget">
        <h3>Control D Status</h3>
        <div class="status ${this.data.status.connected ? 'connected' : 'disconnected'}">
          ${this.data.status.connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        <div class="analytics">
          <p>Queries: ${this.data.analytics.queries || 'N/A'}</p>
          <p>Blocked: ${this.data.analytics.blocked || 'N/A'}</p>
        </div>
      </div>
    `;
  }
  
  handleApiError(errorData) {
    this.container.innerHTML = `
      <div class="example-widget error">
        <h3>Connection Error</h3>
        <p>Unable to load Control D data</p>
        <button onclick="this.parentElement.dispatchEvent(new CustomEvent('retry'))">
          Retry
        </button>
      </div>
    `;
    
    // Handle retry
    this.container.addEventListener('retry', () => {
      this.loadData();
    });
  }
  
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

/**
 * Example 7: System Health Monitoring
 */
async function exampleSystemHealthMonitoring() {
  console.log('💚 Example: System Health Monitoring');
  
  try {
    // Initialize API clients
    await window.DashboardAPI.initialize();
    
    // Check system health
    const health = await window.DashboardAPI.checkSystemHealth();
    console.log('System Health:', health);
    
    // Monitor health continuously
    setInterval(async () => {
      try {
        const currentHealth = await window.DashboardAPI.checkSystemHealth();
        
        // Emit health status
        if (window.eventBus) {
          window.eventBus.emit('system:health:updated', currentHealth);
        }
        
        // Alert on critical issues
        if (currentHealth.overall === 'critical') {
          console.warn('🚨 System health critical!', currentHealth);
        }
        
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 60000); // Check every minute
    
  } catch (error) {
    console.error('Health monitoring setup error:', error);
  }
}

/**
 * Example 8: Bulk Data Operations
 */
async function exampleBulkDataOperations() {
  console.log('📊 Example: Bulk Data Operations');
  
  try {
    // Initialize API clients
    await window.DashboardAPI.initialize();
    
    // Refresh all dashboard data
    const dashboardData = await window.DashboardAPI.refreshDashboardData();
    console.log('Dashboard Data:', dashboardData);
    
    // Process data for widgets
    const widgetData = {
      controlD: {
        status: dashboardData.controlD?.connected ? 'online' : 'offline',
        lastUpdate: new Date().toISOString()
      },
      taskMaster: {
        totalTags: dashboardData.taskMaster?.length || 0,
        activeTags: dashboardData.taskMaster?.filter(tag => tag.tasks > 0).length || 0
      },
      agents: {
        total: dashboardData.agents?.length || 0,
        active: dashboardData.agents?.filter(agent => agent.status === 'active').length || 0
      }
    };
    
    // Emit processed data
    if (window.eventBus) {
      window.eventBus.emit('dashboard:widgets:data', widgetData);
    }
    
    console.log('Processed Widget Data:', widgetData);
    
  } catch (error) {
    console.error('Bulk data operation error:', error);
  }
}

/**
 * Example Usage Functions for Testing
 */
const APIExamples = {
  // Run all examples
  async runAll() {
    console.log('🚀 Running All API Integration Examples\n');
    
    // Set up error handling first
    exampleErrorHandlingSetup();
    
    // Run examples sequentially
    await exampleControlDIntegration();
    await exampleTaskMasterIntegration();
    await exampleAgentCoordinationIntegration();
    await exampleCustomConfiguration();
    await exampleSystemHealthMonitoring();
    await exampleBulkDataOperations();
    
    console.log('\n✅ All examples completed');
  },
  
  // Run specific example
  async run(exampleName) {
    const examples = {
      'controld': exampleControlDIntegration,
      'taskmaster': exampleTaskMasterIntegration,
      'coordination': exampleAgentCoordinationIntegration,
      'custom': exampleCustomConfiguration,
      'errors': exampleErrorHandlingSetup,
      'health': exampleSystemHealthMonitoring,
      'bulk': exampleBulkDataOperations
    };
    
    if (examples[exampleName]) {
      await examples[exampleName]();
    } else {
      console.error('Unknown example:', exampleName);
      console.log('Available examples:', Object.keys(examples));
    }
  },
  
  // Create example widget
  createWidget(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return null;
    }
    
    const widget = new ExampleWidget(container);
    widget.init();
    return widget;
  }
};

// Export for use
export {
  APIExamples,
  ExampleWidget,
  exampleControlDIntegration,
  exampleTaskMasterIntegration,
  exampleAgentCoordinationIntegration,
  exampleCustomConfiguration,
  exampleErrorHandlingSetup,
  exampleSystemHealthMonitoring,
  exampleBulkDataOperations
};

// Global access
if (typeof window !== 'undefined') {
  window.APIExamples = APIExamples;
  
  // Auto-run examples in development
  if (window.location.hostname === 'localhost' && window.RUN_API_EXAMPLES) {
    APIExamples.runAll().catch(console.error);
  }
}