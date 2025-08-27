/**
 * PersistenceOrchestrator - Coordinates between localStorage and file persistence
 * Task 4.2 - Integration Specialist Implementation
 * 
 * Orchestrates data flow between localStorage and file system with automatic sync
 */

import { LocalStorageManager } from './LocalStorageManager.js';
import { FilePersistenceManager, FileStorageConfig } from './FilePersistenceManager.js';
import {
  StorageKeys,
  ValidationSchema,
  PersistenceError
} from '../types/index.js';

export interface PersistenceConfig {
  fileStorage: FileStorageConfig;
  syncStrategy: 'immediate' | 'batch' | 'scheduled';
  syncInterval?: number; // ms for scheduled sync
  batchSize?: number; // for batch sync
  fallbackToLocalStorage?: boolean;
  enableCrossTabSync?: boolean;
}

export interface SyncStatus {
  lastSyncTime: Date | null;
  pendingOperations: number;
  failedOperations: number;
  status: 'idle' | 'syncing' | 'error';
  lastError?: Error;
}

export class PersistenceOrchestrator {
  private static instance: PersistenceOrchestrator;
  private localStorageManager: LocalStorageManager;
  private filePersistenceManager: FilePersistenceManager;
  private config: PersistenceConfig;
  private syncStatus: SyncStatus;
  private pendingOperations = new Map<string, any>();
  private syncTimer: NodeJS.Timeout | null = null;

  private constructor(config: PersistenceConfig) {
    this.config = config;
    this.localStorageManager = LocalStorageManager.getInstance();
    this.filePersistenceManager = FilePersistenceManager.getInstance(config.fileStorage);
    
    this.syncStatus = {
      lastSyncTime: null,
      pendingOperations: 0,
      failedOperations: 0,
      status: 'idle'
    };

    this.setupSyncStrategy();
  }

  public static getInstance(config?: PersistenceConfig): PersistenceOrchestrator {
    if (!PersistenceOrchestrator.instance) {
      if (!config) {
        throw new Error('PersistenceOrchestrator requires config on first initialization');
      }
      PersistenceOrchestrator.instance = new PersistenceOrchestrator(config);
    }
    return PersistenceOrchestrator.instance;
  }

  /**
   * Store data with dual persistence (localStorage + file)
   */
  public async store<T>(
    key: StorageKeys | string,
    data: T,
    schema?: ValidationSchema<T>
  ): Promise<void> {
    try {
      // Always store to localStorage first (fast, synchronous backup)
      await this.localStorageManager.store(key, data, schema);

      // Handle file storage based on sync strategy
      switch (this.config.syncStrategy) {
        case 'immediate':
          await this.filePersistenceManager.store(key, data, schema);
          break;
        
        case 'batch':
        case 'scheduled':
          this.pendingOperations.set(key, { data, schema, operation: 'store' });
          this.syncStatus.pendingOperations = this.pendingOperations.size;
          break;
      }

      console.log(`✅ PersistenceOrchestrator: Stored data for key: ${key}`);
    } catch (error) {
      console.error(`❌ PersistenceOrchestrator: Failed to store data for key: ${key}`, error);
      
      if (this.config.fallbackToLocalStorage) {
        console.log(`🔄 PersistenceOrchestrator: Falling back to localStorage only for key: ${key}`);
        await this.localStorageManager.store(key, data, schema);
      } else {
        throw new PersistenceError(
          `Failed to store data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'ORCHESTRATOR_STORE_ERROR',
          { key, error }
        );
      }
    }
  }

  /**
   * Retrieve data with fallback strategy
   */
  public async retrieve<T>(
    key: StorageKeys | string,
    schema?: ValidationSchema<T>
  ): Promise<T | null> {
    try {
      // Try localStorage first (fastest)
      let data = await this.localStorageManager.retrieve<T>(key, schema);
      
      if (data !== null) {
        console.log(`🚀 PersistenceOrchestrator: Retrieved from localStorage for key: ${key}`);
        return data;
      }

      // Fallback to file storage
      data = await this.filePersistenceManager.retrieve<T>(key, schema);
      
      if (data !== null) {
        // Restore to localStorage for future fast access
        await this.localStorageManager.store(key, data, schema);
        console.log(`🔄 PersistenceOrchestrator: Retrieved from file and restored to localStorage for key: ${key}`);
        return data;
      }

      console.log(`ℹ️ PersistenceOrchestrator: No data found for key: ${key}`);
      return null;
    } catch (error) {
      console.error(`❌ PersistenceOrchestrator: Failed to retrieve data for key: ${key}`, error);
      
      if (this.config.fallbackToLocalStorage) {
        return await this.localStorageManager.retrieve<T>(key, schema);
      } else {
        throw new PersistenceError(
          `Failed to retrieve data: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'ORCHESTRATOR_RETRIEVE_ERROR',
          { key, error }
        );
      }
    }
  }

