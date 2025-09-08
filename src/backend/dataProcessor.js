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
      calculate: this.calculateColumn
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
}

module.exports = new DataProcessor();
