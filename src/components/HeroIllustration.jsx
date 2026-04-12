export default function HeroIllustration() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: 480,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        @keyframes walkCycle {
          0%   { transform: translateY(0px) rotate(-1deg); }
          25%  { transform: translateY(-5px) rotate(1deg); }
          50%  { transform: translateY(-2px) rotate(-0.5deg); }
          75%  { transform: translateY(-6px) rotate(1.5deg); }
          100% { transform: translateY(0px) rotate(-1deg); }
        }
        @keyframes walkUpStairs {
          0%  { transform: translate(-220px, 50px); opacity: 0; }
          3%  { transform: translate(-220px, 50px); opacity: 1; }
          25% { transform: translate(-140px, 50px); opacity: 1; }
          30% { transform: translate(-120px, -10px); opacity: 1; }
          55% { transform: translate(-40px, -10px); opacity: 1; }
          60% { transform: translate(-20px, -70px); opacity: 1; }
          85% { transform: translate(60px, -70px); opacity: 1; }
          90% { transform: translate(80px, -130px); opacity: 0; }
          100%{ transform: translate(-220px, 50px); opacity: 0; }
        }
        @keyframes armReach {
          0%,100% { transform: rotate(-5deg); }
          50%      { transform: rotate(8deg); }
        }
        @keyframes legSwing {
          0%,100% { transform: rotate(0deg); }
          50%      { transform: rotate(12deg); }
        }
        @keyframes capSpin {
          0%   { transform: translateY(0px) rotate(-8deg); }
          30%  { transform: translateY(-18px) rotate(5deg); }
          60%  { transform: translateY(-10px) rotate(-4deg); }
          100% { transform: translateY(0px) rotate(-8deg); }
        }
        @keyframes cloudDrift {
          0%,100% { transform: translateX(0px); }
          50%      { transform: translateX(8px); }
        }
        @keyframes bookWobble {
          0%,100% { transform: rotate(-3deg); }
          50%      { transform: rotate(3deg); }
        }
        @keyframes motionLine {
          0%   { opacity: 0; transform: translateX(0px); }
          50%  { opacity: 1; }
          100% { opacity: 0; transform: translateX(-8px); }
        }
        @keyframes scarfFlap {
          0%,100% { transform: rotate(-4deg) scaleX(1); }
          50%      { transform: rotate(6deg) scaleX(1.08); }
        }
        @keyframes sparkle {
          0%,100% { opacity:.4; transform:scale(1); }
          50%      { opacity:1; transform:scale(1.5); }
        }
      `}</style>

      <svg
        viewBox="0 0 520 560"
        width="100%"
        style={{ maxWidth: 520, overflow: 'visible' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── BACKGROUND CLOUDS ── */}
        <g style={{ animation: 'cloudDrift 5s ease-in-out infinite' }}>
          <ellipse cx="80"  cy="180" rx="38" ry="18" fill="rgba(255,255,255,0.55)"/>
          <ellipse cx="110" cy="172" rx="28" ry="16" fill="rgba(255,255,255,0.55)"/>
          <ellipse cx="60"  cy="172" rx="22" ry="14" fill="rgba(255,255,255,0.55)"/>
        </g>
        <g style={{ animation: 'cloudDrift 6.5s ease-in-out infinite 1s' }}>
          <ellipse cx="380" cy="320" rx="30" ry="14" fill="rgba(255,255,255,0.45)"/>
          <ellipse cx="406" cy="313" rx="22" ry="12" fill="rgba(255,255,255,0.45)"/>
          <ellipse cx="360" cy="315" rx="18" ry="11" fill="rgba(255,255,255,0.45)"/>
        </g>
        <g style={{ animation: 'cloudDrift 7s ease-in-out infinite 2s' }}>
          <ellipse cx="440" cy="160" rx="26" ry="12" fill="rgba(255,255,255,0.4)"/>
          <ellipse cx="462" cy="154" rx="18" ry="11" fill="rgba(255,255,255,0.4)"/>
        </g>

        {/* ── STAIR LINES (gold/orange outline only, no fill) ── */}
        <path
          d="M30 500 L30 440 L120 440 L120 380 L220 380 L220 320 L320 320 L320 260 L430 260"
          fill="none"
          stroke="#f5a623"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />

        {/* ── GRADUATION CAP (top right, floating) ── */}
        <g style={{ animation: 'capSpin 3.2s ease-in-out infinite', transformOrigin: '420px 90px' }}>
          {/* Board */}
          <polygon
            points="420,55 468,82 420,90 372,82"
            fill="#1a1d2e"
            stroke="#1a1d2e"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Cap base cylinder */}
          <ellipse cx="420" cy="95" rx="30" ry="10" fill="#1a1d2e"/>
          <rect x="390" y="80" width="60" height="10" rx="1" fill="#1a1d2e"/>
          {/* Tassel string */}
          <line x1="468" y1="82" x2="476" y2="108" stroke="#f5c842" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="476" cy="111" r="5" fill="#f5c842"/>
          {/* Tassel threads */}
          <line x1="476" y1="116" x2="472" y2="130" stroke="#f5c842" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="476" y1="116" x2="476" y2="131" stroke="#f5c842" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="476" y1="116" x2="480" y2="130" stroke="#f5c842" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Motion lines around cap */}
          <line x1="356" y1="68" x2="344" y2="64" stroke="#1a1d2e" strokeWidth="2.5" strokeLinecap="round" opacity=".6"
            style={{ animation: 'motionLine 1.4s ease-in-out infinite' }}/>
          <line x1="354" y1="82" x2="340" y2="82" stroke="#1a1d2e" strokeWidth="2.5" strokeLinecap="round" opacity=".5"
            style={{ animation: 'motionLine 1.4s ease-in-out infinite 0.2s' }}/>
          <line x1="358" y1="96" x2="346" y2="100" stroke="#1a1d2e" strokeWidth="2.5" strokeLinecap="round" opacity=".4"
            style={{ animation: 'motionLine 1.4s ease-in-out infinite 0.4s' }}/>
        </g>

        {/* ── MAIN CHARACTER GROUP (walks up stairs) ── */}
        <g style={{ animation: 'walkUpStairs 5s linear infinite' }}>
          <g style={{ animation: 'walkCycle 1s ease-in-out infinite', transformOrigin: '260px 360px' }}>

          {/* ── BOOKS (held in left arm) ── */}
          <g style={{ animation: 'bookWobble 1s ease-in-out infinite', transformOrigin: '210px 300px' }}>
            {/* Book stack — 3 books slightly offset */}
            <rect x="188" y="292" width="52" height="10" rx="2" fill="#e96bbd" stroke="#1a1d2e" strokeWidth="2"/>
            <rect x="190" y="280" width="52" height="12" rx="2" fill="#7b6cf6" stroke="#1a1d2e" strokeWidth="2"/>
            <rect x="186" y="270" width="52" height="12" rx="2" fill="#4a7fe0" stroke="#1a1d2e" strokeWidth="2"/>
            {/* Arm holding books */}
            <path d="M228 310 Q218 318 200 308 Q188 300 190 288"
              fill="none" stroke="#d4956a" strokeWidth="11" strokeLinecap="round"/>
          </g>

          {/* ── BODY / JACKET ── */}
          {/* Main jacket shape */}
          <path
            d="M222 240 Q210 260 212 300 Q214 320 230 328 Q250 334 270 330 Q290 326 296 308 Q304 282 298 252 Q288 232 270 228 Q248 224 222 240Z"
            fill="#e8eefc"
            stroke="#1a1d2e"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Jacket lapels */}
          <path d="M248 228 Q244 252 250 268" fill="none" stroke="#1a1d2e" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M270 228 Q274 252 268 268" fill="none" stroke="#1a1d2e" strokeWidth="2.5" strokeLinecap="round"/>

          {/* ── SCARF / ORANGE NECK TIE ── */}
          <g style={{ animation: 'scarfFlap 1s ease-in-out infinite', transformOrigin: '258px 248px' }}>
            <path
              d="M248 238 Q254 260 250 290 Q252 308 258 318 Q262 310 264 290 Q262 260 270 238 Q262 232 248 238Z"
              fill="#f5a623"
              stroke="#1a1d2e"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>

          {/* ── LEFT ARM (tucked, holding books) ── */}
          <path
            d="M222 256 Q204 268 196 292"
            fill="none" stroke="#e8eefc" strokeWidth="16" strokeLinecap="round"
          />
          <path
            d="M222 256 Q204 268 196 292"
            fill="none" stroke="#1a1d2e" strokeWidth="3" strokeLinecap="round"
          />

          {/* ── RIGHT ARM (reaching up toward cap) ── */}
          <g style={{ animation: 'armReach 1s ease-in-out infinite', transformOrigin: '294px 256px' }}>
            <path
              d="M294 256 Q316 228 350 198"
              fill="none" stroke="#e8eefc" strokeWidth="16" strokeLinecap="round"
            />
            <path
              d="M294 256 Q316 228 350 198"
              fill="none" stroke="#1a1d2e" strokeWidth="3" strokeLinecap="round"
            />
            {/* Hand */}
            <circle cx="352" cy="196" r="10" fill="#d4956a" stroke="#1a1d2e" strokeWidth="2.5"/>
            {/* Fingers */}
            <line x1="347" y1="187" x2="342" y2="178" stroke="#d4956a" strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="353" y1="186" x2="351" y2="176" stroke="#d4956a" strokeWidth="4.5" strokeLinecap="round"/>
            <line x1="359" y1="188" x2="360" y2="178" stroke="#d4956a" strokeWidth="4.5" strokeLinecap="round"/>
            {/* Motion lines from hand */}
            <line x1="368" y1="178" x2="378" y2="172" stroke="#1a1d2e" strokeWidth="2" strokeLinecap="round" opacity=".5"
              style={{ animation: 'motionLine 0.8s ease-in-out infinite' }}/>
            <line x1="370" y1="190" x2="382" y2="188" stroke="#1a1d2e" strokeWidth="2" strokeLinecap="round" opacity=".4"
              style={{ animation: 'motionLine 0.8s ease-in-out infinite 0.15s' }}/>
          </g>

          {/* ── HEAD ── */}
          {/* Neck */}
          <rect x="250" y="212" width="18" height="20" rx="4" fill="#d4956a" stroke="#1a1d2e" strokeWidth="2"/>
          {/* Head shape — slightly oval */}
          <ellipse cx="258" cy="190" rx="40" ry="44" fill="#d4956a" stroke="#1a1d2e" strokeWidth="3"/>

          {/* ── CURLY HAIR ── */}
          {/* Main hair mass */}
          <ellipse cx="258" cy="160" rx="42" ry="30" fill="#1a1d2e"/>
          {/* Curly bumps on top */}
          <circle cx="228" cy="154" r="16" fill="#1a1d2e"/>
          <circle cx="246" cy="146" r="18" fill="#1a1d2e"/>
          <circle cx="266" cy="143" r="17" fill="#1a1d2e"/>
          <circle cx="284" cy="150" r="15" fill="#1a1d2e"/>
          <circle cx="296" cy="162" r="13" fill="#1a1d2e"/>
          {/* Hair sides */}
          <ellipse cx="220" cy="175" rx="14" ry="20" fill="#1a1d2e"/>
          <ellipse cx="296" cy="175" rx="12" ry="16" fill="#1a1d2e"/>

          {/* ── FACE FEATURES ── */}
          {/* Eyes — round, with shine dots */}
          <circle cx="242" cy="186" r="9"  fill="white" stroke="#1a1d2e" strokeWidth="2.5"/>
          <circle cx="272" cy="186" r="9"  fill="white" stroke="#1a1d2e" strokeWidth="2.5"/>
          <circle cx="244" cy="188" r="5"  fill="#1a1d2e"/>
          <circle cx="274" cy="188" r="5"  fill="#1a1d2e"/>
          {/* Eye shine */}
          <circle cx="247" cy="185" r="2"  fill="white"/>
          <circle cx="277" cy="185" r="2"  fill="white"/>

          {/* ── GLASSES ── */}
          <rect x="232" y="179" width="20" height="16" rx="8"
            fill="none" stroke="#1a1d2e" strokeWidth="2.5"/>
          <rect x="262" y="179" width="20" height="16" rx="8"
            fill="none" stroke="#1a1d2e" strokeWidth="2.5"/>
          {/* Bridge */}
          <line x1="252" y1="187" x2="262" y2="187" stroke="#1a1d2e" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Arms */}
          <line x1="232" y1="187" x2="222" y2="185" stroke="#1a1d2e" strokeWidth="2" strokeLinecap="round"/>
          <line x1="282" y1="187" x2="292" y2="185" stroke="#1a1d2e" strokeWidth="2" strokeLinecap="round"/>

          {/* Expression — determined open mouth smile */}
          <path d="M248 206 Q258 215 268 206"
            fill="none" stroke="#1a1d2e" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Eyebrow — raised/determined */}
          <path d="M233 175 Q242 170 251 174"
            fill="none" stroke="#1a1d2e" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M263 174 Q272 169 281 173"
            fill="none" stroke="#1a1d2e" strokeWidth="2.5" strokeLinecap="round"/>

          {/* Rosy cheeks */}
          <ellipse cx="232" cy="202" rx="8" ry="5" fill="#f0a090" opacity=".55"/>
          <ellipse cx="284" cy="202" rx="8" ry="5" fill="#f0a090" opacity=".55"/>

          {/* ── PANTS ── */}
          {/* Left leg */}
          <path
            d="M228 324 Q220 358 208 388 Q214 400 226 400 Q234 388 242 358 Q246 338 244 326Z"
            fill="#1a1d2e"
            stroke="#1a1d2e"
            strokeWidth="1"
          />
          {/* Right leg */}
          <path
            d="M276 324 Q284 358 296 388 Q290 400 278 400 Q270 388 266 358 Q262 338 264 326Z"
            fill="#1a1d2e"
            stroke="#1a1d2e"
            strokeWidth="1"
          />

          {/* ── SHOES ── */}
          {/* Left shoe (kicked back — running pose) */}
          <g style={{ animation: 'legSwing 1s ease-in-out infinite', transformOrigin: '216px 390px' }}>
            <path d="M208 390 Q196 396 182 394 Q176 398 180 406 Q194 410 214 404 Q228 400 226 392Z"
              fill="#1a1d2e" stroke="#1a1d2e" strokeWidth="1.5"/>
          </g>
          {/* Right shoe (forward stride) */}
          <path d="M296 390 Q308 396 322 392 Q328 396 325 404 Q312 410 292 406 Q278 402 278 394Z"
            fill="#1a1d2e" stroke="#1a1d2e" strokeWidth="1.5"/>

          {/* White sock flash */}
          <rect x="208" y="384" width="18" height="8" rx="2" fill="white" opacity=".7"/>
          <rect x="278" y="384" width="18" height="8" rx="2" fill="white" opacity=".7"/>

        </g></g>{/* end character group */}

        {/* ── SMALL SPARKLES scattered ── */}
        <text x="130" y="200" fontSize="14" fill="#f5c842"
          style={{ animation: 'sparkle 2.4s ease-in-out infinite 0.3s' }}>✦</text>
        <text x="400" y="280" fontSize="10" fill="#f5c842"
          style={{ animation: 'sparkle 2.4s ease-in-out infinite 1s' }}>✦</text>
        <text x="80"  y="380" fontSize="9"  fill="#f5c842"
          style={{ animation: 'sparkle 2.4s ease-in-out infinite 1.7s' }}>✦</text>
        <text x="460" y="360" fontSize="11" fill="#7b6cf6"
          style={{ animation: 'sparkle 3s ease-in-out infinite 0.8s' }}>✦</text>

      </svg>
    </div>
  );
}
