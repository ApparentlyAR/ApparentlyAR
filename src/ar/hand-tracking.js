/**
 * Hand Tracking Module
 * 
 * Handles MediaPipe hands integration for real-time hand landmark detection
 * and processing in the hybrid AR environment.
 * 
 */

class HandTracking {
  constructor(gestureDetector, chartManager, updateStatus) {
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
    
    if (!canvas) return;
    
    if (video && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
          // Frame skipping for performance
          this.frameSkipCounter++;
          if (this.frameSkipCounter % this.FRAME_SKIP_RATE === 0) {
            this.processingHands = true;
            const startTime = performance.now();
            
            try {
              await this.hands.send({ image: video });
              this.lastProcessTime = performance.now() - startTime;
              
              // Update performance stats
              const processTimeEl = document.getElementById('process-time');
              const videoResolutionEl = document.getElementById('video-resolution');
              if (processTimeEl) processTimeEl.textContent = this.lastProcessTime.toFixed(1);
              if (videoResolutionEl) videoResolutionEl.textContent = `${video.videoWidth}x${video.videoHeight}`;
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
      
      const startButton = document.getElementById('start-hands');
      const stopButton = document.getElementById('stop-hands');
      if (startButton) startButton.disabled = true;
      if (stopButton) stopButton.disabled = false;
      
      this.updateStatus('Hand tracking active - make fist to place, pinch to move', 'detecting');
      
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
    
    const startButton = document.getElementById('start-hands');
    const stopButton = document.getElementById('stop-hands');
    if (startButton) startButton.disabled = false;
    if (stopButton) stopButton.disabled = true;
    
    // Clear hand overlay
    const canvas = document.getElementById('hand-overlay');
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
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
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let handDetected = false;
    
    if (results.multiHandLandmarks && results.multiHandedness) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i].label;
        
        this.gestureDetector.drawHandLandmarks(ctx, landmarks);
        handDetected = true;
        
        // Process gestures in priority order - fist moved up for chart creation
        if (this.gestureDetector.isPinchGesture(landmarks, handedness)) {
          this.gestureDetector.handlePinchGesture(
            landmarks, 
            this.chartManager.getCharts(), 
            this.chartManager.coordinateSystem
          );
        } else if (this.gestureDetector.isClosedPalm(landmarks, handedness)) {
          this.chartManager.placeChartAtHand(landmarks, this.updateStatus);
        } else if (this.gestureDetector.isPeaceGesture(landmarks, handedness)) {
          this.gestureDetector.handlePeaceGesture(
            landmarks,
            this.chartManager.getCharts(),
            this.chartManager.coordinateSystem
          );
        } else if (this.gestureDetector.isThumbsUpGesture(landmarks, handedness)) {
          this.gestureDetector.handleScaleGesture(
            landmarks,
            this.chartManager.getCharts(),
            this.chartManager.coordinateSystem,
            true
          );
        } else if (this.gestureDetector.isThumbsDownGesture(landmarks, handedness)) {
          this.gestureDetector.handleScaleGesture(
            landmarks,
            this.chartManager.getCharts(),
            this.chartManager.coordinateSystem,
            false
          );
        } else if (this.gestureDetector.isPointGesture(landmarks, handedness)) {
          this.gestureDetector.handlePointGesture(
            landmarks,
            this.chartManager.getCharts(),
            this.chartManager.coordinateSystem,
            this.chartManager
          );
        } else if (this.gestureDetector.isOpenHandGesture(landmarks, handedness)) {
          this.handleOpenHandGesture(landmarks, i);
        }
      }
    }
    
    // Release chart if no hands detected
    if (!handDetected && this.gestureDetector.isPinching) {
      this.gestureDetector.releaseChart();
    }
  }

  /**
   * Handle open hand gesture for chart grouping preparation
   * 
   * @param {Array} landmarks - MediaPipe hand landmarks
   * @param {number} handIndex - Index of current hand
   */
  handleOpenHandGesture(landmarks, handIndex) {
    const palmCenter = landmarks[9];
    const canvas = document.getElementById('hand-overlay');
    
    const x = (1 - palmCenter.x) * canvas.width;
    const y = palmCenter.y * canvas.height;
    
    // Store hand position for potential grouping
    if (!this.handPositions) this.handPositions = {};
    this.handPositions[handIndex] = { x, y, timestamp: Date.now() };
    
    // Check for two-hand grouping gesture
    this.checkForGroupingGesture();
  }

  /**
   * Check if two hands are performing grouping gesture
   */
  checkForGroupingGesture() {
    if (!this.handPositions) return;
    
    const handIndices = Object.keys(this.handPositions);
    const now = Date.now();
    
    // Remove stale hand positions
    handIndices.forEach(index => {
      if (now - this.handPositions[index].timestamp > 1000) {
        delete this.handPositions[index];
      }
    });
    
    const activeHands = Object.keys(this.handPositions);
    if (activeHands.length >= 2) {
      this.performChartGrouping();
    }
  }

  /**
   * Perform chart grouping with two-hand gesture
   */
  performChartGrouping() {
    const handPositions = Object.values(this.handPositions);
    const charts = this.chartManager.getCharts();
    
    // Find charts near each hand position
    const chartsNearHands = handPositions.map(handPos => {
      return this.chartManager.coordinateSystem.findChartAtPosition(
        handPos.x, 
        handPos.y, 
        charts
      );
    }).filter(chart => chart !== null);
    
    if (chartsNearHands.length >= 2) {
      this.createChartGroup(chartsNearHands);
    }
  }

  /**
   * Create a visual group of charts
   * 
   * @param {Array} charts - Charts to group
   */
  createChartGroup(charts) {
    const groupId = 'group-' + Date.now();
    
    // Calculate group center
    const centerX = charts.reduce((sum, chart) => sum + chart.screenX, 0) / charts.length;
    const centerY = charts.reduce((sum, chart) => sum + chart.screenY, 0) / charts.length;
    
    // Mark charts as grouped
    charts.forEach((chart, index) => {
      chart.groupId = groupId;
      chart.groupIndex = index;
      
      // Add visual grouping indicator
      chart.entity.setAttribute('animation__group', {
        property: 'scale',
        from: '1 1 1',
        to: '1.1 1.1 1.1',
        dur: 200,
        direction: 'alternate'
      });
      
      // Add subtle glow effect
      chart.entity.setAttribute('material', {
        src: `#${chart.canvas.id}`,
        transparent: true,
        shader: 'flat',
        emissive: '#333333'
      });
    });
    
    this.updateStatus(`Grouped ${charts.length} charts`, 'ready');
    
    // Clear hand positions after grouping
    this.handPositions = {};
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