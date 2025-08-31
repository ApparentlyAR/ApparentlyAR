/**
 * Chart Management Module
 * 
 * Handles creation, manipulation, and lifecycle management of AR charts
 * including Chart.js integration and A-Frame entity management.
 * 
 */

class ChartManager {
  constructor(coordinateSystem) {
    /** @type {Array<Object>} Hand-placed chart objects */
    this.handCharts = [];
    
    /** @type {number} Last chart placement timestamp */
    this.lastPlacedAt = 0;
    
    /** @type {number} Cooldown between chart placements */
    this.PLACE_COOLDOWN_MS = 1000;
    
    /** @type {boolean} Chart limit enabled state */
    this.chartLimitEnabled = false;
    
    /** @type {number} Maximum number of charts allowed */
    this.maxCharts = 5;
    
    /** @type {string} Behavior when limit reached: 'block' or 'replace' */
    this.limitBehavior = 'block';
    
    /** @type {CoordinateSystem} Coordinate conversion utility */
    this.coordinateSystem = coordinateSystem;

    /**
     * Sample datasets for chart generation
     */
    this.sampleData = {
      students: [
        { name: 'Alice', age: 25, score: 85, grade: 'A' },
        { name: 'Bob', age: 22, score: 92, grade: 'A' },
        { name: 'Charlie', age: 28, score: 78, grade: 'B' },
        { name: 'Diana', age: 24, score: 95, grade: 'A' },
        { name: 'Eve', age: 26, score: 88, grade: 'A' }
      ],
      weather: [
        { month: 'Jan', temperature: 15, rainfall: 80, humidity: 65 },
        { month: 'Feb', temperature: 17, rainfall: 70, humidity: 60 },
        { month: 'Mar', temperature: 20, rainfall: 85, humidity: 70 },
        { month: 'Apr', temperature: 23, rainfall: 90, humidity: 75 },
        { month: 'May', temperature: 26, rainfall: 100, humidity: 80 }
      ],
      sales: [
        { product: 'Laptop', sales: 120, revenue: 144000, region: 'North' },
        { product: 'Phone', sales: 200, revenue: 120000, region: 'North' },
        { product: 'Tablet', sales: 80, revenue: 64000, region: 'North' },
        { product: 'Laptop', sales: 150, revenue: 180000, region: 'South' },
        { product: 'Phone', sales: 180, revenue: 108000, region: 'South' }
      ]
    };
  }

  /**
   * Remove the oldest chart (FIFO replacement)
   */
  removeOldestChart() {
    if (this.handCharts.length === 0) return;
    
    const oldestChart = this.handCharts[0]; // First chart is oldest
    
    // Remove entity from scene
    oldestChart.entity.remove();
    
    // Remove canvas from assets
    if (oldestChart.canvas && oldestChart.canvas.parentNode) {
      oldestChart.canvas.parentNode.removeChild(oldestChart.canvas);
    }
    
    // Destroy Chart.js instance
    if (oldestChart.chart) {
      oldestChart.chart.destroy();
    }
    
    // Remove from handCharts array
    this.handCharts.shift(); // Remove first element (oldest)
    
    console.log(`Removed oldest chart: ${oldestChart.type} (${oldestChart.dataset})`);
  }

  /**
   * Place chart at hand position
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {Function} updateStatus - Status update callback
   */
  placeChartAtHand(landmarks, updateStatus) {
    const now = Date.now();
    if (now - this.lastPlacedAt < this.PLACE_COOLDOWN_MS) return;
    
    // Check chart limit if enabled
    if (this.chartLimitEnabled && this.handCharts.length >= this.maxCharts) {
      if (this.limitBehavior === 'block') {
        // Block placement and show feedback
        updateStatus(`Chart limit reached (${this.handCharts.length}/${this.maxCharts})`, 'error');
        setTimeout(() => {
          updateStatus('Hand tracking active - make fist to place, pinch to move', 'detecting');
        }, 2000);
        return;
      } else if (this.limitBehavior === 'replace') {
        // Remove oldest chart (FIFO)
        this.removeOldestChart();
      }
    }
    
    const palmCenter = landmarks[9];
    const canvas = document.getElementById('hand-overlay');
    
    const screenX = (1 - palmCenter.x) * canvas.width;
    const screenY = palmCenter.y * canvas.height; // Remove Y inversion - MediaPipe Y matches screen Y
    
    this.createChart(screenX, screenY);
    this.lastPlacedAt = now;
  }

  /**
   * Create chart as A-Frame entity
   * 
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   */
  createChart(screenX, screenY) {
    const chartType = document.getElementById('chart-type').value;
    const datasetName = document.getElementById('sample-data').value;
    
    // Create unique canvas for this chart
    const canvas = document.createElement('canvas');
    const chartId = 'hand-chart-' + Date.now();
    canvas.width = 400;
    canvas.height = 300;
    canvas.id = chartId + '-canvas';
    
    // Generate chart texture
    const chart = this.generateChart(canvas, chartType, this.sampleData[datasetName]);
    
    // Add canvas to assets
    const assets = document.querySelector('a-assets');
    assets.appendChild(canvas);
    
    // Create A-Frame entity
    const entity = document.createElement('a-plane');
    
    entity.setAttribute('id', chartId);
    entity.setAttribute('width', '2');
    entity.setAttribute('height', '1.5');
    entity.setAttribute('material', `src: #${canvas.id}; transparent: true`);
    
    // Convert screen coordinates to world coordinates
    const worldPos = this.coordinateSystem.screenToWorld(screenX, screenY);
    entity.setAttribute('position', worldPos);
    
    // Add to scene
    document.getElementById('hand-charts').appendChild(entity);
    
    // Store chart data
    const chartObj = {
      id: chartId,
      entity: entity,
      chart: chart,
      canvas: canvas,
      type: chartType,
      dataset: datasetName,
      screenX: screenX,
      screenY: screenY
    };
    
    this.handCharts.push(chartObj);
    this.updateChartList();
    
    console.log(`Chart placed: ${chartType} with ${datasetName} data at world position ${worldPos}`);
  }

