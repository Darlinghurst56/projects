#!/usr/bin/env node
// Crash Debug Wrapper for Home Dashboard Server
// This script captures and logs all types of crashes and errors

const path = require('path');
const fs = require('fs');

// Enhanced error logging
function logError(error, context = 'Unknown') {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      argv: process.argv,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        JWT_SECRET: process.env.JWT_SECRET ? `[SET - ${process.env.JWT_SECRET.length} chars]` : '[NOT SET]',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '[SET]' : '[NOT SET]',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '[SET]' : '[NOT SET]'
      }
    }
  };

  // Log to console with formatting
  console.error('\n' + '='.repeat(80));
  console.error(`🚨 CRASH DETECTED: ${context}`);
  console.error('='.repeat(80));
  console.error(`Time: ${timestamp}`);
  console.error(`Error: ${error.name}: ${error.message}`);
  console.error(`Stack Trace:`);
  console.error(error.stack);
  console.error('\nEnvironment Variables:');
  Object.entries(logEntry.process.env).forEach(([key, value]) => {
    console.error(`  ${key}: ${value}`);
  });
  console.error('='.repeat(80));

  // Also save to crash log file
  const crashLogPath = path.join(__dirname, '../logs/crash.log');
  const logDir = path.dirname(crashLogPath);
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(crashLogPath, JSON.stringify(logEntry, null, 2) + '\n\n');
  
  return logEntry;
}

// Set up global error handlers
process.on('uncaughtException', (error) => {
  logError(error, 'Uncaught Exception');
  console.error('\n💀 Process will exit due to uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logError(error, 'Unhandled Promise Rejection');
  console.error('\n💀 Process will exit due to unhandled promise rejection');
  console.error('Promise:', promise);
  process.exit(1);
});

process.on('warning', (warning) => {
  console.warn('\n⚠️  Process Warning:', warning.name, warning.message);
  if (warning.stack) console.warn(warning.stack);
});

console.log(`🔍 Crash debug wrapper active. Starting server...`);
console.log(`📝 Crash logs will be saved to: ${path.join(__dirname, '../logs/crash.log')}`);
console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

// Now try to start the server
try {
  require('./index.js');
} catch (error) {
  logError(error, 'Server Startup Error');
  console.error('\n💀 Failed to start server');
  process.exit(1);
}