const fs = require('fs');
const Papa = require('papaparse');

class DataProcessor {
  constructor() {
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
   * Select specific columns
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
    
    return Object.entries(groups).map(([groupValue, groupData]) => {
      const result = { [groupBy]: groupValue };
      
      aggregations.forEach(agg => {
        const { column, operation, alias } = agg;
        const aggValue = this.aggregateData(groupData, { column, operation });
        result[alias || `${operation}_${column}`] = aggValue;
      });
      
      return result;
    });
  }

  /**
   * Calculate new column based on existing columns
   */
  calculateColumn(data, params) {
    const { expression, newColumnName } = params;
    
    return data.map(row => {
      const newRow = { ...row };
      
      // Simple expression evaluation (can be extended for more complex expressions)
      let calculatedValue = expression;
      
      // Replace column references with actual values
      Object.keys(row).forEach(col => {
        const regex = new RegExp(`\\b${col}\\b`, 'g');
        calculatedValue = calculatedValue.replace(regex, `"${row[col]}"`);
      });
      
      try {
        // Evaluate the expression (basic implementation - could use a safer expression parser)
        newRow[newColumnName] = eval(calculatedValue);
      } catch (error) {
        newRow[newColumnName] = null;
      }
      
      return newRow;
    });
  }

  /**
   * Get summary statistics for data
   */
  getDataSummary(data) {
    if (!data || data.length === 0) {
      return { rows: 0, columns: 0, summary: {} };
    }
    
    const columns = Object.keys(data[0]);
    const summary = {};
    
    columns.forEach(col => {
      const values = data.map(row => row[col]).filter(val => val !== null && val !== undefined);
      const numericValues = values.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      summary[col] = {
        type: numericValues.length === values.length ? 'numeric' : 'text',
        count: values.length,
        unique: new Set(values).size,
        nulls: data.length - values.length
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
   * Get available operations
   */
  getAvailableOperations() {
    return Object.keys(this.supportedOperations);
  }
}

module.exports = new DataProcessor();
