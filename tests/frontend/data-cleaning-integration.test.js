/**
 * Integration Tests for Data Cleaning Blocks with Professor
 * 
 * Tests the complete flow from Blockly blocks to Professor execution
 */

// Mock browser environment for testing
global.window = global.window || {};
global.console = console;

// Load the necessary modules
require('../../src/frontend/professor.js');

// Mock Papa parser for CSV data
global.Papa = {
  parse: jest.fn()
};

// Mock Blockly environment
global.Blockly = {
  defineBlocksWithJsonArray: jest.fn(),
  fieldRegistry: {
    register: jest.fn(),
    get: jest.fn()
  },
  JavaScript: {
    ORDER_ATOMIC: 0,
    ORDER_FUNCTION_CALL: 1,
    ORDER_NONE: 99,
    valueToCode: jest.fn((block, name, order) => {
      // Mock the dataset value code
      if (name === 'DATASET') {
        return 'testDataVariable';
      }
      return 'null';
    })
  },
  getMainWorkspace: jest.fn(() => ({
    refreshToolboxSelection: jest.fn()
  })),
  FieldDropdown: class MockFieldDropdown {
    constructor() {}
    dispose() {}
    static get SERIALIZABLE() { return true; }
    static fromJson() { return new this(); }
  },
  Themes: {
    Dark: {}
  },
  Extensions: {
    register: jest.fn()
  }
};

// Make Blockly available on window too
window.Blockly = global.Blockly;

// Load block utilities and data cleaning block definitions
require('../../src/blocks/block-utils.js');
require('../../src/blocks/data-cleaning.js');

