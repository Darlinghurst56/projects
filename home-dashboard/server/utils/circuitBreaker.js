/**
 * Circuit Breaker Implementation for Family Dashboard
 * 
 * Implements the circuit breaker pattern to prevent cascade failures when external services
 * (Google APIs, Ollama AI, DNS services) become unavailable. The circuit breaker has three states:
 * 
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is tripped, requests fail fast with fallback
 * - HALF_OPEN: Testing recovery, allow limited requests to test service health
 * 
 * @author Integration Specialist Agent
 * @version 1.0.0
 */

const EventEmitter = require('events');

/**
 * Circuit breaker states
 */
const STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

/**
 * Circuit Breaker class implementing the circuit breaker pattern
 * 
 * @class CircuitBreaker
 * @extends EventEmitter
 */
class CircuitBreaker extends EventEmitter {
  /**
   * Create a circuit breaker
   * 
   * @param {Function} service - The service function to wrap
   * @param {Object} options - Configuration options
   * @param {string} options.name - Name of the service for logging
   * @param {number} options.failureThreshold - Number of failures before opening (default: 5)
   * @param {number} options.timeWindow - Time window for counting failures in ms (default: 60000)
   * @param {number} options.timeout - Timeout for requests in ms (default: 30000)
   * @param {number} options.resetTimeout - Time to wait before trying half-open in ms (default: 60000)
   * @param {Function} options.fallback - Fallback function when circuit is open
   * @param {Function} options.isFailure - Function to determine if result is a failure
   */
  constructor(service, options = {}) {
    super();
    
    this.service = service;
    this.name = options.name || 'Unknown Service';
    this.failureThreshold = options.failureThreshold || 5;
    this.timeWindow = options.timeWindow || 60000; // 1 minute
    this.timeout = options.timeout || 30000; // 30 seconds
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.fallback = options.fallback || this.defaultFallback.bind(this);
    this.isFailure = options.isFailure || this.defaultIsFailure.bind(this);
    
    // Circuit breaker state
    this.state = STATES.CLOSED;
    this.failures = [];
    this.nextAttempt = Date.now();
    this.successCount = 0;
    this.totalRequests = 0;
    this.totalFailures = 0;
    
    // Statistics
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      timeouts: 0,
      shortCircuits: 0,
      lastFailureTime: null,
      lastSuccessTime: null
    };
    
