const dataProcessor = require('../../src/backend/dataProcessor');

describe('DataProcessor', () => {
  const sampleData = [
    { name: 'Alice', age: 25, score: 85, grade: 'A' },
    { name: 'Bob', age: 22, score: 92, grade: 'A' },
    { name: 'Charlie', age: 28, score: 78, grade: 'B' },
    { name: 'Diana', age: 24, score: 95, grade: 'A' },
    { name: 'Eve', age: 26, score: 88, grade: 'A' }
  ];

  describe('getDataSummary', () => {
    test('should return correct summary for valid data', () => {
      const summary = dataProcessor.getDataSummary(sampleData);
      
      expect(summary.rows).toBe(5);
      expect(summary.columns).toBe(4);
      expect(summary.summary.name.type).toBe('text');
      expect(summary.summary.age.type).toBe('numeric');
      expect(summary.summary.age.min).toBe(22);
      expect(summary.summary.age.max).toBe(28);
      expect(summary.summary.age.average).toBe(25);
    });

    test('should handle empty data', () => {
      const summary = dataProcessor.getDataSummary([]);
      
      expect(summary.rows).toBe(0);
      expect(summary.columns).toBe(0);
      expect(summary.summary).toEqual({});
    });

    test('should handle null data', () => {
      const summary = dataProcessor.getDataSummary(null);
      
      expect(summary.rows).toBe(0);
      expect(summary.columns).toBe(0);
      expect(summary.summary).toEqual({});
    });

    test('should handle mixed data types', () => {
      const mixedData = [
        { text: 'hello', number: 10, mixed: 'abc' },
        { text: 'world', number: 20, mixed: 123 }
      ];
      
      const summary = dataProcessor.getDataSummary(mixedData);
      
      expect(summary.summary.text.type).toBe('text');
      expect(summary.summary.number.type).toBe('numeric');
      expect(summary.summary.mixed.type).toBe('text'); // mixed becomes text
    });
  });

  describe('filterData', () => {
    test('should filter by equals', () => {
      const result = dataProcessor.filterData(sampleData, {
        column: 'grade',
        operator: 'equals',
        value: 'A'
      });
      
      expect(result).toHaveLength(4);
      expect(result.every(row => row.grade === 'A')).toBe(true);
    });

    test('should filter by greater_than', () => {
      const result = dataProcessor.filterData(sampleData, {
        column: 'score',
        operator: 'greater_than',
        value: 85
      });
      
      expect(result).toHaveLength(3);
      expect(result.every(row => row.score > 85)).toBe(true);
    });

    test('should filter by less_than', () => {
      const result = dataProcessor.filterData(sampleData, {
        column: 'age',
        operator: 'less_than',
        value: 25
      });
      
      expect(result).toHaveLength(2);
      expect(result.every(row => row.age < 25)).toBe(true);
    });

    test('should filter by contains', () => {
      const result = dataProcessor.filterData(sampleData, {
        column: 'name',
        operator: 'contains',
        value: 'a'
      });
      
      expect(result).toHaveLength(3); // Alice, Charlie, Diana
    });

    test('should filter by starts_with', () => {
      const result = dataProcessor.filterData(sampleData, {
        column: 'name',
        operator: 'starts_with',
        value: 'A'
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    test('should filter by ends_with', () => {
      const result = dataProcessor.filterData(sampleData, {
        column: 'name',
        operator: 'ends_with',
        value: 'e'
      });
      
      expect(result).toHaveLength(3); // Alice, Charlie, Eve
    });

    test('should handle unknown operator', () => {
      const result = dataProcessor.filterData(sampleData, {
        column: 'name',
        operator: 'unknown',
        value: 'test'
      });
      
      expect(result).toHaveLength(5); // Should return all data
    });
  });

  describe('sortData', () => {
    test('should sort ascending by default', () => {
      const result = dataProcessor.sortData(sampleData, {
        column: 'age'
      });
      
      expect(result[0].age).toBe(22);
      expect(result[4].age).toBe(28);
    });

    test('should sort descending', () => {
      const result = dataProcessor.sortData(sampleData, {
        column: 'age',
        direction: 'desc'
      });
      
      expect(result[0].age).toBe(28);
      expect(result[4].age).toBe(22);
    });

    test('should sort text data', () => {
      const result = dataProcessor.sortData(sampleData, {
        column: 'name'
      });
      
      expect(result[0].name).toBe('Alice');
      expect(result[4].name).toBe('Eve');
    });

    test('should handle numeric sorting for string numbers', () => {
      const stringData = [
        { id: '10', name: 'Ten' },
        { id: '2', name: 'Two' },
        { id: '1', name: 'One' }
      ];
      
      const result = dataProcessor.sortData(stringData, {
        column: 'id'
      });
      
      expect(result[0].id).toBe('1');
      expect(result[2].id).toBe('10');
    });
  });

  describe('aggregateData', () => {
    test('should calculate sum', () => {
      const result = dataProcessor.aggregateData(sampleData, {
        column: 'score',
        operation: 'sum'
      });
      
      expect(result).toBe(438); // 85 + 92 + 78 + 95 + 88
    });

    test('should calculate average', () => {
      const result = dataProcessor.aggregateData(sampleData, {
        column: 'score',
        operation: 'average'
      });
      
      expect(result).toBe(87.6); // 438 / 5
    });

    test('should calculate count', () => {
      const result = dataProcessor.aggregateData(sampleData, {
        column: 'score',
        operation: 'count'
      });
      
      expect(result).toBe(5);
    });

    test('should calculate min', () => {
      const result = dataProcessor.aggregateData(sampleData, {
        column: 'score',
        operation: 'min'
      });
      
      expect(result).toBe(78);
    });

    test('should calculate max', () => {
      const result = dataProcessor.aggregateData(sampleData, {
        column: 'score',
        operation: 'max'
      });
      
      expect(result).toBe(95);
    });

    test('should handle empty numeric data', () => {
      const emptyData = [
        { value: 'not a number' },
        { value: 'also not a number' }
      ];
      
      const result = dataProcessor.aggregateData(emptyData, {
        column: 'value',
        operation: 'sum'
      });
      
      expect(result).toBe(0);
    });

    test('should throw error for unsupported operation', () => {
      expect(() => {
        dataProcessor.aggregateData(sampleData, {
          column: 'score',
          operation: 'unsupported'
        });
      }).toThrow('Unsupported aggregation operation: unsupported');
    });
  });

  describe('selectColumns', () => {
    test('should select specified columns', () => {
      const result = dataProcessor.selectColumns(sampleData, {
        columns: ['name', 'score']
      });
      
      expect(result).toHaveLength(5);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).not.toHaveProperty('age');
      expect(result[0]).not.toHaveProperty('grade');
    });

    test('should handle non-existent columns', () => {
      const result = dataProcessor.selectColumns(sampleData, {
        columns: ['name', 'nonexistent']
      });
      
      expect(result).toHaveLength(5);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).not.toHaveProperty('nonexistent');
    });
  });

  describe('groupByData', () => {
    test('should group by column and aggregate', () => {
      const result = dataProcessor.groupByData(sampleData, {
        groupBy: 'grade',
        aggregations: [
          { column: 'score', operation: 'average', alias: 'avg_score' },
          { column: 'age', operation: 'count', alias: 'count' }
        ]
      });
      
      expect(result).toHaveLength(2); // A and B grades
      
      const gradeA = result.find(row => row.grade === 'A');
      const gradeB = result.find(row => row.grade === 'B');
      
      expect(gradeA.avg_score).toBe(90); // (85 + 92 + 95 + 88) / 4
      expect(gradeA.count).toBe(4);
      expect(gradeB.avg_score).toBe(78);
      expect(gradeB.count).toBe(1);
    });
  });

  describe('calculateColumn', () => {
    test('should calculate new column with simple expression', () => {
      const result = dataProcessor.calculateColumn(sampleData, {
        expression: 'age + 10',
        newColumnName: 'age_plus_10'
      });
      
      expect(result).toHaveLength(5);
      expect(result[0].age_plus_10).toBe(35); // 25 + 10
    });

    test('should handle invalid expressions', () => {
      const result = dataProcessor.calculateColumn(sampleData, {
        expression: 'invalid expression',
        newColumnName: 'calculated'
      });
      
      expect(result).toHaveLength(5);
      expect(result[0].calculated).toBeNull();
    });
  });

  describe('processData', () => {
    test('should process multiple operations', async () => {
      const operations = [
        {
          type: 'filter',
          params: { column: 'score', operator: 'greater_than', value: 80 }
        },
        {
          type: 'sort',
          params: { column: 'score', direction: 'desc' }
        }
      ];
      
      const result = await dataProcessor.processData(sampleData, operations);
      
      expect(result).toHaveLength(4); // Filtered to scores > 80
      expect(result[0].score).toBe(95); // Highest score first
      expect(result[3].score).toBe(85); // Lowest score last
    });

    test('should throw error for unsupported operation', async () => {
      const operations = [
        {
          type: 'unsupported',
          params: {}
        }
      ];
      
      await expect(dataProcessor.processData(sampleData, operations))
        .rejects.toThrow('Unsupported operation: unsupported');
    });
  });

  describe('getAvailableOperations', () => {
    test('should return all supported operations', () => {
      const operations = dataProcessor.getAvailableOperations();
      
      expect(operations).toContain('filter');
      expect(operations).toContain('sort');
      expect(operations).toContain('aggregate');
      expect(operations).toContain('select');
      expect(operations).toContain('groupBy');
      expect(operations).toContain('calculate');
    });
  });

  describe('parseCSVFile', () => {
    it('should parse CSV file successfully', async () => {
      const mockFilePath = 'test.csv';
      const mockCsvContent = 'name,age\nAlice,25\nBob,30';
      
      // Mock fs.readFileSync
      const originalReadFileSync = require('fs').readFileSync;
      require('fs').readFileSync = jest.fn().mockReturnValue(mockCsvContent);
      
      // Mock Papa.parse
      const mockPapa = {
        parse: jest.fn().mockImplementation((content, options) => {
          options.complete({
            data: [
              { name: 'Alice', age: '25' },
              { name: 'Bob', age: '30' }
            ],
            errors: []
          });
        })
      };
      
      // Mock Papa.parse globally
      global.Papa = mockPapa;
      
      const result = await dataProcessor.parseCSVFile(mockFilePath);
      
      expect(result).toEqual([
        { name: 'Alice', age: '25' },
        { name: 'Bob', age: '30' }
      ]);
      
      // Restore original function
      require('fs').readFileSync = originalReadFileSync;
    });
  });

  describe('filterData edge cases', () => {
    it('should handle default case in filter operator', () => {
      const data = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 }
      ];
      
      const result = dataProcessor.filterData(data, {
        column: 'age',
        operator: 'unknown_operator',
        value: 25
      });
      
      expect(result).toEqual(data); // Should return all data for unknown operator
    });

    it('should handle null/undefined values in filter', () => {
      const data = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: null },
        { name: 'Charlie', age: undefined }
      ];
      
      const result = dataProcessor.filterData(data, {
        column: 'age',
        operator: 'equals',
        value: null
      });
      
      expect(result).toHaveLength(2); // Should match both null and undefined values
    });
  });

  describe('aggregateData edge cases', () => {
    it('should handle empty values array in aggregation', () => {
      const data = [
        { name: 'Alice', age: 'not_a_number' },
        { name: 'Bob', age: 'also_not_a_number' }
      ];
      
      const result = dataProcessor.aggregateData(data, {
        column: 'age',
        operation: 'sum'
      });
      
      expect(result).toBe(0); // Should return 0 for empty valid values
    });

    it('should handle min/max with empty values', () => {
      const data = [
        { name: 'Alice', age: 'not_a_number' }
      ];
      
      const minResult = dataProcessor.aggregateData(data, {
        column: 'age',
        operation: 'min'
      });
      
      const maxResult = dataProcessor.aggregateData(data, {
        column: 'age',
        operation: 'max'
      });
      
      expect(minResult).toBeNull();
      expect(maxResult).toBeNull();
    });
  });
});
