#!/usr/bin/env node

/**
 * Agent Role Assignment Protocol for TaskMaster Integration
 * Implements tag-based agent coordination system using TaskMaster's built-in functionality with context validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AgentRoleAssignmentProtocol {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
        this.tasksFile = path.join(projectRoot, '.taskmaster', 'tasks', 'tasks.json');
        this.configFile = path.join(projectRoot, '.taskmaster', 'config.json');
        this.stateFile = path.join(projectRoot, '.taskmaster', 'state.json');
        this.availableRoles = [
            'frontend-architect',
            'ui-developer', 
            'integration-specialist',
            'qa-specialist',
            'server-agent'
        ];
    }

    /**
     * Step 1: Check available agent role tags
     * Command: task-master tags
     */
    async checkAvailableTags() {
        console.log('🏷️  Checking available agent role tags...');
        try {
            const result = execSync('task-master tags --show-metadata', {
                cwd: this.projectRoot,
                encoding: 'utf-8'
            });
            
            const tags = this.parseTagOutput(result);
            console.log('Available agent roles:');
            tags.forEach(tag => {
                if (this.availableRoles.includes(tag.name)) {
                    console.log(`  ✅ ${tag.name}: ${tag.description} (${tag.taskCount} tasks)`);
                }
            });
            
            return tags.filter(tag => this.availableRoles.includes(tag.name));
        } catch (error) {
            console.error('❌ Failed to check tags:', error.message);
            throw error;
        }
    }

    /**
     * Step 2: Switch to role-specific tag context
     * Command: task-master use-tag <role>
     */
    async switchToRole(roleName) {
        if (!this.availableRoles.includes(roleName)) {
            throw new Error(`Invalid role: ${roleName}. Available roles: ${this.availableRoles.join(', ')}`);
        }

        console.log(`🔄 Switching to ${roleName} role context...`);
        try {
            const result = execSync(`task-master use-tag ${roleName}`, {
                cwd: this.projectRoot,
                encoding: 'utf-8'
            });
            
            console.log(`✅ Successfully switched to ${roleName} context`);
            return { success: true, role: roleName, output: result };
        } catch (error) {
            console.error(`❌ Failed to switch to ${roleName}:`, error.message);
            throw error;
        }
    }

    /**
     * Step 3: View role-specific tasks  
     * Command: task-master list
     */
    async viewRoleTasks(status = null) {
        console.log('📋 Listing role-specific tasks...');
        try {
            const statusFlag = status ? `--status=${status}` : '';
            const result = execSync(`task-master list ${statusFlag}`, {
                cwd: this.projectRoot,
                encoding: 'utf-8'
            });
            
            console.log('Current role tasks:');
            console.log(result);
            return this.parseTaskOutput(result);
        } catch (error) {
            console.error('❌ Failed to list tasks:', error.message);
            throw error;
        }
    }

    /**
     * Step 4: Claim task by updating status
     * Command: task-master set-status --id=<id> --status=in-progress
     */
    async claimTask(taskId, agentIdentifier = 'unnamed-agent') {
        console.log(`🎯 Claiming task ${taskId}...`);
        try {
            // First set status to in-progress
            const statusResult = execSync(`task-master set-status --id=${taskId} --status=in-progress`, {
                cwd: this.projectRoot,
                encoding: 'utf-8'
            });

            // Then add agent context
            const timestamp = new Date().toISOString();
            const contextMessage = `AGENT: ${agentIdentifier} - Claimed task ${taskId} at ${timestamp}`;
            
            try {
                const contextResult = execSync(`task-master update-subtask --id=${taskId} --prompt="${contextMessage}"`, {
                    cwd: this.projectRoot,
                    encoding: 'utf-8'
                });
                console.log(`✅ Task ${taskId} claimed by ${agentIdentifier}`);
                return { taskId, agentIdentifier, timestamp, success: true };
            } catch (subtaskError) {
                // If it's not a subtask, try updating the main task
                try {
                    const mainTaskResult = execSync(`task-master update-task --id=${taskId} --prompt="${contextMessage}"`, {
                        cwd: this.projectRoot,
                        encoding: 'utf-8'
                    });
                    console.log(`✅ Task ${taskId} claimed by ${agentIdentifier}`);
                    return { taskId, agentIdentifier, timestamp, success: true };
                } catch (mainTaskError) {
                    console.log(`⚠️  Task ${taskId} status updated but could not add agent context`);
                    return { taskId, agentIdentifier, timestamp, success: true, warning: 'Context not added' };
                }
            }
        } catch (error) {
            console.error(`❌ Failed to claim task ${taskId}:`, error.message);
            throw error;
        }
    }

    /**
     * Step 5: Add role context to task/subtask
     * Command: task-master update-subtask --id=<id> --prompt="AGENT: <role> - <message>"
     */
    async addRoleContext(taskId, roleName, message, isSubtask = false) {
        const timestamp = new Date().toISOString();
        const contextMessage = `AGENT: ${roleName} - ${message} (${timestamp})`;
        
        console.log(`📝 Adding role context to ${isSubtask ? 'subtask' : 'task'} ${taskId}...`);
        try {
            const command = isSubtask ? 'update-subtask' : 'update-task';
            const result = execSync(`task-master ${command} --id=${taskId} --prompt="${contextMessage}"`, {
                cwd: this.projectRoot,
                encoding: 'utf-8'
            });
            
            console.log(`✅ Role context added to ${taskId}`);
            return { taskId, roleName, message, timestamp, success: true };
        } catch (error) {
            console.error(`❌ Failed to add context to ${taskId}:`, error.message);
            throw error;
        }
    }

    /**
     * Validate current tag context matches expected role
     * @param {string} expectedRole - Role that should be active
     * @returns {Object} Validation result
     */
    async validateTagContext(expectedRole) {
        console.log(`🔍 Validating tag context for role: ${expectedRole}`);
        
        try {
            // Get current tag from TaskMaster state
            const currentTag = await this.getCurrentTag();
            
            // Check if current tag matches expected role
            const isValid = currentTag === expectedRole;
            
            const result = {
                isValid,
                currentTag,
                expectedRole,
                message: isValid ? 
                    `✅ Context validated: working in ${currentTag} tag` :
                    `⚠️  Context mismatch: expected ${expectedRole}, found ${currentTag}`
            };
            
            console.log(result.message);
            return result;
            
        } catch (error) {
            console.error(`❌ Failed to validate tag context:`, error.message);
            return {
                isValid: false,
                currentTag: 'unknown',
                expectedRole,
                error: error.message,
                message: `❌ Context validation failed: ${error.message}`
            };
        }
    }

    /**
     * Get current active tag from TaskMaster state
     * @returns {string} Current tag name
     */
    async getCurrentTag() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const stateData = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
                return stateData.currentTag || 'master';
            }
            return 'master'; // Default tag
        } catch (error) {
            console.warn(`⚠️  Could not read state file, assuming 'master' tag:`, error.message);
            return 'master';
        }
    }

    /**
     * Verify tag isolation by checking task visibility
     * @param {string} roleName - Role to verify isolation for
     * @returns {Object} Isolation verification result
     */
    async verifyTagIsolation(roleName) {
        console.log(`🔒 Verifying tag isolation for ${roleName}...`);
        
        try {
            // Switch to the role's tag context
            await this.switchToRole(roleName);
            
            // Get tasks visible in this context
            const visibleTasks = await this.getTagTasks(roleName);
            
            // Switch to master and check if tasks are different
            await this.switchToRole('master');
            const masterTasks = await this.getTagTasks('master');
            
            // Compare task sets
            const isolation = {
                roleName,
                roleTaskCount: visibleTasks.length,
                masterTaskCount: masterTasks.length,
                isIsolated: visibleTasks.length !== masterTasks.length || 
                           JSON.stringify(visibleTasks) !== JSON.stringify(masterTasks),
                isolationScore: this.calculateIsolationScore(visibleTasks, masterTasks)
            };
            
            console.log(`📊 Isolation verification: ${isolation.isIsolated ? 'ISOLATED' : 'NOT ISOLATED'} (score: ${isolation.isolationScore}%)`);
            
            return isolation;
            
        } catch (error) {
            console.error(`❌ Failed to verify tag isolation:`, error.message);
            return {
                roleName,
                error: error.message,
                isIsolated: false,
                isolationScore: 0
            };
        }
    }

    /**
     * Calculate isolation score between two task sets
     * @param {Array} rolesTasks - Tasks in role context
     * @param {Array} masterTasks - Tasks in master context
     * @returns {number} Isolation score (0-100)
     */
    calculateIsolationScore(roleTasks, masterTasks) {
        if (roleTasks.length === 0 && masterTasks.length === 0) {
            return 100; // Both empty = perfectly isolated
        }
        
        if (roleTasks.length === 0 || masterTasks.length === 0) {
            return 100; // One empty, one not = perfectly isolated
        }
        
        // Calculate how different the task sets are
        const roleTaskIds = new Set(roleTasks.map(t => t.id));
        const masterTaskIds = new Set(masterTasks.map(t => t.id));
        
        const intersection = new Set([...roleTaskIds].filter(x => masterTaskIds.has(x)));
        const union = new Set([...roleTaskIds, ...masterTaskIds]);
        
        // Jaccard distance as isolation score
        const similarity = intersection.size / union.size;
        return Math.round((1 - similarity) * 100);
    }

    /**
     * Get tasks for a specific tag
     * @param {string} tagName - Tag to get tasks for
     * @returns {Array} Array of tasks
     */
    async getTagTasks(tagName) {
        try {
            const listResult = execSync(`task-master list --tag=${tagName}`, {
                cwd: this.projectRoot,
                encoding: 'utf-8'
            });
            
            // Simple parsing - in practice this might need to be more robust
            const lines = listResult.split('\n').filter(line => line.trim());
            return lines.map((line, index) => ({ 
                id: index + 1, 
                title: line.trim(),
                tag: tagName
            }));
            
        } catch (error) {
            console.warn(`⚠️  Could not get tasks for tag ${tagName}:`, error.message);
            return [];
        }
    }

    /**
     * Complete agent role assignment workflow with enhanced validation
     */
    async executeFullProtocol(roleName, agentIdentifier) {
        console.log(`🚀 Starting full agent role assignment protocol for ${roleName}...`);
        
        try {
            // Step 1: Check available tags
            const tags = await this.checkAvailableTags();
            
            // Step 2: Switch to role with validation
            await this.switchToRole(roleName);
            
            // Step 3: Validate context after switch
            const contextValidation = await this.validateTagContext(roleName);
            if (!contextValidation.isValid) {
                console.warn(`⚠️  Context validation warning: ${contextValidation.message}`);
                // Attempt to fix context
                console.log(`🔧 Attempting to fix context by switching to ${roleName} again...`);
                await this.switchToRole(roleName);
                
                // Re-validate
                const secondValidation = await this.validateTagContext(roleName);
                if (!secondValidation.isValid) {
                    throw new Error(`Context validation failed twice: ${secondValidation.message}`);
                }
            }
            
            // Step 4: Verify tag isolation
            const isolationCheck = await this.verifyTagIsolation(roleName);
            
            // Step 5: View available tasks in validated context
            const tasks = await this.viewRoleTasks('pending');
            
            console.log(`✅ Protocol complete with validation. Agent ${agentIdentifier} ready to work in ${roleName} context.`);
            console.log(`📊 Available tasks in ${roleName}: ${tasks.length || 0}`);
            console.log(`🔒 Context isolation: ${isolationCheck.isIsolated ? 'VERIFIED' : 'WARNING'} (${isolationCheck.isolationScore}% score)`);
            
            return {
                success: true,
                roleName,
                agentIdentifier,
                availableTasks: tasks.length || 0,
                contextValidation,
                isolationCheck,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Protocol failed:', error.message);
            throw error;
        }
    }

    /**
     * Utility: Parse tag listing output
     */
    parseTagOutput(output) {
        // Basic parsing - in real implementation would parse JSON output
        const lines = output.split('\n');
        const tags = [];
        let currentTag = null;
        
        for (const line of lines) {
            if (line.includes('- ')) {
                const match = line.match(/- (\w+.*?):/);
                if (match) {
                    currentTag = { name: match[1].trim(), taskCount: 0, description: '' };
                    tags.push(currentTag);
                }
            }
            if (currentTag && line.includes('tasks')) {
                const taskMatch = line.match(/(\d+) tasks/);
                if (taskMatch) {
                    currentTag.taskCount = parseInt(taskMatch[1]);
                }
            }
        }
        
        return tags;
    }

    /**
     * Utility: Parse task listing output
     */
    parseTaskOutput(output) {
        const lines = output.split('\n');
        const tasks = [];
        
        for (const line of lines) {
            const taskMatch = line.match(/(\d+)\.?\s+(.+)/);
            if (taskMatch) {
                tasks.push({
                    id: taskMatch[1],
                    title: taskMatch[2].trim()
                });
            }
        }
        
        return tasks;
    }
}

