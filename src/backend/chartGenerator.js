class ChartGenerator {
  constructor() {
    this.supportedChartTypes = {
      bar: this.generateBarChart,
      line: this.generateLineChart,
      scatter: this.generateScatterChart,
      pie: this.generatePieChart,
      doughnut: this.generateDoughnutChart,
      area: this.generateAreaChart
    };
  }

  /**
   * Generate chart configuration data
   */
  async generateChart(data, chartType, options = {}) {
    if (!this.supportedChartTypes[chartType]) {
      throw new Error(`Unsupported chart type: ${chartType}`);
    }

    const chartConfig = await this.supportedChartTypes[chartType](data, options);
    
    return {
      success: true,
      chartType: chartType,
      config: chartConfig,
      metadata: {
        dataPoints: data.length,
        columns: Object.keys(data[0] || {}),
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generate bar chart configuration
   */
  async generateBarChart(data, options = {}) {
    const { xColumn, yColumn, title = 'Bar Chart', color = '#2d8cf0' } = options;
    
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
   */
  async generateLineChart(data, options = {}) {
    const { xColumn, yColumn, title = 'Line Chart', color = '#2d8cf0' } = options;
    
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
   */
  async generateScatterChart(data, options = {}) {
    const { xColumn, yColumn, title = 'Scatter Plot', color = '#2d8cf0' } = options;
    
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
          borderColor: color
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
            title: {
              display: true,
              text: xColumn
            }
          },
          y: {
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
   * Generate pie chart configuration
   */
  async generatePieChart(data, options = {}) {
    const { labelColumn, valueColumn, title = 'Pie Chart' } = options;
    
    const labels = data.map(row => row[labelColumn]);
    const values = data.map(row => parseFloat(row[valueColumn]) || 0);
    
    // Generate colors
    const colors = this.generateColors(labels.length);
    
    return {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => color + '80'),
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
            display: true,
            position: 'right'
          }
        }
      }
    };
  }

  /**
   * Generate doughnut chart configuration
   */
  async generateDoughnutChart(data, options = {}) {
    const { labelColumn, valueColumn, title = 'Doughnut Chart' } = options;
    
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
            display: true,
            position: 'right'
          }
        }
      }
    };
  }

  /**
   * Generate area chart configuration
   */
  async generateAreaChart(data, options = {}) {
    const { xColumn, yColumn, title = 'Area Chart', color = '#2d8cf0' } = options;
    
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
   */
  async generateARVisualization(data, visualizationType, markerId) {
    // This will be expanded for AR-specific features
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
   */
  getSupportedChartTypes() {
    return Object.keys(this.supportedChartTypes);
  }

  /**
   * Validate chart data
   */
  validateChartData(data, chartType, options) {
    if (!data || data.length === 0) {
      throw new Error('No data provided');
    }
    
    const requiredColumns = [];
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
