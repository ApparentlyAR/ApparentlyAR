/**
 * Custom Blocks Integration Tests
 * 
 * Tests for the new data cleaning, filtering, transformation, and visualization blocks
 */

// Import required modules
const fs = require('fs');
const path = require('path');

// Mock JSDOM for Blockly compatibility
const { JSDOM } = require('jsdom');

describe('Custom Blocks Integration', () => {
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
      JavaScript: {
        ORDER_ATOMIC: 1,
        ORDER_FUNCTION_CALL: 2,
        ORDER_NONE: 99,
        valueToCode: jest.fn().mockReturnValue('testData'),
        statementToCode: jest.fn().mockReturnValue(''),
        workspaceToCode: jest.fn().mockReturnValue('')
      },
      Field: class MockField {},
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

    // Setup window.BlockUtils
    global.window.BlockUtils = {
      DataPipeline: {
        currentData: null,
        operations: [],
        setCurrentData: jest.fn(),
        getCurrentData: jest.fn(),
        addOperation: jest.fn(),
        clear: jest.fn()
      },
      API: {
        processData: jest.fn().mockResolvedValue([{ test: 'data' }]),
        generateChart: jest.fn().mockResolvedValue({ type: 'bar' })
      },
      registerBlock: jest.fn(),
      updateDataPanel: jest.fn(),
      Colors: {
        DATA_CLEANING: 20,
        DATA_FILTERING: 120,
        DATA_TRANSFORM: 260,
        VISUALIZATION: 330
      }
    };
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.Blockly;
    delete global.Papa;
    dom = null;
  });

  describe('Block Files Loading', () => {
    test('block-utils.js loads without errors', () => {
      const utilsPath = path.join(__dirname, '../src/blocks/block-utils.js');
      expect(fs.existsSync(utilsPath)).toBe(true);
      
      // Read and evaluate the file to ensure it's valid JavaScript
      const utilsCode = fs.readFileSync(utilsPath, 'utf8');
      expect(() => {
        eval(utilsCode);
      }).not.toThrow();
    });

    test('data-cleaning.js loads without errors', () => {
      const cleaningPath = path.join(__dirname, '../src/blocks/data-cleaning.js');
      expect(fs.existsSync(cleaningPath)).toBe(true);
      
      const cleaningCode = fs.readFileSync(cleaningPath, 'utf8');
      expect(() => {
        eval(cleaningCode);
      }).not.toThrow();
      
      // Verify that block definitions were called
      expect(global.Blockly.defineBlocksWithJsonArray).toHaveBeenCalled();
    });

    test('data-filtering.js loads without errors', () => {
      const filteringPath = path.join(__dirname, '../src/blocks/data-filtering.js');
      expect(fs.existsSync(filteringPath)).toBe(true);
      
      const filteringCode = fs.readFileSync(filteringPath, 'utf8');
      expect(() => {
        eval(filteringCode);
      }).not.toThrow();
    });

    test('data-transform.js loads without errors', () => {
      const transformPath = path.join(__dirname, '../src/blocks/data-transform.js');
      expect(fs.existsSync(transformPath)).toBe(true);
      
      const transformCode = fs.readFileSync(transformPath, 'utf8');
      expect(() => {
        eval(transformCode);
      }).not.toThrow();
    });

    test('visualization.js loads without errors', () => {
      const visualizationPath = path.join(__dirname, '../src/blocks/visualization.js');
      expect(fs.existsSync(visualizationPath)).toBe(true);
      
      const visualizationCode = fs.readFileSync(visualizationPath, 'utf8');
      expect(() => {
        eval(visualizationCode);
      }).not.toThrow();
    });
  });

  describe('Block Utils Functionality', () => {
    beforeEach(() => {
      // Load block-utils.js
      const utilsPath = path.join(__dirname, '../src/blocks/block-utils.js');
      const utilsCode = fs.readFileSync(utilsPath, 'utf8');
      eval(utilsCode);
    });

    test('DataPipeline manages current data', () => {
      const testData = [{ name: 'John', age: 30 }];
      
      window.BlockUtils.DataPipeline.setCurrentData(testData);
      expect(window.BlockUtils.DataPipeline.getCurrentData()).toBe(testData);
    });

    test('updateDataPanel function exists and works', () => {
      const testData = [{ name: 'Jane', age: 25 }];
      
      expect(() => {
        window.BlockUtils.updateDataPanel(testData);
      }).not.toThrow();
    });

    test('registerBlock function registers generators', () => {
      const mockGenerator = jest.fn();
      
      window.BlockUtils.registerBlock('test_block', mockGenerator);
      
      expect(global.Blockly.JavaScript['test_block']).toBe(mockGenerator);
    });
  });

  describe('Block Definitions', () => {
    test('Data cleaning blocks are defined', () => {
      const cleaningPath = path.join(__dirname, '../src/blocks/data-cleaning.js');
      const cleaningCode = fs.readFileSync(cleaningPath, 'utf8');
      
      // Reset the mock before evaluation
      global.Blockly.defineBlocksWithJsonArray.mockClear();
      
      eval(cleaningCode);
      
      // Should have called defineBlocksWithJsonArray with block definitions
      expect(global.Blockly.defineBlocksWithJsonArray).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'convert_type' }),
          expect.objectContaining({ type: 'drop_column' }),
          expect.objectContaining({ type: 'rename_column' }),
          expect.objectContaining({ type: 'handle_missing' })
        ])
      );
    });

    test('Data filtering blocks are defined', () => {
      const filteringPath = path.join(__dirname, '../src/blocks/data-filtering.js');
      const filteringCode = fs.readFileSync(filteringPath, 'utf8');
      
      global.Blockly.defineBlocksWithJsonArray.mockClear();
      eval(filteringCode);
      
      expect(global.Blockly.defineBlocksWithJsonArray).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'filter_data' }),
          expect.objectContaining({ type: 'select_columns' }),
          expect.objectContaining({ type: 'sort_data' })
        ])
      );
    });

    test('Data transformation blocks are defined', () => {
      const transformPath = path.join(__dirname, '../src/blocks/data-transform.js');
      const transformCode = fs.readFileSync(transformPath, 'utf8');
      
      global.Blockly.defineBlocksWithJsonArray.mockClear();
      eval(transformCode);
      
      expect(global.Blockly.defineBlocksWithJsonArray).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'group_by' }),
          expect.objectContaining({ type: 'aggregate' }),
          expect.objectContaining({ type: 'calculate_field' })
        ])
      );
    });

    test('Visualization blocks are defined', () => {
      const visualizationPath = path.join(__dirname, '../src/blocks/visualization.js');
      const visualizationCode = fs.readFileSync(visualizationPath, 'utf8');
      
      global.Blockly.defineBlocksWithJsonArray.mockClear();
      eval(visualizationCode);
      
      expect(global.Blockly.defineBlocksWithJsonArray).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'set_chart_type' }),
          expect.objectContaining({ type: 'quick_chart' }),
          expect.objectContaining({ type: 'generate_visualization' })
        ])
      );
    });
  });

  describe('Block Color Schemes', () => {
    beforeEach(() => {
      const utilsPath = path.join(__dirname, '../src/blocks/block-utils.js');
      const utilsCode = fs.readFileSync(utilsPath, 'utf8');
      eval(utilsCode);
    });

    test('Block colors are properly defined', () => {
      expect(window.BlockUtils.Colors.DATA_CLEANING).toBe(20);
      expect(window.BlockUtils.Colors.DATA_FILTERING).toBe(120);
      expect(window.BlockUtils.Colors.DATA_TRANSFORM).toBe(260);
      expect(window.BlockUtils.Colors.VISUALIZATION).toBe(330);
    });

    test('Block definitions use correct colors', () => {
      const cleaningPath = path.join(__dirname, '../src/blocks/data-cleaning.js');
      const cleaningCode = fs.readFileSync(cleaningPath, 'utf8');
      eval(cleaningCode);
      
      // Check that the defineBlocksWithJsonArray was called with blocks having the correct color
      const calls = global.Blockly.defineBlocksWithJsonArray.mock.calls;
      const cleaningBlocks = calls[0][0]; // First call should be cleaning blocks
      
      cleaningBlocks.forEach(block => {
        expect(block.colour).toBe(20); // DATA_CLEANING color
      });
    });
  });

  describe('Block Integration Flow', () => {
    beforeEach(() => {
      // Load all block files
      const utilsPath = path.join(__dirname, '../src/blocks/block-utils.js');
      const utilsCode = fs.readFileSync(utilsPath, 'utf8');
      eval(utilsCode);
    });

    test('Data pipeline flows correctly', () => {
      const sampleData = [
        { name: 'Alice', age: 30, score: 85 },
        { name: 'Bob', age: 25, score: 92 },
        { name: 'Charlie', age: 35, score: 78 }
      ];

      // Test data pipeline management
      window.BlockUtils.DataPipeline.setCurrentData(sampleData);
      expect(window.BlockUtils.DataPipeline.getCurrentData()).toEqual(sampleData);
      
      // Test adding operations
      const operation = { type: 'filter', params: { column: 'age', operator: 'greater_than', value: 26 } };
      window.BlockUtils.DataPipeline.addOperation(operation);
      
      // Test clearing pipeline
      window.BlockUtils.DataPipeline.clear();
      expect(window.BlockUtils.DataPipeline.getCurrentData()).toBeNull();
    });

    test('API helpers work correctly', async () => {
      const sampleData = [{ name: 'Test', value: 100 }];
      const operations = [{ type: 'filter', params: {} }];
      
      // Test data processing API
      const result = await window.BlockUtils.API.processData(sampleData, operations);
      expect(result).toEqual([{ test: 'data' }]);
      expect(window.BlockUtils.API.processData).toHaveBeenCalledWith(sampleData, operations);
      
      // Test chart generation API
      const chartResult = await window.BlockUtils.API.generateChart(sampleData, 'bar', { title: 'Test' });
      expect(chartResult).toEqual({ type: 'bar' });
      expect(window.BlockUtils.API.generateChart).toHaveBeenCalledWith(sampleData, 'bar', { title: 'Test' });
    });
  });
});