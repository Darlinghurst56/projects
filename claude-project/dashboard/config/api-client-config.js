/**
 * Reusable API Client Configurations
 * Standardized configurations for all dashboard API integrations
 * 
 * Integration Specialist Implementation
 * Supports Control D, TaskMaster, Agent Coordination, and external APIs
 */

/**
 * Base API Configuration Template
 * Common settings that apply to all API clients
 */
const BaseConfig = {
  // Request timeout settings
  timeout: 10000, // 10 seconds default
  
  // Retry configuration
  retries: 3,
  retryDelay: 1000, // 1 second between retries
  retryOn: [408, 429, 500, 502, 503, 504], // HTTP status codes to retry
  
  // Caching settings
  cache: true,
  cacheTtl: 300000, // 5 minutes default cache
  
  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    perWindow: 60000 // per minute
  },
  
  // Request headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'ControlD-Dashboard/1.0'
  },
  
  // Environment detection
  isDevelopment: () => window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1',
  
  // Error handling
  errorHandler: (error, context) => {
    console.error(`API Error in ${context}:`, error);
    
    // Emit error event for UI handling
    if (window.eventBus) {
      window.eventBus.emit('api:error', {
        context,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

/**
 * Control D API Configuration
 * For DNS filtering and connection management
 */
const ControlDConfig = {
  ...BaseConfig,
  
  // API endpoint
  baseUrl: 'https://api.controld.com/v1',
  
  // Authentication
  auth: {
    type: 'bearer',
    tokenHeader: 'Authorization',
    tokenPrefix: 'Bearer ',
    apiKeyParam: 'api_key' // fallback for query param auth
  },
  
  // Specific timeout for Control D operations
  timeout: 15000, // DNS operations may take longer
  
  // Cache settings for different endpoints
  caching: {
    analytics: { ttl: 300000, enabled: true }, // 5 minutes
    status: { ttl: 30000, enabled: true },     // 30 seconds
    config: { ttl: 600000, enabled: true },    // 10 minutes
    pause: { ttl: 0, enabled: false }          // No cache for control operations
  },
  
  // Mock data for development
  mockData: {
    analytics: {
      enabled: true,
      data: {
        queries: Math.floor(Math.random() * 10000),
        blocked: Math.floor(Math.random() * 1000),
        uptime: '99.9%',
        responseTime: `${Math.floor(Math.random() * 50 + 10)}ms`
      }
    },
    status: {
      enabled: true,
      data: {
        connected: true,
        paused: false,
        lastCheck: new Date().toISOString(),
        server: 'controld-1.example.com'
      }
    }
  },
  
  // Endpoints configuration
  endpoints: {
    analytics: '/analytics',
    status: '/status',
    pause: '/control/pause',
    resume: '/control/resume',
    test: '/connection/test',
    config: '/config'
  }
};

/**
 * TaskMaster API Configuration
 * For task management and coordination
 */
const TaskMasterConfig = {
  ...BaseConfig,
  
  // API endpoint (typically on same server)
  baseUrl: window.location.origin + '/api/taskmaster',
  
  // No authentication needed for local TaskMaster
  auth: {
    type: 'none'
  },
  
  // Longer timeout for complex operations
  timeout: 30000, // TaskMaster operations can be complex
  
  // Cache settings
  caching: {
    tasks: { ttl: 60000, enabled: true },      // 1 minute
    tags: { ttl: 300000, enabled: true },      // 5 minutes
    status: { ttl: 30000, enabled: true }      // 30 seconds
  },
  
  // Mock data for development
  mockData: {
    enabled: true,
    tags: [
      { name: 'master', tasks: 8, completed: 3 },
      { name: 'ui-developer', tasks: 7, completed: 3 },
      { name: 'qa-specialist', tasks: 6, completed: 1 },
      { name: 'server-agent', tasks: 8, completed: 4 }
    ]
  },
  
  // Endpoints
  endpoints: {
    tasks: '/tasks',
    tags: '/tags',
    updateTask: '/update-task',
    useTag: '/use-tag',
    nextTask: '/next-task',
    setStatus: '/set-status'
  }
};

/**
 * Agent Coordination API Configuration
 * For multi-agent task assignment and monitoring
 */
const AgentCoordinationConfig = {
  ...BaseConfig,
  
  // File-based coordination system
  baseUrl: window.location.origin + '/api/coordination',
  
  // Authentication for coordination operations
  auth: {
    type: 'session',
    sessionRequired: true
  },
  
  // Real-time updates
  polling: {
    enabled: true,
    interval: 30000, // 30 seconds
    endpoints: ['agents', 'tasks', 'assignments']
  },
  
  // Cache settings
  caching: {
    agents: { ttl: 30000, enabled: true },     // 30 seconds
    assignments: { ttl: 15000, enabled: true }, // 15 seconds
    registry: { ttl: 300000, enabled: true }   // 5 minutes
  },
  
  // Mock data
  mockData: {
    enabled: true,
    agents: [
      { id: 'server-agent', status: 'active', currentTask: 'port-management' },
      { id: 'ui-developer', status: 'active', currentTask: 'widget-development' },
      { id: 'qa-specialist', status: 'idle', currentTask: null }
    ]
  },
  
  // Endpoints
  endpoints: {
    agents: '/agents',
    tasks: '/tasks',
    assign: '/assign',
    status: '/status',
    registry: '/registry'
  }
};

/**
 * External APIs Configuration
 * For third-party integrations (weather, news, etc.)
 */
const ExternalAPIsConfig = {
  ...BaseConfig,
  
  // Different timeout for external APIs
  timeout: 8000,
  
  // More aggressive caching for external data
  cacheTtl: 600000, // 10 minutes
  
  // CORS handling
  cors: {
    enabled: true,
    credentials: 'omit'
  },
  
  // Specific configurations for different services
  services: {
    weather: {
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      auth: { type: 'apikey', param: 'appid' },
      endpoints: {
        current: '/weather',
        forecast: '/forecast'
      },
      cache: { ttl: 600000 } // 10 minutes
    },
    
    news: {
      baseUrl: 'https://newsapi.org/v2',
      auth: { type: 'apikey', header: 'X-API-Key' },
      endpoints: {
        headlines: '/top-headlines',
        everything: '/everything'
      },
      cache: { ttl: 900000 } // 15 minutes
    },
    
    system: {
      baseUrl: 'https://httpbin.org',
      auth: { type: 'none' },
      endpoints: {
        test: '/get',
        post: '/post',
        status: '/status'
      },
      cache: { ttl: 60000 } // 1 minute
    }
  }
};

/**
 * Configuration Selector
 * Factory function to get the appropriate configuration
 */
function getApiConfig(type, environment = 'auto') {
  // Auto-detect environment if not specified
  if (environment === 'auto') {
    environment = BaseConfig.isDevelopment() ? 'development' : 'production';
  }
  
  const configs = {
    controld: ControlDConfig,
    taskmaster: TaskMasterConfig,
    coordination: AgentCoordinationConfig,
    external: ExternalAPIsConfig,
    base: BaseConfig
  };
  
  const config = configs[type];
  if (!config) {
    throw new Error(`Unknown API configuration type: ${type}`);
  }
  
  // Apply environment-specific overrides
  if (environment === 'development') {
    return {
      ...config,
      // Enable mock data in development
      useMockData: config.mockData?.enabled || false,
      // Reduce cache times in development
      cacheTtl: Math.min(config.cacheTtl || 300000, 60000),
      // More verbose error reporting
      verbose: true
    };
  }
  
  return config;
}

/**
 * API Client Factory
 * Creates configured API clients based on type
 */
class APIClientFactory {
  static create(type, customConfig = {}) {
    const baseConfig = getApiConfig(type);
    const config = { ...baseConfig, ...customConfig };
    
    return new ConfiguredAPIClient(config);
  }
}

/**
 * Configured API Client
 * Generic API client with configuration support
 */
class ConfiguredAPIClient {
  constructor(config) {
    this.config = config;
    this.cache = new Map();
    this.cacheTimers = new Map();
    this.requestCount = 0;
    this.windowStart = Date.now();
  }
  
  /**
   * Make an API request with full configuration support
   */
  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const requestOptions = this.buildRequestOptions(options);
    
    // Check rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }
    
    // Check cache
    if (this.config.cache && options.method !== 'POST' && options.method !== 'PUT') {
      const cached = this.getFromCache(url);
      if (cached) {
        return cached;
      }
    }
    
    // Use mock data in development if configured
    if (this.config.useMockData && this.config.mockData) {
      const mockResponse = this.getMockResponse(endpoint);
      if (mockResponse) {
        return mockResponse;
      }
    }
    
    // Make actual request with retry logic
    return this.requestWithRetry(url, requestOptions);
  }
  
  /**
   * Build full URL from endpoint
   */
  buildUrl(endpoint) {
    const baseUrl = this.config.baseUrl || '';
    
    // Handle endpoint as object (for complex configurations)
    if (typeof endpoint === 'object') {
      return baseUrl + endpoint.path;
    }
    
    // Handle endpoint from config
    if (this.config.endpoints && this.config.endpoints[endpoint]) {
      return baseUrl + this.config.endpoints[endpoint];
    }
    
    // Handle direct endpoint string
    return baseUrl + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
  }
  
  /**
   * Build request options with authentication and headers
   */
  buildRequestOptions(options) {
    const requestOptions = {
      method: options.method || 'GET',
      headers: { ...this.config.headers, ...options.headers },
      timeout: options.timeout || this.config.timeout,
      ...options
    };
    
    // Add authentication
    if (this.config.auth) {
      this.addAuthentication(requestOptions);
    }
    
    // Handle CORS
    if (this.config.cors) {
      requestOptions.mode = 'cors';
      requestOptions.credentials = this.config.cors.credentials || 'omit';
    }
    
    return requestOptions;
  }
  
  /**
   * Add authentication to request
   */
  addAuthentication(requestOptions) {
    const auth = this.config.auth;
    
    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          requestOptions.headers[auth.tokenHeader || 'Authorization'] = 
            `${auth.tokenPrefix || 'Bearer '}${auth.token}`;
        }
        break;
        
      case 'apikey':
        if (auth.key) {
          if (auth.header) {
            requestOptions.headers[auth.header] = auth.key;
          } else if (auth.param) {
            // Add to URL parameters (handled by caller)
            requestOptions._apiKeyParam = { [auth.param]: auth.key };
          }
        }
        break;
        
      case 'session':
        // Session-based auth (cookies handled automatically)
        requestOptions.credentials = 'include';
        break;
    }
  }
  
  /**
   * Rate limiting check
   */
  checkRateLimit() {
    if (!this.config.rateLimit) return true;
    
    const now = Date.now();
    const windowDuration = this.config.rateLimit.perWindow;
    
    // Reset window if needed
    if (now - this.windowStart > windowDuration) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    // Check if under limit
    if (this.requestCount >= this.config.rateLimit.maxRequests) {
      return false;
    }
    
    this.requestCount++;
    return true;
  }
  
  /**
   * Cache management
   */
  getFromCache(key) {
    const entry = this.cache.get(key);
    return entry ? entry.value : null;
  }
  
  setCache(key, value, ttl) {
    this.cache.set(key, { value, timestamp: Date.now() });
    
    // Set expiration timer
    if (this.cacheTimers.has(key)) {
      clearTimeout(this.cacheTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.cacheTimers.delete(key);
    }, ttl || this.config.cacheTtl);
    
    this.cacheTimers.set(key, timer);
  }
  
  /**
   * Get mock response for development
   */
  getMockResponse(endpoint) {
    if (!this.config.mockData || !this.config.mockData.enabled) {
      return null;
    }
    
    // Simulate network delay
    return new Promise(resolve => {
      setTimeout(() => {
        const mockData = this.config.mockData.data || this.config.mockData;
        resolve(mockData[endpoint] || { mock: true, endpoint });
      }, Math.random() * 500 + 100); // 100-600ms delay
    });
  }
  
  /**
   * Request with retry logic
   */
  async requestWithRetry(url, options) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        // Check if we should retry based on status
        if (this.config.retryOn && this.config.retryOn.includes(response.status)) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Parse response
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        // Cache successful response
        if (this.config.cache && options.method === 'GET') {
          this.setCache(url, data);
        }
        
        return data;
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on last attempt
        if (attempt === this.config.retries) {
          break;
        }
        
        // Wait before retry
        if (this.config.retryDelay) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * (attempt + 1))
          );
        }
      }
    }
    
    // Handle final error
    if (this.config.errorHandler) {
      this.config.errorHandler(lastError, `${this.config.baseUrl}${url}`);
    }
    
    throw lastError;
  }
}

// Export configurations and factory
export {
  BaseConfig,
  ControlDConfig,
  TaskMasterConfig,
  AgentCoordinationConfig,
  ExternalAPIsConfig,
  getApiConfig,
  APIClientFactory,
  ConfiguredAPIClient
};

// Global access for non-module environments
if (typeof window !== 'undefined') {
  window.APIConfig = {
    getConfig: getApiConfig,
    createClient: APIClientFactory.create,
    BaseConfig,
    ControlDConfig,
    TaskMasterConfig,
    AgentCoordinationConfig,
    ExternalAPIsConfig
  };
}