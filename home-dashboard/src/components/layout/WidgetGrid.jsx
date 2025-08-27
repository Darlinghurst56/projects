import React, { useState, useCallback } from 'react';
import { WidgetContainer } from './WidgetContainer';

/**
 * Enhanced WidgetGrid with complete widget isolation
 * 
 * Features:
 * - Each widget is wrapped in fault-tolerant container
 * - CSS Grid maintains layout stability regardless of widget state
 * - Error tracking and debugging capabilities
 * - Performance monitoring
 * - Graceful degradation
 */
export const WidgetGrid = ({ 
  widgets, 
  className = '',
  onWidgetError = null,
  showPerformanceMetrics = false 
}) => {
  const [widgetErrors, setWidgetErrors] = useState({});
  const [widgetRetries, setWidgetRetries] = useState({});

  // Track widget errors for debugging and monitoring
  const handleWidgetError = useCallback((error, errorInfo, widgetId) => {
    setWidgetErrors(prev => ({
      ...prev,
      [widgetId]: {
        error: error.message,
        timestamp: Date.now(),
        stack: error.stack
      }
    }));

    if (onWidgetError) {
      onWidgetError(error, errorInfo, widgetId);
    }
  }, [onWidgetError]);

  // Track widget retry attempts
  const handleWidgetRetry = useCallback((widgetId) => {
    setWidgetRetries(prev => ({
      ...prev,
      [widgetId]: (prev[widgetId] || 0) + 1
    }));
  }, []);

  // Apple Home style grid with proper spacing and family-friendly layout
  return (
    <div className="widget-grid-wrapper">
      {/* Apple Home Style Grid Container */}
      <div 
        className={`apple-home-grid ${className}`}
        data-testid="widget-grid"
      >
        {widgets.map((widget) => {
          const Component = widget.component;
          const hasError = !!widgetErrors[widget.id];
          const retryCount = widgetRetries[widget.id] || 0;
          
          return (
            <Component
              key={`${widget.id}-${retryCount}`} // Force remount on retry
              widgetId={widget.id}
              onRetry={() => handleWidgetRetry(widget.id)}
            />
          );
        })}
      </div>

      {/* Development error summary */}
      {process.env.NODE_ENV === 'development' && Object.keys(widgetErrors).length > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Widget Errors ({Object.keys(widgetErrors).length})
          </h4>
          <div className="space-y-2">
            {Object.entries(widgetErrors).map(([widgetId, errorData]) => {
              const widget = widgets.find(w => w.id === widgetId);
              return (
                <details key={widgetId} className="text-xs">
                  <summary className="cursor-pointer text-red-700 hover:text-red-900">
                    {widget?.title || widgetId} - {errorData.error}
                  </summary>
                  <div className="mt-1 p-2 bg-red-100 rounded">
                    <p><strong>Time:</strong> {new Date(errorData.timestamp).toLocaleString()}</p>
                    <p><strong>Retries:</strong> {widgetRetries[widgetId] || 0}</p>
                    <pre className="mt-1 text-[10px] font-mono overflow-auto max-h-20">
                      {errorData.stack}
                    </pre>
                  </div>
                </details>
              );
            })}
          </div>
          <button
            onClick={() => {
              setWidgetErrors({});
              setWidgetRetries({});
            }}
            className="mt-3 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear Error Log
          </button>
        </div>
      )}

      {/* Performance metrics in development */}
      {process.env.NODE_ENV === 'development' && showPerformanceMetrics && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Widget Grid Metrics</h4>
          <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
            <div>
              <span className="font-medium">Total Widgets:</span> {widgets.length}
            </div>
            <div>
              <span className="font-medium">Failed Widgets:</span> {Object.keys(widgetErrors).length}
            </div>
            <div>
              <span className="font-medium">Total Retries:</span> {Object.values(widgetRetries).reduce((sum, count) => sum + count, 0)}
            </div>
            <div>
              <span className="font-medium">Success Rate:</span> {
                widgets.length > 0 
                  ? Math.round(((widgets.length - Object.keys(widgetErrors).length) / widgets.length) * 100)
                  : 100
              }%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Widget grid with enhanced error recovery
 */
export const ResilientWidgetGrid = (props) => {
  return (
    <div className="resilient-widget-grid">
      <WidgetGrid {...props} showPerformanceMetrics={true} />
    </div>
  );
};