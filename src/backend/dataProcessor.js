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
    
    // Transformation methods
    this.renameColumn = this.renameColumn.bind(this);
    this.dropColumn = this.dropColumn.bind(this);
    this.fillMissing = this.fillMissing.bind(this);
    this.replaceValues = this.replaceValues.bind(this);
    this.castType = this.castType.bind(this);
    this.stringTransform = this.stringTransform.bind(this);
    this.splitColumn = this.splitColumn.bind(this);
    this.concatColumns = this.concatColumns.bind(this);
    this.dropDuplicates = this.dropDuplicates.bind(this);
    this.roundNumber = this.roundNumber.bind(this);
    
    // Statistical methods
    this.descriptiveStats = this.descriptiveStats.bind(this);
    this.calculateMean = this.calculateMean.bind(this);
    this.calculateMedian = this.calculateMedian.bind(this);
    this.calculateStandardDeviation = this.calculateStandardDeviation.bind(this);
    this.calculateCorrelation = this.calculateCorrelation.bind(this);
    this.detectOutliers = this.detectOutliers.bind(this);
    this.frequencyCount = this.frequencyCount.bind(this);
    this.calculatePercentiles = this.calculatePercentiles.bind(this);

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
      
      // Transformation operations
      renameColumn: this.renameColumn,
      dropColumn: this.dropColumn,
      fillMissing: this.fillMissing,
      replaceValues: this.replaceValues,
      castType: this.castType,
      stringTransform: this.stringTransform,
      splitColumn: this.splitColumn,
      concatColumns: this.concatColumns,
      dropDuplicates: this.dropDuplicates,
      roundNumber: this.roundNumber,
      
      // Statistical operations
      descriptiveStats: this.descriptiveStats,
      calculateMean: this.calculateMean,
      calculateMedian: this.calculateMedian,
      calculateStandardDeviation: this.calculateStandardDeviation,
      calculateCorrelation: this.calculateCorrelation,
      detectOutliers: this.detectOutliers,
      frequencyCount: this.frequencyCount,
      calculatePercentiles: this.calculatePercentiles
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
    
    // Validate inputs
    if (!Array.isArray(operations)) {
      throw new Error('Operations must be an array');
    }
    
    for (const operation of operations) {
      if (!operation || typeof operation !== 'object') {
        throw new Error('Each operation must be an object');
      }
      
      const { type, params } = operation;
      
      if (!type) {
        throw new Error('Operation type is required');
      }
      
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

          return data.filter(row => {
            const cellValue = row[column];
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
          });
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
  // Transformation Operations
  // ========================

  /**
   * Rename a column in the dataset
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.from - Original column name
   * @param {string} params.to - New column name
   * @returns {Array} Data with renamed column
   */
  renameColumn(data, params) {
    const { from, to } = params;
    return data.map(row => {
      if (!row || typeof row !== 'object') return row;
      // If the source column doesn't exist, do nothing (idempotent on re-run)
      if (!Object.prototype.hasOwnProperty.call(row, from)) {
        return row;
      }
      const { [from]: value, ...rest } = row;
      return { ...rest, [to]: value };
    });
  }

  /**
   * Drop a column from the dataset
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name to drop
   * @returns {Array} Data without the specified column
   */
  dropColumn(data, params) {
    const { column } = params;
    
    return data.map(row => {
      if (!row || typeof row !== 'object') return row;
      const { [column]: omitted, ...rest } = row;
      return rest;
    });
  }

  /**
   * Fill missing values in a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name to fill
   * @param {*} params.value - Value to fill missing entries with
   * @returns {Array} Data with filled missing values
   */
  fillMissing(data, params) {
    const { column, value } = params;
    
    return data.map(row => {
      if (!row || typeof row !== 'object') return row;
      const val = row[column];
      const needFill = val === null || val === undefined || val === '';
      return needFill ? { ...row, [column]: value } : row;
    });
  }

  /**
   * Replace specific values in a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @param {*} params.fromValue - Value to replace
   * @param {*} params.toValue - Replacement value
   * @returns {Array} Data with replaced values
   */
  replaceValues(data, params) {
    const { column, fromValue, toValue } = params;
    
    return data.map(row => {
      if (!row || typeof row !== 'object') return row;
      const val = row[column];
      return (String(val) === String(fromValue)) ? { ...row, [column]: toValue } : row;
    });
  }

  /**
   * Cast column values to a specific type
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @param {string} params.to - Target type (number, string, boolean, date)
   * @returns {Array} Data with cast values
   */
  castType(data, params) {
    const { column, to } = params;
    
    const caster = (val) => {
      if (to === 'number') {
        const num = Number(val);
        return Number.isFinite(num) ? num : null;
      }
      if (to === 'boolean') {
        if (typeof val === 'boolean') return val;
        const str = String(val).toLowerCase();
        return str === 'true' || str === '1' || str === 'yes';
      }
      if (to === 'date') {
        const timestamp = Date.parse(val);
        return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
      }
      return String(val);
    };
    
    return data.map(row => {
      if (!row || typeof row !== 'object') return row;
      return { ...row, [column]: caster(row[column]) };
    });
  }

  /**
   * Apply string transformations to a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @param {string} params.mode - Transformation mode (lower, upper, cap, trim)
   * @returns {Array} Data with transformed strings
   */
  stringTransform(data, params) {
    const { column, mode } = params;
    
    const transformer = (str) => {
      const s = (str === null || str === undefined) ? '' : String(str);
      switch (mode) {
        case 'lower': return s.toLowerCase();
        case 'upper': return s.toUpperCase();
        case 'cap': return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        case 'trim': return s.trim();
        default: return s;
      }
    };
    
    return data.map(row => {
      if (!row || typeof row !== 'object') return row;
      return { ...row, [column]: transformer(row[column]) };
    });
  }

  /**
   * Split a column by delimiter into two new columns
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column to split
   * @param {string} params.delimiter - Delimiter to split on
   * @param {string} params.output1 - Name for first part
   * @param {string} params.output2 - Name for second part
   * @returns {Array} Data with split columns
   */
  splitColumn(data, params) {
    const { column, delimiter, output1, output2 } = params;
    
    return data.map(row => {
      if (!row || typeof row !== 'object') return row;
      const parts = String(row[column] ?? '').split(delimiter);
      return { 
        ...row, 
        [output1]: parts[0] ?? '', 
        [output2]: parts[1] ?? '' 
      };
    });
  }

  /**
   * Concatenate two columns with a separator
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column1 - First column
   * @param {string} params.column2 - Second column
   * @param {string} params.separator - Separator to use
   * @param {string} params.output - Output column name
   * @returns {Array} Data with concatenated column
   */
  concatColumns(data, params) {
    const { column1, column2, separator, output } = params;
    
    return data.map(row => {
      if (!row || typeof row !== 'object') return row;
      const val1 = row[column1];
      const val2 = row[column2];
      const combined = [val1, val2]
        .filter(v => v !== undefined && v !== null)
        .join(separator);
      return { ...row, [output]: combined };
    });
  }

  /**
   * Remove duplicate rows based on a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column to check for duplicates
   * @returns {Array} Data with duplicates removed
   */
  dropDuplicates(data, params) {
    const { column } = params;
    const seen = new Set();
    
    return data.filter(row => {
      const key = row && typeof row === 'object' ? row[column] : row;
      const strKey = String(key);
      if (seen.has(strKey)) return false;
      seen.add(strKey);
      return true;
    });
  }

  /**
   * Round numeric values in a column
   * 
   * @param {Array} data - Input data array
   * @param {Object} params - Parameters
   * @param {string} params.column - Column name
   * @param {number} params.decimals - Number of decimal places
   * @returns {Array} Data with rounded values
   */
  roundNumber(data, params) {
    const { column, decimals } = params;
    
    return data.map(row => {
      if (!row || typeof row !== 'object') return row;
      const num = Number(row[column]);
      const val = Number.isFinite(num) ? Number(num.toFixed(decimals)) : row[column];
      return { ...row, [column]: val };
    });
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
}

module.exports = new DataProcessor();
