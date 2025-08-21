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
      area: this.generateAreaChart.bind(this),
      histogram: this.generateHistogramChart.bind(this),
      boxplot: this.generateBoxPlotChart.bind(this),
      heatmap: this.generateHeatmapChart.bind(this),
      radar: this.generateRadarChart.bind(this)
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
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: true
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'xy'
            },
            zoom: {
              wheel: {
                enabled: true
              },
              pinch: {
                enabled: true
              },
              mode: 'xy'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const dataIndex = elements[0].index;
            console.log('Bar clicked:', labels[dataIndex], values[dataIndex]);
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
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: true
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'xy'
            },
            zoom: {
              wheel: {
                enabled: true
              },
              pinch: {
                enabled: true
              },
              mode: 'xy'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        },
        onHover: (event, elements) => {
          event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const dataIndex = elements[0].index;
            console.log('Point clicked:', labels[dataIndex], values[dataIndex]);
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
        },
        interaction: {
          intersect: false,
          mode: 'point'
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: true
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'xy'
            },
            zoom: {
              wheel: {
                enabled: true
              },
              pinch: {
                enabled: true
              },
              mode: 'xy'
            }
          }
        },
        onHover: (event, elements) => {
          event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const dataIndex = elements[0].index;
            const point = points[dataIndex];
            console.log('Scatter point clicked:', point.x, point.y);
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
   * Generate histogram chart configuration
   * 
   * @param {Array} data - Data to visualize
   * @param {Object} options - Chart options
   * @param {string} options.valueColumn - Column name for values to bin
   * @param {number} options.bins - Number of bins (default: 10)
   * @param {string} options.title - Chart title
   * @param {string} options.color - Bar color
   * @returns {Object} Chart.js configuration object
   */
  async generateHistogramChart(data, options = {}) {
    const {
      valueColumn = Object.keys(data[0])[0],
      bins = 10,
      title = 'Histogram',
      color = '#2d8cf0'
    } = options;

    const values = data.map(row => parseFloat(row[valueColumn]) || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;
    
    const binCounts = new Array(bins).fill(0);
    const binLabels = [];
    
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = min + (i + 1) * binWidth;
      binLabels.push(`${binStart.toFixed(1)}-${binEnd.toFixed(1)}`);
    }
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      binCounts[binIndex]++;
    });

    return {
      type: 'bar',
      data: {
        labels: binLabels,
        datasets: [{
          label: 'Frequency',
          data: binCounts,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            display: true
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'xy'
            },
            zoom: {
              wheel: {
                enabled: true
              },
              pinch: {
                enabled: true
              },
              mode: 'xy'
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: valueColumn
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Frequency'
            }
          }
        }
      }
    };
  }

  /**
   * Generate box plot chart configuration
   * 
   * @param {Array} data - Data to visualize
   * @param {Object} options - Chart options
   * @param {string} options.valueColumn - Column name for values
   * @param {string} options.groupColumn - Column name for grouping (optional)
   * @param {string} options.title - Chart title
   * @returns {Object} Chart.js configuration object
   */
  async generateBoxPlotChart(data, options = {}) {
    const {
      valueColumn = Object.keys(data[0])[0],
      groupColumn = null,
      title = 'Box Plot'
    } = options;

    const calculateBoxPlotStats = (values) => {
      const sorted = values.sort((a, b) => a - b);
      const q1 = this.percentile(sorted, 25);
      const median = this.percentile(sorted, 50);
      const q3 = this.percentile(sorted, 75);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const iqr = q3 - q1;
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;
      
      return { min, q1, median, q3, max, lowerFence, upperFence };
    };

    let datasets = [];
    let labels = [];

    if (groupColumn) {
      const groups = {};
      data.forEach(row => {
        const group = row[groupColumn];
        if (!groups[group]) groups[group] = [];
        groups[group].push(parseFloat(row[valueColumn]) || 0);
      });

      labels = Object.keys(groups);
      const boxPlotData = labels.map(label => calculateBoxPlotStats(groups[label]));
      
      datasets.push({
        label: valueColumn,
        data: boxPlotData,
        backgroundColor: 'rgba(45, 140, 240, 0.3)',
        borderColor: '#2d8cf0',
        borderWidth: 2
      });
    } else {
      const values = data.map(row => parseFloat(row[valueColumn]) || 0);
      const stats = calculateBoxPlotStats(values);
      labels = [valueColumn];
      
      datasets.push({
        label: valueColumn,
        data: [stats],
        backgroundColor: 'rgba(45, 140, 240, 0.3)',
        borderColor: '#2d8cf0',
        borderWidth: 2
      });
    }

    return {
      type: 'boxplot',
      data: {
        labels: labels,
        datasets: datasets
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
            title: {
              display: true,
              text: valueColumn
            }
          }
        }
      }
    };
  }

  /**
   * Generate heatmap chart configuration
   * 
   * @param {Array} data - Data to visualize
   * @param {Object} options - Chart options
   * @param {string} options.xColumn - Column name for x-axis
   * @param {string} options.yColumn - Column name for y-axis
   * @param {string} options.valueColumn - Column name for values
   * @param {string} options.title - Chart title
   * @returns {Object} Chart.js configuration object
   */
  async generateHeatmapChart(data, options = {}) {
    const {
      xColumn = Object.keys(data[0])[0],
      yColumn = Object.keys(data[0])[1],
      valueColumn = Object.keys(data[0])[2],
      title = 'Heatmap'
    } = options;

    const xValues = [...new Set(data.map(row => row[xColumn]))];
    const yValues = [...new Set(data.map(row => row[yColumn]))];
    
    const heatmapData = [];
    
    data.forEach(row => {
      const x = xValues.indexOf(row[xColumn]);
      const y = yValues.indexOf(row[yColumn]);
      const value = parseFloat(row[valueColumn]) || 0;
      
      heatmapData.push({
        x: x,
        y: y,
        v: value
      });
    });

    return {
      type: 'scatter',
      data: {
        datasets: [{
          label: valueColumn,
          data: heatmapData,
          backgroundColor: (context) => {
            const value = context.parsed.v;
            const maxValue = Math.max(...heatmapData.map(d => d.v));
            const intensity = value / maxValue;
            return `rgba(45, 140, 240, ${intensity})`;
          },
          borderColor: '#2d8cf0',
          pointRadius: 20
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
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                const point = context[0];
                return `${xValues[point.parsed.x]} × ${yValues[point.parsed.y]}`;
              },
              label: function(context) {
                return `${valueColumn}: ${context.parsed.v}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            min: -0.5,
            max: xValues.length - 0.5,
            ticks: {
              callback: function(value) {
                return xValues[Math.round(value)];
              }
            },
            title: {
              display: true,
              text: xColumn
            }
          },
          y: {
            type: 'linear',
            min: -0.5,
            max: yValues.length - 0.5,
            ticks: {
              callback: function(value) {
                return yValues[Math.round(value)];
              }
            },
            title: {
              display: true,
              text: yColumn
            }
          }
        }
      }
    };
  }

  /**
   * Generate radar chart configuration
   * 
   * @param {Array} data - Data to visualize
   * @param {Object} options - Chart options
   * @param {Array} options.columns - Array of column names to include in radar
   * @param {string} options.labelColumn - Column name for labels
   * @param {string} options.title - Chart title
   * @returns {Object} Chart.js configuration object
   */
  async generateRadarChart(data, options = {}) {
    const {
      columns = Object.keys(data[0]).filter(key => typeof data[0][key] === 'number'),
      labelColumn = Object.keys(data[0])[0],
      title = 'Radar Chart'
    } = options;

    const labels = columns;
    const datasets = [];
    const colors = this.generateColors(data.length);

    data.forEach((row, index) => {
      const values = columns.map(col => parseFloat(row[col]) || 0);
      
      datasets.push({
        label: row[labelColumn] || `Series ${index + 1}`,
        data: values,
        borderColor: colors[index],
        backgroundColor: colors[index] + '20',
        borderWidth: 2,
        pointBackgroundColor: colors[index],
        pointBorderColor: colors[index],
        pointRadius: 4
      });
    });

    return {
      type: 'radar',
      data: {
        labels: labels,
        datasets: datasets
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
          r: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            angleLines: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        },
        interaction: {
          intersect: false
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    };
  }

  /**
   * Calculate percentile of a sorted array
   * 
   * @param {Array} sortedArray - Sorted array of numbers
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  percentile(sortedArray, percentile) {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
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
      case 'histogram':
        requiredColumns = [options.valueColumn];
        break;
      case 'boxplot':
        requiredColumns = [options.valueColumn];
        break;
      case 'heatmap':
        requiredColumns = [options.xColumn, options.yColumn, options.valueColumn];
        break;
      case 'radar':
        requiredColumns = options.columns || [];
        break;
    }
    
    const availableColumns = Object.keys(data[0]);
    const missingColumns = requiredColumns.filter(col => col && !availableColumns.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    
    return true;
  }
}

module.exports = new ChartGenerator();
