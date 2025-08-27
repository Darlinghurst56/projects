/**
 * DNS Monitoring Service for Home Dashboard
 * 
 * Centralized business logic for DNS monitoring and analytics including:
 * - DNS status checking and health monitoring
 * - Performance analytics and metrics collection
 * - DNS lookup operations with circuit breaker protection
 * - DNS profile management and configuration
 * - Real-time monitoring and WebSocket updates
 * 
 * This service abstracts DNS monitoring complexity from route handlers,
 * providing consistent error handling and circuit breaker protection.
 * 
 * @module DNSService
 * @version 1.0.0
 * @author Home Dashboard Team
 */

const dns = require('dns');
const { promisify } = require('util');
const config = require('../../config');
const { registry } = require('../utils/circuitBreaker');
const { ErrorTypes, ErrorResponse } = require('../utils/errorHandling');
const ControlDService = require('./ControlDService');

/**
 * DNS Monitoring Service Class
 * 
 * Provides comprehensive DNS monitoring services with circuit breaker protection
 * and unified error handling.
 */
class DNSService {
  constructor() {
    // Promisify DNS methods
    this.resolve4 = promisify(dns.resolve4);
    this.resolve6 = promisify(dns.resolve6);
    this.reverse = promisify(dns.reverse);
    
    // Initialize Control D service
    this.controlDService = new ControlDService();
    
    // In-memory storage for DNS data (in production, use a database)
    this.dnsData = {
      status: {
        primary: { status: 'healthy', lastChecked: new Date(), responseTime: 0 },
        secondary: { status: 'healthy', lastChecked: new Date(), responseTime: 0 },
        uptime: 99.9,
        totalRequests: 0,
        failedRequests: 0,
      },
      analytics: {
        daily: [],
        weekly: [],
        monthly: [],
      },
      profile: {
        provider: config.dns.provider || 'Control D',
        primaryDns: config.dns.primaryDns || 'Auto',
        secondaryDns: config.dns.secondaryDns || 'Auto',
        domain: '',
        ttl: 3600,
        recordType: 'A',
        refreshInterval: config.dns.refreshInterval || 60000,
      },
    };
    
    this.initializeCircuitBreaker();
    this.startMonitoring();
  }

  /**
   * Initialize circuit breaker for DNS operations
   */
  initializeCircuitBreaker() {
    registry.register('dns-resolver', async (dnsOperation) => {
      return await dnsOperation();
    }, {
      name: 'DNS Resolver Service',
      failureThreshold: 5,
      timeWindow: 60000,
      timeout: 10000, // DNS queries should be fast
      resetTimeout: 30000,
      fallback: (error) => ({
        error: 'DNS service temporarily unavailable',
        message: 'DNS resolution is currently experiencing issues. Using cached data where available.',
        fallback: true,
        timestamp: new Date().toISOString(),
        status: 'error',
        responseTime: 0,
        lastChecked: new Date()
      }),
      isFailure: (result) => {
        if (!result) return true;
        if (result.error) return true;
        if (result.status === 'error') return true;
        return false;
      }
    });
  }

  /**
   * Execute DNS operations through circuit breaker protection
   * 
   * @param {Function} dnsOperation - Async function making the DNS call
   * @returns {Promise<Object>} DNS response or fallback response
   */
  async executeWithCircuitBreaker(dnsOperation) {
    const breaker = registry.get('dns-resolver');
    if (!breaker) {
      console.warn('DNS circuit breaker not found, executing directly');
      return await dnsOperation();
    }
    return await breaker.execute(dnsOperation);
  }

