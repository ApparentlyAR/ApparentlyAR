// === To JSON Block Definition ===
(function(){
  if (typeof Blockly === 'undefined') return;

  // Define the block
  Blockly.defineBlocksWithJsonArray([
    {
      "type": "to_json",
      "message0": "to JSON %1",
      "args0": [
        {
          "type": "input_value",
          "name": "VALUE",
          "check": "Dataset"
        }
      ],
      "output": "String",
      "colour": 20,
      "tooltip": "Convert a Dataset (array of objects) to a pretty JSON string.",
      "helpUrl": ""
    }
  ]);

  // Register generator
  if (Blockly.JavaScript) {
    const generator = function(block) {
      const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_NONE) || 'null';
      // Wrap in async IIFE to handle potential Promises from advanced math blocks
      const code = `(async () => { const __result = await ${value}; return JSON.stringify(__result, null, 2); })()`;
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    try {
      Object.defineProperty(Blockly.JavaScript, 'to_json', { value: generator, configurable: true });
    } catch (_) {
      Blockly.JavaScript['to_json'] = generator;
    }

    if (Blockly.JavaScript.forBlock) {
      try {
        Object.defineProperty(Blockly.JavaScript.forBlock, 'to_json', { value: generator, configurable: true });
      } catch (_) {
        Blockly.JavaScript.forBlock['to_json'] = generator;
      }
    }

    if (typeof window !== 'undefined' && window.Blockly && window.Blockly.JavaScript) {
      try {
        Object.defineProperty(window.Blockly.JavaScript, 'to_json', { value: generator, configurable: true });
      } catch (_) {
        window.Blockly.JavaScript['to_json'] = generator;
      }
    }
  }
})();
