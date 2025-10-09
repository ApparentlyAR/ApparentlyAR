/**
 * Tests for Advanced Statistical & Mathematical Operations
 *
 * Tests matrix operations, trigonometry, logarithms, exponential smoothing,
 * polynomial fitting, and calculus operations.
 */

const dataProcessor = require('../../src/backend/dataProcessor');

describe('Advanced Statistics - Matrix Operations', () => {
  test('should multiply two matrices correctly', async () => {
    const matrixA = [[1, 2], [3, 4]];
    const matrixB = [[5, 6], [7, 8]];

    const result = await dataProcessor.processData([], [{
      type: 'matrixMultiply',
      params: { matrixA, matrixB }
    }]);

    expect(result).toEqual([[19, 22], [43, 50]]);
  });

  test('should transpose a matrix', async () => {
    const matrix = [[1, 2, 3], [4, 5, 6]];

    const result = await dataProcessor.processData([], [{
      type: 'matrixTranspose',
      params: { matrix }
    }]);

    expect(result).toEqual([[1, 4], [2, 5], [3, 6]]);
  });

  test('should calculate determinant of 2x2 matrix', async () => {
    const matrix = [[4, 3], [2, 1]];

    const result = await dataProcessor.processData([], [{
      type: 'matrixDeterminant',
      params: { matrix }
    }]);

    expect(result).toBe(-2);
  });

  test('should calculate inverse of 2x2 matrix', async () => {
    const matrix = [[4, 7], [2, 6]];

    const result = await dataProcessor.processData([], [{
      type: 'matrixInverse',
      params: { matrix }
    }]);

    expect(result[0][0]).toBeCloseTo(0.6, 1);
    expect(result[0][1]).toBeCloseTo(-0.7, 1);
    expect(result[1][0]).toBeCloseTo(-0.2, 1);
    expect(result[1][1]).toBeCloseTo(0.4, 1);
  });
});

describe('Advanced Statistics - Trigonometry', () => {
  const testData = [
    { angle: 0 },
    { angle: 30 },
    { angle: 45 },
    { angle: 90 }
  ];

  test('should apply sine function in degrees', async () => {
    const result = await dataProcessor.processData(testData, [{
      type: 'applyTrigFunction',
      params: {
        column: 'angle',
        function: 'sin',
        angleUnit: 'degrees',
        outputColumn: 'sin_result'
      }
    }]);

    expect(result[0].sin_result).toBeCloseTo(0, 5);
    expect(result[1].sin_result).toBeCloseTo(0.5, 5);
    expect(result[3].sin_result).toBeCloseTo(1, 5);
  });

  test('should apply cosine function in radians', async () => {
    const radData = [{ angle: 0 }, { angle: Math.PI / 2 }, { angle: Math.PI }];

    const result = await dataProcessor.processData(radData, [{
      type: 'applyTrigFunction',
      params: {
        column: 'angle',
        function: 'cos',
        angleUnit: 'radians',
        outputColumn: 'cos_result'
      }
    }]);

    expect(result[0].cos_result).toBeCloseTo(1, 5);
    expect(result[1].cos_result).toBeCloseTo(0, 5);
    expect(result[2].cos_result).toBeCloseTo(-1, 5);
  });
});

describe('Advanced Statistics - Logarithms', () => {
  const testData = [
    { value: 1 },
    { value: 10 },
    { value: 100 },
    { value: 1000 }
  ];

  test('should apply natural logarithm', async () => {
    const result = await dataProcessor.processData(testData, [{
      type: 'applyLogarithm',
      params: {
        column: 'value',
        base: 'e',
        outputColumn: 'ln_result'
      }
    }]);

    expect(result[0].ln_result).toBeCloseTo(0, 5);
    expect(result[1].ln_result).toBeCloseTo(2.302585, 5);
  });

  test('should apply base-10 logarithm', async () => {
    const result = await dataProcessor.processData(testData, [{
      type: 'applyLogarithm',
      params: {
        column: 'value',
        base: '10',
        outputColumn: 'log10_result'
      }
    }]);

    expect(result[0].log10_result).toBeCloseTo(0, 5);
    expect(result[1].log10_result).toBeCloseTo(1, 5);
    expect(result[2].log10_result).toBeCloseTo(2, 5);
    expect(result[3].log10_result).toBeCloseTo(3, 5);
  });

  test('should handle non-positive values', async () => {
    const invalidData = [{ value: 0 }, { value: -5 }];

    const result = await dataProcessor.processData(invalidData, [{
      type: 'applyLogarithm',
      params: {
        column: 'value',
        base: '10',
        outputColumn: 'log_result'
      }
    }]);

    expect(result[0].log_result).toBeNull();
    expect(result[1].log_result).toBeNull();
  });
});

describe('Advanced Statistics - Exponential Smoothing', () => {
  const testData = [
    { value: 10 },
    { value: 15 },
    { value: 12 },
    { value: 18 },
    { value: 20 }
  ];

  test('should apply exponential smoothing with alpha=0.3', async () => {
    const result = await dataProcessor.processData(testData, [{
      type: 'exponentialSmoothing',
      params: {
        column: 'value',
        alpha: 0.3,
        outputColumn: 'smoothed'
      }
    }]);

    expect(result[0].smoothed).toBe(10);
    expect(result[1].smoothed).toBeCloseTo(11.5, 1);
  });

  test('should apply exponential smoothing with alpha=0.9 (high responsiveness)', async () => {
    const result = await dataProcessor.processData(testData, [{
      type: 'exponentialSmoothing',
      params: {
        column: 'value',
        alpha: 0.9,
        outputColumn: 'smoothed'
      }
    }]);

    expect(result[0].smoothed).toBe(10);
    expect(result[1].smoothed).toBeCloseTo(14.5, 1);
  });
});

