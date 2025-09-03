/**
 * Visualization Configuration Blocks
 * 
 * Blocks for configuring charts and creating visualizations
 * in the ApparentlyAR data visualization platform.
 */

// Define visualization configuration blocks
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
    "tooltip": "Set the type of chart to create",
    "helpUrl": ""
  },

  // Set Axes Block
  {
    "type": "set_axes",
    "message0": "set X-axis to %1 Y-axis to %2 from %3",
    "args0": [
      {
        "type": "field_column_dropdown",
        "name": "X_COLUMN"
      },
      {
        "type": "field_column_dropdown",
        "name": "Y_COLUMN"
      },
      {
        "type": "input_value",
        "name": "CHART_CONFIG",
        "check": "ChartConfig"
      }
    ],
    "output": "ChartConfig",
    "colour": 330,
    "tooltip": "Set the X and Y axes for the chart",
    "helpUrl": ""
  },

  // Chart Options Block
  {
    "type": "chart_options",
    "message0": "set chart title to %1 from %2",
    "args0": [
      {
        "type": "field_input",
        "name": "TITLE",
        "text": "My Chart"
      },
      {
        "type": "input_value",
        "name": "CHART_CONFIG",
        "check": "ChartConfig"
      }
    ],
    "output": "ChartConfig",
    "colour": 330,
    "tooltip": "Set chart title and other options",
    "helpUrl": ""
  },

  // Advanced Chart Options Block
  {
    "type": "advanced_chart_options",
    "message0": "set chart title %1 colors %2 show legend %3 from %4",
    "args0": [
      {
        "type": "field_input",
        "name": "TITLE",
        "text": "My Chart"
      },
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
        "type": "field_checkbox",
        "name": "SHOW_LEGEND",
        "checked": true
      },
      {
        "type": "input_value",
        "name": "CHART_CONFIG",
        "check": "ChartConfig"
      }
    ],
    "output": "ChartConfig",
    "colour": 330,
    "tooltip": "Advanced chart styling options",
    "helpUrl": ""
  },

  // Generate Visualization Block
  {
    "type": "generate_visualization",
    "message0": "create visualization with %1 using data %2",
    "args0": [
      {
        "type": "input_value",
        "name": "CHART_CONFIG",
        "check": "ChartConfig"
      },
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      }
    ],
    "previousStatement": null,
    "colour": 330,
    "tooltip": "Generate and display the visualization",
    "helpUrl": ""
  },

  // Quick Chart Block (all-in-one)
  {
    "type": "quick_chart",
    "message0": "create %1 chart with X-axis %2 Y-axis %3 title %4 from %5",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "CHART_TYPE",
        "options": [
          ["Bar", "bar"],
          ["Line", "line"],
          ["Scatter", "scatter"],
          ["Pie", "pie"],
          ["Area", "area"]
        ]
      },
      {
        "type": "field_column_dropdown",
        "name": "X_COLUMN"
      },
      {
        "type": "field_column_dropdown",
        "name": "Y_COLUMN"
      },
      {
        "type": "field_input",
        "name": "TITLE",
        "text": "My Chart"
      },
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      }
    ],
    "previousStatement": null,
    "colour": 330,
    "tooltip": "Create a chart with all settings in one block",
    "helpUrl": ""
  },

  // Histogram Configuration Block
  {
    "type": "histogram_config", 
    "message0": "create histogram of %1 with %2 bins title %3 from %4",
    "args0": [
      {
        "type": "field_column_dropdown",
        "name": "VALUE_COLUMN"
      },
      {
        "type": "field_number",
        "name": "BINS",
        "value": 10,
        "min": 1,
        "max": 100
      },
      {
        "type": "field_input",
        "name": "TITLE",
        "text": "Histogram"
      },
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      }
    ],
    "previousStatement": null,
    "colour": 330,
    "tooltip": "Create a histogram with specified bins",
    "helpUrl": ""
  },

  // Box Plot Configuration Block
  {
    "type": "boxplot_config",
    "message0": "create box plot of %1 grouped by %2 title %3 from %4",
    "args0": [
      {
        "type": "field_column_dropdown",
        "name": "VALUE_COLUMN"
      },
      {
        "type": "field_column_dropdown",
        "name": "GROUP_COLUMN"
      },
      {
        "type": "field_input",
        "name": "TITLE",
        "text": "Box Plot"
      },
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      }
    ],
    "previousStatement": null,
    "colour": 330,
    "tooltip": "Create a box plot grouped by category",
    "helpUrl": ""
  },

  // Heatmap Configuration Block
  {
    "type": "heatmap_config",
    "message0": "create heatmap X-axis %1 Y-axis %2 values %3 title %4 from %5",
    "args0": [
      {
        "type": "field_column_dropdown",
        "name": "X_COLUMN"
      },
      {
        "type": "field_column_dropdown",
        "name": "Y_COLUMN"
      },
      {
        "type": "field_column_dropdown",
        "name": "VALUE_COLUMN"
      },
      {
        "type": "field_input",
        "name": "TITLE",
        "text": "Heatmap"
      },
      {
        "type": "input_value",
        "name": "DATASET",
        "check": "Dataset"
      }
    ],
    "previousStatement": null,
    "colour": 330,
    "tooltip": "Create a heatmap visualization",
    "helpUrl": ""
  }
]);

