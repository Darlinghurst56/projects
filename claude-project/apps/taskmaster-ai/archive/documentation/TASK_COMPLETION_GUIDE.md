# Task Completion and Cleanup Guide

## Overview

This guide covers proper task completion procedures and cleanup jobs for the Taskmaster Agent Workflow system. Follow these procedures to ensure tasks are properly completed and system resources are managed efficiently.

## Task Lifecycle States

```
pending → assigned → in_progress → completed → archived
                  ↘ failed → retry_pending
```

### State Definitions

- **pending**: Task created, waiting for assignment
- **assigned**: Task assigned to agent, not yet started
- **in_progress**: Agent actively working on task
- **completed**: Task successfully finished
- **failed**: Task failed, may need retry
- **retry_pending**: Failed task waiting for retry
- **archived**: Completed task moved to long-term storage

## Proper Task Completion Procedure

### 1. Agent-Side Completion

```javascript
// In agent code
async function completeTask(taskId, result) {
    try {
        // 1. Mark task as completed locally
        const task = await this.getTask(taskId);
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.result = result;
        
        // 2. Notify coordination system
        await this.notifyTaskCompletion(taskId, result);
        
        // 3. Update agent status
        this.removeAssignedTask(taskId);
        
        // 4. Clean up local resources
        await this.cleanupTaskResources(taskId);
        
    } catch (error) {
        console.error(`Failed to complete task ${taskId}:`, error);
        await this.markTaskFailed(taskId, error.message);
    }
}
```

### 2. System-Side Completion Handling

```javascript
// In coordination-workflow.cjs
completeTaskAssignment(taskId, agentId, result = null) {
    const agent = this.agents.find(a => a.id === agentId);
    if (agent) {
        // Remove from assigned tasks
        agent.assignedTasks = agent.assignedTasks.filter(id => id !== taskId);
        
        // Set cooldown period
        if (agent.assignedTasks.length === 0) {
            agent.status = 'cooldown';
            agent.cooldownUntil = new Date(Date.now() + 30000).toISOString();
            
            // Schedule return to available status
            setTimeout(() => {
                const currentAgent = this.agents.find(a => a.id === agentId);
                if (currentAgent && currentAgent.status === 'cooldown') {
                    currentAgent.status = 'available';
                    currentAgent.cooldownUntil = null;
                    this.saveAgents();
                }
            }, 30000);
        }
        
        // Update metrics
        this.updateAgentMetrics(agentId, 'completed');
        
        // Schedule cleanup job
        this.scheduleTaskCleanup(taskId);
        
        this.saveAgents();
        this.saveCoordinationState();
        return true;
    }
    return false;
}
```

## Task Ending Jobs

### 1. Immediate Cleanup (0-5 minutes after completion)

```javascript
// File: task-cleanup-jobs.js
class TaskCleanupJobs {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.cleanupQueue = new Map();
    }
    
    // Schedule immediate cleanup
    scheduleImmediateCleanup(taskId) {
        setTimeout(() => {
            this.performImmediateCleanup(taskId);
        }, 60000); // 1 minute delay
    }
    
    async performImmediateCleanup(taskId) {
        try {
            // 1. Clear temporary files
            await this.clearTempFiles(taskId);
            
            // 2. Release system resources
            await this.releaseResources(taskId);
            
            // 3. Update task status in database
            await this.updateTaskStatus(taskId, 'completed');
            
            // 4. Notify dependent systems
            await this.notifyCompletion(taskId);
            
            console.log(`Immediate cleanup completed for task ${taskId}`);
        } catch (error) {
            console.error(`Immediate cleanup failed for task ${taskId}:`, error);
        }
    }
}
```

### 2. Delayed Cleanup (1-24 hours after completion)

```javascript
// Schedule delayed cleanup
scheduleDelayedCleanup(taskId) {
    const cleanupTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    this.cleanupQueue.set(taskId, {
        scheduledFor: cleanupTime,
        type: 'delayed'
    });
}

async performDelayedCleanup(taskId) {
    try {
        // 1. Archive task data
        await this.archiveTaskData(taskId);
        
        // 2. Clean up logs
        await this.cleanupTaskLogs(taskId);
        
        // 3. Remove from active memory
        await this.removeFromActiveMemory(taskId);
        
        // 4. Update metrics
        await this.updateCompletionMetrics(taskId);
        
        console.log(`Delayed cleanup completed for task ${taskId}`);
    } catch (error) {
        console.error(`Delayed cleanup failed for task ${taskId}:`, error);
    }
}
```

### 3. Long-term Archival (7+ days after completion)

```javascript
// Schedule archival
scheduleArchival(taskId) {
    const archivalTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    this.cleanupQueue.set(taskId, {
        scheduledFor: archivalTime,
        type: 'archival'
    });
}

async performArchival(taskId) {
    try {
        // 1. Move to cold storage
        await this.moveToColdStorage(taskId);
        
        // 2. Remove from active database
        await this.removeFromActiveDB(taskId);
        
        // 3. Update archival index
        await this.updateArchivalIndex(taskId);
        
        console.log(`Archival completed for task ${taskId}`);
    } catch (error) {
        console.error(`Archival failed for task ${taskId}:`, error);
    }
}
```

## Cleanup Job Implementation

### 1. File: task-cleanup-jobs.js

