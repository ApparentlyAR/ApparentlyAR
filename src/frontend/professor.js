/**
 * Professor Class - Bridge between Blockly blocks and DataProcessor
 * 
 * Provides the interface that data cleaning blocks expect while leveraging
 * the existing DataProcessor functionality. Designed for client-side execution
 * with graceful error handling.
 * 
 * @author ApparentlyAR Team
 * @version 1.0.0
 */

// Ensure global namespace exists
window.AppAR = window.AppAR || {};

/**
 * Client-side DataProcessor operations
 * This is a minimal implementation of key DataProcessor methods for browser use
 */
class ClientDataProcessor {
  constructor() {
    // Bind methods for stable 'this' context
    this.convertType = this.convertType.bind(this);
    this.dropColumn = this.dropColumn.bind(this);
    this.renameColumn = this.renameColumn.bind(this);
    this.handleMissing = this.handleMissing.bind(this);
  }

  // Utility methods
  _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  _isMissing(v) {
    return v === null || v === undefined || v === '' || Number.isNaN(v);
  }

  _toNumber(v) {
    if (v === '' || v === null || v === undefined) return NaN;
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : NaN;
  }

  _toText(v) {
    if (v === null || v === undefined) return '';
    return String(v);
  }

  _toDate(v) {
    if (v instanceof Date) return v;
    if (typeof v === 'number') return new Date(v);
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Convert column data type
   */
  convertType(data, { column, dataType }) {
    console.log(`[Professor] Converting column '${column}' to type '${dataType}'`);
    
    return data.map(row => {
      const v = row?.[column];
      
      let nv = v;
      try {
        if (dataType === 'number') {
          nv = this._toNumber(v);
        } else if (dataType === 'text') {
          nv = this._toText(v);
        } else if (dataType === 'date') {
          nv = this._toDate(v);
        }
      } catch (error) {
        console.warn(`[Professor] Failed to convert value '${v}' to ${dataType}:`, error);
        // Keep original value on conversion failure
      }
      
      return { ...row, [column]: nv };
    });
  }

  /**
   * Drop a column from the dataset
   */
  dropColumn(data, { column }) {
    console.log(`[Professor] Dropping column '${column}'`);
    
    return data.map(row => {
      const { [column]: _omit, ...rest } = row;
      return rest;
    });
  }

  /**
   * Rename a column
   */
  renameColumn(data, { oldName, newName }) {
    console.log(`[Professor] Renaming column '${oldName}' to '${newName}'`);
    
    return data.map(row => {
      if (!Object.prototype.hasOwnProperty.call(row, oldName)) {
        return { ...row };
      }
      
      const { [oldName]: val, ...rest } = row;
      return { ...rest, [newName]: val };
    });
  }

  /**
   * Handle missing values in a column
   */
  handleMissing(data, { column, method, fillValue }) {
    console.log(`[Professor] Handling missing values in '${column}' using method '${method}'`);
    
    // Debug: Check what values we're working with
    console.log(`[Professor] Checking column '${column}' values:`);
    data.forEach((row, i) => {
      const val = row[column];
      const isMissing = this._isMissing(val);
      console.log(`  Row ${i}: ${JSON.stringify(val)} (type: ${typeof val}, isMissing: ${isMissing}, isNaN: ${Number.isNaN(val)})`);
    });
    
    if (method === 'remove') {
      const filtered = data.filter(r => !this._isMissing(r[column]));
      console.log(`[Professor] Removed ${data.length - filtered.length} rows with missing values`);
      return filtered;
    }
    
    if (method === 'fill') {
      return data.map(r => {
        if (this._isMissing(r[column])) {
          return { ...r, [column]: fillValue };
        }
        return r;
      });
    }
    
    if (method === 'fill_average' || method === 'fill_median') {
      const nums = data
        .map(r => this._toNumber(r[column]))
        .filter(v => !Number.isNaN(v))
        .sort((a, b) => a - b);

      console.log(`[Professor] Valid numeric values for calculation:`, nums);

      let fill = null;
      if (nums.length > 0) {
        if (method === 'fill_average') {
          fill = nums.reduce((s, v) => s + v, 0) / nums.length;
        } else {
          const mid = Math.floor(nums.length / 2);
          fill = (nums.length % 2) ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
        }
      }

      console.log(`[Professor] Calculated fill value:`, fill);

      const result = data.map(r => {
        if (this._isMissing(r[column]) && fill !== null) {
          console.log(`[Professor] Filling missing value for row with ${column}=${r[column]} -> ${fill}`);
          return { ...r, [column]: fill };
        }
        return r;
      });

      console.log(`[Professor] Final result after filling:`);
      result.forEach((row, i) => {
        console.log(`  Row ${i}: ${row[column]} (type: ${typeof row[column]})`);
      });

      return result;
    }
    
    return data;
  }

  /**
   * Calculate descriptive statistics for a column
   */
  descriptiveStats(data, { column }) {
    console.log(`[Professor] Calculating descriptive statistics for column '${column}'`);
    
    const values = data
      .map(row => this._toNumber(row[column]))
      .filter(v => !Number.isNaN(v))
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
    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];

    const stats = { 
      column, 
      count: values.length,
      mean: Number(mean.toFixed(4)),
      median: Number(median.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      min, max, q1, q3,
      variance: Number(variance.toFixed(4))
    };

    console.log(`[Professor] Descriptive statistics calculated:`, stats);
    return stats;
  }

  /**
   * Calculate mean of a column
   */
  calculateMean(data, { column }) {
    console.log(`[Professor] Calculating mean for column '${column}'`);
    
    const values = data
      .map(row => this._toNumber(row[column]))
      .filter(v => !Number.isNaN(v));

    if (values.length === 0) {
      throw new Error(`No valid numeric values found in column '${column}'`);
    }

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return Number(mean.toFixed(4));
  }

  /**
   * Calculate median of a column
   */
  calculateMedian(data, { column }) {
    console.log(`[Professor] Calculating median for column '${column}'`);
    
    const values = data
      .map(row => this._toNumber(row[column]))
      .filter(v => !Number.isNaN(v))
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
   */
  calculateStandardDeviation(data, { column }) {
    console.log(`[Professor] Calculating standard deviation for column '${column}'`);
    
    const values = data
      .map(row => this._toNumber(row[column]))
      .filter(v => !Number.isNaN(v));

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
   */
  calculateCorrelation(data, { columnX, columnY }) {
    console.log(`[Professor] Calculating correlation between '${columnX}' and '${columnY}'`);
    
    const pairs = data
      .map(row => ({ x: this._toNumber(row[columnX]), y: this._toNumber(row[columnY]) }))
      .filter(pair => !Number.isNaN(pair.x) && !Number.isNaN(pair.y));

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
    
    const correlation = numerator / Math.sqrt(denomX * denomY);
    return Number(correlation.toFixed(4));
  }

  /**
   * Detect outliers in a column
   */
  detectOutliers(data, { column, method }) {
    console.log(`[Professor] Detecting outliers in '${column}' using '${method}' method`);
    
    const values = data.map(row => this._toNumber(row[column]));
    const validValues = values.filter(v => !Number.isNaN(v));
    
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
        if (!Number.isNaN(v) && (v < lowerBound || v > upperBound)) {
          outlierIndices.add(i);
        }
      });
    } else if (method === 'zscore') {
      const mean = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
      const stdDev = Math.sqrt(validValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / validValues.length);
      
      values.forEach((v, i) => {
        if (!Number.isNaN(v) && Math.abs((v - mean) / stdDev) > 3) {
          outlierIndices.add(i);
        }
      });
    }

    return data.map((row, i) => ({
      ...row,
      [`${column}_is_outlier`]: outlierIndices.has(i)
    }));
  }

