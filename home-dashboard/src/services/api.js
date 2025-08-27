/**
 * @fileoverview Unified API Service Layer for Family Home Dashboard
 * 
 * This module provides a comprehensive API client optimized for family home use,
 * featuring intelligent caching, retry logic, circuit breaker patterns, and
 * family-oriented optimizations. Supports all dashboard services including
 * DNS monitoring, Google integrations, AI assistance, and system health.
 * 
 * Key Features:
 * - Intelligent caching with family-usage optimized TTL values
 * - Exponential backoff retry with different strategies per error type
 * - Unified error handling with family-friendly error messages
 * - Performance optimizations for single-family home environment
 * - Circuit breaker protection for external service failures
 * 
 * @author Home Dashboard Team
 * @version 2.0.0
 * @since 1.0.0
 * 
 * @example
 * // Basic usage
 * import { dnsApi, googleApi, authApi } from './api';
 * 
 * // Get DNS status with caching
 * const status = await dnsApi.getStatus();
 * 
 * // Send AI message
 * const response = await aiApi.sendMessage('Help with homework');
 */

// PROJECT: House AI - Family Home Page | SUBPROJECT: Unified Dashboard System

import axios from 'axios';

/**
 * Determines the appropriate API base URL for family home environment
 * 
 * This function intelligently detects the runtime environment and selects
 * the correct API endpoint. Supports both development (localhost) and
 * production (family server at 192.168.1.74) environments with automatic
 * detection based on browser hostname.
 * 
 * Priority order:
 * 1. Vite environment variables (VITE_API_BASE_URL)
 * 2. React/Node environment variables
 * 3. Family server detection via hostname
 * 4. Default localhost fallback
 * 
 * @function
 * @returns {string} The appropriate API base URL for current environment
 * 
 * @example
 * // Development: returns 'http://localhost:3000'
 * // Family server: returns 'http://192.168.1.74:3000'
 * const apiUrl = getApiBaseUrl();
 */
const getApiBaseUrl = () => {
  // Vite build system environment variable check (modern bundler approach)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }
  
  // Legacy React/Node.js environment variable fallback
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000';
  }
  
  // Family server production environment auto-detection
  // Detects when dashboard is accessed via family server IP
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === '192.168.1.74' || hostname.includes('192.168.1.74')) {
      return `http://${hostname}:3000`;
    }
  }
  
  // Safe fallback to localhost development environment
  return 'http://localhost:3000';
};

// Use the API base URL
const CLIENT_API_BASE = getApiBaseUrl();

/**
 * Simple in-memory cache optimized for single-family home environment
 * 
 * This cache implementation is designed specifically for family dashboard usage,
 * providing intelligent caching with TTL (time-to-live) management. Unlike
 * enterprise caching solutions, this is optimized for the smaller scale and
 * usage patterns of a family home environment.
 * 
 * Features:
 * - Automatic TTL expiration to ensure data freshness
 * - Pattern-based cache invalidation for related data
 * - Memory-efficient for home server environments
 * - Family-usage optimized cache sizes and TTL values
 * 
 * @class
 * @example
 * const cache = new ApiCache();
 * cache.set('user-data', userData, 300000); // Cache for 5 minutes
 * const data = cache.get('user-data');
 */
class ApiCache {
  /**
   * Initialize the cache with Map-based storage
   * 
   * Uses JavaScript Map objects for optimal performance in the
   * family home environment where cache sizes remain manageable.
   */
  constructor() {
    /** @type {Map<string, any>} Cache storage for API responses */
    this.cache = new Map();
    /** @type {Map<string, number>} TTL timestamps for cache entries */
    this.ttl = new Map();
  }

  /**
   * Retrieve cached value with automatic expiration handling
   * 
   * Checks if the cached value has expired and automatically cleans up
   * expired entries. Returns null for expired or non-existent keys.
   * 
   * @param {string} key - Cache key to retrieve
   * @returns {any|null} Cached value or null if expired/not found
   * 
   * @example
   * const userData = cache.get('user-profile');
   * if (userData) {
   *   // Use cached data
   * } else {
   *   // Fetch fresh data
   * }
   */
  get(key) {
    const now = Date.now();
    const expiry = this.ttl.get(key);
    
    // Check if entry has expired and clean it up
    if (expiry && now > expiry) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    
    return this.cache.get(key) || null;
  }

