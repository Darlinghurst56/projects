/**
 * TypeScript Data Models for Dashboard Persistence Layer
 * Task 4.1 - Backend Agent Implementation
 */

// Widget positioning and sizing types
export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

// Widget data interface with strongly typed configuration
export interface WidgetData {
  id: string;
  type: 'dns-info' | 'dns-status' | 'dns-profile' | 'pause-test' | 'agent-registry' | 'task-assignment';
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  isVisible: boolean;
  isMinimized: boolean;
  configuration: Record<string, any>; // Widget-specific settings
  lastUpdated: Date;
  version: string;
}

// User notes with categorization and tagging
export interface UserNote {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'dns' | 'troubleshooting' | 'configuration' | 'custom';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isArchived: boolean;
  metadata?: Record<string, any>;
}

// Theme and display preferences with enum-based typing
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto'
}

export enum LayoutMode {
  GRID = 'grid',
  FREEFORM = 'freeform',
  COMPACT = 'compact'
}

export enum NotificationLevel {
  ALL = 'all',
  IMPORTANT = 'important',
  CRITICAL = 'critical',
  NONE = 'none'
}

export interface UserPreferences {
  theme: Theme;
  layoutMode: LayoutMode;
  autoRefresh: boolean;
  refreshInterval: number; // milliseconds
  notifications: {
    enabled: boolean;
    level: NotificationLevel;
    sound: boolean;
    desktop: boolean;
  };
  dashboard: {
    showGrid: boolean;
    snapToGrid: boolean;
    gridSize: number;
    showHeader: boolean;
    compactMode: boolean;
  };
  widgets: {
    defaultSize: WidgetSize;
    allowResize: boolean;
    allowMove: boolean;
    autoSave: boolean;
  };
}

// Application settings with type-safe configuration
export enum Language {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de'
}

export enum Timezone {
  UTC = 'UTC',
  PST = 'America/Los_Angeles',
  EST = 'America/New_York',
  GMT = 'Europe/London',
  CET = 'Europe/Paris'
}

export interface AppSettings {
  language: Language;
  timezone: Timezone;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  debug: {
    enabled: boolean;
    level: 'error' | 'warn' | 'info' | 'debug';
    logToConsole: boolean;
    logToFile: boolean;
  };
  performance: {
    enableAnimations: boolean;
    reducedMotion: boolean;
    prefersReducedData: boolean;
  };
  security: {
    autoLock: boolean;
    lockTimeout: number; // minutes
    requirePin: boolean;
  };
  api: {
    timeout: number; // milliseconds
    retries: number;
    baseUrl?: string;
  };
}

// Storage container types for persistence
export interface StorageContainer<T> {
  data: T;
  metadata: {
    version: string;
    createdAt: Date;
    updatedAt: Date;
    checksum?: string;
  };
}

// Single-user session data for PIN authentication
export interface UserSession {
  isAuthenticated: boolean;
  isActive: boolean;
  lastActivity: Date;
  sessionToken: string;
  pinExpiresAt?: Date;
  preferences: UserPreferences;
  settings: AppSettings;
}

// Storage keys enum for type-safe localStorage operations
export enum StorageKeys {
  WIDGETS = 'dashboard_widgets',
  NOTES = 'user_notes',
  PREFERENCES = 'user_preferences',
  SETTINGS = 'app_settings',
  SESSION = 'user_session'
}

// Validation schemas type definitions
export interface ValidationSchema<T> {
  validate: (data: unknown) => data is T;
  sanitize: (data: unknown) => T | null;
  version: string;
}

// Error types for persistence operations
export class PersistenceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

export class ValidationError extends PersistenceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class SerializationError extends PersistenceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SERIALIZATION_ERROR', details);
    this.name = 'SerializationError';
  }
}