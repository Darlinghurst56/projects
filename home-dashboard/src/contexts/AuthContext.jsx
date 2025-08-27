import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isGuest: true,
        isLoading: false,
        error: action.payload,
      };
    case 'SET_GUEST_MODE':
      return {
        ...state,
        user: { id: 'guest', name: 'Guest User', method: 'guest' },
        token: null,
        isAuthenticated: false,
        isGuest: true,
        isLoading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isGuest: true,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          const user = await authApi.validateToken(token);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token },
          });
        } catch (error) {
          localStorage.removeItem('authToken');
          dispatch({ type: 'SET_GUEST_MODE' });
        }
      } else {
        dispatch({ type: 'SET_GUEST_MODE' });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials, method = 'google') => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      let response;
      if (method === 'google') {
        response = await authApi.loginWithGoogle(credentials.token);
      } else if (method === 'pin') {
        response = await authApi.loginWithPin(credentials.pin, credentials.name);
      } else {
        throw new Error('Invalid authentication method');
      }
      
      localStorage.setItem('authToken', response.token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
      
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message || 'Login failed',
      });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const setGuestMode = useCallback(() => {
    dispatch({ type: 'SET_GUEST_MODE' });
  }, []);

  const value = useMemo(() => ({
    ...state,
    authMethod: state.user?.method || 'guest',
    login,
    logout,
    clearError,
    setGuestMode,
  }), [state, login, logout, clearError, setGuestMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};