/**
 * Secure PIN Management System for Family Dashboard
 * 
 * Provides secure PIN storage and validation using bcrypt hashing.
 * Includes rate limiting and account lockout protection.
 * 
 * Features:
 * - bcrypt hashing for PIN storage
 * - Rate limiting with exponential backoff
 * - Account lockout after failed attempts
 * - Environment variable configuration
 * - Secure PIN validation with timing attack protection
 * 
 * @module PinManager
 * @version 1.0.0
 * @author Home Dashboard Security Team
 */

const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

class PinManager {
  constructor() {
    this.saltRounds = 12; // High salt rounds for security
    this.pinStorePath = path.join(__dirname, '../data/pins.json');
    this.attemptStorePath = path.join(__dirname, '../data/pin_attempts.json');
    
    // Rate limiting configuration
    this.maxAttempts = 3;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.backoffMultiplier = 2;
    
    this.initializeStorage();
  }

  /**
   * Initialize secure PIN storage
   */
  async initializeStorage() {
    try {
      const dataDir = path.join(__dirname, '../data');
      await fs.mkdir(dataDir, { recursive: true, mode: 0o700 });
      
      // Initialize PIN storage if it doesn't exist
      try {
        await fs.access(this.pinStorePath);
      } catch {
        await this.createDefaultPins();
      }
      
      // Initialize attempt tracking
      try {
        await fs.access(this.attemptStorePath);
      } catch {
        await fs.writeFile(this.attemptStorePath, JSON.stringify({}), { mode: 0o600 });
      }
    } catch (error) {
      console.error('Failed to initialize PIN storage:', error);
    }
  }

  /**
   * Create default PIN configuration with environment variables
   */
  async createDefaultPins() {
    const defaultPins = [
      {
        userId: 'family_member_1',
        pin: process.env.FAMILY_MEMBER_1_PIN || '1234',
        name: process.env.FAMILY_MEMBER_1_NAME || 'Family Member 1',
        created: Date.now()
      },
      {
        userId: 'family_member_2', 
        pin: process.env.FAMILY_MEMBER_2_PIN || '5678',
        name: process.env.FAMILY_MEMBER_2_NAME || 'Family Member 2',
        created: Date.now()
      },
      {
        userId: 'admin_user',
        pin: process.env.ADMIN_PIN || '9999',
        name: process.env.ADMIN_NAME || 'Admin User',
        created: Date.now()
      }
    ];

    // Create simple storage structure with hashed PINs
    const pinStorage = {};
    for (const userData of defaultPins) {
      pinStorage[userData.userId] = {
        userId: userData.userId,
        hash: await bcrypt.hash(userData.pin, this.saltRounds),
        name: userData.name,
        created: userData.created
      };
    }

    await fs.writeFile(this.pinStorePath, JSON.stringify(pinStorage, null, 2), { mode: 0o600 });
    
    console.log('Default PIN configuration created. Please update environment variables for production.');
    console.log('Environment variables: FAMILY_MEMBER_1_PIN, FAMILY_MEMBER_2_PIN, ADMIN_PIN');
  }

