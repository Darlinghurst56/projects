/**
 * Validation Schemas for Data Types
 * Task 4.1 - Backend Agent Implementation
 */

import {
  WidgetData,
  UserNote,
  UserPreferences,
  AppSettings,
  UserSession,
  ValidationSchema,
  Theme,
  LayoutMode,
  NotificationLevel,
  Language,
  Timezone
} from '../types/index.js';

// Type guard utility functions
function isValidDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

function isString(value: any): value is string {
  return typeof value === 'string';
}

function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

// Widget Data Validation Schema
export const WidgetDataSchema: ValidationSchema<WidgetData> = {
  validate: (data: unknown): data is WidgetData => {
    if (!isObject(data)) return false;
    
    const d = data as any;
    return (
      isString(d.id) &&
      isString(d.type) &&
      ['dns-info', 'dns-status', 'dns-profile', 'pause-test', 'agent-registry', 'task-assignment'].includes(d.type) &&
      isString(d.title) &&
      isObject(d.position) &&
      isNumber(d.position.x) &&
      isNumber(d.position.y) &&
      isObject(d.size) &&
      isNumber(d.size.width) &&
      isNumber(d.size.height) &&
      isBoolean(d.isVisible) &&
      isBoolean(d.isMinimized) &&
      isObject(d.configuration) &&
      isValidDate(new Date(d.lastUpdated)) &&
      isString(d.version)
    );
  },
  
  sanitize: (data: unknown): WidgetData | null => {
    if (!isObject(data)) return null;
    
    const d = data as any;
    try {
      return {
        id: String(d.id || ''),
        type: d.type || 'dns-info',
        title: String(d.title || ''),
        position: {
          x: Number(d.position?.x || 0),
          y: Number(d.position?.y || 0)
        },
        size: {
          width: Number(d.size?.width || 300),
          height: Number(d.size?.height || 200)
        },
        isVisible: Boolean(d.isVisible !== false),
        isMinimized: Boolean(d.isMinimized),
        configuration: isObject(d.configuration) ? d.configuration : {},
        lastUpdated: new Date(d.lastUpdated || Date.now()),
        version: String(d.version || '1.0.0')
      };
    } catch {
      return null;
    }
  },
  
  version: '1.0.0'
};

// User Note Validation Schema
export const UserNoteSchema: ValidationSchema<UserNote> = {
  validate: (data: unknown): data is UserNote => {
    if (!isObject(data)) return false;
    
    const d = data as any;
    return (
      isString(d.id) &&
      isString(d.title) &&
      isString(d.content) &&
      isString(d.category) &&
      ['general', 'dns', 'troubleshooting', 'configuration', 'custom'].includes(d.category) &&
      isArray(d.tags) &&
      d.tags.every(isString) &&
      isValidDate(new Date(d.createdAt)) &&
      isValidDate(new Date(d.updatedAt)) &&
      isBoolean(d.isPinned) &&
      isBoolean(d.isArchived)
    );
  },
  
  sanitize: (data: unknown): UserNote | null => {
    if (!isObject(data)) return null;
    
    const d = data as any;
    try {
      return {
        id: String(d.id || ''),
        title: String(d.title || ''),
        content: String(d.content || ''),
        category: d.category || 'general',
        tags: isArray(d.tags) ? d.tags.filter(isString) : [],
        createdAt: new Date(d.createdAt || Date.now()),
        updatedAt: new Date(d.updatedAt || Date.now()),
        isPinned: Boolean(d.isPinned),
        isArchived: Boolean(d.isArchived),
        metadata: isObject(d.metadata) ? d.metadata : undefined
      };
    } catch {
      return null;
    }
  },
  
  version: '1.0.0'
};

// User Preferences Validation Schema
export const UserPreferencesSchema: ValidationSchema<UserPreferences> = {
  validate: (data: unknown): data is UserPreferences => {
    if (!isObject(data)) return false;
    
    const d = data as any;
    return (
      isObject(d) &&
      Object.values(Theme).includes(d.theme) &&
      Object.values(LayoutMode).includes(d.layoutMode) &&
      isBoolean(d.autoRefresh) &&
      isNumber(d.refreshInterval) &&
      isObject(d.notifications) &&
      isBoolean(d.notifications.enabled) &&
      Object.values(NotificationLevel).includes(d.notifications.level) &&
      isBoolean(d.notifications.sound) &&
      isBoolean(d.notifications.desktop) &&
      isObject(d.dashboard) &&
      isObject(d.widgets)
    );
  },
  
  sanitize: (data: unknown): UserPreferences | null => {
    if (!isObject(data)) return null;
    
    const d = data as any;
    try {
      return {
        theme: Object.values(Theme).includes(d.theme) ? d.theme : Theme.LIGHT,
        layoutMode: Object.values(LayoutMode).includes(d.layoutMode) ? d.layoutMode : LayoutMode.GRID,
        autoRefresh: Boolean(d.autoRefresh !== false),
        refreshInterval: Number(d.refreshInterval || 300000),
        notifications: {
          enabled: Boolean(d.notifications?.enabled !== false),
          level: Object.values(NotificationLevel).includes(d.notifications?.level) 
            ? d.notifications.level 
            : NotificationLevel.IMPORTANT,
          sound: Boolean(d.notifications?.sound),
          desktop: Boolean(d.notifications?.desktop)
        },
        dashboard: {
          showGrid: Boolean(d.dashboard?.showGrid),
          snapToGrid: Boolean(d.dashboard?.snapToGrid !== false),
          gridSize: Number(d.dashboard?.gridSize || 20),
          showHeader: Boolean(d.dashboard?.showHeader !== false),
          compactMode: Boolean(d.dashboard?.compactMode)
        },
        widgets: {
          defaultSize: {
            width: Number(d.widgets?.defaultSize?.width || 300),
            height: Number(d.widgets?.defaultSize?.height || 200)
          },
          allowResize: Boolean(d.widgets?.allowResize !== false),
          allowMove: Boolean(d.widgets?.allowMove !== false),
          autoSave: Boolean(d.widgets?.autoSave !== false)
        }
      };
    } catch {
      return null;
    }
  },
  
  version: '1.0.0'
};

