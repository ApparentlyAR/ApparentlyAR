import React from 'react';

const StatusIndicator = ({ isExecuting, hasOutput, hasError }) => {
  if (!isExecuting && !hasOutput) return null;

  return (
    <div className="flex items-center gap-2 mb-2">
      {isExecuting && (
        <div className="flex items-center text-blue-600">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
          <span className="text-sm font-medium">Executing...</span>
        </div>
      )}
      {hasOutput && !isExecuting && (
        <div className={`text-sm font-medium ${hasError ? 'text-red-600' : 'text-green-600'}`}>
          {hasError ? '❌ Error' : '✓ Ready'}
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;