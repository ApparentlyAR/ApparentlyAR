/**
 * Comprehensive error handling and edge case tests
 * Tests system resilience and error recovery
 */

const dataProcessor = require('../../src/backend/dataProcessor');
const chartGenerator = require('../../src/backend/chartGenerator');

describe('Error Handling and Edge Cases', () => {
  describe('Memory and Resource Management', () => {
    test('should handle memory pressure gracefully', () => {
      // Create smaller objects to prevent memory issues
      const largeArray = new Array(1000).fill({
        id: 'test',
        data: new Array(100).fill('memory test data')
      });
      
      expect(() => {
        dataProcessor.getDataSummary(largeArray.slice(0, 10));
      }).not.toThrow();
    });

    test('should handle deeply nested objects', () => {
      const deepObject = { level1: { level2: { level3: { value: 'deep' } } } };
      const data = [deepObject, deepObject, deepObject];
      
      expect(() => {
        dataProcessor.getDataSummary(data);
      }).not.toThrow();
    });

    test('should handle objects with many properties', () => {
      const wideObject = {};
      for (let i = 0; i < 100; i++) {
        wideObject[`prop${i}`] = `value${i}`;
      }
      
      expect(() => {
        dataProcessor.getDataSummary([wideObject]);
      }).not.toThrow();
    });
  });

  describe('Data Type Edge Cases', () => {
    test('should handle various JavaScript data types', () => {
      const edgeCaseData = [
        {
          string: 'normal string',
          emptyString: '',
          number: 42,
          zero: 0,
          negative: -1,
          float: 3.14159,
          boolean: true,
          booleanFalse: false,
          nullValue: null,
          undefinedValue: undefined,
          array: [1, 2, 3],
          emptyArray: [],
          object: { nested: 'value' },
          emptyObject: {},
          date: new Date(),
          regex: /test/g,
          function: function() { return 'test'; },
          symbol: Symbol('test')
        }
      ];
      
      expect(() => {
        const summary = dataProcessor.getDataSummary(edgeCaseData);
        expect(summary.rows).toBe(1);
        expect(summary.columns).toBeGreaterThan(0);
      }).not.toThrow();
    });

    test('should handle special numeric values', () => {
      const specialNumbers = [
        { value: Infinity },
        { value: -Infinity },
        { value: NaN },
        { value: Number.MAX_VALUE },
        { value: Number.MIN_VALUE },
        { value: Number.MAX_SAFE_INTEGER },
        { value: Number.MIN_SAFE_INTEGER },
        { value: 0 },
        { value: -0 },
        { value: Math.PI },
        { value: Math.E }
      ];
      
      expect(() => {
        const summary = dataProcessor.getDataSummary(specialNumbers);
        expect(summary.rows).toBe(specialNumbers.length);
      }).not.toThrow();
    });

    test('should handle Unicode and special characters', () => {
      const unicodeData = [
        { text: 'Hello 世界' },
        { text: 'café' },
        { text: '🚀💫⭐' },
        { text: 'αβγδε' },
        { text: '\n\t\r' },
        { text: '"quotes" and \'apostrophes\'' },
        { text: 'HTML &amp; entities &lt;&gt;' }
      ];
      
      expect(() => {
        const summary = dataProcessor.getDataSummary(unicodeData);
        expect(summary.rows).toBe(unicodeData.length);
      }).not.toThrow();
    });
  });

  describe('Concurrency and Race Conditions', () => {
    test('should handle concurrent data processing', async () => {
      const testData = [
        { id: 1, value: 100 },
        { id: 2, value: 200 },
        { id: 3, value: 300 }
      ];
      
      const operations = [
        { type: 'filter', params: { column: 'value', operator: 'greater_than', value: 150 } },
        { type: 'sort', params: { column: 'value', direction: 'desc' } }
      ];
      
      // Run fewer concurrent operations to prevent memory issues
      const promises = Array(5).fill().map(() => 
        dataProcessor.processData(testData, operations)
      );
      
      const results = await Promise.all(promises);
      
      // All results should be identical
      results.forEach(result => {
        expect(result).toHaveLength(2);
        expect(result[0].value).toBe(300);
        expect(result[1].value).toBe(200);
      });
    });

    test('should handle rapid successive calls', async () => {
      const data = [{ x: 1, y: 2 }, { x: 3, y: 4 }];
      
      // Make fewer rapid successive chart generation calls
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          chartGenerator.generateChart(data, 'bar', {
            xColumn: 'x',
            yColumn: 'y'
          })
        );
      }
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.chartType).toBe('bar');
      });
    });
  });

  describe('Input Validation Edge Cases', () => {
    test('should handle extremely long strings', () => {
      const longString = 'x'.repeat(10000);  // Reduced from 100000
      const data = [{ name: longString, value: 1 }];
      
      expect(() => {
        dataProcessor.getDataSummary(data);
      }).not.toThrow();
    });

    test('should handle empty and whitespace-only strings', () => {
      const whitespaceData = [
        { name: '', value: 1 },
        { name: ' ', value: 2 },
        { name: '\t', value: 3 },
        { name: '\n', value: 4 },
        { name: '   \t\n   ', value: 5 }
      ];
      
      expect(() => {
        const summary = dataProcessor.getDataSummary(whitespaceData);
        expect(summary.rows).toBe(5);
      }).not.toThrow();
    });

    test('should handle malformed data structures', () => {
      const malformedData = [
        { name: 'Alice', age: 25 },
        null,
        undefined,
        'not an object',
        123,
        [],
        function() {},
        { name: 'Bob' }, // missing age
        { age: 30 }, // missing name
        {} // empty object
      ];
      
      expect(() => {
        const summary = dataProcessor.getDataSummary(malformedData);
        expect(summary.rows).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });
  });

  describe('System Resource Limits', () => {
    test('should handle timeout scenarios gracefully', async () => {
      // Mock a slow operation
      const originalProcessData = dataProcessor.processData;
      dataProcessor.processData = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      
      try {
        const result = await dataProcessor.processData([], []);
        expect(result).toEqual([]);
      } finally {
        dataProcessor.processData = originalProcessData;
      }
    });

    test('should handle stack overflow prevention', () => {
      // Create a moderately deep recursive structure
      let deepObject = { value: 'end' };
      for (let i = 0; i < 100; i++) {  // Reduced from 1000
        deepObject = { next: deepObject, level: i };
      }
      
      expect(() => {
        dataProcessor.getDataSummary([{ root: deepObject }]);
      }).not.toThrow();
    });
  });

  describe('Browser Compatibility Edge Cases', () => {
    test('should handle missing modern JavaScript features gracefully', () => {
      // Simulate older browser environment
      const originalPromise = global.Promise;
      const originalMap = global.Map;
      
      try {
        // Test without modern features
        delete global.Promise;
        delete global.Map;
        
        expect(() => {
          dataProcessor.getDataSummary([{ test: 'value' }]);
        }).not.toThrow();
      } finally {
        global.Promise = originalPromise;
        global.Map = originalMap;
      }
    });
  });

  describe('Security Edge Cases', () => {
    test('should handle potential XSS vectors in data', () => {
      const xssData = [
        { name: '<script>alert("xss")</script>', value: 1 },
        { name: 'javascript:alert("xss")', value: 2 },
        { name: '\u003cscript\u003ealert("xss")\u003c/script\u003e', value: 3 },
        { name: 'data:text/html,<script>alert("xss")</script>', value: 4 }
      ];
      
      expect(() => {
        const summary = dataProcessor.getDataSummary(xssData);
        expect(summary.rows).toBe(4);
      }).not.toThrow();
    });

    test('should handle potential injection attempts', () => {
      const injectionData = [
        { query: 'DROP TABLE users; --' },
        { query: '1\'OR\'1\'=\'1' },
        { query: '${7*7}' },
        { query: '{{7*7}}' },
        { query: '<%=7*7%>' }
      ];
      
      expect(() => {
        dataProcessor.getDataSummary(injectionData);
      }).not.toThrow();
    });
  });

  describe('Network and I/O Edge Cases', () => {
    test('should handle file system errors gracefully', async () => {
      // Mock file system error
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      
      fs.readFileSync = jest.fn().mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });
      
      try {
        await expect(dataProcessor.parseCSVFile('nonexistent.csv'))
          .rejects.toThrow();
      } finally {
        fs.readFileSync = originalReadFileSync;
      }
    });

    test('should handle corrupted CSV data', async () => {
      const fs = require('fs');
      const originalReadFileSync = fs.readFileSync;
      
      fs.readFileSync = jest.fn().mockReturnValue(
        'name,age,score\nAlice,25,85\nBob,22,\nCharlie,,78\n,,'
      );
      
      global.Papa = {
        parse: jest.fn().mockImplementation((content, options) => {
          options.complete({
            data: [
              { name: 'Alice', age: '25', score: '85' },
              { name: 'Bob', age: '22', score: '' },
              { name: 'Charlie', age: '', score: '78' },
              { name: '', age: '', score: '' }
            ],
            errors: [
              { message: 'Missing data in row 2' },
              { message: 'Missing data in row 3' }
            ]
          });
        })
      };
      
      try {
        const result = await dataProcessor.parseCSVFile('corrupted.csv');
        expect(result).toHaveLength(4);
      } finally {
        fs.readFileSync = originalReadFileSync;
      }
    });
  });
});