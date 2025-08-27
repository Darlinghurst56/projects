#!/usr/bin/env node

/**
 * Task Update Wrapper - Provides robust task update functionality with timeout and error handling
 * Wrapper around the task-master update-task command with improved reliability
 */

const { spawn } = require('child_process');
const path = require('path');

class TaskUpdateWrapper {
    constructor(options = {}) {
        this.timeout = options.timeout || 300000; // 5 minutes default timeout
        this.maxRetries = options.maxRetries || 2;
        this.retryDelay = options.retryDelay || 5000; // 5 seconds
    }
    
    /**
     * Sanitize AI response to prevent JSON parsing errors
     */
    sanitizeAIResponse(response) {
        if (!response || typeof response !== 'string') {
            return response;
        }
        
        // Fix common AI response formatting issues
        let sanitized = response
            .replace(/\{\{/g, '{')          // Fix double opening braces
            .replace(/\}\}/g, '}')          // Fix double closing braces
            .replace(/\[\[/g, '[')          // Fix double opening brackets
            .replace(/\]\]/g, ']')          // Fix double closing brackets
            .replace(/\n\s*\n/g, '\n')      // Remove extra newlines
            .trim();
        
        // Remove markdown code blocks if they wrap the entire response
        if (sanitized.startsWith('```') && sanitized.endsWith('```')) {
            const lines = sanitized.split('\n');
            if (lines.length > 2) {
                lines.shift(); // Remove first ```
                lines.pop();   // Remove last ```
                sanitized = lines.join('\n');
            }
        }
        
        return sanitized;
    }

    /**
     * Update a task with retry logic and timeout handling
     */
    async updateTask(taskId, prompt, options = {}) {
        const {
            useResearch = false,
            outputFormat = 'text',
            appendMode = false
        } = options;
        
        // Sanitize the prompt to prevent AI response parsing errors
        const sanitizedPrompt = this.sanitizeAIResponse(prompt);
        
        let attempt = 0;
        let lastError = null;
        
        while (attempt < this.maxRetries) {
            attempt++;
            console.log(`Attempting task update (attempt ${attempt}/${this.maxRetries})...`);
            
            try {
                const result = await this.executeTaskUpdate(taskId, sanitizedPrompt, {
                    useResearch,
                    outputFormat,
                    appendMode
                });
                
                console.log('Task update completed successfully');
                return result;
                
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.maxRetries) {
                    console.log(`Waiting ${this.retryDelay/1000} seconds before retry...`);
                    await this.sleep(this.retryDelay);
                }
            }
        }
        
