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
    /**
     * Supported data processing operations
     * @type {Object}
     */
    this.supportedOperations = {
      filter: this.filterData.bind(this),
      sort: this.sortData.bind(this),
      aggregate: this.aggregateData.bind(this),
      select: this.selectColumns.bind(this),
      groupBy: this.groupByData.bind(this),
      calculate: this.calculateColumn.bind(this)
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
        
        // Safe evaluation using Function constructor with restricted scope
        const result = this._safeEvaluateExpression(calculatedValue);
        
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
   * Safely evaluate mathematical expressions without eval()
   * 
   * @param {string} expression - Mathematical expression to evaluate
   * @returns {number} Calculated result
   * @private
   */
  _safeEvaluateExpression(expression) {
    // Convert to string and trim
    expression = String(expression).trim();
    
    // Whitelist of allowed mathematical operations and numbers
    const allowedPattern = /^[0-9+\-*/.() ]+$/;
    
    // Check if expression contains only allowed characters
    if (!allowedPattern.test(expression)) {
      throw new Error('Invalid characters in expression');
    }
    
    // Additional validation: check for suspicious patterns
    const suspiciousPatterns = [
      /eval/i,
      /function/i,
      /return/i,
      /import/i,
      /require/i,
      /process/i,
      /global/i,
      /window/i,
      /document/i,
      /constructor/i,
      /__proto__/i,
      /prototype/i,
      /this/i,
      /console/i,
      /alert/i,
      /prompt/i,
      /confirm/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(expression)) {
        throw new Error('Potentially unsafe expression');
      }
    }
    
    // Validate parentheses are balanced
    let balance = 0;
    for (const char of expression) {
      if (char === '(') balance++;
      if (char === ')') balance--;
      if (balance < 0) throw new Error('Unbalanced parentheses');
    }
    if (balance !== 0) throw new Error('Unbalanced parentheses');
    
    // Simple arithmetic parser instead of Function constructor
    try {
      return this._parseArithmetic(expression);
    } catch (error) {
      throw new Error('Expression evaluation failed: ' + error.message);
    }
  }

  /**
   * Parse and evaluate simple arithmetic expressions safely
   * 
   * @param {string} expr - Expression to parse
   * @returns {number} Result
   * @private
   */
  _parseArithmetic(expr) {
    // Remove spaces
    expr = expr.replace(/\s+/g, '');
    
    // Handle parentheses recursively
    while (expr.includes('(')) {
      const start = expr.lastIndexOf('(');
      const end = expr.indexOf(')', start);
      if (end === -1) throw new Error('Unmatched parentheses');
      
      const innerExpr = expr.slice(start + 1, end);
      const innerResult = this._parseArithmetic(innerExpr);
      expr = expr.slice(0, start) + innerResult + expr.slice(end + 1);
    }
    
    // Parse operations in order: *, /, +, -
    return this._evaluateExpression(expr);
  }

  /**
   * Evaluate arithmetic expression without parentheses
   * 
   * @param {string} expr - Expression to evaluate
   * @returns {number} Result
   * @private
   */
  _evaluateExpression(expr) {
    // Handle multiplication and division first
    let tokens = expr.split(/([+\-])/).filter(t => t !== '');
    
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].includes('*') || tokens[i].includes('/')) {
        tokens[i] = String(this._evaluateMultDiv(tokens[i]));
      }
    }
    
    // Handle addition and subtraction
    let result = parseFloat(tokens[0]);
    for (let i = 1; i < tokens.length; i += 2) {
      const operator = tokens[i];
      const operand = parseFloat(tokens[i + 1]);
      
      if (operator === '+') result += operand;
      else if (operator === '-') result -= operand;
    }
    
    return result;
  }

  /**
   * Evaluate multiplication and division
   * 
   * @param {string} expr - Expression with * and /
   * @returns {number} Result
   * @private
   */
  _evaluateMultDiv(expr) {
    const tokens = expr.split(/([*\/])/).filter(t => t !== '');
    let result = parseFloat(tokens[0]);
    
    for (let i = 1; i < tokens.length; i += 2) {
      const operator = tokens[i];
      const operand = parseFloat(tokens[i + 1]);
      
      if (operator === '*') result *= operand;
      else if (operator === '/') {
        if (operand === 0) throw new Error('Division by zero');
        result /= operand;
      }
    }
    
    return result;
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
}

module.exports = new DataProcessor();
