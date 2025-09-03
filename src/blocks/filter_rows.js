// === Filter Rows (with optional clean-null) ===
Blockly.defineBlocksWithJsonArray([{
  "type": "filter_rows",
  "message0": "Filter rows  data %1 field %2 op %3 value %4 %5 Clean null rows first",
  "args0": [
    { "type": "input_value",  "name": "DATA",  "check": "Dataset" },
    { "type": "field_input",  "name": "FIELD", "text": "" },
    { "type": "field_dropdown","name": "OP",
      "options": [
        ["=", "EQ"], ["!=", "NEQ"],
        [">", "GT"], [">=", "GTE"],
        ["<", "LT"], ["<=", "LTE"],
        ["contains", "CONTAINS"]
      ]
    },
    { "type": "input_value", "name": "VALUE" },
    { "type": "field_checkbox", "name": "CLEAN_FIRST", "checked": true }
  ],
  "output": "Dataset",
  "colour": 20
}]);

// Attach small utility helpers only once to the window
(function attachHelpers(){
  if (window.__filterHelpersAttached) return;
  window.__filterHelpersAttached = true;

  // Remove rows that contain null/empty/NA; optionally only check a single field
  window.cleanNullRows = function(ds, field){
    if (!Array.isArray(ds)) return [];
    return ds.filter(row=>{
      if (!row || typeof row !== 'object') return false;
      if (field){
        const v = row[field];
        return !(v === null || v === undefined || v === '' || v === 'NA');
      }
      for (const k in row){
        const v = row[k];
        if (v === null || v === undefined || v === '' || v === 'NA') return false;
      }
      return true;
    });
  };

  // Comparison helper used by the generator output
  window.compareByOp = function(left, op, right){
    if (op === 'CONTAINS') return String(left ?? '').includes(String(right ?? ''));
    const L = Number(left), R = Number(right);
    const num = !Number.isNaN(L) && !Number.isNaN(R);
    const a = num ? L : String(left ?? ''), b = num ? R : String(right ?? '');
    switch(op){
      case 'EQ':  return a == b;
      case 'NEQ': return a != b;
      case 'GT':  return a >  b;
      case 'GTE': return a >= b;
      case 'LT':  return a <  b;
      case 'LTE': return a <= b;
      default:    return false;
    }
  };
})();

// Legacy-style generator registration
Blockly.JavaScript['filter_rows'] = function(block){
  const dataCode   = Blockly.JavaScript.valueToCode(block, 'DATA', Blockly.JavaScript.ORDER_NONE) || '[]';
  const fieldName  = JSON.stringify(block.getFieldValue('FIELD') || '');
  const op         = JSON.stringify(block.getFieldValue('OP') || 'EQ');
  const valueCode  = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_NONE) || "''";
  const cleanFirst = block.getFieldValue('CLEAN_FIRST') === 'TRUE';

  const code = `
(() => {
  let __ds = ${dataCode};
  if (!Array.isArray(__ds)) __ds = [];
  ${cleanFirst ? `__ds = window.cleanNullRows(__ds);` : ``}
  const __field = ${fieldName};
  const __op    = ${op};
  const __val   = ${valueCode};
  return __ds.filter(r => window.compareByOp(r?.[__field], __op, __val));
})()
  `.trim();

  return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

