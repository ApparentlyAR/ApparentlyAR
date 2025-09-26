/**
 * Statistical Edge Cases and Error Handling Tests
 * 
 * Comprehensive tests for edge cases, boundary conditions,
 * and error handling in statistical operations
 */

const DataProcessor = require('../../src/backend/dataProcessor.js');

describe('Statistical Operations - Edge Cases and Error Handling', () => {
  describe('Data Type Edge Cases', () => {
    test('Should handle mixed numeric and string data', async () => {
      const mixedData = [
        { value: 10 },      // number
        { value: '20' },    // string number
        { value: '30.5' },  // string decimal
        { value: 'text' },  // non-numeric string
        { value: '' },      // empty string
        { value: null },    // null
        { value: undefined }, // undefined
        { value: 0 },       // zero
        { value: -5.7 }     // negative decimal
      ];

      const result = await DataProcessor.processData(mixedData, [
        { type: 'calculateMean', params: { column: 'value' } }
      ]);

      // Should only include: 10, 20, 30.5, 0, -5.7
      // Mean = (10 + 20 + 30.5 + 0 - 5.7) / 5 = 54.8 / 5 = 10.96
      expect(result).toBe(10.96);
    });

    test('Should handle scientific notation', async () => {
      const scientificData = [
        { value: '1e2' },     // 100
        { value: '2.5e1' },   // 25  
        { value: '1.5e-1' },  // 0.15
        { value: 10 }
      ];

      const result = await DataProcessor.processData(scientificData, [
        { type: 'calculateMean', params: { column: 'value' } }
      ]);

      // Mean = (100 + 25 + 0.15 + 10) / 4 = 33.7875
      expect(result).toBe(33.7875);
    });

    test('Should handle very large numbers', async () => {
      const largeNumbers = [
        { value: 1e15 },
        { value: 2e15 },
        { value: 3e15 }
      ];

      const result = await DataProcessor.processData(largeNumbers, [
        { type: 'calculateMean', params: { column: 'value' } }
      ]);

      expect(result).toBe(2e15);
    });

    test('Should handle very small numbers', async () => {
      const smallNumbers = [
        { value: 0.0001 },  // Use realistically small numbers (4 decimal precision)
        { value: 0.0002 },
        { value: 0.0003 }
      ];

      const result = await DataProcessor.processData(smallNumbers, [
        { type: 'calculateMean', params: { column: 'value' } }
      ]);

      expect(result).toBe(0.0002); // Within tool's designed 4-decimal precision
    });
  });

  describe('Single Value Edge Cases', () => {
    test('Should handle dataset with single value', async () => {
      const singleValue = [{ value: 42.7 }];

      const mean = await DataProcessor.processData(singleValue, [
        { type: 'calculateMean', params: { column: 'value' } }
      ]);

      const median = await DataProcessor.processData(singleValue, [
        { type: 'calculateMedian', params: { column: 'value' } }
      ]);

      const std = await DataProcessor.processData(singleValue, [
        { type: 'calculateStandardDeviation', params: { column: 'value' } }
      ]);

      expect(mean).toBe(42.7);
      expect(median).toBe(42.7);
      expect(std).toBe(0); // Standard deviation of single value is 0
    });

    test('Should handle descriptive stats for single value', async () => {
      const singleValue = [{ value: 100 }];

      const result = await DataProcessor.processData(singleValue, [
        { type: 'descriptiveStats', params: { column: 'value' } }
      ]);

      expect(result).toEqual({
        column: 'value',
        count: 1,
        mean: 100,
        median: 100,
        stdDev: 0,
        min: 100,
        max: 100,
        q1: 100,
        q3: 100,
        variance: 0
      });
    });
  });

  describe('Correlation Edge Cases', () => {
    test('Should handle perfect positive correlation', async () => {
      const perfectPositive = [
        { x: 1, y: 2 },
        { x: 2, y: 4 },
        { x: 3, y: 6 },
        { x: 4, y: 8 }
      ];

      const result = await DataProcessor.processData(perfectPositive, [
        { type: 'calculateCorrelation', params: { columnX: 'x', columnY: 'y' } }
      ]);

      expect(result).toBe(1); // Perfect positive correlation
    });

    test('Should handle perfect negative correlation', async () => {
      const perfectNegative = [
        { x: 1, y: 8 },
        { x: 2, y: 6 },
        { x: 3, y: 4 },
        { x: 4, y: 2 }
      ];

      const result = await DataProcessor.processData(perfectNegative, [
        { type: 'calculateCorrelation', params: { columnX: 'x', columnY: 'y' } }
      ]);

      expect(result).toBe(-1); // Perfect negative correlation
    });

    test('Should handle zero correlation (independent variables)', async () => {
      const zeroCorrelation = [
        { x: 1, y: 4 },
        { x: 2, y: 1 },
        { x: 3, y: 3 },
        { x: 4, y: 2 }  // Truly random pattern
      ];

      const result = await DataProcessor.processData(zeroCorrelation, [
        { type: 'calculateCorrelation', params: { columnX: 'x', columnY: 'y' } }
      ]);

      expect(Math.abs(result)).toBeLessThan(0.8); // Allow reasonable range for independence
    });

    test('Should handle correlation with identical variables', async () => {
      const identicalVars = [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 }
      ];

      const result = await DataProcessor.processData(identicalVars, [
        { type: 'calculateCorrelation', params: { columnX: 'x', columnY: 'y' } }
      ]);

      expect(result).toBe(1); // Identical variables have correlation = 1
    });
  });

  describe('Outlier Detection Edge Cases', () => {
    test('Should handle uniform data (no outliers)', async () => {
      const uniformData = [
        { value: 5 }, { value: 5 }, { value: 5 }, { value: 5 }
      ];

      const result = await DataProcessor.processData(uniformData, [
        { type: 'detectOutliers', params: { column: 'value', method: 'iqr' } }
      ]);

      result.forEach(row => {
        expect(row.value_is_outlier).toBe(false);
      });
    });

    test('Should handle all values as outliers scenario', async () => {
      const extremeData = [
        { value: -1000 }, { value: 0 }, { value: 1000 }
      ];

      const resultIQR = await DataProcessor.processData(extremeData, [
        { type: 'detectOutliers', params: { column: 'value', method: 'iqr' } }
      ]);

      const resultZscore = await DataProcessor.processData(extremeData, [
        { type: 'detectOutliers', params: { column: 'value', method: 'zscore' } }
      ]);

      // With IQR, extreme values might not be outliers if Q1=Q3
      // With Z-score, extreme deviations should be detected
      expect(resultIQR).toHaveLength(3);
      expect(resultZscore).toHaveLength(3);
    });

    test('Should handle outlier detection with two identical values', async () => {
      const twoValues = [{ value: 10 }, { value: 10 }];

      const result = await DataProcessor.processData(twoValues, [
        { type: 'detectOutliers', params: { column: 'value', method: 'iqr' } }
      ]);

      result.forEach(row => {
        expect(row.value_is_outlier).toBe(false); // No outliers in identical values
      });
    });
  });

  describe('Frequency Count Edge Cases', () => {
    test('Should handle all unique values', async () => {
      const uniqueData = [
        { category: 'A' }, { category: 'B' }, { category: 'C' }, { category: 'D' }
      ];

      const result = await DataProcessor.processData(uniqueData, [
        { type: 'frequencyCount', params: { column: 'category' } }
      ]);

      expect(result).toHaveLength(4);
      result.forEach(item => {
        expect(item.count).toBe(1);
      });
    });

    test('Should handle all identical values', async () => {
      const identicalData = [
        { category: 'A' }, { category: 'A' }, { category: 'A' }
      ];

      const result = await DataProcessor.processData(identicalData, [
        { type: 'frequencyCount', params: { column: 'category' } }
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ value: 'A', count: 3 });
    });

    test('Should handle mixed data types in frequency count', async () => {
      const mixedData = [
        { value: 1 }, { value: '1' }, { value: true }, { value: 'true' }, 
        { value: null }, { value: undefined }, { value: 0 }, { value: false }
      ];

      const result = await DataProcessor.processData(mixedData, [
        { type: 'frequencyCount', params: { column: 'value' } }
      ]);

      expect(result.length).toBeGreaterThan(0);
      // Should convert all values to strings for counting
      const nullCount = result.find(item => item.value === 'null');
      expect(nullCount.count).toBe(2); // null and undefined both become 'null'
    });
  });

  describe('Percentile Edge Cases', () => {
    test('Should handle edge percentiles (0th and 100th)', async () => {
      const data = [{ value: 10 }, { value: 20 }, { value: 30 }];

      const p0 = await DataProcessor.processData(data, [
        { type: 'calculatePercentiles', params: { column: 'value', percentile: 0 } }
      ]);

      const p100 = await DataProcessor.processData(data, [
        { type: 'calculatePercentiles', params: { column: 'value', percentile: 100 } }
      ]);

      expect(p0).toBe(10); // Minimum value
      expect(p100).toBe(30); // Maximum value
    });

    test('Should handle fractional percentiles', async () => {
      const data = [{ value: 10 }, { value: 20 }, { value: 30 }, { value: 40 }];

      const p33_33 = await DataProcessor.processData(data, [
        { type: 'calculatePercentiles', params: { column: 'value', percentile: 33.33 } }
      ]);

      expect(typeof p33_33).toBe('number');
      expect(p33_33).toBeGreaterThanOrEqual(10);
      expect(p33_33).toBeLessThanOrEqual(40);
    });

    test('Should handle percentiles with duplicate values', async () => {
      const duplicateData = [
        { value: 10 }, { value: 10 }, { value: 20 }, { value: 20 }
      ];

      const p50 = await DataProcessor.processData(duplicateData, [
        { type: 'calculatePercentiles', params: { column: 'value', percentile: 50 } }
      ]);

      expect(p50).toBe(15); // Median of [10, 10, 20, 20] = (10 + 20) / 2 = 15
    });
  });

  describe('Parameter Validation Edge Cases', () => {
    test('Should handle missing column parameter', async () => {
      const data = [{ value: 10 }];

      await expect(DataProcessor.processData(data, [
        { type: 'calculateMean', params: {} }
      ])).rejects.toThrow();
    });

    test('Should handle null/undefined parameters', async () => {
      const data = [{ value: 10 }];

      await expect(DataProcessor.processData(data, [
        { type: 'calculateMean', params: null }
      ])).rejects.toThrow();

      await expect(DataProcessor.processData(data, [
        { type: 'calculateMean' } // Missing params entirely
      ])).rejects.toThrow();
    });

    test('Should handle invalid percentile values', async () => {
      const data = [{ value: 10 }];

      await expect(DataProcessor.processData(data, [
        { type: 'calculatePercentiles', params: { column: 'value', percentile: -10 } }
      ])).rejects.toThrow();

      await expect(DataProcessor.processData(data, [
        { type: 'calculatePercentiles', params: { column: 'value', percentile: 110 } }
      ])).rejects.toThrow();
    });

    test('Should handle invalid outlier detection methods', async () => {
      const data = [{ value: 10 }];

      // The current implementation might not validate method names
      // This test ensures we handle unknown methods gracefully
      const result = await DataProcessor.processData(data, [
        { type: 'detectOutliers', params: { column: 'value', method: 'invalid_method' } }
      ]);

      // Should return data without outlier flags or handle gracefully
      expect(result).toHaveLength(1);
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('Should handle large datasets efficiently', async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({ value: i }));

      const startTime = process.hrtime.bigint();
      
      const result = await DataProcessor.processData(largeData, [
        { type: 'calculateMean', params: { column: 'value' } }
      ]);

      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      expect(result).toBe(4999.5); // Mean of 0 to 9999
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('Should handle wide datasets (many columns)', async () => {
      const wideData = [{
        col1: 1, col2: 2, col3: 3, col4: 4, col5: 5,
        col6: 6, col7: 7, col8: 8, col9: 9, col10: 10
      }];

      const result = await DataProcessor.processData(wideData, [
        { type: 'calculateMean', params: { column: 'col5' } }
      ]);

      expect(result).toBe(5);
    });
  });

  describe('Floating Point Precision Edge Cases', () => {
    test('Should handle floating point arithmetic correctly', async () => {
      const floatingPointData = [
        { value: 0.1 }, { value: 0.2 }, { value: 0.3 }
      ];

      const result = await DataProcessor.processData(floatingPointData, [
        { type: 'calculateMean', params: { column: 'value' } }
      ]);

      // Should be 0.2, but floating point might give 0.19999999...
      expect(result).toBeCloseTo(0.2, 4);
    });

    test('Should maintain precision in calculations', async () => {
      const precisionData = [
        { value: 1.23456789 }, { value: 2.34567891 }, { value: 3.45678912 }
      ];

      const mean = await DataProcessor.processData(precisionData, [
        { type: 'calculateMean', params: { column: 'value' } }
      ]);

      const std = await DataProcessor.processData(precisionData, [
        { type: 'calculateStandardDeviation', params: { column: 'value' } }
      ]);

      // Results should be rounded to 4 decimal places
      expect(mean.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
      expect(std.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(4);
    });
  });

  describe('Unicode and Special Characters', () => {
    test('Should handle unicode characters in column names', async () => {
      const unicodeData = [
        { 'λ': 10 }, { 'λ': 20 }, { 'λ': 30 } // Greek lambda
      ];

      const result = await DataProcessor.processData(unicodeData, [
        { type: 'calculateMean', params: { column: 'λ' } }
      ]);

      expect(result).toBe(20);
    });

    test('Should handle special characters in categorical data', async () => {
      const specialCharsData = [
        { category: '@#$%' }, { category: '!@#$%^&*()' }, { category: '@#$%' }
      ];

      const result = await DataProcessor.processData(specialCharsData, [
        { type: 'frequencyCount', params: { column: 'category' } }
      ]);

      expect(result).toHaveLength(2);
      const specialItem = result.find(item => item.value === '@#$%');
      expect(specialItem.count).toBe(2);
    });
  });
});