        throw new Error(`Task update failed after ${this.maxRetries} attempts. Last error: ${lastError.message}`);
    }
    
    /**
     * Execute single task update with timeout
     */
    async executeTaskUpdate(taskId, prompt, options) {
        return new Promise((resolve, reject) => {
            const args = [
                'update-task',
                `--id=${taskId}`,
                `--prompt=${prompt}`
            ];
            
            if (options.useResearch) {
                args.push('--research');
            }
            
            if (options.outputFormat === 'json') {
                args.push('--json');
            }
            
            if (options.appendMode) {
                args.push('--append');
            }
            
            console.log(`Executing: task-master ${args.join(' ')}`);
            
            const process = spawn('task-master', args, {
                stdio: ['ignore', 'pipe', 'pipe'],
                timeout: this.timeout
            });
            
            let stdout = '';
            let stderr = '';
            
            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            // Handle timeout
            const timeoutId = setTimeout(() => {
                console.log('Task update timed out, killing process...');
                process.kill('SIGTERM');
                reject(new Error(`Task update timed out after ${this.timeout/1000} seconds`));
            }, this.timeout);
            
            process.on('close', (code) => {
                clearTimeout(timeoutId);
                
                if (code === 0) {
                    resolve({
                        success: true,
                        output: stdout,
                        code
                    });
                } else {
                    reject(new Error(`Task update failed with exit code ${code}. stderr: ${stderr}`));
                }
            });
            
            process.on('error', (error) => {
                clearTimeout(timeoutId);
                reject(new Error(`Process error: ${error.message}`));
            });
        });
    }
    
    /**
     * Simplified update method for agent use
     */
    async updateTaskProgress(taskId, agentName, message, status = 'in_progress') {
        const prompt = `AGENT: ${agentName} - ${message}. Status: ${status}.`;
        
        try {
            const result = await this.updateTask(taskId, prompt, {
                useResearch: false,
                outputFormat: 'text',
                appendMode: false
            });
            
            console.log(`✅ Successfully reported progress for task ${taskId}`);
            return result;
            
        } catch (error) {
            console.error(`❌ Failed to report task progress: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Complete a task with final results
     */
    async completeTask(taskId, agentName, results) {
        const prompt = `AGENT: ${agentName} - Task completed. Results: ${results}. Status: completed.`;
        
        try {
            const result = await this.updateTask(taskId, prompt, {
                useResearch: false,
                outputFormat: 'text',
                appendMode: false
            });
            
            console.log(`✅ Successfully completed task ${taskId}`);
            return result;
            
        } catch (error) {
            console.error(`❌ Failed to complete task: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Mark a task as failed with reason
     */
    async failTask(taskId, agentName, reason) {
        const prompt = `AGENT: ${agentName} - Task failed. Reason: ${reason}. Status: failed.`;
        
        try {
            // First try to update the task
            const result = await this.updateTask(taskId, prompt, {
                useResearch: false,
                outputFormat: 'text',
                appendMode: false
            });
            
            console.log(`⚠️ Successfully marked task ${taskId} as failed`);
            return result;
            
        } catch (error) {
            console.error(`❌ Failed to mark task as failed: ${error.message}`);
            throw error;
        }
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        console.log(`
Task Update Wrapper CLI

Usage:
  node task-update-wrapper.js [command] [options]

Commands:
  update <taskId> <prompt>     Update task with custom prompt
  progress <taskId> <agent> <message>  Report agent progress
  complete <taskId> <agent> <results>  Complete task with results
  fail <taskId> <agent> <reason>       Mark task as failed

Options:
  --timeout <ms>               Timeout in milliseconds (default: 300000)
  --retries <n>                Max retry attempts (default: 2)
  --research                   Use research mode
  --json                       Output in JSON format
  --help                       Show this help message

Examples:
  node task-update-wrapper.js progress 15 ui-developer "UX improvements in progress"
  node task-update-wrapper.js complete 15 ui-developer "100% success rate (2/2 improvements completed)"
  node task-update-wrapper.js fail 15 ui-developer "Cannot access required files"
        `);
        process.exit(0);
    }
    
    const wrapper = new TaskUpdateWrapper({
        timeout: parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1]) || 300000,
        maxRetries: parseInt(args.find(arg => arg.startsWith('--retries='))?.split('=')[1]) || 2
    });
    
    async function main() {
        try {
            const command = args[0];
            
            switch (command) {
                case 'update':
                    if (args.length < 3) {
                        console.error('Usage: update <taskId> <prompt>');
                        process.exit(1);
                    }
                    await wrapper.updateTask(args[1], args[2], {
                        useResearch: args.includes('--research'),
                        outputFormat: args.includes('--json') ? 'json' : 'text'
                    });
                    break;
                    
                case 'progress':
                    if (args.length < 4) {
                        console.error('Usage: progress <taskId> <agent> <message>');
                        process.exit(1);
                    }
                    await wrapper.updateTaskProgress(args[1], args[2], args[3]);
                    break;
                    
                case 'complete':
                    if (args.length < 4) {
                        console.error('Usage: complete <taskId> <agent> <results>');
                        process.exit(1);
                    }
                    await wrapper.completeTask(args[1], args[2], args[3]);
                    break;
                    
                case 'fail':
                    if (args.length < 4) {
                        console.error('Usage: fail <taskId> <agent> <reason>');
                        process.exit(1);
                    }
                    await wrapper.failTask(args[1], args[2], args[3]);
                    break;
                    
                default:
                    console.error('Unknown command. Use --help for usage information.');
                    process.exit(1);
            }
            
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    }
    
    main();
}

module.exports = TaskUpdateWrapper;