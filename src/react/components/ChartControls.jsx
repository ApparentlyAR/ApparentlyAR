import React, { useState } from 'react';
import { processData as apiProcessData } from '../api';

const ChartControls = ({ onChartGenerate }) => {
  const [chartType, setChartType] = useState('bar');
  const [dataType, setDataType] = useState('students');
  const [loading, setLoading] = useState(false);

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
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'scatter', label: 'Scatter Plot' },
    { value: 'doughnut', label: 'Doughnut Chart' },
    { value: 'area', label: 'Area Chart' },
    { value: 'histogram', label: 'Histogram' },
    { value: 'heatmap', label: 'Heatmap' },
    { value: 'radar', label: 'Radar Chart' }
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
      
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs"
          >Type</span
        >
        <select 
          value={chartType} 
          onChange={(e) => setChartType(e.target.value)}
          disabled={loading}
          className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 disabled:opacity-50"
        >
          {chartTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
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