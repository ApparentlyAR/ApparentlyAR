/**
 * Advanced Statistical & Mathematical Blocks for Blockly
 *
 * Provides advanced mathematical operations including:
 * - Matrix operations (multiply, transpose, determinant, inverse)
 * - Trigonometric functions (sin, cos, tan and inverse functions)
 * - Logarithmic transformations
 * - Exponential smoothing
 * - Polynomial fitting
 * - Calculus basics (derivatives and integrals)
 *
 * These blocks are designed for educational purposes and integrate with
 * the backend mathematical processing API.
 *
 * @module AdvancedStatisticsBlocks
 * @version 1.0.0
 * @since 1.0.0
 */

(function(){
  // Wait for Blockly to be available
  function waitForBlockly() {
    if (typeof Blockly !== 'undefined' && Blockly.JavaScript) {
      initializeAdvancedStatisticsBlocks();
    } else {
      setTimeout(waitForBlockly, 10);
    }
  }

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

  function initializeAdvancedStatisticsBlocks() {
    Blockly.defineBlocksWithJsonArray([
      // Matrix Multiply Block
      {
        "type": "matrix_multiply",
        "message0": "multiply matrix A %1 by matrix B %2",
        "args0": [
          { "type": "input_value", "name": "MATRIX_A", "check": "Array" },
          { "type": "input_value", "name": "MATRIX_B", "check": "Array" }
        ],
        "output": "Array",
        "colour": 210,
        "tooltip": "Multiply two matrices (A × B). Columns of A must equal rows of B.",
        "helpUrl": ""
      },

      // Matrix Transpose Block
      {
        "type": "matrix_transpose",
        "message0": "transpose matrix %1",
        "args0": [
          { "type": "input_value", "name": "MATRIX", "check": "Array" }
        ],
        "output": "Array",
        "colour": 210,
        "tooltip": "Transpose a matrix (rows become columns)",
        "helpUrl": ""
      },

      // Matrix Determinant Block
      {
        "type": "matrix_determinant",
        "message0": "determinant of matrix %1",
        "args0": [
          { "type": "input_value", "name": "MATRIX", "check": "Array" }
        ],
        "output": "Number",
        "colour": 210,
        "tooltip": "Calculate determinant of a square matrix (2×2 or 3×3)",
        "helpUrl": ""
      },

      // Matrix Inverse Block
      {
        "type": "matrix_inverse",
        "message0": "inverse of matrix %1",
        "args0": [
          { "type": "input_value", "name": "MATRIX", "check": "Array" }
        ],
        "output": "Array",
        "colour": 210,
        "tooltip": "Calculate inverse of a 2×2 matrix",
        "helpUrl": ""
      },

      // Trigonometric Function Block
      {
        "type": "apply_trig_function",
        "message0": "apply %1 to %2 in %3 ( %4 ) → %5",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "FUNCTION",
            "options": [
              ["sin", "sin"],
              ["cos", "cos"],
              ["tan", "tan"],
              ["arcsin", "asin"],
              ["arccos", "acos"],
              ["arctan", "atan"]
            ],
            "SERIALIZABLE": true
          },
          { "type": "field_dropdown", "name": "COLUMN", "options": [["column", "column"]], "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" },
          {
            "type": "field_dropdown",
            "name": "ANGLE_UNIT",
            "options": [
              ["radians", "radians"],
              ["degrees", "degrees"]
            ],
            "SERIALIZABLE": true
          },
          { "type": "field_input", "name": "OUTPUT_COLUMN", "text": "trig_result" }
        ],
        "output": "Dataset",
        "colour": 210,
        "tooltip": "Apply trigonometric function to a column",
        "helpUrl": ""
      },

      // Logarithm Block
      {
        "type": "apply_logarithm",
        "message0": "log base %1 of %2 in %3 → %4",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "BASE",
            "options": [
              ["e (natural log)", "e"],
              ["10", "10"],
              ["2", "2"]
            ],
            "SERIALIZABLE": true
          },
          { "type": "field_dropdown", "name": "COLUMN", "options": [["column", "column"]], "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" },
          { "type": "field_input", "name": "OUTPUT_COLUMN", "text": "log_result" }
        ],
        "output": "Dataset",
        "colour": 210,
        "tooltip": "Apply logarithm transformation to a column",
        "helpUrl": ""
      },

      // Exponential Smoothing Block
      {
        "type": "exponential_smoothing",
        "message0": "smooth %1 in %2 with α = %3 → %4",
        "args0": [
          { "type": "field_dropdown", "name": "COLUMN", "options": [["column", "column"]], "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" },
          { "type": "field_number", "name": "ALPHA", "value": 0.3, "min": 0.01, "max": 1, "precision": 0.01 },
          { "type": "field_input", "name": "OUTPUT_COLUMN", "text": "smoothed" }
        ],
        "output": "Dataset",
        "colour": 210,
        "tooltip": "Apply exponential smoothing to a time series column. Alpha (α) controls smoothing strength.",
        "helpUrl": ""
      },

      // Polynomial Fitting Block
      {
        "type": "polynomial_fit",
        "message0": "fit degree %1 polynomial to X: %2 Y: %3 in %4 → %5",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "DEGREE",
            "options": [
              ["1 (linear)", "1"],
              ["2 (quadratic)", "2"],
              ["3 (cubic)", "3"]
            ],
            "SERIALIZABLE": true
          },
          { "type": "field_dropdown", "name": "COLUMN_X", "options": [["column_x", "column_x"]], "SERIALIZABLE": true },
          { "type": "field_dropdown", "name": "COLUMN_Y", "options": [["column_y", "column_y"]], "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" },
          { "type": "field_input", "name": "OUTPUT_COLUMN", "text": "fitted_values" }
        ],
        "output": "Dataset",
        "colour": 210,
        "tooltip": "Fit a polynomial to data using least squares regression",
        "helpUrl": ""
      },

      // Calculate Derivative Block
      {
        "type": "calculate_derivative",
        "message0": "derivative of Y: %1 w.r.t. X: %2 in %3 → %4",
        "args0": [
          { "type": "field_dropdown", "name": "COLUMN_Y", "options": [["column_y", "column_y"]], "SERIALIZABLE": true },
          { "type": "field_dropdown", "name": "COLUMN_X", "options": [["column_x", "column_x"]], "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" },
          { "type": "field_input", "name": "OUTPUT_COLUMN", "text": "derivative" }
        ],
        "output": "Dataset",
        "colour": 210,
        "tooltip": "Calculate numerical derivative (dy/dx) using finite differences",
        "helpUrl": ""
      },

      // Calculate Integral Block
      {
        "type": "calculate_integral",
        "message0": "integral of Y: %1 w.r.t. X: %2 in %3 → %4",
        "args0": [
          { "type": "field_dropdown", "name": "COLUMN_Y", "options": [["column_y", "column_y"]], "SERIALIZABLE": true },
          { "type": "field_dropdown", "name": "COLUMN_X", "options": [["column_x", "column_x"]], "SERIALIZABLE": true },
          { "type": "input_value", "name": "DATA", "check": "Dataset" },
          { "type": "field_input", "name": "OUTPUT_COLUMN", "text": "integral" }
        ],
        "output": "Dataset",
        "colour": 210,
        "tooltip": "Calculate cumulative integral using trapezoidal rule",
        "helpUrl": ""
      }
    ]);

    // JavaScript generators for each block
    if (Blockly.JavaScript) {
      // Global normalizer (reuse from statistics.js pattern)
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

      // Helper function to get data code safely
      function getDataCode(block) {
        try {
          const dataCode = Blockly.JavaScript.valueToCode(block, 'DATA', Blockly.JavaScript.ORDER_NONE);
          return dataCode || '(window.Blockly && window.Blockly.CsvImportData ? window.Blockly.CsvImportData.data : [])';
        } catch (e) {
          return '(window.Blockly && window.Blockly.CsvImportData ? window.Blockly.CsvImportData.data : [])';
        }
      }

      // Matrix Multiply Generator
      Blockly.JavaScript['matrix_multiply'] = function(block) {
        const matrixACode = Blockly.JavaScript.valueToCode(block, 'MATRIX_A', Blockly.JavaScript.ORDER_NONE) || '[[]]';
        const matrixBCode = Blockly.JavaScript.valueToCode(block, 'MATRIX_B', Blockly.JavaScript.ORDER_NONE) || '[[]]';

        const code = `(async () => {
          try {
            const matrixA = ${matrixACode};
            const matrixB = ${matrixBCode};
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData([], [{ type: 'matrixMultiply', params: { matrixA, matrixB } }]);
            return __res && __res.data ? __res.data : [[]];
          } catch (error) {
            console.error('Matrix multiply error:', error);
            return [[]];
          }
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Matrix Transpose Generator
      Blockly.JavaScript['matrix_transpose'] = function(block) {
        const matrixCode = Blockly.JavaScript.valueToCode(block, 'MATRIX', Blockly.JavaScript.ORDER_NONE) || '[[]]';

        const code = `(async () => {
          try {
            const matrix = ${matrixCode};
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData([], [{ type: 'matrixTranspose', params: { matrix } }]);
            return __res && __res.data ? __res.data : [[]];
          } catch (error) {
            console.error('Matrix transpose error:', error);
            return [[]];
          }
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Matrix Determinant Generator
      Blockly.JavaScript['matrix_determinant'] = function(block) {
        const matrixCode = Blockly.JavaScript.valueToCode(block, 'MATRIX', Blockly.JavaScript.ORDER_NONE) || '[[]]';

        const code = `(async () => {
          try {
            const matrix = ${matrixCode};
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData([], [{ type: 'matrixDeterminant', params: { matrix } }]);
            return __res && __res.data ? __res.data : 0;
          } catch (error) {
            console.error('Matrix determinant error:', error);
            return 0;
          }
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Matrix Inverse Generator
      Blockly.JavaScript['matrix_inverse'] = function(block) {
        const matrixCode = Blockly.JavaScript.valueToCode(block, 'MATRIX', Blockly.JavaScript.ORDER_NONE) || '[[]]';

        const code = `(async () => {
          try {
            const matrix = ${matrixCode};
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData([], [{ type: 'matrixInverse', params: { matrix } }]);
            return __res && __res.data ? __res.data : [[]];
          } catch (error) {
            console.error('Matrix inverse error:', error);
            return [[]];
          }
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Trigonometric Function Generator
      Blockly.JavaScript['apply_trig_function'] = function(block) {
        const dataCode = getDataCode(block);
        const column = block.getFieldValue('COLUMN') || 'column';
        const func = block.getFieldValue('FUNCTION') || 'sin';
        const angleUnit = block.getFieldValue('ANGLE_UNIT') || 'radians';
        const outputColumn = block.getFieldValue('OUTPUT_COLUMN') || 'trig_result';

        const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeOutputColumn = outputColumn.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{
              type: 'applyTrigFunction',
              params: {
                column: '${safeColumn}',
                function: '${func}',
                angleUnit: '${angleUnit}',
                outputColumn: '${safeOutputColumn}'
              }
            }]);
            const __data = (__res && __res.data) ? __res.data : __input;
            if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }
            return __data;
          } catch (error) {
            console.error('Trigonometric function error:', error);
            return (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
          }
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Logarithm Generator
      Blockly.JavaScript['apply_logarithm'] = function(block) {
        const dataCode = getDataCode(block);
        const column = block.getFieldValue('COLUMN') || 'column';
        const base = block.getFieldValue('BASE') || 'e';
        const outputColumn = block.getFieldValue('OUTPUT_COLUMN') || 'log_result';

        const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeOutputColumn = outputColumn.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{
              type: 'applyLogarithm',
              params: {
                column: '${safeColumn}',
                base: '${base}',
                outputColumn: '${safeOutputColumn}'
              }
            }]);
            const __data = (__res && __res.data) ? __res.data : __input;
            if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }
            return __data;
          } catch (error) {
            console.error('Logarithm error:', error);
            return (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
          }
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Exponential Smoothing Generator
      Blockly.JavaScript['exponential_smoothing'] = function(block) {
        const dataCode = getDataCode(block);
        const column = block.getFieldValue('COLUMN') || 'column';
        const alpha = block.getFieldValue('ALPHA') || 0.3;
        const outputColumn = block.getFieldValue('OUTPUT_COLUMN') || 'smoothed';

        const safeColumn = column.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeOutputColumn = outputColumn.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{
              type: 'exponentialSmoothing',
              params: {
                column: '${safeColumn}',
                alpha: ${alpha},
                outputColumn: '${safeOutputColumn}'
              }
            }]);
            const __data = (__res && __res.data) ? __res.data : __input;
            if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }
            return __data;
          } catch (error) {
            console.error('Exponential smoothing error:', error);
            return (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
          }
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Polynomial Fitting Generator
      Blockly.JavaScript['polynomial_fit'] = function(block) {
        const dataCode = getDataCode(block);
        const columnX = block.getFieldValue('COLUMN_X') || 'column_x';
        const columnY = block.getFieldValue('COLUMN_Y') || 'column_y';
        const degree = parseInt(block.getFieldValue('DEGREE') || '1');
        const outputColumn = block.getFieldValue('OUTPUT_COLUMN') || 'fitted_values';

        const safeColumnX = columnX.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeColumnY = columnY.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeOutputColumn = outputColumn.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{
              type: 'polynomialFit',
              params: {
                columnX: '${safeColumnX}',
                columnY: '${safeColumnY}',
                degree: ${degree},
                outputColumn: '${safeOutputColumn}'
              }
            }]);
            const __data = (__res && __res.data && __res.data.data) ? __res.data.data : __input;
            if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }
            return __data;
          } catch (error) {
            console.error('Polynomial fitting error:', error);
            return (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
          }
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Calculate Derivative Generator
      Blockly.JavaScript['calculate_derivative'] = function(block) {
        const dataCode = getDataCode(block);
        const columnX = block.getFieldValue('COLUMN_X') || 'column_x';
        const columnY = block.getFieldValue('COLUMN_Y') || 'column_y';
        const outputColumn = block.getFieldValue('OUTPUT_COLUMN') || 'derivative';

        const safeColumnX = columnX.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeColumnY = columnY.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeOutputColumn = outputColumn.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{
              type: 'calculateDerivative',
              params: {
                columnX: '${safeColumnX}',
                columnY: '${safeColumnY}',
                outputColumn: '${safeOutputColumn}'
              }
            }]);
            const __data = (__res && __res.data) ? __res.data : __input;
            if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }
            return __data;
          } catch (error) {
            console.error('Calculate derivative error:', error);
            return (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
          }
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Calculate Integral Generator
      Blockly.JavaScript['calculate_integral'] = function(block) {
        const dataCode = getDataCode(block);
        const columnX = block.getFieldValue('COLUMN_X') || 'column_x';
        const columnY = block.getFieldValue('COLUMN_Y') || 'column_y';
        const outputColumn = block.getFieldValue('OUTPUT_COLUMN') || 'integral';

        const safeColumnX = columnX.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeColumnY = columnY.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const safeOutputColumn = outputColumn.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const code = `(async () => {
          try {
            const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
            if (!Array.isArray(__input)) { throw new Error('Input data must be an array'); }
            if (!window.AppApi || !window.AppApi.processData) { throw new Error('API not available'); }
            const __res = await window.AppApi.processData(__input, [{
              type: 'calculateIntegral',
              params: {
                columnX: '${safeColumnX}',
                columnY: '${safeColumnY}',
                outputColumn: '${safeOutputColumn}'
              }
            }]);
            const __data = (__res && __res.data) ? __res.data : __input;
            if (window.Blockly && window.Blockly.CsvImportData) { window.Blockly.CsvImportData.data = __data; }
            return __data;
          } catch (error) {
            console.error('Calculate integral error:', error);
            return (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(${dataCode}) : (${dataCode} || []));
          }
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };
    }

    // Register forBlock mappings for newer Blockly generator API
    if (Blockly.JavaScript) {
      const js = Blockly.JavaScript;
      js.forBlock = js.forBlock || {};
      if (js['matrix_multiply'] && !js.forBlock['matrix_multiply']) js.forBlock['matrix_multiply'] = (block, generator) => js['matrix_multiply'](block, generator);
      if (js['matrix_transpose'] && !js.forBlock['matrix_transpose']) js.forBlock['matrix_transpose'] = (block, generator) => js['matrix_transpose'](block, generator);
      if (js['matrix_determinant'] && !js.forBlock['matrix_determinant']) js.forBlock['matrix_determinant'] = (block, generator) => js['matrix_determinant'](block, generator);
      if (js['matrix_inverse'] && !js.forBlock['matrix_inverse']) js.forBlock['matrix_inverse'] = (block, generator) => js['matrix_inverse'](block, generator);
      if (js['apply_trig_function'] && !js.forBlock['apply_trig_function']) js.forBlock['apply_trig_function'] = (block, generator) => js['apply_trig_function'](block, generator);
      if (js['apply_logarithm'] && !js.forBlock['apply_logarithm']) js.forBlock['apply_logarithm'] = (block, generator) => js['apply_logarithm'](block, generator);
      if (js['exponential_smoothing'] && !js.forBlock['exponential_smoothing']) js.forBlock['exponential_smoothing'] = (block, generator) => js['exponential_smoothing'](block, generator);
      if (js['polynomial_fit'] && !js.forBlock['polynomial_fit']) js.forBlock['polynomial_fit'] = (block, generator) => js['polynomial_fit'](block, generator);
      if (js['calculate_derivative'] && !js.forBlock['calculate_derivative']) js.forBlock['calculate_derivative'] = (block, generator) => js['calculate_derivative'](block, generator);
      if (js['calculate_integral'] && !js.forBlock['calculate_integral']) js.forBlock['calculate_integral'] = (block, generator) => js['calculate_integral'](block, generator);
    }

    console.log('[Advanced Statistics Blocks] Loaded successfully');
  }

  // Function to apply autofill to advanced statistics blocks
  function applyAutofillToAdvancedStatisticsBlock(block) {
    if (!block || !block.type) return;

    const blockType = block.type;
    const columns = getAvailableColumns();

    if (columns.length === 0) return;

    switch (blockType) {
      case 'apply_trig_function':
      case 'apply_logarithm':
      case 'exponential_smoothing':
        updateFieldWithColumns(block.getField('COLUMN'));
        break;
      case 'polynomial_fit':
        updateFieldWithColumns(block.getField('COLUMN_X'));
        updateFieldWithColumns(block.getField('COLUMN_Y'));
        break;
      case 'calculate_derivative':
      case 'calculate_integral':
        updateFieldWithColumns(block.getField('COLUMN_X'));
        updateFieldWithColumns(block.getField('COLUMN_Y'));
        break;
    }
  }

  // Function to update all advanced statistics blocks when CSV data is loaded
  function updateAllAdvancedStatisticsBlocksWithAutofill() {
    if (typeof Blockly === 'undefined' || !Blockly.getMainWorkspace) return;

    const workspace = Blockly.getMainWorkspace();
    if (!workspace) return;

    const allBlocks = workspace.getAllBlocks();
    allBlocks.forEach(block => {
      applyAutofillToAdvancedStatisticsBlock(block);
    });
  }

  // Add event listener for when blocks are created to apply autofill
  function addAdvancedStatisticsBlockCreationListener() {
    if (typeof Blockly === 'undefined' || !Blockly.getMainWorkspace) return;

    const workspace = Blockly.getMainWorkspace();
    if (!workspace) return;

    if (workspace.addChangeListener) {
      workspace.addChangeListener((event) => {
        if (event.type === Blockly.Events.BLOCK_CREATE) {
          const block = workspace.getBlockById(event.blockId);
          if (block) {
            setTimeout(() => {
              applyAutofillToAdvancedStatisticsBlock(block);
            }, 50);
          }
        }
      });
    }
  }

  // Try to add the listener when Blockly is available
  setTimeout(addAdvancedStatisticsBlockCreationListener, 1000);

  // Manual trigger function for testing and frontend use
  function triggerAdvancedStatisticsAutofill() {
    console.log('🔄 Triggering autofill for all advanced statistics blocks...');
    const columns = getAvailableColumns();
    console.log('📊 Available columns:', columns);

    if (columns.length === 0) {
      console.log('⚠️ No CSV data available for autofill');
      return;
    }

    updateAllAdvancedStatisticsBlocksWithAutofill();
    console.log('✅ Advanced statistics autofill triggered for all blocks');
  }

  // Export helper functions for autofill functionality
  window.BlocklyAdvancedStatisticsAutofill = {
    getAvailableColumns,
    updateFieldWithColumns,
    applyAutofillToAdvancedStatisticsBlock,
    updateAllAdvancedStatisticsBlocksWithAutofill,
    triggerAdvancedStatisticsAutofill
  };

  // Start waiting for Blockly
  waitForBlockly();
})();
