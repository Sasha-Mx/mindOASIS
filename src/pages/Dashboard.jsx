import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import MarketIntelligence from '../components/MarketIntelligence';
import ResumeReviewer from '../components/ResumeReviewer';

// ─── Animated Number ────────────────────────────────────────────
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let startTime;
    const duration = 1200;
    const target = parseInt(value, 10) || 0;
    const animate = (time) => {
      if (!startTime) startTime = time;
      const pct = Math.min((time - startTime) / duration, 1);
      setDisplayValue(Math.floor(target * (1 - Math.pow(1 - pct, 3))));
      if (pct < 1) requestAnimationFrame(animate);
      else setDisplayValue(target);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{displayValue}</span>;
};

// ─── Llama Badge ────────────────────────────────────────────────
const LlamaBadge = ({ style }) => (
  <span style={{
    background: '#F0EDFF', color: '#534AB7',
    border: '0.5px solid #CECBF6', borderRadius: 20,
    padding: '4px 10px', fontSize: 11, fontWeight: 500,
    whiteSpace: 'nowrap', ...style
  }}>
    ⚡ Powered by Llama AI
  </span>
);

// ─── Time-based greeting ────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

// ─── Mission colors ─────────────────────────────────────────────
const missionStyle = {
  learn:    { bg: '#E6F7F2', color: '#0D9488', icon: '📘' },
  practice: { bg: '#F0EDFF', color: '#7C3AED', icon: '💪' },
  build:    { bg: '#FFF8EC', color: '#D97706', icon: '🔨' }
};

