/**
 * Unit tests for MarkerInteractionController and RotationSmoother
 */

const { MarkerInteractionController, RotationSmoother } = require('../../src/ar/marker-interaction-controller');

describe('RotationSmoother', () => {
  let smoother;

  beforeEach(() => {
    smoother = new RotationSmoother(3);
  });

  test('should smooth jittery rotation readings', () => {
    smoother.addReading(10);
    smoother.addReading(15);
    const avg = smoother.addReading(20);
    expect(avg).toBeCloseTo(15, 1);
  });

  test('should handle 0°/360° wraparound correctly', () => {
    const smoother = new RotationSmoother(3);
    smoother.addReading(350);
    smoother.addReading(0);
    smoother.addReading(10);
    const avg = smoother.addReading(5);
    // Average should be close to 1-2°, which wraps around to 361-362
    // But since we normalize to 0-360, it should be close to 1-2
    expect(avg).toBeGreaterThanOrEqual(0);
    expect(avg).toBeLessThanOrEqual(10);
  });

  test('should return 0 for empty readings', () => {
    const emptySmoother = new RotationSmoother(5);
    expect(emptySmoother.getAverage()).toBe(0);
  });

  test('should maintain window size correctly', () => {
    const smoother = new RotationSmoother(3);
    smoother.addReading(10);
    smoother.addReading(20);
    smoother.addReading(30);
    smoother.addReading(40); // Should remove 10
    smoother.addReading(50); // Should remove 20

    // Window should contain: [30, 40, 50]
    const avg = smoother.getAverage();
    expect(avg).toBeCloseTo(40, 1);
  });

  test('should reset readings', () => {
    smoother.addReading(10);
    smoother.addReading(20);
    smoother.reset();
    expect(smoother.readings.length).toBe(0);
    expect(smoother.getAverage()).toBe(0);
  });

  test('should handle circular average at 180°', () => {
    const smoother = new RotationSmoother(2);
    smoother.addReading(170);
    smoother.addReading(190);
    const avg = smoother.getAverage();
    expect(avg).toBeCloseTo(180, 1);
  });

  test('should handle circular average at 0°/360°', () => {
    const smoother = new RotationSmoother(2);
    smoother.addReading(355);
    smoother.addReading(5);
    const avg = smoother.getAverage();
    // Average should be near 0° (or 360°)
    expect(avg < 10 || avg > 350).toBe(true);
  });
});

