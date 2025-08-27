#!/usr/bin/env node

/**
 * TaskMaster Sync Utility
 * Synchronizes TaskMaster CLI data with the mock API server
 * Preserves existing tasks while enabling gradual migration
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

class TaskMasterSyncUtility {
    constructor() {
        this.tasksJsonPath = '/mnt/d/Projects/claude-project/.taskmaster/tasks/tasks.json';
        this.mockServerPath = '/mnt/d/Projects/claude-project/dashboard/simple-api-server.js';
        this.backupPath = '/mnt/d/Projects/claude-project/dashboard/simple-api-server.js.backup';
        this.apiEndpoint = 'http://localhost:3001';
    }

    /**
     * Read TaskMaster tasks.json data
     */
    readTaskMasterData() {
        try {
            if (!fs.existsSync(this.tasksJsonPath)) {
                console.log('❌ TaskMaster tasks.json not found at:', this.tasksJsonPath);
                return null;
            }

            const rawData = fs.readFileSync(this.tasksJsonPath, 'utf8');
            const data = JSON.parse(rawData);
            
            console.log('✅ Loaded TaskMaster data');
            console.log(`📊 Found ${Object.keys(data).length} tag(s)`);
            
            return data;
        } catch (error) {
            console.error('❌ Error reading TaskMaster data:', error);
            return null;
        }
    }

    /**
     * Convert TaskMaster task format to mock server format
     */
    convertTaskFormat(taskMasterTask, sourceTag = 'master') {
        const convertedTask = {
            id: taskMasterTask.id.toString(),
            title: taskMasterTask.title,
            description: taskMasterTask.description || taskMasterTask.details || '',
            status: taskMasterTask.status || 'pending',
            priority: taskMasterTask.priority || 'medium',
            assignedAgent: this.inferAgentFromTask(taskMasterTask),
            sourceTag: sourceTag,
            dependencies: taskMasterTask.dependencies || [],
            subtasks: [],
            createdAt: taskMasterTask.createdAt || new Date().toISOString(),
            updatedAt: taskMasterTask.updatedAt || new Date().toISOString()
        };

        // Convert subtasks
        if (taskMasterTask.subtasks && taskMasterTask.subtasks.length > 0) {
            convertedTask.subtasks = taskMasterTask.subtasks.map(subtask => ({
                id: `${taskMasterTask.id}.${subtask.id}`,
                title: subtask.title,
                status: subtask.status || 'pending',
                assignedAgent: this.inferAgentFromTask(subtask) || convertedTask.assignedAgent,
                description: subtask.description || '',
                updates: subtask.updates || []
            }));
        }

        return convertedTask;
    }

    /**
     * Infer agent assignment based on task content
     */
    inferAgentFromTask(task) {
        const title = (task.title || '').toLowerCase();
        const description = (task.description || task.details || '').toLowerCase();
        const content = `${title} ${description}`;

        if (content.includes('test') || content.includes('qa') || content.includes('validation')) {
            return 'qa-specialist';
        }
        if (content.includes('ui') || content.includes('css') || content.includes('html') || content.includes('visual')) {
            return 'ui-developer';
        }
        if (content.includes('api') || content.includes('server') || content.includes('integration') || content.includes('backend')) {
            return 'integration-specialist';
        }
        if (content.includes('deploy') || content.includes('docker') || content.includes('server') || content.includes('infrastructure')) {
            return 'server-agent';
        }
        
        return 'integration-specialist'; // Default assignment
    }

    /**
     * Create backup of current mock server
     */
    createBackup() {
        try {
            if (fs.existsSync(this.mockServerPath)) {
                fs.copyFileSync(this.mockServerPath, this.backupPath);
                console.log('✅ Created backup of mock server');
                return true;
            }
        } catch (error) {
            console.error('❌ Error creating backup:', error);
            return false;
        }
    }

    /**
     * Update mock server with new task data
     */
    updateMockServer(convertedTasks) {
        try {
            let serverContent = fs.readFileSync(this.mockServerPath, 'utf8');
            
            // Find the mockTasks array
            const mockTasksRegex = /const mockTasks = \[[\s\S]*?\];/;
            const mockTasksMatch = serverContent.match(mockTasksRegex);
            
            if (!mockTasksMatch) {
                console.error('❌ Could not find mockTasks array in server file');
                return false;
            }

            // Generate new mockTasks array
            const newMockTasks = `const mockTasks = ${JSON.stringify(convertedTasks, null, 4)};`;
            
            // Replace the mockTasks array
            serverContent = serverContent.replace(mockTasksRegex, newMockTasks);
            
            // Write the updated content back
            fs.writeFileSync(this.mockServerPath, serverContent);
            
            console.log('✅ Updated mock server with new task data');
            console.log(`📊 Synced ${convertedTasks.length} tasks`);
            
            return true;
        } catch (error) {
            console.error('❌ Error updating mock server:', error);
            return false;
        }
    }

    /**
     * Test API server connectivity
     */
    async testApiConnectivity() {
        return new Promise((resolve) => {
            const req = http.get(`${this.apiEndpoint}/api/health`, (res) => {
                if (res.statusCode === 200) {
                    console.log('✅ API server is running and accessible');
                    resolve(true);
                } else {
                    console.log('⚠️  API server responded with status:', res.statusCode);
                    resolve(false);
                }
            });
            
            req.on('error', () => {
                console.log('❌ API server is not accessible');
                resolve(false);
            });
            
            req.setTimeout(5000, () => {
                req.destroy();
                console.log('❌ API server request timed out');
                resolve(false);
            });
        });
    }

    /**
     * Restart API server (if needed)
     */
    restartApiServer() {
        console.log('🔄 Note: You may need to restart the API server for changes to take effect');
        console.log('   Current server process should be restarted manually');
    }

    /**
     * Generate sync report
     */
    generateSyncReport(originalData, convertedTasks) {
        const report = {
            timestamp: new Date().toISOString(),
            source: this.tasksJsonPath,
            target: this.mockServerPath,
            tags: Object.keys(originalData),
            taskCount: convertedTasks.length,
            tasksWithSubtasks: convertedTasks.filter(t => t.subtasks.length > 0).length,
            statusBreakdown: {},
            agentAssignment: {}
        };

        // Generate status breakdown
        convertedTasks.forEach(task => {
            report.statusBreakdown[task.status] = (report.statusBreakdown[task.status] || 0) + 1;
            report.agentAssignment[task.assignedAgent] = (report.agentAssignment[task.assignedAgent] || 0) + 1;
        });

        return report;
    }

    /**
     * Main sync operation
     */
    async performSync() {
        console.log('🔄 Starting TaskMaster sync operation...');
        console.log('=' .repeat(50));

        // Step 1: Test API connectivity
        const apiConnected = await this.testApiConnectivity();
        
        // Step 2: Read TaskMaster data
        const taskMasterData = this.readTaskMasterData();
        if (!taskMasterData) {
            console.log('❌ Sync failed: Could not read TaskMaster data');
            return false;
        }

        // Step 3: Convert tasks from all tags
        const convertedTasks = [];
        for (const [tagName, tagData] of Object.entries(taskMasterData)) {
            if (tagData.tasks && Array.isArray(tagData.tasks)) {
                console.log(`📝 Processing tag: ${tagName} (${tagData.tasks.length} tasks)`);
                
                for (const task of tagData.tasks) {
                    const converted = this.convertTaskFormat(task, tagName);
                    convertedTasks.push(converted);
                }
            }
        }

        if (convertedTasks.length === 0) {
            console.log('⚠️  No tasks found to sync');
            return false;
        }

        // Step 4: Create backup
        if (!this.createBackup()) {
            console.log('❌ Sync failed: Could not create backup');
            return false;
        }

        // Step 5: Update mock server
        if (!this.updateMockServer(convertedTasks)) {
            console.log('❌ Sync failed: Could not update mock server');
            return false;
        }

        // Step 6: Generate report
        const report = this.generateSyncReport(taskMasterData, convertedTasks);
        
        console.log('=' .repeat(50));
        console.log('✅ Sync completed successfully!');
        console.log('📊 Sync Report:');
        console.log(`   • Tasks synced: ${report.taskCount}`);
        console.log(`   • Tags processed: ${report.tags.join(', ')}`);
        console.log(`   • Tasks with subtasks: ${report.tasksWithSubtasks}`);
        console.log(`   • Status breakdown:`, report.statusBreakdown);
        console.log(`   • Agent assignments:`, report.agentAssignment);
        
        if (apiConnected) {
            this.restartApiServer();
        }

        return true;
    }

    /**
     * Dry run - show what would be synced without making changes
     */
    async dryRun() {
        console.log('🔍 Performing dry run (no changes will be made)...');
        console.log('=' .repeat(50));

        const taskMasterData = this.readTaskMasterData();
        if (!taskMasterData) {
            console.log('❌ Dry run failed: Could not read TaskMaster data');
            return false;
        }

        const convertedTasks = [];
        for (const [tagName, tagData] of Object.entries(taskMasterData)) {
            if (tagData.tasks && Array.isArray(tagData.tasks)) {
                console.log(`📝 Would process tag: ${tagName} (${tagData.tasks.length} tasks)`);
                
                for (const task of tagData.tasks) {
                    const converted = this.convertTaskFormat(task, tagName);
                    convertedTasks.push(converted);
                    console.log(`   • ${converted.id}: ${converted.title} (${converted.status}) -> ${converted.assignedAgent}`);
                }
            }
        }

        const report = this.generateSyncReport(taskMasterData, convertedTasks);
        
        console.log('=' .repeat(50));
        console.log('📊 Dry Run Report:');
        console.log(`   • Tasks that would be synced: ${report.taskCount}`);
        console.log(`   • Tags that would be processed: ${report.tags.join(', ')}`);
        console.log(`   • Status breakdown:`, report.statusBreakdown);
        console.log(`   • Agent assignments:`, report.agentAssignment);
        console.log('🔍 Dry run completed - no changes made');

        return true;
    }
}

// CLI interface
if (require.main === module) {
    const syncUtility = new TaskMasterSyncUtility();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'dry-run' || command === '--dry-run') {
        syncUtility.dryRun();
    } else if (command === 'sync' || !command) {
        syncUtility.performSync();
    } else {
        console.log('TaskMaster Sync Utility');
        console.log('Usage:');
        console.log('  node taskmaster-sync-utility.js [sync]     # Perform sync');
        console.log('  node taskmaster-sync-utility.js dry-run   # Show what would be synced');
    }
}

module.exports = TaskMasterSyncUtility;