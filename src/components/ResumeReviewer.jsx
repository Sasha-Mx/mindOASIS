import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import api from '../services/api';

// Helper to load html2pdf
const loadHtml2Pdf = () => {
    return new Promise((resolve) => {
        if (window.html2pdf) return resolve(window.html2pdf);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve(window.html2pdf);
        document.head.appendChild(script);
    });
};

const LOADING_STEPS = [
  'Parsing resume text…',
  'Checking ATS compatibility…',
  'Scoring keyword density…',
  'Evaluating bullet impact…',
  'Computing final score…'
];

const KEYWORD_SUGGESTIONS = {
  'Kubernetes':      'e.g. "Orchestrated containerized micro­services on Kubernetes, reducing deployment time by 40%."',
  'CI/CD Pipelines': 'e.g. "Built CI/CD pipelines with GitHub Actions, cutting release cycles from weekly to daily."',
  'TDD':             'e.g. "Adopted TDD practices with Jest, achieving 95% code coverage across core modules."',
  'Docker':          'e.g. "Containerized legacy monolith with Docker, enabling consistent dev/staging/prod environments."',
  'AWS':             'e.g. "Deployed scalable REST APIs on AWS Lambda + API Gateway serving 50K daily requests."',
  'TypeScript':      'e.g. "Migrated 120K LoC JavaScript codebase to TypeScript, reducing runtime errors by 60%."',
  'GraphQL':         'e.g. "Designed a GraphQL API layer that reduced over-fetching and cut average payload size by 45%."',
  'Terraform':       'e.g. "Managed cloud infrastructure as code with Terraform across 3 AWS regions."',
  'Redis':           'e.g. "Implemented Redis-based caching layer, improving API response times by 70%."',
  'PostgreSQL':      'e.g. "Optimized PostgreSQL queries with proper indexing, reducing p99 latency from 800ms to 120ms."',
};

const IMPROVEMENT_POINTS = { critical: 5, important: 3, optional: 1 };

// Score ring component
function ScoreRing({ score, size = 100, label, color = '#7C3AED' }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  return (
    <div style={{ textAlign: 'center', margin: '0 auto' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 800, color: '#1E293B', pointerEvents: 'none'
        }}>
          {score}
        </div>
      </div>
      <div style={{ fontSize: 11, color, marginTop: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}

// Priority badge
function PriorityBadge({ priority }) {
  const config = {
    critical: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', label: 'Critical' },
    important: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Important' },
    optional: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', label: 'Optional' }
  }[priority] || { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE', label: priority };
  return (
    <span style={{
      background: config.bg, color: config.color,
      border: `1px solid ${config.border}`,
      fontSize: 10, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20
    }}>
      {config.label}
    </span>
  );
}

// Section score bar — horizontal progress
function SectionBar({ label, score, feedback }) {
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const barRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => { if (barRef.current) barRef.current.style.width = `${score}%`; }, 100);
    return () => clearTimeout(t);
  }, [score]);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{score}/100</span>
      </div>
      <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
        <div ref={barRef} style={{
          width: 0, height: '100%',
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 99, transition: 'width 1.2s cubic-bezier(.4,0,.2,1)'
        }} />
      </div>
      {feedback && (
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 6, lineHeight: 1.5 }}>
          {feedback}
        </div>
      )}
    </div>
  );
}

// Keyword tooltip popover
function KeywordPill({ keyword, onClose }) {
  const [show, setShow] = useState(false);
  const suggestion = KEYWORD_SUGGESTIONS[keyword] || `e.g. "Leveraged ${keyword} to deliver measurable improvements in project outcomes."`;
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        onClick={() => setShow(!show)}
        style={{
          padding: '6px 12px', background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#991B1B',
          cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s',
          boxShadow: show ? '0 0 0 2px #EF444444' : 'none'
        }}
      >
        ✕ {keyword}
      </span>
      {show && (
        <div style={{
          position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
          background: '#1E293B', color: '#F8FAFC', padding: '12px 16px', borderRadius: 12,
          fontSize: 12, lineHeight: 1.5, width: 300, zIndex: 50,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#F59E0B' }}>💡 How to add this keyword:</div>
          <div style={{ fontStyle: 'italic', color: '#CBD5E1' }}>{suggestion}</div>
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
            width: 12, height: 12, background: '#1E293B'
          }} />
        </div>
      )}
    </span>
  );
}