  /**
   * Count frequency of values in a column
   */
  frequencyCount(data, { column }) {
    console.log(`[Professor] Counting frequencies for column '${column}'`);
    
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
   */
  calculatePercentiles(data, { column, percentile }) {
    console.log(`[Professor] Calculating ${percentile}th percentile for column '${column}'`);
    
    const values = data
      .map(row => this._toNumber(row[column]))
      .filter(v => !Number.isNaN(v))
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
   * Process data with a single operation
   */
  async processData(data, operations) {
    let processedData = this._deepClone(data);

    for (const operation of operations) {
      const { type, params } = operation || {};
      
      switch (type) {
        case 'convertType':
          processedData = this.convertType(processedData, params);
          break;
        case 'dropColumn':
          processedData = this.dropColumn(processedData, params);
          break;
        case 'renameColumn':
          processedData = this.renameColumn(processedData, params);
          break;
        case 'handleMissing':
          processedData = this.handleMissing(processedData, params);
          break;
        case 'descriptiveStats':
          return this.descriptiveStats(processedData, params);
        case 'calculateMean':
          return this.calculateMean(processedData, params);
        case 'calculateMedian':
          return this.calculateMedian(processedData, params);
        case 'calculateStandardDeviation':
          return this.calculateStandardDeviation(processedData, params);
        case 'calculateCorrelation':
          return this.calculateCorrelation(processedData, params);
        case 'detectOutliers':
          processedData = this.detectOutliers(processedData, params);
          break;
        case 'frequencyCount':
          return this.frequencyCount(processedData, params);
        case 'calculatePercentiles':
          return this.calculatePercentiles(processedData, params);
        default:
          throw new Error(`Unsupported operation: ${type}`);
      }
    }

    return processedData;
  }
}

/**
 * Professor Class - Main interface for Blockly blocks
 */
window.AppAR.Professor = {
  // Initialize client-side data processor
  _processor: new ClientDataProcessor(),
  
  /**
   * Run a single data operation (main interface for blocks)
   * @param {Array<Object>} inputData - Array of data objects (CSV rows)
   * @param {Object} operation - Operation descriptor {type: string, params: Object}
   * @returns {Promise<Array<Object>>} - Processed data
   */
  async runSingle(inputData, operation) {
    try {
      // If inputData is a Promise, await it first
      if (inputData && typeof inputData.then === 'function') {
        console.log('[Professor] Input is a Promise, awaiting...');
        inputData = await inputData;
      }
      
      // Validate inputs
      if (!Array.isArray(inputData)) {
        console.log('[Professor] Input data type:', typeof inputData, 'Value:', inputData);
        throw new Error('Input data must be an array of objects');
      }
      
      if (!operation || typeof operation !== 'object') {
        throw new Error('Operation must be an object with type and params');
      }
      
      if (!operation.type) {
        throw new Error('Operation must have a type property');
      }

      // Validate operation parameters
      this.validateOperation(operation);

      console.log(`[Professor] Executing operation:`, operation);
      console.log(`[Professor] Input data: ${inputData.length} rows`);
      
      // Process the data
      const result = await this._processor.processData(inputData, [operation]);
      
      console.log(`[Professor] Operation completed. Output: ${result.length} rows`);
      
      // Update the data panel with the result
      if (typeof window !== 'undefined' && window.BlockUtils && window.BlockUtils.updateDataPanel) {
        window.BlockUtils.updateDataPanel(result);
      }
      
      // Update the visualization data for automatic charts
      if (typeof window !== 'undefined') {
        window.processedData = result;
        
        // Trigger auto-visualization with processed data (browser only)
        if (window.dispatchEvent && typeof CustomEvent !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dataProcessed', { 
            detail: { 
              data: result,
              operation: operation.type 
            } 
          }));
        }
      }
      
      return result;
      
    } catch (error) {
      console.error('[Professor] Operation failed:', error);
      
      // Provide user-friendly error feedback (browser only)
      if (typeof window !== 'undefined') {
        if (window.reactSetOutput) {
          window.reactSetOutput(`Error: ${error.message}`);
        }
        if (window.reactSetError) {
          window.reactSetError(true);
        }
      }
      
      // Re-throw the error so blocks can handle it appropriately
      throw error;
    }
  },

  /**
   * Get available operations (for debugging/introspection)
   */
  getAvailableOperations() {
    return [
      'convertType', 'dropColumn', 'renameColumn', 'handleMissing',
      'descriptiveStats', 'calculateMean', 'calculateMedian', 'calculateStandardDeviation',
      'calculateCorrelation', 'detectOutliers', 'frequencyCount', 'calculatePercentiles'
    ];
  },

  /**
   * Validate operation parameters
   */
  validateOperation(operation) {
    const { type, params } = operation;
    
    if (!params) {
      throw new Error(`Operation ${type} requires params object`);
    }
    
    switch (type) {
      case 'convertType':
        if (!params.column || !params.dataType) {
          throw new Error('convertType requires column and dataType parameters');
        }
        if (!['number', 'text', 'date'].includes(params.dataType)) {
          throw new Error('dataType must be number, text, or date');
        }
        break;
        
      case 'dropColumn':
        if (!params.column) {
          throw new Error('dropColumn requires column parameter');
        }
        break;
        
      case 'renameColumn':
        if (!params.oldName || !params.newName) {
          throw new Error('renameColumn requires oldName and newName parameters');
        }
        break;
        
      case 'handleMissing':
        if (!params.column || !params.method) {
          throw new Error('handleMissing requires column and method parameters');
        }
        if (!['remove', 'fill', 'fill_average', 'fill_median'].includes(params.method)) {
          throw new Error('method must be remove, fill, fill_average, or fill_median');
        }
        if (params.method === 'fill' && params.fillValue === undefined) {
          throw new Error('fill method requires fillValue parameter');
        }
        break;

      case 'descriptiveStats':
      case 'calculateMean':
      case 'calculateMedian':
      case 'calculateStandardDeviation':
      case 'frequencyCount':
        if (!params.column) {
          throw new Error(`${type} requires column parameter`);
        }
        break;

      case 'calculateCorrelation':
        if (!params.columnX || !params.columnY) {
          throw new Error('calculateCorrelation requires columnX and columnY parameters');
        }
        break;

      case 'detectOutliers':
        if (!params.column || !params.method) {
          throw new Error('detectOutliers requires column and method parameters');
        }
        if (!['iqr', 'zscore', 'modified_zscore'].includes(params.method)) {
          throw new Error('outlier detection method must be iqr, zscore, or modified_zscore');
        }
        break;

      case 'calculatePercentiles':
        if (!params.column || params.percentile === undefined) {
          throw new Error('calculatePercentiles requires column and percentile parameters');
        }
        if (params.percentile < 0 || params.percentile > 100) {
          throw new Error('percentile must be between 0 and 100');
        }
        break;
        
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
    
    return true;
  }
};

// Log successful initialization
console.log('[Professor] Successfully initialized');
console.log('[Professor] Available operations:', window.AppAR.Professor.getAvailableOperations());

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.AppAR.Professor;
}