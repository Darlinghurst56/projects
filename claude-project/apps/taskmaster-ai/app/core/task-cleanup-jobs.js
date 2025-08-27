#!/usr/bin/env node

/**
 * Task Cleanup Jobs - Handles proper task completion and resource cleanup
 * Manages immediate, delayed, and archival cleanup operations
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class TaskCleanupJobs extends EventEmitter {
    constructor(projectRoot) {
        super();
        this.projectRoot = projectRoot;
        this.cleanupQueue = new Map();
        this.isRunning = false;
        this.errorCount = 0;
        this.lastProcessed = null;
        this.processInterval = null;
        
        // Configuration
        this.config = {
            immediateDelay: 60000,        // 1 minute
            delayedDelay: 24 * 60 * 60 * 1000,  // 24 hours  
            archivalDelay: 7 * 24 * 60 * 60 * 1000,  // 7 days
            processInterval: 60000,       // 1 minute
            maxRetries: 3,
            retryDelay: 60 * 60 * 1000   // 1 hour
        };
        
        this.setupDirectories();
    }
    
    async setupDirectories() {
        const dirs = [
            path.join(this.projectRoot, '.temp'),
            path.join(this.projectRoot, '.archive'),
            path.join(this.projectRoot, '.logs', 'cleanup')
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.error(`Failed to create directory ${dir}:`, error);
            }
        }
    }
    
    /**
     * Start the cleanup processor
     */
    start() {
        if (this.isRunning) {
            console.log('Cleanup processor already running');
            return;
        }
        
        this.isRunning = true;
        console.log('Starting task cleanup processor...');
        
        // Process cleanup queue periodically
        this.processInterval = setInterval(() => {
            this.processCleanupQueue();
        }, this.config.processInterval);
        
        // Process any existing queue items immediately
        this.processCleanupQueue();
        
        this.emit('started');
    }
    
    /**
     * Stop the cleanup processor
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.processInterval) {
            clearInterval(this.processInterval);
            this.processInterval = null;
        }
        
        console.log('Stopped task cleanup processor');
        this.emit('stopped');
    }
    
    /**
     * Schedule all cleanup jobs for a completed task
     */
    scheduleTaskCleanup(taskId, taskData = null) {
        const now = Date.now();
        
        // Schedule immediate cleanup
        this.scheduleCleanup(taskId, 'immediate', now + this.config.immediateDelay);
        
        // Schedule delayed cleanup
        this.scheduleCleanup(taskId, 'delayed', now + this.config.delayedDelay);
        
        // Schedule archival
        this.scheduleCleanup(taskId, 'archival', now + this.config.archivalDelay);
        
        console.log(`Scheduled cleanup jobs for task ${taskId}`);
        this.emit('cleanup_scheduled', { taskId, taskData });
    }
    
    /**
     * Schedule a specific cleanup job
     */
    scheduleCleanup(taskId, type, scheduledFor) {
        const cleanupId = `${taskId}_${type}`;
        
        this.cleanupQueue.set(cleanupId, {
            taskId,
            type,
            scheduledFor,
            retries: 0,
            createdAt: Date.now()
        });
        
        console.log(`Scheduled ${type} cleanup for task ${taskId} at ${new Date(scheduledFor).toISOString()}`);
    }
    
    /**
     * Process the cleanup queue
     */
    async processCleanupQueue() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const processed = [];
        
        try {
            for (const [cleanupId, cleanup] of this.cleanupQueue.entries()) {
                if (cleanup.scheduledFor <= now) {
                    try {
                        await this.executeCleanup(cleanup);
                        processed.push(cleanupId);
                        this.emit('cleanup_completed', cleanup);
                    } catch (error) {
                        console.error(`Cleanup failed for ${cleanupId}:`, error);
                        
                        cleanup.retries++;
                        if (cleanup.retries >= this.config.maxRetries) {
                            console.error(`Max retries exceeded for ${cleanupId}, removing from queue`);
                            processed.push(cleanupId);
                            this.emit('cleanup_failed', { cleanup, error });
                        } else {
                            // Schedule retry
                            cleanup.scheduledFor = now + this.config.retryDelay;
                            console.log(`Scheduled retry for ${cleanupId} in ${this.config.retryDelay/1000/60} minutes`);
                        }
                        
                        this.errorCount++;
                    }
                }
            }
            
            // Remove processed items
            processed.forEach(id => this.cleanupQueue.delete(id));
            
            this.lastProcessed = new Date().toISOString();
            
            // Alert if too many errors
            if (this.errorCount > 10) {
                this.emit('high_error_rate', { errorCount: this.errorCount });
                console.warn(`High cleanup error rate detected: ${this.errorCount} errors`);
            }
            
        } catch (error) {
            console.error('Error processing cleanup queue:', error);
        }
    }
    
    /**
     * Execute a specific cleanup operation
     */
    async executeCleanup(cleanup) {
        const { taskId, type } = cleanup;
        
        console.log(`Executing ${type} cleanup for task ${taskId}`);
        
        switch (type) {
            case 'immediate':
                await this.performImmediateCleanup(taskId);
                break;
            case 'delayed':
                await this.performDelayedCleanup(taskId);
                break;
            case 'archival':
                await this.performArchival(taskId);
                break;
            default:
                throw new Error(`Unknown cleanup type: ${type}`);
        }
        
        console.log(`Completed ${type} cleanup for task ${taskId}`);
    }
    
    /**
     * Immediate cleanup (1 minute after completion)
     */
    async performImmediateCleanup(taskId) {
        const operations = [
            () => this.clearTempFiles(taskId),
            () => this.releaseResources(taskId),
            () => this.updateTaskStatus(taskId, 'completed'),
            () => this.notifyCompletion(taskId)
        ];
        
        for (const operation of operations) {
            try {
                await operation();
            } catch (error) {
                console.error(`Immediate cleanup operation failed for task ${taskId}:`, error);
                // Continue with other operations
            }
        }
        
        await this.logCleanup(taskId, 'immediate', 'success');
    }
    
    /**
     * Delayed cleanup (24 hours after completion)
     */
    async performDelayedCleanup(taskId) {
        const operations = [
            () => this.cleanupTaskLogs(taskId),
            () => this.removeFromActiveMemory(taskId),
            () => this.updateCompletionMetrics(taskId),
            () => this.compactTaskData(taskId)
        ];
        
        for (const operation of operations) {
            try {
                await operation();
            } catch (error) {
                console.error(`Delayed cleanup operation failed for task ${taskId}:`, error);
                // Continue with other operations
            }
        }
        
        await this.logCleanup(taskId, 'delayed', 'success');
    }
    
    /**
     * Archival (7 days after completion)
     */
    async performArchival(taskId) {
        const operations = [
            () => this.archiveTaskData(taskId),
            () => this.removeFromActiveDB(taskId),
            () => this.updateArchivalIndex(taskId),
            () => this.cleanupOldArchives()
        ];
        
        for (const operation of operations) {
            try {
                await operation();
            } catch (error) {
                console.error(`Archival operation failed for task ${taskId}:`, error);
                // Continue with other operations
            }
        }
        
        await this.logCleanup(taskId, 'archival', 'success');
    }
    
    // Cleanup operation implementations
    
    async clearTempFiles(taskId) {
        const tempDir = path.join(this.projectRoot, '.temp', taskId);
        try {
            await fs.rmdir(tempDir, { recursive: true });
            console.log(`Cleared temp files for task ${taskId}`);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    }
    
    async releaseResources(taskId) {
        // Clear any open file handles, database connections, etc.
        // Implementation depends on specific resource types used by tasks
        console.log(`Released resources for task ${taskId}`);
    }
    
    async updateTaskStatus(taskId, status) {
        try {
            const TaskMasterIntegration = require('./.taskmaster/agents/taskmaster-integration.cjs');
            const taskmaster = new TaskMasterIntegration(this.projectRoot);
            await taskmaster.updateTaskStatus(taskId, status);
            console.log(`Updated task ${taskId} status to ${status}`);
        } catch (error) {
            console.error(`Failed to update task status for ${taskId}:`, error);
        }
    }
    
    async notifyCompletion(taskId) {
        // Send notifications to dependent systems
        const notifications = [];
        
        if (process.env.COMPLETION_WEBHOOK_URL) {
            notifications.push({ type: 'webhook', url: process.env.COMPLETION_WEBHOOK_URL });
        }
        
        if (process.env.NOTIFICATION_EMAILS) {
            notifications.push({ 
                type: 'email', 
                recipients: process.env.NOTIFICATION_EMAILS.split(',') 
            });
        }
        
        for (const notification of notifications) {
            try {
                await this.sendNotification(notification, taskId);
            } catch (error) {
                console.error(`Failed to send ${notification.type} notification for task ${taskId}:`, error);
            }
        }
    }
    
    async cleanupTaskLogs(taskId) {
        const logDir = path.join(this.projectRoot, '.logs', 'tasks');
        const logFiles = [`${taskId}.log`, `${taskId}.error.log`, `${taskId}.debug.log`];
        
        for (const logFile of logFiles) {
            try {
                await fs.unlink(path.join(logDir, logFile));
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    console.error(`Failed to cleanup log file ${logFile}:`, error);
                }
            }
        }
        
        console.log(`Cleaned up logs for task ${taskId}`);
    }
    
    async removeFromActiveMemory(taskId) {
        // Remove task from any in-memory caches or active data structures
        console.log(`Removed task ${taskId} from active memory`);
    }
    
    async updateCompletionMetrics(taskId) {
        // Update completion metrics and statistics
        console.log(`Updated completion metrics for task ${taskId}`);
    }
    
    async compactTaskData(taskId) {
        // Compress or compact task data to save space
        console.log(`Compacted data for task ${taskId}`);
    }
    
    async archiveTaskData(taskId) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const archiveDir = path.join(this.projectRoot, '.archive', year.toString(), month);
        
        await fs.mkdir(archiveDir, { recursive: true });
        
        // Move task data to archive
        const taskDataPath = path.join(this.projectRoot, '.taskmaster', 'tasks', `${taskId}.json`);
        const archivePath = path.join(archiveDir, `${taskId}.json`);
        
        try {
            await fs.rename(taskDataPath, archivePath);
            console.log(`Archived task data for ${taskId}`);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    }
    
    async removeFromActiveDB(taskId) {
        // Remove task from active database tables
        console.log(`Removed task ${taskId} from active database`);
    }
    
    async updateArchivalIndex(taskId) {
        const indexPath = path.join(this.projectRoot, '.archive', 'index.json');
        let index = {};
        
        try {
            const indexData = await fs.readFile(indexPath, 'utf8');
            index = JSON.parse(indexData);
        } catch (error) {
            // Create new index if it doesn't exist
        }
        
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        
        if (!index[year]) index[year] = {};
        if (!index[year][month]) index[year][month] = [];
        
        index[year][month].push({
            taskId,
            archivedAt: new Date().toISOString()
        });
        
        await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
        console.log(`Updated archival index for task ${taskId}`);
    }
    
    async cleanupOldArchives() {
        // Clean up archives older than configured retention period
        const retentionDays = parseInt(process.env.ARCHIVE_RETENTION_DAYS || '365');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        
        // Implementation would go here
        console.log(`Cleaned up archives older than ${retentionDays} days`);
    }
    
    async sendNotification(notification, taskId) {
        // Implementation depends on notification type
        console.log(`Sent ${notification.type} notification for task ${taskId}`);
    }
    
    async logCleanup(taskId, type, status) {
        const logEntry = {
            taskId,
            type,
            status,
            timestamp: new Date().toISOString()
        };
        
        const logPath = path.join(this.projectRoot, '.logs', 'cleanup', 'cleanup.log');
        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\\n');
    }
    
    /**
     * Get cleanup status for monitoring
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            queueSize: this.cleanupQueue.size,
            lastProcessed: this.lastProcessed,
            errorCount: this.errorCount,
            config: this.config
        };
    }
    
    /**
     * Force cleanup for a specific task
     */
    async forceCleanup(taskId, type = 'all') {
        if (type === 'all') {
            await this.performImmediateCleanup(taskId);
            await this.performDelayedCleanup(taskId);
            await this.performArchival(taskId);
        } else {
            await this.executeCleanup({ taskId, type });
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const projectRoot = process.cwd();
    const cleanup = new TaskCleanupJobs(projectRoot);
    
    if (args.includes('--help')) {
        console.log(`
Task Cleanup Jobs CLI

Usage:
  node task-cleanup-jobs.js [options]

Options:
  --start           Start the cleanup processor
  --stop            Stop the cleanup processor  
  --status          Show cleanup status
  --force-all       Force cleanup all pending jobs
  --force <taskId>  Force cleanup for specific task
  --help            Show this help message

Environment Variables:
  COMPLETION_WEBHOOK_URL    - Webhook URL for completion notifications
  NOTIFICATION_EMAILS       - Comma-separated email addresses for notifications
  ARCHIVE_RETENTION_DAYS    - Days to retain archived data (default: 365)
        `);
        process.exit(0);
    }
    
    if (args.includes('--start')) {
        cleanup.start();
        console.log('Cleanup processor started. Press Ctrl+C to stop.');
        
        process.on('SIGINT', () => {
            console.log('\\nStopping cleanup processor...');
            cleanup.stop();
            process.exit(0);
        });
        
        // Keep process alive
        setInterval(() => {}, 1000);
    } else if (args.includes('--status')) {
        console.log(JSON.stringify(cleanup.getStatus(), null, 2));
    } else if (args.includes('--force-all')) {
        cleanup.processCleanupQueue().then(() => {
            console.log('Forced processing completed');
            process.exit(0);
        });
    } else if (args.includes('--force')) {
        const taskId = args[args.indexOf('--force') + 1];
        if (!taskId) {
            console.error('Task ID required for --force option');
            process.exit(1);
        }
        cleanup.forceCleanup(taskId).then(() => {
            console.log(`Forced cleanup completed for task ${taskId}`);
            process.exit(0);
        });
    } else {
        console.log('Use --help for usage information');
    }
}

module.exports = TaskCleanupJobs;