/**
 * Coordinate System Module Tests
 * 
 * Tests for coordinate conversion between screen and world coordinates
 * and chart position detection functionality.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

// Mock DOM and A-Frame dependencies
const mockCanvas = {
  width: 800,
  height: 600
};

const mockCamera = {
  position: { x: 0, y: 0, z: 0, clone: () => ({ x: 0, y: 0, z: 0, add: (v) => v }) }
};

const mockScene = {
  camera: mockCamera
};

const mockVector3 = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.unproject = () => this;
  this.sub = () => this;
  this.normalize = () => this;
  this.multiplyScalar = (s) => ({ x: this.x * s, y: this.y * s, z: this.z * s });
};

// Setup global mocks
global.document = {
  getElementById: (id) => {
    if (id === 'hand-overlay') return mockCanvas;
    return null;
  },
  querySelector: (selector) => {
    if (selector === 'a-scene') return mockScene;
    return null;
  }
};

global.THREE = {
  Vector3: mockVector3
};

global.window = {
  CoordinateSystem: undefined
};

// Load the module
require('../../src/ar/coordinate-system.js');
const CoordinateSystem = global.window.CoordinateSystem;

describe('CoordinateSystem', () => {
  let coordinateSystem;

  beforeEach(() => {
    coordinateSystem = new CoordinateSystem();
  });

  describe('Constructor', () => {
    test('should initialize without errors', () => {
      expect(coordinateSystem).toBeDefined();
      expect(coordinateSystem).toBeInstanceOf(CoordinateSystem);
    });
  });

  describe('screenToWorld', () => {
    test('should convert screen coordinates to world coordinates - fallback mode', () => {
      // Mock no camera scenario
      global.document.querySelector = () => ({ camera: null });
      
      const result = coordinateSystem.screenToWorld(400, 300);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^-?\d+\.?\d* -?\d+\.?\d* -?\d+\.?\d*$/);
    });

    test('should convert center screen position correctly', () => {
      global.document.querySelector = () => ({ camera: null });
      
      const result = coordinateSystem.screenToWorld(400, 300);
      const [x, y, z] = result.split(' ').map(Number);
      
      expect(x).toBeCloseTo(0, 1); // Center X should be near 0
      expect(z).toBe(-3); // Default Z distance
    });

    test('should handle edge screen coordinates', () => {
      global.document.querySelector = () => ({ camera: null });
      
      const topLeft = coordinateSystem.screenToWorld(0, 0);
      const bottomRight = coordinateSystem.screenToWorld(800, 600);
      
      expect(topLeft).toBeDefined();
      expect(bottomRight).toBeDefined();
      
      const [tlX, tlY] = topLeft.split(' ').map(Number);
      const [brX, brY] = bottomRight.split(' ').map(Number);
      
      expect(tlX).toBeLessThan(brX);
      expect(tlY).toBeGreaterThan(brY); // Y is inverted
    });

    test('should convert with camera projection matrix when available', () => {
      global.document.querySelector = () => mockScene;
      
      const result = coordinateSystem.screenToWorld(400, 300);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^-?\d+\.?\d* -?\d+\.?\d* -?\d+\.?\d*$/);
    });
  });

  describe('findChartAtPosition', () => {
    test('should return null when no charts exist', () => {
      const result = coordinateSystem.findChartAtPosition(100, 100, []);
      expect(result).toBeNull();
    });

    test('should find chart within bounds', () => {
      const mockCharts = [
        { screenX: 100, screenY: 100, id: 'chart1' },
        { screenX: 300, screenY: 200, id: 'chart2' }
      ];
      
      const result = coordinateSystem.findChartAtPosition(120, 110, mockCharts);
      expect(result).toBeDefined();
      expect(result.id).toBe('chart1');
    });

    test('should return null when position is outside chart bounds', () => {
      const mockCharts = [
        { screenX: 100, screenY: 100, id: 'chart1' }
      ];
      
      const result = coordinateSystem.findChartAtPosition(300, 300, mockCharts);
      expect(result).toBeNull();
    });

    test('should return most recently added chart when multiple charts overlap', () => {
      const mockCharts = [
        { screenX: 100, screenY: 100, id: 'chart1' },
        { screenX: 110, screenY: 110, id: 'chart2' }
      ];
      
      const result = coordinateSystem.findChartAtPosition(105, 105, mockCharts);
      expect(result.id).toBe('chart2'); // Last in array (most recent)
    });

    test('should handle edge cases for chart bounds detection', () => {
      const mockCharts = [
        { screenX: 100, screenY: 100, id: 'chart1' }
      ];
      
      // Test exact boundaries (100 pixels in X, 75 in Y)
      expect(coordinateSystem.findChartAtPosition(199, 174, mockCharts)).toBeDefined();
      expect(coordinateSystem.findChartAtPosition(201, 176, mockCharts)).toBeNull();
      expect(coordinateSystem.findChartAtPosition(1, 26, mockCharts)).toBeDefined();
      expect(coordinateSystem.findChartAtPosition(0, 24, mockCharts)).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    test('should work with realistic chart data', () => {
      const realisticCharts = [
        { 
          screenX: 200, 
          screenY: 150, 
          id: 'bar-chart', 
          type: 'bar',
          entity: { setAttribute: jest.fn() }
        },
        { 
          screenX: 600, 
          screenY: 400, 
          id: 'pie-chart', 
          type: 'pie',
          entity: { setAttribute: jest.fn() }
        }
      ];
      
      const foundChart = coordinateSystem.findChartAtPosition(220, 160, realisticCharts);
      expect(foundChart).toBeDefined();
      expect(foundChart.type).toBe('bar');
      
      const notFound = coordinateSystem.findChartAtPosition(50, 50, realisticCharts);
      expect(notFound).toBeNull();
    });

    test('should handle coordinate conversion for various screen sizes', () => {
      // Test with different canvas sizes
      global.document.getElementById = (id) => {
        if (id === 'hand-overlay') return { width: 1920, height: 1080 };
        return null;
      };
      
      const result = coordinateSystem.screenToWorld(960, 540);
      expect(result).toBeDefined();
      
      // Reset to original
      global.document.getElementById = (id) => {
        if (id === 'hand-overlay') return mockCanvas;
        return null;
      };
    });
  });
});