#!/usr/bin/env node

/**
 * Safe Task Processor
 * Handles development task processing with timeouts and safety mechanisms
 * 
 * DEVELOPER FEATURES:
 * - Immediate response to developer
 * - Background processing
 * - Timeout protection
 * - Heartbeat monitoring
 * - Circuit breaker integration
 */

const { EventEmitter } = require('events');
const AgentLifecycleManager = require('./agent-lifecycle-manager');
const { CircuitBreakerManager } = require('./circuit-breaker');

class SafeTaskProcessor extends EventEmitter {
    constructor() {
        super();
        this.processingQueue = new Map();
        this.maxProcessingTime = 120000; // 2 minutes max processing
        this.heartbeatInterval = 5000;   // 5 second heartbeat
        this.completedTasks = new Map();
        this.failedTasks = new Map();
        
        // Initialize managers
        this.lifecycleManager = new AgentLifecycleManager();
        this.circuitBreakerManager = new CircuitBreakerManager();
        
        // Task processing statistics
        this.stats = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            timeoutTasks: 0,
            averageProcessingTime: 0
        };
        
        console.log('✅ Safe Task Processor initialized with safety mechanisms');
    }

    /**
     * Process task with immediate response and background execution
     * @param {string} taskId - Task identifier
     * @param {string} agentId - Agent identifier
     * @param {Object} taskData - Task data
     * @returns {Promise} Immediate response
     */
    async processTaskWithImmediate(taskId, agentId, taskData) {
        this.stats.totalTasks++;
        
        // Check if already processing
        const processingKey = `${taskId}-${agentId}`;
        if (this.processingQueue.has(processingKey)) {
            return { 
                success: false, 
                taskId, 
                status: 'already_processing',
                message: 'Task is already being processed'
            };
        }
        
        // Immediate response
        const response = {
            success: true,
            taskId,
            agentId,
            status: 'accepted',
            message: 'Task accepted for processing',
            estimatedTime: '30-60 seconds',
            timestamp: new Date().toISOString()
        };
        
        // Start background processing
        setImmediate(() => {
            this.processInBackground(taskId, agentId, taskData);
        });
        
        return response;
    }

    /**
     * Background task processing with safety mechanisms
     * @param {string} taskId - Task identifier
     * @param {string} agentId - Agent identifier
     * @param {Object} taskData - Task data
     */
    async processInBackground(taskId, agentId, taskData) {
        const processingKey = `${taskId}-${agentId}`;
        const startTime = Date.now();
        
        // Set processing flag
        const processingInfo = {
            taskId,
            agentId,
            startTime,
            heartbeat: Date.now(),
            status: 'processing',
            attempts: 0,
            maxAttempts: 3
        };
        
        this.processingQueue.set(processingKey, processingInfo);
        
        try {
            // Start agent with lifecycle management
            const agent = this.lifecycleManager.startAgent(agentId, 'task-processor', {
                taskId,
                maxTasks: 1
            });
            
            // Process with circuit breaker protection
            const result = await this.circuitBreakerManager.executeWithProtection(
                agentId,
                async (context) => {
                    return this.executeTaskWithHeartbeat(taskId, agentId, taskData, context);
                },
                { taskId, agentId, taskData }
            );
            
            // Task completed successfully
            this.onTaskCompleted(taskId, agentId, result, startTime);
            
        } catch (error) {
            // Task failed
            this.onTaskFailed(taskId, agentId, error, startTime);
            
        } finally {
            // Clean up
            this.processingQueue.delete(processingKey);
            this.lifecycleManager.stopAgent(agentId, 'TASK_COMPLETED');
        }
    }

    /**
     * Execute task with heartbeat monitoring
     * @param {string} taskId - Task identifier
     * @param {string} agentId - Agent identifier
     * @param {Object} taskData - Task data
     * @param {Object} context - Execution context
     * @returns {Promise} Task result
     */
    async executeTaskWithHeartbeat(taskId, agentId, taskData, context) {
        const processingKey = `${taskId}-${agentId}`;
        
        // Setup heartbeat timer
        const heartbeatTimer = setInterval(() => {
            const processing = this.processingQueue.get(processingKey);
            if (processing) {
                processing.heartbeat = Date.now();
                this.lifecycleManager.updateHeartbeat(agentId, {
                    taskId,
                    status: 'processing',
                    progress: processing.progress || 0
                });
            }
        }, this.heartbeatInterval);
        
        try {
            // Execute the actual task processing
            const result = await this.executeActualTask(taskId, agentId, taskData, context);
            return result;
            
        } finally {
            clearInterval(heartbeatTimer);
        }
    }

    /**
     * Execute the actual task (override this method)
     * @param {string} taskId - Task identifier
     * @param {string} agentId - Agent identifier
     * @param {Object} taskData - Task data
     * @param {Object} context - Execution context
     * @returns {Promise} Task result
     */
    async executeActualTask(taskId, agentId, taskData, context) {
        // Default implementation - override in subclasses
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    taskId,
                    agentId,
                    result: 'Task processed successfully',
                    timestamp: new Date().toISOString()
                });
            }, 2000); // Simulate 2 second processing
        });
    }

    /**
     * Handle task completion
     * @param {string} taskId - Task identifier
     * @param {string} agentId - Agent identifier
     * @param {Object} result - Task result
     * @param {number} startTime - Start time
     */
    onTaskCompleted(taskId, agentId, result, startTime) {
        const processingTime = Date.now() - startTime;
        
        this.stats.completedTasks++;
        this.updateAverageProcessingTime(processingTime);
        
        const completionInfo = {
            taskId,
            agentId,
            result,
            processingTime,
            completedAt: new Date().toISOString(),
            status: 'completed'
        };
        
        this.completedTasks.set(taskId, completionInfo);
        this.emit('taskCompleted', completionInfo);
        
        console.log(`✅ Task ${taskId} completed by ${agentId} in ${processingTime}ms`);
    }

    /**
     * Handle task failure
     * @param {string} taskId - Task identifier
     * @param {string} agentId - Agent identifier
     * @param {Error} error - Error that occurred
     * @param {number} startTime - Start time
     */
    onTaskFailed(taskId, agentId, error, startTime) {
        const processingTime = Date.now() - startTime;
        
        this.stats.failedTasks++;
        
        const failureInfo = {
            taskId,
            agentId,
            error: error.message,
            processingTime,
            failedAt: new Date().toISOString(),
            status: 'failed'
        };
        
        this.failedTasks.set(taskId, failureInfo);
        this.emit('taskFailed', failureInfo);
        
        console.error(`❌ Task ${taskId} failed by ${agentId}: ${error.message}`);
    }

    /**
     * Get task status
     * @param {string} taskId - Task identifier
     * @returns {Object|null} Task status
     */
    getTaskStatus(taskId) {
        // Check if currently processing
        for (const [key, processing] of this.processingQueue.entries()) {
            if (processing.taskId === taskId) {
                return {
                    taskId,
                    status: 'processing',
                    agentId: processing.agentId,
                    startTime: processing.startTime,
                    runtime: Date.now() - processing.startTime,
                    lastHeartbeat: processing.heartbeat
                };
            }
        }
        
        // Check completed tasks
        if (this.completedTasks.has(taskId)) {
            return this.completedTasks.get(taskId);
        }
        
        // Check failed tasks
        if (this.failedTasks.has(taskId)) {
            return this.failedTasks.get(taskId);
        }
        
        return null;
    }

    /**
     * Get processing statistics
     * @returns {Object} Processing statistics
     */
    getStatistics() {
        return {
            ...this.stats,
            currentlyProcessing: this.processingQueue.size,
            agentHealth: this.circuitBreakerManager.getSystemHealth(),
            systemHealth: this.lifecycleManager.getSystemHealth()
        };
    }

    /**
     * Update average processing time
     * @param {number} processingTime - Processing time in ms
     */
    updateAverageProcessingTime(processingTime) {
        const totalCompleted = this.stats.completedTasks;
        const currentAverage = this.stats.averageProcessingTime;
        
        this.stats.averageProcessingTime = 
            ((currentAverage * (totalCompleted - 1)) + processingTime) / totalCompleted;
    }

    /**
     * Get system health status
     * @returns {Object} System health
     */
    getSystemHealth() {
        return {
            processor: {
                totalTasks: this.stats.totalTasks,
                completedTasks: this.stats.completedTasks,
                failedTasks: this.stats.failedTasks,
                successRate: this.stats.totalTasks > 0 ? 
                    Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100) : 100,
                averageProcessingTime: Math.round(this.stats.averageProcessingTime),
                currentlyProcessing: this.processingQueue.size
            },
            agents: this.lifecycleManager.getSystemHealth(),
            circuitBreakers: this.circuitBreakerManager.getSystemHealth()
        };
    }

    /**
     * Emergency stop all processing
     */
    emergencyStop() {
        console.log('🚨 Emergency stop all task processing');
        
        // Clear processing queue
        this.processingQueue.clear();
        
        // Stop all agents
        this.lifecycleManager.emergencyStopAll();
        
        // Reset circuit breakers
        this.circuitBreakerManager.resetAll();
    }
}

module.exports = SafeTaskProcessor;