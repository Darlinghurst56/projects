// Client-side Configuration for Home Dashboard
// PROJECT: House AI - Family Home Page | SUBPROJECT: Unified Dashboard System
// 
// This file provides ES6 configuration exports for client-side usage
// Contains only client-safe configuration values

// DNS Configuration
export const dns = {
  refreshInterval: 60000, // 1 minute
  latencyThreshold: 100, // ms
  uptimeThreshold: 99.5, // percentage
  provider: 'Control D',
  primaryDns: 'Auto',
  secondaryDns: 'Auto',
  alertThresholds: {
    latency: 100, // ms
    uptime: 99.5, // percentage
  },
};

// Client Configuration
export const client = {
  port: 80,
  apiBaseUrl: 'http://localhost:3000',
};

// WebSocket Configuration
export const websocket = {
  port: 3003,
  heartbeatInterval: 30000,
  maxConnections: 100,
};

// Feature Flags (safe for client)
export const features = {
  dnsMonitoring: true,
  googleIntegration: true,
  aiChat: true,
  dashyIntegration: true,
  googleAuth: true,
  guestMode: true,
};

// Development Configuration
export const development = {
  mockData: false,
  debugMode: false,
  hotReload: true,
  verboseLogging: false,
};

// API base URL for client use
export const apiBaseUrl = 'http://localhost:3000';

// UI Configuration (client-specific)
export const ui = {
  theme: 'light',
  updateInterval: 60000, // 1 minute
  maxRetries: 3,
  errorDisplayTime: 5000, // 5 seconds
};

// Default export for full client config
const config = {
  dns,
  client,
  websocket,
  features,
  development,
  apiBaseUrl,
  ui,
};

export default config;