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
    { value: 'area', label: 'Area Chart' }
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
    <div className="chart-controls">
      <h4>Chart Controls</h4>
      
      <div className="control-group">
        <label>Data Type:</label>
        <select 
          value={dataType} 
          onChange={(e) => setDataType(e.target.value)}
          disabled={loading}
        >
          {dataTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="control-group">
        <label>Chart Type:</label>
        <select 
          value={chartType} 
          onChange={(e) => setChartType(e.target.value)}
          disabled={loading}
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
        className="generate-btn"
      >
        {loading ? 'Generating...' : 'Generate Chart'}
      </button>
    </div>
  );
};

export default ChartControls;