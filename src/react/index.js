import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import DataVisualizationPanel from './components/DataVisualizationPanel';
import ChartControls from './components/ChartControls';
import AppHeader from './components/AppHeader';
import ButtonPanel from './components/ButtonPanel';
import OutputDisplay from './components/OutputDisplay';
import StatusIndicator from './components/StatusIndicator';

// Main App component that manages all UI components
const InterfaceComponents = () => {
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isError, setIsError] = useState(false);

  // Expose functions to vanilla JS for bridge communication
  React.useEffect(() => {
    window.reactSetOutput = setOutput;
    window.reactSetExecuting = setIsExecuting;
    window.reactSetError = setIsError;
    window.reactGetState = () => ({ output, isExecuting, isError });
  }, [output, isExecuting, isError]);

  // Portal components to different DOM locations
  const headerRoot = document.getElementById('header-root');
  const statusRoot = document.getElementById('status-root');
  const buttonsRoot = document.getElementById('buttons-root');
  const outputRoot = document.getElementById('output-root');

  return (
    <>
      {headerRoot && createPortal(<AppHeader />, headerRoot)}
      {statusRoot && createPortal(
        <StatusIndicator 
          isExecuting={isExecuting} 
          hasOutput={!!output} 
          hasError={isError}
        />, 
        statusRoot
      )}
      {buttonsRoot && createPortal(
        <ButtonPanel 
          onRun={() => window.executeBlocklyCode && window.executeBlocklyCode()} 
          onShowCode={() => window.showBlocklyCode && window.showBlocklyCode()}
          isExecuting={isExecuting}
        />, 
        buttonsRoot
      )}
      {outputRoot && createPortal(
        <OutputDisplay output={output} isError={isError} />, 
        outputRoot
      )}
    </>
  );
};

// Initialize React components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Mount the new interface components
  const interfaceRoot = document.createElement('div');
  const root = createRoot(interfaceRoot);
  root.render(<InterfaceComponents />);

  // Mount existing DataVisualizationPanel if container exists
  const chartContainer = document.getElementById('react-chart-container');
  if (chartContainer) {
    const chartRoot = createRoot(chartContainer);
    chartRoot.render(<DataVisualizationPanel />);
  }

  // Mount existing ChartControls if container exists
  const controlsContainer = document.getElementById('react-controls-container');
  if (controlsContainer) {
    const controlsRoot = createRoot(controlsContainer);
    controlsRoot.render(<ChartControls />);
  }
});

// Export components for direct use if needed
export { DataVisualizationPanel, ChartControls, AppHeader, ButtonPanel, OutputDisplay, StatusIndicator };