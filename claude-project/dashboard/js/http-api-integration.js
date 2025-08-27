/**
 * HTTP API Integration for Dashboard
 * Provides API integration utilities for dashboard widgets
 */

// Import the HTTP client configuration (this would normally be a proper import in a build system)
import '../../config/http-client.js';

/**
 * Dashboard API Manager
 * Manages API calls for dashboard widgets with proper error handling and caching
 */
class DashboardApiManager {
  constructor() {
    this.baseConfig = {
      timeout: 10000,
      retries: 3,
      cache: true
    };
    
    // Initialize cache
    this.cache = new Map();
    this.cacheTimers = new Map();
  }

  /**
   * Generic API call wrapper with error handling
   */
  async apiCall(url, options = {}) {
    const config = { ...this.baseConfig, ...options };
    
    // Check cache first
    if (config.cache) {
      const cached = this.getFromCache(url);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: config.timeout,
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Cache successful responses
      if (config.cache && (options.method || 'GET') === 'GET') {
        this.setCache(url, data, config.cacheTtl || 300000); // 5 minutes default
      }

      return data;
    } catch (error) {
      console.error(`API call failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Cache management
   */
  setCache(key, value, ttl = 300000) {
    this.cache.set(key, { value, timestamp: Date.now() });
    
    // Set expiration timer
    if (this.cacheTimers.has(key)) {
      clearTimeout(this.cacheTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.cacheTimers.delete(key);
    }, ttl);
    
    this.cacheTimers.set(key, timer);
  }

  getFromCache(key) {
    const entry = this.cache.get(key);
    return entry ? entry.value : null;
  }

  clearCache() {
    this.cache.clear();
    this.cacheTimers.forEach(timer => clearTimeout(timer));
    this.cacheTimers.clear();
  }

  /**
   * Weather API integration
   */
  async getWeatherData(city = 'London', apiKey = null) {
    if (!apiKey) {
      // Try to get from environment or use demo data
      return this.getDemoWeatherData(city);
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    
    try {
      return await this.apiCall(url, { cacheTtl: 600000 }); // 10 minutes cache
    } catch (error) {
      console.warn('Weather API failed, returning demo data:', error);
      return this.getDemoWeatherData(city);
    }
  }

  /**
   * News API integration
   */
  async getNewsData(category = 'technology', apiKey = null) {
    if (!apiKey) {
      return this.getDemoNewsData(category);
    }

    const url = `https://newsapi.org/v2/top-headlines?category=${category}&country=us&apiKey=${apiKey}`;
    
    try {
      return await this.apiCall(url, { cacheTtl: 900000 }); // 15 minutes cache
    } catch (error) {
      console.warn('News API failed, returning demo data:', error);
      return this.getDemoNewsData(category);
    }
  }

  /**
   * System status check
   */
  async getSystemStatus() {
    try {
      // Test various endpoints to determine system health
      const tests = [
        { name: 'HTTP Client', url: 'https://httpbin.org/get', timeout: 5000 },
        { name: 'JSON API', url: 'https://jsonplaceholder.typicode.com/posts/1', timeout: 5000 },
        { name: 'DNS Resolution', url: 'https://1.1.1.1/dns-query', timeout: 3000 }
      ];

      const results = await Promise.allSettled(
        tests.map(async test => {
          const start = Date.now();
          await this.apiCall(test.url, { timeout: test.timeout, cache: false });
          const duration = Date.now() - start;
          return { ...test, status: 'ok', duration };
        })
      );

      return {
        timestamp: new Date().toISOString(),
        overall: results.every(r => r.status === 'fulfilled') ? 'healthy' : 'degraded',
        services: results.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            return {
              ...tests[index],
              status: 'error',
              error: result.reason.message,
              duration: null
            };
          }
        })
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        overall: 'error',
        error: error.message,
        services: []
      };
    }
  }

  /**
   * MCP Server Status Check
   */
  async getMcpServerStatus() {
    // This would typically check MCP server endpoints
    // For now, return mock data showing configured servers
    return {
      timestamp: new Date().toISOString(),
      servers: [
        { name: 'fetch', status: 'active', type: 'HTTP Client' },
        { name: 'filesystem', status: 'active', type: 'File System' },
        { name: 'memory', status: 'active', type: 'Memory Store' },
        { name: 'github', status: 'active', type: 'GitHub API' },
        { name: 'task-master-ai', status: 'active', type: 'Task Management' }
      ],
      overall: 'operational'
    };
  }

  /**
   * Demo data generators
   */
  getDemoWeatherData(city) {
    return {
      name: city,
      main: {
        temp: Math.round(15 + Math.random() * 20),
        feels_like: Math.round(15 + Math.random() * 20),
        humidity: Math.round(40 + Math.random() * 40),
        pressure: Math.round(1000 + Math.random() * 50)
      },
      weather: [{
        main: ['Clear', 'Clouds', 'Rain', 'Snow'][Math.floor(Math.random() * 4)],
        description: 'Demo weather data',
        icon: '01d'
      }],
      wind: {
        speed: Math.round(Math.random() * 20),
        deg: Math.round(Math.random() * 360)
      },
      sys: {
        country: 'DEMO'
      },
      _demo: true
    };
  }

  getDemoNewsData(category) {
    const headlines = [
      'Breaking: New Technology Advances in AI',
      'Market Update: Tech Stocks Rise',
      'Innovation: Breakthrough in Quantum Computing',
      'Development: New Framework Released',
      'Research: Scientists Make Discovery'
    ];

    return {
      status: 'ok',
      totalResults: headlines.length,
      articles: headlines.map((title, index) => ({
        title,
        description: `Demo news article about ${category}`,
        url: `https://example.com/article-${index}`,
        urlToImage: `https://via.placeholder.com/300x200?text=News+${index + 1}`,
        publishedAt: new Date(Date.now() - index * 3600000).toISOString(),
        source: { name: 'Demo News' },
        _demo: true
      }))
    };
  }

  /**
   * API testing utilities
   */
  async testApiEndpoints() {
    console.log('🧪 Testing API endpoints...');
    
    const tests = [
      {
        name: 'Basic HTTP GET',
        test: () => this.apiCall('https://httpbin.org/get')
      },
      {
        name: 'JSON Placeholder',
        test: () => this.apiCall('https://jsonplaceholder.typicode.com/posts/1')
      },
      {
        name: 'System Status',
        test: () => this.getSystemStatus()
      },
      {
        name: 'Demo Weather',
        test: () => this.getDemoWeatherData('Test City')
      },
      {
        name: 'Demo News',
        test: () => this.getDemoNewsData('technology')
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        const start = Date.now();
        const result = await test.test();
        const duration = Date.now() - start;
        
        results.push({
          name: test.name,
          status: 'success',
          duration,
          data: result
        });
        
        console.log(`✅ ${test.name}: ${duration}ms`);
      } catch (error) {
        results.push({
          name: test.name,
          status: 'error',
          error: error.message
        });
        
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }

    return results;
  }
}

// Create global instance
window.dashboardApi = new DashboardApiManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DashboardApiManager };
}

export { DashboardApiManager };