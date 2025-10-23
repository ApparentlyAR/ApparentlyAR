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
  let originalWindow;

  beforeEach(() => {
    const baseData = [
      { name: 'Charlie', age: 17, score: 88 },
      { name: 'Alice', age: 15, score: 95 },
      { name: 'Bob', age: 16, score: 90 }
    ];

    // Mock ChartManager
    mockChartManager = {
      updateMarkerChartWithConfig: jest.fn(),
      getCurrentData: jest.fn(() => [{ name: 'Alice', age: 15, score: 92 }]),
      updateMarkerChartFromControls: jest.fn(),
      loadCustomData: jest.fn(),
      regenerateMarkerChart: jest.fn(),
      setSortConfig: jest.fn()
    };

    // Mock window services
    originalWindow = global.window;
    global.window = {
      BlocklyAutofill: {
        getAvailableColumns: jest.fn(() => ['name', 'age', 'score'])
      },
      AppApi: {
        processData: jest.fn(() => Promise.resolve({ data: baseData.slice() }))
      },
      Blockly: {
        CsvImportData: {
          originalData: baseData.slice(),
          data: baseData.slice()
        }
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

    if (typeof controller.clearPendingDebounces === 'function') {
      controller.clearPendingDebounces();
    }

    jest.useFakeTimers();
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
    jest.useRealTimers();

    if (originalWindow) {
      global.window = originalWindow;
      originalWindow = undefined;
    }
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
      const chartManagerNoData = {
        updateMarkerChartWithConfig: jest.fn(),
        getCurrentData: jest.fn(() => []),
        updateMarkerChartFromControls: jest.fn(),
        loadCustomData: jest.fn(),
        regenerateMarkerChart: jest.fn()
      };
      const emptyController = new MarkerInteractionController(chartManagerNoData);
      expect(emptyController.availableColumns).toEqual([]);
      expect(emptyController.currentXColumn).toBe(null);
      expect(emptyController.currentYColumn).toBe(null);
    });

    test('should handle missing BlocklyAutofill', () => {
      delete global.window.BlocklyAutofill;
      const noAutofillController = new MarkerInteractionController(mockChartManager);
      expect(noAutofillController.availableColumns).toEqual(['name', 'age', 'score']);
    });

    test('should fallback to chart data when autofill is empty but data exists', () => {
      global.window.BlocklyAutofill = {
        getAvailableColumns: jest.fn(() => [])
      };
      const fallbackController = new MarkerInteractionController(mockChartManager);
      expect(fallbackController.availableColumns).toEqual(['name', 'age', 'score']);
      expect(fallbackController.currentXColumn).toBe('name');
      expect(fallbackController.currentYColumn).toBe('age');
    });
  });

  describe('refreshAvailableColumns', () => {
    test('should refresh columns from BlocklyAutofill', () => {
      global.window.BlocklyAutofill.getAvailableColumns.mockReturnValue(['a', 'b', 'c', 'd']);
      controller.refreshAvailableColumns();

      expect(controller.availableColumns).toEqual(['a', 'b', 'c', 'd']);
    });

    test('should fallback to chart data when autofill returns empty', () => {
      global.window.BlocklyAutofill.getAvailableColumns.mockReturnValue([]);
      controller.refreshAvailableColumns();
      expect(controller.availableColumns).toEqual(['name', 'age', 'score']);
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

  describe('handleXAxisRotation (Phase 3)', () => {
    test('should update X column and trigger chart refresh when entering new sector', () => {
      jest.useFakeTimers();

      controller.availableColumns = ['name', 'age', 'score', 'grade'];
      controller.currentXColumn = 'name';

      const updateSpy = jest.spyOn(controller, 'updateChart').mockResolvedValue();

      try {
        controller.handleXAxisRotation(135); // Sector 1 (age)

        expect(controller.currentXColumn).toBe('age');

        jest.runAllTimers();
        expect(updateSpy).toHaveBeenCalled();
      } finally {
        updateSpy.mockRestore();
        jest.useRealTimers();
      }
    });

    test('should apply hysteresis near sector boundaries to prevent jitter', () => {
      jest.useFakeTimers();

      controller.availableColumns = ['name', 'age', 'score', 'grade'];
      controller.currentXColumn = 'name';

      controller.handleXAxisRotation(100); // Move to 'age'
      jest.runAllTimers();

      const updateSpy = jest.spyOn(controller, 'updateChart').mockResolvedValue();

      try {
        controller.handleXAxisRotation(181); // 1° into next sector

        expect(controller.currentXColumn).toBe('age');

        jest.runAllTimers();
        expect(updateSpy).not.toHaveBeenCalled();
      } finally {
        updateSpy.mockRestore();
        jest.useRealTimers();
      }
    });

    test('should change to next column once past hysteresis window', () => {
      jest.useFakeTimers();

      controller.availableColumns = ['name', 'age', 'score', 'grade'];
      controller.currentXColumn = 'name';

      controller.handleXAxisRotation(100); // Set to 'age'
      jest.runAllTimers();

      const updateSpy = jest.spyOn(controller, 'updateChart').mockResolvedValue();

      try {
        controller.handleXAxisRotation(205); // Deep into next sector ('score')

        expect(controller.currentXColumn).toBe('score');

        jest.runAllTimers();
        expect(updateSpy).toHaveBeenCalled();
      } finally {
        updateSpy.mockRestore();
        jest.useRealTimers();
      }
    });
  });

  describe('handleYAxisRotation (Phase 4)', () => {
    test('should update Y column and trigger chart refresh when entering new sector', () => {
      jest.useFakeTimers();

      controller.availableColumns = ['name', 'age', 'score', 'grade'];
      controller.currentYColumn = 'age';

      const updateSpy = jest.spyOn(controller, 'updateChart').mockResolvedValue();

      try {
        controller.handleYAxisRotation(225); // Sector 2 (score)

        expect(controller.currentYColumn).toBe('score');

        jest.runAllTimers();
        expect(updateSpy).toHaveBeenCalled();
      } finally {
        updateSpy.mockRestore();
        jest.useRealTimers();
      }
    });

    test('should honor hysteresis at sector boundaries', () => {
      jest.useFakeTimers();

      controller.availableColumns = ['name', 'age', 'score', 'grade'];
      controller.currentYColumn = 'age';

      controller.handleYAxisRotation(225); // Move to 'score'
      jest.runAllTimers();

      const updateSpy = jest.spyOn(controller, 'updateChart').mockResolvedValue();

      try {
        controller.handleYAxisRotation(272); // 2° inside next sector (within hysteresis)

        expect(controller.currentYColumn).toBe('score');

        jest.runAllTimers();
        expect(updateSpy).not.toHaveBeenCalled();
      } finally {
        updateSpy.mockRestore();
        jest.useRealTimers();
      }
    });

    test('should change to next column after exiting hysteresis window', () => {
      jest.useFakeTimers();

      controller.availableColumns = ['name', 'age', 'score', 'grade'];
      controller.currentYColumn = 'age';

      controller.handleYAxisRotation(225); // Move to 'score'
      jest.runAllTimers();

      const updateSpy = jest.spyOn(controller, 'updateChart').mockResolvedValue();

      try {
        controller.handleYAxisRotation(340); // Deep into 'grade'

        expect(controller.currentYColumn).toBe('grade');

        jest.runAllTimers();
        expect(updateSpy).toHaveBeenCalled();
      } finally {
        updateSpy.mockRestore();
        jest.useRealTimers();
      }
    });

    test('should handle datasets with two columns', () => {
      jest.useFakeTimers();

      controller.availableColumns = ['x', 'y'];
      controller.currentYColumn = 'x';

      const updateSpy = jest.spyOn(controller, 'updateChart').mockResolvedValue();

      try {
        controller.handleYAxisRotation(270); // Second sector -> 'y'

        expect(controller.currentYColumn).toBe('y');

        jest.runAllTimers();
        expect(updateSpy).toHaveBeenCalled();
      } finally {
        updateSpy.mockRestore();
        jest.useRealTimers();
      }
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

    test('should route marker 7 to handleReservedMarkerRotation', () => {
      const spy = jest.spyOn(controller, 'handleReservedMarkerRotation');
      controller.handleMarkerRotation(7, 45);
      expect(spy).toHaveBeenCalledWith(45);
    });

    test('should log warning for unhandled markers', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      controller.handleMarkerRotation(8, 90);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Unhandled marker 8'));
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
      expect(event.detail.availableColumns).toEqual(['name', 'age', 'score']);
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

    test('should update state snapshot after csvDataChanged', () => {
      global.window.BlocklyAutofill.getAvailableColumns.mockReturnValue(['letter', 'number']);
      const listeners = global.window.addEventListener.mock.calls;
      const csvListener = listeners.find(call => call[0] === 'csvDataChanged');

      csvListener[1]();

      const snapshot = controller.getStateSnapshot();
      expect(snapshot.availableColumns).toEqual(['letter', 'number']);
      expect(snapshot.xColumn).toBe('letter');
      expect(snapshot.yColumn).toBe('number');
    });
  });

  describe('Base Handlers', () => {
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
    test('handleReservedMarkerRotation should be defined', () => {
      expect(controller.handleReservedMarkerRotation).toBeDefined();
      expect(() => controller.handleReservedMarkerRotation(90)).not.toThrow();
    });

    test('handleSortOrderRotation switches to ascending within active range', () => {
      jest.useFakeTimers();
      const sortSpy = jest.spyOn(controller, 'applySorting').mockResolvedValue();

      controller.currentSortOrder = 'descending';
      controller.handleSortOrderRotation(90);

      expect(controller.currentSortOrder).toBe('ascending');
      jest.advanceTimersByTime(600);
      expect(sortSpy).toHaveBeenCalled();

      sortSpy.mockRestore();
      jest.useRealTimers();
    });

    test('handleSortOrderRotation switches to descending within active range', () => {
      jest.useFakeTimers();
      const sortSpy = jest.spyOn(controller, 'applySorting').mockResolvedValue();

      controller.currentSortOrder = 'ascending';
      controller.handleSortOrderRotation(220);

      expect(controller.currentSortOrder).toBe('descending');
      jest.advanceTimersByTime(600);
      expect(sortSpy).toHaveBeenCalled();

      sortSpy.mockRestore();
      jest.useRealTimers();
    });

    test('handleSortOrderRotation respects buffer zones', () => {
      jest.useFakeTimers();
      const sortSpy = jest.spyOn(controller, 'applySorting').mockResolvedValue();

      controller.currentSortOrder = 'ascending';
      controller.handleSortOrderRotation(185); // Within 170°-190° buffer

      expect(controller.currentSortOrder).toBe('ascending');
      jest.advanceTimersByTime(600);
      expect(sortSpy).not.toHaveBeenCalled();

      sortSpy.mockRestore();
      jest.useRealTimers();
    });

    test('updateChart should delegate to chart manager', async () => {
      await controller.updateChart();
      expect(mockChartManager.updateMarkerChartWithConfig).toHaveBeenCalledWith(
        'marker-0',
        expect.objectContaining({
          chartType: expect.any(String),
          xColumn: expect.any(String),
          yColumn: expect.any(String)
        })
      );
    });

    test('applySorting should call backend sort and refresh chart', async () => {
      const unsorted = [
        { name: 'Charlie', age: 17, score: 70 },
        { name: 'Alice', age: 15, score: 95 }
      ];
      const sorted = [
        { name: 'Alice', age: 15, score: 95 },
        { name: 'Charlie', age: 17, score: 70 }
      ];

      global.window.Blockly.CsvImportData.originalData = unsorted;
      global.window.AppApi.processData = jest.fn(() => Promise.resolve({ data: sorted }));

      controller.currentSortColumn = 'name';
      controller.currentSortOrder = 'ascending';

      await controller.applySorting();

      expect(global.window.AppApi.processData).toHaveBeenCalledWith(
        unsorted,
        expect.arrayContaining([
          expect.objectContaining({
            type: 'sort',
            params: expect.objectContaining({ column: 'name', order: 'ascending' })
          })
        ])
      );
      expect(mockChartManager.loadCustomData).toHaveBeenCalledWith(sorted, expect.stringContaining('sorted_name_ascending'));
      expect(mockChartManager.setSortConfig).toHaveBeenCalledWith(null, 'ascending');
      expect(mockChartManager.updateMarkerChartWithConfig).toHaveBeenCalled();
      expect(global.window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
        type: 'markerDataSorted',
        detail: expect.objectContaining({ column: 'name', order: 'ascending', rowCount: sorted.length })
      }));
    });

    test('applyFilter should log placeholder message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      controller.applyFilter();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('placeholder'));
      consoleSpy.mockRestore();
    });
  });
});
