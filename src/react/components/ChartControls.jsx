import React, { useState } from 'react';
import { processData as apiProcessData } from '../api';

const ChartControls = ({ onChartGenerate }) => {
  const [chartType, setChartType] = useState('bar');
  const [dataType, setDataType] = useState('students');
  const [loading, setLoading] = useState(false);
  const [hoveredChart, setHoveredChart] = useState(null);
  const [showChartDropdown, setShowChartDropdown] = useState(false);

  // CSV (block) dataset helpers
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterOperator, setFilterOperator] = useState('greater_than');
  const [filterValue, setFilterValue] = useState('');

  // Cleanup controls
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [dropEmptyColumn, setDropEmptyColumn] = useState('');

  // Sort controls
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // GroupBy controls
  const [groupByColumn, setGroupByColumn] = useState('');
  const [aggColumn, setAggColumn] = useState('');
  const [aggOperation, setAggOperation] = useState('sum');
  const [aggAlias, setAggAlias] = useState('value');
  const [aggregations, setAggregations] = useState([]);

  // Calculate controls
  const [calcExpression, setCalcExpression] = useState('');
  const [calcNewColumnName, setCalcNewColumnName] = useState('newValue');

  const chartTypes = [
    {
      value: 'bar',
      label: 'Bar Chart',
      description: 'Displays categorical data with rectangular bars. Best for comparing values across different categories or showing data changes over time.',
      bestFor: 'Comparing quantities, rankings, or frequencies'
    },
    {
      value: 'line',
      label: 'Line Chart',
      description: 'Shows trends and changes over time with connected data points. Ideal for continuous data and identifying patterns.',
      bestFor: 'Time series data, trends, and continuous measurements'
    },
    {
      value: 'pie',
      label: 'Pie Chart',
      description: 'Circular chart divided into slices showing proportions. Each slice represents a percentage of the whole.',
      bestFor: 'Showing part-to-whole relationships and percentages'
    },
    {
      value: 'scatter',
      label: 'Scatter Plot',
      description: 'Plots individual data points to show relationships between two variables. Useful for identifying correlations and outliers.',
      bestFor: 'Correlation analysis, distribution patterns, and outlier detection'
    },
    {
      value: 'doughnut',
      label: 'Doughnut Chart',
      description: 'Similar to pie chart but with a hollow center. Better for comparing multiple datasets or adding central information.',
      bestFor: 'Part-to-whole relationships with additional context'
    },
    {
      value: 'area',
      label: 'Area Chart',
      description: 'Line chart with filled area below the line. Emphasizes magnitude of change over time and cumulative totals.',
      bestFor: 'Cumulative trends, volume over time, and stacked comparisons'
    },
    {
      value: 'histogram',
      label: 'Histogram',
      description: 'Shows distribution of numerical data by grouping values into bins. Reveals frequency and patterns in datasets.',
      bestFor: 'Data distribution, frequency analysis, and identifying normal distributions'
    },
    {
      value: 'heatmap',
      label: 'Heatmap',
      description: 'Uses color intensity to represent values in a matrix. Excellent for spotting patterns in large datasets.',
      bestFor: 'Correlation matrices, pattern detection, and multi-dimensional data'
    },
    {
      value: 'radar',
      label: 'Radar Chart',
      description: 'Displays multivariate data on axes starting from the same point. Shows strengths and weaknesses across categories.',
      bestFor: 'Multi-variable comparisons, performance metrics, and profile analysis'
    }
  ];

  const dataTypes = [
    { value: 'students', label: 'Students Data' },
    { value: 'weather', label: 'Weather Data' },
    { value: 'sales', label: 'Sales Data' },
    { value: 'block', label: 'Block Data' }
  ];

  const csvColumns = (() => {
    const rows = window.Blockly?.CsvImportData?.data || [];
    const cols = rows[0] ? Object.keys(rows[0]) : [];
    return cols;
  })();

  const toggleSelectedColumn = (col) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const addAggregation = () => {
    if (!aggColumn || !aggOperation || !aggAlias) return;
    setAggregations((prev) => [...prev, { column: aggColumn, operation: aggOperation, alias: aggAlias }]);
    // provide a distinct default alias for next add
    setAggAlias((prevAlias) => prevAlias ? `${prevAlias}_2` : 'value_2');
  };

  const removeAggregation = (index) => {
    setAggregations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateChart = async () => {
    setLoading(true);
    
    try {
      let data = null;
      let options = {};
      
      // Handle different data sources
      if (dataType === 'block') {
        // Use CSV data from Blockly
        const csvData = window.Blockly?.CsvImportData?.data || null;
        if (!csvData) {
          throw new Error('No CSV data available. Please import a CSV file using the CSV import block.');
        }

        // Build operations pipeline
        const operations = [];

        // Drop-empty rows on a column: filter not_equals ''
        if (dropEmptyColumn) {
          operations.push({
            type: 'filter',
            params: { column: dropEmptyColumn, operator: 'not_equals', value: '' }
          });
        }

        // User-specified filter
        if (filterColumn && filterOperator && filterValue !== '') {
          operations.push({
            type: 'filter',
            params: { column: filterColumn, operator: filterOperator, value: filterValue }
          });
        }

        // Select columns (if any picked)
        if (selectedColumns && selectedColumns.length > 0) {
          operations.push({ type: 'select', params: { columns: selectedColumns } });
        }

        // Calculate new column
        if (calcExpression && calcNewColumnName) {
          operations.push({ type: 'calculate', params: { expression: calcExpression, newColumnName: calcNewColumnName } });
        }

        // Sort
        if (sortColumn) {
          operations.push({ type: 'sort', params: { column: sortColumn, direction: sortDirection } });
        }

        // GroupBy
        if (groupByColumn && aggregations.length > 0) {
          operations.push({ type: 'groupBy', params: { groupBy: groupByColumn, aggregations } });
        }

        // Process via backend
        let processedData = csvData;
        try {
          const processed = await apiProcessData(csvData, operations);
          processedData = processed && processed.data ? processed.data : csvData;
        } catch (e) {
          console.error('Processing failed:', e);
          alert('Data processing failed: ' + (e.message || 'Unknown error') + '\nUsing unprocessed data.');
        }
        
        data = processedData;
        
        // Set options using selected or default columns (post-processing)
        const columns = Object.keys(processedData[0] || {});

        let resolvedX = xColumn || columns[0] || 'x';
        let resolvedY = yColumn || columns[1] || 'y';

        // If groupBy is used and only one aggregation is present, prefer group and alias
        if (groupByColumn && aggregations.length === 1) {
          const alias = aggregations[0].alias || 'value';
          if (columns.includes(groupByColumn) && columns.includes(alias)) {
            resolvedX = groupByColumn;
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
        const dataResponse = await fetch(`/api/test-data/${dataType}`);
        const dataResult = await dataResponse.json();
        
        if (!dataResult.success) throw new Error('Failed to fetch data');
        data = dataResult.data;
        
        // Determine chart options based on data type
        if (dataType === 'students') {
          options = { xColumn: 'name', yColumn: 'score', title: 'Student Scores' };
        } else if (dataType === 'weather') {
          options = { xColumn: 'month', yColumn: 'temperature', title: 'Monthly Temperature' };
        } else if (dataType === 'sales') {
          options = { xColumn: 'product', yColumn: 'revenue', title: 'Product Revenue' };
        }
      }
      
      // Generate chart
      const chartResponse = await fetch('/api/generate-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: data,
          chartType: chartType,
          options: options
        })
      });
      
      const chartResult = await chartResponse.json();
      
      if (onChartGenerate) {
        onChartGenerate(chartResult);
      }
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('chartGenerated', { 
        detail: chartResult 
      }));
      
    } catch (error) {
      console.error('Chart generation failed:', error);
      alert('Failed to generate chart: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs"
          >Dataset</span
        >
        <select 
          value={dataType} 
          onChange={(e) => setDataType(e.target.value)}
          disabled={loading}
          className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
        >
          {dataTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {dataType === 'block' && (
        <div className="grid gap-2">
          {/* Axis selection */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">X</span>
            <select 
              value={xColumn} 
              onChange={(e) => setXColumn(e.target.value)}
              disabled={loading || csvColumns.length === 0}
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
            >
              <option value="">Auto</option>
              {csvColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Y</span>
            <select 
              value={yColumn} 
              onChange={(e) => setYColumn(e.target.value)}
              disabled={loading || csvColumns.length === 0}
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
            >
              <option value="">Auto</option>
              {csvColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {/* Cleanup: drop empty and select columns */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Drop empty</span>
            <select 
              value={dropEmptyColumn} 
              onChange={(e) => setDropEmptyColumn(e.target.value)}
              disabled={loading || csvColumns.length === 0}
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
            >
              <option value="">None</option>
              {csvColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <span className="text-xs text-muted">Select columns to keep</span>
            <div className="flex flex-wrap gap-1">
              {csvColumns.map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleSelectedColumn(col)}
                  disabled={loading}
                  className={`rounded px-2 py-1 text-xs border ${selectedColumns.includes(col) ? 'bg-accent/20 border-accent text-accent' : 'bg-panel border-border text-text'}`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Filter</span>
            <select 
              value={filterColumn} 
              onChange={(e) => setFilterColumn(e.target.value)}
              disabled={loading || csvColumns.length === 0}
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
            >
              <option value="">None</option>
              {csvColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <select 
              value={filterOperator} 
              onChange={(e) => setFilterOperator(e.target.value)}
              disabled={loading || !filterColumn}
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
            >
              <option value="equals">Equals</option>
              <option value="not_equals">Not equals</option>
              <option value="greater_than">Greater than</option>
              <option value="less_than">Less than</option>
              <option value="greater_than_or_equal">Greater or equal</option>
              <option value="less_than_or_equal">Less or equal</option>
              <option value="contains">Contains</option>
              <option value="starts_with">Starts with</option>
              <option value="ends_with">Ends with</option>
            </select>
            <input 
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              disabled={loading || !filterColumn}
              placeholder="Value"
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Sort</span>
            <select 
              value={sortColumn} 
              onChange={(e) => setSortColumn(e.target.value)}
              disabled={loading || csvColumns.length === 0}
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
            >
              <option value="">None</option>
              {csvColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <select 
              value={sortDirection} 
              onChange={(e) => setSortDirection(e.target.value)}
              disabled={loading || !sortColumn}
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>

          {/* Group By */}
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Group by</span>
              <select 
                value={groupByColumn} 
                onChange={(e) => setGroupByColumn(e.target.value)}
                disabled={loading || csvColumns.length === 0}
                className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
              >
                <option value="">None</option>
                {csvColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Aggregation</span>
              <select 
                value={aggColumn} 
                onChange={(e) => setAggColumn(e.target.value)}
                disabled={loading || !groupByColumn}
                className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
              >
                <option value="">Column</option>
                {csvColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              <select 
                value={aggOperation} 
                onChange={(e) => setAggOperation(e.target.value)}
                disabled={loading || !groupByColumn}
                className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
              >
                <option value="sum">Sum</option>
                <option value="average">Average</option>
                <option value="count">Count</option>
                <option value="min">Min</option>
                <option value="max">Max</option>
              </select>
              <input 
                value={aggAlias}
                onChange={(e) => setAggAlias(e.target.value)}
                disabled={loading || !groupByColumn}
                placeholder="Alias"
                className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={addAggregation}
                disabled={loading || !groupByColumn || !aggColumn || !aggOperation || !aggAlias}
                className="rounded-lg border border-border bg-panel text-text text-xs px-2 py-1 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {aggregations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aggregations.map((agg, idx) => (
                  <span key={`${agg.alias}-${idx}`} className="inline-flex items-center gap-2 text-xs bg-chip border border-border rounded px-2 py-1">
                    {agg.operation}({agg.column}) as {agg.alias}
                    <button
                      type="button"
                      onClick={() => removeAggregation(idx)}
                      className="rounded border border-border px-1"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Calculate */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">Calculate</span>
            <input 
              value={calcExpression}
              onChange={(e) => setCalcExpression(e.target.value)}
              disabled={loading}
              placeholder="Expression e.g. price * quantity"
              className="flex-1 rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
            />
            <input 
              value={calcNewColumnName}
              onChange={(e) => setCalcNewColumnName(e.target.value)}
              disabled={loading}
              placeholder="New column name"
              className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2 relative">
        <span
          className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs"
          >Type</span
        >
        <div className="relative flex-1">
          {/* Custom Dropdown Button */}
          <button
            type="button"
            onClick={() => setShowChartDropdown(!showChartDropdown)}
            disabled={loading}
            className="w-full rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50 flex items-center justify-between hover:bg-panel2 transition-colors"
          >
            <span>{chartTypes.find(t => t.value === chartType)?.label || 'Select Chart Type'}</span>
            <span className="text-xs">▼</span>
          </button>

          {/* Custom Dropdown Menu */}
          {showChartDropdown && (
            <>
              {/* Backdrop to close dropdown when clicking outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowChartDropdown(false)}
              />

              <div className="absolute left-0 top-full mt-1 z-50 w-full max-h-96 overflow-y-auto bg-panel border border-border rounded-lg shadow-lg">
                {chartTypes.map(type => (
                  <div
                    key={type.value}
                    onMouseEnter={() => setHoveredChart(type.value)}
                    onMouseLeave={() => setHoveredChart(null)}
                    onClick={() => {
                      setChartType(type.value);
                      setShowChartDropdown(false);
                      setHoveredChart(null);
                    }}
                    className={`px-3 py-2 cursor-pointer transition-colors ${
                      chartType === type.value
                        ? 'bg-accent/20 text-accent'
                        : 'hover:bg-panel2 text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{type.label}</span>
                      {chartType === type.value && (
                        <span className="text-xs">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Hover Tooltip - positioned to the right */}
          {hoveredChart && showChartDropdown && (
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-96 bg-[#1a1f35] border-2 border-accent rounded-lg shadow-2xl p-5">
              {chartTypes.find(t => t.value === hoveredChart) && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-base font-semibold text-text">
                      {chartTypes.find(t => t.value === hoveredChart).label}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-xs bg-accent/20 text-accent border border-accent/30">
                      {hoveredChart}
                    </span>
                  </div>
                  <p className="text-sm text-muted mb-4 leading-relaxed">
                    {chartTypes.find(t => t.value === hoveredChart).description}
                  </p>
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted mb-2">
                      <span className="font-medium text-text">Best for:</span>
                    </p>
                    <p className="text-sm text-accent">
                      {chartTypes.find(t => t.value === hoveredChart).bestFor}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <button 
        onClick={handleGenerateChart}
        disabled={loading}
        className="rounded-lg border border-[#2a4bff] bg-gradient-to-b from-[#2a4bff] to-[#2140d9] text-white text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading && (
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        )}
        {loading ? 'Generating...' : 'Generate Chart'}
      </button>
    </>
  );
};

export default ChartControls;