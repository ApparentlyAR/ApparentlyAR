/**
 * Hybrid AR Controller Module Tests
 * 
 * Tests for the main controller that orchestrates AR.js marker detection
 * with MediaPipe hand tracking for educational data visualization.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

// Mock all dependencies
const mockCoordinateSystem = {
  constructor: jest.fn()
};

const mockGestureDetector = {
  constructor: jest.fn(),
  reset: jest.fn()
};

const mockChartManager = {
  constructor: jest.fn(),
  setChartLimit: jest.fn(),
  clearHandCharts: jest.fn(),
  chartLimitEnabled: false,
  maxCharts: 5,
  limitBehavior: 'block'
};

const mockHandTracking = {
  constructor: jest.fn(),
  initialize: jest.fn().mockResolvedValue(undefined),
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn()
};

// Mock global classes
global.CoordinateSystem = jest.fn().mockImplementation(() => mockCoordinateSystem);
global.GestureDetector = jest.fn().mockImplementation(() => mockGestureDetector);
global.ChartManager = jest.fn().mockImplementation(() => mockChartManager);
global.HandTracking = jest.fn().mockImplementation(() => mockHandTracking);

// Mock DOM elements
const mockVideo = {
  videoWidth: 640,
  videoHeight: 480
};

const mockScene = {
  hasLoaded: true
};

const mockStatusElement = {
  textContent: '',
  className: ''
};

const mockMarkerElement = {
  object3D: { visible: true }
};

const mockCheckbox = {
  checked: false,
  addEventListener: jest.fn()
};

const mockInput = {
  value: '5',
  addEventListener: jest.fn()
};

const mockSelect = {
  value: 'block',
  addEventListener: jest.fn()
};

const mockDiv = {
  style: { display: '' }
};

global.document = {
  querySelector: (selector) => {
    if (selector === 'video') return mockVideo;
    if (selector === 'a-scene') return mockScene;
    return null;
  },
  querySelectorAll: (selector) => {
    if (selector === 'a-marker') return [mockMarkerElement];
    if (selector === '.chart-item') return [];
    return [];
  },
  getElementById: (id) => {
    if (id === 'status' || id === 'marker-status') return mockStatusElement;
    if (id === 'enable-chart-limit') return mockCheckbox;
    if (id === 'limit-settings') return mockDiv;
    if (id === 'max-charts') return mockInput;
    if (id === 'limit-behavior') return mockSelect;
    if (id === 'start-hands' || id === 'stop-hands' || id === 'clear-charts') return { addEventListener: jest.fn() };
    return null;
  }
};

global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

global.window = {
  addEventListener: jest.fn(),
  selectChart: undefined,
  HybridARController: undefined
};

global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

global.setTimeout = jest.fn((fn, delay) => fn());
global.setInterval = jest.fn();

// Load the module
require('../../src/ar/hybrid-ar-controller.js');
const HybridARController = global.window.HybridARController;

describe('HybridARController', () => {
  let controller;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new HybridARController();
    jest.spyOn(controller, 'updateStatus');
  });

  describe('Constructor', () => {
    test('should initialize all subsystems', () => {
      expect(global.CoordinateSystem).toHaveBeenCalled();
      expect(global.GestureDetector).toHaveBeenCalled();
      expect(global.ChartManager).toHaveBeenCalledWith(mockCoordinateSystem);
      expect(global.HandTracking).toHaveBeenCalledWith(
        mockGestureDetector,
        mockChartManager,
        expect.any(Function)
      );
    });

    test('should bind methods correctly', () => {
      expect(controller.init).toBeDefined();
      expect(controller.startHandTracking).toBeDefined();
      expect(controller.stopHandTracking).toBeDefined();
      expect(controller.clearHandCharts).toBeDefined();
      expect(controller.selectChart).toBeDefined();
    });

    test('should make selectChart globally available', () => {
      expect(global.window.selectChart).toBe(controller.selectChart);
    });
  });

  describe('init', () => {
    test('should initialize system components successfully', async () => {
      await controller.init();

      expect(mockHandTracking.initialize).toHaveBeenCalled();
      expect(controller.updateStatus).toHaveBeenCalledWith(
        'Hybrid AR ready - markers active, start hand tracking when ready',
        'ready'
      );
    });

    test('should handle initialization errors', async () => {
      mockHandTracking.initialize.mockRejectedValue(new Error('Init failed'));
      
      await controller.init();

      expect(controller.updateStatus).toHaveBeenCalledWith(
        'Initialization failed: Init failed',
        'error'
      );
    });
  });

  describe('waitForArjsInit', () => {
    test('should resolve when AR.js is ready', async () => {
      global.document.querySelector = (selector) => {
        if (selector === 'video') return mockVideo;
        if (selector === 'a-scene') return mockScene;
        return null;
      };

      await expect(controller.waitForArjsInit(1000)).resolves.toBeUndefined();
    });

    test('should reject on timeout', async () => {
      global.document.querySelector = () => null;
      
      // Mock Date.now to simulate timeout
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        return callCount > 2 ? 1200 : 0; // First few calls return 0, then return > timeout
      });

      try {
        await expect(controller.waitForArjsInit(100)).rejects.toThrow(
          'Timeout waiting for AR.js initialization'
        );
      } finally {
        Date.now = originalDateNow;
      }
    });
  });

  describe('Hand Tracking Controls', () => {
    test('should start hand tracking', async () => {
      await controller.startHandTracking();
      expect(mockHandTracking.start).toHaveBeenCalled();
    });

    test('should stop hand tracking', () => {
      controller.stopHandTracking();
      expect(mockHandTracking.stop).toHaveBeenCalled();
    });

    test('should clear hand charts', () => {
      controller.clearHandCharts();
      expect(mockChartManager.clearHandCharts).toHaveBeenCalled();
      expect(mockGestureDetector.reset).toHaveBeenCalled();
    });
  });

  describe('Chart Limit Settings', () => {
    test('should load settings from localStorage', () => {
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'chartLimitEnabled') return 'true';
        if (key === 'maxCharts') return '10';
        if (key === 'limitBehavior') return 'replace';
        return null;
      });

      controller.loadChartLimitSettings();

      expect(mockChartManager.setChartLimit).toHaveBeenCalledWith(true, 10, 'replace');
    });

    test('should save settings to localStorage', () => {
      mockChartManager.chartLimitEnabled = true;
      mockChartManager.maxCharts = 8;
      mockChartManager.limitBehavior = 'replace';

      controller.saveChartLimitSettings();

      expect(global.localStorage.setItem).toHaveBeenCalledWith('chartLimitEnabled', 'true');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('maxCharts', '8');
      expect(global.localStorage.setItem).toHaveBeenCalledWith('limitBehavior', 'replace');
    });

    test('should handle localStorage errors gracefully', () => {
      global.localStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      controller.loadChartLimitSettings();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load chart limit settings from localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    test('should setup chart limit controls with event listeners', () => {
      controller.setupChartLimitControls();

      expect(mockCheckbox.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      expect(mockInput.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
      expect(mockSelect.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('UI Management', () => {
    test('should update status display', () => {
      controller.updateStatus('Test message', 'detecting');

      expect(mockStatusElement.textContent).toBe('Test message');
      expect(mockStatusElement.className).toBe('status detecting');
    });

    test('should select chart in UI', () => {
      const mockElement = { classList: { add: jest.fn() } };
      const mockOtherElements = [
        { classList: { remove: jest.fn() } },
        { classList: { remove: jest.fn() } }
      ];

      global.document.querySelectorAll = () => mockOtherElements;

      controller.selectChart('chart1', mockElement);

      mockOtherElements.forEach(el => {
        expect(el.classList.remove).toHaveBeenCalledWith('selected');
      });
      expect(mockElement.classList.add).toHaveBeenCalledWith('selected');
    });
  });

  describe('Marker Monitoring', () => {
    test('should detect visible markers', () => {
      const markers = [
        { object3D: { visible: true } },
        { object3D: { visible: false } },
        { object3D: { visible: true } }
      ];

      global.document.querySelectorAll = () => markers;

      controller.monitorMarkers();

      expect(mockStatusElement.textContent).toBe('2 marker(s) detected');
      expect(mockStatusElement.className).toBe('status detecting');
    });

    test('should show ready state when no markers visible', () => {
      const markers = [
        { object3D: { visible: false } }
      ];

      global.document.querySelectorAll = () => markers;

      controller.monitorMarkers();

      expect(mockStatusElement.textContent).toBe('Ready for markers');
      expect(mockStatusElement.className).toBe('status ready');
    });

    test('should handle missing markers gracefully', () => {
      global.document.querySelectorAll = () => [];

      expect(() => controller.monitorMarkers()).not.toThrow();
    });
  });

  describe('Event Listeners Setup', () => {
    test('should setup all required event listeners', () => {
      const mockButtons = {
        'start-hands': { addEventListener: jest.fn() },
        'stop-hands': { addEventListener: jest.fn() },
        'clear-charts': { addEventListener: jest.fn() }
      };

      global.document.getElementById = (id) => mockButtons[id] || null;

      controller.setupEventListeners();

      Object.values(mockButtons).forEach(button => {
        expect(button.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      });
      expect(global.setInterval).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete initialization workflow', async () => {
      // Mock waitForArjsInit to resolve immediately
      jest.spyOn(controller, 'waitForArjsInit').mockResolvedValue();
      
      await controller.init();

      expect(mockHandTracking.initialize).toHaveBeenCalled();
    });

    test('should coordinate between subsystems correctly', () => {
      controller.clearHandCharts();
      
      expect(mockChartManager.clearHandCharts).toHaveBeenCalled();
      expect(mockGestureDetector.reset).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle subsystem initialization failures', async () => {
      // Mock waitForArjsInit to resolve successfully
      jest.spyOn(controller, 'waitForArjsInit').mockResolvedValue();
      mockHandTracking.initialize.mockRejectedValue(new Error('MediaPipe failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await controller.init();

      expect(consoleSpy).toHaveBeenCalledWith('Initialization error:', expect.any(Error));
      expect(controller.updateStatus).toHaveBeenCalledWith(
        'Initialization failed: MediaPipe failed',
        'error'
      );
      
      consoleSpy.mockRestore();
    });

    test('should handle missing DOM elements gracefully', () => {
      global.document.getElementById = () => null;
      global.document.querySelector = () => null;

      expect(() => {
        controller.updateStatus('test', 'ready');
        controller.monitorMarkers();
        controller.loadChartLimitSettings();
      }).not.toThrow();
    });
  });
});