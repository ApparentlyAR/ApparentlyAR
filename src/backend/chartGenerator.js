/**
 * Chart Generator Module
 * 
 * Generates chart configurations for various chart types and AR visualizations
 * for the ApparentlyAR data visualization platform.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

/**
 * ChartGenerator class for creating chart configurations
 */
class ChartGenerator {
  constructor() {
    /**
     * Supported chart types and their generation functions
     * @type {Object}
     */
    this.supportedChartTypes = {
      bar: this.generateBarChart.bind(this),
      line: this.generateLineChart.bind(this),
      scatter: this.generateScatterChart.bind(this),
      pie: this.generatePieChart.bind(this),
      doughnut: this.generateDoughnutChart.bind(this),
      area: this.generateAreaChart.bind(this)
    };
  }

  /**
   * Generate chart configuration based on type
   * 
   * @param {Array} data - Data to visualize
   * @param {string} chartType - Type of chart to generate
   * @param {Object} options - Chart configuration options
   * @returns {Promise<Object>} Chart configuration object
   * @throws {Error} If chart type is not supported
   */
  async generateChart(data, chartType, options = {}) {
    if (!this.supportedChartTypes[chartType]) {
      throw new Error(`Unsupported chart type: ${chartType}`);
    }

    // Validate data and options
    this.validateChartData(data, chartType, options);

    // Generate chart configuration
    const config = await this.supportedChartTypes[chartType](data, options);

    return {
      success: true,
      chartType: chartType,
      config: config,
      metadata: {
        dataPoints: data.length,
        columns: Object.keys(data[0] || {}),
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generate bar chart configuration
   * 
   * @param {Array} data - Data to visualize
   * @param {Object} options - Chart options
   * @param {string} options.xColumn - Column name for x-axis labels
   * @param {string} options.yColumn - Column name for y-axis values
   * @param {string} options.title - Chart title
   * @param {string} options.color - Bar color
   * @returns {Object} Chart.js configuration object
   */
  async generateBarChart(data, options = {}) {
    const {
      xColumn = Object.keys(data[0])[0],
      yColumn = Object.keys(data[0])[1],
      title = 'Bar Chart',
      color = '#2d8cf0'
    } = options;

    const labels = data.map(row => row[xColumn]);
    const values = data.map(row => parseFloat(row[yColumn]) || 0);

    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: yColumn,
          data: values,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  }

  /**
   * Generate line chart configuration
   * 
   * @param {Array} data - Data to visualize
   * @param {Object} options - Chart options
   * @param {string} options.xColumn - Column name for x-axis labels
   * @param {string} options.yColumn - Column name for y-axis values
   * @param {string} options.title - Chart title
   * @param {string} options.color - Line color
   * @returns {Object} Chart.js configuration object
   */
  async generateLineChart(data, options = {}) {
    const {
      xColumn = Object.keys(data[0])[0],
      yColumn = Object.keys(data[0])[1],
      title = 'Line Chart',
      color = '#19be6b'
    } = options;

    const labels = data.map(row => row[xColumn]);
    const values = data.map(row => parseFloat(row[yColumn]) || 0);

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: yColumn,
          data: values,
          borderColor: color,
          backgroundColor: color + '20',
          borderWidth: 2,
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  }

  /**
   * Generate scatter chart configuration
   * 
   * @param {Array} data - Data to visualize
   * @param {Object} options - Chart options
   * @param {string} options.xColumn - Column name for x-axis values
   * @param {string} options.yColumn - Column name for y-axis values
   * @param {string} options.title - Chart title
   * @param {string} options.color - Point color
   * @returns {Object} Chart.js configuration object
   */
  async generateScatterChart(data, options = {}) {
    const {
      xColumn = Object.keys(data[0])[0],
      yColumn = Object.keys(data[0])[1],
      title = 'Scatter Chart',
      color = '#ed4014'
    } = options;

    const points = data.map(row => ({
      x: parseFloat(row[xColumn]) || 0,
      y: parseFloat(row[yColumn]) || 0
    }));

    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: `${yColumn} vs ${xColumn}`,
          data: points,
          backgroundColor: color,
          borderColor: color,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: true
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom'
          },
          y: {
            type: 'linear',
            position: 'left'
          }
        }
      }
    };
  }

  /**
   * Generate pie chart configuration
   * 
   * @param {Array} data - Data to visualize
   * @param {Object} options - Chart options
   * @param {string} options.labelColumn - Column name for labels
   * @param {string} options.valueColumn - Column name for values
   * @param {string} options.title - Chart title
   * @returns {Object} Chart.js configuration object
   */
  async generatePieChart(data, options = {}) {
    const {
      labelColumn = Object.keys(data[0])[0],
      valueColumn = Object.keys(data[0])[1],
      title = 'Pie Chart'
    } = options;

    const labels = data.map(row => row[labelColumn]);
    const values = data.map(row => parseFloat(row[valueColumn]) || 0);
    const colors = this.generateColors(labels.length);

    return {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => color + '80'),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: true,
            position: 'right'
          }
        }
      }
    };
  }

  /**
   * Generate doughnut chart configuration
   * 
   * @param {Array} data - Data to visualize
   * @param {Object} options - Chart options
   * @param {string} options.labelColumn - Column name for labels
   * @param {string} options.valueColumn - Column name for values
   * @param {string} options.title - Chart title
   * @returns {Object} Chart.js configuration object
   */
  async generateDoughnutChart(data, options = {}) {
    const {
      labelColumn = Object.keys(data[0])[0],
      valueColumn = Object.keys(data[0])[1],
      title = 'Doughnut Chart'
    } = options;

    const labels = data.map(row => row[labelColumn]);
    const values = data.map(row => parseFloat(row[valueColumn]) || 0);
    const colors = this.generateColors(labels.length);

    return {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => color + '80'),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: true,
            position: 'right'
          }
        }
      }
    };
  }

  /**
   * Generate area chart configuration
   * 
   * @param {Array} data - Data to visualize
   * @param {Object} options - Chart options
   * @param {string} options.xColumn - Column name for x-axis labels
   * @param {string} options.yColumn - Column name for y-axis values
   * @param {string} options.title - Chart title
   * @param {string} options.color - Area color
   * @returns {Object} Chart.js configuration object
   */
  async generateAreaChart(data, options = {}) {
    const {
      xColumn = Object.keys(data[0])[0],
      yColumn = Object.keys(data[0])[1],
      title = 'Area Chart',
      color = '#ff9900'
    } = options;

    const labels = data.map(row => row[xColumn]);
    const values = data.map(row => parseFloat(row[yColumn]) || 0);

    return {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: yColumn,
          data: values,
          borderColor: color,
          backgroundColor: color + '40',
          borderWidth: 2,
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: true
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  }

  /**
   * Generate AR-specific visualization data
   * 
   * @param {Array} data - Data to visualize in AR
   * @param {string} visualizationType - Type of visualization
   * @param {string} markerId - AR marker identifier
   * @returns {Promise<Object>} AR visualization data
   */
  async generateARVisualization(data, visualizationType, markerId) {
    const chartConfig = await this.supportedChartTypes[visualizationType](data, {
      title: `AR Chart - Marker ${markerId}`
    });
    
    // Convert chart data to AR-friendly format
    const arData = {
      markerId: markerId,
      visualizationType: visualizationType,
      chartData: chartConfig.data,
      options: chartConfig.options,
      metadata: {
        dataPoints: data.length,
        columns: Object.keys(data[0] || {}),
        generatedAt: new Date().toISOString()
      }
    };
    
    return arData;
  }

  /**
   * Generate colors for charts
   * 
   * @param {number} count - Number of colors needed
   * @returns {Array} Array of hex color codes
   */
  generateColors(count) {
    const colors = [
      '#2d8cf0', '#19be6b', '#ed4014', '#ff9900', '#9c26b0',
      '#00bcd4', '#ff5722', '#4caf50', '#2196f3', '#ff9800',
      '#9c27b0', '#607d8b', '#795548', '#e91e63', '#3f51b5'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }

  /**
   * Get supported chart types
   * 
   * @returns {Array} Array of supported chart type names
   */
  getSupportedChartTypes() {
    return Object.keys(this.supportedChartTypes);
  }

  /**
   * Validate chart data and options
   * 
   * @param {Array} data - Data to validate
   * @param {string} chartType - Chart type to validate for
   * @param {Object} options - Chart options to validate
   * @returns {boolean} True if validation passes
   * @throws {Error} If validation fails
   */
  validateChartData(data, chartType, options) {
    if (!data || data.length === 0) {
      throw new Error('No data provided');
    }
    
    let requiredColumns = [];
    switch (chartType) {
      case 'bar':
      case 'line':
      case 'area':
        requiredColumns = [options.xColumn, options.yColumn];
        break;
      case 'scatter':
        requiredColumns = [options.xColumn, options.yColumn];
        break;
      case 'pie':
      case 'doughnut':
        requiredColumns = [options.labelColumn, options.valueColumn];
        break;
    }
    
    const availableColumns = Object.keys(data[0]);
    const missingColumns = requiredColumns.filter(col => !availableColumns.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    
    return true;
  }
}

module.exports = new ChartGenerator();
