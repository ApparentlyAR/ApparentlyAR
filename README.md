# ApparentlyAR Yes

A comprehensive educational data visualization platform that combines block-based programming with cutting-edge Augmented Reality technology. Designed for students in grades 8-10 to explore and visualize data through hands-on, creative learning experiences.

## Markers

Markers can be viewed and downloaded [here](https://github.com/nicolocarpignoli/artoolkit-barcode-markers-collection/tree/master/3x3_hamming_6_3)

## Features

### Core Platform

- **Block-Based Programming**: Drag-and-drop interface using Blockly for accessible data manipulation
- **Backend Data Processing**: Server-side data operations for improved performance on low-powered devices
- **Advanced Data Operations**: Filter, sort, aggregate, group, and calculate with visual programming blocks
- **Chart Generation**: Create various chart types (bar, line, scatter, pie, doughnut, area, histogram, heatmap, radar)
- **RESTful APIs**: Clean, well-documented API endpoints for data processing and visualization
- **Frontend API Client**: Centralized API communication with comprehensive error handling

### Augmented Reality Experiences

- **Hand Tracking AR**: MediaPipe-powered gesture recognition for intuitive chart manipulation
- **Marker-Based AR**: AR.js fiducial markers for precise chart positioning
- **Hybrid AR**: Combined marker detection and hand tracking for enhanced interaction
- **3D Visualizations**: Immersive data exploration in augmented reality environments

### Advanced Features

- **Modular Architecture**: Clean separation of concerns with reusable AR modules
- **Backend Data Processing**: Server-side operations for improved performance on low-powered devices
- **Real-Time Processing**: Optimized performance with frame-skipping and efficient rendering
- **Interactive Charts**: Zoom, pan, click events, and hover effects for enhanced data exploration
- **Comprehensive Testing**: 95%+ test coverage with 230+ passing tests including backend integration

## Quick Start

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/ApparentlyAR/ApparentlyAR.git
cd ApparentlyAR

# Install dependencies
npm install

# Start the development server
npm run dev

# Or start production server
npm start
```

The server will be available at `http://localhost:3000` by default. If port 3000 is already in use, the server will automatically try the next available port (up to 10 consecutive ports).

### Available Interfaces

- **Main Application**: `http://localhost:[PORT]/` - Block-based programming interface
- **Hand Tracking AR**: `http://localhost:[PORT]/ar-demo` - MediaPipe hand gesture controls
- **Hybrid AR Demo**: `http://localhost:[PORT]/hybrid-ar` - Combined markers + hand tracking

Where `[PORT]` is the port number shown in the server startup message (3000 by default, or the next available port if 3000 is in use).

### Blockly Data Operations (New)

- New blocks: `filter_data`, `sort_data`, `select_columns`, `group_by`, `calculate_column`, `drop_empty`.
- CSV import uses PapaParse; parsed rows are available at `Blockly.CsvImportData.data`.
- Generators register after Blockly is ready and support both classic and `forBlock` APIs.
- The system accepts arrays, PapaParse results (`{ data: [...] }`), or JSON strings.
- If a block still shows placeholders (e.g., `column`, `value`), it no-ops instead of calling the backend.

Troubleshooting:
- If you see “generator does not know how to generate code,” hard refresh (Ctrl+F5) to reload scripts.
- If you see “input data must be an array,” ensure the CSV finished parsing or chain from the `csv_import` block.

## Architecture Overview

### Modular JavaScript Structure

The platform uses a clean, modular architecture with AR functionality separated into reusable modules:

```
src/ar/
├── coordinate-system.js      # Screen-to-world coordinate conversion
├── gesture-detector.js       # MediaPipe hand gesture recognition
├── chart-manager.js          # Chart creation and lifecycle management
├── hand-tracking.js          # MediaPipe integration and video processing
└── hybrid-ar-controller.js  # Main controller orchestrating all subsystems
```

### Key Benefits

- **Maintainable**: Each module has a single responsibility
- **Testable**: Individual components can be unit tested
- **Reusable**: AR modules can be imported into other projects
- **Debuggable**: Easier to isolate and fix issues in specific areas

## API Documentation

### Base URL

```
http://localhost:[PORT]
```

Where `[PORT]` is the port number shown in the server startup message (3000 by default, or the next available port if 3000 is in use).

### Endpoints

#### GET `/`

Serves the main block-based programming interface.

#### GET `/ar-demo`

Serves the hand tracking AR demonstration page.

#### GET `/hybrid-ar`

Serves the hybrid AR demo combining marker detection with hand tracking.

#### GET `/api/test-data/:type`

Provides sample datasets for development and testing.

**Parameters:**

- `type` (string): Dataset type - `students`, `weather`, or `sales`

**Response:**

```json
{
  "success": true,
  "data": [...],
  "summary": {
    "rows": 10,
    "columns": 4,
    "summary": {...}
  }
}
```

#### POST `/api/process-data`

Processes data through a series of operations.

**Request Body:**

```json
{
  "data": [...],
  "operations": [
    {
      "type": "filter",
      "params": {
        "column": "age",
        "operator": "greater_than",
        "value": 20
      }
    }
  ]
}
```

**Supported Operations:**

- `filter`: Filter data based on conditions (equals, not_equals, greater_than, less_than, contains, etc.)
- `sort`: Sort data by column in ascending or descending order
- `select`: Select specific columns from the dataset
- `groupBy`: Group data by column and apply aggregations (sum, average, count, min, max)
- `calculate`: Calculate new columns based on mathematical expressions
- `dropEmpty`: Remove rows with empty values in specified columns

**Performance Benefits:**
- Server-side processing reduces client load
- Optimized for large datasets
- Better performance on mobile and low-powered devices
- Non-blocking UI during data processing

#### POST `/api/generate-chart`

Generates chart configuration for various chart types.

**Request Body:**

```json
{
  "data": [...],
  "chartType": "bar",
  "options": {
    "xColumn": "month",
    "yColumn": "sales",
    "title": "Monthly Sales"
  }
}
```

**Supported Chart Types:**

- `bar`: Bar charts with interactive zoom/pan and click events
- `line`: Line charts with interactive features and hover effects
- `scatter`: Scatter plots with zoom capabilities and point selection
- `pie`: Pie charts for categorical data
- `doughnut`: Doughnut charts for categorical data with center space
- `area`: Area charts for trend visualization
- `histogram`: Frequency distribution charts with customizable bins
- `heatmap`: 2D data correlation visualization
- `radar`: Multi-dimensional data comparison charts

**Chart-Specific Options:**

_Histogram:_

```json
{
  "chartType": "histogram",
  "options": {
    "valueColumn": "age",
    "bins": 10,
    "title": "Age Distribution"
  }
}
```

_Heatmap:_

```json
{
  "chartType": "heatmap",
  "options": {
    "xColumn": "month",
    "yColumn": "region",
    "valueColumn": "sales",
    "title": "Sales Heatmap"
  }
}
```

_Radar Chart:_

```json
{
  "chartType": "radar",
  "options": {
    "columns": ["math", "science", "english", "history"],
    "labelColumn": "student",
    "title": "Student Performance"
  }
}
```

**Interactive Features:**

- **Zoom & Pan**: Mouse wheel zoom, click-drag pan on bar, line, scatter, histogram charts
- **Click Events**: Data point selection and logging for drill-down capabilities
- **Hover Effects**: Enhanced tooltips and cursor changes on interactive elements
- **Animations**: Smooth chart transitions with customizable easing

#### POST `/api/ar-visualization`

Generates AR-specific visualization data.

**Request Body:**

```json
{
  "data": [...],
  "visualizationType": "bar",
  "markerId": "marker-001"
}
```

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The backend maintains **95%+ test coverage** across:

- **Statements**: 95.43%
- **Functions**: 95.52%
- **Lines**: 95.41%
- **Branches**: 81.14%

### New Backend Integration Tests

Recent additions include comprehensive testing for:

- **Frontend API Integration**: Tests for React components using backend APIs
- **Blockly Data Processing**: Tests for visual programming blocks with backend operations
- **CSV File Processing**: Real-world data processing with user-provided CSV files
- **End-to-End Workflows**: Complete data processing pipelines from CSV to visualization

### Test Structure

```
tests/
├── backend/
│   ├── api.test.js              # API endpoint tests
│   ├── chartGenerator.test.js   # Chart generation tests
│   ├── dataProcessor.test.js    # Data processing tests
│   ├── server.test.js           # Server integration tests
│   └── testData.test.js         # Sample data tests
├── frontend/
│   ├── chartGeneration.test.js  # Chart generation frontend tests
│   ├── dataProcessingFrontend.test.js # Frontend API integration tests
│   ├── blocklyProcessing.test.js # Blockly backend integration tests
│   ├── csvFileProcessing.test.js # Real CSV file processing tests
│   ├── errorHandling.test.js    # Error handling tests
│   ├── eventCommunication.test.js # Event system tests
│   └── hybridAR.test.js         # Hybrid AR system tests
├── csv_demo.test.js             # CSV demo functionality tests
├── csv_final.test.js            # CSV final implementation tests
├── csv_import.test.js           # CSV import block tests
├── csv_import_integration.test.js # CSV integration tests
├── csv_import_simple.test.js    # Basic CSV import tests
└── sum.test.js                  # Basic functionality test
```

## Project Structure

```
ApparentlyAR/
├── server.js                          # Main Express server
├── package.json                       # Dependencies and scripts
├── jest.config.js                     # Jest test configuration
├── webpack.config.js                  # Webpack build configuration
├── LICENSE                            # Project license
├── README.md                          # Project documentation
├── frontend-test.html                 # Frontend testing page
├── sampleui.html                      # Sample UI demonstration
├── public/                            # Static assets and built files
│   ├── blockly-demo.html             # Main application HTML
│   ├── ar-demo.html                  # Hand tracking AR interface
│   ├── hybrid-ar-demo.html           # Hybrid AR demo interface
│   ├── favicon.ico                    # Site icon
│   ├── react-bundle.js               # Built React bundle
│   ├── react-bundle.js.map           # Source maps
│   └── react-bundle.js.LICENSE.txt   # Bundle licenses
├── src/                               # Source code
│   ├── backend/                       # Server-side modules
│   │   ├── dataProcessor.js           # Data processing operations
│   │   ├── chartGenerator.js          # Chart generation logic
│   │   └── testData.js               # Sample datasets
│   ├── ar/                            # Augmented Reality modules
│   │   ├── coordinate-system.js       # Screen-to-world coordinate conversion
│   │   ├── gesture-detector.js        # MediaPipe hand gesture recognition
│   │   ├── chart-manager.js           # Chart creation and lifecycle management
│   │   ├── hand-tracking.js           # MediaPipe integration and processing
│   │   └── hybrid-ar-controller.js    # Main AR controller orchestration
│   ├── react/                         # React frontend components
│   │   ├── index.js                  # Main React application entry
│   │   ├── api.js                    # Frontend API client for backend communication
│   │   └── components/               # React UI components
│   │       ├── AppHeader.jsx          # Application header
│   │       ├── ButtonPanel.jsx        # Control buttons
│   │       ├── ChartControls.jsx      # Chart configuration controls with data processing
│   │       ├── DataVisualizationPanel.jsx # Main chart display with backend integration
│   │       ├── OutputDisplay.jsx      # Code output display
│   │       └── StatusIndicator.jsx    # Execution status indicator
│   ├── blocks/                        # Blockly custom blocks
│   │   ├── csv_import.js             # CSV import block definition
│   │   ├── data_ops.js               # Data processing block for backend operations
│   │   └── to_json.js                # JSON conversion block
│   └── sum.js                         # Utility function (legacy)
├── tests/                             # Test suites
│   ├── backend/                       # Backend tests
│   │   ├── api.test.js               # API endpoint tests
│   │   ├── chartGenerator.test.js     # Chart generation tests
│   │   ├── dataProcessor.test.js      # Data processing tests
│   │   ├── server.test.js            # Server integration tests
│   │   └── testData.test.js          # Sample data tests
│   ├── frontend/                      # Frontend and AR tests
│   │   ├── chartGeneration.test.js    # Chart generation frontend tests
│   │   ├── errorHandling.test.js      # Error handling tests
│   │   ├── eventCommunication.test.js # Event system tests
│   │   └── hybridAR.test.js          # Hybrid AR system tests
│   ├── csv_demo.test.js              # CSV demo functionality tests
│   ├── csv_final.test.js             # CSV final implementation tests
│   ├── csv_import.test.js            # CSV import block tests
│   ├── csv_import_integration.test.js # CSV integration tests
│   ├── csv_import_simple.test.js     # Basic CSV import tests
│   └── sum.test.js                   # Basic utility tests
└── node_modules/                      # Dependencies (auto-generated)
```

## Development

### Code Quality

- **JSDoc Comments**: Comprehensive documentation for all functions
- **Error Handling**: Robust error handling with meaningful messages
- **Input Validation**: Thorough validation of all inputs
- **Consistent Formatting**: Clean, readable code structure

### Adding New Features

1. Create feature branch: `git checkout -b feature/new-feature`
2. Implement functionality with tests
3. Ensure 100% test coverage for new code
4. Update documentation
5. Submit pull request

### Code Style

- Use meaningful variable and function names
- Add JSDoc comments for all public functions
- Handle errors gracefully
- Write comprehensive tests
- Follow existing code patterns

## Sample Data

The backend includes three sample datasets:

### Students Data

Educational data with student information including names, ages, scores, and grades.

### Weather Data

Monthly weather data with temperature, rainfall, and humidity for environmental analysis.

### Sales Data

Business analytics data with product sales, revenue, and regional information.

---

**Built with ❤️ for DECO3801**