/**
 * HTTP Client Utilities for Claude Project Dashboard
 * Provides enhanced HTTP client functionality with caching, error handling, and retry logic
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, 'http-client.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

/**
 * Simple in-memory cache implementation
 */
class HttpCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, value, ttl = config.settings.defaultCacheTtl) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set cache entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);
    this.timers.set(key, timer);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    this.cache.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * HTTP Client class with enhanced capabilities
 */
class HttpClient {
  constructor(options = {}) {
    this.config = { ...config, ...options };
    this.cache = new HttpCache();
    this.requestCounts = new Map();
  }

  /**
   * Generate cache key for a request
   */
  generateCacheKey(url, options = {}) {
    const method = options.method || 'GET';
    const headers = JSON.stringify(options.headers || {});
    const body = options.body || '';
    return `${method}:${url}:${headers}:${body}`;
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(domain) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const key = `${domain}:${Math.floor(now / windowMs)}`;
    
    const count = this.requestCounts.get(key) || 0;
    const limit = this.config.rateLimiting.defaultLimits.requestsPerMinute;
    
    if (count >= limit) {
      throw new Error(`Rate limit exceeded for ${domain}`);
    }
    
    this.requestCounts.set(key, count + 1);
    
    // Clean up old entries
    setTimeout(() => {
      this.requestCounts.delete(key);
    }, windowMs);
  }

  /**
   * Validate URL security
   */
  validateUrl(url) {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;

    // Check blocked domains
    if (this.config.security.blockedDomains.includes(domain)) {
      throw new Error(`Domain ${domain} is blocked`);
    }

    // Check allowed domains (if specified)
    if (this.config.security.allowedDomains.length > 0) {
      if (!this.config.security.allowedDomains.includes(domain)) {
        throw new Error(`Domain ${domain} is not in allowed list`);
      }
    }

    // Check HTTPS requirement
    if (this.config.security.requireHttps && parsedUrl.protocol !== 'https:') {
      throw new Error('HTTPS is required for all requests');
    }

    return true;
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Determine if error is retryable
   */
  isRetryableError(error, statusCode) {
    if (statusCode && this.config.errorHandling.nonRetryableStatusCodes.includes(statusCode)) {
      return false;
    }
    
    if (statusCode && this.config.errorHandling.retryStatusCodes.includes(statusCode)) {
      return true;
    }

    const errorType = error.name || error.code || 'UNKNOWN_ERROR';
    return this.config.errorHandling.retryOn.includes(errorType);
  }

  /**
   * Build complete URL with query parameters
   */
  buildUrl(baseUrl, endpoint, params = {}) {
    const url = new URL(endpoint, baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  }

  /**
   * Enhanced fetch with retry logic and caching
   */
  async fetch(url, options = {}) {
    this.validateUrl(url);
    
    const parsedUrl = new URL(url);
    this.checkRateLimit(parsedUrl.hostname);

    // Prepare request options
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        ...this.config.defaultHeaders,
        ...options.headers
      },
      timeout: options.timeout || this.config.settings.defaultTimeout,
      ...options
    };

    // Check cache for GET requests
    const cacheKey = this.generateCacheKey(url, requestOptions);
    if (requestOptions.method === 'GET' && this.config.settings.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        if (this.config.logging.enabled) {
          console.log(`[HttpClient] Cache hit for ${url}`);
        }
        return cached;
      }
    }

    let lastError;
    let attempt = 0;
    
    while (attempt < this.config.settings.retryAttempts) {
      try {
        if (this.config.logging.enabled && this.config.logging.logRequests) {
          console.log(`[HttpClient] ${requestOptions.method} ${url} (attempt ${attempt + 1})`);
        }

        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.response = response;
          
          if (!this.isRetryableError(error, response.status)) {
            throw error;
          }
          
          lastError = error;
          attempt++;
          
          if (attempt < this.config.settings.retryAttempts) {
            const delay = this.config.settings.retryDelayMs * Math.pow(2, attempt - 1);
            if (this.config.logging.enabled) {
              console.log(`[HttpClient] Retrying after ${delay}ms...`);
            }
            await this.sleep(delay);
            continue;
          }
          
          throw error;
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        let result;
        
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          result = await response.text();
        }

        // Cache successful GET responses
        if (requestOptions.method === 'GET' && this.config.settings.enableCaching) {
          const cacheTtl = this.getCacheTtl(url);
          this.cache.set(cacheKey, result, cacheTtl);
        }

        if (this.config.logging.enabled && this.config.logging.logResponses) {
          console.log(`[HttpClient] ${response.status} ${url}`);
        }

        return result;

      } catch (error) {
        lastError = error;
        
        if (!this.isRetryableError(error)) {
          throw error;
        }
        
        attempt++;
        
        if (attempt < this.config.settings.retryAttempts) {
          const delay = this.config.settings.retryDelayMs * Math.pow(2, attempt - 1);
          if (this.config.logging.enabled) {
            console.log(`[HttpClient] Retrying after ${delay}ms due to ${error.message}`);
          }
          await this.sleep(delay);
        }
      }
    }
    
    if (this.config.logging.enabled && this.config.logging.logErrors) {
      console.error(`[HttpClient] All retry attempts failed for ${url}:`, lastError);
    }
    
    throw lastError;
  }

  /**
   * Get cache TTL for a URL based on patterns
   */
  getCacheTtl(url) {
    for (const [category, rules] of Object.entries(this.config.cachingRules)) {
      for (const pattern of rules.patterns) {
        if (this.matchPattern(url, pattern)) {
          return rules.ttl;
        }
      }
    }
    return this.config.settings.defaultCacheTtl;
  }

  /**
   * Simple pattern matching for cache rules
   */
  matchPattern(url, pattern) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    }
    return url.includes(pattern);
  }

  /**
   * Get API client configuration
   */
  getApiClient(name) {
    return this.config.apiClients[name];
  }

  /**
   * Build authenticated URL for API clients
   */
  buildAuthenticatedUrl(clientName, endpoint, params = {}) {
    const client = this.getApiClient(clientName);
    if (!client) {
      throw new Error(`API client ${clientName} not found`);
    }

    const url = this.buildUrl(client.baseUrl, endpoint, params);
    
    if (client.requiresAuth) {
      const apiKey = process.env[`${clientName.toUpperCase()}_API_KEY`];
      if (!apiKey) {
        throw new Error(`API key not found for ${clientName}`);
      }
      
      if (client.authType === 'query') {
        const urlObj = new URL(url);
        urlObj.searchParams.append(client.authParam, apiKey);
        return urlObj.toString();
      }
    }
    
    return url;
  }

  /**
   * Make authenticated API request
   */
  async apiRequest(clientName, endpoint, options = {}) {
    const client = this.getApiClient(clientName);
    if (!client) {
      throw new Error(`API client ${clientName} not found`);
    }

    const url = this.buildAuthenticatedUrl(clientName, endpoint, options.params);
    
    const requestOptions = {
      ...options,
      headers: {
        ...client.headers,
        ...options.headers
      },
      timeout: options.timeout || client.timeout
    };

    // Add authentication header if needed
    if (client.requiresAuth && client.authType === 'header') {
      const apiKey = process.env[`${clientName.toUpperCase()}_API_KEY`];
      if (!apiKey) {
        throw new Error(`API key not found for ${clientName}`);
      }
      requestOptions.headers[client.authParam] = apiKey;
    }

    return this.fetch(url, requestOptions);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size(),
      config: this.config.settings
    };
  }
}

// Export default instance and class
export const httpClient = new HttpClient();
export { HttpClient, HttpCache };
export default httpClient;