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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

// Import backend modules
const dataProcessor = require('./src/backend/dataProcessor');
const chartGenerator = require('./src/backend/chartGenerator');
const { sampleData, weatherData, salesData } = require('./src/backend/testData');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      mediaSrc: ["'self'", "blob:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));
app.use('/src', express.static('src'));

// Input validation schemas
const schemas = {
  processData: Joi.object({
    data: Joi.array().items(Joi.object()).required().max(10000),
    operations: Joi.array().items(
      Joi.object({
        type: Joi.string().required(),
        params: Joi.object().required()
      })
    ).required().max(50)
  }).options({ allowUnknown: true }),
  
  generateChart: Joi.object({
    data: Joi.array().items(Joi.object()).required().max(10000),
    chartType: Joi.string().required(),
    options: Joi.object().required()
  }).options({ allowUnknown: true }),
  
  arVisualization: Joi.object({
    data: Joi.array().items(Joi.object()).required().max(5000),
    visualizationType: Joi.string().required(),
    markerId: Joi.string().max(50).required()
  }).options({ allowUnknown: true })
};

// Validation middleware - only validates structure, not business logic
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      details: error.details.map(d => d.message) 
    });
  }
  next();
};

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
    
    // Security: Limit data size to prevent DoS
    if (data.length > 10000) {
      return res.status(400).json({ error: 'Data array too large (max 10000 items)' });
    }
    
    if (operations && (!Array.isArray(operations) || operations.length > 50)) {
      return res.status(400).json({ error: 'Operations array invalid or too large (max 50)' });
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
    
    // Security: Limit data size and validate types
    if (!Array.isArray(data) || data.length > 10000) {
      return res.status(400).json({ error: 'Invalid data format or too large (max 10000 items)' });
    }
    
    if (typeof chartType !== 'string' || chartType.length > 50) {
      return res.status(400).json({ error: 'Invalid chart type' });
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
  console.error('Server error:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'development' 
    ? error.message 
    : 'Internal server error';
    
  res.status(error.status || 500).json({ 
    error: message,
    timestamp: new Date().toISOString()
  });
});

// Handle 404 errors
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
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
