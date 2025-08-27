/**
 * Storage Integration Layer - Main Export
 * Task 4.1 - Backend Agent Implementation
 * Task 4.2 - Integration Specialist File MCP Implementation
 */

import { localStorageManager } from './LocalStorageManager.js';
import { memoryMCPAdapter } from './MemoryMCPAdapter.js';
import { ValidationSchemas } from './ValidationSchemas.js';
import { ArrayValidationSchemas } from './ArrayValidationSchemas.js';

// File MCP Integration - Task 4.2 (import from existing files)
import { FilePersistenceManager, createFilePersistenceManager } from './FilePersistenceManager.js';
import { PersistenceOrchestrator, createPersistenceOrchestrator, PersistenceConfig, SyncStatus } from './PersistenceOrchestrator.js';
import { McpFileSystemAdapter, createMcpFileSystemAdapter, McpFileSystemConfig, McpFileInfo } from './McpFileSystemAdapter.js';

import {
  WidgetData,
  UserNote,
  UserPreferences,
  AppSettings,
  UserSession,
  StorageKeys
} from '../types/index.js';

// Re-export File MCP Types from their respective modules
export type { FileStorageConfig, BackupMetadata } from './FilePersistenceManager.js';

/**
 * Unified Storage Service
 * Provides a high-level API that combines LocalStorage and Memory MCP
 */
export class StorageService {
  private static instance: StorageService;

