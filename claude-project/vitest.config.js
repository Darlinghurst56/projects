import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  plugins: [],
  
  test: {
    // Test environment
    environment: 'node',
    globals: true,
    
    // Setup files
    setupFiles: ['./tests/setup.js'],
    
    // Test patterns
    include: [
      'tests/**/*.test.js',
      'tests/**/*.test.ts',
      'tests/**/*.spec.js',
      'tests/**/*.spec.ts'
    ],
    
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.taskmaster/**',
      'coverage/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Coverage thresholds
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      },
      
      // Include/exclude patterns
      include: [
        'src/**/*.js',
        'src/**/*.ts',
        'dashboard/js/**/*.js',
        'dashboard/src/**/*.ts',
        'taskmaster-api-server.js',
        'scripts/**/*.js'
      ],
      
      exclude: [
        'node_modules/**',
        'tests/**',
        'coverage/**',
        'dist/**',
        'build/**',
        '**/*.test.js',
        '**/*.spec.js',
        '**/*.config.js',
        '.taskmaster/**'
      ]
    },
    
    // Test timeout
    testTimeout: 30000,
    hookTimeout: 10000,
    
    // Parallel execution
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4
      }
    },
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results.json',
      html: './test-results.html'
    },
    
    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      GOOGLE_API_KEY: 'test-google-api-key',
      SESSION_SECRET: 'test-session-secret',
      JWT_SECRET: 'test-jwt-secret'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@dashboard': resolve(__dirname, 'dashboard'),
      '@tests': resolve(__dirname, 'tests')
    }
  },
  
  // Define configuration for different test types
  projects: [
    {
      name: 'unit',
      test: {
        include: ['tests/unit/**/*.test.js'],
        environment: 'node'
      }
    },
    {
      name: 'integration', 
      test: {
        include: ['tests/integration/**/*.test.js'],
        environment: 'node',
        testTimeout: 60000
      }
    },
    {
      name: 'e2e',
      test: {
        include: ['tests/e2e/**/*.test.js'],
        environment: 'node',
        testTimeout: 120000,
        poolOptions: {
          forks: {
            singleFork: true // E2E tests should run sequentially
          }
        }
      }
    },
    {
      name: 'dashboard',
      test: {
        include: ['tests/unit/dashboard/**/*.test.js'],
        environment: 'jsdom',
        setupFiles: ['./tests/setup.js']
      }
    }
  ]
});