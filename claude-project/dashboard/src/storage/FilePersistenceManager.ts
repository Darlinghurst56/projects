/**
 * FilePersistenceManager - File MCP integration for persistent storage beyond localStorage
 * Task 4.2 - Integration Specialist Implementation
 * 
 * Provides file-based persistence with automatic backup and multi-user partitioning
 */

import {
  StorageContainer,
  StorageKeys,
  ValidationSchema,
  PersistenceError,
  ValidationError,
  SerializationError
} from '../types/index.js';

export interface FileStorageConfig {
  basePath: string;
  userPartition?: string;
  backupEnabled: boolean;
  backupPath?: string;
  maxBackups?: number;
  syncInterval?: number; // ms
}

export interface BackupMetadata {
  timestamp: Date;
  userPartition: string;
  dataKeys: string[];
  checksum: string;
  version: string;
}

export class FilePersistenceManager {
  private static instance: FilePersistenceManager;
  private config: FileStorageConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private pendingWrites = new Map<string, any>();
  private lastSyncTime = 0;

  private constructor(config: FileStorageConfig) {
    this.config = {
      maxBackups: 10,
      syncInterval: 30000, // 30 seconds
      ...config
    };
    
    if (this.config.syncInterval && this.config.syncInterval > 0) {
      this.startAutoSync();
    }
  }

  public static getInstance(config?: FileStorageConfig): FilePersistenceManager {
    if (!FilePersistenceManager.instance) {
      if (!config) {
        throw new Error('FilePersistenceManager requires config on first initialization');
      }
      FilePersistenceManager.instance = new FilePersistenceManager(config);
    }
    return FilePersistenceManager.instance;
  }

  /**
   * Store data to file system with validation and backup
   */
  public async store<T>(
    key: StorageKeys | string,
    data: T,
    schema?: ValidationSchema<T>
  ): Promise<void> {
    try {
      // Validate data if schema provided
      if (schema && !schema.validate(data)) {
        throw new ValidationError(`Data validation failed for key: ${key}`);
      }

      // Create storage container with metadata
      const container: StorageContainer<T> = {
        data,
        metadata: {
          version: schema?.version || '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          checksum: this.generateChecksum(data)
        }
      };

      // Get file path with user partitioning
      const filePath = this.getFilePath(key);
      
      // Ensure directory exists
      await this.ensureDirectory(filePath);

      // Write to file system using MCP
      const serialized = JSON.stringify(container, this.dateReplacer, 2);
      await this.writeFile(filePath, serialized);

      // Create backup if enabled
      if (this.config.backupEnabled) {
        await this.createBackup(key, container);
      }

      // Track for sync
      this.pendingWrites.set(key, container);

      console.log(`✅ FilePersistenceManager: Stored data to file: ${filePath}`);
    } catch (error) {
      console.error(`❌ FilePersistenceManager: Failed to store data for key: ${key}`, error);
      throw new PersistenceError(
        `Failed to store data to file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FILE_STORAGE_ERROR',
        { key, error }
      );
    }
  }

  /**
   * Retrieve data from file system with validation
   */
  public async retrieve<T>(
    key: StorageKeys | string,
    schema?: ValidationSchema<T>
  ): Promise<T | null> {
    try {
      const filePath = this.getFilePath(key);
      
      // Check if file exists
      if (!await this.fileExists(filePath)) {
        console.log(`ℹ️ FilePersistenceManager: No file found for key: ${key}`);
        return null;
      }

      // Read from file system
      const content = await this.readFile(filePath);
      
      // Parse and validate container
      const container: StorageContainer<T> = JSON.parse(content, this.dateReviver);
      
      // Validate checksum if available
      if (container.metadata.checksum) {
        const currentChecksum = this.generateChecksum(container.data);
        if (currentChecksum !== container.metadata.checksum) {
          console.warn(`⚠️ FilePersistenceManager: Checksum mismatch for key: ${key}`);
          // Attempt recovery from backup
          const backup = await this.recoverFromBackup<T>(key);
          if (backup) {
            console.log(`🔄 FilePersistenceManager: Recovered data from backup for key: ${key}`);
            return backup;
          }
        }
      }

      // Validate data if schema provided
      if (schema && !schema.validate(container.data)) {
        throw new ValidationError(`File data validation failed for key: ${key}`);
      }

      console.log(`✅ FilePersistenceManager: Retrieved data from file: ${filePath}`);
      return container.data;
    } catch (error) {
      console.error(`❌ FilePersistenceManager: Failed to retrieve data for key: ${key}`, error);
      if (error instanceof ValidationError || error instanceof SerializationError) {
        throw error;
      }
      throw new PersistenceError(
        `Failed to retrieve data from file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FILE_RETRIEVAL_ERROR',
        { key, error }
      );
    }
  }

