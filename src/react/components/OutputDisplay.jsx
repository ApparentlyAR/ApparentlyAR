import React from 'react';

const OutputDisplay = ({ output, isError }) => {
  return (
    <pre className={`p-3 min-h-10 rounded-md font-mono text-base sm:text-sm mb-4 shadow-sm w-full overflow-x-auto ${
      isError 
        ? 'bg-red-900 text-red-200 border-l-4 border-red-500' 
        : 'bg-slate-900 text-slate-200'
    }`}>
      {output || 'No output'}
    </pre>
  );
};

export default OutputDisplay;