  /**
   * Update data with dual persistence
   */
  public async update<T>(
    key: StorageKeys | string,
    updater: (current: T | null) => T,
    schema?: ValidationSchema<T>
  ): Promise<void> {
    try {
      const current = await this.retrieve<T>(key, schema);
      const updated = updater(current);
      await this.store(key, updated, schema);
      console.log(`✅ PersistenceOrchestrator: Updated data for key: ${key}`);
    } catch (error) {
      console.error(`❌ PersistenceOrchestrator: Failed to update data for key: ${key}`, error);
      throw new PersistenceError(
        `Failed to update data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ORCHESTRATOR_UPDATE_ERROR',
        { key, error }
      );
    }
  }

  /**
   * Remove data from both storage systems
   */
  public async remove(key: StorageKeys | string): Promise<boolean> {
    try {
      const localResult = await this.localStorageManager.remove(key);
      
      // Handle file removal based on sync strategy
      let fileResult = true;
      switch (this.config.syncStrategy) {
        case 'immediate':
          fileResult = await this.filePersistenceManager.remove(key);
          break;
        
        case 'batch':
        case 'scheduled':
          this.pendingOperations.set(key, { operation: 'remove' });
          this.syncStatus.pendingOperations = this.pendingOperations.size;
          break;
      }

      // Remove from pending operations if it was there
      this.pendingOperations.delete(key);
      this.syncStatus.pendingOperations = this.pendingOperations.size;

      console.log(`✅ PersistenceOrchestrator: Removed data for key: ${key}`);
      return localResult && fileResult;
    } catch (error) {
      console.error(`❌ PersistenceOrchestrator: Failed to remove data for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Force immediate sync of all pending operations
   */
  public async forcSync(): Promise<void> {
    if (this.pendingOperations.size === 0) {
      console.log('ℹ️ PersistenceOrchestrator: No pending operations to sync');
      return;
    }

    this.syncStatus.status = 'syncing';
    console.log(`🔄 PersistenceOrchestrator: Force syncing ${this.pendingOperations.size} operations`);

    let successCount = 0;
    let errorCount = 0;

    for (const [key, operation] of this.pendingOperations) {
      try {
        switch (operation.operation) {
          case 'store':
            await this.filePersistenceManager.store(key, operation.data, operation.schema);
            break;
          case 'remove':
            await this.filePersistenceManager.remove(key);
            break;
        }
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to sync operation for key: ${key}`, error);
        errorCount++;
      }
    }

    // Clear processed operations
    this.pendingOperations.clear();
    
    this.syncStatus = {
      lastSyncTime: new Date(),
      pendingOperations: 0,
      failedOperations: errorCount,
      status: errorCount > 0 ? 'error' : 'idle',
      lastError: errorCount > 0 ? new Error(`${errorCount} operations failed`) : undefined
    };

    console.log(`✅ PersistenceOrchestrator: Sync completed - ${successCount} success, ${errorCount} errors`);
  }

  /**
   * Sync all localStorage data to file system
   */
  public async syncAllToFiles(): Promise<void> {
    try {
      this.syncStatus.status = 'syncing';
      console.log('🔄 PersistenceOrchestrator: Starting full sync to file system...');
      
      await this.filePersistenceManager.syncFromLocalStorage(this.localStorageManager);
      
      this.syncStatus = {
        lastSyncTime: new Date(),
        pendingOperations: 0,
        failedOperations: 0,
        status: 'idle'
      };

      console.log('✅ PersistenceOrchestrator: Full sync to file system completed');
    } catch (error) {
      console.error('❌ PersistenceOrchestrator: Failed to sync all data to files', error);
      this.syncStatus.status = 'error';
      this.syncStatus.lastError = error instanceof Error ? error : new Error('Unknown sync error');
      throw error;
    }
  }

  /**
   * Restore all data from file system to localStorage
   */
  public async restoreFromFiles(): Promise<void> {
    try {
      this.syncStatus.status = 'syncing';
      console.log('🔄 PersistenceOrchestrator: Starting restore from file system...');
      
      await this.filePersistenceManager.restoreToLocalStorage(this.localStorageManager);
      
      this.syncStatus = {
        lastSyncTime: new Date(),
        pendingOperations: 0,
        failedOperations: 0,
        status: 'idle'
      };

      console.log('✅ PersistenceOrchestrator: Restore from file system completed');
    } catch (error) {
      console.error('❌ PersistenceOrchestrator: Failed to restore from files', error);
      this.syncStatus.status = 'error';
      this.syncStatus.lastError = error instanceof Error ? error : new Error('Unknown restore error');
      throw error;
    }
  }

  /**
   * Create full backup of all data
   */
  public async createBackup(): Promise<string> {
    try {
      console.log('💾 PersistenceOrchestrator: Creating full backup...');
      
      // Ensure all data is synced to files first
      await this.forcSync();
      
      // Create file system backup
      const backupPath = await this.filePersistenceManager.createFullBackup();
      
      console.log(`✅ PersistenceOrchestrator: Backup created at: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('❌ PersistenceOrchestrator: Failed to create backup', error);
      throw new PersistenceError(
        `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BACKUP_ERROR',
        { error }
      );
    }
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get storage statistics from both systems
   */
  public async getStorageStats(): Promise<{
    localStorage: any;
    fileStorage: any;
    sync: SyncStatus;
  }> {
    return {
      localStorage: this.localStorageManager.getStorageStats(),
      fileStorage: {
        // File storage stats would be implemented when MCP integration is complete
        enabled: true,
        basePath: this.config.fileStorage.basePath,
        userPartition: this.config.fileStorage.userPartition,
        backupEnabled: this.config.fileStorage.backupEnabled
      },
      sync: this.getSyncStatus()
    };
  }

  /**
   * Setup sync strategy based on configuration
   */
  private setupSyncStrategy(): void {
    switch (this.config.syncStrategy) {
      case 'immediate':
        console.log('🔧 PersistenceOrchestrator: Using immediate sync strategy');
        break;
        
      case 'batch':
        console.log(`🔧 PersistenceOrchestrator: Using batch sync strategy (batch size: ${this.config.batchSize || 10})`);
        // Trigger sync when batch size is reached
        break;
        
      case 'scheduled':
        if (this.config.syncInterval) {
          console.log(`🔧 PersistenceOrchestrator: Using scheduled sync strategy (interval: ${this.config.syncInterval}ms)`);
          this.startScheduledSync();
        }
        break;
    }
  }

  /**
   * Start scheduled sync timer
   */
  private startScheduledSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.config.syncInterval) {
      this.syncTimer = setInterval(async () => {
        if (this.pendingOperations.size > 0) {
          console.log(`⏰ PersistenceOrchestrator: Scheduled sync triggered for ${this.pendingOperations.size} operations`);
          await this.forcSync();
        }
      }, this.config.syncInterval);
    }
  }

  /**
   * Stop scheduled sync
   */
  public stopScheduledSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏹️ PersistenceOrchestrator: Stopped scheduled sync');
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    this.stopScheduledSync();
    this.filePersistenceManager.stopAutoSync();
    
    // Force final sync before cleanup
    if (this.pendingOperations.size > 0) {
      console.log('🧹 PersistenceOrchestrator: Final sync before cleanup...');
      await this.forcSync();
    }
    
    console.log('✅ PersistenceOrchestrator: Cleanup completed');
  }
}

// Export factory function for creating configured instance
export function createPersistenceOrchestrator(config: PersistenceConfig): PersistenceOrchestrator {
  return PersistenceOrchestrator.getInstance(config);
}