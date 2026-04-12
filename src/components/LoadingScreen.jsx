import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ICONS = ['🎓', '⚡', '🗺️', '🎯'];
const MESSAGES = [
  "Analyzing your skill profile...",
  "Mapping industry requirements...",
  "Building your personalized roadmap...",
  "Preparing your daily missions..."
];

export default function LoadingScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ICONS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden font-dm-sans"
         style={{ background: 'linear-gradient(155deg, #dce9ff 0%, #f0f4ff 50%, #ede8ff 100%)' }}>
      
      {/* Floating Orbs */}
      <Orb color="#7C3AED" top="-10%" left="-5%" delay={0} opacity={0.18} />
      <Orb color="#06B6D4" bottom="-10%" right="-5%" delay={2} opacity={0.15} />
      <Orb color="#D4537E" top="40%" right="-10%" delay={4} opacity={0.14} />

      {/* Floating Particles */}
      <Particles count={20} />

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Pulsing Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 border-2 border-[#7C3AED] rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.05, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute inset-4 border-2 border-[#06B6D4] rounded-full"
          />
        </div>

        {/* Golden Halo Expansion (Added on top) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="halo-ring halo-1" />
          <div className="halo-ring halo-2" />
          <div className="halo-ring halo-3" />
        </div>

        {/* Icon Container */}
        <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6),0_0_40px_rgba(245,158,11,0.3),0_0_70px_rgba(245,158,11,0.15)] animate-gold-pulse z-20 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={ICONS[index]}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.5 }}
              className="text-5xl"
            >
              {ICONS[index]}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 text-[12px] font-bold tracking-[3px] text-[#F59E0B] uppercase">
          Mentra.AI
        </div>

        {/* Cycling Text */}
        <div className="mt-8 h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={MESSAGES[index]}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-lg font-extrabold text-[#4a5480] text-center"
            >
              {MESSAGES[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Bar Container */}
        <div className="mt-10 w-64 h-2 bg-slate-200/50 rounded-full relative overflow-visible">
          <div className="absolute inset-0 bg-slate-100/50 rounded-full overflow-hidden">
            <div className="h-full w-full bg-shimmer animate-shimmer relative">
              {/* Glowing leading edge */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#FDE68A] rounded-full shadow-[0_0_10px_#F59E0B,0_0_20px_rgba(245,158,11,0.9)] animate-dot-pulse" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 flex items-center gap-2 text-slate-400 font-bold tracking-widest text-[10px] uppercase">
          <span>Powered by</span>
          <span className="text-[#F59E0B]/60">LLAMA AI</span>
          <div className="flex gap-1 ml-1">
             <div className="w-1 h-1 bg-[#F59E0B]/60 rounded-full animate-bounce" />
             <div className="w-1 h-1 bg-[#F59E0B]/60 rounded-full animate-bounce [animation-delay:0.2s]" />
             <div className="w-1 h-1 bg-[#F59E0B]/60 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 30px) scale(0.9); }
        }
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes floatUp {
          from { transform: translateY(100vh); opacity: 0; }
          to { transform: translateY(-100px); opacity: 0.3; }
        }
        @keyframes haloExpand {
          0%   { transform: scale(0.85); opacity: 1; }
          70%  { transform: scale(1.08); opacity: 0.3; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.6), 0 0 40px rgba(245,158,11,0.3), 0 0 70px rgba(245,158,11,0.15); }
          50%      { box-shadow: 0 0 30px rgba(245,158,11,0.9), 0 0 60px rgba(245,158,11,0.5), 0 0 100px rgba(245,158,11,0.25); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.4); }
        }
        .bg-shimmer {
          background: linear-gradient(90deg, #7C3AED, #F59E0B, #06B6D4, #F59E0B, #7C3AED);
          background-size: 300% 100%;
        }
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
        .animate-gold-pulse {
          animation: goldPulse 2s ease-in-out infinite;
        }
        .animate-dot-pulse {
          animation: dotPulse 1s ease-in-out infinite;
        }
        .halo-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border-style: solid;
          animation: haloExpand 2.5s ease-out infinite;
        }
        .halo-1 { width: 130px; height: 130px; border-width: 1px; border-color: rgba(245,158,11,0.3); animation-delay: 0s; }
        .halo-2 { width: 160px; height: 160px; border-width: 1px; border-color: rgba(245,158,11,0.2); animation-delay: 0.7s; }
        .halo-3 { width: 195px; height: 195px; border-width: 1px; border-color: rgba(245,158,11,0.12); animation-delay: 1.4s; }
      `}</style>
    </div>
  );
}

function Orb({ color, top, left, bottom, right, delay, opacity }) {
  return (
    <div 
      className="absolute w-[600px] h-[600px] rounded-full filter blur-[80px]"
      style={{
        backgroundColor: color,
        top, left, bottom, right,
        opacity,
        animation: `drift ${12 + Math.random() * 3}s ease-in-out infinite`,
        animationDelay: `${delay}s`
      }}
    />
  );
}

function Particles({ count }) {
  const particles = Array.from({ length: count });
  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((_, i) => (
        <div 
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: '100%',
            opacity: Math.random() * 0.25 + 0.05,
            animation: `floatUp ${8 + Math.random() * 10}s linear infinite`,
            animationDelay: `${Math.random() * 10}s`
          }}
        />
      ))}
    </div>
  );
}

