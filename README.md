# ApparentlyAR

ApparentlyAR is a browser‑based learning platform that lets students import a CSV, transform it with Blockly blocks, and visualise results in 2D (Chart.js) and in AR (AR.js/A‑Frame + optional MediaPipe Hands). It runs locally with a lightweight Node/Express backend.

## Markers

Markers can be viewed and downloaded [here](https://github.com/nicolocarpignoli/artoolkit-barcode-markers-collection/tree/master/3x3_hamming_6_3)

## Features

- **Block‑based data wrangling**: Import CSV, filter/sort/range, group/aggregate, transform, and compute statistics via custom Blockly blocks.
- **Charts**: Bar, line, scatter, pie/doughnut, histogram, heatmap, radar (client‑side and/or backend‑assisted config).
- **AR visualisation**: Marker‑based AR (AR.js/A‑Frame). Optional on‑device pointing/tooltip via MediaPipe Hands.
- **Lightweight backend**: Node/Express APIs for data processing, chart generation, CSV upload/list/save, and sample datasets.
- **Teacher/Student pages**: Static dashboards and project views with JSON‑file persistence for prototype use.

## Quick Start

### Prerequisites

- Node.js >= 14 (tested with Node 20)
- npm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/ApparentlyAR/ApparentlyAR.git
cd ApparentlyAR

# Install dependencies
npm install

# Start in development (auto‑reload)
npm run dev

# Or start in production mode
npm start
```

The server runs at `http://localhost:3000` by default. If 3000 is in use, it tries the next ports.

### AR prerequisites

- Use Chrome or Edge with camera permissions granted.
- For AR on devices, prefer HTTPS origins or localhost for getUserMedia.
- Print ARToolKit barcode markers (see Markers link above). Ensure good lighting and minimal glare.

### App pages

Pretty routes are provided (the `.html` files are also served statically):

- Login: `http://localhost:[PORT]/` (serves `login.html`)
- Student Dashboard: `http://localhost:[PORT]/student-dashboard`
- Teacher Dashboard: `http://localhost:[PORT]/teacher-dashboard`
- Create Project: `http://localhost:[PORT]/create-project`
- Edit Project: `http://localhost:[PORT]/edit-project.html` (static)
- View Project: `http://localhost:[PORT]/view-project`
- Blockly Workspace: `http://localhost:[PORT]/blockly`
- AR Demo (hands only): `http://localhost:[PORT]/ar-demo.html`
- Hybrid AR Demo (markers + hands): `http://localhost:[PORT]/hybrid-ar`

### Teacher login

- Default facilitator password: `secret` (stored in `facilitator-auth.json`).
- Start at `http://localhost:[PORT]/` (login), then navigate to `Teacher Dashboard`.
- Password can be changed via the backend endpoint `PUT /api/facilitator/password` (requires current and new password in JSON body).

### Blockly Block Categories

#### Data Operations
- `csv_import`: Import CSV files for data analysis
- `filter_data`: Filter data based on conditions (equals, not equals, greater than, less than, contains)
- `filter_range`: Filter data within a numeric range (between min and max)
- `sort_data`: Sort data by column in ascending or descending order
- `select_columns`: Select specific columns from the dataset
- `group_by`: Group data and apply aggregations (sum, average, count, min, max)
- `calculate_column`: Calculate new columns using mathematical expressions
- `drop_empty`: Remove rows with empty values
- `to_json`: Convert data to JSON format

#### Data Transformation Blocks (New)
- `tf_rename_column`: Rename columns in the dataset
- `tf_drop_column`: Remove specific columns
- `tf_fill_missing`: Fill missing values with specified strategies
- `tf_replace_values`: Replace specific values in columns
- `tf_split_column`: Split column values into multiple columns
- `tf_concat_columns`: Concatenate multiple columns
- `tf_drop_duplicates`: Remove duplicate rows
- `tf_round_number`: Round numeric values to specified precision
- `tf_cast_type`: Convert column data types
- `tf_string_transform`: Apply string transformations (uppercase, lowercase, trim)

#### Statistical Analysis Blocks
- `descriptive_stats`: Calculate descriptive statistics (mean, median, std, etc.)
- `calculate_mean`: Calculate mean of a column
- `calculate_median`: Calculate median of a column
- `calculate_std`: Calculate standard deviation
- `calculate_correlation`: Calculate correlation between columns
- `detect_outliers`: Identify statistical outliers
- `frequency_count`: Count frequency of values
- `calculate_percentiles`: Calculate percentile values

#### Visualization Blocks
- `set_chart_type`: Define chart type (bar, line, scatter, pie, etc.)
- `set_axes`: Configure X and Y axes
- `chart_options`: Set chart display options
- `advanced_chart_options`: Configure advanced chart features
- `generate_visualization`: Generate complete chart from configuration
- `quick_chart`: Quickly create basic charts
- `histogram_config`: Create histogram visualizations
- `heatmap_config`: Create heatmap visualizations

**Technical Notes:**
- CSV import uses PapaParse (client‑side); parsed rows are available at `Blockly.CsvImportData.data`.
- Generators register after Blockly is ready and support classic and `forBlock` APIs.
- System accepts arrays, PapaParse results (`{ data: [...] }`), or JSON strings.
- Backend processing via `/api/process-data` is available for heavier transforms.

**Troubleshooting:**
- "Generator does not know how to generate code": Hard refresh (Ctrl+F5) to reload scripts
- "Input data must be an array": Ensure CSV finished parsing or chain from `csv_import` block
- Visualization not appearing: Check browser console for errors and ensure data is loaded

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

Serves the login page.

#### GET `/ar-demo`

Serves the hand‑tracking AR demo.

#### GET `/hybrid-ar`

Serves the hybrid AR demo (markers + hands).

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

### Coverage

Run `npm run test:coverage` to generate coverage. An HTML report will appear under `coverage/`.

### New Backend Integration Tests

Recent additions include comprehensive testing for:

- **Frontend API Integration**: Tests for native JS implementation using backend APIs
- **Blockly Data Processing**: Tests for visual programming blocks with backend operations
- **CSV File Processing**: Real-world data processing with user-provided CSV files
- **Data Transformation Blocks**: Tests for the new transformation block functionality
- **Statistical Analysis**: Tests for statistical computation blocks
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
│   ├── blocklyProcessing.test.js  # Blockly backend integration tests
│   ├── chartGeneration.test.js    # Chart generation frontend tests
│   ├── csvFileProcessing.test.js  # Real CSV file processing tests
│   ├── dataProcessingFrontend.test.js # Frontend API integration tests
│   ├── errorHandling.test.js      # Error handling tests
│   ├── eventCommunication.test.js # Event system tests
│   ├── hybridAR.test.js           # Hybrid AR system tests
│   ├── statisticalBlocks.test.js  # Statistical analysis block tests
│   └── transformationBlocks.test.js # Data transformation block tests (NEW)
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
├── .gitignore                         # Git ignore rules
├── Adelaide_Crime_Breakdown_by_Year.csv # Sample crime data
├── test_data.csv                      # Test dataset
├── public/                            # Static assets and HTML pages
│   ├── blockly-demo.html             # Main block programming interface (with resizable panels)
│   ├── login.html                     # User authentication page
│   ├── student-dashboard.html         # Student project management
│   ├── teacher-dashboard.html         # Teacher project management
│   ├── create-project.html            # Project creation interface
│   ├── edit-project.html              # Project editing interface
│   ├── view-project.html              # Project viewing interface
│   ├── ar-demo.html                   # Hand tracking AR interface
│   ├── hybrid-ar-demo.html            # Hybrid AR demo (markers + hand tracking)
│   ├── header.html                    # Shared header component
│   ├── global.css                     # Global styling
│   ├── favicon.ico                    # Site icon
│   ├── react-bundle.js                # Built React bundle
│   ├── react-bundle.js.map            # Source maps
│   └── react-bundle.js.LICENSE.txt    # Bundle licenses
├── src/                               # Source code
│   ├── backend/                       # Server-side modules
│   │   ├── server.js                  # Backend server configuration
│   │   ├── dataProcessor.js           # Data processing operations
│   │   ├── chartGenerator.js          # Chart generation logic
│   │   ├── csvHandler.js              # CSV file handling
│   │   ├── projectsManager.js         # Project management logic
│   │   └── testData.js                # Sample datasets
│   ├── ar/                            # Augmented Reality modules
│   │   ├── coordinate-system.js       # Screen-to-world coordinate conversion
│   │   ├── gesture-detector.js        # MediaPipe hand gesture recognition
│   │   ├── chart-manager.js           # Chart creation and lifecycle management
│   │   ├── hand-tracking.js           # MediaPipe integration and processing
│   │   └── hybrid-ar-controller.js    # Main AR controller orchestration
│   ├── react/                         # React/Frontend modules
│   │   └── api.js                     # Frontend API client for backend communication
│   └── blocks/                        # Blockly custom blocks
│       ├── csv_import.js              # CSV import block definition
│       ├── data_ops.js                # Data processing blocks (filter, sort, group, etc.)
│       ├── statistics.js              # Statistical analysis blocks
│       ├── transformations.js         # Data transformation blocks (NEW)
│       ├── visualization.js           # Chart visualization blocks
│       └── to_json.js                 # JSON conversion block
├── tests/                             # Test suites
│   ├── backend/                       # Backend tests
│   │   ├── api.test.js                # API endpoint tests
│   │   ├── chartGenerator.test.js     # Chart generation tests
│   │   ├── dataProcessor.test.js      # Data processing tests
│   │   ├── server.test.js             # Server integration tests
│   │   └── testData.test.js           # Sample data tests
│   ├── frontend/                      # Frontend and AR tests
│   │   ├── blocklyProcessing.test.js  # Blockly backend integration tests
│   │   ├── chartGeneration.test.js    # Chart generation frontend tests
│   │   ├── csvFileProcessing.test.js  # Real CSV file processing tests
│   │   ├── dataProcessingFrontend.test.js # Frontend API integration tests
│   │   ├── errorHandling.test.js      # Error handling tests
│   │   ├── eventCommunication.test.js # Event system tests
│   │   ├── hybridAR.test.js           # Hybrid AR system tests
│   │   ├── statisticalBlocks.test.js  # Statistical analysis block tests
│   │   └── transformationBlocks.test.js # Data transformation block tests (NEW)
│   ├── csv_demo.test.js               # CSV demo functionality tests
│   ├── csv_final.test.js              # CSV final implementation tests
│   ├── csv_import.test.js             # CSV import block tests
│   ├── csv_import_integration.test.js # CSV integration tests
│   ├── csv_import_simple.test.js      # Basic CSV import tests
│   └── sum.test.js                    # Basic utility tests
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

---

## Libraries

Client‑side (CDN where noted):
- Blockly: `blockly.min.js`, `javascript_compressed.js` (unpkg)
- PapaParse: `5.4.1` (jsDelivr)
- Chart.js: `4.4.1` (Blockly page) / latest (AR page)
- A‑Frame: `1.6.0`
- AR.js (A‑Frame build): latest from `AR-js-org/AR.js` (githack)
- MediaPipe: `@mediapipe/hands`, `camera_utils`, `drawing_utils`
- Tailwind CSS (CDN config)

Server‑side (package.json):
- express `^4.18.2`, cors `^2.8.5`, multer `^2.0.2`
- papaparse `^5.4.1` (primarily used client‑side)

Dev/tooling:
- jest `^30.x`, jest-environment-jsdom, jsdom, supertest
- webpack `^5.x`, webpack‑dev‑server `^5.x`, babel toolchain
- nodemon for local dev

## Docker (optional)

Build and run locally:

```bash
docker build -t apparentlyar .
docker run --rm -p 3000:3000 apparentlyar
```

## Security and Privacy (prototype)

- Camera access is opt‑in; MediaPipe runs in‑browser; no video is sent server‑side.
- CSV uploads are stored under `/uploads/`; in the prototype this path is publicly served. Avoid sensitive data.
- Facilitator password is file‑based (plaintext) for demo; not suitable for production.
- CORS is permissive in dev. Restrict origins before external deployment.

See documentation Section 5 for detailed privacy, security, and ethics notes.

## GenAI Usage

- Prompts/responses used during development are archived here: `https://docs.google.com/document/d/16a_527mtUpsZUMxq0JmLCrdeopyjLhDBtgmZh3yZHic/edit?usp=sharing`.

## Acknowledgements

- Marker set: ARToolKit barcode markers by Nicolo Carpignoli.
- Third‑party licenses are included in `public/react-bundle.js.LICENSE.txt` where applicable.

**Built with ❤️ for DECO3801/7381**

---

## Deployment (Fly.io)

- App name: `apparentlyar` (from `fly.toml`).
- Production URL: `https://apparentlyar.fly.dev`.
- If you rename the app, production becomes `https://<app-name>.fly.dev`.

### Deploy steps (summary)

```bash
# Requires flyctl installed and logged in
flyctl apps list                  # confirm access
flyctl status -a apparentlyar     # check current status
flyctl deploy                     # deploy using fly.toml
flyctl open -a apparentlyar       # open https://apparentlyar.fly.dev
```

If creating a new app name:

```bash
flyctl launch --no-deploy
flyctl apps create <new-app-name>
flyctl deploy -a <new-app-name>
```

Note: The prototype serves `/uploads` publicly; avoid sensitive data in production.

## Troubleshooting

- Camera blocked: Allow camera permissions in the browser; reload AR pages.
- No charts: Ensure CSV was imported and blocks executed; check console for errors.
- Empty dataset after filters: Review filter blocks; try removing or relaxing conditions.
- Cannot see uploaded CSV under AR: Use Blockly to generate a visualization first (which persists CSV via API), then load it in Hybrid AR.
- CORS or mixed‑content warnings: Use `http://localhost:3000` locally or the HTTPS Fly URL.