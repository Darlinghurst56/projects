#!/usr/bin/env node

/**
 * Minimal Test Server for Home Dashboard
 * 
 * This server tests basic Express functionality without any middleware
 * or complex configuration that might be causing the main server to fail.
 * 
 * Purpose: Isolate whether the issue is with Express itself or with
 * the middleware/configuration in the main server.
 */

const express = require('express');
const { createServer } = require('http');

// Create minimal Express app
const app = express();
const server = createServer(app);

// Basic JSON middleware only
app.use(express.json());

// Simple health check - no middleware
app.get('/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check requested`);
  res.json({
    status: 'healthy',
    message: 'Minimal test server is working',
    timestamp: new Date().toISOString(),
    port: 3005
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  console.log(`[${new Date().toISOString()}] Test endpoint requested`);
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Basic error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[${new Date().toISOString()}] 404 - ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Start server
const PORT = 3005;
server.listen(PORT, '0.0.0.0', () => {
  console.log('=====================================');
  console.log('🧪 MINIMAL TEST SERVER STARTED');
  console.log('=====================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📊 Process ID: ${process.pid}`);
  console.log(`📊 Node version: ${process.version}`);
  console.log('=====================================');
  
  // Test self-connectivity
  setTimeout(() => {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/health',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      console.log(`✅ Self-test successful: ${res.statusCode}`);
    });
    
    req.on('error', (err) => {
      console.error(`❌ Self-test failed: ${err.message}`);
    });
    
    req.end();
  }, 1000);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n📴 Shutting down minimal test server...');
  server.close(() => {
    console.log('✅ Minimal test server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Export for testing
module.exports = { app, server };