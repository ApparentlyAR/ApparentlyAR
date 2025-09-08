/**
 * Simplified A-Frame Coordinate System Module
 * 
 * Handles direct A-Frame positioning for both marker-based and hand-tracked objects.
 * Uses A-Frame's native 3D coordinate system for all AR objects.
 * 
 * @author ApparentlyAR Team
 * @version 2.0.0
 */

class CoordinateSystem {
  constructor() {
    // A-Frame scene reference
    this.scene = null;
    this.camera = null;
    
    // Track all AR objects in unified A-Frame space
    this.markerPositions = new Map(); // Track marker positions
    this.handCharts = []; // Track hand-placed charts
    this.allObjects = []; // Track all AR objects
  }

  /**
   * Initialize with A-Frame scene reference
   * 
   * @param {HTMLElement} scene - A-Frame scene element
   */
  init(scene) {
    this.scene = scene;
    this.camera = scene.camera;
  }

  /**
   * Convert hand position to A-Frame 3D coordinates
   * Uses A-Frame's camera system for direct 3D positioning
   * 
   * @param {number} screenX - Screen X coordinate (0 to canvas width)
   * @param {number} screenY - Screen Y coordinate (0 to canvas height)
   * @param {number} distance - Distance from camera (default: 2.5)
   * @returns {Object} A-Frame position object {x, y, z}
   */
  handToAframePosition(screenX, screenY, distance = 2.5) {
    const canvas = document.getElementById('hand-overlay');
    if (!canvas || !this.camera) {
      // Fallback positioning
      return { x: 0, y: 0, z: -distance };
    }
    
    // Normalize screen coordinates to [-1, 1] range
    const normalizedX = (screenX / canvas.width) * 2 - 1;
    const normalizedY = -((screenY / canvas.height) * 2 - 1); // Flip Y axis
    
    // Use A-Frame's camera to project into 3D space
    const camera = this.camera;
    const cameraPosition = camera.position;
    
    // Create direction vector from camera through screen point
    const direction = new THREE.Vector3(normalizedX, normalizedY, -1);
    direction.unproject(camera);
    direction.sub(cameraPosition).normalize();
    
    // Calculate position at specified distance from camera
    const worldPosition = cameraPosition.clone().add(direction.multiplyScalar(distance));
    
    return {
      x: worldPosition.x,
      y: worldPosition.y,
      z: worldPosition.z
    };
  }

  /**
   * Find nearest chart to hand position
   * 
   * @param {Object} handPosition - Hand position {x, y, z}
   * @param {Array} handCharts - Array of chart objects
   * @param {number} maxDistance - Maximum distance to consider
   * @returns {Object|null} Nearest chart or null if not found
   */
  findNearestChart(handPosition, handCharts, maxDistance = 1.0) {
    let nearestChart = null;
    let minDistance = maxDistance;
    
    handCharts.forEach(chart => {
      if (chart.aframePosition) {
        const distance = this.calculateDistance(handPosition, chart.aframePosition);
        if (distance < minDistance) {
          minDistance = distance;
          nearestChart = chart;
        }
      }
    });
    
    return nearestChart;
  }

  /**
   * Register marker position in A-Frame space
   * 
   * @param {string} markerId - Marker identifier
   * @param {Object} position - Marker A-Frame position {x, y, z}
   * @param {Object} rotation - Marker rotation {x, y, z}
   */
  registerMarker(markerId, position, rotation) {
    this.markerPositions.set(markerId, {
      position: position,
      rotation: rotation,
      timestamp: Date.now()
    });
    
    // Add to all objects tracking
    this.allObjects.push({
      id: markerId,
      type: 'marker',
      position: position,
      rotation: rotation,
      timestamp: Date.now()
    });
  }

  /**
   * Register hand-placed chart in A-Frame space
   * 
   * @param {string} chartId - Chart identifier
   * @param {Object} position - Chart A-Frame position {x, y, z}
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
    this.allObjects.push(chartObject);
  }

  /**
   * Get all AR objects in A-Frame space
   * 
   * @returns {Array} Array of all AR objects with positions
   */
  getAllObjects() {
    return this.allObjects.filter(obj => {
      // Remove objects older than 5 seconds (markers might be temporarily hidden)
      return Date.now() - obj.timestamp < 5000;
    });
  }

  /**
   * Find nearest marker to hand position
   * 
   * @param {Object} handPosition - Hand A-Frame position {x, y, z}
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
   * Place chart in A-Frame space (marker-relative or free-space)
   * 
   * @param {Object} handPosition - Hand A-Frame position {x, y, z}
   * @param {Object} chartData - Chart data
   * @returns {Object} Chart placement information
   */
  placeChartInAframe(handPosition, chartData) {
    const nearestMarker = this.findNearestMarker(handPosition);
    
    if (nearestMarker) {
      // Place chart relative to marker in A-Frame space
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
      // Place chart at hand position in A-Frame space
      return {
        position: handPosition,
        markerId: null,
        markerDistance: null,
        placementType: 'free-space'
      };
    }
  }

  /**
   * Get spatial analysis of all A-Frame objects
   * 
   * @returns {Object} Spatial analysis
   */
  getSpatialAnalysis() {
    const objects = this.getAllObjects();
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