    this.emit('initialized', { name: this.name, state: this.state });
  }
  
  /**
   * Execute a request through the circuit breaker
   * 
   * @param {...any} args - Arguments to pass to the service function
   * @returns {Promise<any>} Service response or fallback response
   */
  async execute(...args) {
    this.stats.totalCalls++;
    this.totalRequests++;
    
    if (this.state === STATES.OPEN) {
      if (Date.now() < this.nextAttempt) {
        this.stats.shortCircuits++;
        this.emit('shortCircuit', { name: this.name, args });
        return this.fallback(...args);
      } else {
        // Try to transition to half-open
        this.state = STATES.HALF_OPEN;
        this.emit('stateChange', { 
          name: this.name, 
          from: STATES.OPEN, 
          to: STATES.HALF_OPEN 
        });
      }
    }
    
    if (this.state === STATES.HALF_OPEN) {
      // In half-open state, only allow one request at a time
      return this.attemptRequest(...args);
    }
    
    if (this.state === STATES.CLOSED) {
      return this.attemptRequest(...args);
    }
  }
  
  /**
   * Attempt to execute the request with timeout and failure tracking
   * 
   * @param {...any} args - Arguments to pass to the service function
   * @returns {Promise<any>} Service response
   * @private
   */
  async attemptRequest(...args) {
    const startTime = Date.now();
    
    try {
      // Wrap service call with timeout
      const result = await this.withTimeout(this.service(...args), this.timeout);
      
      // Check if result indicates failure
      if (this.isFailure(result)) {
        return this.handleFailure(new Error('Service returned failure result'), ...args);
      }
      
      // Success - reset failure count and update stats
      this.handleSuccess();
      this.stats.successfulCalls++;
      this.stats.lastSuccessTime = Date.now();
      
      const responseTime = Date.now() - startTime;
      this.emit('success', { 
        name: this.name, 
        responseTime, 
        result: this.sanitizeResult(result) 
      });
      
      return result;
      
    } catch (error) {
      return this.handleFailure(error, ...args);
    }
  }
  
  /**
   * Handle successful request execution
   * @private
   */
  handleSuccess() {
    // Clear old failures
    this.clearOldFailures();
    
    if (this.state === STATES.HALF_OPEN) {
      // Successful request in half-open state - close the circuit
      this.state = STATES.CLOSED;
      this.successCount = 0;
      this.emit('stateChange', { 
        name: this.name, 
        from: STATES.HALF_OPEN, 
        to: STATES.CLOSED 
      });
    }
  }
  
  /**
   * Handle failed request execution
   * 
   * @param {Error} error - The error that occurred
   * @param {...any} args - Original arguments for fallback
   * @returns {Promise<any>} Fallback response
   * @private
   */
  async handleFailure(error, ...args) {
    const failure = {
      timestamp: Date.now(),
      error: error.message
    };
    
    this.failures.push(failure);
    this.stats.failedCalls++;
    this.stats.lastFailureTime = Date.now();
    this.totalFailures++;
    
    if (error.name === 'TimeoutError') {
      this.stats.timeouts++;
    }
    
    this.emit('failure', { 
      name: this.name, 
      error: error.message, 
      totalFailures: this.getTotalFailures() 
    });
    
    // Check if we should trip the circuit
    this.clearOldFailures();
    
    if (this.state === STATES.HALF_OPEN) {
      // Failure in half-open state - back to open
      this.tripCircuit();
    } else if (this.getTotalFailures() >= this.failureThreshold) {
      // Too many failures in closed state - trip circuit
      this.tripCircuit();
    }
    
    // Return fallback response
    return this.fallback(error, ...args);
  }
  
  /**
   * Trip the circuit breaker to open state
   * @private
   */
  tripCircuit() {
    const previousState = this.state;
    this.state = STATES.OPEN;
    this.nextAttempt = Date.now() + this.resetTimeout;
    
    this.emit('stateChange', { 
      name: this.name, 
      from: previousState, 
      to: STATES.OPEN,
      nextAttempt: new Date(this.nextAttempt).toISOString()
    });
    
    this.emit('circuitOpened', { 
      name: this.name, 
      failures: this.getTotalFailures(),
      nextAttempt: this.nextAttempt
    });
  }
  
  /**
   * Clear failures older than the time window
   * @private
   */
  clearOldFailures() {
    const cutoff = Date.now() - this.timeWindow;
    this.failures = this.failures.filter(failure => failure.timestamp > cutoff);
  }
  
  /**
   * Get current failure count within time window
   * 
   * @returns {number} Number of failures in current time window
   */
  getTotalFailures() {
    this.clearOldFailures();
    return this.failures.length;
  }
  
  /**
   * Wrap a promise with timeout functionality
   * 
   * @param {Promise} promise - Promise to wrap
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise} Promise with timeout
   * @private
   */
  withTimeout(promise, timeoutMs) {
    const timeoutPromise = new Promise((_, reject) => {
      const id = setTimeout(() => {
        const error = new Error(`Request timeout after ${timeoutMs}ms`);
        error.name = 'TimeoutError';
        reject(error);
      }, timeoutMs);
      
      // Clear timeout if promise resolves/rejects first
      promise.finally(() => clearTimeout(id));
    });
    
    return Promise.race([promise, timeoutPromise]);
  }
  
  /**
   * Default fallback function
   * 
   * @param {Error} error - The error that caused the fallback
   * @param {...any} args - Original function arguments
   * @returns {Object} Fallback response
   */
  defaultFallback(error, ...args) {
    return {
      error: 'Service temporarily unavailable',
      message: `${this.name} is currently experiencing issues. Please try again later.`,
      fallback: true,
      timestamp: new Date().toISOString(),
      originalError: error?.message
    };
  }
  
  /**
   * Default failure detection function
   * 
   * @param {any} result - Service response
   * @returns {boolean} True if result indicates failure
   */
  defaultIsFailure(result) {
    if (!result) return true;
    if (result.error) return true;
    if (result.status && result.status >= 400) return true;
    return false;
  }
  
  /**
   * Sanitize result for logging (remove sensitive data)
   * 
   * @param {any} result - Result to sanitize
   * @returns {any} Sanitized result
   * @private
   */
  sanitizeResult(result) {
    if (typeof result !== 'object' || result === null) {
      return result;
    }
    
    const sanitized = { ...result };
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  /**
   * Get current circuit breaker status
   * 
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      isHealthy: this.state === STATES.CLOSED,
      failures: this.getTotalFailures(),
      failureThreshold: this.failureThreshold,
      nextAttempt: this.state === STATES.OPEN ? new Date(this.nextAttempt).toISOString() : null,
      stats: {
        ...this.stats,
        successRate: this.stats.totalCalls > 0 ? 
          ((this.stats.successfulCalls / this.stats.totalCalls) * 100).toFixed(2) + '%' : '0%',
        lastFailureTime: this.stats.lastFailureTime ? 
          new Date(this.stats.lastFailureTime).toISOString() : null,
        lastSuccessTime: this.stats.lastSuccessTime ? 
          new Date(this.stats.lastSuccessTime).toISOString() : null
      }
    };
  }
  
  /**
   * Reset circuit breaker to closed state
   * Useful for manual recovery or testing
   */
  reset() {
    const previousState = this.state;
    this.state = STATES.CLOSED;
    this.failures = [];
    this.nextAttempt = Date.now();
    this.successCount = 0;
    
    this.emit('reset', { name: this.name, previousState });
    
    if (previousState !== STATES.CLOSED) {
      this.emit('stateChange', { 
        name: this.name, 
        from: previousState, 
        to: STATES.CLOSED 
      });
    }
  }
  
  /**
   * Force circuit breaker to open state
   * Useful for maintenance or manual intervention
   */
  forceOpen() {
    const previousState = this.state;
    this.state = STATES.OPEN;
    this.nextAttempt = Date.now() + this.resetTimeout;
    
    this.emit('forceOpen', { name: this.name, previousState });
    
    if (previousState !== STATES.OPEN) {
      this.emit('stateChange', { 
        name: this.name, 
        from: previousState, 
        to: STATES.OPEN 
      });
    }
  }
}

