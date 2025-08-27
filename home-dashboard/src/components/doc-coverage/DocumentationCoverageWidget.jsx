/**
 * @fileoverview Documentation Coverage Widget - Real-time documentation quality monitoring
 * @component DocumentationCoverageWidget
 * @author Home Dashboard Team
 * @since 1.0.0
 */

import React, { useState, useEffect } from 'react';
import './DocumentationCoverageWidget.css';

/**
 * Documentation Coverage Status Widget
 * 
 * Displays real-time documentation quality metrics and coverage statistics
 * for the Home Dashboard project. Provides visual indicators and actionable
 * insights for maintaining documentation standards.
 * 
 * @component
 * @returns {JSX.Element} Documentation coverage widget interface
 * 
 * @example
 * // Basic usage in dashboard
 * <DocumentationCoverageWidget />
 * 
 * @example 
 * // With custom refresh interval
 * <DocumentationCoverageWidget refreshInterval={30000} />
 */
const DocumentationCoverageWidget = ({ refreshInterval = 60000 }) => {
  const [coverageData, setCoverageData] = useState({
    score: 0,
    filesChecked: 0,
    functionsFound: 0,
    functionsDocumented: 0,
    lastUpdated: null,
    loading: true,
    error: null
  });

  const [expanded, setExpanded] = useState(false);

  /**
   * Fetches current documentation coverage statistics
   * 
   * Calls the backend API to run documentation validation and retrieve
   * current coverage metrics. Updates widget state with results.
   * 
   * @async
   * @function fetchCoverageData
   * @returns {Promise<void>}
   * @throws {Error} When API request fails or returns invalid data
   * 
   * @example
   * try {
   *   await fetchCoverageData();
   *   console.log('Coverage data updated');
   * } catch (error) {
   *   console.error('Failed to fetch coverage:', error);
   * }
   */
  const fetchCoverageData = async () => {
    try {
      setCoverageData(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/system/documentation-coverage');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setCoverageData({
        score: data.score || 0,
        filesChecked: data.details?.filesChecked || 0,
        functionsFound: data.details?.functionsFound || 0,
        functionsDocumented: data.details?.functionsDocumented || 0,
        lastUpdated: new Date(),
        loading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Documentation coverage fetch error:', error);
      setCoverageData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  /**
   * Calculates documentation coverage percentage
   * 
   * @function getDocumentationPercentage
   * @returns {number} Coverage percentage (0-100)
   * 
   * @example
   * const percentage = getDocumentationPercentage();
   * // Returns: 85.5
   */
  const getDocumentationPercentage = () => {
    if (coverageData.functionsFound === 0) return 100;
    return Math.round((coverageData.functionsDocumented / coverageData.functionsFound) * 100);
  };

  /**
   * Determines coverage status level based on score
   * 
   * @function getCoverageStatus
   * @returns {Object} Status object with level and color
   * 
   * @example
   * const status = getCoverageStatus();
   * // Returns: { level: 'good', color: '#4CAF50', label: 'Good' }
   */
  const getCoverageStatus = () => {
    const score = coverageData.score;
    if (score >= 90) return { level: 'excellent', color: '#4CAF50', label: 'Excellent' };
    if (score >= 75) return { level: 'good', color: '#8BC34A', label: 'Good' };
    if (score >= 50) return { level: 'warning', color: '#FF9800', label: 'Needs Work' };
    return { level: 'critical', color: '#F44336', label: 'Critical' };
  };

  /**
   * Formats timestamp for display
   * 
   * @function formatLastUpdated
   * @returns {string} Formatted time string
   * 
   * @example
   * const time = formatLastUpdated();
   * // Returns: "2 minutes ago"
   */
  const formatLastUpdated = () => {
    if (!coverageData.lastUpdated) return 'Never';
    
    const now = new Date();
    const diff = Math.floor((now - coverageData.lastUpdated) / 1000);
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchCoverageData();
    
    const interval = setInterval(fetchCoverageData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const status = getCoverageStatus();
  const percentage = getDocumentationPercentage();

  return (
    <div className="documentation-coverage-widget">
      <div className="widget-header">
        <h3 className="widget-title">
          📚 Documentation Coverage
        </h3>
        <button 
          className="expand-button"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      <div className="coverage-summary">
        {coverageData.loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Analyzing documentation...</span>
          </div>
        ) : coverageData.error ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <span>Error: {coverageData.error}</span>
            <button onClick={fetchCoverageData} className="retry-button">
              Retry
            </button>
          </div>
        ) : (
          <div className="coverage-metrics">
            <div className="score-display">
              <div 
                className="score-circle"
                style={{ borderColor: status.color }}
              >
                <span className="score-number">{coverageData.score}</span>
                <span className="score-label">Score</span>
              </div>
              <div className="status-indicator">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: status.color }}
                >
                  {status.label}
                </span>
              </div>
            </div>

            <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-value">{percentage}%</span>
                <span className="stat-label">Functions Documented</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{coverageData.filesChecked}</span>
                <span className="stat-label">Files Checked</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {expanded && !coverageData.loading && !coverageData.error && (
        <div className="detailed-metrics">
          <div className="metric-row">
            <span className="metric-label">Total Functions:</span>
            <span className="metric-value">{coverageData.functionsFound}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Documented Functions:</span>
            <span className="metric-value">{coverageData.functionsDocumented}</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Coverage Percentage:</span>
            <span className="metric-value">{percentage}%</span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Last Updated:</span>
            <span className="metric-value">{formatLastUpdated()}</span>
          </div>
          
          <div className="actions">
            <button 
              onClick={fetchCoverageData}
              className="refresh-button"
              disabled={coverageData.loading}
            >
              🔄 Refresh
            </button>
            {coverageData.score < 75 && (
              <button 
                className="improve-button"
                onClick={() => window.open('/docs/CONTRIBUTING.md', '_blank')}
              >
                📖 View Guidelines
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * PropTypes validation for DocumentationCoverageWidget
 */
DocumentationCoverageWidget.propTypes = {
  refreshInterval: function(props, propName, componentName) {
    const value = props[propName];
    if (value !== undefined && (typeof value !== 'number' || value < 5000)) {
      return new Error(
        `Invalid prop '${propName}' supplied to '${componentName}'. ` +
        'Expected a number >= 5000 (minimum 5 seconds refresh interval).'
      );
    }
  }
};

export default DocumentationCoverageWidget;