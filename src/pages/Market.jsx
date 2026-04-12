import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import Sidebar from '../components/Sidebar';
import MarketIntelligence from '../components/MarketIntelligence';

export default function Market() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const gapReport = user?.gapReport || null;
  const userGaps = [
    ...(gapReport?.fullyMissing || []),
    ...(gapReport?.needsPolishing || [])
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(12px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        display: 'flex', minHeight: '100vh', width: '100%'
      }}
    >
      <div className="flex w-full h-screen overflow-hidden bg-[var(--bg-page)] font-dm-sans text-[var(--navy)]">
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto custom-scrollbar relative px-8 py-8 pb-10">
          <MarketIntelligence 
            userRole={user?.profile?.role || user?.answers?.role || 'SDE'} 
            mode="dashboard" 
            userGaps={userGaps} 
          />
        </main>
      </div>
    </motion.div>
  );
}
