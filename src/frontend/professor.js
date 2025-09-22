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
      if (window.BlockUtils && window.BlockUtils.updateDataPanel) {
        window.BlockUtils.updateDataPanel(result);
      }
      
      // Update the visualization data for automatic charts
      window.processedData = result;
      
      // Trigger auto-visualization with processed data
      window.dispatchEvent(new CustomEvent('dataProcessed', { 
        detail: { 
          data: result,
          operation: operation.type 
        } 
      }));
      
      return result;
      
    } catch (error) {
      console.error('[Professor] Operation failed:', error);
      
      // Provide user-friendly error feedback
      if (window.reactSetOutput) {
        window.reactSetOutput(`Error: ${error.message}`);
      }
      if (window.reactSetError) {
        window.reactSetError(true);
      }
      
      // Re-throw the error so blocks can handle it appropriately
      throw error;
    }
  },

  /**
   * Get available operations (for debugging/introspection)
   */
  getAvailableOperations() {
    return ['convertType', 'dropColumn', 'renameColumn', 'handleMissing'];
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