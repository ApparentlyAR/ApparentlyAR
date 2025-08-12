const express = require('express');
const cors = require('cors');

const path = require('path');


// Import data processing modules
const dataProcessor = require('./src/backend/dataProcessor');
const chartGenerator = require('./src/backend/chartGenerator');
const { sampleData, weatherData, salesData } = require('./src/backend/testData');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));



// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blockly-demo.html'));
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

// Start server
app.listen(PORT, () => {
  console.log(`ApparentlyAR server running on http://localhost:${PORT}`);
  console.log(`Data visualization backend ready`);
  console.log(`AR endpoints available at /api/ar-visualization`);
});
