/**
 * Unified Coordinate System Module
 * 
 * Handles conversion between screen coordinates and A-Frame world coordinates
 * for hybrid AR chart placement and manipulation. Now supports unified
 * coordinate system for both marker-based and hand-tracked objects.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

class CoordinateSystem {
  constructor() {
    // Coordinate conversion utilities
    this.markerPositions = new Map(); // Track marker world positions
    this.handCharts = []; // Track hand-placed charts
    this.unifiedObjects = []; // Track all AR objects in unified space
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
   * Register marker position for unified coordinate system
   * 
   * @param {string} markerId - Marker identifier
   * @param {Object} position - Marker world position
   * @param {Object} rotation - Marker rotation
   */
  registerMarker(markerId, position, rotation) {
    this.markerPositions.set(markerId, {
      position: position,
      rotation: rotation,
      timestamp: Date.now()
    });
    
    // Add to unified objects
    this.unifiedObjects.push({
      id: markerId,
      type: 'marker',
      position: position,
      rotation: rotation,
      timestamp: Date.now()
    });
  }

  /**
   * Register hand-placed chart for unified coordinate system
   * 
   * @param {string} chartId - Chart identifier
   * @param {Object} position - Chart world position
   * @param {Object} chartData - Chart data
   */
  registerHandChart(chartId, position, chartData) {
    const chartObject = {
      id: chartId,
      type: 'hand-chart',
      position: position,
      chartData: chartData,
      timestamp: Date.now()
    };
    
    this.handCharts.push(chartObject);
    this.unifiedObjects.push(chartObject);
  }

  /**
   * Get unified object positions for interaction
   * 
   * @returns {Array} Array of all AR objects with positions
   */
  getUnifiedObjects() {
    return this.unifiedObjects.filter(obj => {
      // Remove objects older than 5 seconds (markers might be temporarily hidden)
      return Date.now() - obj.timestamp < 5000;
    });
  }

  /**
   * Find nearest marker to hand position
   * 
   * @param {Object} handPosition - Hand world position
   * @param {number} maxDistance - Maximum distance to consider
   * @returns {Object|null} Nearest marker or null
   */
  findNearestMarker(handPosition, maxDistance = 2.0) {
    let nearestMarker = null;
    let minDistance = maxDistance;
    
    this.markerPositions.forEach((marker, markerId) => {
      const distance = this.calculateDistance(handPosition, marker.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestMarker = {
          id: markerId,
          position: marker.position,
          rotation: marker.rotation,
          distance: distance
        };
      }
    });
    
    return nearestMarker;
  }

  /**
   * Calculate distance between two 3D points
   * 
   * @param {Object} pos1 - First position
   * @param {Object} pos2 - Second position
   * @returns {number} Distance
   */
  calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Place chart relative to nearest marker
   * 
   * @param {Object} handPosition - Hand world position
   * @param {Object} chartData - Chart data
   * @returns {Object} Chart placement information
   */
  placeChartRelativeToMarker(handPosition, chartData) {
    const nearestMarker = this.findNearestMarker(handPosition);
    
    if (nearestMarker) {
      // Place chart relative to marker
      const relativePosition = {
        x: nearestMarker.position.x + (Math.random() - 0.5) * 1.5,
        y: nearestMarker.position.y + 1.0,
        z: nearestMarker.position.z + (Math.random() - 0.5) * 1.5
      };
      
      return {
        position: relativePosition,
        markerId: nearestMarker.id,
        markerDistance: nearestMarker.distance,
        placementType: 'marker-relative'
      };
    } else {
      // Place chart in free space
      return {
        position: handPosition,
        markerId: null,
        markerDistance: null,
        placementType: 'free-space'
      };
    }
  }

  /**
   * Get spatial relationships between objects
   * 
   * @returns {Object} Spatial analysis
   */
  getSpatialAnalysis() {
    const objects = this.getUnifiedObjects();
    const markers = objects.filter(obj => obj.type === 'marker');
    const charts = objects.filter(obj => obj.type === 'hand-chart');
    
    return {
      totalObjects: objects.length,
      markerCount: markers.length,
      chartCount: charts.length,
      averageDistance: this.calculateAverageDistance(objects),
      spatialDensity: this.calculateSpatialDensity(objects)
    };
  }

  /**
   * Calculate average distance between all objects
   * 
   * @param {Array} objects - Array of objects
   * @returns {number} Average distance
   */
  calculateAverageDistance(objects) {
    if (objects.length < 2) return 0;
    
    let totalDistance = 0;
    let pairCount = 0;
    
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        totalDistance += this.calculateDistance(objects[i].position, objects[j].position);
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalDistance / pairCount : 0;
  }

  /**
   * Calculate spatial density of objects
   * 
   * @param {Array} objects - Array of objects
   * @returns {number} Objects per cubic unit
   */
  calculateSpatialDensity(objects) {
    if (objects.length === 0) return 0;
    
    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    objects.forEach(obj => {
      const pos = obj.position;
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
      minZ = Math.min(minZ, pos.z);
      maxZ = Math.max(maxZ, pos.z);
    });
    
    const volume = (maxX - minX) * (maxY - minY) * (maxZ - minZ);
    return volume > 0 ? objects.length / volume : 0;
  }
}

// Export for use in other modules
window.CoordinateSystem = CoordinateSystem;