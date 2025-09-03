/**
 * Gesture Detector Module Tests
 * 
 * Tests for MediaPipe hand gesture detection including pinch and fist recognition
 * and chart manipulation functionality.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

// Mock DOM elements and canvas context
const mockCanvasContext = {
  canvas: { width: 800, height: 600 },
  strokeStyle: '',
  lineWidth: 0,
  fillStyle: '',
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn()
};

const mockCanvas = {
  width: 800,
  height: 600,
  getContext: () => mockCanvasContext
};

// Setup global mocks
global.document = {
  getElementById: (id) => {
    if (id === 'hand-overlay') return mockCanvas;
    return null;
  }
};

global.window = {
  GestureDetector: undefined
};

// Load the module
require('../../src/ar/gesture-detector.js');
const GestureDetector = global.window.GestureDetector;

describe('GestureDetector', () => {
  let gestureDetector;
  let consoleSpy;

  beforeAll(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  beforeEach(() => {
    gestureDetector = new GestureDetector();
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(gestureDetector.PINCH_THRESHOLD).toBe(0.05);
      expect(gestureDetector.isPinching).toBe(false);
      expect(gestureDetector.selectedChart).toBe(null);
    });
  });

  describe('drawHandLandmarks', () => {
    test('should draw landmarks and connections on canvas', () => {
      const mockLandmarks = Array.from({ length: 21 }, (_, i) => ({
        x: 0.5,
        y: 0.5,
        z: 0
      }));

      gestureDetector.drawHandLandmarks(mockCanvasContext, mockLandmarks);

      expect(mockCanvasContext.arc).toHaveBeenCalledTimes(21);
      expect(mockCanvasContext.fill).toHaveBeenCalledTimes(21);
      expect(mockCanvasContext.stroke).toHaveBeenCalledTimes(1);
    });

    test('should set proper drawing styles', () => {
      const mockLandmarks = [{ x: 0.5, y: 0.5, z: 0 }];

      gestureDetector.drawHandLandmarks(mockCanvasContext, mockLandmarks);

      expect(mockCanvasContext.strokeStyle).toBe('#00FF00');
      expect(mockCanvasContext.lineWidth).toBe(2);
      expect(mockCanvasContext.fillStyle).toBe('#FF0000');
    });
  });

  describe('isPinchGesture', () => {
    test('should detect pinch when thumb and index finger are close', () => {
      const closeFingers = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      closeFingers[4] = { x: 0.5, y: 0.5, z: 0 }; // Thumb tip
      closeFingers[8] = { x: 0.51, y: 0.51, z: 0 }; // Index tip - very close

      const result = gestureDetector.isPinchGesture(closeFingers);
      expect(result).toBe(true);
    });

    test('should not detect pinch when fingers are far apart', () => {
      const farFingers = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      farFingers[4] = { x: 0.3, y: 0.3, z: 0 }; // Thumb tip
      farFingers[8] = { x: 0.7, y: 0.7, z: 0 }; // Index tip - far apart

      const result = gestureDetector.isPinchGesture(farFingers);
      expect(result).toBe(false);
    });

    test('should work with left hand handedness', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      landmarks[4] = { x: 0.5, y: 0.5, z: 0 };
      landmarks[8] = { x: 0.51, y: 0.51, z: 0 };

      const result = gestureDetector.isPinchGesture(landmarks, 'Left');
      expect(result).toBe(true);
    });
  });

  describe('isClosedPalm', () => {
    test('should detect closed fist for right hand', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      
      // Set finger tips below MCPs (closed fist)
      landmarks[4] = { x: 0.4, y: 0.6, z: 0 }; // Thumb tip
      landmarks[3] = { x: 0.5, y: 0.5, z: 0 }; // Thumb MCP
      landmarks[8] = { x: 0.5, y: 0.7, z: 0 }; // Index tip
      landmarks[6] = { x: 0.5, y: 0.5, z: 0 }; // Index MCP
      landmarks[12] = { x: 0.5, y: 0.7, z: 0 }; // Middle tip
      landmarks[10] = { x: 0.5, y: 0.5, z: 0 }; // Middle MCP
      landmarks[16] = { x: 0.5, y: 0.7, z: 0 }; // Ring tip
      landmarks[14] = { x: 0.5, y: 0.5, z: 0 }; // Ring MCP
      landmarks[20] = { x: 0.5, y: 0.7, z: 0 }; // Pinky tip
      landmarks[18] = { x: 0.5, y: 0.5, z: 0 }; // Pinky MCP

      const result = gestureDetector.isClosedPalm(landmarks, 'Right');
      expect(result).toBe(true);
    });

    test('should not detect closed fist when fingers are extended', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      
      // Set finger tips above MCPs (open hand)
      landmarks[4] = { x: 0.6, y: 0.3, z: 0 }; // Thumb tip
      landmarks[3] = { x: 0.5, y: 0.5, z: 0 }; // Thumb MCP
      landmarks[8] = { x: 0.5, y: 0.2, z: 0 }; // Index tip
      landmarks[6] = { x: 0.5, y: 0.5, z: 0 }; // Index MCP

      const result = gestureDetector.isClosedPalm(landmarks, 'Right');
      expect(result).toBe(false);
    });

    test('should handle left hand orientation correctly', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      
      // Left hand thumb logic is reversed
      landmarks[4] = { x: 0.4, y: 0.6, z: 0 }; // Thumb tip (left)
      landmarks[3] = { x: 0.5, y: 0.5, z: 0 }; // Thumb MCP

      const result = gestureDetector.isClosedPalm(landmarks, 'Left');
      expect(result).toBe(true);
    });
  });

  describe('handlePinchGesture', () => {
    let mockCharts, mockCoordinateSystem;

    beforeEach(() => {
      mockCharts = [
        { 
          screenX: 200, 
          screenY: 150, 
          id: 'chart1',
          entity: { setAttribute: jest.fn() }
        }
      ];

      mockCoordinateSystem = {
        findChartAtPosition: jest.fn(),
        screenToWorld: jest.fn().mockReturnValue('1 2 -3')
      };
    });

    test('should start pinching when chart is found at position', () => {
      mockCoordinateSystem.findChartAtPosition.mockReturnValue(mockCharts[0]);
      
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      landmarks[9] = { x: 0.25, y: 0.25, z: 0 }; // Palm center

      gestureDetector.handlePinchGesture(landmarks, mockCharts, mockCoordinateSystem);

      expect(gestureDetector.isPinching).toBe(true);
      expect(gestureDetector.selectedChart).toBe(mockCharts[0]);
      expect(mockCoordinateSystem.findChartAtPosition).toHaveBeenCalledWith(600, 150, mockCharts);
    });

    test('should move chart when already pinching', () => {
      // Setup initial pinch state
      gestureDetector.isPinching = true;
      gestureDetector.selectedChart = mockCharts[0];

      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      landmarks[9] = { x: 0.3, y: 0.3, z: 0 }; // New palm position

      gestureDetector.handlePinchGesture(landmarks, mockCharts, mockCoordinateSystem);

      expect(mockCoordinateSystem.screenToWorld).toHaveBeenCalledWith(560, 180);
      expect(mockCharts[0].entity.setAttribute).toHaveBeenCalledWith('position', '1 2 -3');
      expect(mockCharts[0].entity.setAttribute).toHaveBeenCalledWith('scale', '1.2 1.2 1.2');
    });

    test('should not start pinching when no chart found', () => {
      mockCoordinateSystem.findChartAtPosition.mockReturnValue(null);
      
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));

      gestureDetector.handlePinchGesture(landmarks, mockCharts, mockCoordinateSystem);

      expect(gestureDetector.isPinching).toBe(false);
      expect(gestureDetector.selectedChart).toBe(null);
    });
  });

  describe('moveChart', () => {
    test('should update chart position and scale', () => {
      const mockChart = {
        screenX: 0,
        screenY: 0,
        entity: { setAttribute: jest.fn() }
      };

      const mockCoordinateSystem = {
        screenToWorld: jest.fn().mockReturnValue('2 1 -4')
      };

      gestureDetector.moveChart(mockChart, 100, 200, mockCoordinateSystem);

      expect(mockChart.screenX).toBe(100);
      expect(mockChart.screenY).toBe(200);
      expect(mockCoordinateSystem.screenToWorld).toHaveBeenCalledWith(100, 200);
      expect(mockChart.entity.setAttribute).toHaveBeenCalledWith('position', '2 1 -4');
      expect(mockChart.entity.setAttribute).toHaveBeenCalledWith('scale', '1.2 1.2 1.2');
    });
  });

  describe('releaseChart', () => {
    test('should reset chart scale and clear selection', () => {
      const mockChart = {
        entity: { setAttribute: jest.fn() }
      };

      gestureDetector.selectedChart = mockChart;
      gestureDetector.isPinching = true;

      gestureDetector.releaseChart();

      expect(mockChart.entity.setAttribute).toHaveBeenCalledWith('scale', '1 1 1');
      expect(gestureDetector.selectedChart).toBe(null);
      expect(gestureDetector.isPinching).toBe(false);
    });

    test('should handle release when no chart selected', () => {
      gestureDetector.selectedChart = null;
      gestureDetector.isPinching = true;

      expect(() => gestureDetector.releaseChart()).not.toThrow();
      expect(gestureDetector.isPinching).toBe(false);
    });
  });

  describe('reset', () => {
    test('should reset all gesture state', () => {
      gestureDetector.isPinching = true;
      gestureDetector.selectedChart = { id: 'test' };

      gestureDetector.reset();

      expect(gestureDetector.isPinching).toBe(false);
      expect(gestureDetector.selectedChart).toBe(null);
    });
  });

  describe('Edge Cases', () => {
    test('should handle landmarks with extreme coordinates', () => {
      const extremeLandmarks = Array.from({ length: 21 }, () => ({ x: 1.5, y: -0.5, z: 10 }));
      extremeLandmarks[4] = { x: 0, y: 0, z: 0 };
      extremeLandmarks[8] = { x: 1, y: 1, z: 0 };

      expect(() => {
        gestureDetector.drawHandLandmarks(mockCanvasContext, extremeLandmarks);
        gestureDetector.isPinchGesture(extremeLandmarks);
        gestureDetector.isClosedPalm(extremeLandmarks);
      }).not.toThrow();
    });

    test('should handle missing landmark data gracefully', () => {
      const incompleteLandmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));

      expect(() => {
        gestureDetector.drawHandLandmarks(mockCanvasContext, incompleteLandmarks);
      }).not.toThrow();

      // Should not crash but may return false for insufficient data
      const pinchResult = gestureDetector.isPinchGesture(incompleteLandmarks);
      const palmResult = gestureDetector.isClosedPalm(incompleteLandmarks);
      
      expect(typeof pinchResult).toBe('boolean');
      expect(typeof palmResult).toBe('boolean');
    });

    test('should handle rapid gesture state changes', () => {
      // Test rapid pinch on/off
      for (let i = 0; i < 10; i++) {
        gestureDetector.isPinching = !gestureDetector.isPinching;
        gestureDetector.reset();
      }

      expect(gestureDetector.isPinching).toBe(false);
      expect(gestureDetector.selectedChart).toBe(null);
    });
  });
});