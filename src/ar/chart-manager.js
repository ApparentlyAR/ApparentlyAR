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

    /** @type {Object<string, {canvas: HTMLCanvasElement, chart: any, entity: any}>} Per-marker chart state */
    this.markerCharts = {};

    /** @type {Object} Custom data loaded from Blockly */
    this.customData = null;

    /** @type {string} Current data source: 'sample' or 'custom' */
    this.dataSource = 'sample';

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
   * Load custom data from Blockly processing
   * @param {Array<Object>} data - Custom data array
   * @param {string} filename - Source filename
   */
  loadCustomData(data, filename) {
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('Invalid custom data provided');
      return false;
    }

    this.customData = {
      data: data,
      filename: filename,
      columns: Object.keys(data[0] || {}),
      rowCount: data.length
    };

    this.dataSource = 'custom';
    console.log(`Loaded custom data: ${filename} (${data.length} rows, ${this.customData.columns.length} columns)`);
    return true;
  }

  /**
   * Set data source to sample data
   */
  useSampleData() {
    this.dataSource = 'sample';
    this.customData = null;
    console.log('Switched to sample data');
  }

  /**
   * Get current data based on data source
   * @param {string} datasetName - Dataset name (for sample data)
   * @returns {Array<Object>} Current data array
   */
  getCurrentData(datasetName = 'students') {
    if (this.dataSource === 'custom' && this.customData) {
      return this.customData.data;
    }
    return this.sampleData[datasetName] || this.sampleData.students;
  }

  /**
   * Get current data source info
   * @returns {Object} Data source information
   */
  getDataSourceInfo() {
    if (this.dataSource === 'custom' && this.customData) {
      return {
        source: 'custom',
        filename: this.customData.filename,
        rowCount: this.customData.rowCount,
        columns: this.customData.columns
      };
    }
    return {
      source: 'sample',
      available: Object.keys(this.sampleData)
    };
  }

  /**
   * Create or update a chart anchored to a specific AR.js marker.
   * The chart type and dataset must be provided. Subsequent calls update
   * the existing canvas texture and reuse the plane entity.
   *
   * @param {string} markerId - DOM id of the <a-marker> (e.g., 'marker-0')
   * @param {string} chartType - Chart.js type ('bar' | 'line' | 'pie' | 'scatter')
   * @param {string} datasetName - One of sample datasets keys ('students'|'weather'|'sales')
   */
  createOrUpdateMarkerChart(markerId, chartType, datasetName, chartConfigOverride = null) {
    const marker = document.getElementById(markerId);
    if (!marker) {
      console.warn(`Marker not found: ${markerId}`);
      return;
    }

    const assets = document.querySelector('a-assets');
    if (!assets) {
      console.warn('No <a-assets> found for chart textures');
      return;
    }

    if (!datasetName) {
      const sampleSelect = document.getElementById('sample-data');
      datasetName = sampleSelect ? sampleSelect.value : 'students';
    }

    const key = markerId;
    const existing = this.markerCharts[key];
    const canvasId = `marker-chart-${markerId}`;

    // Ensure canvas exists
    let canvas = existing?.canvas || document.getElementById(canvasId);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = canvasId;
      canvas.width = 400;
      canvas.height = 300;
      assets.appendChild(canvas);
    }

    // (Re)generate Chart.js on the canvas
    if (existing?.chart) {
      try { existing.chart.destroy(); } catch (_) {}
    }
    const currentData = this.getCurrentData(datasetName);
    const chart = this.generateChart(canvas, chartType, currentData, chartConfigOverride);

    // Ensure a plane entity exists under the marker and points to our canvas
    let entity = existing?.entity || marker.querySelector('[data-marker-chart]');
    if (!entity) {
      entity = document.createElement('a-plane');
      entity.setAttribute('data-marker-chart', '');
      entity.setAttribute('width', '4');
      entity.setAttribute('height', '3');
      // Keep it slightly above marker origin to avoid z-fighting with marker plane
      entity.setAttribute('position', '0 2 0');
      marker.appendChild(entity);
    }
    entity.setAttribute('material', `shader: flat; src: #${canvas.id}; transparent: true; side: double`);
    // Force the underlying texture to refresh after canvas redraw
    this.forceMaterialRefresh(entity);

    // Save state
    this.markerCharts[key] = { canvas, chart, entity };

    // Log for debugging
    console.log(`Marker chart updated on ${markerId}: ${chartType} using ${datasetName}`);
  }

  updateMarkerChartWithConfig(markerId, config = {}) {
    const chartType = config.chartType || 'bar';
    const sampleSelect = document.getElementById('sample-data');
    const datasetName = this.dataSource === 'custom' ? undefined : (sampleSelect ? sampleSelect.value : 'students');

    const override = {};
    if (config.xColumn) {
      override.xColumn = config.xColumn;
    }
    if (config.yColumn) {
      override.yColumn = config.yColumn;
    }

    const hasOverride = Object.keys(override).length > 0;
    this.createOrUpdateMarkerChart(markerId, chartType, datasetName, hasOverride ? override : null);
  }

  /**
   * Ensure A-Frame updates the CanvasTexture after we redraw the canvas.
   * @param {Element} entity - A-Frame entity with material component
   */
  forceMaterialRefresh(entity) {
    const mesh = entity.getObject3D && entity.getObject3D('mesh');
    if (mesh) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((m) => {
        if (m && m.map) {
          m.map.needsUpdate = true;
        }
        if (m) {
          m.needsUpdate = true;
        }
      });
    } else {
      // As a fallback, toggle the material src attribute to force a refresh
      const current = entity.getAttribute('material')?.src;
      if (current) {
        entity.setAttribute('material', 'src', null);
        setTimeout(() => entity.setAttribute('material', 'src', current), 0);
      }
    }
  }

  /**
   * Helper to read control panel selections and update marker 0 chart.
   * @param {string} markerId
   */
  updateMarkerChartFromControls(markerId = 'marker-0') {
    const typeSel = document.getElementById('chart-type');
    const dataSel = document.getElementById('sample-data');
    const chartType = typeSel ? typeSel.value : 'bar';
    const datasetName = dataSel ? dataSel.value : 'students';
    this.createOrUpdateMarkerChart(markerId, chartType, datasetName);
  }

  /**
   * Drive Chart.js tooltip on a marker-anchored chart using an A-Frame UV hit.
   * Pass null/undefined uv to hide the tooltip.
   * @param {string} markerId
   * @param {{x:number,y:number}|null} uv
   */
  showMarkerTooltipAtUV(markerId, uv) {
    const entry = this.markerCharts?.[markerId];
    if (!entry || !entry.chart || !entry.canvas) return;
    const { chart, canvas, entity } = entry;

    if (!uv) {
      try {
        chart.tooltip.setActiveElements([], { x: 0, y: 0 });
        chart.update('none');
        this.forceMaterialRefresh(entity);
      } catch (_) {}
      return;
    }

    // CRITICAL FIX: Map UV to actual chart area (excludes padding/margins)
    // Chart.js renders the chart within a smaller area due to legends, titles, padding
    const chartArea = chart.chartArea;

    // If chart isn't fully initialized yet, use fallback to full canvas
    if (!chartArea || !chartArea.left || !chartArea.right || !chartArea.top || !chartArea.bottom) {
      console.warn('Chart area not available, using full canvas mapping');
      const x = uv.x * canvas.width;
      const y = (1 - uv.y) * canvas.height;
      const pos = { x, y };

      // Early exit with basic mapping
      const MAX_DISTANCE_THRESHOLD = 20;
      return this.findAndActivateTooltip(chart, entity, pos, MAX_DISTANCE_THRESHOLD);
    }

    // Map UV coordinates (0-1) to the actual chart rendering area
    // chartArea = { left, right, top, bottom } in canvas pixels
    const x = chartArea.left + uv.x * (chartArea.right - chartArea.left);
    const y = chartArea.top + (1 - uv.y) * (chartArea.bottom - chartArea.top); // flip V to canvas Y
    const pos = { x, y };

    // Maximum distance threshold (in pixels) for tooltip activation
    const MAX_DISTANCE_THRESHOLD = 50;

    this.findAndActivateTooltip(chart, entity, pos, MAX_DISTANCE_THRESHOLD);
  }

  /**
   * Find nearest chart element and activate tooltip
   * Extracted as separate method for clarity
   *
   * @param {Chart} chart - Chart.js instance
   * @param {Element} entity - A-Frame entity
   * @param {Object} pos - Canvas position {x, y}
   * @param {number} maxDistance - Maximum distance threshold
   */
  findAndActivateTooltip(chart, entity, pos, maxDistance) {
    try {
      // Manually find nearest element to avoid needing a DOM event
      const active = [];
      const metas = chart.getSortedVisibleDatasetMetas ? chart.getSortedVisibleDatasetMetas() :
        chart.data.datasets.map((_, idx) => chart.getDatasetMeta(idx)).filter(m => !m.hidden);

      let best = { dist2: Infinity, datasetIndex: -1, index: -1 };
      metas.forEach((meta) => {
        const dsIndex = meta.index != null ? meta.index : meta.dataset?.index; // fallback
        (meta.data || []).forEach((el, i) => {
          const p = (typeof el.getProps === 'function') ? el.getProps(['x', 'y'], true) : el;
          const ex = p.x, ey = p.y;

          // Priority 1: Exact in-range hit (uses Chart.js built-in hit testing)
          if (typeof el.inRange === 'function' && el.inRange(pos.x, pos.y, 'nearest')) {
            const d2 = 0; // In-range hits have priority (distance = 0)
            if (d2 <= best.dist2) {
              best = { dist2: d2, datasetIndex: dsIndex ?? meta._datasetIndex ?? 0, index: i };
            }
          }
          // Priority 2: Distance-based hit, but only within threshold
          else if (Number.isFinite(ex) && Number.isFinite(ey)) {
            const dx = pos.x - ex;
            const dy = pos.y - ey;
            const d2 = dx * dx + dy * dy;
            const distance = Math.sqrt(d2);

            // Only consider elements within the distance threshold
            if (distance <= maxDistance && d2 < best.dist2) {
              best = { dist2: d2, datasetIndex: dsIndex ?? meta._datasetIndex ?? 0, index: i };
            }
          }
        });
      });

      // Only activate tooltip if we found an element within threshold
      if (best.datasetIndex >= 0 && best.dist2 <= maxDistance * maxDistance) {
        active.push({ datasetIndex: best.datasetIndex, index: best.index });
      }

      chart.tooltip.setActiveElements(active, pos);
      chart.update('none');
      this.forceMaterialRefresh(entity);
    } catch (e) {
      // Silently ignore tooltip errors to avoid breaking AR loop
      console.warn('Tooltip error:', e);
    }
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
    const currentData = this.getCurrentData(datasetName);
    const chart = this.generateChart(canvas, chartType, currentData);
    
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
  generateChart(canvas, type, data, chartConfigOverride = null) {
    const ctx = canvas.getContext('2d');

    let chartConfig = {
      type: type,
      data: {},
      options: {
        responsive: false,
        animation: false,
        layout: {
          padding: {
            top: 5,
            right: 5,
            bottom: 5,
            left: 5
          }
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              padding: 5,
              boxWidth: 12
            }
          },
          title: {
            display: true,
            text: `${type.toUpperCase()} Chart`,
            padding: {
              top: 5,
              bottom: 5
            }
          }
        },
        scales: type === 'bar' || type === 'line' || type === 'scatter' ? {
          x: {
            grid: { display: true },
            ticks: { padding: 2 }
          },
          y: {
            grid: { display: true },
            ticks: { padding: 2 }
          }
        } : undefined
      }
    };
    
    // Configure data based on type and dataset (allow override from Blockly cfg)
    chartConfig.data = this.prepareChartData(data, type, chartConfigOverride);
    
    return new Chart(ctx, chartConfig);
  }

  /**
   * Prepare chart data based on data structure and chart type
   * @param {Array<Object>} data - Data array
   * @param {string} type - Chart type
   * @returns {Object} Chart.js data configuration
   */
  prepareChartData(data, type, chartConfigOverride = null) {
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    const columns = Object.keys(data[0]);
    const numericColumns = columns.filter(col => 
      data.some(row => !isNaN(parseFloat(row[col])) && row[col] !== null && row[col] !== '')
    );
    const textColumns = columns.filter(col => 
      data.some(row => isNaN(parseFloat(row[col])) && row[col] !== null && row[col] !== '')
    );

    // If override config supplied (from Blockly), use it regardless of source
    if (chartConfigOverride && (chartConfigOverride.xColumn || chartConfigOverride.yColumn)) {
      return this.prepareOverriddenChartData(data, type, chartConfigOverride);
    }

    // For custom data, use intelligent column selection
    if (this.dataSource === 'custom') {
      return this.prepareCustomChartData(data, type, columns, numericColumns, textColumns);
    }

    // For sample data, use predefined configurations
    return this.prepareSampleChartData(data, type);
  }

  /**
   * Prepare chart data using an explicit override (from Blockly config)
   */
  prepareOverriddenChartData(data, type, cfg) {
    const xCol = cfg.xColumn;
    const yCol = cfg.yColumn;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

    if (type === 'scatter') {
      if (!xCol || !yCol) return { labels: [], datasets: [] };
      return {
        datasets: [{
          label: `${xCol} vs ${yCol}`,
          data: data.map(row => ({ x: parseFloat(row[xCol]) || 0, y: parseFloat(row[yCol]) || 0 })),
          backgroundColor: colors[0]
        }]
      };
    }

    // Bar / Line / Pie: single Y column against labels from X column
    if (xCol && yCol) {
      const labels = data.map(row => String(row[xCol] ?? ''));
      const series = data.map(row => parseFloat(row[yCol]) || 0);
      if (type === 'pie') {
        return {
          labels,
          datasets: [{ data: series, backgroundColor: labels.map((_, i) => `${colors[i % colors.length]}CC`) }]
        };
      }
      return {
        labels,
        datasets: [{
          label: yCol,
          data: series,
          backgroundColor: `${colors[0]}80`,
          borderColor: colors[0]
        }]
      };
    }

    // If only one provided, fall back to custom detection
    return this.prepareCustomChartData(
      data,
      type,
      Object.keys(data[0] || {}),
      Object.keys(data[0] || {}).filter(c => data.some(r => !isNaN(parseFloat(r[c])))),
      Object.keys(data[0] || {}).filter(c => data.some(r => isNaN(parseFloat(r[c]))))
    );
  }

  /**
   * Prepare chart data for custom datasets
   * @param {Array<Object>} data - Data array
   * @param {string} type - Chart type
   * @param {Array<string>} columns - All columns
   * @param {Array<string>} numericColumns - Numeric columns
   * @param {Array<string>} textColumns - Text columns
   * @returns {Object} Chart.js data configuration
   */
  prepareCustomChartData(data, type, columns, numericColumns, textColumns) {
    const colors = [
      'rgba(76, 175, 80, 0.8)',   // Green
      'rgba(33, 150, 243, 0.8)',  // Blue
      'rgba(255, 193, 7, 0.8)',   // Yellow
      'rgba(244, 67, 54, 0.8)',   // Red
      'rgba(156, 39, 176, 0.8)',  // Purple
      'rgba(255, 152, 0, 0.8)',   // Orange
      'rgba(0, 150, 136, 0.8)',   // Teal
      'rgba(103, 58, 183, 0.8)'   // Deep Purple
    ];

    if (type === 'bar' || type === 'line') {
      // Use first text column as labels, first numeric column as data
      const labelColumn = textColumns[0] || columns[0];
      const dataColumn = numericColumns[0] || columns[1] || columns[0];
      
      return {
        labels: data.map(row => String(row[labelColumn] || '')),
        datasets: [{
          label: dataColumn,
          data: data.map(row => parseFloat(row[dataColumn]) || 0),
          backgroundColor: colors[0],
          borderColor: colors[0].replace('0.8', '1'),
          borderWidth: 2
        }]
      };
    } else if (type === 'pie') {
      // Use first text column as labels, first numeric column as data
      const labelColumn = textColumns[0] || columns[0];
      const dataColumn = numericColumns[0] || columns[1] || columns[0];
      
      return {
        labels: data.map(row => String(row[labelColumn] || '')),
        datasets: [{
          data: data.map(row => parseFloat(row[dataColumn]) || 0),
          backgroundColor: colors.slice(0, data.length)
        }]
      };
    } else if (type === 'scatter') {
      // Use first two numeric columns for x and y
      const xColumn = numericColumns[0] || columns[0];
      const yColumn = numericColumns[1] || columns[1] || columns[0];
      
      return {
        datasets: [{
          label: `${xColumn} vs ${yColumn}`,
          data: data.map(row => ({ 
            x: parseFloat(row[xColumn]) || 0, 
            y: parseFloat(row[yColumn]) || 0 
          })),
          backgroundColor: colors[0]
        }]
      };
    }

    // Fallback
    return { labels: [], datasets: [] };
  }

  /**
   * Prepare chart data for sample datasets (legacy support)
   * @param {Array<Object>} data - Data array
   * @param {string} type - Chart type
   * @returns {Object} Chart.js data configuration
   */
  prepareSampleChartData(data, type) {
    if (type === 'bar' || type === 'line') {
      if (data === this.sampleData.students) {
        return {
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
        return {
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
        return {
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
        return {
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
        return {
          datasets: [{
            label: 'Age vs Score',
            data: data.map(d => ({ x: d.age, y: d.score })),
            backgroundColor: 'rgba(76, 175, 80, 0.8)'
          }]
        };
      }
    }

    // Fallback
    return { labels: [], datasets: [] };
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
