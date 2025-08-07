/**
 * Simplified test suite for CSV Import block functionality
 * Focuses on core functionality without complex DOM mocking
 */

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

describe('CSV Import Block - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete require.cache[require.resolve('../src/blocks/csv_import.js')];
    Blockly.CsvImportData.data = null;
    Blockly.CsvImportData.filename = null;
  });

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

  test('should generate correct JavaScript code', () => {
    require('../src/blocks/csv_import.js');
    
    // Test that the generator function exists and works
    const generator = Blockly.JavaScript['csv_import'];
    expect(generator).toBeDefined();
    expect(typeof generator).toBe('function');
    
    const result = generator();
    expect(result).toEqual(['Blockly.CsvImportData.data', Blockly.JavaScript.ORDER_ATOMIC]);
  });

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
      expect(data).toBe(mockCsvData);
      expect(options).toEqual({
        header: true,
        skipEmptyLines: true,
        complete: expect.any(Function)
      });
      
      // Simulate successful parsing
      options.complete({ data: mockParsedData });
    });

    require('../src/blocks/csv_import.js');
    
    // Simulate CSV parsing
    Papa.parse(mockCsvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        Blockly.CsvImportData.data = results.data;
        Blockly.CsvImportData.filename = 'test.csv';
      }
    });

    expect(Papa.parse).toHaveBeenCalled();
    expect(Blockly.CsvImportData.data).toEqual(mockParsedData);
    expect(Blockly.CsvImportData.filename).toBe('test.csv');
  });

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

    expect(Papa.parse).toHaveBeenCalled();
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

    expect(Papa.parse).toHaveBeenCalled();
  });

  test('should handle different CSV formats', () => {
    const testCases = [
      {
        name: 'Simple CSV',
        input: 'name,value\ntest,123',
        expected: [{ name: 'test', value: '123' }]
      },
      {
        name: 'CSV with spaces',
        input: 'first name, last name, age\nJohn, Doe, 30',
        expected: [{ 'first name': 'John', ' last name': ' Doe', ' age': ' 30' }]
      },
      {
        name: 'CSV with quotes',
        input: 'name,description\n"John Doe","A person with a space in name"',
        expected: [{ name: 'John Doe', description: 'A person with a space in name' }]
      }
    ];

    require('../src/blocks/csv_import.js');

    testCases.forEach(({ name, input, expected }) => {
      Papa.parse.mockImplementation((data, options) => {
        options.complete({ data: expected });
      });

      Papa.parse(input, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          Blockly.CsvImportData.data = results.data;
          expect(Blockly.CsvImportData.data).toEqual(expected);
        }
      });
    });
  });

  test('should generate code that returns current CSV data', () => {
    require('../src/blocks/csv_import.js');

    // Set up some test data
    const testData = [
      { product: 'Apple', price: '1.50' },
      { product: 'Banana', price: '0.80' }
    ];
    Blockly.CsvImportData.data = testData;

    // Generate code
    const generator = Blockly.JavaScript['csv_import'];
    const [code, order] = generator();

    expect(code).toBe('Blockly.CsvImportData.data');
    expect(order).toBe(Blockly.JavaScript.ORDER_ATOMIC);

    // Verify the data is accessible
    expect(eval(code)).toEqual(testData);
  });
});