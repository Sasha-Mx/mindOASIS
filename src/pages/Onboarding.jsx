import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { generateRoadmap } from '../services/gemini';
import api from '../services/api';
import { Spinner } from '../components/LoadingUI';
import LoadingScreen from '../components/LoadingScreen';
import OnboardingTransition from '../components/OnboardingTransition';

const YEARS = ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'Graduated'];
const ROLES = [
  { icon: '💻', name: 'Software Developer' },
  { icon: '📊', name: 'Data Analyst' },
  { icon: '🤖', name: 'Data Scientist' },
  { icon: '📱', name: 'Frontend Developer' },
  { icon: '⚙️', name: 'Backend Developer' },
  { icon: '☁️', name: 'DevOps Engineer' },
  { icon: '🧠', name: 'ML Engineer' },
  { icon: '📦', name: 'Product Manager' },
  { icon: '🔐', name: 'Cybersecurity' },
  { icon: '🎨', name: 'UI/UX Designer' },
  { icon: '📈', name: 'Business Analyst' },
  { icon: '✍️', name: 'Other' },
];
const SKILLS_LIST = [
  'Python', 'Java', 'C++', 'JavaScript', 'TypeScript',
  'React', 'Node.js', 'SQL', 'MongoDB', 'PostgreSQL',
  'DSA', 'System Design', 'ML/AI', 'Git', 'Docker',
  'AWS', 'Linux', 'REST APIs', 'GraphQL', 'Figma'
];
const SKILL_PLACEHOLDERS = {
  'DSA': 'e.g. Arrays, Linked Lists, Stacks, Queues, Binary Search...',
  'Python': 'e.g. Loops, Functions, OOP, File Handling, Libraries used...',
  'System Design': 'e.g. Load Balancing, Caching, CAP theorem, SQL vs NoSQL...',
  'React': 'e.g. JSX, Components, useState, useEffect, React Router...',
  'Node.js': 'e.g. Express, REST APIs, Middleware, File System, MongoDB...',
  'SQL': 'e.g. SELECT, JOINs, Aggregations, Indexing, Stored Procedures...',
  'ML/AI': 'e.g. Linear Regression, Classification, scikit-learn, model evaluation...',
  'Docker': 'e.g. Images, Containers, Dockerfile, Docker Compose...',
  'Linux': 'e.g. Basic commands, File system, User management, Shell scripting...',
  'Git': 'e.g. Clone, Commit, Push, Branching, Merge conflicts, Rebase...',
  'Java': 'e.g. OOP, Collections, Multithreading, Spring Boot...',
  'C++': 'e.g. STL, Pointers, OOP, Templates, Memory Management...',
  'JavaScript': 'e.g. ES6, Closures, Promises, DOM manipulation, Async/Await...',
  'TypeScript': 'e.g. Types, Interfaces, Generics, Enums, Type Guards...',
  'MongoDB': 'e.g. CRUD, Aggregation, Indexing, Mongoose, Schema Design...',
  'PostgreSQL': 'e.g. Relational modeling, JOINs, Indexing, Triggers...',
  'AWS': 'e.g. EC2, S3, Lambda, IAM, VPC, CloudFormation...',
  'REST APIs': 'e.g. HTTP methods, Status codes, Auth, Pagination...',
  'GraphQL': 'e.g. Queries, Mutations, Resolvers, Schema, Apollo...',
  'Figma': 'e.g. Components, Auto Layout, Prototyping, Design Systems...',
};
const HOURS = [
  { label: 'Less than 1 hour', sub: "Quick daily wins", icon: '⚡' },
  { label: '1–2 hours', sub: "Steady and consistent", icon: '📚' },
  { label: '2–4 hours', sub: "Serious about it", icon: '🔥' },
  { label: '4+ hours', sub: "Full send mode", icon: '🚀' }
];

const LOADING_TEXTS = [
  "Analyzing your profile...",
  "Identifying skill gaps...",
  "Building your 8-week roadmap...",
  "Preparing your daily missions...",
  "Almost ready..."
];

