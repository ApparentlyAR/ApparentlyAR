/**
 * Data Processor Module
 * 
 * Handles data transformation, filtering, sorting, aggregation, and analysis
 * for the ApparentlyAR data visualization platform.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

const fs = require('fs');
const Papa = require('papaparse');

/**
 * DataProcessor class for handling data operations
 */
class DataProcessor {
  constructor() {
    // Bind all methods to ensure proper 'this' context first
    this.processData = this.processData.bind(this);
    this.filterData = this.filterData.bind(this);
    this.sortData = this.sortData.bind(this);
    this.aggregateData = this.aggregateData.bind(this);
    this.selectColumns = this.selectColumns.bind(this);
    this.groupByData = this.groupByData.bind(this);
    this.calculateColumn = this.calculateColumn.bind(this);
    
    // Statistical methods
    this.descriptiveStats = this.descriptiveStats.bind(this);
    this.calculateMean = this.calculateMean.bind(this);
    this.calculateMedian = this.calculateMedian.bind(this);
    this.calculateStandardDeviation = this.calculateStandardDeviation.bind(this);
    this.calculateCorrelation = this.calculateCorrelation.bind(this);
    this.detectOutliers = this.detectOutliers.bind(this);
    this.frequencyCount = this.frequencyCount.bind(this);
    this.calculatePercentiles = this.calculatePercentiles.bind(this);

    // Advanced mathematical methods
    this.matrixMultiply = this.matrixMultiply.bind(this);
    this.matrixTranspose = this.matrixTranspose.bind(this);
    this.matrixDeterminant = this.matrixDeterminant.bind(this);
    this.matrixInverse = this.matrixInverse.bind(this);
    this.applyTrigFunction = this.applyTrigFunction.bind(this);
    this.applyLogarithm = this.applyLogarithm.bind(this);
    this.exponentialSmoothing = this.exponentialSmoothing.bind(this);
    this.polynomialFit = this.polynomialFit.bind(this);
    this.calculateDerivative = this.calculateDerivative.bind(this);
    this.calculateIntegral = this.calculateIntegral.bind(this);

    /**
     * Supported data processing operations
     * @type {Object}
     */
    this.supportedOperations = {
      filter: this.filterData,
      sort: this.sortData,
      aggregate: this.aggregateData,
      select: this.selectColumns,
      groupBy: this.groupByData,
      calculate: this.calculateColumn,
      
      // Statistical operations
      descriptiveStats: this.descriptiveStats,
      calculateMean: this.calculateMean,
      calculateMedian: this.calculateMedian,
      calculateStandardDeviation: this.calculateStandardDeviation,
      calculateCorrelation: this.calculateCorrelation,
      detectOutliers: this.detectOutliers,
      frequencyCount: this.frequencyCount,
      calculatePercentiles: this.calculatePercentiles,

      // Advanced mathematical operations
      matrixMultiply: this.matrixMultiply,
      matrixTranspose: this.matrixTranspose,
      matrixDeterminant: this.matrixDeterminant,
      matrixInverse: this.matrixInverse,
      applyTrigFunction: this.applyTrigFunction,
      applyLogarithm: this.applyLogarithm,
      exponentialSmoothing: this.exponentialSmoothing,
      polynomialFit: this.polynomialFit,
      calculateDerivative: this.calculateDerivative,
      calculateIntegral: this.calculateIntegral
    };
  }

