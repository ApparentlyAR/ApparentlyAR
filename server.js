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
const bodyParser = require('body-parser');
const fs = require('fs');
const os = require('os');
const pathModule = require('path');

// Import backend modules
const dataProcessor = require('./src/backend/dataProcessor');
const chartGenerator = require('./src/backend/chartGenerator');
const { parseCSV } = require('./src/backend/csvHandler');
const { sampleData, weatherData, salesData } = require('./src/backend/testData');

// Import projects manager for persistent storage -Najla
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} = require('./src/backend/projectsManager'); // -Najla

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));
app.use('/src', express.static('src'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json({ limit: '10mb' }));

// Configure multer for handling multipart/form-data (file uploads)
const multer = require('multer');
const upload = multer({ dest: os.tmpdir() }); // Store uploads temporarily

/**
 * Serve the Login application page
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

/**
 * Serve the Teacher Dashboard application page
 */
app.get('/teacher-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teacher-dashboard.html'));
});

/**
 * Serve the Teacher Create a Project Dashboard application page
 */
app.get('/create-project', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create-project.html'));
});

/**
 * Serve the View Project application page
 */
app.get('/view-project', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view-project.html'));
});

/**
 * Serve the Student Dashboard application page
 */
app.get('/student-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html'));
});

/**
 * Serve the Blockly application page
 */
