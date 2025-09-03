/**
 * Jest Configuration
 * 
 * Test configuration for the ApparentlyAR backend and frontend with comprehensive coverage reporting
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

module.exports = {
  // Test environment - use jsdom for frontend tests, node for backend
  testEnvironment: 'node',
  
  // Test environment options for frontend tests
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: [
        '**/tests/backend/**/*.test.js'
      ]
    },
    {
      displayName: 'frontend', 
      testEnvironment: 'node',
      testMatch: [
        '**/tests/frontend/**/*.test.js'
      ],
      setupFilesAfterEnv: [],
      globals: {
        TextEncoder: TextEncoder,
        TextDecoder: TextDecoder,
      }
    },
    {
      displayName: 'ar-modules',
      testEnvironment: 'node', 
      testMatch: [
        '**/tests/ar/**/*.test.js'
      ],
      setupFilesAfterEnv: [],
      collectCoverageFrom: [
        'src/ar/**/*.js'
      ]
    }
  ],
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Coverage collection settings
  collectCoverageFrom: [
    'src/backend/**/*.js',
    'src/ar/**/*.js',
    'src/blocks/**/*.js',
    'server.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // Coverage output settings
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage thresholds (100% for comprehensive testing)
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  
  // Test setup and configuration
  setupFilesAfterEnv: [],
  testTimeout: 10000,
  
  // Clear all timers after each test to prevent timeout issues
  clearMocks: true,
  
  // Force exit after tests to prevent hanging
  forceExit: true,
  
  // Memory management
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB'
};