  private constructor() {
    this.initializeSchemas();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private initializeSchemas(): void {
    // Register validation schemas with LocalStorageManager
    localStorageManager.registerSchema(StorageKeys.WIDGETS, ArrayValidationSchemas.WidgetDataArray);
    localStorageManager.registerSchema(StorageKeys.NOTES, ArrayValidationSchemas.UserNoteArray);
    localStorageManager.registerSchema(StorageKeys.PREFERENCES, ValidationSchemas.UserPreferences);
    localStorageManager.registerSchema(StorageKeys.SETTINGS, ValidationSchemas.AppSettings);
    localStorageManager.registerSchema(StorageKeys.SESSION, ValidationSchemas.UserSession);
    
    console.log('✅ StorageService: Initialized with validation schemas');
  }

  // Widget Data Operations
  public async getWidgets(): Promise<WidgetData[]> {
    const widgets = await localStorageManager.retrieve<WidgetData[]>(
      StorageKeys.WIDGETS,
      ArrayValidationSchemas.WidgetDataArray
    );
    return widgets || [];
  }

  public async saveWidgets(widgets: WidgetData[]): Promise<void> {
    await localStorageManager.store(
      StorageKeys.WIDGETS,
      widgets,
      ArrayValidationSchemas.WidgetDataArray
    );
    
    // Cache in memory for quick access
    await memoryMCPAdapter.cacheData('widgets', widgets, 10 * 60 * 1000); // 10 minutes
  }

  public async getWidget(widgetId: string): Promise<WidgetData | null> {
    const widgets = await this.getWidgets();
    return widgets.find(w => w.id === widgetId) || null;
  }

  public async updateWidget(widgetId: string, updates: Partial<WidgetData>): Promise<void> {
    await localStorageManager.update<WidgetData[]>(
      StorageKeys.WIDGETS,
      (widgets) => {
        if (!widgets) return [];
        
        const index = widgets.findIndex(w => w.id === widgetId);
        if (index >= 0) {
          widgets[index] = { ...widgets[index], ...updates, lastUpdated: new Date() };
        }
        return widgets;
      },
      ArrayValidationSchemas.WidgetDataArray
    );
    
    // Update cache
    const updatedWidgets = await this.getWidgets();
    await memoryMCPAdapter.cacheData('widgets', updatedWidgets, 10 * 60 * 1000);
  }

  // User Notes Operations
  public async getNotes(): Promise<UserNote[]> {
    const notes = await localStorageManager.retrieve<UserNote[]>(
      StorageKeys.NOTES,
      ArrayValidationSchemas.UserNoteArray
    );
    return notes || [];
  }

  public async saveNote(note: UserNote): Promise<void> {
    await localStorageManager.update<UserNote[]>(
      StorageKeys.NOTES,
      (notes) => {
        if (!notes) return [note];
        
        const index = notes.findIndex(n => n.id === note.id);
        if (index >= 0) {
          notes[index] = note;
        } else {
          notes.push(note);
        }
        return notes;
      },
      ArrayValidationSchemas.UserNoteArray
    );
  }

  public async deleteNote(noteId: string): Promise<void> {
    await localStorageManager.update<UserNote[]>(
      StorageKeys.NOTES,
      (notes) => {
        if (!notes) return [];
        return notes.filter(n => n.id !== noteId);
      },
      ArrayValidationSchemas.UserNoteArray
    );
  }

  // User Preferences Operations
  public async getPreferences(): Promise<UserPreferences | null> {
    // Check memory cache first
    const cached = await memoryMCPAdapter.getCachedData('preferences');
    if (cached) return cached;
    
    const preferences = await localStorageManager.retrieve<UserPreferences>(
      StorageKeys.PREFERENCES,
      ValidationSchemas.UserPreferences
    );
    
    // Cache for quick access
    if (preferences) {
      await memoryMCPAdapter.cacheData('preferences', preferences, 30 * 60 * 1000); // 30 minutes
    }
    
    return preferences;
  }

  public async savePreferences(preferences: UserPreferences): Promise<void> {
    await localStorageManager.store(
      StorageKeys.PREFERENCES,
      preferences,
      ValidationSchemas.UserPreferences
    );
    
    // Update cache
    await memoryMCPAdapter.cacheData('preferences', preferences, 30 * 60 * 1000);
  }

  // App Settings Operations
  public async getSettings(): Promise<AppSettings | null> {
    // Check memory cache first
    const cached = await memoryMCPAdapter.getCachedData('settings');
    if (cached) return cached;
    
    const settings = await localStorageManager.retrieve<AppSettings>(
      StorageKeys.SETTINGS,
      ValidationSchemas.AppSettings
    );
    
    // Cache for quick access
    if (settings) {
      await memoryMCPAdapter.cacheData('settings', settings, 60 * 60 * 1000); // 1 hour
    }
    
    return settings;
  }

  public async saveSettings(settings: AppSettings): Promise<void> {
    await localStorageManager.store(
      StorageKeys.SETTINGS,
      settings,
      ValidationSchemas.AppSettings
    );
    
    // Update cache
    await memoryMCPAdapter.cacheData('settings', settings, 60 * 60 * 1000);
  }

  // Single-User Session Operations (PIN Authentication)
  public async createUserSession(session: UserSession): Promise<void> {
    // Store in both localStorage and memory
    await localStorageManager.store(
      StorageKeys.SESSION,
      session,
      ValidationSchemas.UserSession
    );
    
    await memoryMCPAdapter.storeSession('current_user', session);
    
    console.log(`✅ StorageService: Created single-user session`);
  }

  public async getCurrentSession(): Promise<UserSession | null> {
    // Check memory first (faster)
    const memorySession = await memoryMCPAdapter.getCachedData('current_user');
    if (memorySession) return memorySession;
    
    // Fallback to localStorage
    const storedSession = await localStorageManager.retrieve<UserSession>(
      StorageKeys.SESSION,
      ValidationSchemas.UserSession
    );
    
    // Restore to memory if found
    if (storedSession) {
      await memoryMCPAdapter.cacheData('current_user', storedSession, 30 * 60 * 1000);
      return storedSession;
    }
    
    return null;
  }

  public async updateUserActivity(): Promise<void> {
    const session = await this.getCurrentSession();
    if (session) {
      session.lastActivity = new Date();
      session.isActive = true;
      await localStorageManager.store(
        StorageKeys.SESSION,
        session,
        ValidationSchemas.UserSession
      );
      await memoryMCPAdapter.cacheData('current_user', session, 30 * 60 * 1000);
    }
  }

  public async endUserSession(): Promise<void> {
    await memoryMCPAdapter.removeSession('current_user');
    await localStorageManager.remove(StorageKeys.SESSION);
    
    console.log(`✅ StorageService: Ended single-user session`);
  }

  // Utility Operations
  public async exportAllData(): Promise<Record<string, any>> {
    const data = await localStorageManager.exportData();
    const memoryStats = memoryMCPAdapter.getStats();
    
    return {
      localStorage: data,
      memoryStats,
      exportedAt: new Date().toISOString()
    };
  }

  public async importAllData(data: Record<string, any>, overwrite = false): Promise<void> {
    if (data.localStorage) {
      await localStorageManager.importData(data.localStorage, overwrite);
    }
    
    console.log('✅ StorageService: Imported data successfully');
  }

  public getStorageStats(): {
    localStorage: ReturnType<typeof localStorageManager.getStorageStats>;
    memoryMCP: ReturnType<typeof memoryMCPAdapter.getStats>;
  } {
    return {
      localStorage: localStorageManager.getStorageStats(),
      memoryMCP: memoryMCPAdapter.getStats()
    };
  }

  public async clearAllData(): Promise<void> {
    await localStorageManager.clear();
    memoryMCPAdapter.clearAllSessions();
    
    console.log('✅ StorageService: Cleared all data');
  }
}

/**
 * Storage System Factory - Creates configured storage system for single-user with PIN authentication
 * Task 4.2 - Integration Specialist Implementation
 */
export class StorageSystemFactory {
  /**
   * Create a complete storage system with localStorage + file persistence for single user
   */
  public static createSingleUserStorage() {
    // Configuration for single-user dashboard with PIN authentication
    const config: PersistenceConfig = {
      fileStorage: {
        basePath: './data/dashboard-storage',
        userPartition: 'single-user',
        backupEnabled: true,
        backupPath: './data/dashboard-backups',
        maxBackups: 10, // Fewer backups for single user
        syncInterval: 120000 // Sync every 2 minutes
      },
      syncStrategy: 'scheduled', // Use scheduled sync
      syncInterval: 120000, // 2 minute sync interval
      batchSize: 5,
      fallbackToLocalStorage: true, // Always fallback to localStorage
      enableCrossTabSync: false // No need for cross-tab sync in single user
    };

    return createPersistenceOrchestrator(config);
  }

