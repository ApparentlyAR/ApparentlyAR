/**
 * Data Processing Block for Blockly
 * 
 * Provides a Blockly block for processing data through backend operations.
 * This block allows users to perform complex data transformations including
 * filtering, sorting, grouping, aggregation, and calculations using a
 * visual programming interface.
 * 
 * The block integrates with the backend data processing API to offload
 * heavy computations from the client, improving performance for large datasets.
 * 
 * @module DataOpsBlock
 * @version 1.0.0
 * @since 1.0.0
 */

// === Data Processing Block (Backend) ===
(function(){
  // Wait for Blockly to be available
  function waitForBlockly() {
    if (typeof Blockly !== 'undefined' && Blockly.JavaScript) {
      initializeBlocks();
    } else {
      setTimeout(waitForBlockly, 10);
    }
  }

  // Debug: confirm generators are registered in the browser
  try {
    if (typeof Blockly !== 'undefined' && Blockly.JavaScript) {
      console.log('[DataOps] Generators registered:', {
        filter_data: !!Blockly.JavaScript['filter_data'],
        sort_data: !!Blockly.JavaScript['sort_data'],
        select_columns: !!Blockly.JavaScript['select_columns'],
        group_by: !!Blockly.JavaScript['group_by'],
        calculate_column: !!Blockly.JavaScript['calculate_column'],
        drop_empty: !!Blockly.JavaScript['drop_empty']
      });
    }
  } catch (_) { /* noop */ }
  
  function initializeBlocks() {
    Blockly.defineBlocksWithJsonArray([
    {
      "type": "filter_data",
      "message0": "filter %1 where %2 %3 %4",
      "args0": [
        { "type": "input_value", "name": "DATA", "check": "Dataset" },
        { "type": "field_input", "name": "COLUMN", "text": "column", "SERIALIZABLE": true },
        { "type": "field_dropdown", "name": "OPERATOR", "options": [
          ["equals", "equals"],
          ["not equals", "not_equals"],
          ["greater than", "greater_than"],
          ["less than", "less_than"],
          ["contains", "contains"]
        ], "SERIALIZABLE": true },
        { "type": "field_input", "name": "VALUE", "text": "value", "SERIALIZABLE": true }
      ],
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Filter data based on a condition",
      "helpUrl": ""
    },
    {
      "type": "sort_data",
      "message0": "sort %1 by %2 %3",
      "args0": [
        { "type": "input_value", "name": "DATA", "check": "Dataset" },
        { "type": "field_input", "name": "COLUMN", "text": "column", "SERIALIZABLE": true },
        { "type": "field_dropdown", "name": "DIRECTION", "options": [["ascending","asc"],["descending","desc"]], "SERIALIZABLE": true }
      ],
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Sort data by a column",
      "helpUrl": ""
    },
    {
      "type": "select_columns",
      "message0": "select columns %1 from %2",
      "args0": [
        { "type": "field_input", "name": "COLUMNS", "text": "col1,col2", "SERIALIZABLE": true },
        { "type": "input_value", "name": "DATA", "check": "Dataset" }
      ],
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Select specific columns from data",
      "helpUrl": ""
    },
    {
      "type": "group_by",
      "message0": "group %1 by %2 and %3 %4 as %5",
      "args0": [
        { "type": "input_value", "name": "DATA", "check": "Dataset" },
        { "type": "field_input", "name": "GROUP_COLUMN", "text": "group_column", "SERIALIZABLE": true },
        { "type": "field_dropdown", "name": "AGGREGATION", "options": [
          ["sum", "sum"],
          ["average", "average"],
          ["count", "count"],
          ["min", "min"],
          ["max", "max"]
        ], "SERIALIZABLE": true },
        { "type": "field_input", "name": "AGG_COLUMN", "text": "value_column", "SERIALIZABLE": true },
        { "type": "field_input", "name": "ALIAS", "text": "result", "SERIALIZABLE": true }
      ],
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Group data and apply aggregation",
      "helpUrl": ""
    },
    {
      "type": "calculate_column",
      "message0": "calculate %1 as %2 from %3",
      "args0": [
        { "type": "field_input", "name": "EXPRESSION", "text": "col1 + col2", "SERIALIZABLE": true },
        { "type": "field_input", "name": "NEW_COLUMN", "text": "new_column", "SERIALIZABLE": true },
        { "type": "input_value", "name": "DATA", "check": "Dataset" }
      ],
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Calculate a new column from existing data",
      "helpUrl": ""
    },
    {
      "type": "drop_empty",
      "message0": "drop empty rows in %1 from %2",
      "args0": [
        { "type": "field_input", "name": "COLUMN", "text": "column", "SERIALIZABLE": true },
        { "type": "input_value", "name": "DATA", "check": "Dataset" }
      ],
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Remove rows with empty values",
      "helpUrl": ""
    }
  ]);

  // JavaScript generators for each block
  if (Blockly.JavaScript) {
    // Helper function to get data code safely
    function getDataCode(block) {
      try {
        const dataCode = Blockly.JavaScript.valueToCode(block, 'DATA', Blockly.JavaScript.ORDER_NONE);
        return dataCode || 'Blockly.CsvImportData.data';
      } catch (e) {
        return 'Blockly.CsvImportData.data';
      }
    }

    // Filter data generator
    Blockly.JavaScript['filter_data'] = function(block) {
      const dataCode = getDataCode(block);
      const column = block.getFieldValue('COLUMN') || 'column';
      const operator = block.getFieldValue('OPERATOR') || 'equals';
      const value = block.getFieldValue('VALUE') || 'value';
      
      // Escape special characters in strings to prevent code injection
      const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');
      const safeValue = value.replace(/'/g, "\\'").replace(/"/g, '\\"');
      
      const code = `(async () => {\n` +
        `  try {\n` +
        `    const __input = ${dataCode} || [];\n` +
        `    if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }\n` +
        `    if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }\n` +
        `    const __res = await window.AppApi.processData(__input, [{ type: 'filter', params: { column: '${safeColumn}', operator: '${operator}', value: '${safeValue}' } }]);\n` +
        `    const __data = (__res && __res.data) ? __res.data : __input;\n` +
        `    if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }\n` +
        `    return __data;\n` +
        `  } catch (error) {\n` +
        `    console.error('Filter data error:', error);\n` +
        `    return ${dataCode} || [];\n` +
        `  }\n` +
        `})()`;
      
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // Sort data generator
    Blockly.JavaScript['sort_data'] = function(block) {
      const dataCode = getDataCode(block);
      const column = block.getFieldValue('COLUMN') || 'column';
      const direction = block.getFieldValue('DIRECTION') || 'asc';

      // Escape special characters in strings
      const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');

      const code = `(async () => {\n` +
        `  try {\n` +
        `    const __input = ${dataCode} || [];\n` +
        `    if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }\n` +
        `    if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }\n` +
        `    const __res = await window.AppApi.processData(__input, [{ type: 'sort', params: { column: '${safeColumn}', direction: '${direction}' } }]);\n` +
        `    const __data = (__res && __res.data) ? __res.data : __input;\n` +
        `    if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }\n` +
        `    return __data;\n` +
        `  } catch (error) {\n` +
        `    console.error('Sort data error:', error);\n` +
        `    return ${dataCode} || [];\n` +
        `  }\n` +
        `})()`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // Select columns generator
    Blockly.JavaScript['select_columns'] = function(block) {
      const dataCode = getDataCode(block);
      const columns = block.getFieldValue('COLUMNS') || 'col1,col2';
      
      const code = `(async () => {\n` +
        `  const __input = ${dataCode} || [];\n` +
        `  if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }\n` +
        `  const __res = await window.AppApi.processData(__input, [{ type: 'select', params: { columns: '${columns}'.split(',').map(s=>s.trim()).filter(Boolean) } }]);\n` +
        `  const __data = (__res && __res.data) ? __res.data : __input;\n` +
        `  if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }\n` +
        `  return __data;\n` +
        `})()`;
      
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // Group by generator
    Blockly.JavaScript['group_by'] = function(block) {
      const dataCode = getDataCode(block);
      const groupColumn = block.getFieldValue('GROUP_COLUMN') || 'group_column';
      const aggregation = block.getFieldValue('AGGREGATION') || 'sum';
      const aggColumn = block.getFieldValue('AGG_COLUMN') || 'value_column';
      const alias = block.getFieldValue('ALIAS') || 'result';
      
      const code = `(async () => {\n` +
        `  const __input = ${dataCode} || [];\n` +
        `  if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }\n` +
        `  const __res = await window.AppApi.processData(__input, [{ type: 'groupBy', params: { groupBy: '${groupColumn}', aggregations: [{ column: '${aggColumn}', operation: '${aggregation}', alias: '${alias}' }] } }]);\n` +
        `  const __data = (__res && __res.data) ? __res.data : __input;\n` +
        `  if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }\n` +
        `  return __data;\n` +
        `})()`;
      
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // Calculate column generator
    Blockly.JavaScript['calculate_column'] = function(block) {
      const dataCode = getDataCode(block);
      const expression = block.getFieldValue('EXPRESSION') || 'col1 + col2';
      const newColumn = block.getFieldValue('NEW_COLUMN') || 'new_column';
      
      const code = `(async () => {\n` +
        `  const __input = ${dataCode} || [];\n` +
        `  if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }\n` +
        `  const __res = await window.AppApi.processData(__input, [{ type: 'calculate', params: { expression: \`${expression}\`, newColumnName: '${newColumn}' } }]);\n` +
        `  const __data = (__res && __res.data) ? __res.data : __input;\n` +
        `  if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }\n` +
        `  return __data;\n` +
        `})()`;
      
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // Drop empty generator
    Blockly.JavaScript['drop_empty'] = function(block) {
      const dataCode = getDataCode(block);
      const column = block.getFieldValue('COLUMN') || 'column';
      
      const code = `(async () => {\n` +
        `  const __input = ${dataCode} || [];\n` +
        `  if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }\n` +
        `  const __res = await window.AppApi.processData(__input, [{ type: 'filter', params: { column: '${column}', operator: 'not_equals', value: '' } }]);\n` +
        `  const __data = (__res && __res.data) ? __res.data : __input;\n` +
        `  if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }\n` +
        `  return __data;\n` +
        `})()`;
      
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  }

  // Register forBlock mappings for newer Blockly generator API
  if (Blockly.JavaScript) {
    const js = Blockly.JavaScript;
    js.forBlock = js.forBlock || {};
    if (js['filter_data'] && !js.forBlock['filter_data']) js.forBlock['filter_data'] = (block, generator) => js['filter_data'](block, generator);
    if (js['sort_data'] && !js.forBlock['sort_data']) js.forBlock['sort_data'] = (block, generator) => js['sort_data'](block, generator);
    if (js['select_columns'] && !js.forBlock['select_columns']) js.forBlock['select_columns'] = (block, generator) => js['select_columns'](block, generator);
    if (js['group_by'] && !js.forBlock['group_by']) js.forBlock['group_by'] = (block, generator) => js['group_by'](block, generator);
    if (js['calculate_column'] && !js.forBlock['calculate_column']) js.forBlock['calculate_column'] = (block, generator) => js['calculate_column'](block, generator);
    if (js['drop_empty'] && !js.forBlock['drop_empty']) js.forBlock['drop_empty'] = (block, generator) => js['drop_empty'](block, generator);
  }
  }
  
  // Start waiting for Blockly
  waitForBlockly();
})();
