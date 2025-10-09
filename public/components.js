// Global variables for component state
let chartState = {
  chartType: 'bar',
  dataType: 'students',
  loading: false,
  xColumn: '',
  yColumn: '',
  filterColumn: '',
  filterOperator: 'greater_than',
  filterValue: '',
  selectedColumns: [],
  dropEmptyColumn: '',
  sortColumn: '',
  sortDirection: 'asc',
  groupByColumn: '',
  aggColumn: '',
  aggOperation: 'sum',
  aggAlias: 'value',
  aggregations: [],
  calcExpression: '',
  calcNewColumnName: 'newValue'
};

let outputState = {
  output: '',
  isError: false
};

let statusState = {
  isExecuting: false,
  hasOutput: false,
  hasError: false
};

let visualizationState = {
  chartData: null,
  loading: false,
  error: null,
  chartInstance: null
};

// Chart types and data types
const chartTypes = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'doughnut', label: 'Doughnut Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'histogram', label: 'Histogram' },
  { value: 'boxplot', label: 'Box Plot' },
  { value: 'heatmap', label: 'Heatmap' },
  { value: 'radar', label: 'Radar Chart' }
];

const dataTypes = [
  { value: 'students', label: 'Students Data' },
  { value: 'weather', label: 'Weather Data' },
  { value: 'sales', label: 'Sales Data' },
  { value: 'block', label: 'Block Data' }
];

// Utility functions
function getCSVColumns() {
  const rows = window.Blockly?.CsvImportData?.data || [];
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  return cols;
}

function toggleSelectedColumn(col) {
  const index = chartState.selectedColumns.indexOf(col);
  if (index > -1) {
    chartState.selectedColumns.splice(index, 1);
  } else {
    chartState.selectedColumns.push(col);
  }
  renderChartControls();
}

function addAggregation() {
  if (!chartState.aggColumn || !chartState.aggOperation || !chartState.aggAlias) return;
  chartState.aggregations.push({
    column: chartState.aggColumn,
    operation: chartState.aggOperation,
    alias: chartState.aggAlias
  });
  // Provide a distinct default alias for next add
  chartState.aggAlias = chartState.aggAlias ? `${chartState.aggAlias}_2` : 'value_2';
  renderChartControls();
}

function removeAggregation(index) {
  chartState.aggregations.splice(index, 1);
  renderChartControls();
}

