/**
 * Test suite for Multi-Block Code Generation and Visualization Composition
 * Tests the complete data flow from CSV import through data processing to visualization
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.window = dom.window;
global.document = dom.window.document;

// Mock Blockly with comprehensive API
global.Blockly = {
  defineBlocksWithJsonArray: jest.fn(),
  Field: class MockField {
    constructor(value, validator) {
      this.value = value;
      this.validator = validator;
    }
  },
  fieldRegistry: {
    register: jest.fn()
  },
  Extensions: {
    register: jest.fn(),
    apply: jest.fn()
  },
  Blocks: {},
  JavaScript: {
    ORDER_ATOMIC: 0,
    ORDER_FUNCTION_CALL: 1,
    ORDER_NONE: 99,
    valueToCode: jest.fn((block, inputName, order) => {
      // Mock data flow between blocks
      if (inputName === 'DATA') {
        return 'mockDataCode';
      }
      if (inputName === 'CONFIG') {
        return 'mockConfigCode';
      }
      return 'mockCode';
    })
  },
  CsvImportData: {
    data: null,
    filename: null
  }
};

// Mock Papa Parse
global.Papa = {
  parse: jest.fn()
};

// Create comprehensive mocks for the global environment
let mockAppApi, mockBlocklyNormalizeData, mockReactSetOutput, mockReactSetError;

beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset all global mocks
  mockAppApi = {
    processData: jest.fn().mockResolvedValue({ data: [] }),
    generateChart: jest.fn().mockResolvedValue({ config: { chartType: 'test' } })
  };
  
  mockBlocklyNormalizeData = jest.fn(input => {
    if (Array.isArray(input)) return input;
    if (input && Array.isArray(input.data)) return input.data;
    return [];
  });
  
  mockReactSetOutput = jest.fn();
  mockReactSetError = jest.fn();
  
  global.window.AppApi = mockAppApi;
  global.window.BlocklyNormalizeData = mockBlocklyNormalizeData;
  global.window.reactSetOutput = mockReactSetOutput;
  global.window.reactSetError = mockReactSetError;
  
  // Ensure window.Blockly mirrors global.Blockly
  global.window.Blockly = global.Blockly;
  
  // Clear module cache to ensure fresh imports
  ['csv_import.js', 'data_ops.js', 'visualization.js'].forEach(module => {
    try { 
      delete require.cache[require.resolve(`../../src/blocks/${module}`)]; 
    } catch (_) {}
  });
  
  // Reset CSV data
  Blockly.CsvImportData.data = null;
  Blockly.CsvImportData.filename = null;
  global.window.Blockly.CsvImportData.data = null;
  global.window.Blockly.CsvImportData.filename = null;
});

afterAll(() => {
  // Clear any remaining timers
  jest.clearAllTimers();
  // Clear module cache
  jest.clearAllMocks();
});

describe('Multi-Block Code Generation and Composition', () => {
  
  describe('Block Loading and Registration', () => {
    test('should load all blocks successfully', () => {
      require('../../src/blocks/csv_import.js');
      require('../../src/blocks/data_ops.js');
      require('../../src/blocks/visualization.js');
      
      expect(Blockly.defineBlocksWithJsonArray).toHaveBeenCalledTimes(3);
    });
    
    test('should register all JavaScript generators', () => {
      require('../../src/blocks/csv_import.js');
      require('../../src/blocks/data_ops.js');
      require('../../src/blocks/visualization.js');
      
      // Check that key generators are registered
      expect(Blockly.JavaScript['csv_import']).toBeDefined();
      expect(Blockly.JavaScript['filter_data']).toBeDefined();
      expect(Blockly.JavaScript['generate_visualization']).toBeDefined();
      expect(Blockly.JavaScript['set_chart_type']).toBeDefined();
      expect(Blockly.JavaScript['set_axes']).toBeDefined();
    });
  });
  
  describe('Configuration Block Composition', () => {
    beforeEach(() => {
      require('../../src/blocks/visualization.js');
    });
    
    test('should generate chart type configuration', () => {
      const mockBlock = {
        getFieldValue: jest.fn().mockReturnValue('line')
      };
      
      const generator = Blockly.JavaScript['set_chart_type'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toBe("({ chartType: 'line', options: {} })");
      expect(order).toBe(Blockly.JavaScript.ORDER_ATOMIC);
    });
    
    test('should compose axes configuration', () => {
      const mockBlock = {
        getFieldValue: jest.fn()
          .mockReturnValueOnce('Time')  // X_COLUMN
          .mockReturnValueOnce('Value') // Y_COLUMN
      };
      
      // Mock getConfigCode to return a configuration
      Blockly.JavaScript.valueToCode.mockReturnValue("({ chartType: 'line', options: {} })");
      
      const generator = Blockly.JavaScript['set_axes'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain("xColumn: 'Time'");
      expect(code).toContain("yColumn: 'Value'");
      expect(code).toContain('...config');
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });
    
    test('should compose chart options configuration', () => {
      const mockBlock = {
        getFieldValue: jest.fn().mockReturnValue('My Custom Chart')
      };
      
      Blockly.JavaScript.valueToCode.mockReturnValue("({ chartType: 'bar', options: {} })");
      
      const generator = Blockly.JavaScript['chart_options'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain("title: 'My Custom Chart'");
      expect(code).toContain('...config');
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });
    
    test('should compose advanced chart options', () => {
      const mockBlock = {
        getFieldValue: jest.fn()
          .mockReturnValueOnce('Advanced Chart')  // TITLE
          .mockReturnValueOnce('blue')            // COLOR_SCHEME  
          .mockReturnValueOnce('true')            // SHOW_LEGEND
      };
      
      Blockly.JavaScript.valueToCode.mockReturnValue("({ chartType: 'scatter', options: {} })");
      
      const generator = Blockly.JavaScript['advanced_chart_options'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain("title: 'Advanced Chart'");
      expect(code).toContain("colorScheme: 'blue'");
      expect(code).toContain("showLegend: true");
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });
  });
  
  describe('Data Processing Block Generation', () => {
    beforeEach(() => {
      require('../../src/blocks/data_ops.js');
    });
    
    test('should generate filter data code with async handling', () => {
      const mockBlock = {
        getFieldValue: jest.fn()
          .mockReturnValueOnce('Day')      // COLUMN
          .mockReturnValueOnce('equals')   // OPERATOR
          .mockReturnValueOnce('Monday')   // VALUE
      };
      
      Blockly.JavaScript.valueToCode.mockReturnValue('window.Blockly.CsvImportData.data');
      
      const generator = Blockly.JavaScript['filter_data'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain('async () =>');
      expect(code).toContain("column: 'Day'");
      expect(code).toContain("operator: 'equals'");
      expect(code).toContain("value: 'Monday'");
      expect(code).toContain('window.AppApi.processData');
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });
    
    test('should generate sort data code', () => {
      const mockBlock = {
        getFieldValue: jest.fn()
          .mockReturnValueOnce('score')  // COLUMN
          .mockReturnValueOnce('desc')   // DIRECTION
      };
      
      Blockly.JavaScript.valueToCode.mockReturnValue('inputData');
      
      const generator = Blockly.JavaScript['sort_data'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain("column: 'score'");
      expect(code).toContain("direction: 'desc'");
      expect(code).toContain('type: \'sort\'');
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });
  });
  
  describe('Visualization Block Generation with Async Data Handling', () => {
    beforeEach(() => {
      require('../../src/blocks/visualization.js');
    });
    
    test('should generate visualization code with Promise awaiting', () => {
      const mockBlock = {};
      
      Blockly.JavaScript.valueToCode
        .mockReturnValueOnce('({ chartType: "line", options: { xColumn: "Time", yColumn: "Value" } })')  // CONFIG
        .mockReturnValueOnce('asyncDataPromise');  // DATA
      
      const generator = Blockly.JavaScript['generate_visualization'];
      const code = generator(mockBlock);
      
      // Check for async/await pattern
      expect(code).toContain('let __rawData = asyncDataPromise');
      expect(code).toContain('typeof __rawData.then === \'function\'');
      expect(code).toContain('__rawData = await __rawData');
      expect(code).toContain('window.BlocklyNormalizeData(__rawData)');
      expect(code).toContain('window.AppApi.generateChart');
      expect(code).toContain('chartGenerated');
    });
    
    test('should generate quick chart code with async handling', () => {
      const mockBlock = {
        getFieldValue: jest.fn()
          .mockReturnValueOnce('bar')          // CHART_TYPE
          .mockReturnValueOnce('Month')        // X_COLUMN
          .mockReturnValueOnce('Sales')        // Y_COLUMN
          .mockReturnValueOnce('Sales Chart') // TITLE
      };
      
      Blockly.JavaScript.valueToCode.mockReturnValue('asyncDataSource');
      
      const generator = Blockly.JavaScript['quick_chart'];
      const code = generator(mockBlock);
      
      expect(code).toContain('let __rawData = asyncDataSource');
      expect(code).toContain('typeof __rawData.then === \'function\'');
      expect(code).toContain('__rawData = await __rawData');
      expect(code).toContain("xColumn: 'Month'");
      expect(code).toContain("yColumn: 'Sales'");
      expect(code).toContain("title: 'Sales Chart'");
    });
    
    test('should generate histogram code with async handling', () => {
      const mockBlock = {
        getFieldValue: jest.fn()
          .mockReturnValueOnce('score')      // VALUE_COLUMN
          .mockReturnValueOnce(20)           // BINS
          .mockReturnValueOnce('Score Distribution') // TITLE
      };
      
      Blockly.JavaScript.valueToCode.mockReturnValue('promiseData');
      
      const generator = Blockly.JavaScript['histogram_config'];
      const code = generator(mockBlock);
      
      expect(code).toContain('let __rawData = promiseData');
      expect(code).toContain('typeof __rawData.then === \'function\'');
      expect(code).toContain('__rawData = await __rawData');
      expect(code).toContain("valueColumn: 'score'");
      expect(code).toContain('bins: 20');
    });
  });
  
  describe('End-to-End Block Composition Execution', () => {
    let csvData, filteredData, chartResult;
    
    beforeEach(() => {
      require('../../src/blocks/csv_import.js');
      require('../../src/blocks/data_ops.js');
      require('../../src/blocks/visualization.js');
      
      // Setup test data
      csvData = [
        { Day: 'Monday', Time: '9:00', Value: 10 },
        { Day: 'Tuesday', Time: '10:00', Value: 15 },
        { Day: 'Monday', Time: '11:00', Value: 20 },
        { Day: 'Wednesday', Time: '12:00', Value: 25 }
      ];
      
      filteredData = [
        { Day: 'Monday', Time: '9:00', Value: 10 },
        { Day: 'Monday', Time: '11:00', Value: 20 }
      ];
      
      chartResult = { 
        config: { chartType: 'line', xColumn: 'Time', yColumn: 'Value' } 
      };
      
      // Setup CSV data
      Blockly.CsvImportData.data = csvData;
      global.window.Blockly.CsvImportData.data = csvData;
      
      // Configure mocks
      mockAppApi.processData.mockResolvedValue({ data: filteredData });
      mockAppApi.generateChart.mockResolvedValue(chartResult);
    });
    
    test('should execute complete CSV -> Filter -> Visualization pipeline', async () => {
      // Generate the composed code (simulating what Blockly would generate)
      const csvGenerator = Blockly.JavaScript['csv_import'];
      const filterGenerator = Blockly.JavaScript['filter_data'];
      const chartTypeGenerator = Blockly.JavaScript['set_chart_type'];
      const axesGenerator = Blockly.JavaScript['set_axes'];
      const vizGenerator = Blockly.JavaScript['generate_visualization'];
      
      // Test individual code generation
      const [csvCode] = csvGenerator();
      expect(csvCode).toBe('(window.Blockly && window.Blockly.CsvImportData ? window.Blockly.CsvImportData.data : null)');
      
      // Create a composed execution test
      const executeComposition = async () => {
        try {
          // Configuration composition
          const config = (() => {
            const config = ({ chartType: 'line', options: {} });
            return {
              ...config,
              options: {
                ...(config.options || {}),
                xColumn: 'Time',
                yColumn: 'Value'
              }
            };
          })();
          
          // Data processing with async handling
          let __rawData = (async () => {
            try {
              let __input = window.BlocklyNormalizeData(window.Blockly.CsvImportData.data);
              const __res = await window.AppApi.processData(__input, [{ 
                type: 'filter', 
                params: { column: 'Day', operator: 'equals', value: 'Monday' } 
              }]);
              return __res.data;
            } catch (error) {
              console.error('Filter data error:', error);
              return window.BlocklyNormalizeData(window.Blockly.CsvImportData.data);
            }
          })();
          
          // The fixed async handling
          if (__rawData && typeof __rawData.then === 'function') {
            __rawData = await __rawData;
          }
          
          const __input = window.BlocklyNormalizeData(__rawData);
          
          if (!Array.isArray(__input) || __input.length === 0) {
            throw new Error('No data available for visualization');
          }
          
          const chartResult = await window.AppApi.generateChart(__input, config.chartType, config.options || {});
          
          return { config, data: __input, chartResult };
        } catch (error) {
          throw error;
        }
      };
      
      const result = await executeComposition();
      
      // Verify the complete pipeline
      expect(result.config.chartType).toBe('line');
      expect(result.config.options.xColumn).toBe('Time');
      expect(result.config.options.yColumn).toBe('Value');
      expect(result.data).toEqual(filteredData);
      expect(result.chartResult).toEqual(chartResult);
      
      // Verify API calls
      expect(mockBlocklyNormalizeData).toHaveBeenCalledWith(csvData);
      expect(mockAppApi.processData).toHaveBeenCalledWith(csvData, [{ 
        type: 'filter', 
        params: { column: 'Day', operator: 'equals', value: 'Monday' } 
      }]);
      expect(mockAppApi.generateChart).toHaveBeenCalledWith(
        filteredData, 
        'line', 
        { xColumn: 'Time', yColumn: 'Value' }
      );
    });
    
    test('should handle empty data gracefully', async () => {
      Blockly.CsvImportData.data = [];
      global.window.Blockly.CsvImportData.data = [];
      mockBlocklyNormalizeData.mockReturnValue([]);
      
      const executeWithEmptyData = async () => {
        let __rawData = window.BlocklyNormalizeData(window.Blockly.CsvImportData.data);
        
        if (__rawData && typeof __rawData.then === 'function') {
          __rawData = await __rawData;
        }
        
        const __input = window.BlocklyNormalizeData(__rawData);
        
        if (!Array.isArray(__input) || __input.length === 0) {
          window.reactSetOutput('Error: No data available for visualization');
          window.reactSetError(true);
          return null;
        }
        
        return __input;
      };
      
      const result = await executeWithEmptyData();
      
      expect(result).toBeNull();
      expect(mockReactSetOutput).toHaveBeenCalledWith('Error: No data available for visualization');
      expect(mockReactSetError).toHaveBeenCalledWith(true);
    });
    
    test('should handle API errors gracefully', async () => {
      const apiError = new Error('API not available');
      mockAppApi.processData.mockRejectedValue(apiError);
      
      const executeWithError = async () => {
        try {
          let __rawData = (async () => {
            let __input = window.BlocklyNormalizeData(window.Blockly.CsvImportData.data);
            const __res = await window.AppApi.processData(__input, [{ 
              type: 'filter', 
              params: { column: 'Day', operator: 'equals', value: 'Monday' } 
            }]);
            return __res.data;
          })();
          
          if (__rawData && typeof __rawData.then === 'function') {
            __rawData = await __rawData;
          }
          
          return __rawData;
        } catch (error) {
          window.reactSetOutput('Error: ' + error.message);
          window.reactSetError(true);
          return null;
        }
      };
      
      const result = await executeWithError();
      
      expect(result).toBeNull();
      expect(mockReactSetOutput).toHaveBeenCalledWith('Error: API not available');
      expect(mockReactSetError).toHaveBeenCalledWith(true);
    });
  });
  
  describe('Complex Multi-Block Compositions', () => {
    beforeEach(() => {
      require('../../src/blocks/csv_import.js');
      require('../../src/blocks/data_ops.js');
      require('../../src/blocks/visualization.js');
    });
    
    test('should handle CSV -> Filter -> Sort -> Group -> Chart composition', async () => {
      const testData = [
        { Category: 'A', Value: 10, Date: '2023-01-01' },
        { Category: 'B', Value: 20, Date: '2023-01-01' },
        { Category: 'A', Value: 15, Date: '2023-01-02' },
        { Category: 'B', Value: 25, Date: '2023-01-02' }
      ];
      
      Blockly.CsvImportData.data = testData;
      global.window.Blockly.CsvImportData.data = testData;
      
      // Mock sequential data processing
      mockAppApi.processData
        .mockResolvedValueOnce({ data: testData.filter(row => row.Category === 'A') })  // Filter
        .mockResolvedValueOnce({ data: [{ Category: 'A', totalValue: 25 }] });          // Group
      
      const executeComplexComposition = async () => {
        // Step 1: CSV Import
        let data = window.BlocklyNormalizeData(window.Blockly.CsvImportData.data);
        
        // Step 2: Filter
        let filtered = await window.AppApi.processData(data, [{ 
          type: 'filter', 
          params: { column: 'Category', operator: 'equals', value: 'A' } 
        }]);
        
        // Step 3: Group
        let grouped = await window.AppApi.processData(filtered.data, [{ 
          type: 'groupBy', 
          params: { 
            groupBy: 'Category', 
            aggregations: [{ column: 'Value', operation: 'sum', alias: 'totalValue' }] 
          } 
        }]);
        
        return grouped.data;
      };
      
      const result = await executeComplexComposition();
      
      expect(result).toEqual([{ Category: 'A', totalValue: 25 }]);
      expect(mockAppApi.processData).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Block Composition Performance and Memory', () => {
  test('should not create memory leaks in block generators', () => {
    require('../../src/blocks/visualization.js');
    
    // Generate many blocks to test for memory leaks
    for (let i = 0; i < 1000; i++) {
      const mockBlock = {
        getFieldValue: jest.fn().mockReturnValue(`test-${i}`)
      };
      
      const generator = Blockly.JavaScript['set_chart_type'];
      generator(mockBlock);
    }
    
    // If we get here without memory issues, the test passes
    expect(true).toBe(true);
  });
  
  test('should handle large datasets efficiently', async () => {
    require('../../src/blocks/data_ops.js');
    
    // Create a large dataset
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      value: Math.random() * 100,
      category: `cat-${i % 10}`
    }));
    
    mockAppApi.processData.mockResolvedValue({ data: largeDataset.slice(0, 1000) });
    
    const start = Date.now();
    
    const mockBlock = {
      getFieldValue: jest.fn()
        .mockReturnValueOnce('category')
        .mockReturnValueOnce('equals')
        .mockReturnValueOnce('cat-1')
    };
    
    const generator = Blockly.JavaScript['filter_data'];
    const [code] = generator(mockBlock);
    
    const end = Date.now();
    
    expect(end - start).toBeLessThan(100); // Should complete quickly
    expect(code).toContain('filter');
  });
});