const Dashboard = () => {
  const { user: globalUser, setUser: setGlobalUser, logout } = useUser();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [missions, setMissions] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [benchmark, setBenchmark] = useState(null);
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      await api.patch('/users/streak');
      const res = await api.get('/profile/me');
      const user = res.data;
      setUserData(user);
      setGlobalUser(user);

      // Get missions from either new or old format
      const dm = user.roadmap?.daily_missions || [];
      setMissions(dm);

      // Compute completed for today
      const today = new Date().toISOString().split('T')[0];
      const todayCompleted = new Set();
      (user.completedMissions || []).forEach(mId => {
        if (mId.startsWith(today + ':')) todayCompleted.add(mId.substring(today.length + 1));
      });
      setCompleted(todayCompleted);

      // Handle benchmark
      if (user.benchmark) {
        setBenchmark(user.benchmark);
      } else if (user.onboardingDone) {
        generateBenchmark(user);
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) { logout(); navigate('/login'); }
    } finally {
      setLoading(false);
    }
  };

  // Auto-regenerate gapReport if missing but onboarding is done
  useEffect(() => {
    if (userData?.onboardingDone && (!userData?.gapReport || !userData?.gapReport?.alreadyKnown) && retryCount < 2) {
      const regenerate = async () => {
        try {
          console.log('Regenerating gapReport...');
          const res = await api.get('/career/regenerate-gaps');
          if (res.data?.user) {
            setUserData(res.data.user);
            setGlobalUser(res.data.user);
          }
        } catch (err) {
          console.error('Gap regeneration failed:', err);
        }
        setRetryCount(prev => prev + 1);
      };
      const timer = setTimeout(regenerate, 1000);
      return () => clearTimeout(timer);
    }
  }, [userData, retryCount]);

  const handleRefreshMissions = async () => {
    setRefreshing(true);
    try {
      const res = await api.post('/missions/refresh');
      setMissions(res.data.daily_missions || []);
      setCompleted(new Set());
    } catch (err) { console.error(err); }
    setRefreshing(false);
  };

  const toggleMission = async (mission) => {
    const missionText = typeof mission === 'string' ? mission : (mission.task || mission.text);
    if (completed.has(missionText)) return;
    const newCompleted = new Set(completed);
    newCompleted.add(missionText);
    setCompleted(newCompleted);
    try {
      const res = await api.patch('/missions/complete', {
        missionText,
        xpReward: mission.xp || 15,
        type: mission.type
      });
      setGlobalUser(prev => ({
        ...prev,
        xp: res.data.xp,
        level: res.data.level,
        streakDays: res.data.streakDays,
        badges: res.data.badges,
        completedMissions: res.data.completedMissions
      }));
      if (newCompleted.size === missions.length && missions.length > 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (err) {
      console.error('Failed to mark complete', err);
      const reverted = new Set(newCompleted);
      reverted.delete(missionText);
      setCompleted(reverted);
    }
  };

  const generateBenchmark = async (u) => {
    setLoadingBenchmark(true);
    try {
      // Map profile skills to integer score out of 4
      const userSkills = {};
      (u.profile?.skills || []).forEach(s => {
        const name = (typeof s === 'string' ? s : s.name).toLowerCase();
        let level = typeof s === 'string' ? 1 : (s.level === 'advanced' ? 3 : s.level === 'intermediate' ? 2 : 1);
        
        if (name.includes('dsa') || name.includes('algorithm')) userSkills['DSA'] = level;
        else if (name.includes('object') || name.includes('oop')) userSkills['OOP'] = level;
        else if (name.includes('sql') || name.includes('database')) userSkills['SQL'] = level;
        else if (name.includes('system') || name.includes('architecture')) userSkills['SystemDesign'] = level;
      });
      userSkills['Projects'] = u.profile?.hasProjects ? 2 : 1;

      const cohort = u.profile?.mode === 'Internship' 
        ? (u.level > 2 ? 'internship_advanced' : 'internship_beginner')
        : ((u.profile?.role || '').toLowerCase().includes('product') ? 'placement_product' : 'placement_service');

      const res = await api.post('/benchmark', { userSkills, targetCohort: cohort });
      
      // Save locally to state to prevent re-fetching
      setBenchmark(res.data);
      // We also update user data locally
      setGlobalUser(prev => ({ ...prev, benchmark: res.data }));
    } catch (err) {
      console.error('Failed to generate benchmark', err);
    } finally {
      setLoadingBenchmark(false);
    }
  };

  // Derived data
  const gapReport = userData?.gapReport || null;
  const readinessScore = gapReport?.readinessScore || userData?.confidenceScore || 0;
  const streakDays = userData?.streakDays || 0;
  const xp = userData?.xp || 0;
  const level = userData?.level || 1;
  const roadmapArr = userData?.roadmap?.roadmap || [];
  const completedWeeks = roadmapArr.filter((_, i) => i < (userData?.currentWeek || 0)).length;
  const profile = userData?.profile || {};
  const targetRole = profile.role || 'Not set';
  const targetMode = profile.mode || 'Placement';

  // Find current week (first incomplete)
  const currentWeekObj = roadmapArr.find((w, i) => i >= completedWeeks) || roadmapArr[0] || null;

  const isUserOnboarded = userData?.onboardingDone || !!userData?.roadmap;

  // ─── EMPTY STATES ─────────────────────────────────────────────
  if (!loading && userData && !isUserOnboarded) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        <div className="flex w-full h-screen overflow-hidden bg-[var(--bg-page)] font-dm-sans">
          <Sidebar />
          <main className="flex-1 h-full flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-10 bg-white rounded-3xl shadow-xl border border-slate-100">
              <div className="text-6xl mb-6">🎓</div>
              <h2 className="font-nunito font-black text-3xl text-slate-800 mb-3">Welcome to Mentra.AI</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">Complete your onboarding to get your personalized skill gap analysis and roadmap</p>
              <button onClick={() => navigate('/onboarding')} className="px-8 py-3 bg-gradient-to-r from-[#7b6cf6] to-[#e96bbd] text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105">
                Start Onboarding →
              </button>
            </div>
          </main>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(12px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        display: 'flex', minHeight: '100vh', width: '100%'
      }}
    >
      <div className="flex w-full h-screen overflow-hidden bg-[var(--bg-page)] font-dm-sans text-[var(--navy)]">
        {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
        <Sidebar />

        <main className="flex-1 h-full overflow-y-auto custom-scrollbar relative pb-20">
          {loading || !userData ? (
            <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center font-dm-sans gap-4">
              <div className="w-12 h-12 border-4 border-[var(--blue-primary)] border-t-transparent rounded-full animate-spin" />
              {userData?.onboardingDone && !userData?.gapReport && (
                <p className="text-sm text-slate-400 font-medium">Analyzing your profile...</p>
              )}
            </div>
          ) : (
            <>
              {/* ─── HEADER ────────────────────────────────────── */}
              <header className="px-8 py-8 md:py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sticky top-0 bg-[var(--bg-page)]/90 backdrop-blur-md z-10 border-b border-[var(--input-border)]/50">
                <div>
                  <h2 className="font-nunito font-black text-3xl md:text-4xl">{getGreeting()}, {userData.firstName} 👋</h2>
                  <p className="text-[var(--text-2)] mt-1 font-medium">Here's your career snapshot today</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                  <div className="px-4 py-2 bg-gradient-to-r from-[#f5c842] to-[#d4a012] rounded-full text-white text-sm font-black shadow-lg shadow-yellow-500/20 flex items-center gap-2 hover:scale-105 transition-transform h-[36px]">
                    🔥 {streakDays} day streak
                  </div>
                  <button onClick={() => navigate('/interview')} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-full shadow-md transition-all active:scale-95 flex items-center gap-2">
                    🎤 Mock Interview
                  </button>
                  {/* Confidence Gauge */}
                  <div className="h-14 w-14 relative flex items-center justify-center bg-white rounded-full shadow-md shrink-0">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="var(--input-border)" strokeWidth="6" fill="none" />
                      <circle cx="24" cy="24" r="20" stroke="#22c55e" strokeWidth="6" fill="none" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * readinessScore) / 100} style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
                    </svg>
                    <div className="absolute font-nunito font-black text-xs">{readinessScore}%</div>
                  </div>
                </div>
              </header>

              <div className="px-8 py-6 max-w-7xl mx-auto space-y-8">

                {/* ─── STAT CARDS ──────────────────────────────── */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Readiness */}
                  <div className="relative overflow-hidden p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow" style={{ background: '#F0EDFF' }}>
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="font-nunito font-black text-3xl text-[#3C3489]"><AnimatedNumber value={readinessScore} />%</div>
                    <div className="text-xs font-bold text-[#7C6CC4] uppercase tracking-wider mt-1">Industry Readiness</div>
                    <div className="w-full h-1.5 bg-white/50 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-[#7C3AED] rounded-full transition-all duration-1000" style={{ width: `${readinessScore}%` }} />
                    </div>
                  </div>
                  {/* XP + Level */}
                  <div className="p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow" style={{ background: '#E1F5EE' }}>
                    <div className="text-2xl mb-2">🏆</div>
                    <div className="font-nunito font-black text-3xl text-[#085041]"><AnimatedNumber value={xp} /> XP</div>
                    <div className="text-xs font-bold text-[#0D9488] uppercase tracking-wider mt-1">Level {level}</div>
                  </div>
                  {/* Roadmap Progress */}
                  <div className="relative overflow-hidden p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow" style={{ background: '#FFF8EC' }}>
                    <div className="text-2xl mb-2">📊</div>
                    <div className="font-nunito font-black text-3xl text-[#854F0B]">{completedWeeks}/{roadmapArr.length || 8}</div>
                    <div className="text-xs font-bold text-[#D97706] uppercase tracking-wider mt-1">Weeks Completed</div>
                    <div className="w-full h-1.5 bg-white/50 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-[#D97706] rounded-full transition-all duration-1000" style={{ width: `${roadmapArr.length ? (completedWeeks / roadmapArr.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                  {/* Target Role */}
                  <div className="p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow" style={{ background: '#FBEAF0' }}>
                    <div className="text-2xl mb-2">💼</div>
                    <div className="font-nunito font-black text-xl text-[#9D174D] truncate">{targetRole}</div>
                    <div className="text-xs font-bold text-[#DB2777] uppercase tracking-wider mt-1">{targetMode}</div>
                  </div>
                </section>

                {/* ─── MAIN GRID (7:3) ─────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

                  {/* LEFT COLUMN (70%) */}
                  <div className="col-span-1 lg:col-span-7 space-y-6">

                    {/* ── 0) Peer Benchmarking Card ── */}
                    {benchmark && (
                      <div className="bg-white border text-left border-[var(--input-border)] rounded-[20px] p-6 shadow-sm relative">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-nunito font-black text-xl flex items-center gap-2">
                            <span>🏆</span> Peer Benchmarking
                          </h3>
                          <LlamaBadge />
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 mb-5">
                          {/* Percentile Circle */}
                          <div className="flex flex-col items-center justify-center shrink-0">
                            <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-[6px] border-[#FFF8EC]">
                              <svg className="absolute w-28 h-28 transform -rotate-90">
                                <circle cx="56" cy="56" r="48" stroke="transparent" strokeWidth="6" fill="none" />
                                <circle cx="56" cy="56" r="48" stroke="#D97706" strokeWidth="8" fill="none" strokeDasharray="301.59" strokeDashoffset={301.59 - (301.59 * benchmark.percentile) / 100} style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
                              </svg>
                              <div className="text-center font-nunito">
                                <span className="font-black text-3xl text-[#D97706]">{benchmark.percentile}</span>
                                <span className="text-sm font-bold text-[#D97706]">%</span>
                              </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 mt-3 tracking-wider uppercase">Percentile Rank</p>
                          </div>

                          {/* AI Explanation & Gaps */}
                          <div className="flex-1 space-y-4">
                            <div className="bg-[#FFF8EC] p-3 rounded-xl border border-[#D9770630]">
                              <p className="text-sm font-bold text-[#854F0B] leading-relaxed">
                                {benchmark.ai_explanation ? benchmark.ai_explanation.peer_comparison : "You are ahead of " + benchmark.percentile + "% of peers."}
                              </p>
                            </div>

                            {benchmark.gaps && (
                              <div className="flex flex-wrap gap-2 text-xs">
                                {benchmark.gaps.critical?.length > 0 && (
                                  <div className="w-full mb-1"><span className="font-black text-slate-700">Critical Gaps:</span></div>
                                )}
                                {benchmark.gaps.critical?.map(g => (
                                  <span key={g} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full font-bold border border-rose-100">{g}</span>
                                ))}
                                {benchmark.gaps.strong?.length > 0 && (
                                  <div className="w-full mt-2 mb-1"><span className="font-black text-slate-700">Strong Areas:</span></div>
                                )}
                                {benchmark.gaps.strong?.map(g => (
                                  <span key={g} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-bold border border-emerald-100">{g}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Top 20% Insights */}
                        {benchmark.ai_explanation && (
                          <div className="border-t border-dashed border-slate-200 pt-5 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <h4 className="text-xs font-black uppercase text-slate-400 mb-2">⭐ What Top 20% Students Have</h4>
                               <p className="text-sm text-slate-600 leading-relaxed font-medium">{benchmark.ai_explanation.top_20_insight}</p>
                            </div>
                            <div>
                               <h4 className="text-xs font-black uppercase text-slate-400 mb-2">🚀 Actionable Improvements</h4>
                               <ul className="list-disc pl-4 space-y-1">
                                 {benchmark.ai_explanation.actionable_improvements?.map((imp, i) => (
                                   <li key={i} className="text-sm text-slate-600 font-medium">{imp}</li>
                                 ))}
                               </ul>
                            </div>
                          </div>
                        )}

                        <div className="mt-5 text-[10px] text-slate-400 font-medium text-center bg-slate-50 py-2 rounded-lg">
                          Benchmarks are based on common industry expectations from platforms like LeetCode, Glassdoor, and Stack Overflow Developer Survey.
                        </div>
                      </div>
                    )}
                    {loadingBenchmark && (
                       <div className="bg-white border text-center border-[var(--input-border)] rounded-[20px] p-8 shadow-sm">
                         <div className="w-8 h-8 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                         <p className="text-slate-500 font-bold text-sm">Calculating your Peer Benchmark...</p>
                       </div>
                    )}
                    {/* ── A) Skill Gap Analysis Card ── */}
                    {gapReport ? (
                      <div>
                        <div className="bg-white border border-[var(--input-border)] rounded-[20px] p-6 shadow-sm relative">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="font-nunito font-black text-xl">Your Skill Gap Analysis</h3>
                            <LlamaBadge />
                          </div>

                        {/* Readiness Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-500">Readiness</span>
                            <span className="font-nunito font-black text-lg text-[#7C3AED]">{readinessScore}%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#e96bbd] transition-all duration-1000" style={{ width: `${readinessScore}%` }} />
                          </div>
                        </div>

                        {/* Salary Estimate */}
                        {gapReport.currentSalary && gapReport.targetSalary && (
                          <div className="flex items-center gap-3 mb-6 text-sm">
                            <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-bold">₹{gapReport.currentSalary} now</span>
                            <span className="text-slate-300">→</span>
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold">₹{gapReport.targetSalary} after</span>
                          </div>
                        )}

                        {/* Divider */}
                        <div className="border-t border-dashed border-slate-200 my-4" />

                        {/* Grid: Critical & Needs Polishing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* 🔴 Critical Gaps */}
                          {gapReport.fullyMissing?.filter(s => s.priority === 'critical')?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5"><span className="text-sm">🔴</span> CRITICAL GAPS</h4>
                              <div className="flex flex-wrap gap-2">
                                {gapReport.fullyMissing.filter(s => s.priority === 'critical').map((s, i) => (
                                  <span key={i} className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ background: '#FCEBEB', color: '#A32D2D' }}>
                                    {s.skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 🟡 Needs Polishing */}
                          {gapReport.needsPolishing?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5"><span className="text-sm">🟡</span> NEEDS POLISHING</h4>
                              <div className="flex flex-wrap gap-2">
                                {gapReport.needsPolishing.map((s, i) => (
                                  <div key={i} className="text-sm font-bold px-3 py-1.5 rounded-lg inline-block" style={{ background: '#FFF8EC', color: '#854F0B' }}>
                                    {s.skill}: {s.currentLevel} → {s.requiredLevel}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Important & Nice-to-have gaps */}
                        {gapReport.fullyMissing?.filter(s => s.priority !== 'critical')?.length > 0 && (
                          <>
                            <div className="border-t border-dashed border-slate-200 my-6" />
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5"><span className="text-sm">📋</span> OTHER GAPS</h4>
                              <div className="flex flex-wrap gap-2">
                                {gapReport.fullyMissing.filter(s => s.priority !== 'critical').map((s, i) => (
                                  <span key={i} className="text-sm font-medium px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm">
                                    {s.skill} <span className="text-[11px] text-slate-400 ml-1 opacity-80">({s.priority})</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Career Decision Intelligence CTA */}
                        <div className="mt-8 p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-purple-600/20 transition-colors" />
                          <div className="relative z-10">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 mb-2">New: Market Intel 🔥</h4>
                            <p className="text-[13px] text-slate-300 mb-4 leading-relaxed">
                              Get deep decision intelligence and simulated market fit analysis based on your profile.
                            </p>
                            <button 
                              onClick={() => navigate('/market')} 
                              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                            >
                              View Market Intelligence →
                            </button>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-dashed border-slate-200 mt-5 pt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">💡</span>
                            <p className="text-xs text-slate-400 font-medium">Your roadmap focuses only on your gaps — not what you already know.</p>
                          </div>
                          <button onClick={() => navigate('/roadmap')} className="text-xs font-bold text-[#7C3AED] hover:underline shrink-0">
                            View Full Roadmap →
                          </button>
                        </div>
                      </div>
                    </div>
                    ) : isUserOnboarded ? (
                      <div className="bg-white border border-[var(--input-border)] rounded-[20px] p-10 text-center shadow-sm">
                        <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">Analyzing your profile...</p>
                      </div>
                    ) : null}

                    {/* ── B) Today's Missions Card ── */}

                    <div>
                      <div className="flex items-center justify-between px-1 mb-3">
                        <h3 className="font-nunito font-black text-xl text-[var(--navy)]">Today's Missions</h3>
                        <button onClick={handleRefreshMissions} disabled={refreshing} className="p-2 bg-white rounded-full border border-[var(--input-border)] text-xl hover:bg-[#f0f5ff] transition-colors disabled:opacity-50">
                          {refreshing ? '⌛' : '🔄'}
                        </button>
                      </div>

                      {showConfetti && completed.size === missions.length && missions.length > 0 && (
                        <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#166534] px-4 py-3 rounded-[16px] font-bold text-center mb-3">
                          🎉 Incredible work! All missions complete!
                        </div>
                      )}

                      <div className="space-y-3">
                        {missions.length === 0 ? (
                          <div className="bg-white border border-[var(--input-border)] p-8 rounded-[16px] text-center text-[var(--text-3)] font-medium">
                            No missions generated yet. Hit refresh!
                          </div>
                        ) : missions.map((m, idx) => {
                          const mText = typeof m === 'string' ? m : (m.task || m.text || '');
                          const mType = m.type || 'learn';
                          const mXp = m.xp || 15;
                          const isDone = completed.has(mText);
                          const style = missionStyle[mType] || missionStyle.learn;

                          return (
                            <div key={idx} onClick={() => toggleMission({ ...m, text: mText, task: mText })}
                              className={`bg-white border ${isDone ? 'border-[#22c55e]/30 bg-[#22c55e]/5' : 'border-[var(--input-border)]'} p-4 rounded-[16px] flex items-start gap-4 cursor-pointer hover:shadow-sm transition-all group`}
                            >
                              {/* Colored icon circle */}
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: style.bg }}>
                                {isDone ? '✅' : style.icon}
                              </div>
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: style.color }}>{mType}</span>
                                  {isDone && <span className="text-[9px] font-black uppercase text-emerald-500">Completed</span>}
                                </div>
                                <p className={`font-bold text-sm transition-colors ${isDone ? 'text-[var(--text-3)] line-through' : 'text-[var(--navy)]'}`}>
                                  {mText}
                                </p>
                              </div>
                              {/* XP pill */}
                              <span className={`text-xs font-black px-2.5 py-1 rounded-lg shrink-0 ${isDone ? 'bg-[#22c55e]/20 text-[#166534]' : ''}`}
                                style={!isDone ? { background: style.bg, color: style.color } : {}}
                              >
                                +{mXp} XP
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN (30%) */}
                  <div className="col-span-1 lg:col-span-3 space-y-6">

                    {/* ── C) My Goals ── */}
                    <div>
                      <div className="flex items-center justify-between px-1 mb-3">
                        <h3 className="font-nunito font-black text-lg text-[var(--navy)]">My Goals</h3>
                        <button onClick={() => navigate('/roadmap')} className="text-xs font-bold text-[var(--blue-primary)] hover:underline">View All</button>
                      </div>
                      <div className="bg-white border border-[var(--input-border)] rounded-[16px] p-4 space-y-4">
                        {!(globalUser?.goals?.length || userData?.goals?.length) ? (
                          <div className="text-center py-4 text-[var(--text-3)] text-sm font-medium">No goals set yet.</div>
                        ) : (
                          (globalUser?.goals?.length ? globalUser.goals : userData?.goals || [])
                            .sort((a, b) => {
                              const pMap = { High: 0, Medium: 1, Low: 2 };
                              return (pMap[a.priority] ?? 1) - (pMap[b.priority] ?? 1);
                            })
                            .slice(0, 3)
                            .map((goal, idx) => (
                              <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${goal.priority === 'High' ? 'bg-rose-500' : goal.priority === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                    <span className="font-bold text-[var(--navy)] truncate pr-2">{goal.text}</span>
                                  </div>
                                  <span className="text-[var(--text-3)] shrink-0">{goal.progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#f0f5ff] rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-1000 ${goal.priority === 'High' ? 'bg-rose-500' : 'bg-[var(--blue-primary)]'}`}
                                    style={{ width: `${goal.progress}%` }}
                                  />
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                    {/* ── D) This Week's Focus ── */}
                    {currentWeekObj && (
                      <div className="bg-white border border-[var(--input-border)] rounded-[16px] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-nunito font-black text-lg text-[var(--navy)]">This Week</h3>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED] bg-[#F0EDFF] px-2 py-1 rounded">Week {currentWeekObj.week}</span>
                        </div>
                        <p className="font-bold text-sm text-[var(--navy)] mb-1">{currentWeekObj.focus}</p>
                        {currentWeekObj.goal && (
                          <p className="text-xs text-slate-400 mb-3 italic">{currentWeekObj.goal}</p>
                        )}
                        <div className="space-y-2 mb-4">
                          {(currentWeekObj.tasks || []).slice(0, 3).map((t, i) => {
                            const taskText = typeof t === 'string' ? t : (t.title || t.task || t.text || '');
                            return (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <div className="w-4 h-4 rounded border border-[var(--input-border)] shrink-0 mt-0.5" />
                                <span className="text-[var(--text-2)] font-medium">{taskText}</span>
                              </div>
                            );
                          })}
                        </div>
                        <button onClick={() => navigate('/roadmap')} className="w-full text-center text-xs font-bold text-[#7C3AED] hover:underline py-1">
                          View Full Roadmap →
                        </button>
                      </div>
                    )}

                    {/* ── E) Quick Actions ── */}
                    <div className="bg-white border border-[var(--input-border)] rounded-[16px] p-4">
                      <h3 className="font-nunito font-black text-lg text-[var(--navy)] mb-3">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { icon: '🎤', label: 'Mock Interview', path: '/interview' },
                          { icon: '📋', label: 'Application Tracker', path: '/applications' },
                          { icon: '📄', label: 'Resume Reviewer', path: '/resume' },
                          { icon: '⚙️', label: 'Settings', path: '/settings' }
                        ].map((a, i) => (
                          <button key={i} 
                            onClick={() => navigate(a.path)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-[var(--bg-page)] transition-colors border border-transparent hover:border-[var(--input-border)]"
                          >
                            <span className="text-2xl">{a.icon}</span>
                            <span className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-wider">{a.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── FOOTER BADGE ────────────────────────────── */}
                <div className="flex justify-center pt-4 pb-2">
                  <LlamaBadge />
                </div>
              </div>
            </>
          )}
          {/* Resume Review Modal */}
          <AnimatePresence>
            {showResumeModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  padding: '40px 16px',
                  overflowY: 'auto'
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowResumeModal(false);
                }}
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  style={{
                    background: 'white',
                    borderRadius: 28,
                    width: '100%',
                    maxWidth: 860,
                    position: 'relative',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
                    padding: '40px'
                  }}
                >
                  <button
                    onClick={() => setShowResumeModal(false)}
                    style={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#F1F5F9',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      color: '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10
                    }}
                  >
                    ✕
                  </button>
                  <ResumeReviewer />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
};

export default Dashboard;
