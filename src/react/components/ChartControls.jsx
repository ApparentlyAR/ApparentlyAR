import React, { useState } from 'react';

const ChartControls = ({ onChartGenerate }) => {
  const [chartType, setChartType] = useState('bar');
  const [dataType, setDataType] = useState('students');
  const [loading, setLoading] = useState(false);

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
    { value: 'sales', label: 'Sales Data' }
  ];

  const handleGenerateChart = async () => {
    setLoading(true);
    
    try {
      // Fetch sample data
      const dataResponse = await fetch(`/api/test-data/${dataType}`);
      const dataResult = await dataResponse.json();
      
      if (!dataResult.success) throw new Error('Failed to fetch data');
      
      // Determine chart options based on data type
      let options = {};
      if (dataType === 'students') {
        options = { xColumn: 'name', yColumn: 'score', title: 'Student Scores' };
      } else if (dataType === 'weather') {
        options = { xColumn: 'month', yColumn: 'temperature', title: 'Monthly Temperature' };
      } else if (dataType === 'sales') {
        options = { xColumn: 'product', yColumn: 'revenue', title: 'Product Revenue' };
      }
      
      // Generate chart
      const chartResponse = await fetch('/api/generate-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataResult.data,
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