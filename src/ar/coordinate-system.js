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
   * Snap position to grid
   * 
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @param {number} gridSize - Grid size in pixels
   * @returns {Object} Snapped coordinates {x, y}
   */
  snapToGrid(x, y, gridSize = 50) {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }

  /**
   * Calculate distance between two points
   * 
   * @param {Object} point1 - {x, y} coordinates
   * @param {Object} point2 - {x, y} coordinates
   * @returns {number} Distance between points
   */
  calculateDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
    );
  }

  /**
   * Check if two charts are close enough to group
   * 
   * @param {Object} chart1 - First chart object
   * @param {Object} chart2 - Second chart object
   * @param {number} threshold - Distance threshold for grouping
   * @returns {boolean} True if charts can be grouped
   */
  canGroupCharts(chart1, chart2, threshold = 150) {
    const distance = this.calculateDistance(
      { x: chart1.screenX, y: chart1.screenY },
      { x: chart2.screenX, y: chart2.screenY }
    );
    return distance < threshold;
  }
}

// Export for use in other modules
window.CoordinateSystem = CoordinateSystem;