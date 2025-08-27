/**
 * Memory MCP Adapter for Session Management
 * Task 4.1 - Backend Agent Implementation
 */

import { UserSession, PersistenceError } from '../types/index.js';

export interface MemoryMCPSession {
  id: string;
  data: any;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

export class MemoryMCPAdapter {
  private static instance: MemoryMCPAdapter;
  private sessionStore = new Map<string, MemoryMCPSession>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    this.startCleanupTimer();
    this.setupBeforeUnloadHandler();
  }

  public static getInstance(): MemoryMCPAdapter {
    if (!MemoryMCPAdapter.instance) {
      MemoryMCPAdapter.instance = new MemoryMCPAdapter();
    }
    return MemoryMCPAdapter.instance;
  }

  /**
   * Store session data in memory with optional TTL
   */
  public async storeSession(
    sessionId: string,
    data: any,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      const session: MemoryMCPSession = {
        id: sessionId,
        data,
        timestamp: Date.now(),
        ttl
      };

      this.sessionStore.set(sessionId, session);
      console.log(`✅ MemoryMCP: Stored session ${sessionId} with TTL ${ttl}ms`);
    } catch (error) {
      console.error(`❌ MemoryMCP: Failed to store session ${sessionId}`, error);
      throw new PersistenceError(
        `Failed to store session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MEMORY_STORE_ERROR',
        { sessionId, error }
      );
    }
  }

  /**
   * Retrieve session data from memory
   */
  public async getSession(sessionId: string): Promise<any | null> {
    try {
      const session = this.sessionStore.get(sessionId);
      
      if (!session) {
        console.log(`ℹ️ MemoryMCP: Session ${sessionId} not found`);
        return null;
      }

      // Check if session has expired
      if (session.ttl && (Date.now() - session.timestamp) > session.ttl) {
        this.sessionStore.delete(sessionId);
        console.log(`⏰ MemoryMCP: Session ${sessionId} expired and removed`);
        return null;
      }

      console.log(`✅ MemoryMCP: Retrieved session ${sessionId}`);
      return session.data;
    } catch (error) {
      console.error(`❌ MemoryMCP: Failed to retrieve session ${sessionId}`, error);
      throw new PersistenceError(
        `Failed to retrieve session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'MEMORY_RETRIEVE_ERROR',
        { sessionId, error }
      );
    }
  }

  /**
   * Update existing session data
   */
  public async updateSession(
    sessionId: string,
    updater: (current: any) => any,
    extendTTL: boolean = true
  ): Promise<void> {
    try {
      const current = await this.getSession(sessionId);
      if (current === null) {
        throw new PersistenceError('Session not found', 'SESSION_NOT_FOUND', { sessionId });
      }

      const updated = updater(current);
      const ttl = extendTTL ? this.DEFAULT_TTL : undefined;
      await this.storeSession(sessionId, updated, ttl);
      
      console.log(`✅ MemoryMCP: Updated session ${sessionId}`);
    } catch (error) {
      console.error(`❌ MemoryMCP: Failed to update session ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Remove session from memory
   */
  public async removeSession(sessionId: string): Promise<boolean> {
    try {
      const removed = this.sessionStore.delete(sessionId);
      if (removed) {
        console.log(`✅ MemoryMCP: Removed session ${sessionId}`);
      } else {
        console.log(`ℹ️ MemoryMCP: Session ${sessionId} not found for removal`);
      }
      return removed;
    } catch (error) {
      console.error(`❌ MemoryMCP: Failed to remove session ${sessionId}`, error);
      return false;
    }
  }

  /**
   * Get all active session IDs
   */
  public getActiveSessions(): string[] {
    const now = Date.now();
    const activeSessions: string[] = [];

    for (const [sessionId, session] of this.sessionStore.entries()) {
      // Check if session is still valid
      if (!session.ttl || (now - session.timestamp) <= session.ttl) {
        activeSessions.push(sessionId);
      }
    }

    return activeSessions;
  }

  /**
   * Get session count and memory usage stats
   */
  public getStats(): {
    sessionCount: number;
    memoryUsage: number;
    activeCount: number;
    expiredCount: number;
  } {
    const now = Date.now();
    let memoryUsage = 0;
    let activeCount = 0;
    let expiredCount = 0;

    for (const session of this.sessionStore.values()) {
      const sessionSize = JSON.stringify(session.data).length * 2; // Rough estimate
      memoryUsage += sessionSize;

      if (!session.ttl || (now - session.timestamp) <= session.ttl) {
        activeCount++;
      } else {
        expiredCount++;
      }
    }

    return {
      sessionCount: this.sessionStore.size,
      memoryUsage,
      activeCount,
      expiredCount
    };
  }

  /**
   * Store user session with type safety (single user)
   */
  public async storeUserSession(session: UserSession): Promise<void> {
    await this.storeSession('current_user_session', session);
  }

  /**
   * Retrieve current user session with type safety
   */
  public async getCurrentUserSession(): Promise<UserSession | null> {
    return await this.getSession('current_user_session');
  }

  /**
   * Update current user activity timestamp
   */
  public async updateCurrentUserActivity(): Promise<void> {
    await this.updateSession('current_user_session', (session: UserSession) => {
      return {
        ...session,
        lastActivity: new Date(),
        isActive: true
      };
    });
  }

  /**
   * Mark current user as inactive
   */
  public async markCurrentUserInactive(): Promise<void> {
    await this.updateSession('current_user_session', (session: UserSession) => {
      return {
        ...session,
        isActive: false
      };
    }, false); // Don't extend TTL
  }

  /**
   * Cache temporary data with expiration
   */
  public async cacheData(
    key: string,
    data: any,
    ttl: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<void> {
    await this.storeSession(`cache_${key}`, data, ttl);
  }

  /**
   * Get cached data
   */
  public async getCachedData(key: string): Promise<any | null> {
    return await this.getSession(`cache_${key}`);
  }

  /**
   * Clear expired sessions manually
   */
  public cleanupExpiredSessions(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessionStore.entries()) {
      if (session.ttl && (now - session.timestamp) > session.ttl) {
        this.sessionStore.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 MemoryMCP: Cleaned up ${cleaned} expired sessions`);
    }

    return cleaned;
  }

  /**
   * Clear all sessions (use with caution)
   */
  public clearAllSessions(): void {
    const count = this.sessionStore.size;
    this.sessionStore.clear();
    console.log(`🧹 MemoryMCP: Cleared all ${count} sessions`);
  }

  // Private helper methods

  private startCleanupTimer(): void {
    // Run cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 10 * 60 * 1000);
  }

  private setupBeforeUnloadHandler(): void {
    // Clean up when page is about to unload
    window.addEventListener('beforeunload', () => {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      
      // Mark current user session as inactive on page unload
      this.markCurrentUserInactive().catch(console.error);
    });
  }
}

// Export singleton instance
export const memoryMCPAdapter = MemoryMCPAdapter.getInstance();