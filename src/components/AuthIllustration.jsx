export default function AuthIllustration() {
  return (
    <div style={{
      width: '100%',
      height: '100vh', /* full height mapping requested */
      minHeight: 520,
      background: 'linear-gradient(155deg, #c8dcf8 0%, #ddeeff 45%, #eef5ff 100%)',
      position: 'sticky', /* requested sticky property */
      top: 0,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        @keyframes capFloat {
          0%,100% { transform: translateY(0px) rotate(-3deg); }
          50%      { transform: translateY(-14px) rotate(3deg); }
        }
        @keyframes chipFloat1 {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes chipFloat2 {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes chipFloat3 {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-5px); }
        }
        @keyframes chipFloat4 {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes charSit {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes sparkPulse {
          0%,100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.4); }
        }
      `}</style>

      {/* ── MAIN SVG SCENE ── */}
      <svg
        viewBox="0 0 480 480"
        width="100%"
        style={{ maxWidth: 480, position: 'relative', zIndex: 2 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── STEPS (4 gold 3D-style steps, bottom-left to top-right) ── */}
        <rect x="40"  y="368" width="110" height="22" rx="6" fill="#f5c842"/>
        <rect x="40"  y="384" width="110" height="10" rx="3" fill="#d4a012" opacity=".5"/>
        <rect x="40"  y="368" width="110" height="4"  rx="2" fill="rgba(255,255,255,0.35)"/>

        <rect x="130" y="330" width="110" height="22" rx="6" fill="#f5c842"/>
        <rect x="130" y="346" width="110" height="10" rx="3" fill="#d4a012" opacity=".5"/>
        <rect x="130" y="330" width="110" height="4"  rx="2" fill="rgba(255,255,255,0.35)"/>

        <rect x="220" y="292" width="110" height="22" rx="6" fill="#f5c842"/>
        <rect x="220" y="308" width="110" height="10" rx="3" fill="#d4a012" opacity=".5"/>
        <rect x="220" y="292" width="110" height="4"  rx="2" fill="rgba(255,255,255,0.35)"/>

        <rect x="310" y="254" width="110" height="22" rx="6" fill="#f5c842"/>
        <rect x="310" y="270" width="110" height="10" rx="3" fill="#d4a012" opacity=".5"/>
        <rect x="310" y="254" width="110" height="4"  rx="2" fill="rgba(255,255,255,0.35)"/>

        {/* ── GRADUATION CAP ── */}
        <g style={{ animation: 'capFloat 3s ease-in-out infinite', transformOrigin: '370px 160px' }}>
          <polygon points="370,128 416,156 370,164 324,156" fill="#1a1d2e"/>
          <polygon points="370,128 416,156 370,164 324,156" fill="#252840"/>
          <line x1="324" y1="156" x2="416" y2="156" stroke="#3a3f70" strokeWidth="1.5"/>
          <ellipse cx="370" cy="168" rx="34" ry="11" fill="#1a1d2e"/>
          <rect x="334" y="154" width="72" height="9" rx="2" fill="#1a1d2e"/>
          <line x1="416" y1="156" x2="424" y2="180" stroke="#f5c842" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="424" cy="183" r="5" fill="#f5c842"/>
          <line x1="424" y1="188" x2="420" y2="202" stroke="#f5c842" strokeWidth="2" strokeLinecap="round"/>
          <line x1="424" y1="188" x2="424" y2="203" stroke="#f5c842" strokeWidth="2" strokeLinecap="round"/>
          <line x1="424" y1="188" x2="428" y2="202" stroke="#f5c842" strokeWidth="2" strokeLinecap="round"/>
          <text x="302" y="144" fontSize="12" fill="#f5c842" style={{ animation: 'sparkPulse 2.2s ease-in-out infinite 0.3s' }}>✦</text>
          <text x="432" y="138" fontSize="9"  fill="#f5c842" style={{ animation: 'sparkPulse 2.2s ease-in-out infinite 1.1s' }}>✦</text>
        </g>

        <line x1="372" y1="222" x2="372" y2="200" stroke="#f5c842" strokeWidth="1.5" strokeDasharray="4 4" opacity=".5"/>

        {/* ── CHARACTER ── */}
        <g style={{ animation: 'charSit 3.5s ease-in-out infinite' }}>
          <ellipse cx="368" cy="232" rx="26" ry="28" fill="#5b8ef0"/>
          <rect x="344" y="244" width="48" height="18" rx="0" fill="#5b8ef0"/>
          <ellipse cx="368" cy="206" rx="22" ry="24" fill="#f5c0a0"/>
          <ellipse cx="368" cy="190" rx="22" ry="14" fill="#1a1d2e"/>
          <path d="M348 200 Q354 191 368 189 Q382 191 388 200" fill="#1a1d2e"/>
          
          <path d="M344 234 Q330 248 332 264" stroke="#f5c0a0" strokeWidth="13" strokeLinecap="round" fill="none"/>
          <circle cx="332" cy="266" r="7" fill="#f5c0a0"/>
          
          <path d="M392 228 Q410 210 400 192" stroke="#f5c0a0" strokeWidth="13" strokeLinecap="round" fill="none"/>
          <circle cx="399" cy="190" r="8" fill="#f5c0a0"/>
          <line x1="395" y1="183" x2="391" y2="174" stroke="#f5c0a0" strokeWidth="4" strokeLinecap="round"/>
          <line x1="400" y1="182" x2="398" y2="173" stroke="#f5c0a0" strokeWidth="4" strokeLinecap="round"/>
          <line x1="405" y1="184" x2="406" y2="175" stroke="#f5c0a0" strokeWidth="4" strokeLinecap="round"/>
          
          <path d="M354 260 Q350 278 346 296" stroke="#1a1d2e" strokeWidth="13" strokeLinecap="round" fill="none"/>
          <path d="M382 260 Q386 278 390 296" stroke="#1a1d2e" strokeWidth="13" strokeLinecap="round" fill="none"/>
          <ellipse cx="343" cy="299" rx="12" ry="6" fill="#1a1d2e"/>
          <ellipse cx="392" cy="299" rx="12" ry="6" fill="#1a1d2e"/>
        </g>

        <text x="238" y="270" fontSize="10" fill="#f5c842" opacity=".7" style={{ animation: 'sparkPulse 2.8s ease-in-out infinite 0.6s' }}>✦</text>
        <text x="190" y="340" fontSize="8"  fill="#f5c842" opacity=".6" style={{ animation: 'sparkPulse 2.8s ease-in-out infinite 1.4s' }}>✦</text>
      </svg>

      {/* ── FLOATING CHIPS ── */}
      <div style={{
        position: 'absolute', top: '10%', left: '4%',
        background: 'white', borderRadius: 50, padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: 9,
        boxShadow: '0 4px 20px rgba(74,127,224,0.15)',
        border: '1px solid rgba(74,127,224,0.1)',
        animation: 'chipFloat1 3.8s ease-in-out infinite', whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 16 }}>📈</span>
        <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: '#1a1d2e' }}>Confidence Score: 78%</span>
      </div>

      <div style={{
        position: 'absolute', top: '16%', right: '2%',
        background: 'white', borderRadius: 50, padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: 9,
        boxShadow: '0 4px 20px rgba(74,127,224,0.15)',
        border: '1px solid rgba(74,127,224,0.1)',
        animation: 'chipFloat2 4.2s ease-in-out infinite 0.5s', whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 16 }}>🎤</span>
        <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: '#1a1d2e' }}>Mock interview ready</span>
      </div>

      <div style={{
        position: 'absolute', top: '52%', left: '3%',
        background: 'white', borderRadius: 50, padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: 9,
        boxShadow: '0 4px 20px rgba(74,127,224,0.15)',
        border: '1px solid rgba(74,127,224,0.1)',
        animation: 'chipFloat3 3.5s ease-in-out infinite 0.8s', whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 16 }}>✅</span>
        <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: '#1a1d2e' }}>Week 3 roadmap unlocked</span>
      </div>

      <div style={{
        position: 'absolute', bottom: '18%', right: '4%',
        background: 'white', borderRadius: 50, padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: 9,
        boxShadow: '0 4px 20px rgba(74,127,224,0.15)',
        border: '1px solid rgba(74,127,224,0.1)',
        animation: 'chipFloat4 4s ease-in-out infinite 1.2s', whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: 16 }}>🔥</span>
        <span style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: '#1a1d2e' }}>5 day streak!</span>
      </div>

    </div>
  );
}
