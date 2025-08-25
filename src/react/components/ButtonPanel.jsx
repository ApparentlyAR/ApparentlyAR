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
    <>
      <button 
        onClick={onRun}
        disabled={isExecuting}
        className="rounded-lg border border-[#2a4bff] bg-gradient-to-b from-[#2a4bff] to-[#2140d9] text-white text-sm px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isExecuting && (
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
        )}
        {isExecuting ? 'Running...' : 'Run'} 
      </button>
      <button 
        onClick={onShowCode}
        disabled={isExecuting}
        className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Show Code
      </button>
      <button
        className="rounded-lg border border-border bg-panel text-text text-sm px-3 py-1.5"
      >
        Save
      </button>
    </>
  );
};

export default ButtonPanel;