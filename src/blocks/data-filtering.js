/**
 * Data Filtering Blocks
 * 
 * Blocks for filtering, selecting, and sorting data operations
 * in the ApparentlyAR data visualization platform.
 */

// Define data filtering blocks
Blockly.defineBlocksWithJsonArray([
  // Filter Data Block
  {
    "type": "filter_data",
    "message0": "filter %1 where %2 %3 %4",
    "args0": [
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      },
      {
        "type": "field_column_dropdown",
        "name": "COLUMN"
      },
      {
        "type": "field_dropdown",
        "name": "OPERATOR",
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
      },
      {
        "type": "field_input",
        "name": "VALUE",
        "text": ""
      }
    ],
    "output": "Dataset",
    "colour": 120,
    "tooltip": "Filter rows based on a condition",
    "helpUrl": ""
  },

  // Select Columns Block
  {
    "type": "select_columns",
    "message0": "select columns %1 from %2",
    "args0": [
      {
        "type": "field_input",
        "name": "COLUMNS",
        "text": "column1, column2"
      },
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      }
    ],
    "output": "Dataset",
    "colour": 120,
    "tooltip": "Select specific columns from the dataset",
    "helpUrl": ""
  },

  // Sort Data Block
  {
    "type": "sort_data",
    "message0": "sort %1 by %2 %3",
    "args0": [
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      },
      {
        "type": "field_column_dropdown",
        "name": "COLUMN"
      },
      {
        "type": "field_dropdown",
        "name": "DIRECTION",
        "options": [
          ["ascending", "asc"],
          ["descending", "desc"]
        ]
      }
    ],
    "output": "Dataset",
    "colour": 120,
    "tooltip": "Sort data by a column",
    "helpUrl": ""
  },

  // Advanced Filter Block (with multiple conditions)
  {
    "type": "filter_advanced",
    "message0": "filter %1 where %2",
    "args0": [
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      },
      {
        "type": "input_statement",
        "name": "CONDITIONS"
      }
    ],
    "output": "Dataset",
    "colour": 120,
    "tooltip": "Filter data with multiple conditions",
    "helpUrl": ""
  },

  // Filter Condition Block
  {
    "type": "filter_condition",
    "message0": "%1 %2 %3",
    "args0": [
      {
        "type": "field_column_dropdown",
        "name": "COLUMN"
      },
      {
        "type": "field_dropdown",
        "name": "OPERATOR",
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
      },
      {
        "type": "field_input",
        "name": "VALUE",
        "text": ""
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 120,
    "tooltip": "A condition for filtering data",
    "helpUrl": ""
  },

  // Filter by Range Block
  {
    "type": "filter_range",
    "message0": "filter %1 where %2 is between %3 and %4",
    "args0": [
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      },
      {
        "type": "field_column_dropdown",
        "name": "COLUMN"
      },
      {
        "type": "field_number",
        "name": "MIN_VALUE",
        "value": 0
      },
      {
        "type": "field_number", 
        "name": "MAX_VALUE",
        "value": 100
      }
    ],
    "output": "Dataset",
    "colour": 120,
    "tooltip": "Filter data by numeric range",
    "helpUrl": ""
  }
]);

// JavaScript generators for data filtering blocks
(function() {
  if (typeof Blockly === 'undefined' || !Blockly.JavaScript) return;

  // Filter Data generator
  window.BlockUtils.registerBlock('filter_data', function(block) {
    const column = block.getFieldValue('COLUMN');
    const operator = block.getFieldValue('OPERATOR');
    const value = block.getFieldValue('VALUE');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          let processedData = inputData.filter(row => {
            const cellValue = row['${column}'];
            const compareValue = '${value}';
            
            switch ('${operator}') {
              case 'equals':
                return String(cellValue) === compareValue;
              case 'not_equals':
                return String(cellValue) !== compareValue;
              case 'greater_than':
                return Number(cellValue) > Number(compareValue);
              case 'less_than':
                return Number(cellValue) < Number(compareValue);
              case 'greater_than_equal':
                return Number(cellValue) >= Number(compareValue);
              case 'less_than_equal':
                return Number(cellValue) <= Number(compareValue);
              case 'contains':
                return String(cellValue).toLowerCase().includes(compareValue.toLowerCase());
              case 'not_contains':
                return !String(cellValue).toLowerCase().includes(compareValue.toLowerCase());
              default:
                return true;
            }
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Filter data error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Select Columns generator
  window.BlockUtils.registerBlock('select_columns', function(block) {
    const columns = block.getFieldValue('COLUMNS');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          const selectedColumns = '${columns}'.split(',').map(col => col.trim());
          
          let processedData = inputData.map(row => {
            const newRow = {};
            selectedColumns.forEach(column => {
              if (row.hasOwnProperty(column)) {
                newRow[column] = row[column];
              }
            });
            return newRow;
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Select columns error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Sort Data generator
  window.BlockUtils.registerBlock('sort_data', function(block) {
    const column = block.getFieldValue('COLUMN');
    const direction = block.getFieldValue('DIRECTION');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          let processedData = [...inputData].sort((a, b) => {
            const valueA = a['${column}'];
            const valueB = b['${column}'];
            
            // Handle null/undefined values
            if (valueA === null || valueA === undefined) return 1;
            if (valueB === null || valueB === undefined) return -1;
            
            // Try numeric comparison first
            const numA = Number(valueA);
            const numB = Number(valueB);
            
            if (!isNaN(numA) && !isNaN(numB)) {
              return '${direction}' === 'asc' ? numA - numB : numB - numA;
            }
            
            // Fall back to string comparison
            const strA = String(valueA).toLowerCase();
            const strB = String(valueB).toLowerCase();
            
            if ('${direction}' === 'asc') {
              return strA < strB ? -1 : strA > strB ? 1 : 0;
            } else {
              return strA > strB ? -1 : strA < strB ? 1 : 0;
            }
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Sort data error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Filter by Range generator
  window.BlockUtils.registerBlock('filter_range', function(block) {
    const column = block.getFieldValue('COLUMN');
    const minValue = block.getFieldValue('MIN_VALUE');
    const maxValue = block.getFieldValue('MAX_VALUE');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          let processedData = inputData.filter(row => {
            const cellValue = Number(row['${column}']);
            return !isNaN(cellValue) && cellValue >= ${minValue} && cellValue <= ${maxValue};
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Filter range error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Advanced Filter generator (placeholder - would need more complex implementation)
  window.BlockUtils.registerBlock('filter_advanced', function(block) {
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';
    const conditions = Blockly.JavaScript.statementToCode(block, 'CONDITIONS');

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          // For now, return the input data unchanged
          // Advanced filtering would require more complex condition parsing
          window.BlockUtils.updateDataPanel(inputData);
          return inputData;
        } catch (error) {
          console.error('Advanced filter error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Filter Condition generator (placeholder)
  window.BlockUtils.registerBlock('filter_condition', function(block) {
    const column = block.getFieldValue('COLUMN');
    const operator = block.getFieldValue('OPERATOR');
    const value = block.getFieldValue('VALUE');

    // This would be used by the advanced filter block
    const code = `// Condition: ${column} ${operator} ${value}\n`;
    return code;
  });

})();