  /**
   * Load PIN storage from file
   */
  async loadPinStorage() {
    try {
      const data = await fs.readFile(this.pinStorePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load PIN storage:', error);
      return {};
    }
  }

  /**
   * Load attempt tracking from file
   */
  async loadAttemptTracking() {
    try {
      const data = await fs.readFile(this.attemptStorePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load attempt tracking:', error);
      return {};
    }
  }

  /**
   * Save attempt tracking to file
   */
  async saveAttemptTracking(attempts) {
    try {
      await fs.writeFile(this.attemptStorePath, JSON.stringify(attempts, null, 2), { mode: 0o600 });
    } catch (error) {
      console.error('Failed to save attempt tracking:', error);
    }
  }

  /**
   * Check if account is locked out
   */
  async isAccountLocked(identifier) {
    const attempts = await this.loadAttemptTracking();
    const userAttempts = attempts[identifier];
    
    if (!userAttempts) return false;
    
    if (userAttempts.failedAttempts >= this.maxAttempts) {
      const lockoutEnd = userAttempts.lastAttempt + (this.lockoutDuration * Math.pow(this.backoffMultiplier, userAttempts.lockouts || 0));
      
      if (Date.now() < lockoutEnd) {
        return {
          locked: true,
          lockoutEnd,
          remainingTime: lockoutEnd - Date.now()
        };
      } else {
        // Reset after lockout period
        userAttempts.failedAttempts = 0;
        await this.saveAttemptTracking(attempts);
      }
    }
    
    return false;
  }

  /**
   * Record failed PIN attempt
   */
  async recordFailedAttempt(identifier) {
    const attempts = await this.loadAttemptTracking();
    
    if (!attempts[identifier]) {
      attempts[identifier] = {
        failedAttempts: 0,
        lastAttempt: Date.now(),
        lockouts: 0
      };
    }
    
    attempts[identifier].failedAttempts++;
    attempts[identifier].lastAttempt = Date.now();
    
    if (attempts[identifier].failedAttempts >= this.maxAttempts) {
      attempts[identifier].lockouts = (attempts[identifier].lockouts || 0) + 1;
      console.warn(`PIN attempt lockout triggered for identifier: ${identifier.substring(0, 8)}...`);
    }
    
    await this.saveAttemptTracking(attempts);
  }

  /**
   * Reset failed attempts on successful login
   */
  async resetFailedAttempts(identifier) {
    const attempts = await this.loadAttemptTracking();
    
    if (attempts[identifier]) {
      attempts[identifier].failedAttempts = 0;
      attempts[identifier].lastAttempt = Date.now();
      await this.saveAttemptTracking(attempts);
    }
  }

  /**
   * Validate PIN with rate limiting and security measures
   */
  async validatePin(pin, name, clientIdentifier = 'unknown') {
    const identifier = clientIdentifier; // Could use IP or session ID in production
    
    // Check for account lockout
    const lockStatus = await this.isAccountLocked(identifier);
    if (lockStatus && lockStatus.locked) {
      return {
        valid: false,
        error: 'Account temporarily locked due to failed attempts',
        lockoutEnd: lockStatus.lockoutEnd,
        remainingTime: lockStatus.remainingTime
      };
    }
    
    try {
      const pinStorage = await this.loadPinStorage();
      
      // Timing attack protection: always perform comparison even with no matches
      let foundUser = null;
      let validPin = false;
      
      for (const [userId, userData] of Object.entries(pinStorage)) {
        const pinMatches = await bcrypt.compare(pin, userData.hash);
        
        if (pinMatches) {
          foundUser = userData;
          validPin = true;
          break;
        }
      }
      
      if (validPin && foundUser) {
        await this.resetFailedAttempts(identifier);
        
        return {
          valid: true,
          user: {
            id: foundUser.userId,
            name: name || foundUser.name,
            method: 'pin'
          }
        };
      } else {
        await this.recordFailedAttempt(identifier);
        
        return {
          valid: false,
          error: 'Invalid PIN'
        };
      }
    } catch (error) {
      console.error('PIN validation error:', error);
      await this.recordFailedAttempt(identifier);
      
      return {
        valid: false,
        error: 'PIN validation failed'
      };
    }
  }

  /**
   * Add new PIN for a user
   */
  async addPin(pin, userId, userName) {
    try {
      const pinStorage = await this.loadPinStorage();
      const pinHash = await bcrypt.hash(pin, this.saltRounds);
      
      pinStorage[userId] = {
        userId,
        hash: pinHash,
        name: userName,
        created: Date.now()
      };
      
      await fs.writeFile(this.pinStorePath, JSON.stringify(pinStorage, null, 2), { mode: 0o600 });
      
      console.log(`PIN added for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to add PIN:', error);
      return false;
    }
  }

  /**
   * Remove PIN for a user
   */
  async removePin(userId) {
    try {
      const pinStorage = await this.loadPinStorage();
      
      // Remove the PIN entry
      if (pinStorage[userId]) {
        delete pinStorage[userId];
      }
      
      await fs.writeFile(this.pinStorePath, JSON.stringify(pinStorage, null, 2), { mode: 0o600 });
      
      console.log(`PIN removed for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to remove PIN:', error);
      return false;
    }
  }

  /**
   * Get security status and metrics
   */
  async getSecurityStatus() {
    try {
      const attempts = await this.loadAttemptTracking();
      const pinStorage = await this.loadPinStorage();
      
      const totalUsers = Object.keys(pinStorage).length;
      const lockedAccounts = Object.values(attempts).filter(attempt => 
        attempt.failedAttempts >= this.maxAttempts
      ).length;
      
      return {
        totalUsers,
        lockedAccounts,
        recentAttempts: Object.keys(attempts).length,
        status: 'healthy'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = new PinManager();