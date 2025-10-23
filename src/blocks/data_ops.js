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

/** 
 * Data processing blocks and generators (frontend integration)
 *
 * - Defines individual Blockly blocks: filter_data, sort_data, select_columns,
 *   group_by, calculate_column, drop_empty.
 * - Registers JavaScript generators and ensures compatibility with Blockly's
 *   newer generator API via forBlock mappings.
 * - Includes a small data normalizer so blocks accept either raw arrays,
 *   PapaParse results (with .data), or JSON strings.
 * - Defers initialization until Blockly is available to avoid race conditions
 *   in plain <script> environments.
 */
// === Data Processing Block (Backend) ===
(function(){
  // Helper function to get available columns from CSV data
  function getAvailableColumns() {
    const csvData = window.Blockly && window.Blockly.CsvImportData && window.Blockly.CsvImportData.data;
    if (csvData && Array.isArray(csvData) && csvData.length > 0) {
      return Object.keys(csvData[0]);
    }
    return [];
  }

  // Helper function to update field options with available columns
  function updateFieldWithColumns(field, isMultiSelect = false) {
    if (field && field.setOptions) {
      const columns = getAvailableColumns();
      if (columns.length > 0) {
        const options = isMultiSelect 
          ? [['All columns', 'all'], ...columns.map(col => [col, col])]
          : columns.map(col => [col, col]);
        field.setOptions(options);
      }
    }
  }

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
        { "type": "field_dropdown", "name": "COLUMN", "options": [["column", "column"]], "SERIALIZABLE": true },
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
      "colour": 120,
      "tooltip": "Filter data based on a condition. Column dropdown will be populated with available columns.",
      "helpUrl": ""
    },
    {
      "type": "filter_range",
      "message0": "filter %1 where %2 is between %3 and %4",
      "args0": [
        { "type": "input_value", "name": "DATA", "check": "Dataset" },
        { "type": "field_dropdown", "name": "COLUMN", "options": [["column","column"]], "SERIALIZABLE": true },
        { "type": "field_input", "name": "MIN", "text": "min", "SERIALIZABLE": true },
        { "type": "field_input", "name": "MAX", "text": "max", "SERIALIZABLE": true }
      ],
      "output": "Dataset",
      "colour": 120,  
      "tooltip": "Keep rows whose column value is between MIN and MAX (inclusive).",
      "helpUrl": ""
    },

    {
      "type": "sort_data",
      "message0": "sort %1 by %2 %3",
      "args0": [
        { "type": "input_value", "name": "DATA", "check": "Dataset" },
        { "type": "field_dropdown", "name": "COLUMN", "options": [["column", "column"]], "SERIALIZABLE": true },
        { "type": "field_dropdown", "name": "DIRECTION", "options": [["ascending","asc"],["descending","desc"]], "SERIALIZABLE": true }
      ],
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Sort data by a column. Column dropdown will be populated with available columns.",
      "helpUrl": ""
    },
    {
      "type": "select_columns",
      "message0": "select columns %1 from %2",
      "args0": [
        { "type": "field_dropdown", "name": "COLUMNS", "options": [["col1,col2", "col1,col2"]], "SERIALIZABLE": true },
        { "type": "input_value", "name": "DATA", "check": "Dataset" }
      ],
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Select specific columns from data. Dropdown will be populated with available columns.",
      "helpUrl": ""
    },
    {
      "type": "group_by",
      "message0": "group %1 by %2 and %3 %4 as %5",
      "args0": [
        { "type": "input_value", "name": "DATA", "check": "Dataset" },
        { "type": "field_dropdown", "name": "GROUP_COLUMN", "options": [["group_column", "group_column"]], "SERIALIZABLE": true },
        { "type": "field_dropdown", "name": "AGGREGATION", "options": [
          ["sum", "sum"],
          ["average", "average"],
          ["count", "count"],
          ["min", "min"],
          ["max", "max"]
        ], "SERIALIZABLE": true },
        { "type": "field_dropdown", "name": "AGG_COLUMN", "options": [["value_column", "value_column"]], "SERIALIZABLE": true },
        { "type": "field_input", "name": "ALIAS", "text": "result", "SERIALIZABLE": true }
      ],
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Group data and apply aggregation. Column dropdowns will be populated with available columns.",
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
        { "type": "field_dropdown", "name": "COLUMN", "options": [["column", "column"]], "SERIALIZABLE": true },
        { "type": "input_value", "name": "DATA", "check": "Dataset" }
      ],
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Remove rows with empty values. Column dropdown will be populated with available columns.",
      "helpUrl": ""
    },
    // Convert Type
    {
      "type": "convert_type",
      "message0": "convert %1 to %2",
      "args0": [
        { "type": "field_dropdown", "name": "COLUMN", "options": [["column","column"]], "SERIALIZABLE": true },
        { "type": "field_dropdown", "name": "TO", "options": [
          ["number","number"],["string","string"],["date","date"],["boolean","boolean"]
        ], "SERIALIZABLE": true }
      ],
      "output": "Dataset", "colour": 20
    },

    // Drop column
    {
      "type": "drop_column",
      "message0": "drop column %1 from %2",
      "args0": [
        { "type": "field_dropdown", "name": "COLUMN", "options": [["column","column"]], "SERIALIZABLE": true },
        { "type": "input_value", "name": "DATA", "check": "Dataset" }
      ],
      "output": "Dataset", "colour": 20
    },

    // Rename column
    {
      "type": "rename_column",
      "message0": "rename column %1 to %2 in %3",
      "args0": [
        { "type": "field_dropdown", "name": "FROM", "options": [["old_name","old_name"]], "SERIALIZABLE": true },
        { "type": "field_input", "name": "TO", "text": "new_name", "SERIALIZABLE": true },
        { "type": "input_value", "name": "DATA", "check": "Dataset" }
      ],
      "output": "Dataset", "colour": 20
    },

    // Handle missing
    {
      "type": "handle_missing",
      "message0": "handle missing in %1 with %2 value %3 from %4",
      "args0": [
        { "type": "field_dropdown", "name": "COLUMN", "options": [["column","column"]], "SERIALIZABLE": true },
        { "type": "field_dropdown", "name": "STRATEGY", "options": [
          ["drop rows","drop"],["fill 0","fill_zero"],["fill empty string","fill_empty"],["custom value","fill_value"]
        ], "SERIALIZABLE": true },
        { "type": "field_input", "name": "VALUE", "text": "0", "SERIALIZABLE": true },
        { "type": "input_value", "name": "DATA", "check": "Dataset" }
      ],
      "output": "Dataset", "colour": 20
    },

    // Bin (numeric)
    {
      "type": "bin_column",
      "message0": "bin %1 into %2 buckets as %3 in %4",
      "args0": [
        { "type": "field_dropdown", "name": "COLUMN", "options": [["value","value"]], "SERIALIZABLE": true },
        { "type": "field_number", "name": "BINS", "value": 10, "min": 1 },
        { "type": "field_input", "name": "OUT", "text": "value_bin" },
        { "type": "input_value", "name": "DATA", "check": "Dataset" }
      ],
      "output": "Dataset", "colour": 20
    },

    // Visualisation fields
    {
      "type": "viz_fields",
      "message0": "visualize %1 with x %2, y %3, color %4, type %5",
      "args0": [
        { "type": "input_value", "name": "DATA", "check": "Dataset" },
        { "type": "field_dropdown", "name": "X", "options": [["x","x"]], "SERIALIZABLE": true },
        { "type": "field_dropdown", "name": "Y", "options": [["y","y"]], "SERIALIZABLE": true },
        { "type": "field_dropdown", "name": "COLOR", "options": [["category","category"]], "SERIALIZABLE": true },
        { "type": "field_dropdown", "name": "TYPE", "options": [
          ["bar","bar"],["line","line"],["scatter","scatter"],["histogram","hist"]
        ], "SERIALIZABLE": true }
      ],
      "output": "Dataset", "colour": 60
    }


  ]);

  // JavaScript generators for each block
  if (Blockly.JavaScript) {
    // Global normalizer to coerce various inputs (PapaParse result, JSON string) into an array of rows
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
        return dataCode || 'Blockly.CsvImportData.data';
      } catch (e) {
        return 'Blockly.CsvImportData.data';
      }
    }
   (function () {
      // Optional helpers – replace these stubs with your project's real implementations.
      function getAvailableColumns(){ /* ... */ }
      function updateFieldWithColumns(){ /* ... */ }
      function getDataCode(block){ /* ... */ }

      function initializeBlocks() {
        // 1) Define all blocks (including your existing filter/sort/...).
        Blockly.defineBlocksWithJsonArray([
          /* ...your existing blocks... */,
          /* Append new blocks here: convert_type / drop_column / rename_column / handle_missing / bin_column / viz_fields */
        ]);

        // 2) === Generators (place their implementations here) ===
        Blockly.JavaScript['convert_type']  = function(block){ /* ... */ };
        Blockly.JavaScript['drop_column']   = function(block){ /* ... */ };
        Blockly.JavaScript['rename_column'] = function(block){ /* ... */ };
        Blockly.JavaScript['handle_missing']= function(block){ /* ... */ };
        Blockly.JavaScript['bin_column']    = function(block){ /* ... */ };
        Blockly.JavaScript['viz_fields']    = function(block){ /* ... */ };

        // 3) forBlock compatibility (put this at the end of initializeBlocks as well).
        Blockly.JavaScript.forBlock = Blockly.JavaScript.forBlock || {};
        ['convert_type','drop_column','rename_column','handle_missing','bin_column','viz_fields']
          .forEach(t => {
            if (!Blockly.JavaScript.forBlock[t] && Blockly.JavaScript[t]) {
              Blockly.JavaScript.forBlock[t] = (block, g) => Blockly.JavaScript[t](block, g);
            }
          });
      }

      function waitForBlockly(){
        // Wait until Blockly and its JavaScript generator are available,
        // then register blocks and generators to avoid race conditions.
        if (typeof Blockly !== 'undefined' && Blockly.JavaScript){
          initializeBlocks();
          // You can also attach your autofill hooks here if needed.
          // attachAutofillHooks();
        } else {
          setTimeout(waitForBlockly, 10);
        }
      }

      waitForBlockly();
  })();


    // Filter data generator
    Blockly.JavaScript['filter_data'] = function(block) {
      const dataCode = getDataCode(block);
      const column = block.getFieldValue('COLUMN') || 'column';
      const operator = block.getFieldValue('OPERATOR') || 'equals';
      const value = block.getFieldValue('VALUE') || 'value';

      // Escape special characters in strings to prevent code injection
      const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');
      const safeValue = value.replace(/'/g, "\\'").replace(/"/g, '\\"');

      const code = `(async () => {
        const __normalize = window.BlocklyNormalizeData || function(input) {
          if (Array.isArray(input)) { return input; }
          if (input && Array.isArray(input.data)) { return input.data; }
          if (typeof input === 'string') {
            try {
              const parsed = JSON.parse(input);
              return Array.isArray(parsed) ? parsed : [];
            } catch (_) {
              return [];
            }
          }
          return [];
        };
        const __csvFallback = () => __normalize(window.Blockly && window.Blockly.CsvImportData ? (window.Blockly.CsvImportData.originalData || window.Blockly.CsvImportData.data) : null);
        try {
          let __rawData = ${dataCode};
          if (__rawData && typeof __rawData.then === 'function') {
            __rawData = await __rawData;
          }
          let __input = __normalize(__rawData);
          if (!Array.isArray(__input)) {
            __input = __csvFallback();
          }
          if (!Array.isArray(__input)) {
            for (let __i = 0; __i < 60 && !Array.isArray(__input); __i++) {
              await new Promise(r => setTimeout(r, 50));
              __input = __csvFallback();
            }
          }
          const __isPlaceholder = (${JSON.stringify(['column'])}).includes('${safeColumn}') || (${JSON.stringify(['value'])}).includes('${safeValue}');
          if (__isPlaceholder) { return __input; }
          if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
          if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
          const __res = await window.AppApi.processData(__input, [{ type: 'filter', params: { column: '${safeColumn}', operator: '${operator}', value: '${safeValue}' } }]);
          const __data = (__res && __res.data) ? __res.data : __input;
          // Update global CSV state and persist so AR picks up filtered data
          if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }
          if (window.BlocklyPersistCsv) { try { await window.BlocklyPersistCsv(__data); } catch (_) {} }
          return __data;
        } catch (error) {
          console.error('Filter data error:', error);
          return __csvFallback();
        }
      })()`;
      
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // Sort data generator
    Blockly.JavaScript['sort_data'] = function(block) {
      const dataCode = getDataCode(block);
      const column = block.getFieldValue('COLUMN') || 'column';
      const direction = block.getFieldValue('DIRECTION') || 'asc';

      // Escape special characters in strings
      const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');

      const code = `(async () => {
        const __normalize = window.BlocklyNormalizeData || function(input) {
          if (Array.isArray(input)) { return input; }
          if (input && Array.isArray(input.data)) { return input.data; }
          if (typeof input === 'string') {
            try {
              const parsed = JSON.parse(input);
              return Array.isArray(parsed) ? parsed : [];
            } catch (_) {
              return [];
            }
          }
          return [];
        };
        const __csvFallback = () => __normalize(window.Blockly && window.Blockly.CsvImportData ? window.Blockly.CsvImportData.data : null);
        try {
          let __rawData = ${dataCode};
          if (__rawData && typeof __rawData.then === 'function') {
            __rawData = await __rawData;
          }
          let __input = __normalize(__rawData);
          if (!Array.isArray(__input)) {
            __input = __csvFallback();
          }
          if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
          if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
          const __res = await window.AppApi.processData(__input, [{ type: 'sort', params: { column: '${safeColumn}', direction: '${direction}' } }]);
          const __data = (__res && __res.data) ? __res.data : __input;
          if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }
          return __data;
        } catch (error) {
          console.error('Sort data error:', error);
          return __csvFallback();
        }
      })()`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // Select columns generator
    Blockly.JavaScript['select_columns'] = function(block) {
      const dataCode = getDataCode(block);
      const columns = block.getFieldValue('COLUMNS') || 'col1,col2';
      
      const code = `(async () => {\n` +
        `  const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));\n` +
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
        `  const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));\n` +
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
        `  const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));\n` +
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
        `  const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));\n` +
        `  if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }\n` +
        `  const __res = await window.AppApi.processData(__input, [{ type: 'filter', params: { column: '${column}', operator: 'not_equals', value: '' } }]);\n` +
        `  const __data = (__res && __res.data) ? __res.data : __input;\n` +
        `  if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }\n` +
        `  return __data;\n` +
        `})()`;
      
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // === filter_range generator ===
    Blockly.JavaScript['filter_range'] = function(block) {
      const dataCode = getDataCode(block);
      const column = (block.getFieldValue('COLUMN') || 'column').replace(/'/g,"\\'").replace(/"/g,'\\"');
      const min = (block.getFieldValue('MIN') || 'min').replace(/'/g,"\\'").replace(/"/g,'\\"');
      const max = (block.getFieldValue('MAX') || 'max').replace(/'/g,"\\'").replace(/"/g,'\\"');

      const code = `(async () => {
        try {
          // First, get the data (could be a Promise from chained blocks)
          let __rawInput = ${dataCode};

          // If it's a Promise, await it
          if (__rawInput && typeof __rawInput.then === 'function') {
            __rawInput = await __rawInput;
          }

          // Then normalize it
          let __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(__rawInput) : (__rawInput || []));

          const __isPlaceholder = (${JSON.stringify(['column'])}).includes('${column}') ||
                                  (${JSON.stringify(['min'])}).includes('${min}') ||
                                  (${JSON.stringify(['max'])}).includes('${max}');
          if (__isPlaceholder) { return __input; }
          if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
          if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }

          const __res = await window.AppApi.processData(__input, [
            { type: 'filter', params: { column: '${column}', operator: 'between', min: '${min}', max: '${max}' } }
          ]);
          const __data = (__res && __res.data) ? __res.data : __input;
          // Update global CSV state and persist so AR picks up filtered data
          if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }
          if (window.BlocklyPersistCsv) { try { await window.BlocklyPersistCsv(__data); } catch (_) {} }
          return __data;
        } catch (error) {
          console.error('Filter range error:', error);
          return [];
        }
      })()`;

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
    if (js['filter_range'] && !js.forBlock['filter_range']) {js.forBlock['filter_range'] = (block, generator) => js['filter_range'](block, generator);}
  }
  }
  
  // Start waiting for Blockly
  waitForBlockly();
  
  // Add event listener for when blocks are created to apply autofill
  function addBlockCreationListener() {
    if (typeof Blockly === 'undefined' || !Blockly.getMainWorkspace) return;
    
    const workspace = Blockly.getMainWorkspace();
    if (!workspace) return;
    
    workspace.addChangeListener((event) => {
      if (event.type === Blockly.Events.BLOCK_CREATE) {
        const block = workspace.getBlockById(event.blockId);
        if (block) {
          // Small delay to ensure the block is fully rendered
          setTimeout(() => {
            applyAutofillToBlock(block);
          }, 50);
        }
      }
    });
  }
  
  // Try to add the listener when Blockly is available
  setTimeout(addBlockCreationListener, 1000);
  
  // Function to apply autofill to blocks when they're created
  function applyAutofillToBlock(block) {
    if (!block || !block.type) return;
    
    const blockType = block.type;
    const columns = getAvailableColumns();
    
    if (columns.length === 0) return; // No CSV data available
    
    switch (blockType) {
      case 'filter_data':
        updateFieldWithColumns(block.getField('COLUMN'));
        break;
      case 'sort_data':
        updateFieldWithColumns(block.getField('COLUMN'));
        break;
      case 'select_columns':
        // For select_columns, we want to show all columns as options
        const selectField = block.getField('COLUMNS');
        if (selectField && selectField.setOptions) {
          const allColumnsOption = [['All columns', 'all']];
          const columnOptions = columns.map(col => [col, col]);
          selectField.setOptions([...allColumnsOption, ...columnOptions]);
        }
        break;
      case 'group_by':
        updateFieldWithColumns(block.getField('GROUP_COLUMN'));
        updateFieldWithColumns(block.getField('AGG_COLUMN'));
        break;
      case 'drop_empty':
        updateFieldWithColumns(block.getField('COLUMN'));
        break;
        case 'filter_range':
        updateFieldWithColumns(block.getField('COLUMN'));
        break;
    }
  }

  // Function to update all existing blocks when CSV data is loaded
  function updateAllBlocksWithAutofill() {
    if (typeof Blockly === 'undefined' || !Blockly.getMainWorkspace) return;
    
    const workspace = Blockly.getMainWorkspace();
    if (!workspace) return;
    
    const allBlocks = workspace.getAllBlocks();
    allBlocks.forEach(block => {
      applyAutofillToBlock(block);
    });
  }

  // Manual trigger function for testing and frontend use
  function triggerAutofill() {
    console.log('🔄 Triggering autofill for all blocks...');
    const columns = getAvailableColumns();
    console.log('📊 Available columns:', columns);
    
    if (columns.length === 0) {
      console.log('⚠️ No CSV data available for autofill');
      return;
    }
    
    updateAllBlocksWithAutofill();
    console.log('✅ Autofill triggered for all blocks');
  }

  // Export helper functions for autofill functionality
  window.BlocklyAutofill = {
    getAvailableColumns,
    updateFieldWithColumns,
    applyAutofillToBlock,
    updateAllBlocksWithAutofill,
    triggerAutofill
  };
})();
