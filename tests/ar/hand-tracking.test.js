/**
 * Hand Tracking Module Tests
 * 
 * Tests for MediaPipe hands integration and real-time hand detection
 * in the hybrid AR environment.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

// Mock MediaPipe Hands
const mockHands = {
  setOptions: jest.fn(),
  onResults: jest.fn(),
  send: jest.fn().mockResolvedValue(undefined)
};

const mockMediaPipeHands = jest.fn().mockImplementation(() => mockHands);

global.Hands = mockMediaPipeHands;

// Mock DOM elements
const mockVideo = {
  videoWidth: 640,
  videoHeight: 480
};

const mockCanvas = {
  width: 640,
  height: 480,
  getContext: jest.fn(() => mockCanvasContext)
};

const mockButton = {
  disabled: false
};

const mockStatusElement = {
  textContent: '',
  className: ''
};

const mockCanvasContext = {
  clearRect: jest.fn()
};

global.document = {
  querySelector: (selector) => {
    if (selector === 'video') return mockVideo;
    return null;
  },
  getElementById: (id) => {
    if (id === 'hand-overlay') return mockCanvas;
    if (id === 'start-hands' || id === 'stop-hands') return { ...mockButton };
    if (id === 'process-time' || id === 'video-resolution') return { textContent: '' };
    return mockStatusElement;
  }
};

global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: jest.fn(),
  requestAnimationFrame: jest.fn(),
  HandTracking: undefined
};

global.performance = {
  now: () => 100
};

global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

// Mock gesture detector and chart manager
const mockGestureDetector = {
  drawHandLandmarks: jest.fn(),
  isPinchGesture: jest.fn(),
  isClosedPalm: jest.fn(),
  isPeaceGesture: jest.fn(),
  isThumbsUpGesture: jest.fn(),
  isThumbsDownGesture: jest.fn(),
  isPointGesture: jest.fn(),
  isOpenHandGesture: jest.fn(),
  handlePinchGesture: jest.fn(),
  handlePeaceGesture: jest.fn(),
  handleScaleGesture: jest.fn(),
  handlePointGesture: jest.fn(),
  releaseChart: jest.fn(),
  reset: jest.fn(),
  isPinching: false
};

const mockChartManager = {
  placeChartAtHand: jest.fn(),
  getCharts: jest.fn().mockReturnValue([]),
  coordinateSystem: {}
};

// Load the module
require('../../src/ar/hand-tracking.js');
const HandTracking = global.window.HandTracking;

describe('HandTracking', () => {
  let handTracking;
  let mockUpdateStatus;

  beforeEach(() => {
    mockUpdateStatus = jest.fn();
    handTracking = new HandTracking(mockGestureDetector, mockChartManager, mockUpdateStatus);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(handTracking.hands).toBe(null);
      expect(handTracking.handsActive).toBe(false);
      expect(handTracking.processingHands).toBe(false);
      expect(handTracking.frameSkipCounter).toBe(0);
      expect(handTracking.FRAME_SKIP_RATE).toBe(2);
      expect(handTracking.gestureDetector).toBe(mockGestureDetector);
      expect(handTracking.chartManager).toBe(mockChartManager);
      expect(handTracking.updateStatus).toBe(mockUpdateStatus);
    });
  });

  describe('initialize', () => {
    test('should create MediaPipe Hands instance with correct options', async () => {
      await handTracking.initialize();

      expect(mockMediaPipeHands).toHaveBeenCalledWith({
        locateFile: expect.any(Function)
      });
      expect(mockHands.setOptions).toHaveBeenCalledWith({
        selfieMode: true,
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      expect(mockHands.onResults).toHaveBeenCalled();
      expect(mockUpdateStatus).toHaveBeenCalledWith('Hand tracking initialized', 'ready');
    });

    test('should handle initialization errors', async () => {
      const errorHands = jest.fn().mockImplementation(() => {
        throw new Error('MediaPipe error');
      });
      global.Hands = errorHands;

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await handTracking.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize hands:', expect.any(Error));
      expect(mockUpdateStatus).toHaveBeenCalledWith('Hand tracking initialization failed', 'error');
      
      consoleSpy.mockRestore();
      global.Hands = mockMediaPipeHands;
    });
  });

  describe('waitForVideo', () => {
    test('should resolve when video is available', async () => {
      global.document.querySelector = () => mockVideo;

      const result = await handTracking.waitForVideo(1000);
      expect(result).toBe(mockVideo);
    });

    test('should reject on timeout', async () => {
      global.document.querySelector = () => null;

      await expect(handTracking.waitForVideo(100)).rejects.toThrow('Timeout waiting for AR.js video');
    });

    test('should wait for video with proper dimensions', async () => {
      const videoWithoutDimensions = { videoWidth: 0, videoHeight: 0 };
      let callCount = 0;
      
      global.document.querySelector = () => {
        callCount++;
        return callCount > 2 ? mockVideo : videoWithoutDimensions;
      };

      const result = await handTracking.waitForVideo(1000);
      expect(result).toBe(mockVideo);
    });
  });

  describe('setupHandOverlay', () => {
    test('should set canvas dimensions from video', () => {
      const canvas = { width: 0, height: 0 };
      global.document.getElementById = (id) => {
        if (id === 'hand-overlay') return canvas;
        return null;
      };

      handTracking.setupHandOverlay();

      expect(canvas.width).toBe(mockVideo.videoWidth);
      expect(canvas.height).toBe(mockVideo.videoHeight);
    });

    test('should fallback to window dimensions when video unavailable', () => {
      const canvas = { width: 0, height: 0 };
      global.document.getElementById = (id) => {
        if (id === 'hand-overlay') return canvas;
        return null;
      };
      global.document.querySelector = () => ({ videoWidth: 0 });

      handTracking.setupHandOverlay();

      expect(canvas.width).toBe(global.window.innerWidth);
      expect(canvas.height).toBe(global.window.innerHeight);
    });
  });

  describe('start', () => {
    test('should start hand tracking successfully', async () => {
      handTracking.hands = mockHands;
      global.document.querySelector = () => mockVideo;
      
      await handTracking.start();

      expect(handTracking.handsActive).toBe(true);
      expect(mockUpdateStatus).toHaveBeenCalledWith(
        'Hand tracking active - make fist to place, pinch to move', 
        'detecting'
      );
    });

    test('should handle start errors gracefully', async () => {
      global.document.querySelector = () => null;
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await handTracking.start();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to start hand tracking:', expect.any(Error));
      expect(mockUpdateStatus).toHaveBeenCalledWith(
        expect.stringContaining('Failed to start hand tracking'), 
        'error'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('stop', () => {
    test('should stop hand tracking and reset state', () => {
      handTracking.handsActive = true;
      
      // Ensure proper mock setup for this test
      global.document.getElementById = (id) => {
        if (id === 'hand-overlay') return mockCanvas;
        if (id === 'start-hands' || id === 'stop-hands') return { ...mockButton };
        if (id === 'process-time' || id === 'video-resolution') return { textContent: '' };
        return mockStatusElement;
      };
      
      // Reset the mock to ensure fresh tracking
      mockCanvasContext.clearRect.mockClear();
      
      handTracking.stop();

      expect(handTracking.handsActive).toBe(false);
      expect(mockCanvasContext.clearRect).toHaveBeenCalledWith(0, 0, 640, 480);
      expect(mockGestureDetector.reset).toHaveBeenCalled();
      expect(mockUpdateStatus).toHaveBeenCalledWith('Hand tracking stopped', 'ready');
    });
  });

  describe('onHandResults', () => {
    beforeEach(() => {
      global.document.getElementById = (id) => {
        if (id === 'hand-overlay') return { ...mockCanvas, getContext: () => mockCanvasContext };
        return null;
      };
    });

    test('should process hand detection results', () => {
      const mockResults = {
        multiHandLandmarks: [
          Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
        ],
        multiHandedness: [{ label: 'Right' }]
      };

      handTracking.onHandResults(mockResults);

      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
      expect(mockGestureDetector.drawHandLandmarks).toHaveBeenCalled();
    });

    test('should handle pinch gestures', () => {
      mockGestureDetector.isPinchGesture.mockReturnValue(true);
      mockGestureDetector.isClosedPalm.mockReturnValue(false);

      const mockResults = {
        multiHandLandmarks: [
          Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
        ],
        multiHandedness: [{ label: 'Right' }]
      };

      handTracking.onHandResults(mockResults);

      expect(mockGestureDetector.handlePinchGesture).toHaveBeenCalled();
    });

    test('should handle closed palm gestures', () => {
      mockGestureDetector.isPinchGesture.mockReturnValue(false);
      mockGestureDetector.isClosedPalm.mockReturnValue(true);

      const mockResults = {
        multiHandLandmarks: [
          Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
        ],
        multiHandedness: [{ label: 'Right' }]
      };

      handTracking.onHandResults(mockResults);

      expect(mockChartManager.placeChartAtHand).toHaveBeenCalled();
    });

    test('should release chart when no hands detected', () => {
      mockGestureDetector.isPinching = true;
      
      const mockResults = {
        multiHandLandmarks: null,
        multiHandedness: null
      };

      handTracking.onHandResults(mockResults);

      expect(mockGestureDetector.releaseChart).toHaveBeenCalled();
    });

    test('should handle multiple hands', () => {
      const mockResults = {
        multiHandLandmarks: [
          Array.from({ length: 21 }, () => ({ x: 0.3, y: 0.3, z: 0 })),
          Array.from({ length: 21 }, () => ({ x: 0.7, y: 0.7, z: 0 }))
        ],
        multiHandedness: [{ label: 'Left' }, { label: 'Right' }]
      };

      handTracking.onHandResults(mockResults);

      expect(mockGestureDetector.drawHandLandmarks).toHaveBeenCalledTimes(2);
    });
  });

  describe('isActive', () => {
    test('should return correct active state', () => {
      expect(handTracking.isActive()).toBe(false);
      
      handTracking.handsActive = true;
      expect(handTracking.isActive()).toBe(true);
    });
  });

  describe('Performance Features', () => {
    test('should implement frame skipping logic', () => {
      expect(handTracking.FRAME_SKIP_RATE).toBe(2);
      expect(handTracking.frameSkipCounter).toBeDefined();
    });

    test('should track processing performance', () => {
      expect(handTracking.lastProcessTime).toBeDefined();
      expect(typeof handTracking.lastProcessTime).toBe('number');
    });
  });

  describe('Error Resilience', () => {
    test('should handle missing DOM elements', () => {
      global.document.getElementById = () => null;
      global.document.querySelector = () => null;

      expect(() => {
        handTracking.setupHandOverlay();
        handTracking.stop();
      }).not.toThrow();
    });

    test('should handle malformed MediaPipe results', () => {
      const malformedResults = {
        multiHandLandmarks: undefined,
        multiHandedness: []
      };

      expect(() => {
        handTracking.onHandResults(malformedResults);
      }).not.toThrow();
    });
  });
});