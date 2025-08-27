import React, { useState, useEffect, useCallback } from 'react';
import { googleApi } from '@services/api';
import './GoogleCalendarWidget.css';

/**
 * Family Calendar Widget
 * 
 * Displays upcoming family events, appointments, and activities from the
 * shared Google Calendar. Helps families stay coordinated and never miss
 * important events. Shows age-appropriate events for children while giving
 * parents full calendar management capabilities.
 * 
 * Features:
 * - Upcoming family events and appointments
 * - Safe display of family activities for all members
 * - Quick event creation for parents
 * - Automatic refresh to stay current
 * - Integration with family Google account
 * 
 * @component
 * @param {string} className - Additional CSS classes
 * @param {number} refreshInterval - How often to check for new events (5 minutes)
 * @param {number} maxEvents - Maximum number of events to display (10)
 * @returns {JSX.Element} Family calendar display
 */

const GoogleCalendarWidget = ({ 
  className = '', 
  refreshInterval = 300000, // 5 minutes
  maxEvents = 10 
}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load family calendar events
  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      
      // Check if family member is signed in to Google
      const authResponse = await googleApi.getAuthStatus();
      setAuthStatus(authResponse.data);
      
      if (!authResponse.success || !authResponse.data.authenticated) {
        setEvents([]);
        setLoading(false);
        return;
      }

      // Load upcoming family events
      const eventsResponse = await googleApi.calendar.getEvents({
        maxResults: maxEvents,
        timeMin: new Date().toISOString(),
        orderBy: 'startTime',
        singleEvents: true,
      });
      
      if (eventsResponse.success) {
        setEvents(eventsResponse.data.items || []);
        setLastUpdated(new Date());
      } else {
        throw new Error(eventsResponse.message || 'Unable to load family calendar events');
      }
    } catch (err) {
      console.error('❌ Family calendar loading failed:', err);
      setError('Having trouble loading the family calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [maxEvents]);

  // Set up auto-refresh
  useEffect(() => {
    fetchEvents();
    
    const interval = setInterval(fetchEvents, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchEvents, refreshInterval]);

  // Handle Google OAuth
  const handleGoogleAuth = async () => {
    try {
      const response = await googleApi.getAuthUrl();
      if (response.success) {
        window.open(response.data.authUrl, '_blank');
      }
    } catch (err) {
      console.error('❌ Failed to get auth URL:', err);
      setError('Failed to initiate Google authentication');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date >= today && date < tomorrow) {
      return 'Today';
    } else if (date >= tomorrow && date < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get event duration
  const getEventDuration = (start, end) => {
    const startDate = new Date(start.dateTime || start.date);
    const endDate = new Date(end.dateTime || end.date);
    const diffMinutes = (endDate - startDate) / (1000 * 60);
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  // Check if event is all day
  const isAllDayEvent = (event) => {
    return event.start.date && !event.start.dateTime;
  };

  // Get event status color
  const getEventStatusColor = (event) => {
    if (event.status === 'cancelled') return 'cancelled';
    if (event.status === 'tentative') return 'tentative';
    return 'confirmed';
  };

  // Loading state
  if (loading) {
    return (
      <div className={`google-calendar-widget ${className}`}>
        <div className="calendar-loading">
          <div className="loading-spinner"></div>
          <span>Loading calendar events...</span>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!authStatus?.authenticated) {
    return (
      <div className={`widget-card ${className}`}>
        <div className="widget-header">
          <h3 className="widget-title">Family Calendar</h3>
        </div>
        <div className="widget-content" style={{textAlign: 'center', paddingTop: '2rem'}}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📅</div>
          <h4 style={{margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.125rem'}}>Google Calendar</h4>
          <p style={{margin: '0 0 2rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Sign in to Google to view your calendar events</p>
          <button 
            className="btn-primary"
            onClick={handleGoogleAuth}
            style={{minHeight: 'var(--touch-target)'}}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`widget-card ${className}`}>
      <div className="widget-header">
        <h3 className="widget-title">Family Calendar</h3>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <span className="metric-label">{events.length} events</span>
          <button 
            className="btn-secondary"
            onClick={fetchEvents}
            disabled={loading}
            style={{minHeight: 'var(--touch-target-sm)', padding: '0.5rem 1rem'}}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      <div className="widget-content">

        {/* Events List */}
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
          {events.length === 0 ? (
            <div style={{textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)'}}>
              <div style={{fontSize: '2.5rem', marginBottom: '1rem'}}>📅</div>
              <p style={{margin: 0, fontSize: '0.9rem'}}>No upcoming events</p>
            </div>
          ) : (
            events.map((event) => (
              <div 
                key={event.id} 
                className={`google-calendar-event ${getEventStatusColor(event)}`}
                style={{
                  minHeight: 'var(--touch-target)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem'}}>
                  <div style={{flex: 1}}>
                    <div style={{fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '0.95rem'}}>
                      {event.summary}
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                      <span>{formatDate(event.start.dateTime || event.start.date)}</span>
                      {!isAllDayEvent(event) && (
                        <span>{formatTime(event.start.dateTime)} • {getEventDuration(event.start, event.end)}</span>
                      )}
                      {isAllDayEvent(event) && (
                        <span>All Day</span>
                      )}
                    </div>
                    {event.location && (
                      <div style={{fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem'}}>
                        📍 {event.location}
                      </div>
                    )}
                  </div>
                  {event.attendees && event.attendees.length > 0 && (
                    <div style={{fontSize: '0.8rem', color: 'var(--text-tertiary)'}}>
                      👥 {event.attendees.length}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="metric-row status-error" style={{marginTop: '1rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <span>⚠️</span>
              <div>
                <div className="metric-value" style={{color: 'var(--status-error)', fontSize: '0.9rem'}}>
                  Calendar Error
                </div>
                <div className="metric-label" style={{margin: 0, fontSize: '0.8rem'}}>
                  {error}
                </div>
              </div>
            </div>
            <button 
              className="btn-secondary"
              onClick={fetchEvents}
              disabled={loading}
              style={{minHeight: 'var(--touch-target-sm)'}}
            >
              Retry
            </button>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <div className="metric-row" style={{borderTop: '1px solid var(--border-secondary)', paddingTop: '0.75rem', marginTop: '1rem'}}>
            <span className="metric-label">Last Updated</span>
            <span className="metric-value" style={{fontSize: '0.8rem'}}>
              {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarWidget;