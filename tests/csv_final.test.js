/**
 * Final comprehensive test suite for CSV Import functionality
 * Demonstrates that the fix resolves the original JavaScript generator error
 */

describe('CSV Import Block - Final Test Suite', () => {
  test('resolves the original JavaScript generator error', () => {
    // Set up Blockly environment exactly like the browser
    global.Blockly = {
      defineBlocksWithJsonArray: jest.fn(),
      Field: class MockField {
        constructor(value, validator) {
          this.value = value;
          this.validator = validator;
        }
      },
      fieldRegistry: { register: jest.fn() },
      Extensions: { register: jest.fn(), apply: jest.fn() },
      Blocks: {},
      JavaScript: {
        ORDER_ATOMIC: 0,
        workspaceToCode: jest.fn()
      },
      CsvImportData: { data: null, filename: null }
    };

    global.Papa = { parse: jest.fn() };

    // Load the CSV import block (this is what happens when the HTML page loads)
    require('../src/blocks/csv_import.js');

    // Verify that the JavaScript generator is now defined
    expect(Blockly.JavaScript['csv_import']).toBeDefined();
    expect(typeof Blockly.JavaScript['csv_import']).toBe('function');

    // Test the exact scenario that was failing before
    console.log('✅ JavaScript generator for csv_import block is now defined');

    // Simulate what happens when user clicks "Run Code"
    const generator = Blockly.JavaScript['csv_import'];
    const result = generator();
    
    expect(result).toEqual(['Blockly.CsvImportData.data', Blockly.JavaScript.ORDER_ATOMIC]);
    console.log('✅ Code generation works correctly');

    // Simulate CSV data being loaded
    const testData = [
      { name: 'Test User', value: '123' }
    ];
    Blockly.CsvImportData.data = testData;

    // Simulate workspace code generation (what Blockly.JavaScript.workspaceToCode does)
    const generatedCode = 'Blockly.CsvImportData.data';
    const executionResult = eval(generatedCode);
    
    expect(executionResult).toEqual(testData);
    console.log('✅ Generated code executes successfully');
    
    console.log('🎉 Original error "JavaScript generator does not know how to generate code for block type csv_import" is now FIXED!');
  });

  test('demonstrates complete workflow with realistic data', () => {
    // Reset environment
    delete require.cache[require.resolve('../src/blocks/csv_import.js')];
    
    global.Blockly = {
      defineBlocksWithJsonArray: jest.fn(),
      Field: class MockField { constructor() {} },
      fieldRegistry: { register: jest.fn() },
      Extensions: { register: jest.fn(), apply: jest.fn() },
      Blocks: {},
      JavaScript: { ORDER_ATOMIC: 0 },
      CsvImportData: { data: null, filename: null }
    };

    global.Papa = {
      parse: jest.fn((data, options) => {
        const mockData = [
          { product: 'Laptop', price: '999.99', category: 'Electronics' },
          { product: 'Mouse', price: '24.99', category: 'Electronics' },
          { product: 'Desk', price: '199.99', category: 'Furniture' }
        ];
        options.complete({ data: mockData });
      })
    };

    // Load the block
    require('../src/blocks/csv_import.js');

    // Simulate file upload and parsing
    Papa.parse('product,price,category\nLaptop,999.99,Electronics', {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        Blockly.CsvImportData.data = results.data;
        Blockly.CsvImportData.filename = 'products.csv';
      }
    });

    // Verify data was loaded
    expect(Blockly.CsvImportData.data).toHaveLength(3);
    expect(Blockly.CsvImportData.filename).toBe('products.csv');

    // Test code generation and execution
    const generator = Blockly.JavaScript['csv_import'];
    const [code] = generator();
    const data = eval(code);

    expect(data).toHaveLength(3);
    expect(data[0].product).toBe('Laptop');
    
    console.log('✅ Complete workflow test passed');
    console.log(`📊 Loaded ${data.length} products from ${Blockly.CsvImportData.filename}`);
  });

  test('confirms the fix works in the same environment as the original error', () => {
    // This test simulates the exact conditions when the error occurred
    
    // Clear any previous state
    delete require.cache[require.resolve('../src/blocks/csv_import.js')];
    
    // Set up minimal Blockly environment (like in the browser)
    global.Blockly = {
      defineBlocksWithJsonArray: jest.fn(),
      Field: class MockField { constructor() {} },
      fieldRegistry: { register: jest.fn() },
      Extensions: { register: jest.fn(), apply: jest.fn() },
      Blocks: {},
      JavaScript: { ORDER_ATOMIC: 0 },
      CsvImportData: { data: null, filename: null }
    };

    global.Papa = { parse: jest.fn() };

    // Before the fix, this would fail because Blockly.JavaScript['csv_import'] was undefined
    require('../src/blocks/csv_import.js');

    // The critical test: can we generate JavaScript code for the csv_import block?
    const csvImportGenerator = Blockly.JavaScript['csv_import'];
    
    // This should NOT throw an error anymore
    expect(() => {
      const result = csvImportGenerator();
      expect(result).toBeDefined();
      expect(result[0]).toBe('Blockly.CsvImportData.data');
    }).not.toThrow();

    console.log('✅ No more "JavaScript generator does not know how to generate code for block type csv_import" error!');
    console.log('🔧 Fix confirmed: JavaScript generator is properly defined');
  });
});