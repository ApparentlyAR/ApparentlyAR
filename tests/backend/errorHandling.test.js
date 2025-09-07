/**
 * Backend Error Handling Tests
 * 
 * Comprehensive test suite for error scenarios and edge cases in the ApparentlyAR backend services.
 * This test suite validates that the application handles various error conditions gracefully,
 * providing appropriate HTTP status codes and error messages to clients.
 * 
 * Test Categories:
 * - API Error Handling: Invalid requests, missing fields, malformed data
 * - Input Validation: Data type validation, required field checking
 * - Error Response Structure: Consistent error format and HTTP status codes
 * - Network Error Simulation: Malformed JSON, large payloads, concurrent requests
 * - Security Considerations: Path traversal, unsupported methods
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 * @since V2 Submission
 */

const request = require('supertest');
const app = require('../../server');

describe('Backend Error Handling', () => {

  describe('API Error Handling', () => {
    // Tests for core API endpoints and their error handling capabilities
    
    test('should handle invalid chart type', async () => {
      // Test that the chart generation API properly rejects unsupported chart types
      const response = await request(app)
        .post('/api/generate-chart')
        .send({
          data: [{ name: 'test', value: 1 }],
          chartType: 'invalid_type'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing data field', async () => {
      // Test validation of required 'data' field in chart generation requests
      const response = await request(app)
        .post('/api/generate-chart')
        .send({
          chartType: 'bar'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle missing chart type', async () => {
      // Test validation of required 'chartType' field in chart generation requests
      const response = await request(app)
        .post('/api/generate-chart')
        .send({
          data: [{ name: 'test', value: 1 }]
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle empty data array', async () => {
      // Test handling of empty data arrays in chart generation
      const response = await request(app)
        .post('/api/generate-chart')
        .send({
          data: [],
          chartType: 'bar'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle malformed data', async () => {
      // Test handling of non-array data types in chart generation
      const response = await request(app)
        .post('/api/generate-chart')
        .send({
          data: 'not an array',
          chartType: 'bar'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle data processing with invalid operations', async () => {
      // Test data processing API with non-array operations parameter
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: [{ name: 'test', value: 1 }],
          operations: 'not an array'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle data processing with null operations', async () => {
      // Test data processing API with null operations parameter
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: [{ name: 'test', value: 1 }],
          operations: null
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle AR visualization with missing fields', async () => {
      // Test AR visualization API with missing required fields
      const response = await request(app)
        .post('/api/ar-visualization')
        .send({
          data: [{ x: 1, y: 2 }]
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle AR visualization with invalid type', async () => {
      // Test AR visualization API with unsupported visualization types
      const response = await request(app)
        .post('/api/ar-visualization')
        .send({
          data: [{ x: 1, y: 2 }],
          visualizationType: 'invalid_type',
          markerId: 'test'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle network error simulation', async () => {
      // Test server resilience with malformed JSON payloads
      const response = await request(app)
        .post('/api/process-data')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle large payload', async () => {
      // Test server performance and memory handling with large datasets
      const largeData = Array(1000).fill().map((_, i) => ({ 
        name: `test${i}`, 
        value: i 
      }));

      const response = await request(app)
        .post('/api/generate-chart')
        .send({
          data: largeData,
          chartType: 'bar'
        });

      // Should either succeed or fail gracefully
      expect([200, 500]).toContain(response.status);
      if (response.status === 500) {
        expect(response.body).toHaveProperty('error');
      }
    });

    test('should handle concurrent requests', async () => {
      // Test server stability under concurrent load
      const requests = Array(5).fill().map(() => 
        request(app)
          .post('/api/generate-chart')
          .send({
            data: [{ name: 'test', value: 1 }],
            chartType: 'bar'
          })
      );

      const responses = await Promise.all(requests);
      
      // All requests should complete (either success or error)
      responses.forEach(response => {
        expect([200, 500]).toContain(response.status);
      });
    });

    test('should handle missing Content-Type header', async () => {
      // Test API behavior with missing Content-Type headers
      const response = await request(app)
        .post('/api/process-data')
        .send('{"data": [], "operations": []}')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle unsupported HTTP methods', async () => {
      // Test API security by rejecting unsupported HTTP methods
      const response = await request(app)
        .put('/api/generate-chart')
        .send({})
        .expect(404);

      // Express returns 404 for unsupported methods
      expect(response.status).toBe(404);
    });

    test('should handle non-existent endpoints', async () => {
      // Test API routing by properly handling requests to non-existent endpoints
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.status).toBe(404);
    });

  });

  describe('Input Validation', () => {
    // Tests for comprehensive input validation and data sanitization
    
    test('should validate required fields', async () => {
      // Test that all required fields are properly validated
      const response = await request(app)
        .post('/api/generate-chart')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should validate data types', async () => {
      // Test that data type validation works correctly
      const response = await request(app)
        .post('/api/generate-chart')
        .send({
          data: 'not an array',
          chartType: 'bar'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle null data', async () => {
      // Test handling of null data values
      const response = await request(app)
        .post('/api/generate-chart')
        .send({
          data: null,
          chartType: 'bar'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle undefined chartType', async () => {
      // Test handling of undefined chartType values
      const response = await request(app)
        .post('/api/generate-chart')
        .send({
          data: [{ name: 'test', value: 1 }],
          chartType: undefined
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

  });

  describe('Error Response Structure', () => {
    // Tests for consistent error response formatting and HTTP status codes
    
    test('should return consistent error format', async () => {
      // Test that all error responses follow a consistent structure
      const response = await request(app)
        .post('/api/generate-chart')
        .send({
          data: [{ name: 'test', value: 1 }],
          chartType: 'invalid_type'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    test('should return appropriate HTTP status codes', async () => {
      // 400 for bad requests
      const badRequest = await request(app)
        .post('/api/generate-chart')
        .send({})
        .expect(400);

      // 500 for server errors
      const serverError = await request(app)
        .post('/api/generate-chart')
        .send({
          data: [{ name: 'test', value: 1 }],
          chartType: 'invalid_type'
        })
        .expect(500);

      expect(badRequest.status).toBe(400);
      expect(serverError.status).toBe(500);
    });

  });

});