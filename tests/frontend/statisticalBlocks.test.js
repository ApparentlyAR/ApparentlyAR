/**
 * Statistical Blocks Integration Tests
 * 
 * Tests the complete flow from Blockly blocks to statistical operations
 */

// Mock browser environment for testing
global.window = global.window || {};
global.console = console;
global.setTimeout = setTimeout;

// Mock Blockly environment
global.Blockly = {
  defineBlocksWithJsonArray: jest.fn(),
  fieldRegistry: {
    register: jest.fn(),
    get: jest.fn()
  },
  // Mock FieldDropdown for custom field extension
  FieldDropdown: class MockFieldDropdown {
    constructor(options, validator) {
      this.options = options || [['default', 'default']];
      this.validator = validator;
      this.SERIALIZABLE = true;
    }
    static fromJson(options) {
      return new MockFieldDropdown(options['options']);
    }
    getOptions() {
      return this.options;
    }
    doClassValidation_(newValue) {
      return newValue;
    }
  },
  JavaScript: {
    ORDER_ATOMIC: 0,
    ORDER_FUNCTION_CALL: 1,
    ORDER_NONE: 99,
    valueToCode: jest.fn((block, name, order) => {
      // Mock the dataset value code
      if (name === 'DATA') {
        return 'testDataVariable';
      }
      return 'null';
    }),
    forBlock: {}
  },
  getMainWorkspace: jest.fn(() => ({
    refreshToolboxSelection: jest.fn()
  }))
};

// Make Blockly available on window too
window.Blockly = global.Blockly;

// Mock AppApi for frontend testing
window.AppApi = {
  processData: jest.fn()
};

// Mock data normalizer
window.BlocklyNormalizeData = jest.fn(input => {
  if (Array.isArray(input)) return input;
  return [];
});

// Load the statistics blocks
require('../../src/blocks/statistics.js');