// Component render functions
function renderChartControls() {
  const container = document.getElementById('react-controls-container');
  if (!container) return;

  const csvColumns = getCSVColumns();
  
  let html = '';
  
  // Only show data type selector if we have CSV data
  if (csvColumns.length > 0) {
    html += `
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Dataset</span>
        <select id="data-type-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
          ${dataTypes.map(type => `<option value="${type.value}" ${chartState.dataType === type.value ? 'selected' : ''}>${type.label}</option>`).join('')}
        </select>
      </div>
    `;
  }

  if (chartState.dataType === 'block' && csvColumns.length > 0) {
    html += `
      <div class="grid gap-2">
        <!-- Axis selection -->
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">X</span>
          <select id="x-column-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
            <option value="">Auto</option>
            ${csvColumns.map(col => `<option value="${col}" ${chartState.xColumn === col ? 'selected' : ''}>${col}</option>`).join('')}
          </select>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Y</span>
          <select id="y-column-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
            <option value="">Auto</option>
            ${csvColumns.map(col => `<option value="${col}" ${chartState.yColumn === col ? 'selected' : ''}>${col}</option>`).join('')}
          </select>
        </div>

        <!-- Cleanup: drop empty and select columns -->
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Drop empty</span>
          <select id="drop-empty-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
            <option value="">None</option>
            ${csvColumns.map(col => `<option value="${col}" ${chartState.dropEmptyColumn === col ? 'selected' : ''}>${col}</option>`).join('')}
          </select>
        </div>

        <div class="grid gap-1">
          <span class="text-xs text-muted">Select columns to keep</span>
          <div class="flex flex-wrap gap-1">
            ${csvColumns.map(col => `
              <button
                type="button"
                data-column="${col}"
                class="column-toggle rounded px-2 py-1 text-xs border ${chartState.selectedColumns.includes(col) ? 'bg-accent/20 border-accent text-accent' : 'bg-panel border-border text-text'}"
              >
                ${col}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Filter -->
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Filter</span>
          <select id="filter-column-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
            <option value="">None</option>
            ${csvColumns.map(col => `<option value="${col}" ${chartState.filterColumn === col ? 'selected' : ''}>${col}</option>`).join('')}
          </select>
          <select id="filter-operator-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
            <option value="equals" ${chartState.filterOperator === 'equals' ? 'selected' : ''}>Equals</option>
            <option value="not_equals" ${chartState.filterOperator === 'not_equals' ? 'selected' : ''}>Not equals</option>
            <option value="greater_than" ${chartState.filterOperator === 'greater_than' ? 'selected' : ''}>Greater than</option>
            <option value="less_than" ${chartState.filterOperator === 'less_than' ? 'selected' : ''}>Less than</option>
            <option value="greater_than_or_equal" ${chartState.filterOperator === 'greater_than_or_equal' ? 'selected' : ''}>Greater or equal</option>
            <option value="less_than_or_equal" ${chartState.filterOperator === 'less_than_or_equal' ? 'selected' : ''}>Less or equal</option>
            <option value="contains" ${chartState.filterOperator === 'contains' ? 'selected' : ''}>Contains</option>
            <option value="starts_with" ${chartState.filterOperator === 'starts_with' ? 'selected' : ''}>Starts with</option>
            <option value="ends_with" ${chartState.filterOperator === 'ends_with' ? 'selected' : ''}>Ends with</option>
          </select>
          <input id="filter-value-input" value="${chartState.filterValue}" placeholder="Value" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50" />
        </div>

        <!-- Sort -->
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Sort</span>
          <select id="sort-column-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
            <option value="">None</option>
            ${csvColumns.map(col => `<option value="${col}" ${chartState.sortColumn === col ? 'selected' : ''}>${col}</option>`).join('')}
          </select>
          <select id="sort-direction-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
            <option value="asc" ${chartState.sortDirection === 'asc' ? 'selected' : ''}>Asc</option>
            <option value="desc" ${chartState.sortDirection === 'desc' ? 'selected' : ''}>Desc</option>
          </select>
        </div>

        <!-- Group By -->
        <div class="grid gap-2">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Group by</span>
            <select id="group-by-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
              <option value="">None</option>
              ${csvColumns.map(col => `<option value="${col}" ${chartState.groupByColumn === col ? 'selected' : ''}>${col}</option>`).join('')}
            </select>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted">Aggregation</span>
            <select id="agg-column-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
              <option value="">Column</option>
              ${csvColumns.map(col => `<option value="${col}" ${chartState.aggColumn === col ? 'selected' : ''}>${col}</option>`).join('')}
            </select>
            <select id="agg-operation-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
              <option value="sum" ${chartState.aggOperation === 'sum' ? 'selected' : ''}>Sum</option>
              <option value="average" ${chartState.aggOperation === 'average' ? 'selected' : ''}>Average</option>
              <option value="count" ${chartState.aggOperation === 'count' ? 'selected' : ''}>Count</option>
              <option value="min" ${chartState.aggOperation === 'min' ? 'selected' : ''}>Min</option>
              <option value="max" ${chartState.aggOperation === 'max' ? 'selected' : ''}>Max</option>
            </select>
            <input id="agg-alias-input" value="${chartState.aggAlias}" placeholder="Alias" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50" />
            <button id="add-aggregation-btn" type="button" class="rounded-lg border border-border bg-panel text-text text-xs px-2 py-1 disabled:opacity-50">Add</button>
          </div>
          ${chartState.aggregations.length > 0 ? `
            <div class="flex flex-wrap gap-2">
              ${chartState.aggregations.map((agg, idx) => `
                <span class="inline-flex items-center gap-2 text-xs bg-chip border border-border rounded px-2 py-1">
                  ${agg.operation}(${agg.column}) as ${agg.alias}
                  <button type="button" data-index="${idx}" class="remove-aggregation-btn rounded border border-border px-1">✕</button>
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Calculate -->
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Calculate</span>
          <input id="calc-expression-input" value="${chartState.calcExpression}" placeholder="Expression e.g. price * quantity" class="flex-1 rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50" />
          <input id="calc-new-column-input" value="${chartState.calcNewColumnName}" placeholder="New column name" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50" />
        </div>
      </div>
    `;
  }

  // Chart type selector
  html += `
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Type</span>
      <select id="chart-type-select" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50">
        ${chartTypes.map(type => `<option value="${type.value}" ${chartState.chartType === type.value ? 'selected' : ''}>${type.label}</option>`).join('')}
      </select>
    </div>
  `;

  // Generate button
  html += `
    <button id="generate-chart-btn" class="rounded-lg border border-[#2a4bff] bg-gradient-to-b from-[#2a4bff] to-[#2140d9] text-white text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
      ${chartState.loading ? `
        <div class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        Generating...
      ` : 'Generate Chart'}
    </button>
  `;

  container.innerHTML = html;

  // Attach event listeners
  attachChartControlEvents();
}

function attachChartControlEvents() {
  // Data type select
  const dataTypeSelect = document.getElementById('data-type-select');
  if (dataTypeSelect) {
    dataTypeSelect.addEventListener('change', (e) => {
      chartState.dataType = e.target.value;
      renderChartControls();
    });
  }

  // Chart type select
  const chartTypeSelect = document.getElementById('chart-type-select');
  if (chartTypeSelect) {
    chartTypeSelect.addEventListener('change', (e) => {
      chartState.chartType = e.target.value;
    });
  }

  // Generate chart button
  const generateChartBtn = document.getElementById('generate-chart-btn');
  if (generateChartBtn) {
    generateChartBtn.addEventListener('click', handleGenerateChart);
  }

  // Block data specific controls (only if we're using block data)
  if (chartState.dataType === 'block') {
    const xColumnSelect = document.getElementById('x-column-select');
    if (xColumnSelect) {
      xColumnSelect.addEventListener('change', (e) => {
        chartState.xColumn = e.target.value;
      });
    }

    const yColumnSelect = document.getElementById('y-column-select');
    if (yColumnSelect) {
      yColumnSelect.addEventListener('change', (e) => {
        chartState.yColumn = e.target.value;
      });
    }

    const dropEmptySelect = document.getElementById('drop-empty-select');
    if (dropEmptySelect) {
      dropEmptySelect.addEventListener('change', (e) => {
        chartState.dropEmptyColumn = e.target.value;
      });
    }

    const filterColumnSelect = document.getElementById('filter-column-select');
    if (filterColumnSelect) {
      filterColumnSelect.addEventListener('change', (e) => {
        chartState.filterColumn = e.target.value;
      });
    }

    const filterOperatorSelect = document.getElementById('filter-operator-select');
    if (filterOperatorSelect) {
      filterOperatorSelect.addEventListener('change', (e) => {
        chartState.filterOperator = e.target.value;
      });
    }

    const filterValueInput = document.getElementById('filter-value-input');
    if (filterValueInput) {
      filterValueInput.addEventListener('input', (e) => {
        chartState.filterValue = e.target.value;
      });
    }

    const sortColumnSelect = document.getElementById('sort-column-select');
    if (sortColumnSelect) {
      sortColumnSelect.addEventListener('change', (e) => {
        chartState.sortColumn = e.target.value;
      });
    }

    const sortDirectionSelect = document.getElementById('sort-direction-select');
    if (sortDirectionSelect) {
      sortDirectionSelect.addEventListener('change', (e) => {
        chartState.sortDirection = e.target.value;
      });
    }

    const groupBySelect = document.getElementById('group-by-select');
    if (groupBySelect) {
      groupBySelect.addEventListener('change', (e) => {
        chartState.groupByColumn = e.target.value;
      });
    }

    const aggColumnSelect = document.getElementById('agg-column-select');
    if (aggColumnSelect) {
      aggColumnSelect.addEventListener('change', (e) => {
        chartState.aggColumn = e.target.value;
      });
    }

    const aggOperationSelect = document.getElementById('agg-operation-select');
    if (aggOperationSelect) {
      aggOperationSelect.addEventListener('change', (e) => {
        chartState.aggOperation = e.target.value;
      });
    }

    const aggAliasInput = document.getElementById('agg-alias-input');
    if (aggAliasInput) {
      aggAliasInput.addEventListener('input', (e) => {
        chartState.aggAlias = e.target.value;
      });
    }

    const addAggregationBtn = document.getElementById('add-aggregation-btn');
    if (addAggregationBtn) {
      addAggregationBtn.addEventListener('click', addAggregation);
    }

    const calcExpressionInput = document.getElementById('calc-expression-input');
    if (calcExpressionInput) {
      calcExpressionInput.addEventListener('input', (e) => {
        chartState.calcExpression = e.target.value;
      });
    }

    const calcNewColumnInput = document.getElementById('calc-new-column-input');
    if (calcNewColumnInput) {
      calcNewColumnInput.addEventListener('input', (e) => {
        chartState.calcNewColumnName = e.target.value;
      });
    }

    // Column toggle buttons
    document.querySelectorAll('.column-toggle').forEach(button => {
      button.addEventListener('click', (e) => {
        const col = e.target.getAttribute('data-column') || e.target.parentElement.getAttribute('data-column');
        toggleSelectedColumn(col);
      });
    });

    // Remove aggregation buttons
    document.querySelectorAll('.remove-aggregation-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-index') || e.target.parentElement.getAttribute('data-index'));
        removeAggregation(index);
      });
    });
  }
}

async function handleGenerateChart() {
  chartState.loading = true;
  renderChartControls();

  try {
    let data = null;
    let options = {};

    // Handle different data sources
    if (chartState.dataType === 'block') {
      // Use CSV data from Blockly
      const csvData = window.Blockly?.CsvImportData?.data || null;
      if (!csvData) {
        throw new Error('No CSV data available. Please import a CSV file using the CSV import block.');
      }

      // Build operations pipeline
      const operations = [];

      // Drop-empty rows on a column: filter not_equals ''
      if (chartState.dropEmptyColumn) {
        operations.push({
          type: 'filter',
          params: { column: chartState.dropEmptyColumn, operator: 'not_equals', value: '' }
        });
      }

      // User-specified filter
      if (chartState.filterColumn && chartState.filterOperator && chartState.filterValue !== '') {
        operations.push({
          type: 'filter',
          params: { column: chartState.filterColumn, operator: chartState.filterOperator, value: chartState.filterValue }
        });
      }

      // Select columns (if any picked)
      if (chartState.selectedColumns && chartState.selectedColumns.length > 0) {
        operations.push({ type: 'select', params: { columns: chartState.selectedColumns } });
      }

      // Calculate new column
      if (chartState.calcExpression && chartState.calcNewColumnName) {
        operations.push({ type: 'calculate', params: { expression: chartState.calcExpression, newColumnName: chartState.calcNewColumnName } });
      }

      // Sort
      if (chartState.sortColumn) {
        operations.push({ type: 'sort', params: { column: chartState.sortColumn, direction: chartState.sortDirection } });
      }

      // GroupBy
      if (chartState.groupByColumn && chartState.aggregations.length > 0) {
        operations.push({ type: 'groupBy', params: { groupBy: chartState.groupByColumn, aggregations: chartState.aggregations } });
      }

      // Process via backend
      let processedData = csvData;
      try {
        const processed = await processData(csvData, operations);
        processedData = processed && processed.data ? processed.data : csvData;
      } catch (e) {
        console.error('Processing failed:', e);
        alert('Data processing failed: ' + (e.message || 'Unknown error') + '\nUsing unprocessed data.');
      }

      data = processedData;

      // Set options using selected or default columns (post-processing)
      const columns = Object.keys(processedData[0] || {});

      let resolvedX = chartState.xColumn || columns[0] || 'x';
      let resolvedY = chartState.yColumn || columns[1] || 'y';

      // If groupBy is used and only one aggregation is present, prefer group and alias
      if (chartState.groupByColumn && chartState.aggregations.length === 1) {
        const alias = chartState.aggregations[0].alias || 'value';
        if (columns.includes(chartState.groupByColumn) && columns.includes(alias)) {
          resolvedX = chartState.groupByColumn;
          resolvedY = alias;
        }
      }

      options = {
        xColumn: resolvedX,
        yColumn: resolvedY,
        title: 'CSV Data Visualization'
      };
    } else {
      // Fetch sample data
      const dataResponse = await fetch(`/api/test-data/${chartState.dataType}`);
      const dataResult = await dataResponse.json();
      
      if (!dataResult.success) throw new Error('Failed to fetch data');
      data = dataResult.data;

      // Determine chart options based on data type
      if (chartState.dataType === 'students') {
        options = { xColumn: 'name', yColumn: 'score', title: 'Student Scores' };
      } else if (chartState.dataType === 'weather') {
        options = { xColumn: 'month', yColumn: 'temperature', title: 'Monthly Temperature' };
      } else if (chartState.dataType === 'sales') {
        options = { xColumn: 'product', yColumn: 'revenue', title: 'Product Revenue' };
      }
    }

    // Generate chart
    const chartResponse = await fetch('/api/generate-chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: data,
        chartType: chartState.chartType,
        options: options
      })
    });

    const chartResult = await chartResponse.json();

    // Update visualization
    visualizationState.chartData = chartResult;
    renderDataVisualization();
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('chartGenerated', {
      detail: chartResult
    }));

  } catch (error) {
    console.error('Chart generation failed:', error);
    alert('Failed to generate chart: ' + error.message);
  } finally {
    chartState.loading = false;
    renderChartControls();
  }
}

function renderOutputDisplay() {
  const container = document.getElementById('output-root');
  if (!container) return;

  if (!outputState.output) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="flex-1 mx-2">
      <pre class="${outputState.isError
        ? 'bg-[#2b1f1f] text-error border-[#4a2e2e]'
        : 'bg-chip text-text border-border'
      } p-2 rounded-lg font-mono text-xs border max-h-16 overflow-auto">${outputState.output}</pre>
    </div>
  `;
}

function renderStatusIndicator() {
  const container = document.getElementById('status-root');
  if (!container) return;

  if (!statusState.isExecuting && !statusState.hasOutput) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  if (statusState.isExecuting) {
    html = `
      <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">
        <div class="animate-spin h-3 w-3 border border-muted border-t-transparent rounded-full"></div>
        Executing...
      </span>
    `;
  } else if (statusState.hasOutput && !statusState.isExecuting) {
    html = `
      <span class="${statusState.hasError
        ? 'bg-[#2b1f1f] text-error border-[#4a2e2e]'
        : 'bg-[#1a2b24] text-ok border-[#2e5a49]'
      } inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs">
        ${statusState.hasError ? 'Error' : 'Ready'}
      </span>
    `;
  }

  container.innerHTML = html;
}

function renderDataVisualization() {
  const container = document.getElementById('react-chart-container');
  if (!container) return;

  if (visualizationState.error) {
    container.innerHTML = `
      <div class="absolute top-4 left-4 right-4 bg-[#2b1f1f] border border-[#4a2e2e] text-error px-3 py-2 rounded text-sm z-10">
        <strong>Error:</strong> ${visualizationState.error}
      </div>
    `;
    return;
  }

  if (visualizationState.loading) {
    container.innerHTML = `
      <div class="absolute inset-0 bg-[#0f1324] bg-opacity-50 flex items-center justify-center z-10">
        <div class="bg-panel border border-border rounded-lg p-4 flex items-center gap-3">
          <div class="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full"></div>
          <span class="text-text">Generating chart...</span>
        </div>
      </div>
    `;
    return;
  }

  if (!visualizationState.chartData) {
    container.innerHTML = `
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-sm text-muted mb-2">
            Visualization will appear here when blocks are executed
          </div>
          <button id="load-sample-btn" class="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 hover:bg-panel2 transition-colors">
            Load Sample Chart
          </button>
        </div>
      </div>
    `;
    
    // Attach event listener to load sample button
    const loadSampleBtn = document.getElementById('load-sample-btn');
    if (loadSampleBtn) {
      loadSampleBtn.addEventListener('click', loadSampleData);
    }
    return;
  }

  // Render the chart
  container.innerHTML = '<canvas id="chart-canvas" class="w-full h-full"></canvas>';
  
  // Render the chart using Chart.js
  setTimeout(() => {
    const canvas = document.getElementById('chart-canvas');
    if (canvas && window.Chart) {
      // Destroy existing chart instance
      if (visualizationState.chartInstance) {
        visualizationState.chartInstance.destroy();
      }

      const ctx = canvas.getContext('2d');
      
      // Convert backend chart config to Chart.js format
      const chartConfig = convertToChartJsConfig(visualizationState.chartData);
      
      visualizationState.chartInstance = new Chart(ctx, chartConfig);
    }
  }, 0);
}

function convertToChartJsConfig(backendResult) {
  if (!backendResult.config) return null;
  
  // The backend config should already be in Chart.js format
  // but we can add dark theme styling
  return {
    type: backendResult.chartType,
    data: backendResult.config.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#e7ebff'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#a9b4d0'
          },
          grid: {
            color: '#2b3350'
          }
        },
        y: {
          ticks: {
            color: '#a9b4d0'
          },
          grid: {
            color: '#2b3350'
          }
        }
      },
      ...backendResult.config.options
    }
  };
}

