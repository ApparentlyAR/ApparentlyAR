import React from 'react';
import { createRoot } from 'react-dom/client';
import DataVisualizationPanel from './components/DataVisualizationPanel';
import ChartControls from './components/ChartControls';

// Initialize React components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Mount DataVisualizationPanel if container exists
  const chartContainer = document.getElementById('react-chart-container');
  if (chartContainer) {
    const root = createRoot(chartContainer);
    root.render(<DataVisualizationPanel />);
  }

  // Mount ChartControls if container exists
  const controlsContainer = document.getElementById('react-controls-container');
  if (controlsContainer) {
    const root = createRoot(controlsContainer);
    root.render(<ChartControls />);
  }
});

// Export components for direct use if needed
export { DataVisualizationPanel, ChartControls };