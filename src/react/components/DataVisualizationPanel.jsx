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

  // Listen for Blockly execution to automatically visualize CSV data
  useEffect(() => {
    const handleBlocklyExecution = () => {
      // Check if we have CSV data from Blockly and auto-visualize it
      const csvData = window.Blockly?.CsvImportData?.data;
      if (csvData && csvData.length > 0) {
        // Generate a default chart with the CSV data
        const columns = Object.keys(csvData[0] || {});
        const options = { 
          xColumn: columns[0] || 'x', 
          yColumn: columns[1] || 'y', 
          title: 'CSV Data Visualization' 
        };
        
        // Generate a bar chart by default
        generateChart(csvData, 'bar', options);
      }
    };

    // Listen for the custom event that's dispatched when Blockly code is executed
    window.addEventListener('blocklyExecuted', handleBlocklyExecution);
    
    return () => {
      window.removeEventListener('blocklyExecuted', handleBlocklyExecution);
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
    <div className="w-full h-full">
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-[#2b1f1f] border border-[#4a2e2e] text-error px-3 py-2 rounded text-sm z-10">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {loading && (
        <div className="absolute inset-0 bg-[#0f1324] bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-panel border border-border rounded-lg p-4 flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full"></div>
            <span className="text-text">Generating chart...</span>
          </div>
        </div>
      )}
      
      <div className="chart-container w-full h-full relative">
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
        />
        {!chartData && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-muted mb-2">
                Visualization will appear here when blocks are executed
              </div>
              <button 
                onClick={loadSampleData}
                className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 hover:bg-panel2 transition-colors"
              >
                Load Sample Chart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataVisualizationPanel;