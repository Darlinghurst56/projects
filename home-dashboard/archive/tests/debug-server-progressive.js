#!/usr/bin/env node

/**
 * Progressive Debug Server for Home Dashboard
 * 
 * This server adds middleware step by step to isolate exactly
 * which middleware is causing the main server to fail.
 */

const express = require('express');
const { createServer } = require('http');

// Load environment variables first
require('dotenv').config();

// Create Express app
const app = express();
const server = createServer(app);

console.log('🔧 Starting Progressive Debug Server');
console.log('===================================');

// Step 1: Basic Express
console.log('Step 1: Basic Express ✅');

// Step 2: Add basic JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('Step 2: JSON parsing ✅');

// Step 3: Simple health check BEFORE any other middleware
app.get('/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check - Step 3`);
  res.json({
    status: 'healthy',
    message: 'Progressive debug server - basic health check',
    timestamp: new Date().toISOString(),
    step: 'Step 3 - Before middleware'
  });
});

console.log('Step 3: Basic health check ✅');

// Step 4: Try to load configuration
let config;
try {
  config = require('./config');
  console.log('Step 4: Configuration loaded ✅');
  console.log(`  Port: ${config.server.port}`);
  console.log(`  Environment: ${config.server.nodeEnv}`);
} catch (error) {
  console.error('Step 4: Configuration failed ❌');
  console.error(`  Error: ${error.message}`);
  
  // Create fallback config
  config = {
    server: { port: 3005, nodeEnv: 'development' },
    security: { corsOrigins: ['http://localhost:3005'] }
  };
  console.log('Step 4: Using fallback config ⚠️');
}

// Step 5: Add CORS
try {
  const cors = require('cors');
  app.use(cors({
    origin: config.security.corsOrigins,
    credentials: true,
  }));
  console.log('Step 5: CORS added ✅');
} catch (error) {
  console.error('Step 5: CORS failed ❌', error.message);
}

// Add health check after CORS
app.get('/health-cors', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check - After CORS`);
  res.json({
    status: 'healthy',
    message: 'Progressive debug server - after CORS',
    timestamp: new Date().toISOString(),
    step: 'After CORS'
  });
});

// Step 6: Add compression
try {
  const compression = require('compression');
  app.use(compression());
  console.log('Step 6: Compression added ✅');
} catch (error) {
  console.error('Step 6: Compression failed ❌', error.message);
}

// Step 7: Add helmet (security headers)
try {
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for testing
    crossOriginEmbedderPolicy: false
  }));
  console.log('Step 7: Helmet added ✅');
} catch (error) {
  console.error('Step 7: Helmet failed ❌', error.message);
}

// Add health check after security headers
app.get('/health-security', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check - After security`);
  res.json({
    status: 'healthy',
    message: 'Progressive debug server - after security',
    timestamp: new Date().toISOString(),
    step: 'After security headers'
  });
});

// Step 8: Add validation middleware (the suspected culprit)
try {
  const validation = require('./server/middleware/validation');
  
  // Add security headers first
  app.use(validation.securityHeaders);
  console.log('Step 8a: Validation security headers ✅');
  
  // Add rate limiting
  app.use(validation.generalRateLimit);
  console.log('Step 8b: Rate limiting ✅');
  
  // Add request size limiting
  app.use(validation.limitRequestSize);
  console.log('Step 8c: Request size limiting ✅');
  
  // Add content type validation
  app.use(validation.validateContentType(['application/json', 'application/x-www-form-urlencoded']));
  console.log('Step 8d: Content type validation ✅');
  
  // Add input sanitization
  app.use(validation.sanitizeInput);
  console.log('Step 8e: Input sanitization ✅');
  
  // Add SQL injection prevention
  app.use(validation.preventSQLInjection);
  console.log('Step 8f: SQL injection prevention ✅');
  
} catch (error) {
  console.error('Step 8: Validation middleware failed ❌', error.message);
}

// Add health check after validation
app.get('/health-validation', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check - After validation`);
  res.json({
    status: 'healthy',
    message: 'Progressive debug server - after validation',
    timestamp: new Date().toISOString(),
    step: 'After validation middleware'
  });
});

// Step 9: Add logger
try {
  const logger = require('./server/middleware/logger');
  app.use(logger);
  console.log('Step 9: Logger added ✅');
} catch (error) {
  console.error('Step 9: Logger failed ❌', error.message);
}

// Final health check
app.get('/health-final', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check - Final`);
  res.json({
    status: 'healthy',
    message: 'Progressive debug server - all middleware loaded',
    timestamp: new Date().toISOString(),
    step: 'All middleware loaded'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error caught:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    step: 'Error handler'
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    availableEndpoints: ['/health', '/health-cors', '/health-security', '/health-validation', '/health-final']
  });
});

// Start server
const PORT = config.server.port;
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 Progressive Debug Server Started');
  console.log('==================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Test endpoints:`);
  console.log(`   http://localhost:${PORT}/health`);
  console.log(`   http://localhost:${PORT}/health-cors`);
  console.log(`   http://localhost:${PORT}/health-security`);
  console.log(`   http://localhost:${PORT}/health-validation`);
  console.log(`   http://localhost:${PORT}/health-final`);
  console.log('==================================\n');
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n📴 Shutting down progressive debug server...');
  server.close(() => {
    console.log('✅ Progressive debug server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = { app, server };