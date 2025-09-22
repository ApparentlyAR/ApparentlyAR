/**
 * Professor Class Tests
 * 
 * Tests the Professor interface that bridges Blockly blocks to data processing
 */

// Mock browser environment
global.window = global.window || {};
global.console = console;

// Load the Professor class
require('../../src/frontend/professor.js');

describe('Professor Class', () => {
  let testData;

  beforeEach(() => {
    // Sample test data
    testData = [
      { name: 'Alice', age: '25', salary: '50000', department: 'Engineering' },
      { name: 'Bob', age: '30', salary: '60000', department: 'Marketing' },
      { name: 'Charlie', age: '', salary: '55000', department: 'Engineering' },
      { name: 'Diana', age: '28', salary: '', department: 'Sales' }
    ];
  });

  describe('Initialization', () => {
    test('Professor class should be available on window.AppAR', () => {
      expect(window.AppAR).toBeDefined();
      expect(window.AppAR.Professor).toBeDefined();
      expect(typeof window.AppAR.Professor.runSingle).toBe('function');
    });

    test('Should have all required methods', () => {
      const professor = window.AppAR.Professor;
      expect(typeof professor.runSingle).toBe('function');
      expect(typeof professor.getAvailableOperations).toBe('function');
      expect(typeof professor.validateOperation).toBe('function');
    });

    test('Should return available operations', () => {
      const operations = window.AppAR.Professor.getAvailableOperations();
      expect(operations).toContain('convertType');
      expect(operations).toContain('dropColumn');
      expect(operations).toContain('renameColumn');
      expect(operations).toContain('handleMissing');
    });
  });

  describe('Data Type Conversion', () => {
    test('Should convert text to number', async () => {
      const operation = {
        type: 'convertType',
        params: { column: 'age', dataType: 'number' }
      };

      const result = await window.AppAR.Professor.runSingle(testData, operation);
      
      expect(result).toHaveLength(4);
      expect(typeof result[0].age).toBe('number');
      expect(result[0].age).toBe(25);
      expect(typeof result[1].age).toBe('number');
      expect(result[1].age).toBe(30);
      // Empty string should become NaN
      expect(Number.isNaN(result[2].age)).toBe(true);
    });

    test('Should convert number to text', async () => {
      // First convert to numbers
      let result = await window.AppAR.Professor.runSingle(testData, {
        type: 'convertType',
        params: { column: 'salary', dataType: 'number' }
      });

      // Then convert back to text
      result = await window.AppAR.Professor.runSingle(result, {
        type: 'convertType',
        params: { column: 'salary', dataType: 'text' }
      });

      expect(typeof result[0].salary).toBe('string');
      expect(result[0].salary).toBe('50000');
    });

    test('Should handle invalid data type gracefully', async () => {
      await expect(window.AppAR.Professor.runSingle(testData, {
        type: 'convertType',
        params: { column: 'age', dataType: 'invalid' }
      })).rejects.toThrow();
    });
  });

  describe('Column Operations', () => {
    test('Should drop a column', async () => {
      const operation = {
        type: 'dropColumn',
        params: { column: 'salary' }
      };

      const result = await window.AppAR.Professor.runSingle(testData, operation);
      
      expect(result).toHaveLength(4);
      expect(result[0]).not.toHaveProperty('salary');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('age');
      expect(result[0]).toHaveProperty('department');
    });

    test('Should rename a column', async () => {
      const operation = {
        type: 'renameColumn',
        params: { oldName: 'department', newName: 'dept' }
      };

      const result = await window.AppAR.Professor.runSingle(testData, operation);
      
      expect(result).toHaveLength(4);
      expect(result[0]).not.toHaveProperty('department');
      expect(result[0]).toHaveProperty('dept');
      expect(result[0].dept).toBe('Engineering');
    });

    test('Should handle renaming non-existent column', async () => {
      const operation = {
        type: 'renameColumn',
        params: { oldName: 'nonexistent', newName: 'new' }
      };

      const result = await window.AppAR.Professor.runSingle(testData, operation);
      
      // Should return original data unchanged
      expect(result).toHaveLength(4);
      expect(result[0]).not.toHaveProperty('new');
    });
  });

  describe('Missing Value Handling', () => {
    test('Should remove rows with missing values', async () => {
      const operation = {
        type: 'handleMissing',
        params: { column: 'age', method: 'remove' }
      };

      const result = await window.AppAR.Professor.runSingle(testData, operation);
      
      // Should remove Charlie (empty age)
      expect(result).toHaveLength(3);
      expect(result.find(row => row.name === 'Charlie')).toBeUndefined();
    });

    test('Should fill missing values with specific value', async () => {
      const operation = {
        type: 'handleMissing',
        params: { column: 'age', method: 'fill', fillValue: '25' }
      };

      const result = await window.AppAR.Professor.runSingle(testData, operation);
      
      expect(result).toHaveLength(4);
      const charlie = result.find(row => row.name === 'Charlie');
      expect(charlie.age).toBe('25');
    });

    test('Should fill missing values with average', async () => {
      // First convert ages to numbers
      const convertOperation = {
        type: 'convertType',
        params: { column: 'age', dataType: 'number' }
      };
      
      let result = await window.AppAR.Professor.runSingle(testData, convertOperation);
      
      // Then fill missing with average
      const fillOperation = {
        type: 'handleMissing',
        params: { column: 'age', method: 'fill_average' }
      };
      
      result = await window.AppAR.Professor.runSingle(result, fillOperation);
      
      expect(result).toHaveLength(4);
      const charlie = result.find(row => row.name === 'Charlie');
      // Average of 25, 30, 28 = 27.67 (approximately)
      expect(charlie.age).toBeCloseTo(27.67, 1);
    });

    test('Should fill missing values with median', async () => {
      // First convert ages to numbers
      let result = await window.AppAR.Professor.runSingle(testData, {
        type: 'convertType',
        params: { column: 'age', dataType: 'number' }
      });
      
      // Then fill missing with median
      result = await window.AppAR.Professor.runSingle(result, {
        type: 'handleMissing',
        params: { column: 'age', method: 'fill_median' }
      });
      
      expect(result).toHaveLength(4);
      const charlie = result.find(row => row.name === 'Charlie');
      // Median of [25, 28, 30] = 28
      expect(charlie.age).toBe(28);
    });
  });

  describe('Error Handling', () => {
    test('Should validate operation parameters', async () => {
      await expect(window.AppAR.Professor.runSingle(testData, {
        type: 'convertType',
        params: { column: 'age' } // Missing dataType
      })).rejects.toThrow('convertType requires column and dataType parameters');
    });

    test('Should handle invalid input data', async () => {
      await expect(window.AppAR.Professor.runSingle('not an array', {
        type: 'convertType',
        params: { column: 'age', dataType: 'number' }
      })).rejects.toThrow('Input data must be an array of objects');
    });

    test('Should handle missing operation type', async () => {
      await expect(window.AppAR.Professor.runSingle(testData, {
        params: { column: 'age' }
      })).rejects.toThrow('Operation must have a type property');
    });

    test('Should handle unknown operation type', async () => {
      await expect(window.AppAR.Professor.runSingle(testData, {
        type: 'unknownOperation',
        params: { column: 'age' }
      })).rejects.toThrow('Unknown operation type: unknownOperation');
    });
  });

  describe('Chaining Operations', () => {
    test('Should support chaining multiple operations', async () => {
      // First convert age to number
      let result = await window.AppAR.Professor.runSingle(testData, {
        type: 'convertType',
        params: { column: 'age', dataType: 'number' }
      });

      // Then fill missing values
      result = await window.AppAR.Professor.runSingle(result, {
        type: 'handleMissing',
        params: { column: 'age', method: 'fill_average' }
      });

      // Then rename department column
      result = await window.AppAR.Professor.runSingle(result, {
        type: 'renameColumn',
        params: { oldName: 'department', newName: 'dept' }
      });

      // Finally drop salary column
      result = await window.AppAR.Professor.runSingle(result, {
        type: 'dropColumn',
        params: { column: 'salary' }
      });

      // Verify final result
      expect(result).toHaveLength(4);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('age');
      expect(result[0]).toHaveProperty('dept');
      expect(result[0]).not.toHaveProperty('department');
      expect(result[0]).not.toHaveProperty('salary');
      
      // Check that missing age was filled
      const charlie = result.find(row => row.name === 'Charlie');
      expect(typeof charlie.age).toBe('number');
      expect(charlie.age).toBeCloseTo(27.67, 1);
    });
  });
});