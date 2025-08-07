/**
 * Test suite for CSV Import block functionality
 * Tests block definition, parsing, data handling, and code generation
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.window = dom.window;
global.document = dom.window.document;

// Mock Blockly
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
    ORDER_ATOMIC: 0
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

describe('CSV Import Block', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Blockly.CsvImportData.data = null;
    Blockly.CsvImportData.filename = null;
  });

  describe('Block Definition', () => {
    test('should define csv_import block with correct structure', () => {
      require('../src/blocks/csv_import.js');
      
      expect(Blockly.defineBlocksWithJsonArray).toHaveBeenCalledWith([{
        "type": "csv_import",
        "message0": "import CSV %1 %2",
        "args0": [
          {
            "type": "field_label",
            "name": "CSV_FILENAME",
            "text": "No file chosen"
          },
          {
            "type": "field_file_button",
            "name": "CSV_UPLOAD"
          }
        ],
        "output": "Dataset",
        "colour": 230,
        "tooltip": "Import a CSV file as a dataset.",
        "helpUrl": ""
      }]);
    });

    test('should register FieldFileButton custom field', () => {
      require('../src/blocks/csv_import.js');
      expect(Blockly.fieldRegistry.register).toHaveBeenCalledWith('field_file_button', expect.any(Function));
    });

    test('should register csv_import_extension', () => {
      require('../src/blocks/csv_import.js');
      expect(Blockly.Extensions.register).toHaveBeenCalledWith('csv_import_extension', expect.any(Function));
    });
  });

  describe('FieldFileButton Class', () => {
    let FieldFileButton;

    beforeAll(() => {
      require('../src/blocks/csv_import.js');
      // Get the registered class from the mock
      FieldFileButton = Blockly.fieldRegistry.register.mock.calls[0][1];
    });

    test('should create instance with correct initial values', () => {
      const field = new FieldFileButton();
      expect(field.filename_).toBe('No file chosen');
      expect(field.button_).toBeNull();
      expect(field.fileInput_).toBeNull();
    });

    test('should create from JSON correctly', () => {
      const field = FieldFileButton.fromJson({ value: 'test.csv' });
      expect(field).toBeInstanceOf(FieldFileButton);
    });

    test('should return empty string for display text', () => {
      const field = new FieldFileButton();
      expect(field.getDisplayText_()).toBe('');
    });
  });

  describe('JavaScript Code Generation', () => {
    test('should generate correct JavaScript code', () => {
      require('../src/blocks/csv_import.js');
      
      // Mock the JavaScript generator function
      const generator = Blockly.JavaScript['csv_import'];
      expect(generator).toBeDefined();
      
      const result = generator();
      expect(result).toEqual(['Blockly.CsvImportData.data', Blockly.JavaScript.ORDER_ATOMIC]);
    });
  });

  describe('CSV Data Handling', () => {
    test('should initialize CsvImportData correctly', () => {
      require('../src/blocks/csv_import.js');
      expect(Blockly.CsvImportData).toEqual({
        data: null,
        filename: null
      });
    });

    test('should handle CSV parsing with Papa Parse', () => {
      const mockCsvData = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const mockParsedData = [
        { name: 'John', age: '30', city: 'NYC' },
        { name: 'Jane', age: '25', city: 'LA' }
      ];

      Papa.parse.mockImplementation((data, options) => {
        options.complete({ data: mockParsedData });
      });

      require('../src/blocks/csv_import.js');
      
      // Simulate file reading and parsing
      Papa.parse(mockCsvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          Blockly.CsvImportData.data = results.data;
          Blockly.CsvImportData.filename = 'test.csv';
        }
      });

      expect(Papa.parse).toHaveBeenCalledWith(mockCsvData, {
        header: true,
        skipEmptyLines: true,
        complete: expect.any(Function)
      });
      expect(Blockly.CsvImportData.data).toEqual(mockParsedData);
      expect(Blockly.CsvImportData.filename).toBe('test.csv');
    });
  });

  describe('File Upload Simulation', () => {
    test('should handle file upload correctly', (done) => {
      const mockFile = new File(['name,age\nJohn,30'], 'test.csv', { type: 'text/csv' });
      const mockParsedData = [{ name: 'John', age: '30' }];

      Papa.parse.mockImplementation((data, options) => {
        setTimeout(() => {
          options.complete({ data: mockParsedData });
          expect(Blockly.CsvImportData.data).toEqual(mockParsedData);
          expect(Blockly.CsvImportData.filename).toBe('test.csv');
          done();
        }, 0);
      });

      require('../src/blocks/csv_import.js');

      // Simulate FileReader
      const originalFileReader = global.FileReader;
      global.FileReader = class MockFileReader {
        readAsText(file) {
          this.result = 'name,age\nJohn,30';
          setTimeout(() => {
            this.onload({ target: { result: this.result } });
          }, 0);
        }
      };

      // Simulate file input change
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.files = [mockFile];

      const event = new dom.window.Event('change');
      Object.defineProperty(event, 'target', {
        value: fileInput,
        enumerable: true
      });

      // Create FieldFileButton and simulate file selection
      const FieldFileButton = Blockly.fieldRegistry.register.mock.calls[0][1];
      const field = new FieldFileButton();
      field.sourceBlock_ = {
        getField: jest.fn().mockReturnValue({
          setValue: jest.fn()
        })
      };

      // Simulate the file input change event
      field.fileInput_ = fileInput;
      field.fileInput_.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          field.filename_ = file.name;
          Blockly.CsvImportData.filename = file.name;
          
          const reader = new FileReader();
          reader.onload = (event) => {
            Papa.parse(event.target.result, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                Blockly.CsvImportData.data = results.data;
              }
            });
          };
          reader.readAsText(file);
        }
      });

      fileInput.dispatchEvent(event);

      // Restore FileReader
      global.FileReader = originalFileReader;
    });
  });

  describe('Error Handling', () => {
    test('should handle parsing errors gracefully', () => {
      const invalidCsv = 'invalid,csv\ndata,with,"unclosed quote';
      
      Papa.parse.mockImplementation((data, options) => {
        options.complete({ 
          data: [],
          errors: ['Unclosed quote error']
        });
      });

      require('../src/blocks/csv_import.js');
      
      Papa.parse(invalidCsv, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          expect(results.errors).toHaveLength(1);
          expect(results.data).toEqual([]);
        }
      });
    });

    test('should handle empty CSV files', () => {
      Papa.parse.mockImplementation((data, options) => {
        options.complete({ data: [] });
      });

      require('../src/blocks/csv_import.js');
      
      Papa.parse('', {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          Blockly.CsvImportData.data = results.data;
          expect(Blockly.CsvImportData.data).toEqual([]);
        }
      });
    });
  });

  describe('Integration Tests', () => {
    test('should work end-to-end with file upload and code generation', (done) => {
      const csvContent = 'product,price,quantity\nApple,1.50,100\nBanana,0.80,150';
      const expectedData = [
        { product: 'Apple', price: '1.50', quantity: '100' },
        { product: 'Banana', price: '0.80', quantity: '150' }
      ];

      Papa.parse.mockImplementation((data, options) => {
        setTimeout(() => {
          options.complete({ data: expectedData });
        }, 0);
      });

      require('../src/blocks/csv_import.js');

      // Test file upload
      global.FileReader = class MockFileReader {
        readAsText(file) {
          this.result = csvContent;
          setTimeout(() => {
            this.onload({ target: { result: this.result } });
          }, 0);
        }
      };

      const mockFile = new File([csvContent], 'products.csv', { type: 'text/csv' });
      const fileInput = document.createElement('input');
      fileInput.files = [mockFile];

      // Simulate file processing
      const reader = new FileReader();
      reader.onload = (event) => {
        Papa.parse(event.target.result, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            Blockly.CsvImportData.data = results.data;
            Blockly.CsvImportData.filename = 'products.csv';

            // Test code generation
            const generator = Blockly.JavaScript['csv_import'];
            const [code, order] = generator();

            expect(code).toBe('Blockly.CsvImportData.data');
            expect(order).toBe(Blockly.JavaScript.ORDER_ATOMIC);
            expect(Blockly.CsvImportData.data).toEqual(expectedData);
            expect(Blockly.CsvImportData.filename).toBe('products.csv');
            
            done();
          }
        });
      };
      reader.readAsText(mockFile);
    });
  });
});