async function loadSampleData() {
  try {
    const response = await fetch('/api/test-data/students');
    const result = await response.json();
    
    if (result.success) {
      // Generate a bar chart with sample data
      await generateChart(result.data, 'bar', {
        xColumn: 'name',
        yColumn: 'score',
        title: 'Student Scores'
      });
    }
  } catch (err) {
    visualizationState.error = 'Failed to load sample data';
    renderDataVisualization();
  }
}

async function generateChart(data, chartType, options) {
  visualizationState.loading = true;
  visualizationState.error = null;
  renderDataVisualization();
  
  try {
    const response = await fetch('/api/generate-chart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, chartType, options }),
    });
    
    if (!response.ok) throw new Error('Failed to generate chart');
    
    const result = await response.json();
    visualizationState.chartData = result;
    renderDataVisualization();
  } catch (err) {
    visualizationState.error = err.message;
    renderDataVisualization();
  } finally {
    visualizationState.loading = false;
    renderDataVisualization();
  }
}

// API functions
async function processData(data, operations) {
  const response = await fetch('/api/process-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data, operations }),
  });
  return await response.json();
}

// Initialize all components
function initializeComponents() {
  renderChartControls();
  renderOutputDisplay();
  renderStatusIndicator();
  renderDataVisualization();
}

