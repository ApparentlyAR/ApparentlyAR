# ApparentlyAR Yes

A comprehensive educational data visualization platform that combines block-based programming with cutting-edge Augmented Reality technology. Designed for students in grades 8-10 to explore and visualize data through hands-on, creative learning experiences.

## Markers

Markers can be viewed and downloaded [here](https://github.com/nicolocarpignoli/artoolkit-barcode-markers-collection/tree/master/3x3_hamming_6_3)

## Features

### Core Platform

- **Block-Based Programming**: Drag-and-drop interface using Blockly for accessible data manipulation
- **Data Processing**: Filter, sort, aggregate, and transform data with visual programming blocks
- **Chart Generation**: Create various chart types (bar, line, scatter, pie, doughnut, area, histogram, box plot, heatmap, radar)
- **RESTful APIs**: Clean, well-documented API endpoints for data processing and visualization

### Augmented Reality Experiences

- **Hand Tracking AR**: MediaPipe-powered gesture recognition for intuitive chart manipulation
- **Marker-Based AR**: AR.js fiducial markers for precise chart positioning
- **Hybrid AR**: Combined marker detection and hand tracking for enhanced interaction
- **3D Visualizations**: Immersive data exploration in augmented reality environments

### Advanced Features

- **Modular Architecture**: Clean separation of concerns with reusable AR modules
- **Real-Time Processing**: Optimized performance with frame-skipping and efficient rendering
- **Interactive Charts**: Zoom, pan, click events, and hover effects for enhanced data exploration
- **Comprehensive Testing**: 95%+ test coverage with 190+ passing tests

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

The server will be available at `http://localhost:3000`

### Available Interfaces

- **Main Application**: `http://localhost:3000/` - Block-based programming interface
- **Hand Tracking AR**: `http://localhost:3000/ar-demo` - MediaPipe hand gesture controls
- **Hybrid AR Demo**: `http://localhost:3000/hybrid-ar` - Combined markers + hand tracking

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
http://localhost:3000
```

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

- `filter`: Filter data based on conditions
- `sort`: Sort data by column
- `aggregate`: Aggregate data (sum, average, count, min, max)
- `select`: Select specific columns
- `groupBy`: Group data by column and aggregate
- `calculate`: Calculate new columns based on expressions

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
- `boxplot`: Statistical box plots for quartile analysis
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

_Box Plot:_

```json
{
  "chartType": "boxplot",
  "options": {
    "valueColumn": "score",
    "groupColumn": "grade",
    "title": "Score Distribution by Grade"
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
│   │   └── components/               # React UI components
│   │       ├── AppHeader.jsx          # Application header
│   │       ├── ButtonPanel.jsx        # Control buttons
│   │       ├── ChartControls.jsx      # Chart configuration controls
│   │       ├── DataVisualizationPanel.jsx # Main chart display
│   │       ├── OutputDisplay.jsx      # Code output display
│   │       └── StatusIndicator.jsx    # Execution status indicator
│   ├── blocks/                        # Blockly custom blocks
│   │   ├── csv_import.js             # CSV import block definition
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
