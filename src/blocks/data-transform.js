/**
 * Data Transformation Blocks
 * 
 * Blocks for grouping, aggregating, binning, and calculating new fields
 * in the ApparentlyAR data visualization platform.
 */

// Define data transformation blocks
Blockly.defineBlocksWithJsonArray([
  // Group By Block
  {
    "type": "group_by",
    "message0": "group %1 by %2",
    "args0": [
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      },
      {
        "type": "field_column_dropdown",
        "name": "COLUMN"
      }
    ],
    "output": "Dataset",
    "colour": 260,
    "tooltip": "Group data by a column for aggregation",
    "helpUrl": ""
  },

  // Aggregate Block
  {
    "type": "aggregate",
    "message0": "calculate %1 of %2 from %3",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "FUNCTION",
        "options": [
          ["Sum", "sum"],
          ["Average", "average"],
          ["Count", "count"],
          ["Minimum", "min"],
          ["Maximum", "max"]
        ]
      },
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
    "colour": 260,
    "tooltip": "Perform aggregation on a column",
    "helpUrl": ""
  },

  // Group By and Aggregate Combined Block
  {
    "type": "group_aggregate",
    "message0": "group %1 by %2 and calculate %3 of %4",
    "args0": [
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      },
      {
        "type": "field_column_dropdown",
        "name": "GROUP_COLUMN"
      },
      {
        "type": "field_dropdown",
        "name": "FUNCTION",
        "options": [
          ["Sum", "sum"],
          ["Average", "average"],
          ["Count", "count"],
          ["Minimum", "min"],
          ["Maximum", "max"]
        ]
      },
      {
        "type": "field_column_dropdown",
        "name": "VALUE_COLUMN"
      }
    ],
    "output": "Dataset",
    "colour": 260,
    "tooltip": "Group data and perform aggregation",
    "helpUrl": ""
  },

  // Bin Data Block
  {
    "type": "bin_data",
    "message0": "bin %1 by %2 into %3 bins",
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
        "name": "BIN_COUNT",
        "value": 10,
        "min": 1,
        "max": 100
      }
    ],
    "output": "Dataset",
    "colour": 260,
    "tooltip": "Create bins from numeric data for histograms",
    "helpUrl": ""
  },

  // Calculate Simple Field Block
  {
    "type": "calculate_field",
    "message0": "add column %1 = %2 %3 %4 to %5",
    "args0": [
      {
        "type": "field_input",
        "name": "NEW_COLUMN",
        "text": "new_column"
      },
      {
        "type": "field_column_dropdown",
        "name": "COLUMN1"
      },
      {
        "type": "field_dropdown",
        "name": "OPERATOR",
        "options": [
          ["+", "add"],
          ["-", "subtract"],
          ["×", "multiply"],
          ["÷", "divide"]
        ]
      },
      {
        "type": "field_column_dropdown",
        "name": "COLUMN2"
      },
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      }
    ],
    "output": "Dataset",
    "colour": 260,
    "tooltip": "Create a new column by calculating values from existing columns",
    "helpUrl": ""
  },

  // Calculate with Value Block
  {
    "type": "calculate_with_value",
    "message0": "add column %1 = %2 %3 %4 to %5",
    "args0": [
      {
        "type": "field_input",
        "name": "NEW_COLUMN",
        "text": "new_column"
      },
      {
        "type": "field_column_dropdown",
        "name": "COLUMN"
      },
      {
        "type": "field_dropdown",
        "name": "OPERATOR",
        "options": [
          ["+", "add"],
          ["-", "subtract"],
          ["×", "multiply"],
          ["÷", "divide"]
        ]
      },
      {
        "type": "field_number",
        "name": "VALUE",
        "value": 1
      },
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      }
    ],
    "output": "Dataset",
    "colour": 260,
    "tooltip": "Create a new column by calculating with a fixed value",
    "helpUrl": ""
  },

  // Pivot Table Block (simplified)
  {
    "type": "pivot_table",
    "message0": "pivot %1 with rows %2 columns %3 values %4",
    "args0": [
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      },
      {
        "type": "field_column_dropdown",
        "name": "ROW_COLUMN"
      },
      {
        "type": "field_column_dropdown",
        "name": "COL_COLUMN"
      },
      {
        "type": "field_column_dropdown",
        "name": "VALUE_COLUMN"
      }
    ],
    "output": "Dataset",
    "colour": 260,
    "tooltip": "Create a pivot table from the data",
    "helpUrl": ""
  }
]);

