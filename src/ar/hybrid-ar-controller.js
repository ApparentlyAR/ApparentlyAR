/**
 * Hybrid AR Controller
 * 
 * Main controller for the hybrid AR system that combines AR.js marker detection
 * with MediaPipe hand tracking for educational data visualization.
 * 
 */

class HybridARController {
  constructor() {
    // Initialize subsystem instances
    this.coordinateSystem = new CoordinateSystem();
    this.gestureDetector = new GestureDetector();
    this.chartManager = new ChartManager(this.coordinateSystem);
    this.handTracking = new HandTracking(
      this.gestureDetector,
      this.chartManager,
      this.updateStatus.bind(this),
      this.coordinateSystem
    );

    // Bind methods
    this.init = this.init.bind(this);
    this.startHandTracking = this.startHandTracking.bind(this);
    this.stopHandTracking = this.stopHandTracking.bind(this);
    this.clearHandCharts = this.clearHandCharts.bind(this);
    this.selectChart = this.selectChart.bind(this);

    // Make functions available globally for HTML onclick handlers
    window.selectChart = this.selectChart;
    window.setDebugVisualization = (enabled) => this.handTracking.setDebugVisualization(enabled);
    window.setVideoMirroring = (mirrored) => {
      this.handTracking.setVideoMirroring(mirrored);
      this.gestureDetector.setVideoMirroring(mirrored);
      this.mirrorARWorld(mirrored);
    };
    window.setCalibration = (x, y) => this.coordinateSystem.setCalibration(x, y);
    window.resetCalibration = () => this.coordinateSystem.resetCalibration();
    window.refreshBlocklyFiles = () => this.refreshBlocklyFiles();
    window.loadBlocklyData = (filename) => this.loadBlocklyData(filename);
    window.spawnDevChart = () => this.spawnDevChart();
    window.removeDevChart = () => this.removeDevChart();
    window.spawnMockMarkerChart = () => this.spawnMockMarkerChart();
    window.removeMockMarkerChart = () => this.removeMockMarkerChart();

    /**
     * When true, the next time a real marker is detected we will
     * automatically re-parent the dev chart entity to marker-0.
     */
    this.autoAttachToMarker = false;
  }

  /**
   * Initialize the hybrid AR system
   */
  async init() {
    try {
      this.updateStatus('Initializing hybrid AR...', 'detecting');

      // Wait for AR.js to initialize and start camera
      await this.waitForArjsInit();

      const mirrorCheckbox = document.getElementById('mirror-video');
      if (mirrorCheckbox) {
        mirrorCheckbox.checked = true;
      }
      const mirrorEnabled = true;
      this.handTracking.setVideoMirroring(mirrorEnabled);
      this.gestureDetector.setVideoMirroring(mirrorEnabled);
      this.mirrorARWorld(mirrorEnabled);
      
      // Initialize MediaPipe
      await this.handTracking.initialize();

      // Initialize marker-anchored chart (marker 0) based on current controls
      this.chartManager.updateMarkerChartFromControls('marker-0');

      // Initialize data info display
      this.updateDataInfo();

      this.updateStatus('Hybrid AR ready - markers active, start hand tracking when ready', 'ready');
      
    } catch (error) {
      console.error('Initialization error:', error);
      this.updateStatus('Initialization failed: ' + error.message, 'error');
    }
  }

  /**
   * Wait for AR.js to fully initialize
   * 
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Initialization promise
   */
  waitForArjsInit(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkInit = () => {
        const video = document.querySelector('video');
        const scene = document.querySelector('a-scene');
        
        if (video && scene && scene.hasLoaded && video.videoWidth > 0) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for AR.js initialization'));
        } else {
          setTimeout(checkInit, 200);
        }
      };
      