  /**
   * Update existing file data
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
      console.log(`✅ FilePersistenceManager: Updated file data for key: ${key}`);
    } catch (error) {
      console.error(`❌ FilePersistenceManager: Failed to update file data for key: ${key}`, error);
      throw new PersistenceError(
        `Failed to update file data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FILE_UPDATE_ERROR',
        { key, error }
      );
    }
  }

  /**
   * Remove file from storage
   */
  public async remove(key: StorageKeys | string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      
      if (await this.fileExists(filePath)) {
        await this.deleteFile(filePath);
        this.pendingWrites.delete(key);
        console.log(`✅ FilePersistenceManager: Removed file for key: ${key}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ FilePersistenceManager: Failed to remove file for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Sync localStorage data to file system
   */
  public async syncFromLocalStorage(localStorageManager: any): Promise<void> {
    try {
      console.log('🔄 FilePersistenceManager: Starting sync from localStorage...');
      
      const exportedData = await localStorageManager.exportData();
      let syncedCount = 0;

      for (const [key, data] of Object.entries(exportedData)) {
        try {
          await this.store(key, data);
          syncedCount++;
        } catch (error) {
          console.error(`❌ Failed to sync key: ${key}`, error);
        }
      }

      this.lastSyncTime = Date.now();
      console.log(`✅ FilePersistenceManager: Synced ${syncedCount} items from localStorage`);
    } catch (error) {
      console.error('❌ FilePersistenceManager: Failed to sync from localStorage', error);
      throw new PersistenceError(
        `Failed to sync from localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SYNC_ERROR',
        { error }
      );
    }
  }

