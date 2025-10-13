/**
 * Data Transformation Blocks for Blockly
 *
 * Pure-frontend transformation helpers that operate on the in-memory CSV rows.
 * These complement server-side operations by providing quick per-row edits
 * like renaming columns, replacing values, filling missing data, type casting,
 * and string transformations.
 */
(function(){
  function getCsvData() {
    return (window.Blockly && window.Blockly.CsvImportData && Array.isArray(window.Blockly.CsvImportData.data))
      ? window.Blockly.CsvImportData.data
      : [];
  }

  function getAvailableColumns() {
    const data = getCsvData();
    if (data.length > 0 && data[0] && typeof data[0] === 'object') {
      return Object.keys(data[0]);
    }
    return [];
  }

  function updateFieldWithColumns(field) {
    if (!field || !field.setOptions) return;
    const columns = getAvailableColumns();
    if (columns.length > 0) {
      field.setOptions(columns.map(col => [col, col]));
    }
  }

  function waitForBlockly() {
    if (typeof Blockly !== 'undefined' && Blockly.JavaScript) {
      initializeBlocks();
    } else {
      setTimeout(waitForBlockly, 10);
    }
  }

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

      function getDataCode(block) {
        try {
          const dataCode = Blockly.JavaScript.valueToCode(block, 'DATA', Blockly.JavaScript.ORDER_NONE);
          return dataCode || '(window.Blockly && window.Blockly.CsvImportData ? window.Blockly.CsvImportData.data : [])';
        } catch (e) {
          return '(window.Blockly && window.Blockly.CsvImportData ? window.Blockly.CsvImportData.data : [])';
        }
      }

      function assignCsvData(__data) {
        if (window.Blockly && window.Blockly.CsvImportData) {
          window.Blockly.CsvImportData.data = __data;
        }
      }

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

    // Export an autofill helper so CSV import can trigger us on data load
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

    // Integrate with the existing global BlocklyAutofill system so we get called automatically
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

    window.BlocklyTransformAutofill = {
      applyAutofillToTransformationBlock,
      updateAllTransformationBlocksWithAutofill,
    };
  }

  waitForBlockly();
})();


