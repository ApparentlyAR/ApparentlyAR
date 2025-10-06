/**
 * Coordinate System Module
 * 
 * Handles conversion between screen coordinates and A-Frame world coordinates
 * for hybrid AR chart placement and manipulation.
 * 
 */

class CoordinateSystem {
  constructor() {
    // Coordinate conversion utilities

    /** @type {number} X-axis calibration offset (-1 to 1) */
    this.calibrationOffsetX = 0;

    /** @type {number} Y-axis calibration offset (-1 to 1) */
    this.calibrationOffsetY = 0;

    // Load calibration from localStorage
    this.loadCalibration();
  }

  /**
   * Convert screen coordinates to A-Frame world coordinates
   * Uses camera projection matrix for accurate mapping
   * 
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {string} World position string "x y z"
   */
  screenToWorld(screenX, screenY) {
    const canvas = document.getElementById('hand-overlay');
    const scene = document.querySelector('a-scene');
    const camera = scene.camera;
    
    if (!camera) {
      // Fallback to simplified conversion 
      const normalizedX = (screenX / canvas.width - 0.5) * 2;
      // Screen Y increases downward, world Y increases upward - need inversion
      const normalizedY = (0.5 - screenY / canvas.height) * 2;
      const worldX = normalizedX * 4;
      const worldY = normalizedY * 3;
      const worldZ = -3;
      return `${worldX} ${worldY} ${worldZ}`;
    }
    
    // Normalize screen coordinates to NDC (-1 to 1)  
    const ndcX = (screenX / canvas.width) * 2 - 1;
    // Screen Y increases downward, NDC Y increases upward
    const ndcY = -((screenY / canvas.height) * 2 - 1);
    
    // Create a ray from camera through screen point
    const vector = new THREE.Vector3(ndcX, ndcY, -1);
    vector.unproject(camera);
    
    // Calculate world position at specific distance from camera
    const direction = vector.sub(camera.position).normalize();
    const distance = 3; // Distance from camera
    const worldPos = camera.position.clone().add(direction.multiplyScalar(distance));
    
    return `${worldPos.x} ${worldPos.y} ${worldPos.z}`;
  }

  /**
   * Find chart at screen position
   *
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @param {Array} handCharts - Array of chart objects
   * @returns {Object|null} Chart object or null if not found
   */
  findChartAtPosition(x, y, handCharts) {
    // Convert screen coordinates to world coordinates
    // This is a simplified implementation
    for (let i = handCharts.length - 1; i >= 0; i--) {
      const chart = handCharts[i];
      // Check if point is within chart bounds (simplified)
      if (Math.abs(chart.screenX - x) < 100 && Math.abs(chart.screenY - y) < 75) {
        return chart;
      }
    }
    return null;
  }

  /**
   * Set calibration offset for finger pointing
   *
   * @param {number} offsetX - X-axis offset (-1 to 1)
   * @param {number} offsetY - Y-axis offset (-1 to 1)
   */
  setCalibration(offsetX, offsetY) {
    this.calibrationOffsetX = Math.max(-1, Math.min(1, offsetX));
    this.calibrationOffsetY = Math.max(-1, Math.min(1, offsetY));
    this.saveCalibration();
    console.log(`Calibration set: X=${this.calibrationOffsetX.toFixed(3)}, Y=${this.calibrationOffsetY.toFixed(3)}`);
  }

  /**
   * Get current calibration offsets
   *
   * @returns {Object} Calibration offsets {x, y}
   */
  getCalibration() {
    return {
      x: this.calibrationOffsetX,
      y: this.calibrationOffsetY
    };
  }

  /**
   * Apply calibration offset to NDC coordinates
   *
   * @param {number} ndcX - NDC X coordinate
   * @param {number} ndcY - NDC Y coordinate
   * @returns {Object} Calibrated NDC coordinates {x, y}
   */
  applyCalibratedOffset(ndcX, ndcY) {
    return {
      x: ndcX + this.calibrationOffsetX * 0.1, // Scale offset for fine control
      y: ndcY + this.calibrationOffsetY * 0.1
    };
  }

  /**
   * Reset calibration to default (0, 0)
   */
  resetCalibration() {
    this.setCalibration(0, 0);
  }

  /**
   * Save calibration to localStorage
   */
  saveCalibration() {
    try {
      localStorage.setItem('ar_calibration_x', this.calibrationOffsetX.toString());
      localStorage.setItem('ar_calibration_y', this.calibrationOffsetY.toString());
    } catch (error) {
      console.warn('Failed to save calibration to localStorage:', error);
    }
  }

  /**
   * Load calibration from localStorage
   */
  loadCalibration() {
    try {
      const savedX = localStorage.getItem('ar_calibration_x');
      const savedY = localStorage.getItem('ar_calibration_y');

      if (savedX !== null) this.calibrationOffsetX = parseFloat(savedX);
      if (savedY !== null) this.calibrationOffsetY = parseFloat(savedY);

      if (savedX !== null || savedY !== null) {
        console.log(`Calibration loaded: X=${this.calibrationOffsetX.toFixed(3)}, Y=${this.calibrationOffsetY.toFixed(3)}`);
      }
    } catch (error) {
      console.warn('Failed to load calibration from localStorage:', error);
    }
  }
}

// Export for use in other modules
window.CoordinateSystem = CoordinateSystem;