const MOCK_DATA = {
  analysis: {
    verdict: 'Good',
    summary: 'Your resume shows strong technical foundations and clear impact in major projects. To reach "Strong" or "Excellent", focus on quantifiable metrics in your professional experience and optimize for specific cloud-native keywords relevant to current SDE roles.',
    overallScore: 78,
    atsScore: 82,
    impactScore: 74,
    sections: {
      professional_summary: { score: 85, feedback: 'Strong opening, clearly states your value proposition.' },
      work_experience: { score: 72, feedback: 'Good role descriptions but lacking specific data-driven results.' },
      technical_skills: { score: 90, feedback: 'Excellent categorization of modern tech stacks.' },
      projects: { score: 80, feedback: 'Significant projects shown, but could benefit from architectural details.' }
    },
    weakBullets: [
      { original: 'Worked on a team to build a web application using React.' },
      { original: 'Responsible for maintaining the database and fixing bugs.' }
    ],
    improvements: [
      { action: 'Quantify impact', priority: 'critical', why: 'Use percentages or dollar amounts to show exactly how much your work improved the business.' },
      { action: 'Add Cloud keywords', priority: 'important', why: 'ATS filters for SDE roles often look for AWS, Docker, or Kubernetes even if not explicitly required.' },
      { action: 'Refine layout', priority: 'optional', why: 'A two-column layout might help you fit more projects without increasing page count.' }
    ]
  },
  keywords: {
    matchScore: 85,
    missing: ['Kubernetes', 'CI/CD Pipelines', 'TDD'],
    matched: ['React', 'Node.js', 'PostgreSQL', 'System Design']
  }
};

// Derive strengths / areas-to-fix from analysis data
function deriveStrengths(analysis, keywords) {
  const strengths = [];
  const fixes = [];
  if (analysis.sections) {
    const sorted = Object.entries(analysis.sections).sort((a, b) => b[1].score - a[1].score);
    sorted.forEach(([key, val]) => {
      const name = key.replace(/_/g, ' ');
      if (val.score >= 80 && strengths.length < 3) strengths.push({ text: `Strong ${name} (${val.score}/100)`, color: '#10B981' });
      if (val.score < 80 && fixes.length < 3)      fixes.push({ text: `Improve ${name} (${val.score}/100)`, color: val.score >= 60 ? '#F59E0B' : '#EF4444' });
    });
  }
  if (analysis.atsScore >= 80 && strengths.length < 3) strengths.push({ text: 'ATS-compatible formatting', color: '#10B981' });
  if (keywords?.matchScore >= 75 && strengths.length < 3) strengths.push({ text: `Good keyword coverage (${keywords.matchScore}%)`, color: '#10B981' });
  if (keywords?.missing?.length > 2 && fixes.length < 3) fixes.push({ text: `${keywords.missing.length} critical keywords missing`, color: '#EF4444' });
  if (analysis.weakBullets?.length > 0 && fixes.length < 3) fixes.push({ text: `${analysis.weakBullets.length} weak experience bullets`, color: '#F59E0B' });
  while (strengths.length < 3) strengths.push({ text: 'Solid foundational structure', color: '#10B981' });
  while (fixes.length < 3) fixes.push({ text: 'Add more quantifiable metrics', color: '#F59E0B' });
  return { strengths, fixes };
}

