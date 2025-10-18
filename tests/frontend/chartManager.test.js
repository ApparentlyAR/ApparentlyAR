/**
 * ChartManager Phase 0 Tests
 *
 * Tests for AR control foundations: schema building, data pipeline,
 * cycling methods, and persistence.
 *
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

// Mock global objects and dependencies
global.Chart = class Chart {
  constructor() {}
  destroy() {}
  update() {}
  tooltip = {
    setActiveElements: () => {},
  };
};

global.document = {
  getElementById: (id) => {
    if (id === 'sample-data') {
      return { value: 'students' };
    }
    return null;
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ id: '', width: 0, height: 0, appendChild: () => {}, setAttribute: () => {}, parentNode: null }),
};

global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  clear() {
    this.data = {};
  }
};

// Mock window object for ChartManager export
global.window = {
  ChartManager: undefined
};

// Import ChartManager
const path = require('path');
const fs = require('fs');
const chartManagerPath = path.join(__dirname, '../../src/ar/chart-manager.js');
const chartManagerCode = fs.readFileSync(chartManagerPath, 'utf8');

// Execute the ChartManager code to define the class
eval(chartManagerCode);

// Extract ChartManager from window
const ChartManager = global.window.ChartManager;

// Mock CoordinateSystem dependency
class CoordinateSystem {
  screenToWorld() { return { x: 0, y: 0, z: 0 }; }
}

describe('ChartManager Phase 0: AR Control Foundations', () => {
  let chartManager;

  // Test data samples
  const mixedData = [
    { name: 'Alice', age: '25', score: 85, grade: 'A' },
    { name: 'Bob', age: 22, score: '92', grade: 'A' },
    { name: 'Charlie', age: null, score: 78, grade: 'B' },
    { name: 'Diana', age: 24, score: 95, grade: 'A' },
    { name: 'Eve', age: '', score: 88, grade: 'A' }
  ];

  const salesData = [
    { product: 'Laptop', sales: 120, revenue: 144000, region: 'North' },
    { product: 'Phone', sales: 200, revenue: 120000, region: 'North' },
    { product: 'Tablet', sales: 80, revenue: 64000, region: 'South' },
    { product: 'Laptop', sales: 150, revenue: 180000, region: 'South' },
    { product: 'Phone', sales: 180, revenue: 108000, region: 'East' }
  ];

  beforeEach(() => {
    const coordinateSystem = new CoordinateSystem();
    chartManager = new ChartManager(coordinateSystem);
    global.localStorage.clear();
  });

  describe('Schema Building', () => {
    test('classifyColumns should identify numeric and text columns correctly', () => {
      const schema = chartManager.classifyColumns(mixedData);

      expect(schema.columns).toEqual(['name', 'age', 'score', 'grade']);
      expect(schema.numericColumns).toContain('age');
      expect(schema.numericColumns).toContain('score');
      expect(schema.textColumns).toContain('name');
      expect(schema.textColumns).toContain('grade');
    });

    test('classifyColumns should build distinct values for text columns', () => {
      const schema = chartManager.classifyColumns(mixedData);

      expect(schema.valuesByTextCol.name).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
      expect(schema.valuesByTextCol.grade).toEqual(['A', 'B']);
    });

    test('classifyColumns should handle empty data', () => {
      const schema = chartManager.classifyColumns([]);

      expect(schema.columns).toEqual([]);
      expect(schema.numericColumns).toEqual([]);
      expect(schema.textColumns).toEqual([]);
      expect(schema.valuesByTextCol).toEqual({});
    });

    test('classifyColumns should handle null/undefined data', () => {
      const schema1 = chartManager.classifyColumns(null);
      const schema2 = chartManager.classifyColumns(undefined);

      expect(schema1.columns).toEqual([]);
      expect(schema2.columns).toEqual([]);
    });

    test('buildSchema should update schema property', () => {
      chartManager.sampleData.test = mixedData;
      chartManager.dataSource = 'sample';

      const schema = chartManager.buildSchema();

      expect(chartManager.schema).toBe(schema);
      expect(schema.columns.length).toBeGreaterThan(0);
    });
  });

  describe('Data Pipeline: Filtering', () => {
    beforeEach(() => {
      chartManager.schema = chartManager.classifyColumns(salesData);
    });

    test('getEffectiveData should filter by text column correctly', () => {
      // Set filter to region = 'North'
      chartManager.controls.filter.colIndex = chartManager.schema.textColumns.indexOf('region');
      chartManager.controls.filter.valIndex = chartManager.schema.valuesByTextCol.region.indexOf('North');

      const result = chartManager.getEffectiveData(salesData);

      expect(result.length).toBe(2);
      expect(result.every(row => row.region === 'North')).toBe(true);
    });

    test('getEffectiveData should return all data when filter is inactive', () => {
      chartManager.controls.filter.colIndex = -1;
      chartManager.controls.filter.valIndex = -1;

      const result = chartManager.getEffectiveData(salesData);

      expect(result.length).toBe(salesData.length);
    });

    test('getEffectiveData should handle invalid filter indices', () => {
      chartManager.controls.filter.colIndex = 999;
      chartManager.controls.filter.valIndex = 0;

      const result = chartManager.getEffectiveData(salesData);

      // Should not crash, should return all data
      expect(result.length).toBe(salesData.length);
    });
  });

  describe('Data Pipeline: Sorting', () => {
    beforeEach(() => {
      chartManager.schema = chartManager.classifyColumns(salesData);
    });

    test('getEffectiveData should sort ascending by numeric column', () => {
      // Sort by sales ascending
      chartManager.controls.sortIndex = chartManager.schema.numericColumns.indexOf('sales');
      chartManager.controls.sortDir = 'asc';

      const result = chartManager.getEffectiveData(salesData);

      expect(result[0].sales).toBe(80);  // Tablet
      expect(result[4].sales).toBe(200); // Phone
    });

    test('getEffectiveData should sort descending by numeric column', () => {
      // Sort by revenue descending
      chartManager.controls.sortIndex = chartManager.schema.numericColumns.indexOf('revenue');
      chartManager.controls.sortDir = 'desc';

      const result = chartManager.getEffectiveData(salesData);

      expect(result[0].revenue).toBe(180000);
      expect(result[4].revenue).toBe(64000);
    });

    test('getEffectiveData should handle number-as-string sorting', () => {
      const mixedNumericData = [
        { name: 'A', value: '100' },
        { name: 'B', value: 50 },
        { name: 'C', value: '200' },
        { name: 'D', value: 25 }
      ];

      chartManager.schema = chartManager.classifyColumns(mixedNumericData);
      chartManager.controls.sortIndex = 0; // First numeric column is 'value'
      chartManager.controls.sortDir = 'asc';

      const result = chartManager.getEffectiveData(mixedNumericData);

      expect(result[0].value).toBe(25);
      expect(result[1].value).toBe(50);
      expect(result[2].value).toBe('100');
      expect(result[3].value).toBe('200');
    });

    test('getEffectiveData should not sort when sortIndex is -1', () => {
      chartManager.controls.sortIndex = -1;

      const result = chartManager.getEffectiveData(salesData);

      // Should maintain original order
      expect(result[0].product).toBe('Laptop');
      expect(result[4].product).toBe('Phone');
    });
  });

  describe('Data Pipeline: Combined Filter and Sort', () => {
    beforeEach(() => {
      chartManager.schema = chartManager.classifyColumns(salesData);
    });

    test('getEffectiveData should apply filter then sort', () => {
      // Filter: region = 'North'
      chartManager.controls.filter.colIndex = chartManager.schema.textColumns.indexOf('region');
      chartManager.controls.filter.valIndex = chartManager.schema.valuesByTextCol.region.indexOf('North');

      // Sort: sales ascending
      chartManager.controls.sortIndex = chartManager.schema.numericColumns.indexOf('sales');
      chartManager.controls.sortDir = 'asc';

      const result = chartManager.getEffectiveData(salesData);

      expect(result.length).toBe(2);
      expect(result[0].sales).toBe(120); // Laptop (North)
      expect(result[1].sales).toBe(200); // Phone (North)
    });
  });

  describe('Axis Override', () => {
    beforeEach(() => {
      chartManager.schema = chartManager.classifyColumns(salesData);
    });

    test('currentAxisOverride should return correct column names', () => {
      chartManager.controls.xIndex = 0; // product
      chartManager.controls.yIndex = 1; // sales

      const override = chartManager.currentAxisOverride();

      expect(override.xColumn).toBe('product');
      expect(override.yColumn).toBe('sales');
    });

    test('currentAxisOverride should handle wrapping for large indices', () => {
      const columnCount = chartManager.schema.columns.length;
      chartManager.controls.xIndex = columnCount + 2;
      chartManager.controls.yIndex = columnCount * 3 + 1;

      const override = chartManager.currentAxisOverride();

      // Should wrap correctly
      expect(override.xColumn).toBe(chartManager.schema.columns[2]);
      expect(override.yColumn).toBe(chartManager.schema.columns[1]);
    });

    test('currentAxisOverride should handle negative indices', () => {
      chartManager.controls.xIndex = -1;
      chartManager.controls.yIndex = -2;

      const override = chartManager.currentAxisOverride();

      const columnCount = chartManager.schema.columns.length;
      expect(override.xColumn).toBe(chartManager.schema.columns[columnCount - 1]);
      expect(override.yColumn).toBe(chartManager.schema.columns[columnCount - 2]);
    });

    test('currentAxisOverride should return null if schema not available', () => {
      chartManager.schema = null;

      const override = chartManager.currentAxisOverride();

      expect(override).toBeNull();
    });
  });

  describe('Cycling Methods: Axes', () => {
    beforeEach(() => {
      chartManager.schema = chartManager.classifyColumns(salesData);
      chartManager.controls.xIndex = 0;
      chartManager.controls.yIndex = 1;
    });

    test('cycleX should increment xIndex', () => {
      const initialIndex = chartManager.controls.xIndex;
      chartManager.cycleX(1);

      expect(chartManager.controls.xIndex).toBe(initialIndex + 1);
    });

    test('cycleX should wrap around at end of columns', () => {
      const columnCount = chartManager.schema.columns.length;
      chartManager.controls.xIndex = columnCount - 1;

      chartManager.cycleX(1);

      expect(chartManager.controls.xIndex).toBe(0);
    });

    test('cycleX should handle negative steps', () => {
      chartManager.controls.xIndex = 0;
      chartManager.cycleX(-1);

      const columnCount = chartManager.schema.columns.length;
      expect(chartManager.controls.xIndex).toBe(columnCount - 1);
    });

    test('cycleY should work similarly to cycleX', () => {
      chartManager.controls.yIndex = 0;
      chartManager.cycleY(2);

      expect(chartManager.controls.yIndex).toBe(2);
    });
  });

  describe('Cycling Methods: Sort', () => {
    beforeEach(() => {
      chartManager.schema = chartManager.classifyColumns(salesData);
      chartManager.controls.sortIndex = -1; // Start at "none"
    });

    test('cycleSort should cycle through numeric columns', () => {
      chartManager.cycleSort(1);

      // Should be at first numeric column
      expect(chartManager.controls.sortIndex).toBe(0);

      chartManager.cycleSort(1);
      expect(chartManager.controls.sortIndex).toBe(1);
    });

    test('cycleSort should wrap to "none" after last numeric column', () => {
      const numericCount = chartManager.schema.numericColumns.length;

      // Cycle to last numeric column
      for (let i = 0; i < numericCount; i++) {
        chartManager.cycleSort(1);
      }

      expect(chartManager.controls.sortIndex).toBe(numericCount - 1);

      // One more should wrap to "none"
      chartManager.cycleSort(1);
      expect(chartManager.controls.sortIndex).toBe(-1);
    });

    test('cycleSort should handle negative steps', () => {
      chartManager.controls.sortIndex = 0;
      chartManager.cycleSort(-1);

      expect(chartManager.controls.sortIndex).toBe(-1); // Back to "none"
    });

    test('toggleSortDir should toggle between asc and desc', () => {
      expect(chartManager.controls.sortDir).toBe('asc');

      chartManager.toggleSortDir();
      expect(chartManager.controls.sortDir).toBe('desc');

      chartManager.toggleSortDir();
      expect(chartManager.controls.sortDir).toBe('asc');
    });

    test('clearSort should set sortIndex to -1', () => {
      chartManager.controls.sortIndex = 2;
      chartManager.clearSort();

      expect(chartManager.controls.sortIndex).toBe(-1);
    });
  });

  describe('Cycling Methods: Filter', () => {
    beforeEach(() => {
      chartManager.schema = chartManager.classifyColumns(salesData);
      chartManager.controls.filter.colIndex = -1;
      chartManager.controls.filter.valIndex = -1;
    });

    test('cycleFilterColumn should activate first text column', () => {
      chartManager.cycleFilterColumn(1);

      expect(chartManager.controls.filter.colIndex).toBe(0);
      expect(chartManager.controls.filter.valIndex).toBe(-1); // Value not set yet
    });

    test('cycleFilterColumn should cycle through text columns', () => {
      chartManager.cycleFilterColumn(1);
      expect(chartManager.controls.filter.colIndex).toBe(0);

      chartManager.cycleFilterColumn(1);
      expect(chartManager.controls.filter.colIndex).toBe(1);
    });

    test('cycleFilterColumn should wrap around', () => {
      const textColumnCount = chartManager.schema.textColumns.length;

      // Cycle through all text columns and wrap back
      // Starting from -1, first call goes to 0, then we need textColumnCount more to wrap
      for (let i = 0; i <= textColumnCount; i++) {
        chartManager.cycleFilterColumn(1);
      }

      expect(chartManager.controls.filter.colIndex).toBe(0); // Wrapped back to first
    });

    test('cycleFilterValue should activate first value', () => {
      // First select a filter column
      chartManager.cycleFilterColumn(1);

      // Then cycle value
      chartManager.cycleFilterValue(1);

      expect(chartManager.controls.filter.valIndex).toBe(0);
    });

    test('cycleFilterValue should cycle through distinct values', () => {
      // Select region column (has values: 'East', 'North', 'South')
      chartManager.controls.filter.colIndex = chartManager.schema.textColumns.indexOf('region');

      chartManager.cycleFilterValue(1);
      expect(chartManager.controls.filter.valIndex).toBe(0);

      chartManager.cycleFilterValue(1);
      expect(chartManager.controls.filter.valIndex).toBe(1);

      chartManager.cycleFilterValue(1);
      expect(chartManager.controls.filter.valIndex).toBe(2);
    });

    test('cycleFilterValue should wrap around', () => {
      chartManager.controls.filter.colIndex = chartManager.schema.textColumns.indexOf('region');
      const valueCount = chartManager.schema.valuesByTextCol.region.length;

      // Cycle through all values and wrap back
      // Starting from -1, first call goes to 0, then we need valueCount more to wrap
      for (let i = 0; i <= valueCount; i++) {
        chartManager.cycleFilterValue(1);
      }

      // Should wrap to first value
      expect(chartManager.controls.filter.valIndex).toBe(0);
    });

    test('clearFilter should reset filter indices', () => {
      chartManager.controls.filter.colIndex = 1;
      chartManager.controls.filter.valIndex = 2;

      chartManager.clearFilter();

      expect(chartManager.controls.filter.colIndex).toBe(-1);
      expect(chartManager.controls.filter.valIndex).toBe(-1);
    });
  });

  describe('Cycling Methods: Chart Type', () => {
    test('cycleChartType should cycle through types', () => {
      const types = ['bar', 'line', 'scatter', 'pie', 'area'];

      chartManager.controls.chartType = 'bar';
      chartManager.cycleChartType(1);
      expect(chartManager.controls.chartType).toBe('line');

      chartManager.cycleChartType(1);
      expect(chartManager.controls.chartType).toBe('scatter');

      chartManager.cycleChartType(1);
      expect(chartManager.controls.chartType).toBe('pie');

      chartManager.cycleChartType(1);
      expect(chartManager.controls.chartType).toBe('area');

      chartManager.cycleChartType(1);
      expect(chartManager.controls.chartType).toBe('bar'); // Wrapped
    });

    test('cycleChartType should handle negative steps', () => {
      chartManager.controls.chartType = 'bar';
      chartManager.cycleChartType(-1);
      expect(chartManager.controls.chartType).toBe('area'); // Wrapped backwards
    });
  });

  describe('Status Display', () => {
    beforeEach(() => {
      chartManager.schema = chartManager.classifyColumns(salesData);
    });

    test('getControlStatus should return formatted status string', () => {
      chartManager.controls.chartType = 'bar';
      chartManager.controls.xIndex = 0; // product
      chartManager.controls.yIndex = 1; // sales

      const status = chartManager.getControlStatus();

      expect(status).toContain('Bar');
      expect(status).toContain('X: product');
      expect(status).toContain('Y: sales');
      expect(status).toContain('Sort: none');
      expect(status).toContain('Filter: none');
    });

    test('getControlStatus should include active sort', () => {
      chartManager.controls.sortIndex = 0; // First numeric column
      chartManager.controls.sortDir = 'desc';

      const status = chartManager.getControlStatus();

      expect(status).toContain('Sort:');
      expect(status).toContain('(desc)');
    });

    test('getControlStatus should include active filter', () => {
      chartManager.controls.filter.colIndex = chartManager.schema.textColumns.indexOf('region');
      chartManager.controls.filter.valIndex = chartManager.schema.valuesByTextCol.region.indexOf('North');

      const status = chartManager.getControlStatus();

      expect(status).toContain('Filter: region = North');
    });

    test('getControlStatus should handle missing schema', () => {
      chartManager.schema = null;

      const status = chartManager.getControlStatus();

      expect(status).toBe('No data loaded');
    });
  });

  describe('Persistence', () => {
    beforeEach(() => {
      chartManager.schema = chartManager.classifyColumns(salesData);
      chartManager.dataSource = 'sample';
    });

    test('saveControls should save to localStorage', () => {
      chartManager.controls.xIndex = 2;
      chartManager.controls.yIndex = 3;
      chartManager.controls.sortIndex = 1;

      chartManager.saveControls();

      const key = chartManager.getDatasetKey();
      const saved = global.localStorage.getItem(`ar_controls_${key}`);

      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved);
      expect(parsed.controls.xIndex).toBe(2);
      expect(parsed.controls.yIndex).toBe(3);
      expect(parsed.controls.sortIndex).toBe(1);
    });

    test('loadControls should restore from localStorage', () => {
      // Save initial state
      chartManager.controls.xIndex = 5;
      chartManager.controls.yIndex = 6;
      chartManager.saveControls();

      // Modify controls
      chartManager.controls.xIndex = 0;
      chartManager.controls.yIndex = 0;

      // Load saved state
      const loaded = chartManager.loadControls();

      expect(loaded).toBe(true);
      expect(chartManager.controls.xIndex).toBe(5);
      expect(chartManager.controls.yIndex).toBe(6);
    });

    test('loadControls should return false if no saved state exists', () => {
      global.localStorage.clear();

      const loaded = chartManager.loadControls('nonexistent_key');

      expect(loaded).toBe(false);
    });

    test('loadControls should handle corrupted localStorage data', () => {
      const key = chartManager.getDatasetKey();
      global.localStorage.setItem(`ar_controls_${key}`, 'invalid json{');

      const loaded = chartManager.loadControls();

      expect(loaded).toBe(false);
    });

    test('getDatasetKey should generate unique keys for different data sources', () => {
      chartManager.dataSource = 'sample';
      const sampleKey = chartManager.getDatasetKey();

      chartManager.dataSource = 'custom';
      chartManager.customData = { filename: 'test.csv' };
      const customKey = chartManager.getDatasetKey();

      expect(sampleKey).not.toBe(customKey);
    });

    test('persistence round-trip should maintain state', () => {
      // Set complex state
      chartManager.controls.xIndex = 3;
      chartManager.controls.yIndex = 1;
      chartManager.controls.sortIndex = 2;
      chartManager.controls.sortDir = 'desc';
      chartManager.controls.filter.colIndex = 1;
      chartManager.controls.filter.valIndex = 0;
      chartManager.controls.chartType = 'scatter';

      // Save
      chartManager.saveControls();

      // Reset to defaults
      chartManager.controls = {
        xIndex: 0,
        yIndex: 1,
        sortIndex: -1,
        sortDir: 'asc',
        filter: { colIndex: -1, valIndex: -1 },
        chartType: 'bar'
      };

      // Load
      chartManager.loadControls();

      // Verify restoration
      expect(chartManager.controls.xIndex).toBe(3);
      expect(chartManager.controls.yIndex).toBe(1);
      expect(chartManager.controls.sortIndex).toBe(2);
      expect(chartManager.controls.sortDir).toBe('desc');
      expect(chartManager.controls.filter.colIndex).toBe(1);
      expect(chartManager.controls.filter.valIndex).toBe(0);
      expect(chartManager.controls.chartType).toBe('scatter');
    });
  });

  describe('Edge Cases', () => {
    test('cycling methods should handle schema with no numeric columns', () => {
      const textOnlyData = [
        { name: 'Alice', grade: 'A' },
        { name: 'Bob', grade: 'B' }
      ];

      chartManager.schema = chartManager.classifyColumns(textOnlyData);
      chartManager.cycleSort(1);

      // Should stay at "none"
      expect(chartManager.controls.sortIndex).toBe(-1);
    });

    test('cycling methods should handle schema with no text columns', () => {
      const numericOnlyData = [
        { x: 1, y: 2, z: 3 },
        { x: 4, y: 5, z: 6 }
      ];

      chartManager.schema = chartManager.classifyColumns(numericOnlyData);
      chartManager.cycleFilterColumn(1);

      // Should stay at "none"
      expect(chartManager.controls.filter.colIndex).toBe(-1);
    });

    test('getEffectiveData should handle empty base data', () => {
      chartManager.schema = chartManager.classifyColumns(salesData);
      const result = chartManager.getEffectiveData([]);

      expect(result).toEqual([]);
    });

    test('currentAxisOverride should handle empty schema', () => {
      chartManager.schema = { columns: [], textColumns: [], numericColumns: [], valuesByTextCol: {} };
      const override = chartManager.currentAxisOverride();

      expect(override).toBeNull();
    });
  });
});
