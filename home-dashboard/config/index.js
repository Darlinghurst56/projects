// Unified Configuration System for Home Dashboard
// PROJECT: House AI - Family Home Page | SUBPROJECT: Unified Dashboard System

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Client Configuration
  client: {
    port: process.env.CLIENT_PORT || 80,
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000', // Fixed: ensure consistency
  },

  // Dashy Configuration
  dashy: {
    port: process.env.DASHY_PORT || 4000,
    configPath: process.env.DASHY_CONFIG_PATH || '~/.dashy/conf.yml',
    theme: process.env.DASHY_THEME || 'material-dark',
  },

  // External Services
  services: {
    ollama: {
      baseUrl: process.env.OLLAMA_URL || 'http://192.168.1.74:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 60000,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/documents',
        'openid',
        'email',
        'profile'
      ],
    },
  },

  // Authentication
  auth: {
    jwtSecret: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('❌ FATAL: JWT_SECRET environment variable is required for security');
        console.error('   Please add JWT_SECRET to your .env file or environment variables');
        console.error('   Example: JWT_SECRET=your-very-secure-secret-key-at-least-32-characters-long');
        throw new Error('JWT_SECRET environment variable is required for security');
      }
      if (secret === 'your-super-secret-jwt-key-change-in-production') {
        console.warn('⚠️  WARNING: Using default JWT secret! This is INSECURE for production!');
        console.warn('⚠️  Please set JWT_SECRET environment variable to a secure random string');
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ FATAL: Default JWT secret cannot be used in production');
          throw new Error('Default JWT secret cannot be used in production');
        }
      }
      if (secret.length < 32) {
        console.warn('⚠️  WARNING: JWT secret is too short. Recommended minimum: 32 characters');
        console.warn('   Current length:', secret.length, 'characters');
        console.warn('   Consider using a longer, more secure key for better security');
      }
      console.log('✅ JWT secret configured successfully');
      return secret;
    })(),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 1800000, // 30 minutes
    tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY, // 64-character hex string for AES-256
  },

  // DNS Monitoring Configuration (unified)
  dns: {
    refreshInterval: parseInt(process.env.DNS_REFRESH_INTERVAL) || 60000, // 1 minute
    latencyThreshold: parseInt(process.env.DNS_LATENCY_THRESHOLD) || 100, // ms
    uptimeThreshold: parseFloat(process.env.DNS_UPTIME_THRESHOLD) || 99.5, // percentage
    provider: process.env.DNS_PROVIDER || 'Control D',
    primaryDns: process.env.DNS_PRIMARY || 'Auto',
    secondaryDns: process.env.DNS_SECONDARY || 'Auto',
    alertThresholds: {
      latency: parseInt(process.env.DNS_LATENCY_THRESHOLD) || 100, // ms
      uptime: parseFloat(process.env.DNS_UPTIME_THRESHOLD) || 99.5, // percentage
    },
  },

  // Control D Configuration
  controlD: {
    apiKey: process.env.CONTROLD_API_KEY || null,
    apiBase: process.env.CONTROLD_API_BASE || 'https://api.controld.com/v1',
    cacheTimeout: parseInt(process.env.CONTROLD_CACHE_TIMEOUT) || 300000, // 5 minutes
    testDomain: process.env.CONTROLD_TEST_DOMAIN || 'test.controld.com',
    blockTestDomain: process.env.CONTROLD_BLOCK_TEST_DOMAIN || 'block-test.controld.com',
  },

  // WebSocket Configuration (unified)
  websocket: {
    port: parseInt(process.env.WS_PORT) || 3003,
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000,
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS) || 100,
  },

  // Security Configuration (unified CORS origins)
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:80',
      'http://localhost:4000',
      'http://192.168.1.74',
      'http://192.168.1.74:80',
      'http://192.168.1.74:3000',
      'http://192.168.1.74:3003',
      'http://192.168.1.74:3004',
      'http://192.168.1.74:4000',
    ],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/dashboard.log',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
  },

  // Database (if needed)
  database: {
    type: process.env.DB_TYPE || 'memory',
    file: process.env.DB_FILE || './data/dashboard.db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'dashboard',
    user: process.env.DB_USER || 'dashboard_user',
    password: process.env.DB_PASSWORD || 'dashboard_password',
  },

  // Feature Flags
  features: {
    dnsMonitoring: process.env.FEATURE_DNS_MONITORING !== 'false',
    googleIntegration: process.env.FEATURE_GOOGLE_INTEGRATION !== 'false',
    aiChat: process.env.FEATURE_AI_CHAT !== 'false',
    dashyIntegration: process.env.FEATURE_DASHY_INTEGRATION !== 'false',
    googleAuth: process.env.FEATURE_GOOGLE_AUTH !== 'false',
    guestMode: process.env.GUEST_MODE_ENABLED !== 'false',
  },

  // Development Configuration
  development: {
    mockData: process.env.MOCK_DATA === 'true',
    debugMode: process.env.DEBUG === 'true',
    hotReload: process.env.HOT_RELOAD !== 'false',
    verboseLogging: process.env.VERBOSE_LOGGING === 'true',
  },
};

