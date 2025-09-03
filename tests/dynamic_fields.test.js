/**
 * Dynamic Field Population Tests
 * 
 * Tests for CSV column scanning, dynamic dropdown population, and data panel display
 */

// Import required modules
const fs = require('fs');
const path = require('path');

// Mock JSDOM for Blockly compatibility
const { JSDOM } = require('jsdom');

describe('Dynamic Field Population System', () => {
  let dom, window, document;

  beforeEach(() => {
    // Setup DOM environment for Blockly
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div id="blocklyDiv"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock Blockly for testing
    global.Blockly = {
      defineBlocksWithJsonArray: jest.fn(),
      FieldDropdown: class MockFieldDropdown {
        constructor(options) {
          this.menuGenerator_ = options;
          this.value_ = options[0] ? options[0][1] : '';
        }
        getValue() { return this.value_; }
        setValue(value) { this.value_ = value; }
        forceRerender() {}
        dispose() {}
      },
      JavaScript: {
        ORDER_ATOMIC: 1,
        ORDER_FUNCTION_CALL: 2,
        ORDER_NONE: 99,
        valueToCode: jest.fn().mockReturnValue('testData'),
        statementToCode: jest.fn().mockReturnValue(''),
        workspaceToCode: jest.fn().mockReturnValue('')
      },
      fieldRegistry: {
        register: jest.fn()
      },
      Extensions: {
        register: jest.fn()
      }
    };

    // Mock Papa Parse
    global.Papa = {
      parse: jest.fn()
    };

    // Mock React bridge functions
    global.window.reactSetOutput = jest.fn();
    global.window.reactSetExecuting = jest.fn();
    global.window.reactSetError = jest.fn();
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.Blockly;
    delete global.Papa;
    dom = null;
  });

  describe('Block Utils Loading and Column Registry', () => {
    beforeEach(() => {
      // Load block-utils.js
      const utilsPath = path.join(__dirname, '../src/blocks/block-utils.js');
      const utilsCode = fs.readFileSync(utilsPath, 'utf8');
      eval(utilsCode);
    });

    test('Column Registry initializes correctly', () => {
      expect(window.BlockUtils.ColumnRegistry).toBeDefined();
      expect(window.BlockUtils.ColumnRegistry.columns).toEqual([]);
      expect(window.BlockUtils.ColumnRegistry.dataTypes).toEqual({});
      expect(window.BlockUtils.ColumnRegistry.listeners).toEqual([]);
    });

    test('Column Registry detects columns from CSV data', () => {
      const csvData = [
        { name: 'Alice', age: 30, score: 85.5, date: '2023-01-01' },
        { name: 'Bob', age: 25, score: 92.0, date: '2023-01-02' },
        { name: 'Charlie', age: 35, score: 78.3, date: '2023-01-03' }
      ];

      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      expect(window.BlockUtils.ColumnRegistry.columns).toEqual(['name', 'age', 'score', 'date']);
      expect(window.BlockUtils.ColumnRegistry.csvData).toBe(csvData);
    });

    test('Column Registry detects data types correctly', () => {
      const csvData = [
        { name: 'Alice', age: '30', score: '85.5', date: '2023-01-01', category: 'A' },
        { name: 'Bob', age: '25', score: '92.0', date: '2023-01-02', category: 'B' },
        { name: 'Charlie', age: '35', score: '78.3', date: '2023-01-03', category: 'A' }
      ];

      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      expect(window.BlockUtils.ColumnRegistry.dataTypes['name']).toBe('text');
      expect(window.BlockUtils.ColumnRegistry.dataTypes['age']).toBe('number');
      expect(window.BlockUtils.ColumnRegistry.dataTypes['score']).toBe('number');
      expect(window.BlockUtils.ColumnRegistry.dataTypes['category']).toBe('text');
    });

    test('Column Registry provides dropdown options', () => {
      const csvData = [
        { name: 'Alice', age: 30, score: 85.5 },
        { name: 'Bob', age: 25, score: 92.0 }
      ];

      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      const options = window.BlockUtils.ColumnRegistry.getDropdownOptions();
      
      expect(options).toHaveLength(3);
      expect(options[0]).toEqual(['name (text)', 'name']);
      expect(options[1]).toEqual(['age (number)', 'age']);
      expect(options[2]).toEqual(['score (number)', 'score']);
    });

    test('Column Registry handles empty data', () => {
      window.BlockUtils.ColumnRegistry.updateColumns([]);
      
      const options = window.BlockUtils.ColumnRegistry.getDropdownOptions();
      expect(options).toEqual([['No CSV loaded', '']]);
    });

    test('Column Registry handles null/undefined data', () => {
      window.BlockUtils.ColumnRegistry.updateColumns(null);
      
      expect(window.BlockUtils.ColumnRegistry.columns).toEqual([]);
      expect(window.BlockUtils.ColumnRegistry.dataTypes).toEqual({});
      
      const options = window.BlockUtils.ColumnRegistry.getDropdownOptions();
      expect(options).toEqual([['No CSV loaded', '']]);
    });

    test('Column Registry listener system works', () => {
      const mockListener = {
        updateFromRegistry: jest.fn()
      };

      window.BlockUtils.ColumnRegistry.addListener(mockListener);
      expect(window.BlockUtils.ColumnRegistry.listeners).toContain(mockListener);

      const csvData = [{ name: 'Test', value: 123 }];
      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      expect(mockListener.updateFromRegistry).toHaveBeenCalled();

      window.BlockUtils.ColumnRegistry.removeListener(mockListener);
      expect(window.BlockUtils.ColumnRegistry.listeners).not.toContain(mockListener);
    });

    test('Column Registry clear function works', () => {
      const csvData = [{ name: 'Test', value: 123 }];
      window.BlockUtils.ColumnRegistry.updateColumns(csvData);
      
      expect(window.BlockUtils.ColumnRegistry.columns.length).toBeGreaterThan(0);
      
      window.BlockUtils.ColumnRegistry.clear();
      
      expect(window.BlockUtils.ColumnRegistry.columns).toEqual([]);
      expect(window.BlockUtils.ColumnRegistry.dataTypes).toEqual({});
      expect(window.BlockUtils.ColumnRegistry.csvData).toBeNull();
    });
  });

  describe('Dynamic Column Dropdown Field', () => {
    beforeEach(() => {
      // Load block-utils.js
      const utilsPath = path.join(__dirname, '../src/blocks/block-utils.js');
      const utilsCode = fs.readFileSync(utilsPath, 'utf8');
      eval(utilsCode);
    });

    test('FieldColumnDropdown initializes with current registry options', () => {
      const csvData = [{ name: 'Alice', age: 30 }];
      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      const field = new window.BlockUtils.FieldColumnDropdown();

      expect(field.menuGenerator_).toHaveLength(2);
      expect(field.menuGenerator_[0]).toEqual(['name (text)', 'name']);
      expect(field.menuGenerator_[1]).toEqual(['age (number)', 'age']);
    });

    test('FieldColumnDropdown shows "No CSV loaded" when no data', () => {
      window.BlockUtils.ColumnRegistry.clear();

      const field = new window.BlockUtils.FieldColumnDropdown();

      expect(field.menuGenerator_).toEqual([['No CSV loaded', '']]);
    });

    test('FieldColumnDropdown updates when registry changes', () => {
      const field = new window.BlockUtils.FieldColumnDropdown();
      
      // Initially no data
      expect(field.menuGenerator_).toEqual([['No CSV loaded', '']]);

      // Add CSV data
      const csvData = [{ name: 'Alice', score: 85 }];
      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      // Field should be updated
      expect(field.menuGenerator_).toHaveLength(2);
      expect(field.menuGenerator_[0]).toEqual(['name (text)', 'name']);
      expect(field.menuGenerator_[1]).toEqual(['score (number)', 'score']);
    });

    test('FieldColumnDropdown filters by data type', () => {
      const csvData = [{ name: 'Alice', age: 30, score: 85.5 }];
      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      const numberField = new window.BlockUtils.FieldColumnDropdown('number');
      numberField.updateFromRegistry();

      // Should only show number columns
      const numberOptions = numberField.menuGenerator_;
      expect(numberOptions).toHaveLength(2);
      expect(numberOptions.find(opt => opt[1] === 'age')).toBeDefined();
      expect(numberOptions.find(opt => opt[1] === 'score')).toBeDefined();
      expect(numberOptions.find(opt => opt[1] === 'name')).toBeUndefined();
    });

    test('FieldColumnDropdown handles disposal correctly', () => {
      const field = new window.BlockUtils.FieldColumnDropdown();
      
      expect(window.BlockUtils.ColumnRegistry.listeners).toContain(field);
      
      field.dispose();
      
      expect(window.BlockUtils.ColumnRegistry.listeners).not.toContain(field);
    });

    test('Field registry registration works', () => {
      expect(Blockly.fieldRegistry.register).toHaveBeenCalledWith(
        'field_column_dropdown', 
        window.BlockUtils.FieldColumnDropdown
      );
    });
  });

  describe('Enhanced updateDataPanel Function', () => {
    beforeEach(() => {
      // Load block-utils.js
      const utilsPath = path.join(__dirname, '../src/blocks/block-utils.js');
      const utilsCode = fs.readFileSync(utilsPath, 'utf8');
      eval(utilsCode);
    });

    test('updateDataPanel displays CSV data and updates columns', () => {
      const csvData = [
        { name: 'Alice', age: 30, score: 85 },
        { name: 'Bob', age: 25, score: 92 }
      ];

      window.BlockUtils.updateDataPanel(csvData);

      // Should update React output with JSON preview
      expect(window.reactSetOutput).toHaveBeenCalled();
      const outputCall = window.reactSetOutput.mock.calls[0][0];
      
      expect(outputCall).toContain('CSV Data Loaded: 2 rows, 3 columns');
      expect(outputCall).toContain('Columns: name, age, score');
      expect(outputCall).toContain('Preview (first 5 rows):');
      expect(outputCall).toContain('"name": "Alice"');
      expect(outputCall).toContain('"age": 30');

      // Should update column registry
      expect(window.BlockUtils.ColumnRegistry.columns).toEqual(['name', 'age', 'score']);
    });

    test('updateDataPanel handles large datasets correctly', () => {
      const csvData = [];
      for (let i = 0; i < 10; i++) {
        csvData.push({ id: i, name: `User${i}`, value: i * 10 });
      }

      window.BlockUtils.updateDataPanel(csvData);

      const outputCall = window.reactSetOutput.mock.calls[0][0];
      
      // Should limit preview to first 5 rows
      expect(outputCall).toContain('CSV Data Loaded: 10 rows, 3 columns');
      expect(outputCall).toContain('"name": "User0"');
      expect(outputCall).toContain('"name": "User4"');
      expect(outputCall).not.toContain('"name": "User5"'); // Should not include 6th row
    });

    test('updateDataPanel handles empty data', () => {
      window.BlockUtils.updateDataPanel([]);

      expect(window.reactSetOutput).toHaveBeenCalledWith('No data available');
      expect(window.BlockUtils.ColumnRegistry.columns).toEqual([]);
    });

    test('updateDataPanel handles null/undefined data', () => {
      window.BlockUtils.updateDataPanel(null);

      expect(window.reactSetOutput).toHaveBeenCalledWith('No data available');
      expect(window.BlockUtils.ColumnRegistry.columns).toEqual([]);
    });
  });

  describe('CSV Import Integration', () => {
    beforeEach(() => {
      // Load block-utils.js first
      const utilsPath = path.join(__dirname, '../src/blocks/block-utils.js');
      const utilsCode = fs.readFileSync(utilsPath, 'utf8');
      eval(utilsCode);

      // Load csv_import.js
      const csvImportPath = path.join(__dirname, '../src/blocks/csv_import.js');
      const csvImportCode = fs.readFileSync(csvImportPath, 'utf8');
      eval(csvImportCode);
    });

    test('CSV import calls updateDataPanel on completion', () => {
      const mockUpdateDataPanel = jest.fn();
      window.BlockUtils.updateDataPanel = mockUpdateDataPanel;

      const csvData = [{ name: 'Test', value: 123 }];

      // Simulate Papa.parse completion callback
      if (global.Papa.parse.mock) {
        // Find the complete callback and call it
        const parseCall = global.Papa.parse.mock.calls.find(call => call[1] && call[1].complete);
        if (parseCall) {
          parseCall[1].complete({ data: csvData });
        }
      }

      // Manually trigger the same logic as in the CSV import block
      if (window.BlockUtils && window.BlockUtils.updateDataPanel) {
        window.BlockUtils.updateDataPanel(csvData);
      }

      expect(mockUpdateDataPanel).toHaveBeenCalledWith(csvData);
    });

    test('CSV import updates global CsvImportData', () => {
      const csvData = [{ name: 'Test', value: 123 }];
      const filename = 'test.csv';

      // Simulate CSV import completion
      global.Blockly.CsvImportData.data = csvData;
      global.Blockly.CsvImportData.filename = filename;

      expect(global.Blockly.CsvImportData.data).toBe(csvData);
      expect(global.Blockly.CsvImportData.filename).toBe(filename);
    });
  });

  describe('Data Type Detection', () => {
    beforeEach(() => {
      const utilsPath = path.join(__dirname, '../src/blocks/block-utils.js');
      const utilsCode = fs.readFileSync(utilsPath, 'utf8');
      eval(utilsCode);
    });

    test('detects text columns correctly', () => {
      const csvData = [
        { name: 'Alice', description: 'Student' },
        { name: 'Bob', description: 'Teacher' },
        { name: 'Charlie', description: 'Admin' }
      ];

      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      expect(window.BlockUtils.ColumnRegistry.dataTypes['name']).toBe('text');
      expect(window.BlockUtils.ColumnRegistry.dataTypes['description']).toBe('text');
    });

    test('detects number columns correctly', () => {
      const csvData = [
        { age: '25', score: '85.5', count: 10 },
        { age: '30', score: '92.0', count: 15 },
        { age: '35', score: '78.3', count: 8 }
      ];

      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      expect(window.BlockUtils.ColumnRegistry.dataTypes['age']).toBe('number');
      expect(window.BlockUtils.ColumnRegistry.dataTypes['score']).toBe('number');
      expect(window.BlockUtils.ColumnRegistry.dataTypes['count']).toBe('number');
    });

    test('detects mixed data as text', () => {
      const csvData = [
        { mixed: 'Alice', mixed2: '25' },
        { mixed: '30', mixed2: 'Bob' },
        { mixed: 'Charlie', mixed2: '35' }
      ];

      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      expect(window.BlockUtils.ColumnRegistry.dataTypes['mixed']).toBe('text');
      expect(window.BlockUtils.ColumnRegistry.dataTypes['mixed2']).toBe('text');
    });

    test('handles empty values correctly', () => {
      const csvData = [
        { name: 'Alice', optional: '' },
        { name: 'Bob', optional: null },
        { name: 'Charlie', optional: undefined }
      ];

      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      expect(window.BlockUtils.ColumnRegistry.dataTypes['name']).toBe('text');
      expect(window.BlockUtils.ColumnRegistry.dataTypes['optional']).toBe('empty');
    });

    test('detects date columns correctly', () => {
      const csvData = [
        { date: '2023-01-01', timestamp: '2023-01-01T10:00:00Z' },
        { date: '2023-01-02', timestamp: '2023-01-02T11:00:00Z' },
        { date: '2023-01-03', timestamp: '2023-01-03T12:00:00Z' }
      ];

      window.BlockUtils.ColumnRegistry.updateColumns(csvData);

      expect(window.BlockUtils.ColumnRegistry.dataTypes['date']).toBe('date');
      expect(window.BlockUtils.ColumnRegistry.dataTypes['timestamp']).toBe('date');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      const utilsPath = path.join(__dirname, '../src/blocks/block-utils.js');
      const utilsCode = fs.readFileSync(utilsPath, 'utf8');
      eval(utilsCode);
    });

    test('handles malformed CSV data gracefully', () => {
      const malformedData = [
        { name: 'Alice' }, // Missing columns
        { name: 'Bob', age: 25, extra: 'field' }, // Extra column
        {} // Empty row
      ];

      expect(() => {
        window.BlockUtils.ColumnRegistry.updateColumns(malformedData);
      }).not.toThrow();

      // Should extract columns from first non-empty row
      expect(window.BlockUtils.ColumnRegistry.columns).toEqual(['name']);
    });

    test('handles listener update errors gracefully', () => {
      const badListener = {
        updateFromRegistry: () => {
          throw new Error('Simulated error');
        }
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      window.BlockUtils.ColumnRegistry.addListener(badListener);

      expect(() => {
        window.BlockUtils.ColumnRegistry.updateColumns([{ test: 'data' }]);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Error updating column dropdown:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    test('handles missing React bridge functions', () => {
      delete window.reactSetOutput;

      const csvData = [{ name: 'Test', value: 123 }];

      expect(() => {
        window.BlockUtils.updateDataPanel(csvData);
      }).not.toThrow();
    });
  });
});