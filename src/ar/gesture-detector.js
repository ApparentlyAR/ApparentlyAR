/**
 * Gesture Detection Module
 * 
 * Handles MediaPipe hand landmark analysis for gesture recognition
 * including pinch gestures and closed fist detection for AR chart manipulation.
 * 
 */

class GestureDetector {
  constructor() {
    /** @type {number} Pinch detection thresholds */
    this.PINCH_THRESHOLD = 0.05;
    
    /** @type {boolean} Pinch state tracking */
    this.isPinching = false;
    
    /** @type {Object|null} Currently selected chart */
    this.selectedChart = null;
  }

  /**
   * Draw hand landmarks on overlay canvas
   * 
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} landmarks - MediaPipe hand landmarks
   */
  drawHandLandmarks(ctx, landmarks) {
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#FF0000';
    
    // Draw landmarks
    for (let i = 0; i < landmarks.length; i++) {
      const x = (1 - landmarks[i].x) * ctx.canvas.width;
      const y = landmarks[i].y * ctx.canvas.height;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20]
    ];
    
    ctx.beginPath();
    for (const [start, end] of connections) {
      const startX = (1 - landmarks[start].x) * ctx.canvas.width;
      const startY = landmarks[start].y * ctx.canvas.height;
      const endX = (1 - landmarks[end].x) * ctx.canvas.width;
      const endY = landmarks[end].y * ctx.canvas.height;
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    }
    ctx.stroke();
  }

  /**
   * Detect pinch gesture between thumb and index finger
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {string} handedness - Hand label ('Right' or 'Left')
   * @returns {boolean} True if pinching
   */
  isPinchGesture(landmarks, handedness = 'Right') {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2) +
      Math.pow(thumbTip.z - indexTip.z, 2)
    );
    
    return distance < this.PINCH_THRESHOLD;
  }

  /**
   * Handle pinch gesture for chart manipulation
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {Array} handCharts - Array of chart objects
   * @param {CoordinateSystem} coordinateSystem - Coordinate conversion utility
   */
  handlePinchGesture(landmarks, handCharts, coordinateSystem) {
    const palmCenter = landmarks[9];
    const canvas = document.getElementById('hand-overlay');
    
    const x = (1 - palmCenter.x) * canvas.width;
    const y = palmCenter.y * canvas.height; // Remove Y inversion - MediaPipe Y matches screen Y
    
    if (!this.isPinching) {
      // Start pinching - try to select a chart
      const chart = coordinateSystem.findChartAtPosition(x, y, handCharts);
      if (chart) {
        this.selectedChart = chart;
        this.isPinching = true;
        console.log(`Selected chart: ${chart.type} at (${x}, ${y})`);
      }
    } else if (this.selectedChart) {
      // Move the selected chart
      this.moveChart(this.selectedChart, x, y, coordinateSystem);
    }
  }

  /**
   * Move chart to new position
   * 
   * @param {Object} chart - Chart object to move
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @param {CoordinateSystem} coordinateSystem - Coordinate conversion utility
   */
  moveChart(chart, x, y, coordinateSystem) {
    chart.screenX = x;
    chart.screenY = y;
    
    // Convert to world coordinates and update A-Frame entity
    const worldPos = coordinateSystem.screenToWorld(x, y);
    chart.entity.setAttribute('position', worldPos);
    
    // Visual feedback
    chart.entity.setAttribute('scale', '1.2 1.2 1.2');
  }

  /**
   * Release selected chart
   */
  releaseChart() {
    if (this.selectedChart) {
      this.selectedChart.entity.setAttribute('scale', '1 1 1');
      this.selectedChart = null;
    }
    this.isPinching = false;
  }

  /**
   * Detect closed palm (fist) gesture
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {string} handedness - Hand label ('Right' or 'Left')
   * @returns {boolean} True if closed fist detected
   */
  isClosedPalm(landmarks, handedness = 'Right') {
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerMcps = [3, 6, 10, 14, 18];
    
    let extendedFingers = 0;
    
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const mcp = landmarks[fingerMcps[i]];
      
      if (i === 0) {
        // Thumb
        if (handedness === 'Right' ? tip.x > mcp.x : tip.x < mcp.x) {
          extendedFingers++;
        }
      } else {
        // Other fingers
        if (tip.y < mcp.y) {
          extendedFingers++;
        }
      }
    }
    
    return extendedFingers <= 1;
  }

  /**
   * Reset gesture state
   */
  reset() {
    this.isPinching = false;
    this.selectedChart = null;
  }
}

// Export for use in other modules
window.GestureDetector = GestureDetector;