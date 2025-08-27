import React, { createContext, useContext, useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sessionTimeout, setSessionTimeout] = useState(null);

  // Configuration
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const PIN_STORAGE_KEY = 'dashboard_pin_hash';
  const SESSION_STORAGE_KEY = 'dashboard_session';
  const REMEMBER_DEVICE_KEY = 'dashboard_remember_device';

  // Initialize authentication state on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  // Set up activity listeners for auto-lock
  useEffect(() => {
    if (isAuthenticated) {
      setupActivityListeners();
      resetInactivityTimer();
    } else {
      clearInactivityTimer();
    }

    return () => {
      clearInactivityTimer();
      removeActivityListeners();
    };
  }, [isAuthenticated]);

  const checkAuthState = () => {
    try {
      const session = localStorage.getItem(SESSION_STORAGE_KEY);
      const rememberDevice = localStorage.getItem(REMEMBER_DEVICE_KEY);
      
      if (session) {
        const sessionData = JSON.parse(session);
        const now = Date.now();
        
        // Check if session is still valid
        if (sessionData.expiresAt > now) {
          setIsAuthenticated(true);
          setUser({ sessionId: sessionData.sessionId });
        } else {
          // Session expired, clear it
          clearSession();
        }
      } else if (rememberDevice === 'true') {
        // Device is remembered, but session expired - just need PIN
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const setupActivityListeners = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });
  };

  const removeActivityListeners = () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.removeEventListener(event, resetInactivityTimer, true);
    });
  };

  const resetInactivityTimer = () => {
    clearInactivityTimer();
    
    const timeout = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
    
    setSessionTimeout(timeout);
  };

  const clearInactivityTimer = () => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
  };

  const hashPin = async (pin) => {
    const saltRounds = 10;
    return await bcrypt.hash(pin, saltRounds);
  };

  const verifyPin = async (pin, hash) => {
    return await bcrypt.compare(pin, hash);
  };

  const createSession = (rememberDevice = false) => {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const sessionData = {
      sessionId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    
    if (rememberDevice) {
      localStorage.setItem(REMEMBER_DEVICE_KEY, 'true');
    }

    return sessionData;
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_DEVICE_KEY);
    setIsAuthenticated(false);
    setUser(null);
  };

  const login = async (pin, rememberDevice = false) => {
    try {
      setIsLoading(true);
      
      const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
      
      if (!storedHash) {
        throw new Error('No PIN configured. Please set up your PIN first.');
      }

      const isValid = await verifyPin(pin, storedHash);
      
      if (!isValid) {
        throw new Error('Invalid PIN');
      }

      const sessionData = createSession(rememberDevice);
      setIsAuthenticated(true);
      setUser({ sessionId: sessionData.sessionId });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    clearInactivityTimer();
    removeActivityListeners();
  };

  const setupPin = async (pin) => {
    try {
      setIsLoading(true);
      const hashedPin = await hashPin(pin);
      localStorage.setItem(PIN_STORAGE_KEY, hashedPin);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const changePin = async (currentPin, newPin) => {
    try {
      setIsLoading(true);
      
      const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
      
      if (!storedHash) {
        throw new Error('No PIN configured');
      }

      const isCurrentValid = await verifyPin(currentPin, storedHash);
      
      if (!isCurrentValid) {
        throw new Error('Current PIN is incorrect');
      }

      const newHashedPin = await hashPin(newPin);
      localStorage.setItem(PIN_STORAGE_KEY, newHashedPin);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const isPinConfigured = () => {
    return !!localStorage.getItem(PIN_STORAGE_KEY);
  };

  const isDeviceRemembered = () => {
    return localStorage.getItem(REMEMBER_DEVICE_KEY) === 'true';
  };

  // Emergency bypass for testing (only in development)
  const emergencyBypass = () => {
    if (process.env.NODE_ENV === 'development') {
      const sessionData = createSession(false);
      setIsAuthenticated(true);
      setUser({ sessionId: sessionData.sessionId, isEmergency: true });
      console.warn('Emergency bypass activated - for development only');
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    setupPin,
    changePin,
    isPinConfigured,
    isDeviceRemembered,
    emergencyBypass
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};