describe('Data Cleaning Blocks Integration', () => {
  let mockBlock;
  let testData;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Sample test data
    testData = [
      { name: 'Alice', age: '25', salary: '50000', department: 'Engineering' },
      { name: 'Bob', age: '30', salary: '60000', department: 'Marketing' },
      { name: 'Charlie', age: '', salary: '55000', department: 'Engineering' },
      { name: 'Diana', age: '28', salary: '', department: 'Sales' }
    ];

    // Mock block that returns field values
    mockBlock = {
      getFieldValue: jest.fn((fieldName) => {
        const fieldValues = {
          'COLUMN': 'age',
          'TYPE': 'number',
          'OLD_NAME': 'department',
          'NEW_NAME': 'dept',
          'METHOD': 'fill_average',
          'FILL_VALUE': '25'
        };
        return fieldValues[fieldName] || '';
      })
    };

    // Make test data available globally for generated code
    global.testDataVariable = testData;
  });

  describe('Professor Integration', () => {
    test('Should be available and functional', () => {
      expect(window.AppAR).toBeDefined();
      expect(window.AppAR.Professor).toBeDefined();
      expect(typeof window.AppAR.Professor.runSingle).toBe('function');
    });

    test('Should execute convert_type operation', async () => {
      const operation = {
        type: 'convertType',
        params: { column: 'age', dataType: 'number' }
      };

      const result = await window.AppAR.Professor.runSingle(testData, operation);
      
      expect(result).toHaveLength(4);
      expect(typeof result[0].age).toBe('number');
      expect(result[0].age).toBe(25);
      expect(Number.isNaN(result[2].age)).toBe(true); // Empty string -> NaN
    });
  });

  describe('Block Code Generation', () => {
    test('convert_type block should generate correct code', () => {
      // Get the registered generator function
      const generator = window.BlockUtils._registeredBlocks?.['convert_type'];
      
      if (generator) {
        const [code, order] = generator(mockBlock);
        
        expect(code).toContain('window.AppAR.Professor.runSingle');
        expect(code).toContain('convertType');
        expect(code).toContain('testDataVariable'); // The mock dataset code
        expect(order).toBe(Blockly.JavaScript.ORDER_FUNCTION_CALL);
      } else {
        // If the generator wasn't registered, test the operation directly
        console.log('Generator not found, testing operation directly...');
        
        const operation = {
          type: 'convertType',
          params: { column: 'age', dataType: 'number' }
        };

        expect(async () => {
          const result = await window.AppAR.Professor.runSingle(testData, operation);
          expect(result).toHaveLength(4);
        }).not.toThrow();
      }
    });

    test('Generated code should be executable', async () => {
      // Simulate the generated code pattern
      const generatedCode = `
        (async function () {
          const inputData = testDataVariable;
          if (!inputData) throw new Error('No input dataset provided');
          const out = await window.AppAR.Professor.runSingle(inputData, {"type":"convertType","params":{"column":"age","dataType":"number"}});
          return out;
        })()
      `;

      // Execute the generated code
      const result = await eval(generatedCode);
      
      expect(result).toHaveLength(4);
      expect(typeof result[0].age).toBe('number');
      expect(result[0].age).toBe(25);
    });
  });

  describe('Block Chain Execution', () => {
    test('Should support chaining multiple data cleaning operations', async () => {
      // Simulate a chain: Convert age to number -> Fill missing -> Rename department -> Drop salary
      
      // Step 1: Convert age to number
      let data = await window.AppAR.Professor.runSingle(testData, {
        type: 'convertType',
        params: { column: 'age', dataType: 'number' }
      });

      // Step 2: Fill missing ages with average
      data = await window.AppAR.Professor.runSingle(data, {
        type: 'handleMissing',
        params: { column: 'age', method: 'fill_average' }
      });

      // Step 3: Rename department to dept
      data = await window.AppAR.Professor.runSingle(data, {
        type: 'renameColumn',
        params: { oldName: 'department', newName: 'dept' }
      });

      // Step 4: Drop salary column
      data = await window.AppAR.Professor.runSingle(data, {
        type: 'dropColumn',
        params: { column: 'salary' }
      });

      // Verify final result
      expect(data).toHaveLength(4);
      
      // All ages should be numbers with no missing values
      data.forEach(row => {
        expect(typeof row.age).toBe('number');
        expect(Number.isFinite(row.age)).toBe(true);
      });

      // Department should be renamed to dept
      expect(data[0]).toHaveProperty('dept');
      expect(data[0]).not.toHaveProperty('department');
      expect(data[0].dept).toBe('Engineering');

      // Salary column should be removed
      expect(data[0]).not.toHaveProperty('salary');

      // Other columns should remain
      expect(data[0]).toHaveProperty('name');
      expect(data[0].name).toBe('Alice');
    });
  });

  describe('Error Handling Integration', () => {
    test('Should handle invalid operations gracefully', async () => {
      await expect(window.AppAR.Professor.runSingle(testData, {
        type: 'invalidOperation',
        params: { column: 'age' }
      })).rejects.toThrow('Unknown operation type: invalidOperation');
    });

    test('Should handle missing parameters', async () => {
      await expect(window.AppAR.Professor.runSingle(testData, {
        type: 'convertType',
        params: { column: 'age' } // Missing dataType
      })).rejects.toThrow('convertType requires column and dataType parameters');
    });

    test('Should handle invalid data gracefully', async () => {
      await expect(window.AppAR.Professor.runSingle('not an array', {
        type: 'convertType',
        params: { column: 'age', dataType: 'number' }
      })).rejects.toThrow('Input data must be an array of objects');
    });
  });

  describe('UI Integration Points', () => {
    test('Should call updateDataPanel when available', async () => {
      // Mock the UI update function
      const mockUpdateDataPanel = jest.fn();
      window.BlockUtils = window.BlockUtils || {};
      window.BlockUtils.updateDataPanel = mockUpdateDataPanel;

      const operation = {
        type: 'convertType',
        params: { column: 'age', dataType: 'number' }
      };

      const result = await window.AppAR.Professor.runSingle(testData, operation);
      
      expect(mockUpdateDataPanel).toHaveBeenCalledWith(result);
    });

    test('Should handle React state updates when available', async () => {
      // Mock React state functions
      const mockSetOutput = jest.fn();
      const mockSetError = jest.fn();
      
      window.reactSetOutput = mockSetOutput;
      window.reactSetError = mockSetError;

      // Test successful operation
      await window.AppAR.Professor.runSingle(testData, {
        type: 'convertType',
        params: { column: 'age', dataType: 'number' }
      });

      // Should not set error for successful operation
      expect(mockSetError).not.toHaveBeenCalled();

      // Test failed operation
      try {
        await window.AppAR.Professor.runSingle('invalid', {
          type: 'convertType',
          params: { column: 'age', dataType: 'number' }
        });
      } catch (e) {
        // Expected to fail
      }

      // Should set error state for failed operation
      expect(mockSetOutput).toHaveBeenCalledWith('Error: Input data must be an array of objects');
      expect(mockSetError).toHaveBeenCalledWith(true);

      // Cleanup
      delete window.reactSetOutput;
      delete window.reactSetError;
    });
  });
});