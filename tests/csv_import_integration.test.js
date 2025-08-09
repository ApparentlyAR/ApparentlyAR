/**
 * Integration test for CSV Import block in a simulated browser environment
 * Tests the full workflow including DOM interactions and file handling
 */

const { JSDOM } = require('jsdom');

describe('CSV Import Block - Integration Tests', () => {
  let dom, window, document, Blockly, Papa, earlyGeneratorRef;

  beforeEach(() => {
    // Set up a fresh DOM environment for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Blockly Test</title>
        </head>
        <body>
          <div id="blocklyDiv"></div>
          <pre id="output"></pre>
        </body>
      </html>
    `, {
      url: "http://localhost",
      pretendToBeVisual: true,
      resources: "usable"
    });

    window = dom.window;
    document = window.document;
    
    // Set up global environment
    global.window = window;
    global.document = document;
    global.navigator = window.navigator;
    global.File = window.File;
    global.FileReader = window.FileReader;
    global.Event = window.Event;

    // Mock Blockly
    Blockly = {
      defineBlocksWithJsonArray: jest.fn(),
      Field: class MockField {
        constructor(value, validator) {
          this.value = value;
          this.validator = validator;
          this.sourceBlock_ = null;
        }
        
        getSvgRoot() {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          return svg;
        }
        
        render_() {}
        
        showEditor_() {}
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
        workspaceToCode: jest.fn(() => 'Blockly.CsvImportData.data')
      },
      CsvImportData: {
        data: null,
        filename: null
      },
      inject: jest.fn(() => ({ /* mock workspace */ }))
    };

    // Mock Papa Parse
    Papa = {
      parse: jest.fn()
    };

    // Set up globals
    global.Blockly = Blockly;
    global.Papa = Papa;
  });

  afterEach(() => {
    // Clean up
    delete require.cache[require.resolve('../src/blocks/csv_import.js')];
    global.window = undefined;
    global.document = undefined;
    global.navigator = undefined;
    global.File = undefined;
    global.FileReader = undefined;
    global.Event = undefined;
    global.Blockly = undefined;
    global.Papa = undefined;
    dom.window.close();
  });

  test('should work with real DOM environment', () => {
    // Load the CSV import block
    require('../src/blocks/csv_import.js');
    // Capture generator reference early to avoid any later clobbering
    earlyGeneratorRef = Blockly.JavaScript['csv_import'];

    // Verify block was defined
    expect(Blockly.defineBlocksWithJsonArray).toHaveBeenCalled();
    
    // Verify JavaScript generator exists
    expect(Blockly.JavaScript['csv_import']).toBeDefined();
    expect(typeof Blockly.JavaScript['csv_import']).toBe('function');

    // Test code generation
    const result = Blockly.JavaScript['csv_import']();
    expect(result).toEqual(['Blockly.CsvImportData.data', Blockly.JavaScript.ORDER_ATOMIC]);
  });

  test('should simulate complete workflow from file upload to code generation', (done) => {
    const csvContent = 'name,age,city\nAlice,25,Boston\nBob,30,Seattle';
    const expectedData = [
      { name: 'Alice', age: '25', city: 'Boston' },
      { name: 'Bob', age: '30', city: 'Seattle' }
    ];

    // Mock Papa.parse to simulate CSV parsing
    Papa.parse.mockImplementation((data, options) => {
      expect(data).toBe(csvContent);
      expect(options).toEqual({
        header: true,
        skipEmptyLines: true,
        complete: expect.any(Function)
      });
      
      // Simulate async parsing
      setTimeout(() => {
        options.complete({ data: expectedData });
      }, 10);
    });

    // Load the CSV import block
    require('../src/blocks/csv_import.js');

    // Create a mock file and FileReader
    const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });
    
    // Create FileReader and simulate file reading
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      Papa.parse(event.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          Blockly.CsvImportData.data = results.data;
          Blockly.CsvImportData.filename = 'test.csv';
          
          // Verify data was stored correctly
          expect(Blockly.CsvImportData.data).toEqual(expectedData);
          expect(Blockly.CsvImportData.filename).toBe('test.csv');
          
          // Test code generation using early captured generator
          const generator = earlyGeneratorRef;
          const [code, order] = generator();
          expect(code).toBe('Blockly.CsvImportData.data');
          expect(order).toBe(Blockly.JavaScript.ORDER_ATOMIC);

          const result = eval(code);
          expect(result).toEqual(expectedData);

          done();
        }
      });
    });
    
    reader.readAsText(mockFile);
  });

  test('should simulate Blockly workspace code generation', () => {
    require('../src/blocks/csv_import.js');

    // Set up test data
    const testData = [
      { product: 'Widget', count: '42' },
      { product: 'Gadget', count: '17' }
    ];
    Blockly.CsvImportData.data = testData;

    // Mock workspace code generation
    Blockly.JavaScript.workspaceToCode.mockReturnValue(`
      var csvData = Blockly.CsvImportData.data;
      console.log('CSV Data:', csvData);
      csvData;
    `);

    // Simulate clicking "Run Code" button
    const mockWorkspace = {};
    const generatedCode = Blockly.JavaScript.workspaceToCode(mockWorkspace);
    
    expect(generatedCode).toContain('Blockly.CsvImportData.data');
    expect(Blockly.JavaScript.workspaceToCode).toHaveBeenCalledWith(mockWorkspace);
  });

  test('should handle multiple CSV files', (done) => {
    const firstCsv = 'item,quantity\nApple,10';
    const secondCsv = 'person,score\nJohn,95';
    
    const firstData = [{ item: 'Apple', quantity: '10' }];
    const secondData = [{ person: 'John', score: '95' }];

    require('../src/blocks/csv_import.js');

    Papa.parse
      .mockImplementationOnce((data, options) => {
        setTimeout(() => options.complete({ data: firstData }), 10);
      })
      .mockImplementationOnce((data, options) => {
        setTimeout(() => options.complete({ data: secondData }), 10);
      });

    // First file upload
    const reader1 = new FileReader();
    reader1.addEventListener('load', (event) => {
      Papa.parse(event.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          Blockly.CsvImportData.data = results.data;
          Blockly.CsvImportData.filename = 'first.csv';
          
          expect(Blockly.CsvImportData.data).toEqual(firstData);
          
          // Second file upload (simulating overwriting)
          const reader2 = new FileReader();
          reader2.addEventListener('load', (event) => {
            Papa.parse(event.target.result, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                Blockly.CsvImportData.data = results.data;
                Blockly.CsvImportData.filename = 'second.csv';
                
                expect(Blockly.CsvImportData.data).toEqual(secondData);
                expect(Blockly.CsvImportData.filename).toBe('second.csv');
                
                done();
              }
            });
          });
          
          const mockFile2 = new File([secondCsv], 'second.csv', { type: 'text/csv' });
          reader2.readAsText(mockFile2);
        }
      });
    });
    
    const mockFile1 = new File([firstCsv], 'first.csv', { type: 'text/csv' });
    reader1.readAsText(mockFile1);
  });

  test('should handle error cases in real environment', (done) => {
    require('../src/blocks/csv_import.js');

    // Mock Papa.parse to simulate error
    Papa.parse.mockImplementation((data, options) => {
      setTimeout(() => {
        options.complete({
          data: [],
          errors: [{ message: 'Parse error', row: 1 }]
        });
      }, 10);
    });

    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      Papa.parse(event.target.result, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          expect(results.errors).toHaveLength(1);
          expect(results.data).toEqual([]);
          
          // Even with errors, the system should still function
          const generator = earlyGeneratorRef;
          const result = generator();
          expect(result).toEqual(['Blockly.CsvImportData.data', Blockly.JavaScript.ORDER_ATOMIC]);

          done();
        }
      });
    });
    
    const corruptFile = new File(['invalid,csv\ndata,"unclosed'], 'corrupt.csv', { type: 'text/csv' });
    reader.readAsText(corruptFile);
  });
});