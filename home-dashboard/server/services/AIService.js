/**
 * AI Service for Home Dashboard
 * 
 * Centralized business logic for AI chat integration including:
 * - Ollama AI service communication with circuit breaker protection
 * - Family context enhancement for relevant responses
 * - Chat history management per user
 * - Intelligent action parsing and suggestions
 * - Model management and status checking
 * 
 * This service abstracts AI complexity from route handlers,
 * providing consistent error handling and circuit breaker protection.
 * 
 * @module AIService
 * @version 1.0.0
 * @author Home Dashboard Team
 */

const fetch = require('node-fetch');
const config = require('../../config');
const { registry } = require('../utils/circuitBreaker');
const { ErrorTypes, ErrorResponse } = require('../utils/errorHandling');

/**
 * AI Service Class
 * 
 * Provides comprehensive AI services with circuit breaker protection
 * and unified error handling.
 */
class AIService {
  constructor() {
    // In-memory storage for chat history (in production, use a database)
    this.chatHistory = new Map();
    
    this.initializeCircuitBreaker();
  }

  /**
   * Initialize circuit breaker for Ollama AI service
   */
  initializeCircuitBreaker() {
    registry.register('ollama-ai', async (apiCall) => {
      return await apiCall();
    }, {
      name: 'Ollama AI Service',
      failureThreshold: 3,
      timeWindow: 120000, // 2 minutes
      timeout: 60000, // 60 seconds for AI generation
      resetTimeout: 30000, // 30 seconds before trying again
      fallback: (error) => ({
        error: 'AI service temporarily unavailable',
        message: 'Our AI assistant is currently experiencing issues. Please try again in a few minutes.',
        fallback: true,
        timestamp: new Date().toISOString(),
        connected: false,
        models: []
      }),
      isFailure: (result) => {
        // Consider non-200 status codes and missing response as failures
        if (!result) return true;
        if (result.error && !result.fallback) return true; // Don't count fallback responses as failures
        if (result.status && result.status >= 400) return true;
        // If result is a fallback response, it's not a failure for circuit breaker purposes
        if (result.fallback) return false;
        return false;
      }
    });
  }

  /**
   * Execute Ollama API calls through circuit breaker protection
   * 
   * @param {Function} apiCall - Async function making the Ollama API call
   * @returns {Promise<any>} AI service response or fallback response
   */
  async executeWithCircuitBreaker(apiCall) {
    const breaker = registry.get('ollama-ai');
    if (!breaker) {
      console.warn('Ollama circuit breaker not found, executing directly');
      return await apiCall();
    }
    return await breaker.execute(apiCall);
  }

  /**
   * Get chat history for specific user
   * 
   * @param {string} userId - User ID
   * @returns {Array} Array of chat messages for the user
   */
  getUserChatHistory(userId) {
    if (!this.chatHistory.has(userId)) {
      this.chatHistory.set(userId, []);
    }
    return this.chatHistory.get(userId);
  }

  /**
   * Add message to user's chat history
   * 
   * @param {string} userId - User ID
   * @param {Object} message - Message object to store
   * @param {string} message.role - Message role ('user' or 'assistant')
   * @param {string} message.content - Message content
   * @param {Array} [message.suggestedActions] - AI-generated action suggestions
   */
  addToHistory(userId, message) {
    const history = this.getUserChatHistory(userId);
    history.push({
      ...message,
      timestamp: new Date(),
    });
    
    // Keep only last 100 messages per user
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }

  /**
   * Clear chat history for user
   * 
   * @param {string} userId - User ID
   */
  clearChatHistory(userId) {
    this.chatHistory.set(userId, []);
  }

