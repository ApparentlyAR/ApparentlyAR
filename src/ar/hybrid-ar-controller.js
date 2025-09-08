/**
 * Hybrid AR Controller
 * 
 * Main controller for the hybrid AR system that combines AR.js marker detection
 * with MediaPipe hand tracking for educational data visualization.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
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
      this.updateStatus.bind(this)
    );

    // Bind methods
    this.init = this.init.bind(this);
    this.startHandTracking = this.startHandTracking.bind(this);
    this.stopHandTracking = this.stopHandTracking.bind(this);
    this.clearHandCharts = this.clearHandCharts.bind(this);
    this.selectChart = this.selectChart.bind(this);
    
    // Make selectChart available globally for HTML onclick handlers
    window.selectChart = this.selectChart;
  }

  /**
   * Initialize the hybrid AR system
   * 
   * @returns {Promise<void>} Initialization promise
   * @throws {Error} If initialization fails
   */
  async init() {
    try {
      this.updateStatus('Initializing hybrid AR...', 'detecting');
      
      // Load chart limit settings from localStorage
      this.loadChartLimitSettings();
      
      // Setup chart limit controls
      this.setupChartLimitControls();
      
      // Wait for AR.js to initialize and start camera
      await this.waitForArjsInit();
      
      // Initialize MediaPipe
      await this.handTracking.initialize();
      
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
   * 
   * @returns {Promise<void>} Hand tracking start promise
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
   * Monitor marker detection status and register positions
   */
  monitorMarkers() {
    const markers = document.querySelectorAll('a-marker');
    let visibleMarkers = 0;
    
    markers.forEach(marker => {
      if (marker.object3D && marker.object3D.visible) {
        visibleMarkers++;
        
        // Register marker position in unified coordinate system
        const position = marker.object3D.position;
        const rotation = marker.object3D.rotation;
        this.coordinateSystem.registerMarker(
          marker.getAttribute('value'),
          { x: position.x, y: position.y, z: position.z },
          { x: rotation.x, y: rotation.y, z: rotation.z }
        );
      }
    });
    
    const markerStatus = document.getElementById('marker-status');
    if (visibleMarkers > 0) {
      markerStatus.textContent = `${visibleMarkers} marker(s) detected`;
      markerStatus.className = 'status detecting';
      
      // Update spatial analysis
      this.updateSpatialAnalysis();
    } else {
      markerStatus.textContent = 'Ready for markers';
      markerStatus.className = 'status ready';
    }
  }

  /**
   * Update spatial analysis display
   * 
   * @returns {void}
   */
  updateSpatialAnalysis() {
    const analysis = this.coordinateSystem.getSpatialAnalysis();
    const analysisElement = document.getElementById('spatial-analysis');
    
    if (analysisElement) {
      analysisElement.innerHTML = `
        <div>Total Objects: ${analysis.totalObjects}</div>
        <div>Markers: ${analysis.markerCount}</div>
        <div>Charts: ${analysis.chartCount}</div>
        <div>Avg Distance: ${analysis.averageDistance.toFixed(2)}</div>
        <div>Density: ${analysis.spatialDensity.toFixed(3)}</div>
      `;
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
        document.getElementById('max-charts').value = maxChartsStored;
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
    const maxChartsInput = document.getElementById('max-charts');
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
   * Setup event listeners
   */
  setupEventListeners() {
    document.getElementById('start-hands').addEventListener('click', this.startHandTracking);
    document.getElementById('stop-hands').addEventListener('click', this.stopHandTracking);
    document.getElementById('clear-charts').addEventListener('click', this.clearHandCharts);

    // Monitor marker detection periodically
    setInterval(this.monitorMarkers.bind(this), 500);
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