import React from 'react';
import ResumeReviewer from '../components/ResumeReviewer';
import Sidebar from '../components/Sidebar';

export default function Resume() {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#F8FAFC] font-dm-sans">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar p-6 md:p-10">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <ResumeReviewer />
        </div>
      </main>
    </div>
  );
}
