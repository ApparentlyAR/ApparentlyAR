/**
 * Statistical Operations Tests
 * 
 * Comprehensive tests for all statistical analysis functionality
 * including backend DataProcessor statistical methods
 */

const DataProcessor = require('../../src/backend/dataProcessor.js');

describe('Statistical Operations', () => {
  let testData;
  let testDataWithMissing;
  let testDataSmall;

  beforeEach(() => {
    // Standard test dataset
    testData = [
      { name: 'Alice', age: 25, salary: 50000, department: 'Engineering', score: 85.5 },
      { name: 'Bob', age: 30, salary: 60000, department: 'Marketing', score: 92.3 },
      { name: 'Charlie', age: 35, salary: 55000, department: 'Engineering', score: 78.9 },
      { name: 'Diana', age: 28, salary: 65000, department: 'Sales', score: 88.7 },
      { name: 'Eve', age: 32, salary: 58000, department: 'Marketing', score: 91.2 }
    ];

    // Dataset with missing/invalid values
    testDataWithMissing = [
      { name: 'Alice', age: '25', salary: 50000, score: 85.5 },
      { name: 'Bob', age: '', salary: 60000, score: '' },
      { name: 'Charlie', age: 'invalid', salary: 55000, score: 78.9 },
      { name: 'Diana', age: 28, salary: null, score: 88.7 },
      { name: 'Eve', age: 32, salary: undefined, score: 91.2 }
    ];

    // Small dataset for edge cases
    testDataSmall = [
      { value: 10 },
      { value: 20 }
    ];
  });

  describe('Calculate Mean', () => {
    test('Should calculate mean correctly for integer values', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'calculateMean', params: { column: 'age' } }
      ]);
      
      // (25 + 30 + 35 + 28 + 32) / 5 = 30
      expect(result).toBe(30);
    });

    test('Should calculate mean correctly for decimal values', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'calculateMean', params: { column: 'score' } }
      ]);
      
      // (85.5 + 92.3 + 78.9 + 88.7 + 91.2) / 5 = 87.32
      expect(result).toBe(87.32);
    });

    test('Should handle missing values by ignoring them', async () => {
      const result = await DataProcessor.processData(testDataWithMissing, [
        { type: 'calculateMean', params: { column: 'age' } }
      ]);
      
      // Only valid: 25, 28, 32 -> mean = 28.3333
      expect(result).toBe(28.3333);
    });

    test('Should throw error for non-existent column', async () => {
      await expect(DataProcessor.processData(testData, [
        { type: 'calculateMean', params: { column: 'nonexistent' } }
      ])).rejects.toThrow('does not exist'); // Updated to match improved column validation
    });

    test('Should throw error for completely non-numeric column', async () => {
      await expect(DataProcessor.processData(testData, [
        { type: 'calculateMean', params: { column: 'name' } }
      ])).rejects.toThrow('No valid numeric values found in column \'name\'');
    });
  });

  describe('Calculate Median', () => {
    test('Should calculate median for odd number of values', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'calculateMedian', params: { column: 'age' } }
      ]);
      
      // Sorted: [25, 28, 30, 32, 35] -> median = 30
      expect(result).toBe(30);
    });

    test('Should calculate median for even number of values', async () => {
      const result = await DataProcessor.processData(testDataSmall, [
        { type: 'calculateMedian', params: { column: 'value' } }
      ]);
      
      // Sorted: [10, 20] -> median = (10 + 20) / 2 = 15
      expect(result).toBe(15);
    });

    test('Should handle decimal values correctly', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'calculateMedian', params: { column: 'score' } }
      ]);
      
      // Sorted: [78.9, 85.5, 88.7, 91.2, 92.3] -> median = 88.7
      expect(result).toBe(88.7);
    });
  });

  describe('Calculate Standard Deviation', () => {
    test('Should calculate standard deviation correctly', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'calculateStandardDeviation', params: { column: 'age' } }
      ]);
      
      // Ages: [25, 30, 35, 28, 32], mean = 30
      // Variance = ((25-30)² + (30-30)² + (35-30)² + (28-30)² + (32-30)²) / 5
      // Variance = (25 + 0 + 25 + 4 + 4) / 5 = 58 / 5 = 11.6
      // StdDev = √11.6 = 3.4058
      expect(result).toBe(3.4059); // Rounded to 4 decimal places
    });

    test('Should handle single value (std dev = 0)', async () => {
      const singleValue = [{ value: 42 }];
      const result = await DataProcessor.processData(singleValue, [
        { type: 'calculateStandardDeviation', params: { column: 'value' } }
      ]);
      
      expect(result).toBe(0);
    });
  });

  describe('Calculate Correlation', () => {
    test('Should calculate positive correlation', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'calculateCorrelation', params: { columnX: 'age', columnY: 'salary' } }
      ]);
      
      // Should return a correlation coefficient between -1 and 1
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
      expect(typeof result).toBe('number');
    });

    test('Should calculate correlation with decimal precision', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'calculateCorrelation', params: { columnX: 'age', columnY: 'score' } }
      ]);
      
      // Result should be rounded to 4 decimal places
      expect(result.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
    });

    test('Should throw error for insufficient data points', async () => {
      const singleValue = [{ x: 1, y: 2 }];
      await expect(DataProcessor.processData(singleValue, [
        { type: 'calculateCorrelation', params: { columnX: 'x', columnY: 'y' } }
      ])).rejects.toThrow('Not enough valid numeric pairs found');
    });

    test('Should handle missing values by filtering them out', async () => {
      const dataWithMissing = [
        { x: 1, y: 2 },
        { x: '', y: 3 },
        { x: 4, y: null },
        { x: 5, y: 6 },
        { x: 7, y: 8 }
      ];
      
      const result = await DataProcessor.processData(dataWithMissing, [
        { type: 'calculateCorrelation', params: { columnX: 'x', columnY: 'y' } }
      ]);
      
      // Should only use valid pairs: (1,2), (5,6), (7,8)
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('Descriptive Statistics', () => {
    test('Should return comprehensive statistics object', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'descriptiveStats', params: { column: 'age' } }
      ]);
      
      expect(result).toHaveProperty('column', 'age');
      expect(result).toHaveProperty('count', 5);
      expect(result).toHaveProperty('mean', 30);
      expect(result).toHaveProperty('median', 30);
      expect(result).toHaveProperty('stdDev');
      expect(result).toHaveProperty('min', 25);
      expect(result).toHaveProperty('max', 35);
      expect(result).toHaveProperty('q1', 28);
      expect(result).toHaveProperty('q3', 32);
      expect(result).toHaveProperty('variance');
      
      // Verify all values are numbers
      expect(typeof result.mean).toBe('number');
      expect(typeof result.median).toBe('number');
      expect(typeof result.stdDev).toBe('number');
      expect(typeof result.variance).toBe('number');
    });

    test('Should handle decimal precision correctly', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'descriptiveStats', params: { column: 'score' } }
      ]);
      
      // All decimal values should be rounded to 4 places
      expect(result.mean.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
      expect(result.median.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
      expect(result.stdDev.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
      expect(result.variance.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
    });
  });

  describe('Detect Outliers', () => {
    test('Should detect outliers using IQR method', async () => {
      const dataWithOutlier = [
        { value: 10 }, { value: 12 }, { value: 11 }, { value: 13 }, 
        { value: 12 }, { value: 14 }, { value: 100 } // 100 is an outlier
      ];
      
      const result = await DataProcessor.processData(dataWithOutlier, [
        { type: 'detectOutliers', params: { column: 'value', method: 'iqr' } }
      ]);
      
      expect(result).toHaveLength(7);
      expect(result[6]).toHaveProperty('value_is_outlier', true);
      expect(result[0]).toHaveProperty('value_is_outlier', false);
    });

    test('Should detect outliers using Z-score method', async () => {
      const dataWithOutlier = [
        { value: 10 }, { value: 12 }, { value: 11 }, { value: 13 }, 
        { value: 12 }, { value: 14 }, { value: 50 } // 50 might be an outlier
      ];
      
      const result = await DataProcessor.processData(dataWithOutlier, [
        { type: 'detectOutliers', params: { column: 'value', method: 'zscore' } }
      ]);
      
      expect(result).toHaveLength(7);
      expect(result[0]).toHaveProperty('value_is_outlier');
      expect(typeof result[0].value_is_outlier).toBe('boolean');
    });

    test('Should preserve original data while adding outlier flags', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'detectOutliers', params: { column: 'age', method: 'iqr' } }
      ]);
      
      expect(result).toHaveLength(5);
      result.forEach(row => {
        expect(row).toHaveProperty('name');
        expect(row).toHaveProperty('age');
        expect(row).toHaveProperty('salary');
        expect(row).toHaveProperty('age_is_outlier');
      });
    });
  });

  describe('Frequency Count', () => {
    test('Should count frequencies correctly', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'frequencyCount', params: { column: 'department' } }
      ]);
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(expect.arrayContaining([
        { value: 'Engineering', count: 2 },
        { value: 'Marketing', count: 2 },
        { value: 'Sales', count: 1 }
      ]));
      
      // Should be sorted by count (descending)
      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
      expect(result[1].count).toBeGreaterThanOrEqual(result[2].count);
    });

    test('Should handle null and undefined values', async () => {
      const dataWithNulls = [
        { category: 'A' }, { category: 'B' }, { category: null }, 
        { category: undefined }, { category: 'A' }
      ];
      
      const result = await DataProcessor.processData(dataWithNulls, [
        { type: 'frequencyCount', params: { column: 'category' } }
      ]);
      
      expect(result).toEqual(expect.arrayContaining([
        { value: 'A', count: 2 },
        { value: 'null', count: 2 }, // null and undefined both become 'null'
        { value: 'B', count: 1 }
      ]));
    });
  });

  describe('Calculate Percentiles', () => {
    test('Should calculate 25th percentile correctly', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'calculatePercentiles', params: { column: 'age', percentile: 25 } }
      ]);
      
      // For ages [25, 28, 30, 32, 35], 25th percentile should be around 28
      expect(result).toBe(28);
    });

    test('Should calculate 50th percentile (median)', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'calculatePercentiles', params: { column: 'age', percentile: 50 } }
      ]);
      
      // 50th percentile should equal median
      expect(result).toBe(30);
    });

    test('Should calculate 75th percentile correctly', async () => {
      const result = await DataProcessor.processData(testData, [
        { type: 'calculatePercentiles', params: { column: 'age', percentile: 75 } }
      ]);
      
      // For ages [25, 28, 30, 32, 35], 75th percentile should be around 32
      expect(result).toBe(32);
    });

    test('Should handle edge percentiles (0th and 100th)', async () => {
      const result0 = await DataProcessor.processData(testData, [
        { type: 'calculatePercentiles', params: { column: 'age', percentile: 0 } }
      ]);
      
      const result100 = await DataProcessor.processData(testData, [
        { type: 'calculatePercentiles', params: { column: 'age', percentile: 100 } }
      ]);
      
      expect(result0).toBe(25); // Minimum value
      expect(result100).toBe(35); // Maximum value
    });
  });

  describe('Error Handling', () => {
    test('Should throw error for unsupported operation', async () => {
      await expect(DataProcessor.processData(testData, [
        { type: 'unsupportedStatistic', params: { column: 'age' } }
      ])).rejects.toThrow('Unsupported operation: unsupportedStatistic');
    });

    test('Should handle empty dataset gracefully', async () => {
      const emptyData = [];
      
      await expect(DataProcessor.processData(emptyData, [
        { type: 'calculateMean', params: { column: 'value' } }
      ])).rejects.toThrow('No valid numeric values found');
    });

    test('Should handle missing parameters', async () => {
      await expect(DataProcessor.processData(testData, [
        { type: 'calculateMean', params: {} }
      ])).rejects.toThrow();
      
      await expect(DataProcessor.processData(testData, [
        { type: 'calculateCorrelation', params: { columnX: 'age' } }
      ])).rejects.toThrow();
    });
  });

  describe('Precision and Data Types', () => {
    test('Should maintain 4-decimal precision consistently', async () => {
      const precisionData = [{ value: 1/3 }, { value: 2/3 }, { value: 1 }];
      
      const mean = await DataProcessor.processData(precisionData, [
        { type: 'calculateMean', params: { column: 'value' } }
      ]);
      
      const std = await DataProcessor.processData(precisionData, [
        { type: 'calculateStandardDeviation', params: { column: 'value' } }
      ]);
      
      // Check that results have at most 4 decimal places
      expect(mean.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
      expect(std.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
    });

    test('Should return proper data types', async () => {
      const mean = await DataProcessor.processData(testData, [
        { type: 'calculateMean', params: { column: 'age' } }
      ]);
      
      const stats = await DataProcessor.processData(testData, [
        { type: 'descriptiveStats', params: { column: 'age' } }
      ]);
      
      const frequencies = await DataProcessor.processData(testData, [
        { type: 'frequencyCount', params: { column: 'department' } }
      ]);
      
      expect(typeof mean).toBe('number');
      expect(typeof stats).toBe('object');
      expect(Array.isArray(frequencies)).toBe(true);
    });
  });
});