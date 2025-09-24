/**
 * Statistical Analysis Blocks
 *
 * Blocks for descriptive statistics, correlation analysis, and basic statistical operations
 * in the ApparentlyAR data visualization platform.
 */

// ---------------------------
// Block definitions
// ---------------------------
Blockly.defineBlocksWithJsonArray([
  // Descriptive Statistics Block
  {
    "type": "descriptive_stats",
    "message0": "calculate stats for %1 in %2",
    "args0": [
      { "type": "field_column_dropdown", "name": "COLUMN" },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
    ],
    "output": "Statistics",
    "colour": 40,
    "tooltip": "Calculate mean, median, mode, standard deviation for a column",
    "helpUrl": ""
  },

  // Mean Block
  {
    "type": "calculate_mean",
    "message0": "mean of %1 in %2",
    "args0": [
      { "type": "field_column_dropdown", "name": "COLUMN" },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
    ],
    "output": "Number",
    "colour": 40,
    "tooltip": "Calculate the mean (average) of a numeric column",
    "helpUrl": ""
  },

  // Median Block
  {
    "type": "calculate_median",
    "message0": "median of %1 in %2",
    "args0": [
      { "type": "field_column_dropdown", "name": "COLUMN" },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
    ],
    "output": "Number",
    "colour": 40,
    "tooltip": "Calculate the median (middle value) of a numeric column",
    "helpUrl": ""
  },

  // Standard Deviation Block
  {
    "type": "calculate_std",
    "message0": "standard deviation of %1 in %2",
    "args0": [
      { "type": "field_column_dropdown", "name": "COLUMN" },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
    ],
    "output": "Number",
    "colour": 40,
    "tooltip": "Calculate the standard deviation of a numeric column",
    "helpUrl": ""
  },

  // Correlation Block
  {
    "type": "calculate_correlation",
    "message0": "correlation between %1 and %2 in %3",
    "args0": [
      { "type": "field_column_dropdown", "name": "COLUMN_X" },
      { "type": "field_column_dropdown", "name": "COLUMN_Y" },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
    ],
    "output": "Number",
    "colour": 40,
    "tooltip": "Calculate Pearson correlation coefficient between two numeric columns",
    "helpUrl": ""
  },

  // Outlier Detection Block
  {
    "type": "detect_outliers",
    "message0": "detect outliers in %1 using %2 method in %3",
    "args0": [
      { "type": "field_column_dropdown", "name": "COLUMN" },
      {
        "type": "field_dropdown",
        "name": "METHOD",
        "options": [
          ["IQR (Interquartile Range)", "iqr"],
          ["Z-Score", "zscore"],
          ["Modified Z-Score", "modified_zscore"]
        ]
      },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
    ],
    "output": "Dataset",
    "colour": 40,
    "tooltip": "Identify and mark outliers in a numeric column",
    "helpUrl": ""
  },

  // Frequency Count Block
  {
    "type": "frequency_count",
    "message0": "count frequencies of %1 in %2",
    "args0": [
      { "type": "field_column_dropdown", "name": "COLUMN" },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
    ],
    "output": "Dataset",
    "colour": 40,
    "tooltip": "Count frequency of unique values in a column",
    "helpUrl": ""
  },

  // Percentiles Block
  {
    "type": "calculate_percentiles",
    "message0": "percentiles %1 of %2 in %3",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "PERCENTILE",
        "options": [
          ["25th (Q1)", "25"],
          ["50th (Median)", "50"],
          ["75th (Q3)", "75"],
          ["90th", "90"],
          ["95th", "95"],
          ["99th", "99"]
        ]
      },
      { "type": "field_column_dropdown", "name": "COLUMN" },
      { "type": "input_value", "name": "DATASET", "check": "Dataset" }
    ],
    "output": "Number",
    "colour": 40,
    "tooltip": "Calculate specific percentile of a numeric column",
    "helpUrl": ""
  }
]);

// ---------------------------
// Code generators
// ---------------------------

(function () {
  'use strict';

  // Helper function to get dataset expression from input
  function datasetExpr(block) {
    const dsInput = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_ATOMIC);
    return dsInput || 'null';
  }

  // Descriptive Statistics Generator
  window.BlockUtils.registerBlock('descriptive_stats', function (block) {
    const column = block.getFieldValue('COLUMN');
    const ds = datasetExpr(block);

    const op = { type: 'descriptiveStats', params: { column } };
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

  // Mean Generator
  window.BlockUtils.registerBlock('calculate_mean', function (block) {
    const column = block.getFieldValue('COLUMN');
    const ds = datasetExpr(block);

    const op = { type: 'calculateMean', params: { column } };
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

  // Median Generator
  window.BlockUtils.registerBlock('calculate_median', function (block) {
    const column = block.getFieldValue('COLUMN');
    const ds = datasetExpr(block);

    const op = { type: 'calculateMedian', params: { column } };
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

  // Standard Deviation Generator
  window.BlockUtils.registerBlock('calculate_std', function (block) {
    const column = block.getFieldValue('COLUMN');
    const ds = datasetExpr(block);

    const op = { type: 'calculateStandardDeviation', params: { column } };
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

  // Correlation Generator
  window.BlockUtils.registerBlock('calculate_correlation', function (block) {
    const columnX = block.getFieldValue('COLUMN_X');
    const columnY = block.getFieldValue('COLUMN_Y');
    const ds = datasetExpr(block);

    const op = { type: 'calculateCorrelation', params: { columnX, columnY } };
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

  // Outlier Detection Generator
  window.BlockUtils.registerBlock('detect_outliers', function (block) {
    const column = block.getFieldValue('COLUMN');
    const method = block.getFieldValue('METHOD');
    const ds = datasetExpr(block);

    const op = { type: 'detectOutliers', params: { column, method } };
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

  // Frequency Count Generator
  window.BlockUtils.registerBlock('frequency_count', function (block) {
    const column = block.getFieldValue('COLUMN');
    const ds = datasetExpr(block);

    const op = { type: 'frequencyCount', params: { column } };
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

  // Percentiles Generator
  window.BlockUtils.registerBlock('calculate_percentiles', function (block) {
    const percentile = block.getFieldValue('PERCENTILE');
    const column = block.getFieldValue('COLUMN');
    const ds = datasetExpr(block);

    const op = { type: 'calculatePercentiles', params: { column, percentile: parseFloat(percentile) } };
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

console.log('[Statistics Blocks] Loaded successfully');