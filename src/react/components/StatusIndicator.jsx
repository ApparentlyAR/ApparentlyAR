import React from 'react';

const StatusIndicator = ({ isExecuting, hasOutput, hasError }) => {
  if (!isExecuting && !hasOutput) return null;

  return (
    <>
      {isExecuting && (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-chip text-muted border border-border text-xs">
          <div className="animate-spin h-3 w-3 border border-muted border-t-transparent rounded-full"></div>
          Executing...
        </span>
      )}
      {hasOutput && !isExecuting && (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs ${
          hasError 
            ? 'bg-[#2b1f1f] text-error border-[#4a2e2e]' 
            : 'bg-[#1a2b24] text-ok border-[#2e5a49]'
        }`}>
          {hasError ? 'Error' : 'Ready'}
        </span>
      )}
    </>
  );
};

export default StatusIndicator;