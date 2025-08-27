// API Health Monitoring Dashboard Component
// PROJECT: House AI - Family Home Page | SUBPROJECT: Unified Dashboard System

import React, { useState, useEffect, useCallback } from 'react';
import { 
  systemApi, 
  dnsApi, 
  googleApi, 
  aiApi, 
  authApi, 
  mealApi 
} from '../services/api';

const ApiHealthMonitor = ({ className = "", widgetId = 'api-health' }) => {
  const [healthStatus, setHealthStatus] = useState({
    system: { status: 'checking', latency: null, error: null },
    dns: { status: 'checking', latency: null, error: null },
    google: { status: 'checking', latency: null, error: null },
    ai: { status: 'checking', latency: null, error: null },
    auth: { status: 'checking', latency: null, error: null },
    meals: { status: 'checking', latency: null, error: null },
  });

  const [overallHealth, setOverallHealth] = useState({
    status: 'checking',
    healthyServices: 0,
    totalServices: 6,
    lastCheck: null
  });

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Test individual API endpoint with timing
  const testEndpoint = async (name, testFunction) => {
    const startTime = Date.now();
    try {
      const response = await testFunction();
      const latency = Date.now() - startTime;
      
      if (response.success !== false) {
        return {
          status: 'healthy',
          latency,
          error: null,
          details: response.data || response
        };
      } else {
        return {
          status: 'error',
          latency,
          error: response.message || 'API request failed',
          details: null
        };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        status: 'error',
        latency,
        error: error.message || 'Network error',
        details: null
      };
    }
  };

  // Comprehensive API health check
  const checkApiHealth = useCallback(async () => {
    console.log('🔍 Running comprehensive API health check...');

    const tests = {
      system: () => systemApi.getStatus(),
      dns: () => dnsApi.getStatus(),
      ai: () => aiApi.getStatus(),
      meals: () => mealApi.getCurrentPlan(),
      // Auth and Google require special handling due to authentication requirements
      auth: () => fetch('/api/auth/validate', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).then(res => ({ status: res.status, success: res.ok })),
      google: () => fetch('/api/google/auth-status', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).then(res => ({ 
        status: res.status, 
        success: res.status === 401 || res.ok // 401 is expected without auth
      }))
    };

    const results = {};
    
    // Run all tests concurrently for efficiency
    const testPromises = Object.entries(tests).map(async ([serviceName, testFn]) => {
      const result = await testEndpoint(serviceName, testFn);
      results[serviceName] = result;
      return { serviceName, result };
    });

    try {
      await Promise.all(testPromises);
      
      // Calculate overall health
      const healthyCount = Object.values(results).filter(r => r.status === 'healthy').length;
      const totalCount = Object.keys(results).length;
      
      const overallStatus = 
        healthyCount === totalCount ? 'healthy' :
        healthyCount > totalCount / 2 ? 'degraded' : 'unhealthy';

      setHealthStatus(results);
      setOverallHealth({
        status: overallStatus,
        healthyServices: healthyCount,
        totalServices: totalCount,
        lastCheck: new Date().toISOString()
      });

      console.log(`✅ API Health Check Complete: ${healthyCount}/${totalCount} services healthy`);
    } catch (error) {
      console.error('❌ API Health Check Failed:', error);
    }
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    // Initial health check
    checkApiHealth();

    // Set up auto-refresh if enabled
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(checkApiHealth, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [checkApiHealth, autoRefresh, refreshInterval]);

  // Status badge component
  const StatusBadge = ({ status, latency }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
        case 'degraded': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'error': return 'bg-red-100 text-red-800 border-red-200';
        case 'checking': return 'bg-blue-100 text-blue-800 border-blue-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'healthy': return '✅';
        case 'degraded': return '⚠️';
        case 'error': return '❌';
        case 'checking': return '🔍';
        default: return '❓';
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'healthy': return 'Healthy';
        case 'degraded': return 'Degraded';
        case 'error': return 'Error';
        case 'checking': return 'Checking';
        default: return 'Unknown';
      }
    };

    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
        <span className="mr-1">{getStatusIcon(status)}</span>
        {getStatusText(status)}
        {latency && status !== 'checking' && (
          <span className="ml-1 text-xs opacity-75">
            ({latency}ms)
          </span>
        )}
      </div>
    );
  };

  // Service row component
  const ServiceRow = ({ name, displayName, status, latency, error, details }) => (
    <div className="flex items-center justify-between py-3 px-4 border-b border-gray-100 hover:bg-gray-50">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <span className="text-lg">
            {name === 'system' && '🖥️'}
            {name === 'dns' && '🌐'}
            {name === 'google' && '📊'}
            {name === 'ai' && '🤖'}
            {name === 'auth' && '🔐'}
            {name === 'meals' && '🍽️'}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">{displayName}</h3>
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <StatusBadge status={status} latency={latency} />
      </div>
    </div>
  );

  const serviceDisplayNames = {
    system: 'Home System',
    dns: 'Internet Safety',
    google: 'Google Services',
    ai: 'Family Assistant',
    auth: 'Family Login',
    meals: 'Meal Planning'
  };

  return (
    <div className={`widget-card widget-${className || 'standard'}`}>
      {/* Professional Header */}
      <div className="widget-header-technical">
        <h3 className="widget-title-technical">System Status</h3>
        <div className="flex items-center gap-3">
          <div className={`status-display-technical ${
            overallHealth.status === 'healthy' ? 'status-success-technical' : 
            overallHealth.status === 'degraded' ? 'status-warning-technical' : 
            overallHealth.status === 'error' ? 'status-error-technical' : 'status-info-technical'
          }`}>
            {overallHealth.healthyServices}/{overallHealth.totalServices} Services Ready
          </div>
          <button
            onClick={checkApiHealth}
            className="status-display-technical status-info-technical"
            style={{cursor: 'pointer', border: 'none', background: 'transparent'}}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="widget-content">
        {/* Performance Metrics Dashboard */}
        <div className="mb-6">
          <h4 className="metric-label mb-3">System Overview</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="metric-row" style={{flexDirection: 'column', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--status-success-bg)', borderRadius: '4px'}}>
              <div style={{fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--status-success)'}}>
                {overallHealth.healthyServices}
              </div>
              <div className="metric-label" style={{margin: 0, textAlign: 'center'}}>Services Working</div>
            </div>
            <div className="metric-row" style={{flexDirection: 'column', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--status-error-bg)', borderRadius: '4px'}}>
              <div style={{fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--status-error)'}}>
                {overallHealth.totalServices - overallHealth.healthyServices}
              </div>
              <div className="metric-label" style={{margin: 0, textAlign: 'center'}}>Services Down</div>
            </div>
            <div className="metric-row" style={{flexDirection: 'column', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--status-info-bg)', borderRadius: '4px'}}>
              <div style={{fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--status-info)'}}>
                {Math.round(Object.values(healthStatus)
                  .filter(s => s.latency)
                  .reduce((acc, s) => acc + s.latency, 0) / 
                 Math.max(Object.values(healthStatus).filter(s => s.latency).length, 1))}
              </div>
              <div className="metric-label" style={{margin: 0, textAlign: 'center'}}>System Speed</div>
            </div>
          </div>
        </div>
        {/* Service Status Matrix */}
        <div className="mb-6">
          <h4 className="metric-label mb-3">Service Status</h4>
          <div className="space-y-1">
            {Object.entries(healthStatus).map(([serviceName, serviceData]) => (
              <div key={serviceName} className="metric-row">
                <div className="flex items-center gap-3">
                  <span style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-tertiary)',
                    minWidth: '80px',
                    textTransform: 'uppercase'
                  }}>
                    {serviceName}
                  </span>
                  <span className="metric-label" style={{flex: 1}}>
                    {serviceDisplayNames[serviceName]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="metric-value">
                    {serviceData.latency ? `${serviceData.latency}ms` : '--'}
                  </span>
                  <div className={`status-display-technical ${
                    serviceData.status === 'healthy' ? 'status-success-technical' : 
                    serviceData.status === 'degraded' ? 'status-warning-technical' : 
                    serviceData.status === 'error' ? 'status-error-technical' : 'status-info-technical'
                  }`} style={{fontSize: '0.6rem', padding: '0.125rem 0.375rem'}}>
                    {serviceData.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Details */}
        {Object.values(healthStatus).some(s => s.error) && (
          <div className="mb-4">
            <h4 className="metric-label mb-3">Issues Found</h4>
            <div style={{
              backgroundColor: 'var(--status-error-bg)',
              border: '1px solid var(--status-error)',
              borderRadius: '4px',
              padding: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem'
            }}>
              {Object.entries(healthStatus)
                .filter(([_, data]) => data.error)
                .map(([service, data]) => (
                  <div key={service} style={{marginBottom: '0.5rem'}}>
                    <span style={{color: 'var(--status-error)', fontWeight: 'bold'}}>
                      {serviceDisplayNames[service] || service}:
                    </span>{' '}
                    <span style={{color: 'var(--text-primary)'}}>
                      {data.error}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Monitoring Controls */}
        <div className="metric-row" style={{
          borderTop: '1px solid var(--border-secondary)', 
          paddingTop: '0.75rem', 
          marginTop: '1rem'
        }}>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2" style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{accentColor: 'var(--status-info)'}}
              />
              Auto-refresh
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.7rem',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            )}
          </div>
          <span className="metric-value" style={{fontSize: '0.75rem'}}>
            Last: {overallHealth.lastCheck 
              ? new Date(overallHealth.lastCheck).toLocaleTimeString()
              : 'Never'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default ApiHealthMonitor;