```javascript
const fs = require('fs').promises;
const path = require('path');

class TaskCleanupJobs {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.cleanupQueue = new Map();
        this.isRunning = false;
        
        // Start cleanup processor
        this.startCleanupProcessor();
    }
    
    startCleanupProcessor() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        // Process cleanup queue every minute
        setInterval(() => {
            this.processCleanupQueue();
        }, 60000);
    }
    
    async processCleanupQueue() {
        const now = Date.now();
        
        for (const [taskId, cleanup] of this.cleanupQueue.entries()) {
            if (cleanup.scheduledFor <= now) {
                try {
                    switch (cleanup.type) {
                        case 'immediate':
                            await this.performImmediateCleanup(taskId);
                            break;
                        case 'delayed':
                            await this.performDelayedCleanup(taskId);
                            break;
                        case 'archival':
                            await this.performArchival(taskId);
                            break;
                    }
                    this.cleanupQueue.delete(taskId);
                } catch (error) {
                    console.error(`Cleanup failed for task ${taskId}:`, error);
                    // Retry in 1 hour
                    cleanup.scheduledFor = now + (60 * 60 * 1000);
                }
            }
        }
    }
    
    async clearTempFiles(taskId) {
        const tempDir = path.join(this.projectRoot, '.temp', taskId);
        try {
            await fs.rmdir(tempDir, { recursive: true });
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    }
    
    async releaseResources(taskId) {
        // Clear any open file handles, database connections, etc.
        // Implementation depends on specific resource types
    }
    
    async updateTaskStatus(taskId, status) {
        const TaskMasterIntegration = require('./.taskmaster/agents/taskmaster-integration.cjs');
        const taskmaster = new TaskMasterIntegration(this.projectRoot);
        await taskmaster.updateTaskStatus(taskId, status);
    }
    
    async notifyCompletion(taskId) {
        // Send notifications to dependent systems
        const notifications = [
            { type: 'webhook', url: process.env.COMPLETION_WEBHOOK_URL },
            { type: 'email', recipients: process.env.NOTIFICATION_EMAILS?.split(',') || [] }
        ];
        
        for (const notification of notifications) {
            try {
                await this.sendNotification(notification, taskId);
            } catch (error) {
                console.error(`Failed to send ${notification.type} notification:`, error);
            }
        }
    }
    
    async archiveTaskData(taskId) {
        const archiveDir = path.join(this.projectRoot, '.archive', new Date().getFullYear().toString());
        await fs.mkdir(archiveDir, { recursive: true });
        
        // Move task data to archive
        const taskDataPath = path.join(this.projectRoot, '.taskmaster', 'tasks', `${taskId}.json`);
        const archivePath = path.join(archiveDir, `${taskId}.json`);
        
        try {
            await fs.rename(taskDataPath, archivePath);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    }
}

module.exports = TaskCleanupJobs;
```

## Integration with Main System

### 1. Update coordination-workflow.cjs

```javascript
// Add to imports
const TaskCleanupJobs = require('../task-cleanup-jobs.js');

// Add to constructor
constructor(projectRoot) {
    // ... existing code ...
    this.cleanupJobs = new TaskCleanupJobs(projectRoot);
}

// Update completeTaskAssignment method
completeTaskAssignment(taskId, agentId, result = null) {
    // ... existing code ...
    
    // Schedule cleanup jobs
    this.cleanupJobs.scheduleImmediateCleanup(taskId);
    this.cleanupJobs.scheduleDelayedCleanup(taskId);
    this.cleanupJobs.scheduleArchival(taskId);
    
    return true;
}
```

### 2. Update package.json scripts

```json
{
  "scripts": {
    "cleanup": "node task-cleanup-jobs.js",
    "cleanup:force": "node task-cleanup-jobs.js --force-all",
    "cleanup:archive": "node task-cleanup-jobs.js --archive-only"
  }
}
```

## Monitoring and Alerts

### 1. Cleanup Job Health Check

```javascript
// Add to taskmaster-api-server.js
app.get('/api/cleanup/status', (req, res) => {
    const cleanupJobs = agentCoordination.cleanupJobs;
    
    res.json({
        isRunning: cleanupJobs.isRunning,
        queueSize: cleanupJobs.cleanupQueue.size,
        lastProcessed: cleanupJobs.lastProcessed || null,
        errors: cleanupJobs.errorCount || 0
    });
});
```

### 2. Failed Cleanup Alert

```javascript
// Monitor for failed cleanups
async processCleanupQueue() {
    // ... existing code ...
    
    if (error) {
        this.errorCount = (this.errorCount || 0) + 1;
        
        // Alert if too many failures
        if (this.errorCount > 10) {
            await this.sendAlert('High cleanup failure rate detected');
        }
    }
}
```

## Best Practices

1. **Always schedule cleanup jobs when completing tasks**
2. **Handle cleanup failures gracefully with retries**
3. **Monitor cleanup job health and performance**
4. **Set up alerts for cleanup failures**
5. **Regularly review and optimize cleanup schedules**
6. **Keep archived data accessible but separate from active data**
7. **Document any custom cleanup requirements for specific task types**

## Troubleshooting

### Common Issues

1. **Cleanup jobs not running**: Check if cleanup processor is started
2. **Temp files accumulating**: Verify immediate cleanup is working
3. **Database growing too large**: Check if archival jobs are running
4. **High memory usage**: Monitor delayed cleanup effectiveness

### Debug Commands

```bash
# Check cleanup queue status
curl http://localhost:3001/api/cleanup/status

# Force run cleanup jobs
npm run cleanup:force

# Check archived tasks
ls -la .archive/

# Monitor temp directory size
du -sh .temp/
```

---

**Last Updated**: 2025-07-13  
**Version**: 1.0  
**Authors**: Claude Code - Taskmaster Team