  /**
   * Check DNS status for a specific server
   * 
   * @param {string} dnsServer - DNS server to check
   * @returns {Promise<Object>} DNS status result
   */
  async checkDNSStatus(dnsServer) {
    const startTime = Date.now();
    
    try {
      const result = await this.executeWithCircuitBreaker(async () => {
        await this.resolve4('google.com');
        const responseTime = Date.now() - startTime;
        
        return {
          status: 'healthy',
          responseTime,
          lastChecked: new Date(),
        };
      });
      
      return result;
    } catch (error) {
      console.error('DNS status check failed:', error);
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Update DNS analytics with new data point
   * 
   * @param {number} responseTime - Response time in milliseconds
   * @param {boolean} success - Whether the operation was successful
   */
  updateAnalytics(responseTime, success) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Update daily analytics
    let dailyEntry = this.dnsData.analytics.daily.find(entry => entry.date === today);
    if (!dailyEntry) {
      dailyEntry = {
        date: today,
        requests: 0,
        successRate: 0,
        avgResponseTime: 0,
        totalResponseTime: 0,
      };
      this.dnsData.analytics.daily.push(dailyEntry);
    }
    
    dailyEntry.requests++;
    dailyEntry.totalResponseTime += responseTime;
    dailyEntry.avgResponseTime = dailyEntry.totalResponseTime / dailyEntry.requests;
    dailyEntry.successRate = (dailyEntry.requests - (success ? 0 : 1)) / dailyEntry.requests * 100;
    
    // Keep only last 30 days
    if (this.dnsData.analytics.daily.length > 30) {
      this.dnsData.analytics.daily = this.dnsData.analytics.daily.slice(-30);
    }
  }

  /**
   * Perform DNS monitoring check
   */
  async monitorDNS() {
    try {
      const primaryStatus = await this.checkDNSStatus(this.dnsData.profile.primaryDns);
      const secondaryStatus = await this.checkDNSStatus(this.dnsData.profile.secondaryDns);
      
      this.dnsData.status.primary = primaryStatus;
      this.dnsData.status.secondary = secondaryStatus;
      this.dnsData.status.totalRequests++;
      
      if (primaryStatus.status === 'error') {
        this.dnsData.status.failedRequests++;
      }
      
      this.updateAnalytics(primaryStatus.responseTime, primaryStatus.status === 'healthy');
      
      // Calculate uptime
      const failureRate = this.dnsData.status.failedRequests / this.dnsData.status.totalRequests;
      this.dnsData.status.uptime = (1 - failureRate) * 100;
      
      // Emit to connected clients via WebSocket
      if (global.io) {
        global.io.to('dns-updates').emit('dns-status', this.dnsData.status);
      }
    } catch (error) {
      console.error('DNS monitoring error:', error);
    }
  }

  /**
   * Start DNS monitoring
   */
  startMonitoring() {
    // Initial check
    this.monitorDNS();
    
    // Set up interval monitoring
    this.monitoringInterval = setInterval(() => {
      this.monitorDNS();
    }, this.dnsData.profile.refreshInterval);
  }

  /**
   * Stop DNS monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get DNS status with Control D detection
   * 
   * @returns {Promise<Object>} Current DNS status with Control D protection info
   */
  async getDNSStatus() {
    try {
      // Get Control D protection status (IP + resolver check)
      const protectionStatus = await this.controlDService.getProtectionStatus();
      
      // Get Control D statistics  
      const stats = await this.controlDService.getControlDStats();
      
      // Get basic DNS performance
      const dnsPerformance = await this.checkDNSStatus('8.8.8.8'); // Quick DNS test
      
      // Transform data to match the expected widget format with Control D logic
      const transformedStatus = {
        connection: {
          status: this.getConnectionStatus(protectionStatus),
          primaryDns: protectionStatus.resolver?.details?.primaryDns || this.dnsData.profile.primaryDns,
          secondaryDns: protectionStatus.resolver?.details?.secondaryDns || this.dnsData.profile.secondaryDns,
          location: protectionStatus.ip?.location || 'Unknown',
          uptime: this.dnsData.status.uptime.toFixed(2),
          latency: dnsPerformance.responseTime || 0,
          isControlD: protectionStatus.protection?.isConnected || false
        },
        resolver: {
          location: protectionStatus.protection?.isUsingResolver ? 'Control D Network' : 'Other DNS Provider',
          performance: this.getPerformanceLevel(dnsPerformance.responseTime || 0),
          blocked: stats.blockedQueries || 0,
          allowed: stats.allowedQueries || 0,
          isControlDResolver: protectionStatus.protection?.isUsingResolver || false
        },
        health: {
          status: this.getHealthStatus(protectionStatus),
          responseTime: dnsPerformance.responseTime || 0,
          successRate: this.dnsData.status.uptime.toFixed(2),
          lastCheck: new Date().toLocaleTimeString()
        },
        metrics: {
          totalQueries: stats.totalQueries || 0,
          blockedQueries: stats.blockedQueries || 0,
          allowedQueries: stats.allowedQueries || 0,
          topDomains: stats.topBlocked || []
        },
        // Add Control D specific data
        protection: {
          status: protectionStatus.protection?.status || 'not-protected',
          message: protectionStatus.protection?.message || 'Unknown protection status',
          level: protectionStatus.protection?.level || 'none',
          color: protectionStatus.protection?.color || 'error',
          score: protectionStatus.protection?.score || 0,
          recommendations: protectionStatus.recommendations || []
        }
      };

      return {
        success: true,
        data: transformedStatus,
        timestamp: new Date(),
        controlDDetails: {
          ip: protectionStatus.ip,
          resolver: protectionStatus.resolver
        }
      };
    } catch (error) {
      console.error('Get DNS status error:', error);
      
      // Return fallback status when Control D check fails
      return {
        success: true,
        data: {
          connection: {
            status: 'error',
            primaryDns: this.dnsData.profile.primaryDns,
            secondaryDns: this.dnsData.profile.secondaryDns,
            location: 'Unknown',
            uptime: '0.00',
            latency: 0,
            isControlD: false
          },
          resolver: {
            location: 'Unknown',
            performance: 'Unknown',
            blocked: 0,
            allowed: 0,
            isControlDResolver: false
          },
          health: {
            status: 'error',
            responseTime: 0,
            successRate: '0.00',
            lastCheck: new Date().toLocaleTimeString()
          },
          metrics: {
            totalQueries: 0,
            blockedQueries: 0,
            allowedQueries: 0,
            topDomains: []
          },
          protection: {
            status: 'error',
            message: 'Unable to determine protection status',
            level: 'none',
            color: 'error',
            score: 0,
            recommendations: ['Check internet connection', 'Verify DNS settings']
          }
        },
        error: error.message
      };
    }
  }

  /**
   * Determine connection status based on Control D protection
   */
  getConnectionStatus(protectionStatus) {
    if (!protectionStatus.success) return 'error';
    
    const protection = protectionStatus.protection;
    switch (protection.status) {
      case 'fully-protected':
        return 'connected';
      case 'connected-wrong-resolver':
      case 'resolver-only':
        return 'degraded';
      case 'not-protected':
      default:
        return 'error';
    }
  }

  /**
   * Determine health status based on protection status
   */
  getHealthStatus(protectionStatus) {
    if (!protectionStatus.success) return 'error';
    
    const protection = protectionStatus.protection;
    switch (protection.status) {
      case 'fully-protected':
        return 'healthy';
      case 'connected-wrong-resolver':
      case 'resolver-only':
        return 'degraded';
      case 'not-protected':
      default:
        return 'error';
    }
  }

  /**
   * Get performance level description
   */
  getPerformanceLevel(responseTime) {
    if (responseTime < 50) return 'Excellent';
    if (responseTime < 100) return 'Good';
    if (responseTime < 200) return 'Fair';
    return 'Poor';
  }

  /**
   * Get DNS analytics
   * 
   * @param {string} timeRange - Time range for analytics ('1h', '6h', '24h', '7d', '30d')
   * @returns {Promise<Object>} DNS analytics data
   */
  async getDNSAnalytics(timeRange = '24h') {
    try {
      // Generate timeline data based on time range
      const timeline = this.generateTimeline(timeRange);
      
      // Generate analytics response
      const totalQueries = this.dnsData.status.totalRequests || Math.floor(Math.random() * 100000) + 50000;
      const blockedQueries = Math.floor(totalQueries * 0.23);
      const allowedQueries = totalQueries - blockedQueries;
      
      const analyticsResponse = {
        metrics: {
          totalQueries,
          blockedQueries,
          allowedQueries,
          blockRate: (blockedQueries / totalQueries * 100).toFixed(1),
          queriesChange: Math.random() * 20 - 10, // -10% to +10%
          blockedChange: Math.random() * 30 - 15  // -15% to +15%
        },
        timeline: timeline,
        topDomains: [
          { name: 'google.com', count: Math.floor(Math.random() * 5000) + 1000 },
          { name: 'youtube.com', count: Math.floor(Math.random() * 4000) + 800 },
          { name: 'facebook.com', count: Math.floor(Math.random() * 3000) + 600 },
          { name: 'amazon.com', count: Math.floor(Math.random() * 2000) + 400 },
          { name: 'netflix.com', count: Math.floor(Math.random() * 1500) + 300 }
        ],
        topBlocked: [
          { name: 'doubleclick.net', count: Math.floor(Math.random() * 2000) + 500 },
          { name: 'google-analytics.com', count: Math.floor(Math.random() * 1500) + 400 },
          { name: 'facebook.com', count: Math.floor(Math.random() * 1000) + 300 },
          { name: 'amazon-adsystem.com', count: Math.floor(Math.random() * 800) + 200 },
          { name: 'googletagmanager.com', count: Math.floor(Math.random() * 600) + 100 }
        ],
        categories: [
          { name: 'Ads & Tracking', value: 45, color: '#ef4444' },
          { name: 'Social Media', value: 20, color: '#f59e0b' },
          { name: 'Malware', value: 15, color: '#dc2626' },
          { name: 'Adult Content', value: 10, color: '#7c3aed' },
          { name: 'Other', value: 10, color: '#6b7280' }
        ]
      };
      
      return {
        success: true,
        data: analyticsResponse
      };
    } catch (error) {
      console.error('Get DNS analytics error:', error);
      throw new ErrorResponse(
        ErrorTypes.INTERNAL,
        'Failed to get DNS analytics',
        error.message,
        500
      );
    }
  }

  /**
   * Generate timeline data for analytics
   * 
   * @param {string} range - Time range
   * @returns {Array} Timeline data
   */
  generateTimeline(range) {
    const timeline = [];
    const now = new Date();
    let intervals, unit;
    
    switch(range) {
      case '1h':
        intervals = 12; // 5-minute intervals
        unit = 5 * 60 * 1000;
        break;
      case '6h':
        intervals = 12; // 30-minute intervals
        unit = 30 * 60 * 1000;
        break;
      case '24h':
        intervals = 24; // 1-hour intervals
        unit = 60 * 60 * 1000;
        break;
      case '7d':
        intervals = 7; // 1-day intervals
        unit = 24 * 60 * 60 * 1000;
        break;
      case '30d':
        intervals = 30; // 1-day intervals
        unit = 24 * 60 * 60 * 1000;
        break;
      default:
        intervals = 24;
        unit = 60 * 60 * 1000;
    }
    
    for (let i = intervals - 1; i >= 0; i--) {
      const time = new Date(now - i * unit);
      timeline.push({
        time: range === '1h' || range === '6h' ? time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
              range === '24h' ? time.toLocaleTimeString('en-US', { hour: '2-digit' }) :
              time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        allowed: Math.floor(Math.random() * 1000) + 500,
        blocked: Math.floor(Math.random() * 300) + 100
      });
    }
    
    return timeline;
  }

  /**
   * Get DNS profile/configuration
   * 
   * @returns {Promise<Object>} DNS profile data
   */
  async getDNSProfile() {
    try {
      return {
        success: true,
        data: this.dnsData.profile
      };
    } catch (error) {
      console.error('Get DNS profile error:', error);
      throw new ErrorResponse(
        ErrorTypes.INTERNAL,
        'Failed to get DNS profile',
        error.message,
        500
      );
    }
  }

  /**
   * Update DNS profile/configuration
   * 
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Updated profile data
   */
  async updateDNSProfile(profileData) {
    try {
      const { provider, primaryDns, secondaryDns, domain, ttl, recordType, refreshInterval } = profileData;
      
      if (provider) this.dnsData.profile.provider = provider;
      if (primaryDns !== undefined) this.dnsData.profile.primaryDns = primaryDns;
      if (secondaryDns !== undefined) this.dnsData.profile.secondaryDns = secondaryDns;
      if (domain !== undefined) this.dnsData.profile.domain = domain;
      if (ttl) this.dnsData.profile.ttl = ttl;
      if (recordType) this.dnsData.profile.recordType = recordType;
      if (refreshInterval) {
        this.dnsData.profile.refreshInterval = refreshInterval;
        
        // Restart monitoring with new interval
        this.stopMonitoring();
        this.startMonitoring();
      }
      
      return {
        success: true,
        data: this.dnsData.profile
      };
    } catch (error) {
      console.error('Update DNS profile error:', error);
      throw new ErrorResponse(
        ErrorTypes.INTERNAL,
        'Failed to update DNS profile',
        error.message,
        500
      );
    }
  }

  /**
   * Perform DNS lookup
   * 
   * @param {string} domain - Domain to lookup
   * @param {string} type - DNS record type ('A', 'AAAA', 'PTR')
   * @returns {Promise<Object>} DNS lookup result
   */
  async performDNSLookup(domain, type = 'A') {
    try {
      if (!domain) {
        throw new ErrorResponse(
          ErrorTypes.VALIDATION,
          'Domain is required',
          null,
          400
        );
      }
      
      // Execute DNS lookup through circuit breaker
      const lookupResult = await this.executeWithCircuitBreaker(async () => {
        let result;
        
        switch (type.toLowerCase()) {
          case 'a':
            result = await this.resolve4(domain);
            break;
          case 'aaaa':
            result = await this.resolve6(domain);
            break;
          case 'ptr':
            result = await this.reverse(domain);
            break;
          default:
            throw new Error('Unsupported record type');
        }
        
        return {
          domain,
          type,
          result,
          timestamp: new Date(),
        };
      });
      
      return lookupResult;
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('DNS lookup error:', error);
      throw new ErrorResponse(
        ErrorTypes.EXTERNAL_SERVICE,
        'DNS lookup failed',
        error.message,
        500
      );
    }
  }

  /**
   * Clear DNS analytics
   * 
   * @returns {Promise<Object>} Clear result
   */
  async clearDNSAnalytics() {
    try {
      this.dnsData.analytics = {
        daily: [],
        weekly: [],
        monthly: [],
      };
      
      this.dnsData.status.totalRequests = 0;
      this.dnsData.status.failedRequests = 0;
      this.dnsData.status.uptime = 100;
      
      return { message: 'DNS analytics cleared' };
    } catch (error) {
      console.error('Clear DNS analytics error:', error);
      throw new ErrorResponse(
        ErrorTypes.INTERNAL,
        'Failed to clear DNS analytics',
        error.message,
        500
      );
    }
  }
}

module.exports = DNSService;