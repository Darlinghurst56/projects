#!/usr/bin/env node

/**
 * TaskMaster CLI Wrapper for API
 * Simplified approach that uses TaskMaster CLI directly
 * Preserves TaskMaster structure and workspace system
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class TaskMasterCLIWrapper {
    constructor() {
        this.currentTag = null;
    }

    /**
     * Execute TaskMaster CLI command and return parsed output
     */
    async execute(command) {
        try {
            const { stdout, stderr } = await execPromise(`task-master ${command}`);
            if (stderr) console.error('CLI Warning:', stderr);
            return stdout;
        } catch (error) {
            console.error('CLI Error:', error);
            throw error;
        }
    }

    /**
     * Get current workspace/tag
     */
    async getCurrentTag() {
        const output = await this.execute('tags');
        const match = output.match(/● (\S+)/);
        return match ? match[1] : 'master';
    }

    /**
     * Switch to a workspace/tag
     */
    async useTag(tagName) {
        await this.execute(`use-tag ${tagName}`);
        this.currentTag = tagName;
    }

    /**
     * Get tasks for current workspace
     */
    async getTasks() {
        const output = await this.execute('list');
        // Parse the table output to extract tasks
        const tasks = [];
        const lines = output.split('\n');
        
        for (const line of lines) {
            // Match task lines: │ ID │ Title │ Status │ Priority │
            const match = line.match(/│\s*(\d+)\s*│\s*([^│]+)\s*│\s*([^│]+)\s*│\s*([^│]+)\s*│/);
            if (match && match[1] !== 'ID') {
                tasks.push({
                    id: match[1].trim(),
                    title: match[2].trim().replace('...', ''),
                    status: this.parseStatus(match[3].trim()),
                    priority: match[4].trim()
                });
            }
        }
        
        return tasks;
    }

    /**
     * Parse status symbols to text
     */
    parseStatus(statusSymbol) {
        if (statusSymbol.includes('✓') || statusSymbol.includes('done')) return 'done';
        if (statusSymbol.includes('►') || statusSymbol.includes('in-prog')) return 'in-progress';
        if (statusSymbol.includes('○') || statusSymbol.includes('pending')) return 'pending';
        return statusSymbol;
    }

    /**
     * Get next task
     */
    async getNextTask() {
        const output = await this.execute('next');
        // Extract task ID from output
        const match = output.match(/Next Task: #(\d+(?:\.\d+)?)/);
        return match ? match[1] : null;
    }

    /**
     * Update task status
     */
    async updateTaskStatus(taskId, status) {
        return await this.execute(`set-status --id=${taskId} --status=${status}`);
    }

    /**
     * Show task details
     */
    async showTask(taskId) {
        return await this.execute(`show ${taskId}`);
    }
}

module.exports = TaskMasterCLIWrapper;