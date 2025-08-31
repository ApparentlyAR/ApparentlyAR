/**
 * Frontend Chart Generation Tests
 * 
 * Converts frontend-test.html chart generation functionality to Jest tests
 * Tests the full API integration flow from data fetching to chart generation
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

const request = require('supertest');
const app = require('../../server');

describe('Frontend Chart Generation Integration', () => {
  
  describe('Chart Generation with Different Data Types', () => {
    
    test('should generate bar chart with students data', async () => {
      // Step 1: Get sample data
      const dataResponse = await request(app)
        .get('/api/test-data/students')
        .expect(200);
      
      expect(dataResponse.body.success).toBe(true);
      expect(Array.isArray(dataResponse.body.data)).toBe(true);
      expect(dataResponse.body.data.length).toBeGreaterThan(0);
      
      // Step 2: Generate chart
      const chartResponse = await request(app)
        .post('/api/generate-chart')
        .send({
          data: dataResponse.body.data,
          chartType: 'bar',
          options: { title: 'Bar Chart - students Data' }
        })
        .expect(200);
      
      expect(chartResponse.body.success).toBe(true);
      expect(chartResponse.body.chartType).toBe('bar');
      expect(chartResponse.body.config).toBeDefined();
      expect(chartResponse.body.config.data).toBeDefined();
      expect(chartResponse.body.metadata).toBeDefined();
      expect(chartResponse.body.metadata.dataPoints).toBeGreaterThan(0);
    });

    test('should generate line chart with weather data', async () => {
      // Step 1: Get sample data
      const dataResponse = await request(app)
        .get('/api/test-data/weather')
        .expect(200);
      
      expect(dataResponse.body.success).toBe(true);
      
      // Step 2: Generate chart
      const chartResponse = await request(app)
        .post('/api/generate-chart')
        .send({
          data: dataResponse.body.data,
          chartType: 'line',
          options: { title: 'Line Chart - weather Data' }
        })
        .expect(200);
      
      expect(chartResponse.body.success).toBe(true);
      expect(chartResponse.body.chartType).toBe('line');
      expect(chartResponse.body.config.data.datasets).toBeDefined();
      expect(Array.isArray(chartResponse.body.config.data.datasets)).toBe(true);
    });

    test('should generate pie chart with sales data', async () => {
      // Step 1: Get sample data
      const dataResponse = await request(app)
        .get('/api/test-data/sales')
        .expect(200);
      
      expect(dataResponse.body.success).toBe(true);
      
      // Step 2: Generate chart
      const chartResponse = await request(app)
        .post('/api/generate-chart')
        .send({
          data: dataResponse.body.data,
          chartType: 'pie',
          options: { title: 'Pie Chart - sales Data' }
        })
        .expect(200);
      
      expect(chartResponse.body.success).toBe(true);
      expect(chartResponse.body.chartType).toBe('pie');
      expect(chartResponse.body.config.data.labels).toBeDefined();
      expect(chartResponse.body.config.data.datasets[0].data).toBeDefined();
    });

    test('should generate scatter plot with students data', async () => {
      const dataResponse = await request(app)
        .get('/api/test-data/students')
        .expect(200);
      
      const chartResponse = await request(app)
        .post('/api/generate-chart')
        .send({
          data: dataResponse.body.data,
          chartType: 'scatter',
          options: { title: 'Scatter Plot - students Data' }
        })
        .expect(200);
      
      expect(chartResponse.body.success).toBe(true);
      expect(chartResponse.body.chartType).toBe('scatter');
    });

    test('should generate doughnut chart with sales data', async () => {
      const dataResponse = await request(app)
        .get('/api/test-data/sales')
        .expect(200);
      
      const chartResponse = await request(app)
        .post('/api/generate-chart')
        .send({
          data: dataResponse.body.data,
          chartType: 'doughnut',
          options: { title: 'Doughnut Chart - sales Data' }
        })
        .expect(200);
      
      expect(chartResponse.body.success).toBe(true);
      expect(chartResponse.body.chartType).toBe('doughnut');
    });

    test('should generate area chart with weather data', async () => {
      const dataResponse = await request(app)
        .get('/api/test-data/weather')
        .expect(200);
      
      const chartResponse = await request(app)
        .post('/api/generate-chart')
        .send({
          data: dataResponse.body.data,
          chartType: 'area',
          options: { title: 'Area Chart - weather Data' }
        })
        .expect(200);
      
      expect(chartResponse.body.success).toBe(true);
      expect(chartResponse.body.chartType).toBe('area');
    });
    
  });

  describe('Chart Generation Response Structure', () => {
    
    test('should return proper chart configuration structure', async () => {
      const dataResponse = await request(app)
        .get('/api/test-data/students')
        .expect(200);
      
      const chartResponse = await request(app)
        .post('/api/generate-chart')
        .send({
          data: dataResponse.body.data,
          chartType: 'bar',
          options: { title: 'Test Chart' }
        })
        .expect(200);
      
      // Verify response structure matches frontend expectations
      expect(chartResponse.body).toHaveProperty('success', true);
      expect(chartResponse.body).toHaveProperty('chartType');
      expect(chartResponse.body).toHaveProperty('config');
      expect(chartResponse.body).toHaveProperty('metadata');
      
      // Verify config structure
      expect(chartResponse.body.config).toHaveProperty('data');
      expect(chartResponse.body.config).toHaveProperty('options');
      
      // Verify metadata structure
      expect(chartResponse.body.metadata).toHaveProperty('dataPoints');
      expect(chartResponse.body.metadata).toHaveProperty('columns');
      expect(Array.isArray(chartResponse.body.metadata.columns)).toBe(true);
    });

    test('should include interactive features in chart options', async () => {
      const dataResponse = await request(app)
        .get('/api/test-data/students')
        .expect(200);
      
      const chartResponse = await request(app)
        .post('/api/generate-chart')
        .send({
          data: dataResponse.body.data,
          chartType: 'bar',
          options: { title: 'Interactive Chart Test' }
        })
        .expect(200);
      
      // Check for interactive features that frontend-test.html tested
      expect(chartResponse.body.config.options).toBeDefined();
      expect(chartResponse.body.config.options.responsive).toBeDefined();
    });
    
  });

  describe('Data Type Validation', () => {
    
    test('should handle all supported data types', async () => {
      const dataTypes = ['students', 'weather', 'sales'];
      
      for (const dataType of dataTypes) {
        const response = await request(app)
          .get(`/api/test-data/${dataType}`)
          .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.summary).toBeDefined();
      }
    });

    test('should handle invalid data type', async () => {
      const response = await request(app)
        .get('/api/test-data/invalid_type')
        .expect(400);
      
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toContain('Invalid data type');
    });
    
  });

  describe('Chart Type Validation', () => {
    
    test('should handle all supported chart types', async () => {
      const dataResponse = await request(app)
        .get('/api/test-data/students')
        .expect(200);
      
      const chartTypes = ['bar', 'line', 'pie', 'scatter', 'doughnut', 'area'];
      
      for (const chartType of chartTypes) {
        const chartResponse = await request(app)
          .post('/api/generate-chart')
          .send({
            data: dataResponse.body.data,
            chartType: chartType,
            options: { title: `Test ${chartType} Chart` }
          })
          .expect(200);
        
        expect(chartResponse.body.success).toBe(true);
        expect(chartResponse.body.chartType).toBe(chartType);
      }
    });
    
  });

});