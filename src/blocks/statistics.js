/**
 * Statistical Analysis Blocks for Blockly
 * 
 * Provides comprehensive statistical analysis blocks including descriptive statistics,
 * correlation analysis, outlier detection, and data exploration functionality.
 * 
 * These blocks integrate with the backend statistical processing API to perform
 * calculations server-side for better performance with large datasets.
 * 
 * @module StatisticsBlocks
 * @version 1.0.0
 * @since 1.0.0
 */

(function(){
  // Wait for Blockly to be available
  function waitForBlockly() {
    if (typeof Blockly !== 'undefined' && Blockly.JavaScript) {
      initializeStatisticsBlocks();
    } else {
      setTimeout(waitForBlockly, 10);
    }
  }

  // Custom field for dynamic column selection
  class FieldColumnDropdown extends Blockly.FieldDropdown {
    constructor(options, validator) {
      // Start with placeholder options
      super([['Select column...', 'column']], validator);
      this.SERIALIZABLE = true;
    }

    static fromJson(options) {
      return new FieldColumnDropdown(options['options'] || [['Select column...', 'column']]);
    }

    getOptions() {
      // Get available columns from CSV data
      const csvData = window.Blockly && window.Blockly.CsvImportData && window.Blockly.CsvImportData.data;
      if (csvData && Array.isArray(csvData) && csvData.length > 0) {
        const columns = Object.keys(csvData[0]);
        return columns.map(col => [col, col]);
      }
      return [['No data loaded', 'column'], ['Load CSV first', 'column']];
    }

    doClassValidation_(newValue) {
      // Always allow the selection
      return newValue;
    }
  }

  // Register the custom field
  Blockly.fieldRegistry.register('field_column_dropdown', FieldColumnDropdown);

  function initializeStatisticsBlocks() {
    Blockly.defineBlocksWithJsonArray([
      // Descriptive Statistics Block
      {
        "type": "descriptive_stats",
        "message0": "calculate stats for %1 in %2",
        "args0": [
          { "type": "field_column_dropdown", "name": "COLUMN", "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "output": "Statistics",
        "colour": 40,
        "tooltip": "Calculate mean, median, mode, standard deviation for a column",
        "helpUrl": ""
      },

      // Mean Block
      {
        "type": "calculate_mean",
        "message0": "mean of %1 in %2",
        "args0": [
          { "type": "field_column_dropdown", "name": "COLUMN", "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "output": "Number",
        "colour": 40,
        "tooltip": "Calculate the mean (average) of a numeric column",
        "helpUrl": ""
      },

      // Median Block
      {
        "type": "calculate_median",
        "message0": "median of %1 in %2",
        "args0": [
          { "type": "field_column_dropdown", "name": "COLUMN", "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "output": "Number",
        "colour": 40,
        "tooltip": "Calculate the median (middle value) of a numeric column",
        "helpUrl": ""
      },

      // Standard Deviation Block
      {
        "type": "calculate_std",
        "message0": "standard deviation of %1 in %2",
        "args0": [
          { "type": "field_column_dropdown", "name": "COLUMN", "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "output": "Number",
        "colour": 40,
        "tooltip": "Calculate the standard deviation of a numeric column",
        "helpUrl": ""
      },

      // Correlation Block
      {
        "type": "calculate_correlation",
        "message0": "correlation between %1 and %2 in %3",
        "args0": [
          { "type": "field_column_dropdown", "name": "COLUMN_X", "SERIALIZABLE": true },
          { "type": "field_column_dropdown", "name": "COLUMN_Y", "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "output": "Number",
        "colour": 40,
        "tooltip": "Calculate Pearson correlation coefficient between two numeric columns",
        "helpUrl": ""
      },

      // Outlier Detection Block
      {
        "type": "detect_outliers",
        "message0": "detect outliers in %1 using %2 method in %3",
        "args0": [
          { "type": "field_column_dropdown", "name": "COLUMN", "SERIALIZABLE": true },
          {
            "type": "field_dropdown",
            "name": "METHOD",
            "options": [
              ["IQR (Interquartile Range)", "iqr"],
              ["Z-Score", "zscore"]
            ],
            "SERIALIZABLE": true
          },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "output": "Dataset",
        "colour": 40,
        "tooltip": "Identify and mark outliers in a numeric column",
        "helpUrl": ""
      },

      // Frequency Count Block
      {
        "type": "frequency_count",
        "message0": "count frequencies of %1 in %2",
        "args0": [
          { "type": "field_column_dropdown", "name": "COLUMN", "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "output": "Dataset",
        "colour": 40,
        "tooltip": "Count frequency of unique values in a column",
        "helpUrl": ""
      },

      // Percentiles Block
      {
        "type": "calculate_percentiles",
        "message0": "percentile %1 of %2 in %3",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "PERCENTILE",
            "options": [
              ["25th (Q1)", "25"],
              ["50th (Median)", "50"],
              ["75th (Q3)", "75"],
              ["90th", "90"],
              ["95th", "95"],
              ["99th", "99"]
            ],
            "SERIALIZABLE": true
          },
          { "type": "field_column_dropdown", "name": "COLUMN", "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "output": "Number",
        "colour": 40,
        "tooltip": "Calculate specific percentile of a numeric column",
        "helpUrl": ""
      }
    ]);

    // JavaScript generators for each statistical block
    if (Blockly.JavaScript) {
      // Global normalizer (reuse from data_ops.js pattern)
      if (typeof window !== 'undefined' && !window.BlocklyNormalizeData) {
        window.BlocklyNormalizeData = function(input) {
          if (Array.isArray(input)) return input;
          if (input && Array.isArray(input.data)) return input.data; // PapaParse shape
          if (typeof input === 'string') {
            try { const p = JSON.parse(input); return Array.isArray(p) ? p : []; } catch (_) { return []; }
          }
          return [];
        };
      }

      // Helper function to get data code safely
      function getDataCode(block) {
        try {
          const dataCode = Blockly.JavaScript.valueToCode(block, 'DATA', Blockly.JavaScript.ORDER_NONE);
          return dataCode || '(window.Blockly && window.Blockly.CsvImportData ? window.Blockly.CsvImportData.data : [])';
        } catch (e) {
          return '(window.Blockly && window.Blockly.CsvImportData ? window.Blockly.CsvImportData.data : [])';
        }
      }

      // Descriptive Statistics Generator
      Blockly.JavaScript['descriptive_stats'] = function(block) {
        const dataCode = getDataCode(block);
        const column = block.getFieldValue('COLUMN') || 'column';
        
        const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{ type: 'descriptiveStats', params: { column: '${safeColumn}' } }]);
            return __res && __res.data ? __res.data : {};
          } catch (error) {
            console.error('Descriptive stats error:', error);
            return {};
          }
        })()`;
        
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Mean Generator
      Blockly.JavaScript['calculate_mean'] = function(block) {
        const dataCode = getDataCode(block);
        let column = block.getFieldValue('COLUMN') || 'column';
        
        // Clean and validate column name - remove quotes and prevent injection
        column = column.trim().replace(/^["']|["']$/g, '');
        
        // Keep original column name for API calls, but sanitize for error messages
        const originalColumn = column;
        const safeColumnForErrors = column
          .replace(/['"\\]/g, '') // Remove quotes and backslashes only for display
          .substring(0, 100); // Limit length
        
        const code = `(async () => {
          try {
            console.log('[calculate_mean] Starting execution with dataCode:', '${dataCode}');
            
            // Get raw data with better error handling
            let __rawData;
            try {
              __rawData = ${dataCode};
              console.log('[calculate_mean] Raw data retrieved:', __rawData ? 'has data' : 'null/undefined', 'length:', Array.isArray(__rawData) ? __rawData.length : 'not array');
            } catch (dataError) {
              console.error('[calculate_mean] Error getting raw data:', dataError);
              __rawData = null;
            }
            
            // Normalize the data
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(__rawData) : (__rawData || []));
            console.log('[calculate_mean] Normalized data:', __input ? 'has data' : 'null/undefined', 'length:', Array.isArray(__input) ? __input.length : 'not array');
            
            if (!Array.isArray(__input)) { 
              console.error('[calculate_mean] Input data is not an array:', typeof __input);
              throw new Error('Input data must be an array, got: ' + typeof __input); 
            }
            if (__input.length === 0) { 
              console.error('[calculate_mean] Input data is empty array');
              throw new Error('No data available - please connect a CSV import block with data'); 
            }
            
            // Check if column exists
            const columns = Object.keys(__input[0] || {});
            console.log('[calculate_mean] Available columns:', columns);
            console.log('[calculate_mean] Requested column:', '${originalColumn}');
            if (!columns.includes('${originalColumn}')) {
              throw new Error(\`Column '${safeColumnForErrors}' not found. Available columns: \${columns.join(', ')}\`);
            }
            
            // Check if column contains numeric data
            const columnValues = __input.map(row => row['${originalColumn}']).filter(val => val !== null && val !== undefined && val !== '');
            const numericValues = columnValues.filter(val => !isNaN(parseFloat(val)));
            if (numericValues.length === 0) {
              throw new Error(\`Column '${safeColumnForErrors}' does not contain numeric data. Cannot calculate mean for non-numeric values.\`);
            }
            if (numericValues.length < columnValues.length) {
              console.warn(\`[calculate_mean] Column '${safeColumnForErrors}' contains \${columnValues.length - numericValues.length} non-numeric values that will be ignored.\`);
            }
            
            if (!window.AppApi || !window.AppApi.processData) { 
              console.error('[calculate_mean] API not available');
              throw new Error('API not available'); 
            }
            
            console.log('[calculate_mean] Calling API with data length:', __input.length);
            const __res = await window.AppApi.processData(__input, [{ type: 'calculateMean', params: { column: '${originalColumn}' } }]);
            console.log('[calculate_mean] API response:', __res);
            
            const result = __res && __res.data ? __res.data : 0;
            console.log('[calculate_mean] Final result:', result);
            return result;
          } catch (error) {
            console.error('[calculate_mean] Error:', error);
            // Show error in UI if possible
            if (window.reactSetOutput) window.reactSetOutput('Error: ' + error.message);
            if (window.reactSetError) window.reactSetError(true);
            return 0;
          }
        })()`;
        
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Median Generator
      Blockly.JavaScript['calculate_median'] = function(block) {
        const dataCode = getDataCode(block);
        const column = block.getFieldValue('COLUMN') || 'column';
        
        const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{ type: 'calculateMedian', params: { column: '${safeColumn}' } }]);
            return __res && __res.data ? __res.data : 0;
          } catch (error) {
            console.error('Calculate median error:', error);
            return 0;
          }
        })()`;
        
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Standard Deviation Generator
      Blockly.JavaScript['calculate_std'] = function(block) {
        const dataCode = getDataCode(block);
        const column = block.getFieldValue('COLUMN') || 'column';
        
        const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{ type: 'calculateStandardDeviation', params: { column: '${safeColumn}' } }]);
            return __res && __res.data ? __res.data : 0;
          } catch (error) {
            console.error('Calculate std error:', error);
            return 0;
          }
        })()`;
        
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Correlation Generator
      Blockly.JavaScript['calculate_correlation'] = function(block) {
        const dataCode = getDataCode(block);
        const columnX = block.getFieldValue('COLUMN_X') || 'column_x';
        const columnY = block.getFieldValue('COLUMN_Y') || 'column_y';
        
        const safeColumnX = columnX.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeColumnY = columnY.replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{ type: 'calculateCorrelation', params: { columnX: '${safeColumnX}', columnY: '${safeColumnY}' } }]);
            return __res && __res.data ? __res.data : 0;
          } catch (error) {
            console.error('Calculate correlation error:', error);
            return 0;
          }
        })()`;
        
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Outlier Detection Generator
      Blockly.JavaScript['detect_outliers'] = function(block) {
        const dataCode = getDataCode(block);
        const column = block.getFieldValue('COLUMN') || 'column';
        const method = block.getFieldValue('METHOD') || 'iqr';
        
        const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{ type: 'detectOutliers', params: { column: '${safeColumn}', method: '${method}' } }]);
            const __data = (__res && __res.data) ? __res.data : __input;
            if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }
            return __data;
          } catch (error) {
            console.error('Detect outliers error:', error);
            return (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
          }
        })()`;
        
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Frequency Count Generator
      Blockly.JavaScript['frequency_count'] = function(block) {
        const dataCode = getDataCode(block);
        const column = block.getFieldValue('COLUMN') || 'column';
        
        const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{ type: 'frequencyCount', params: { column: '${safeColumn}' } }]);
            const __data = (__res && __res.data) ? __res.data : [];
            if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }
            return __data;
          } catch (error) {
            console.error('Frequency count error:', error);
            return [];
          }
        })()`;
        
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Percentiles Generator
      Blockly.JavaScript['calculate_percentiles'] = function(block) {
        const dataCode = getDataCode(block);
        const percentile = block.getFieldValue('PERCENTILE') || '50';
        const column = block.getFieldValue('COLUMN') || 'column';
        
        const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');
        
        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{ type: 'calculatePercentiles', params: { column: '${safeColumn}', percentile: parseFloat('${percentile}') } }]);
            return __res && __res.data ? __res.data : 0;
          } catch (error) {
            console.error('Calculate percentiles error:', error);
            return 0;
          }
        })()`;
        
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };
    }

    // Register forBlock mappings for newer Blockly generator API
    if (Blockly.JavaScript) {
      const js = Blockly.JavaScript;
      js.forBlock = js.forBlock || {};
      if (js['descriptive_stats'] && !js.forBlock['descriptive_stats']) js.forBlock['descriptive_stats'] = (block, generator) => js['descriptive_stats'](block, generator);
      if (js['calculate_mean'] && !js.forBlock['calculate_mean']) js.forBlock['calculate_mean'] = (block, generator) => js['calculate_mean'](block, generator);
      if (js['calculate_median'] && !js.forBlock['calculate_median']) js.forBlock['calculate_median'] = (block, generator) => js['calculate_median'](block, generator);
      if (js['calculate_std'] && !js.forBlock['calculate_std']) js.forBlock['calculate_std'] = (block, generator) => js['calculate_std'](block, generator);
      if (js['calculate_correlation'] && !js.forBlock['calculate_correlation']) js.forBlock['calculate_correlation'] = (block, generator) => js['calculate_correlation'](block, generator);
      if (js['detect_outliers'] && !js.forBlock['detect_outliers']) js.forBlock['detect_outliers'] = (block, generator) => js['detect_outliers'](block, generator);
      if (js['frequency_count'] && !js.forBlock['frequency_count']) js.forBlock['frequency_count'] = (block, generator) => js['frequency_count'](block, generator);
      if (js['calculate_percentiles'] && !js.forBlock['calculate_percentiles']) js.forBlock['calculate_percentiles'] = (block, generator) => js['calculate_percentiles'](block, generator);
    }

    console.log('[Statistics Blocks] Loaded successfully');
  }
  
  // Start waiting for Blockly
  waitForBlockly();
})();