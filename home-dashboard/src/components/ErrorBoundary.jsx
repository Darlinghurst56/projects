import React from 'react';

/**
 * Enhanced ErrorBoundary for widget isolation
 * Supports both full-page errors and widget-specific errors
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      errorInfo
    });

    // Log widget-specific errors with context
    if (this.props.widgetId) {
      console.error(`Widget Error [${this.props.widgetId}]:`, {
        widget: this.props.widgetTitle || this.props.widgetId,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
    
    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo, { widgetId: this.props.widgetId });
    }

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.props.widgetId);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Widget-specific error UI (compact)
      if (this.props.widgetId) {
        return (
          <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-red-900 mb-2">
              {this.props.widgetTitle || 'Widget'} Error
            </h3>
            <p className="text-xs text-red-700 text-center mb-4 max-w-[200px]">
              This widget encountered an error and couldn't load properly.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={this.handleRetry}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Retry
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => console.log('Widget Error Details:', { error: this.state.error, errorInfo: this.state.errorInfo })}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Debug
                </button>
              )}
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-3 w-full">
                <summary className="cursor-pointer text-xs text-red-600 hover:text-red-800">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                  <p className="font-medium text-red-800">Error:</p>
                  <p className="text-red-700 font-mono text-[10px] mb-2">{this.state.error?.message}</p>
                  <p className="font-medium text-red-800">Component:</p>
                  <pre className="text-red-700 font-mono text-[10px] overflow-auto max-h-20">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        );
      }

      // Full-page error UI (original behavior)
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}