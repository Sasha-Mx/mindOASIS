import { useState, useEffect } from 'react';
import api from '../services/api';

// ─── Career Decision Intelligence Engine (Formerly MarketIntelligence) ───
export default function MarketIntelligence({ userRole, mode = 'dashboard', userGaps = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/market/status')
      .then(res => {
        if (res.data?.available) setData(res.data.data);
      })
      .catch(err => {
        console.error('[CareerDecisionEngine] fetch error:', err.message);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadReport = async () => {
    try {
      const response = await api.get('/market/download-report', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Career_Intelligence_Report.md`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed", error);
      alert("Failed to download report. Please try again later.");
    }
  };

  if (loading) return (
    <div style={{ padding: '8px 0', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>
      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', marginRight: 8, animation: 'pulse 1.5s infinite' }} />
      Syncing Market Insights...
      <style>{`@keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }`}</style>
    </div>
  );

  if (error || !data || !data.marketAlignment) return (
    <div style={{ padding: '8px 0', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>
       Analysis Pending...
    </div>
  );

  // ─── ROADMAP MODE: actionable timeline UI ───
  if (mode === 'roadmap') {
    const buckets = data.recommendationBuckets || {};
    const hasData = buckets.immediate?.length || buckets.midTerm?.length || buckets.longTerm?.length;
    if (!hasData) return (
      <div style={{ padding: '8px 0', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>
         Updating Action Plan...
      </div>
    );

    const BucketSection = ({ title, icon, items, color, bg }) => {
      if (!items || !items.length) return null;
      return (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span>{icon}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: color, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {title}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {items.map((skill, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, fontWeight: 700, padding: '6px 8px 6px 14px', borderRadius: 12,
                background: 'white', color: '#1E293B', border: `1.5px solid ${bg}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                {skill}
                <a 
                   href={`https://www.youtube.com/results?search_query=${encodeURIComponent(skill + " full course tutorial")}`}
                   target="_blank" rel="noreferrer"
                   style={{ 
                     display: 'inline-flex', alignItems: 'center', gap: 4,
                     color: 'white', background: color, padding: '4px 10px', 
                     borderRadius: 8, fontSize: 11, textDecoration: 'none', fontWeight: 800,
                     transition: 'opacity 0.2s',
                   }}
                   onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                   onMouseOut={e => e.currentTarget.style.opacity = '1'}
                >
                   ▶️ Watch
                </a>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div style={{ marginTop: 24, padding: '24px', background: 'linear-gradient(to bottom right, #FAFAFF, #F1F5F9)', borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 900, color: '#0F172A' }}>Job Market Timeline Needs</h4>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Accurate analysis based on current industry demands.</p>
        </div>
        
        <BucketSection title="Phase 1: Immediate (Next Month)" icon="🗓️" items={buckets.immediate} color="#EF4444" bg="#FECACA" />
        <BucketSection title="Phase 2: Market Edge (2-4 Months)" icon="🔥" items={buckets.midTerm} color="#F59E0B" bg="#FDE68A" />
        <BucketSection title="Phase 3: Long-term Edge (5-8 Months)" icon="🚀" items={buckets.longTerm} color="#8B5CF6" bg="#DDD6FE" />
      </div>
    );
  }

  // ─── PREVIEW MODE: Mini dashboard embed ───
  if (mode === 'preview') {
    return (
      <div style={{ marginTop: 24, padding: '24px', background: 'linear-gradient(to right, #F8FAFC, #F1F5F9)', borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px 0', lineHeight: 1.6 }}>
          Your current {userRole || 'career'} alignment is <strong style={{color: '#1E293B'}}>"{data.marketAlignment.standing}"</strong> — there’s strong competition at this stage.  
          <br /><br />
          Discover how to improve your position and unlock better opportunities.
        </p>

        <a href="/market" style={{
          display: 'block', textAlign: 'center', background: '#7C3AED', color: 'white',
          padding: '12px 16px', borderRadius: 12, fontSize: 13, fontWeight: 800, textDecoration: 'none',
          transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          View Market Intelligence →
        </a>
      </div>
    );
  }

  // ─── DASHBOARD MODE: Full Decision Intelligence Dashboard ───
  return (
    <div style={{ marginTop: 32 }}>
      {/* HEADER & DOWNLOAD BUTTON */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#1E293B', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            Career Decision Intelligence <span style={{ fontSize: 18 }}>🔥</span>
          </h3>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Deep market alignment & simulated company matching for {userRole || 'your role'}
          </p>
        </div>
        <button 
          onClick={handleDownloadReport}
          style={{
            background: 'linear-gradient(135deg, #1E293B, #0F172A)', color: 'white',
            border: 'none', padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 12,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(15,23,42,0.15)', transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span>⬇</span> Download Report
        </button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.5fr)', gap: 20, marginBottom: 20
      }}>
        {/* 1. MARKET ALIGNMENT CARD */}
        <div style={{ background: 'white', padding: 24, borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
             <span style={{ fontSize: 10, fontWeight: 900, color: '#64748B', letterSpacing: 1, textTransform: 'uppercase' }}>Current Alignment</span>
             <span style={{ fontSize: 13, fontWeight: 900, color: data.marketAlignment.score > 70 ? '#10B981' : '#F59E0B' }}>
                {data.marketAlignment.score}% Match
             </span>
          </div>
          
          <div style={{ marginBottom: 24 }}>
            <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
               <div style={{ width: `${data.marketAlignment.score}%`, height: '100%', background: 'linear-gradient(90deg, #7C3AED, #e96bbd)', transition: 'width 1s ease-out' }} />
            </div>
          </div>

          <h4 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 900, color: '#1E293B' }}>{data.marketAlignment.standing}</h4>
          <p style={{ margin: 0, fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>{data.marketAlignment.summary}</p>
        </div>

        {/* 2. IMPACT SIMULATOR (WOW FEATURE) */}
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)', borderRadius: 20, padding: 24,
          color: 'white', boxShadow: '0 8px 24px rgba(124,58,237,0.25)', position: 'relative', overflow: 'hidden'
        }}>
          {/* Subtle background flair */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(30px)' }} />

          <h4 style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>
            ⚡ Impact Simulator
          </h4>
          <div style={{ fontSize: 15, fontWeight: 500, opacity: 0.9, marginBottom: 8 }}>
            If you learn <strong style={{ color: '#FFE4E6', fontSize: 18 }}>{data.impactSimulator.targetSkill}</strong>
          </div>
          
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: 12, flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 4 }}>New Score</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{data.impactSimulator.newAlignmentScore}%</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: 12, flex: 1.5, minWidth: 160 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 4 }}>Expected Impact</div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{data.impactSimulator.opportunityIncrease}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 13, background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: 8, borderLeft: '3px solid white' }}>
            {data.impactSimulator.unlockedRoles}
          </div>
        </div>
      </div>

      {/* 3. COMPANY COMPARISON & INSIGHTS */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 13, fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          🏢 Company Alignment Models
        </h4>

        {/* DECISION INSIGHT BANNER */}
        <div style={{
          background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px 20px', borderRadius: 14, marginBottom: 16,
          display: 'flex', gap: 16, alignItems: 'center'
        }}>
          <div style={{ fontSize: 24 }}>💡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{data.decisionInsights.closestRole}</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>{data.decisionInsights.opportunityInsight}</div>
          </div>
        </div>

        {/* COMPANY GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {data.companyAlignment.map((company, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h5 style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', margin: 0 }}>{company.companyType}</h5>
                <span style={{
                  fontSize: 12, fontWeight: 800, color: company.matchPercentage >= 70 ? '#059669' : '#0F172A',
                  background: company.matchPercentage >= 70 ? '#ECFDF5' : '#F1F5F9', padding: '4px 10px', borderRadius: 12
                }}>
                  {company.matchPercentage}% Match
                </span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>Strengths</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {company.strengths.length > 0 ? company.strengths.map((s, idx) => (
                    <span key={idx} style={{ fontSize: 11, background: '#F8FAFC', color: '#475569', padding: '2px 8px', borderRadius: 6, border: '1px solid #E2E8F0' }}>{s}</span>
                  )) : <span style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>None mapped</span>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>Missing Limits</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {company.missingSkills.length > 0 ? company.missingSkills.map((s, idx) => (
                    <span key={idx} style={{ fontSize: 11, background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: 6, border: '1px solid #FECACA' }}>{s}</span>
                  )) : <span style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>None missing</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. RECOMMENDATION TIERS */}
      <div>
        <h4 style={{ fontSize: 13, fontWeight: 900, color: '#1E293B', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          🎯 Actionable Recommendations
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          
          {/* Phase 1 */}
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🚀 Phase 1: Next Month</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#7F1D1D', fontSize: 13, lineHeight: 1.6, fontWeight: 500 }}>
              {(data.recommendationBuckets?.immediate || []).map((req, i) => <li key={i}>{req}</li>)}
            </ul>
          </div>

          {/* Phase 2 */}
          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#5B21B6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>📈 Phase 2: Months 2-4</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#4C1D95', fontSize: 13, lineHeight: 1.6, fontWeight: 500 }}>
              {(data.recommendationBuckets?.midTerm || []).map((req, i) => <li key={i}>{req}</li>)}
            </ul>
          </div>

          {/* Phase 3 */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>✨ Phase 3: Months 5-8</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#78350F', fontSize: 13, lineHeight: 1.6, fontWeight: 500 }}>
              {(data.recommendationBuckets?.longTerm || []).map((req, i) => <li key={i}>{req}</li>)}
            </ul>
          </div>

        </div>
      </div>
      
    </div>
  );
}