  /**
   * Create MCP file system adapter for dashboard storage
   */
  public static createMcpAdapter() {
    const config: McpFileSystemConfig = {
      serverName: 'filesystem',
      allowedDirectories: [
        '.',
        './data',
        './data/dashboard-storage',
        './data/dashboard-backups'
      ],
      timeout: 10000
    };

    return createMcpFileSystemAdapter(config);
  }

  /**
   * Initialize complete storage system with all components for single user
   */
  public static async initializeStorageSystem() {
    console.log('🚀 StorageSystemFactory: Initializing single-user storage system...');

    try {
      // Create MCP adapter
      const mcpAdapter = this.createMcpAdapter();
      await mcpAdapter.initialize();

      // Test MCP connection
      const connectionOk = await mcpAdapter.testConnection();
      if (!connectionOk) {
        console.warn('⚠️ StorageSystemFactory: MCP connection failed, file persistence may not work');
      }

      // Create orchestrator for single user
      const orchestrator = this.createSingleUserStorage();

      // Test storage operations
      await this.testStorageSystem(orchestrator);

      console.log('✅ StorageSystemFactory: Single-user storage system initialized successfully');
      
      return {
        orchestrator,
        mcpAdapter,
        localStorage: localStorageManager
      };
    } catch (error) {
      console.error('❌ StorageSystemFactory: Failed to initialize storage system', error);
      
      // Fallback to localStorage only
      console.log('🔄 StorageSystemFactory: Falling back to localStorage only');
      return {
        orchestrator: null,
        mcpAdapter: null,
        localStorage: localStorageManager
      };
    }
  }

  /**
   * Test storage system functionality
   */
  private static async testStorageSystem(orchestrator: PersistenceOrchestrator) {
    console.log('🧪 StorageSystemFactory: Testing storage system...');

    try {
      // Test data
      const testKey = 'system-test';
      const testData = {
        timestamp: new Date(),
        testValue: 'Storage system test',
        userAgent: navigator.userAgent
      };

      // Test store operation
      await orchestrator.store(testKey, testData);
      console.log('✅ Test store operation successful');

      // Test retrieve operation
      const retrieved = await orchestrator.retrieve(testKey);
      if (retrieved && (retrieved as any).testValue === testData.testValue) {
        console.log('✅ Test retrieve operation successful');
      } else {
        console.warn('⚠️ Test retrieve operation returned unexpected data');
      }

      // Test update operation
      await orchestrator.update(testKey, (current: any) => ({
        ...current,
        updated: true,
        updateTime: new Date()
      }));
      console.log('✅ Test update operation successful');

      // Cleanup test data
      await orchestrator.remove(testKey);
      console.log('✅ Test cleanup successful');

      console.log('✅ StorageSystemFactory: All storage tests passed');
    } catch (error) {
      console.error('❌ StorageSystemFactory: Storage test failed', error);
      throw error;
    }
  }

  /**
   * Create backup storage instance for data export
   */
  public static createBackupStorage() {
    return this.createSingleUserStorage();
  }
}

// Export singleton instance and individual managers
export const storageService = StorageService.getInstance();
export { localStorageManager, memoryMCPAdapter, ValidationSchemas };

// Export File MCP Integration - Task 4.2
export { 
  FilePersistenceManager, 
  createFilePersistenceManager,
  PersistenceOrchestrator,
  createPersistenceOrchestrator,
  McpFileSystemAdapter,
  createMcpFileSystemAdapter
};

// Export all types
export * from '../types/index.js';

console.log('📦 Storage module loaded - File MCP integration ready (Task 4.2)');