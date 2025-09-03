/**
 * Data Cleaning Blocks
 * 
 * Blocks for data type conversion, column operations, and handling missing values
 * in the ApparentlyAR data visualization platform.
 */

// Define data cleaning blocks
Blockly.defineBlocksWithJsonArray([
  // Convert Type Block
  {
    "type": "convert_type",
    "message0": "convert %1 to %2 in %3",
    "args0": [
      {
        "type": "field_column_dropdown",
        "name": "COLUMN"
      },
      {
        "type": "field_dropdown", 
        "name": "TYPE",
        "options": [
          ["Number", "number"],
          ["Text", "text"],
          ["Date", "date"]
        ]
      },
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      }
    ],
    "output": "Dataset",
    "colour": 20,
    "tooltip": "Convert a column to a different data type",
    "helpUrl": ""
  },

  // Drop Column Block  
  {
    "type": "drop_column",
    "message0": "drop column %1 from %2",
    "args0": [
      {
        "type": "field_column_dropdown",
        "name": "COLUMN"
      },
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      }
    ],
    "output": "Dataset",
    "colour": 20,
    "tooltip": "Remove a column from the dataset",
    "helpUrl": ""
  },

  // Rename Column Block
  {
    "type": "rename_column", 
    "message0": "rename column %1 to %2 in %3",
    "args0": [
      {
        "type": "field_column_dropdown",
        "name": "OLD_NAME"
      },
      {
        "type": "field_input",
        "name": "NEW_NAME",
        "text": "new_name"
      },
      {
        "type": "input_value", 
        "name": "DATASET",
        "check": "Dataset"
      }
    ],
    "output": "Dataset",
    "colour": 20,
    "tooltip": "Rename a column in the dataset",
    "helpUrl": ""
  },

  // Handle Missing Values Block
  {
    "type": "handle_missing",
    "message0": "handle missing values in %1 by %2 %3",
    "args0": [
      {
        "type": "field_column_dropdown",
        "name": "COLUMN"
      },
      {
        "type": "field_dropdown",
        "name": "METHOD", 
        "options": [
          ["removing rows", "remove"],
          ["filling with value", "fill"],
          ["filling with average", "fill_average"],
          ["filling with median", "fill_median"]
        ]
      },
      {
        "type": "input_value",
        "name": "DATASET", 
        "check": "Dataset"
      }
    ],
    "output": "Dataset",
    "colour": 20,
    "tooltip": "Handle missing values in a column",
    "helpUrl": ""
  },

  // Fill Value Input (for handle_missing when method is "fill")
  {
    "type": "handle_missing_with_value",
    "message0": "handle missing values in %1 by filling with %2 in %3", 
    "args0": [
      {
        "type": "field_column_dropdown",
        "name": "COLUMN"
      },
      {
        "type": "field_input",
        "name": "FILL_VALUE",
        "text": "0"
      },
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset" 
      }
    ],
    "output": "Dataset",
    "colour": 20,
    "tooltip": "Fill missing values with a specific value",
    "helpUrl": ""
  }
]);

// JavaScript generators for data cleaning blocks
(function() {
  if (typeof Blockly === 'undefined' || !Blockly.JavaScript) return;

  // Convert Type generator
  window.BlockUtils.registerBlock('convert_type', function(block) {
    const column = block.getFieldValue('COLUMN');
    const type = block.getFieldValue('TYPE');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          const operation = {
            type: 'convertType',
            params: { 
              column: '${column}',
              dataType: '${type}'
            }
          };
          
          // For now, return processed data synchronously
          // In a real implementation, this would call the backend API
          let processedData = inputData.map(row => {
            const newRow = {...row};
            if (newRow['${column}'] !== null && newRow['${column}'] !== undefined && newRow['${column}'] !== '') {
              try {
                switch ('${type}') {
                  case 'number':
                    newRow['${column}'] = Number(newRow['${column}']);
                    break;
                  case 'text':
                    newRow['${column}'] = String(newRow['${column}']);
                    break;
                  case 'date':
                    newRow['${column}'] = new Date(newRow['${column}']);
                    break;
                }
              } catch (e) {
                console.warn('Type conversion failed for value:', newRow['${column}']);
              }
            }
            return newRow;
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Convert type error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Drop Column generator
  window.BlockUtils.registerBlock('drop_column', function(block) {
    const column = block.getFieldValue('COLUMN');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          let processedData = inputData.map(row => {
            const newRow = {...row};
            delete newRow['${column}'];
            return newRow;
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Drop column error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Rename Column generator
  window.BlockUtils.registerBlock('rename_column', function(block) {
    const oldName = block.getFieldValue('OLD_NAME');
    const newName = block.getFieldValue('NEW_NAME');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          let processedData = inputData.map(row => {
            const newRow = {...row};
            if (newRow.hasOwnProperty('${oldName}')) {
              newRow['${newName}'] = newRow['${oldName}'];
              delete newRow['${oldName}'];
            }
            return newRow;
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Rename column error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Handle Missing Values generator
  window.BlockUtils.registerBlock('handle_missing', function(block) {
    const column = block.getFieldValue('COLUMN');
    const method = block.getFieldValue('METHOD');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          let processedData;
          
          switch ('${method}') {
            case 'remove':
              processedData = inputData.filter(row => 
                row['${column}'] !== null && 
                row['${column}'] !== undefined && 
                row['${column}'] !== ''
              );
              break;
              
            case 'fill_average':
              const numericValues = inputData
                .map(row => Number(row['${column}']))
                .filter(val => !isNaN(val));
              const average = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
              
              processedData = inputData.map(row => {
                const newRow = {...row};
                if (newRow['${column}'] === null || newRow['${column}'] === undefined || newRow['${column}'] === '') {
                  newRow['${column}'] = average;
                }
                return newRow;
              });
              break;
              
            case 'fill_median':
              const sortedValues = inputData
                .map(row => Number(row['${column}']))
                .filter(val => !isNaN(val))
                .sort((a, b) => a - b);
              const median = sortedValues.length % 2 === 0 
                ? (sortedValues[sortedValues.length/2 - 1] + sortedValues[sortedValues.length/2]) / 2
                : sortedValues[Math.floor(sortedValues.length/2)];
              
              processedData = inputData.map(row => {
                const newRow = {...row};
                if (newRow['${column}'] === null || newRow['${column}'] === undefined || newRow['${column}'] === '') {
                  newRow['${column}'] = median;
                }
                return newRow;
              });
              break;
              
            default:
              processedData = inputData;
          }
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Handle missing values error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Handle Missing with Value generator
  window.BlockUtils.registerBlock('handle_missing_with_value', function(block) {
    const column = block.getFieldValue('COLUMN');
    const fillValue = block.getFieldValue('FILL_VALUE');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          let processedData = inputData.map(row => {
            const newRow = {...row};
            if (newRow['${column}'] === null || newRow['${column}'] === undefined || newRow['${column}'] === '') {
              newRow['${column}'] = '${fillValue}';
            }
            return newRow;
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Handle missing with value error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

})();