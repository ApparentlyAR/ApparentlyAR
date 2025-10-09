const request = require('supertest');
const app = require('../../server');

describe('Server Routes', () => {
  describe('GET /', () => {
    it('should serve the main HTML file', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/test-data/:type', () => {
    it('should return students data', async () => {
      const response = await request(app).get('/api/test-data/students');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.summary).toBeDefined();
    });

    it('should return weather data', async () => {
      const response = await request(app).get('/api/test-data/weather');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.summary).toBeDefined();
    });

    it('should return sales data', async () => {
      const response = await request(app).get('/api/test-data/sales');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.summary).toBeDefined();
    });

    it('should return error for invalid data type', async () => {
      const response = await request(app).get('/api/test-data/invalid');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid data type. Use: students, weather, or sales');
    });
  });

  describe('POST /api/process-data', () => {
    it('should process data successfully', async () => {
      const testData = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 }
      ];
      const operations = [
        { type: 'filter', params: { column: 'age', operator: 'greater_than', value: 20 } }
      ];

      const response = await request(app)
        .post('/api/process-data')
        .send({ data: testData, operations });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.summary).toBeDefined();
    });

    it('should return error for invalid data format', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({ data: 'invalid', operations: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid data format');
    });

    it('should return error for missing data', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send({ operations: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid data format');
    });

    it('should handle processing errors', async () => {
      const testData = [
        { name: 'Alice', age: 25 }
      ];
      const operations = [
        { type: 'unsupported', params: {} }
      ];

      const response = await request(app)
        .post('/api/process-data')
        .send({ data: testData, operations });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Unsupported operation: unsupported');
    });
  });

  describe('POST /api/generate-chart', () => {
    it('should return error for missing data', async () => {
      const response = await request(app)
        .post('/api/generate-chart')
        .send({ chartType: 'bar' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Data and chart type required');
    });

    it('should return error for missing chart type', async () => {
      const response = await request(app)
        .post('/api/generate-chart')
        .send({ data: [] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Data and chart type required');
    });

    it('should handle chart generation errors', async () => {
      const testData = [
        { x: 'A', y: 10 }
      ];
      const chartType = 'unsupported';
      const options = { xColumn: 'x', yColumn: 'y' };

      const response = await request(app)
        .post('/api/generate-chart')
        .send({ data: testData, chartType, options });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Unsupported chart type: unsupported');
    });
  });

  describe('POST /api/ar-visualization', () => {
    it('should generate AR visualization successfully', async () => {
      const testData = [
        { x: 'A', y: 10 },
        { x: 'B', y: 20 }
      ];
      const visualizationType = 'bar';
      const markerId = 'test-marker';

      const response = await request(app)
        .post('/api/ar-visualization')
        .send({ data: testData, visualizationType, markerId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.arData).toBeDefined();
      expect(response.body.markerId).toBe(markerId);
    });

    it('should handle AR visualization errors', async () => {
      const testData = [
        { x: 'A', y: 10 }
      ];
      const visualizationType = 'unsupported';
      const markerId = 'test-marker';

      const response = await request(app)
        .post('/api/ar-visualization')
        .send({ data: testData, visualizationType, markerId });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Unsupported visualization type: unsupported');
    });
  });

  describe('Error handling middleware', () => {
    it('should handle JSON parsing errors', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
