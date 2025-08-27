import React, { useState, useCallback } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

export const WidgetContainer = ({ 
  children, 
  widgetId, 
  title, 
  category = 'default',
  size = 'medium',
  className = '' 
}) => {
  const getSizeClass = (size) => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1 min-h-[280px]';
      case 'medium':
        return 'col-span-1 md:col-span-2 row-span-1 min-h-[300px]';
      case 'large':
        return 'col-span-1 md:col-span-2 lg:col-span-3 row-span-2 min-h-[400px]';
      default:
        return 'col-span-1 row-span-1 min-h-[300px]';
    }
  };

  // Apple Home style card - clean, minimal, family-friendly
  return (
    <div
      data-widget-id={widgetId}
      data-testid={`${widgetId}-widget-container`}
      className={`
        ${getSizeClass(size)}
        bg-white rounded-2xl
        shadow-sm hover:shadow-lg
        transition-all duration-300 ease-out
        flex flex-col overflow-hidden
        border-0
        ${className}
      `}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '0',
        minHeight: 'var(--touch-target-lg, 56px)'
      }}
    >
      {/* Apple Home Style Header */}
      <div className="flex-shrink-0 p-6 border-b-0">
        <div className="flex items-center justify-between">
          <h3 
            className="text-lg font-semibold text-gray-900 truncate"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              fontSize: '1.125rem',
              fontWeight: '600'
            }}
          >
            {title}
          </h3>
        </div>
      </div>

      {/* Widget Content - Apple Home Style */}
      <div 
        className="flex-1 px-6 pb-6 overflow-hidden"
        style={{ padding: '0 24px 24px' }}
      >
        <ErrorBoundary 
          widgetId={widgetId} 
          widgetTitle={title}
          fallback={
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-6">
                <div 
                  className="mx-auto h-12 w-12 flex items-center justify-center rounded-full mb-4"
                  style={{
                    backgroundColor: 'var(--status-error-bg)',
                    minHeight: 'var(--touch-target)',
                    minWidth: 'var(--touch-target)'
                  }}
                >
                  <svg 
                    className="h-6 w-6" 
                    fill="none" 
                    stroke="var(--status-error)" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 
                  className="text-sm font-medium mb-2"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.875rem'
                  }}
                >
                  Widget Error
                </h4>
                <p 
                  className="text-xs mb-4"
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem'
                  }}
                >
                  This widget encountered an error but the dashboard remains functional.
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 rounded-xl font-medium"
                  style={{
                    backgroundColor: 'var(--status-info)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.875rem',
                    minHeight: 'var(--touch-target)',
                    fontFamily: 'var(--font-ui)'
                  }}
                >
                  Refresh Page
                </button>
              </div>
            </div>
          }
        >
          <div className="h-full">
            {children}
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
};

// Widget Loading State Component
export const WidgetLoading = ({ message = "Loading..." }) => (
  <div className="widget-loading h-full flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

// Widget Error State Component
export const WidgetError = ({ 
  title = "Connection Error",
  message = "Unable to load widget data. Please check your connection.",
  onRetry = null 
}) => (
  <div className="widget-error h-full flex items-center justify-center">
    <div className="text-center p-4">
      <div className="mx-auto h-10 w-10 flex items-center justify-center rounded-full bg-red-100 mb-3">
        <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h4 className="text-sm font-medium text-gray-900 mb-1">{title}</h4>
      <p className="text-xs text-gray-600 mb-3">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  </div>
);

// Widget Offline State Component  
export const WidgetOffline = ({ onRetry = null }) => (
  <div className="widget-offline h-full flex items-center justify-center bg-gray-50">
    <div className="text-center p-4">
      <div className="mx-auto h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 mb-3">
        <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75M12 2.25A9.75 9.75 0 102.25 12M12 2.25V12m0 0l3.75-3.75M12 12l-3.75-3.75" />
        </svg>
      </div>
      <h4 className="text-sm font-medium text-gray-700 mb-1">Offline</h4>
      <p className="text-xs text-gray-500 mb-3">Check your connection</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  </div>
);
// Widget Lifecycle Hook for managing widget state
export const useWidgetLifecycle = (widgetId) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const markReady = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const markError = useCallback((errorMessage) => {
    setIsLoading(false);
    setError(errorMessage);
  }, []);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    retryCount,
    markReady,
    markError,
    retry
  };
};
