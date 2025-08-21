# ApparentlyAR Backend

A robust, well-tested backend server for the ApparentlyAR educational data visualization platform. This backend provides data processing, chart generation, and AR visualization APIs designed for students in grades 8-10 to explore data through block-based programming and augmented reality.

## 🎯 Features

- **Data Processing**: Filter, sort, aggregate, and transform data
- **Chart Generation**: Create various chart types (bar, line, scatter, pie, doughnut, area)
- **AR Visualization**: Generate AR-specific visualization data
- **RESTful APIs**: Clean, well-documented API endpoints
- **Comprehensive Testing**: 95%+ test coverage with 118 passing tests
- **Sample Data**: Built-in datasets for educational demonstrations

## 🚀 Quick Start

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

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### GET `/`
Serves the main application page.

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

*Histogram:*
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

*Box Plot:*
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

*Heatmap:*
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

*Radar Chart:*
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

## 🧪 Testing

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
│   ├── api.test.js          # API endpoint tests
│   ├── dataProcessor.test.js # Data processing tests
│   ├── chartGenerator.test.js # Chart generation tests
│   ├── server.test.js        # Server integration tests
│   └── testData.test.js      # Sample data tests
└── sum.test.js              # Basic functionality test
```

## 📁 Project Structure

```
src/
├── backend/
│   ├── dataProcessor.js     # Data processing operations
│   ├── chartGenerator.js    # Chart generation logic
│   └── testData.js          # Sample datasets
├── blocks/
│   └── csv_import.js        # Frontend CSV import block
server.js                    # Main Express server
package.json                 # Dependencies and scripts
jest.config.js              # Test configuration
```

## 🔧 Development

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

## 📊 Sample Data

The backend includes three sample datasets:

### Students Data
Educational data with student information including names, ages, scores, and grades.

### Weather Data
Monthly weather data with temperature, rainfall, and humidity for environmental analysis.

### Sales Data
Business analytics data with product sales, revenue, and regional information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the API documentation
- Review the test examples

---

**Built with ❤️ for educational data visualization**