      checkInit();
    });
  }

  /**
   * Start hand tracking
   */
  async startHandTracking() {
    await this.handTracking.start();
  }

  /**
   * Stop hand tracking
   */
  stopHandTracking() {
    this.handTracking.stop();
  }

  /**
   * Clear all hand-placed charts
   */
  clearHandCharts() {
    this.chartManager.clearHandCharts();
    this.gestureDetector.reset();
  }

  /**
   * Monitor marker detection status
   */
  monitorMarkers() {
    const markers = document.querySelectorAll('a-marker');
    let visibleMarkers = 0;

    // Dev: allow mocking marker-0 visibility via checkbox
    const mockMarker = document.getElementById('mock-marker-0');
    const isMocked = mockMarker && mockMarker.checked;
    if (isMocked) {
      visibleMarkers = 1;
      // Keep the marker-anchored chart updated when mocking is enabled
      this.chartManager.updateMarkerChartFromControls('marker-0');
    } else {
      markers.forEach(marker => {
        if (marker.object3D && marker.object3D.visible) {
          visibleMarkers++;
        }
      });
    }

    const markerStatus = document.getElementById('marker-status');
    if (visibleMarkers > 0) {
      markerStatus.textContent = `${visibleMarkers} marker(s) detected`;
      markerStatus.className = 'status detecting';

      // Auto-attach dev chart to marker once a marker is seen
      if (this.autoAttachToMarker) {
        const devContainer = document.getElementById('dev-marker-0');
        const entity = devContainer ? devContainer.querySelector('[data-marker-chart]') : null;
        if (entity) {
          try {
            this.moveDevChartToMarker();
            this.autoAttachToMarker = false;
          } catch (_) { /* ignore and try again on next tick */ }
        }
      }
    } else {
      markerStatus.textContent = 'Ready for markers';
      markerStatus.className = 'status ready';
    }
  }

  /**
   * Load chart limit settings from localStorage
   */
  loadChartLimitSettings() {
    try {
      const enableLimit = localStorage.getItem('chartLimitEnabled');
      const maxChartsStored = localStorage.getItem('maxCharts');
      const limitBehaviorStored = localStorage.getItem('limitBehavior');
      
      if (enableLimit !== null) {
        const chartLimitEnabled = enableLimit === 'true';
        document.getElementById('enable-chart-limit').checked = chartLimitEnabled;
        document.getElementById('limit-settings').style.display = chartLimitEnabled ? 'block' : 'none';
        
        const maxCharts = maxChartsStored ? parseInt(maxChartsStored) : 5;
        const limitBehavior = limitBehaviorStored || 'block';
        
        this.chartManager.setChartLimit(chartLimitEnabled, maxCharts, limitBehavior);
      }
      
      if (maxChartsStored !== null) {
        document.getElementById('max-charts-input').value = maxChartsStored;
      }
      
      if (limitBehaviorStored !== null) {
        document.getElementById('limit-behavior').value = limitBehaviorStored;
      }
    } catch (error) {
      console.warn('Failed to load chart limit settings from localStorage:', error);
    }
  }

  /**
   * Save chart limit settings to localStorage
   */
  saveChartLimitSettings() {
    try {
      const chartLimitEnabled = this.chartManager.chartLimitEnabled;
      const maxCharts = this.chartManager.maxCharts;
      const limitBehavior = this.chartManager.limitBehavior;
      
      localStorage.setItem('chartLimitEnabled', chartLimitEnabled.toString());
      localStorage.setItem('maxCharts', maxCharts.toString());
      localStorage.setItem('limitBehavior', limitBehavior);
    } catch (error) {
      console.warn('Failed to save chart limit settings to localStorage:', error);
    }
  }

  /**
   * Setup chart limit controls and event listeners
   */
  setupChartLimitControls() {
    const enableLimitCheckbox = document.getElementById('enable-chart-limit');
    const limitSettings = document.getElementById('limit-settings');
    const maxChartsInput = document.getElementById('max-charts-input');
    const limitBehaviorSelect = document.getElementById('limit-behavior');
    
    // Enable/disable chart limit
    enableLimitCheckbox.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      const maxCharts = parseInt(maxChartsInput.value) || 5;
      const behavior = limitBehaviorSelect.value || 'block';
      
      this.chartManager.setChartLimit(enabled, maxCharts, behavior);
      limitSettings.style.display = enabled ? 'block' : 'none';
      this.saveChartLimitSettings();
      
      console.log(`Chart limit ${enabled ? 'enabled' : 'disabled'}`);
    });
    
    // Update max charts
    maxChartsInput.addEventListener('input', (e) => {
      const newMax = parseInt(e.target.value);
      if (newMax >= 1 && newMax <= 20) {
        this.chartManager.setChartLimit(
          this.chartManager.chartLimitEnabled,
          newMax,
          this.chartManager.limitBehavior
        );
        this.saveChartLimitSettings();
        console.log(`Max charts set to: ${newMax}`);
      }
    });
    
    // Update limit behavior
    limitBehaviorSelect.addEventListener('change', (e) => {
      this.chartManager.setChartLimit(
        this.chartManager.chartLimitEnabled,
        this.chartManager.maxCharts,
        e.target.value
      );
      this.saveChartLimitSettings();
      console.log(`Limit behavior set to: ${e.target.value}`);
    });
  }

  /**
   * Select chart in UI
   * 
   * @param {string} id - Chart ID
   * @param {HTMLElement} el - Chart element
   */
  selectChart(id, el) {
    document.querySelectorAll('.chart-item').forEach(item => 
      item.classList.remove('selected'));
    el.classList.add('selected');
  }

  /**
   * Update status display
   *
   * @param {string} message - Status message
   * @param {string} type - Status type ('ready', 'detecting', 'error')
   */
  updateStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
  }

  /**
   * Mirror the entire AR world (all markers) at scene level
   * This fixes position, rotation, and visual inversion issues
   *
   * @param {boolean} mirrored - Enable mirror mode
   */
  mirrorARWorld(mirrored) {
    const arWorld = document.getElementById('ar-world');
    if (!arWorld) {
      console.warn('ar-world entity not found');
      return;
    }

    // Apply scale to entire AR world to mirror marker tracking
    const scaleX = mirrored ? -1 : 1;
    arWorld.setAttribute('scale', `${scaleX} 1 1`);

    console.log(`AR world mirroring: ${mirrored ? 'enabled' : 'disabled'}`);
  }

  /**
   * Refresh the list of available Blockly files
   */
  async refreshBlocklyFiles() {
    try {
      this.updateStatus('Refreshing Blockly files...', 'detecting');
      
      // Get list of files from uploads directory
      const response = await fetch('/api/list-files');
      if (!response.ok) {
        throw new Error('Failed to fetch file list');
      }
      
      const result = await response.json();
      const fileSelect = document.getElementById('blockly-filename');
      
      if (result.success && result.files && result.files.length > 0) {
        fileSelect.innerHTML = result.files.map(file => 
          `<option value="${file}">${file}</option>`
        ).join('');
        
        // Auto-select first file if none selected
        if (!fileSelect.value && result.files.length > 0) {
          fileSelect.value = result.files[0];
          await this.loadBlocklyData(result.files[0]);
        }
      } else {
        fileSelect.innerHTML = '<option value="">No files available</option>';
      }
      
      this.updateStatus('Files refreshed', 'ready');
    } catch (error) {
      console.error('Error refreshing files:', error);
      this.updateStatus('Failed to refresh files: ' + error.message, 'error');
    }
  }

  /**
   * Load data from a Blockly CSV file
   * @param {string} filename - Name of the CSV file
   */
  async loadBlocklyData(filename) {
    if (!filename) {
      console.warn('No filename provided for Blockly data loading');
      return;
    }

    try {
      this.updateStatus(`Loading ${filename}...`, 'detecting');
      
      if (!window.AppApi || !window.AppApi.getCsv) {
        throw new Error('API not available');
      }
      
      const result = await window.AppApi.getCsv(filename);
      if (!result.success) {
        throw new Error(result.error || 'Failed to load data');
      }
      
      // Load data into chart manager
      const success = this.chartManager.loadCustomData(result.data, filename);
      if (!success) {
        throw new Error('Failed to load data into chart manager');
      }
      
      // Update UI
      this.updateDataInfo();
      this.updateMarkerChart();
      
      this.updateStatus(`Loaded ${filename} (${result.data.length} rows)`, 'ready');
    } catch (error) {
      console.error('Error loading Blockly data:', error);
      this.updateStatus('Failed to load data: ' + error.message, 'error');
    }
  }

  /**
   * Update the data info display
   */
  updateDataInfo() {
    const info = this.chartManager.getDataSourceInfo();
    const sourceEl = document.getElementById('current-source');
    const datasetEl = document.getElementById('current-dataset');
    const rowsEl = document.getElementById('current-rows');
    const columnsEl = document.getElementById('current-columns');
    
    if (info.source === 'custom') {
      sourceEl.textContent = 'Blockly Data';
      datasetEl.textContent = info.filename;
      rowsEl.textContent = info.rowCount;
      columnsEl.textContent = info.columns.length;
    } else {
      sourceEl.textContent = 'Sample Data';
      const sampleSelect = document.getElementById('sample-data');
      datasetEl.textContent = sampleSelect.options[sampleSelect.selectedIndex].text;
      const currentData = this.chartManager.getCurrentData();
      rowsEl.textContent = currentData.length;
      columnsEl.textContent = Object.keys(currentData[0] || {}).length;
    }
  }

  /**
   * Update marker chart with current data
   */
  updateMarkerChart() {
    this.chartManager.updateMarkerChartFromControls('marker-0');
  }

  /**
   * Spawn a marker-anchored chart even if physical marker isn't present
   * Creates an a-plane under marker-0 and binds it to a canvas just like AR.js would.
   */
  async spawnMockMarkerChart() {
    try {
      await this.ensureBlocklyDataLoaded();
      const camera = document.querySelector('a-entity[camera]');
      if (!camera) throw new Error('camera entity not found');

      // Create a dev marker container anchored to camera (so we don't fight AR.js visibility)
      let devContainer = document.getElementById('dev-marker-0');
      if (!devContainer) {
        devContainer = document.createElement('a-entity');
        devContainer.setAttribute('id', 'dev-marker-0');
        devContainer.setAttribute('position', '0 0 -2.5');
        devContainer.setAttribute('rotation', '0 0 0');
        try { camera.appendChild(devContainer); } catch (_) {}
      }

      // Build chart from the CURRENT DATA SOURCE explicitly (custom or sample)
      const chartType = document.getElementById('chart-type').value;
      const dataForChart = this.chartManager.getCurrentData();

      // Create (or reuse) canvas
      let canvas = devContainer.querySelector('canvas#dev-marker-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'dev-marker-canvas';
        canvas.width = 400;
        canvas.height = 300;
        // Ensure it lives in <a-assets> for texture lookup
        const assets = document.querySelector('a-assets');
        if (assets) { try { assets.appendChild(canvas); } catch (_) {} }
      }

      // (Re)generate chart on the canvas (include override from last saved visualization if present)
      let overrideCfg = null;
      try {
        const rawCfg = localStorage.getItem('ar_last_visualization');
        if (rawCfg) {
          const parsed = JSON.parse(rawCfg);
          const xCol = parsed?.xColumn || parsed?.options?.xColumn || parsed?.config?.xColumn || parsed?.config?.options?.xColumn || null;
          const yCol = parsed?.yColumn || parsed?.options?.yColumn || parsed?.config?.yColumn || parsed?.config?.options?.yColumn || null;
          if (xCol || yCol) {
            overrideCfg = { xColumn: xCol, yColumn: yCol };
          }
          // If chart type provided, prefer it
          const savedType = parsed?.chartType || parsed?.config?.chartType || parsed?.config?.type || null;
          if (savedType) {
            try { document.getElementById('chart-type').value = parsed.chartType; } catch (_) {}
            chartType = savedType;
          }
        }
      } catch (_) {}

      try { this.devMarkerChart && this.devMarkerChart.destroy && this.devMarkerChart.destroy(); } catch (_) {}
      this.devMarkerChart = this.chartManager.generateChart(canvas, chartType, dataForChart, overrideCfg);
      console.log('[AR] Chart rendered with:', { chartType, overrideCfg, rows: Array.isArray(dataForChart) ? dataForChart.length : 0 });

      // Create (or reuse) plane entity
      let entity = devContainer.querySelector('[data-marker-chart]');
      if (!entity) {
        entity = document.createElement('a-plane');
        entity.setAttribute('data-marker-chart', '');
        devContainer.appendChild(entity);
      }

      entity.setAttribute('visible', true);
      entity.setAttribute('position', '0 0 0');
      entity.setAttribute('rotation', '0 0 0');
      entity.setAttribute('width', '1.2');
      entity.setAttribute('height', '0.9');
      entity.setAttribute('material', `shader: flat; src: #${canvas.id}; transparent: true; side: double`);
      try { this.chartManager.forceMaterialRefresh(entity); } catch (_) {}

      // Enable auto-attach to physical marker when it becomes visible
      this.autoAttachToMarker = true;

      this.updateStatus('Mock marker chart spawned (centered)', 'ready');
    } catch (error) {
      console.error('Error spawning mock marker chart:', error);
      this.updateStatus('Failed to spawn marker chart: ' + error.message, 'error');
    }
  }

  /**
   * Remove the mock marker chart entity if present
   */
  removeMockMarkerChart() {
    try {
      const devContainer = document.getElementById('dev-marker-0');
      if (devContainer) {
        const entity = devContainer.querySelector('[data-marker-chart]');
        if (entity) { try { entity.remove(); } catch (_) {} }
        try { devContainer.remove(); } catch (_) {}
      }
      this.updateStatus('Mock marker chart removed', 'ready');
    } catch (error) {
      console.error('Error removing mock marker chart:', error);
    }
  }

  /**
   * Move the dev chart (camera-anchored) to the real marker-0 entity.
   * Safe to call repeatedly; does nothing if either side is missing.
   */
  moveDevChartToMarker() {
    const marker = document.getElementById('marker-0');
    const devContainer = document.getElementById('dev-marker-0');
    if (!marker || !devContainer) return;
    const entity = devContainer.querySelector('[data-marker-chart]');
    if (!entity) return;
    try { marker.appendChild(entity); } catch (_) {}
    entity.setAttribute('position', '0 2 0'); // default offset used by ChartManager
    entity.setAttribute('rotation', '0 0 0');
    try { this.chartManager.forceMaterialRefresh(entity); } catch (_) {}
    this.updateStatus('Chart moved to marker-0', 'ready');
  }

  /**
   * Spawn a dev mode chart overlay for testing without markers
   */
  async spawnDevChart() {
    try {
      const overlay = document.getElementById('dev-chart-overlay');
      const canvas = document.getElementById('dev-chart-canvas');
      
      if (!overlay || !canvas) {
        console.error('Dev chart elements not found');
        return;
      }

      // Ensure Blockly data is loaded if selected
      await this.ensureBlocklyDataLoaded();

      // Get current chart configuration
      const chartType = document.getElementById('chart-type').value;
      const currentData = this.chartManager.getCurrentData();
      
      // Generate chart on the dev canvas
      const chart = this.chartManager.generateChart(canvas, chartType, currentData);
      
      // Store reference for cleanup
      this.devChart = chart;
      
      // Show the overlay
      overlay.style.display = 'block';
      
      // Update status
      this.updateStatus('Dev chart spawned - no marker needed!', 'ready');
      
      console.log('Dev chart spawned with', chartType, 'chart using current data');
    } catch (error) {
      console.error('Error spawning dev chart:', error);
      this.updateStatus('Failed to spawn dev chart: ' + error.message, 'error');
    }
  }

  /**
   * Ensure Blockly data is loaded when data source is 'blockly'.
   */
  async ensureBlocklyDataLoaded() {
    try {
      const dataSourceSel = document.getElementById('data-source');
      const isBlockly = dataSourceSel && dataSourceSel.value === 'blockly';
      const needsLoad = this.chartManager.dataSource !== 'custom' || !this.chartManager.customData;
      if (isBlockly && needsLoad) {
        const blocklyFileSel = document.getElementById('blockly-filename');
        let filename = blocklyFileSel ? blocklyFileSel.value : '';
        if (!filename && window.Blockly && window.Blockly.CsvImportData && window.Blockly.CsvImportData.filename) {
          filename = window.Blockly.CsvImportData.filename;
        }
        if (filename) {
          await this.loadBlocklyData(filename);
        }
      }
    } catch (_) { /* non-fatal */ }
  }

  /**
   * Update dev chart if it's currently visible
   */
  updateDevChartIfVisible() {
    const overlay = document.getElementById('dev-chart-overlay');
    if (overlay && overlay.style.display === 'block' && this.devChart) {
      // Re-spawn the chart with new settings
      this.removeDevChart();
      setTimeout(() => { this.spawnDevChart(); }, 100);
    }
  }

  /**
   * Remove the dev mode chart overlay
   */
  removeDevChart() {
    try {
      const overlay = document.getElementById('dev-chart-overlay');
      
      if (!overlay) {
        console.error('Dev chart overlay not found');
        return;
      }

      // Destroy chart instance if it exists
      if (this.devChart) {
        try {
          this.devChart.destroy();
        } catch (e) {
          console.warn('Error destroying dev chart:', e);
        }
        this.devChart = null;
      }

      // Hide the overlay
      overlay.style.display = 'none';
      
      // Update status
      this.updateStatus('Dev chart removed', 'ready');
      
      console.log('Dev chart removed');
    } catch (error) {
      console.error('Error removing dev chart:', error);
      this.updateStatus('Failed to remove dev chart: ' + error.message, 'error');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.getElementById('start-hands').addEventListener('click', this.startHandTracking);
    document.getElementById('stop-hands').addEventListener('click', this.stopHandTracking);

    const mirrorCheckbox = document.getElementById('mirror-video');
    if (mirrorCheckbox) {
      mirrorCheckbox.checked = true;
      this.handTracking.setVideoMirroring(true);
      this.gestureDetector.setVideoMirroring(true);
      this.mirrorARWorld(true);
    }

    // Monitor marker detection periodically
    setInterval(this.monitorMarkers.bind(this), 500);

    // Update marker 0 chart when controls change
    const typeSel = document.getElementById('chart-type');
    const dataSel = document.getElementById('sample-data');
    const dataSourceSel = document.getElementById('data-source');
    const blocklyFileSel = document.getElementById('blockly-filename');
    const refreshBtn = document.getElementById('refresh-files');
    const uploadBtn = document.getElementById('upload-file-btn');
    const uploadInput = document.getElementById('upload-file');
    const loadFromBlocklyBtn = document.getElementById('load-from-blockly');
    const moveToMarkerBtn = document.getElementById('move-to-marker');
    
    const handler = () => this.chartManager.updateMarkerChartFromControls('marker-0');
    const dataInfoHandler = () => this.updateDataInfo();
    
    if (typeSel) {
      typeSel.addEventListener('change', () => {
        handler();
        this.updateDevChartIfVisible();
      });
      typeSel.addEventListener('input', () => {
        handler();
        this.updateDevChartIfVisible();
      });
    }
    if (dataSel) {
      dataSel.addEventListener('change', () => {
        handler();
        dataInfoHandler();
      });
      dataSel.addEventListener('input', () => {
        handler();
        dataInfoHandler();
      });
    }
    
    // Handle data source switching
    if (dataSourceSel) {
      dataSourceSel.addEventListener('change', async (e) => {
        const source = e.target.value;
        const sampleGroup = document.getElementById('sample-data-group');
        const blocklyGroup = document.getElementById('blockly-data-group');
        
        if (source === 'sample') {
          sampleGroup.style.display = 'block';
          blocklyGroup.style.display = 'none';
          this.chartManager.useSampleData();
        } else if (source === 'blockly') {
          sampleGroup.style.display = 'none';
          blocklyGroup.style.display = 'block';
          await this.refreshBlocklyFiles();
          // Auto-load selected file if any
          const sel = document.getElementById('blockly-filename');
          const selected = sel && sel.value ? sel.value : (window.Blockly && window.Blockly.CsvImportData ? window.Blockly.CsvImportData.filename : '');
          if (selected) {
            await this.loadBlocklyData(selected);
          }
        }
        
        this.updateDataInfo();
        this.updateMarkerChart();
        this.updateDevChartIfVisible();
      });
    }
    
    // Handle Blockly file selection
    if (blocklyFileSel) {
      blocklyFileSel.addEventListener('change', async (e) => {
        if (e.target.value) {
          await this.loadBlocklyData(e.target.value);
          this.updateDevChartIfVisible();
        }
      });
    }
    
    // Handle refresh button
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.refreshBlocklyFiles();
      });
    }

    // Upload CSV
    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener('click', () => uploadInput.click());
      uploadInput.addEventListener('change', async (e) => {
        try {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          if (!window.AppApi || !window.AppApi.uploadCsv) throw new Error('API not available');
          this.updateStatus('Uploading CSV...', 'detecting');
          const result = await window.AppApi.uploadCsv(file);
          if (!result || !result.success) throw new Error(result?.error || 'Upload failed');
          await this.refreshBlocklyFiles();
          const sel = document.getElementById('blockly-filename');
          if (sel && result.filename) { sel.value = result.filename; }
          await this.loadBlocklyData(result.filename);
          this.updateDevChartIfVisible();
          this.updateStatus('CSV uploaded', 'ready');
        } catch (err) {
          console.error('Upload error:', err);
          this.updateStatus('Upload failed: ' + err.message, 'error');
        } finally {
          if (uploadInput) uploadInput.value = '';
        }
      });
    }

    // Handle dev mode buttons
    const spawnDevBtn = document.getElementById('spawn-dev-chart');
    const removeDevBtn = document.getElementById('remove-dev-chart');
    
    if (spawnDevBtn) {
      spawnDevBtn.addEventListener('click', async () => {
        await this.spawnDevChart();
      });
    }
    
    if (removeDevBtn) {
      removeDevBtn.addEventListener('click', () => {
        this.removeDevChart();
      });
    }

    // Dev mock marker buttons
    const spawnMockMarkerBtn = document.getElementById('spawn-mock-marker-chart');
    const removeMockMarkerBtn = document.getElementById('remove-mock-marker-chart');
    if (spawnMockMarkerBtn) {
      spawnMockMarkerBtn.addEventListener('click', async () => {
        await this.spawnMockMarkerChart();
      });
    }
    if (removeMockMarkerBtn) {
      removeMockMarkerBtn.addEventListener('click', () => {
        this.removeMockMarkerChart();
      });
    }

    // Load last visualization produced in Blockly (handoff via localStorage and /uploads CSV)
    if (loadFromBlocklyBtn) {
      loadFromBlocklyBtn.addEventListener('click', async () => {
        try {
          const raw = localStorage.getItem('ar_last_visualization');
          if (!raw) throw new Error('No saved visualization found. Generate one in Blockly first.');
          const cfg = JSON.parse(raw);
          const deriveFilename = () => {
            if (cfg.savedPath && typeof cfg.savedPath === 'string') {
              const idx = cfg.savedPath.lastIndexOf('/');
              return cfg.savedPath.substring(idx + 1);
            }
            const base = (cfg.filename || '').trim();
            if (!base) return '';
            // Mirror server sanitization: replace invalids with '_' and ensure .csv
            const safe = base.replace(/[^\w\-.]/g, '_');
            return safe.toLowerCase().endsWith('.csv') ? safe : `${safe}.csv`;
          };
          const expectedFile = deriveFilename();
          // Switch to Blockly Data source
          const dataSourceSel = document.getElementById('data-source');
          if (dataSourceSel) dataSourceSel.value = 'blockly';
          const blocklyGroup = document.getElementById('blockly-data-group');
          const sampleGroup = document.getElementById('sample-data-group');
          if (blocklyGroup && sampleGroup) { blocklyGroup.style.display = 'block'; sampleGroup.style.display = 'none'; }
          await this.refreshBlocklyFiles();
          const sel = document.getElementById('blockly-filename');
          if (sel) {
            // Try exact match, then case-insensitive match
            let chosen = '';
            const options = Array.from(sel.options || []);
            const exact = options.find(o => o.value === expectedFile);
            if (exact) chosen = exact.value;
            else {
              const lower = options.find(o => o.value.toLowerCase() === expectedFile.toLowerCase());
              if (lower) chosen = lower.value;
            }
            if (!chosen && options.length > 0) {
              // As last resort, use most recent file from list-files (already sorted by mtime)
              chosen = options[0].value;
            }
            if (chosen) sel.value = chosen;
            if (chosen) await this.loadBlocklyData(chosen);
          } else if (expectedFile) {
            await this.loadBlocklyData(expectedFile);
          }
          this.updateDataInfo();
          this.updateMarkerChart();
          // Apply chart type if provided
          if (cfg.chartType) {
            const typeSel = document.getElementById('chart-type');
            if (typeSel) typeSel.value = cfg.chartType;
          }
          await this.spawnMockMarkerChart();
        } catch (err) {
          console.error('Load from Blockly error:', err);
          this.updateStatus('Load from Blockly failed: ' + err.message, 'error');
        }
      });
    }

    // Re-parent the dev chart back to the real marker-0 entity
    if (moveToMarkerBtn) {
      moveToMarkerBtn.addEventListener('click', () => {
        try {
          const marker = document.getElementById('marker-0');
          const camera = document.querySelector('a-entity[camera]');
          if (!marker || !camera) return;
          const devContainer = document.getElementById('dev-marker-0');
          if (!devContainer) return;
          const entity = devContainer.querySelector('[data-marker-chart]');
          if (!entity) return;
          // Move entity under marker-0
          try { marker.appendChild(entity); } catch (_) {}
          entity.setAttribute('position', '0 2 0'); // original placement offset used by ChartManager
          entity.setAttribute('rotation', '0 0 0');
          try { this.chartManager.forceMaterialRefresh(entity); } catch (_) {}
          this.updateStatus('Chart moved to marker-0', 'ready');
        } catch (err) {
          console.error('Move to marker error:', err);
          this.updateStatus('Failed to move chart to marker', 'error');
        }
      });
    }
  }
}

// Global instance and initialization
let hybridARController;

// Initialize when page loads
window.addEventListener('load', async () => {
  hybridARController = new HybridARController();
  hybridARController.setupEventListeners();
  await hybridARController.init();
});

// Export for use in other modules if needed
window.HybridARController = HybridARController;