export default function ResumeReviewer() {
  const { user } = useUser();
  const [resumeText, setResumeText] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [showJobDesc, setShowJobDesc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [keywords, setKeywords] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [rewriting, setRewriting] = useState(null);
  const [rewrites, setRewrites] = useState({});
  const [downloading, setDownloading] = useState(false);
  const [analyzedAt, setAnalyzedAt] = useState(null);

  const reportRef = useRef(null);
  const tabsRef = useRef(null);
  const targetRole = user?.profile?.role || 'SDE';

  const tabs = ['overview', 'sections', 'keywords', 'bullets', 'improvements', 'compare jd'];

  // Loading step animation
  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
    }, 700);
    return () => clearInterval(interval);
  }, [loading]);

  // Keyboard tab navigation
  const handleTabKeyDown = useCallback((e) => {
    if (!analysis) return;
    const idx = tabs.indexOf(activeTab);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveTab(tabs[(idx + 1) % tabs.length]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
    }
  }, [activeTab, analysis]);

  useEffect(() => {
    window.addEventListener('keydown', handleTabKeyDown);
    return () => window.removeEventListener('keydown', handleTabKeyDown);
  }, [handleTabKeyDown]);

  const loadMockData = () => {
    setLoading(true);
    setTimeout(() => {
      setAnalysis(MOCK_DATA.analysis);
      setKeywords(MOCK_DATA.keywords);
      setActiveTab('overview');
      setAnalyzedAt(new Date());
      setLoading(false);
    }, 2400);
  };

  const analyzeResume = async () => {
    if (!resumeText.trim() || resumeText.length < 100) return;
    setLoading(true);
    setAnalysis(null);
    setKeywords(null);
    try {
      const [analyzeRes, keywordsRes] = await Promise.all([
        api.post('/resume/analyze', { resumeText }),
        api.post('/resume/check-keywords', { resumeText, jobDescription: jobDesc })
      ]);
      setAnalysis(analyzeRes.data);
      setKeywords(keywordsRes.data);
      setActiveTab('overview');
      setAnalyzedAt(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      const element = reportRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Resume-Review-Report-${targetRole.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const rewriteBullet = async (bullet, index) => {
    setRewriting(index);
    try {
      const res = await api.post('/resume/rewrite-bullet', { bullet, role: targetRole });
      setRewrites(prev => ({ ...prev, [index]: res.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setRewriting(null);
    }
  };

  const getVerdictConfig = (verdict) => ({
    'Needs Work': { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    'Average':    { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    'Good':       { color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
    'Strong':     { color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
    'Excellent':  { color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' }
  }[verdict] || { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' });

  // Sort improvements by impact
  const sortedImprovements = analysis?.improvements
    ? [...analysis.improvements].sort((a, b) => (IMPROVEMENT_POINTS[b.priority] || 0) - (IMPROVEMENT_POINTS[a.priority] || 0))
    : [];

  const possibleGain = analysis ? 100 - analysis.overallScore : 0;
  const missingCount = keywords?.missing?.length || 0;
  const weakBulletCount = analysis?.weakBullets?.length || 0;
  const sf = analysis && keywords ? deriveStrengths(analysis, keywords) : null;

  return (
    <div style={{ paddingBottom: 40, position: 'relative' }}>
        {/* Header content only visible when NOT analyzing */}
        {!loading && !analysis && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1E293B', margin: 0 }}>Resume Reviewer</h1>
              <span style={{
                background: 'linear-gradient(90deg, #7C3AED, #EC4899)',
                color: 'white', fontSize: 9, fontWeight: 700,
                padding: '3px 10px', borderRadius: 20,
                letterSpacing: 1, textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(124,58,237,0.35)'
              }}>
                Powered by Gemini
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              Paste your resume — get an instant AI analysis tailored for {targetRole} roles
            </p>
          </div>
        )}

        {/* Input section */}
        {!analysis && !loading && (
          <>
            <div style={{
              background: 'white', borderRadius: 20,
              border: '1.5px solid #E2E8F0', padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 32
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Paste your resume</label>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>{resumeText.length} characters</span>
                </div>
                <textarea
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste your full resume text here..."
                  style={{
                    width: '100%', minHeight: 260, padding: '14px 16px',
                    background: '#F8FAFC', border: '1.5px solid #E2E8F0',
                    borderRadius: 12, fontSize: 13, color: '#374151',
                    resize: 'vertical', outline: 'none', lineHeight: 1.6,
                    fontFamily: 'inherit', boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                onClick={() => setShowJobDesc(!showJobDesc)}
                style={{
                  background: 'none', border: '1.5px dashed #C4B5FD',
                  borderRadius: 10, padding: '8px 14px', fontSize: 12,
                  color: '#7C3AED', fontWeight: 600, cursor: 'pointer',
                  marginBottom: showJobDesc ? 12 : 0, width: '100%'
                }}
              >
                {showJobDesc ? '✕ Remove' : '+ Add'} job description for better keyword matching (optional)
              </button>

              {showJobDesc && (
                <textarea
                  value={jobDesc}
                  onChange={e => setJobDesc(e.target.value)}
                  placeholder="Paste the job description here..."
                  style={{
                    width: '100%', minHeight: 100, padding: '12px 14px',
                    background: '#F5F3FF', border: '1.5px solid #DDD6FE',
                    borderRadius: 10, fontSize: 12, color: '#374151',
                    resize: 'vertical', outline: 'none', lineHeight: 1.5,
                    fontFamily: 'inherit', marginTop: 10, boxSizing: 'border-box'
                  }}
                />
              )}

              <button
                onClick={analyzeResume}
                disabled={loading || resumeText.length < 100}
                style={{
                  width: '100%', marginTop: 16, padding: '14px',
                  background: resumeText.length >= 100 ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : '#E2E8F0',
                  color: resumeText.length >= 100 ? 'white' : '#94A3B8',
                  border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700,
                  cursor: resumeText.length >= 100 ? 'pointer' : 'not-allowed',
                  boxShadow: resumeText.length >= 100 ? '0 4px 16px rgba(124,58,237,0.35)' : 'none',
                }}
              >
                ⚡ Analyze My Resume
              </button>
            </div>

            {/* Mock Data Section */}
            <div style={{ padding: '0 4px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>✨</span> Try a sample report
              </h3>
              <div
                onClick={loadMockData}
                style={{
                  background: 'white', border: '1.5px solid #E2E8F0', borderRadius: 20, padding: 20,
                  cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative',
                  overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 20
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#7C3AED';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(124,58,237,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>Senior Software Engineer Resume</span>
                    <span style={{ background: '#F0FDF4', color: '#15803D', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Matched</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Last analyzed: 2 hours ago • Targeted at Google/Meta SDE roles</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>78 Score</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>82 ATS Fit</span>
                    </div>
                  </div>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: '#F8FAFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, border: '1px solid #E2E8F0', color: '#7C3AED'
                }}>→</div>
              </div>
            </div>
          </>
        )}

        {/* Loading state with step-by-step status */}
        {loading && (
          <div style={{
            background: 'white', borderRadius: 20, padding: '56px 24px', textAlign: 'center',
            border: '1.5px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: 64, height: 64, background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 26, animation: 'resumepulse 1.5s ease-in-out infinite'
            }}>⚡</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', marginBottom: 12 }}>Analyzing your resume…</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#7C3AED', marginBottom: 20, minHeight: 22 }}>
              {LOADING_STEPS[loadingStep]}
            </div>
            {/* Step indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              {LOADING_STEPS.map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', transition: 'all 0.3s',
                  background: i <= loadingStep ? '#7C3AED' : '#E2E8F0',
                  transform: i === loadingStep ? 'scale(1.4)' : 'scale(1)'
                }} />
              ))}
            </div>
            <style>{`@keyframes resumepulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }`}</style>
          </div>
        )}

        {/* Results */}
        {analysis && !loading && (
          <div ref={reportRef} style={{ animation: 'fadeInSlideUp 0.6s ease-out' }}>
            {/* Top bar: New Review + Timestamp + Download */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={() => { setAnalysis(null); setKeywords(null); setRewrites({}); }}
                  className="no-print"
                  style={{
                    background: 'none', border: '1.5px solid #E2E8F0',
                    borderRadius: 10, padding: '8px 16px', fontSize: 12,
                    color: '#64748B', fontWeight: 500, cursor: 'pointer'
                  }}
                >
                  ← New Review
                </button>
                {analyzedAt && (
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                    Last analyzed: {analyzedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {analyzedAt.toLocaleDateString()}
                  </span>
                )}
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="no-print"
                style={{
                  background: '#0F172A', color: 'white',
                  border: 'none', borderRadius: 10,
                  padding: '10px 20px', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                {downloading ? 'Generating PDF…' : '⬇ Download PDF Report'}
              </button>
            </div>

            {/* Verdict banner */}
            {(() => {
              const vc = getVerdictConfig(analysis.verdict);
              return (
                <div style={{
                  background: vc.bg, border: `1.5px solid ${vc.border}`,
                  borderRadius: 16, padding: '24px', marginBottom: 20
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Verdict</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: vc.color, marginBottom: 8 }}>{analysis.verdict}</div>
                      <div style={{ fontSize: 14, color: '#475569', maxWidth: 540, lineHeight: 1.6, marginBottom: 14 }}>{analysis.summary}</div>
                      {/* Status pills */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' }}>
                          ✓ ATS-safe format
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: missingCount > 0 ? '#FEF3C7' : '#DCFCE7', color: missingCount > 0 ? '#92400E' : '#166534', border: `1px solid ${missingCount > 0 ? '#FDE68A' : '#BBF7D0'}` }}>
                          {missingCount > 0 ? `⚠ ${missingCount} keywords missing` : '✓ All keywords matched'}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: weakBulletCount > 0 ? '#FEF2F2' : '#DCFCE7', color: weakBulletCount > 0 ? '#991B1B' : '#166534', border: `1px solid ${weakBulletCount > 0 ? '#FECACA' : '#BBF7D0'}` }}>
                          {weakBulletCount > 0 ? `✕ ${weakBulletCount} weak bullets` : '✓ All bullets strong'}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', paddingLeft: 24, flexShrink: 0 }}>
                      <div style={{ fontSize: 56, fontWeight: 900, color: vc.color, lineHeight: 1 }}>{analysis.overallScore}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981', marginTop: 6 }}>+{possibleGain} pts possible</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Strengths / Areas to fix card */}
            {sf && (
              <div style={{
                background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0',
                padding: '24px', marginBottom: 20, display: 'grid',
                gridTemplateColumns: '1fr 1fr', gap: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Strengths</div>
                  {sf.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 600 }}>{s.text}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Areas to Fix</div>
                  {sf.fixes.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 600 }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score rings */}
            <div style={{
              background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0',
              padding: '30px 24px', marginBottom: 20, display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}>
              <ScoreRing score={analysis.overallScore} label="Overall" color="#7C3AED" size={100} />
              <ScoreRing score={analysis.atsScore} label="ATS" color="#10B981" size={100} />
              <ScoreRing score={analysis.impactScore} label="Impact" color="#F59E0B" size={100} />
              <ScoreRing score={keywords?.matchScore || 0} label="Keywords" color="#EC4899" size={100} />
            </div>

            {/* Tabs */}
            <div ref={tabsRef} className="no-print" role="tablist" style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {tabs.map(tab => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  tabIndex={activeTab === tab ? 0 : -1}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    background: activeTab === tab ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'white',
                    color: activeTab === tab ? 'white' : '#64748B',
                    boxShadow: activeTab === tab ? '0 2px 10px rgba(124,58,237,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
                    textTransform: 'capitalize',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {tab}
                  {tab === 'compare jd' && (
                    <span style={{
                      background: activeTab === tab ? 'rgba(255,255,255,0.3)' : 'linear-gradient(90deg, #F59E0B, #EF4444)',
                      color: 'white', fontSize: 8, fontWeight: 800, padding: '2px 6px',
                      borderRadius: 6, letterSpacing: 0.5, textTransform: 'uppercase'
                    }}>NEW</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{
              background: 'white', borderRadius: 20, border: '1.5px solid #E2E8F0',
              padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}>
              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', marginBottom: 24, marginTop: 0 }}>Score Breakdown</h3>
                  {analysis.sections && Object.entries(analysis.sections).map(([key, val]) => (
                    <SectionBar key={key} label={key.replace(/_/g, ' ')} score={val.score} feedback={val.feedback} />
                  ))}
                </div>
              )}

              {/* SECTIONS */}
              {activeTab === 'sections' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', marginBottom: 16, marginTop: 0 }}>Section Details</h3>
                  {Object.entries(analysis.sections).map(([key, val]) => {
                    const color = val.score >= 80 ? '#10B981' : val.score >= 60 ? '#F59E0B' : '#EF4444';
                    return (
                      <div key={key} style={{ marginBottom: 12, padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, color: '#1E293B', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                          <span style={{ fontWeight: 800, color }}>{val.score}/100</span>
                        </div>
                        <div style={{ height: 6, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                          <div style={{ width: `${val.score}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 1s ease' }} />
                        </div>
                        <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>{val.feedback}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* KEYWORDS */}
              {activeTab === 'keywords' && keywords && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                   <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', marginBottom: 20, marginTop: 0 }}>Keyword Gap Analysis</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                     <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 }}>Missing Keywords · Click for suggestions</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {keywords.missing?.map(k => <KeywordPill key={k} keyword={k} />)}
                          {(!keywords.missing || keywords.missing.length === 0) && <p style={{ fontSize: 12, color: '#64748B' }}>No critical keywords missing!</p>}
                        </div>
                     </div>
                     <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 }}>Matched Keywords</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {keywords.matched?.map(k => <span key={k} style={{ padding: '6px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#15803D' }}>✓ {k}</span>)}
                        </div>
                     </div>
                   </div>
                </div>
              )}

              {/* BULLETS */}
              {activeTab === 'bullets' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                   <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', marginBottom: 12, marginTop: 0 }}>Impactful Rewrites</h3>
                   {/* AI Tip Box */}
                   <div style={{
                     background: 'linear-gradient(135deg, #7C3AED12, #EC489912)', border: '1.5px solid #DDD6FE',
                     borderRadius: 12, padding: '12px 16px', marginBottom: 20,
                     display: 'flex', alignItems: 'center', gap: 10
                   }}>
                     <span style={{ fontSize: 18 }}>💡</span>
                     <span style={{ fontSize: 13, color: '#5B21B6', fontWeight: 600, lineHeight: 1.4 }}>
                       Pro tip: Use the <strong>CAR format</strong> — <em>Context → Action → Result</em> — to write high-impact bullets that recruiters love.
                     </span>
                   </div>
                   <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>We identified weak points in your experience bullets. Click to see AI-optimized versions.</p>
                   {analysis.weakBullets?.map((b, i) => (
                     <div key={i} style={{ padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 12 }}>
                        <div style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic', marginBottom: 10 }}>Original: "{b.original}"</div>
                        {rewrites[i] ? (
                          <div style={{ padding: 12, background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span style={{ fontSize: 14 }}>🚀</span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>Optimized</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', lineHeight: 1.5 }}>{rewrites[i].rewritten}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => rewriteBullet(b.original, i)}
                            disabled={rewriting === i}
                            style={{
                              background: '#7C3AED', color: 'white', border: 'none',
                              padding: '8px 16px', borderRadius: 8, fontSize: 12,
                              fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease',
                              boxShadow: '0 4px 12px rgba(124,58,237,0.2)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            {rewriting === i ? 'Thinking…' : '⚡ Rewrite with AI'}
                          </button>
                        )}
                     </div>
                   ))}
                </div>
              )}

              {/* IMPROVEMENTS — sorted by impact */}
              {activeTab === 'improvements' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                   <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', marginBottom: 20, marginTop: 0 }}>Strategy & Improvements</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                     {sortedImprovements.map((item, i) => {
                       const pts = IMPROVEMENT_POINTS[item.priority] || 2;
                       return (
                         <div key={i} style={{
                           display: 'flex', gap: 14, padding: 16, background: '#F8FAFC',
                           borderRadius: 16, border: '1px solid #E2E8F0'
                         }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 10, background: '#7C3AED',
                              color: 'white', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0
                            }}>{i+1}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>{item.action}</div>
                                  <PriorityBadge priority={item.priority} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#10B981', background: '#F0FDF4', padding: '3px 10px', borderRadius: 20, border: '1px solid #BBF7D0' }}>
                                  +{pts} pts
                                </span>
                              </div>
                              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{item.why}</div>
                            </div>
                         </div>
                       );
                     })}
                   </div>
                </div>
              )}

              {/* COMPARE JD — new tab */}
              {activeTab === 'compare jd' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', marginBottom: 20, marginTop: 0 }}>Job Description Comparison</h3>
                  {jobDesc ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      {/* Left: JD */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Job Description</div>
                        <div style={{
                          background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
                          padding: 16, fontSize: 13, color: '#475569', lineHeight: 1.7,
                          maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap'
                        }}>{jobDesc}</div>
                      </div>
                      {/* Right: Match analysis */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Keyword Match Analysis</div>
                        {keywords && (
                          <>
                            {/* Match meter */}
                            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Overall Match</span>
                                <span style={{ fontSize: 15, fontWeight: 800, color: keywords.matchScore >= 75 ? '#10B981' : '#F59E0B' }}>{keywords.matchScore}%</span>
                              </div>
                              <div style={{ height: 8, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ width: `${keywords.matchScore}%`, height: '100%', borderRadius: 99, background: keywords.matchScore >= 75 ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #F59E0B, #FBBF24)', transition: 'width 1s ease' }} />
                              </div>
                            </div>
                            {/* Matched */}
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>✓ Found in your resume ({keywords.matched?.length || 0})</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {keywords.matched?.map(k => <span key={k} style={{ padding: '5px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#15803D' }}>✓ {k}</span>)}
                              </div>
                            </div>
                            {/* Missing */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>✕ Missing from resume ({keywords.missing?.length || 0})</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {keywords.missing?.map(k => <span key={k} style={{ padding: '5px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#991B1B' }}>✕ {k}</span>)}
                                {(!keywords.missing || keywords.missing.length === 0) && <p style={{ fontSize: 12, color: '#64748B' }}>All JD keywords matched!</p>}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center', padding: '48px 24px', background: '#F8FAFC',
                      borderRadius: 16, border: '1.5px dashed #CBD5E1'
                    }}>
                      <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>No job description provided</div>
                      <p style={{ fontSize: 13, color: '#64748B', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                        Go back and paste a job description alongside your resume to unlock a detailed keyword comparison analysis.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeInSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
          @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
          @media print { .no-print { display: none !important; } }
        `}</style>
    </div>
  );
}
