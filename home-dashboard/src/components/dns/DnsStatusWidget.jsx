import React, { useState, useEffect, useCallback } from 'react';
import { dns } from '@config';
import { dnsApi } from '@services/api';
import { useWidgetLifecycle } from '../layout/WidgetContainer';
// import { useDnsWebSocket } from '../../hooks/useWebSocket'; // Temporarily disabled
import './DnsStatusWidget.css';

/**
 * Family Internet Safety Widget
 * 
 * Provides a family-friendly view of internet safety and connection status.
 * Shows filtering statistics, connection health, and protection levels in
 * language appropriate for all family members. Parents get detailed metrics
 * while children see simple safety indicators.
 * 
 * @component
 * @param {string} className - Additional CSS classes
 * @param {number} refreshInterval - Status check frequency (default 30s)
 * @param {string} widgetId - Unique widget identifier
 * @param {Function} onRetry - Error recovery callback
 * @returns {JSX.Element} Family internet safety monitoring interface
 */

const DnsStatusWidget = ({ 
  className = '', 
  refreshInterval = dns.refreshInterval,
  widgetId = 'dns-status',
  onRetry = null 
}) => {
  // Reliable widget operation for family dashboard stability
  const { isLoading, error, retryCount, markReady, markError, retry } = useWidgetLifecycle(widgetId);
  
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Family internet safety status tracking
  const [dnsStatus, setDnsStatus] = useState({
    connection: {
      status: 'checking',
      primaryDns: '--',
      secondaryDns: '--',
      location: '--',
      uptime: '--',
      latency: '--'
    },
    resolver: {
      location: '--',
      performance: '--',
      blocked: 0,
      allowed: 0
    },
    health: {
      status: 'unknown',
      responseTime: '--',
      successRate: '--',
      lastCheck: '--'
    },
    metrics: {
      totalQueries: 0,
      blockedQueries: 0,
      allowedQueries: 0,
      topDomains: []
    }
  });

  // Real-time family safety status updates
  const handleStatusUpdate = useCallback((statusData) => {
    setDnsStatus(statusData);
    setData(statusData);
    setLastUpdated(new Date());
  }, []);

  // Real-time safety monitoring (currently using polling for stability)
  // WebSocket connections disabled to ensure reliable family dashboard operation
  // const { connected: wsConnected, connectionQuality, latency, isHealthy } = useDnsWebSocket(handleStatusUpdate, null);
  const wsConnected = false, connectionQuality = 'good', latency = 0, isHealthy = true;

  // Fetch family internet safety status with error handling
  const fetchDnsStatus = useCallback(async () => {
    try {
      const response = await dnsApi.getStatus();
      
      if (response.success) {
        setDnsStatus(response.data);
        setData(response.data);
        setLastUpdated(new Date());
        markReady(); // Family safety monitoring active
      } else {
        throw new Error(response.message || 'Unable to check family internet safety');
      }
    } catch (err) {
      console.error('Family safety status unavailable:', err);
      markError(err); // Alert family that safety monitoring needs attention
      setDnsStatus(prev => ({
        ...prev,
        connection: { ...prev.connection, status: 'error' },
        health: { ...prev.health, status: 'error' }
      }));
    }
  }, [markReady, markError]);

  // Regular family safety status monitoring
  useEffect(() => {
    fetchDnsStatus();
    
    const interval = setInterval(fetchDnsStatus, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchDnsStatus, refreshInterval, retryCount]); // Refresh on family retry requests

  // Handle family requests to retry safety monitoring
  const handleRetry = useCallback(() => {
    retry(); // Restart family safety monitoring
    if (onRetry) onRetry(); // Notify family dashboard
  }, [retry, onRetry]);

  // Get status indicator class
  const getStatusClass = (status) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'status-success';
      case 'degraded':
      case 'warning':
        return 'status-warning';
      case 'error':
      case 'down':
        return 'status-error';
      default:
        return 'status-unknown';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'degraded':
        return 'Degraded';
      case 'error':
        return 'Error';
      case 'down':
        return 'Down';
      case 'healthy':
        return 'Healthy';
      case 'warning':
        return 'Warning';
      default:
        return 'Checking...';
    }
  };

  // Format latency
  const formatLatency = (latency) => {
    if (latency === '--' || latency === null) return '--';
    return `${latency}ms`;
  };

  // Format uptime percentage
  const formatUptime = (uptime) => {
    if (uptime === '--' || uptime === null) return '--';
    return `${uptime}%`;
  };

  // Widget isolation: Let WidgetContainer handle loading state
  // This widget now focuses only on its content
  if (isLoading && !data) {
    return (
      <div className={`dns-status-widget ${className}`}>
        <div className="status-loading">
          <div className="loading-spinner"></div>
          <span>Checking DNS status...</span>
          {retryCount > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              Retry attempt {retryCount}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`widget-card ${className}`}>
      <div className="widget-header">
        <h3 className="widget-title">Internet Status</h3>
        <div className={`status-display ${getStatusClass(dnsStatus.connection?.status || 'checking')}`}>
          <span>{getStatusText(dnsStatus.connection?.status || 'checking')}</span>
        </div>
      </div>
      
      <div className="widget-content">
        {/* Connection Quality */}
        <div className="mb-6">
          <h4 className="metric-label mb-3">Connection Quality</h4>
          <div className="space-y-1">
            <div className="metric-row">
              <span className="metric-label">Internet Speed</span>
              <span className="metric-value">
                {formatLatency(dnsStatus.connection?.latency || '--')}
                <span className="metric-unit">{(dnsStatus.connection?.latency || 0) < 50 ? 'Fast' : (dnsStatus.connection?.latency || 0) < 100 ? 'Good' : 'Slow'}</span>
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Connection Stability</span>
              <span className="metric-value">
                {formatUptime(dnsStatus.health?.successRate || '--')}
                <span className="trend-indicator trend-up">↗</span>
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Protection Status</span>
              <span className="metric-value" style={{color: `var(--status-${dnsStatus.protection?.color || 'error'})`}}>
                {dnsStatus.protection?.message || 'Checking'}
                <span className="metric-unit">{dnsStatus.protection?.level === 'excellent' ? 'secure' : dnsStatus.protection?.level === 'partial' ? 'partial' : 'inactive'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Safety Report */}
        <div className="mb-6">
          <h4 className="metric-label mb-3">Safety Report (Today)</h4>
          <div className="space-y-1">
            <div className="metric-row">
              <span className="metric-label">Sites Visited</span>
              <span className="metric-value">
                {(dnsStatus.resolver?.blocked || 0) + (dnsStatus.resolver?.allowed || 0)}
                <span className="metric-unit">total</span>
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Harmful Content Blocked</span>
              <span className="metric-value" style={{color: 'var(--status-error)'}}>
                {dnsStatus.resolver?.blocked || '0'}
                <span className="metric-unit">protected</span>
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Safe Sites Allowed</span>
              <span className="metric-value" style={{color: 'var(--status-success)'}}>
                {dnsStatus.resolver?.allowed || '0'}
                <span className="metric-unit">verified</span>
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Protection Level</span>
              <span className="metric-value">
                {Math.round(((dnsStatus.resolver?.blocked || 0) / Math.max((dnsStatus.resolver?.blocked || 0) + (dnsStatus.resolver?.allowed || 0), 1)) * 100)}%
                <span className="metric-unit">effective</span>
              </span>
            </div>
          </div>
        </div>

        {/* Connection Information */}
        <div className="mb-4">
          <h4 className="metric-label mb-3">Connection Information</h4>
          <div className="space-y-1">
            <div className="metric-row">
              <span className="metric-label">Protection Server</span>
              <span className="metric-value">{dnsStatus.resolver?.location || 'Global Network'}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Service Reliability</span>
              <span className="metric-value">
                {formatUptime(dnsStatus.connection?.uptime || '--')}
                <span className="trend-indicator trend-stable">→</span>
              </span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Control D Status</span>
              <span className="metric-value" style={{color: `var(--status-${dnsStatus.protection?.color || 'error'})`}}>
                {dnsStatus.connection?.isControlD && dnsStatus.resolver?.isControlDResolver ? 'Fully Active' :
                 dnsStatus.connection?.isControlD ? 'Connected (Wrong DNS)' :
                 dnsStatus.resolver?.isControlDResolver ? 'DNS Only' : 'Not Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Control D Recommendations */}
        {dnsStatus.protection?.recommendations && dnsStatus.protection.recommendations.length > 0 && dnsStatus.protection.status !== 'fully-protected' && (
          <div className="mb-4">
            <h4 className="metric-label mb-3" style={{color: `var(--status-${dnsStatus.protection.color || 'warning'})`}}>
              {dnsStatus.protection.status === 'connected-wrong-resolver' ? 'DNS Configuration Issue' :
               dnsStatus.protection.status === 'resolver-only' ? 'Connection Notice' :
               'Setup Required'}
            </h4>
            <div className="space-y-1">
              {dnsStatus.protection.recommendations.map((recommendation, index) => (
                <div key={index} className="metric-row" style={{borderBottom: 'none', padding: '0.5rem 0'}}>
                  <div style={{display: 'flex', alignItems: 'flex-start', gap: '0.5rem'}}>
                    <span style={{color: `var(--status-${dnsStatus.protection.color || 'warning'})`, minWidth: '16px'}}>•</span>
                    <span className="metric-label" style={{fontSize: '0.8rem', lineHeight: '1.4', margin: 0}}>
                      {recommendation}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display with Apple Home styling */}
        {error && (
          <div className="metric-row status-error" style={{marginTop: '1rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <span style={{color: 'var(--status-error)'}}>⚠</span>
              <div>
                <div className="metric-value" style={{color: 'var(--status-error)', fontSize: '0.9rem'}}>
                  Connection Error
                </div>
                <div className="metric-label" style={{margin: 0, fontSize: '0.8rem'}}>
                  {error.message || error}
                  {retryCount > 0 && ` (Attempt ${retryCount})`}
                </div>
              </div>
            </div>
            <button 
              className="btn-secondary"
              onClick={handleRetry}
              disabled={isLoading}
              style={{minHeight: 'var(--touch-target-sm)'}}
            >
              Retry
            </button>
          </div>
        )}

        {/* Last Updated with Technical Timestamp */}
        {lastUpdated && (
          <div className="metric-row" style={{borderTop: '1px solid var(--border-secondary)', paddingTop: '0.75rem', marginTop: '1rem'}}>
            <span className="metric-label">Last Updated</span>
            <span className="metric-value">
              {lastUpdated.toLocaleTimeString()}
              {wsConnected && (
                <span className="metric-unit">
                  live • {latency > 0 ? `${latency}ms` : 'connected'}
                  {!isHealthy && ' ⚠'}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DnsStatusWidget;