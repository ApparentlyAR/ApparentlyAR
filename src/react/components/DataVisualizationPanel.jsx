import React, { useState, useEffect } from 'react';

const DataVisualizationPanel = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="data-visualization-panel">
      <div className="panel-header">
        <h3>Data Visualization</h3>
        <button 
          onClick={loadSampleData}
          disabled={loading}
          className="load-sample-btn"
        >
          {loading ? 'Loading...' : 'Load Sample Chart'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      {chartData && (
        <div className="chart-container">
          <h4>{chartData.config?.options?.plugins?.title?.text}</h4>
          <div className="chart-info">
            <p>Chart Type: {chartData.type}</p>
            <p>Data Points: {chartData.config?.data?.labels?.length || 0}</p>
          </div>
          <pre className="chart-config">
            {JSON.stringify(chartData.config, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DataVisualizationPanel;