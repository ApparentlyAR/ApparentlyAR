import React, { useState, useEffect, useRef } from 'react';

const DataVisualizationPanel = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const generateChart = async (data, chartType, options) => {
    setLoading(true);
    setError(null);
    
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
      setChartData(result);
      renderChart(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (chartResult) => {
    if (!canvasRef.current || !window.Chart || !chartResult) return;

    // Destroy existing chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    
    // Convert backend chart config to Chart.js format
    const chartConfig = convertToChartJsConfig(chartResult);
    
    chartInstanceRef.current = new Chart(ctx, chartConfig);
  };

  const convertToChartJsConfig = (backendResult) => {
    if (!backendResult.config) return null;
    
    // The backend config should already be in Chart.js format
    // but we can add any additional processing here if needed
    return {
      type: backendResult.chartType,
      data: backendResult.config.data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...backendResult.config.options
      }
    };
  };

  const loadSampleData = async () => {
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
      setError('Failed to load sample data');
    }
  };

  // Listen for chart generation events from ChartControls
  useEffect(() => {
    const handleChartGenerated = (event) => {
      const chartResult = event.detail;
      setChartData(chartResult);
      renderChart(chartResult);
    };

    window.addEventListener('chartGenerated', handleChartGenerated);
    
    return () => {
      window.removeEventListener('chartGenerated', handleChartGenerated);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="data-visualization-panel">
      <div className="panel-header mb-4">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Data Visualization</h3>
        <button 
          onClick={loadSampleData}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Loading...' : 'Load Sample Chart'}
        </button>
      </div>
      
      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {loading && (
        <div className="loading-message bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          <strong>Loading:</strong> Generating chart...
        </div>
      )}
      
      <div className="chart-container relative">
        <canvas 
          ref={canvasRef}
          className="w-full h-96 max-h-96"
        />
        {!chartData && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded">
            <p className="text-gray-500 text-center">
              Select data and chart type from the controls above, then click "Generate Chart" to display visualization
            </p>
          </div>
        )}
      </div>
      
      {chartData && (
        <div className="chart-info mt-4 p-4 bg-gray-50 rounded">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Chart Type:</span>
              <span className="ml-2 text-gray-900 capitalize">{chartData.chartType}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Data Points:</span>
              <span className="ml-2 text-gray-900">{chartData.metadata?.dataPoints || 0}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Generated:</span>
              <span className="ml-2 text-gray-900">
                {chartData.metadata?.generatedAt ? new Date(chartData.metadata.generatedAt).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Columns:</span>
              <span className="ml-2 text-gray-900">
                {chartData.metadata?.columns?.join(', ') || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataVisualizationPanel;