/**
 * ApparentlyAR Backend Server
 * 
 * Express server providing data processing, chart generation, and AR visualization APIs
 * for the Block-Based Data Visualization platform.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import backend modules
const dataProcessor = require('./src/backend/dataProcessor');
const chartGenerator = require('./src/backend/chartGenerator');
const { sampleData, weatherData, salesData } = require('./src/backend/testData');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/src', express.static('src'));

/**
 * Serve the main application page
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blockly-demo.html'));
});

/**
 * Serve the AR demo page
 */
app.get('/ar-demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ar-demo.html'));
});

/**
 * Serve the hybrid AR demo page (AR.js markers + MediaPipe hands)
 */
app.get('/hybrid-ar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hybrid-ar-demo.html'));
});

/**
 * Serve the AR markers guide page
 */
app.get('/markers-guide', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'markers-guide.html'));
});

/**
 * GET /api/test-data/:type
 * 
 * Provides sample datasets for development and testing
 * 
 * @param {string} type - Dataset type: 'students', 'weather', or 'sales'
 * @returns {Object} JSON response with data and summary
 */
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
      return res.status(400).json({ 
        error: 'Invalid data type. Use: students, weather, or sales' 
      });
  }
  
  res.json({
    success: true,
    data: data,
    summary: dataProcessor.getDataSummary(data)
  });
});

/**
 * POST /api/process-data
 * 
 * Processes data through a series of operations (filter, sort, aggregate, etc.)
 * 
 * @param {Array} data - Array of data objects to process
 * @param {Array} operations - Array of operation objects with type and params
 * @returns {Object} JSON response with processed data and summary
 */
app.post('/api/process-data', async (req, res) => {
  try {
    const { data, operations } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const processedData = await dataProcessor.processData(data, operations);
    res.json({ 
      success: true, 
      data: processedData,
      summary: dataProcessor.getDataSummary(processedData)
    });
  } catch (error) {
    console.error('Data processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/generate-chart
 * 
 * Generates chart configuration for various chart types
 * 
 * @param {Array} data - Data to visualize
 * @param {string} chartType - Type of chart (bar, line, pie, etc.)
 * @param {Object} options - Chart configuration options
 * @returns {Object} JSON response with chart configuration
 */
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

/**
 * POST /api/ar-visualization
 * 
 * Generates AR-specific visualization data for augmented reality display
 * 
 * @param {Array} data - Data to visualize in AR
 * @param {string} visualizationType - Type of visualization
 * @param {string} markerId - AR marker identifier
 * @returns {Object} JSON response with AR visualization data
 */
app.post('/api/ar-visualization', async (req, res) => {
  try {
    const { data, visualizationType, markerId } = req.body;
    
    const arData = await chartGenerator.generateARVisualization(
      data, 
      visualizationType, 
      markerId
    );
    
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

/**
 * Global error handling middleware
 * Catches and handles any unhandled errors in the application
 */
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server only if this is the main module (not when imported for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ApparentlyAR server running on http://localhost:${PORT}`);
    console.log(`Data visualization backend ready`);
    console.log(`AR endpoints available at /api/ar-visualization`);
  });
}

module.exports = app;
