/**
 * Hand Tracking Module
 * 
 * Handles MediaPipe hands integration for real-time hand landmark detection
 * and processing in the hybrid AR environment.
 * 
 */

class HandTracking {
  constructor(gestureDetector, chartManager, updateStatus, coordinateSystem) {
    /** @type {MediaPipe.Hands} MediaPipe Hands instance */
    this.hands = null;

    /** @type {boolean} Hand detection active state */
    this.handsActive = false;

    /** @type {boolean} Processing gate for MediaPipe */
    this.processingHands = false;

    /** @type {number} Frame skip for performance (process every Nth frame) */
    this.frameSkipCounter = 0;
    this.FRAME_SKIP_RATE = 2; // Process every 2nd frame

    /** @type {number} Performance monitoring */
    this.lastProcessTime = 0;

    /** @type {GestureDetector} Gesture detection instance */
    this.gestureDetector = gestureDetector;

    /** @type {ChartManager} Chart management instance */
    this.chartManager = chartManager;

    /** @type {Function} Status update callback */
    this.updateStatus = updateStatus;

    /** @type {CoordinateSystem} Coordinate system for calibration */
    this.coordinateSystem = coordinateSystem;

    /** @type {number} Cached video dimensions for validation */
    this.videoWidth = 0;
    this.videoHeight = 0;

    /** @type {boolean} Debug visualization enabled */
    this.debugVisualization = true;

    /** @type {Object|null} Last raycast hit for debugging */
    this.lastRaycastHit = null;
    // Tooltip locking removed per UI request (no pinch behavior)
  }

  /**
   * Initialize MediaPipe Hands for hand landmark detection
   */
  async initialize() {
    try {
      this.hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
      });

      this.hands.setOptions({
        selfieMode: true,
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.hands.onResults(this.onHandResults.bind(this));
      this.updateStatus('Hand tracking initialized', 'ready');
      
    } catch (error) {
      console.error('Failed to initialize hands:', error);
      this.updateStatus('Hand tracking initialization failed', 'error');
    }
  }

