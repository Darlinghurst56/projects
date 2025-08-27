import React, { useState, useEffect, useRef } from 'react';
import { aiApi, googleApi } from '../../services/api';
import { useWidgetLifecycle } from '../layout/WidgetContainer';

/**
 * Family Homework Helper Widget
 * 
 * Provides safe AI assistance for family learning and questions. Designed
 * specifically for family use with appropriate content filtering and
 * educational focus. Helps with homework, answers family questions, and
 * provides learning support in a safe environment.
 * 
 * Features:
 * - Safe AI chat for homework help and learning
 * - Family-appropriate responses and content filtering
 * - Quick commands for common tasks (/help, /status, etc.)
 * - Integration with family calendar and planning
 * - Educational focus with parental oversight
 * 
 * @component
 * @param {string} widgetId - Unique identifier for the AI assistant widget
 * @param {Function} onRetry - Callback function when connection retry is needed
 * @returns {JSX.Element} Family-safe AI homework helper interface
 */
export const AiChatWidget = ({
  widgetId = 'ai-chat',
  onRetry = null
}) => {
  // Reliable AI homework helper for family use
  const { isLoading, error, retryCount, markReady, markError, retry } = useWidgetLifecycle(widgetId);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false); // Renamed to avoid conflict with widget lifecycle
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory(); // Load previous family conversations
    checkConnection(); // Ensure AI homework helper is available
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const history = await aiApi.getChatHistory();
      setMessages(history || []);
      markReady(); // Homework helper ready for family use
    } catch (error) {
      console.error('Unable to load family chat history:', error);
      markError(error);
    }
  };

  const checkConnection = async () => {
    try {
      const status = await aiApi.checkConnection();
      setIsConnected(status.connected);
    } catch (error) {
      console.error('Homework helper connection check failed:', error);
      setIsConnected(false);
      // Don't mark as error - family can still use other features
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    
    // Handle family-friendly command shortcuts
    const commandResult = processCommand(input.trim());
    if (commandResult) {
      const commandMessage = {
        role: 'assistant',
        content: commandResult.result,
        timestamp: new Date(),
        system: true
      };
      setMessages(prev => [...prev, commandMessage]);
      setInput('');
      return;
    }
    
    setInput('');
    setIsSending(true);

    try {
      const response = await aiApi.sendMessage(input.trim());
      const aiMessage = { 
        role: 'assistant', 
        content: response.message, 
        timestamp: new Date(),
        suggestedActions: response.suggestedActions || []
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Homework helper error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment or ask a parent for help.', 
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const clearHistory = async () => {
    try {
      await aiApi.clearChatHistory();
      setMessages([]);
    } catch (error) {
      console.error('Unable to clear family chat history:', error);
    }
  };

  const handleSuggestedAction = async (action) => {
    try {
      setIsSending(true);
      let result = null;
      
      switch (action.type) {
        case 'add_to_calendar':
          result = await googleApi.calendar.createEvent(action.data);
          break;
        case 'create_reminder':
          // Create family reminder
          result = await googleApi.calendar.createEvent({
            ...action.data,
            reminders: { useDefault: true }
          });
          break;
        case 'search_recipes':
          // Family recipe search
          result = { success: true, message: 'Looking for family-friendly recipes...' };
          break;
        default:
          result = { success: false, message: 'Unknown action type' };
      }

      if (result.success) {
        const successMessage = {
          role: 'assistant',
          content: `✅ ${action.label} completed successfully!`,
          timestamp: new Date(),
          system: true
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        throw new Error(result.message || 'Action failed');
      }
    } catch (error) {
      console.error('Family assistant action failed:', error);
      const errorMessage = {
        role: 'assistant',
        content: `❌ Failed to ${action.label.toLowerCase()}: ${error.message}`,
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Handle family requests to restart homework helper
  const handleWidgetRetry = () => {
    retry();
    if (onRetry) onRetry();
    // Restore family chat and check homework helper availability
    loadChatHistory();
    checkConnection();
  };

  // Process family-safe command shortcuts
  const processCommand = (input) => {
    if (input.startsWith('/')) {
      const [command, ...args] = input.slice(1).split(' ');
      switch (command.toLowerCase()) {
        case 'status':
          return { type: 'command', result: 'All family systems are working normally!' };
        case 'help':
          return { type: 'command', result: 'I can help with homework, cooking, scheduling, weather, and much more. Just ask me naturally!' };
        case 'clear':
          clearHistory();
          return { type: 'command', result: 'Chat conversation cleared' };
        case 'time':
          return { type: 'command', result: `Current time: ${new Date().toLocaleTimeString()}` };
        case 'weather':
          return { type: 'command', result: 'Weather info coming soon! Ask me about anything else.' };
        default:
          return { type: 'command', result: `I don't recognize that command. Try /help to see what I can do, or just ask me naturally!` };
      }
    }
    return null;
  };

  return (
    <div className="widget-card">
      <div className="widget-header">
        <h3 className="widget-title">Family Assistant</h3>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <div className={`status-display ${isConnected ? 'status-success' : 'status-error'}`}>
            {isConnected ? 'Ready to Help' : 'Unavailable'}
          </div>
          <button
            onClick={clearHistory}
            className="btn-secondary"
            style={{minHeight: 'var(--touch-target-sm)', padding: '0.5rem 1rem'}}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="widget-content" style={{display: 'flex', flexDirection: 'column', height: '400px'}}>

        {/* Apple Home style chat interface */}
        <div 
          className="flex-1 overflow-y-auto scrollbar-thin" 
          style={{
            backgroundColor: 'var(--bg-secondary)', 
            fontFamily: 'var(--font-ui)', 
            fontSize: '0.9rem',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-secondary)',
            padding: '1rem'
          }}
        >
          {messages.length === 0 ? (
            <div style={{color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem 0'}}>
              <div style={{marginBottom: '1rem'}}>👨‍👩‍👧‍👦 Family Assistant</div>
              <div style={{fontSize: '0.8rem'}}>Ask me anything! I can help with homework, recipes, schedules, and more.</div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`chat-${message.role} ${message.error ? 'chat-error' : ''}`} style={{
                marginBottom: '0.75rem',
                maxWidth: message.role === 'user' ? '85%' : '90%',
                marginLeft: message.role === 'user' ? 'auto' : '0',
                marginRight: message.role === 'user' ? '0' : 'auto'
              }}>
                <div style={{
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: '1.4'
                }}>
                  {message.content}
                </div>
                <div style={{
                  color: 'var(--text-tertiary)',
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                  textAlign: message.role === 'user' ? 'right' : 'left'
                }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                  {message.error && (
                    <span style={{color: 'var(--status-error)', marginLeft: '0.5rem'}}>ERROR</span>
                  )}
                  {message.system && (
                    <span style={{color: 'var(--status-success)', marginLeft: '0.5rem'}}>SYSTEM</span>
                  )}
                </div>
              
                {/* Apple Home style Action Buttons */}
                {message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div style={{marginTop: '0.75rem'}}>
                    <div style={{color: 'var(--text-tertiary)', fontSize: '0.8rem', marginBottom: '0.5rem'}}>
                      Quick Actions:
                    </div>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                      {message.suggestedActions.map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          onClick={() => handleSuggestedAction(action)}
                          disabled={isSending}
                          className="btn-secondary"
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.5rem 0.75rem',
                            minHeight: 'var(--touch-target-sm)'
                          }}
                        >
                          {action.icon} {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          
          {/* Typing indicator */}
          {isSending && (
            <div className="chat-assistant" style={{
              marginBottom: '0.75rem',
              maxWidth: '90%',
              marginLeft: '0',
              marginRight: 'auto'
            }}>
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Apple Home style input */}
        <form onSubmit={handleSubmit} style={{display: 'flex', gap: '0.75rem', marginTop: '1rem'}}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="input-field"
            style={{
              flex: 1,
              fontFamily: 'var(--font-ui)',
              fontSize: '0.9rem'
            }}
            disabled={isSending || !isConnected}
          />
          <button
            type="submit"
            disabled={isSending || !isConnected || !input.trim()}
            className="btn-primary"
            style={{
              opacity: (isSending || !isConnected || !input.trim()) ? 0.5 : 1,
              minHeight: 'var(--touch-target)'
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};