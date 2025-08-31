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
}

// Export for use in other modules
window.CoordinateSystem = CoordinateSystem;