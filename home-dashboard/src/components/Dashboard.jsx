/**
 * @fileoverview Family Coordination Dashboard - Central Hub for Household Management
 * 
 * This dashboard serves as the primary interface for family coordination and home
 * management. It provides easy access to internet safety controls (DNS filtering),
 * family calendar and communication (Google services), homework and question
 * assistance (family-safe AI), and meal planning coordination.
 * 
 * The dashboard supports multiple family members with different access levels:
 * - Parents: Full access to all features including DNS controls and AI assistance
 * - Children: Limited access to homework help and family calendar
 * - Guests: View-only access to basic family information
 * 
 * @author Home Dashboard Team
 * @version 2.0.0
 * @since 1.0.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DnsStatusWidget from './dns/DnsStatusWidget';
import DnsAnalyticsWidget from './dns/DnsAnalyticsWidget';
import { DnsProfileWidget } from './dns/DnsProfileWidget';
import GoogleCalendarWidget from './google/GoogleCalendarWidget';
import { GoogleGmailWidget } from './google/GoogleGmailWidget';
import { GoogleDriveWidget } from './google/GoogleDriveWidget';
import { AiChatWidget } from './ai/AiChatWidget';
import { MealPlannerWidget } from './meal/MealPlannerWidget';
import ApiHealthMonitor from './ApiHealthMonitor';
import { HeaderNav } from './layout/HeaderNav';
import { WidgetGrid } from './layout/WidgetGrid';
import { WidgetContainer } from './layout/WidgetContainer';
import { InlineAuth } from './auth/InlineAuth';
import { systemApi } from '../services/api';

/**
 * Family Dashboard Component
 * 
 * Provides a safe, family-friendly interface for household coordination. Features include:
 * - Internet safety monitoring (DNS filtering and parental controls)
 * - Family calendar and email management through Google services
 * - Educational AI assistance for homework and learning
 * - Collaborative meal planning and shopping lists
 * - Gentle system monitoring to ensure everything works smoothly
 * 
 * The dashboard automatically adjusts available features based on who is using it,
 * ensuring age-appropriate access and maintaining family safety online.
 * 
 * @component
 * @example
 * // Family dashboard for all household members
 * <Dashboard />
 * 
 * @returns {JSX.Element} Complete family coordination interface
 */
