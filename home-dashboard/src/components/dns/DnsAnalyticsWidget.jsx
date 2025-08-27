import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dns } from '@config';
import { dnsApi } from '@services/api';
import { useDnsWebSocket } from '../../hooks/useWebSocket';
import './DnsAnalyticsWidget.css';

/**
 * DNS Analytics Widget - Control D Analytics and Statistics
 * Displays DNS query analytics, filtering statistics, blocked requests, and traffic patterns
 * 
 * Migrated from vanilla JS to React component with charts
 */

const DnsAnalyticsWidget = ({ 
  className = '', 
  refreshInterval = 300000, // 5 minutes
  defaultTimeRange = '24h' 
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(defaultTimeRange);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Analytics data structure
  const [analyticsData, setAnalyticsData] = useState({
    metrics: {
      totalQueries: 0,
      blockedQueries: 0,
      allowedQueries: 0,
      blockRate: 0,
      queriesChange: 0,
      blockedChange: 0
    },
    timeline: [],
    topDomains: [],
    topBlocked: [],
    categories: []
  });

  // Chart colors
  const chartColors = {
    allowed: '#10b981',
    blocked: '#ef4444',
    primary: '#3b82f6',
    secondary: '#6b7280'
  };

  // Time range options
  const timeRanges = [
    { value: '1h', label: '1H' },
    { value: '6h', label: '6H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' }
  ];

  // WebSocket analytics update handler
  const handleAnalyticsUpdate = useCallback((analyticsUpdate) => {
    // Update only the metrics in real-time, not the full analytics
    setAnalyticsData(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        ...analyticsUpdate.metrics
      }
    }));
    setLastUpdated(new Date());
  }, []);

  // Use WebSocket for real-time updates
  const { connected: wsConnected } = useDnsWebSocket(null, handleAnalyticsUpdate);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const response = await dnsApi.getAnalytics(timeRange);
      
      if (response.success) {
        setAnalyticsData(response.data);
        setData(response.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Failed to fetch DNS analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Set up auto-refresh
  useEffect(() => {
    fetchAnalytics();
    
    const interval = setInterval(fetchAnalytics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchAnalytics, refreshInterval]);

  // Handle time range change
  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    setLoading(true);
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  // Get change indicator
  const getChangeClass = (change) => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  // Export analytics data
  const exportData = (format = 'json') => {
    const exportData = {
      exportDate: new Date().toISOString(),
      timeRange,
      metrics: analyticsData.metrics,
      timeline: analyticsData.timeline,
      topDomains: analyticsData.topDomains,
      topBlocked: analyticsData.topBlocked,
      categories: analyticsData.categories
    };

    let content, mimeType, filename;

    if (format === 'json') {
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      filename = `dns-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    } else if (format === 'csv') {
      // Convert timeline to CSV
      const csvHeaders = ['Time', 'Allowed', 'Blocked'];
      const csvRows = analyticsData.timeline.map(row => 
        [row.time, row.allowed, row.blocked].join(',')
      );
      content = [csvHeaders.join(','), ...csvRows].join('\n');
      mimeType = 'text/csv';
      filename = `dns-analytics-timeline-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Create and trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Prepare pie chart data
  const pieData = [
    { name: 'Allowed', value: analyticsData.metrics.allowedQueries, color: chartColors.allowed },
    { name: 'Blocked', value: analyticsData.metrics.blockedQueries, color: chartColors.blocked }
  ];

  // Loading state
  if (loading) {
    return (
      <div className={`dns-analytics-widget ${className}`}>
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <span>Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`dns-analytics-widget ${className}`}>
      <div className="analytics-content">
        {/* Header with Time Range Selector */}
        <div className="analytics-header">
          <h4>DNS Analytics Overview</h4>
          <div className="header-controls">
            <div className="export-dropdown">
              <button className="export-btn">
                Export ▼
              </button>
              <div className="export-menu">
                <button onClick={() => exportData('json')}>Export JSON</button>
                <button onClick={() => exportData('csv')}>Export CSV</button>
              </div>
            </div>
            <div className="time-range-selector">
              {timeRanges.map(range => (
                <button
                  key={range.value}
                  className={`time-btn ${timeRange === range.value ? 'active' : ''}`}
                  onClick={() => handleTimeRangeChange(range.value)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="key-metrics">
          <div className="metric-card">
            <div className="metric-value">{formatNumber(analyticsData.metrics.totalQueries)}</div>
            <div className="metric-label">Total Queries</div>
            <div className={`metric-change ${getChangeClass(analyticsData.metrics.queriesChange)}`}>
              {analyticsData.metrics.queriesChange >= 0 ? '+' : ''}
              {formatPercentage(analyticsData.metrics.queriesChange)}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-value blocked">{formatNumber(analyticsData.metrics.blockedQueries)}</div>
            <div className="metric-label">Blocked</div>
            <div className={`metric-change ${getChangeClass(analyticsData.metrics.blockedChange)}`}>
              {analyticsData.metrics.blockedChange >= 0 ? '+' : ''}
              {formatPercentage(analyticsData.metrics.blockedChange)}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-value allowed">{formatNumber(analyticsData.metrics.allowedQueries)}</div>
            <div className="metric-label">Allowed</div>
            <div className="metric-change neutral">
              {formatPercentage(100 - analyticsData.metrics.blockRate)}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-value">{formatPercentage(analyticsData.metrics.blockRate)}</div>
            <div className="metric-label">Block Rate</div>
            <div className="metric-trend">
              {analyticsData.metrics.blockRate > 10 ? '🔒' : '🔓'}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          {/* Timeline Chart */}
          <div className="chart-container">
            <h5>Query Timeline</h5>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analyticsData.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="allowed" fill={chartColors.allowed} />
                <Bar dataKey="blocked" fill={chartColors.blocked} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="chart-container">
            <h5>Query Distribution</h5>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Lists */}
        <div className="top-lists">
          {/* Top Domains */}
          <div className="top-list">
            <h5>Top Domains</h5>
            <div className="list-items">
              {analyticsData.topDomains.map((domain, index) => (
                <div key={index} className="list-item">
                  <span className="domain-name">{domain.name}</span>
                  <span className="domain-count">{formatNumber(domain.count)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Blocked */}
          <div className="top-list">
            <h5>Top Blocked</h5>
            <div className="list-items">
              {analyticsData.topBlocked.map((domain, index) => (
                <div key={index} className="list-item blocked-item">
                  <span className="domain-name">{domain.name}</span>
                  <span className="domain-count">{formatNumber(domain.count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-display">
            <div className="error-icon">⚠️</div>
            <div className="error-text">
              <strong>Error:</strong> {error}
            </div>
            <button 
              className="retry-button"
              onClick={fetchAnalytics}
              disabled={loading}
            >
              Retry
            </button>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
            {wsConnected && <span className="ws-indicator"> • Live</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default DnsAnalyticsWidget;