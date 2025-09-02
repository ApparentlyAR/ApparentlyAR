import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import DataVisualizationPanel from './components/DataVisualizationPanel';
import ChartControls from './components/ChartControls';
import AppHeader from './components/AppHeader';
import ButtonPanel from './components/ButtonPanel';
import OutputDisplay from './components/OutputDisplay';
import StatusIndicator from './components/StatusIndicator';
// tambahan by najla :) import React Router to enable navigation
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
// tambahan by najla :) import Login page
import Login from "./pages/Login";

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
      <h1 style={{color: 'blue'}}>InterfaceComponents Test Heading</h1>
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

// tambahan by najla :) wrapper component for routing between login page and main interface
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* tambahan by najla :) when path is "/" redirect to /login */}
        <Route path="/" element={<Navigate to="/login" />} />
        {/* tambahan by najla :) login page */}
        <Route path="/login" element={<Login />} />
        {/* tambahan by najla :) main interface page shown after login */}
        <Route path="/main" element={<InterfaceComponents />} />
      </Routes>
    </BrowserRouter>
  );
}


// Initialize React components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Mount the React app to the root div in index.html
  const interfaceRoot = document.getElementById('root');
  if (interfaceRoot) {
    const root = createRoot(interfaceRoot);
    root.render(<AppRouter />);
  }

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