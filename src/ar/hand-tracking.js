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
              document.getElementById('process-time').textContent = this.lastProcessTime.toFixed(1);
              document.getElementById('video-resolution').textContent = `${video.videoWidth}x${video.videoHeight}`;
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
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const landmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i].label;
        
        this.gestureDetector.drawHandLandmarks(ctx, landmarks);
        handDetected = true;
        
        // Process gestures
        if (this.gestureDetector.isPinchGesture(landmarks, handedness)) {
          this.gestureDetector.handlePinchGesture(
            landmarks, 
            this.chartManager.getCharts(), 
            this.chartManager.coordinateSystem
          );
        } else if (this.gestureDetector.isClosedPalm(landmarks, handedness)) {
          this.chartManager.placeChartAtHand(landmarks, this.updateStatus);
        }
      }
    }
    
    // Release chart if no hands detected
    if (!handDetected && this.gestureDetector.isPinching) {
      this.gestureDetector.releaseChart();
    }
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