// Expose functions to global scope for React bridge
window.reactSetOutput = function(output) {
  outputState.output = output;
  outputState.isError = false;
  statusState.hasOutput = !!output;
  renderOutputDisplay();
  renderStatusIndicator();
};

window.reactSetError = function(isError) {
  outputState.isError = isError;
  statusState.hasError = isError;
  renderOutputDisplay();
  renderStatusIndicator();
};

window.reactSetExecuting = function(isExecuting) {
  statusState.isExecuting = isExecuting;
  renderStatusIndicator();
};

window.reactGetState = function() {
  return {
    output: outputState.output,
    isExecuting: statusState.isExecuting,
    isError: outputState.isError
  };
};

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  initializeComponents();
});

// Listen for chart generation events
window.addEventListener('chartGenerated', function(event) {
  const chartResult = event.detail;
  visualizationState.chartData = chartResult;
  renderDataVisualization();
});

// Listen for Blockly execution to automatically visualize CSV data
window.addEventListener('blocklyExecuted', async function() {
  // Check if we have CSV data from Blockly and process it via backend
  const csvData = window.Blockly?.CsvImportData?.data;
  if (csvData && csvData.length > 0) {
    try {
      visualizationState.loading = true;
      visualizationState.error = null;
      renderDataVisualization();

      // For now, send with an empty operations array (no-op pipeline)
      const processed = await processData(csvData, []);
      const processedData = processed && processed.data ? processed.data : csvData;

      // Default options from CSV columns
      const columns = Object.keys(processedData[0] || {});
      const options = {
        xColumn: columns[0] || 'x',
        yColumn: columns[1] || 'y',
        title: 'CSV Data Visualization'
      };

      // Generate a bar chart by default using processed data
      await generateChart(processedData, 'bar', options);
    } catch (e) {
      visualizationState.error = e.message || 'Failed to process data';
      renderDataVisualization();
    } finally {
      visualizationState.loading = false;
      renderDataVisualization();
    }
  }
});