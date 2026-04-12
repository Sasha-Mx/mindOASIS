import React from 'react';

const ProgressBar = ({ progress }) => {
  return (
    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
      <div 
        className="h-full premium-gradient transition-all duration-1000 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

export default ProgressBar;
