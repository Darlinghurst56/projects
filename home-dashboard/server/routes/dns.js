/**
 * DNS Monitoring Routes for Home Dashboard
 * 
 * HTTP layer for DNS monitoring and analytics with comprehensive error handling.
 * This module handles routing, validation, and response formatting while
 * delegating business logic to DNSService for proper separation of concerns.
 * 
 * DNS monitoring is available to all users with enhanced features for authenticated users.
 * 
 * @module DNSRoutes
 * @version 3.0.0
 * @author Home Dashboard Team
 */

const express = require('express');
const { defaultContainer } = require('../services/ServiceContainer');
const { optional: optionalAuthMiddleware } = require('../middleware/auth');
const { ErrorResponse } = require('../utils/errorHandling');

const router = express.Router();
const dnsService = defaultContainer.resolve('dnsService');

// Apply optional authentication middleware - DNS monitoring is public with enhanced features for authenticated users
router.use(optionalAuthMiddleware);

/**
 * Helper function to handle service errors and convert to HTTP responses
 * 
 * @param {ErrorResponse|Error} error - Error from service layer
 * @param {Object} res - Express response object
 * @param {string} defaultMessage - Default error message
 */
const handleServiceError = (error, res, defaultMessage = 'DNS service operation failed') => {
  if (error instanceof ErrorResponse) {
    return res.status(error.statusCode).json(error.toJSON());
  }
  
  console.error('Unhandled DNS service error:', error);
  return res.status(500).json({ 
    error: defaultMessage,
    type: 'InternalServerError',
    timestamp: new Date().toISOString()
  });
};

// Get DNS status
router.get('/status', async (req, res) => {
  try {
    const result = await dnsService.getDNSStatus();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to get DNS status');
  }
});

// Get DNS analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const result = await dnsService.getDNSAnalytics(timeRange);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to get DNS analytics');
  }
});

// Get DNS profile/settings
router.get('/profile', async (req, res) => {
  try {
    const result = await dnsService.getDNSProfile();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to get DNS profile');
  }
});

// Update DNS profile/settings
router.put('/profile', async (req, res) => {
  try {
    const { provider, primaryDns, secondaryDns, domain, ttl, recordType, refreshInterval } = req.body;
    
    const result = await dnsService.updateDNSProfile({
      provider, primaryDns, secondaryDns, domain, ttl, recordType, refreshInterval
    });
    
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to update DNS profile');
  }
});

// Perform DNS lookup
router.post('/lookup', async (req, res) => {
  try {
    const { domain, type = 'A' } = req.body;
    
    const result = await dnsService.performDNSLookup(domain, type);
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'DNS lookup failed');
  }
});

// Clear DNS analytics
router.delete('/analytics', async (req, res) => {
  try {
    const result = await dnsService.clearDNSAnalytics();
    res.json(result);
  } catch (error) {
    handleServiceError(error, res, 'Failed to clear DNS analytics');
  }
});

module.exports = router;