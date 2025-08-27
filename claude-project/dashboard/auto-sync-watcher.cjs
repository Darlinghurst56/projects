#!/usr/bin/env node

/**
 * Auto-Sync Watcher for TaskMaster Dashboard Integration
 * Monitors TaskMaster tasks.json for changes and automatically syncs with dashboard
 * Provides real-time synchronization with minimal intervention
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const http = require('http');

class AutoSyncWatcher {
    constructor() {
        this.tasksJsonPath = '/mnt/d/Projects/claude-project/.taskmaster/tasks/tasks.json';
        this.syncUtilityPath = '/mnt/d/Projects/y/apps/taskmaster-ai/taskmaster-sync-utility.js';
        this.apiEndpoint = 'http://localhost:3001';
        this.debounceTime = 2000; // 2 seconds debounce
        this.syncTimeout = null;
        this.isWatching = false;
        this.lastSyncTime = null;
        this.syncCount = 0;
        this.errorCount = 0;
        
        this.logWithTimestamp('🚀 Auto-Sync Watcher initialized');
    }

    logWithTimestamp(message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
    }

    /**
     * Check if required files exist
     */
    validateEnvironment() {
        const checks = [
            { path: this.tasksJsonPath, name: 'TaskMaster tasks.json' },
            { path: this.syncUtilityPath, name: 'Sync utility script' }
        ];

        for (const check of checks) {
            if (!fs.existsSync(check.path)) {
                this.logWithTimestamp(`❌ ${check.name} not found at: ${check.path}`);
                return false;
            }
            this.logWithTimestamp(`✅ ${check.name} found`);
        }

        return true;
    }

    /**
     * Test API server connectivity
     */
    async testApiConnectivity() {
        return new Promise((resolve) => {
            const req = http.get(`${this.apiEndpoint}/api/health`, (res) => {
                if (res.statusCode === 200) {
                    this.logWithTimestamp('✅ API server is accessible');
                    resolve(true);
                } else {
                    this.logWithTimestamp(`⚠️  API server responded with status: ${res.statusCode}`);
                    resolve(false);
                }
            });
            
            req.on('error', () => {
                this.logWithTimestamp('❌ API server is not accessible');
                resolve(false);
            });
            
            req.setTimeout(3000, () => {
                req.destroy();
                this.logWithTimestamp('❌ API server request timed out');
                resolve(false);
            });
        });
    }

    /**
     * Trigger sync via API endpoint
     */
    async triggerApiSync() {
        return new Promise((resolve) => {
            const postData = JSON.stringify({ trigger: 'auto-watcher' });
            
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/sync/taskmaster',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        this.logWithTimestamp('✅ API sync triggered successfully');
                        resolve(true);
                    } else {
                        this.logWithTimestamp(`❌ API sync failed with status: ${res.statusCode}`);
                        resolve(false);
                    }
                });
            });

            req.on('error', (error) => {
                this.logWithTimestamp(`❌ API sync request failed: ${error.message}`);
                resolve(false);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                this.logWithTimestamp('❌ API sync request timed out');
                resolve(false);
            });

            req.write(postData);
            req.end();
        });
    }

    /**
     * Fallback sync using direct utility execution
     */
    async triggerDirectSync() {
        return new Promise((resolve) => {
            this.logWithTimestamp('🔄 Triggering direct sync via utility script...');
            
            exec(`node "${this.syncUtilityPath}" sync`, (error, stdout, stderr) => {
                if (error) {
                    this.logWithTimestamp(`❌ Direct sync failed: ${error.message}`);
                    resolve(false);
                    return;
                }

                if (stderr) {
                    this.logWithTimestamp(`⚠️  Direct sync stderr: ${stderr}`);
                }

                this.logWithTimestamp('✅ Direct sync completed');
                if (stdout) {
                    // Log key parts of sync output
                    const lines = stdout.split('\n').filter(line => 
                        line.includes('✅') || line.includes('📊') || line.includes('Tasks synced')
                    );
                    lines.forEach(line => this.logWithTimestamp(`   ${line.trim()}`));
                }
                
                resolve(true);
            });
        });
    }

    /**
     * Perform sync operation with fallback
     */
    async performSync() {
        this.logWithTimestamp('🔄 Starting auto-sync operation...');
        
        let syncSuccess = false;

        // Try API sync first
        const apiConnected = await this.testApiConnectivity();
        if (apiConnected) {
            syncSuccess = await this.triggerApiSync();
        }

        // Fallback to direct sync if API sync failed
        if (!syncSuccess) {
            this.logWithTimestamp('🔄 API sync failed, trying direct sync...');
            syncSuccess = await this.triggerDirectSync();
        }

        if (syncSuccess) {
            this.syncCount++;
            this.lastSyncTime = new Date();
            this.errorCount = 0; // Reset error count on successful sync
            this.logWithTimestamp(`✅ Auto-sync completed (total syncs: ${this.syncCount})`);
        } else {
            this.errorCount++;
            this.logWithTimestamp(`❌ Auto-sync failed (error count: ${this.errorCount})`);
            
            // Stop watching if too many consecutive errors
            if (this.errorCount >= 5) {
                this.logWithTimestamp('🛑 Too many consecutive errors, stopping auto-sync watcher');
                this.stopWatching();
            }
        }

        return syncSuccess;
    }

    /**
     * Handle file change events (debounced)
     */
    handleFileChange() {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }

        this.syncTimeout = setTimeout(async () => {
            this.logWithTimestamp('📁 TaskMaster data changed, triggering sync...');
            await this.performSync();
        }, this.debounceTime);
    }

    /**
     * Start watching for file changes
     */
    startWatching() {
        if (!this.validateEnvironment()) {
            this.logWithTimestamp('❌ Environment validation failed, cannot start watching');
            return false;
        }

        if (this.isWatching) {
            this.logWithTimestamp('⚠️  Already watching for changes');
            return true;
        }

        try {
            this.logWithTimestamp(`👁️  Starting to watch: ${this.tasksJsonPath}`);
            
            // Watch the tasks.json file for changes
            this.watcher = fs.watch(this.tasksJsonPath, (eventType, filename) => {
                if (eventType === 'change') {
                    this.logWithTimestamp(`📝 File change detected: ${filename || 'tasks.json'}`);
                    this.handleFileChange();
                }
            });

            // Also watch the parent directory in case the file is recreated
            const tasksDir = path.dirname(this.tasksJsonPath);
            this.dirWatcher = fs.watch(tasksDir, (eventType, filename) => {
                if (filename === 'tasks.json' && eventType === 'rename') {
                    this.logWithTimestamp('📝 TaskMaster file recreated, triggering sync...');
                    this.handleFileChange();
                }
            });

            this.isWatching = true;
            this.logWithTimestamp('✅ Auto-sync watcher started successfully');
            
            // Perform initial sync
            setTimeout(() => {
                this.logWithTimestamp('🔄 Performing initial sync...');
                this.performSync();
            }, 1000);

            return true;
        } catch (error) {
            this.logWithTimestamp(`❌ Failed to start watching: ${error.message}`);
            return false;
        }
    }

    /**
     * Stop watching for file changes
     */
    stopWatching() {
        if (!this.isWatching) {
            this.logWithTimestamp('⚠️  Not currently watching');
            return;
        }

        try {
            if (this.watcher) {
                this.watcher.close();
            }
            if (this.dirWatcher) {
                this.dirWatcher.close();
            }
            if (this.syncTimeout) {
                clearTimeout(this.syncTimeout);
            }

            this.isWatching = false;
            this.logWithTimestamp('🛑 Auto-sync watcher stopped');
        } catch (error) {
            this.logWithTimestamp(`❌ Error stopping watcher: ${error.message}`);
        }
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isWatching: this.isWatching,
            tasksJsonPath: this.tasksJsonPath,
            lastSyncTime: this.lastSyncTime,
            syncCount: this.syncCount,
            errorCount: this.errorCount,
            debounceTime: this.debounceTime
        };
    }

    /**
     * Manual sync trigger
     */
    async manualSync() {
        this.logWithTimestamp('🔧 Manual sync triggered...');
        return await this.performSync();
    }
}

