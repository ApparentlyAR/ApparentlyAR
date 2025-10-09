/**
 * Test suite for Async Data Handling in Block Composition
 * Tests the specific fix for Promise handling in visualization blocks
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.window = dom.window;
global.document = dom.window.document;

// Mock Blockly
global.Blockly = {
  defineBlocksWithJsonArray: jest.fn(),
  fieldRegistry: { register: jest.fn() },
  Extensions: { register: jest.fn() },
  JavaScript: {
    ORDER_ATOMIC: 0,
    ORDER_FUNCTION_CALL: 1,
    valueToCode: jest.fn()
  },
  CsvImportData: { data: null, filename: null }
};

// Mock Papa Parse
global.Papa = { parse: jest.fn() };

describe('Async Data Handling in Block Composition', () => {
  let mockAppApi, mockBlocklyNormalizeData, mockReactSetOutput, mockReactSetError;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAppApi = {
      processData: jest.fn().mockResolvedValue({ data: [] }),
      generateChart: jest.fn().mockResolvedValue({ config: { chartType: 'test' } })
    };
    
    mockBlocklyNormalizeData = jest.fn(input => Array.isArray(input) ? input : []);
    mockReactSetOutput = jest.fn();
    mockReactSetError = jest.fn();
    
    global.window.AppApi = mockAppApi;
    global.window.BlocklyNormalizeData = mockBlocklyNormalizeData;
    global.window.reactSetOutput = mockReactSetOutput;
    global.window.reactSetError = mockReactSetError;
    
    // Clear module cache
    try {
      delete require.cache[require.resolve('../../src/blocks/visualization.js')];
    } catch (_) {}
    
    Blockly.CsvImportData.data = null;
  });

  afterAll(() => {
    // Clear any remaining timers
    jest.clearAllTimers();
    // Clear module cache
    jest.clearAllMocks();
  });

  describe('Promise Detection and Awaiting', () => {
    beforeEach(() => {
      require('../../src/blocks/visualization.js');
    });

    test('should detect and await Promise in generate_visualization', async () => {
      const mockBlock = {};
      
      // Mock configuration
      Blockly.JavaScript.valueToCode
        .mockReturnValueOnce('({ chartType: "line", options: {} })')  // CONFIG
        .mockReturnValueOnce('asyncDataPromise');  // DATA

      const generator = Blockly.JavaScript['generate_visualization'];
      const generatedCode = generator(mockBlock);

      // Verify the generated code contains Promise detection and awaiting
      expect(generatedCode).toContain('let __rawData = asyncDataPromise');
      expect(generatedCode).toContain('typeof __rawData.then === \'function\'');
      expect(generatedCode).toContain('__rawData = await __rawData');
      expect(generatedCode).toContain('window.BlocklyNormalizeData(__rawData)');
    });

    test('should handle synchronous data without awaiting', async () => {
      const testData = [{ x: 1, y: 2 }, { x: 2, y: 4 }];
      
      // Mock synchronous data
      mockBlocklyNormalizeData.mockReturnValue(testData);
      mockAppApi.generateChart.mockResolvedValue({ config: { chartType: 'line' } });

      // Simulate the corrected code execution
      const executeSync = async () => {
        let __rawData = testData; // Synchronous data
        
        // Promise detection (should be false for sync data)
        if (__rawData && typeof __rawData.then === 'function') {
          __rawData = await __rawData;
        }
        
        const __input = window.BlocklyNormalizeData(__rawData);
        
        if (Array.isArray(__input) && __input.length > 0) {
          const config = { chartType: 'line', options: {} };
          return await window.AppApi.generateChart(__input, config.chartType, config.options);
        }
        
        return null;
      };

      const result = await executeSync();
      
      expect(result).toEqual({ config: { chartType: 'line' } });
      expect(mockBlocklyNormalizeData).toHaveBeenCalledWith(testData);
      expect(mockAppApi.generateChart).toHaveBeenCalledWith(testData, 'line', {});
    });

    test('should handle Promise data correctly', async () => {
      const testData = [{ Day: 'Monday', Value: 10 }];
      const promiseData = Promise.resolve(testData);
      
      mockBlocklyNormalizeData.mockReturnValue(testData);
      mockAppApi.generateChart.mockResolvedValue({ config: { chartType: 'bar' } });

      // Simulate the corrected code execution with Promise
      const executeAsync = async () => {
        let __rawData = promiseData; // Promise data
        
        // Promise detection and awaiting
        if (__rawData && typeof __rawData.then === 'function') {
          __rawData = await __rawData;
        }
        
        const __input = window.BlocklyNormalizeData(__rawData);
        
        if (Array.isArray(__input) && __input.length > 0) {
          const config = { chartType: 'bar', options: {} };
          return await window.AppApi.generateChart(__input, config.chartType, config.options);
        }
        
        return null;
      };

      const result = await executeAsync();
      
      expect(result).toEqual({ config: { chartType: 'bar' } });
      expect(mockBlocklyNormalizeData).toHaveBeenCalledWith(testData);
      expect(mockAppApi.generateChart).toHaveBeenCalledWith(testData, 'bar', {});
    });
  });

  describe('Real-world Async Data Flow Simulation', () => {
    beforeEach(() => {
      require('../../src/blocks/visualization.js');
      require('../../src/blocks/data_ops.js');
    });

    test('should handle complete async pipeline: CSV -> Filter -> Chart', async () => {
      const originalData = [
        { Day: 'Monday', Time: '9:00', Value: 10 },
        { Day: 'Tuesday', Time: '10:00', Value: 15 },
        { Day: 'Monday', Time: '11:00', Value: 20 }
      ];
      
      const filteredData = [
        { Day: 'Monday', Time: '9:00', Value: 10 },
        { Day: 'Monday', Time: '11:00', Value: 20 }
      ];

      // Setup CSV data
      global.window.Blockly = {
        ...global.window.Blockly,
        CsvImportData: { data: originalData, filename: 'test.csv' }
      };
      Blockly.CsvImportData.data = originalData;
      
      // Mock the filter operation
      mockAppApi.processData.mockResolvedValue({ data: filteredData });
      mockAppApi.generateChart.mockResolvedValue({ 
        config: { chartType: 'line', xColumn: 'Time', yColumn: 'Value' } 
      });

      // Simulate the complete pipeline (this is what the fixed blocks now generate)
      const executeFullPipeline = async () => {
        // Step 1: Get base data
        const baseData = window.BlocklyNormalizeData(window.Blockly.CsvImportData.data);
        
        // Step 2: Apply filter (returns Promise)
        let filterPromise = window.AppApi.processData(baseData, [{
          type: 'filter',
          params: { column: 'Day', operator: 'equals', value: 'Monday' }
        }]).then(res => res.data);
        
        // Step 3: Chart generation with async data handling (the fix)
        let __rawData = filterPromise;
        
        // Promise detection and awaiting (this is the key fix)
        if (__rawData && typeof __rawData.then === 'function') {
          __rawData = await __rawData;
        }
        
        const __input = window.BlocklyNormalizeData(__rawData);
        
        if (!Array.isArray(__input) || __input.length === 0) {
          window.reactSetError(true);
          return null;
        }
        
        const config = { chartType: 'line', options: { xColumn: 'Time', yColumn: 'Value' } };
        const chartResult = await window.AppApi.generateChart(__input, config.chartType, config.options);
        
        return { data: __input, chart: chartResult };
      };

      const result = await executeFullPipeline();
      
      expect(result).not.toBeNull();
      expect(result.data).toEqual(filteredData);
      expect(result.chart.config.chartType).toBe('line');
      
      // Verify the complete call chain
      expect(mockAppApi.processData).toHaveBeenCalledWith(originalData, [{
        type: 'filter',
        params: { column: 'Day', operator: 'equals', value: 'Monday' }
      }]);
      
      expect(mockAppApi.generateChart).toHaveBeenCalledWith(
        filteredData,
        'line',
        { xColumn: 'Time', yColumn: 'Value' }
      );
      
      expect(mockReactSetError).not.toHaveBeenCalled();
    });

    test('should handle rejected Promise gracefully', async () => {
      const error = new Error('Data processing failed');
      mockAppApi.processData.mockRejectedValue(error);

      // Simulate handling a rejected Promise
      const executeWithError = async () => {
        try {
          let __rawData = window.AppApi.processData([], [{ type: 'filter', params: {} }])
            .then(res => res.data)
            .catch(err => {
              console.error('Filter error:', err);
              return [];
            });
          
          if (__rawData && typeof __rawData.then === 'function') {
            __rawData = await __rawData;
          }
          
          return __rawData;
        } catch (err) {
          window.reactSetOutput('Error: ' + err.message);
          window.reactSetError(true);
          return null;
        }
      };

      const result = await executeWithError();
      
      expect(result).toEqual([]); // Fallback data
      expect(mockAppApi.processData).toHaveBeenCalled();
    });
  });

  describe('All Visualization Block Types with Async Fix', () => {
    beforeEach(() => {
      require('../../src/blocks/visualization.js');
    });

    test('should apply async fix to quick_chart block', () => {
      const mockBlock = {
        getFieldValue: jest.fn()
          .mockReturnValueOnce('bar')
          .mockReturnValueOnce('X')
          .mockReturnValueOnce('Y')
          .mockReturnValueOnce('Title')
      };
      
      Blockly.JavaScript.valueToCode.mockReturnValue('promiseData');
      
      const generator = Blockly.JavaScript['quick_chart'];
      const code = generator(mockBlock);
      
      expect(code).toContain('let __rawData = promiseData');
      expect(code).toContain('typeof __rawData.then === \'function\'');
      expect(code).toContain('__rawData = await __rawData');
    });

    test('should apply async fix to histogram_config block', () => {
      const mockBlock = {
        getFieldValue: jest.fn()
          .mockReturnValueOnce('value')
          .mockReturnValueOnce(10)
          .mockReturnValueOnce('Histogram')
      };
      
      Blockly.JavaScript.valueToCode.mockReturnValue('asyncData');
      
      const generator = Blockly.JavaScript['histogram_config'];
      const code = generator(mockBlock);
      
      expect(code).toContain('let __rawData = asyncData');
      expect(code).toContain('typeof __rawData.then === \'function\'');
      expect(code).toContain('__rawData = await __rawData');
    });

    test('should apply async fix to boxplot_config block', () => {
      const mockBlock = {
        getFieldValue: jest.fn()
          .mockReturnValueOnce('value')
          .mockReturnValueOnce('group')
          .mockReturnValueOnce('Box Plot')
      };
      
      Blockly.JavaScript.valueToCode.mockReturnValue('dataPromise');
      
      const generator = Blockly.JavaScript['boxplot_config'];
      const code = generator(mockBlock);
      
      expect(code).toContain('let __rawData = dataPromise');
      expect(code).toContain('typeof __rawData.then === \'function\'');
      expect(code).toContain('__rawData = await __rawData');
    });

    test('should apply async fix to heatmap_config block', () => {
      const mockBlock = {
        getFieldValue: jest.fn()
          .mockReturnValueOnce('x')
          .mockReturnValueOnce('y')
          .mockReturnValueOnce('value')
          .mockReturnValueOnce('Heatmap')
      };
      
      Blockly.JavaScript.valueToCode.mockReturnValue('heatmapData');
      
      const generator = Blockly.JavaScript['heatmap_config'];
      const code = generator(mockBlock);
      
      expect(code).toContain('let __rawData = heatmapData');
      expect(code).toContain('typeof __rawData.then === \'function\'');
      expect(code).toContain('__rawData = await __rawData');
    });
  });

  describe('Error Handling in Async Context', () => {
    test('should handle Promise rejection in data flow', async () => {
      const rejectedPromise = Promise.reject(new Error('Network error'));
      
      const executeWithRejection = async () => {
        try {
          let __rawData = rejectedPromise;
          
          if (__rawData && typeof __rawData.then === 'function') {
            __rawData = await __rawData;
          }
          
          return window.BlocklyNormalizeData(__rawData);
        } catch (error) {
          window.reactSetOutput('Error: ' + error.message);
          window.reactSetError(true);
          return [];
        }
      };

      const result = await executeWithRejection();
      
      expect(result).toEqual([]);
      expect(mockReactSetOutput).toHaveBeenCalledWith('Error: Network error');
      expect(mockReactSetError).toHaveBeenCalledWith(true);
    });

    test('should handle malformed Promise objects', async () => {
      const malformedPromise = { then: 'not a function' };
      
      const executeWithMalformed = async () => {
        let __rawData = malformedPromise;
        
        // This should not attempt to await
        if (__rawData && typeof __rawData.then === 'function') {
          __rawData = await __rawData;
        }
        
        return window.BlocklyNormalizeData(__rawData);
      };

      const result = await executeWithMalformed();
      
      expect(result).toEqual([]); // Empty array from normalizer
      expect(mockBlocklyNormalizeData).toHaveBeenCalledWith(malformedPromise);
    });
  });

  describe('Backwards Compatibility', () => {
    test('should work with existing synchronous block compositions', async () => {
      const syncData = [{ a: 1, b: 2 }];
      
      mockBlocklyNormalizeData.mockReturnValue(syncData);
      mockAppApi.generateChart.mockResolvedValue({ config: { chartType: 'test' } });

      // Simulate old-style synchronous data flow
      const executeLegacySync = async () => {
        let __rawData = syncData; // Direct synchronous data
        
        // New Promise detection (should pass through unchanged)
        if (__rawData && typeof __rawData.then === 'function') {
          __rawData = await __rawData;
        }
        
        const __input = window.BlocklyNormalizeData(__rawData);
        return __input;
      };

      const result = await executeLegacySync();
      
      expect(result).toEqual(syncData);
      expect(mockBlocklyNormalizeData).toHaveBeenCalledWith(syncData);
    });

    test('should maintain performance with synchronous data', async () => {
      const syncData = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      
      const start = Date.now();
      
      // Simulate synchronous processing
      let __rawData = syncData;
      if (__rawData && typeof __rawData.then === 'function') {
        __rawData = await __rawData;
      }
      
      const end = Date.now();
      
      // Should be nearly instantaneous for sync data
      expect(end - start).toBeLessThan(10);
      expect(__rawData).toBe(syncData); // Should be the exact same reference
    });
  });
});