import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { Skeleton, Spinner } from '../components/LoadingUI';
import { 
  Trophy, Clock, ChevronRight, AlertCircle, 
  CheckCircle2, Brain, Users, Layout, RotateCcw, 
  Home, Star, MessageSquare
} from 'lucide-react';

const Interview = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  
  // States
  const [step, setStep] = useState(1); // 1: Selection, 2: Interview, 3: Results
  const [type, setType] = useState(null);
  const [interviewMode, setInterviewMode] = useState('Personalized'); // Standard vs Personalized
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(false);
  const [modeSwitching, setModeSwitching] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };



  // Timer logic
  useEffect(() => {
    if (step === 2 && !loading) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [step, currentIndex, loading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startInterview = async (selectedType) => {
    setType(selectedType);
    setLoading(true);
    try {
      const res = await api.post('/interview/start', { interviewType: selectedType, mode: interviewMode });
      setQuestions(res.data.questions || []);
      setStep(2);
      setTimer(0);
    } catch (err) {
      console.error(err);
      alert("Failed to start interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const currentAnswer = answers[currentIndex];
    if (!currentAnswer || currentAnswer.length < 10) {
      alert("Please provide a more detailed answer.");
      return;
    }

    setLoading(true);
    try {
      const qText = questions[currentIndex].text || questions[currentIndex].question;
      const res = await api.post('/interview/evaluate', {
        question: qText,
        answer: currentAnswer
      });
      
      const rawScore = res.data.score || "0/10";
      const scoreVal = parseInt(rawScore.split('/')[0]) || 0;
      const improvements = res.data.improvements || [];
      const improvementText = improvements[0] || "Practice this topic more.";
      const feedbackText = `Strengths: ${(res.data.strengths || []).join(', ')}. Mistakes: ${(res.data.mistakes || []).join(', ')}`;
      
      const parsedEval = { score: scoreVal, feedback: feedbackText, improvement: improvementText };

      setEvaluations(prev => ({
        ...prev,
        [currentIndex]: parsedEval
      }));

      if (currentIndex < 4) {
        setCurrentIndex(prev => prev + 1);
        setTimer(0);
      } else {
        finalizeResults(parsedEval);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const finalizeResults = async (lastEval) => {
    const allEvals = { ...evaluations, [currentIndex]: lastEval };
    const numQs = questions.length || 5;
    const avgScore = Object.values(allEvals).reduce((acc, curr) => acc + curr.score, 0) / numQs;
    
    try {
      const res = await api.post('/interview/save', {
        interviewType: type,
        mode: interviewMode,
        overallScore: avgScore,
        questionBreakdown: questions.map((q, i) => ({
          question: q.text || q.question,
          answer: answers[i],
          score: allEvals[i].score,
          feedback: allEvals[i].feedback,
          improvement: allEvals[i].improvement
        }))
      });
      
      // Update local user state for confidence score
      if (res.data.user) setUser(res.data.user);
      setStep(3);
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Step 1: Selection
  // --------------------------------------------------------------------------
  const selectionScreen = (
    <div className="max-w-4xl mx-auto py-12">
      <h2 className="text-3xl font-black text-center mb-4 font-nunito">Choose Your Interview Focus</h2>
      <p className="text-center text-slate-500 mb-8">AI will generate 5 targeted questions based on your profile and mode.</p>
      
      <div className="flex justify-center mb-10">
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center shadow-inner">
          <button 
            onClick={() => {
              if (interviewMode !== 'Personalized') {
                setModeSwitching(true);
                setTimeout(() => { setInterviewMode('Personalized'); setModeSwitching(false); }, 2000);
              }
            }}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${interviewMode === 'Personalized' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Personalized (Gap Focus)
          </button>
          <button 
             onClick={() => {
               if (interviewMode !== 'Company') {
                 setModeSwitching(true);
                 setTimeout(() => { setInterviewMode('Company'); setModeSwitching(false); }, 2000);
               }
             }}
             className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${interviewMode === 'Company' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Standard (Company Strict)
          </button>
        </div>
      </div>

      {modeSwitching ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
          <p className="text-slate-600 font-bold text-lg animate-pulse">Switching mode...</p>
          <p className="text-slate-400 text-sm mt-1">Recalibrating question difficulty</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">        {[
          { id: 'Technical', icon: <Brain size={32} />, color: 'bg-blue-50 text-blue-600', desc: 'DSA, Coding, Tools' },
          { id: 'HR', icon: <Users size={32} />, color: 'bg-purple-50 text-purple-600', desc: 'Behavioral, Culture' },
          { id: 'System Design', icon: <Layout size={32} />, color: 'bg-pink-50 text-pink-600', desc: 'Scalability, Architecture' }
        ].map(card => (
          <motion.div
            key={card.id}
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => !loading && startInterview(card.id)}
            className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-200 cursor-pointer shadow-sm hover:shadow-xl transition-all text-center flex flex-col items-center"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${card.color}`}>
              {card.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{card.id}</h3>
            <p className="text-sm text-slate-400 font-medium">{card.desc}</p>
            <div className="mt-8 text-indigo-500 font-bold flex items-center gap-2 group text-sm italic">
              {loading && type === card.id ? (
                <div className="flex items-center gap-2"><Spinner size={14} /> Initializing...</div>
              ) : (
                <>Prepare Questions <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </div>
  );

  // --------------------------------------------------------------------------
  // Step 2: Interview
  // --------------------------------------------------------------------------
  const currentQ = questions[currentIndex];
  const interviewScreen = (
    <div className="max-w-3xl mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            {currentIndex + 1}/{questions.length}
          </div>
          <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 font-bold text-sm">
          <Clock size={16} />
          {formatTime(timer)}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
               <Star size={12} fill="currentColor" /> Question {currentIndex + 1}
            </h3>
            <h2 className="text-2xl font-bold font-nunito text-slate-800 leading-snug mb-6">
              {currentQ?.text || currentQ?.question}
            </h2>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-sm text-slate-500 italic"><span className="font-bold text-slate-600 not-italic">Hint/Type:</span> {currentQ?.context || currentQ?.type}</p>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={answers[currentIndex] || ''}
              onChange={e => setAnswers({ ...answers, [currentIndex]: e.target.value })}
              className="w-full h-48 bg-white border-2 border-slate-100 rounded-[2rem] p-8 font-dm-sans text-lg outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300 shadow-sm"
              placeholder="State your answer clearly here..."
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-4">
              <span className="text-xs text-slate-400 font-medium tracking-tight">Focus on accuracy & clarity</span>
              <button
                onClick={handleNext}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Spinner size={16} /> : currentIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question'}
                {!loading && <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  // --------------------------------------------------------------------------
  // Step 3: Results
  // --------------------------------------------------------------------------
  const avgScore = questions.length > 0 
    ? (Object.values(evaluations).reduce((acc, curr) => acc + curr.score, 0) / questions.length) 
    : 0;

  const resultsScreen = (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest mb-6">
          <CheckCircle2 size={16} /> Interview Complete
        </div>
        <h2 className="text-4xl font-black font-nunito mb-2">Interview Performance Report</h2>
        <p className="text-slate-500 font-medium text-lg">You completed a {type} Session.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 text-center flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                <circle cx="80" cy="80" r="70" stroke="#4f46e5" strokeWidth="12" fill="none" 
                  strokeDasharray="439.8" strokeDashoffset={439.8 - (439.8 * avgScore) / 10} 
                  style={{ transition: 'stroke-dashoffset 2s ease-out' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">{avgScore.toFixed(1)}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Score</span>
              </div>
            </div>
            <h4 className="font-bold text-slate-600 mb-1">Overall Verdict</h4>
            <div className={`text-lg font-black ${avgScore >= 7 ? 'text-emerald-500' : avgScore >= 4 ? 'text-yellow-500' : 'text-red-500'}`}>
              {avgScore >= 8 ? 'Exceptional' : avgScore >= 6 ? 'Competent' : 'Needs Work'}
            </div>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Trophy size={120} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm">
           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
             <MessageSquare className="text-indigo-500" /> Focus for Improvement
           </h3>
           <div className="space-y-4">
              {Object.values(evaluations).slice(0, 3).map((ev, i) => (
                <div key={i} className="flex gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600 shrink-0">
                    {i+1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-1 leading-snug">{ev.improvement}</p>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed italic">{ev.feedback}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="space-y-6 mb-12">
        <h3 className="text-2xl font-black font-nunito px-2">Detailed Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((q, i) => {
            const ev = evaluations[i] || {};
            return (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Question {i+1}</span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${ev.score >= 7 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                    {ev.score}/10
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-3 line-clamp-2 leading-snug">{q.text || q.question}</h4>
                <div className="h-0.5 w-full bg-slate-50 mb-3"></div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{ev.feedback}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-16 scroll-mt-32">
        <button 
          onClick={() => { setStep(1); setQuestions([]); setCurrentIndex(0); setAnswers({}); setEvaluations({}); }}
          className="flex items-center gap-3 px-10 py-5 bg-white border-2 border-slate-100 rounded-3xl font-black text-slate-600 shadow-sm hover:border-indigo-200 transition-all active:scale-95"
        >
          <RotateCcw size={20} /> Try Again
        </button>
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
        >
          <Home size={20} /> Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)] font-dm-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative min-h-full pb-32 pt-12 px-8"
        >
           {/* Step Navigation Details */}
           <div className="max-w-5xl mx-auto flex justify-center mb-12">
             <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-white/40 shadow-sm">
                {['Focus', 'Interview', 'Results'].map((s, i) => (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl transition-all duration-500 ${step === i + 1 ? 'bg-white shadow-md' : 'opacity-40 grayscale'}`}>
                       <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${step === i+1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                         {i+1}
                       </div>
                       <span className="text-xs font-black uppercase tracking-widest text-slate-700">{s}</span>
                    </div>
                    {i < 2 && <div className="w-6 h-px bg-slate-200"></div>}
                  </div>
                ))}
             </div>
           </div>

           <AnimatePresence mode="wait">
             {step === 1 && <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>{selectionScreen}</motion.div>}
             {step === 2 && <motion.div key="s2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>{interviewScreen}</motion.div>}
             {step === 3 && <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{resultsScreen}</motion.div>}
           </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

export default Interview;