// Safer registration that works with both new (forBlock) and legacy APIs
(function registerFilterRows() {
  // Get a handle to the JS generator (supports new and legacy APIs)
  const JS = (window.Blockly && (Blockly.JavaScript || window.javascriptGenerator)) || null;
  if (!JS) {
    console.error('[filter_rows] JavaScript generator not found. Load blockly/javascript_compressed.js first.');
    return;
  }

  // Define the block if it isn't already defined (no-op if it exists)
  if (!Blockly.Blocks['filter_rows']) {
    Blockly.defineBlocksWithJsonArray([{
      "type": "filter_rows",
      "message0": "Filter rows  data %1 field %2 op %3 value %4 %5 Clean null rows first",
      "args0": [
        { "type": "input_value",  "name": "DATA",  "check": null },
        { "type": "field_input",  "name": "FIELD", "text": "" },
        { "type": "field_dropdown","name": "OP",
          "options": [
            ["=", "EQ"], ["!=", "NEQ"],
            [">", "GT"], [">=", "GTE"],
            ["<", "LT"], ["<=", "LTE"],
            ["contains", "CONTAINS"]
          ]
        },
        { "type": "input_value", "name": "VALUE" },
        { "type": "field_checkbox", "name": "CLEAN_FIRST", "checked": true }
      ],
      "output": null,
      "colour": 20
    }]);
  }

  // Code generator function used for both APIs
  function emit(block) {
    const dataCode   = JS.valueToCode(block, 'DATA', JS.ORDER_NONE) || '[]';
    const fieldName  = JSON.stringify(block.getFieldValue('FIELD') || '');
    const op         = JSON.stringify(block.getFieldValue('OP') || 'EQ');
    const valueCode  = JS.valueToCode(block, 'VALUE', JS.ORDER_NONE) || "''";
    const cleanFirst = block.getFieldValue('CLEAN_FIRST') === 'TRUE';

    const code = `
(() => {
  let __ds = ${dataCode};
  if (!Array.isArray(__ds)) __ds = [];
  ${cleanFirst ? `__ds = __ds.filter(r=>{
    if (!r || typeof r !== 'object') return false;
    return Object.values(r).every(v => !(v===null || v===undefined || v==='' || v==='NA'));
  });` : ``}
  const __field = ${fieldName};
  const __op    = ${op};
  const __val   = ${valueCode};

  const cmp = function(left, op, right){
    if (op === 'CONTAINS') return String(left ?? '').includes(String(right ?? ''));
    const L = Number(left), R = Number(right);
    const num = !Number.isNaN(L) && !Number.isNaN(R);
    const a = num ? L : String(left ?? ''), b = num ? R : String(right ?? '');
    switch(op){case 'EQ':return a==b;case 'NEQ':return a!=b;case 'GT':return a>b;case 'GTE':return a>=b;case 'LT':return a<b;case 'LTE':return a<=b;default:return false;}
  };

  return __ds.filter(r => cmp(r?.[__field], __op, __val));
})()
    `.trim();

    return [code, JS.ORDER_FUNCTION_CALL];
  }

  // Register on both the new API (forBlock) and the legacy indexer API
  JS.forBlock = JS.forBlock || {};
  JS.forBlock['filter_rows'] = emit;   // New API (preferred)
  JS['filter_rows'] = emit;            // Legacy API

  console.log('[filter_rows] generator registered:',
    'forBlock=', typeof JS.forBlock?.['filter_rows'],
    'indexer=', typeof JS['filter_rows']);
})();

// --- CSV Import shim (exposes the last parsed dataset to Blockly code) ---
(function ensureCsvImportGenerator() {
  // Get the JS generator (new or legacy)
  const JS = (window.Blockly && (Blockly.JavaScript || window.javascriptGenerator)) || null;
  if (!JS) {
    console.error('[csv_import] No JavaScript generator. Load blockly & javascript_compressed.js first.');
    return;
  }

  // If the block isn't defined yet, create a minimal shim (won't clash if a fuller block exists)
  if (!Blockly.Blocks['csv_import']) {
    Blockly.defineBlocksWithJsonArray([{
      "type": "csv_import",
      "message0": "CSV import",
      "output": "Dataset",
      "colour": 20,
      "tooltip": "Returns the last parsed CSV dataset",
      "helpUrl": ""
    }]);
  }

  // Do not override an existing generator
  const hasGen =
    (typeof JS.forBlock?.['csv_import'] === 'function') ||
    (typeof JS['csv_import'] === 'function');

  if (hasGen) {
    console.log('[csv_import] generator already present');
    return;
  }

  // Generator: return the global dataset (UI/React should assign to one of these globals after parsing)
  function emit(/* block */) {
    const code = '(window.__CSV_DATA__ || window.__csvData || window.__lastCsvDataset || [])';
    return [code, JS.ORDER_ATOMIC];
  }

  JS.forBlock = JS.forBlock || {};
  JS.forBlock['csv_import'] = emit;   // New API
  JS['csv_import'] = emit;            // Legacy API

  console.log('[csv_import] shim generator attached');
})();

