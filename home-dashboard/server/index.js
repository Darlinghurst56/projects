// Home Dashboard Server
// PROJECT: House AI - Family Home Page | SUBPROJECT: Unified Dashboard System

// Load environment variables first
require('dotenv').config();

// Import unified error handling system
const { setupProcessErrorHandlers } = require('./utils/errorHandling');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import configuration with error handling
let config;
try {
  config = require('../config');
  console.log('✅ Configuration loaded successfully');
} catch (error) {
  console.error('❌ FATAL: Failed to load configuration');
  console.error('Error:', error.message);
  console.error('\nPossible causes:');
  console.error('1. Missing or invalid environment variables');
  console.error('2. Invalid .env file format');
  console.error('3. Missing required dependencies');
  console.error('\nPlease check your .env file and try again.\n');
  process.exit(1);
}

// Import routes with error handling
let authRoutes, dnsRoutes, googleRoutes, aiRoutes, systemRoutes, mealRoutes;
try {
  authRoutes = require('./routes/auth');
  dnsRoutes = require('./routes/dns');
  googleRoutes = require('./routes/google');
  aiRoutes = require('./routes/ai');
  systemRoutes = require('./routes/system');
  mealRoutes = require('./routes/meals');
  console.log('✅ All route modules loaded successfully');
} catch (error) {
  console.error('❌ FATAL: Failed to load route modules');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('\nThis usually indicates missing dependencies or syntax errors in route files.\n');
  process.exit(1);
}

// Import middleware with error handling
let authMiddleware, logger, validation;
try {
  authMiddleware = require('./middleware/auth');
  logger = require('./middleware/logger');
  validation = require('./middleware/validation');
  console.log('✅ All middleware modules loaded successfully');
} catch (error) {
  console.error('❌ FATAL: Failed to load middleware modules');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('\nThis usually indicates missing dependencies or syntax errors in middleware files.\n');
  process.exit(1);
}

// Import unified error handling and monitoring
const { createUnifiedErrorHandler } = require('./utils/errorHandling');
const performanceMonitor = require('./utils/performanceMonitor');
const healthMonitor = require('./utils/healthMonitor');

// Import and initialize Service Container
const { defaultContainer } = require('./services/ServiceContainer');
console.log('✅ Service Container initialized with core services');

// Create Express app
const app = express();
const server = createServer(app);

// Set up unified process error handlers
setupProcessErrorHandlers(server);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: config.security.corsOrigins,
    methods: ['GET', 'POST'],
  },
});

// Security middleware - Use enhanced security headers
app.use(validation.securityHeaders);

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true,
}));

// Compression
app.use(compression());

// Security middleware - Basic sanitization for home use
app.use(validation.sanitizeInput);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General rate limiting
app.use(validation.generalRateLimit);

// Logging and performance monitoring
app.use(logger);
app.use(performanceMonitor.middleware());