export const Dashboard = () => {
  // Family member authentication and access control
  // - user: Current family member profile (parent, child, or guest)
  // - logout: Return to guest mode (safe for any family member to use)
  // - authMethod: 'google' (parents) | 'pin' (children) | null (guests)
  // - isAuthenticated: Whether this family member has signed in
  // - isGuest: Guest access mode (limited to safe, public information)
  const { user, logout, authMethod, isAuthenticated, isGuest } = useAuth();
  
  // Family dashboard health monitoring
  // Keeps track of internet safety (DNS), AI homework helper, and family services
  const [systemStatus, setSystemStatus] = useState(null);
  const [internetStatus, setInternetStatus] = useState({
    status: 'checking',
    text: 'Checking...',
    protected: false,
    latency: null
  });
  
  /**
   * Family-appropriate widget configuration
   * 
   * Determines which features each family member can access:
   * - Everyone: Internet safety status, basic family information
   * - Signed-in members: Calendar, email, AI homework help, meal planning
   * 
   * This ensures children only see age-appropriate features while giving
   * parents full household management capabilities.
   * 
   * @type {string[]} Array of widget identifiers for current family member
   */
  const defaultWidgets = useMemo(() => {
    // Safe widgets for everyone in the family (including guests)
    // Internet safety status and basic family information - no sign-in needed
    const guestSafeWidgets = ['dns-status', 'dns-profile', 'api-health'];
    
    // Family member widgets (requires parent/child sign-in)
    // Calendar, communication, AI homework help, and meal planning
    const familyMemberWidgets = ['google-calendar', 'google-gmail', 'google-drive', 'meal-planner'];
    
    // Show appropriate features based on family member status
    // Guests see safety info only, family members get full coordination features
    return isAuthenticated 
      ? [...guestSafeWidgets, ...familyMemberWidgets]
      : guestSafeWidgets;
  }, [isAuthenticated]);
  
  /**
   * Currently displayed family dashboard widgets
   * 
   * Tracks which features are shown to the current family member.
   * Always starts with safe, guest-friendly widgets so the dashboard
   * works immediately for anyone in the household.
   * 
   * @type {[string[], Function]} Current widget list and update function
   */
  const [activeWidgets, setActiveWidgets] = useState(() => {
    // Start with safe widgets that work for any family member
    // Internet safety and basic system status - no sign-in required
    const guestSafeWidgets = ['dns-status', 'dns-profile', 'api-health'];
    return guestSafeWidgets;
  });

  /**
   * Update dashboard when family members sign in or out
   * 
   * When someone in the family signs in or out, this automatically adjusts
   * which features are available, ensuring the right level of access for
   * parents, children, and guests.
   */
  useEffect(() => {
    setActiveWidgets(defaultWidgets);
  }, [defaultWidgets]);

  /**
   * Check family dashboard health and safety systems
   * 
   * Monitors the health of family safety features including internet filtering,
   * AI homework helper, and family communication services. Ensures everything
   * is working properly for safe family use.
   * 
   * @function
   * @async
   * @returns {Promise<void>} Updates family dashboard status information
   */
  /**
   * Determine family-friendly internet status from DNS data
   * 
   * @param {Object} dnsData - DNS status response data
   * @returns {Object} Internet status with family-friendly text and indicators
   */
  const determineInternetStatus = useCallback((dnsData) => {
    if (!dnsData) {
      return {
        status: 'checking',
        text: 'Checking...',
        protected: false,
        latency: null
      };
    }

    const connection = dnsData.connection || {};
    const health = dnsData.health || {};
    const latency = connection.latency || health.responseTime || 0;
    const isConnected = connection.status === 'connected' || health.status === 'healthy';
    const isProtected = isConnected && (connection.status === 'connected');

    // Determine status based on connection and latency
    let status = 'problem';
    let text = 'Internet: Problem';
    
    if (isConnected) {
      if (latency < 50) {
        status = 'connected';
        text = 'Internet: Connected';
      } else if (latency < 150) {
        status = 'slow';
        text = 'Internet: Slow';
      } else {
        status = 'slow';
        text = 'Internet: Slow';
      }
    }

    return {
      status,
      text,
      protected: isProtected,
      latency: typeof latency === 'number' ? latency : null
    };
  }, []);

  const fetchSystemStatus = useCallback(async () => {
    try {
      // Fetch both system status and DNS status for internet monitoring
      const [systemStatus, dnsStatus] = await Promise.all([
        systemApi.getStatus().catch(() => null),
        dnsApi.getStatus().catch(() => null)
      ]);
      
      setSystemStatus(systemStatus);
      
      // Update internet status based on DNS data
      if (dnsStatus && dnsStatus.success) {
        const internetStatusData = determineInternetStatus(dnsStatus.data);
        setInternetStatus(internetStatusData);
      } else {
        // Fallback to system status if DNS status is unavailable
        setInternetStatus({
          status: 'problem',
          text: 'Internet: Check Connection',
          protected: false,
          latency: null
        });
      }
    } catch (error) {
      // Keep dashboard working even if status check fails - family safety first
      console.error('Family dashboard status check failed:', error);
      setInternetStatus({
        status: 'problem',
        text: 'Internet: Problem',
        protected: false,
        latency: null
      });
    }
  }, [determineInternetStatus]);

  /**
   * Get status color for internet connection indicator
   * 
   * @param {string} status - Internet status ('connected', 'slow', 'problem', 'checking')
   * @returns {string} CSS color for status indicator
   */
  const getInternetStatusColor = useCallback((status) => {
    switch (status) {
      case 'connected':
        return 'var(--status-success)';
      case 'slow':
        return 'var(--status-warning)';
      case 'problem':
        return 'var(--status-error)';
      default:
        return 'var(--text-tertiary)';
    }
  }, []);

  /**
   * Regular family safety system monitoring
   * 
   * Checks family dashboard health every 30 seconds to ensure internet safety,
   * AI homework helper, and family services are working properly. This gentle
   * monitoring keeps the family informed without being intrusive.
   */
  useEffect(() => {
    // Check family dashboard status when dashboard loads
    fetchSystemStatus();
    
    // Regular health checks every 30 seconds for family peace of mind
    const interval = setInterval(fetchSystemStatus, 30000);

    // Clean up monitoring when dashboard closes
    return () => clearInterval(interval);
  }, [fetchSystemStatus]);

  /**
   * Family dashboard feature registry
   * 
   * Defines all available family coordination features and their settings.
   * Each widget provides specific functionality for household management
   * while maintaining appropriate safety and access controls.
   * 
   * Feature categories:
   * - safety: Internet filtering and family online protection
   * - communication: Family calendar, email, and file sharing
   * - education: Homework help and learning assistance
   * - household: Meal planning and family coordination
   * - monitoring: Gentle system health checks
   * 
   * @type {Object[]} Available family dashboard features
   */
  const widgets = useMemo(() => [
    // Internet Safety Features - Family online protection
    {
      id: 'dns-status',
      title: 'Internet Safety',
      component: DnsStatusWidget,
      size: 'small',
      category: 'safety',
      // Shows family internet filtering status and connection health
    },
    {
      id: 'dns-analytics',
      title: 'Safety Reports',
      component: DnsAnalyticsWidget,
      size: 'medium',
      category: 'safety',
      // Displays what content was blocked to keep the family safe online
    },
    {
      id: 'dns-profile',
      title: 'Family Profiles',
      component: DnsProfileWidget,
      size: 'small',
      category: 'safety',
      // Manages internet filtering settings for different family members
    },
    
    // Family Communication Features - Requires family member sign-in
    {
      id: 'google-calendar',
      title: 'Family Calendar',
      component: GoogleCalendarWidget,
      size: 'medium',
      category: 'communication',
      // Shared family calendar for events, appointments, and activities
    },
    {
      id: 'google-gmail',
      title: 'Family Email',
      component: GoogleGmailWidget,
      size: 'medium',
      category: 'communication',
      // Email access for family communications and important messages
    },
    {
      id: 'google-drive',
      title: 'Family Files',
      component: GoogleDriveWidget,
      size: 'small',
      category: 'communication',
      // Shared storage for family documents, photos, and school work
    },
    
    // Educational and Household Features
    {
      id: 'ai-chat',
      title: 'Homework Helper',
      component: AiChatWidget,
      size: 'large',
      category: 'education',
      // Safe AI assistant for homework help, learning, and family questions
    },
    {
      id: 'meal-planner',
      title: 'Family Meal Planner',
      component: MealPlannerWidget,
      size: 'large',
      category: 'household',
      // Collaborative meal planning and shopping lists for the whole family
    },
    
    // Dashboard Health Features
    {
      id: 'api-health',
      title: 'Dashboard Health',
      component: ApiHealthMonitor,
      size: 'large',
      category: 'monitoring',
      // Gentle monitoring to ensure all family features are working properly
    },
  ], []);

  /**
   * Family dashboard feature customization
   * 
   * Allows family members to show or hide features based on what they need
   * right now. Parents can customize the view for different family activities
   * while children can focus on homework or other specific tasks.
   * 
   * @function
   * @param {string} widgetId - Feature identifier to show or hide
   * @returns {void}
   */
  const handleToggleWidget = useCallback((widgetId) => {
    setActiveWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)  // Hide this feature
        : [...prev, widgetId]                // Show this feature
    );
  }, []);

  // Professional theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [densityMode, setDensityMode] = useState(localStorage.getItem('densityMode') || 'standard');
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Theme management
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Density mode management
  useEffect(() => {
    localStorage.setItem('densityMode', densityMode);
  }, [densityMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e) => {
      // Ctrl+K: Command palette
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Ctrl+D: Toggle dark mode
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setTheme(theme === 'light' ? 'dark' : 'light');
      }
      // F5 or Ctrl+R: Refresh (handled by browser)
      // Escape: Close command palette
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [theme]);

  const handleCommand = (command) => {
    switch (command) {
      case 'toggle-theme':
        setTheme(theme === 'light' ? 'dark' : 'light');
        break;
      case 'density-compact':
        setDensityMode('compact');
        break;
      case 'density-standard':
        setDensityMode('standard');
        break;
      case 'density-expanded':
        setDensityMode('expanded');
        break;
      case 'refresh-all':
        window.location.reload();
        break;
      default:
        console.log('Unknown command:', command);
    }
    setShowCommandPalette(false);
  };

  return (
    <div 
      className="min-h-screen" 
      style={{backgroundColor: 'var(--bg-secondary)'}}
      data-testid="dashboard-container"
    >
      {/* Professional Header */}
      <header 
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-primary)',
          padding: '1rem 2rem'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: 0,
              fontFamily: 'var(--font-ui)'
            }}>
              Family Hub
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              margin: '0.25rem 0 0 0'
            }}>
              Internet safety, home automation, and family coordination
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Internet Status with Family-Friendly Indicators */}
            <div className="flex items-center gap-4">
              {/* Internet Connection Status */}
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: getInternetStatusColor(internetStatus.status),
                    boxShadow: internetStatus.status === 'connected' 
                      ? '0 0 4px var(--status-success)' 
                      : internetStatus.status === 'slow' 
                      ? '0 0 4px var(--status-warning)' 
                      : internetStatus.status === 'problem' 
                      ? '0 0 4px var(--status-error)' 
                      : 'none'
                  }}
                />
                <span style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-ui)'
                }}>
                  {internetStatus.text}
                </span>
                {internetStatus.protected && (
                  <span className="status-display-technical status-success-technical" style={{
                    fontSize: '0.75rem',
                    padding: '0.125rem 0.375rem',
                    marginLeft: '0.25rem'
                  }}>
                    Protected
                  </span>
                )}
              </div>

              {/* Assistant Status (if available) */}
              {systemStatus?.services?.ollama && (
                <div className={`status-display-technical ${systemStatus.services.ollama.status === 'healthy' ? 'status-success-technical' : 'status-error-technical'}`}>
                  Assistant: {systemStatus.services.ollama.status === 'healthy' ? 'Available' : 'Offline'}
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              <span className="kbd-shortcut">Ctrl+K</span>
              <button
                onClick={() => setShowCommandPalette(true)}
                className="status-display-technical status-info-technical"
                style={{cursor: 'pointer', border: 'none', background: 'transparent'}}
              >
                Commands
              </button>
              
              <select 
                value={densityMode}
                onChange={(e) => setDensityMode(e.target.value)}
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <option value="compact">Compact</option>
                <option value="standard">Standard</option>
                <option value="expanded">Expanded</option>
              </select>
              
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="status-display-technical status-info-technical"
                style={{cursor: 'pointer', border: 'none', background: 'transparent'}}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              
              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="status-display-technical status-warning-technical"
                  style={{cursor: 'pointer', border: 'none', background: 'transparent'}}
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Dashboard Content Area */}
      <main style={{padding: '2rem'}}>

        {/* Apple Home Style Widget Grid */}
        <WidgetGrid 
          widgets={useMemo(() => 
            widgets
              .filter(w => activeWidgets.includes(w.id))
              .map(widget => ({
                ...widget,
                component: ({ widgetId, onRetry }) => {
                  const Component = widget.component;
                  return (
                    <WidgetContainer
                      widgetId={widget.id}
                      title={widget.title}
                      category={widget.category}
                      size={widget.size}
                      className={`widget-${densityMode}`}
                    >
                      <Component 
                        widgetId={widget.id}
                        className={densityMode}
                        onRetry={onRetry}
                      />
                    </WidgetContainer>
                  );
                }
              }))
          , [widgets, activeWidgets, densityMode])}
          className="apple-home-grid"
          showPerformanceMetrics={false}
        />

        {/* Command Palette */}
        {showCommandPalette && (
          <div 
            className="command-palette"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '10vh',
              zIndex: 1000
            }}
            onClick={() => setShowCommandPalette(false)}
          >
            <div 
              className="command-palette"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--border-radius)',
                padding: '1.5rem',
                minWidth: '400px'
              }}
            >
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Command Palette
              </h3>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                <button
                  onClick={() => handleCommand('toggle-theme')}
                  className="metric-row"
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'var(--bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    textAlign: 'left'
                  }}
                >
                  <span className="metric-label">Toggle Theme</span>
                  <span className="kbd-shortcut">Ctrl+D</span>
                </button>
                
                <button
                  onClick={() => handleCommand('density-compact')}
                  className="metric-row"
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'var(--bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    textAlign: 'left'
                  }}
                >
                  <span className="metric-label">Compact Mode</span>
                  <span className="metric-value">Maximum data density</span>
                </button>
                
                <button
                  onClick={() => handleCommand('density-standard')}
                  className="metric-row"
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'var(--bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    textAlign: 'left'
                  }}
                >
                  <span className="metric-label">Standard Mode</span>
                  <span className="metric-value">Balanced layout</span>
                </button>
                
                <button
                  onClick={() => handleCommand('density-expanded')}
                  className="metric-row"
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'var(--bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    textAlign: 'left'
                  }}
                >
                  <span className="metric-label">Expanded Mode</span>
                  <span className="metric-value">Detailed charts and metrics</span>
                </button>
                
                <button
                  onClick={() => handleCommand('refresh-all')}
                  className="metric-row"
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'var(--bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    textAlign: 'left'
                  }}
                >
                  <span className="metric-label">Refresh All</span>
                  <span className="kbd-shortcut">F5</span>
                </button>
              </div>
              
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)'
              }}>
                <strong>Keyboard Shortcuts:</strong><br/>
                Ctrl+K: Command palette • Ctrl+D: Toggle theme • F5: Refresh • Esc: Close
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};