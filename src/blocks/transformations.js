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

      // forBlock compatibility
      const js = Blockly.JavaScript;
      js.forBlock = js.forBlock || {};
      ['tf_rename_column','tf_drop_column','tf_fill_missing','tf_replace_values','tf_cast_type','tf_string_transform']
        .forEach(t => { if (!js.forBlock[t] && js[t]) { js.forBlock[t] = (block,g) => js[t](block,g); } });
    }

    // Autofill when blocks are created
    if (Blockly.getMainWorkspace) {
      const ws = Blockly.getMainWorkspace();
      if (ws) {
        ws.addChangeListener((event) => {
          if (event.type === Blockly.Events.BLOCK_CREATE) {
            const block = ws.getBlockById(event.blockId);
            if (!block) return;
            setTimeout(() => {
              switch (block.type) {
                case 'tf_rename_column':
                  updateFieldWithColumns(block.getField('FROM')); break;
                case 'tf_drop_column':
                  updateFieldWithColumns(block.getField('COLUMN')); break;
                case 'tf_fill_missing':
                  updateFieldWithColumns(block.getField('COLUMN')); break;
                case 'tf_replace_values':
                  updateFieldWithColumns(block.getField('COLUMN')); break;
                case 'tf_cast_type':
                  updateFieldWithColumns(block.getField('COLUMN')); break;
                case 'tf_string_transform':
                  updateFieldWithColumns(block.getField('COLUMN')); break;
              }
            }, 50);
          }
        });
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
        switch (block.type) {
          case 'tf_rename_column':
            updateFieldWithColumns(block.getField('FROM')); break;
          case 'tf_drop_column':
          case 'tf_fill_missing':
          case 'tf_replace_values':
          case 'tf_cast_type':
          case 'tf_string_transform':
            updateFieldWithColumns(block.getField('COLUMN')); break;
        }
      });
    }

    window.BlocklyTransformAutofill = {
      updateAllTransformationBlocksWithAutofill,
    };
  }

  waitForBlockly();
})();


