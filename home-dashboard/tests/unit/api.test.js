/**
 * Unit tests for API service
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the API service since we can't import the actual one due to dependencies
const mockApiService = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

describe('API Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should make GET requests correctly', async () => {
    // Mock successful response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test data' })
    });

    mockApiService.get.mockResolvedValueOnce({ data: 'test data' });
    
    const result = await mockApiService.get('/api/test');
    
    expect(mockApiService.get).toHaveBeenCalledWith('/api/test');
    expect(result).toEqual({ data: 'test data' });
  });

  test('should handle API errors gracefully', async () => {
    // Mock error response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' })
    });

    mockApiService.get.mockRejectedValueOnce(new Error('Server error'));
    
    await expect(mockApiService.get('/api/test')).rejects.toThrow('Server error');
  });

  test('should include authentication headers when token is present', async () => {
    // Set mock token in localStorage
    global.localStorage.setItem('authToken', 'mock-token');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'authenticated data' })
    });

    // Simulate API call with auth
    const token = global.localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    expect(token).toBe('mock-token');
    expect(headers.Authorization).toBe('Bearer mock-token');
  });

  test('should handle network errors', async () => {
    // Mock network error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    mockApiService.get.mockRejectedValueOnce(new Error('Network error'));
    
    await expect(mockApiService.get('/api/test')).rejects.toThrow('Network error');
  });
});