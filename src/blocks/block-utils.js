/**
 * Block Utilities
 * 
 * Shared utilities and helper functions for custom Blockly blocks
 * in the ApparentlyAR data visualization platform.
 */

// Global namespace for block utilities
window.BlockUtils = window.BlockUtils || {};

/**
 * Data processing pipeline tracker
 */
window.BlockUtils.DataPipeline = {
  currentData: null,
  operations: [],
  
  // Store current dataset
  setCurrentData(data) {
    this.currentData = data;
  },
  
  // Get current dataset
  getCurrentData() {
    return this.currentData;
  },
  
  // Add operation to pipeline
  addOperation(operation) {
    this.operations.push(operation);
  },
  
  // Clear pipeline
  clear() {
    this.currentData = null;
    this.operations = [];
  }
};

/**
 * API interaction helpers
 */
window.BlockUtils.API = {
  
  /**
   * Process data using backend API
   */
  async processData(data, operations) {
    try {
      const response = await fetch('/api/process-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          operations: operations
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Data processing error:', error);
      throw error;
    }
  },
  
  /**
   * Generate chart using backend API
   */
  async generateChart(data, chartType, options) {
    try {
      const response = await fetch('/api/generate-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          chartType: chartType,
          options: options
        })
      });
      
      if (!response.ok) {
        throw new Error(`Chart API Error: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Chart generation error:', error);
      throw error;
    }
  }
};

/**
 * Block registration helper
 */
window.BlockUtils.registerBlock = function(blockType, generator) {
  // Register with multiple methods for compatibility
  if (typeof Blockly !== 'undefined' && Blockly.JavaScript) {
    try {
      Object.defineProperty(Blockly.JavaScript, blockType, { 
        value: generator, 
        configurable: true 
      });
    } catch (_) {
      Blockly.JavaScript[blockType] = generator;
    }
    
    if (Blockly.JavaScript.forBlock) {
      try {
        Object.defineProperty(Blockly.JavaScript.forBlock, blockType, { 
          value: generator, 
          configurable: true 
        });
      } catch (_) {
        Blockly.JavaScript.forBlock[blockType] = generator;
      }
    }
    
    if (typeof window !== 'undefined' && window.Blockly && window.Blockly.JavaScript) {
      try {
        Object.defineProperty(window.Blockly.JavaScript, blockType, { 
          value: generator, 
          configurable: true 
        });
      } catch (_) {
        window.Blockly.JavaScript[blockType] = generator;
      }
    }
  }
};

/**
 * Common field types for blocks
 */
window.BlockUtils.Fields = {
  
  // Create dropdown for column selection
  createColumnDropdown: function(name = "COLUMN") {
    return {
      "type": "field_dropdown",
      "name": name,
      "options": [
        ["Select column...", ""]
      ]
    };
  },
  
  // Create dropdown for operators
  createOperatorDropdown: function(name = "OPERATOR") {
    return {
      "type": "field_dropdown", 
      "name": name,
      "options": [
        ["equals", "equals"],
        ["not equals", "not_equals"],
        ["greater than", "greater_than"],
        ["less than", "less_than"],
        ["greater than or equal", "greater_than_equal"],
        ["less than or equal", "less_than_equal"],
        ["contains", "contains"],
        ["does not contain", "not_contains"]
      ]
    };
  },
  
  // Create dropdown for chart types
  createChartTypeDropdown: function(name = "CHART_TYPE") {
    return {
      "type": "field_dropdown",
      "name": name, 
      "options": [
        ["Bar Chart", "bar"],
        ["Line Chart", "line"],
        ["Scatter Plot", "scatter"],
        ["Pie Chart", "pie"],
        ["Doughnut Chart", "doughnut"],
        ["Area Chart", "area"],
        ["Histogram", "histogram"],
        ["Box Plot", "boxplot"],
        ["Heatmap", "heatmap"],
        ["Radar Chart", "radar"]
      ]
    };
  },
  
  // Create dropdown for aggregation functions
  createAggregationDropdown: function(name = "FUNCTION") {
    return {
      "type": "field_dropdown",
      "name": name,
      "options": [
        ["Sum", "sum"],
        ["Average", "average"],
        ["Count", "count"],
        ["Minimum", "min"],
        ["Maximum", "max"]
      ]
    };
  },
  
  // Create dropdown for data types
  createTypeDropdown: function(name = "TYPE") {
    return {
      "type": "field_dropdown",
      "name": name,
      "options": [
        ["Number", "number"],
        ["Text", "text"],
        ["Date", "date"]
      ]
    };
  }
};

/**
 * Data validation helpers
 */
window.BlockUtils.Validators = {
  
  // Validate that data is an array
  validateDataArray: function(data) {
    if (!Array.isArray(data)) {
      throw new Error('Input must be a dataset (array of objects)');
    }
    return true;
  },
  
  // Validate column exists in data
  validateColumn: function(data, columnName) {
    if (!data || data.length === 0) return true;
    if (!data[0].hasOwnProperty(columnName)) {
      throw new Error(`Column "${columnName}" does not exist in dataset`);
    }
    return true;
  },
  
  // Validate numeric column
  validateNumericColumn: function(data, columnName) {
    this.validateColumn(data, columnName);
    const sample = data.slice(0, 10);
    const hasNonNumeric = sample.some(row => 
      row[columnName] !== null && 
      row[columnName] !== undefined && 
      row[columnName] !== '' && 
      isNaN(Number(row[columnName]))
    );
    if (hasNonNumeric) {
      throw new Error(`Column "${columnName}" contains non-numeric values`);
    }
    return true;
  }
};

/**
 * Column Registry for dynamic dropdown management
 */
window.BlockUtils.ColumnRegistry = {
  columns: [],
  dataTypes: {},
  csvData: null,
  listeners: [],
  
  /**
   * Update columns from CSV data
   */
  updateColumns: function(csvData) {
    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      this.columns = [];
      this.dataTypes = {};
      this.csvData = null;
    } else {
      // Extract column names from first row
      this.columns = Object.keys(csvData[0]);
      this.csvData = csvData;
      
      // Detect data types by sampling values
      this.dataTypes = this.detectDataTypes(csvData);
    }
    
    // Notify all listening blocks
    this.notifyListeners();
  },
  
  /**
   * Get dropdown options for column selection
   */
  getDropdownOptions: function() {
    try {
      // Always return at least one option to satisfy Blockly requirements
      if (!this.columns || this.columns.length === 0) {
        // Ensure valid tuple format: [displayName, value]
        return [["No columns available - load CSV first", "_no_columns"]];
      }
      
      const options = this.columns.map(col => {
        const displayName = `${col} (${this.dataTypes[col] || 'unknown'})`;
        return [displayName, col];
      });
      
      // Validate each option is a proper tuple
      const validOptions = options.filter(opt => 
        Array.isArray(opt) && opt.length === 2 && 
        typeof opt[0] === 'string' && typeof opt[1] === 'string'
      );
      
      // Return valid options or fallback
      return validOptions.length > 0 ? validOptions : [["No valid columns", "_no_columns"]];
    } catch (error) {
      console.warn('Error generating dropdown options:', error);
      return [["Error loading columns", "_error"]];
    }
  },
  
  /**
   * Detect data types from CSV sample
   */
  detectDataTypes: function(csvData) {
    const types = {};
    const sampleSize = Math.min(10, csvData.length);
    
    this.columns.forEach(column => {
      let numberCount = 0;
      let dateCount = 0;
      let totalCount = 0;
      
      for (let i = 0; i < sampleSize; i++) {
        const value = csvData[i][column];
        if (value !== null && value !== undefined && value !== '') {
          totalCount++;
          
          // Check if it's a number
          const numValue = Number(value);
          if (!isNaN(numValue) && isFinite(numValue)) {
            numberCount++;
          }
          
          // Check if it's a date
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime()) && value.toString().length > 4) {
            dateCount++;
          }
        }
      }
      
      if (totalCount === 0) {
        types[column] = 'empty';
      } else if (numberCount > totalCount * 0.7) {
        types[column] = 'number';
      } else if (dateCount > totalCount * 0.7) {
        types[column] = 'date';
      } else {
        types[column] = 'text';
      }
    });
    
    return types;
  },
  
  /**
   * Add listener for column updates
   */
  addListener: function(listener) {
    if (this.listeners.indexOf(listener) === -1) {
      this.listeners.push(listener);
    }
  },
  
  /**
   * Remove listener
   */
  removeListener: function(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  },
  
  /**
   * Notify all listeners of column changes
   */
  notifyListeners: function() {
    this.listeners.forEach(listener => {
      if (listener && typeof listener.updateFromRegistry === 'function') {
        try {
          listener.updateFromRegistry();
        } catch (error) {
          console.warn('Error updating column dropdown:', error);
        }
      }
    });
  },
  
  /**
   * Clear all data
   */
  clear: function() {
    this.columns = [];
    this.dataTypes = {};
    this.csvData = null;
    this.notifyListeners();
  }
};

/**
 * Update data panel with current dataset (Enhanced)
 */
window.BlockUtils.updateDataPanel = function(data) {
  // This will be called to update the data panel display
  if (data && Array.isArray(data) && data.length > 0) {
    console.log('Data updated:', data.length, 'rows');
    
    // Store in pipeline
    window.BlockUtils.DataPipeline.setCurrentData(data);
    
    // Update column registry
    window.BlockUtils.ColumnRegistry.updateColumns(data);
    
    // Format for display - show first 5 rows with all columns
    const preview = data.slice(0, 5);
    const jsonPreview = JSON.stringify(preview, null, 2);
    
    // Update UI if React components are available
    if (window.reactSetOutput) {
      const summary = `CSV Data Loaded: ${data.length} rows, ${Object.keys(data[0]).length} columns\n\nColumns: ${Object.keys(data[0]).join(', ')}\n\nPreview (first 5 rows):\n${jsonPreview}`;
      window.reactSetOutput(summary);
    }
  } else {
    // Clear column registry when no data
    window.BlockUtils.ColumnRegistry.clear();
    
    if (window.reactSetOutput) {
      window.reactSetOutput('No data available');
    }
  }
};

/**
 * Dynamic Column Dropdown Field
 */
window.BlockUtils.FieldColumnDropdown = class extends Blockly.FieldDropdown {
  constructor(checkType = null) {
    let options;
    
    try {
      // Multiple fallback levels for robust initialization
      if (window.BlockUtils?.ColumnRegistry?.getDropdownOptions) {
        options = window.BlockUtils.ColumnRegistry.getDropdownOptions();
      } else {
        options = [["Initializing...", "_init"]];
      }
      
      // Strict validation of options format
      if (!Array.isArray(options) || options.length === 0) {
        options = [["No columns available", "_no_columns"]];
      }
      
      // Validate each option is a proper [string, string] tuple
      const validOptions = options.filter(opt => 
        Array.isArray(opt) && opt.length === 2 && 
        typeof opt[0] === 'string' && typeof opt[1] === 'string'
      );
      
      if (validOptions.length === 0) {
        options = [["Invalid column data", "_invalid"]];
      } else {
        options = validOptions;
      }
      
    } catch (error) {
      console.warn('FieldColumnDropdown initialization error:', error);
      options = [["Dropdown error", "_error"]];
    }
    
    super(options);
    this.checkType_ = checkType; // Can filter by data type (number, text, date)
    
    // Register with column registry for updates (with null check)
    try {
      if (window.BlockUtils?.ColumnRegistry?.addListener) {
        window.BlockUtils.ColumnRegistry.addListener(this);
      }
    } catch (error) {
      console.warn('Failed to register column dropdown listener:', error);
    }
  }
  
  // Mark field as serializable to prevent warnings
  static get SERIALIZABLE() {
    return true;
  }
  
  /**
   * Static method to create field from JSON definition
   * This is called during block definition parsing
   */
  static fromJson(options) {
    // Extract checkType from options if provided
    const checkType = options.checkType || null;
    
    // Create default options for fromJson to prevent Blockly error
    const defaultOptions = [["Loading columns...", "_loading"]];
    
    // Create a temporary options object with required properties
    const tempOptions = {
      ...options,
      options: defaultOptions // Provide fallback options for Blockly
    };
    
    // Create the field instance
    const field = new window.BlockUtils.FieldColumnDropdown(checkType);
    
    // Return the field - Blockly will handle the rest
    return field;
  }
  
  /**
   * Update dropdown options from column registry
   */
  updateFromRegistry() {
    // Defensive check for registry availability
    if (!window.BlockUtils?.ColumnRegistry?.getDropdownOptions) {
      return;
    }
    
    try {
      let options = window.BlockUtils.ColumnRegistry.getDropdownOptions();
      
      // Ensure options is always valid with strict validation
      if (!Array.isArray(options) || options.length === 0) {
        options = [["No columns available", "_no_columns"]];
      }
      
      // Validate each option is a proper tuple
      const validOptions = options.filter(opt => 
        Array.isArray(opt) && opt.length === 2 && 
        typeof opt[0] === 'string' && typeof opt[1] === 'string'
      );
      
      if (validOptions.length === 0) {
        options = [["No valid columns", "_no_columns"]];
      } else {
        options = validOptions;
      }
    } catch (error) {
      console.warn('Error updating dropdown from registry:', error);
      return;
    }
    
    // Filter by data type if specified
    if (this.checkType_ && window.BlockUtils.ColumnRegistry.columns.length > 0) {
      const filteredOptions = options.filter(option => {
        const columnName = option[1];
        // Skip placeholder values like "_no_columns", "_error", etc.
        if (columnName.startsWith('_')) return true;
        const dataType = window.BlockUtils.ColumnRegistry.dataTypes[columnName];
        return dataType === this.checkType_;
      });
      
      if (filteredOptions.length === 0) {
        options = [[`No ${this.checkType_} columns available`, `_no_${this.checkType_}`]];
      } else if (filteredOptions.length === 1 && filteredOptions[0][1].startsWith('_')) {
        // If only placeholder remains, update its message
        filteredOptions[0][0] = `No ${this.checkType_} columns available`;
        options = filteredOptions;
      } else {
        options = filteredOptions;
      }
    }
    
    // Update the dropdown options
    this.menuGenerator_ = options;
    
    // If current value is no longer valid, reset to first option
    const currentValue = this.getValue();
    const validValues = options.map(opt => opt[1]);
    if (!validValues.includes(currentValue)) {
      this.setValue(validValues[0] || '');
    }
    
    // Refresh the field display
    if (this.sourceBlock_ && this.sourceBlock_.rendered) {
      this.forceRerender();
    }
  }
  
  /**
   * Dispose of this field and remove from listeners
   */
  dispose() {
    if (window.BlockUtils?.ColumnRegistry) {
      window.BlockUtils.ColumnRegistry.removeListener(this);
    }
    super.dispose();
  }
};

// Register the custom field type with Blockly
if (typeof Blockly !== 'undefined' && Blockly.fieldRegistry) {
  Blockly.fieldRegistry.register('field_column_dropdown', window.BlockUtils.FieldColumnDropdown);
}

/**
 * Convenience functions for creating typed column dropdowns
 */
window.BlockUtils.Fields.createNumberColumnDropdown = function(name = "COLUMN") {
  return {
    "type": "field_column_dropdown",
    "name": name,
    "checkType": "number"
  };
};

window.BlockUtils.Fields.createTextColumnDropdown = function(name = "COLUMN") {
  return {
    "type": "field_column_dropdown", 
    "name": name,
    "checkType": "text"
  };
};

window.BlockUtils.Fields.createDateColumnDropdown = function(name = "COLUMN") {
  return {
    "type": "field_column_dropdown",
    "name": name, 
    "checkType": "date"
  };
};

/**
 * Color scheme for block categories
 */
window.BlockUtils.Colors = {
  DATA_CLEANING: 20,    // Green-ish
  DATA_FILTERING: 120,  // Blue-ish  
  DATA_TRANSFORM: 260,  // Purple-ish
  VISUALIZATION: 330    // Pink-ish
};