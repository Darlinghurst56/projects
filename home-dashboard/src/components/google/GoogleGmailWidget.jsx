import React, { useState, useEffect } from 'react';
import { googleApi } from '../../services/api';

export const GoogleGmailWidget = ({ className = '' }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await googleApi.gmail.getMessages();
        setMessages(response.messages || []);
        setError(null);
      } catch (err) {
        console.error('Gmail API error:', err);
        setError(err.message || 'Failed to fetch emails');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className={`gmail-widget ${className}`}>
        <div className="widget-header">
          <h3>📧 Gmail</h3>
          <span className="status loading">Loading...</span>
        </div>
        <div className="widget-content">
          <div className="loading-spinner">Loading emails...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`gmail-widget ${className}`}>
        <div className="widget-header">
          <h3>📧 Gmail</h3>
          <span className="status error">Error</span>
        </div>
        <div className="widget-content">
          <div className="error-message">
            <p>❌ {error}</p>
            <small>Check your Google API configuration</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`gmail-widget ${className}`}>
      <div className="widget-header">
        <h3>📧 Gmail</h3>
        <span className="status success">{messages.length} messages</span>
      </div>
      <div className="widget-content">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>📭 No new messages</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.slice(0, 10).map((message, index) => (
              <div key={message.id || index} className="message-item">
                <div className="message-header">
                  <span className="sender">{message.from || 'Unknown'}</span>
                  <span className="date">{formatDate(message.date)}</span>
                </div>
                <div className="message-subject">
                  {message.subject || 'No subject'}
                </div>
                <div className="message-snippet">
                  {truncateText(message.snippet)}
                </div>
              </div>
            ))}
            {messages.length > 10 && (
              <div className="more-messages">
                <small>... and {messages.length - 10} more messages</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};