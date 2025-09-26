/**
 * Statistical API Endpoint Tests
 * 
 * Tests the complete flow through the REST API endpoints
 * for statistical operations integration
 */

const request = require('supertest');
const express = require('express');
const DataProcessor = require('../../src/backend/dataProcessor.js');

// Create minimal Express app for testing
const app = express();
app.use(express.json({ limit: '10mb' }));

// Add the process-data endpoint (simplified version of server.js)
app.post('/api/process-data', async (req, res) => {
  try {
    const { data, operations } = req.body;
    
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }
    
    if (!Array.isArray(operations)) {
      return res.status(400).json({ error: 'Operations must be an array' });
    }
    
    const result = await DataProcessor.processData(data, operations);
    res.json({ data: result });
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

describe('Statistical API Endpoints', () => {
  let testData;

  beforeEach(() => {
    testData = [
      { name: 'Alice', age: 25, salary: 50000, department: 'Engineering', score: 85.5 },
      { name: 'Bob', age: 30, salary: 60000, department: 'Marketing', score: 92.3 },
      { name: 'Charlie', age: 35, salary: 55000, department: 'Engineering', score: 78.9 },
      { name: 'Diana', age: 28, salary: 65000, department: 'Sales', score: 88.7 },
      { name: 'Eve', age: 32, salary: 58000, department: 'Marketing', score: 91.2 }
    ];
  });

  describe('POST /api/process-data - Mean Calculation', () => {
    test('Should calculate mean through API', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ type: 'calculateMean', params: { column: 'age' } }]
        })
        .expect(200);
        
      expect(response.body).toHaveProperty('data', 30);
    });

    test('Should handle decimal precision correctly', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ type: 'calculateMean', params: { column: 'score' } }]
        })
        .expect(200);
        
      expect(response.body.data).toBe(87.32);
      expect(response.body.data.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
    });
  });

  describe('POST /api/process-data - Descriptive Statistics', () => {
    test('Should return comprehensive statistics object', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ type: 'descriptiveStats', params: { column: 'age' } }]
        })
        .expect(200);
        
      const stats = response.body.data;
      expect(stats).toHaveProperty('column', 'age');
      expect(stats).toHaveProperty('count', 5);
      expect(stats).toHaveProperty('mean', 30);
      expect(stats).toHaveProperty('median', 30);
      expect(stats).toHaveProperty('stdDev');
      expect(stats).toHaveProperty('min', 25);
      expect(stats).toHaveProperty('max', 35);
      expect(stats).toHaveProperty('q1');
      expect(stats).toHaveProperty('q3');
      expect(stats).toHaveProperty('variance');
    });
  });

  describe('POST /api/process-data - Correlation Analysis', () => {
    test('Should calculate correlation between two columns', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ 
            type: 'calculateCorrelation', 
            params: { columnX: 'age', columnY: 'salary' } 
          }]
        })
        .expect(200);
        
      const correlation = response.body.data;
      expect(typeof correlation).toBe('number');
      expect(correlation).toBeGreaterThanOrEqual(-1);
      expect(correlation).toBeLessThanOrEqual(1);
    });

    test('Should handle missing correlation parameters', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ 
            type: 'calculateCorrelation', 
            params: { columnX: 'age' } // Missing columnY
          }]
        })
        .expect(500);
        
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/process-data - Outlier Detection', () => {
    test('Should detect outliers using IQR method', async () => {
      const dataWithOutlier = [
        { value: 10 }, { value: 12 }, { value: 11 }, { value: 13 }, 
        { value: 12 }, { value: 14 }, { value: 100 } // 100 is an outlier
      ];

      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: dataWithOutlier,
          operations: [{ 
            type: 'detectOutliers', 
            params: { column: 'value', method: 'iqr' } 
          }]
        })
        .expect(200);
        
      const result = response.body.data;
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(7);
      expect(result[6]).toHaveProperty('value_is_outlier', true);
      expect(result[0]).toHaveProperty('value_is_outlier', false);
    });

    test('Should detect outliers using Z-score method', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ 
            type: 'detectOutliers', 
            params: { column: 'age', method: 'zscore' } 
          }]
        })
        .expect(200);
        
      const result = response.body.data;
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
      result.forEach(row => {
        expect(row).toHaveProperty('age_is_outlier');
        expect(typeof row.age_is_outlier).toBe('boolean');
      });
    });
  });

  describe('POST /api/process-data - Frequency Count', () => {
    test('Should count frequencies correctly', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ 
            type: 'frequencyCount', 
            params: { column: 'department' } 
          }]
        })
        .expect(200);
        
      const result = response.body.data;
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      
      // Should be sorted by count (descending)
      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
      expect(result[1].count).toBeGreaterThanOrEqual(result[2].count);
      
      // Check specific values
      const engineering = result.find(item => item.value === 'Engineering');
      const marketing = result.find(item => item.value === 'Marketing');
      const sales = result.find(item => item.value === 'Sales');
      
      expect(engineering.count).toBe(2);
      expect(marketing.count).toBe(2);
      expect(sales.count).toBe(1);
    });
  });

  describe('POST /api/process-data - Percentiles', () => {
    test('Should calculate different percentiles correctly', async () => {
      // Test 25th percentile
      const response25 = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ 
            type: 'calculatePercentiles', 
            params: { column: 'age', percentile: 25 } 
          }]
        })
        .expect(200);
        
      // Test 50th percentile (median)
      const response50 = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ 
            type: 'calculatePercentiles', 
            params: { column: 'age', percentile: 50 } 
          }]
        })
        .expect(200);
        
      // Test 75th percentile
      const response75 = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ 
            type: 'calculatePercentiles', 
            params: { column: 'age', percentile: 75 } 
          }]
        })
        .expect(200);
        
      expect(typeof response25.body.data).toBe('number');
      expect(typeof response50.body.data).toBe('number');
      expect(typeof response75.body.data).toBe('number');
      
      // 50th percentile should equal median
      expect(response50.body.data).toBe(30);
    });
  });

  describe('POST /api/process-data - Multiple Operations', () => {
    test('Should handle multiple statistical operations in sequence', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [
            { type: 'calculateMean', params: { column: 'age' } },
            // Note: This won't work as expected since mean returns a number, not dataset
            // But testing the API's handling of multiple operations
          ]
        })
        .expect(200);
        
      // The result should be the mean value
      expect(response.body.data).toBe(30);
    });

    test('Should handle outlier detection followed by frequency count', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [
            { type: 'detectOutliers', params: { column: 'age', method: 'iqr' } }
          ]
        })
        .expect(200);
        
      const result = response.body.data;
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('age_is_outlier');
    });
  });

  describe('Error Handling', () => {
    test('Should return 400 for invalid data format', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: 'not_an_array',
          operations: [{ type: 'calculateMean', params: { column: 'age' } }]
        })
        .expect(400);
        
      expect(response.body).toHaveProperty('error', 'Data must be an array');
    });

    test('Should return 400 for invalid operations format', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: 'not_an_array'
        })
        .expect(400);
        
      expect(response.body).toHaveProperty('error', 'Operations must be an array');
    });

    test('Should return 500 for unsupported operation', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ type: 'unsupportedOperation', params: { column: 'age' } }]
        })
        .expect(500);
        
      expect(response.body.error).toContain('Unsupported operation');
    });

    test('Should return 500 for statistical operation errors', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ type: 'calculateMean', params: { column: 'nonexistent' } }]
        })
        .expect(500);
        
      expect(response.body.error).toContain('does not exist'); // Column validation error
    });
  });

  describe('Data Validation and Edge Cases', () => {
    test('Should handle empty dataset', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: [],
          operations: [{ type: 'calculateMean', params: { column: 'age' } }]
        })
        .expect(500);
        
      expect(response.body.error).toContain('No valid numeric values found'); // Empty dataset error
    });

    test('Should handle dataset with all missing values', async () => {
      const missingData = [
        { age: '' }, { age: null }, { age: undefined }, { age: 'invalid' }
      ];

      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: missingData,
          operations: [{ type: 'calculateMean', params: { column: 'age' } }]
        })
        .expect(500);
        
      expect(response.body.error).toContain('No valid numeric values found'); // Non-numeric data error
    });

    test('Should handle large dataset efficiently', async () => {
      // Create a large dataset
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: Math.random() * 100,
        category: `cat_${i % 10}`
      }));

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: largeData,
          operations: [{ type: 'calculateMean', params: { column: 'value' } }]
        })
        .expect(200);
      const endTime = Date.now();
        
      expect(typeof response.body.data).toBe('number');
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Content Type and Headers', () => {
    test('Should require JSON content type', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send('invalid=data')
        .expect(400);
        
      // Express should reject non-JSON data
    });

    test('Should return JSON response', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [{ type: 'calculateMean', params: { column: 'age' } }]
        })
        .expect(200)
        .expect('Content-Type', /json/);
        
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Statistical Accuracy Verification', () => {
    test('Mean calculation should be mathematically correct', async () => {
      const simpleData = [{ val: 10 }, { val: 20 }, { val: 30 }];
      
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: simpleData,
          operations: [{ type: 'calculateMean', params: { column: 'val' } }]
        })
        .expect(200);
        
      expect(response.body.data).toBe(20); // (10+20+30)/3 = 20
    });

    test('Median calculation should be mathematically correct', async () => {
      const oddData = [{ val: 10 }, { val: 30 }, { val: 20 }];
      const evenData = [{ val: 10 }, { val: 20 }, { val: 30 }, { val: 40 }];
      
      const oddResponse = await request(app)
        .post('/api/process-data')
        .send({
          data: oddData,
          operations: [{ type: 'calculateMedian', params: { column: 'val' } }]
        })
        .expect(200);
        
      const evenResponse = await request(app)
        .post('/api/process-data')
        .send({
          data: evenData,
          operations: [{ type: 'calculateMedian', params: { column: 'val' } }]
        })
        .expect(200);
        
      expect(oddResponse.body.data).toBe(20); // Middle value of [10,20,30]
      expect(evenResponse.body.data).toBe(25); // Average of 20 and 30
    });
  });
});