  /**
   * Check Ollama service connection status
   * 
   * @returns {Promise<boolean>} True if service is available
   */
  async checkOllamaConnection() {
    try {
      const result = await this.executeWithCircuitBreaker(async () => {
        const response = await fetch(`${config.services.ollama.baseUrl}/api/tags`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return { connected: true, status: response.status };
      });
      return result.connected;
    } catch (error) {
      console.error('Ollama connection check failed:', error);
      return false;
    }
  }

  /**
   * Send message to Ollama AI with enhanced family context
   * 
   * @param {string} message - User's message/question
   * @param {string} [model] - AI model to use for generation
   * @returns {Promise<string>} AI-generated response
   * @throws {ErrorResponse} When AI service call fails
   */
  async sendToOllama(message, model = config.services.ollama.model) {
    try {
      // Execute Ollama API call through circuit breaker
      const result = await this.executeWithCircuitBreaker(async () => {
        // Enhanced prompt with family context and action detection
        const familyPrompt = `You are a helpful family AI assistant for a family of 4 (2 adults, 2 children). 
Your role is to help with family coordination, meal planning, scheduling, and home management.

When responding to messages, analyze if there are actionable items and respond with both your message and suggested actions.

User message: ${message}

Please respond with helpful information and if applicable, suggest specific actions like:
- Adding events to calendar
- Creating reminders
- Meal planning suggestions
- Shopping list items

Response format:
Your helpful response here.

If there are actionable items, end with:
ACTIONS: [list any specific actions that could be taken]`;

        const response = await fetch(`${config.services.ollama.baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            prompt: familyPrompt,
            stream: false,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if the response is valid
        if (!data || !data.response) {
          throw new Error('Invalid response from Ollama API');
        }
        
        return data.response;
      });
      
      return result;
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Ollama API error:', error);
      throw new ErrorResponse(
        ErrorTypes.EXTERNAL_SERVICE,
        'AI service communication failed',
        error.message,
        500
      );
    }
  }

  /**
   * Parse AI response and user message for actionable suggestions
   * 
   * @param {string} aiResponse - AI-generated response text
   * @param {string} userMessage - Original user message
   * @returns {Array<Object>} Array of suggested actions
   */
  parseActionsFromResponse(aiResponse, userMessage) {
    const suggestedActions = [];
    
    // Ensure both parameters are strings
    if (!aiResponse || typeof aiResponse !== 'string') {
      console.warn('AI response is not a string:', typeof aiResponse, aiResponse);
      return suggestedActions;
    }
    
    if (!userMessage || typeof userMessage !== 'string') {
      console.warn('User message is not a string:', typeof userMessage, userMessage);
      return suggestedActions;
    }
    
    // Simple pattern matching for common actionable intents
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();
    
    // Calendar events detection
    const calendarKeywords = ['meeting', 'appointment', 'event', 'birthday', 'anniversary', 'reminder'];
    const datePatterns = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{1,2}:\d{2})|tomorrow|today|next week|next month/i;
    
    if (calendarKeywords.some(keyword => lowerMessage.includes(keyword)) || datePatterns.test(userMessage)) {
      suggestedActions.push({
        type: 'add_to_calendar',
        label: 'Add to Calendar',
        icon: '📅',
        data: {
          summary: this.extractEventTitle(userMessage),
          description: `Event created from AI chat: ${userMessage}`,
          start: { dateTime: new Date().toISOString() },
          end: { dateTime: new Date(Date.now() + 3600000).toISOString() }
        }
      });
    }
    
    // Meal planning detection
    if (lowerMessage.includes('meal') || lowerMessage.includes('dinner') || lowerMessage.includes('cook') || lowerMessage.includes('recipe')) {
      suggestedActions.push({
        type: 'search_recipes',
        label: 'Find Recipes',
        icon: '🍽️',
        data: { query: userMessage }
      });
    }
    
    // Shopping list detection
    if (lowerMessage.includes('buy') || lowerMessage.includes('shop') || lowerMessage.includes('need') || lowerMessage.includes('grocery')) {
      suggestedActions.push({
        type: 'add_to_shopping',
        label: 'Add to Shopping List',
        icon: '🛒',
        data: { items: this.extractShoppingItems(userMessage) }
      });
    }
    
    // Reminder detection
    if (lowerMessage.includes('remind') || lowerMessage.includes('don\'t forget') || lowerMessage.includes('remember')) {
      suggestedActions.push({
        type: 'create_reminder',
        label: 'Set Reminder',
        icon: '⏰',
        data: {
          summary: `Reminder: ${this.extractReminderText(userMessage)}`,
          start: { dateTime: new Date(Date.now() + 3600000).toISOString() },
          reminders: { useDefault: true }
        }
      });
    }
    
    return suggestedActions;
  }

  /**
   * Extract event title from user message
   * 
   * @param {string} message - User's message text
   * @returns {string} Extracted event title
   */
  extractEventTitle(message) {
    const match = message.match(/(?:meeting|appointment|event)\s+(?:for|about|with)?\s*([^.!?]+)/i);
    return match ? match[1].trim() : message.substring(0, 50);
  }

  /**
   * Extract reminder text from user message
   * 
   * @param {string} message - User's message text
   * @returns {string} Extracted reminder text
   */
  extractReminderText(message) {
    const match = message.match(/(?:remind|remember)\s+(?:me\s+)?(?:to\s+)?([^.!?]+)/i);
    return match ? match[1].trim() : message.substring(0, 50);
  }

  /**
   * Extract shopping items from user message
   * 
   * @param {string} message - User's message text
   * @returns {string[]} Array of detected shopping items
   */
  extractShoppingItems(message) {
    const commonItems = ['milk', 'bread', 'eggs', 'butter', 'cheese', 'chicken', 'beef', 'fish', 'rice', 'pasta'];
    return commonItems.filter(item => message.toLowerCase().includes(item));
  }

  /**
   * Process chat message with AI
   * 
   * @param {string} message - User's message
   * @param {string} userId - User ID
   * @param {string} [model] - AI model to use
   * @returns {Promise<Object>} Chat response
   * @throws {ErrorResponse} When processing fails
   */
  async processChat(message, userId, model) {
    try {
      if (!message || !message.trim()) {
        throw new ErrorResponse(
          ErrorTypes.VALIDATION,
          'Message is required',
          null,
          400
        );
      }

      // Add user message to history
      this.addToHistory(userId, {
        role: 'user',
        content: message.trim(),
      });
      
      // Get chat history for context
      const history = this.getUserChatHistory(userId);
      const recentHistory = history.slice(-10); // Last 10 messages for context
      
      // Build context prompt
      let contextPrompt = message.trim();
      if (recentHistory.length > 1) {
        const context = recentHistory
          .slice(0, -1) // Exclude the current message
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        contextPrompt = `Context:\n${context}\n\nUser: ${message.trim()}`;
      }
      
      // Send to Ollama
      const aiResponse = await this.sendToOllama(contextPrompt, model);
      
      // Handle fallback responses (when circuit breaker is open)
      if (typeof aiResponse === 'object' && aiResponse.fallback) {
        return {
          message: aiResponse.message,
          model: model || config.services.ollama.model,
          timestamp: new Date(),
          suggestedActions: [],
          fallback: true,
          error: aiResponse.error
        };
      }
      
      // Parse suggested actions from the user message for valid responses
      const suggestedActions = this.parseActionsFromResponse(aiResponse, message);
      
      // Add AI response to history
      this.addToHistory(userId, {
        role: 'assistant',
        content: aiResponse,
        suggestedActions,
      });
      
      return {
        message: aiResponse,
        model: model || config.services.ollama.model,
        timestamp: new Date(),
        suggestedActions,
      };
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Process chat error:', error);
      throw new ErrorResponse(
        ErrorTypes.INTERNAL,
        'Failed to process chat message',
        error.message,
        500
      );
    }
  }

  /**
   * Get AI service status
   * 
   * @returns {Promise<Object>} Service status
   * @throws {ErrorResponse} When status check fails
   */
  async getAIStatus() {
    try {
      const isConnected = await this.checkOllamaConnection();
      
      let models = [];
      if (isConnected) {
        try {
          // Execute models fetch through circuit breaker
          const result = await this.executeWithCircuitBreaker(async () => {
            const response = await fetch(`${config.services.ollama.baseUrl}/api/tags`);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data.models || [];
          });
          models = result;
        } catch (error) {
          console.error('Failed to fetch models:', error);
          // If circuit breaker returns fallback, models will be empty array
          if (error.fallback) {
            models = [];
          }
        }
      }
      
      return {
        connected: isConnected,
        service: 'Ollama',
        endpoint: config.services.ollama.baseUrl,
        models: models.map(model => ({
          name: model.name,
          size: model.size,
          modified: model.modified_at,
        })),
      };
    } catch (error) {
      console.error('AI status check error:', error);
      throw new ErrorResponse(
        ErrorTypes.INTERNAL,
        'Failed to check AI status',
        error.message,
        500
      );
    }
  }

  /**
   * Get available AI models
   * 
   * @returns {Promise<Object>} Available models
   * @throws {ErrorResponse} When models fetch fails
   */
  async getAvailableModels() {
    try {
      // Execute models fetch through circuit breaker
      const result = await this.executeWithCircuitBreaker(async () => {
        const response = await fetch(`${config.services.ollama.baseUrl}/api/tags`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const models = data.models || [];
        
        return {
          models: models.map(model => ({
            name: model.name,
            size: model.size,
            modified: model.modified_at,
          })),
        };
      });
      
      return result;
    } catch (error) {
      console.error('Get models error:', error);
      throw new ErrorResponse(
        ErrorTypes.EXTERNAL_SERVICE,
        'Failed to get available models',
        error.message,
        500
      );
    }
  }

  /**
   * Reset circuit breaker for manual recovery
   * 
   * @returns {Object} Reset status
   */
  resetCircuitBreaker() {
    const breaker = registry.get('ollama-ai');
    if (breaker) {
      breaker.reset();
      return {
        success: true,
        message: 'Circuit breaker reset successfully',
        status: breaker.getStatus(),
        timestamp: new Date().toISOString()
      };
    }
    return {
      success: false,
      message: 'Circuit breaker not found',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get circuit breaker status
   * 
   * @returns {Object} Circuit breaker status
   */
  getCircuitBreakerStatus() {
    const breaker = registry.get('ollama-ai');
    if (breaker) {
      return {
        success: true,
        status: breaker.getStatus(),
        timestamp: new Date().toISOString()
      };
    }
    return {
      success: false,
      message: 'Circuit breaker not found',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate text using specific AI model
   * 
   * @param {string} prompt - Text prompt for generation
   * @param {string} [model] - AI model to use
   * @param {boolean} [stream=false] - Whether to stream response
   * @returns {Promise<Object>} Generation response
   * @throws {ErrorResponse} When generation fails
   */
  async generateText(prompt, model = config.services.ollama.model, stream = false) {
    try {
      if (!prompt || !prompt.trim()) {
        throw new ErrorResponse(
          ErrorTypes.VALIDATION,
          'Prompt is required',
          null,
          400
        );
      }

      // Execute generation through circuit breaker
      const result = await this.executeWithCircuitBreaker(async () => {
        const response = await fetch(`${config.services.ollama.baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            prompt: prompt.trim(),
            stream,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
          response: data.response,
          model,
          done: data.done,
          context: data.context,
        };
      });
      
      return result;
    } catch (error) {
      if (error instanceof ErrorResponse) {
        throw error;
      }
      
      console.error('Generate text error:', error);
      throw new ErrorResponse(
        ErrorTypes.EXTERNAL_SERVICE,
        'Failed to generate text',
        error.message,
        500
      );
    }
  }
}

module.exports = AIService;