  /**
   * Wait for AR.js video element to be available
   * 
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<HTMLVideoElement>} Video element
   */
  waitForVideo(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkVideo = () => {
        const video = document.querySelector('video');
        if (video && video.videoWidth > 0) {
          resolve(video);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for AR.js video'));
        } else {
          setTimeout(checkVideo, 100);
        }
      };
      
      checkVideo();
    });
  }

  /**
   * Setup canvas overlay for hand landmarks
   */
  setupHandOverlay() {
    const canvas = document.getElementById('hand-overlay');
    const video = document.querySelector('video');

    if (video && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Store dimensions for coordinate validation
      this.videoWidth = video.videoWidth;
      this.videoHeight = video.videoHeight;

      console.log(`Canvas synced to video: ${canvas.width}x${canvas.height}`);
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.warn('Video not ready, using window dimensions');
    }
  }

  /**
   * Start hand tracking with shared video feed
   */
  async start() {
    try {
      // Wait for AR.js to initialize and create video element
      const video = await this.waitForVideo();
      
      this.setupHandOverlay();
      window.addEventListener('resize', this.setupHandOverlay.bind(this));

      // Use requestAnimationFrame for processing instead of Camera class
      // to avoid conflicts with AR.js video handling
      const processFrame = async () => {
        if (this.handsActive && !this.processingHands && video.videoWidth > 0) {
          // Check if video dimensions changed and re-sync canvas
          if (this.videoWidth !== video.videoWidth || this.videoHeight !== video.videoHeight) {
            console.log('Video dimensions changed, re-syncing canvas');
            this.setupHandOverlay();
          }

          // Frame skipping for performance
          this.frameSkipCounter++;
          if (this.frameSkipCounter % this.FRAME_SKIP_RATE === 0) {
            this.processingHands = true;
            const startTime = performance.now();

            try {
              await this.hands.send({ image: video });
              this.lastProcessTime = performance.now() - startTime;

              // Update performance stats
              document.getElementById('process-time').textContent = this.lastProcessTime.toFixed(1);
              document.getElementById('video-resolution').textContent = `${video.videoWidth}x${video.videoHeight}`;

              // Update debug stats
              this.updateDebugStats();
            } catch (e) {
              console.warn('MediaPipe processing error:', e);
              this.updateStatus('Hand tracking error - retrying...', 'error');
            }

            this.processingHands = false;
          }
        }

        if (this.handsActive) {
          requestAnimationFrame(processFrame);
        }
      };

      this.handsActive = true;
      processFrame();
      
      document.getElementById('start-hands').disabled = true;
      document.getElementById('stop-hands').disabled = false;
      
      this.updateStatus('Hand tracking active - point at chart for tooltips; pinch to lock', 'detecting');
      
    } catch (error) {
      console.error('Failed to start hand tracking:', error);
      this.updateStatus('Failed to start hand tracking: ' + error.message, 'error');
    }
  }

  /**
   * Stop hand tracking
   */
  stop() {
    this.handsActive = false;
    
    document.getElementById('start-hands').disabled = false;
    document.getElementById('stop-hands').disabled = true;
    
    // Clear hand overlay
    const canvas = document.getElementById('hand-overlay');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset gesture state
    this.gestureDetector.reset();
    
    this.updateStatus('Hand tracking stopped', 'ready');
  }

  /**
   * Process hand detection results
   * 
   * @param {Object} results - MediaPipe results
   */
  onHandResults(results) {
    const canvas = document.getElementById('hand-overlay');
    const ctx = canvas.getContext('2d');
    
    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let handDetected = false;
    
    if (results.multiHandLandmarks && results.multiHandedness) {
      // Use fingertip as pointer for marker chart tooltips
      const sceneEl = document.querySelector('a-scene');
      const camera = sceneEl && sceneEl.camera;
      const markerPlane = document.querySelector('#marker-0 [data-marker-chart]');
      const mesh = markerPlane && markerPlane.getObject3D && markerPlane.getObject3D('mesh');

      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        // Draw landmarks for visual feedback
        this.gestureDetector.drawHandLandmarks(ctx, landmarks);
        handDetected = true;

        const THREE_NS = (typeof THREE !== 'undefined') ? THREE : (window.AFRAME && window.AFRAME.THREE);
        if (camera && mesh && THREE_NS) {
          // Index finger tip as pointer (landmark 8)
          const tip = landmarks[8];

          // IMPROVED: Direct conversion from MediaPipe normalized coords to NDC
          // MediaPipe: x,y in [0,1], origin top-left
          // NDC: x,y in [-1,1], origin center
          // Selfie mode is already handled by MediaPipe, so we mirror X
          let ndcX = (1 - tip.x) * 2 - 1;  // Mirror for selfie mode: (1-x) maps [0,1] to [1,0], then to [1,-1]
          let ndcY = -(tip.y * 2 - 1);     // Flip Y: screen Y down = NDC Y up

          // Apply calibration offset if coordinate system is available
          if (this.coordinateSystem) {
            const calibrated = this.coordinateSystem.applyCalibratedOffset(ndcX, ndcY);
            ndcX = calibrated.x;
            ndcY = calibrated.y;
          }

          const ndc = new THREE_NS.Vector2(ndcX, ndcY);

          // Configure raycaster with appropriate settings
          const raycaster = new THREE_NS.Raycaster();
          raycaster.near = 0.1;
          raycaster.far = 100;
          raycaster.params.Line = { threshold: 0.1 };
          raycaster.setFromCamera(ndc, camera);

          const hits = raycaster.intersectObject(mesh, true);
          const uv = hits && hits[0] && hits[0].uv ? hits[0].uv : null;

          // Store hit info for debugging
          this.lastRaycastHit = {
            fingerPos: { x: tip.x, y: tip.y },
            ndc: { x: ndcX, y: ndcY },
            hasHit: !!uv,
            uv: uv ? { x: uv.x, y: uv.y } : null,
            distance: hits && hits[0] ? hits[0].distance : null
          };

          // Draw debug visualization
          if (this.debugVisualization) {
            this.drawDebugVisualization(ctx, tip, canvas, uv, 'marker-0', camera, markerPlane);
          }

          this.chartManager.showMarkerTooltipAtUV('marker-0', uv);
        }
      }
    } else {
      // Hide tooltip if no hands
      this.chartManager.showMarkerTooltipAtUV('marker-0', null);
    }
  }

  /**
   * Project 3D chart plane to 2D screen coordinates
   *
   * @param {THREE.Camera} camera - A-Frame camera
   * @param {Element} planeEntity - Chart plane entity
   * @param {HTMLCanvasElement} canvas - Overlay canvas
   * @returns {Array|null} Array of 4 screen corners [{x, y, visible}, ...] or null
   */
  projectPlaneToScreen(camera, planeEntity, canvas) {
    const THREE_NS = (typeof THREE !== 'undefined') ? THREE : (window.AFRAME && window.AFRAME.THREE);
    if (!THREE_NS || !planeEntity || !planeEntity.object3D) return null;

    const planeObject3D = planeEntity.object3D;

    // Get plane dimensions (4x3 units from chart-manager.js:110-111)
    const width = 4;
    const height = 3;

    // Define 4 corners in local space (centered at origin)
    const corners = [
      new THREE_NS.Vector3(-width/2, -height/2, 0),  // Bottom-left
      new THREE_NS.Vector3(width/2, -height/2, 0),   // Bottom-right
      new THREE_NS.Vector3(width/2, height/2, 0),    // Top-right
      new THREE_NS.Vector3(-width/2, height/2, 0)    // Top-left
    ];

    // Project each corner to screen space
    return corners.map(corner => {
      const worldPos = corner.clone();
      planeObject3D.localToWorld(worldPos);

      const screenPos = worldPos.project(camera);

      // Convert NDC (-1 to 1) to canvas pixels
      const x = (screenPos.x + 1) / 2 * canvas.width;
      const y = (1 - screenPos.y) / 2 * canvas.height;

      return { x, y, visible: screenPos.z < 1 }; // z < 1 means in front of camera
    });
  }

  /**
   * Draw debug visualization for pointing accuracy
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} tip - Finger tip landmark
   * @param {HTMLCanvasElement} canvas - Overlay canvas
   * @param {Object|null} uv - UV coordinates if hit
   * @param {string} markerId - Marker ID to get chart area from
   * @param {THREE.Camera} camera - A-Frame camera for projection
   * @param {Element} planeEntity - Chart plane entity
   */
  drawDebugVisualization(ctx, tip, canvas, uv, markerId, camera, planeEntity) {
    // Calculate screen position of finger tip
    const screenX = (1 - tip.x) * canvas.width;
    const screenY = tip.y * canvas.height;

    // 1. Draw projected chart plane boundary (yellow dashed)
    const projectedCorners = this.projectPlaneToScreen(camera, planeEntity, canvas);
    if (projectedCorners && projectedCorners[0].visible) {
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]); // Dashed line
      ctx.beginPath();
      ctx.moveTo(projectedCorners[0].x, projectedCorners[0].y);
      ctx.lineTo(projectedCorners[1].x, projectedCorners[1].y);
      ctx.lineTo(projectedCorners[2].x, projectedCorners[2].y);
      ctx.lineTo(projectedCorners[3].x, projectedCorners[3].y);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // Label corners with UV coordinates
      ctx.fillStyle = '#FFFF00';
      ctx.font = '9px monospace';
      ctx.fillText('UV(0,1)', projectedCorners[0].x - 35, projectedCorners[0].y + 15);
      ctx.fillText('UV(1,1)', projectedCorners[1].x + 5, projectedCorners[1].y + 15);
      ctx.fillText('UV(1,0)', projectedCorners[2].x + 5, projectedCorners[2].y - 5);
      ctx.fillText('UV(0,0)', projectedCorners[3].x - 35, projectedCorners[3].y - 5);

      // Label plane boundary
      const centerX = (projectedCorners[0].x + projectedCorners[2].x) / 2;
      const topY = Math.min(projectedCorners[2].y, projectedCorners[3].y) - 15;
      ctx.fillText('Canvas 400x300', centerX - 50, topY);
    }

    // 2. Draw chart area boundary (cyan solid) - nested inside plane
    const chartEntry = this.chartManager?.markerCharts?.[markerId];
    if (chartEntry && chartEntry.chart && chartEntry.chart.chartArea && projectedCorners) {
      const chartArea = chartEntry.chart.chartArea;
      const chartCanvas = chartEntry.canvas;

      // Calculate chart area as percentage of full canvas
      const leftPercent = chartArea.left / chartCanvas.width;
      const rightPercent = chartArea.right / chartCanvas.width;
      const topPercent = chartArea.top / chartCanvas.height;
      const bottomPercent = chartArea.bottom / chartCanvas.height;

      // Map percentages to projected plane space
      const bl = projectedCorners[0]; // bottom-left
      const br = projectedCorners[1]; // bottom-right
      const tr = projectedCorners[2]; // top-right
      const tl = projectedCorners[3]; // top-left

      // Interpolate chart area corners within the projected plane
      const chartCorners = [
        { // Bottom-left of chart area
          x: bl.x + (br.x - bl.x) * leftPercent,
          y: bl.y + (tl.y - bl.y) * (1 - bottomPercent)
        },
        { // Bottom-right of chart area
          x: bl.x + (br.x - bl.x) * rightPercent,
          y: br.y + (tr.y - br.y) * (1 - bottomPercent)
        },
        { // Top-right of chart area
          x: tl.x + (tr.x - tl.x) * rightPercent,
          y: tl.y + (bl.y - tl.y) * topPercent
        },
        { // Top-left of chart area
          x: tl.x + (tr.x - tl.x) * leftPercent,
          y: tl.y + (bl.y - tl.y) * topPercent
        }
      ];

      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(chartCorners[0].x, chartCorners[0].y);
      ctx.lineTo(chartCorners[1].x, chartCorners[1].y);
      ctx.lineTo(chartCorners[2].x, chartCorners[2].y);
      ctx.lineTo(chartCorners[3].x, chartCorners[3].y);
      ctx.closePath();
      ctx.stroke();

      // Label chart area
      ctx.fillStyle = '#00FFFF';
      ctx.font = '9px monospace';
      const chartWidth = Math.round(chartArea.right - chartArea.left);
      const chartHeight = Math.round(chartArea.bottom - chartArea.top);
      const chartCenterX = (chartCorners[0].x + chartCorners[2].x) / 2;
      const chartTopY = Math.min(chartCorners[2].y, chartCorners[3].y) - 5;
      ctx.fillText(`Chart Area ${chartWidth}x${chartHeight}px`, chartCenterX - 65, chartTopY);
    }

    // 3. Draw UV hit point (if hit detected)
    if (uv && projectedCorners) {
      const bl = projectedCorners[0];
      const br = projectedCorners[1];
      const tr = projectedCorners[2];
      const tl = projectedCorners[3];

      // Bilinear interpolation to get hit point position
      const bottom = { x: bl.x + (br.x - bl.x) * uv.x, y: bl.y + (br.y - bl.y) * uv.x };
      const top = { x: tl.x + (tr.x - tl.x) * uv.x, y: tl.y + (tr.y - tl.y) * uv.x };
      const hitX = bottom.x + (top.x - bottom.x) * (1 - uv.y);
      const hitY = bottom.y + (top.y - bottom.y) * (1 - uv.y);

      // Draw hit point
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.arc(hitX, hitY, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw outline
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hitX, hitY, 8, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw line from finger to hit point
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(hitX, hitY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Show distance
      const distance = Math.sqrt(Math.pow(hitX - screenX, 2) + Math.pow(hitY - screenY, 2));
      ctx.fillStyle = '#00FF00';
      ctx.font = '9px monospace';
      ctx.fillText(`${Math.round(distance)}px`, (screenX + hitX) / 2, (screenY + hitY) / 2 - 5);
    }

    // 4. Draw crosshair at finger tip
    ctx.strokeStyle = uv ? '#00FF00' : '#FF0000'; // Green if hit, red if miss
    ctx.lineWidth = 2;

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(screenX - 15, screenY);
    ctx.lineTo(screenX + 15, screenY);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - 15);
    ctx.lineTo(screenX, screenY + 15);
    ctx.stroke();

    // Circle around crosshair
    ctx.beginPath();
    ctx.arc(screenX, screenY, 10, 0, 2 * Math.PI);
    ctx.stroke();

    // Display debug info near finger tip
    ctx.fillStyle = uv ? '#00FF00' : '#FF0000';
    ctx.font = '11px monospace';
    const debugText = uv
      ? `UV: ${uv.x.toFixed(2)}, ${uv.y.toFixed(2)}`
      : 'No Hit';
    ctx.fillText(debugText, screenX + 20, screenY - 10);
    ctx.fillText('Finger', screenX + 20, screenY + 5);
  }

  /**
   * Update debug stats display
   */
  updateDebugStats() {
    const debugStatsEl = document.getElementById('raycast-debug');
    if (!debugStatsEl || !this.lastRaycastHit) return;

    const hit = this.lastRaycastHit;

    // Get chart area info if available
    let chartAreaInfo = '';
    if (this.chartManager) {
      const chartEntry = this.chartManager.markerCharts?.['marker-0'];
      if (chartEntry && chartEntry.chart && chartEntry.chart.chartArea) {
        const ca = chartEntry.chart.chartArea;
        const chartWidth = Math.round(ca.right - ca.left);
        const chartHeight = Math.round(ca.bottom - ca.top);
        chartAreaInfo = `<div style="color: #FFFF00;">Chart: ${chartWidth}x${chartHeight}px</div>`;
      }
    }

    debugStatsEl.innerHTML = `
      <div>Finger: (${hit.fingerPos.x.toFixed(3)}, ${hit.fingerPos.y.toFixed(3)})</div>
      <div>NDC: (${hit.ndc.x.toFixed(3)}, ${hit.ndc.y.toFixed(3)})</div>
      <div>Hit: ${hit.hasHit ? '<span style="color: #00FF00;">YES</span>' : '<span style="color: #FF0000;">NO</span>'}</div>
      ${hit.uv ? `<div>UV: (${hit.uv.x.toFixed(3)}, ${hit.uv.y.toFixed(3)})</div>` : ''}
      ${hit.distance ? `<div>Dist: ${hit.distance.toFixed(2)}</div>` : ''}
      ${chartAreaInfo}
    `;
  }

  /**
   * Toggle debug visualization
   *
   * @param {boolean} enabled - Enable debug mode
   */
  setDebugVisualization(enabled) {
    this.debugVisualization = enabled;
    console.log(`Debug visualization: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if hand tracking is active
   *
   * @returns {boolean} True if active
   */
  isActive() {
    return this.handsActive;
  }
}

// Export for use in other modules
window.HandTracking = HandTracking;
