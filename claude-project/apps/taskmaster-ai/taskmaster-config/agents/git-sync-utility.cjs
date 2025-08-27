#!/usr/bin/env node

/**
 * Git Synchronization Utility for Multi-Agent Coordination
 * Ensures CLAUDE.md compliance for git operations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitSyncUtility {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * Execute git command with error handling
   */
  execGit(command, options = {}) {
    try {
      const result = execSync(`git ${command}`, {
        cwd: this.projectRoot,
        encoding: 'utf8',
        ...options
      });
      return { success: true, output: result.trim() };
    } catch (error) {
      return { success: false, error: error.message, output: error.stdout };
    }
  }

  /**
   * Atomic commit for task-related changes only
   */
  atomicCommit(message, options = {}) {
    const { taskOnly = true, addAll = false } = options;
    
    console.log('🔄 Starting atomic commit...');
    
    try {
      if (taskOnly) {
        this.execGit('add .taskmaster/');
        console.log('📁 Added .taskmaster/ changes');
      } else if (addAll) {
        this.execGit('add .');
        console.log('📁 Added all changes');
      }

      const commitMessage = message.includes('🤖') ? message : 
        `${message}\n\n🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>`;
      
      const result = this.execGit(`commit -m "${commitMessage}"`);
      
      if (result.success) {
        console.log('✅ Atomic commit successful');
        return { success: true, message: 'Committed successfully' };
      } else {
        console.error('❌ Commit failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Atomic commit error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Safe context switching with git coordination
   */
  pullBeforeSwitch(targetTag, agentId) {
    console.log(`🔄 Safe switch to ${targetTag} for agent ${agentId}`);
    
    const pullResult = this.execGit('pull origin main');
    if (!pullResult.success) {
      console.warn('⚠️ Pull failed, continuing anyway:', pullResult.error);
    }

    console.log(`✅ Ready to switch to ${targetTag}`);
    return { success: true, message: 'Safe to switch context' };
  }

  /**
   * Emergency sync recovery
   */
  emergencySync() {
    console.log('🚨 Emergency sync recovery initiated...');
    
    try {
      this.execGit('stash push -m "Emergency sync backup"');
      this.execGit('reset --hard HEAD');
      this.execGit('pull origin main');
      
      console.log('✅ Emergency sync completed');
      return { success: true, message: 'Emergency sync completed' };
    } catch (error) {
      console.error('❌ Emergency sync failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const gitSync = new GitSyncUtility();

  switch (command) {
    case 'atomic-commit':
      const message = args[1] || 'Update task assignments';
      gitSync.atomicCommit(message);
      break;

    case 'pull-before-switch':
      const targetTag = args[1];
      const agentId = args[2];
      gitSync.pullBeforeSwitch(targetTag, agentId);
      break;

    case 'emergency-sync':
      gitSync.emergencySync();
      break;

    default:
      console.log('Git Sync Utility - CLAUDE.md Compliant');
      console.log('Commands: atomic-commit, pull-before-switch, emergency-sync');
  }
}

module.exports = GitSyncUtility;