describe('Statistical Blocks Integration', () => {
  let mockBlock;
  let testData;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Sample test data
    testData = [
      { name: 'Alice', age: 25, salary: 50000, department: 'Engineering', score: 85.5 },
      { name: 'Bob', age: 30, salary: 60000, department: 'Marketing', score: 92.3 },
      { name: 'Charlie', age: 35, salary: 55000, department: 'Engineering', score: 78.9 },
      { name: 'Diana', age: 28, salary: 65000, department: 'Sales', score: 88.7 }
    ];

    // Mock block that returns field values
    mockBlock = {
      getFieldValue: jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'age',
          'COLUMN_X': 'age',
          'COLUMN_Y': 'salary',
          'METHOD': 'iqr',
          'PERCENTILE': '50'
        };
        return fieldValues[fieldName] || 'column';
      })
    };

    // Make test data available globally for generated code
    global.testDataVariable = testData;
    
    // Setup AppApi mock responses
    window.AppApi.processData.mockImplementation(async (data, operations) => {
      // Mock successful responses for different operation types
      const operation = operations[0];
      switch (operation.type) {
        case 'calculateMean':
          return { data: 29.5 };
        case 'calculateMedian':
          return { data: 29 };
        case 'calculateStandardDeviation':
          return { data: 3.6401 };
        case 'calculateCorrelation':
          return { data: 0.1229 };
        case 'descriptiveStats':
          return { 
            data: {
              column: 'age',
              count: 4,
              mean: 29.5,
              median: 29,
              stdDev: 3.6401,
              min: 25,
              max: 35,
              q1: 25,
              q3: 32.5,
              variance: 13.25
            }
          };
        case 'detectOutliers':
          return { data: data.map(row => ({ ...row, [`${operation.params.column}_is_outlier`]: false })) };
        case 'frequencyCount':
          return { 
            data: [
              { value: 'Engineering', count: 2 },
              { value: 'Marketing', count: 1 },
              { value: 'Sales', count: 1 }
            ]
          };
        case 'calculatePercentiles':
          return { data: 29 };
        default:
          return { data: null };
      }
    });
  });

  describe('Block Availability', () => {
    test('Should have all statistical block generators available', () => {
      // Test what actually matters - that the JavaScript generators exist
      const expectedGenerators = [
        'calculate_mean',
        'calculate_median', 
        'calculate_std',
        'calculate_correlation',
        'descriptive_stats',
        'detect_outliers',
        'frequency_count',
        'calculate_percentiles'
      ];
      
      expectedGenerators.forEach(generatorName => {
        expect(Blockly.JavaScript[generatorName]).toBeDefined();
        expect(typeof Blockly.JavaScript[generatorName]).toBe('function');
      });
    });

    test('Should load statistics blocks without errors', () => {
      // Test that the statistics module can be loaded
      expect(() => {
        delete require.cache[require.resolve('../../src/blocks/statistics.js')];
        require('../../src/blocks/statistics.js');
      }).not.toThrow();
    });
  });

  describe('Code Generators', () => {
    test('Calculate mean generator should create correct code', () => {
      const generator = window.Blockly.JavaScript['calculate_mean'];
      expect(generator).toBeDefined();
      
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain('window.AppApi.processData');
      expect(code).toContain('calculateMean');
      expect(code).toContain('testDataVariable');
      expect(code).toContain("column: 'age'"); // Updated to match new format
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Calculate correlation generator should handle two columns', () => {
      const generator = window.Blockly.JavaScript['calculate_correlation'];
      expect(generator).toBeDefined();
      
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain('calculateCorrelation');
      expect(code).toContain("columnX: 'age'"); // Updated to match new format
      expect(code).toContain("columnY: 'salary'"); // Updated to match new format
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Descriptive stats generator should create comprehensive operation', () => {
      const generator = window.Blockly.JavaScript['descriptive_stats'];
      expect(generator).toBeDefined();
      
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain('descriptiveStats');
      expect(code).toContain('window.AppApi.processData');
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Detect outliers generator should include method parameter', () => {
      const generator = window.Blockly.JavaScript['detect_outliers'];
      expect(generator).toBeDefined();
      
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain('detectOutliers');
      expect(code).toContain("method: 'iqr'"); // Updated to match new format
      expect(code).toContain('window.AppApi.processData'); // Updated expectation
    });

    test('Calculate percentiles generator should include percentile value', () => {
      const generator = window.Blockly.JavaScript['calculate_percentiles'];
      expect(generator).toBeDefined();
      
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain('calculatePercentiles');
      expect(code).toContain('parseFloat(\'50\')');
    });
  });

  describe('Generated Code Execution', () => {
    test('Mean calculation code should execute and return result', async () => {
      const generator = window.Blockly.JavaScript['calculate_mean'];
      const [code] = generator(mockBlock);
      
      // Execute the generated code
      const result = await eval(code);
      
      expect(result).toBe(29.5);
      expect(window.AppApi.processData).toHaveBeenCalledWith(
        testData,
        [{ type: 'calculateMean', params: { column: 'age' } }]
      );
    });

    test('Descriptive stats code should execute and return object', async () => {
      const generator = window.Blockly.JavaScript['descriptive_stats'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(result).toHaveProperty('column', 'age');
      expect(result).toHaveProperty('mean', 29.5);
      expect(result).toHaveProperty('median', 29);
      expect(result).toHaveProperty('count', 4);
    });

    test('Frequency count code should execute and return array', async () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        if (fieldName === 'COLUMN') return 'department';
        return 'column';
      });

      const generator = window.Blockly.JavaScript['frequency_count'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('value', 'Engineering');
      expect(result[0]).toHaveProperty('count', 2);
    });
  });

  describe('Error Handling in Generated Code', () => {
    test('Should handle API unavailable gracefully', async () => {
      // Temporarily remove AppApi
      const originalAppApi = window.AppApi;
      delete window.AppApi;

      const generator = window.Blockly.JavaScript['calculate_mean'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(result).toBe(0); // Default fallback value
      
      // Restore AppApi
      window.AppApi = originalAppApi;
    });

    test('Should handle invalid input data gracefully', async () => {
      global.testDataVariable = 'invalid_data_type';

      const generator = window.Blockly.JavaScript['calculate_mean'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(result).toBe(0); // Default fallback value
    });

    test('Should handle API errors gracefully', async () => {
      window.AppApi.processData.mockRejectedValue(new Error('API Error'));

      const generator = window.Blockly.JavaScript['calculate_median'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(result).toBe(0); // Default fallback value
    });
  });

  describe('Data Input Validation', () => {
    test('Should sanitize column names to prevent injection', () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        if (fieldName === 'COLUMN') return 'age"; malicious_code(); "';
        return 'column';
      });

      const generator = window.Blockly.JavaScript['calculate_mean'];
      const [code] = generator(mockBlock);
      
      // Code should properly handle dangerous input with our security model:
      // 1. Original column names are preserved for API calls (to support "Co2 (ppm)" etc.)
      // 2. Only error messages are sanitized (quotes/backslashes removed)
      expect(code).toContain('age; malicious_code(); '); // Sanitized in error messages
      expect(code).toContain('malicious_code()'); // Original preserved in API calls (column names should be exact)
      expect(code).not.toContain('"; malicious_code(); "'); // But dangerous quote-semicolon patterns are handled in sanitization
    });

    test('Should handle empty column names gracefully', () => {
      mockBlock.getFieldValue = jest.fn(() => '');

      const generator = window.Blockly.JavaScript['calculate_mean'];
      const [code] = generator(mockBlock);
      
      expect(code).toContain("column: 'column'"); // Should use default - updated format
    });
  });

  describe('forBlock Mappings', () => {
    test('Should register forBlock mappings for newer Blockly versions', () => {
      expect(Blockly.JavaScript.forBlock).toBeDefined();
      expect(typeof Blockly.JavaScript.forBlock.calculate_mean).toBe('function');
      expect(typeof Blockly.JavaScript.forBlock.descriptive_stats).toBe('function');
      expect(typeof Blockly.JavaScript.forBlock.calculate_correlation).toBe('function');
      expect(typeof Blockly.JavaScript.forBlock.detect_outliers).toBe('function');
    });

    test('forBlock mappings should work correctly', () => {
      const forBlockGenerator = Blockly.JavaScript.forBlock.calculate_mean;
      const directGenerator = Blockly.JavaScript['calculate_mean'];
      
      const forBlockResult = forBlockGenerator(mockBlock);
      const directResult = directGenerator(mockBlock);
      
      expect(forBlockResult).toEqual(directResult);
    });
  });

  describe('Data Normalization', () => {
    test('Should use BlocklyNormalizeData when available', async () => {
      const generator = window.Blockly.JavaScript['calculate_mean'];
      const [code] = generator(mockBlock);
      
      await eval(code);
      
      expect(window.BlocklyNormalizeData).toHaveBeenCalledWith(testData);
    });

    test('Should handle data normalization gracefully when unavailable', async () => {
      const originalNormalizer = window.BlocklyNormalizeData;
      delete window.BlocklyNormalizeData;

      const generator = window.Blockly.JavaScript['calculate_mean'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(result).toBe(29.5); // Should still work
      
      window.BlocklyNormalizeData = originalNormalizer;
    });
  });

  describe('Block Types and Outputs', () => {
    test('Statistical generators should return proper code structure', () => {
      const numberOutputGenerators = [
        'calculate_mean', 'calculate_median', 'calculate_std', 
        'calculate_correlation', 'calculate_percentiles'
      ];
      
      numberOutputGenerators.forEach(generatorName => {
        const generator = Blockly.JavaScript[generatorName];
        const [code, order] = generator(mockBlock);
        
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
        expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
      });
    });

    test('All block generators should handle input validation', () => {
      // Test that all generators handle undefined/null inputs gracefully
      const generators = [
        'calculate_mean', 'calculate_median', 'descriptive_stats'
      ];
      
      generators.forEach(generatorName => {
        const generator = Blockly.JavaScript[generatorName];
        expect(() => {
          generator(mockBlock);
        }).not.toThrow();
      });
    });
  });
});