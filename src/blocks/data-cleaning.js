/**
 * Data Cleaning Blocks
 *
 * Blocks for data type conversion, column operations, and handling missing values
 * in the ApparentlyAR data visualization platform.
 */

// ---------------------------
// Block definitions (unchanged)
// ---------------------------
Blockly.defineBlocksWithJsonArray([
  // Convert Type Block
  {
    "type": "convert_type",
    "message0": "convert %1 to %2 in %3",
    "args0": [
      { "type": "field_column_dropdown", "name": "COLUMN" },
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [
          ["Number", "number"],
          ["Text", "text"],
          ["Date", "date"]
        ]
      },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
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
      { "type": "field_column_dropdown", "name": "COLUMN" },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
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
      { "type": "field_column_dropdown", "name": "OLD_NAME" },
      { "type": "field_input", "name": "NEW_NAME", "text": "new_name" },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
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
      { "type": "field_column_dropdown", "name": "COLUMN" },
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
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
    ],
    "output": "Dataset",
    "colour": 20,
    "tooltip": "Handle missing values in a column",
    "helpUrl": ""
  },

  // Handle Missing with explicit value
  {
    "type": "handle_missing_with_value",
    "message0": "handle missing values in %1 by filling with %2 in %3",
    "args0": [
      { "type": "field_column_dropdown", "name": "COLUMN" },
      { "type": "field_input", "name": "FILL_VALUE", "text": "0" },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
    ],
    "output": "Dataset",
    "colour": 20,
    "tooltip": "Fill missing values with a specific value",
    "helpUrl": ""
  }
]);

// ---------------------------
// Generators -> Professor only
// ---------------------------
(function () {
  if (typeof Blockly === 'undefined' || !Blockly.JavaScript) return;

  function datasetExpr(block) {
    return Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';
  }

  // Convert Type
  window.BlockUtils.registerBlock('convert_type', function (block) {
    const column = block.getFieldValue('COLUMN');
    const dataType = block.getFieldValue('TYPE');
    const ds = datasetExpr(block);

    const op = { type: 'convertType', params: { column, dataType } };
    const code = `
      (async function () {
        const inputData = ${ds};
        if (!inputData) throw new Error('No input dataset provided');
        const out = await window.AppAR.Professor.runSingle(inputData, ${JSON.stringify(op)});
        return out;
      })()
    `;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Drop Column
  window.BlockUtils.registerBlock('drop_column', function (block) {
    const column = block.getFieldValue('COLUMN');
    const ds = datasetExpr(block);

    const op = { type: 'dropColumn', params: { column } };
    const code = `
      (async function () {
        const inputData = ${ds};
        if (!inputData) throw new Error('No input dataset provided');
        const out = await window.AppAR.Professor.runSingle(inputData, ${JSON.stringify(op)});
        return out;
      })()
    `;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Rename Column
  window.BlockUtils.registerBlock('rename_column', function (block) {
    const oldName = block.getFieldValue('OLD_NAME');
    const newName = block.getFieldValue('NEW_NAME');
    const ds = datasetExpr(block);

    const op = { type: 'renameColumn', params: { oldName, newName } };
    const code = `
      (async function () {
        const inputData = ${ds};
        if (!inputData) throw new Error('No input dataset provided');
        const out = await window.AppAR.Professor.runSingle(inputData, ${JSON.stringify(op)});
        return out;
      })()
    `;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Handle Missing (remove / fill_average / fill_median / fill)
  window.BlockUtils.registerBlock('handle_missing', function (block) {
    const column = block.getFieldValue('COLUMN');
    const method = block.getFieldValue('METHOD'); // 'remove' | 'fill' | 'fill_average' | 'fill_median'
    const ds = datasetExpr(block);

    // Note: when method === 'fill', prefer using the dedicated "handle_missing_with_value" block to pass fillValue.
    const op = { type: 'handleMissing', params: { column, method } };
    const code = `
      (async function () {
        const inputData = ${ds};
        if (!inputData) throw new Error('No input dataset provided');
        const out = await window.AppAR.Professor.runSingle(inputData, ${JSON.stringify(op)});
        return out;
      })()
    `;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Handle Missing with explicit value
  window.BlockUtils.registerBlock('handle_missing_with_value', function (block) {
    const column = block.getFieldValue('COLUMN');
    const fillValue = block.getFieldValue('FILL_VALUE');
    const ds = datasetExpr(block);

    const op = { type: 'handleMissing', params: { column, method: 'fill', fillValue } };
    const code = `
      (async function () {
        const inputData = ${ds};
        if (!inputData) throw new Error('No input dataset provided');
        const out = await window.AppAR.Professor.runSingle(inputData, ${JSON.stringify(op)});
        return out;
      })()
    `;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

})();