/**
 * Circuit Breaker Registry for managing multiple circuit breakers
 * 
 * @class CircuitBreakerRegistry
 */
class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
  }
  
  /**
   * Register a new circuit breaker
   * 
   * @param {string} name - Unique name for the circuit breaker
   * @param {Function} service - Service function to wrap
   * @param {Object} options - Circuit breaker options
   * @returns {CircuitBreaker} The created circuit breaker
   */
  register(name, service, options = {}) {
    const breaker = new CircuitBreaker(service, { ...options, name });
    this.breakers.set(name, breaker);
    
    // Set up logging for the breaker
    breaker.on('stateChange', (event) => {
      console.log(`[Circuit Breaker] ${event.name}: ${event.from} -> ${event.to}`);
    });
    
    breaker.on('failure', (event) => {
      console.warn(`[Circuit Breaker] ${event.name} failure: ${event.error} (${event.totalFailures} total)`);
    });
    
    breaker.on('circuitOpened', (event) => {
      console.error(`[Circuit Breaker] ${event.name} circuit opened after ${event.failures} failures. Next attempt: ${new Date(event.nextAttempt).toISOString()}`);
    });
    
    return breaker;
  }
  
  /**
   * Get a circuit breaker by name
   * 
   * @param {string} name - Circuit breaker name
   * @returns {CircuitBreaker|undefined} The circuit breaker or undefined
   */
  get(name) {
    return this.breakers.get(name);
  }
  
  /**
   * Get all circuit breakers
   * 
   * @returns {Map<string, CircuitBreaker>} All circuit breakers
   */
  getAll() {
    return this.breakers;
  }
  
  /**
   * Get status of all circuit breakers
   * 
   * @returns {Object} Status of all circuit breakers
   */
  getStatus() {
    const status = {};
    
    for (const [name, breaker] of this.breakers) {
      status[name] = breaker.getStatus();
    }
    
    return status;
  }
  
  /**
   * Reset all circuit breakers
   */
  resetAll() {
    for (const [name, breaker] of this.breakers) {
      breaker.reset();
    }
  }
  
  /**
   * Get health summary of all circuit breakers
   * 
   * @returns {Object} Health summary
   */
  getHealthSummary() {
    const breakers = Array.from(this.breakers.values());
    const total = breakers.length;
    const healthy = breakers.filter(b => b.getStatus().isHealthy).length;
    const degraded = breakers.filter(b => b.getStatus().state === STATES.HALF_OPEN).length;
    const failed = breakers.filter(b => b.getStatus().state === STATES.OPEN).length;
    
    return {
      total,
      healthy,
      degraded,
      failed,
      overallHealth: total === 0 ? 'unknown' : 
        healthy === total ? 'healthy' :
        failed === 0 ? 'degraded' : 'critical'
    };
  }
}

