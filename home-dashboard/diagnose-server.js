#!/usr/bin/env node

/**
 * Server Diagnostic Tool for Home Dashboard
 * 
 * This script diagnoses potential issues preventing the server from
 * responding to requests by checking:
 * 1. Environment variables
 * 2. Configuration loading
 * 3. Middleware dependencies
 * 4. Port availability
 * 5. File permissions
 */

const fs = require('fs');
const path = require('path');
const net = require('net');

console.log('🔍 Starting Home Dashboard Server Diagnosis');
console.log('============================================\n');

// Track all issues found
const issues = [];
const warnings = [];

// 1. Check Environment Variables
console.log('1️⃣ Checking Environment Variables...');
try {
  require('dotenv').config();
  
  const requiredVars = ['JWT_SECRET'];
  const optionalVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NODE_ENV', 'PORT'];
  
  console.log('   Required variables:');
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      issues.push(`❌ Missing required environment variable: ${varName}`);
      console.log(`   ❌ ${varName}: MISSING`);
    } else {
      console.log(`   ✅ ${varName}: SET (${process.env[varName].length} chars)`);
    }
  });
  
  console.log('   Optional variables:');
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`⚠️  Optional environment variable not set: ${varName}`);
      console.log(`   ⚠️  ${varName}: NOT SET`);
    } else {
      console.log(`   ✅ ${varName}: ${process.env[varName]}`);
    }
  });
  
} catch (error) {
  issues.push(`❌ Failed to load environment variables: ${error.message}`);
}

console.log();

// 2. Check Configuration Loading
console.log('2️⃣ Checking Configuration Loading...');
try {
  const config = require('./config');
  console.log(`   ✅ Configuration loaded successfully`);
  console.log(`   📊 Server port: ${config.server.port}`);
  console.log(`   📊 Node environment: ${config.server.nodeEnv}`);
  console.log(`   📊 CORS origins: ${config.security.corsOrigins.length} origins`);
  
  // Check if JWT secret will cause issues
  if (config.auth.jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
    warnings.push('⚠️  Using default JWT secret - this will cause warnings');
  }
  
} catch (error) {
  issues.push(`❌ Failed to load configuration: ${error.message}`);
  console.log(`   ❌ Configuration error: ${error.message}`);
}

console.log();

// 3. Check Critical Files
console.log('3️⃣ Checking Critical Files...');
const criticalFiles = [
  './server/index.js',
  './server/middleware/validation.js',
  './server/utils/errorHandling.js',
  './server/middleware/logger.js',
  './server/routes/auth.js',
  './package.json'
];

criticalFiles.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`   ✅ ${filePath} (${stats.size} bytes)`);
    } else {
      issues.push(`❌ Missing critical file: ${filePath}`);
      console.log(`   ❌ ${filePath}: NOT FOUND`);
    }
  } catch (error) {
    issues.push(`❌ Cannot access file ${filePath}: ${error.message}`);
  }
});

console.log();

// 4. Check Port Availability
console.log('4️⃣ Checking Port Availability...');
const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.close(() => {
        resolve(true); // Port is available
      });
    });
    
    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
};

const targetPort = process.env.PORT || 3005;
checkPort(targetPort).then(available => {
  if (available) {
    console.log(`   ✅ Port ${targetPort} is available`);
  } else {
    issues.push(`❌ Port ${targetPort} is already in use`);
    console.log(`   ❌ Port ${targetPort} is already in use`);
  }
  
  // Continue with dependency checks after port check
  console.log();
  checkDependencies();
});

// 5. Check Dependencies
function checkDependencies() {
  console.log('5️⃣ Checking Dependencies...');
  
  try {
    const packageJson = require('./package.json');
    const criticalDeps = [
      'express',
      'cors',
      'helmet',
      'compression',
      'socket.io',
      'joi',
      'express-rate-limit',
      'xss'
    ];
    
    criticalDeps.forEach(dep => {
      try {
        require(dep);
        console.log(`   ✅ ${dep}: Available`);
      } catch (error) {
        issues.push(`❌ Missing dependency: ${dep}`);
        console.log(`   ❌ ${dep}: MISSING`);
      }
    });
    
  } catch (error) {
    issues.push(`❌ Cannot read package.json: ${error.message}`);
  }
  
  console.log();
  
  // 6. Test Basic Configuration Creation
  console.log('6️⃣ Testing Basic Configuration Creation...');
  try {
    // Try to create a minimal config without validation
    const basicConfig = {
      server: {
        port: process.env.PORT || 3005,
        nodeEnv: process.env.NODE_ENV || 'development'
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'test-secret-for-diagnosis'
      }
    };
    
    console.log(`   ✅ Basic configuration created successfully`);
    console.log(`   📊 Port: ${basicConfig.server.port}`);
    console.log(`   📊 Environment: ${basicConfig.server.nodeEnv}`);
    
  } catch (error) {
    issues.push(`❌ Cannot create basic configuration: ${error.message}`);
  }
  
  console.log();
  
  // Output Summary
  outputSummary();
}

function outputSummary() {
  console.log('📋 DIAGNOSIS SUMMARY');
  console.log('==================');
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ No critical issues found! The server should start successfully.');
    console.log('\n🚀 Try running the minimal test server:');
    console.log('   node test-server-minimal.js');
  } else {
    if (issues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES FOUND:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach(warning => console.log(`   ${warning}`));
    }
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    
    if (issues.includes('❌ Missing required environment variable: JWT_SECRET')) {
      console.log('   1. Create a .env file with JWT_SECRET=your-secret-key-here');
    }
    
    if (issues.some(issue => issue.includes('Port'))) {
      console.log('   2. Check if another process is using the port:');
      console.log('      lsof -i :3005');
      console.log('      Or try a different port: PORT=3006 npm start');
    }
    
    if (issues.some(issue => issue.includes('dependency'))) {
      console.log('   3. Install missing dependencies:');
      console.log('      npm install');
    }
    
    if (issues.some(issue => issue.includes('file'))) {
      console.log('   4. Check file permissions and ensure all files exist');
    }
  }
  
  console.log('\n🧪 Test with minimal server (bypasses all middleware):');
  console.log('   node test-server-minimal.js');
  
  console.log('\n📊 Environment Info:');
  console.log(`   Node.js: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Architecture: ${process.arch}`);
  console.log(`   Working directory: ${process.cwd()}`);
}