// JavaScript generators for visualization blocks
(function() {
  if (typeof Blockly === 'undefined' || !Blockly.JavaScript) return;

  // Set Chart Type generator
  window.BlockUtils.registerBlock('set_chart_type', function(block) {
    const chartType = block.getFieldValue('CHART_TYPE');

    const code = `
      (function() {
        return {
          chartType: '${chartType}',
          options: {}
        };
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Set Axes generator
  window.BlockUtils.registerBlock('set_axes', function(block) {
    const xColumn = block.getFieldValue('X_COLUMN');
    const yColumn = block.getFieldValue('Y_COLUMN');
    const chartConfig = Blockly.JavaScript.valueToCode(block, 'CHART_CONFIG', Blockly.JavaScript.ORDER_NONE) || '{}';

    const code = `
      (function() {
        const config = ${chartConfig};
        config.options = config.options || {};
        config.options.xColumn = '${xColumn}';
        config.options.yColumn = '${yColumn}';
        return config;
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Chart Options generator
  window.BlockUtils.registerBlock('chart_options', function(block) {
    const title = block.getFieldValue('TITLE');
    const chartConfig = Blockly.JavaScript.valueToCode(block, 'CHART_CONFIG', Blockly.JavaScript.ORDER_NONE) || '{}';

    const code = `
      (function() {
        const config = ${chartConfig};
        config.options = config.options || {};
        config.options.title = '${title}';
        return config;
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Advanced Chart Options generator
  window.BlockUtils.registerBlock('advanced_chart_options', function(block) {
    const title = block.getFieldValue('TITLE');
    const colorScheme = block.getFieldValue('COLOR_SCHEME');
    const showLegend = block.getFieldValue('SHOW_LEGEND') === 'TRUE';
    const chartConfig = Blockly.JavaScript.valueToCode(block, 'CHART_CONFIG', Blockly.JavaScript.ORDER_NONE) || '{}';

    const code = `
      (function() {
        const config = ${chartConfig};
        config.options = config.options || {};
        config.options.title = '${title}';
        config.options.colorScheme = '${colorScheme}';
        config.options.showLegend = ${showLegend};
        return config;
      })()
    `;

    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  });

  // Generate Visualization generator
  window.BlockUtils.registerBlock('generate_visualization', function(block) {
    const chartConfig = Blockly.JavaScript.valueToCode(block, 'CHART_CONFIG', Blockly.JavaScript.ORDER_NONE) || '{}';
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (async function() {
        try {
          const config = ${chartConfig};
          const data = ${dataset};
          
          if (!data) {
            throw new Error('No dataset provided for visualization');
          }
          
          if (!config.chartType) {
            throw new Error('No chart type specified');
          }
          
          console.log('Generating chart:', config.chartType, 'with options:', config.options);
          
          // Use the backend API to generate chart
          try {
            const chartResult = await window.BlockUtils.API.generateChart(data, config.chartType, config.options);
            
            // Update the React chart component
            if (window.reactUpdateChart) {
              window.reactUpdateChart(chartResult);
            }
            
            // Also trigger the chart visualization event
            window.dispatchEvent(new CustomEvent('chartGenerated', { 
              detail: { 
                chartConfig: chartResult, 
                data: data 
              } 
            }));
            
            if (window.reactSetOutput) {
              window.reactSetOutput('Chart generated successfully');
            }
            
            return 'Visualization created';
          } catch (apiError) {
            console.error('API Error:', apiError);
            
            // Fallback to basic chart generation if API fails
            const basicChart = {
              type: config.chartType,
              data: {
                labels: data.map((row, i) => row[config.options.xColumn] || i),
                datasets: [{
                  label: config.options.title || 'Data',
                  data: data.map(row => row[config.options.yColumn] || 0)
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: config.options.title || 'Chart'
                  }
                }
              }
            };
            
            window.dispatchEvent(new CustomEvent('chartGenerated', { 
              detail: { 
                chartConfig: basicChart, 
                data: data 
              } 
            }));
            
            return 'Basic visualization created';
          }
        } catch (error) {
          console.error('Visualization error:', error);
          if (window.reactSetOutput) {
            window.reactSetOutput('Error: ' + error.message);
          }
          if (window.reactSetError) {
            window.reactSetError(true);
          }
          throw error;
        }
      })()
    `;

    return code;
  });

  // Quick Chart generator
  window.BlockUtils.registerBlock('quick_chart', function(block) {
    const chartType = block.getFieldValue('CHART_TYPE');
    const xColumn = block.getFieldValue('X_COLUMN');
    const yColumn = block.getFieldValue('Y_COLUMN');
    const title = block.getFieldValue('TITLE');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (async function() {
        try {
          const data = ${dataset};
          
          if (!data) {
            throw new Error('No dataset provided for visualization');
          }
          
          const config = {
            chartType: '${chartType}',
            options: {
              xColumn: '${xColumn}',
              yColumn: '${yColumn}',
              title: '${title}'
            }
          };
          
          console.log('Creating quick chart:', config);
          
          // Use the backend API to generate chart
          try {
            const chartResult = await window.BlockUtils.API.generateChart(data, config.chartType, config.options);
            
            window.dispatchEvent(new CustomEvent('chartGenerated', { 
              detail: { 
                chartConfig: chartResult, 
                data: data 
              } 
            }));
            
            if (window.reactSetOutput) {
              window.reactSetOutput('Quick chart created successfully');
            }
            
            return 'Quick chart created';
          } catch (apiError) {
            console.error('API Error:', apiError);
            
            // Fallback chart
            const basicChart = {
              type: config.chartType,
              data: {
                labels: data.map(row => row['${xColumn}'] || 'Item'),
                datasets: [{
                  label: '${title}',
                  data: data.map(row => Number(row['${yColumn}']) || 0)
                }]
              },
              options: {
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: '${title}'
                  }
                }
              }
            };
            
            window.dispatchEvent(new CustomEvent('chartGenerated', { 
              detail: { 
                chartConfig: basicChart, 
                data: data 
              } 
            }));
            
            return 'Basic quick chart created';
          }
        } catch (error) {
          console.error('Quick chart error:', error);
          if (window.reactSetOutput) {
            window.reactSetOutput('Error: ' + error.message);
          }
          throw error;
        }
      })()
    `;

    return code;
  });

  // Histogram Configuration generator
  window.BlockUtils.registerBlock('histogram_config', function(block) {
    const valueColumn = block.getFieldValue('VALUE_COLUMN');
    const bins = block.getFieldValue('BINS');
    const title = block.getFieldValue('TITLE');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (async function() {
        try {
          const data = ${dataset};
          if (!data) throw new Error('No dataset provided');
          
          const options = {
            valueColumn: '${valueColumn}',
            bins: ${bins},
            title: '${title}'
          };
          
          const chartResult = await window.BlockUtils.API.generateChart(data, 'histogram', options);
          
          window.dispatchEvent(new CustomEvent('chartGenerated', { 
            detail: { 
              chartConfig: chartResult, 
              data: data 
            } 
          }));
          
          return 'Histogram created';
        } catch (error) {
          console.error('Histogram error:', error);
          throw error;
        }
      })()
    `;

    return code;
  });

  // Box Plot Configuration generator
  window.BlockUtils.registerBlock('boxplot_config', function(block) {
    const valueColumn = block.getFieldValue('VALUE_COLUMN');
    const groupColumn = block.getFieldValue('GROUP_COLUMN');
    const title = block.getFieldValue('TITLE');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (async function() {
        try {
          const data = ${dataset};
          if (!data) throw new Error('No dataset provided');
          
          const options = {
            valueColumn: '${valueColumn}',
            groupColumn: '${groupColumn}',
            title: '${title}'
          };
          
          const chartResult = await window.BlockUtils.API.generateChart(data, 'boxplot', options);
          
          window.dispatchEvent(new CustomEvent('chartGenerated', { 
            detail: { 
              chartConfig: chartResult, 
              data: data 
            } 
          }));
          
          return 'Box plot created';
        } catch (error) {
          console.error('Box plot error:', error);
          throw error;
        }
      })()
    `;

    return code;
  });

  // Heatmap Configuration generator
  window.BlockUtils.registerBlock('heatmap_config', function(block) {
    const xColumn = block.getFieldValue('X_COLUMN');
    const yColumn = block.getFieldValue('Y_COLUMN');
    const valueColumn = block.getFieldValue('VALUE_COLUMN');
    const title = block.getFieldValue('TITLE');
    const dataset = Blockly.JavaScript.valueToCode(block, 'DATASET', Blockly.JavaScript.ORDER_NONE) || 'null';

    const code = `
      (async function() {
        try {
          const data = ${dataset};
          if (!data) throw new Error('No dataset provided');
          
          const options = {
            xColumn: '${xColumn}',
            yColumn: '${yColumn}',
            valueColumn: '${valueColumn}',
            title: '${title}'
          };
          
          const chartResult = await window.BlockUtils.API.generateChart(data, 'heatmap', options);
          
          window.dispatchEvent(new CustomEvent('chartGenerated', { 
            detail: { 
              chartConfig: chartResult, 
              data: data 
            } 
          }));
          
          return 'Heatmap created';
        } catch (error) {
          console.error('Heatmap error:', error);
          throw error;
        }
      })()
    `;

    return code;
  });

})();