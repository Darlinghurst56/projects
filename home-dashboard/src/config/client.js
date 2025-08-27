// Client-side Configuration
// PROJECT: House AI - Family Home Page | SUBPROJECT: Unified Dashboard System
// 
// This file provides configuration values that are safe for the client-side
// and avoids importing the full server configuration to prevent build issues

// Environment-based configuration with fallbacks
const getApiBaseUrl = () => {
  // Check if we have environment variables available (Vite prefixes with VITE_)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }
  
  // Check for process.env (fallback for other build systems)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.REACT_APP_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000';
  }
  
  // Production detection based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === '192.168.1.74' || hostname.includes('192.168.1.74')) {
      return `http://${hostname}:3000`;
    }
  }
  
  // Default fallback
  return 'http://localhost:3000';
};

// Client configuration
export const config = {
  // API Configuration
  api: {
    baseUrl: getApiBaseUrl(),
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // WebSocket Configuration
  websocket: {
    url: () => {
      const apiBase = getApiBaseUrl();
      // Convert HTTP URL to WebSocket URL
      return apiBase.replace(/^http/, 'ws');
    },
    reconnectAttempts: 5,
    reconnectDelay: 3000,
    heartbeatInterval: 30000,
  },

  // Feature flags (client-side safe)
  features: {
    dnsMonitoring: true,
    googleIntegration: true,
    aiChat: true,
    dashyIntegration: true,
    googleAuth: true,
    guestMode: true,
  },

  // UI Configuration
  ui: {
    theme: 'light',
    updateInterval: 60000, // 1 minute
    maxRetries: 3,
    errorDisplayTime: 5000, // 5 seconds
  },

  // Development flags
  development: {
    mockData: false,
    debugMode: false,
    verboseLogging: false,
  },
};

// Export specific sections for convenience
export const apiConfig = config.api;
export const websocketConfig = config.websocket;
export const features = config.features;
export const uiConfig = config.ui;
export const developmentConfig = config.development;

// Default export
export default config;