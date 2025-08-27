import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';

// Use direct URL to avoid config import issues during build
const WEBSOCKET_URL = 'http://localhost';

// Connection quality metrics
const CONNECTION_QUALITY = {
  EXCELLENT: 'excellent', // < 50ms latency
  GOOD: 'good',          // 50-150ms latency
  FAIR: 'fair',          // 150-300ms latency
  POOR: 'poor'           // > 300ms latency
};

// Exponential backoff configuration optimized for single-user home environment
const BACKOFF_CONFIG = {
  initialDelay: 2000,    // 2 seconds - less aggressive for single user
  maxDelay: 60000,       // 60 seconds - longer max delay acceptable
  multiplier: 1.3,       // Slower exponential growth for home stability
  maxAttempts: 10,       // Limit attempts for single user environment
  jitter: false          // No jitter needed for single user (no thundering herd)
};

// Heartbeat configuration optimized for single-user home environment
const HEARTBEAT_CONFIG = {
  interval: 45000,       // 45 seconds - less aggressive for single user
  timeout: 10000,        // 10 seconds - more tolerant for home network
  maxMissed: 2           // Fewer attempts needed for single user
};

/**
 * Enhanced WebSocket hook with production-ready optimizations
 * Features:
 * - Exponential backoff reconnection
 * - Connection quality monitoring
 * - Heartbeat mechanism
 * - Memory leak prevention
 * - Session persistence
 * - Mobile-optimized reconnection
 */
