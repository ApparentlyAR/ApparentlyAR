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
    if (!landmarks || landmarks.length === 0) return;
    
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#FF0000';
    
    // Draw landmarks
    for (let i = 0; i < landmarks.length; i++) {
      if (landmarks[i] && typeof landmarks[i].x === 'number' && typeof landmarks[i].y === 'number') {
        const x = (1 - landmarks[i].x) * ctx.canvas.width;
        const y = landmarks[i].y * ctx.canvas.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
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
      if (landmarks[start] && landmarks[end] && 
          landmarks[start].x !== undefined && landmarks[start].y !== undefined &&
          landmarks[end].x !== undefined && landmarks[end].y !== undefined) {
        const startX = (1 - landmarks[start].x) * ctx.canvas.width;
        const startY = landmarks[start].y * ctx.canvas.height;
        const endX = (1 - landmarks[end].x) * ctx.canvas.width;
        const endY = landmarks[end].y * ctx.canvas.height;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
      }
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
    if (!landmarks || landmarks.length < 21) return false;
    
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    
    if (!thumbTip || !indexTip || thumbTip.x === undefined || thumbTip.y === undefined || thumbTip.z === undefined ||
        indexTip.x === undefined || indexTip.y === undefined || indexTip.z === undefined) return false;
    
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
    if (chart.entity && chart.entity.setAttribute) {
      chart.entity.setAttribute('position', worldPos);
      
      // Visual feedback
      chart.entity.setAttribute('scale', '1.2 1.2 1.2');
    }
  }

  /**
   * Release selected chart
   */
  releaseChart() {
    if (this.selectedChart && this.selectedChart.entity && this.selectedChart.entity.setAttribute) {
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
    if (!landmarks || landmarks.length < 21) return false;
    
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerMcps = [3, 6, 10, 14, 18];
    
    let extendedFingers = 0;
    
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const mcp = landmarks[fingerMcps[i]];
      
      if (!tip || !mcp || tip.x === undefined || tip.y === undefined || 
          mcp.x === undefined || mcp.y === undefined) continue;
      
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
   * Detect peace sign gesture (index and middle finger extended)
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {string} handedness - Hand label ('Right' or 'Left')
   * @returns {boolean} True if peace sign detected
   */
  isPeaceGesture(landmarks, handedness = 'Right') {
    if (!landmarks || landmarks.length < 21) return false;
    
    const indexTip = landmarks[8];
    const indexMcp = landmarks[6];
    const middleTip = landmarks[12];
    const middleMcp = landmarks[10];
    const ringTip = landmarks[16];
    const ringMcp = landmarks[14];
    const thumbTip = landmarks[4];
    const thumbMcp = landmarks[3];
    
    // Check if all required landmarks exist
    if (!indexTip || !indexMcp || !middleTip || !middleMcp || 
        !ringTip || !ringMcp || !thumbTip || !thumbMcp) return false;
    
    // Index and middle fingers should be extended
    const indexExtended = indexTip.y < indexMcp.y;
    const middleExtended = middleTip.y < middleMcp.y;
    
    // Ring finger should be folded
    const ringFolded = ringTip.y > ringMcp.y;
    
    // Thumb should be folded
    const thumbFolded = handedness === 'Right' ? thumbTip.x > thumbMcp.x : thumbTip.x < thumbMcp.x;
    
    return indexExtended && middleExtended && ringFolded && thumbFolded;
  }

  /**
   * Detect thumbs up gesture
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {string} handedness - Hand label ('Right' or 'Left')
   * @returns {boolean} True if thumbs up detected
   */
  isThumbsUpGesture(landmarks, handedness = 'Right') {
    const thumbTip = landmarks[4];
    const thumbMcp = landmarks[3];
    const indexTip = landmarks[8];
    const indexMcp = landmarks[6];
    
    // Thumb should be extended upward
    const thumbExtended = thumbTip.y < thumbMcp.y;
    
    // Other fingers should be folded
    const indexFolded = indexTip.y > indexMcp.y;
    
    return thumbExtended && indexFolded;
  }

  /**
   * Detect thumbs down gesture
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {string} handedness - Hand label ('Right' or 'Left')
   * @returns {boolean} True if thumbs down detected
   */
  isThumbsDownGesture(landmarks, handedness = 'Right') {
    const thumbTip = landmarks[4];
    const thumbMcp = landmarks[3];
    const indexTip = landmarks[8];
    const indexMcp = landmarks[6];
    
    // Thumb should be extended downward
    const thumbExtended = thumbTip.y > thumbMcp.y;
    
    // Other fingers should be folded
    const indexFolded = indexTip.y > indexMcp.y;
    
    return thumbExtended && indexFolded;
  }

  /**
   * Handle peace gesture for chart rotation
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {Array} handCharts - Array of chart objects
   * @param {CoordinateSystem} coordinateSystem - Coordinate conversion utility
   */
  handlePeaceGesture(landmarks, handCharts, coordinateSystem) {
    const palmCenter = landmarks[9];
    const canvas = document.getElementById('hand-overlay');
    
    const x = (1 - palmCenter.x) * canvas.width;
    const y = palmCenter.y * canvas.height;
    
    const chart = coordinateSystem.findChartAtPosition(x, y, handCharts);
    if (chart) {
      this.rotateChart(chart);
    }
  }

  /**
   * Handle thumbs up/down gestures for chart scaling
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {Array} handCharts - Array of chart objects
   * @param {CoordinateSystem} coordinateSystem - Coordinate conversion utility
   * @param {boolean} isThumbsUp - True for thumbs up (scale up), false for thumbs down (scale down)
   */
  handleScaleGesture(landmarks, handCharts, coordinateSystem, isThumbsUp) {
    const palmCenter = landmarks[9];
    const canvas = document.getElementById('hand-overlay');
    
    const x = (1 - palmCenter.x) * canvas.width;
    const y = palmCenter.y * canvas.height;
    
    const chart = coordinateSystem.findChartAtPosition(x, y, handCharts);
    if (chart) {
      this.scaleChart(chart, isThumbsUp ? 1.1 : 0.9);
    }
  }

  /**
   * Rotate chart by 15 degrees
   * 
   * @param {Object} chart - Chart object to rotate
   */
  rotateChart(chart) {
    const currentRotation = chart.rotation || 0;
    chart.rotation = (currentRotation + 15) % 360;
    if (chart.entity && chart.entity.setAttribute) {
      chart.entity.setAttribute('rotation', `0 0 ${chart.rotation}`);
      
      // Visual feedback
      chart.entity.setAttribute('animation', {
        property: 'rotation',
        from: `0 0 ${currentRotation}`,
        to: `0 0 ${chart.rotation}`,
        dur: 200
      });
    }
  }

  /**
   * Scale chart by given factor
   * 
   * @param {Object} chart - Chart object to scale
   * @param {number} scaleFactor - Scale multiplier
   */
  scaleChart(chart, scaleFactor) {
    const currentScale = chart.scale || 1;
    chart.scale = Math.max(0.5, Math.min(3, currentScale * scaleFactor));
    if (chart.entity && chart.entity.setAttribute) {
      chart.entity.setAttribute('scale', `${chart.scale} ${chart.scale} ${chart.scale}`);
      
      // Visual feedback with smooth animation
      chart.entity.setAttribute('animation', {
        property: 'scale',
        from: `${currentScale} ${currentScale} ${currentScale}`,
        to: `${chart.scale} ${chart.scale} ${chart.scale}`,
        dur: 150
      });
    }
  }

  /**
   * Detect point gesture (index finger extended, others folded)
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {string} handedness - Hand label ('Right' or 'Left')
   * @returns {boolean} True if pointing gesture detected
   */
  isPointGesture(landmarks, handedness = 'Right') {
    if (!landmarks || landmarks.length < 21) return false;
    
    const indexTip = landmarks[8];
    const indexMcp = landmarks[6];
    const middleTip = landmarks[12];
    const middleMcp = landmarks[10];
    const ringTip = landmarks[16];
    const ringMcp = landmarks[14];
    const pinkyTip = landmarks[20];
    const pinkyMcp = landmarks[18];
    
    // Check if all required landmarks exist
    if (!indexTip || !indexMcp || !middleTip || !middleMcp || 
        !ringTip || !ringMcp || !pinkyTip || !pinkyMcp) return false;
    
    // Index finger should be extended
    const indexExtended = indexTip.y < indexMcp.y;
    
    // Other fingers should be folded
    const middleFolded = middleTip.y > middleMcp.y;
    const ringFolded = ringTip.y > ringMcp.y;
    const pinkyFolded = pinkyTip.y > pinkyMcp.y;
    
    return indexExtended && middleFolded && ringFolded && pinkyFolded;
  }

  /**
   * Handle point gesture for chart duplication
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {Array} handCharts - Array of chart objects
   * @param {CoordinateSystem} coordinateSystem - Coordinate conversion utility
   * @param {ChartManager} chartManager - Chart manager instance
   */
  handlePointGesture(landmarks, handCharts, coordinateSystem, chartManager) {
    const palmCenter = landmarks[9];
    const canvas = document.getElementById('hand-overlay');
    
    const x = (1 - palmCenter.x) * canvas.width;
    const y = palmCenter.y * canvas.height;
    
    const chart = coordinateSystem.findChartAtPosition(x, y, handCharts);
    if (chart && !chart.isDuplicated) {
      this.duplicateChart(chart, chartManager, coordinateSystem);
      chart.isDuplicated = true; // Prevent multiple duplications
      
      // Reset duplication flag after cooldown
      setTimeout(() => {
        chart.isDuplicated = false;
      }, 2000);
    }
  }

  /**
   * Duplicate chart at offset position
   * 
   * @param {Object} originalChart - Chart to duplicate
   * @param {ChartManager} chartManager - Chart manager instance
   * @param {CoordinateSystem} coordinateSystem - Coordinate system
   */
  duplicateChart(originalChart, chartManager, coordinateSystem) {
    const offsetX = originalChart.screenX + 120;
    const offsetY = originalChart.screenY + 80;
    
    // Snap to grid if enabled
    const snapped = coordinateSystem.snapToGrid(offsetX, offsetY);
    
    // Create canvas for duplicated chart
    const canvas = document.createElement('canvas');
    const chartId = 'hand-chart-' + Date.now();
    canvas.width = 400;
    canvas.height = 300;
    canvas.id = chartId + '-canvas';
    
    // Generate chart with same configuration
    const chart = chartManager.generateChart(
      canvas, 
      originalChart.type, 
      chartManager.sampleData[originalChart.dataset]
    );
    
    // Add canvas to assets
    const assets = document.querySelector('a-assets');
    if (assets) {
      assets.appendChild(canvas);
    }
    
    // Create A-Frame entity - ensure A-Frame is loaded
    const entity = document.createElement('a-plane');
    if (entity.setAttribute) {
      entity.setAttribute('id', chartId);
      entity.setAttribute('width', '2');
      entity.setAttribute('height', '1.5');
      entity.setAttribute('material', `src: #${canvas.id}; transparent: true`);
    } else {
      // Fallback for test environment
      entity.id = chartId;
      entity.width = '2';
      entity.height = '1.5';
      entity.material = `src: #${canvas.id}; transparent: true`;
    }
    
    // Set position with grid snapping
    const worldPos = coordinateSystem.screenToWorld(snapped.x, snapped.y);
    if (entity.setAttribute) {
      entity.setAttribute('position', worldPos);
      
      // Add visual indicator for duplicated chart
      entity.setAttribute('animation__spawn', {
        property: 'scale',
        from: '0.1 0.1 0.1',
        to: '1 1 1',
        dur: 300
      });
    }
    
    // Add to scene
    const handChartsContainer = document.getElementById('hand-charts');
    if (handChartsContainer) {
      handChartsContainer.appendChild(entity);
    }
    
    // Store chart data
    const chartObj = {
      id: chartId,
      entity: entity,
      chart: chart,
      canvas: canvas,
      type: originalChart.type,
      dataset: originalChart.dataset,
      screenX: snapped.x,
      screenY: snapped.y,
      scale: originalChart.scale || 1,
      rotation: originalChart.rotation || 0,
      isDuplicate: true
    };
    
    chartManager.handCharts.push(chartObj);
    chartManager.updateChartList();
  }

  /**
   * Detect open hand gesture (all fingers extended)
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {string} handedness - Hand label ('Right' or 'Left')
   * @returns {boolean} True if open hand detected
   */
  isOpenHandGesture(landmarks, handedness = 'Right') {
    if (!landmarks || landmarks.length < 21) return false;
    
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerMcps = [3, 6, 10, 14, 18];
    
    let extendedFingers = 0;
    
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const mcp = landmarks[fingerMcps[i]];
      
      if (!tip || !mcp || tip.x === undefined || tip.y === undefined || 
          mcp.x === undefined || mcp.y === undefined) continue;
      
      if (i === 0) {
        // Thumb
        if (handedness === 'Right' ? tip.x < mcp.x : tip.x > mcp.x) {
          extendedFingers++;
        }
      } else {
        // Other fingers
        if (tip.y < mcp.y) {
          extendedFingers++;
        }
      }
    }
    
    return extendedFingers >= 4; // At least 4 fingers extended
  }

  /**
   * Enhanced chart movement with grid snapping
   * 
   * @param {Object} chart - Chart object to move
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @param {CoordinateSystem} coordinateSystem - Coordinate conversion utility
   * @param {boolean} enableSnapping - Whether to snap to grid
   */
  moveChartWithSnapping(chart, x, y, coordinateSystem, enableSnapping = true) {
    let finalX = x;
    let finalY = y;
    
    if (enableSnapping) {
      const snapped = coordinateSystem.snapToGrid(x, y);
      finalX = snapped.x;
      finalY = snapped.y;
    }
    
    chart.screenX = finalX;
    chart.screenY = finalY;
    
    // Convert to world coordinates and update A-Frame entity
    const worldPos = coordinateSystem.screenToWorld(finalX, finalY);
    if (chart.entity && chart.entity.setAttribute) {
      chart.entity.setAttribute('position', worldPos);
      
      // Visual feedback with grid snap indicator
      chart.entity.setAttribute('scale', '1.2 1.2 1.2');
      
      if (enableSnapping) {
        // Brief scale animation to indicate snap
        chart.entity.setAttribute('animation__snap', {
          property: 'scale',
          from: '1.2 1.2 1.2',
          to: '1.25 1.25 1.25',
          dur: 100,
          direction: 'alternate'
        });
      }
    }
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