/**
 * Validate configuration settings and environment variables
 * 
 * Performs comprehensive validation of required environment variables,
 * URL formats, and numeric values. Throws detailed error messages
 * for missing or invalid configuration.
 * 
 * Validation Categories:
 * - Required environment variables (Google OAuth, JWT secret)
 * - URL format validation for service endpoints
 * - Numeric value validation for ports and timeouts
 * 
 * @function validateConfig
 * @throws {Error} When validation fails with detailed error list
 * @returns {boolean} True if all validation passes
 * 
 * @example
 * try {
 *   validateConfig();
 *   console.log('Configuration is valid');
 * } catch (error) {
 *   console.error('Configuration errors:', error.message);
 *   process.exit(1);
 * }
 */
const validateConfig = () => {
  const errors = [];

  // Required environment variables
  const required = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'JWT_SECRET',
  ];

  required.forEach(key => {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  // Validate URLs
  const urlFields = [
    'OLLAMA_URL',
    'API_BASE_URL',
  ];

  urlFields.forEach(key => {
    if (process.env[key] && !isValidUrl(process.env[key])) {
      errors.push(`Invalid URL format for ${key}: ${process.env[key]}`);
    }
  });

  // Validate numeric values
  const numericFields = [
    'PORT',
    'CLIENT_PORT',
    'DASHY_PORT',
    'SESSION_TIMEOUT',
  ];

  numericFields.forEach(key => {
    if (process.env[key] && isNaN(parseInt(process.env[key]))) {
      errors.push(`Invalid numeric value for ${key}: ${process.env[key]}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return true;
};

/**
 * Helper function to validate URL format
 * 
 * Uses the native URL constructor to validate URL format.
 * Returns false for invalid URLs without throwing errors.
 * 
 * @function isValidUrl
 * @param {string} string - URL string to validate
 * @returns {boolean} True if URL is valid, false otherwise
 * 
 * @example
 * console.log(isValidUrl('http://localhost:3000')); // true
 * console.log(isValidUrl('invalid-url')); // false
 */
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Export configuration (CommonJS for server compatibility)
 * 
 * Exports the main configuration object and individual sections
 * for convenient importing in different parts of the application.
 * 
 * @exports {Object} config - Complete configuration object
 * @exports {Object} server - Server configuration section
 * @exports {Object} client - Client configuration section
 * @exports {Object} services - External services configuration
 * @exports {Object} auth - Authentication configuration
 * @exports {Object} dns - DNS monitoring configuration
 * @exports {Object} websocket - WebSocket configuration
 * @exports {Object} security - Security policies configuration
 * @exports {Object} features - Feature flags configuration
 * @exports {Object} development - Development options configuration
 * @exports {Function} validateConfig - Configuration validation function
 * 
 * @example
 * // Import complete configuration
 * const config = require('./config');
 * 
 * @example
 * // Import specific sections
 * const { server, auth } = require('./config');
 * 
 * @example
 * // Validate configuration on startup
 * const { validateConfig } = require('./config');
 * validateConfig();
 */
module.exports = config;
module.exports.default = config;

// Export specific sections for convenience
module.exports.server = config.server;
module.exports.client = config.client;
module.exports.dashy = config.dashy;
module.exports.services = config.services;
module.exports.auth = config.auth;
module.exports.dns = config.dns;
module.exports.controlD = config.controlD;
module.exports.websocket = config.websocket;
module.exports.security = config.security;
module.exports.logging = config.logging;
module.exports.database = config.database;
module.exports.features = config.features;
module.exports.development = config.development;
module.exports.validateConfig = validateConfig;