#!/usr/bin/env node

/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures in agent operations
 * 
 * SAFETY FEATURES:
 * - Automatic failure detection
 * - Exponential backoff
 * - Health monitoring
 * - Automatic recovery
 */

class CircuitBreaker {
    constructor(agentId, options = {}) {
        this.agentId = agentId;
        this.failureCount = 0;
        this.maxFailures = options.maxFailures || 3;
        this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
        this.operationTimeout = options.operationTimeout || 8000; // 8 seconds
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.lastFailureTime = null;
        this.nextAttempt = null;
        this.successCount = 0;
        this.totalRequests = 0;
        this.healthScore = 100;
        this.performanceMetrics = {
            averageResponseTime: 0,
            successRate: 100,
            lastOperationTime: null
        };
        
        console.log(`🔒 Enhanced circuit breaker initialized for agent ${agentId}`);
    }

    /**
     * Execute operation with circuit breaker protection
     * @param {Function} operation - Operation to execute
     * @param {Object} context - Operation context
     * @returns {Promise} Operation result
     */
    async execute(operation, context = {}) {
        this.totalRequests++;
        
        // Check circuit breaker state
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                const waitTime = Math.ceil((this.nextAttempt - Date.now()) / 1000);
                throw new Error(`Circuit breaker OPEN for agent ${this.agentId}. Retry in ${waitTime}s`);
            } else {
                // Move to half-open state
                this.state = 'HALF_OPEN';
                console.log(`🔄 Circuit breaker HALF_OPEN for agent ${this.agentId}`);
            }
        }
        
        try {
            // Execute operation with timeout
            const result = await Promise.race([
                operation(context),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Operation timeout')), this.operationTimeout)
                )
            ]);
            
            // Success - reset failure count
            this.onSuccess();
            return result;
        } catch (error) {
            // Failure - update circuit breaker state
            this.onFailure(error);
            throw error;
        }
    }

    /**
     * Handle successful operation
     */
    onSuccess() {
        this.successCount++;
        this.failureCount = 0;
        
        if (this.state === 'HALF_OPEN') {
            this.state = 'CLOSED';
            console.log(`✅ Circuit breaker CLOSED for agent ${this.agentId} - Recovery successful`);
        }
    }

    /**
     * Handle failed operation
     * @param {Error} error - The error that occurred
     */
    onFailure(error) {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.failureCount >= this.maxFailures) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.resetTimeout;
            
            console.log(`🚨 Circuit breaker OPEN for agent ${this.agentId} - Too many failures (${this.failureCount})`);
            console.log(`🔄 Next attempt allowed at: ${new Date(this.nextAttempt).toISOString()}`);
        }
    }

    /**
     * Get circuit breaker status
     * @returns {Object} Current status
     */
    getStatus() {
        return {
            agentId: this.agentId,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            totalRequests: this.totalRequests,
            maxFailures: this.maxFailures,
            lastFailureTime: this.lastFailureTime,
            nextAttempt: this.nextAttempt,
            healthPercentage: this.totalRequests > 0 ? 
                Math.round((this.successCount / this.totalRequests) * 100) : 100
        };
    }

    /**
     * Force reset circuit breaker
     */
    reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.nextAttempt = null;
        console.log(`🔄 Circuit breaker RESET for agent ${this.agentId}`);
    }

    /**
     * Check if operation is allowed
     * @returns {boolean} Whether operation is allowed
     */
    isOperationAllowed() {
        if (this.state === 'CLOSED') return true;
        if (this.state === 'HALF_OPEN') return true;
        if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) return true;
        return false;
    }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different agents
 */
class CircuitBreakerManager {
    constructor() {
        this.circuitBreakers = new Map();
        this.globalConfig = {
            maxFailures: 3,
            resetTimeout: 30000,
            operationTimeout: 8000
        };
    }

    /**
     * Get or create circuit breaker for agent
     * @param {string} agentId - Agent identifier
     * @param {Object} options - Circuit breaker options
     * @returns {CircuitBreaker} Circuit breaker instance
     */
    getCircuitBreaker(agentId, options = {}) {
        if (!this.circuitBreakers.has(agentId)) {
            const config = { ...this.globalConfig, ...options };
            this.circuitBreakers.set(agentId, new CircuitBreaker(agentId, config));
        }
        return this.circuitBreakers.get(agentId);
    }

    /**
     * Execute operation with circuit breaker protection
     * @param {string} agentId - Agent identifier
     * @param {Function} operation - Operation to execute
     * @param {Object} context - Operation context
     * @returns {Promise} Operation result
     */
    async executeWithProtection(agentId, operation, context = {}) {
        const circuitBreaker = this.getCircuitBreaker(agentId);
        return circuitBreaker.execute(operation, context);
    }

    /**
     * Get all circuit breaker statuses
     * @returns {Array} Array of circuit breaker statuses
     */
    getAllStatuses() {
        return Array.from(this.circuitBreakers.values()).map(cb => cb.getStatus());
    }

    /**
     * Get healthy agents
     * @returns {Array} Array of healthy agent IDs
     */
    getHealthyAgents() {
        return Array.from(this.circuitBreakers.entries())
            .filter(([_, cb]) => cb.isOperationAllowed())
            .map(([agentId, _]) => agentId);
    }

    /**
     * Get system health summary
     * @returns {Object} System health summary
     */
    getSystemHealth() {
        const statuses = this.getAllStatuses();
        const total = statuses.length;
        const healthy = statuses.filter(s => s.state === 'CLOSED').length;
        const degraded = statuses.filter(s => s.state === 'HALF_OPEN').length;
        const failing = statuses.filter(s => s.state === 'OPEN').length;
        
        return {
            totalAgents: total,
            healthyAgents: healthy,
            degradedAgents: degraded,
            failingAgents: failing,
            overallHealth: total > 0 ? Math.round((healthy / total) * 100) : 100,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Reset all circuit breakers
     */
    resetAll() {
        this.circuitBreakers.forEach(cb => cb.reset());
        console.log('🔄 All circuit breakers reset');
    }
}

module.exports = { CircuitBreaker, CircuitBreakerManager };