describe('MarkerInteractionController', () => {
  let controller;
  let mockChartManager;

  beforeEach(() => {
    // Mock ChartManager
    mockChartManager = {
      updateChart: jest.fn(),
      getCurrentData: jest.fn(() => []),
      updateChartWithAxes: jest.fn(),
      updateMarkerChartFromControls: jest.fn(),
      loadCustomData: jest.fn(),
      regenerateMarkerChart: jest.fn()
    };

    // Mock window.BlocklyAutofill
    global.window = {
      BlocklyAutofill: {
        getAvailableColumns: jest.fn(() => ['name', 'age', 'score'])
      },
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };

    controller = new MarkerInteractionController(mockChartManager);
  });

  afterEach(() => {
    // Clean up intervals
    Object.keys(controller.rotationIntervals).forEach(key => {
      clearInterval(controller.rotationIntervals[key]);
    });
  });

  describe('Initialization', () => {
    test('should initialize with columns from BlocklyAutofill', () => {
      expect(controller.availableColumns).toEqual(['name', 'age', 'score']);
      expect(controller.currentXColumn).toBe('name');
      expect(controller.currentYColumn).toBe('age');
    });

    test('should set default values correctly', () => {
      expect(controller.currentSortColumn).toBe('name');
      expect(controller.currentSortOrder).toBe('ascending');
      expect(controller.currentChartType).toBe('bar');
      expect(controller.currentFilterColumn).toBe(null);
      expect(controller.currentFilterValue).toBe(null);
    });

    test('should handle empty columns gracefully', () => {
      global.window.BlocklyAutofill.getAvailableColumns = jest.fn(() => []);
      const emptyController = new MarkerInteractionController(mockChartManager);
      expect(emptyController.availableColumns).toEqual([]);
      expect(emptyController.currentXColumn).toBe(null);
      expect(emptyController.currentYColumn).toBe(null);
    });

    test('should handle missing BlocklyAutofill', () => {
      delete global.window.BlocklyAutofill;
      const noAutofillController = new MarkerInteractionController(mockChartManager);
      expect(noAutofillController.availableColumns).toEqual([]);
    });
  });

  describe('refreshAvailableColumns', () => {
    test('should refresh columns from BlocklyAutofill', () => {
      global.window.BlocklyAutofill.getAvailableColumns.mockReturnValue(['a', 'b', 'c', 'd']);
      controller.refreshAvailableColumns();

      expect(controller.availableColumns).toEqual(['a', 'b', 'c', 'd']);
    });

    test('should update defaults when columns change', () => {
      controller.currentXColumn = null;
      controller.currentYColumn = null;

      global.window.BlocklyAutofill.getAvailableColumns.mockReturnValue(['x', 'y', 'z']);
      controller.refreshAvailableColumns();

      expect(controller.currentXColumn).toBe('x');
      expect(controller.currentYColumn).toBe('y');
    });

    test('should preserve existing selections when possible', () => {
      controller.currentXColumn = 'score';
      controller.currentYColumn = 'age';

      global.window.BlocklyAutofill.getAvailableColumns.mockReturnValue(['name', 'age', 'score']);
      controller.refreshAvailableColumns();

      expect(controller.currentXColumn).toBe('score');
      expect(controller.currentYColumn).toBe('age');
    });

    test('should dispatch state change event', () => {
      controller.refreshAvailableColumns();
      expect(global.window.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('Rotation Tracking', () => {
    let mockMarkerElement;

    beforeEach(() => {
      // Mock THREE.js
      global.THREE = {
        MathUtils: {
          radToDeg: jest.fn((rad) => rad * 180 / Math.PI)
        }
      };

      mockMarkerElement = {
        object3D: {
          rotation: { y: 0 }
        }
      };
    });

    test('should start tracking rotation for a marker', () => {
      controller.startTrackingRotation(1, mockMarkerElement);

      expect(controller.rotationIntervals[1]).toBeDefined();
      expect(controller.rotationSmoothers[1]).toBeDefined();
      expect(controller.rotationSmoothers[1]).toBeInstanceOf(RotationSmoother);
    });

    test('should stop tracking rotation for a marker', () => {
      controller.startTrackingRotation(1, mockMarkerElement);
      const intervalId = controller.rotationIntervals[1];

      controller.stopTrackingRotation(1);

      expect(controller.rotationIntervals[1]).toBeUndefined();
    });

    test('should clear existing interval when starting tracking again', () => {
      controller.startTrackingRotation(1, mockMarkerElement);
      const firstIntervalId = controller.rotationIntervals[1];

      controller.startTrackingRotation(1, mockMarkerElement);
      const secondIntervalId = controller.rotationIntervals[1];

      expect(firstIntervalId).not.toBe(secondIntervalId);
    });

    test('should normalize rotation to 0-360 degrees', (done) => {
      const handleSpy = jest.spyOn(controller, 'handleMarkerRotation');

      mockMarkerElement.object3D.rotation.y = Math.PI / 2; // 90 degrees

      controller.startTrackingRotation(1, mockMarkerElement);

      setTimeout(() => {
        controller.stopTrackingRotation(1);
        expect(handleSpy).toHaveBeenCalledWith(1, expect.any(Number));
        const degrees = handleSpy.mock.calls[0][1];
        expect(degrees).toBeGreaterThanOrEqual(0);
        expect(degrees).toBeLessThan(360);
        done();
      }, 150);
    });

    test('should apply smoothing to rotation readings', (done) => {
      const handleSpy = jest.spyOn(controller, 'handleMarkerRotation');

      controller.startTrackingRotation(1, mockMarkerElement);

      // Simulate jittery readings
      let callCount = 0;
      const interval = setInterval(() => {
        mockMarkerElement.object3D.rotation.y = (Math.PI / 2) + (Math.random() * 0.1 - 0.05);
        callCount++;
        if (callCount >= 5) {
          clearInterval(interval);
          setTimeout(() => {
            controller.stopTrackingRotation(1);
            expect(handleSpy.mock.calls.length).toBeGreaterThan(0);
            done();
          }, 150);
        }
      }, 50);
    });
  });

  describe('handleMarkerRotation', () => {
    test('should route marker 1 to handleXAxisRotation', () => {
      const spy = jest.spyOn(controller, 'handleXAxisRotation');
      controller.handleMarkerRotation(1, 90);
      expect(spy).toHaveBeenCalledWith(90);
    });

    test('should route marker 2 to handleYAxisRotation', () => {
      const spy = jest.spyOn(controller, 'handleYAxisRotation');
      controller.handleMarkerRotation(2, 180);
      expect(spy).toHaveBeenCalledWith(180);
    });

    test('should route marker 3 to handleSortColumnRotation', () => {
      const spy = jest.spyOn(controller, 'handleSortColumnRotation');
      controller.handleMarkerRotation(3, 45);
      expect(spy).toHaveBeenCalledWith(45);
    });

    test('should route marker 4 to handleSortOrderRotation', () => {
      const spy = jest.spyOn(controller, 'handleSortOrderRotation');
      controller.handleMarkerRotation(4, 270);
      expect(spy).toHaveBeenCalledWith(270);
    });

    test('should route marker 5 to handleFilterCategoryRotation', () => {
      const spy = jest.spyOn(controller, 'handleFilterCategoryRotation');
      controller.handleMarkerRotation(5, 120);
      expect(spy).toHaveBeenCalledWith(120);
    });

    test('should route marker 6 to handleChartTypeRotation', () => {
      const spy = jest.spyOn(controller, 'handleChartTypeRotation');
      controller.handleMarkerRotation(6, 200);
      expect(spy).toHaveBeenCalledWith(200);
    });

    test('should log warning for unhandled markers', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      controller.handleMarkerRotation(7, 90);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Unhandled marker 7'));
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Debounce utility', () => {
    test('should debounce function calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = controller.debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();

      setTimeout(() => {
        // Should be called once after delay
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });

    test('should reset timer on subsequent calls', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = controller.debounce(mockFn, 100);

      debouncedFn();
      setTimeout(() => debouncedFn(), 50);
      setTimeout(() => debouncedFn(), 100);

      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 250);
    });
  });

  describe('State Change Events', () => {
    test('should dispatch state change event with correct detail', () => {
      // Clear previous calls from initialization
      global.window.dispatchEvent.mockClear();

      controller.currentXColumn = 'age';
      controller.currentYColumn = 'score';
      controller.currentChartType = 'line';
      controller.dispatchStateChange();

      expect(global.window.dispatchEvent).toHaveBeenCalled();
      const event = global.window.dispatchEvent.mock.calls[0][0];
      expect(event.type).toBe('markerInteractionStateChange');
      expect(event.detail.xColumn).toBe('age');
      expect(event.detail.yColumn).toBe('score');
      expect(event.detail.chartType).toBe('line');
    });

    test('should include all state fields in event detail', () => {
      controller.dispatchStateChange();

      const event = global.window.dispatchEvent.mock.calls[0][0];
      expect(event.detail).toHaveProperty('xColumn');
      expect(event.detail).toHaveProperty('yColumn');
      expect(event.detail).toHaveProperty('sortColumn');
      expect(event.detail).toHaveProperty('sortOrder');
      expect(event.detail).toHaveProperty('chartType');
      expect(event.detail).toHaveProperty('filterColumn');
      expect(event.detail).toHaveProperty('filterValue');
      expect(event.detail).toHaveProperty('availableColumns');
    });
  });

  describe('CSV Data Change Event', () => {
    test('should refresh columns on csvDataChanged event', () => {
      const refreshSpy = jest.spyOn(controller, 'refreshAvailableColumns');

      // Find the csvDataChanged listener
      const listeners = global.window.addEventListener.mock.calls;
      const csvListener = listeners.find(call => call[0] === 'csvDataChanged');

      expect(csvListener).toBeDefined();

      // Simulate event
      csvListener[1]();

      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('Placeholder Handlers (Phase 0)', () => {
    test('handleXAxisRotation should be defined', () => {
      expect(controller.handleXAxisRotation).toBeDefined();
      expect(() => controller.handleXAxisRotation(90)).not.toThrow();
    });

    test('handleYAxisRotation should be defined', () => {
      expect(controller.handleYAxisRotation).toBeDefined();
      expect(() => controller.handleYAxisRotation(90)).not.toThrow();
    });

    test('handleSortColumnRotation should be defined', () => {
      expect(controller.handleSortColumnRotation).toBeDefined();
      expect(() => controller.handleSortColumnRotation(90)).not.toThrow();
    });

    test('handleSortOrderRotation should be defined', () => {
      expect(controller.handleSortOrderRotation).toBeDefined();
      expect(() => controller.handleSortOrderRotation(90)).not.toThrow();
    });

    test('handleFilterCategoryRotation should be defined', () => {
      expect(controller.handleFilterCategoryRotation).toBeDefined();
      expect(() => controller.handleFilterCategoryRotation(90)).not.toThrow();
    });

    test('handleChartTypeRotation should be defined', () => {
      expect(controller.handleChartTypeRotation).toBeDefined();
      expect(() => controller.handleChartTypeRotation(90)).not.toThrow();
    });

    test('updateChart should log placeholder message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      controller.updateChart();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('placeholder'));
      consoleSpy.mockRestore();
    });

    test('applySorting should log placeholder message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      controller.applySorting();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('placeholder'));
      consoleSpy.mockRestore();
    });

    test('applyFilter should log placeholder message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      controller.applyFilter();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('placeholder'));
      consoleSpy.mockRestore();
    });
  });
});
