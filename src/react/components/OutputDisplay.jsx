import React from 'react';

const OutputDisplay = ({ output, isError }) => {
  if (!output) return null;

  return (
    <div className="flex-1 mx-2">
      <pre className={`p-2 rounded-lg font-mono text-xs border max-h-16 overflow-auto ${
        isError 
          ? 'bg-[#2b1f1f] text-error border-[#4a2e2e]' 
          : 'bg-chip text-text border-border'
      }`}>
        {output}
      </pre>
    </div>
  );
};

export default OutputDisplay;