  /**
   * Generate Chart.js chart
   * 
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {string} type - Chart type
   * @param {Array} data - Chart data
   * @returns {Chart} Chart.js instance
   */
  generateChart(canvas, type, data) {
    const ctx = canvas.getContext('2d');
    
    let chartConfig = {
      type: type,
      data: {},
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: true },
          title: { display: true, text: `${type.toUpperCase()} Chart` }
        }
      }
    };
    
    // Configure data based on type and dataset
    if (type === 'bar' || type === 'line') {
      if (data === this.sampleData.students) {
        chartConfig.data = {
          labels: data.map(d => d.name),
          datasets: [{
            label: 'Scores',
            data: data.map(d => d.score),
            backgroundColor: 'rgba(76, 175, 80, 0.8)',
            borderColor: 'rgba(76, 175, 80, 1)',
            borderWidth: 2
          }]
        };
      } else if (data === this.sampleData.weather) {
        chartConfig.data = {
          labels: data.map(d => d.month),
          datasets: [{
            label: 'Temperature (°C)',
            data: data.map(d => d.temperature),
            backgroundColor: 'rgba(33, 150, 243, 0.8)',
            borderColor: 'rgba(33, 150, 243, 1)',
            borderWidth: 2
          }]
        };
      } else if (data === this.sampleData.sales) {
        chartConfig.data = {
          labels: data.map(d => d.product),
          datasets: [{
            label: 'Sales',
            data: data.map(d => d.sales),
            backgroundColor: 'rgba(255, 193, 7, 0.8)',
            borderColor: 'rgba(255, 193, 7, 1)',
            borderWidth: 2
          }]
        };
      }
    } else if (type === 'pie') {
      if (data === this.sampleData.students) {
        chartConfig.data = {
          labels: data.map(d => d.name),
          datasets: [{
            data: data.map(d => d.score),
            backgroundColor: [
              'rgba(76, 175, 80, 0.8)',
              'rgba(33, 150, 243, 0.8)',
              'rgba(255, 193, 7, 0.8)',
              'rgba(244, 67, 54, 0.8)',
              'rgba(156, 39, 176, 0.8)'
            ]
          }]
        };
      }
    } else if (type === 'scatter') {
      if (data === this.sampleData.students) {
        chartConfig.data = {
          datasets: [{
            label: 'Age vs Score',
            data: data.map(d => ({ x: d.age, y: d.score })),
            backgroundColor: 'rgba(76, 175, 80, 0.8)'
          }]
        };
      }
    }
    
    return new Chart(ctx, chartConfig);
  }

  /**
   * Clear all hand-placed charts
   */
  clearHandCharts() {
    this.handCharts.forEach(chartObj => {
      // Remove entity from scene
      chartObj.entity.remove();
      
      // Remove canvas from assets
      if (chartObj.canvas && chartObj.canvas.parentNode) {
        chartObj.canvas.parentNode.removeChild(chartObj.canvas);
      }
      
      // Destroy Chart.js instance
      if (chartObj.chart) {
        chartObj.chart.destroy();
      }
    });
    
    this.handCharts = [];
    this.updateChartList();
  }

  /**
   * Update chart list UI
   */
  updateChartList() {
    const listEl = document.getElementById('chart-list');
    if (this.handCharts.length === 0) {
      listEl.innerHTML = '<div class="chart-item">No charts placed yet</div>';
    } else {
      listEl.innerHTML = this.handCharts.map(chart => 
        `<div class="chart-item" onclick="selectChart('${chart.id}', this)">
           ${chart.type.toUpperCase()} - ${chart.dataset}
         </div>`
      ).join('');
    }
    
    // Update chart count with limit display
    const chartCountEl = document.getElementById('chart-count');
    if (this.chartLimitEnabled) {
      chartCountEl.textContent = `${this.handCharts.length}/${this.maxCharts}`;
      
      // Color coding based on limit proximity
      if (this.handCharts.length >= this.maxCharts) {
        chartCountEl.style.color = '#ff8a8a'; // Error red
      } else if (this.handCharts.length >= this.maxCharts * 0.8) {
        chartCountEl.style.color = '#ffce73'; // Warning yellow
      } else {
        chartCountEl.style.color = '#8ff0a4'; // OK green
      }
    } else {
      chartCountEl.textContent = this.handCharts.length;
      chartCountEl.style.color = ''; // Reset to default
    }
  }

  /**
   * Get chart count
   * @returns {number} Number of charts
   */
  getChartCount() {
    return this.handCharts.length;
  }

  /**
   * Get chart array
   * @returns {Array} Array of chart objects
   */
  getCharts() {
    return this.handCharts;
  }

  /**
   * Set chart limit settings
   * @param {boolean} enabled - Enable chart limit
   * @param {number} maxCharts - Maximum charts
   * @param {string} behavior - Limit behavior
   */
  setChartLimit(enabled, maxCharts, behavior) {
    this.chartLimitEnabled = enabled;
    this.maxCharts = maxCharts;
    this.limitBehavior = behavior;
    this.updateChartList();
  }
}

// Export for use in other modules
window.ChartManager = ChartManager;