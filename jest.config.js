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
    }
  ],
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Coverage collection settings - focus on testable JavaScript files
  collectCoverageFrom: [
    'src/backend/**/*.js',
    'src/ar/**/*.js',
    'src/blocks/**/*.js',
    'src/sum.js',
    'server.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!src/react/**/*.jsx'  // Exclude React components (need separate JSX testing setup)
  ],
  
  // Coverage output settings
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage thresholds (realistic for comprehensive file coverage)
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 40,
      lines: 50,
      statements: 50
    }
  },
  
  // Test setup and configuration
  setupFilesAfterEnv: [],
  testTimeout: 10000
};
