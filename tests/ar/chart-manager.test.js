/**
 * Chart Manager Module Tests
 * 
 * Tests for AR chart creation, manipulation, and lifecycle management
 * including Chart.js integration and A-Frame entity management.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

// Mock Chart.js with simpler implementation
const mockChart = {
  destroy: jest.fn()
};

global.Chart = jest.fn(() => mockChart);

// Mock DOM elements
const mockCanvas = {
  width: 400,
  height: 300,
  id: '',
  getContext: () => ({
    clearRect: jest.fn()
  }),
  remove: jest.fn()
};

const mockEntity = {
  setAttribute: jest.fn(),
  remove: jest.fn()
};

const mockAssets = {
  appendChild: jest.fn()
};

const mockHandChartsContainer = {
  appendChild: jest.fn()
};

const mockChartList = {
  firstChild: null,
  removeChild: jest.fn((child) => {
    // Simulate actual DOM behavior - removing a child sets firstChild to null
    if (mockChartList.firstChild === child) {
      mockChartList.firstChild = null;
    }
  }),
  appendChild: jest.fn()
};

const mockChartCount = {
  textContent: '',
  style: { color: '' }
};

// Mock DOM manipulation
global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') return { ...mockCanvas };
    if (tag === 'a-plane') return { ...mockEntity };
    if (tag === 'div') return { className: '', textContent: '', onclick: null };
    return {};
  },
  getElementById: (id) => {
    if (id === 'chart-type') return { value: 'bar' };
    if (id === 'sample-data') return { value: 'students' };
    if (id === 'hand-charts') return mockHandChartsContainer;
    if (id === 'chart-list') return mockChartList;
    if (id === 'chart-count') return mockChartCount;
    if (id === 'hand-overlay') return mockCanvas;
    return null;
  },
  querySelector: () => mockAssets
};

global.selectChart = jest.fn();
global.Date = { now: () => 1234567890 };
global.window = { ChartManager: undefined, selectChart: global.selectChart };

// Mock coordinate system
const mockCoordinateSystem = {
  screenToWorld: jest.fn().mockReturnValue('1 2 -3')
};

// Load the module
require('../../src/ar/chart-manager.js');
const ChartManager = global.window.ChartManager;

describe('ChartManager', () => {
  let chartManager;
  let consoleSpy;

  beforeAll(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    chartManager = new ChartManager(mockCoordinateSystem);
    
    // Reset mock state after creating chartManager
    mockChartCount.textContent = '';
    mockChartCount.style.color = '';
    mockChartList.firstChild = null;
  });

  afterEach(() => {
    // Clean up chart manager to prevent memory leaks
    if (chartManager) {
      // Properly destroy any created charts
      chartManager.handCharts.forEach(chart => {
        if (chart.chart && chart.chart.destroy) {
          chart.chart.destroy();
        }
        if (chart.canvas) {
          chart.canvas.remove();
        }
        if (chart.entity && chart.entity.remove) {
          chart.entity.remove();
        }
      });
      chartManager.handCharts = [];
      chartManager = null;
    }
    jest.clearAllMocks();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(chartManager.handCharts).toEqual([]);
      expect(chartManager.lastPlacedAt).toBe(0);
      expect(chartManager.PLACE_COOLDOWN_MS).toBe(1000);
      expect(chartManager.chartLimitEnabled).toBe(false);
      expect(chartManager.maxCharts).toBe(5);
      expect(chartManager.limitBehavior).toBe('block');
      expect(chartManager.coordinateSystem).toBe(mockCoordinateSystem);
    });

    test('should have sample datasets', () => {
      expect(chartManager.sampleData.students).toBeDefined();
      expect(chartManager.sampleData.weather).toBeDefined();
      expect(chartManager.sampleData.sales).toBeDefined();
      expect(Array.isArray(chartManager.sampleData.students)).toBe(true);
    });
  });

  describe('createChart', () => {
    test('should create chart with proper A-Frame entity', () => {
      chartManager.createChart(100, 200);

      expect(global.Chart).toHaveBeenCalled();
      expect(mockAssets.appendChild).toHaveBeenCalled();
      expect(mockHandChartsContainer.appendChild).toHaveBeenCalled();
      expect(mockCoordinateSystem.screenToWorld).toHaveBeenCalledWith(100, 200);
      expect(chartManager.handCharts).toHaveLength(1);
    });

    test('should assign unique IDs to charts', () => {
      global.Date.now = () => 1111111111;
      chartManager.createChart(100, 200);
      
      global.Date.now = () => 2222222222;
      chartManager.createChart(300, 400);

      expect(chartManager.handCharts).toHaveLength(2);
      expect(chartManager.handCharts[0].id).toBe('hand-chart-1111111111');
      expect(chartManager.handCharts[1].id).toBe('hand-chart-2222222222');
    });

    test('should store chart metadata correctly', () => {
      const originalGetElementById = global.document.getElementById;
      
      global.document.getElementById = (id) => {
        if (id === 'chart-type') return { value: 'pie' };
        if (id === 'sample-data') return { value: 'weather' };
        if (id === 'hand-charts') return mockHandChartsContainer;
        return mockChartList;
      };

      chartManager.createChart(150, 250);

      const chart = chartManager.handCharts[0];
      expect(chart.type).toBe('pie');
      expect(chart.dataset).toBe('weather');
      expect(chart.screenX).toBe(150);
      expect(chart.screenY).toBe(250);
      
      // Restore original function
      global.document.getElementById = originalGetElementById;
    });
  });

  describe('placeChartAtHand', () => {
    test('should respect cooldown period', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      landmarks[9] = { x: 0.5, y: 0.5, z: 0 };

      const mockUpdateStatus = jest.fn();
      chartManager.lastPlacedAt = Date.now();

      chartManager.placeChartAtHand(landmarks, mockUpdateStatus);

      expect(chartManager.handCharts).toHaveLength(0);
    });

    test('should place chart when cooldown expired', () => {
      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      landmarks[9] = { x: 0.5, y: 0.5, z: 0 };

      const mockUpdateStatus = jest.fn();
      chartManager.lastPlacedAt = Date.now() - 2000; // 2 seconds ago

      chartManager.placeChartAtHand(landmarks, mockUpdateStatus);

      expect(chartManager.handCharts).toHaveLength(1);
    });

    test('should block placement when limit reached', () => {
      jest.useFakeTimers();
      
      chartManager.chartLimitEnabled = true;
      chartManager.maxCharts = 2;
      chartManager.limitBehavior = 'block';
      chartManager.handCharts = [{ id: 'chart1' }, { id: 'chart2' }];

      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      const mockUpdateStatus = jest.fn();
      chartManager.lastPlacedAt = 0;

      chartManager.placeChartAtHand(landmarks, mockUpdateStatus);

      expect(chartManager.handCharts).toHaveLength(2);
      expect(mockUpdateStatus).toHaveBeenCalledWith('Chart limit reached (2/2)', 'error');
      
      jest.useRealTimers();
    });

    test('should replace oldest chart when limit reached with replace behavior', () => {
      chartManager.chartLimitEnabled = true;
      chartManager.maxCharts = 1;
      chartManager.limitBehavior = 'replace';
      
      const oldChart = {
        entity: { remove: jest.fn() },
        canvas: { remove: jest.fn() },
        chart: { destroy: jest.fn() }
      };
      chartManager.handCharts = [oldChart];

      const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
      const mockUpdateStatus = jest.fn();
      chartManager.lastPlacedAt = 0;

      chartManager.placeChartAtHand(landmarks, mockUpdateStatus);

      expect(oldChart.entity.remove).toHaveBeenCalled();
      expect(oldChart.chart.destroy).toHaveBeenCalled();
      expect(chartManager.handCharts).toHaveLength(1);
    });
  });

  describe('clearHandCharts', () => {
    test('should remove all charts and clean up resources', () => {
      const chart1 = {
        entity: { remove: jest.fn() },
        canvas: { remove: jest.fn() },
        chart: { destroy: jest.fn() }
      };
      const chart2 = {
        entity: { remove: jest.fn() },
        canvas: { remove: jest.fn() },
        chart: { destroy: jest.fn() }
      };

      chartManager.handCharts = [chart1, chart2];
      chartManager.clearHandCharts();

      expect(chart1.entity.remove).toHaveBeenCalled();
      expect(chart1.chart.destroy).toHaveBeenCalled();
      expect(chart2.entity.remove).toHaveBeenCalled();
      expect(chart2.chart.destroy).toHaveBeenCalled();
      expect(chartManager.handCharts).toHaveLength(0);
    });

    test('should handle empty chart array', () => {
      chartManager.handCharts = [];
      expect(() => chartManager.clearHandCharts()).not.toThrow();
    });
  });

  describe('generateChart', () => {
    test('should create Chart.js instance with proper configuration', () => {
      const result = chartManager.generateChart(mockCanvas, 'bar', chartManager.sampleData.students);

      expect(global.Chart).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          type: 'bar',
          data: expect.any(Object),
          options: expect.objectContaining({
            responsive: false,
            animation: false
          })
        })
      );
      expect(result).toBe(mockChart);
    });

    test('should configure different chart types correctly', () => {
      ['bar', 'line', 'pie', 'scatter'].forEach(chartType => {
        jest.clearAllMocks();
        chartManager.generateChart(mockCanvas, chartType, chartManager.sampleData.students);
        
        const chartConfig = global.Chart.mock.calls[0][1];
        expect(chartConfig.type).toBe(chartType);
      });
    });

    test('should handle different datasets', () => {
      ['students', 'weather', 'sales'].forEach(datasetName => {
        jest.clearAllMocks();
        chartManager.generateChart(mockCanvas, 'bar', chartManager.sampleData[datasetName]);
        
        const chartConfig = global.Chart.mock.calls[0][1];
        expect(chartConfig.data.labels).toBeDefined();
        expect(chartConfig.data.datasets).toBeDefined();
      });
    });
  });

  describe('Chart Limit Management', () => {
    test('should set chart limit parameters', () => {
      chartManager.setChartLimit(true, 10, 'replace');

      expect(chartManager.chartLimitEnabled).toBe(true);
      expect(chartManager.maxCharts).toBe(10);
      expect(chartManager.limitBehavior).toBe('replace');
    });

    test('should remove oldest chart correctly', () => {
      const oldChart = {
        entity: { remove: jest.fn() },
        canvas: { remove: jest.fn() },
        chart: { destroy: jest.fn() }
      };
      const newChart = {
        entity: { remove: jest.fn() },
        canvas: { remove: jest.fn() },
        chart: { destroy: jest.fn() }
      };

      chartManager.handCharts = [oldChart, newChart];
      chartManager.removeOldestChart();

      expect(oldChart.entity.remove).toHaveBeenCalled();
      expect(chartManager.handCharts).toHaveLength(1);
      expect(chartManager.handCharts[0]).toBe(newChart);
    });
  });

  describe('updateChartList', () => {
    beforeEach(() => {
      mockChartList.firstChild = { remove: jest.fn() };
    });

    test('should show empty message when no charts', () => {
      chartManager.handCharts = [];
      chartManager.updateChartList();

      expect(mockChartList.appendChild).toHaveBeenCalled();
    });

    test('should display chart items when charts exist', () => {
      chartManager.handCharts = [
        { type: 'bar', dataset: 'students', id: 'chart1' }
      ];
      
      chartManager.updateChartList();

      expect(mockChartList.appendChild).toHaveBeenCalled();
    });

    test('should update chart count with limit display', () => {
      chartManager.chartLimitEnabled = true;
      chartManager.maxCharts = 5;
      chartManager.handCharts = [
        { id: 'chart1', type: 'bar', dataset: 'students' }, 
        { id: 'chart2', type: 'line', dataset: 'weather' }
      ];

      // Verify the state before calling updateChartList
      expect(chartManager.chartLimitEnabled).toBe(true);
      expect(chartManager.maxCharts).toBe(5);
      expect(chartManager.handCharts.length).toBe(2);

      chartManager.updateChartList();

      expect(mockChartCount.textContent).toBe('2/5');
      expect(mockChartCount.style.color).toBe('#8ff0a4');
    });

    test('should show warning color when near limit', () => {
      chartManager.chartLimitEnabled = true;
      chartManager.maxCharts = 5;
      chartManager.handCharts = Array.from({ length: 4 }, (_, i) => ({ 
        id: `chart${i}`, 
        type: 'bar', 
        dataset: 'students' 
      }));

      chartManager.updateChartList();

      expect(mockChartCount.style.color).toBe('#ffce73');
    });

    test('should show error color when at limit', () => {
      chartManager.chartLimitEnabled = true;
      chartManager.maxCharts = 3;
      chartManager.handCharts = Array.from({ length: 3 }, (_, i) => ({ 
        id: `chart${i}`, 
        type: 'pie', 
        dataset: 'weather' 
      }));

      chartManager.updateChartList();

      expect(mockChartCount.style.color).toBe('#ff8a8a');
    });
  });

  describe('Utility Methods', () => {
    test('getChartCount should return correct count', () => {
      chartManager.handCharts = [{ id: '1' }, { id: '2' }];
      expect(chartManager.getChartCount()).toBe(2);
    });

    test('getCharts should return chart array', () => {
      const charts = [{ id: '1' }, { id: '2' }];
      chartManager.handCharts = charts;
      expect(chartManager.getCharts()).toBe(charts);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      const originalGetElementById = global.document.getElementById;
      const originalQuerySelector = global.document.querySelector;
      
      global.document.getElementById = () => null;
      global.document.querySelector = () => null;

      expect(() => {
        chartManager.createChart(100, 200);
      }).not.toThrow();
      
      // Restore original functions
      global.document.getElementById = originalGetElementById;
      global.document.querySelector = originalQuerySelector;
    });

    test('should handle chart destruction errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const faultyChart = {
        entity: { remove: jest.fn() },
        canvas: null, // Missing parent
        chart: { destroy: jest.fn().mockImplementation(() => { throw new Error('Test error'); }) }
      };

      chartManager.handCharts = [faultyChart];

      expect(() => chartManager.clearHandCharts()).not.toThrow();
      expect(chartManager.handCharts).toHaveLength(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Chart Generation Data Mapping', () => {
    test('should configure bar chart for students data', () => {
      chartManager.generateChart(mockCanvas, 'bar', chartManager.sampleData.students);
      
      const config = global.Chart.mock.calls[0][1];
      expect(config.data.labels).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
      expect(config.data.datasets[0].data).toEqual([85, 92, 78, 95, 88]);
    });

    test('should configure pie chart correctly', () => {
      chartManager.generateChart(mockCanvas, 'pie', chartManager.sampleData.students);
      
      const config = global.Chart.mock.calls[0][1];
      expect(config.data.datasets[0].backgroundColor).toBeDefined();
      expect(Array.isArray(config.data.datasets[0].backgroundColor)).toBe(true);
    });

    test('should configure scatter chart with x-y data', () => {
      chartManager.generateChart(mockCanvas, 'scatter', chartManager.sampleData.students);
      
      const config = global.Chart.mock.calls[0][1];
      expect(config.data.datasets[0].data).toBeDefined();
      expect(config.data.datasets[0].data[0]).toHaveProperty('x');
      expect(config.data.datasets[0].data[0]).toHaveProperty('y');
    });
  });
});