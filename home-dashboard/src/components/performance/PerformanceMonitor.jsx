import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { invalidateCache } from '../../services/api';

/**
 * Performance Monitor Component for Home Dashboard
 * 
 * Provides real-time performance metrics and cache management
 * for single-user home environment optimization.
 */
export const PerformanceMonitor = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    cacheSize: 0,
    networkRequests: 0,
    avgResponseTime: 0,
    memoryUsage: null
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Track component renders for performance monitoring
  useEffect(() => {
    setMetrics(prev => ({ ...prev, renderCount: prev.renderCount + 1 }));
  });

  // Monitor performance metrics
  useEffect(() => {
    const startTime = performance.now();
    
    const updateMetrics = () => {
      const now = performance.now();
      
      // Memory usage (if available)
      const memoryInfo = performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null;

      setMetrics(prev => ({
        ...prev,
        memoryUsage: memoryInfo,
        avgResponseTime: now - startTime
      }));
    };

    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Cache management functions
  const handleClearCache = useCallback((type) => {
    switch (type) {
      case 'dns':
        invalidateCache.dns();
        break;
      case 'google':
        invalidateCache.google();
        break;
      case 'system':
        invalidateCache.system();
        break;
      case 'all':
        invalidateCache.all();
        break;
    }
    console.log(`Cleared ${type} cache`);
  }, []);

  // Memoized performance status
  const performanceStatus = useMemo(() => {
    const { memoryUsage, avgResponseTime } = metrics;
    
    if (!memoryUsage) return 'unknown';
    
    const memoryPressure = memoryUsage.used / memoryUsage.total;
    const isSlowResponse = avgResponseTime > 500;
    
    if (memoryPressure > 0.8 || isSlowResponse) return 'poor';
    if (memoryPressure > 0.6 || avgResponseTime > 300) return 'fair';
    if (memoryPressure < 0.4 && avgResponseTime < 200) return 'excellent';
    return 'good';
  }, [metrics.memoryUsage, metrics.avgResponseTime]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(performanceStatus)}`} />
            <span className="text-sm font-medium text-gray-700">
              Performance
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {isExpanded ? '▼' : '▶'}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-100 p-3 space-y-3">
            {/* Performance Metrics */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">Metrics</div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Renders:</span>
                  <span className="ml-1 font-medium">{metrics.renderCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-1 px-1 rounded text-xs ${getStatusColor(performanceStatus)}`}>
                    {performanceStatus}
                  </span>
                </div>
              </div>

              {metrics.memoryUsage && (
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    Memory: {metrics.memoryUsage.used}MB / {metrics.memoryUsage.total}MB
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${(metrics.memoryUsage.used / metrics.memoryUsage.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cache Management */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600">Cache Controls</div>
              <div className="grid grid-cols-2 gap-1">
                {['DNS', 'Google', 'System', 'All'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleClearCache(type.toLowerCase())}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Clear {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Optimization Tips */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Home Optimization</div>
              <div className="text-xs text-gray-500 space-y-1">
                {performanceStatus === 'poor' && (
                  <div className="text-red-600">⚠️ Consider clearing cache or refreshing page</div>
                )}
                {performanceStatus === 'fair' && (
                  <div className="text-yellow-600">💡 Performance could be improved</div>
                )}
                {performanceStatus === 'excellent' && (
                  <div className="text-green-600">✅ Optimal for home environment</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;