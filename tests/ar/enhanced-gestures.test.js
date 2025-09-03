/**
 * Enhanced AR Gesture Features Tests
 * 
 * Tests for new gesture recognition features including peace sign rotation,
 * thumbs up/down scaling, point duplication, and two-hand grouping.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

// Mock Chart.js
global.Chart = jest.fn().mockImplementation(() => ({
  destroy: jest.fn(),
  update: jest.fn(),
  data: {
    datasets: [{
      backgroundColor: '',
      borderColor: ''
    }]
  }
}));

// Mock DOM elements
const mockCanvas = {
  width: 800,
  height: 600,
  getContext: () => ({ clearRect: jest.fn() }),
  id: 'test-canvas'
};

const mockEntity = {
  setAttribute: jest.fn(),
  remove: jest.fn()
};

const mockAssets = { appendChild: jest.fn() };
const mockHandChartsContainer = { appendChild: jest.fn() };

global.document = {
  createElement: (tag) => {
    if (tag === 'a-plane') return { ...mockEntity };
    return { ...mockCanvas };
  },
  getElementById: (id) => {
    if (id === 'hand-overlay') return mockCanvas;
    if (id === 'hand-charts') return mockHandChartsContainer;
    return null;
  },
  querySelector: () => mockAssets
};

global.setTimeout = jest.fn();
global.Date = { now: () => 1234567890 };
global.window = {};

// Load modules
require('../../src/ar/coordinate-system.js');
require('../../src/ar/gesture-detector.js');
require('../../src/ar/chart-manager.js');
require('../../src/ar/hand-tracking.js');

const CoordinateSystem = global.window.CoordinateSystem;
const GestureDetector = global.window.GestureDetector;
const ChartManager = global.window.ChartManager;
const HandTracking = global.window.HandTracking;

describe('Enhanced AR Gesture Features', () => {
  let coordinateSystem, gestureDetector, chartManager, handTracking;

  beforeEach(() => {
    coordinateSystem = new CoordinateSystem();
    gestureDetector = new GestureDetector();
    chartManager = new ChartManager(coordinateSystem);
    handTracking = new HandTracking(gestureDetector, chartManager, jest.fn());
    jest.clearAllMocks();
  });

  describe('Peace Sign Gesture Recognition', () => {
    test('should detect peace sign correctly', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      
      // Set up peace sign (index and middle extended, others folded)
      landmarks[8] = { x: 0.5, y: 0.3, z: 0 }; // Index tip
      landmarks[6] = { x: 0.5, y: 0.5, z: 0 }; // Index MCP
      landmarks[12] = { x: 0.5, y: 0.3, z: 0 }; // Middle tip
      landmarks[10] = { x: 0.5, y: 0.5, z: 0 }; // Middle MCP
      landmarks[16] = { x: 0.5, y: 0.7, z: 0 }; // Ring tip (folded)
      landmarks[14] = { x: 0.5, y: 0.5, z: 0 }; // Ring MCP
      landmarks[4] = { x: 0.6, y: 0.6, z: 0 }; // Thumb tip (folded)
      landmarks[3] = { x: 0.5, y: 0.5, z: 0 }; // Thumb MCP

      expect(gestureDetector.isPeaceGesture(landmarks, 'Right')).toBe(true);
    });

    test('should not detect peace sign when fingers not in position', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      
      // All fingers folded
      landmarks[8] = { x: 0.5, y: 0.7, z: 0 }; // Index tip
      landmarks[12] = { x: 0.5, y: 0.7, z: 0 }; // Middle tip

      expect(gestureDetector.isPeaceGesture(landmarks)).toBe(false);
    });
  });

  describe('Thumbs Up/Down Gesture Recognition', () => {
    test('should detect thumbs up correctly', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      
      landmarks[4] = { x: 0.5, y: 0.3, z: 0 }; // Thumb tip (up)
      landmarks[3] = { x: 0.5, y: 0.5, z: 0 }; // Thumb MCP
      landmarks[8] = { x: 0.5, y: 0.7, z: 0 }; // Index tip (folded)
      landmarks[6] = { x: 0.5, y: 0.5, z: 0 }; // Index MCP

      expect(gestureDetector.isThumbsUpGesture(landmarks)).toBe(true);
    });

    test('should detect thumbs down correctly', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      
      landmarks[4] = { x: 0.5, y: 0.7, z: 0 }; // Thumb tip (down)
      landmarks[3] = { x: 0.5, y: 0.5, z: 0 }; // Thumb MCP
      landmarks[8] = { x: 0.5, y: 0.7, z: 0 }; // Index tip (folded)

      expect(gestureDetector.isThumbsDownGesture(landmarks)).toBe(true);
    });
  });

  describe('Point Gesture Recognition', () => {
    test('should detect point gesture correctly', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      
      landmarks[8] = { x: 0.5, y: 0.3, z: 0 }; // Index tip (extended)
      landmarks[6] = { x: 0.5, y: 0.5, z: 0 }; // Index MCP
      landmarks[12] = { x: 0.5, y: 0.7, z: 0 }; // Middle tip (folded)
      landmarks[16] = { x: 0.5, y: 0.7, z: 0 }; // Ring tip (folded)
      landmarks[20] = { x: 0.5, y: 0.7, z: 0 }; // Pinky tip (folded)

      expect(gestureDetector.isPointGesture(landmarks)).toBe(true);
    });
  });

  describe('Open Hand Gesture Recognition', () => {
    test('should detect open hand correctly', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      
      // All fingers extended
      landmarks[4] = { x: 0.3, y: 0.3, z: 0 }; // Thumb tip
      landmarks[3] = { x: 0.5, y: 0.5, z: 0 }; // Thumb MCP
      landmarks[8] = { x: 0.5, y: 0.3, z: 0 }; // Index tip
      landmarks[12] = { x: 0.5, y: 0.3, z: 0 }; // Middle tip
      landmarks[16] = { x: 0.5, y: 0.3, z: 0 }; // Ring tip
      landmarks[20] = { x: 0.5, y: 0.3, z: 0 }; // Pinky tip

      expect(gestureDetector.isOpenHandGesture(landmarks, 'Right')).toBe(true);
    });
  });

  describe('Chart Rotation Feature', () => {
    test('should rotate chart by 15 degrees', () => {
      const chart = {
        rotation: 0,
        entity: { setAttribute: jest.fn() }
      };

      gestureDetector.rotateChart(chart);

      expect(chart.rotation).toBe(15);
      expect(chart.entity.setAttribute).toHaveBeenCalledWith('rotation', '0 0 15');
    });

    test('should wrap rotation at 360 degrees', () => {
      const chart = {
        rotation: 350,
        entity: { setAttribute: jest.fn() }
      };

      gestureDetector.rotateChart(chart);

      expect(chart.rotation).toBe(5); // (350 + 15) % 360
    });
  });

  describe('Chart Scaling Feature', () => {
    test('should scale up chart correctly', () => {
      const chart = {
        scale: 1,
        entity: { setAttribute: jest.fn() }
      };

      gestureDetector.scaleChart(chart, 1.1);

      expect(chart.scale).toBe(1.1);
      expect(chart.entity.setAttribute).toHaveBeenCalledWith('scale', '1.1 1.1 1.1');
    });

    test('should scale down chart correctly', () => {
      const chart = {
        scale: 1,
        entity: { setAttribute: jest.fn() }
      };

      gestureDetector.scaleChart(chart, 0.9);

      expect(chart.scale).toBe(0.9);
    });

    test('should enforce scale limits', () => {
      const chart = {
        scale: 0.5,
        entity: { setAttribute: jest.fn() }
      };

      gestureDetector.scaleChart(chart, 0.5); // Would make 0.25, but min is 0.5
      expect(chart.scale).toBe(0.5);

      chart.scale = 3;
      gestureDetector.scaleChart(chart, 2); // Would make 6, but max is 3
      expect(chart.scale).toBe(3);
    });
  });

  describe('Grid Snapping Feature', () => {
    test('should snap to nearest grid point', () => {
      const result = coordinateSystem.snapToGrid(123, 167, 50);
      
      expect(result.x).toBe(100); // 123 rounds to 100
      expect(result.y).toBe(150); // 167 rounds to 150
    });

    test('should handle custom grid sizes', () => {
      const result = coordinateSystem.snapToGrid(123, 167, 25);
      
      expect(result.x).toBe(125);
      expect(result.y).toBe(175);
    });

    test('should handle edge cases', () => {
      expect(coordinateSystem.snapToGrid(0, 0, 50)).toEqual({ x: 0, y: 0 });
      expect(coordinateSystem.snapToGrid(24, 26, 50)).toEqual({ x: 0, y: 50 });
    });
  });

  describe('Chart Duplication Feature', () => {
    test('should duplicate chart with offset position', () => {
      const originalChart = {
        id: 'original',
        type: 'bar',
        dataset: 'students',
        screenX: 100,
        screenY: 100,
        scale: 1,
        rotation: 0,
        canvas: { id: 'original-canvas' }
      };

      gestureDetector.duplicateChart(originalChart, chartManager, coordinateSystem);

      expect(mockAssets.appendChild).toHaveBeenCalled();
      expect(mockHandChartsContainer.appendChild).toHaveBeenCalled();
      expect(chartManager.handCharts).toHaveLength(1);
      
      const duplicatedChart = chartManager.handCharts[0];
      expect(duplicatedChart.type).toBe('bar');
      expect(duplicatedChart.dataset).toBe('students');
      expect(duplicatedChart.isDuplicate).toBe(true);
    });

    test('should prevent multiple duplications with cooldown', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      const chart = { isDuplicated: false, screenX: 100, screenY: 100 };
      const charts = [chart];

      jest.spyOn(coordinateSystem, 'findChartAtPosition').mockReturnValue(chart);

      gestureDetector.handlePointGesture(landmarks, charts, coordinateSystem, chartManager);
      
      expect(chart.isDuplicated).toBe(true);
      expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
    });
  });

  describe('Chart Grouping Feature', () => {
    test('should calculate distance between charts correctly', () => {
      const chart1 = { x: 0, y: 0 };
      const chart2 = { x: 3, y: 4 };
      
      const distance = coordinateSystem.calculateDistance(chart1, chart2);
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    test('should determine if charts can be grouped', () => {
      const chart1 = { screenX: 100, screenY: 100 };
      const chart2 = { screenX: 200, screenY: 200 };
      
      // Distance is ~141, threshold is 150
      expect(coordinateSystem.canGroupCharts(chart1, chart2, 150)).toBe(true);
      expect(coordinateSystem.canGroupCharts(chart1, chart2, 100)).toBe(false);
    });

    test('should create chart group with visual indicators', () => {
      const charts = [
        { screenX: 100, screenY: 100, entity: { setAttribute: jest.fn() }, canvas: { id: 'canvas1' } },
        { screenX: 150, screenY: 150, entity: { setAttribute: jest.fn() }, canvas: { id: 'canvas2' } }
      ];

      handTracking.createChartGroup(charts);

      charts.forEach(chart => {
        expect(chart.groupId).toBeDefined();
        expect(chart.groupIndex).toBeDefined();
        expect(chart.entity.setAttribute).toHaveBeenCalledWith('animation__group', expect.any(Object));
        expect(chart.entity.setAttribute).toHaveBeenCalledWith('material', expect.any(Object));
      });
    });

    test('should handle two-hand grouping gesture', () => {
      handTracking.handPositions = {
        0: { x: 100, y: 100, timestamp: Date.now() },
        1: { x: 200, y: 200, timestamp: Date.now() }
      };

      const charts = [
        { screenX: 100, screenY: 100, entity: { setAttribute: jest.fn() }, canvas: { id: 'c1' } },
        { screenX: 200, screenY: 200, entity: { setAttribute: jest.fn() }, canvas: { id: 'c2' } }
      ];

      jest.spyOn(chartManager, 'getCharts').mockReturnValue(charts);
      jest.spyOn(coordinateSystem, 'findChartAtPosition')
        .mockReturnValueOnce(charts[0])
        .mockReturnValueOnce(charts[1]);

      handTracking.performChartGrouping();

      expect(charts[0].groupId).toBeDefined();
      expect(charts[1].groupId).toBeDefined();
      expect(charts[0].groupId).toBe(charts[1].groupId);
    });

    test('should clean up stale hand positions', () => {
      handTracking.handPositions = {
        0: { x: 100, y: 100, timestamp: Date.now() - 2000 }, // Stale
        1: { x: 200, y: 200, timestamp: Date.now() } // Fresh
      };

      handTracking.checkForGroupingGesture();

      expect(Object.keys(handTracking.handPositions)).toHaveLength(1);
    });
  });

  describe('Enhanced Chart Movement', () => {
    test('should move chart with grid snapping enabled', () => {
      const chart = {
        screenX: 0,
        screenY: 0,
        entity: { setAttribute: jest.fn() }
      };

      jest.spyOn(coordinateSystem, 'snapToGrid').mockReturnValue({ x: 100, y: 150 });
      jest.spyOn(coordinateSystem, 'screenToWorld').mockReturnValue('1 2 -3');

      gestureDetector.moveChartWithSnapping(chart, 123, 167, coordinateSystem, true);

      expect(coordinateSystem.snapToGrid).toHaveBeenCalledWith(123, 167);
      expect(chart.screenX).toBe(100);
      expect(chart.screenY).toBe(150);
      expect(chart.entity.setAttribute).toHaveBeenCalledWith('position', '1 2 -3');
    });

    test('should move chart without snapping when disabled', () => {
      const chart = {
        screenX: 0,
        screenY: 0,
        entity: { setAttribute: jest.fn() }
      };

      gestureDetector.moveChartWithSnapping(chart, 123, 167, coordinateSystem, false);

      expect(chart.screenX).toBe(123);
      expect(chart.screenY).toBe(167);
    });
  });

  describe('Gesture Handler Integration', () => {
    test('should handle peace gesture for rotation', () => {
      const chart = {
        rotation: 0,
        entity: { setAttribute: jest.fn() }
      };
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      landmarks[9] = { x: 0.5, y: 0.5, z: 0 }; // Palm center

      jest.spyOn(coordinateSystem, 'findChartAtPosition').mockReturnValue(chart);

      gestureDetector.handlePeaceGesture(landmarks, [chart], coordinateSystem);

      expect(chart.rotation).toBe(15);
    });

    test('should handle scale gestures', () => {
      const chart = {
        scale: 1,
        entity: { setAttribute: jest.fn() }
      };
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      landmarks[9] = { x: 0.5, y: 0.5, z: 0 };

      jest.spyOn(coordinateSystem, 'findChartAtPosition').mockReturnValue(chart);

      // Test thumbs up (scale up)
      gestureDetector.handleScaleGesture(landmarks, [chart], coordinateSystem, true);
      expect(chart.scale).toBe(1.1);

      // Test thumbs down (scale down)
      gestureDetector.handleScaleGesture(landmarks, [chart], coordinateSystem, false);
      expect(chart.scale).toBeCloseTo(0.99, 2);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle gesture detection with missing landmarks', () => {
      const incompleteLandmarks = Array.from({ length: 10 }, () => ({ x: 0.5, y: 0.5, z: 0 }));

      expect(() => {
        gestureDetector.isPeaceGesture(incompleteLandmarks);
        gestureDetector.isThumbsUpGesture(incompleteLandmarks);
        gestureDetector.isPointGesture(incompleteLandmarks);
        gestureDetector.isOpenHandGesture(incompleteLandmarks);
      }).not.toThrow();
    });

    test('should handle chart operations without selected chart', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      
      jest.spyOn(coordinateSystem, 'findChartAtPosition').mockReturnValue(null);

      expect(() => {
        gestureDetector.handlePeaceGesture(landmarks, [], coordinateSystem);
        gestureDetector.handleScaleGesture(landmarks, [], coordinateSystem, true);
        gestureDetector.handlePointGesture(landmarks, [], coordinateSystem, chartManager);
      }).not.toThrow();
    });

    test('should handle grouping with insufficient charts', () => {
      handTracking.handPositions = {
        0: { x: 100, y: 100, timestamp: Date.now() },
        1: { x: 200, y: 200, timestamp: Date.now() }
      };

      jest.spyOn(chartManager, 'getCharts').mockReturnValue([]);
      jest.spyOn(coordinateSystem, 'findChartAtPosition').mockReturnValue(null);

      expect(() => handTracking.performChartGrouping()).not.toThrow();
    });
  });

  describe('Performance and Memory Management', () => {
    test('should clean up chart resources during duplication', () => {
      const originalChart = {
        type: 'bar',
        dataset: 'students',
        screenX: 100,
        screenY: 100,
        canvas: { id: 'original-canvas' }
      };

      const spy = jest.spyOn(chartManager, 'updateChartList');
      gestureDetector.duplicateChart(originalChart, chartManager, coordinateSystem);

      expect(spy).toHaveBeenCalled();
      expect(mockAssets.appendChild).toHaveBeenCalled();
    });

    test('should limit hand position tracking memory', () => {
      handTracking.handPositions = {
        0: { x: 100, y: 100, timestamp: Date.now() - 2000 }, // Very stale
        1: { x: 200, y: 200, timestamp: Date.now() - 500 }   // Fresh
      };

      handTracking.checkForGroupingGesture();

      expect(Object.keys(handTracking.handPositions)).toHaveLength(1);
      expect(handTracking.handPositions[1]).toBeDefined();
    });
  });

  describe('Visual Feedback Features', () => {
    test('should add spawn animation for duplicated charts', () => {
      const originalChart = {
        type: 'bar',
        dataset: 'students',
        screenX: 100,
        screenY: 100,
        canvas: { id: 'original-canvas' }
      };

      gestureDetector.duplicateChart(originalChart, chartManager, coordinateSystem);

      const createdEntity = mockEntity;
      expect(createdEntity.setAttribute).toHaveBeenCalledWith('animation__spawn', {
        property: 'scale',
        from: '0.1 0.1 0.1',
        to: '1 1 1',
        dur: 300
      });
    });

    test('should add snap feedback animation', () => {
      const chart = {
        screenX: 0,
        screenY: 0,
        entity: { setAttribute: jest.fn() }
      };

      gestureDetector.moveChartWithSnapping(chart, 123, 167, coordinateSystem, true);

      expect(chart.entity.setAttribute).toHaveBeenCalledWith('animation__snap', expect.any(Object));
    });
  });
});