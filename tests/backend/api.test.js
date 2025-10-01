const request = require('supertest');

// Import the server app without starting it
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import data processing modules
const dataProcessor = require('../../src/backend/dataProcessor');
const chartGenerator = require('../../src/backend/chartGenerator');
const { sampleData, weatherData, salesData } = require('../../src/backend/testData');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public', 'blockly-demo.html'));
});

// Test endpoints for development
app.get('/api/test-data/:type', (req, res) => {
  const { type } = req.params;
  let data;
  
  switch (type) {
    case 'students':
      data = sampleData;
      break;
    case 'weather':
      data = weatherData;
      break;
    case 'sales':
      data = salesData;
      break;
    default:
      return res.status(400).json({ error: 'Invalid data type. Use: students, weather, or sales' });
  }
  
  res.json({
    success: true,
    data: data,
    summary: dataProcessor.getDataSummary(data)
  });
});

// Data processing endpoints
app.post('/api/process-data', async (req, res) => {
  try {
    const { data, operations } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const processedData = await dataProcessor.processData(data, operations);
    
    // Handle aggregate operations that return single values
    if (operations.length === 1 && operations[0].type === 'aggregate') {
      res.json({ 
        success: true, 
        data: processedData
      });
    } else {
      res.json({ 
        success: true, 
        data: processedData,
        summary: dataProcessor.getDataSummary(processedData)
      });
    }
  } catch (error) {
    console.error('Data processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chart generation endpoints
app.post('/api/generate-chart', async (req, res) => {
  try {
    const { data, chartType, options } = req.body;
    
    if (!data || !chartType) {
      return res.status(400).json({ error: 'Data and chart type required' });
    }

    const chartResult = await chartGenerator.generateChart(data, chartType, options);
    res.json(chartResult);
  } catch (error) {
    console.error('Chart generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AR data endpoints
app.post('/api/ar-visualization', async (req, res) => {
  try {
    const { data, visualizationType, markerId } = req.body;
    
    // Generate AR-specific visualization data
    const arData = await chartGenerator.generateARVisualization(data, visualizationType, markerId);
    res.json({ 
      success: true, 
      arData: arData,
      markerId: markerId
    });
  } catch (error) {
    console.error('AR visualization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

describe('API Endpoints', () => {
  const sampleData = [
    { name: 'Alice', age: 25, score: 85, grade: 'A' },
    { name: 'Bob', age: 22, score: 92, grade: 'A' },
    { name: 'Charlie', age: 28, score: 78, grade: 'B' }
  ];

  describe('GET /', () => {
    test('should serve the main HTML page', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('ApparentlyAR');
    });
  });

  describe('GET /api/test-data/:type', () => {
    test('should return student data', async () => {
      const response = await request(app).get('/api/test-data/students');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('age');
      expect(response.body.data[0]).toHaveProperty('score');
      expect(response.body.data[0]).toHaveProperty('grade');
      expect(response.body.summary.rows).toBe(10);
      expect(response.body.summary.columns).toBe(4);
    });

    test('should return weather data', async () => {
      const response = await request(app).get('/api/test-data/weather');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(12);
      expect(response.body.data[0]).toHaveProperty('month');
      expect(response.body.data[0]).toHaveProperty('temperature');
      expect(response.body.data[0]).toHaveProperty('rainfall');
      expect(response.body.data[0]).toHaveProperty('humidity');
    });

    test('should return sales data', async () => {
      const response = await request(app).get('/api/test-data/sales');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(12);
      expect(response.body.data[0]).toHaveProperty('product');
      expect(response.body.data[0]).toHaveProperty('sales');
      expect(response.body.data[0]).toHaveProperty('revenue');
      expect(response.body.data[0]).toHaveProperty('region');
    });

    test('should return error for invalid data type', async () => {
      const response = await request(app).get('/api/test-data/invalid');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid data type');
    });
  });

  describe('POST /api/process-data', () => {
    test('should process data with filter operation', async () => {
      const requestBody = {
        data: sampleData,
        operations: [
          {
            type: 'filter',
            params: { column: 'grade', operator: 'equals', value: 'A' }
          }
        ]
      };

      const response = await request(app)
        .post('/api/process-data')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(row => row.grade === 'A')).toBe(true);
      expect(response.body.summary.rows).toBe(2);
    });

    test('should process data with multiple operations', async () => {
      const requestBody = {
        data: sampleData,
        operations: [
          {
            type: 'filter',
            params: { column: 'score', operator: 'greater_than', value: 80 }
          },
          {
            type: 'sort',
            params: { column: 'score', direction: 'desc' }
          }
        ]
      };

      const response = await request(app)
        .post('/api/process-data')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].score).toBe(92); // Highest score first
      expect(response.body.data[1].score).toBe(85); // Lower score second
    });

    test('should process data with aggregate operation', async () => {
      const requestBody = {
        data: sampleData,
        operations: [
          {
            type: 'aggregate',
            params: { column: 'score', operation: 'average' }
          }
        ]
      };

      const response = await request(app)
        .post('/api/process-data')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe(85); // (85 + 92 + 78) / 3
    });

    test('should return error for invalid data format', async () => {
      const requestBody = {
        data: 'not an array',
        operations: []
      };

      const response = await request(app)
        .post('/api/process-data')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid data format');
    });

    test('should return error for missing data', async () => {
      const requestBody = {
        operations: []
      };

      const response = await request(app)
        .post('/api/process-data')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid data format');
    });

    test('should handle processing errors', async () => {
      const requestBody = {
        data: sampleData,
        operations: [
          {
            type: 'unsupported',
            params: {}
          }
        ]
      };

      const response = await request(app)
        .post('/api/process-data')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Unsupported operation');
    });
  });

  describe('POST /api/generate-chart', () => {
    test('should generate bar chart', async () => {
      const requestBody = {
        data: sampleData,
        chartType: 'bar',
        options: {
          xColumn: 'name',
          yColumn: 'score',
          title: 'Student Scores'
        }
      };

      const response = await request(app)
        .post('/api/generate-chart')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.chartType).toBe('bar');
      expect(response.body.config.type).toBe('bar');
      expect(response.body.config.data.labels).toEqual(['Alice', 'Bob', 'Charlie']);
      expect(response.body.config.data.datasets[0].data).toEqual([85, 92, 78]);
      expect(response.body.metadata.dataPoints).toBe(3);
    });

    test('should generate line chart', async () => {
      const requestBody = {
        data: sampleData,
        chartType: 'line',
        options: {
          xColumn: 'name',
          yColumn: 'age',
          title: 'Student Ages'
        }
      };

      const response = await request(app)
        .post('/api/generate-chart')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.chartType).toBe('line');
      expect(response.body.config.type).toBe('line');
    });

    test('should generate pie chart', async () => {
      const requestBody = {
        data: sampleData,
        chartType: 'pie',
        options: {
          labelColumn: 'name',
          valueColumn: 'score',
          title: 'Student Scores Distribution'
        }
      };

      const response = await request(app)
        .post('/api/generate-chart')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.chartType).toBe('pie');
      expect(response.body.config.type).toBe('pie');
    });

    test('should return error for missing data', async () => {
      const requestBody = {
        chartType: 'bar',
        options: {}
      };

      const response = await request(app)
        .post('/api/generate-chart')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Data and chart type required');
    });

    test('should return error for missing chart type', async () => {
      const requestBody = {
        data: sampleData,
        options: {}
      };

      const response = await request(app)
        .post('/api/generate-chart')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Data and chart type required');
    });

    test('should handle chart generation errors', async () => {
      const requestBody = {
        data: sampleData,
        chartType: 'unsupported',
        options: {}
      };

      const response = await request(app)
        .post('/api/generate-chart')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Unsupported chart type');
    });
  });

  describe('POST /api/ar-visualization', () => {
    test('should generate AR visualization data', async () => {
      const requestBody = {
        data: sampleData,
        visualizationType: 'bar',
        markerId: 'test-marker-1'
      };

      const response = await request(app)
        .post('/api/ar-visualization')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.arData.markerId).toBe('test-marker-1');
      expect(response.body.arData.visualizationType).toBe('bar');
      expect(response.body.arData.chartData).toBeDefined();
      expect(response.body.arData.options).toBeDefined();
      expect(response.body.arData.metadata.dataPoints).toBe(3);
    });

    test.skip('should handle AR visualization errors', async () => {
      const requestBody = {
        data: sampleData,
        visualizationType: 'unsupported',
        markerId: 'test-marker-1'
      };

      const response = await request(app)
        .post('/api/ar-visualization')
        .send(requestBody)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('is not a function');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown');
      
      expect(response.status).toBe(404);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/process-data')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
