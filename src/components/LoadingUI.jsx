import React from 'react';

export const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-200/60 rounded-xl ${className}`}></div>
);

export const Spinner = ({ size = 20, className = "" }) => (
  <svg 
    className={`animate-spin ${className}`} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const FullPageLoading = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <Spinner size={40} className="text-indigo-500" />
    <p className="text-slate-400 font-medium animate-pulse">Wait a moment...</p>
  </div>
);