  /**
   * Parse CSV file and return structured data
   * 
   * @param {string} filePath - Path to the CSV file
   * @returns {Promise<Array>} Parsed data as array of objects
   * @throws {Error} If CSV parsing fails or contains errors
   */
  async parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
          } else {
            resolve(results.data);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }

  /**
   * Process data with a series of operations
   * 
   * @param {Array} data - Input data array
   * @param {Array} operations - Array of operation objects with type and params
   * @returns {Promise<Array>} Processed data
   * @throws {Error} If operation type is not supported
   */
  async processData(data, operations) {
    let processedData = [...data];
    
    for (const operation of operations) {
      const { type, params } = operation;
      
      if (this.supportedOperations[type]) {
        processedData = await this.supportedOperations[type](processedData, params);
      } else {
        throw new Error(`Unsupported operation: ${type}`);
      }
    }
    
    return processedData;
  }

  /**
   * Filter data based on conditions
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Filter parameters
   * @param {string} params.column - Column name to filter on
   * @param {string} params.operator - Filter operator (equals, greater_than, etc.)
   * @param {*} params.value - Value to compare against
   * @returns {Array} Filtered data array
   */
  filterData(data, params) {
    const { column, operator, value } = params;
    
    return data.filter(row => {
      const cellValue = row[column];
      
      switch (operator) {
        case 'equals':
          return cellValue == value;
        case 'not_equals':
          return cellValue != value;
        case 'greater_than':
          return parseFloat(cellValue) > parseFloat(value);
        case 'less_than':
          return parseFloat(cellValue) < parseFloat(value);
        case 'greater_than_or_equal':
          return parseFloat(cellValue) >= parseFloat(value);
        case 'less_than_or_equal':
          return parseFloat(cellValue) <= parseFloat(value);
        case 'contains':
          return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
        case 'starts_with':
          return String(cellValue).toLowerCase().startsWith(String(value).toLowerCase());
        case 'ends_with':
          return String(cellValue).toLowerCase().endsWith(String(value).toLowerCase());
        case 'between': {
          const { min, max } = params;
          const minNum = Number(min);
          const maxNum = Number(max);
          const haveNumericBounds = Number.isFinite(minNum) && Number.isFinite(maxNum);
          const minTime = Date.parse(min);
          const maxTime = Date.parse(max);
          const haveDateBounds = Number.isFinite(minTime) && Number.isFinite(maxTime);

          // Check if the current row's cellValue is between min and max
          if (cellValue === null || cellValue === undefined || cellValue === '') return false;

          if (haveNumericBounds) {
            const vNum = Number(cellValue);
            if (Number.isFinite(vNum)) return vNum >= minNum && vNum <= maxNum;
          }
          if (haveDateBounds) {
            const vTime = Date.parse(cellValue);
            if (Number.isFinite(vTime)) return vTime >= minTime && vTime <= maxTime;
          }
          const vStr = String(cellValue);
          const minStr = String(min);
          const maxStr = String(max);
          return vStr.localeCompare(minStr) >= 0 && vStr.localeCompare(maxStr) <= 0;
        }
        default:
          return true;
      }
    });
  }

  /**
   * Sort data by column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Sort parameters
   * @param {string} params.column - Column name to sort by
   * @param {string} params.direction - Sort direction ('asc' or 'desc')
   * @returns {Array} Sorted data array
   */
  sortData(data, params) {
    const { column, direction = 'asc' } = params;
    
    return [...data].sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];
      
      // Try to convert to numbers for numeric sorting
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        aVal = aNum;
        bVal = bNum;
      }
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }

  /**
   * Aggregate data (sum, average, count, min, max)
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Aggregation parameters
   * @param {string} params.column - Column name to aggregate
   * @param {string} params.operation - Aggregation operation
   * @returns {number|null} Aggregated value
   * @throws {Error} If operation is not supported
   */
  aggregateData(data, params) {
    const { column, operation } = params;
    
    const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
    
    switch (operation) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0);
      case 'average':
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      case 'count':
        return values.length;
      case 'min':
        return values.length > 0 ? Math.min(...values) : null;
      case 'max':
        return values.length > 0 ? Math.max(...values) : null;
      default:
        throw new Error(`Unsupported aggregation operation: ${operation}`);
    }
  }

  /**
   * Select specific columns from data
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Selection parameters
   * @param {Array} params.columns - Array of column names to select
   * @returns {Array} Data with only selected columns
   */
  selectColumns(data, params) {
    const { columns } = params;
    
    return data.map(row => {
      const newRow = {};
      columns.forEach(col => {
        if (row.hasOwnProperty(col)) {
          newRow[col] = row[col];
        }
      });
      return newRow;
    });
  }

  /**
   * Group data by column and apply aggregation
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Group by parameters
   * @param {string} params.groupBy - Column name to group by
   * @param {Array} params.aggregations - Array of aggregation operations
   * @returns {Array} Grouped and aggregated data
   */
  groupByData(data, params) {
    const { groupBy, aggregations } = params;
    
    const groups = {};
    
    data.forEach(row => {
      const groupKey = row[groupBy];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(row);
    });
    
    return Object.keys(groups).map(groupKey => {
      const groupData = groups[groupKey];
      const result = { [groupBy]: groupKey };
      
      aggregations.forEach(agg => {
        const { column, operation, alias } = agg;
        const values = groupData.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
        
        switch (operation) {
          case 'sum':
            result[alias] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'average':
            result[alias] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            break;
          case 'count':
            result[alias] = values.length;
            break;
          case 'min':
            result[alias] = values.length > 0 ? Math.min(...values) : null;
            break;
          case 'max':
            result[alias] = values.length > 0 ? Math.max(...values) : null;
            break;
        }
      });
      
      return result;
    });
  }

  /**
   * Calculate new column based on expression
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Calculation parameters
   * @param {string} params.expression - Mathematical expression to evaluate
   * @param {string} params.newColumnName - Name for the new calculated column
   * @returns {Array} Data with new calculated column
   */
  calculateColumn(data, params) {
    const { expression, newColumnName } = params;
    
    return data.map(row => {
      try {
        let calculatedValue = expression;
        
        // Replace column references with actual values
        Object.keys(row).forEach(col => {
          const regex = new RegExp(`\\b${col}\\b`, 'g');
          calculatedValue = calculatedValue.replace(regex, row[col]);
        });
        
        // Evaluate the expression
        const result = eval(calculatedValue);
        
        return {
          ...row,
          [newColumnName]: isNaN(result) ? null : result
        };
      } catch (error) {
        return {
          ...row,
          [newColumnName]: null
        };
      }
    });
  }

  /**
   * Get data summary with statistics
   * 
   * @param {Array} data - Input data array
   * @returns {Object} Data summary with rows, columns, and column statistics
   */
  getDataSummary(data) {
    if (!data || data.length === 0) {
      return {
        rows: 0,
        columns: 0,
        summary: {}
      };
    }

    const columns = Object.keys(data[0]);
    const summary = {};

    columns.forEach(col => {
      const values = data.map(row => row[col]).filter(val => val !== null && val !== undefined);
      const numericValues = values.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      summary[col] = {
        type: numericValues.length === values.length ? 'numeric' : 'text',
        count: values.length,
        unique: new Set(values).size
      };

      if (numericValues.length > 0) {
        summary[col].min = Math.min(...numericValues);
        summary[col].max = Math.max(...numericValues);
        summary[col].average = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      }
    });

    return {
      rows: data.length,
      columns: columns.length,
      summary: summary
    };
  }

  /**
   * Get list of available operations
   * 
   * @returns {Array} Array of supported operation names
   */
  getAvailableOperations() {
    return Object.keys(this.supportedOperations);
  }

  // ========================
  // Statistical Operations
  // ========================

  /**
   * Calculate descriptive statistics for a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name to analyze
   * @returns {Object} Descriptive statistics object
   */
  descriptiveStats(data, params) {
    const { column } = params;
    const values = data
      .map(row => parseFloat(row[column]))
      .filter(v => !isNaN(v))
      .sort((a, b) => a - b);

    if (values.length === 0) {
      throw new Error(`No valid numeric values found in column '${column}'`);
    }

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const median = values.length % 2 === 0 
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];
    
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const min = values[0];
    const max = values[values.length - 1];
    // Calculate quartiles using linear interpolation (consistent with calculatePercentiles)
    const q1Index = 0.25 * (values.length - 1);
    const q1Lower = Math.floor(q1Index);
    const q1Upper = Math.ceil(q1Index);
    const q1Weight = q1Index % 1;
    const q1 = values[q1Lower] * (1 - q1Weight) + values[q1Upper] * q1Weight;
    
    const q3Index = 0.75 * (values.length - 1);
    const q3Lower = Math.floor(q3Index);
    const q3Upper = Math.ceil(q3Index);
    const q3Weight = q3Index % 1;
    const q3 = values[q3Lower] * (1 - q3Weight) + values[q3Upper] * q3Weight;

    return { 
      column, 
      count: values.length,
      mean: Number(mean.toFixed(4)),
      median: Number(median.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      min, max, q1, q3,
      variance: Number(variance.toFixed(4))
    };
  }

  /**
   * Calculate mean of a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @returns {number} Mean value
   */
  calculateMean(data, params) {
    const { column } = params;
    
    // Check if column exists
    if (data.length > 0 && !data[0].hasOwnProperty(column)) {
      const availableColumns = Object.keys(data[0]);
      throw new Error(`Column '${column}' does not exist. Available columns: ${availableColumns.join(', ')}`);
    }
    
    const values = data
      .map(row => parseFloat(row[column]))
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      const sampleValues = data.slice(0, 3).map(row => row[column]);
      throw new Error(`No valid numeric values found in column '${column}'. Column contains non-numeric data like: [${sampleValues.join(', ')}]. Statistical operations require numeric data.`);
    }

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return Number(mean.toFixed(4));
  }

  /**
   * Calculate median of a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @returns {number} Median value
   */
  calculateMedian(data, params) {
    const { column } = params;
    const values = data
      .map(row => parseFloat(row[column]))
      .filter(v => !isNaN(v))
      .sort((a, b) => a - b);

    if (values.length === 0) {
      throw new Error(`No valid numeric values found in column '${column}'`);
    }

    const median = values.length % 2 === 0 
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];
    
    return Number(median.toFixed(4));
  }

  /**
   * Calculate standard deviation of a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @returns {number} Standard deviation
   */
  calculateStandardDeviation(data, params) {
    const { column } = params;
    const values = data
      .map(row => parseFloat(row[column]))
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      throw new Error(`No valid numeric values found in column '${column}'`);
    }

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return Number(stdDev.toFixed(4));
  }

  /**
   * Calculate correlation between two columns
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.columnX - First column name
   * @param {string} params.columnY - Second column name
   * @returns {number} Correlation coefficient
   */
  calculateCorrelation(data, params) {
    const { columnX, columnY } = params;
    const pairs = data
      .map(row => ({ x: parseFloat(row[columnX]), y: parseFloat(row[columnY]) }))
      .filter(pair => !isNaN(pair.x) && !isNaN(pair.y));

    if (pairs.length < 2) {
      throw new Error(`Not enough valid numeric pairs found between '${columnX}' and '${columnY}'`);
    }

    const meanX = pairs.reduce((sum, p) => sum + p.x, 0) / pairs.length;
    const meanY = pairs.reduce((sum, p) => sum + p.y, 0) / pairs.length;
    
    let numerator = 0, denomX = 0, denomY = 0;
    for (const pair of pairs) {
      const devX = pair.x - meanX;
      const devY = pair.y - meanY;
      numerator += devX * devY;
      denomX += devX * devX;
      denomY += devY * devY;
    }
    
    const denominator = Math.sqrt(denomX * denomY);
    if (denominator === 0) {
      // Handle case where one or both variables have zero variance
      return 0;
    }
    
    const correlation = numerator / denominator;
    return Number(correlation.toFixed(4));
  }

  /**
   * Detect outliers in a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @param {string} params.method - Detection method ('iqr', 'zscore', 'modified_zscore')
   * @returns {Array} Data with outlier flags
   */
  detectOutliers(data, params) {
    const { column, method } = params;
    const values = data.map(row => parseFloat(row[column]));
    const validValues = values.filter(v => !isNaN(v));
    
    if (validValues.length === 0) {
      throw new Error(`No valid numeric values found in column '${column}'`);
    }

    let outlierIndices = new Set();

    if (method === 'iqr') {
      const sorted = [...validValues].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      values.forEach((v, i) => {
        if (!isNaN(v) && (v < lowerBound || v > upperBound)) {
          outlierIndices.add(i);
        }
      });
    } else if (method === 'zscore') {
      const mean = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
      const stdDev = Math.sqrt(validValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / validValues.length);
      
      // Guard against divide by zero when standard deviation is 0
      if (stdDev > 0) {
        values.forEach((v, i) => {
          if (!isNaN(v) && Math.abs((v - mean) / stdDev) > 3) {
            outlierIndices.add(i);
          }
        });
      }
      // If stdDev is 0, all values are identical, so no outliers
    }

    return data.map((row, i) => ({
      ...row,
      [`${column}_is_outlier`]: outlierIndices.has(i)
    }));
  }

  /**
   * Count frequency of values in a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @returns {Array} Frequency count results
   */
  frequencyCount(data, params) {
    const { column } = params;
    const frequencies = {};
    
    data.forEach(row => {
      const value = row[column];
      const key = value === null || value === undefined ? 'null' : String(value);
      frequencies[key] = (frequencies[key] || 0) + 1;
    });

    return Object.entries(frequencies)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate percentiles of a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @param {number} params.percentile - Percentile value (0-100)
   * @returns {number} Percentile value
   */
  calculatePercentiles(data, params) {
    const { column, percentile } = params;
    
    // Validate percentile range (for test compatibility)
    if (percentile < 0 || percentile > 100) {
      throw new Error(`Percentile must be between 0 and 100, got: ${percentile}`);
    }
    
    const values = data
      .map(row => parseFloat(row[column]))
      .filter(v => !isNaN(v))
      .sort((a, b) => a - b);

    if (values.length === 0) {
      throw new Error(`No valid numeric values found in column '${column}'`);
    }

    const index = (percentile / 100) * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    const result = values[lower] * (1 - weight) + values[upper] * weight;
    return Number(result.toFixed(4));
  }

  /**
   * ===================================================================
   * ADVANCED MATHEMATICAL OPERATIONS
   * ===================================================================
   */

  /**
   * Matrix Multiplication
   * Multiplies two matrices represented as arrays of arrays
   *
   * @param {Array} data - Input data (not used directly, matrices passed in params)
   * @param {Object} params - Parameters
   * @param {Array<Array<number>>} params.matrixA - First matrix
   * @param {Array<Array<number>>} params.matrixB - Second matrix
   * @returns {Array<Array<number>>} Resulting matrix
   */
  matrixMultiply(data, params) {
    const { matrixA, matrixB } = params;

    if (!Array.isArray(matrixA) || !Array.isArray(matrixB)) {
      throw new Error('Both matrices must be arrays');
    }

    if (matrixA.length === 0 || matrixB.length === 0) {
      throw new Error('Matrices cannot be empty');
    }

    const rowsA = matrixA.length;
    const colsA = matrixA[0].length;
    const rowsB = matrixB.length;
    const colsB = matrixB[0].length;

    if (colsA !== rowsB) {
      throw new Error(`Cannot multiply matrices: columns of A (${colsA}) must equal rows of B (${rowsB})`);
    }

    const result = Array(rowsA).fill(0).map(() => Array(colsB).fill(0));

    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        for (let k = 0; k < colsA; k++) {
          result[i][j] += matrixA[i][k] * matrixB[k][j];
        }
      }
    }

    return result;
  }

  /**
   * Matrix Transpose
   * Transposes a matrix (rows become columns)
   *
   * @param {Array} data - Input data (not used directly)
   * @param {Object} params - Parameters
   * @param {Array<Array<number>>} params.matrix - Matrix to transpose
   * @returns {Array<Array<number>>} Transposed matrix
   */
  matrixTranspose(data, params) {
    const { matrix } = params;

    if (!Array.isArray(matrix) || matrix.length === 0) {
      throw new Error('Matrix must be a non-empty array');
    }

    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = Array(cols).fill(0).map(() => Array(rows).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[j][i] = matrix[i][j];
      }
    }

    return result;
  }

  /**
   * Matrix Determinant (2x2 and 3x3 only for educational purposes)
   *
   * @param {Array} data - Input data (not used directly)
   * @param {Object} params - Parameters
   * @param {Array<Array<number>>} params.matrix - Square matrix
   * @returns {number} Determinant value
   */
  matrixDeterminant(data, params) {
    const { matrix } = params;

    if (!Array.isArray(matrix) || matrix.length === 0) {
      throw new Error('Matrix must be a non-empty array');
    }

    const n = matrix.length;

    if (matrix.some(row => row.length !== n)) {
      throw new Error('Matrix must be square');
    }

    if (n === 1) {
      return matrix[0][0];
    }

    if (n === 2) {
      return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    }

    if (n === 3) {
      return (
        matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
        matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
        matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
      );
    }

    throw new Error('Determinant calculation only supported for 1x1, 2x2, and 3x3 matrices');
  }

  /**
   * Matrix Inverse (2x2 only for educational purposes)
   *
   * @param {Array} data - Input data (not used directly)
   * @param {Object} params - Parameters
   * @param {Array<Array<number>>} params.matrix - 2x2 matrix
   * @returns {Array<Array<number>>} Inverse matrix
   */
  matrixInverse(data, params) {
    const { matrix } = params;

    if (!Array.isArray(matrix) || matrix.length !== 2 || matrix[0].length !== 2) {
      throw new Error('Matrix inverse only supported for 2x2 matrices in this implementation');
    }

    const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is singular (determinant is zero), cannot invert');
    }

    return [
      [matrix[1][1] / det, -matrix[0][1] / det],
      [-matrix[1][0] / det, matrix[0][0] / det]
    ];
  }

  /**
   * Apply Trigonometric Function to Column
   *
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @param {string} params.function - Trig function (sin, cos, tan, asin, acos, atan)
   * @param {string} params.angleUnit - 'degrees' or 'radians' (default: radians)
   * @param {string} params.outputColumn - New column name for results
   * @returns {Array} Data with new column containing results
   */
  applyTrigFunction(data, params) {
    const { column, function: func, angleUnit = 'radians', outputColumn } = params;

    const validFunctions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'];
    if (!validFunctions.includes(func)) {
      throw new Error(`Invalid function. Must be one of: ${validFunctions.join(', ')}`);
    }

    const toRadians = angleUnit === 'degrees' ? (deg) => deg * Math.PI / 180 : (rad) => rad;
    const fromRadians = angleUnit === 'degrees' ? (rad) => rad * 180 / Math.PI : (rad) => rad;

    return data.map(row => {
      const value = parseFloat(row[column]);
      if (isNaN(value)) {
        return { ...row, [outputColumn]: null };
      }

      let result;
      if (['sin', 'cos', 'tan'].includes(func)) {
        const radValue = toRadians(value);
        result = Math[func](radValue);
      } else {
        // Inverse functions return in radians, convert if needed
        result = fromRadians(Math[func](value));
      }

      return { ...row, [outputColumn]: Number(result.toFixed(6)) };
    });
  }

  /**
   * Apply Logarithm to Column
   *
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @param {string} params.base - Logarithm base ('e', '10', '2', or custom number)
   * @param {string} params.outputColumn - New column name for results
   * @returns {Array} Data with new column containing results
   */
  applyLogarithm(data, params) {
    const { column, base = 'e', outputColumn } = params;

    let logFunction;
    if (base === 'e') {
      logFunction = Math.log;
    } else if (base === '10') {
      logFunction = Math.log10;
    } else if (base === '2') {
      logFunction = Math.log2;
    } else {
      const baseNum = parseFloat(base);
      if (isNaN(baseNum) || baseNum <= 0 || baseNum === 1) {
        throw new Error('Invalid logarithm base. Must be positive and not equal to 1');
      }
      logFunction = (x) => Math.log(x) / Math.log(baseNum);
    }

    return data.map(row => {
      const value = parseFloat(row[column]);
      if (isNaN(value) || value <= 0) {
        return { ...row, [outputColumn]: null };
      }

      const result = logFunction(value);
      return { ...row, [outputColumn]: Number(result.toFixed(6)) };
    });
  }

  /**
   * Exponential Smoothing
   * Applies exponential smoothing to a time series column
   *
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name to smooth
   * @param {number} params.alpha - Smoothing factor (0 < alpha <= 1)
   * @param {string} params.outputColumn - New column name for smoothed values
   * @returns {Array} Data with new column containing smoothed values
   */
  exponentialSmoothing(data, params) {
    const { column, alpha = 0.3, outputColumn } = params;

    if (alpha <= 0 || alpha > 1) {
      throw new Error('Alpha must be between 0 and 1 (exclusive of 0, inclusive of 1)');
    }

    let smoothed = null;

    return data.map((row, index) => {
      const value = parseFloat(row[column]);

      if (isNaN(value)) {
        return { ...row, [outputColumn]: null };
      }

      if (smoothed === null) {
        smoothed = value;
      } else {
        smoothed = alpha * value + (1 - alpha) * smoothed;
      }

      return { ...row, [outputColumn]: Number(smoothed.toFixed(4)) };
    });
  }

  /**
   * Polynomial Fitting (least squares regression)
   * Fits a polynomial of specified degree to data
   *
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.columnX - X values column
   * @param {string} params.columnY - Y values column
   * @param {number} params.degree - Polynomial degree (1 for linear, 2 for quadratic, etc.)
   * @param {string} params.outputColumn - Column name for predicted values
   * @returns {Object} Coefficients and data with predictions
   */
  polynomialFit(data, params) {
    const { columnX, columnY, degree = 1, outputColumn } = params;

    if (degree < 1 || degree > 3) {
      throw new Error('Polynomial degree must be between 1 and 3 for this implementation');
    }

    // Extract valid data points
    const points = data
      .map(row => ({ x: parseFloat(row[columnX]), y: parseFloat(row[columnY]) }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y));

    if (points.length < degree + 1) {
      throw new Error(`Need at least ${degree + 1} data points for degree ${degree} polynomial`);
    }

    // Build normal equations matrix for least squares
    const n = degree + 1;
    const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
    const vector = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        matrix[i][j] = points.reduce((sum, p) => sum + Math.pow(p.x, i + j), 0);
      }
      vector[i] = points.reduce((sum, p) => sum + p.y * Math.pow(p.x, i), 0);
    }

    // Solve using Gaussian elimination (simple implementation)
    const coefficients = this.solveLinearSystem(matrix, vector);

    // Apply polynomial to data
    const resultData = data.map(row => {
      const x = parseFloat(row[columnX]);
      if (isNaN(x)) {
        return { ...row, [outputColumn]: null };
      }

      const y = coefficients.reduce((sum, coef, i) => sum + coef * Math.pow(x, i), 0);
      return { ...row, [outputColumn]: Number(y.toFixed(4)) };
    });

    return {
      data: resultData,
      coefficients: coefficients.map(c => Number(c.toFixed(6))),
      degree
    };
  }

  /**
   * Helper: Solve linear system using Gaussian elimination
   * @private
   */
  solveLinearSystem(matrix, vector) {
    const n = matrix.length;
    const augmented = matrix.map((row, i) => [...row, vector[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // Eliminate column
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }

    // Back substitution
    const solution = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      solution[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        solution[i] -= augmented[i][j] * solution[j];
      }
      solution[i] /= augmented[i][i];
    }

    return solution;
  }

  /**
   * Calculate Numerical Derivative
   * Approximates derivative using finite differences
   *
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.columnX - Independent variable column
   * @param {string} params.columnY - Dependent variable column
   * @param {string} params.outputColumn - Column name for derivative values
   * @returns {Array} Data with derivative column
   */
  calculateDerivative(data, params) {
    const { columnX, columnY, outputColumn } = params;

    return data.map((row, index) => {
      if (index === 0 || index === data.length - 1) {
        // Use forward/backward difference at endpoints
        if (index === 0 && data.length > 1) {
          const x0 = parseFloat(row[columnX]);
          const x1 = parseFloat(data[index + 1][columnX]);
          const y0 = parseFloat(row[columnY]);
          const y1 = parseFloat(data[index + 1][columnY]);

          if (!isNaN(x0) && !isNaN(x1) && !isNaN(y0) && !isNaN(y1) && x1 !== x0) {
            const derivative = (y1 - y0) / (x1 - x0);
            return { ...row, [outputColumn]: Number(derivative.toFixed(6)) };
          }
        } else if (index === data.length - 1 && data.length > 1) {
          const x0 = parseFloat(data[index - 1][columnX]);
          const x1 = parseFloat(row[columnX]);
          const y0 = parseFloat(data[index - 1][columnY]);
          const y1 = parseFloat(row[columnY]);

          if (!isNaN(x0) && !isNaN(x1) && !isNaN(y0) && !isNaN(y1) && x1 !== x0) {
            const derivative = (y1 - y0) / (x1 - x0);
            return { ...row, [outputColumn]: Number(derivative.toFixed(6)) };
          }
        }
        return { ...row, [outputColumn]: null };
      }

      // Central difference for interior points
      const x0 = parseFloat(data[index - 1][columnX]);
      const x2 = parseFloat(data[index + 1][columnX]);
      const y0 = parseFloat(data[index - 1][columnY]);
      const y2 = parseFloat(data[index + 1][columnY]);

      if (!isNaN(x0) && !isNaN(x2) && !isNaN(y0) && !isNaN(y2) && x2 !== x0) {
        const derivative = (y2 - y0) / (x2 - x0);
        return { ...row, [outputColumn]: Number(derivative.toFixed(6)) };
      }

      return { ...row, [outputColumn]: null };
    });
  }

  /**
   * Calculate Numerical Integral (cumulative)
   * Approximates integral using trapezoidal rule
   *
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.columnX - Independent variable column
   * @param {string} params.columnY - Function values column
   * @param {string} params.outputColumn - Column name for cumulative integral
   * @returns {Array} Data with cumulative integral column
   */
  calculateIntegral(data, params) {
    const { columnX, columnY, outputColumn } = params;

    let cumulativeIntegral = 0;

    return data.map((row, index) => {
      if (index === 0) {
        return { ...row, [outputColumn]: 0 };
      }

      const x0 = parseFloat(data[index - 1][columnX]);
      const x1 = parseFloat(row[columnX]);
      const y0 = parseFloat(data[index - 1][columnY]);
      const y1 = parseFloat(row[columnY]);

      if (!isNaN(x0) && !isNaN(x1) && !isNaN(y0) && !isNaN(y1)) {
        // Trapezoidal rule: area = (x1 - x0) * (y0 + y1) / 2
        const area = (x1 - x0) * (y0 + y1) / 2;
        cumulativeIntegral += area;
        return { ...row, [outputColumn]: Number(cumulativeIntegral.toFixed(6)) };
      }

      return { ...row, [outputColumn]: cumulativeIntegral };
    });
  }
}

module.exports = new DataProcessor();
