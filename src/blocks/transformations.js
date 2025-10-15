/**
 * Data Transformation Blocks for Blockly
 * 
 * Provides client-side data transformation blocks for the ApparentlyAR platform.
 * These blocks allow students in grades 8-10 to perform beginner-friendly data
 * manipulation operations including renaming columns, dropping duplicates, 
 * rounding numbers, splitting/concatenating columns, and more.
 * 
 * All transformations operate on in-memory CSV data and update the global
 * Blockly.CsvImportData.data state. These complement server-side operations
 * by providing quick, synchronous per-row edits.
 * 
 * Features:
 * - Automatic column dropdown population (autofill)
 * - Real-time data transformation
 * - Chainable operations
 * - Type-safe conversions
 * - String manipulation utilities
 * 
 * @module TransformationBlocks
 * @author ApparentlyAR Team
 * @version 1.0.0
 * @since 1.0.0
 */
(function(){
  /**
   * Retrieves the current CSV data from global Blockly storage
   * 
   * @private
   * @returns {Array<Object>} Array of CSV row objects, or empty array if no data
   */
  function getCsvData() {
    return (window.Blockly && window.Blockly.CsvImportData && Array.isArray(window.Blockly.CsvImportData.data))
      ? window.Blockly.CsvImportData.data
      : [];
  }

  /**
   * Extracts column names from the current CSV data
   * 
   * @private
   * @returns {Array<string>} Array of column names from the first data row
   */
  function getAvailableColumns() {
    const data = getCsvData();
    if (data.length > 0 && data[0] && typeof data[0] === 'object') {
      return Object.keys(data[0]);
    }
    return [];
  }

  /**
   * Updates a Blockly dropdown field with available CSV column names
   * 
   * @private
   * @param {Object} field - Blockly field object with setOptions method
   */
  function updateFieldWithColumns(field) {
    if (!field || !field.setOptions) return;
    const columns = getAvailableColumns();
    if (columns.length > 0) {
      field.setOptions(columns.map(col => [col, col]));
    }
  }

  /**
   * Waits for Blockly to be available before initializing blocks
   * Polls every 10ms until Blockly and Blockly.JavaScript are defined
   * 
   * @private
   */
  function waitForBlockly() {
    if (typeof Blockly !== 'undefined' && Blockly.JavaScript) {
      initializeBlocks();
    } else {
      setTimeout(waitForBlockly, 10);
    }
  }

  /**
   * Initializes all transformation block definitions and JavaScript generators
   * 
   * Defines 10 transformation blocks:
   * - tf_rename_column: Rename a column
   * - tf_drop_column: Remove a column
   * - tf_fill_missing: Fill null/undefined/empty values
   * - tf_replace_values: Replace specific values in a column
   * - tf_cast_type: Convert column data types (number, string, boolean, date)
   * - tf_string_transform: Apply string operations (uppercase, lowercase, capitalize, trim)
   * - tf_split_column: Split a column by delimiter into two columns
   * - tf_concat_columns: Combine two columns with a separator
   * - tf_drop_duplicates: Remove duplicate rows based on a column
   * - tf_round_number: Round numeric values to specified decimal places
   * 
   * All blocks accept a dataset input and return a transformed dataset output,
   * allowing for chainable operations.
   * 
   * @private
   */
  function initializeBlocks() {
    Blockly.defineBlocksWithJsonArray([
      {
        type: 'tf_rename_column',
        message0: 'rename column %1 to %2 in %3',
        args0: [
          { type: 'field_dropdown', name: 'FROM', options: [['column','column']], SERIALIZABLE: true },
          { type: 'field_input', name: 'TO', text: 'new_name', SERIALIZABLE: true },
          { type: 'input_value', name: 'DATA', check: 'Dataset' }
        ],
        output: 'Dataset',
        colour: 200,
        tooltip: 'Rename a column in the dataset',
        helpUrl: ''
      },
      {
        type: 'tf_drop_column',
        message0: 'drop column %1 from %2',
        args0: [
          { type: 'field_dropdown', name: 'COLUMN', options: [['column','column']], SERIALIZABLE: true },
          { type: 'input_value', name: 'DATA', check: 'Dataset' }
        ],
        output: 'Dataset',
        colour: 200,
        tooltip: 'Remove a column from the dataset',
        helpUrl: ''
      },
      {
        type: 'tf_fill_missing',
        message0: 'fill missing in %1 with %2 from %3',
        args0: [
          { type: 'field_dropdown', name: 'COLUMN', options: [['column','column']], SERIALIZABLE: true },
          { type: 'field_input', name: 'VALUE', text: '0', SERIALIZABLE: true },
          { type: 'input_value', name: 'DATA', check: 'Dataset' }
        ],
        output: 'Dataset',
        colour: 200,
        tooltip: 'Replace null/undefined/empty cells with a value',
        helpUrl: ''
      },
      {
        type: 'tf_replace_values',
        message0: 'in %1 replace %2 with %3 from %4',
        args0: [
          { type: 'field_dropdown', name: 'COLUMN', options: [['column','column']], SERIALIZABLE: true },
          { type: 'field_input', name: 'FROM_VALUE', text: 'old', SERIALIZABLE: true },
          { type: 'field_input', name: 'TO_VALUE', text: 'new', SERIALIZABLE: true },
          { type: 'input_value', name: 'DATA', check: 'Dataset' }
        ],
        output: 'Dataset',
        colour: 200,
        tooltip: 'Replace specific values in a column',
        helpUrl: ''
      },
      {
        type: 'tf_cast_type',
        message0: 'cast %1 to %2 in %3',
        args0: [
          { type: 'field_dropdown', name: 'COLUMN', options: [['column','column']], SERIALIZABLE: true },
          { type: 'field_dropdown', name: 'TO', options: [["number","number"],["string","string"],["boolean","boolean"],["date","date"]], SERIALIZABLE: true },
          { type: 'input_value', name: 'DATA', check: 'Dataset' }
        ],
        output: 'Dataset',
        colour: 200,
        tooltip: 'Cast values in a column to a specific type',
        helpUrl: ''
      },
      {
        type: 'tf_string_transform',
        message0: 'transform text in %1 using %2 in %3',
        args0: [
          { type: 'field_dropdown', name: 'COLUMN', options: [['column','column']], SERIALIZABLE: true },
          { type: 'field_dropdown', name: 'MODE', options: [["lowercase","lower"],["uppercase","upper"],["capitalize","cap"],["trim","trim"]], SERIALIZABLE: true },
          { type: 'input_value', name: 'DATA', check: 'Dataset' }
        ],
        output: 'Dataset',
        colour: 200,
        tooltip: 'Apply common string transformations to a column',
        helpUrl: ''
      },
      {
        type: 'tf_split_column',
        message0: 'split %1 by %2 into %3 and %4 in %5',
        args0: [
          { type: 'field_dropdown', name: 'COLUMN', options: [['column','column']], SERIALIZABLE: true },
          { type: 'field_input', name: 'DELIM', text: ',', SERIALIZABLE: true },
          { type: 'field_input', name: 'OUT1', text: 'part1', SERIALIZABLE: true },
          { type: 'field_input', name: 'OUT2', text: 'part2', SERIALIZABLE: true },
          { type: 'input_value', name: 'DATA', check: 'Dataset' }
        ],
        output: 'Dataset',
        colour: 200,
        tooltip: 'Split a column into two new columns using a delimiter',
        helpUrl: ''
      },
      {
        type: 'tf_concat_columns',
        message0: 'combine %1 and %2 with %3 as %4 in %5',
        args0: [
          { type: 'field_dropdown', name: 'COL1', options: [['column','column']], SERIALIZABLE: true },
          { type: 'field_dropdown', name: 'COL2', options: [['column','column']], SERIALIZABLE: true },
          { type: 'field_input', name: 'SEP', text: ' ', SERIALIZABLE: true },
          { type: 'field_input', name: 'OUT', text: 'combined', SERIALIZABLE: true },
          { type: 'input_value', name: 'DATA', check: 'Dataset' }
        ],
        output: 'Dataset',
        colour: 200,
        tooltip: 'Join two columns together with a separator',
        helpUrl: ''
      },
      {
        type: 'tf_drop_duplicates',
        message0: 'drop duplicate rows by %1 in %2',
        args0: [
          { type: 'field_dropdown', name: 'COLUMN', options: [['column','column']], SERIALIZABLE: true },
          { type: 'input_value', name: 'DATA', check: 'Dataset' }
        ],
        output: 'Dataset',
        colour: 200,
        tooltip: 'Keep the first row and remove later duplicates in that column',
        helpUrl: ''
      },
      {
        type: 'tf_round_number',
        message0: 'round %1 to %2 decimals in %3',
        args0: [
          { type: 'field_dropdown', name: 'COLUMN', options: [['column','column']], SERIALIZABLE: true },
          { type: 'field_number', name: 'DECIMALS', value: 0, min: 0, max: 6 },
          { type: 'input_value', name: 'DATA', check: 'Dataset' }
        ],
        output: 'Dataset',
        colour: 200,
        tooltip: 'Round numbers to a fixed number of decimal places',
        helpUrl: ''
      }
    ]);

    if (Blockly.JavaScript) {
      if (typeof window !== 'undefined' && !window.BlocklyNormalizeData) {
        window.BlocklyNormalizeData = function(input) {
          if (Array.isArray(input)) return input;
          if (input && Array.isArray(input.data)) return input.data;
          if (typeof input === 'string') {
            try { const p = JSON.parse(input); return Array.isArray(p) ? p : []; } catch (_) { return []; }
          }
          return [];
        };
      }

      /**
       * Extracts the data input code from a block or returns default CSV data reference
       * 
       * @private
       * @param {Object} block - Blockly block instance
       * @returns {string} JavaScript code string representing the data input
       */
      function getDataCode(block) {
        try {
          const dataCode = Blockly.JavaScript.valueToCode(block, 'DATA', Blockly.JavaScript.ORDER_NONE);
          return dataCode || '(window.Blockly && window.Blockly.CsvImportData ? window.Blockly.CsvImportData.data : [])';
        } catch (e) {
          return '(window.Blockly && window.Blockly.CsvImportData ? window.Blockly.CsvImportData.data : [])';
        }
      }

      /**
       * Updates the global CSV data storage with transformed data
       * 
       * @private
       * @param {Array<Object>} __data - Transformed dataset to store
       */
      function assignCsvData(__data) {
        if (window.Blockly && window.Blockly.CsvImportData) {
          window.Blockly.CsvImportData.data = __data;
        }
      }

      /**
       * JavaScript generator for rename column block
       * 
       * Generates code that renames a column in the dataset by destructuring
       * the old column name and creating a new property with the new name.
       * Updates global CSV data state.
       * 
       * @param {Object} block - Blockly block instance
       * @returns {Array} Tuple of [code string, order precedence]
       */
      Blockly.JavaScript['tf_rename_column'] = function(block) {
        const dataCode = getDataCode(block);
        const from = (block.getFieldValue('FROM') || 'column').replace(/'/g, "\\'").replace(/"/g,'\\"');
        const to = (block.getFieldValue('TO') || 'new_name').replace(/'/g, "\\'").replace(/"/g,'\\"');
        const code = `(async () => {\n`+
          `  let __raw = ${dataCode};\n`+
          `  if (__raw && typeof __raw.then==='function') __raw = await __raw;\n`+
          `  const __input = (window.BlocklyNormalizeData?window.BlocklyNormalizeData(__raw):(__raw||[]));\n`+
          `  if (!Array.isArray(__input) || __input.length===0) return __input;\n`+
          `  if (${JSON.stringify(['column'])}.includes('${from}')) return __input;\n`+
          `  const __data = __input.map(row => {\n`+
          `    if (!row || typeof row!=='object') return row;\n`+
          `    const { ['${from}']: __val, ...rest } = row;\n`+
          `    const out = { ...rest };\n`+
          `    out['${to}'] = (__val !== undefined) ? __val : row['${from}'];\n`+
          `    return out;\n`+
          `  });\n`+
          `  (${assignCsvData.toString()})(__data);\n`+
          `  return __data;\n`+
          `})()`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      /**
       * JavaScript generator for drop column block
       * 
       * Generates code that removes a column from the dataset using destructuring.
       * Updates global CSV data state.
       * 
       * @param {Object} block - Blockly block instance
       * @returns {Array} Tuple of [code string, order precedence]
       */
      Blockly.JavaScript['tf_drop_column'] = function(block) {
        const dataCode = getDataCode(block);
        const column = (block.getFieldValue('COLUMN') || 'column').replace(/'/g, "\\'").replace(/"/g,'\\"');
        const code = `(async () => {\n`+
          `  let __raw = ${dataCode};\n`+
          `  if (__raw && typeof __raw.then==='function') __raw = await __raw;\n`+
          `  const __input = (window.BlocklyNormalizeData?window.BlocklyNormalizeData(__raw):(__raw||[]));\n`+
          `  if (!Array.isArray(__input) || __input.length===0) return __input;\n`+
          `  if (${JSON.stringify(['column'])}.includes('${column}')) return __input;\n`+
          `  const __data = __input.map(row => {\n`+
          `    if (!row || typeof row!=='object') return row;\n`+
          `    const { ['${column}']: __omit, ...rest } = row;\n`+
          `    return rest;\n`+
          `  });\n`+
          `  (${assignCsvData.toString()})(__data);\n`+
          `  return __data;\n`+
          `})()`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      /**
       * JavaScript generator for fill missing values block
       * 
       * Generates code that replaces null, undefined, or empty string values
       * in a column with a specified fill value.
       * 
       * @param {Object} block - Blockly block instance
       * @returns {Array} Tuple of [code string, order precedence]
       */
      Blockly.JavaScript['tf_fill_missing'] = function(block) {
        const dataCode = getDataCode(block);
        const column = (block.getFieldValue('COLUMN') || 'column').replace(/'/g, "\\'").replace(/"/g,'\\"');
        const value = (block.getFieldValue('VALUE') || '0').replace(/'/g, "\\'").replace(/"/g,'\\"');
        const code = `(async () => {\n`+
          `  let __raw = ${dataCode};\n`+
          `  if (__raw && typeof __raw.then==='function') __raw = await __raw;\n`+
          `  const __input = (window.BlocklyNormalizeData?window.BlocklyNormalizeData(__raw):(__raw||[]));\n`+
          `  if (!Array.isArray(__input) || __input.length===0) return __input;\n`+
          `  if (${JSON.stringify(['column'])}.includes('${column}')) return __input;\n`+
          `  const __fill = '${value}';\n`+
          `  const __data = __input.map(row => {\n`+
          `    if (!row || typeof row!=='object') return row;\n`+
          `    const v = row['${column}'];\n`+
          `    const needFill = v === null || v === undefined || v === '';\n`+
          `    if (!needFill) return row;\n`+
          `    return { ...row, ['${column}']: __fill };\n`+
          `  });\n`+
          `  (${assignCsvData.toString()})(__data);\n`+
          `  return __data;\n`+
          `})()`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      /**
       * JavaScript generator for replace values block
       * 
       * Generates code that replaces specific values in a column with new values.
       * Uses string comparison to match values.
       * 
       * @param {Object} block - Blockly block instance
       * @returns {Array} Tuple of [code string, order precedence]
       */
      Blockly.JavaScript['tf_replace_values'] = function(block) {
        const dataCode = getDataCode(block);
        const column = (block.getFieldValue('COLUMN') || 'column').replace(/'/g, "\\'").replace(/"/g,'\\"');
        const fromVal = (block.getFieldValue('FROM_VALUE') || 'old').replace(/'/g, "\\'").replace(/"/g,'\\"');
        const toVal = (block.getFieldValue('TO_VALUE') || 'new').replace(/'/g, "\\'").replace(/"/g,'\\"');
        const code = `(async () => {\n`+
          `  let __raw = ${dataCode};\n`+
          `  if (__raw && typeof __raw.then==='function') __raw = await __raw;\n`+
          `  const __input = (window.BlocklyNormalizeData?window.BlocklyNormalizeData(__raw):(__raw||[]));\n`+
          `  if (!Array.isArray(__input) || __input.length===0) return __input;\n`+
          `  if (${JSON.stringify(['column'])}.includes('${column}')) return __input;\n`+
          `  const __data = __input.map(row => {\n`+
          `    if (!row || typeof row!=='object') return row;\n`+
          `    const v = row['${column}'];\n`+
          `    return (String(v) === '${fromVal}') ? { ...row, ['${column}']: '${toVal}' } : row;\n`+
          `  });\n`+
          `  (${assignCsvData.toString()})(__data);\n`+
          `  return __data;\n`+
          `})()`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      /**
       * JavaScript generator for cast type block
       * 
       * Generates code that converts column values to a specified type:
       * - number: Converts to finite numbers or null
       * - boolean: Converts to true/false based on truthiness
       * - date: Parses dates and converts to ISO strings
       * - string: Converts to string representation
       * 
       * @param {Object} block - Blockly block instance
       * @returns {Array} Tuple of [code string, order precedence]
       */
      Blockly.JavaScript['tf_cast_type'] = function(block) {
        const dataCode = getDataCode(block);
        const column = (block.getFieldValue('COLUMN') || 'column').replace(/'/g, "\\'").replace(/"/g,'\\"');
        const to = block.getFieldValue('TO') || 'number';
        const code = `(async () => {\n`+
          `  let __raw = ${dataCode};\n`+
          `  if (__raw && typeof __raw.then==='function') __raw = await __raw;\n`+
          `  const __input = (window.BlocklyNormalizeData?window.BlocklyNormalizeData(__raw):(__raw||[]));\n`+
          `  if (!Array.isArray(__input) || __input.length===0) return __input;\n`+
          `  if (${JSON.stringify(['column'])}.includes('${column}')) return __input;\n`+
          `  const __caster = (v) => {\n`+
          `    if ('${to}'==='number') { const n = Number(v); return Number.isFinite(n) ? n : null; }\n`+
          `    if ('${to}'==='boolean') { if (typeof v==='boolean') return v; const s=String(v).toLowerCase(); return s==='true'||s==='1'||s==='yes'; }\n`+
          `    if ('${to}'==='date') { const t=Date.parse(v); return Number.isFinite(t)? new Date(t).toISOString(): null; }\n`+
          `    return String(v);\n`+
          `  };\n`+
          `  const __data = __input.map(row => {\n`+
          `    if (!row || typeof row!=='object') return row;\n`+
          `    return { ...row, ['${column}']: __caster(row['${column}']) };\n`+
          `  });\n`+
          `  (${assignCsvData.toString()})(__data);\n`+
          `  return __data;\n`+
          `})()`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      /**
       * JavaScript generator for string transform block
       * 
       * Generates code that applies string transformations:
       * - lower: Convert to lowercase
       * - upper: Convert to uppercase
       * - cap: Capitalize first letter
       * - trim: Remove leading/trailing whitespace
       * 
       * @param {Object} block - Blockly block instance
       * @returns {Array} Tuple of [code string, order precedence]
       */
      Blockly.JavaScript['tf_string_transform'] = function(block) {
        const dataCode = getDataCode(block);
        const column = (block.getFieldValue('COLUMN') || 'column').replace(/'/g, "\\'").replace(/"/g,'\\"');
        const mode = block.getFieldValue('MODE') || 'lower';
        const code = `(async () => {\n`+
          `  let __raw = ${dataCode};\n`+
          `  if (__raw && typeof __raw.then==='function') __raw = await __raw;\n`+
          `  const __input = (window.BlocklyNormalizeData?window.BlocklyNormalizeData(__raw):(__raw||[]));\n`+
          `  if (!Array.isArray(__input) || __input.length===0) return __input;\n`+
          `  if (${JSON.stringify(['column'])}.includes('${column}')) return __input;\n`+
          `  const __tx = (s) => {\n`+
          `    const str = (s===null||s===undefined)?'':String(s);\n`+
          `    if ('${mode}'==='lower') return str.toLowerCase();\n`+
          `    if ('${mode}'==='upper') return str.toUpperCase();\n`+
          `    if ('${mode}'==='cap') return str.charAt(0).toUpperCase()+str.slice(1).toLowerCase();\n`+
          `    if ('${mode}'==='trim') return str.trim();\n`+
          `    return str;\n`+
          `  };\n`+
          `  const __data = __input.map(row => {\n`+
          `    if (!row || typeof row!=='object') return row;\n`+
          `    return { ...row, ['${column}']: __tx(row['${column}']) };\n`+
          `  });\n`+
          `  (${assignCsvData.toString()})(__data);\n`+
          `  return __data;\n`+
          `})()`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      /**
       * JavaScript generator for split column block
       * 
       * Generates code that splits a column by a delimiter into two new columns.
       * Preserves the original column and adds two new columns for the split parts.
       * 
       * @param {Object} block - Blockly block instance
       * @returns {Array} Tuple of [code string, order precedence]
       */
      Blockly.JavaScript['tf_split_column'] = function(block) {
        const dataCode = getDataCode(block);
        const column = (block.getFieldValue('COLUMN') || 'column').replace(/'/g, "\\'").replace(/\"/g,'\\"');
        const delim = (block.getFieldValue('DELIM') || ',').replace(/'/g, "\\'").replace(/\"/g,'\\"');
        const out1 = (block.getFieldValue('OUT1') || 'part1').replace(/'/g, "\\'").replace(/\"/g,'\\"');
        const out2 = (block.getFieldValue('OUT2') || 'part2').replace(/'/g, "\\'").replace(/\"/g,'\\"');
        const code = `(async () => {\n`+
          `  let __raw = ${dataCode};\n`+
          `  if (__raw && typeof __raw.then==='function') __raw = await __raw;\n`+
          `  const __input = (window.BlocklyNormalizeData?window.BlocklyNormalizeData(__raw):(__raw||[]));\n`+
          `  if (!Array.isArray(__input) || __input.length===0) return __input;\n`+
          `  if (${JSON.stringify(['column'])}.includes('${column}')) return __input;\n`+
          `  const __data = __input.map(row => {\n`+
          `    if (!row || typeof row!=='object') return row;\n`+
          `    const parts = String(row['${column}'] ?? '').split('${delim}');\n`+
          `    return { ...row, ['${out1}']: parts[0] ?? '', ['${out2}']: parts[1] ?? '' };\n`+
          `  });\n`+
          `  (${assignCsvData.toString()})(__data);\n`+
          `  return __data;\n`+
          `})()`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      /**
       * JavaScript generator for concatenate columns block
       * 
       * Generates code that combines two columns with a separator into a new column.
       * Preserves the original columns.
       * 
       * @param {Object} block - Blockly block instance
       * @returns {Array} Tuple of [code string, order precedence]
       */
      Blockly.JavaScript['tf_concat_columns'] = function(block) {
        const dataCode = getDataCode(block);
        const c1 = (block.getFieldValue('COL1') || 'column').replace(/'/g, "\\'").replace(/\"/g,'\\"');
        const c2 = (block.getFieldValue('COL2') || 'column').replace(/'/g, "\\'").replace(/\"/g,'\\"');
        const sep = (block.getFieldValue('SEP') || ' ').replace(/'/g, "\\'").replace(/\"/g,'\\"');
        const out = (block.getFieldValue('OUT') || 'combined').replace(/'/g, "\\'").replace(/\"/g,'\\"');
        const code = `(async () => {\n`+
          `  let __raw = ${dataCode};\n`+
          `  if (__raw && typeof __raw.then==='function') __raw = await __raw;\n`+
          `  const __input = (window.BlocklyNormalizeData?window.BlocklyNormalizeData(__raw):(__raw||[]));\n`+
          `  if (!Array.isArray(__input) || __input.length===0) return __input;\n`+
          `  if (${JSON.stringify(['column'])}.includes('${c1}') || ${JSON.stringify(['column'])}.includes('${c2}')) return __input;\n`+
          `  const __data = __input.map(row => {\n`+
          `    if (!row || typeof row!=='object') return row;\n`+
          `    const a = row['${c1}']; const b = row['${c2}'];\n`+
          `    return { ...row, ['${out}']: [a,b].filter(v=>v!==undefined&&v!==null).join('${sep}') };\n`+
          `  });\n`+
          `  (${assignCsvData.toString()})(__data);\n`+
          `  return __data;\n`+
          `})()`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      /**
       * JavaScript generator for drop duplicates block
       * 
       * Generates code that removes duplicate rows based on a column value.
       * Keeps the first occurrence and removes subsequent duplicates.
       * 
       * @param {Object} block - Blockly block instance
       * @returns {Array} Tuple of [code string, order precedence]
       */
      Blockly.JavaScript['tf_drop_duplicates'] = function(block) {
        const dataCode = getDataCode(block);
        const column = (block.getFieldValue('COLUMN') || 'column').replace(/'/g, "\\'").replace(/\"/g,'\\"');
        const code = `(async () => {\n`+
          `  let __raw = ${dataCode};\n`+
          `  if (__raw && typeof __raw.then==='function') __raw = await __raw;\n`+
          `  const __input = (window.BlocklyNormalizeData?window.BlocklyNormalizeData(__raw):(__raw||[]));\n`+
          `  if (!Array.isArray(__input) || __input.length===0) return __input;\n`+
          `  if (${JSON.stringify(['column'])}.includes('${column}')) return __input;\n`+
          `  const seen = new Set();\n`+
          `  const __data = __input.filter(row => {\n`+
          `    const key = row && typeof row==='object' ? row['${column}'] : row;\n`+
          `    const s = String(key);\n`+
          `    if (seen.has(s)) return false;\n`+
          `    seen.add(s);\n`+
          `    return true;\n`+
          `  });\n`+
          `  (${assignCsvData.toString()})(__data);\n`+
          `  return __data;\n`+
          `})()`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      /**
       * JavaScript generator for round number block
       * 
       * Generates code that rounds numeric values in a column to a specified
       * number of decimal places. Non-numeric values are preserved unchanged.
       * 
       * @param {Object} block - Blockly block instance
       * @returns {Array} Tuple of [code string, order precedence]
       */
      Blockly.JavaScript['tf_round_number'] = function(block) {
        const dataCode = getDataCode(block);
        const column = (block.getFieldValue('COLUMN') || 'column').replace(/'/g, "\\'").replace(/\"/g,'\\"');
        const decimals = Number(block.getFieldValue('DECIMALS') || 0);
        const code = `(async () => {\n`+
          `  let __raw = ${dataCode};\n`+
          `  if (__raw && typeof __raw.then==='function') __raw = await __raw;\n`+
          `  const __input = (window.BlocklyNormalizeData?window.BlocklyNormalizeData(__raw):(__raw||[]));\n`+
          `  if (!Array.isArray(__input) || __input.length===0) return __input;\n`+
          `  if (${JSON.stringify(['column'])}.includes('${column}')) return __input;\n`+
          `  const __data = __input.map(row => {\n`+
          `    if (!row || typeof row!=='object') return row;\n`+
          `    const n = Number(row['${column}']);\n`+
          `    const val = Number.isFinite(n) ? Number(n.toFixed(${decimals})) : row['${column}'];\n`+
          `    return { ...row, ['${column}']: val };\n`+
          `  });\n`+
          `  (${assignCsvData.toString()})(__data);\n`+
          `  return __data;\n`+
          `})()`;
        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // forBlock compatibility
      const js = Blockly.JavaScript;
      js.forBlock = js.forBlock || {};
      ['tf_rename_column','tf_drop_column','tf_fill_missing','tf_replace_values','tf_cast_type','tf_string_transform','tf_split_column','tf_concat_columns','tf_drop_duplicates','tf_round_number']
        .forEach(t => { if (!js.forBlock[t] && js[t]) { js.forBlock[t] = (block,g) => js[t](block,g); } });
    }

    // Autofill when blocks are created
    if (Blockly.getMainWorkspace) {
      const ws = Blockly.getMainWorkspace();
      if (ws) {
        ws.addChangeListener((event) => {
          if (event.type === Blockly.Events.BLOCK_CREATE) {
            const ids = (event.ids && Array.isArray(event.ids)) ? event.ids : (event.blockId ? [event.blockId] : []);
            if (!ids.length) return;
            setTimeout(() => {
              ids.forEach(id => {
                const b = ws.getBlockById(id);
                if (b) {
                  try { applyAutofillToTransformationBlock(b); } catch (_) {}
                }
              });
            }, 50);
          }
        });
        // Fallback: after workspace ready, try a pass once to populate any pre-existing blocks
        setTimeout(() => { try { updateAllTransformationBlocksWithAutofill(); } catch (_) {} }, 400);
      }
    }

    /**
     * Updates all transformation blocks in the workspace with current CSV column data
     * Called after CSV import to populate dropdown fields with actual column names
     * 
     * @private
     */
    function updateAllTransformationBlocksWithAutofill() {
      if (typeof Blockly === 'undefined' || !Blockly.getMainWorkspace) return;
      const ws = Blockly.getMainWorkspace();
      if (!ws) return;
      const blocks = ws.getAllBlocks();
      blocks.forEach(block => {
        if (!block || !block.type) return;
        applyAutofillToTransformationBlock(block);
      });
    }

    /**
     * Applies autofill to a specific transformation block based on its type
     * Identifies the appropriate dropdown fields and populates them with CSV columns
     * 
     * @private
     * @param {Object} block - Blockly block instance to apply autofill to
     */
    function applyAutofillToTransformationBlock(block) {
      switch (block.type) {
        case 'tf_rename_column':
          updateFieldWithColumns(block.getField('FROM')); break;
        case 'tf_drop_column':
        case 'tf_fill_missing':
        case 'tf_replace_values':
        case 'tf_cast_type':
        case 'tf_string_transform':
        case 'tf_split_column':
        case 'tf_drop_duplicates':
        case 'tf_round_number':
          updateFieldWithColumns(block.getField('COLUMN')); break;
        case 'tf_concat_columns':
          updateFieldWithColumns(block.getField('COL1'));
          updateFieldWithColumns(block.getField('COL2')); break;
      }
    }

    /**
     * Extends the global BlocklyAutofill system to include transformation blocks
     * 
     * Wraps the existing applyAutofillToBlock function to also handle transformation
     * block types. Ensures autofill works both when blocks are created and when
     * CSV data is loaded.
     * 
     * @private
     */
    function extendBlocklyAutofillSystem() {
      if (!window.BlocklyAutofill) { setTimeout(extendBlocklyAutofillSystem, 100); return; }
      if (window.BlocklyAutofill._transformationsExtended) return;
      const original = window.BlocklyAutofill.applyAutofillToBlock || function(){};
      window.BlocklyAutofill.applyAutofillToBlock = function(block) {
        try { original(block); } catch (_e) {}
        if (block && block.type && (
          block.type === 'tf_rename_column' ||
          block.type === 'tf_drop_column' ||
          block.type === 'tf_fill_missing' ||
          block.type === 'tf_replace_values' ||
          block.type === 'tf_cast_type' ||
          block.type === 'tf_string_transform' ||
          block.type === 'tf_split_column' ||
          block.type === 'tf_concat_columns' ||
          block.type === 'tf_drop_duplicates' ||
          block.type === 'tf_round_number'
        )) {
          applyAutofillToTransformationBlock(block);
        }
      };
      window.BlocklyAutofill._transformationsExtended = true;
    }
    setTimeout(extendBlocklyAutofillSystem, 300);
    setTimeout(extendBlocklyAutofillSystem, 1000);
    setTimeout(extendBlocklyAutofillSystem, 2000);

    /**
     * Global transformation block autofill API
     * Exposed on window for integration with CSV import and other systems
     * 
     * @global
     * @namespace BlocklyTransformAutofill
     */
    window.BlocklyTransformAutofill = {
      /**
       * Applies autofill to a single transformation block
       * @memberof BlocklyTransformAutofill
       * @function applyAutofillToTransformationBlock
       * @param {Object} block - Blockly block instance
       */
      applyAutofillToTransformationBlock,
      
      /**
       * Updates all transformation blocks in the workspace with column data
       * @memberof BlocklyTransformAutofill
       * @function updateAllTransformationBlocksWithAutofill
       */
      updateAllTransformationBlocksWithAutofill,
    };
  }

  waitForBlockly();
})();


