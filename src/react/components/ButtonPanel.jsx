import React, { useEffect } from 'react';

const ButtonPanel = ({ onRun, onShowCode, isExecuting }) => {
  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter' && !isExecuting) {
          e.preventDefault();
          onRun();
        } else if (e.key === 'k' && !isExecuting) {
          e.preventDefault();
          onShowCode();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onRun, onShowCode, isExecuting]);
  return (
    <div className="mb-3 flex flex-wrap gap-2 sm:flex-col sm:gap-2">
      <button 
        onClick={onRun}
        disabled={isExecuting}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-base font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isExecuting && (
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        )}
        {isExecuting ? 'Running...' : 'Run Code'} 
        {!isExecuting && <span className="text-xs opacity-75 ml-1 hidden md:inline">(Ctrl+Enter)</span>}
      </button>
      <button 
        onClick={onShowCode}
        disabled={isExecuting}
        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-base font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Show Code
        {!isExecuting && <span className="text-xs opacity-75 ml-1 hidden md:inline">(Ctrl+K)</span>}
      </button>
    </div>
  );
};

export default ButtonPanel;