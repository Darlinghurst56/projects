#!/usr/bin/env node
/**
 * DNS Log Collector for Control D Monitoring
 * Adapts router log collector pattern for DNS log analysis
 * Processes Control D logs into structured JSON format with device enrichment
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class DNSLogCollector {
  constructor() {
    this.config = {
      logFile: process.env.CTRLD_LOG_FILE || '/mnt/c/ctrld.log',
      deviceMapFile: process.env.DEVICE_MAP_FILE || './device-map.json',
      pollInterval: parseInt(process.env.DNS_POLL_INTERVAL_MINUTES) || 2, // 2 minutes default
      logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS) || 30,
      maxRetries: 3,
      circuitBreakerThreshold: 5,
      circuitBreakerCooldown: 300000, // 5 minute cooldown
    };
    
    this.isRunning = false;
    this.logStorage = path.join(__dirname, 'dns_logs');
    this.currentSessionFile = path.join(this.logStorage, 'current_dns_session.json');
    
    this.collectionsCount = 0;
    this.lastProcessedPosition = 0;
    this.deviceMap = {};
    
    // Circuit breaker state
    this.circuitBreaker = {
      isOpen: false,
      consecutiveFailures: 0,
      lastFailureTime: null,
      tripTime: null,
    };
    
    // Exponential backoff state
    this.backoff = {
      baseDelay: 1000,
      maxDelay: 60000,
      currentDelay: 1000,
      multiplier: 2,
    };

    this.sessionData = {
      startTime: new Date().toISOString(),
      totalQueries: 0,
      uniqueDevices: new Set(),
      topDomains: {},
      queryTypes: {},
      collections: 0,
      lastCollection: null,
      errors: [],
    };
  }

  async initialize() {
    try {
      // Create log storage directory
      await fs.mkdir(this.logStorage, { recursive: true });
      
      // Load device mapping
      await this.loadDeviceMap();
      
      // Load or create session data
      await this.loadSessionData();
      
      console.log(`[${new Date().toISOString()}] DNS Log Collector initialized`);
      console.log(`Log file: ${this.config.logFile}`);
      console.log(`Device map: ${this.config.deviceMapFile}`);
      console.log(`Poll interval: ${this.config.pollInterval} minutes`);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize DNS Log Collector:', error);
      return false;
    }
  }

  async loadDeviceMap() {
    try {
      const data = await fs.readFile(this.config.deviceMapFile, 'utf8');
      const deviceMapData = JSON.parse(data);
      
      // Convert device map to lookup format
      this.deviceMap = deviceMapData.devices || {};
      console.log(`Loaded device map with ${Object.keys(this.deviceMap).length} devices`);
    } catch (error) {
      console.warn('Could not load device map, using empty mapping:', error.message);
      this.deviceMap = {};
    }
  }

  async loadSessionData() {
    try {
      const data = await fs.readFile(this.currentSessionFile, 'utf8');
      const sessionData = JSON.parse(data);
      
      this.sessionData = {
        ...this.sessionData,
        ...sessionData,
        uniqueDevices: new Set(sessionData.uniqueDevices || []),
      };
      
      this.collectionsCount = sessionData.collections || 0;
      this.lastProcessedPosition = sessionData.lastProcessedPosition || 0;
      
      console.log(`Resumed session from collection #${this.collectionsCount}`);
    } catch (error) {
      console.log('Starting new session');
    }
  }

  async saveSessionData() {
    const sessionToSave = {
      ...this.sessionData,
      uniqueDevices: Array.from(this.sessionData.uniqueDevices),
      lastProcessedPosition: this.lastProcessedPosition,
    };

    try {
      await fs.writeFile(this.currentSessionFile, JSON.stringify(sessionToSave, null, 2));
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  enrichDeviceInfo(ip) {
    const device = this.deviceMap[ip];
    if (device) {
      return {
        name: device.name,
        type: device.type,
        category: device.category,
        confirmed: device.confirmed || false,
      };
    }
    
    return {
      name: `Unknown-${ip.split('.').pop()}`,
      type: 'Unknown',
      category: 'Unknown',
      confirmed: false,
    };
  }

  parseDNSLogEntry(logLine) {
    try {
      const logEntry = JSON.parse(logLine.trim());
      
      if (!logEntry.message || !logEntry.message.includes('QUERY')) {
        return null;
      }

      // Extract query information using regex
      const message = logEntry.message;
      const queryMatch = message.match(/(\d+\.\d+\.\d+\.\d+):\d+ \([^)]+\) -> listener\.\d+: (\w+) (.+)/);
      
      if (!queryMatch) {
        return null;
      }

      const clientIP = queryMatch[1];
      const queryType = queryMatch[2];
      const domain = queryMatch[3];
      
      // Enrich with device information
      const deviceInfo = this.enrichDeviceInfo(clientIP);
      
      return {
        timestamp: logEntry.time,
        level: logEntry.level,
        client_ip: clientIP,
        query_type: queryType,
        domain: domain,
        device: deviceInfo,
        raw_message: message,
      };
    } catch (error) {
      return null;
    }
  }

  async collectNewEntries() {
    try {
      // Read log file from last processed position
      const logContent = await fs.readFile(this.config.logFile, 'utf8');
      const newContent = logContent.slice(this.lastProcessedPosition);
      
      if (newContent.length === 0) {
        console.log(`[${new Date().toISOString()}] No new DNS entries to process`);
        return [];
      }

      const lines = newContent.split('\n').filter(line => line.trim());
      const processedEntries = [];
      
      for (const line of lines) {
        const entry = this.parseDNSLogEntry(line);
        if (entry) {
          processedEntries.push(entry);
          
          // Update session statistics
          this.sessionData.totalQueries++;
          this.sessionData.uniqueDevices.add(entry.client_ip);
          
          // Track domains and query types
          this.sessionData.topDomains[entry.domain] = (this.sessionData.topDomains[entry.domain] || 0) + 1;
          this.sessionData.queryTypes[entry.query_type] = (this.sessionData.queryTypes[entry.query_type] || 0) + 1;
        }
      }
      
      // Update processed position
      this.lastProcessedPosition = logContent.length;
      
      console.log(`[${new Date().toISOString()}] Processed ${processedEntries.length} new DNS queries`);
      return processedEntries;
      
    } catch (error) {
      console.error('Error collecting DNS entries:', error);
      throw error;
    }
  }

  async saveDNSEntries(entries) {
    if (entries.length === 0) {
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyLogFile = path.join(this.logStorage, `dns-logs-${today}.jsonl`);
    
    try {
      const logLines = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      await fs.appendFile(dailyLogFile, logLines);
      
      console.log(`Saved ${entries.length} DNS entries to ${dailyLogFile}`);
    } catch (error) {
      console.error('Error saving DNS entries:', error);
      throw error;
    }
  }

  async generateSummary() {
    const summary = {
      generated: new Date().toISOString(),
      session: {
        startTime: this.sessionData.startTime,
        collections: this.collectionsCount,
        totalQueries: this.sessionData.totalQueries,
        uniqueDevices: this.sessionData.uniqueDevices.size,
      },
      topDevices: {},
      topDomains: Object.entries(this.sessionData.topDomains)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .reduce((obj, [domain, count]) => {
          obj[domain] = count;
          return obj;
        }, {}),
      queryTypeDistribution: this.sessionData.queryTypes,
    };

    // Calculate top devices by query count
    for (const ip of this.sessionData.uniqueDevices) {
      const deviceInfo = this.enrichDeviceInfo(ip);
      summary.topDevices[ip] = deviceInfo;
    }

    const today = new Date().toISOString().split('T')[0];
    const summaryFile = path.join(this.logStorage, `summary-${today}.json`);
    
    try {
      await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
      console.log(`Generated summary: ${summaryFile}`);
    } catch (error) {
      console.error('Error saving summary:', error);
    }
  }

  async performCollection() {
    try {
      console.log(`[${new Date().toISOString()}] Starting DNS collection #${this.collectionsCount + 1}`);
      
      // Reload device map to pick up changes
      await this.loadDeviceMap();
      
      // Collect new DNS entries
      const entries = await this.collectNewEntries();
      
      // Save entries to daily log
      await this.saveDNSEntries(entries);
      
      // Update session data
      this.collectionsCount++;
      this.sessionData.collections = this.collectionsCount;
      this.sessionData.lastCollection = new Date().toISOString();
      
      // Save session data
      await this.saveSessionData();
      
      // Generate summary every 30 collections (1 hour with 2-minute intervals)
      if (this.collectionsCount % 30 === 0) {
        await this.generateSummary();
      }
      
      // Reset circuit breaker on success
      this.circuitBreaker.consecutiveFailures = 0;
      this.circuitBreaker.isOpen = false;
      this.backoff.currentDelay = this.backoff.baseDelay;
      
      console.log(`[${new Date().toISOString()}] Collection #${this.collectionsCount} completed successfully`);
      
    } catch (error) {
      this.handleCollectionError(error);
    }
  }

  handleCollectionError(error) {
    this.circuitBreaker.consecutiveFailures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    console.error(`Collection failed (attempt ${this.circuitBreaker.consecutiveFailures}):`, error.message);
    
    // Add error to session data
    this.sessionData.errors.push({
      timestamp: new Date().toISOString(),
      error: error.message,
      collection: this.collectionsCount,
    });
    
    // Trip circuit breaker if threshold exceeded
    if (this.circuitBreaker.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      this.circuitBreaker.isOpen = true;
      this.circuitBreaker.tripTime = Date.now();
      console.error(`Circuit breaker tripped after ${this.circuitBreaker.consecutiveFailures} failures`);
    }
    
    // Apply exponential backoff
    this.backoff.currentDelay = Math.min(
      this.backoff.currentDelay * this.backoff.multiplier,
      this.backoff.maxDelay
    );
  }

  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logStorage);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.logRetentionDays);
      
      for (const file of files) {
        if (file.startsWith('dns-logs-') || file.startsWith('summary-')) {
          const filePath = path.join(this.logStorage, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            console.log(`Cleaned up old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error during log cleanup:', error);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('DNS Log Collector is already running');
      return;
    }

    const initialized = await this.initialize();
    if (!initialized) {
      console.error('Failed to initialize DNS Log Collector');
      return;
    }

    this.isRunning = true;
    console.log(`[${new Date().toISOString()}] DNS Log Collector started`);
    
    // Perform initial collection
    await this.performCollection();
    
    // Set up polling interval
    const pollIntervalMs = this.config.pollInterval * 60 * 1000;
    
    const pollFunction = async () => {
      if (!this.isRunning) return;
      
      // Check circuit breaker
      if (this.circuitBreaker.isOpen) {
        const cooldownExpired = Date.now() - this.circuitBreaker.tripTime > this.config.circuitBreakerCooldown;
        if (cooldownExpired) {
          console.log('Circuit breaker cooldown expired, attempting reset');
          this.circuitBreaker.isOpen = false;
          this.circuitBreaker.consecutiveFailures = 0;
        } else {
          console.log('Circuit breaker is open, skipping collection');
          setTimeout(pollFunction, this.backoff.currentDelay);
          return;
        }
      }
      
      await this.performCollection();
      
      // Schedule next collection
      const delay = this.circuitBreaker.isOpen ? this.backoff.currentDelay : pollIntervalMs;
      setTimeout(pollFunction, delay);
    };
    
    // Schedule next collection
    setTimeout(pollFunction, pollIntervalMs);
    
    // Clean up old logs daily
    setInterval(() => {
      this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000);
  }

  async stop() {
    console.log(`[${new Date().toISOString()}] Stopping DNS Log Collector...`);
    this.isRunning = false;
    await this.saveSessionData();
    await this.generateSummary();
    console.log('DNS Log Collector stopped');
  }
}

// CLI handling
async function main() {
  const collector = new DNSLogCollector();
  
  const args = process.argv.slice(2);
  if (args.includes('--once')) {
    console.log('Running single collection...');
    const initialized = await collector.initialize();
    if (initialized) {
      await collector.performCollection();
      await collector.generateSummary();
    }
    process.exit(0);
  }
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await collector.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await collector.stop();
    process.exit(0);
  });
  
  // Start continuous collection
  await collector.start();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = DNSLogCollector;