// App Settings Validation Schema
export const AppSettingsSchema: ValidationSchema<AppSettings> = {
  validate: (data: unknown): data is AppSettings => {
    if (!isObject(data)) return false;
    
    const d = data as any;
    return (
      Object.values(Language).includes(d.language) &&
      Object.values(Timezone).includes(d.timezone) &&
      isString(d.dateFormat) &&
      ['12h', '24h'].includes(d.timeFormat) &&
      isObject(d.debug) &&
      isObject(d.performance) &&
      isObject(d.security) &&
      isObject(d.api)
    );
  },
  
  sanitize: (data: unknown): AppSettings | null => {
    if (!isObject(data)) return null;
    
    const d = data as any;
    try {
      return {
        language: Object.values(Language).includes(d.language) ? d.language : Language.EN,
        timezone: Object.values(Timezone).includes(d.timezone) ? d.timezone : Timezone.UTC,
        dateFormat: String(d.dateFormat || 'YYYY-MM-DD'),
        timeFormat: ['12h', '24h'].includes(d.timeFormat) ? d.timeFormat : '24h',
        debug: {
          enabled: Boolean(d.debug?.enabled),
          level: ['error', 'warn', 'info', 'debug'].includes(d.debug?.level) ? d.debug.level : 'error',
          logToConsole: Boolean(d.debug?.logToConsole !== false),
          logToFile: Boolean(d.debug?.logToFile)
        },
        performance: {
          enableAnimations: Boolean(d.performance?.enableAnimations !== false),
          reducedMotion: Boolean(d.performance?.reducedMotion),
          prefersReducedData: Boolean(d.performance?.prefersReducedData)
        },
        security: {
          autoLock: Boolean(d.security?.autoLock),
          lockTimeout: Number(d.security?.lockTimeout || 30),
          requirePin: Boolean(d.security?.requirePin)
        },
        api: {
          timeout: Number(d.api?.timeout || 30000),
          retries: Number(d.api?.retries || 3),
          baseUrl: d.api?.baseUrl ? String(d.api.baseUrl) : undefined
        }
      };
    } catch {
      return null;
    }
  },
  
  version: '1.0.0'
};

// User Session Validation Schema (single-user with PIN authentication)
export const UserSessionSchema: ValidationSchema<UserSession> = {
  validate: (data: unknown): data is UserSession => {
    if (!isObject(data)) return false;
    
    const d = data as any;
    return (
      isBoolean(d.isAuthenticated) &&
      isBoolean(d.isActive) &&
      isValidDate(new Date(d.lastActivity)) &&
      isString(d.sessionToken) &&
      isObject(d.preferences) &&
      isObject(d.settings)
    );
  },
  
  sanitize: (data: unknown): UserSession | null => {
    if (!isObject(data)) return null;
    
    const d = data as any;
    try {
      const preferences = UserPreferencesSchema.sanitize(d.preferences);
      const settings = AppSettingsSchema.sanitize(d.settings);
      
      if (!preferences || !settings) return null;
      
      return {
        isAuthenticated: Boolean(d.isAuthenticated),
        isActive: Boolean(d.isActive),
        lastActivity: new Date(d.lastActivity || Date.now()),
        sessionToken: String(d.sessionToken || ''),
        pinExpiresAt: d.pinExpiresAt ? new Date(d.pinExpiresAt) : undefined,
        preferences,
        settings
      };
    } catch {
      return null;
    }
  },
  
  version: '1.0.0'
};

// Export all schemas for easy registration
export const ValidationSchemas = {
  WidgetData: WidgetDataSchema,
  UserNote: UserNoteSchema,
  UserPreferences: UserPreferencesSchema,
  AppSettings: AppSettingsSchema,
  UserSession: UserSessionSchema
} as const;