export const useWebSocket = (namespace = '/', options = {}) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [connectionQuality, setConnectionQuality] = useState(CONNECTION_QUALITY.GOOD);
  const [latency, setLatency] = useState(0);
  
  // Refs for persistent data
  const socketRef = useRef(null);
  const subscribedRoomsRef = useRef(new Set());
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);
  const missedHeartbeatsRef = useRef(0);
  const lastPingTimestampRef = useRef(0);
  const eventListenersRef = useRef(new Map());
  
  // Stable options to prevent unnecessary effect re-runs
  const stableOptions = useMemo(() => ({
    url: options.url || WEBSOCKET_URL,
    transports: options.transports || ['websocket'],
    autoConnect: options.autoConnect !== false,
    forceNew: options.forceNew || false,
    upgrade: options.upgrade !== false,
    timeout: options.timeout || 20000,
    ...options
  }), [options.url, options.transports, options.autoConnect, options.forceNew, options.upgrade, options.timeout]);

  // Calculate exponential backoff delay with jitter
  const getBackoffDelay = useCallback(() => {
    const attempt = reconnectAttemptsRef.current;
    let delay = Math.min(
      BACKOFF_CONFIG.initialDelay * Math.pow(BACKOFF_CONFIG.multiplier, attempt),
      BACKOFF_CONFIG.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    if (BACKOFF_CONFIG.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }, []);

  // Connection quality assessment based on latency
  const assessConnectionQuality = useCallback((latencyMs) => {
    if (latencyMs < 50) return CONNECTION_QUALITY.EXCELLENT;
    if (latencyMs < 150) return CONNECTION_QUALITY.GOOD;
    if (latencyMs < 300) return CONNECTION_QUALITY.FAIR;
    return CONNECTION_QUALITY.POOR;
  }, []);

  // Heartbeat mechanism
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.connected) {
        lastPingTimestampRef.current = Date.now();
        socketRef.current.emit('ping', lastPingTimestampRef.current);
        
        // Set timeout for pong response
        heartbeatTimeoutRef.current = setTimeout(() => {
          missedHeartbeatsRef.current++;
          console.warn(`Missed heartbeat ${missedHeartbeatsRef.current}/${HEARTBEAT_CONFIG.maxMissed}`);
          
          if (missedHeartbeatsRef.current >= HEARTBEAT_CONFIG.maxMissed) {
            console.error('Too many missed heartbeats, disconnecting');
            socketRef.current?.disconnect();
          }
        }, HEARTBEAT_CONFIG.timeout);
      }
    }, HEARTBEAT_CONFIG.interval);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // Enhanced cleanup function
  const cleanup = useCallback(() => {
    stopHeartbeat();
    subscribedRoomsRef.current.clear();
    eventListenersRef.current.clear();
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [stopHeartbeat]);

  // Initialize socket connection
  useEffect(() => {
    let reconnectTimeoutId = null;
    
    const createConnection = () => {
      if (socketRef.current) {
        cleanup();
      }

      setConnecting(true);
      
      const socket = io(stableOptions.url + namespace, {
        ...stableOptions,
        reconnection: false // We handle reconnection manually
      });

      socketRef.current = socket;

      // Connection success
      socket.on('connect', () => {
        console.log('✅ WebSocket connected:', socket.id);
        setConnected(true);
        setConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        missedHeartbeatsRef.current = 0;

        // Start heartbeat monitoring
        startHeartbeat();

        // Re-subscribe to rooms after reconnection
        subscribedRoomsRef.current.forEach(room => {
          socket.emit(`subscribe:${room}`);
        });

        // Authenticate if token exists
        const token = localStorage.getItem('authToken');
        if (token) {
          socket.emit('authenticate', token);
        }

        // Store connection timestamp for session persistence
        sessionStorage.setItem('ws_connected_at', Date.now().toString());
      });

      // Handle pong responses for latency measurement
      socket.on('pong', (timestamp) => {
        const currentLatency = Date.now() - timestamp;
        setLatency(currentLatency);
        setConnectionQuality(assessConnectionQuality(currentLatency));
        
        // Clear missed heartbeat timeout
        if (heartbeatTimeoutRef.current) {
          clearTimeout(heartbeatTimeoutRef.current);
          heartbeatTimeoutRef.current = null;
        }
        missedHeartbeatsRef.current = 0;
      });

      // Connection lost
      socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        setConnected(false);
        setConnecting(false);
        stopHeartbeat();
        
        // Don't auto-reconnect if disconnection was intentional
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
          scheduleReconnect();
        }
      });

      // Connection errors
      socket.on('connect_error', (err) => {
        console.error('❌ WebSocket connection error:', err.message);
        setError(err.message);
        setConnected(false);
        setConnecting(false);
        scheduleReconnect();
      });

      // Mobile-specific: Handle app lifecycle events and network changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !socket.connected) {
          console.log('📱 App became visible, restoring normal heartbeat');
          reconnectAttemptsRef.current = 0; // Reset attempts for immediate reconnection
          // Restore normal heartbeat interval for single user
          if (socket.connected) {
            stopHeartbeat();
            startHeartbeat();
          } else {
            createConnection();
          }
        } else if (document.visibilityState === 'hidden') {
          console.log('📱 App hidden, reducing heartbeat frequency');
          // Implement reduced heartbeat for single-user when app is hidden
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          // Reduce heartbeat frequency to 2 minutes when hidden (single user optimization)
          heartbeatIntervalRef.current = setInterval(() => {
            if (socketRef.current && socketRef.current.connected) {
              lastPingTimestampRef.current = Date.now();
              socketRef.current.emit('ping', lastPingTimestampRef.current);
            }
          }, 120000); // 2 minutes
        }
        }
      };

      const handleOnline = () => {
        console.log('🌐 Network back online, attempting reconnection');
        reconnectAttemptsRef.current = 0; // Reset attempts for immediate reconnection
        if (!socket.connected) {
          createConnection();
        }
      };

      const handleOffline = () => {
        console.log('🌐 Network offline, pausing reconnection attempts');
        if (reconnectTimeoutId) {
          clearTimeout(reconnectTimeoutId);
          reconnectTimeoutId = null;
        }
      };

      // iOS Safari: Handle page cache (back/forward cache)
      const handlePageShow = (event) => {
        if (event.persisted && !socket.connected) {
          console.log('📱 Page restored from cache, reconnecting');
          reconnectAttemptsRef.current = 0;
          createConnection();
        }
      };

      // Add event listeners with mobile optimizations
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('pageshow', handlePageShow);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('pageshow', handlePageShow);
      };
    };

    const scheduleReconnect = () => {
      if (reconnectAttemptsRef.current >= BACKOFF_CONFIG.maxAttempts) {
        console.error('Max reconnection attempts reached');
        return;
      }

      const delay = getBackoffDelay();
      reconnectAttemptsRef.current++;
      
      console.log(`🔄 Scheduling reconnection attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
      
      reconnectTimeoutId = setTimeout(() => {
        createConnection();
      }, delay);
    };

    // Initial connection
    createConnection();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutId) {
        clearTimeout(reconnectTimeoutId);
      }
      cleanup();
    };
  }, [namespace, stableOptions, getBackoffDelay, assessConnectionQuality, startHeartbeat, stopHeartbeat, cleanup]);

  // Optimized subscription management
  const subscribe = useCallback((room) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(`subscribe:${room}`);
      subscribedRoomsRef.current.add(room);
      console.log('📡 Subscribed to room:', room);
    } else {
      // Queue subscription for when connection is restored
      subscribedRoomsRef.current.add(room);
      console.log('📡 Queued subscription for room:', room);
    }
  }, []);

  const unsubscribe = useCallback((room) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(`unsubscribe:${room}`);
    }
    subscribedRoomsRef.current.delete(room);
    console.log('📡 Unsubscribed from room:', room);
  }, []);

  // Enhanced event handling with memory leak prevention
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      
      // Track listeners for cleanup
      if (!eventListenersRef.current.has(event)) {
        eventListenersRef.current.set(event, new Set());
      }
      eventListenersRef.current.get(event).add(callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
      
      // Remove from tracking
      const listeners = eventListenersRef.current.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          eventListenersRef.current.delete(event);
        }
      }
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    console.warn('Cannot emit event, socket not connected:', event);
    return false;
  }, []);

  // Force reconnection (useful for retry buttons)
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  return {
    socket: socketRef.current,
    connected,
    connecting,
    error,
    connectionQuality,
    latency,
    subscribe,
    unsubscribe,
    on,
    off,
    emit,
    reconnect
  };
};

/**
 * Optimized DNS WebSocket hook for single-user home environment
 * Uses memoization, stable callbacks, and single-user optimizations
 */
export const useDnsWebSocket = (onStatusUpdate, onAnalyticsUpdate) => {
  const { connected, connectionQuality, latency, subscribe, on, off, unsubscribe } = useWebSocket();
  const hasSubscribedRef = useRef(false);
  const lastUpdateRef = useRef({ status: null, analytics: null });
  
  // Stable callback references with single-user debouncing to prevent effect re-runs
  const stableStatusCallback = useCallback((data) => {
    // Simple debouncing for single-user environment - avoid duplicate updates
    if (onStatusUpdate && typeof onStatusUpdate === 'function') {
      const lastStatus = lastUpdateRef.current.status;
      if (!lastStatus || JSON.stringify(lastStatus) !== JSON.stringify(data)) {
        lastUpdateRef.current.status = data;
        onStatusUpdate(data);
      }
    }
  }, [onStatusUpdate]);
  
  const stableAnalyticsCallback = useCallback((data) => {
    // Simple debouncing for single-user environment - avoid duplicate updates  
    if (onAnalyticsUpdate && typeof onAnalyticsUpdate === 'function') {
      const lastAnalytics = lastUpdateRef.current.analytics;
      if (!lastAnalytics || JSON.stringify(lastAnalytics) !== JSON.stringify(data)) {
        lastUpdateRef.current.analytics = data;
        onAnalyticsUpdate(data);
      }
    }
  }, [onAnalyticsUpdate]);

  useEffect(() => {
    if (connected && !hasSubscribedRef.current) {
      // Subscribe to DNS updates only once
      subscribe('dns');
      hasSubscribedRef.current = true;
      console.log('🔍 DNS WebSocket: Subscribed to real-time updates (single-user optimized)');

      // Set up event listeners with stable callbacks
      on('dns-status', stableStatusCallback);
      on('dns-analytics', stableAnalyticsCallback);

      // Cleanup function
      return () => {
        off('dns-status', stableStatusCallback);
        off('dns-analytics', stableAnalyticsCallback);
        unsubscribe('dns');
        hasSubscribedRef.current = false;
        console.log('🔍 DNS WebSocket: Cleaned up subscriptions');
      };
    }
  }, [connected, subscribe, on, off, unsubscribe, stableStatusCallback, stableAnalyticsCallback]);

  // Return connection info with quality metrics
  return { 
    connected, 
    connectionQuality, 
    latency,
    isHealthy: connectionQuality === CONNECTION_QUALITY.EXCELLENT || connectionQuality === CONNECTION_QUALITY.GOOD
  };
};