import React, { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const MissionCard = ({ mission, onComplete }) => {
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    if (!completed) {
      setCompleted(true);
      onComplete();
    }
  };

  return (
    <div className={`glass p-4 rounded-xl flex items-center justify-between border border-slate-800 transition-all ${completed ? 'opacity-50 grayscale' : 'card-hover hover:border-indigo-500/50'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${completed ? 'bg-indigo-500/20' : 'bg-slate-800'}`}>
          {completed ? (
            <CheckCircle2 className="text-indigo-400 w-6 h-6" />
          ) : (
            <Circle className="text-slate-400 w-6 h-6" />
          )}
        </div>
        <div>
          <h4 className={`font-semibold text-sm ${completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {mission}
          </h4>
          <p className="text-xs text-slate-500">Daily Mission</p>
        </div>
      </div>
      
      {!completed && (
        <button 
          onClick={handleComplete}
          className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Complete
        </button>
      )}
    </div>
  );
};

export default MissionCard;
