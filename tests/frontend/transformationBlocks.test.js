/**
 * Data Transformation Blocks Integration Tests
 * 
 * Tests the complete flow from Blockly transformation blocks to in-memory data operations
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
  Events: {
    BLOCK_CREATE: 'create'
  },
  getMainWorkspace: jest.fn(() => ({
    addChangeListener: jest.fn(),
    getAllBlocks: jest.fn(() => []),
    getBlockById: jest.fn()
  })),
  JavaScript: {
    ORDER_ATOMIC: 0,
    ORDER_FUNCTION_CALL: 1,
    ORDER_NONE: 99,
    valueToCode: jest.fn((block, name, order) => {
      if (name === 'DATA') {
        return 'testDataVariable';
      }
      return 'null';
    }),
    forBlock: {}
  }
};

// Make Blockly available on window too
window.Blockly = global.Blockly;

// Mock CSV data storage
window.Blockly.CsvImportData = {
  data: []
};

// Mock data normalizer
window.BlocklyNormalizeData = jest.fn(input => {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.data)) return input.data;
  if (typeof input === 'string') {
    try { 
      const p = JSON.parse(input); 
      return Array.isArray(p) ? p : []; 
    } catch (_) { 
      return []; 
    }
  }
  return [];
});

// Load the transformation blocks
require('../../src/blocks/transformations.js');

describe('Data Transformation Blocks Integration', () => {
  let mockBlock;
  let testData;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Sample test data
    testData = [
      { name: 'Alice', age: 25.7, salary: 50000, department: 'Engineering', score: 85.5, email: 'alice@company.com' },
      { name: 'Bob', age: 30.2, salary: 60000, department: 'Marketing', score: 92.3, email: 'bob@company.com' },
      { name: 'Charlie', age: 35.1, salary: 55000, department: 'Engineering', score: 78.9, email: 'charlie@company.com' },
      { name: 'Diana', age: 28.8, salary: 65000, department: 'Sales', score: 88.7, email: 'diana@company.com' },
      { name: 'Eve', age: 25.7, salary: 50000, department: 'Engineering', score: 85.5, email: 'eve@company.com' } // Duplicate for testing
    ];

    // Mock block that returns field values
    mockBlock = {
      getFieldValue: jest.fn((fieldName) => {
        const fieldValues = {
          'FROM': 'name',
          'TO': 'full_name',
          'COLUMN': 'age',
          'COL1': 'name',
          'COL2': 'department',
          'VALUE': '0',
          'FROM_VALUE': 'Engineering',
          'TO_VALUE': 'Tech',
          'DELIM': '@',
          'OUT1': 'username',
          'OUT2': 'domain',
          'SEP': ' - ',
          'OUT': 'combined',
          'MODE': 'upper',
          'DECIMALS': '1'
        };
        return fieldValues[fieldName] || 'column';
      })
    };

    // Make test data available globally for generated code
    global.testDataVariable = testData;
    window.Blockly.CsvImportData.data = testData;
  });

  describe('Block Availability', () => {
    test('Should have all transformation block generators available', () => {
      const expectedGenerators = [
        'tf_rename_column',
        'tf_drop_column',
        'tf_fill_missing',
        'tf_replace_values',
        'tf_cast_type',
        'tf_string_transform',
        'tf_split_column',
        'tf_concat_columns',
        'tf_drop_duplicates',
        'tf_round_number'
      ];
      
      expectedGenerators.forEach(generatorName => {
        expect(Blockly.JavaScript[generatorName]).toBeDefined();
        expect(typeof Blockly.JavaScript[generatorName]).toBe('function');
      });
    });

    test('Should load transformation blocks without errors', () => {
      expect(() => {
        delete require.cache[require.resolve('../../src/blocks/transformations.js')];
        require('../../src/blocks/transformations.js');
      }).not.toThrow();
    });
  });

  describe('Rename Column Block', () => {
    test('Should generate correct code for renaming columns', () => {
      const generator = Blockly.JavaScript['tf_rename_column'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain("'name'");
      expect(code).toContain("'full_name'");
      expect(code).toContain('testDataVariable');
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Should execute and rename column correctly', async () => {
      const generator = Blockly.JavaScript['tf_rename_column'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
      expect(result[0]).toHaveProperty('full_name', 'Alice');
      expect(result[0]).not.toHaveProperty('name');
      expect(window.Blockly.CsvImportData.data).toEqual(result);
    });

    test('Should handle placeholder values gracefully', async () => {
      mockBlock.getFieldValue = jest.fn(() => 'column');
      
      const generator = Blockly.JavaScript['tf_rename_column'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(result).toEqual(testData); // Should return original data unchanged
    });
  });

  describe('Drop Column Block', () => {
    test('Should generate correct code for dropping columns', () => {
      const generator = Blockly.JavaScript['tf_drop_column'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain("'age'");
      expect(code).toContain('testDataVariable');
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Should execute and drop column correctly', async () => {
      const generator = Blockly.JavaScript['tf_drop_column'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
      expect(result[0]).not.toHaveProperty('age');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('salary');
      expect(window.Blockly.CsvImportData.data).toEqual(result);
    });
  });

  describe('Fill Missing Block', () => {
    test('Should generate correct code for filling missing values', () => {
      const generator = Blockly.JavaScript['tf_fill_missing'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain("'age'");
      expect(code).toContain("'0'");
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Should execute and fill missing values correctly', async () => {
      // Add some missing values to test data
      const dataWithMissing = [
        { name: 'Alice', age: 25.7, salary: 50000 },
        { name: 'Bob', age: null, salary: 60000 },
        { name: 'Charlie', age: undefined, salary: 55000 },
        { name: 'Diana', age: '', salary: 65000 }
      ];
      global.testDataVariable = dataWithMissing;
      
      const generator = Blockly.JavaScript['tf_fill_missing'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].age).toBe(25.7); // Unchanged
      expect(result[1].age).toBe('0'); // Filled
      expect(result[2].age).toBe('0'); // Filled
      expect(result[3].age).toBe('0'); // Filled
    });
  });

  describe('Replace Values Block', () => {
    test('Should generate correct code for replacing values', () => {
      const generator = Blockly.JavaScript['tf_replace_values'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain("'age'");
      expect(code).toContain("'Engineering'");
      expect(code).toContain("'Tech'");
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Should execute and replace values correctly', async () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'department',
          'FROM_VALUE': 'Engineering',
          'TO_VALUE': 'Tech'
        };
        return fieldValues[fieldName] || 'column';
      });
      
      const generator = Blockly.JavaScript['tf_replace_values'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].department).toBe('Tech'); // Changed
      expect(result[1].department).toBe('Marketing'); // Unchanged
      expect(result[2].department).toBe('Tech'); // Changed
    });
  });

  describe('Cast Type Block', () => {
    test('Should generate correct code for type casting', () => {
      const generator = Blockly.JavaScript['tf_cast_type'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain("'age'");
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Should execute and cast to number correctly', async () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'age',
          'TO': 'number'
        };
        return fieldValues[fieldName] || 'column';
      });
      
      const dataWithStrings = [
        { name: 'Alice', age: '25.7', salary: '50000' },
        { name: 'Bob', age: '30.2', salary: '60000' }
      ];
      global.testDataVariable = dataWithStrings;
      
      const generator = Blockly.JavaScript['tf_cast_type'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(typeof result[0].age).toBe('number');
      expect(result[0].age).toBe(25.7);
      expect(typeof result[1].age).toBe('number');
      expect(result[1].age).toBe(30.2);
    });

    test('Should execute and cast to boolean correctly', async () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'salary',
          'TO': 'boolean'
        };
        return fieldValues[fieldName] || 'column';
      });
      
      const dataWithBooleans = [
        { name: 'Alice', salary: 'true' },
        { name: 'Bob', salary: 'false' },
        { name: 'Charlie', salary: '1' },
        { name: 'Diana', salary: '0' }
      ];
      global.testDataVariable = dataWithBooleans;
      
      const generator = Blockly.JavaScript['tf_cast_type'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].salary).toBe(true);
      expect(result[1].salary).toBe(false);
      expect(result[2].salary).toBe(true);
      expect(result[3].salary).toBe(false);
    });
  });

  describe('String Transform Block', () => {
    test('Should generate correct code for string transformations', () => {
      const generator = Blockly.JavaScript['tf_string_transform'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain("'age'");
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Should execute uppercase transformation correctly', async () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'name',
          'MODE': 'upper'
        };
        return fieldValues[fieldName] || 'column';
      });
      
      const generator = Blockly.JavaScript['tf_string_transform'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].name).toBe('ALICE');
      expect(result[1].name).toBe('BOB');
      expect(result[2].name).toBe('CHARLIE');
    });

    test('Should execute lowercase transformation correctly', async () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'department',
          'MODE': 'lower'
        };
        return fieldValues[fieldName] || 'column';
      });
      
      const generator = Blockly.JavaScript['tf_string_transform'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].department).toBe('engineering');
      expect(result[1].department).toBe('marketing');
    });

    test('Should execute capitalize transformation correctly', async () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'department',
          'MODE': 'cap'
        };
        return fieldValues[fieldName] || 'column';
      });
      
      const generator = Blockly.JavaScript['tf_string_transform'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].department).toBe('Engineering');
      expect(result[1].department).toBe('Marketing');
    });
  });

  describe('Split Column Block', () => {
    test('Should generate correct code for splitting columns', () => {
      const generator = Blockly.JavaScript['tf_split_column'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain('testDataVariable');
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Should execute and split column correctly', async () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'email',
          'DELIM': '@',
          'OUT1': 'username',
          'OUT2': 'domain'
        };
        return fieldValues[fieldName] || 'column';
      });
      
      const generator = Blockly.JavaScript['tf_split_column'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('username', 'alice');
      expect(result[0]).toHaveProperty('domain', 'company.com');
      expect(result[0]).toHaveProperty('email', 'alice@company.com'); // Original preserved
    });
  });

  describe('Concat Columns Block', () => {
    test('Should generate correct code for concatenating columns', () => {
      const generator = Blockly.JavaScript['tf_concat_columns'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain('testDataVariable');
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Should execute and concatenate columns correctly', async () => {
      const generator = Blockly.JavaScript['tf_concat_columns'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('combined', 'Alice - Engineering');
      expect(result[1]).toHaveProperty('combined', 'Bob - Marketing');
      expect(result[0]).toHaveProperty('name', 'Alice'); // Original preserved
      expect(result[0]).toHaveProperty('department', 'Engineering'); // Original preserved
    });
  });

  describe('Drop Duplicates Block', () => {
    test('Should generate correct code for dropping duplicates', () => {
      const generator = Blockly.JavaScript['tf_drop_duplicates'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain('testDataVariable');
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Should execute and drop duplicates correctly', async () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'age'
        };
        return fieldValues[fieldName] || 'column';
      });
      
      const generator = Blockly.JavaScript['tf_drop_duplicates'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(4); // Should remove one duplicate
      
      // Check that duplicates are removed (first occurrence kept)
      const ages = result.map(row => row.age);
      const uniqueAges = [...new Set(ages)];
      expect(ages).toEqual(uniqueAges);
    });
  });

  describe('Round Number Block', () => {
    test('Should generate correct code for rounding numbers', () => {
      const generator = Blockly.JavaScript['tf_round_number'];
      const [code, order] = generator(mockBlock);
      
      expect(code).toContain('testDataVariable');
      expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
    });

    test('Should execute and round numbers correctly', async () => {
      const generator = Blockly.JavaScript['tf_round_number'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].age).toBe(25.7); // 25.7 -> 25.7 (1 decimal)
      expect(result[1].age).toBe(30.2); // 30.2 -> 30.2 (1 decimal)
      expect(result[2].age).toBe(35.1); // 35.1 -> 35.1 (1 decimal)
      expect(result[3].age).toBe(28.8); // 28.8 -> 28.8 (1 decimal)
    });

    test('Should round to different decimal places', async () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'age',
          'DECIMALS': '0'
        };
        return fieldValues[fieldName] || 'column';
      });
      
      const generator = Blockly.JavaScript['tf_round_number'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].age).toBe(26); // 25.7 -> 26 (0 decimals)
      expect(result[1].age).toBe(30); // 30.2 -> 30 (0 decimals)
      expect(result[2].age).toBe(35); // 35.1 -> 35 (0 decimals)
      expect(result[3].age).toBe(29); // 28.8 -> 29 (0 decimals)
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid input data gracefully', async () => {
      global.testDataVariable = 'invalid_data_type';

      const generator = Blockly.JavaScript['tf_rename_column'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(result).toEqual([]); // Should return empty array for invalid data
    });

    test('Should handle empty data gracefully', async () => {
      global.testDataVariable = [];

      const generator = Blockly.JavaScript['tf_drop_column'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(result).toEqual([]);
    });

    test('Should handle null/undefined data gracefully', async () => {
      global.testDataVariable = null;

      const generator = Blockly.JavaScript['tf_fill_missing'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(result).toEqual([]);
    });
  });

  describe('Data Normalization', () => {
    test('Should use BlocklyNormalizeData when available', async () => {
      const generator = Blockly.JavaScript['tf_rename_column'];
      const [code] = generator(mockBlock);
      
      await eval(code);
      
      expect(window.BlocklyNormalizeData).toHaveBeenCalledWith(testData);
    });

    test('Should handle data normalization gracefully when unavailable', async () => {
      const originalNormalizer = window.BlocklyNormalizeData;
      delete window.BlocklyNormalizeData;

      const generator = Blockly.JavaScript['tf_rename_column'];
      const [code] = generator(mockBlock);
      
      const result = await eval(code);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
      
      window.BlocklyNormalizeData = originalNormalizer;
    });
  });

  describe('Autofill System', () => {
    test('Should have autofill functions available', () => {
      expect(window.BlocklyTransformAutofill).toBeDefined();
      expect(typeof window.BlocklyTransformAutofill.applyAutofillToTransformationBlock).toBe('function');
      expect(typeof window.BlocklyTransformAutofill.updateAllTransformationBlocksWithAutofill).toBe('function');
    });

    test('Should handle all transformation block types in autofill', () => {
      const autofillFunction = window.BlocklyTransformAutofill.applyAutofillToTransformationBlock;
      
      const blockTypes = [
        'tf_rename_column',
        'tf_drop_column', 
        'tf_fill_missing',
        'tf_replace_values',
        'tf_cast_type',
        'tf_string_transform',
        'tf_split_column',
        'tf_concat_columns',
        'tf_drop_duplicates',
        'tf_round_number'
      ];
      
      blockTypes.forEach(blockType => {
        const mockBlock = { type: blockType, getField: jest.fn(() => ({ setOptions: jest.fn() })) };
        expect(() => autofillFunction(mockBlock)).not.toThrow();
      });
    });
  });

  describe('forBlock Mappings', () => {
    test('Should register forBlock mappings for newer Blockly versions', () => {
      expect(Blockly.JavaScript.forBlock).toBeDefined();
      
      const transformationBlocks = [
        'tf_rename_column',
        'tf_drop_column',
        'tf_fill_missing',
        'tf_replace_values',
        'tf_cast_type',
        'tf_string_transform',
        'tf_split_column',
        'tf_concat_columns',
        'tf_drop_duplicates',
        'tf_round_number'
      ];
      
      transformationBlocks.forEach(blockType => {
        expect(typeof Blockly.JavaScript.forBlock[blockType]).toBe('function');
      });
    });

    test('forBlock mappings should work correctly', () => {
      const forBlockGenerator = Blockly.JavaScript.forBlock.tf_rename_column;
      const directGenerator = Blockly.JavaScript['tf_rename_column'];
      
      const forBlockResult = forBlockGenerator(mockBlock);
      const directResult = directGenerator(mockBlock);
      
      expect(forBlockResult).toEqual(directResult);
    });
  });

  describe('Security and Input Validation', () => {
    test('Should sanitize column names to prevent injection', () => {
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        if (fieldName === 'FROM') return 'name"; malicious_code(); "';
        if (fieldName === 'TO') return 'new_name';
        return 'column';
      });

      const generator = Blockly.JavaScript['tf_rename_column'];
      const [code] = generator(mockBlock);
      
      // Code should properly escape dangerous input with backslashes
      expect(code).toContain('name\\"; malicious_code(); \\"'); // Escaped quotes
      expect(code).not.toContain('"; malicious_code(); "')); // Raw dangerous pattern should not exist
    });

    test('Should handle empty field values gracefully', () => {
      mockBlock.getFieldValue = jest.fn(() => '');

      const generator = Blockly.JavaScript['tf_rename_column'];
      const [code] = generator(mockBlock);
      
      expect(code).toContain("'column'"); // Should use default
    });
  });

  describe('Global Data State Management', () => {
    test('Should update global CSV data after transformations', async () => {
      const generator = Blockly.JavaScript['tf_rename_column'];
      const [code] = generator(mockBlock);
      
      await eval(code);
      
      expect(window.Blockly.CsvImportData.data).toBeDefined();
      expect(Array.isArray(window.Blockly.CsvImportData.data)).toBe(true);
      expect(window.Blockly.CsvImportData.data).toHaveLength(5);
    });

    test('Should preserve data integrity across transformations', async () => {
      // First transformation - rename 'name' to 'full_name'
      const renameGenerator = Blockly.JavaScript['tf_rename_column'];
      const [renameCode] = renameGenerator(mockBlock);
      const renameResult = await eval(renameCode);
      
      // Update test data variable to use the result for next transformation
      global.testDataVariable = renameResult;
      
      // Second transformation - round the age column
      mockBlock.getFieldValue = jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'age',
          'DECIMALS': '0'
        };
        return fieldValues[fieldName] || 'column';
      });
      
      const roundGenerator = Blockly.JavaScript['tf_round_number'];
      const [roundCode] = roundGenerator(mockBlock);
      const roundResult = await eval(roundCode);
      
      expect(Array.isArray(roundResult)).toBe(true);
      expect(roundResult).toHaveLength(5);
      expect(roundResult[0]).toHaveProperty('full_name', 'Alice'); // Renamed column preserved
      expect(roundResult[0]).toHaveProperty('age'); // Age column still exists
      expect(typeof roundResult[0].age).toBe('number'); // Age is now rounded to number
    });
  });
});
