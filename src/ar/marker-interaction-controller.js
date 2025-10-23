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
    this.currentFilterValue = null;

    // Rotation tracking
    this.rotationIntervals = {}; // markerNum -> intervalId
    this.rotationSmoothers = {}; // markerNum -> RotationSmoother

    // Sector history for hysteresis handling (per marker)
    this.lastSectorByMarker = {}; // markerNum -> last stable sector index

    // Pending debounce handles for cleanup
    this.pendingTimeouts = new Set();

    // Debounce timers
    this.updateChartDebounced = this.debounce(() => this.updateChart(), 300);
    this.applySortingDebounced = this.debounce(() => this.applySorting(), 500);
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
    this.lastSectorByMarker = {};
    this.availableColumns = window.BlocklyAutofill?.getAvailableColumns() || [];
    if (this.availableColumns.length === 0) {
      const fallbackData = this.chartManager?.getCurrentData?.();
      if (Array.isArray(fallbackData) && fallbackData.length) {
        this.availableColumns = Object.keys(fallbackData[0]);
      }
    }
    console.log('[MarkerInteraction] Available columns:', this.availableColumns);

    if (this.availableColumns.length > 0) {
      if (!this.availableColumns.includes(this.currentXColumn)) {
        this.currentXColumn = this.availableColumns[0];
      }
      if (!this.availableColumns.includes(this.currentYColumn)) {
        this.currentYColumn = this.availableColumns[1] || this.availableColumns[0];
      }
      if (!this.availableColumns.includes(this.currentSortColumn)) {
        this.currentSortColumn = this.availableColumns[0];
      }
    } else {
      this.currentXColumn = null;
      this.currentYColumn = null;
      this.currentSortColumn = null;
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
        this.handleFilterCategoryRotation(degrees);
        break;
      case 6:
        this.handleChartTypeRotation(degrees);
        break;
      case 7:
        this.handleReservedMarkerRotation(degrees);
        break;
      default:
        console.warn(`[MarkerInteraction] Unhandled marker ${markerNum}`);
    }
  }

  /**
   * Placeholder handlers for marker rotations (to be implemented in future phases)
   */
  handleXAxisRotation(degrees) {
    const columns = this.availableColumns;
    if (!Array.isArray(columns) || columns.length === 0) {
      console.warn('[Marker 1] No columns available for X-axis selection');
      return;
    }

    const selectedColumn = this.getSectorValueFromRotation(1, degrees, columns);
    if (!selectedColumn) {
      return;
    }

    if (selectedColumn !== this.currentXColumn) {
      console.log(`[Marker 1] X-axis changed: ${this.currentXColumn} → ${selectedColumn}`);
      this.currentXColumn = selectedColumn;
      this.dispatchStateChange();
      this.updateChartDebounced();
    }
  }

  handleYAxisRotation(degrees) {
    const columns = this.availableColumns;
    if (!Array.isArray(columns) || columns.length === 0) {
      console.warn('[Marker 2] No columns available for Y-axis selection');
      return;
    }

    const selectedColumn = this.getSectorValueFromRotation(2, degrees, columns);
    if (!selectedColumn) {
      return;
    }

    if (selectedColumn !== this.currentYColumn) {
      console.log(`[Marker 2] Y-axis changed: ${this.currentYColumn} → ${selectedColumn}`);
      this.currentYColumn = selectedColumn;
      this.dispatchStateChange();
      this.updateChartDebounced();
    }
  }

  handleSortColumnRotation(degrees) {
    const columns = this.availableColumns;
    if (!Array.isArray(columns) || columns.length === 0) {
      console.warn('[Marker 3] No columns available for sort selection');
      return;
    }

    const selectedColumn = this.getSectorValueFromRotation(3, degrees, columns);
    if (!selectedColumn) {
      return;
    }

    if (selectedColumn !== this.currentSortColumn) {
      console.log(`[Marker 3] Sort column changed: ${this.currentSortColumn} → ${selectedColumn}`);
      this.currentSortColumn = selectedColumn;
      this.dispatchStateChange();
      this.applySortingDebounced();
    }
  }

  handleSortOrderRotation(degrees) {
    const BUFFER = 10;
    const normalized = ((degrees % 360) + 360) % 360;

    let newOrder = null;

    if (normalized >= BUFFER && normalized <= 180 - BUFFER) {
      newOrder = 'ascending';
    } else if (normalized >= 180 + BUFFER && normalized <= 360 - BUFFER) {
      newOrder = 'descending';
    } else {
      // Within buffer zone (0-10, 170-190, 350-360) → no toggle
      return;
    }

    if (newOrder !== this.currentSortOrder) {
      console.log(`[Marker 4] Sort order changed: ${this.currentSortOrder} → ${newOrder}`);
      this.currentSortOrder = newOrder;
      this.dispatchStateChange();
      this.applySortingDebounced();
    }
  }

  handleFilterCategoryRotation(degrees) {
    // To be implemented in Phase 6
  }

  handleChartTypeRotation(degrees) {
    // To be implemented in Phase 2
  }

  handleReservedMarkerRotation(degrees) {
    console.log('[MarkerInteraction] Reserved marker rotation detected:', degrees);
  }

  setChartType(type) {
    if (!type) return;
    if (this.currentChartType !== type) {
      this.currentChartType = type;
      this.dispatchStateChange();
    }
    this.updateChartDebounced();
  }

  setXAxisColumn(column) {
    if (!column) return;
    if (!this.availableColumns.includes(column)) {
      console.warn(`[MarkerInteraction] Invalid X-axis column: ${column}`);
      return;
    }
    if (this.currentXColumn !== column) {
      this.currentXColumn = column;
      this.dispatchStateChange();
    }
    this.updateChartDebounced();
  }

  setYAxisColumn(column) {
    if (!column) return;
    if (!this.availableColumns.includes(column)) {
      console.warn(`[MarkerInteraction] Invalid Y-axis column: ${column}`);
      return;
    }
    if (this.currentYColumn !== column) {
      this.currentYColumn = column;
      this.dispatchStateChange();
    }
    this.updateChartDebounced();
  }

  setSortColumn(column) {
    if (!column) return;
    if (!this.availableColumns.includes(column)) {
      console.warn(`[MarkerInteraction] Invalid sort column: ${column}`);
      return;
    }
    if (this.currentSortColumn !== column) {
      this.currentSortColumn = column;
      this.dispatchStateChange();
    }
    this.applySortingDebounced();
  }

  setSortOrder(order) {
    if (!order) return;
    const normalized = order === 'descending' ? 'descending' : 'ascending';
    if (this.currentSortOrder !== normalized) {
      this.currentSortOrder = normalized;
      this.dispatchStateChange();
    }
    this.applySortingDebounced();
  }

  resetConfiguration() {
    if (this.availableColumns.length > 0) {
      this.currentXColumn = this.availableColumns[0];
      this.currentYColumn = this.availableColumns[1] || this.availableColumns[0];
      this.currentSortColumn = this.availableColumns[0];
    } else {
      this.currentXColumn = null;
      this.currentYColumn = null;
      this.currentSortColumn = null;
    }
    this.currentSortOrder = 'ascending';
    this.currentChartType = 'bar';
    this.dispatchStateChange();
    this.updateChartDebounced();
  }

  /**
   * Update chart with current configuration (placeholder)
   */
  async updateChart() {
    try {
      const chartType = this.currentChartType || 'bar';
      let columns = this.availableColumns;
      if (!Array.isArray(columns) || columns.length === 0) {
        const data = this.chartManager?.getCurrentData?.();
        if (Array.isArray(data) && data.length) {
          columns = Object.keys(data[0]);
          this.availableColumns = columns;
        } else {
          console.warn('[MarkerInteraction] No data available to update chart');
          return;
        }
      }

      if (!columns.includes(this.currentXColumn)) {
        if (this.currentXColumn) {
          console.warn(`[MarkerInteraction] X column '${this.currentXColumn}' not found; resetting to '${columns[0]}'`);
        }
        this.currentXColumn = columns[0];
      }
      if (!columns.includes(this.currentYColumn)) {
        if (this.currentYColumn && columns.length > 1) {
          console.warn(`[MarkerInteraction] Y column '${this.currentYColumn}' not found; resetting to '${columns[1] || columns[0]}'`);
        }
        this.currentYColumn = columns[1] || columns[0];
      }

      const config = {
        chartType,
        xColumn: this.currentXColumn,
        yColumn: this.currentYColumn
      };

      if (typeof this.chartManager?.updateMarkerChartWithConfig === 'function') {
        await this.chartManager.updateMarkerChartWithConfig('marker-0', config);
      } else if (typeof this.chartManager?.updateMarkerChartFromControls === 'function') {
        this.chartManager.updateMarkerChartFromControls('marker-0');
      }
    } catch (error) {
      console.error('[MarkerInteraction] Failed to update chart:', error);
    }
  }

  getDatasetForSorting() {
    const blockly = window.Blockly?.CsvImportData;
    const candidates = [
      blockly?.originalData,
      blockly?.data,
      this.chartManager?.getCurrentData?.()
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Apply sorting to current dataset
   */
  async applySorting() {
    try {
      if (!this.currentSortColumn) {
        console.warn('[MarkerInteraction] Cannot apply sorting - no sort column selected');
        return;
      }

      const dataset = this.getDatasetForSorting();
      if (!Array.isArray(dataset) || dataset.length === 0) {
        console.warn('[MarkerInteraction] Cannot apply sorting - no data available');
        return;
      }

      if (!window.AppApi || typeof window.AppApi.processData !== 'function') {
        console.warn('[MarkerInteraction] AppApi.processData unavailable; skipping backend sort');
        return;
      }

      console.log(`[MarkerInteraction] Applying sort: ${this.currentSortColumn} ${this.currentSortOrder}`);

      const operations = [
        {
          type: 'sort',
          params: {
            column: this.currentSortColumn,
            order: this.currentSortOrder
          }
        }
      ];

      const result = await window.AppApi.processData(dataset, operations);

      if (!result || !Array.isArray(result.data)) {
        console.warn('[MarkerInteraction] Sort operation returned invalid payload');
        return;
      }

      if (typeof this.chartManager?.loadCustomData === 'function') {
        const generatedName = `sorted_${this.currentSortColumn}_${this.currentSortOrder}.csv`;
        this.chartManager.loadCustomData(result.data, generatedName);
      }

      if (typeof this.chartManager?.setSortConfig === 'function') {
        this.chartManager.setSortConfig(null, this.currentSortOrder);
      }

      await this.updateChart();

      window.dispatchEvent(new CustomEvent('markerDataSorted', {
        detail: {
          column: this.currentSortColumn,
          order: this.currentSortOrder,
          rowCount: result.data.length
        }
      }));
    } catch (error) {
      console.error('[MarkerInteraction] Failed to apply sorting:', error);
    }
  }

  /**
   * Apply filter to current dataset (placeholder)
   */
  async applyFilter() {
    // To be implemented in Phase 6
    console.log('[MarkerInteraction] applyFilter called (placeholder)');
  }

  getStateSnapshot() {
    const columns = Array.isArray(this.availableColumns) ? [...this.availableColumns] : [];
    return {
      xColumn: this.currentXColumn,
      yColumn: this.currentYColumn,
      sortColumn: this.currentSortColumn,
      sortOrder: this.currentSortOrder,
      chartType: this.currentChartType,
      filterColumn: this.currentFilterColumn,
      filterValue: this.currentFilterValue,
      availableColumns: columns
    };
  }

  /**
   * Debounce helper
   */
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      if (timeout) {
        clearTimeout(timeout);
        this.pendingTimeouts.delete(timeout);
      }

      timeout = setTimeout(() => {
        this.pendingTimeouts.delete(timeout);
        func(...args);
      }, wait);

      this.pendingTimeouts.add(timeout);
    };
  }

  clearPendingDebounces() {
    if (!(this.pendingTimeouts instanceof Set)) {
      return;
    }

    this.pendingTimeouts.forEach((handle) => clearTimeout(handle));
    this.pendingTimeouts.clear();
  }

  /**
   * Dispatch state change event
   */
  dispatchStateChange() {
    window.dispatchEvent(new CustomEvent('markerInteractionStateChange', {
      detail: this.getStateSnapshot()
    }));
  }

  /**
   * Map marker rotation to a value with hysteresis to reduce jitter.
   * @param {number} markerNum - Marker identifier
   * @param {number} degrees - Rotation in degrees (0-360)
   * @param {Array} values - Values to map across sectors
   * @param {number} hysteresis - Boundary buffer in degrees
   * @returns {*|null} Selected value or null when unavailable
   */
  getSectorValueFromRotation(markerNum, degrees, values, hysteresis = 5) {
    if (!Array.isArray(values) || values.length === 0) {
      return null;
    }

    if (values.length === 1) {
      this.lastSectorByMarker[markerNum] = 0;
      return values[0];
    }

    const normalized = ((degrees % 360) + 360) % 360;
    const sectorSize = 360 / values.length;
    const rawIndex = Math.floor(normalized / sectorSize) % values.length;
    const positionInSector = normalized - rawIndex * sectorSize;
    const lastIndex = this.lastSectorByMarker[markerNum];

    if (typeof lastIndex === 'number' && lastIndex !== rawIndex) {
      if (positionInSector < hysteresis) {
        const prevIndex = (rawIndex - 1 + values.length) % values.length;
        if (lastIndex === prevIndex) {
          return values[lastIndex];
        }
      }

      if (positionInSector > sectorSize - hysteresis) {
        const nextIndex = (rawIndex + 1) % values.length;
        if (lastIndex === nextIndex) {
          return values[lastIndex];
        }
      }
    }

    this.lastSectorByMarker[markerNum] = rawIndex;
    return values[rawIndex];
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