app.get('/blockly', (req, res) => {
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
 * GET /api/list-files
 * List all CSV files in the uploads directory.
 */
app.get('/api/list-files', async (req, res) => {
  try {
    const uploadsDir = pathModule.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ success: true, files: [] });
    }

    const files = fs.readdirSync(uploadsDir)
      .filter(file => file.toLowerCase().endsWith('.csv'))
      .sort((a, b) => {
        // Sort by modification time, newest first
        const statA = fs.statSync(pathModule.join(uploadsDir, a));
        const statB = fs.statSync(pathModule.join(uploadsDir, b));
        return statB.mtime - statA.mtime;
      });

    res.json({ success: true, files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

/**
 * GET /api/get-csv/:filename
 * Retrieve processed CSV data from the server.
 * Returns the latest saved data for the given filename.
 */
app.get('/api/get-csv/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Sanitize filename and ensure .csv extension
    const safeName = pathModule.basename(filename).replace(/[^\w\-.]/g, '_');
    const finalName = safeName.toLowerCase().endsWith('.csv') ? safeName : `${safeName}.csv`;

    const filePath = pathModule.join(__dirname, 'uploads', finalName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Read and parse the CSV file (use backend csvHandler to avoid browser-only deps)
    const csvText = fs.readFileSync(filePath, 'utf8');
    const parsed = parseCSV(csvText); // { headers, data }
    const rows = Array.isArray(parsed?.data) ? parsed.data : [];

    res.json({ 
      success: true, 
      data: rows,
      filename: finalName,
      path: `/uploads/${finalName}`
    });
  } catch (error) {
    console.error('Get CSV error:', error);
    res.status(500).json({ error: 'Failed to retrieve CSV' });
  }
});

/**
 * POST /api/save-csv
 * Persist processed data back to a CSV file on the server.
 * Body: { data: Array<object>, filename: string, overwrite?: boolean }
 */
app.post('/api/save-csv', async (req, res) => {
  try {
    const { data, filename, overwrite = true } = req.body || {};
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data: expected array' });
    }
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Sanitize filename and ensure .csv extension
    const safeName = pathModule.basename(filename).replace(/[^\w\-.]/g, '_');
    const finalName = safeName.toLowerCase().endsWith('.csv') ? safeName : `${safeName}.csv`;

    // Ensure uploads directory exists
    const uploadsDir = pathModule.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const targetPath = pathModule.join(uploadsDir, finalName);
    if (!overwrite && fs.existsSync(targetPath)) {
      return res.status(409).json({ error: 'File exists and overwrite=false' });
    }

    // Convert to CSV
    const toCsv = (rows) => {
      if (!rows.length) return '';
      const headers = Array.from(
        rows.reduce((set, row) => {
          Object.keys(row || {}).forEach((k) => set.add(k));
          return set;
        }, new Set())
      );
      const escape = (val) => {
        if (val == null) return '';
        const s = String(val);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };
      const lines = [headers.join(',')];
      for (const row of rows) {
        lines.push(headers.map((h) => escape(row[h])).join(','));
      }
      return lines.join('\n');
    };

    const csvText = toCsv(data);
    fs.writeFileSync(targetPath, csvText, 'utf8');

    res.json({ success: true, filename: finalName, path: `/uploads/${finalName}` });
  } catch (error) {
    console.error('Save CSV error:', error);
    res.status(500).json({ error: 'Failed to save CSV' });
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
 * Endpoint to fetch all projects
 * @author Najla - Replaced in-memory storage with persistent JSON storage
 */
app.get('/api/projects', (req, res) => {
  try {
    const projects = getAllProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

/**
 * Endpoint to fetch a single project by ID
 * @author Najla - Replaced in-memory storage with persistent JSON storage
 */
app.get('/api/projects/:id', (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = getProjectById(projectId);
    
    if (project) {
      res.json(project);
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

/**
 * Endpoint to save a new project with optional CSV file upload
 * @author Najla - Replaced in-memory storage with persistent JSON storage
 */
app.post('/api/projects', upload.single('csvFile'), (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }
    
    // Create the project first
    const newProject = createProject({ name, description });
    
    // If a CSV file was uploaded, process it and add to the project
    if (req.file) {
      const csvPath = req.file.path;
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const parsedData = parseCSV(csvContent);
      
      // Update the project to include the CSV data
      const updatedProject = updateProject(newProject.id, {
        name: newProject.name,
        description: newProject.description,
        csvData: parsedData.data,
        csvHeaders: parsedData.headers
      });
      
      // Clean up the temporary file
      fs.unlinkSync(csvPath);
      
      res.status(201).json(updatedProject);
    } else {
      res.status(201).json(newProject);
    }
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * Endpoint to update a project by ID
 * @author Najla - Replaced in-memory storage with persistent JSON storage
 */
app.put('/api/projects/:id', upload.single('csvFile'), async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    // Get the existing project to preserve data that isn't being updated
    const existingProject = getProjectById(projectId);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Prepare the update data
    let updateData = {
      name: req.body.name || existingProject.name,
      description: req.body.description || existingProject.description,
      status: req.body.status || existingProject.status
    };
    
    // If a CSV file was uploaded, process it and add to the project
    if (req.file) {
      const csvPath = req.file.path;
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const parsedData = parseCSV(csvContent);
      
      // Add CSV data to the update
      updateData.csvData = parsedData.data;
      updateData.csvHeaders = parsedData.headers;
      
      // Clean up the temporary file
      fs.unlinkSync(csvPath);
    }
    
    const updatedProject = updateProject(projectId, updateData);
    
    if (updatedProject) {
      res.json(updatedProject);
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * Endpoint to delete a project by ID
 * @author Najla - Added endpoint for deleting projects from JSON storage
 */
app.delete('/api/projects/:id', (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const deleted = deleteProject(projectId);
    
    if (deleted) {
      res.json({ message: 'Project deleted successfully' });
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
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
  // Function to start server on a specific port
  const startServer = (port) => {
    const server = app.listen(port, () => {
      console.log(`ApparentlyAR server running on http://localhost:${port}`);
      console.log(`Data visualization backend ready`);
      console.log(`AR endpoints available at /api/ar-visualization`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use.`);
        const nextPort = port + 1;
        // Try up to 10 consecutive ports
        if (nextPort < port + 10) {
          console.log(`Trying port ${nextPort}...`);
          startServer(nextPort);
        } else {
          console.error('Unable to find an available port after 10 attempts.');
          process.exit(1);
        }
      } else {
        console.error('Server error:', err);
      }
    });
  };

  // Start server on the configured port
  startServer(PORT);
}

module.exports = app;