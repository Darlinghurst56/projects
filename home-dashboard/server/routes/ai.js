/**
 * AI Integration Routes for Home Dashboard
 * 
 * HTTP layer for AI assistant capabilities with comprehensive error handling.
 * This module handles routing, validation, and response formatting while
 * delegating business logic to AIService for proper separation of concerns.
 * 
 * Provides family-friendly AI assistant with:
 * - Circuit breaker pattern protection via AIService
 * - Family context enhancement for relevant responses
 * - Intelligent action parsing and suggestions
 * - Chat history management per user
 * - Support for multiple AI models
 * 
 * @module AIRoutes
 * @version 3.0.0
 * @author Home Dashboard Team
 */

const express = require('express');
const { defaultContainer } = require('../services/ServiceContainer');
const { optional: optionalAuthMiddleware } = require('../middleware/auth');
const { ErrorResponse } = require('../utils/errorHandling');

const router = express.Router();
const aiService = defaultContainer.resolve('aiService');

// Apply optional authentication middleware - AI chat is public with enhanced features for authenticated users
router.use(optionalAuthMiddleware);

/**
 * Helper function to handle service errors and convert to HTTP responses
 * 
 * @param {ErrorResponse|Error} error - Error from service layer
 * @param {Object} res - Express response object
 * @param {string} defaultMessage - Default error message
 */
const handleServiceError = (error, res, defaultMessage = 'AI service operation failed') => {
  if (error instanceof ErrorResponse) {
    return res.status(error.statusCode).json(error.toJSON());
  }
  
  console.error('Unhandled AI service error:', error);
  return res.status(500).json({ 
    error: defaultMessage,
    type: 'InternalServerError',
    timestamp: new Date().toISOString()
  });
};

/**
 * @route POST /ai/chat
 * @description Send message to AI assistant with family context and action detection
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, model } = req.body;
    const userId = req.user?.id || 'guest';
    
    const result = await aiService.processChat(message, userId, model);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to process chat message');
  }
});

/**
 * @route GET /ai/chat/history
 * @description Retrieve user's chat history
 */
router.get('/chat/history', (req, res) => {
  try {
    const userId = req.user?.id || 'guest';
    const history = aiService.getUserChatHistory(userId);
    
    res.json(history);
  } catch (error) {
    handleServiceError(error, res, 'Failed to get chat history');
  }
});

/**
 * @route DELETE /ai/chat/history
 * @description Clear user's chat history
 */
router.delete('/chat/history', (req, res) => {
  try {
    const userId = req.user?.id || 'guest';
    aiService.clearChatHistory(userId);
    
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    handleServiceError(error, res, 'Failed to clear chat history');
  }
});

/**
 * @route GET /ai/status
 * @description Check AI service connection status and available models
 */
router.get('/status', async (req, res) => {
  try {
    const result = await aiService.getAIStatus();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to check AI status');
  }
});

/**
 * @route GET /ai/models
 * @description Get list of available AI models
 */
router.get('/models', async (req, res) => {
  try {
    const result = await aiService.getAvailableModels();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to get available models');
  }
});

/**
 * @route POST /ai/generate
 * @description Generate text using specific AI model
 */
router.post('/generate', async (req, res) => {
  try {
    const { prompt, model, stream = false } = req.body;
    
    const result = await aiService.generateText(prompt, model, stream);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to generate text');
  }
});

/**
 * @route POST /ai/circuit-breaker/reset
 * @description Reset the AI service circuit breaker for manual recovery
 */
router.post('/circuit-breaker/reset', (req, res) => {
  try {
    const result = aiService.resetCircuitBreaker();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to reset circuit breaker');
  }
});

/**
 * @route GET /ai/circuit-breaker/status
 * @description Get current circuit breaker status
 */
router.get('/circuit-breaker/status', (req, res) => {
  try {
    const result = aiService.getCircuitBreakerStatus();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to get circuit breaker status');
  }
});

module.exports = router;