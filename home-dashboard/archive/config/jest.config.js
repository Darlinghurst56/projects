module.exports = {
  // Use jsdom environment for React component testing
  testEnvironment: 'jsdom',
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json'],
  
  // Module name mapping for CSS and static files
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform files with babel-jest
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // Test match patterns - ONLY unit and integration tests
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(js|jsx)',
    '<rootDir>/src/**/?(*.)(test|spec).(js|jsx)',
    '<rootDir>/tests/unit/**/*.(test|spec).(js|jsx)',
    '<rootDir>/tests/integration/**/*.(test|spec).(js|jsx)'
  ],
  
  // Explicitly ignore e2e tests and accessibility tests (these are for Playwright)
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/accessibility/',
    '<rootDir>/test-*.spec.js' // Root level Playwright specs
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    'server/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Verbose output
  verbose: true,
  
  // Root directory
  rootDir: '.',
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src', '<rootDir>/server'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true
};