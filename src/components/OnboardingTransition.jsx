import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OnboardingTransition({ roadmapData }) {
  const navigate = useNavigate();
  const [stage, setStage] = useState('celebrate'); // 'celebrate' | 'fadeout'
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    requestAnimationFrame(() => setVisible(true));

    // After 4.5s start fading out (longer celebration)
    const t1 = setTimeout(() => setStage('fadeout'), 4500);

    // After fade completes navigate to dashboard
    const t2 = setTimeout(() => navigate('/dashboard'), 5500);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [navigate]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(155deg, #dce9ff 0%, #f0f4ff 50%, #ede8ff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: stage === 'fadeout' ? 0 : visible ? 1 : 0,
      transition: stage === 'fadeout'
        ? 'opacity 1s ease-in-out'
        : 'opacity 0.5s ease-in-out',
    }}>
      <style>{`
        @keyframes capPop {
          0%   { transform: scale(0.4) translateY(40px); opacity: 0; }
          60%  { transform: scale(1.15) translateY(-10px); opacity: 1; }
          80%  { transform: scale(0.95) translateY(4px); }
          100% { transform: scale(1) translateY(0px); opacity: 1; }
        }
        @keyframes titleSlideUp {
          0%   { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes cardPopIn {
          0%   { transform: scale(0.8) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
        }
        @keyframes pulseRing {
          0%   { transform: scale(0.6); opacity: 0; }
          50%  { opacity: 0.5; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes haloGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); filter: blur(20px); }
          50% { opacity: 0.8; transform: scale(1.2); filter: blur(40px); }
        }
        @keyframes floatUp {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-12px); }
        }
      `}</style>

      {/* Confetti pieces */}
      <Confetti />

      {/* Halo Background Glow */}
      <div style={{
        position: 'absolute',
        width: 350,
        height: 350,
        background: 'radial-gradient(circle, rgba(123,108,246,0.5) 0%, rgba(233,107,189,0.2) 60%, transparent 100%)',
        borderRadius: '50%',
        animation: 'haloGlow 5s ease-in-out infinite',
        zIndex: 0,
        pointerEvents: 'none',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }} />

      {/* Pulse rings behind cap */}
      <div style={{ position: 'absolute', top: '25%', left: '50%',
        transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 1 }}>
        {[0, 0.4, 0.8, 1.2].map((delay, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 160, height: 160,
            borderRadius: '50%',
            border: '4px solid rgba(123,108,246,0.6)',
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            animation: `pulseRing 3.5s ease-out infinite`,
            animationDelay: `${delay}s`,
            opacity: 0
          }}/>
        ))}
      </div>

      {/* Graduation cap — pops in */}
      <div style={{
        animation: 'capPop 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards, floatUp 3s ease-in-out 0.7s infinite',
        marginBottom: 40,
        zIndex: 10,
        filter: 'drop-shadow(0 15px 40px rgba(123,108,246,0.3))'
      }}>
        <svg viewBox="0 0 160 120" width="180" xmlns="http://www.w3.org/2000/svg">
          {/* Base */}
          <polygon points="80,16 140,50 80,62 20,50" fill="#1a1d2e"/>
          <polygon points="80,20 130,48 80,58 30,48" fill="#252840"/>
          <ellipse cx="80" cy="70" rx="42" ry="15" fill="#1a1d2e"/>
          <rect x="42" y="50" width="76" height="15" rx="3" fill="#1a1d2e"/>
          {/* Tassel */}
          <line x1="140" y1="50" x2="152" y2="80" stroke="#f5c842" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="152" cy="85" r="8" fill="#f5c842"/>
          <g stroke="#f5c842" strokeWidth="3" strokeLinecap="round">
             <line x1="152" y1="93" x2="148" y2="110" />
             <line x1="152" y1="93" x2="152" y2="112" />
             <line x1="152" y1="93" x2="156" y2="110" />
          </g>
        </svg>
      </div>

      {/* Main title */}
      <div style={{
        animation: 'titleSlideUp 0.6s ease-out 0.4s both',
        textAlign: 'center',
        marginBottom: 12,
        zIndex: 10
      }}>
        <h1 style={{
          fontFamily: 'Nunito',
          fontWeight: 900,
          fontSize: 'clamp(36px, 6vw, 56px)',
          margin: 0,
          background: 'linear-gradient(135deg, #7b6cf6, #e96bbd)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.02em'
        }}>
          Success! 🎉
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{
        animation: 'titleSlideUp 0.6s ease-out 0.6s both',
        textAlign: 'center',
        marginBottom: 50,
        zIndex: 10
      }}>
        <p style={{
          fontFamily: 'DM Sans',
          fontSize: 20,
          fontWeight: 600,
          color: '#4a5480',
          margin: 0,
        }}>
          Everything is ready for your growth journey
        </p>
      </div>

      {/* 3 stat cards */}
      <div style={{
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 700,
        animation: 'cardPopIn 0.6s ease-out 0.8s both',
        zIndex: 10
      }}>
        {[
          { label: 'CONFIDENCE', value: (roadmapData?.confidence_score ?? 72) + '%', color: '#7b6cf6', bg: '#f0edff' },
          { label: 'DURATION', value: (roadmapData?.roadmap?.length ?? 8) + ' WKS', color: '#f5a623', bg: '#fff8ec' },
          { label: 'TARGET', value: (roadmapData?.skill_gap?.length ?? 6) + ' SKILLS', color: '#22c55e', bg: '#e1f5ee' }
        ].map(card => (
          <div key={card.label} style={{
            background: 'white',
            border: `1.5px solid ${card.bg}`,
            borderRadius: 28,
            padding: '28px 40px',
            textAlign: 'center',
            minWidth: 180,
            boxShadow: '0 15px 35px rgba(74,127,224,0.08)',
            transform: 'translateY(0)',
            transition: 'all 0.3s'
          }}>
            <div style={{
              fontSize: 36,
              fontFamily: 'Nunito',
              fontWeight: 900,
              color: card.color,
            }}>
              {card.value}
            </div>
            <div style={{ fontSize: 12, color: '#8090c0', fontWeight: 800, marginTop: 6, letterSpacing: '0.12em' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer message */}
      <div style={{
        position: 'absolute',
        bottom: 50,
        animation: 'titleSlideUp 0.6s ease-out 1.2s both',
        zIndex: 10
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(10px)',
          padding: '12px 24px',
          borderRadius: 20,
          border: '1px solid rgba(123,108,246,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 10, height: 10,
            borderRadius: '50%',
            background: '#7b6cf6',
            boxShadow: '0 0 12px #7b6cf6',
            animation: 'pulseRing 1.5s ease-out infinite',
          }}/>
          <span style={{
            fontFamily: 'DM Sans',
            fontSize: 15,
            color: '#7b6cf6',
            fontWeight: 700
          }}>Initializing your dashboard...</span>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = [];
  const colors = ['#7b6cf6', '#e96bbd', '#f5c842', '#4a7fe0', '#22c55e', '#f5a623'];
  
  for (let i = 0; i < 50; i++) {
    pieces.push({
      color: colors[i % colors.length],
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      size: 6 + Math.random() * 10,
      duration: 3 + Math.random() * 2,
      shape: i % 3
    });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: -20,
          left: p.left,
          width: p.size,
          height: p.size,
          background: p.color,
          borderRadius: p.shape === 0 ? '50%' : p.shape === 1 ? '3px' : '0',
          opacity: 0.8,
          transform: `rotate(${Math.random() * 360}deg)`,
          animation: `confettiFall ${p.duration}s linear ${p.delay} forwards`,
        }}/>
      ))}
    </div>
  );
}
