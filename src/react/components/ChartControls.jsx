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
      <h4 className="text-lg font-semibold text-slate-800 mb-4">Chart Controls</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="control-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Type:</label>
          <select 
            value={dataType} 
            onChange={(e) => setDataType(e.target.value)}
            disabled={loading}
            className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {dataTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">Chart Type:</label>
          <select 
            value={chartType} 
            onChange={(e) => setChartType(e.target.value)}
            disabled={loading}
            className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {chartTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
          <button 
            onClick={handleGenerateChart}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? 'Generating...' : 'Generate Chart'}
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-sm text-gray-600">Generating chart...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartControls;