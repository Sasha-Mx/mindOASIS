import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, BarChart2, Palette, Bell, Shield, 
  LogOut, CheckCircle2, AlertTriangle, 
  ChevronRight, Moon, Sun, Save, Info,
  Download, Trash2
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import { Spinner } from '../components/LoadingUI';
import Sidebar from '../components/Sidebar';

const Settings = () => {
  const { user, setUser, logout } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showRerunModal, setShowRerunModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [appearance, setAppearance] = useState({
    theme: user?.preferences?.theme || 'light',
    accentColor: user?.preferences?.accentColor || 'purple'
  });

  const ACCENT_COLORS = {
    purple: { hex: '#7C3AED', name: 'Purple' },
    teal:   { hex: '#0F9488', name: 'Teal' },
    amber:  { hex: '#BA7517', name: 'Amber' },
    pink:   { hex: '#D4537E', name: 'Pink' }
  };

  useEffect(() => {
    if (user?.preferences) {
      setAppearance({
        theme: user.preferences.theme || 'light',
        accentColor: user.preferences.accentColor || 'purple'
      });
    }
  }, [user]);

  // Instant preview disabled per latest request
  /* 
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', ACCENT_COLORS[appearance.accentColor].hex);
    if (appearance.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appearance]);
  */

  const showToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 2500);
  };

  const handleSaveAppearance = async (overridePrefs) => {
    setLoading(true);
    try {
      const payload = overridePrefs || { 
        theme: appearance.theme, 
        accentColor: appearance.accentColor 
      };
      const res = await api.patch('/users/preferences', payload);
      if (res.data.user) {
        setUser(res.data.user);
      }
      showToast('Settings saved!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRerunOnboarding = async () => {
    setLoading(true);
    try {
      await api.post('/users/rerun-onboarding');
      setUser(prev => ({ ...prev, roadmap: null, onboardingDone: false }));
      navigate('/onboarding');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setShowRerunModal(false);
    }
  };

  const handleResetProgress = async () => {
    setLoading(true);
    try {
      await api.post('/users/reset-progress');
      setUser(prev => ({
        ...prev,
        roadmap: null,
        goals: [],
        completedMissions: [],
        xp: 0,
        level: 1,
        confidenceScore: 0,
        streakDays: 0,
        interviewHistory: []
      }));
      showToast('All progress has been reset.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setShowResetModal(false);
    }
  };

  const handleExportData = () => {
    const exportData = {
      profile: user.profile || {},
      roadmap: user.roadmap || null,
      goals: user.goals || [],
      completedMissions: user.completedMissions || [],
      interviewHistory: user.interviewHistory || [],
      xp: user.xp,
      level: user.level,
      streakDays: user.streakDays,
      confidenceScore: user.confidenceScore,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentra-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!');
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete('/users/delete-account');
      logout();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile View', icon: <User size={18} /> },
    { id: 'stats', label: 'Progress & Stats', icon: <BarChart2 size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'account', label: 'Account', icon: <Shield size={18} /> },
  ];

  const profile = user?.profile || {};

  // Build profile fields from ONLY onboarding data, filter out empty/null/0/"Not specified"
  const isValid = (v) => v !== null && v !== undefined && v !== '' && v !== 0 && v !== '0' && v !== 'Not specified';

  const profileFields = [
    { label: 'Preparation Goal', value: profile.mode },
    { label: 'Target Role', value: profile.role },
    { label: 'College Year', value: profile.year },
    { label: 'Daily Hours', value: profile.hours },
    { label: 'Timeline', value: profile.months ? `${profile.months} months` : null },
  ].filter(f => isValid(f.value));

  // Compute stats
  const roadmapWeeks = user?.roadmap?.weeks || user?.roadmap?.roadmap || [];
  const completedWeeks = Array.isArray(roadmapWeeks) ? roadmapWeeks.filter(w => w.done || w.completed).length : 0;
  const totalWeeks = Array.isArray(roadmapWeeks) ? roadmapWeeks.length : 0;
  const roadmapPct = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
  const interviews = user?.interviewHistory || [];
  const avgScore = interviews.length > 0
    ? Math.round(interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length)
    : 0;

  return (
    <div className="flex min-h-screen bg-white font-dm-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        {!user ? (
          <div className="flex items-center justify-center h-full">
            <Spinner size={32} />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto py-8">
            <h1 className="text-4xl font-black text-slate-900 mb-2">Settings</h1>
            <p className="text-slate-500 font-medium mb-12">Manage your profile, preferences, and account data</p>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <div className="lg:col-span-1 space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                      activeTab === tab.id 
                        ? 'bg-[#F0EDFF] text-[#7F77DD] shadow-lg shadow-indigo-500/10' 
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
                  </button>
                ))}
              </div>

              <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-sm min-h-[600px] relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >

                    {/* ═══════════════ PROFILE VIEW ═══════════════ */}
                    {activeTab === 'profile' && (
                      <div className="space-y-10">
                        <header className="flex items-center justify-between mb-2">
                           <div>
                              <h3 className="text-2xl font-black text-slate-900">Your Profile</h3>
                              <p className="text-slate-400 text-sm font-medium">Read-only information from onboarding</p>
                           </div>
                           <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                             Locked
                           </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                           {profileFields.map(f => (
                             <div key={f.label} className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[1.5px] ml-0.5">{f.label}</label>
                                <div className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 text-[15px] shadow-sm">
                                  {f.value}
                                </div>
                             </div>
                           ))}
                        </div>

                        {/* Skills — only show if array has items */}
                        {profile.skills && profile.skills.length > 0 && (
                          <div className="flex flex-col gap-2">
                             <label className="text-[10px] font-black uppercase text-slate-400 tracking-[1.5px] ml-0.5">Skills</label>
                             <div className="space-y-2 pt-1">
                               {profile.skills.map((s, i) => {
                                 const isObj = typeof s === 'object' && s !== null;
                                 const name = isObj ? s.name : s;
                                 const level = isObj ? s.level : null;
                                 const topics = isObj ? s.knownTopics : null;
                                 return (
                                   <div key={name || i}>
                                     <span style={{
                                       background: '#F0EDFF',
                                       color: '#3C3489',
                                       border: '0.5px solid #CECBF6',
                                       borderRadius: 20,
                                       padding: '4px 12px',
                                       fontSize: 13,
                                       fontWeight: 700,
                                       display: 'inline-block'
                                     }}>
                                       {name}{level ? ` — ${level.charAt(0).toUpperCase() + level.slice(1)}` : ''}
                                     </span>
                                     {topics && topics.trim() && (
                                       <p className="text-xs text-slate-400 ml-3 mt-1 italic">knows: {topics}</p>
                                     )}
                                   </div>
                                 );
                               })}
                             </div>
                          </div>
                        )}

                        {/* Amber Warning Box */}
                        <div className="bg-[#FFF8EC] border-[0.5px] border-[#FAC775] text-[#854F0B] p-[14px] px-[16px] rounded-lg flex gap-4 items-start shadow-sm mt-2">
                           <Info className="shrink-0 mt-0.5" size={18} />
                           <p className="text-[13px] font-semibold leading-relaxed">
                             Your profile is generated from onboarding. To make changes,
                             you'll need to re-run onboarding — this will regenerate
                             your skill gap report and roadmap.
                           </p>
                        </div>

                        <div className="pt-2">
                          <button 
                            onClick={() => setShowRerunModal(true)}
                            className="px-10 py-4 bg-amber-500 text-white rounded-full font-black text-sm shadow-xl shadow-amber-500/20 hover:-translate-y-1 hover:bg-amber-600 transition-all flex items-center justify-center gap-3 w-fit"
                          >
                            <RefreshCw className="w-5 h-5" /> Re-run Onboarding
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ═══════════════ APPEARANCE ═══════════════ */}
                    {activeTab === 'appearance' && (
                      <div className="space-y-12">
                         <header className="mb-2">
                            <h3 className="text-2xl font-black text-slate-900">Appearance</h3>
                            <p className="text-slate-400 text-sm font-medium">Personalize your interface and accent color</p>
                         </header>

                         <div className="space-y-6">
                            <h4 className="font-black text-lg text-slate-800">Theme Preference</h4>
                            <div className="flex gap-4">
                               {['light', 'dark'].map(t => (
                                 <button key={t} onClick={() => setAppearance({...appearance, theme: t})} className={`flex-1 p-8 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${appearance.theme === t ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                                   {t === 'light' ? <Sun size={32} /> : <Moon size={32} />}
                                   <span className="font-black uppercase tracking-widest text-xs">{t} mode</span>
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="space-y-6">
                            <h4 className="font-black text-lg text-slate-800">Accent Color</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                               {Object.keys(ACCENT_COLORS).map(color => (
                                 <button 
                                   key={color} 
                                   onClick={() => setAppearance({...appearance, accentColor: color})}
                                   className={`p-6 rounded-[2rem] border-2 transition-all text-center ${appearance.accentColor === color ? 'border-[var(--accent)] shadow-lg shadow-indigo-500/10' : 'border-slate-50 hover:border-slate-200'}`}
                                 >
                                   <div className="w-8 h-8 rounded-full mx-auto mb-3" style={{ backgroundColor: ACCENT_COLORS[color].hex }} />
                                   <span className="font-black text-[10px] uppercase tracking-wider text-slate-600">
                                     {ACCENT_COLORS[color].name}
                                   </span>
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="pt-8">
                            <button 
                              onClick={() => handleSaveAppearance()}
                              className="px-8 py-4 bg-[#7F77DD] text-white rounded-full font-black text-sm shadow-xl shadow-[#7F77DD30] hover:-translate-y-1 transition-all flex items-center gap-3"
                              style={{ backgroundColor: 'var(--accent)' }}
                            >
                              {loading ? <Spinner size={20} /> : <><Save size={18} /> Save Appearance</>}
                            </button>
                         </div>
                      </div>
                    )}

                    {/* ═══════════════ PROGRESS & STATS ═══════════════ */}
                    {activeTab === 'stats' && (
                      <div className="space-y-10">
                        <header className="mb-2">
                           <h3 className="text-2xl font-black text-slate-900">Progress & Stats</h3>
                           <p className="text-slate-400 text-sm font-medium">Your current level and achievement stats</p>
                        </header>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                           {[
                             { label: 'Total XP', value: user.xp || 0, color: '#E1F5EE', textColor: '#085041' },
                             { label: 'Level', value: user.level || 1, color: '#F0EDFF', textColor: '#3C3489' },
                             { label: 'Streak', value: (user.streakDays || 0) + ' days', color: '#FFF8EC', textColor: '#633806' },
                             { label: 'Roadmap', value: roadmapPct + '%', color: '#F0EDFF', textColor: '#3C3489' },
                             { label: 'Interviews', value: interviews.length, color: '#E1F5EE', textColor: '#085041' },
                             { label: 'Avg Score', value: avgScore + '%', color: '#FBEAF0', textColor: '#72243E' }
                           ].map(s => (
                             <div key={s.label} className="p-6 rounded-[2rem] border border-transparent shadow-sm" style={{ backgroundColor: s.color }}>
                                <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60" style={{ color: s.textColor }}>{s.label}</div>
                                <div className="text-2xl font-black" style={{ color: s.textColor }}>{s.value}</div>
                             </div>
                           ))}
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                          <h4 className="font-black text-sm text-slate-500 uppercase tracking-widest mb-4">Danger Zone</h4>
                          <button 
                            onClick={() => setShowResetModal(true)}
                            className="px-8 py-4 bg-red-500 text-white rounded-full font-black text-sm shadow-xl shadow-red-500/20 hover:-translate-y-1 hover:bg-red-600 transition-all flex items-center gap-3"
                          >
                            <Trash2 size={18} /> Reset All Progress
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ═══════════════ NOTIFICATIONS ═══════════════ */}
                    {activeTab === 'notifications' && (
                      <div className="space-y-10">
                        <header className="mb-2">
                           <h3 className="text-2xl font-black text-slate-900">Notifications</h3>
                           <p className="text-slate-400 text-sm font-medium">Choose when and how you want to be reminded</p>
                        </header>
                        <div className="space-y-4">
                           {[
                             { id: 'missions', label: 'Daily Missions', desc: 'Get reminded to complete your daily tasks' },
                             { id: 'streak', label: 'Streak Alerts', desc: 'Never lose your progress with streak reminders' },
                             { id: 'applications', label: 'Application Updates', desc: 'Stay updated on your job tracker changes' }
                           ].map(n => (
                             <div key={n.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <div>
                                   <p className="font-bold text-slate-900">{n.label}</p>
                                   <p className="text-slate-500 text-xs">{n.desc}</p>
                                </div>
                                <button 
                                   onClick={() => {
                                     const newPrefs = { 
                                       notifications: { 
                                         ...user.preferences?.notifications, 
                                         [n.id]: !user.preferences?.notifications?.[n.id] 
                                       } 
                                     };
                                     handleSaveAppearance(newPrefs);
                                   }}
                                   className={`w-12 h-6 rounded-full transition-all relative ${user.preferences?.notifications?.[n.id] ? 'bg-[#7b6cf6]' : 'bg-slate-300'}`}
                                >
                                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user.preferences?.notifications?.[n.id] ? 'left-7' : 'left-1'}`} />
                                </button>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}

                    {/* ═══════════════ ACCOUNT ═══════════════ */}
                    {activeTab === 'account' && (
                      <div className="space-y-10">
                        <header className="mb-2">
                           <h3 className="text-2xl font-black text-slate-900">Account</h3>
                           <p className="text-slate-400 text-sm font-medium">Security and data management options</p>
                        </header>

                        {/* Account Info */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                             <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Email</p>
                                <p className="font-bold text-slate-900">{user.email}</p>
                             </div>
                             <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                               <CheckCircle2 size={14} /> Verified
                             </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                          <button 
                            onClick={handleExportData}
                            className="w-full flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-slate-100 transition-all group"
                          >
                            <div className="w-10 h-10 bg-[#F0EDFF] rounded-xl flex items-center justify-center text-[#7F77DD]">
                              <Download size={20} />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-slate-900">Export My Data</p>
                              <p className="text-slate-500 text-xs">Download your roadmap, goals, and missions as JSON</p>
                            </div>
                            <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </button>

                          <button 
                            onClick={() => setShowLogoutModal(true)}
                            className="w-full flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-slate-100 transition-all group"
                          >
                            <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-600">
                              <LogOut size={20} />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-slate-900">Sign Out</p>
                              <p className="text-slate-500 text-xs">Securely log out of your account</p>
                            </div>
                            <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </button>
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-4 border-t border-slate-100">
                          <h4 className="font-black text-sm text-red-400 uppercase tracking-widest mb-4">Danger Zone</h4>
                          <button 
                            onClick={() => setShowDeleteModal(true)}
                            className="px-8 py-4 bg-red-500 text-white rounded-full font-black text-sm shadow-xl shadow-red-500/20 hover:-translate-y-1 hover:bg-red-600 transition-all flex items-center gap-3"
                          >
                            <Trash2 size={18} /> Delete Account
                          </button>
                          <p className="text-slate-400 text-xs mt-3 ml-1">This action is permanent and cannot be undone.</p>
                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
                
                {success && (
                   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-10 left-12 right-12 bg-emerald-500 text-white p-4 rounded-2xl flex items-center gap-3 font-bold shadow-xl shadow-emerald-500/20">
                     <CheckCircle2 size={20} />
                     {success}
                   </motion.div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════ MODALS ═══════════════ */}
      <AnimatePresence>
        {showRerunModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl overflow-hidden relative">
                <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Re-run Onboarding?</h2>
                <p className="text-slate-400 font-medium leading-relaxed">
                  This will delete your current roadmap and skill gap report. XP, streak and badges will be kept.
                </p>
                <div className="flex flex-col gap-3 mt-8">
                   <button 
                     onClick={handleRerunOnboarding}
                     disabled={loading}
                     className="w-full h-14 bg-amber-500 text-white rounded-2xl font-black text-sm hover:bg-amber-600 transition-all flex items-center justify-center"
                   >
                     {loading ? <Spinner size={20} /> : 'Yes, Delete and Re-run'}
                   </button>
                   <button onClick={() => setShowRerunModal(false)} className="w-full h-14 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">Cancel</button>
                </div>
             </motion.div>
          </motion.div>
        )}

        {showLogoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl overflow-hidden relative">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Sign Out?</h2>
                <p className="text-slate-400 font-medium">You will be securely logged out of your account.</p>
                <div className="flex flex-col gap-3 mt-8">
                   <button onClick={logout} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all">Yes, Sign Out</button>
                   <button onClick={() => setShowLogoutModal(false)} className="w-full h-14 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">Cancel</button>
                </div>
             </motion.div>
          </motion.div>
        )}

        {showResetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl overflow-hidden relative">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Reset All Progress?</h2>
                <p className="text-slate-400 font-medium leading-relaxed">
                  This will delete your roadmap, missions, goals and interview history. Are you sure?
                </p>
                <div className="flex flex-col gap-3 mt-8">
                   <button 
                     onClick={handleResetProgress}
                     disabled={loading}
                     className="w-full h-14 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-all flex items-center justify-center"
                   >
                     {loading ? <Spinner size={20} /> : 'Yes, Reset Everything'}
                   </button>
                   <button onClick={() => setShowResetModal(false)} className="w-full h-14 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">Cancel</button>
                </div>
             </motion.div>
          </motion.div>
        )}

        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl overflow-hidden relative">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                  <Trash2 size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Delete Account?</h2>
                <p className="text-slate-400 font-medium leading-relaxed">
                  This will permanently delete all your data from our servers — your profile, roadmap, goals, missions, and interview history. This action <strong className="text-red-500">cannot be undone</strong>.
                </p>
                <div className="flex flex-col gap-3 mt-8">
                   <button 
                     onClick={handleDeleteAccount}
                     disabled={loading}
                     className="w-full h-14 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all flex items-center justify-center"
                   >
                     {loading ? <Spinner size={20} /> : 'Yes, Delete My Account'}
                   </button>
                   <button onClick={() => setShowDeleteModal(false)} className="w-full h-14 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">Cancel</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RefreshCw = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export default Settings;