// JavaScript generators for data transformation blocks
(function() {
  if (typeof Blockly === 'undefined' || !Blockly.JavaScript) return;

  // Group By generator
  window.BlockUtils.registerBlock('group_by', function(block) {
    const column = block.getFieldValue('COLUMN');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          // Group data by column
          const groups = {};
          inputData.forEach(row => {
            const key = row['${column}'];
            if (!groups[key]) {
              groups[key] = [];
            }
            groups[key].push(row);
          });
          
          // Convert to array format for further processing
          let processedData = Object.keys(groups).map(key => ({
            '${column}': key,
            'count': groups[key].length,
            'data': groups[key]
          }));
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Group by error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Aggregate generator
  window.BlockUtils.registerBlock('aggregate', function(block) {
    const func = block.getFieldValue('FUNCTION');
    const column = block.getFieldValue('COLUMN');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          let result;
          const values = inputData.map(row => Number(row['${column}'])).filter(val => !isNaN(val));
          
          switch ('${func}') {
            case 'sum':
              result = values.reduce((sum, val) => sum + val, 0);
              break;
            case 'average':
              result = values.reduce((sum, val) => sum + val, 0) / values.length;
              break;
            case 'count':
              result = inputData.length;
              break;
            case 'min':
              result = Math.min(...values);
              break;
            case 'max':
              result = Math.max(...values);
              break;
            default:
              result = values.length;
          }
          
          let processedData = [{
            'function': '${func}',
            'column': '${column}',
            'result': result
          }];
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Aggregate error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Group By and Aggregate generator
  window.BlockUtils.registerBlock('group_aggregate', function(block) {
    const groupColumn = block.getFieldValue('GROUP_COLUMN');
    const func = block.getFieldValue('FUNCTION');
    const valueColumn = block.getFieldValue('VALUE_COLUMN');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          // Group data
          const groups = {};
          inputData.forEach(row => {
            const key = row['${groupColumn}'];
            if (!groups[key]) {
              groups[key] = [];
            }
            groups[key].push(row);
          });
          
          // Aggregate each group
          let processedData = Object.keys(groups).map(key => {
            const groupData = groups[key];
            const values = groupData.map(row => Number(row['${valueColumn}'])).filter(val => !isNaN(val));
            
            let aggregateValue;
            switch ('${func}') {
              case 'sum':
                aggregateValue = values.reduce((sum, val) => sum + val, 0);
                break;
              case 'average':
                aggregateValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                break;
              case 'count':
                aggregateValue = groupData.length;
                break;
              case 'min':
                aggregateValue = Math.min(...values);
                break;
              case 'max':
                aggregateValue = Math.max(...values);
                break;
              default:
                aggregateValue = groupData.length;
            }
            
            return {
              '${groupColumn}': key,
              '${func}_${valueColumn}': aggregateValue
            };
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Group aggregate error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Bin Data generator
  window.BlockUtils.registerBlock('bin_data', function(block) {
    const column = block.getFieldValue('COLUMN');
    const binCount = block.getFieldValue('BIN_COUNT');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          const values = inputData.map(row => Number(row['${column}'])).filter(val => !isNaN(val));
          const min = Math.min(...values);
          const max = Math.max(...values);
          const binSize = (max - min) / ${binCount};
          
          // Create bins
          const bins = Array.from({length: ${binCount}}, (_, i) => ({
            bin_start: min + (i * binSize),
            bin_end: min + ((i + 1) * binSize),
            bin_label: \`\${(min + (i * binSize)).toFixed(1)} - \${(min + ((i + 1) * binSize)).toFixed(1)}\`,
            count: 0,
            values: []
          }));
          
          // Assign values to bins
          inputData.forEach(row => {
            const value = Number(row['${column}']);
            if (!isNaN(value)) {
              let binIndex = Math.floor((value - min) / binSize);
              if (binIndex >= ${binCount}) binIndex = ${binCount} - 1;
              if (binIndex < 0) binIndex = 0;
              
              bins[binIndex].count++;
              bins[binIndex].values.push(row);
            }
          });
          
          window.BlockUtils.updateDataPanel(bins);
          return bins;
        } catch (error) {
          console.error('Bin data error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Calculate Field generator
  window.BlockUtils.registerBlock('calculate_field', function(block) {
    const newColumn = block.getFieldValue('NEW_COLUMN');
    const column1 = block.getFieldValue('COLUMN1');
    const operator = block.getFieldValue('OPERATOR');
    const column2 = block.getFieldValue('COLUMN2');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          let processedData = inputData.map(row => {
            const newRow = {...row};
            const val1 = Number(row['${column1}']) || 0;
            const val2 = Number(row['${column2}']) || 0;
            
            switch ('${operator}') {
              case 'add':
                newRow['${newColumn}'] = val1 + val2;
                break;
              case 'subtract':
                newRow['${newColumn}'] = val1 - val2;
                break;
              case 'multiply':
                newRow['${newColumn}'] = val1 * val2;
                break;
              case 'divide':
                newRow['${newColumn}'] = val2 !== 0 ? val1 / val2 : 0;
                break;
              default:
                newRow['${newColumn}'] = val1 + val2;
            }
            
            return newRow;
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Calculate field error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Calculate with Value generator
  window.BlockUtils.registerBlock('calculate_with_value', function(block) {
    const newColumn = block.getFieldValue('NEW_COLUMN');
    const column = block.getFieldValue('COLUMN');
    const operator = block.getFieldValue('OPERATOR');
    const value = block.getFieldValue('VALUE');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          let processedData = inputData.map(row => {
            const newRow = {...row};
            const val = Number(row['${column}']) || 0;
            const fixedValue = ${value};
            
            switch ('${operator}') {
              case 'add':
                newRow['${newColumn}'] = val + fixedValue;
                break;
              case 'subtract':
                newRow['${newColumn}'] = val - fixedValue;
                break;
              case 'multiply':
                newRow['${newColumn}'] = val * fixedValue;
                break;
              case 'divide':
                newRow['${newColumn}'] = fixedValue !== 0 ? val / fixedValue : 0;
                break;
              default:
                newRow['${newColumn}'] = val + fixedValue;
            }
            
            return newRow;
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Calculate with value error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Pivot Table generator (simplified)
  window.BlockUtils.registerBlock('pivot_table', function(block) {
    const rowColumn = block.getFieldValue('ROW_COLUMN');
    const colColumn = block.getFieldValue('COL_COLUMN');
    const valueColumn = block.getFieldValue('VALUE_COLUMN');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (function() {
        try {
          const inputData = ${dataset};
          if (!inputData) throw new Error('No input dataset provided');
          
          // Simplified pivot - group by row and column, sum values
          const pivot = {};
          
          inputData.forEach(row => {
            const rowKey = row['${rowColumn}'];
            const colKey = row['${colColumn}'];
            const value = Number(row['${valueColumn}']) || 0;
            
            if (!pivot[rowKey]) {
              pivot[rowKey] = {};
            }
            if (!pivot[rowKey][colKey]) {
              pivot[rowKey][colKey] = 0;
            }
            pivot[rowKey][colKey] += value;
          });
          
          // Convert to flat array format
          let processedData = [];
          Object.keys(pivot).forEach(rowKey => {
            Object.keys(pivot[rowKey]).forEach(colKey => {
              processedData.push({
                '${rowColumn}': rowKey,
                '${colColumn}': colKey,
                '${valueColumn}': pivot[rowKey][colKey]
              });
            });
          });
          
          window.BlockUtils.updateDataPanel(processedData);
          return processedData;
        } catch (error) {
          console.error('Pivot table error:', error);
          throw error;
        }
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

})();