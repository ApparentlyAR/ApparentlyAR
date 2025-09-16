// === Data Processing Block (Backend) ===
(function(){
  if (typeof Blockly === 'undefined') return;

  Blockly.defineBlocksWithJsonArray([
    {
      "type": "process_data",
      "message0": "process dataset %1 drop empty in %2 filter %3 operator %4 value %5 select columns (comma) %6 sort by %7 direction %8 group by %9 agg column %10 agg op %11 alias %12 calculate expr %13 as %14",
      "args0": [
        { "type": "input_value", "name": "DATA", "check": "Dataset" },
        { "type": "field_input", "name": "DROP_EMPTY_COL", "text": "" },
        { "type": "field_input", "name": "FILTER_COL", "text": "" },
        { "type": "field_dropdown", "name": "FILTER_OP", "options": [
          ["equals", "equals"],
          ["not_equals", "not_equals"],
          ["greater_than", "greater_than"],
          ["less_than", "less_than"],
          ["greater_than_or_equal", "greater_than_or_equal"],
          ["less_than_or_equal", "less_than_or_equal"],
          ["contains", "contains"],
          ["starts_with", "starts_with"],
          ["ends_with", "ends_with"]
        ] },
        { "type": "field_input", "name": "FILTER_VAL", "text": "" },
        { "type": "field_input", "name": "SELECT_COLS", "text": "" },
        { "type": "field_input", "name": "SORT_COL", "text": "" },
        { "type": "field_dropdown", "name": "SORT_DIR", "options": [["asc","asc"],["desc","desc"]] },
        { "type": "field_input", "name": "GROUP_COL", "text": "" },
        { "type": "field_input", "name": "AGG_COL", "text": "" },
        { "type": "field_dropdown", "name": "AGG_OP", "options": [["sum","sum"],["average","average"],["count","count"],["min","min"],["max","max"]] },
        { "type": "field_input", "name": "AGG_ALIAS", "text": "value" },
        { "type": "field_input", "name": "CALC_EXPR", "text": "" },
        { "type": "field_input", "name": "CALC_NAME", "text": "newValue" }
      ],
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Process data via backend with optional cleanup and transformations.",
      "helpUrl": ""
    }
  ]);

  // JavaScript generator
  if (Blockly.JavaScript) {
    const generator = function(block) {
      const dataCode = Blockly.JavaScript.valueToCode(block, 'DATA', Blockly.JavaScript.ORDER_NONE) || 'Blockly.CsvImportData.data';
      const dropCol = block.getFieldValue('DROP_EMPTY_COL') || '';
      const fCol = block.getFieldValue('FILTER_COL') || '';
      const fOp = block.getFieldValue('FILTER_OP') || 'equals';
      const fVal = block.getFieldValue('FILTER_VAL') || '';
      const selectCols = block.getFieldValue('SELECT_COLS') || '';
      const sortCol = block.getFieldValue('SORT_COL') || '';
      const sortDir = block.getFieldValue('SORT_DIR') || 'asc';
      const groupCol = block.getFieldValue('GROUP_COL') || '';
      const aggCol = block.getFieldValue('AGG_COL') || '';
      const aggOp = block.getFieldValue('AGG_OP') || 'sum';
      const aggAlias = block.getFieldValue('AGG_ALIAS') || 'value';
      const calcExpr = block.getFieldValue('CALC_EXPR') || '';
      const calcName = block.getFieldValue('CALC_NAME') || '';

      // Build operations at runtime in generated code
      const code = `(async () => {\n` +
        `  const __input = ${dataCode} || [];\n` +
        `  const __ops = [];\n` +
        `  if ('${dropCol}'.trim()) { __ops.push({ type: 'filter', params: { column: '${dropCol}', operator: 'not_equals', value: '' } }); }\n` +
        `  if ('${fCol}'.trim() && '${fVal}'.trim()) { __ops.push({ type: 'filter', params: { column: '${fCol}', operator: '${fOp}', value: '${fVal}' } }); }\n` +
        `  if ('${selectCols}'.trim()) { __ops.push({ type: 'select', params: { columns: '${selectCols}'.split(',').map(s=>s.trim()).filter(Boolean) } }); }\n` +
        `  if ('${calcExpr}'.trim() && '${calcName}'.trim()) { __ops.push({ type: 'calculate', params: { expression: \`${calcExpr}\`, newColumnName: '${calcName}' } }); }\n` +
        `  if ('${sortCol}'.trim()) { __ops.push({ type: 'sort', params: { column: '${sortCol}', direction: '${sortDir}' } }); }\n` +
        `  if ('${groupCol}'.trim() && '${aggCol}'.trim()) { __ops.push({ type: 'groupBy', params: { groupBy: '${groupCol}', aggregations: [{ column: '${aggCol}', operation: '${aggOp}', alias: '${aggAlias}' }] } }); }\n` +
        `  if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }\n` +
        `  const __res = await window.AppApi.processData(__input, __ops);\n` +
        `  const __data = (__res && __res.data) ? __res.data : __input;\n` +
        `  if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }\n` +
        `  return __data;\n` +
        `})()`;

      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    try {
      Object.defineProperty(Blockly.JavaScript, 'process_data', { value: generator, configurable: true });
    } catch (_) {
      Blockly.JavaScript['process_data'] = generator;
    }

    if (Blockly.JavaScript.forBlock) {
      try {
        Object.defineProperty(Blockly.JavaScript.forBlock, 'process_data', { value: generator, configurable: true });
      } catch (_) {
        Blockly.JavaScript.forBlock['process_data'] = generator;
      }
    }
  }
})();