// CLI interface
if (require.main === module) {
    const watcher = new AutoSyncWatcher();
    
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (command === 'start' || !command) {
        watcher.startWatching();
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\n🛑 Received SIGINT, stopping watcher...');
            watcher.stopWatching();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 Received SIGTERM, stopping watcher...');
            watcher.stopWatching();
            process.exit(0);
        });

        // Log status every 5 minutes
        setInterval(() => {
            const status = watcher.getStatus();
            watcher.logWithTimestamp(`📊 Status: Watching=${status.isWatching}, Syncs=${status.syncCount}, Errors=${status.errorCount}`);
        }, 300000);

    } else if (command === 'sync') {
        watcher.manualSync().then(success => {
            process.exit(success ? 0 : 1);
        });
    } else if (command === 'status') {
        const status = watcher.getStatus();
        console.log('📊 Auto-Sync Watcher Status:');
        console.log(`   • Watching: ${status.isWatching}`);
        console.log(`   • Tasks file: ${status.tasksJsonPath}`);
        console.log(`   • Last sync: ${status.lastSyncTime || 'Never'}`);
        console.log(`   • Total syncs: ${status.syncCount}`);
        console.log(`   • Error count: ${status.errorCount}`);
        console.log(`   • Debounce time: ${status.debounceTime}ms`);
    } else if (command === 'test') {
        watcher.logWithTimestamp('🧪 Testing environment...');
        watcher.validateEnvironment();
        watcher.testApiConnectivity();
    } else {
        console.log('TaskMaster Auto-Sync Watcher');
        console.log('Usage:');
        console.log('  node auto-sync-watcher.js [start]    # Start watching for changes');
        console.log('  node auto-sync-watcher.js sync      # Trigger manual sync');
        console.log('  node auto-sync-watcher.js status    # Show current status');
        console.log('  node auto-sync-watcher.js test      # Test environment setup');
    }
}

module.exports = AutoSyncWatcher;