describe('Advanced Statistics - Polynomial Fitting', () => {
  test('should fit linear polynomial (degree 1)', async () => {
    const testData = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
      { x: 4, y: 8 }
    ];

    const result = await dataProcessor.processData(testData, [{
      type: 'polynomialFit',
      params: {
        columnX: 'x',
        columnY: 'y',
        degree: 1,
        outputColumn: 'fitted'
      }
    }]);

    expect(result.coefficients).toHaveLength(2);
    expect(result.coefficients[1]).toBeCloseTo(2, 1); // slope
    expect(result.coefficients[0]).toBeCloseTo(0, 1); // intercept
    expect(result.data[0].fitted).toBeCloseTo(2, 1);
    expect(result.data[3].fitted).toBeCloseTo(8, 1);
  });

  test('should fit quadratic polynomial (degree 2)', async () => {
    const testData = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 4 },
      { x: 3, y: 9 },
      { x: 4, y: 16 }
    ];

    const result = await dataProcessor.processData(testData, [{
      type: 'polynomialFit',
      params: {
        columnX: 'x',
        columnY: 'y',
        degree: 2,
        outputColumn: 'fitted'
      }
    }]);

    expect(result.coefficients).toHaveLength(3);
    expect(result.coefficients[2]).toBeCloseTo(1, 1); // x^2 coefficient
    expect(result.data[2].fitted).toBeCloseTo(4, 1);
  });
});

describe('Advanced Statistics - Calculus Basics', () => {
  test('should calculate numerical derivative', async () => {
    const testData = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 4 },
      { x: 3, y: 9 },
      { x: 4, y: 16 }
    ];

    const result = await dataProcessor.processData(testData, [{
      type: 'calculateDerivative',
      params: {
        columnX: 'x',
        columnY: 'y',
        outputColumn: 'derivative'
      }
    }]);

    // For y = x^2, dy/dx = 2x
    expect(result[1].derivative).toBeCloseTo(2, 0); // at x=1
    expect(result[2].derivative).toBeCloseTo(4, 0); // at x=2
    expect(result[3].derivative).toBeCloseTo(6, 0); // at x=3
  });

  test('should calculate cumulative integral', async () => {
    const testData = [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 }
    ];

    const result = await dataProcessor.processData(testData, [{
      type: 'calculateIntegral',
      params: {
        columnX: 'x',
        columnY: 'y',
        outputColumn: 'integral'
      }
    }]);

    expect(result[0].integral).toBe(0);
    expect(result[1].integral).toBeCloseTo(1, 5);
    expect(result[2].integral).toBeCloseTo(2, 5);
    expect(result[3].integral).toBeCloseTo(3, 5);
  });

  test('should handle trapezoidal integration for varying function', async () => {
    const testData = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 4 },
      { x: 3, y: 9 }
    ];

    const result = await dataProcessor.processData(testData, [{
      type: 'calculateIntegral',
      params: {
        columnX: 'x',
        columnY: 'y',
        outputColumn: 'integral'
      }
    }]);

    expect(result[0].integral).toBe(0);
    expect(result[1].integral).toBeCloseTo(0.5, 1);
    expect(result[2].integral).toBeCloseTo(3, 1);
  });
});

describe('Advanced Statistics - Error Handling', () => {
  test('should handle invalid matrix dimensions for multiplication', async () => {
    const matrixA = [[1, 2, 3]];
    const matrixB = [[1, 2]];

    await expect(
      dataProcessor.processData([], [{
        type: 'matrixMultiply',
        params: { matrixA, matrixB }
      }])
    ).rejects.toThrow();
  });

  test('should handle singular matrix for inverse', async () => {
    const singularMatrix = [[1, 2], [2, 4]]; // determinant = 0

    await expect(
      dataProcessor.processData([], [{
        type: 'matrixInverse',
        params: { matrix: singularMatrix }
      }])
    ).rejects.toThrow('singular');
  });

  test('should handle invalid alpha value for exponential smoothing', async () => {
    const testData = [{ value: 10 }, { value: 20 }];

    await expect(
      dataProcessor.processData(testData, [{
        type: 'exponentialSmoothing',
        params: {
          column: 'value',
          alpha: 1.5, // Invalid: > 1
          outputColumn: 'smoothed'
        }
      }])
    ).rejects.toThrow('Alpha must be between 0 and 1');
  });

  test('should handle insufficient data points for polynomial fitting', async () => {
    const testData = [{ x: 1, y: 2 }]; // Only 1 point, need at least 2 for linear

    await expect(
      dataProcessor.processData(testData, [{
        type: 'polynomialFit',
        params: {
          columnX: 'x',
          columnY: 'y',
          degree: 1,
          outputColumn: 'fitted'
        }
      }])
    ).rejects.toThrow('Need at least');
  });
});