// CLI Interface
if (require.main === module) {
    const protocol = new AgentRoleAssignmentProtocol();
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log(`
Usage: node role-assignment-protocol.cjs <command> [options]

Commands:
  check-tags                           - List available agent role tags
  switch <role>                        - Switch to specified role context
  list-tasks [status]                  - List tasks in current role context
  claim <taskId> <agentId>            - Claim a task and add agent context
  add-context <taskId> <role> <msg>   - Add role context to task
  full-protocol <role> <agentId>      - Execute complete assignment protocol

Available Roles: ${protocol.availableRoles.join(', ')}

Examples:
  node role-assignment-protocol.cjs check-tags
  node role-assignment-protocol.cjs switch frontend-architect
  node role-assignment-protocol.cjs claim 17.2 integration-specialist-001
  node role-assignment-protocol.cjs full-protocol integration-specialist claude-integration
        `);
        process.exit(1);
    }

    const command = args[0];
    
    (async () => {
        try {
            switch (command) {
                case 'check-tags':
                    await protocol.checkAvailableTags();
                    break;
                    
                case 'switch':
                    if (!args[1]) throw new Error('Role name required');
                    await protocol.switchToRole(args[1]);
                    break;
                    
                case 'list-tasks':
                    await protocol.viewRoleTasks(args[1]);
                    break;
                    
                case 'claim':
                    if (!args[1] || !args[2]) throw new Error('Task ID and agent identifier required');
                    await protocol.claimTask(args[1], args[2]);
                    break;
                    
                case 'add-context':
                    if (!args[1] || !args[2] || !args[3]) throw new Error('Task ID, role, and message required');
                    await protocol.addRoleContext(args[1], args[2], args[3]);
                    break;
                    
                case 'full-protocol':
                    if (!args[1] || !args[2]) throw new Error('Role and agent identifier required');
                    await protocol.executeFullProtocol(args[1], args[2]);
                    break;
                    
                default:
                    throw new Error(`Unknown command: ${command}`);
            }
        } catch (error) {
            console.error('❌', error.message);
            process.exit(1);
        }
    })();
}

module.exports = AgentRoleAssignmentProtocol;