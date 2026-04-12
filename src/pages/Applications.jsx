import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, ChevronDown, ChevronUp, ExternalLink, Trash2, Edit3, ArrowRight,
  Building2, Brain, CheckSquare, Clock, AlertTriangle, TrendingUp, BarChart3,
  Loader2, Sparkles, BookOpen, Code2, MessageSquare, Calendar, Bell, X
} from 'lucide-react';

const STATUSES = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected'];

const STATUS_CONFIG = {
  'Applied':   { color: '#7F77DD', light: '#F0EDFF', icon: '📋' },
  'OA':        { color: '#BA7517', light: '#FFF8EC', icon: '📝' },
  'Interview': { color: '#6359CC', light: '#F0EDFF', icon: '🎤' },
  'Offer':     { color: '#1D9E75', light: '#E1F5EE', icon: '🎉' },
  'Rejected':  { color: '#94a3b8', light: '#f8fafc', icon: '📭' },
};

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);
  const [aiLoading, setAiLoading] = useState({});
  const [checklists, setChecklists] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    fetchApplications();
    fetchAnalytics();
    fetchChecklists();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications');
      const data = res.data;
      if (!data || data.length === 0) {
        const mockApplications = [
          { company: "Google", role: "SDE Intern", date: new Date(Date.now() - 18 * 24*60*60*1000), status: "Interview", notes: "Referred by college senior", aiAdvice: "Top questions at Google: System design at scale, LRU Cache, Binary Search variants. Focus on Big-O analysis in every answer." },
          { company: "Razorpay", role: "Backend Developer", date: new Date(Date.now() - 14 * 24*60*60*1000), status: "OA", notes: "Online assessment pending", aiAdvice: "Razorpay OA typically includes 2 DSA problems (medium difficulty) + SQL query. Practice sliding window and graph problems." },
          { company: "Swiggy", role: "SDE Intern", date: new Date(Date.now() - 10 * 24*60*60*1000), status: "Applied", notes: "Applied via LinkedIn", aiAdvice: "" },
          { company: "Zepto", role: "Full Stack Developer", date: new Date(Date.now() - 8 * 24*60*60*1000), status: "Offer", notes: "Got the offer! Negotiating salary", aiAdvice: "Congratulations! For salary negotiation at Zepto: research market rate (₹12-18 LPA for this role), highlight your project impact, ask about ESOPs and growth trajectory." },
          { company: "Paytm", role: "SDE", date: new Date(Date.now() - 20 * 24*60*60*1000), status: "Rejected", notes: "Rejected after technical round", aiAdvice: "Gap analysis: Paytm focuses heavily on System Design and DSA. Strengthen Consistent Hashing, Database Sharding, and practice more graph problems." },
          { company: "Flipkart", role: "SDE Intern", date: new Date(Date.now() - 6 * 24*60*60*1000), status: "Applied", notes: "Applied through campus drive", aiAdvice: "" },
          { company: "Meesho", role: "Product Engineer", date: new Date(Date.now() - 4 * 24*60*60*1000), status: "Interview", notes: "First round scheduled for next week", aiAdvice: "Meesho interview focus: DSA (arrays, trees), Low Level Design (design a parking lot, library system), and behavioral questions about working with ambiguity." },
          { company: "CRED", role: "Backend Intern", date: new Date(Date.now() - 2 * 24*60*60*1000), status: "Applied", notes: "Referral from alumni network", aiAdvice: "" }
        ];
        await Promise.all(mockApplications.map(app => api.post('/applications', app)));
        const res2 = await api.get('/applications');
        setApplications(res2.data);
      } else {
        setApplications(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/applications/analytics');
      setAnalytics(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchChecklists = async () => {
    try {
      const res = await api.get('/applications/checklists');
      setChecklists(res.data);
    } catch (err) { console.error(err); }
  };

  const deleteApp = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await api.delete(`/applications/${id}`);
      setApplications(prev => prev.filter(a => a._id !== id));
      fetchAnalytics();
    } catch (err) { alert('Failed to delete.'); }
  };

  const moveStatus = async (id, newStatus) => {
    try {
      const res = await api.patch(`/applications/${id}/status`, { status: newStatus });
      setApplications(prev => prev.map(a => a._id === id ? res.data : a));
      fetchAnalytics();
    } catch (err) { console.error(err); }
  };

  const toggleChecklist = async (appId, key, checked) => {
    try {
      const res = await api.patch(`/applications/${appId}/checklist`, { key, checked });
      setApplications(prev => prev.map(a => a._id === appId ? res.data : a));
    } catch (err) { console.error(err); }
  };

  const markFollowedUp = async (appId) => {
    try {
      const res = await api.patch(`/applications/${appId}/followup`);
      setApplications(prev => prev.map(a => a._id === appId ? res.data : a));
      fetchAnalytics();
    } catch (err) { console.error(err); }
  };

  const fetchCompanyResearch = async (appId) => {
    setAiLoading(prev => ({ ...prev, [`research_${appId}`]: true }));
    try {
      const res = await api.post(`/applications/${appId}/research`);
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, companyResearch: res.data } : a));
    } catch (err) { alert('Research failed. Try again.'); }
    finally { setAiLoading(prev => ({ ...prev, [`research_${appId}`]: false })); }
  };

  const fetchInterviewPrep = async (appId) => {
    setAiLoading(prev => ({ ...prev, [`prep_${appId}`]: true }));
    try {
      const res = await api.post(`/applications/${appId}/interview-prep`);
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, interviewPrep: res.data } : a));
    } catch (err) { alert('Interview prep failed. Try again.'); }
    finally { setAiLoading(prev => ({ ...prev, [`prep_${appId}`]: false })); }
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || app.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStats = () => {
    const s = { total: applications.length, inProgress: 0, interviews: 0, offers: 0 };
    applications.forEach(app => {
      if (app.status !== 'Rejected') s.inProgress++;
      if (app.status === 'Interview') s.interviews++;
      if (app.status === 'Offer') s.offers++;
    });
    return s;
  };
  const stats = getStats();

  const getDaysSince = (date) => Math.ceil((Date.now() - new Date(date)) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex min-h-screen bg-white font-dm-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">Application Tracker</h1>
            <p className="text-slate-500 font-medium">Track, prep, and conquer every opportunity</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 h-11">
              <Search size={16} className="text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search company or role..."
                className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-48" />
            </div>
            <button onClick={() => setShowAnalytics(!showAnalytics)}
              className={`h-11 px-5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all ${showAnalytics ? 'bg-[#7F77DD] text-white' : 'bg-slate-50 text-slate-600 border border-slate-100 hover:bg-[#F0EDFF] hover:text-[#7F77DD]'}`}>
              <BarChart3 size={16} /> Analytics
            </button>
            <button onClick={() => { setEditingApp(null); setShowAddModal(true); }}
              className="h-11 px-6 bg-gradient-to-br from-[#7F77DD] to-[#6359CC] text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-[#7F77DD30] hover:brightness-110 transition-all">
              <Plus size={16} /> Add Application
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <AnimatePresence>
          {showAnalytics && analytics && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <StatCard label="Total Applied" value={analytics.total} icon={<Building2 size={18} />} color="#7F77DD" />
                <StatCard label="Response Rate" value={`${analytics.responseRate}%`} icon={<TrendingUp size={18} />} color="#1D9E75" />
                <StatCard label="Interview Rate" value={`${analytics.interviewRate}%`} icon={<MessageSquare size={18} />} color="#6359CC" />
                <StatCard label="Offer Rate" value={`${analytics.offerRate}%`} icon={<Sparkles size={18} />} color="#BA7517" />
                <StatCard label="Ghosted" value={analytics.ghosted} icon={<AlertTriangle size={18} />} color="#D4537E" />
              </div>

              {/* Follow-up Reminders */}
              {analytics.needsFollowUp?.length > 0 && (
                <div className="bg-[#FFF8EC] border border-[#BA751720] rounded-2xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell size={16} className="text-[#BA7517]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#BA7517]">Follow-up Reminders</span>
                  </div>
                  <div className="space-y-2">
                    {analytics.needsFollowUp.map(f => (
                      <div key={f._id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-[#BA751710]">
                        <div>
                          <span className="font-bold text-sm text-slate-800">{f.company}</span>
                          <span className="text-xs text-slate-400 ml-2">• {f.role}</span>
                          <span className="text-xs text-[#D4537E] font-bold ml-2">({f.daysSince} days ago)</span>
                        </div>
                        <button onClick={() => markFollowedUp(f._id)}
                          className="text-[10px] font-black bg-[#BA7517] text-white px-3 py-1.5 rounded-lg hover:brightness-110 transition-all">
                          Mark Followed Up
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Deadlines */}
              {analytics.upcomingDeadlines?.length > 0 && (
                <div className="bg-[#FBEAF0] border border-[#D4537E20] rounded-2xl p-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-[#D4537E]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#D4537E]">Upcoming Deadlines</span>
                  </div>
                  <div className="space-y-2">
                    {analytics.upcomingDeadlines.map(d => (
                      <div key={d._id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-[#D4537E10]">
                        <span className="font-bold text-sm text-slate-800">{d.company} — {d.status}</span>
                        <span className="text-xs font-bold text-[#D4537E]">{new Date(d.deadlineDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total" value={stats.total} icon={<Building2 size={18} />} color="#7F77DD" />
          <StatCard label="Active" value={stats.inProgress} icon={<Clock size={18} />} color="#1D9E75" />
          <StatCard label="Interviews" value={stats.interviews} icon={<MessageSquare size={18} />} color="#6359CC" />
          <StatCard label="Offers" value={stats.offers} icon={<Sparkles size={18} />} color="#BA7517" highlight={stats.offers > 0} />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['All', ...STATUSES].map(status => {
            const count = status === 'All' ? applications.length : applications.filter(a => a.status === status).length;
            const isActive = filterStatus === status;
            return (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all border ${
                  isActive ? 'bg-[#7F77DD] text-white border-transparent shadow-lg shadow-[#7F77DD20]' : 'bg-white text-slate-500 border-slate-100 hover:border-[#7F77DD40]'
                }`}>
                {status}
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-slate-50'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="w-10 h-10 text-[#7F77DD] animate-spin" />
            <p className="mt-3 text-slate-400 font-medium">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">No applications yet</h3>
            <p className="text-slate-400 mb-6">Start tracking your journey — add your first application</p>
            <button onClick={() => { setEditingApp(null); setShowAddModal(true); }}
              className="px-8 py-3 bg-gradient-to-br from-[#7F77DD] to-[#6359CC] text-white rounded-2xl font-black text-sm shadow-lg">
              + Add your first application
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map(app => {
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG['Applied'];
              const isExpanded = expandedApp === app._id;
              const currentIdx = STATUSES.indexOf(app.status);
              const daysSince = getDaysSince(app.date);
              const stageChecklist = checklists[app.status] || [];

              return (
                <motion.div key={app._id} layout className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition-all">
                  {/* Main Row */}
                  <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedApp(isExpanded ? null : app._id)}>
                    {/* Company Avatar */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0"
                      style={{ background: cfg.light, color: cfg.color }}>
                      {app.company?.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-black text-slate-900 text-base truncate">{app.company}</h3>
                        {app.url && (
                          <a href={app.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                            <ExternalLink size={14} className="text-slate-300 hover:text-[#7F77DD]" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium truncate">{app.role} {app.ctc ? `• ${app.ctc}` : ''}</p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-400">{daysSince}d ago</span>
                      <span className="px-3 py-1.5 rounded-full text-[10px] font-black" style={{ background: cfg.light, color: cfg.color }}>
                        {cfg.icon} {app.status}
                      </span>
                      {isExpanded ? <ChevronUp size={18} className="text-slate-300" /> : <ChevronDown size={18} className="text-slate-300" />}
                    </div>
                  </div>

                  {/* Expanded Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-5 border-t border-slate-50">

                          {/* Status Pipeline */}
                          <div className="flex items-center gap-1 my-5">
                            {STATUSES.map((s, i) => {
                              const sc = STATUS_CONFIG[s];
                              const isCurrent = app.status === s;
                              const isPast = STATUSES.indexOf(app.status) > i;
                              return (
                                <React.Fragment key={s}>
                                  <button onClick={(e) => { e.stopPropagation(); moveStatus(app._id, s); }}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${
                                      isCurrent ? 'shadow-md scale-105' : isPast ? 'opacity-60' : 'opacity-30 hover:opacity-70'
                                    }`}
                                    style={{ background: isCurrent ? sc.color : sc.light, color: isCurrent ? 'white' : sc.color }}>
                                    {s}
                                  </button>
                                  {i < STATUSES.length - 1 && <ArrowRight size={12} className="text-slate-200 shrink-0" />}
                                </React.Fragment>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Left: Checklist + Notes */}
                            <div>
                              {/* Stage Checklist */}
                              <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <CheckSquare size={14} className="text-[#7F77DD]" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-[#7F77DD]">{app.status} Checklist</span>
                                </div>
                                <div className="space-y-2">
                                  {stageChecklist.map(item => {
                                    const checked = app.checklist?.[item.key] || false;
                                    return (
                                      <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" checked={checked}
                                          onChange={() => toggleChecklist(app._id, item.key, !checked)}
                                          className="w-4 h-4 rounded border-2 border-slate-300 accent-[#7F77DD]" />
                                        <span className={`text-xs font-medium transition-all ${checked ? 'text-slate-400 line-through' : 'text-slate-600 group-hover:text-slate-800'}`}>
                                          {item.text}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Notes */}
                              {app.notes && (
                                <div className="bg-[#FFF8EC] rounded-2xl p-4 mb-4 border border-[#BA751710]">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-[#BA7517] block mb-2">📝 Notes</span>
                                  <p className="text-xs text-slate-600 leading-relaxed">{app.notes}</p>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex flex-wrap gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setEditingApp(app); setShowAddModal(true); }}
                                  className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black flex items-center gap-1.5 hover:bg-slate-100 transition-all">
                                  <Edit3 size={12} /> Edit
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); deleteApp(app._id); }}
                                  className="px-4 py-2 bg-red-50 text-red-400 rounded-xl text-[10px] font-black flex items-center gap-1.5 hover:bg-red-100 transition-all">
                                  <Trash2 size={12} /> Delete
                                </button>
                                {currentIdx < STATUSES.length - 1 && (
                                  <button onClick={(e) => { e.stopPropagation(); moveStatus(app._id, STATUSES[currentIdx + 1]); }}
                                    className="px-4 py-2 bg-[#F0EDFF] text-[#7F77DD] rounded-xl text-[10px] font-black flex items-center gap-1.5 hover:bg-[#7F77DD] hover:text-white transition-all">
                                    <ArrowRight size={12} /> Move to {STATUSES[currentIdx + 1]}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Right: AI Panels */}
                            <div>
                              {/* Company Research */}
                              <div className="bg-[#E1F5EE] rounded-2xl p-4 mb-4 border border-[#1D9E7520]">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Building2 size={14} className="text-[#1D9E75]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1D9E75]">Company Research</span>
                                  </div>
                                  {!app.companyResearch && (
                                    <button onClick={(e) => { e.stopPropagation(); fetchCompanyResearch(app._id); }}
                                      disabled={aiLoading[`research_${app._id}`]}
                                      className="text-[10px] font-black bg-[#1D9E75] text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50">
                                      {aiLoading[`research_${app._id}`] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                      {aiLoading[`research_${app._id}`] ? 'Researching...' : 'Get AI Research'}
                                    </button>
                                  )}
                                </div>
                                {app.companyResearch ? (
                                  <div className="space-y-2 text-xs">
                                    <p className="text-slate-700 leading-relaxed">{app.companyResearch.about}</p>
                                    {app.companyResearch.techStack?.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5">
                                        {app.companyResearch.techStack.map((t, i) => (
                                          <span key={i} className="px-2 py-0.5 bg-white rounded text-[10px] font-bold text-[#085041]">{t}</span>
                                        ))}
                                      </div>
                                    )}
                                    <p className="text-slate-500 italic">{app.companyResearch.culture}</p>
                                    <p className="text-slate-600"><strong>Interview Style:</strong> {app.companyResearch.interviewStyle}</p>
                                    {app.companyResearch.avgSalary && <p className="text-[#1D9E75] font-bold">💰 {app.companyResearch.avgSalary}</p>}
                                    {app.companyResearch.tips?.length > 0 && (
                                      <div className="mt-2">
                                        <span className="text-[10px] font-black text-[#085041]">💡 Tips:</span>
                                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                          {app.companyResearch.tips.map((tip, i) => (
                                            <li key={i} className="text-slate-600">{tip}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-[#08504180] italic">Click "Get AI Research" to learn about this company</p>
                                )}
                              </div>

                              {/* Interview Prep */}
                              {(app.status === 'Interview' || app.status === 'OA') && (
                                <div className="bg-[#F0EDFF] rounded-2xl p-4 border border-[#7F77DD20]">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Brain size={14} className="text-[#7F77DD]" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-[#7F77DD]">Interview Prep</span>
                                    </div>
                                    {!app.interviewPrep && (
                                      <button onClick={(e) => { e.stopPropagation(); fetchInterviewPrep(app._id); }}
                                        disabled={aiLoading[`prep_${app._id}`]}
                                        className="text-[10px] font-black bg-[#7F77DD] text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50">
                                        {aiLoading[`prep_${app._id}`] ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        {aiLoading[`prep_${app._id}`] ? 'Generating...' : 'Generate Prep'}
                                      </button>
                                    )}
                                  </div>
                                  {app.interviewPrep ? (
                                    <div className="space-y-3 text-xs">
                                      {/* Common Questions */}
                                      <div>
                                        <span className="text-[10px] font-black text-[#3C3489] block mb-2">🎯 Common Questions</span>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                          {app.interviewPrep.commonQuestions?.map((q, i) => (
                                            <div key={i} className="bg-white rounded-xl p-3 border border-[#7F77DD10]">
                                              <p className="font-bold text-slate-700 mb-1">{q.question}</p>
                                              <p className="text-slate-400 italic text-[11px]">💡 {q.tip}</p>
                                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded mt-1 inline-block ${
                                                q.category === 'technical' ? 'bg-blue-50 text-blue-500' :
                                                q.category === 'behavioral' ? 'bg-amber-50 text-amber-600' :
                                                'bg-purple-50 text-purple-500'
                                              }`}>{q.category}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* DSA Topics */}
                                      {app.interviewPrep.dsaTopics?.length > 0 && (
                                        <div>
                                          <span className="text-[10px] font-black text-[#3C3489] block mb-1">📚 DSA Topics to Revise</span>
                                          <div className="flex flex-wrap gap-1.5">
                                            {app.interviewPrep.dsaTopics.map((t, i) => (
                                              <span key={i} className="px-2 py-0.5 bg-white rounded text-[10px] font-bold text-[#7F77DD] border border-[#7F77DD20]">{t}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Behavioral Tips */}
                                      {app.interviewPrep.behavioralTips?.length > 0 && (
                                        <div>
                                          <span className="text-[10px] font-black text-[#3C3489] block mb-1">🗣️ Behavioral Tips</span>
                                          <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                                            {app.interviewPrep.behavioralTips.map((t, i) => <li key={i}>{t}</li>)}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Resources */}
                                      {app.interviewPrep.resources?.length > 0 && (
                                        <div>
                                          <span className="text-[10px] font-black text-[#3C3489] block mb-1">🔗 Prep Resources</span>
                                          <div className="space-y-1">
                                            {app.interviewPrep.resources.map((r, i) => (
                                              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-[#7F77DD] hover:underline font-medium">
                                                <ExternalLink size={10} /> {r.title}
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-[#3C348980] italic">Generate AI-powered interview prep for {app.company}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <ApplicationModal
          app={editingApp}
          onClose={() => { setShowAddModal(false); setEditingApp(null); }}
          onSave={async (formData) => {
            try {
              if (editingApp) {
                const res = await api.put(`/applications/${editingApp._id}`, formData);
                setApplications(prev => prev.map(a => a._id === editingApp._id ? res.data : a));
              } else {
                const res = await api.post('/applications', formData);
                setApplications(prev => [res.data, ...prev]);
              }
              setShowAddModal(false);
              setEditingApp(null);
              fetchAnalytics();
            } catch (err) { alert('Failed to save.'); }
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, highlight }) {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${highlight ? 'bg-[#E1F5EE] border-[#1D9E7530] shadow-md' : 'bg-white border-slate-100'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, color }}>{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-black" style={{ color: highlight ? '#1D9E75' : '#1a1d2e' }}>{value}</div>
    </div>
  );
}

function ApplicationModal({ app, onClose, onSave }) {
  const [formData, setFormData] = useState({
    company: app?.company || '', role: app?.role || '', status: app?.status || 'Applied',
    date: app?.date ? app.date.split('T')[0] : new Date().toISOString().split('T')[0],
    url: app?.url || '', ctc: app?.ctc || '', notes: app?.notes || '', deadlineDate: app?.deadlineDate ? app.deadlineDate.split('T')[0] : '',
  });

  const handleSubmit = (e) => { e.preventDefault(); if (!formData.company || !formData.role) return; onSave(formData); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-900">{app ? 'Edit Application' : 'Add Application'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Company *" value={formData.company} onChange={v => setFormData({ ...formData, company: v })} placeholder="e.g. Google" />
            <FormField label="Role *" value={formData.role} onChange={v => setFormData({ ...formData, role: v })} placeholder="e.g. SDE 1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-[#7F77DD]">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <FormField label="Date Applied" type="date" value={formData.date} onChange={v => setFormData({ ...formData, date: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Job URL" value={formData.url} onChange={v => setFormData({ ...formData, url: v })} placeholder="https://..." />
            <FormField label="CTC / Stipend" value={formData.ctc} onChange={v => setFormData({ ...formData, ctc: v })} placeholder="e.g. 12 LPA" />
          </div>
          <FormField label="Deadline Date (OA/Interview)" type="date" value={formData.deadlineDate} onChange={v => setFormData({ ...formData, deadlineDate: v })} />
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notes</label>
            <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Round details, referral contact..."
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none min-h-[80px] resize-y focus:border-[#7F77DD]" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-transparent border border-slate-200 rounded-2xl text-slate-500 font-black text-sm">Cancel</button>
            <button type="submit" className="flex-[2] py-3 bg-gradient-to-br from-[#7F77DD] to-[#6359CC] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#7F77DD30]">
              Save Application
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-[#7F77DD]" />
    </div>
  );
}
