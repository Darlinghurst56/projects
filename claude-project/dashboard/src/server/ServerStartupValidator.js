/**
 * Server Startup Validator - Prevents Multiple Server Instance Conflicts
 * Task 2.1 - Server Agent Implementation
 * 
 * Main entry point for server startup validation
 * Enforces single server instance rule before any server starts
 */

import { serverInstanceManager } from './ServerInstanceManager.js';

export class ServerStartupValidator {
  constructor() {
    this.validationHistory = [];
    this.blockingEnabled = true; // Set to false to allow overrides
  }

  /**
   * Main validation method - call this before starting any server
   * Returns validation result and blocks startup if conflicts detected
   */
  async validateAndBlock(port, serverType, options = {}) {
    const validation = await this.performValidation(port, serverType, options);
    
    // Log validation result
    this.logValidationResult(validation);
    this.validationHistory.push(validation);
    
    // Enforce blocking if conflicts found
    if (!validation.canStart && this.blockingEnabled && !options.force) {
      throw new ServerStartupBlockedError(validation);
    }
    
    return validation;
  }

  /**
   * Perform comprehensive validation checks
   */
  async performValidation(port, serverType, options = {}) {
    console.log(`🚀 ServerStartupValidator: Validating ${serverType} server startup on port ${port}`);
    
    const validation = await serverInstanceManager.validateServerStartup(port, serverType);
    
    // Add additional validation context
    validation.validationId = `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    validation.options = options;
    validation.validator = 'ServerStartupValidator';
    
    // Perform environment check if requested
    if (options.includeEnvironmentCheck) {
      validation.environmentReport = await serverInstanceManager.performEnvironmentCheck();
    }
    
    return validation;
  }

  /**
   * Log validation results with appropriate severity
   */
  logValidationResult(validation) {
    const { canStart, port, serverType, conflicts, warnings } = validation;
    
    if (canStart) {
      console.log(`✅ ServerStartupValidator: ${serverType} server can start on port ${port}`);
      
      if (warnings.length > 0) {
        console.warn(`⚠️ ServerStartupValidator: ${warnings.length} warning(s) detected:`);
        warnings.forEach(warning => {
          console.warn(`   • ${warning.message}`);
        });
      }
    } else {
      console.error(`❌ ServerStartupValidator: ${serverType} server BLOCKED on port ${port}`);
      console.error(`🚫 Conflicts detected: ${conflicts.length}`);
      
      conflicts.forEach(conflict => {
        console.error(`   • [${conflict.severity.toUpperCase()}] ${conflict.message}`);
        if (conflict.processes && conflict.processes.length > 0) {
          console.error(`     Processes: ${conflict.processes.join(', ')}`);
        }
      });
    }
  }

  /**
   * Enable or disable startup blocking (for testing/override scenarios)
   */
  setBlockingEnabled(enabled) {
    this.blockingEnabled = enabled;
    console.log(`🔧 ServerStartupValidator: Blocking ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Get validation history for diagnostics
   */
  getValidationHistory() {
    return this.validationHistory;
  }

  /**
   * Clear validation history
   */
  clearValidationHistory() {
    this.validationHistory = [];
    console.log('🗑️ ServerStartupValidator: Cleared validation history');
  }

  /**
   * Pre-flight check for server startup
   * Performs quick validation without detailed environment scan
   */
  async quickValidation(port, serverType) {
    try {
      const portCheck = await serverInstanceManager.isPortInUse(port);
      
      return {
        port,
        serverType,
        canStart: !portCheck.inUse,
        conflict: portCheck.inUse ? 'Port already in use' : null,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        port,
        serverType,
        canStart: false,
        conflict: `Validation failed: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Force kill conflicting processes and clear port
   * Use with extreme caution - only for development environments
   */
  async forceKillConflicts(port, options = {}) {
    console.warn(`⚠️ ServerStartupValidator: Force killing processes on port ${port}`);
    
    if (!options.confirmed) {
      throw new Error('Force kill requires confirmation. Pass { confirmed: true }');
    }
    
    const portCheck = await serverInstanceManager.isPortInUse(port);
    if (!portCheck.inUse) {
      console.log(`ℹ️ ServerStartupValidator: No processes found on port ${port}`);
      return { killed: 0, port };
    }
    
    const killedProcesses = [];
    
    for (const pid of portCheck.processes) {
      const killed = await serverInstanceManager.killServerProcess(
        parseInt(pid), 
        options.gracePeriodMs || 3000
      );
      
      if (killed) {
        killedProcesses.push(pid);
      }
    }
    
    console.log(`🛑 ServerStartupValidator: Killed ${killedProcesses.length} process(es) on port ${port}`);
    
    return {
      port,
      killed: killedProcesses.length,
      killedProcesses,
      timestamp: new Date()
    };
  }

  /**
   * Create a startup guard function for server scripts
   * Returns a function that validates before executing server startup
   */
  createStartupGuard(defaultPort, defaultServerType) {
    return async (customPort = null, customServerType = null, options = {}) => {
      const port = customPort || defaultPort;
      const serverType = customServerType || defaultServerType;
      
      return await this.validateAndBlock(port, serverType, options);
    };
  }
}

/**
 * Custom error class for server startup blocking
 */
export class ServerStartupBlockedError extends Error {
  constructor(validation) {
    const conflictMessages = validation.conflicts.map(c => c.message).join('; ');
    super(`Server startup blocked: ${conflictMessages}`);
    
    this.name = 'ServerStartupBlockedError';
    this.validation = validation;
    this.port = validation.port;
    this.serverType = validation.serverType;
    this.conflicts = validation.conflicts;
  }
}

// Export singleton instance
export const serverStartupValidator = new ServerStartupValidator();

// Export convenience functions
export const validateServerStartup = (port, serverType, options) => 
  serverStartupValidator.validateAndBlock(port, serverType, options);

export const quickPortCheck = (port, serverType) => 
  serverStartupValidator.quickValidation(port, serverType);

export const createViteGuard = () => 
  serverStartupValidator.createStartupGuard(5173, 'vite-dev');

export const createExpressGuard = () => 
  serverStartupValidator.createStartupGuard(3000, 'express');

export const createDashboardGuard = () => 
  serverStartupValidator.createStartupGuard(8080, 'dashboard');