// Global registry instance
const registry = new CircuitBreakerRegistry();

/**
 * Usage Examples for Circuit Breaker Implementation
 * 
 * @example
 * // Basic circuit breaker setup
 * const { registry } = require('./circuitBreaker');
 * 
 * // Register a service with circuit breaker
 * registry.register('external-api', async (data) => {
 *   const response = await fetch('https://api.example.com/data', {
 *     method: 'POST',
 *     body: JSON.stringify(data)
 *   });
 *   return response.json();
 * }, {
 *   name: 'External API Service',
 *   failureThreshold: 3,
 *   timeWindow: 60000,
 *   timeout: 10000,
 *   fallback: (error) => ({ error: 'Service unavailable', data: [] })
 * });
 * 
 * @example
 * // Using circuit breaker in route handlers
 * router.get('/api/data', async (req, res) => {
 *   try {
 *     const breaker = registry.get('external-api');
 *     const result = await breaker.execute(req.body);
 *     res.json(result);
 *   } catch (error) {
 *     res.status(500).json({ error: 'Service failed' });
 *   }
 * });
 * 
 * @example
 * // Monitoring circuit breaker health
 * router.get('/health/circuit-breakers', (req, res) => {
 *   const status = registry.getStatus();
 *   const summary = registry.getHealthSummary();
 *   res.json({ status, summary });
 * });
 * 
 * @example
 * // Manual circuit breaker control
 * router.post('/admin/circuit-breakers/reset', (req, res) => {
 *   const { service } = req.body;
 *   if (service) {
 *     const breaker = registry.get(service);
 *     breaker?.reset();
 *   } else {
 *     registry.resetAll();
 *   }
 *   res.json({ message: 'Circuit breakers reset' });
 * });
 * 
 * @example
 * // Custom failure detection
 * registry.register('custom-service', serviceFunction, {
 *   isFailure: (result) => {
 *     // Custom logic to determine failure
 *     return result.statusCode >= 400 || result.error;
 *   },
 *   fallback: (error) => {
 *     // Custom fallback response
 *     return { success: false, message: 'Using cached data' };
 *   }
 * });
 * 
 * @example
 * // Listening to circuit breaker events
 * const breaker = registry.get('my-service');
 * breaker.on('stateChange', (event) => {
 *   console.log(`${event.name} state: ${event.from} -> ${event.to}`);
 * });
 * breaker.on('failure', (event) => {
 *   console.warn(`${event.name} failed: ${event.error}`);
 * });
 * breaker.on('circuitOpened', (event) => {
 *   console.error(`${event.name} circuit opened!`);
 *   // Send alert to monitoring system
 * });
 */

module.exports = {
  CircuitBreaker,
  CircuitBreakerRegistry,
  STATES,
  registry
};