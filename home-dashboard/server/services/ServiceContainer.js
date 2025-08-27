/**
 * Service Container for Home Dashboard
 * 
 * Simple dependency injection container for managing service instances
 * and their dependencies. Provides centralized service management for
 * the home dashboard application with singleton pattern support.
 * 
 * Features:
 * - Singleton service instance management
 * - Service registration and resolution
 * - Circular dependency detection
 * - Service lifecycle management
 * - Type checking for service registration
 * 
 * @module ServiceContainer
 * @version 1.0.0
 * @author Home Dashboard Team
 */

const { ErrorTypes, ErrorResponse } = require('../utils/errorHandling');

/**
 * Service Container Class
 * 
 * Manages service instances and dependencies with singleton pattern.
 * Provides service registration, resolution, and lifecycle management.
 */
class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.serviceFactories = new Map();
    this.resolving = new Set(); // For circular dependency detection
  }

  /**
   * Register a service factory
   * 
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that creates the service instance
   * @param {boolean} [singleton=true] - Whether to use singleton pattern
   * @throws {ErrorResponse} When name or factory is invalid
   */
  register(name, factory, singleton = true) {
    if (!name || typeof name !== 'string') {
      throw new ErrorResponse(
        ErrorTypes.VALIDATION,
        'Service name must be a non-empty string',
        null,
        400
      );
    }

    if (typeof factory !== 'function') {
      throw new ErrorResponse(
        ErrorTypes.VALIDATION,
        'Service factory must be a function',
        null,
        400
      );
    }

    this.serviceFactories.set(name, {
      factory,
      singleton,
      instance: null
    });
  }

  /**
   * Register a service instance directly
   * 
   * @param {string} name - Service name
   * @param {Object} instance - Service instance
   * @throws {ErrorResponse} When name or instance is invalid
   */
  registerInstance(name, instance) {
    if (!name || typeof name !== 'string') {
      throw new ErrorResponse(
        ErrorTypes.VALIDATION,
        'Service name must be a non-empty string',
        null,
        400
      );
    }

    if (!instance) {
      throw new ErrorResponse(
        ErrorTypes.VALIDATION,
        'Service instance cannot be null or undefined',
        null,
        400
      );
    }

    this.services.set(name, instance);
  }

  /**
   * Resolve a service by name
   * 
   * @param {string} name - Service name
   * @returns {Object} Service instance
   * @throws {ErrorResponse} When service is not found or circular dependency detected
   */
  resolve(name) {
    // Check for circular dependency
    if (this.resolving.has(name)) {
      throw new ErrorResponse(
        ErrorTypes.INTERNAL,
        `Circular dependency detected for service: ${name}`,
        null,
        500
      );
    }

    // Return existing instance if available
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Get service factory
    const serviceConfig = this.serviceFactories.get(name);
    if (!serviceConfig) {
      throw new ErrorResponse(
        ErrorTypes.NOT_FOUND,
        `Service not found: ${name}`,
        null,
        404
      );
    }

    // For singleton pattern, return existing instance if available
    if (serviceConfig.singleton && serviceConfig.instance) {
      return serviceConfig.instance;
    }

    try {
      // Mark as resolving to detect circular dependencies
      this.resolving.add(name);

      // Create new instance
      const instance = serviceConfig.factory(this);

      // Clear resolving flag
      this.resolving.delete(name);

      // Store instance for singleton pattern
      if (serviceConfig.singleton) {
        serviceConfig.instance = instance;
      }

      return instance;
    } catch (error) {
      // Clear resolving flag on error
      this.resolving.delete(name);
      
      if (error instanceof ErrorResponse) {
        throw error;
      }

      throw new ErrorResponse(
        ErrorTypes.INTERNAL,
        `Failed to create service instance: ${name}`,
        error.message,
        500
      );
    }
  }

  /**
   * Check if a service is registered
   * 
   * @param {string} name - Service name
   * @returns {boolean} True if service is registered
   */
  has(name) {
    return this.services.has(name) || this.serviceFactories.has(name);
  }

  /**
   * Get all registered service names
   * 
   * @returns {string[]} Array of service names
   */
  getServiceNames() {
    const factoryNames = Array.from(this.serviceFactories.keys());
    const instanceNames = Array.from(this.services.keys());
    return [...new Set([...factoryNames, ...instanceNames])];
  }

  /**
   * Clear all services and factories
   */
  clear() {
    this.services.clear();
    this.serviceFactories.clear();
    this.resolving.clear();
  }

  /**
   * Create a new child container with inherited services
   * 
   * @returns {ServiceContainer} New child container
   */
  createChild() {
    const child = new ServiceContainer();
    
    // Copy service factories to child
    for (const [name, config] of this.serviceFactories) {
      child.serviceFactories.set(name, { ...config });
    }
    
    // Copy service instances to child
    for (const [name, instance] of this.services) {
      child.services.set(name, instance);
    }
    
    return child;
  }
}

/**
 * Default service container instance
 */
const defaultContainer = new ServiceContainer();

/**
 * Register core dashboard services
 */
const registerCoreServices = () => {
  // Register AuthService
  defaultContainer.register('authService', () => {
    const AuthService = require('./AuthService');
    return new AuthService();
  });

  // Register GoogleService
  defaultContainer.register('googleService', () => {
    const GoogleService = require('./GoogleService');
    return new GoogleService();
  });

  // Register DNSService with Control D integration
  defaultContainer.register('dnsService', () => {
    const DNSService = require('./DNSService');
    return new DNSService();
  });

  // Register ControlDService
  defaultContainer.register('controlDService', () => {
    const ControlDService = require('./ControlDService');
    return new ControlDService();
  });

  // Register AIService
  defaultContainer.register('aiService', () => {
    const AIService = require('./AIService');
    return new AIService();
  });
};

// Initialize core services
registerCoreServices();

module.exports = {
  ServiceContainer,
  defaultContainer,
  registerCoreServices
};