const Onboarding = () => {
  const { user, updateProfileAndRoadmap } = useUser();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);
  const [errorToast, setErrorToast] = useState("");
  const [showTransition, setShowTransition] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState(null);

  // Form State
  const [year, setYear] = useState('');
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [mode, setMode] = useState('Placement');
  const [skills, setSkills] = useState([]); // Array of { name, level, knownTopics }
  const [customSkill, setCustomSkill] = useState('');
  const [showCustomSkill, setShowCustomSkill] = useState(false);
  const [months, setMonths] = useState(8);
  const [hours, setHours] = useState('');

  // If user somehow lands here and is already onboarded, send to dashboard
  // BUT only if we are not currently in the "showTransition" state
  useEffect(() => {
    if (user?.onboardingDone && !showTransition && !loading) {
      navigate('/dashboard');
    }
  }, [user, showTransition, loading, navigate]);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingTextIdx((prev) => (prev + 1) % LOADING_TEXTS.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const skillNames = skills.map(s => s.name);

  const toggleSkill = (s) => {
    if (skillNames.includes(s)) setSkills(skills.filter(sk => sk.name !== s));
    else setSkills([...skills, { name: s, level: 'beginner', knownTopics: '' }]);
  };

  const updateSkillField = (name, field, value) => {
    setSkills(skills.map(sk => sk.name === name ? { ...sk, [field]: value } : sk));
  };

  const handleAddCustomSkill = (e) => {
    if (e.key === 'Enter' && customSkill.trim() && !skillNames.includes(customSkill.trim())) {
      e.preventDefault();
      setSkills([...skills, { name: customSkill.trim(), level: 'beginner', knownTopics: '' }]);
      setCustomSkill('');
      setShowCustomSkill(false);
    }
  };

  const isStepValid = () => {
    if (step === 0) return year !== '';
    if (step === 1) return role !== '' && (role !== 'Other' || customRole.trim() !== '');
    if (step === 2) return skills.length > 0;
    if (step === 3) return true;
    if (step === 4) return hours !== '';
    return false;
  };

  const getMonthMessage = () => {
    if (months <= 3) return "⚡ Intensive mode — we'll focus on what matters most";
    if (months <= 6) return "🎯 Focused prep — solid time to build strong skills";
    if (months <= 12) return "🗺️ Balanced journey — room to go deep on everything";
    return "🌱 Long game — we'll build you from the ground up";
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorToast("");
    const finalRole = role === 'Other' ? customRole : role;
    
    const answers = {
      year,
      role: finalRole,
      mode,
      skills,
      months,
      hours
    };

    try {
      const roadmap = await generateRoadmap(answers);
      
      await api.post('/profile/save', {
        profile: answers,
        roadmap
      });

      updateProfileAndRoadmap(answers, roadmap, roadmap.confidence_score || 0);
      setGeneratedRoadmap(roadmap);
      setLoading(false);
      setShowTransition(true);
      
    } catch (error) {
      console.error("ONBOARDING ERROR:", error);
      const msg = error.response?.data?.message || error.response?.data?.error || "Something went wrong. Please check your connection and try again.";
      setErrorToast(msg);
      setLoading(false);
    }

  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const progressPct = ((step) / 4) * 100;

  const stepVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 font-dm-sans overflow-hidden text-[var(--text-1)]"
      style={{ background: 'linear-gradient(155deg, #dce9ff 0%, #f0f4ff 50%, #ede8ff 100%)' }}
    >
      
      {errorToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-2xl shadow-xl shadow-red-500/20 backdrop-blur-md flex items-center gap-4 font-bold border border-red-400">
          {errorToast}
          <button onClick={handleSubmit} className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">Retry</button>
          <button onClick={() => setErrorToast("")} className="text-white/60 hover:text-white">✕</button>
        </div>
      )}

      <div className="w-full max-w-[580px] bg-white border border-[#e0e8ff] rounded-[24px] p-8 md:p-12 relative flex flex-col min-h-[580px] transition-all duration-300 shadow-[0_8px_40px_rgba(74,127,224,0.12)]">
        
        {step > 0 && (
          <button onClick={handleBack} className="absolute top-6 left-8 text-[var(--text-2)] hover:text-[var(--text-1)] text-sm font-bold transition-colors">
            ← Back
          </button>
        )}

        <div className="text-center mb-8 mt-4">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--blue-light)] border border-[var(--input-border)] text-[var(--purple)] text-xs font-black tracking-widest uppercase mb-4 shadow-sm">
            ✦ STEP {step + 1} OF 5
          </div>
          <div className="w-full h-1.5 bg-[var(--blue-light)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-br from-[#7b6cf6] to-[#e96bbd] transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex-1 relative flex flex-col items-center w-full">
          
          <div className="relative w-full overflow-y-auto overflow-x-hidden custom-scrollbar pb-6 flex-1 min-h-[460px] max-h-[55vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full" // Ensure this div takes full width for positioning
              >
                {/* Step 1 */}
                {step === 0 && (
                  <div className="text-center mb-8">
                    <h2 className="font-nunito text-[32px] font-black leading-tight text-[var(--text-1)] mb-2">Where are you in your journey?</h2>
                    <p className="text-[var(--text-2)] text-[15px]">This helps us set the right pace for you</p>
                    <div className="grid grid-cols-2 gap-3 justify-center max-w-sm mx-auto mt-8">
                      {YEARS.slice(0, 4).map(y => (
                        <button key={y} onClick={() => setYear(y)} className={`h-[64px] rounded-xl font-bold transition-all relative overflow-hidden flex items-center justify-center text-sm border ${year === y ? 'bg-gradient-to-br from-[#7b6cf6] to-[#e96bbd] border-transparent text-white shadow-md scale-[1.02]' : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-1)] hover:border-[var(--blue-mid)] hover:scale-[1.02]'}`}>
                          {y}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-center mt-3">
                      <button onClick={() => setYear('Graduated')} className={`w-1/2 h-[64px] rounded-xl font-bold transition-all relative overflow-hidden flex items-center justify-center text-sm border ${year === 'Graduated' ? 'bg-gradient-to-br from-[#7b6cf6] to-[#e96bbd] border-transparent text-white shadow-md scale-[1.02]' : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-1)] hover:border-[var(--blue-mid)] hover:scale-[1.02]'}`}>
                        Graduated
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {step === 1 && (
                  <div>
                    <div className="text-center mb-8">
                      <h2 className="font-nunito text-[32px] font-black leading-tight text-[var(--text-1)] mb-2">What's your dream role?</h2>
                      <p className="text-[var(--text-2)] text-[15px]">We'll tailor your roadmap to exactly this</p>
                    </div>
                    <div className="pr-2">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {ROLES.map(r => (
                          <button
                            key={r.name}
                            onClick={() => { setRole(r.name); setCustomRole(''); }}
                            className={`px-4 h-[44px] rounded-[50px] font-semibold transition-all text-sm flex items-center gap-2 ${role === r.name ? 'bg-gradient-to-br from-[#7b6cf6] to-[#e96bbd] border-transparent text-white shadow-md scale-[1.04]' : 'bg-[var(--input-bg)] border-[1.5px] border-[var(--input-border)] text-[var(--text-2)] hover:border-[var(--blue-mid)]'}`}
                          >
                            <span>{r.icon}</span> {r.name}
                          </button>
                        ))}
                      </div>
                      
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${role === 'Other' ? 'max-h-[100px] mt-6 opacity-100' : 'max-h-0 mt-0 opacity-0'}`}>
                        <input 
                          type="text" 
                          placeholder="Type your role..." 
                          value={customRole}
                          onChange={(e) => setCustomRole(e.target.value)}
                          className="w-full p-4 rounded-xl bg-[var(--input-bg)] border-[1.5px] border-[var(--input-border)] outline-none focus:border-[var(--blue-primary)] text-[var(--text-1)] placeholder:text-[var(--text-3)] text-sm shadow-inner"
                        />
                      </div>

                      <div style={{ marginTop: 24 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, fontWeight: 600 }} className="text-center md:text-left">
                          What are you preparing for?
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {['Internship', 'Placement'].map(m => (
                            <button
                              key={m}
                              onClick={() => setMode(m)}
                              style={{
                                flex: 1, padding: '14px',
                                background: mode === m
                                  ? 'var(--gradient-btn)'
                                  : 'var(--input-bg)',
                                border: mode === m ? 'none' : '1.5px solid var(--input-border)',
                                borderRadius: 14, cursor: 'pointer',
                                color: mode === m ? 'white' : 'var(--text-2)',
                                fontFamily: 'Nunito', fontWeight: 800, fontSize: 15,
                                transition: 'all 0.18s',
                              }}
                              className={mode === m ? "shadow-md scale-[1.02]" : "hover:border-[var(--blue-mid)]"}
                            >
                              {m === 'Internship' ? '🎓 Internship' : '💼 Placement'}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {step === 2 && (
                  <div>
                    <div className="text-center mb-6">
                      <h2 className="font-nunito text-[32px] font-black leading-tight text-[var(--text-1)] mb-2">What's already in your toolkit?</h2>
                      <p className="text-[var(--text-2)] text-[15px]">Select all that apply — be honest, we won't judge!</p>
                    </div>
                    
                    <div className="pr-2">
                      {/* Skill Selector Pills */}
                      <div className="flex flex-wrap gap-2 justify-center mb-6">
                        {SKILLS_LIST.map(s => (
                          <button
                            key={s}
                            onClick={() => toggleSkill(s)}
                            className={`px-4 h-[40px] rounded-[50px] font-semibold text-sm transition-all flex items-center gap-1.5 ${skillNames.includes(s) ? 'bg-gradient-to-br from-[#7b6cf6] to-[#e96bbd] border-transparent text-white shadow-md scale-[1.04]' : 'bg-[var(--input-bg)] border-[1.5px] border-[var(--input-border)] text-[var(--text-2)] hover:border-[var(--blue-mid)]'}`}
                          >
                            {skillNames.includes(s) && <span className="font-black">✓</span>} {s}
                          </button>
                        ))}
                        {skills.filter(sk => !SKILLS_LIST.includes(sk.name)).map(sk => (
                          <button
                            key={sk.name}
                            onClick={() => toggleSkill(sk.name)}
                            className="px-4 h-[40px] rounded-[50px] font-semibold text-sm transition-all flex items-center gap-1.5 bg-gradient-to-br from-[#7b6cf6] to-[#e96bbd] border-transparent text-white shadow-md scale-[1.04]"
                          >
                            <span className="font-black">✓</span> {sk.name}
                          </button>
                        ))}
                      </div>

                      {/* Add Custom Skill */}
                      <div className="flex justify-center flex-col items-center gap-3 mb-6">
                        {!showCustomSkill ? (
                          <button 
                            onClick={() => setShowCustomSkill(true)}
                            className="px-6 py-2 rounded-full border border-dashed border-[var(--blue-primary)] text-[var(--blue-primary)] hover:bg-[var(--blue-light)] transition-colors text-sm font-bold"
                          >
                            + Add a skill
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 w-full max-w-sm animate-in fade-in zoom-in-95">
                            <input 
                              type="text" 
                              placeholder="Type skill name..." 
                              value={customSkill}
                              onChange={(e) => setCustomSkill(e.target.value)}
                              onKeyDown={handleAddCustomSkill}
                              autoFocus
                              className="flex-1 p-3 rounded-xl bg-[var(--input-bg)] border-[1.5px] border-[var(--input-border)] outline-none focus:border-[var(--blue-primary)] text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
                            />
                            <button 
                              onClick={() => {
                                if(customSkill.trim() && !skillNames.includes(customSkill.trim())) {
                                  setSkills([...skills, { name: customSkill.trim(), level: 'beginner', knownTopics: '' }]);
                                }
                                setCustomSkill('');
                                setShowCustomSkill(false);
                              }}
                              className="p-3 bg-[var(--blue-light)] rounded-xl hover:bg-[var(--blue-mid)] hover:text-white text-[var(--blue-primary)] transition-colors font-bold"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expanded Skill Cards */}
                      {skills.length > 0 && (
                        <div className="space-y-3 mt-2">
                          {skills.map(sk => (
                            <div key={sk.name} className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-4 transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">⚡</span>
                                  <span className="font-bold text-[var(--text-1)] text-sm">{sk.name}</span>
                                </div>
                                <button
                                  onClick={() => toggleSkill(sk.name)}
                                  className="w-6 h-6 rounded-full bg-[var(--input-border)] hover:bg-red-400 hover:text-white text-[var(--text-3)] flex items-center justify-center text-xs font-black transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                              
                              <p className="text-[11px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-2">Your Level:</p>
                              <div className="flex gap-2 mb-3">
                                {['beginner', 'intermediate', 'advanced'].map(lvl => (
                                  <button
                                    key={lvl}
                                    onClick={() => updateSkillField(sk.name, 'level', lvl)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${sk.level === lvl ? 'bg-gradient-to-br from-[#7b6cf6] to-[#e96bbd] text-white shadow-md' : 'bg-white border border-[var(--input-border)] text-[var(--text-2)] hover:border-[var(--blue-mid)]'}`}
                                  >
                                    {lvl}
                                  </button>
                                ))}
                              </div>

                              <p className="text-[11px] font-bold text-[var(--text-3)] uppercase tracking-wider mb-1.5">What topics do you know? <span className="normal-case font-normal">(optional)</span></p>
                              <textarea
                                value={sk.knownTopics}
                                onChange={(e) => updateSkillField(sk.name, 'knownTopics', e.target.value)}
                                placeholder={SKILL_PLACEHOLDERS[sk.name] || SKILL_PLACEHOLDERS['default'] || 'e.g. List the specific topics you are comfortable with...'}
                                rows={2}
                                className="w-full p-3 rounded-xl bg-white border border-[var(--input-border)] outline-none focus:border-[var(--blue-primary)] text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] resize-none"
                              />
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-xs">💡</span>
                                <p className="text-[11px] text-[var(--text-3)] italic">Be specific — this helps us skip what you already know</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4 */}
                {step === 3 && (
                  <div>
                    <div className="text-center mb-10">
                      <h2 className="font-nunito text-[32px] font-black leading-tight text-[var(--text-1)] mb-2">When's your target date?</h2>
                      <p className="text-[var(--text-2)] text-[15px]">Drag to set how many months you have</p>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="text-[48px] font-nunito font-black text-[var(--text-1)] mb-8">
                        {months} <span className="text-[24px] text-[var(--text-3)]">months</span>
                      </div>
                      
                      <div className="w-full max-w-md relative pb-6">
                        <input 
                          type="range" 
                          min="1" 
                          max="24" 
                          value={months}
                          onChange={(e) => setMonths(e.target.value)}
                          className="w-full h-2 rounded-full appearance-none bg-[var(--input-bg)] outline-none"
                          style={{
                            background: `linear-gradient(to right, var(--purple), var(--pink) ${(months / 24) * 100}%, var(--input-bg) ${(months / 24) * 100}%)`,
                          }}
                        />
                        <style>{`
                          input[type='range']::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            appearance: none;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            background: white;
                            cursor: pointer;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.15);
                            border: 2px solid var(--purple);
                          }
                        `}</style>
                      </div>

                      <div className="mt-6 px-6 py-3 bg-[var(--blue-light)] border border-[var(--input-border)] rounded-2xl flex items-center justify-center text-center">
                        <p className="font-bold text-[var(--purple)] text-[15px]">{getMonthMessage()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5 */}
                {step === 4 && (
                  <div className="flex flex-col">
                    <div className="text-center mb-8">
                      <h2 className="font-nunito text-[32px] font-black leading-tight text-[var(--text-1)] mb-2">How much time can you give daily?</h2>
                      <p className="text-[var(--text-2)] text-[15px]">Be realistic — consistency beats intensity</p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {HOURS.map(h => (
                        <button 
                          key={h.label}
                          onClick={() => setHours(h.label)}
                          className={`w-full h-[64px] rounded-xl px-6 flex items-center justify-between transition-all border ${hours === h.label ? 'bg-gradient-to-br from-[#7b6cf6] to-[#e96bbd] border-transparent text-white shadow-md' : 'bg-[var(--input-bg)] border-[var(--input-border)] hover:border-[var(--blue-mid)]'}`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{h.icon}</span>
                            <span className={`font-nunito font-bold text-[17px] ${hours === h.label ? 'text-white' : 'text-[var(--text-1)]'}`}>{h.label}</span>
                          </div>
                          {hours === h.label ? (
                            <span className="text-sm font-bold text-white max-w-[140px] text-right truncate">✓</span>
                          ) : (
                            <span className="text-sm italic text-[var(--text-3)]">{h.sub}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div> {/* End of scrollable area */}

          <div className="w-full shrink-0">
            <button 
              onClick={handleNext}
              disabled={!isStepValid() || (step === 4 && loading)}
              className="w-full mt-4 h-[56px] rounded-full bg-gradient-to-br from-[#7b6cf6] to-[#e96bbd] text-white font-nunito font-extrabold text-[16px] shadow-[0_8px_20px_rgba(123,108,246,0.25)] hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(233,107,189,0.35)] transition-all disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100 disabled:shadow-none disabled:cursor-not-allowed z-20 flex items-center justify-center gap-2"
            >
              {loading && step === 4 ? (
                <><Spinner size={20} /> Generating...</>
              ) : (
                step === 4 ? 'Generate My Roadmap ✦' : 'Next Step →'
              )}
            </button>
          </div>

        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--input-bg);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--blue-light);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--blue-mid);
        }
      `}</style>

      {showTransition && (
        <OnboardingTransition roadmapData={generatedRoadmap} />
      )}
    </motion.div>
  );
};

export default Onboarding;
