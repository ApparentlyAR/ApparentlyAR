/**
 * Visualization Blocks for Blockly
 *
 * Provides comprehensive chart configuration and generation blocks for creating
 * visualizations using Chart.js through the backend chart generation API.
 *
 * These blocks integrate with the backend chartGenerator.js to create bar charts,
 * line charts, scatter plots, pie charts, histograms, box plots, heatmaps, and more.
 *
 * @module VisualizationBlocks
 * @version 1.0.0
 * @since 1.0.0
 */

(function(){
  // Wait for Blockly to be available
  function waitForBlockly() {
    if (typeof Blockly !== 'undefined' && Blockly.JavaScript) {
      initializeVisualizationBlocks();
    } else {
      setTimeout(waitForBlockly, 10);
    }
  }

  // Use existing autofill infrastructure from data_ops.js
  function getAvailableColumns() {
    console.log('📊 [Visualization getAvailableColumns] Checking for available columns...');
    
    // Use the global autofill system if available
    if (window.BlocklyAutofill && window.BlocklyAutofill.getAvailableColumns) {
      console.log('📊 [Visualization getAvailableColumns] Using global BlocklyAutofill system');
      const columns = window.BlocklyAutofill.getAvailableColumns();
      console.log('📊 [Visualization getAvailableColumns] Got columns from global system:', columns);
      return columns;
    }
    
    console.log('📊 [Visualization getAvailableColumns] Using fallback - direct CSV access');
    
    // Fallback to direct access
    const csvData = window.Blockly && window.Blockly.CsvImportData && window.Blockly.CsvImportData.data;
    console.log('📊 [Visualization getAvailableColumns] CSV data available:', !!csvData, 'isArray:', Array.isArray(csvData), 'length:', csvData ? csvData.length : 0);
    
    if (csvData && Array.isArray(csvData) && csvData.length > 0) {
      const columns = Object.keys(csvData[0]);
      console.log('📊 [Visualization getAvailableColumns] Extracted columns from CSV:', columns);
      return columns;
    }
    
    console.log('📊 [Visualization getAvailableColumns] No columns found');
    return [];
  }

  // Use existing updateFieldWithColumns from data_ops.js
  function updateFieldWithColumns(field, isMultiSelect = false) {
    console.log('🔧 [Visualization updateFieldWithColumns] Called with field:', !!field, 'isMultiSelect:', isMultiSelect);
    
    if (!field) {
      console.log('🔧 [Visualization updateFieldWithColumns] No field provided');
      return;
    }
    
    console.log('🔧 [Visualization updateFieldWithColumns] Field type:', typeof field, 'has setOptions:', !!field.setOptions);
    
    // Use the global autofill system if available
    if (window.BlocklyAutofill && window.BlocklyAutofill.updateFieldWithColumns) {
      console.log('🔧 [Visualization updateFieldWithColumns] Using global BlocklyAutofill system');
      return window.BlocklyAutofill.updateFieldWithColumns(field, isMultiSelect);
    }
    
    console.log('🔧 [Visualization updateFieldWithColumns] Using fallback implementation');
    
    // Fallback implementation
    if (field && field.setOptions) {
      const columns = getAvailableColumns();
      console.log('🔧 [Visualization updateFieldWithColumns] Available columns:', columns);
      
      if (columns.length > 0) {
        const options = isMultiSelect
          ? [['All columns', 'all'], ...columns.map(col => [col, col])]
          : columns.map(col => [col, col]);
        console.log('🔧 [Visualization updateFieldWithColumns] Setting options:', options);
        field.setOptions(options);
        console.log('🔧 [Visualization updateFieldWithColumns] Options set successfully');
      } else {
        console.log('🔧 [Visualization updateFieldWithColumns] No columns available');
      }
    } else {
      console.log('🔧 [Visualization updateFieldWithColumns] Field does not have setOptions method');
    }
  }

  function initializeVisualizationBlocks() {
    Blockly.defineBlocksWithJsonArray([
      // Set Chart Type Block
      {
        "type": "set_chart_type",
        "message0": "set chart type to %1",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "CHART_TYPE",
            "options": [
              ["Bar Chart", "bar"],
              ["Line Chart", "line"],
              ["Scatter Plot", "scatter"],
              ["Pie Chart", "pie"],
              ["Doughnut Chart", "doughnut"],
              ["Area Chart", "area"],
              ["Histogram", "histogram"],
              ["Box Plot", "boxplot"],
              ["Heatmap", "heatmap"],
              ["Radar Chart", "radar"]
            ]
          }
        ],
        "output": "ChartConfig",
        "colour": 330,
        "tooltip": "Create a chart configuration with specified type",
        "helpUrl": ""
      },

      // Set Axes Block
      {
        "type": "set_axes",
        "message0": "set X-axis to %1 Y-axis to %2 from %3",
        "args0": [
          { "type": "field_dropdown", "name": "X_COLUMN", "options": [["column", "column"]] },
          { "type": "field_dropdown", "name": "Y_COLUMN", "options": [["column", "column"]] },
          { "type": "input_value", "name": "CONFIG", "check": "ChartConfig" }
        ],
        "output": "ChartConfig",
        "colour": 330,
        "tooltip": "Set X and Y axis columns for chart",
        "helpUrl": ""
      },

      // Chart Options Block
      {
        "type": "chart_options",
        "message0": "set chart title to %1 from %2",
        "args0": [
          { "type": "field_input", "name": "TITLE", "text": "My Chart" },
          { "type": "input_value", "name": "CONFIG", "check": "ChartConfig" }
        ],
        "output": "ChartConfig",
        "colour": 330,
        "tooltip": "Set basic chart options like title",
        "helpUrl": ""
      },

      // Advanced Chart Options Block
      {
        "type": "advanced_chart_options",
        "message0": "set chart title %1 colors %2 show legend %3 from %4",
        "args0": [
          { "type": "field_input", "name": "TITLE", "text": "My Chart" },
          {
            "type": "field_dropdown",
            "name": "COLOR_SCHEME",
            "options": [
              ["Default", "default"],
              ["Blue", "blue"],
              ["Green", "green"],
              ["Red", "red"],
              ["Purple", "purple"],
              ["Rainbow", "rainbow"]
            ]
          },
          {
            "type": "field_dropdown",
            "name": "SHOW_LEGEND",
            "options": [
              ["Yes", "true"],
              ["No", "false"]
            ]
          },
          { "type": "input_value", "name": "CONFIG", "check": "ChartConfig" }
        ],
        "output": "ChartConfig",
        "colour": 330,
        "tooltip": "Set advanced chart options including colors and legend",
        "helpUrl": ""
      },

      // Generate Visualization Block
      {
        "type": "generate_visualization",
        "message0": "create visualization with %1 using data %2",
        "args0": [
          { "type": "input_value", "name": "CONFIG", "check": "ChartConfig" },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 330,
        "tooltip": "Generate and display chart using configuration and data",
        "helpUrl": ""
      },

      // Quick Chart Block
      {
        "type": "quick_chart",
        "message0": "create %1 chart with X-axis %2 Y-axis %3 title %4 from %5",
        "args0": [
          {
            "type": "field_dropdown",
            "name": "CHART_TYPE",
            "options": [
              ["bar", "bar"],
              ["line", "line"],
              ["scatter", "scatter"],
              ["pie", "pie"],
              ["area", "area"]
            ]
          },
          { "type": "field_dropdown", "name": "X_COLUMN", "options": [["column", "column"]] },
          { "type": "field_dropdown", "name": "Y_COLUMN", "options": [["column", "column"]] },
          { "type": "field_input", "name": "TITLE", "text": "Chart" },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 330,
        "tooltip": "Quick one-step chart creation",
        "helpUrl": ""
      },

      // Histogram Config Block
      {
        "type": "histogram_config",
        "message0": "create histogram of %1 with %2 bins title %3 from %4",
        "args0": [
          { "type": "field_dropdown", "name": "VALUE_COLUMN", "options": [["column", "column"]] },
          { "type": "field_number", "name": "BINS", "value": 10, "min": 1, "max": 100 },
          { "type": "field_input", "name": "TITLE", "text": "Histogram" },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 330,
        "tooltip": "Create histogram with specified number of bins",
        "helpUrl": ""
      },

      // Box Plot Config Block
      {
        "type": "boxplot_config",
        "message0": "create box plot of %1 grouped by %2 title %3 from %4",
        "args0": [
          { "type": "field_dropdown", "name": "VALUE_COLUMN", "options": [["column", "column"]] },
          { "type": "field_dropdown", "name": "GROUP_COLUMN", "options": [["none", "none"], ["column", "column"]] },
          { "type": "field_input", "name": "TITLE", "text": "Box Plot" },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 330,
        "tooltip": "Create box plot with optional grouping",
        "helpUrl": ""
      },

      // Heatmap Config Block
      {
        "type": "heatmap_config",
        "message0": "create heatmap X-axis %1 Y-axis %2 values %3 title %4 from %5",
        "args0": [
          { "type": "field_dropdown", "name": "X_COLUMN", "options": [["column", "column"]] },
          { "type": "field_dropdown", "name": "Y_COLUMN", "options": [["column", "column"]] },
          { "type": "field_dropdown", "name": "VALUE_COLUMN", "options": [["column", "column"]] },
          { "type": "field_input", "name": "TITLE", "text": "Heatmap" },
          { "type": "input_value", "name": "DATA", "check": "Dataset" }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 330,
        "tooltip": "Create heatmap visualization",
        "helpUrl": ""
      }
    ]);

    // JavaScript generators for each block
    if (Blockly.JavaScript) {
      // Global normalizer (reuse from data_ops.js pattern)
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

      // Helper function to get config code safely
      function getConfigCode(block) {
        try {
          const configCode = Blockly.JavaScript.valueToCode(block, 'CONFIG', Blockly.JavaScript.ORDER_NONE);
          return configCode || '{}';
        } catch (e) {
          return '{}';
        }
      }

      // Set Chart Type Generator
      Blockly.JavaScript['set_chart_type'] = function(block) {
        const chartType = block.getFieldValue('CHART_TYPE') || 'bar';

        const code = `({ chartType: '${chartType}', options: {} })`;

        return [code, Blockly.JavaScript.ORDER_ATOMIC];
      };

      // Set Axes Generator
      Blockly.JavaScript['set_axes'] = function(block) {
        const xColumn = block.getFieldValue('X_COLUMN') || 'column';
        const yColumn = block.getFieldValue('Y_COLUMN') || 'column';
        const configCode = getConfigCode(block);

        const code = `(function() {
          const config = ${configCode};
          return {
            ...config,
            options: {
              ...(config.options || {}),
              xColumn: '${xColumn}',
              yColumn: '${yColumn}'
            }
          };
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Chart Options Generator
      Blockly.JavaScript['chart_options'] = function(block) {
        const title = block.getFieldValue('TITLE') || 'My Chart';
        const configCode = getConfigCode(block);

        const safeTitle = title.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const code = `(function() {
          const config = ${configCode};
          return {
            ...config,
            options: {
              ...(config.options || {}),
              title: '${safeTitle}'
            }
          };
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Advanced Chart Options Generator
      Blockly.JavaScript['advanced_chart_options'] = function(block) {
        const title = block.getFieldValue('TITLE') || 'My Chart';
        const colorScheme = block.getFieldValue('COLOR_SCHEME') || 'default';
        const showLegend = block.getFieldValue('SHOW_LEGEND') === 'true';
        const configCode = getConfigCode(block);

        const safeTitle = title.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const code = `(function() {
          const config = ${configCode};
          return {
            ...config,
            options: {
              ...(config.options || {}),
              title: '${safeTitle}',
              colorScheme: '${colorScheme}',
              showLegend: ${showLegend}
            }
          };
        })()`;

        return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
      };

      // Generate Visualization Generator
      Blockly.JavaScript['generate_visualization'] = function(block) {
        const configCode = getConfigCode(block);
        const dataCode = getDataCode(block);

        const code = `(async () => {
  try {
    const config = ${configCode};
    let __rawData = ${dataCode};
    
    // If the data is a Promise (from async data blocks), await it
    if (__rawData && typeof __rawData.then === 'function') {
      __rawData = await __rawData;
    }
    
    const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(__rawData) : (__rawData || []));

    if (!Array.isArray(__input) || __input.length === 0) {
      console.error('[generate_visualization] No data available');
      if (window.reactSetOutput) window.reactSetOutput('Error: No data available for visualization');
      if (window.reactSetError) window.reactSetError(true);
      return;
    }

    if (!config.chartType) {
      console.error('[generate_visualization] No chart type specified');
      if (window.reactSetOutput) window.reactSetOutput('Error: No chart type specified');
      if (window.reactSetError) window.reactSetError(true);
      return;
    }

    console.log('[generate_visualization] Generating chart:', config.chartType, 'with options:', config.options);

    if (!window.AppApi || !window.AppApi.generateChart) {
      throw new Error('Chart API not available');
    }

    const chartResult = await window.AppApi.generateChart(__input, config.chartType, config.options || {});
    console.log('[generate_visualization] Chart generated:', chartResult);

    // Trigger chart display event
    window.dispatchEvent(new CustomEvent('chartGenerated', {
      detail: {
        config: chartResult.config,
        chartType: config.chartType,
        data: __input
      }
    }));

    if (window.reactSetOutput) window.reactSetOutput('Chart generated successfully: ' + config.chartType);
    if (window.reactSetError) window.reactSetError(false);

  } catch (error) {
    console.error('[generate_visualization] Error:', error);
    if (window.reactSetOutput) window.reactSetOutput('Error: ' + error.message);
    if (window.reactSetError) window.reactSetError(true);
  }
})();
`;

        return code;
      };

      // Quick Chart Generator
      Blockly.JavaScript['quick_chart'] = function(block) {
        const chartType = block.getFieldValue('CHART_TYPE') || 'bar';
        const xColumn = block.getFieldValue('X_COLUMN') || 'column';
        const yColumn = block.getFieldValue('Y_COLUMN') || 'column';
        const title = block.getFieldValue('TITLE') || 'Chart';
        const dataCode = getDataCode(block);

        const safeTitle = title.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const code = `(async () => {
  try {
    let __rawData = ${dataCode};
    
    // If the data is a Promise (from async data blocks), await it
    if (__rawData && typeof __rawData.then === 'function') {
      __rawData = await __rawData;
    }
    
    const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(__rawData) : (__rawData || []));

    if (!Array.isArray(__input) || __input.length === 0) {
      console.error('[quick_chart] No data available');
      if (window.reactSetOutput) window.reactSetOutput('Error: No data available for chart');
      if (window.reactSetError) window.reactSetError(true);
      return;
    }

    // Check if columns are placeholders
    const isPlaceholder = '${xColumn}' === 'column' || '${yColumn}' === 'column';
    if (isPlaceholder) {
      console.warn('[quick_chart] Using placeholder column names');
      if (window.reactSetOutput) window.reactSetOutput('Warning: Please select valid columns');
      return;
    }

    console.log('[quick_chart] Creating ${chartType} chart');

    if (!window.AppApi || !window.AppApi.generateChart) {
      throw new Error('Chart API not available');
    }

    const chartResult = await window.AppApi.generateChart(__input, '${chartType}', {
      xColumn: '${xColumn}',
      yColumn: '${yColumn}',
      title: '${safeTitle}'
    });

    console.log('[quick_chart] Chart generated:', chartResult);

    // Trigger chart display event
    window.dispatchEvent(new CustomEvent('chartGenerated', {
      detail: {
        config: chartResult.config,
        chartType: '${chartType}',
        data: __input
      }
    }));

    if (window.reactSetOutput) window.reactSetOutput('Chart created: ${safeTitle}');
    if (window.reactSetError) window.reactSetError(false);

  } catch (error) {
    console.error('[quick_chart] Error:', error);
    if (window.reactSetOutput) window.reactSetOutput('Error: ' + error.message);
    if (window.reactSetError) window.reactSetError(true);
  }
})();
`;

        return code;
      };

      // Histogram Config Generator
      Blockly.JavaScript['histogram_config'] = function(block) {
        const valueColumn = block.getFieldValue('VALUE_COLUMN') || 'column';
        const bins = block.getFieldValue('BINS') || 10;
        const title = block.getFieldValue('TITLE') || 'Histogram';
        const dataCode = getDataCode(block);

        const safeTitle = title.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const code = `(async () => {
  try {
    let __rawData = ${dataCode};
    
    // If the data is a Promise (from async data blocks), await it
    if (__rawData && typeof __rawData.then === 'function') {
      __rawData = await __rawData;
    }
    
    const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(__rawData) : (__rawData || []));

    if (!Array.isArray(__input) || __input.length === 0) {
      throw new Error('No data available');
    }

    if (!window.AppApi || !window.AppApi.generateChart) {
      throw new Error('Chart API not available');
    }

    const chartResult = await window.AppApi.generateChart(__input, 'histogram', {
      valueColumn: '${valueColumn}',
      bins: ${bins},
      title: '${safeTitle}'
    });

    window.dispatchEvent(new CustomEvent('chartGenerated', {
      detail: {
        config: chartResult.config,
        chartType: 'histogram',
        data: __input
      }
    }));

    if (window.reactSetOutput) window.reactSetOutput('Histogram created: ${safeTitle}');
    if (window.reactSetError) window.reactSetError(false);

  } catch (error) {
    console.error('[histogram_config] Error:', error);
    if (window.reactSetOutput) window.reactSetOutput('Error: ' + error.message);
    if (window.reactSetError) window.reactSetError(true);
  }
})();
`;

        return code;
      };

      // Box Plot Config Generator
      Blockly.JavaScript['boxplot_config'] = function(block) {
        const valueColumn = block.getFieldValue('VALUE_COLUMN') || 'column';
        const groupColumn = block.getFieldValue('GROUP_COLUMN');
        const title = block.getFieldValue('TITLE') || 'Box Plot';
        const dataCode = getDataCode(block);

        const safeTitle = title.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const hasGrouping = groupColumn && groupColumn !== 'none';

        const code = `(async () => {
  try {
    let __rawData = ${dataCode};
    
    // If the data is a Promise (from async data blocks), await it
    if (__rawData && typeof __rawData.then === 'function') {
      __rawData = await __rawData;
    }
    
    const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(__rawData) : (__rawData || []));

    if (!Array.isArray(__input) || __input.length === 0) {
      throw new Error('No data available');
    }

    if (!window.AppApi || !window.AppApi.generateChart) {
      throw new Error('Chart API not available');
    }

    const options = {
      valueColumn: '${valueColumn}',
      title: '${safeTitle}'
    };

    ${hasGrouping ? `options.groupColumn = '${groupColumn}';` : ''}

    const chartResult = await window.AppApi.generateChart(__input, 'boxplot', options);

    window.dispatchEvent(new CustomEvent('chartGenerated', {
      detail: {
        config: chartResult.config,
        chartType: 'boxplot',
        data: __input
      }
    }));

    if (window.reactSetOutput) window.reactSetOutput('Box plot created: ${safeTitle}');
    if (window.reactSetError) window.reactSetError(false);

  } catch (error) {
    console.error('[boxplot_config] Error:', error);
    if (window.reactSetOutput) window.reactSetOutput('Error: ' + error.message);
    if (window.reactSetError) window.reactSetError(true);
  }
})();
`;

        return code;
      };

      // Heatmap Config Generator
      Blockly.JavaScript['heatmap_config'] = function(block) {
        const xColumn = block.getFieldValue('X_COLUMN') || 'column';
        const yColumn = block.getFieldValue('Y_COLUMN') || 'column';
        const valueColumn = block.getFieldValue('VALUE_COLUMN') || 'column';
        const title = block.getFieldValue('TITLE') || 'Heatmap';
        const dataCode = getDataCode(block);

        const safeTitle = title.replace(/'/g, "\\'").replace(/"/g, '\\"');

        const code = `(async () => {
  try {
    let __rawData = ${dataCode};
    
    // If the data is a Promise (from async data blocks), await it
    if (__rawData && typeof __rawData.then === 'function') {
      __rawData = await __rawData;
    }
    
    const __input = (window.BlocklyNormalizeData ? window.BlocklyNormalizeData(__rawData) : (__rawData || []));

    if (!Array.isArray(__input) || __input.length === 0) {
      throw new Error('No data available');
    }

    if (!window.AppApi || !window.AppApi.generateChart) {
      throw new Error('Chart API not available');
    }

    const chartResult = await window.AppApi.generateChart(__input, 'heatmap', {
      xColumn: '${xColumn}',
      yColumn: '${yColumn}',
      valueColumn: '${valueColumn}',
      title: '${safeTitle}'
    });

    window.dispatchEvent(new CustomEvent('chartGenerated', {
      detail: {
        config: chartResult.config,
        chartType: 'heatmap',
        data: __input
      }
    }));

    if (window.reactSetOutput) window.reactSetOutput('Heatmap created: ${safeTitle}');
    if (window.reactSetError) window.reactSetError(false);

  } catch (error) {
    console.error('[heatmap_config] Error:', error);
    if (window.reactSetOutput) window.reactSetOutput('Error: ' + error.message);
    if (window.reactSetError) window.reactSetError(true);
  }
})();
`;

        return code;
      };
    }

    // Register forBlock mappings for newer Blockly generator API
    if (Blockly.JavaScript) {
      const js = Blockly.JavaScript;
      js.forBlock = js.forBlock || {};

      const blocks = [
        'set_chart_type',
        'set_axes',
        'chart_options',
        'advanced_chart_options',
        'generate_visualization',
        'quick_chart',
        'histogram_config',
        'boxplot_config',
        'heatmap_config'
      ];

      blocks.forEach(blockType => {
        if (js[blockType] && !js.forBlock[blockType]) {
          js.forBlock[blockType] = (block, generator) => js[blockType](block, generator);
        }
      });
    }

    console.log('[Visualization Blocks] Loaded successfully');
  }

  // Function to apply autofill to visualization blocks - integrates with data_ops autofill system
  function applyAutofillToVisualizationBlock(block) {
    if (!block || !block.type) return;

    const blockType = block.type;
    const columns = getAvailableColumns();

    // Only process visualization blocks
    const visualizationBlocks = [
      'set_axes', 'quick_chart', 'histogram_config', 
      'boxplot_config', 'heatmap_config'
    ];
    
    if (!visualizationBlocks.includes(blockType)) {
      return; // Not a visualization block
    }

    console.log('🔧 [Visualization Autofill] Processing block:', blockType, 'with columns:', columns);

    if (columns.length === 0) {
      console.log('🔧 [Visualization Autofill] No columns available for block:', blockType);
      return; // No CSV data available
    }

    console.log('🔧 [Visualization Autofill] Updating fields for block:', blockType);

    switch (blockType) {
      case 'set_axes':
        console.log('🔧 [Visualization Autofill] Updating set_axes fields');
        const xField = block.getField('X_COLUMN');
        const yField = block.getField('Y_COLUMN');
        console.log('🔧 [Visualization Autofill] X_COLUMN field:', !!xField, 'Y_COLUMN field:', !!yField);
        updateFieldWithColumns(xField);
        updateFieldWithColumns(yField);
        break;
      case 'quick_chart':
        console.log('🔧 [Visualization Autofill] Updating quick_chart fields');
        updateFieldWithColumns(block.getField('X_COLUMN'));
        updateFieldWithColumns(block.getField('Y_COLUMN'));
        break;
      case 'histogram_config':
        console.log('🔧 [Visualization Autofill] Updating histogram_config fields');
        updateFieldWithColumns(block.getField('VALUE_COLUMN'));
        break;
      case 'boxplot_config':
        console.log('🔧 [Visualization Autofill] Updating boxplot_config fields');
        updateFieldWithColumns(block.getField('VALUE_COLUMN'));
        const groupField = block.getField('GROUP_COLUMN');
        if (groupField && groupField.setOptions) {
          const options = [['none', 'none'], ...columns.map(col => [col, col])];
          groupField.setOptions(options);
          console.log('🔧 [Visualization Autofill] Updated GROUP_COLUMN options');
        }
        break;
      case 'heatmap_config':
        console.log('🔧 [Visualization Autofill] Updating heatmap_config fields');
        updateFieldWithColumns(block.getField('X_COLUMN'));
        updateFieldWithColumns(block.getField('Y_COLUMN'));
        updateFieldWithColumns(block.getField('VALUE_COLUMN'));
        break;
    }
    
    console.log('🔧 [Visualization Autofill] Finished processing block:', blockType);
  }

  // Function to update all visualization blocks when CSV data is loaded
  function updateAllVisualizationBlocksWithAutofill() {
    console.log('📊 [Visualization Autofill] updateAllVisualizationBlocksWithAutofill called');
    const columns = getAvailableColumns();
    console.log('📊 [Visualization Autofill] Available columns:', columns);
    
    // Always use the fallback implementation to ensure visualization blocks are processed
    // The integrated system may not be calling the extended function properly
    console.log('📊 [Visualization Autofill] Using direct fallback implementation to ensure processing');
    if (typeof Blockly === 'undefined' || !Blockly.getMainWorkspace) {
      console.warn('📊 [Visualization Autofill] Blockly or workspace not available');
      return;
    }
    const workspace = Blockly.getMainWorkspace();
    if (!workspace) {
      console.warn('📊 [Visualization Autofill] No workspace found');
      return;
    }
    const allBlocks = workspace.getAllBlocks();
    console.log('📊 [Visualization Autofill] Processing', allBlocks.length, 'blocks');
    
    let visualizationBlocksFound = 0;
    allBlocks.forEach(block => {
      if (block && block.type && [
        'set_axes', 'quick_chart', 'histogram_config', 
        'boxplot_config', 'heatmap_config'
      ].includes(block.type)) {
        visualizationBlocksFound++;
        console.log('📊 [Visualization Autofill] Found visualization block:', block.type);
      }
      applyAutofillToVisualizationBlock(block);
    });
    
    console.log('📊 [Visualization Autofill] Total visualization blocks found:', visualizationBlocksFound);
    
    // Also trigger the integrated system for data blocks
    if (window.BlocklyAutofill && window.BlocklyAutofill.updateAllBlocksWithAutofill) {
      console.log('📊 [Visualization Autofill] Also triggering integrated system for data blocks');
      window.BlocklyAutofill.updateAllBlocksWithAutofill();
    }
  }

  // Extend the existing BlocklyAutofill system to include visualization blocks
  function extendBlocklyAutofillSystem() {
    // Wait for the existing autofill system to be available
    if (!window.BlocklyAutofill) {
      setTimeout(extendBlocklyAutofillSystem, 100);
      return;
    }

    // Only extend if not already extended
    if (window.BlocklyAutofill._visualizationExtended) {
      return;
    }

    // Store the original applyAutofillToBlock function
    const originalApplyAutofill = window.BlocklyAutofill.applyAutofillToBlock;
    
    // Extend it to handle visualization blocks
    window.BlocklyAutofill.applyAutofillToBlock = function(block) {
      // Call the original function for data blocks
      originalApplyAutofill(block);
      
      // Apply visualization-specific autofill
      applyAutofillToVisualizationBlock(block);
    };
    
    // Mark as extended to prevent double extension
    window.BlocklyAutofill._visualizationExtended = true;
    
    console.log('[Visualization Blocks] Integrated with BlocklyAutofill system');
  }

  // Try to extend the existing autofill system multiple times for robustness
  setTimeout(extendBlocklyAutofillSystem, 500);
  setTimeout(extendBlocklyAutofillSystem, 1200);
  setTimeout(extendBlocklyAutofillSystem, 2000);

  // Manual trigger function - uses existing autofill system
  function triggerVisualizationAutofill() {
    console.log('🔄 Triggering autofill for all blocks (including visualization)...');
    
    // Use the existing global autofill system if available
    if (window.BlocklyAutofill && window.BlocklyAutofill.triggerAutofill) {
      window.BlocklyAutofill.triggerAutofill();
    } else {
      // Fallback implementation
      const columns = getAvailableColumns();
      console.log('📊 Available columns:', columns);

      if (columns.length === 0) {
        console.log('⚠️ No CSV data available for autofill');
        return;
      }

      updateAllVisualizationBlocksWithAutofill();
      console.log('✅ Visualization autofill triggered');
    }
  }

  // Export helper functions - delegates to existing BlocklyAutofill system when available
  window.BlocklyVisualizationAutofill = {
    getAvailableColumns,
    updateFieldWithColumns,
    applyAutofillToVisualizationBlock,
    updateAllVisualizationBlocksWithAutofill,
    triggerVisualizationAutofill,
    // Delegate to existing system when available
    triggerAutofill: () => {
      if (window.BlocklyAutofill && window.BlocklyAutofill.triggerAutofill) {
        window.BlocklyAutofill.triggerAutofill();
      } else {
        triggerVisualizationAutofill();
      }
    },
    // Manual test function for browser console
    testAutofill: () => {
      console.log('🧪 Testing visualization autofill...');
      console.log('Available CSV data:', window.Blockly?.CsvImportData?.data);
      console.log('Available columns:', getAvailableColumns());
      console.log('BlocklyAutofill system:', window.BlocklyAutofill ? 'Available' : 'Not available');
      console.log('Visualization extended:', window.BlocklyAutofill?._visualizationExtended ? 'Yes' : 'No');
      
      // Force trigger autofill
      updateAllVisualizationBlocksWithAutofill();
      console.log('✅ Autofill triggered manually');
    }
  };

  // Start waiting for Blockly
  waitForBlockly();
})();
