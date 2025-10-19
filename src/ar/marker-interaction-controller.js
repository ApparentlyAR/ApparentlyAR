/**
 * Marker Interaction Controller
 *
 * Manages rotation-based interactions with AR markers for data exploration.
 * Integrates with Blockly autofill system and backend data processing.
 */

class MarkerInteractionController {
  constructor(chartManager) {
    this.chartManager = chartManager;

    // State
    this.availableColumns = [];
    this.currentXColumn = null;
    this.currentYColumn = null;
    this.currentSortColumn = null;
    this.currentSortOrder = 'ascending';
    this.currentChartType = 'bar';
    this.currentFilterColumn = null;
    this.currentFilterThreshold = null;
    this.filterRange = null;

    // Rotation tracking
    this.rotationIntervals = {}; // markerNum -> intervalId
    this.rotationSmoothers = {}; // markerNum -> RotationSmoother

    // Debounce timers
    this.updateChartDebounced = this.debounce(() => this.updateChart(), 300);
    this.applySortingDebounced = this.debounce(() => this.applySorting(), 300);
    this.applyFilterDebounced = this.debounce(() => this.applyFilter(), 500);

    // Subscribe to CSV data changes
    window.addEventListener('csvDataChanged', () => {
      this.refreshAvailableColumns();
    });

    this.refreshAvailableColumns();
  }

  /**
   * Get available columns from Blockly autofill system
   */
  refreshAvailableColumns() {
    this.availableColumns = window.BlocklyAutofill?.getAvailableColumns() || [];
    console.log('[MarkerInteraction] Available columns:', this.availableColumns);

    // Initialize defaults
    if (this.availableColumns.length > 0) {
      this.currentXColumn = this.currentXColumn || this.availableColumns[0];
      this.currentYColumn = this.currentYColumn || (this.availableColumns[1] || this.availableColumns[0]);
      this.currentSortColumn = this.currentSortColumn || this.availableColumns[0];
    }

    this.dispatchStateChange();
  }

  /**
   * Start tracking rotation for a marker
   * @param {number} markerNum - Marker number (1-7)
   * @param {Element} markerElement - A-Frame marker element
   */
  startTrackingRotation(markerNum, markerElement) {
    if (this.rotationIntervals[markerNum]) {
      clearInterval(this.rotationIntervals[markerNum]);
    }

    // Initialize smoother
    if (!this.rotationSmoothers[markerNum]) {
      this.rotationSmoothers[markerNum] = new RotationSmoother(5);
    }

    this.rotationIntervals[markerNum] = setInterval(() => {
      const rotation = markerElement.object3D.rotation.y; // radians
      const degrees = THREE.MathUtils.radToDeg(rotation);
      const normalized = (degrees + 360) % 360; // 0-360°

      // Apply smoothing
      const smoothed = this.rotationSmoothers[markerNum].addReading(normalized);

      this.handleMarkerRotation(markerNum, smoothed);
    }, 100); // 10 Hz

    console.log(`[MarkerInteraction] Started tracking marker ${markerNum}`);
  }

  /**
   * Stop tracking rotation for a marker
   * @param {number} markerNum - Marker number
   */
  stopTrackingRotation(markerNum) {
    if (this.rotationIntervals[markerNum]) {
      clearInterval(this.rotationIntervals[markerNum]);
      delete this.rotationIntervals[markerNum];
      console.log(`[MarkerInteraction] Stopped tracking marker ${markerNum}`);
    }
  }

  /**
   * Handle marker rotation event
   * @param {number} markerNum - Marker number
   * @param {number} degrees - Rotation in degrees (0-360)
   */
  handleMarkerRotation(markerNum, degrees) {
    switch (markerNum) {
      case 1:
        this.handleXAxisRotation(degrees);
        break;
      case 2:
        this.handleYAxisRotation(degrees);
        break;
      case 3:
        this.handleSortColumnRotation(degrees);
        break;
      case 4:
        this.handleSortOrderRotation(degrees);
        break;
      case 5:
        this.handleFilterThresholdRotation(degrees);
        break;
      case 6:
        this.handleChartTypeRotation(degrees);
        break;
      default:
        console.warn(`[MarkerInteraction] Unhandled marker ${markerNum}`);
    }
  }

  /**
   * Placeholder handlers for marker rotations (to be implemented in future phases)
   */
  handleXAxisRotation(degrees) {
    // To be implemented in Phase 3
  }

  handleYAxisRotation(degrees) {
    // To be implemented in Phase 4
  }

  handleSortColumnRotation(degrees) {
    // To be implemented in Phase 5
  }

  handleSortOrderRotation(degrees) {
    // To be implemented in Phase 1
  }

  handleFilterThresholdRotation(degrees) {
    // To be implemented in Phase 6
  }

  handleChartTypeRotation(degrees) {
    // To be implemented in Phase 2
  }

  /**
   * Update chart with current configuration (placeholder)
   */
  async updateChart() {
    // To be implemented in future phases
    console.log('[MarkerInteraction] updateChart called (placeholder)');
  }

  /**
   * Apply sorting to current dataset (placeholder)
   */
  async applySorting() {
    // To be implemented in Phase 1
    console.log('[MarkerInteraction] applySorting called (placeholder)');
  }

  /**
   * Apply filter to current dataset (placeholder)
   */
  async applyFilter() {
    // To be implemented in Phase 6
    console.log('[MarkerInteraction] applyFilter called (placeholder)');
  }

  /**
   * Debounce helper
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Dispatch state change event
   */
  dispatchStateChange() {
    window.dispatchEvent(new CustomEvent('markerInteractionStateChange', {
      detail: {
        xColumn: this.currentXColumn,
        yColumn: this.currentYColumn,
        sortColumn: this.currentSortColumn,
        sortOrder: this.currentSortOrder,
        chartType: this.currentChartType,
        filterColumn: this.currentFilterColumn,
        filterThreshold: this.currentFilterThreshold,
        availableColumns: this.availableColumns
      }
    }));
  }
}

/**
 * Rotation Smoother
 *
 * Applies moving average filter to rotation readings to reduce jitter.
 */
class RotationSmoother {
  constructor(windowSize = 5) {
    this.readings = [];
    this.windowSize = windowSize;
  }

  addReading(degrees) {
    this.readings.push(degrees);
    if (this.readings.length > this.windowSize) {
      this.readings.shift();
    }
    return this.getAverage();
  }

  getAverage() {
    if (this.readings.length === 0) return 0;

    // Handle 0°/360° wraparound
    // Convert to unit vectors, average, then back to angle
    let sinSum = 0;
    let cosSum = 0;

    for (const deg of this.readings) {
      const rad = deg * Math.PI / 180;
      sinSum += Math.sin(rad);
      cosSum += Math.cos(rad);
    }

    const avgRad = Math.atan2(sinSum / this.readings.length, cosSum / this.readings.length);
    const avgDeg = (avgRad * 180 / Math.PI + 360) % 360;

    return avgDeg;
  }

  reset() {
    this.readings = [];
  }
}

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MarkerInteractionController, RotationSmoother };
}