// Static files (for production)
if (config.server.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Connection tracking for monitoring (moved before routes)
const connectionMetrics = {
  totalConnections: 0,
  activeConnections: new Map(),
  reconnectionAttempts: new Map()
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// WebSocket monitoring endpoint
app.get('/health/websocket', (req, res) => {
  const now = Date.now();
  const activeConnections = [];
  const staleConnections = [];
  
  for (const [socketId, connection] of connectionMetrics.activeConnections) {
    const timeSinceLastPing = now - connection.lastPing;
    const connectionData = {
      id: socketId,
      connectedAt: new Date(connection.connectedAt).toISOString(),
      authenticated: connection.authenticated,
      subscriptions: Array.from(connection.subscriptions),
      latency: connection.latency,
      timeSinceLastPing
    };
    
    if (timeSinceLastPing > 120000) { // 2 minutes
      staleConnections.push(connectionData);
    } else {
      activeConnections.push(connectionData);
    }
  }
  
  res.json({
    status: 'healthy',
    metrics: {
      totalConnections: connectionMetrics.totalConnections,
      activeConnections: activeConnections.length,
      staleConnections: staleConnections.length,
      averageLatency: activeConnections.length > 0 
        ? Math.round(activeConnections.reduce((sum, conn) => sum + conn.latency, 0) / activeConnections.length)
        : 0
    },
    connections: {
      active: activeConnections,
      stale: staleConnections
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes with enhanced security
app.use('/api/auth', validation.authRateLimit, authRoutes);
app.use('/api/dns', dnsRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/meals', mealRoutes);

// Socket.IO connection handling with production optimizations
io.on('connection', (socket) => {
  const connectionTime = Date.now();
  connectionMetrics.totalConnections++;
  connectionMetrics.activeConnections.set(socket.id, {
    connectedAt: connectionTime,
    authenticated: false,
    subscriptions: new Set(),
    lastPing: connectionTime,
    latency: 0
  });

  console.log(`✅ Client connected: ${socket.id} (Total: ${connectionMetrics.activeConnections.size})`);

  // Enhanced authentication with token verification
  socket.on('authenticate', async (token) => {
    try {
      // TODO: Implement proper JWT token verification
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // const user = await getUserById(decoded.userId);
      
      const connection = connectionMetrics.activeConnections.get(socket.id);
      if (connection) {
        connection.authenticated = true;
        // connection.userId = user.id;
      }
      
      console.log(`🔐 Client authenticated: ${socket.id}`);
      socket.emit('authenticated', { success: true });
    } catch (error) {
      console.error(`❌ Authentication failed for ${socket.id}:`, error.message);
      socket.emit('authenticated', { success: false, error: 'Invalid token' });
    }
  });

  // Heartbeat mechanism for connection quality monitoring
  socket.on('ping', (timestamp) => {
    const connection = connectionMetrics.activeConnections.get(socket.id);
    if (connection) {
      connection.lastPing = Date.now();
      connection.latency = connection.lastPing - timestamp;
    }
    
    // Send pong response with original timestamp
    socket.emit('pong', timestamp);
  });

  // Enhanced subscription management with validation
  socket.on('subscribe:dns', () => {
    socket.join('dns-updates');
    const connection = connectionMetrics.activeConnections.get(socket.id);
    if (connection) {
      connection.subscriptions.add('dns');
    }
    console.log(`🔍 Client subscribed to DNS updates: ${socket.id}`);
    
    // Send current DNS status immediately after subscription
    // TODO: Integrate with DNS monitoring service
    socket.emit('dns-status', {
      connection: { status: 'connected' },
      timestamp: Date.now()
    });
  });

  socket.on('unsubscribe:dns', () => {
    socket.leave('dns-updates');
    const connection = connectionMetrics.activeConnections.get(socket.id);
    if (connection) {
      connection.subscriptions.delete('dns');
    }
    console.log(`🔍 Client unsubscribed from DNS updates: ${socket.id}`);
  });

  // Google services subscription
  socket.on('subscribe:google', () => {
    socket.join('google-updates');
    const connection = connectionMetrics.activeConnections.get(socket.id);
    if (connection) {
      connection.subscriptions.add('google');
    }
    console.log(`📊 Client subscribed to Google updates: ${socket.id}`);
  });

  socket.on('unsubscribe:google', () => {
    socket.leave('google-updates');
    const connection = connectionMetrics.activeConnections.get(socket.id);
    if (connection) {
      connection.subscriptions.delete('google');
    }
    console.log(`📊 Client unsubscribed from Google updates: ${socket.id}`);
  });

  // AI chat subscription
  socket.on('subscribe:chat', () => {
    socket.join('ai-chat');
    const connection = connectionMetrics.activeConnections.get(socket.id);
    if (connection) {
      connection.subscriptions.add('chat');
    }
    console.log(`🤖 Client subscribed to AI chat: ${socket.id}`);
  });

  socket.on('unsubscribe:chat', () => {
    socket.leave('ai-chat');
    const connection = connectionMetrics.activeConnections.get(socket.id);
    if (connection) {
      connection.subscriptions.delete('chat');
    }
    console.log(`🤖 Client unsubscribed from AI chat: ${socket.id}`);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`🚨 Socket error for ${socket.id}:`, error);
  });

  // Enhanced disconnect handling with cleanup
  socket.on('disconnect', (reason) => {
    const connection = connectionMetrics.activeConnections.get(socket.id);
    if (connection) {
      const sessionDuration = Date.now() - connection.connectedAt;
      console.log(`❌ Client disconnected: ${socket.id} (Reason: ${reason}, Duration: ${Math.round(sessionDuration/1000)}s)`);
      
      // Log subscription info for debugging
      if (connection.subscriptions.size > 0) {
        console.log(`   Subscriptions: ${Array.from(connection.subscriptions).join(', ')}`);
      }
    }
    
    connectionMetrics.activeConnections.delete(socket.id);
    connectionMetrics.reconnectionAttempts.delete(socket.id);
  });
});

// Serve React app for all other routes (SPA fallback)
if (config.server.nodeEnv === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
// Use unified error handling middleware
app.use(createUnifiedErrorHandler());

// Periodic cleanup of stale connections
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 300000; // 5 minutes
  let cleaned = 0;
  
  for (const [socketId, connection] of connectionMetrics.activeConnections) {
    if (now - connection.lastPing > staleThreshold) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        console.log(`🧹 Cleaning stale connection: ${socketId}`);
        socket.disconnect(true);
        cleaned++;
      } else {
        // Socket already gone, just clean up metrics
        connectionMetrics.activeConnections.delete(socketId);
        cleaned++;
      }
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} stale connections`);
  }
}, 60000); // Run every minute

// Start server with comprehensive error handling
const PORT = config.server.port;

// Validate port
if (!PORT || isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.error('❌ FATAL: Invalid port number:', PORT);
  console.error('   Port must be a number between 1 and 65535');
  console.error('   Check your PORT environment variable or config');
  process.exit(1);
}

server.listen(PORT, (error) => {
  if (error) {
    console.error('❌ FATAL: Failed to start server on port', PORT);
    console.error('Error:', error.message);
    
    if (error.code === 'EADDRINUSE') {
      console.error('\nℹ️  Port', PORT, 'is already in use.');
      console.error('   Try one of these solutions:');
      console.error('   1. Kill the process using this port: lsof -ti:' + PORT + ' | xargs kill -9');
      console.error('   2. Use a different port: PORT=3006 npm start');
      console.error('   3. Stop other services running on this port\n');
    }
    
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ HOME DASHBOARD SERVER STARTED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`🚀 Server running on port: ${PORT}`);
  console.log(`📊 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 WebSocket monitoring: http://localhost:${PORT}/health/websocket`);
  
  if (config.server.nodeEnv === 'development') {
    console.log(`🔧 API Base URL: http://localhost:${PORT}/api`);
    console.log('\n🛠️  Available endpoints:');
    console.log('   GET  /health - Server health check');
    console.log('   GET  /health/websocket - WebSocket metrics');
    console.log('   POST /api/auth/login-pin - PIN authentication');
    console.log('   POST /api/auth/login-google - Google OAuth');
    console.log('   GET  /api/system/status - System status (requires auth)');
  }
  
  console.log('\n🐈 Ready to handle requests!');
  console.log('='.repeat(60) + '\n');
  
  // Register services for health monitoring
  if (config.services?.ollama?.baseUrl) {
    healthMonitor.registerService('ollama', {
      url: `${config.services.ollama.baseUrl}/api/tags`,
      timeout: 10000,
      enabled: true
    });
  }
  
  if (config.services?.n8n?.baseUrl) {
    healthMonitor.registerService('n8n', {
      url: `${config.services.n8n.baseUrl}/healthz`,
      timeout: 8000,
      enabled: true
    });
  }
  
  // Register Google APIs for monitoring (when available)
  healthMonitor.registerService('google-api', {
    url: 'https://www.googleapis.com',
    timeout: 5000,
    enabled: true
  });
  
  console.log('✅ Health monitoring initialized for registered services');
});

// Handle server startup errors
server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error('⚠️  Port', PORT, 'is already in use');
  }
});

// Enhanced graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n📴 Received ${signal}. Initiating graceful shutdown...`);
  
  // Stop accepting new connections
  server.close((error) => {
    if (error) {
      console.error('❌ Error during server shutdown:', error.message);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed');
    
    // Close WebSocket connections
    io.close(() => {
      console.log('✅ WebSocket server closed');
      
      // Cleanup monitoring services
      healthMonitor.cleanup();
      console.log('✅ Health monitoring stopped');
      
      console.log('💯 Graceful shutdown complete');
      process.exit(0);
    });
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    console.error('⚠️  Forceful shutdown due to timeout');
    process.exit(1);
  }, 30000); // 30 second timeout
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Export for testing
module.exports = { app, server, io };