  /**
   * Restore localStorage from file system
   */
  public async restoreToLocalStorage(localStorageManager: any, keys?: string[]): Promise<void> {
    try {
      console.log('🔄 FilePersistenceManager: Starting restore to localStorage...');
      
      const keysToRestore = keys || await this.listStoredKeys();
      const restoreData: Record<string, any> = {};
      let restoredCount = 0;

      for (const key of keysToRestore) {
        try {
          const data = await this.retrieve(key);
          if (data !== null) {
            restoreData[key] = data;
            restoredCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to restore key: ${key}`, error);
        }
      }

      await localStorageManager.importData(restoreData, true);
      console.log(`✅ FilePersistenceManager: Restored ${restoredCount} items to localStorage`);
    } catch (error) {
      console.error('❌ FilePersistenceManager: Failed to restore to localStorage', error);
      throw new PersistenceError(
        `Failed to restore to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RESTORE_ERROR',
        { error }
      );
    }
  }

  /**
   * Create backup of current data
   */
  public async createFullBackup(): Promise<string> {
    try {
      if (!this.config.backupEnabled || !this.config.backupPath) {
        throw new Error('Backup not enabled or backup path not configured');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${this.config.userPartition || 'default'}-${timestamp}.json`;
      const backupFilePath = `${this.config.backupPath}/${backupFileName}`;

      const allKeys = await this.listStoredKeys();
      const backupData: Record<string, any> = {};

      for (const key of allKeys) {
        const data = await this.retrieve(key);
        if (data !== null) {
          backupData[key] = data;
        }
      }

      const backupMetadata: BackupMetadata = {
        timestamp: new Date(),
        userPartition: this.config.userPartition || 'default',
        dataKeys: allKeys,
        checksum: this.generateChecksum(backupData),
        version: '1.0.0'
      };

      const backup = {
        metadata: backupMetadata,
        data: backupData
      };

      await this.ensureDirectory(backupFilePath);
      await this.writeFile(backupFilePath, JSON.stringify(backup, this.dateReplacer, 2));

      // Clean up old backups
      await this.cleanupOldBackups();

      console.log(`✅ FilePersistenceManager: Created full backup: ${backupFileName}`);
      return backupFilePath;
    } catch (error) {
      console.error('❌ FilePersistenceManager: Failed to create full backup', error);
      throw new PersistenceError(
        `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BACKUP_ERROR',
        { error }
      );
    }
  }

  /**
   * Get user-specific file path with partitioning
   */
  private getFilePath(key: string): string {
    const userPath = this.config.userPartition ? `users/${this.config.userPartition}` : 'default';
    return `${this.config.basePath}/${userPath}/${key}.json`;
  }

  /**
   * Get backup file path for a key
   */
  private getBackupPath(key: string): string {
    if (!this.config.backupPath) {
      return `${this.config.basePath}/backups/${key}`;
    }
    const userPath = this.config.userPartition ? `users/${this.config.userPartition}` : 'default';
    return `${this.config.backupPath}/${userPath}/${key}`;
  }

  /**
   * Create backup for individual key
   */
  private async createBackup<T>(key: string, container: StorageContainer<T>): Promise<void> {
    try {
      const backupDir = this.getBackupPath(key);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `${backupDir}/${timestamp}.json`;

      await this.ensureDirectory(backupFile);
      await this.writeFile(backupFile, JSON.stringify(container, this.dateReplacer, 2));

      // Keep only the latest N backups
      await this.cleanupKeyBackups(backupDir);
    } catch (error) {
      console.warn(`⚠️ FilePersistenceManager: Failed to create backup for key: ${key}`, error);
    }
  }

  /**
   * Recover data from backup
   */
  private async recoverFromBackup<T>(key: string): Promise<T | null> {
    try {
      const backupDir = this.getBackupPath(key);
      const backups = await this.listFiles(backupDir);
      
      if (backups.length === 0) {
        return null;
      }

      // Get the most recent backup
      const latestBackup = backups.sort().pop();
      if (!latestBackup) {
        return null;
      }

      const backupContent = await this.readFile(`${backupDir}/${latestBackup}`);
      const parsed = JSON.parse(backupContent, this.dateReviver) as StorageContainer<T>;
      
      // Basic validation that the parsed content has the expected structure
      if (parsed && typeof parsed === 'object' && 'data' in parsed && 'metadata' in parsed) {
        return parsed.data;
      }
      
      console.warn(`⚠️ FilePersistenceManager: Invalid backup structure for key: ${key}`);
      return null;
    } catch (error) {
      console.error(`❌ FilePersistenceManager: Failed to recover from backup for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Start automatic sync timer
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      if (this.pendingWrites.size > 0) {
        console.log(`🔄 FilePersistenceManager: Auto-sync triggered for ${this.pendingWrites.size} items`);
        this.pendingWrites.clear();
      }
    }, this.config.syncInterval);
  }

  /**
   * Stop automatic sync
   */
  public stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Cleanup old backups
   */
  private async cleanupOldBackups(): Promise<void> {
    if (!this.config.backupPath || !this.config.maxBackups) {
      return;
    }

    try {
      const backups = await this.listFiles(this.config.backupPath);
      const sortedBackups = backups
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .sort()
        .reverse();

      if (sortedBackups.length > this.config.maxBackups) {
        const toDelete = sortedBackups.slice(this.config.maxBackups);
        for (const backup of toDelete) {
          await this.deleteFile(`${this.config.backupPath}/${backup}`);
        }
        console.log(`🧹 FilePersistenceManager: Cleaned up ${toDelete.length} old backups`);
      }
    } catch (error) {
      console.warn('⚠️ FilePersistenceManager: Failed to cleanup old backups', error);
    }
  }

  /**
   * Cleanup old backups for a specific key
   */
  private async cleanupKeyBackups(backupDir: string): Promise<void> {
    const maxKeyBackups = 5; // Keep 5 backups per key
    
    try {
      const backups = await this.listFiles(backupDir);
      const sortedBackups = backups.sort().reverse();

      if (sortedBackups.length > maxKeyBackups) {
        const toDelete = sortedBackups.slice(maxKeyBackups);
        for (const backup of toDelete) {
          await this.deleteFile(`${backupDir}/${backup}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ FilePersistenceManager: Failed to cleanup backups for: ${backupDir}`, error);
    }
  }

  // MCP File System Integration Methods
  // These would be replaced with actual MCP calls in production

  private async writeFile(path: string, content: string): Promise<void> {
    // TODO: Replace with actual MCP filesystem write call
    // For now, simulate file writing
    console.log(`📝 Writing to file: ${path}`);
    
    // In real implementation:
    // await mcpFileSystem.writeFile(path, content);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async readFile(path: string): Promise<string> {
    // TODO: Replace with actual MCP filesystem read call
    console.log(`📖 Reading from file: ${path}`);
    
    // In real implementation:
    // return await mcpFileSystem.readFile(path);
    
    // For demo, return empty object
    return JSON.stringify({
      data: null,
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        checksum: ''
      }
    });
  }

  private async fileExists(path: string): Promise<boolean> {
    // TODO: Replace with actual MCP filesystem exists check
    console.log(`🔍 Checking if file exists: ${path}`);
    
    // In real implementation:
    // return await mcpFileSystem.exists(path);
    
    return false; // For demo
  }

  private async deleteFile(path: string): Promise<void> {
    // TODO: Replace with actual MCP filesystem delete call
    console.log(`🗑️ Deleting file: ${path}`);
    
    // In real implementation:
    // await mcpFileSystem.deleteFile(path);
  }

  private async ensureDirectory(filePath: string): Promise<void> {
    // TODO: Replace with actual MCP filesystem directory creation
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    console.log(`📁 Ensuring directory exists: ${dir}`);
    
    // In real implementation:
    // await mcpFileSystem.ensureDir(dir);
  }

  private async listFiles(directory: string): Promise<string[]> {
    // TODO: Replace with actual MCP filesystem directory listing
    console.log(`📋 Listing files in: ${directory}`);
    
    // In real implementation:
    // return await mcpFileSystem.listFiles(directory);
    
    return []; // For demo
  }

  private async listStoredKeys(): Promise<string[]> {
    // TODO: Implement by scanning user's storage directory
    console.log('📋 Listing all stored keys');
    return [];
  }

  private generateChecksum(data: any): string {
    // Simple checksum implementation
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __date: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__date) {
      return new Date(value.__date);
    }
    return value;
  }
}

// Export factory function for creating configured instance
export function createFilePersistenceManager(config: FileStorageConfig): FilePersistenceManager {
  return FilePersistenceManager.getInstance(config);
}