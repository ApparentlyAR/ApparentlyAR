/**
 * Integration tests for complete ApparentlyAR workflows
 * Tests end-to-end functionality from data import to AR visualization
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Import the actual server instead of mocking
const app = require('../../server');

describe('Full Workflow Integration Tests', () => {
  let testDataFile;
  
  beforeAll(() => {
    // Create a temporary CSV file for testing
    testDataFile = path.join(__dirname, 'temp_test_data.csv');
    const csvContent = `name,age,score,grade
Alice,25,85,A
Bob,22,92,A
Charlie,28,78,B
Diana,24,95,A`;
    fs.writeFileSync(testDataFile, csvContent);
  });
  
  afterAll(() => {
    // Clean up temporary file
    if (fs.existsSync(testDataFile)) {
      fs.unlinkSync(testDataFile);
    }
  });

  describe('Data Import to Visualization Workflow', () => {
    test('should complete full workflow: data import -> processing -> chart generation', async () => {
      // Step 1: Get test data
      const dataResponse = await request(app)
        .get('/api/test-data/students');
      
      expect(dataResponse.status).toBe(200);
      expect(dataResponse.body.success).toBe(true);
      expect(dataResponse.body.data).toBeDefined();
      
      const originalData = dataResponse.body.data;
      
      // Step 2: Process the data (filter and sort)
      const processResponse = await request(app)
        .post('/api/process-data')
        .send({
          data: originalData,
          operations: [
            {
              type: 'filter',
              params: { column: 'grade', operator: 'equals', value: 'A' }
            },
            {
              type: 'sort',
              params: { column: 'score', direction: 'desc' }
            }
          ]
        });
      
      expect(processResponse.status).toBe(200);
      expect(processResponse.body.success).toBe(true);
      
      const processedData = processResponse.body.data;
      expect(processedData.length).toBeGreaterThan(0);
      expect(processedData.every(row => row.grade === 'A')).toBe(true);
      
      // Step 3: Generate a chart from processed data
      const chartResponse = await request(app)
        .post('/api/generate-chart')
        .send({
          data: processedData,
          chartType: 'bar',
          options: {
            xColumn: 'name',
            yColumn: 'score',
            title: 'Top Students by Score'
          }
        });
      
      expect(chartResponse.status).toBe(200);
      expect(chartResponse.body.success).toBe(true);
      expect(chartResponse.body.chartType).toBe('bar');
      expect(chartResponse.body.config).toBeDefined();
    });

    test('should handle complex data processing pipeline', async () => {
      const complexData = [
        { student: 'Alice', subject: 'Math', score: 85, semester: 'Fall', year: 2023 },
        { student: 'Alice', subject: 'Science', score: 92, semester: 'Fall', year: 2023 },
        { student: 'Bob', subject: 'Math', score: 78, semester: 'Fall', year: 2023 },
        { student: 'Bob', subject: 'Science', score: 88, semester: 'Fall', year: 2023 },
        { student: 'Charlie', subject: 'Math', score: 95, semester: 'Spring', year: 2023 }
      ];
      
      // Complex processing: filter by semester, group by student, aggregate scores
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: complexData,
          operations: [
            {
              type: 'filter',
              params: { column: 'semester', operator: 'equals', value: 'Fall' }
            },
            {
              type: 'groupBy',
              params: {
                groupBy: 'student',
                aggregations: [
                  { column: 'score', operation: 'average', alias: 'avg_score' }
                ]
              }
            }
          ]
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // Alice and Bob
    });
  });

  describe('Error Handling Throughout Workflow', () => {
    test('should gracefully handle errors at each step', async () => {
      // Test with invalid data
      const invalidDataResponse = await request(app)
        .post('/api/process-data')
        .send({
          data: 'invalid data format',
          operations: []
        });
      
      expect(invalidDataResponse.status).toBe(400);
      expect(invalidDataResponse.body.error).toBeDefined();
      
      // Test with unsupported chart type
      const invalidChartResponse = await request(app)
        .post('/api/generate-chart')
        .send({
          data: [{ x: 1, y: 2 }],
          chartType: 'unsupported_type'
        });
      
      expect(invalidChartResponse.status).toBe(500);
      expect(invalidChartResponse.body.error).toContain('Unsupported chart type');
    });
  });

  describe('Performance Under Load', () => {
    test('should handle multiple concurrent requests', async () => {
      const requests = [];
      const numRequests = 5;
      
      // Create multiple concurrent requests
      for (let i = 0; i < numRequests; i++) {
        requests.push(
          request(app)
            .get('/api/test-data/students')
            .expect(200)
        );
      }
      
      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(numRequests);
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });
    });
  });

  describe('Data Consistency and Validation', () => {
    test('should maintain data integrity through processing pipeline', async () => {
      const testData = [
        { id: 1, value: 100, category: 'A' },
        { id: 2, value: 200, category: 'B' },
        { id: 3, value: 300, category: 'A' }
      ];
      
      // Process data and verify integrity
      const response = await request(app)
        .post('/api/process-data')
        .send({
          data: testData,
          operations: [
            {
              type: 'filter',
              params: { column: 'category', operator: 'equals', value: 'A' }
            }
          ]
        });
      
      expect(response.status).toBe(200);
      const resultData = response.body.data;
      
      // Verify data integrity
      expect(resultData).toHaveLength(2);
      expect(resultData.every(row => row.category === 'A')).toBe(true);
      expect(resultData.every(row => typeof row.id === 'number')).toBe(true);
      expect(resultData.every(row => typeof row.value === 'number')).toBe(true);
    });

    test('should validate chart configuration consistency', async () => {
      const testData = [
        { name: 'Item1', value: 10 },
        { name: 'Item2', value: 20 },
        { name: 'Item3', value: 30 }
      ];
      
      const response = await request(app)
        .post('/api/generate-chart')
        .send({
          data: testData,
          chartType: 'bar',
          options: {
            xColumn: 'name',
            yColumn: 'value',
            title: 'Test Chart'
          }
        });
      
      expect(response.status).toBe(200);
      const chartConfig = response.body.config;
      
      // Verify chart configuration consistency
      expect(chartConfig.type).toBe('bar');
      expect(chartConfig.data.labels).toEqual(['Item1', 'Item2', 'Item3']);
      expect(chartConfig.data.datasets[0].data).toEqual([10, 20, 30]);
      expect(chartConfig.options.plugins.title.text).toBe('Test Chart');
    });
  });
});