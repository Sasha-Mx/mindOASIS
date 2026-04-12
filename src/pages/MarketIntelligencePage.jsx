import React from 'react';
import CareerDecisionIntelligence from '../components/CareerDecisionIntelligence';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const MarketIntelligencePage = () => {
  return (
    <div className="flex h-screen bg-[#f4f7fc] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
          <CareerDecisionIntelligence />
        </main>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f4f7fc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default MarketIntelligencePage;
