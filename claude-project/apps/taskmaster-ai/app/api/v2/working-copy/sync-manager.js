/**
 * Sync Manager - Option C Implementation
 * Handles automatic and manual synchronization between TaskMaster and working copy
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class SyncManager extends EventEmitter {
    constructor(projectRoot, options = {}) {
        super();
        
        this.projectRoot = projectRoot;
        this.workingTasksFile = path.join(projectRoot, '.taskmaster/working-tasks.json');
        this.tasksFile = path.join(projectRoot, '.taskmaster/tasks/tasks.json');
        this.agentsFile = path.join(projectRoot, '.taskmaster/agents/agents.json');
        
        // Configuration
        this.autoSyncEnabled = options.autoSync !== false; // Default to true
        this.syncInterval = options.syncInterval || 30000; // 30 seconds default
        this.conflictResolution = options.conflictResolution || 'working-copy-wins';
        
        // State
        this.isRunning = false;
        this.syncTimer = null;
        this.lastSyncAttempt = null;
        this.syncErrors = [];
        
        this.init();
    }

    init() {
        // Ensure working copy exists
        this.initializeWorkingCopy();
        
        // Start auto-sync if enabled
        if (this.autoSyncEnabled) {
            this.startAutoSync();
        }
        
        console.log('✅ Sync Manager initialized');
    }

    /**
     * Initialize working copy if it doesn't exist
     */
    initializeWorkingCopy() {
        if (!fs.existsSync(this.workingTasksFile)) {
            console.log('📋 Initializing working copy...');
            this.syncFromTaskMaster();
        }
    }

    /**
     * Start automatic synchronization
     */
    startAutoSync() {
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        this.syncTimer = setInterval(() => {
            this.performAutoSync();
        }, this.syncInterval);
        
        console.log(`🔄 Auto-sync started (interval: ${this.syncInterval}ms)`);
        this.emit('autoSyncStarted');
    }

    /**
     * Stop automatic synchronization
     */
    stopAutoSync() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
        
        console.log('⏹️ Auto-sync stopped');
        this.emit('autoSyncStopped');
    }

    /**
     * Perform automatic sync check
     */
    async performAutoSync() {
        try {
            this.lastSyncAttempt = new Date().toISOString();
            
            const syncStatus = this.getSyncStatus();
            
            // Only sync if TaskMaster has been modified since last sync
            if (syncStatus.sync.needsSync) {
                console.log('🔄 Auto-sync: TaskMaster changes detected, syncing...');
                await this.syncFromTaskMaster();
                this.emit('autoSyncCompleted', { source: 'taskmaster' });
            }
            
        } catch (error) {
            console.error('❌ Auto-sync error:', error.message);
            this.syncErrors.push({
                timestamp: new Date().toISOString(),
                error: error.message
            });
            
            // Keep only last 10 errors
            if (this.syncErrors.length > 10) {
                this.syncErrors = this.syncErrors.slice(-10);
            }
            
            this.emit('autoSyncError', error);
        }
    }

    /**
     * Manual sync from TaskMaster to working copy
     */
    async syncFromTaskMaster() {
        try {
            if (!fs.existsSync(this.tasksFile)) {
                throw new Error('TaskMaster tasks file not found');
            }

            console.log('📥 Syncing from TaskMaster to working copy...');

            const tasksData = JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
            const workingData = this.loadWorkingTasks();

            // Extract tasks from master workspace
            const masterTasks = tasksData.master?.tasks || [];
            
            // Load agent data
            let agentsData = {};
            if (fs.existsSync(this.agentsFile)) {
                const agents = JSON.parse(fs.readFileSync(this.agentsFile, 'utf8'));
                agents.forEach(agent => {
                    agentsData[agent.id] = {
                        name: agent.name || agent.id,
                        capabilities: agent.capabilities || [],
                        status: agent.status || 'active',
                        assignedTasks: agent.assignedTasks || []
                    };
                });
            }

            // Update working copy (preserving UI-only changes)
            const updatedWorkingData = this.mergeTaskData(workingData, {
                tasks: masterTasks,
                agents: agentsData
            });

            updatedWorkingData.lastSync = new Date().toISOString();
            this.saveWorkingTasks(updatedWorkingData);

            console.log(`✅ Synced ${masterTasks.length} tasks from TaskMaster`);
            
            this.emit('syncFromTaskMaster', {
                taskCount: masterTasks.length,
                agentCount: Object.keys(agentsData).length
            });

            return {
                success: true,
                taskCount: masterTasks.length,
                agentCount: Object.keys(agentsData).length
            };

        } catch (error) {
            console.error('❌ Sync from TaskMaster failed:', error.message);
            throw error;
        }
    }

    /**
     * Manual sync from working copy to TaskMaster
     */
    async syncToTaskMaster() {
        try {
            console.log('📤 Syncing from working copy to TaskMaster...');

            const workingData = this.loadWorkingTasks();
            
            if (!fs.existsSync(this.tasksFile)) {
                throw new Error('TaskMaster tasks file not found');
            }

            const tasksData = JSON.parse(fs.readFileSync(this.tasksFile, 'utf8'));
            
            // Update master workspace with working copy tasks
            if (!tasksData.master) {
                tasksData.master = { tasks: [] };
            }
            
            tasksData.master.tasks = workingData.tasks;

            // Save back to TaskMaster
            fs.writeFileSync(this.tasksFile, JSON.stringify(tasksData, null, 2));

            // Update agents file
            if (fs.existsSync(this.agentsFile)) {
                const agents = JSON.parse(fs.readFileSync(this.agentsFile, 'utf8'));
                
                // Update agent assignments from working copy
                agents.forEach(agent => {
                    if (workingData.agents[agent.id]) {
                        agent.assignedTasks = workingData.agents[agent.id].assignedTasks || [];
                        agent.status = workingData.agents[agent.id].status || 'active';
                        agent.lastUpdated = new Date().toISOString();
                    }
                });
                
                fs.writeFileSync(this.agentsFile, JSON.stringify(agents, null, 2));
            }

            console.log(`✅ Synced ${workingData.tasks.length} tasks to TaskMaster`);
            
            this.emit('syncToTaskMaster', {
                taskCount: workingData.tasks.length
            });

            return {
                success: true,
                updatedTasks: workingData.tasks.length
            };

        } catch (error) {
            console.error('❌ Sync to TaskMaster failed:', error.message);
            throw error;
        }
    }

    /**
     * Merge task data with conflict resolution
     */
    mergeTaskData(workingData, newData) {
        const merged = {
            ...workingData,
            tasks: newData.tasks,
            agents: { ...workingData.agents, ...newData.agents }
        };

        // Apply conflict resolution for task assignments made in UI
        if (this.conflictResolution === 'working-copy-wins') {
            // Preserve task assignments made in working copy
            merged.tasks.forEach(task => {
                const workingTask = workingData.tasks?.find(t => t.id === task.id);
                if (workingTask?.agentMetadata?.assignedAgent) {
                    // Keep working copy assignment if it exists
                    task.agentMetadata = { ...task.agentMetadata, ...workingTask.agentMetadata };
                }
            });
        }

        return merged;
    }

    /**
     * Load working tasks from working-tasks.json
     */
    loadWorkingTasks() {
        if (!fs.existsSync(this.workingTasksFile)) {
            return {
                tasks: [],
                agents: {},
                lastSync: null,
                lastModified: new Date().toISOString(),
                metadata: {
                    version: '1.0.0',
                    type: 'working-copy'
                }
            };
        }
        
        return JSON.parse(fs.readFileSync(this.workingTasksFile, 'utf8'));
    }

    /**
     * Save working tasks to working-tasks.json
     */
    saveWorkingTasks(data) {
        data.lastModified = new Date().toISOString();
        fs.writeFileSync(this.workingTasksFile, JSON.stringify(data, null, 2));
    }

    /**
     * Get sync status between working copy and TaskMaster
     */
    getSyncStatus() {
        const workingData = this.loadWorkingTasks();
        
        let taskmasterModified = null;
        if (fs.existsSync(this.tasksFile)) {
            const stats = fs.statSync(this.tasksFile);
            taskmasterModified = stats.mtime.toISOString();
        }

        const workingModified = workingData.lastModified;
        const lastSync = workingData.lastSync;

        return {
            manager: {
                isRunning: this.isRunning,
                autoSyncEnabled: this.autoSyncEnabled,
                lastSyncAttempt: this.lastSyncAttempt,
                errorCount: this.syncErrors.length
            },
            workingCopy: {
                exists: fs.existsSync(this.workingTasksFile),
                lastModified: workingModified,
                taskCount: workingData.tasks?.length || 0
            },
            taskmaster: {
                exists: fs.existsSync(this.tasksFile),
                lastModified: taskmasterModified
            },
            sync: {
                lastSync: lastSync,
                needsSync: !lastSync || (taskmasterModified && taskmasterModified > lastSync)
            }
        };
    }

    /**
     * Get recent sync errors
     */
    getRecentErrors() {
        return this.syncErrors;
    }

    /**
     * Clear sync errors
     */
    clearErrors() {
        this.syncErrors = [];
        this.emit('errorsCleared');
    }

    /**
     * Force immediate sync
     */
    async forceSyncFromTaskMaster() {
        console.log('🔄 Force sync from TaskMaster requested');
        return await this.syncFromTaskMaster();
    }

    /**
     * Force immediate sync to TaskMaster
     */
    async forceSyncToTaskMaster() {
        console.log('🔄 Force sync to TaskMaster requested');
        return await this.syncToTaskMaster();
    }

    /**
     * Cleanup and shutdown
     */
    destroy() {
        this.stopAutoSync();
        this.removeAllListeners();
        console.log('🛑 Sync Manager destroyed');
    }
}

module.exports = SyncManager;