  /**
   * Store value in cache with TTL for family-optimized caching
   * 
   * Sets a value with time-to-live appropriate for family dashboard usage.
   * Default TTL is 1 minute, optimized for home environment where data
   * changes less frequently than enterprise environments.
   * 
   * @param {string} key - Cache key for storage
   * @param {any} value - Value to cache (API responses, computed data, etc.)
   * @param {number} [ttlMs=60000] - Time to live in milliseconds (default: 1 minute)
   * 
   * @example
   * // Cache DNS status for 30 seconds
   * cache.set('dns-status', dnsData, 30000);
   * 
   * // Cache calendar events for 2 minutes
   * cache.set('calendar-events', events, 120000);
   */
  set(key, value, ttlMs = 60000) {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }

  /**
   * Invalidate cache entries by pattern for intelligent cache management
   * 
   * Supports both exact string matching and RegExp patterns for flexible
   * cache invalidation. Useful for invalidating related cached data when
   * underlying data changes (e.g., invalidate all DNS cache when profile updates).
   * 
   * @param {string|RegExp} pattern - String key or RegExp pattern to match
   * 
   * @example
   * // Invalidate specific cache entry
   * cache.invalidate('user-profile');
   * 
   * // Invalidate all DNS-related cache entries
   * cache.invalidate(/dns/);
   * 
   * // Invalidate all Google API cache entries
   * cache.invalidate(/google-/);
   */
  invalidate(pattern) {
    if (typeof pattern === 'string') {
      // Exact string match - remove specific cache entry
      this.cache.delete(pattern);
      this.ttl.delete(pattern);
    } else if (pattern instanceof RegExp) {
      // Pattern match - remove all matching cache entries
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
          this.ttl.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cached data for fresh start
   * 
   * Useful for family logout scenarios or when switching between
   * family members with different data access levels.
   * 
   * @example
   * // Clear all cache on user logout
   * cache.clear();
   */
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  /**
   * Get current cache size for monitoring and debugging
   * 
   * @returns {number} Number of cached entries
   * 
   * @example
   * console.log(`Cache size: ${cache.size()} entries`);
   */
  size() {
    return this.cache.size;
  }
}

/** @type {ApiCache} Single cache instance optimized for family home environment */
const apiCache = new ApiCache();

/**
 * Cache configuration for different API endpoints optimized for family usage
 * 
 * These TTL values are specifically tuned for family home environment where:
 * - Data changes less frequently than enterprise environments
 * - Network latency is more consistent (local network)
 * - Multiple family members may access same data
 * - Balance between freshness and performance is family-friendly
 * 
 * @type {Object.<string, number>} Mapping of endpoint patterns to TTL milliseconds
 */
const CACHE_CONFIG = {
  // DNS endpoints - cache aggressively for home network stability
  'dns-status': 30000,    // 30 seconds - DNS status changes infrequently in home
  'dns-profile': 300000,  // 5 minutes - Profile configuration rarely changes
  'dns-analytics': 60000, // 1 minute - Analytics data can be slightly stale for family use
  
  // Google services - balance freshness with API rate limits for family use
  'google-calendar': 120000, // 2 minutes - Calendar updates aren't urgent for home coordination
  'google-gmail': 30000,     // 30 seconds - Email is more time-sensitive for family communications
  'google-drive': 300000,    // 5 minutes - Drive files don't change frequently in family context
  
  // System monitoring - moderate caching for home server monitoring
  'system-status': 15000,    // 15 seconds - System status for family awareness
  'system-health': 30000,    // 30 seconds - Health checks less critical for home use
  
  // AI service - cache for stable home usage patterns
  'ai-models': 600000,       // 10 minutes - Available models rarely change
  'ai-status': 30000,        // 30 seconds - Service availability status
};

// Helper to create cache key
const createCacheKey = (method, url, params = {}) => {
  const paramString = Object.keys(params).length > 0 ? JSON.stringify(params) : '';
  return `${method.toUpperCase()}_${url}_${paramString}`;
};

// Retry configuration for different types of failures
const RETRY_CONFIG = {
  // Network/Connection errors - retry aggressively
  network: {
    maxRetries: 3,
    baseDelay: 1000, // Start with 1 second
    backoffFactor: 2, // Exponential backoff
    maxDelay: 10000, // Cap at 10 seconds
  },
  // Server errors (5xx) - retry moderately
  serverError: {
    maxRetries: 2,
    baseDelay: 2000,
    backoffFactor: 1.5,
    maxDelay: 8000,
  },
  // Rate limit errors - retry with longer delays
  rateLimit: {
    maxRetries: 3,
    baseDelay: 5000,
    backoffFactor: 2,
    maxDelay: 30000,
  },
  // Default retry config for home environment
  default: {
    maxRetries: 2,
    baseDelay: 1500,
    backoffFactor: 2,
    maxDelay: 6000,
  }
};

// Determine retry strategy based on error type
const getRetryConfig = (error) => {
  if (!error.response) {
    // Network error
    return RETRY_CONFIG.network;
  }
  
  const status = error.response.status;
  if (status >= 500) {
    return RETRY_CONFIG.serverError;
  }
  if (status === 429) {
    return RETRY_CONFIG.rateLimit;
  }
  
  return RETRY_CONFIG.default;
};

// Enhanced request with retry logic
const requestWithRetry = async (requestFn, options = {}) => {
  const { retryConfig, onRetry } = options;
  
  let lastError;
  let retryCount = 0;
  
  // Use provided config or determine based on first error
  let config = retryConfig || RETRY_CONFIG.default;
  
  while (retryCount <= config.maxRetries) {
    try {
      const response = await requestFn();
      
      // Log successful retry if this isn't the first attempt
      if (retryCount > 0) {
        console.log(`✅ API request succeeded after ${retryCount} retries`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Update retry config based on error type if not provided
      if (!retryConfig) {
        config = getRetryConfig(error);
      }
      
      // Check if we should retry
      const shouldRetry = retryCount < config.maxRetries && isRetryableError(error);
      
      if (!shouldRetry) {
        break;
      }
      
      retryCount++;
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, retryCount - 1),
        config.maxDelay
      );
      
      console.warn(`⚠️ API request failed, retrying in ${delay}ms (attempt ${retryCount}/${config.maxRetries})`);
      console.warn(`   Error: ${error.message}`);
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error, retryCount, delay);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted
  console.error(`❌ API request failed after ${retryCount} retries`);
  throw lastError;
};

// Determine if error is retryable
const isRetryableError = (error) => {
  // Always retry network errors
  if (!error.response) {
    return true;
  }
  
  const status = error.response.status;
  
  // Don't retry client errors (4xx) except rate limiting
  if (status >= 400 && status < 500) {
    return status === 429; // Only retry rate limiting
  }
  
  // Retry server errors (5xx)
  if (status >= 500) {
    return true;
  }
  
  return false;
};

// Cache-aware request wrapper with retry logic for home environment
const cachedRequest = async (method, url, options = {}) => {
  const { params, cacheable = true, cacheKey: customKey, ttl, retryConfig } = options;
  
  // Skip caching for non-GET requests or when explicitly disabled
  if (method.toUpperCase() !== 'GET' || !cacheable) {
    return requestWithRetry(
      () => apiClient.request({ method, url, ...options }),
      { retryConfig }
    );
  }
  
  // Generate cache key
  const cacheKey = customKey || createCacheKey(method, url, params);
  
  // Try to get from cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log(`🚀 Cache hit for ${cacheKey}`);
    return cached;
  }
  
  // Make API request with retry logic
  console.log(`📡 Cache miss for ${cacheKey} - fetching from API`);
  const response = await requestWithRetry(
    () => apiClient.request({ method, url, ...options }),
    { 
      retryConfig,
      onRetry: (error, attempt, delay) => {
        console.log(`   Retrying cached request for ${cacheKey}...`);
      }
    }
  );
  
  // Determine TTL for this endpoint
  let cacheTtl = ttl;
  if (!cacheTtl) {
    // Auto-determine TTL based on endpoint
    for (const [pattern, defaultTtl] of Object.entries(CACHE_CONFIG)) {
      if (url.includes(pattern)) {
        cacheTtl = defaultTtl;
        break;
      }
    }
    cacheTtl = cacheTtl || 60000; // Default 1 minute for unknown endpoints
  }
  
  // Cache the response
  apiCache.set(cacheKey, response, cacheTtl);
  
  return response;
};

// Error types for consistent handling (matching server-side)
const ErrorTypes = {
  VALIDATION: 'ValidationError',
  UNAUTHORIZED: 'UnauthorizedError', 
  FORBIDDEN: 'ForbiddenError',
  NOT_FOUND: 'NotFoundError',
  SERVICE_UNAVAILABLE: 'ServiceUnavailableError',
  TIMEOUT: 'TimeoutError',
  INTERNAL: 'InternalServerError',
  EXTERNAL_SERVICE: 'ExternalServiceError',
};

// Parse API errors consistently
const parseApiError = (error) => {
  if (!error.response) {
    // Network error or request setup error
    return {
      type: ErrorTypes.SERVICE_UNAVAILABLE,
      message: 'Network error - please check your connection',
      statusCode: 0,
      isNetworkError: true,
      timestamp: new Date().toISOString(),
    };
  }

  const { status, data } = error.response;
  
  return {
    type: data?.type || ErrorTypes.INTERNAL,
    message: data?.error || data?.message || 'An error occurred',
    details: data?.details,
    statusCode: status,
    timestamp: data?.timestamp || new Date().toISOString(),
    isNetworkError: false,
  };
};

// Base API client configuration
const createApiClient = (baseURL = CLIENT_API_BASE) => {
  const client = axios.create({
    baseURL,
    timeout: 30000, // 30 seconds timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for auth
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for unified error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Parse error using unified error structure
      const parsedError = parseApiError(error);
      
      // Handle specific error types
      if (parsedError.statusCode === 401) {
        // Handle unauthorized access - just remove token, don't redirect
        // The AuthContext will handle setting guest mode
        localStorage.removeItem('authToken');
      }
      
      // Attach parsed error info
      error.parsedError = parsedError;
      return Promise.reject(error);
    }
  );

  return client;
};

// Main API client
const apiClient = createApiClient();

// Cache invalidation helpers for home environment
export const invalidateCache = {
  dns: () => apiCache.invalidate(/dns/),
  google: () => apiCache.invalidate(/google/),
  system: () => apiCache.invalidate(/system/),
  all: () => apiCache.clear()
};

// DNS API with intelligent caching
export const dnsApi = {
  async getStatus() {
    try {
      const response = await cachedRequest('get', '/api/dns/status', {
        cacheKey: 'dns-status',
        ttl: CACHE_CONFIG['dns-status']
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async getAnalytics(timeRange = '24h') {
    try {
      const response = await cachedRequest('get', `/api/dns/analytics`, {
        params: { timeRange },
        cacheKey: `dns-analytics-${timeRange}`,
        ttl: CACHE_CONFIG['dns-analytics']
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async getProfile() {
    try {
      const response = await cachedRequest('get', '/api/dns/profile', {
        cacheKey: 'dns-profile',
        ttl: CACHE_CONFIG['dns-profile']
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/api/dns/profile', profileData);
      // Invalidate DNS cache after profile update
      apiCache.invalidate('dns-profile');
      apiCache.invalidate(/dns-analytics/);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },
};

// Google Services API
export const googleApi = {
  async getAuthUrl() {
    try {
      const response = await apiClient.get('/api/google/auth-url');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async getAuthStatus() {
    try {
      const response = await apiClient.get('/api/google/auth-status');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  // Calendar API
  calendar: {
    async getEvents(params = {}) {
      try {
        const response = await cachedRequest('get', '/api/google/calendar/events', {
          params,
          cacheKey: `google-calendar-${JSON.stringify(params)}`,
          ttl: CACHE_CONFIG['google-calendar']
        });
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },

    async createEvent(eventData) {
      try {
        const response = await apiClient.post('/api/google/calendar/events', eventData);
        // Invalidate calendar cache after creating event
        apiCache.invalidate(/google-calendar/);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },

    async updateEvent(eventId, eventData) {
      try {
        const response = await apiClient.put(`/api/google/calendar/events/${eventId}`, eventData);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },

    async deleteEvent(eventId) {
      try {
        const response = await apiClient.delete(`/api/google/calendar/events/${eventId}`);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },
  },

  // Gmail API
  gmail: {
    async getMessages(params = {}) {
      try {
        const response = await apiClient.get('/api/google/gmail/messages', { params });
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },

    async getMessage(messageId) {
      try {
        const response = await apiClient.get(`/api/google/gmail/messages/${messageId}`);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },

    async sendMessage(messageData) {
      try {
        const response = await apiClient.post('/api/google/gmail/messages', messageData);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },

    async markAsRead(messageId) {
      try {
        const response = await apiClient.put(`/api/google/gmail/messages/${messageId}/read`);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },
  },

  // Drive API
  drive: {
    async getFiles(params = {}) {
      try {
        const response = await apiClient.get('/api/google/drive/files', { params });
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },

    async getFile(fileId) {
      try {
        const response = await apiClient.get(`/api/google/drive/files/${fileId}`);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },

    async uploadFile(fileData) {
      try {
        const response = await apiClient.post('/api/google/drive/files', fileData);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },

    async deleteFile(fileId) {
      try {
        const response = await apiClient.delete(`/api/google/drive/files/${fileId}`);
        return {
          success: true,
          data: response.data,
        };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },
  },
};

// Authentication API
export const authApi = {
  async login(credentials) {
    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async loginWithGoogle(token) {
    try {
      const response = await apiClient.post('/api/auth/login-google', { idToken: token });
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  async loginWithPin(pin, name) {
    try {
      const response = await apiClient.post('/api/auth/login-pin', { pin, name });
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  },

  async logout() {
    try {
      const response = await apiClient.post('/api/auth/logout');
      localStorage.removeItem('authToken');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      localStorage.removeItem('authToken');
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async validateToken(token) {
    try {
      const response = await apiClient.get('/api/auth/validate');
      return response.data.user;
    } catch (error) {
      localStorage.removeItem('authToken');
      throw new Error(error.response?.data?.message || error.message);
    }
  },

};

// AI Chat API
export const aiApi = {
  async sendMessage(message, context = {}) {
    try {
      const response = await apiClient.post('/api/ai/chat', { message, context });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async getChatHistory(limit = 50) {
    try {
      const response = await apiClient.get(`/api/ai/chat/history?limit=${limit}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async clearHistory() {
    try {
      const response = await apiClient.delete('/api/ai/chat/history');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async getStatus() {
    try {
      const response = await apiClient.get('/api/ai/status');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async getModels() {
    try {
      const response = await apiClient.get('/api/ai/models');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async generateText(prompt, model, stream = false) {
    try {
      const response = await apiClient.post('/api/ai/generate', { prompt, model, stream });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async resetCircuitBreaker() {
    try {
      const response = await apiClient.post('/api/ai/circuit-breaker/reset');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async getCircuitBreakerStatus() {
    try {
      const response = await apiClient.get('/api/ai/circuit-breaker/status');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },
};

// System API
export const systemApi = {
  async getHealth() {
    try {
      const response = await cachedRequest('get', '/api/system/health', {
        cacheKey: 'system-health',
        ttl: CACHE_CONFIG['system-health']
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async getStatus() {
    try {
      const response = await cachedRequest('get', '/api/system/status', {
        cacheKey: 'system-status',
        ttl: CACHE_CONFIG['system-status']
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },
};

// Meal Planning API
export const mealApi = {
  async getCurrentPlan() {
    try {
      const response = await apiClient.get('/api/meals/plan');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async uploadShoppingList(formData) {
    try {
      const response = await apiClient.post('/api/meals/upload-shopping-list', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async generateSuggestions() {
    try {
      const response = await apiClient.post('/api/meals/generate-suggestions');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async updateMeal(day, mealData) {
    try {
      const response = await apiClient.put(`/api/meals/plan/${day}`, mealData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  async saveMealPlan(mealPlan) {
    try {
      const response = await apiClient.post('/api/meals/plan', mealPlan);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },
};

// Export default API client for custom requests
export default apiClient;