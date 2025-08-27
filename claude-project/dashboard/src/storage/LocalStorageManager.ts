/**
 * LocalStorageManager - Type-safe localStorage operations with validation
 * Task 4.1 - Backend Agent Implementation
 */

import {
  StorageContainer,
  StorageKeys,
  ValidationSchema,
  PersistenceError,
  ValidationError,
  SerializationError
} from '../types/index.js';

export class LocalStorageManager {
  private static instance: LocalStorageManager;
  private validationSchemas = new Map<string, ValidationSchema<any>>();
  private memoryCache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Singleton pattern to ensure consistent state
    this.setupStorageEventListener();
  }

  public static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  /**
   * Generic method to store data with validation and metadata
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

      // Serialize and store
      const serialized = JSON.stringify(container, this.dateReplacer);
      localStorage.setItem(key, serialized);

      // Update memory cache
      this.memoryCache.set(key, {
        data: container,
        timestamp: Date.now()
      });

      console.log(`✅ LocalStorageManager: Stored data for key: ${key}`);
    } catch (error) {
      console.error(`❌ LocalStorageManager: Failed to store data for key: ${key}`, error);
      throw new PersistenceError(
        `Failed to store data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STORAGE_ERROR',
        { key, error }
      );
    }
  }

  /**
   * Generic method to retrieve data with validation
   */
  public async retrieve<T>(
    key: StorageKeys | string,
    schema?: ValidationSchema<T>
  ): Promise<T | null> {
    try {
      // Check memory cache first
      const cached = this.getCachedData<T>(key);
      if (cached) {
        console.log(`🚀 LocalStorageManager: Retrieved cached data for key: ${key}`);
        return cached;
      }

      // Get from localStorage
      const stored = localStorage.getItem(key);
      if (!stored) {
        console.log(`ℹ️ LocalStorageManager: No data found for key: ${key}`);
        return null;
      }

      // Parse and validate container
      const container: StorageContainer<T> = JSON.parse(stored, this.dateReviver);
      
      // Validate checksum if available
      if (container.metadata.checksum) {
        const currentChecksum = this.generateChecksum(container.data);
        if (currentChecksum !== container.metadata.checksum) {
          console.warn(`⚠️ LocalStorageManager: Checksum mismatch for key: ${key}`);
        }
      }

      // Validate data if schema provided
      if (schema && !schema.validate(container.data)) {
        throw new ValidationError(`Stored data validation failed for key: ${key}`);
      }

      // Update cache
      this.memoryCache.set(key, {
        data: container.data,
        timestamp: Date.now()
      });

      console.log(`✅ LocalStorageManager: Retrieved data for key: ${key}`);
      return container.data;
    } catch (error) {
      console.error(`❌ LocalStorageManager: Failed to retrieve data for key: ${key}`, error);
      if (error instanceof ValidationError || error instanceof SerializationError) {
        throw error;
      }
      throw new PersistenceError(
        `Failed to retrieve data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RETRIEVAL_ERROR',
        { key, error }
      );
    }
  }

  /**
   * Update existing data with partial updates
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
      console.log(`✅ LocalStorageManager: Updated data for key: ${key}`);
    } catch (error) {
      console.error(`❌ LocalStorageManager: Failed to update data for key: ${key}`, error);
      throw new PersistenceError(
        `Failed to update data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_ERROR',
        { key, error }
      );
    }
  }

  /**
   * Remove data from storage and cache
   */
  public async remove(key: StorageKeys | string): Promise<boolean> {
    try {
      localStorage.removeItem(key);
      this.memoryCache.delete(key);
      console.log(`✅ LocalStorageManager: Removed data for key: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ LocalStorageManager: Failed to remove data for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Check if key exists in storage
   */
  public exists(key: StorageKeys | string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys with optional prefix filter
   */
  public getKeys(prefix?: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (!prefix || key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Clear all data with optional prefix filter
   */
  public async clear(prefix?: string): Promise<void> {
    try {
      if (prefix) {
        const keys = this.getKeys(prefix);
        keys.forEach(key => {
          localStorage.removeItem(key);
          this.memoryCache.delete(key);
        });
        console.log(`✅ LocalStorageManager: Cleared ${keys.length} items with prefix: ${prefix}`);
      } else {
        localStorage.clear();
        this.memoryCache.clear();
        console.log(`✅ LocalStorageManager: Cleared all storage`);
      }
    } catch (error) {
      console.error(`❌ LocalStorageManager: Failed to clear storage`, error);
      throw new PersistenceError(
        `Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CLEAR_ERROR',
        { prefix, error }
      );
    }
  }

  /**
   * Get storage usage statistics
   */
  public getStorageStats(): {
    used: number;
    available: number;
    percentage: number;
    itemCount: number;
  } {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        used += key.length + (localStorage.getItem(key)?.length || 0);
      }
    }

    // Rough estimate of available space (most browsers limit to ~5-10MB)
    const estimated = 5 * 1024 * 1024; // 5MB
    const available = estimated - used;
    const percentage = (used / estimated) * 100;

    return {
      used,
      available: Math.max(0, available),
      percentage: Math.min(100, percentage),
      itemCount: localStorage.length
    };
  }

  /**
   * Register validation schema for a key
   */
  public registerSchema<T>(key: string, schema: ValidationSchema<T>): void {
    this.validationSchemas.set(key, schema);
    console.log(`✅ LocalStorageManager: Registered schema for key: ${key}`);
  }

  /**
   * Export data for backup purposes
   */
  public async exportData(keys?: string[]): Promise<Record<string, any>> {
    const exportData: Record<string, any> = {};
    const keysToExport = keys || this.getKeys();

    for (const key of keysToExport) {
      const data = await this.retrieve(key);
      if (data !== null) {
        exportData[key] = data;
      }
    }

    console.log(`✅ LocalStorageManager: Exported ${Object.keys(exportData).length} items`);
    return exportData;
  }

  /**
   * Import data from backup
   */
  public async importData(data: Record<string, any>, overwrite = false): Promise<void> {
    let imported = 0;
    let skipped = 0;

    for (const [key, value] of Object.entries(data)) {
      if (!overwrite && this.exists(key)) {
        skipped++;
        continue;
      }

      try {
        const schema = this.validationSchemas.get(key);
        await this.store(key, value, schema);
        imported++;
      } catch (error) {
        console.error(`❌ LocalStorageManager: Failed to import key: ${key}`, error);
      }
    }

    console.log(`✅ LocalStorageManager: Imported ${imported} items, skipped ${skipped}`);
  }

  // Private helper methods

  private getCachedData<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private generateChecksum(data: any): string {
    // Simple checksum implementation - could be enhanced with crypto
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
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

  private setupStorageEventListener(): void {
    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', (event) => {
      if (event.key && event.newValue) {
        // Invalidate cache for changed key
        this.memoryCache.delete(event.key);
        console.log(`🔄 LocalStorageManager: Storage event for key: ${event.key}`);
      }
    });
  }
}

// Export singleton instance
export const localStorageManager = LocalStorageManager.getInstance();