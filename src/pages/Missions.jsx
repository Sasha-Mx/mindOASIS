import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import api from '../services/api';
import Confetti from 'react-confetti';
import { Spinner } from '../components/LoadingUI';
import { Flame, Star, Zap, Award, CheckCircle2, Sparkles } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import QuizModal from '../components/QuizModal';

const Missions = () => {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Quiz state
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizMission, setQuizMission] = useState({ text: '', xp: 0 });

  useEffect(() => {
    if (user) {
      if (user.roadmap?.daily_missions) {
        setMissions(user.roadmap.daily_missions);
      }
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.post('/missions/refresh');
      setMissions(res.data.daily_missions);
      setUser(prev => ({
        ...prev,
        roadmap: { ...prev.roadmap, daily_missions: res.data.daily_missions }
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Start quiz for a mission
  const handleStartQuiz = async (mText, xp) => {
    const today = new Date().toISOString().split('T')[0];
    const mId = today + ':' + mText;
    if (user.completedMissions?.includes(mId)) return;

    setQuizMission({ text: mText, xp });
    setQuizQuestions(null);
    setQuizResult(null);
    setQuizOpen(true);
    setQuizLoading(true);

    try {
      const role = user.profile?.role || 'Software Developer';
      const res = await api.post('/quiz/generate', {
        weekFocus: `Daily ${role} preparation`,
        taskText: mText
      });
      setQuizQuestions(res.data.questions);
    } catch (err) {
      console.error('Quiz generation failed:', err);
      alert('Failed to generate quiz. Please try again.');
      setQuizOpen(false);
    } finally {
      setQuizLoading(false);
    }
  };

  // Submit quiz answers for mission
  const handleQuizSubmit = async (answers) => {
    setQuizLoading(true);
    try {
      // Calculate score locally first
      let correct = 0;
      const results = quizQuestions.map((q, i) => {
        const isCorrect = answers[i] === q.correct;
        if (isCorrect) correct++;
        return {
          question: q.question,
          yourAnswer: q.options[answers[i]],
          correctAnswer: q.options[q.correct],
          isCorrect,
          explanation: q.explanation
        };
      });

      const passed = correct >= 3;
      const isPerfect = correct === 5;
      const bonusXP = isPerfect ? 10 : 0;
      const totalXP = passed ? (quizMission.xp || 10) + bonusXP : 0;

      if (passed) {
        // Call the missions/complete endpoint
        const res = await api.post('/missions/complete', {
          missionText: quizMission.text,
          xpReward: totalXP
        });
        setUser(res.data.user);

        if (res.data.dailyCompleted) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }

      setQuizResult({
        passed,
        score: correct,
        totalXP,
        bonusXP,
        isPerfect,
        results
      });
    } catch (err) {
      console.error('Mission quiz error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizClose = () => {
    setQuizOpen(false);
    setQuizQuestions(null);
    setQuizResult(null);
  };

  const getStreakMessage = () => {
    const streak = user?.streakDays || 0;
    if (streak === 0) return { msg: "Start your journey today 🚀", sub: "Complete your first mission to start a streak!" };
    if (streak <= 3) return { msg: "You're building momentum! 🔥", sub: `${streak} day streak — keep the flame alive!` };
    if (streak <= 7) return { msg: "On fire! Don't break the chain! ⚡", sub: `${streak} days of consistency. You're unstoppable!` };
    return { msg: "Unstoppable! You're a legend 👑", sub: `${streak} day streak. You are in the top 1%!` };
  };

  const streakInfo = getStreakMessage();

  return (
    <div className="flex min-h-screen bg-white font-dm-sans">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto">
        {loading ? (
           <div className="flex flex-col items-center justify-center min-h-[60vh]">
             <div className="w-12 h-12 border-4 border-[#7F77DD] border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 text-slate-400 font-medium">Loading missions...</p>
           </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-[#F0EDFF] p-6 rounded-3xl border border-[#7F77DD20]">
                <div className="text-[#3C3489] text-[10px] font-black uppercase tracking-widest mb-1">Streak</div>
                <div className="flex items-center gap-2">
                  <span className="text-[32px] font-black text-[#3C3489]">{user.streakDays || 0}</span>
                  <Flame className="text-[#7F77DD]" fill="currentColor" size={24} />
                </div>
                <div className="text-[#3C348980] text-[11px] font-bold mt-1">days in a row</div>
              </div>
              
              <div className="bg-[#E1F5EE] p-6 rounded-3xl border border-[#1D9E7520]">
                <div className="text-[#085041] text-[10px] font-black uppercase tracking-widest mb-1">XP</div>
                <div className="text-[32px] font-black text-[#085041]">{user.xp || 0}</div>
                <div className="text-[#08504180] text-[11px] font-bold mt-1">Level {user.level || 1}</div>
              </div>

              <div className="bg-[#FFF8EC] p-6 rounded-3xl border border-[#BA751720]">
                <div className="text-[#633806] text-[10px] font-black uppercase tracking-widest mb-1">Confidence</div>
                <div className="text-[32px] font-black text-[#633806]">{user.confidenceScore || 0}%</div>
                <div className="text-[#63380680] text-[11px] font-bold mt-1">job readiness</div>
              </div>

              <div className="bg-[#FBEAF0] p-6 rounded-3xl border border-[#D4537E20]">
                <div className="text-[#72243E] text-[10px] font-black uppercase tracking-widest mb-1">Roadmap</div>
                <div className="text-[32px] font-black text-[#72243E]">Week {Math.floor((user.confidenceScore || 0) / 12.5) + 1}</div>
                <div className="text-[#72243E80] text-[11px] font-bold mt-1">current focus</div>
              </div>
            </div>

            {/* Banner */}
            <div className="bg-gradient-to-br from-[#7F77DD] to-[#6359CC] rounded-[2.5rem] p-10 mb-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
               <div className="relative z-10">
                  <h1 className="text-4xl font-black mb-2">{streakInfo.msg}</h1>
                  <p className="text-indigo-100 font-bold text-lg opacity-90">{streakInfo.sub}</p>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
               <Zap className="absolute bottom-6 right-10 text-white/10 w-32 h-32 rotate-12" fill="currentColor" />
            </div>

            {/* Mission Cards */}
            <h2 className="text-2xl font-black text-slate-900 mb-6">Today's Missions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {missions.map((m, idx) => {
                const colors = {
                  LEARN: { bg: 'bg-[#E1F5EE]', accent: '#1D9E75', text: 'text-[#085041]' },
                  PRACTICE: { bg: 'bg-[#FFF8EC]', accent: '#BA7517', text: 'text-[#633806]' },
                  BUILD: { bg: 'bg-[#FBEAF0]', accent: '#D4537E', text: 'text-[#72243E]' },
                  learn: { bg: 'bg-[#E1F5EE]', accent: '#1D9E75', text: 'text-[#085041]' },
                  practice: { bg: 'bg-[#FFF8EC]', accent: '#BA7517', text: 'text-[#633806]' },
                  build: { bg: 'bg-[#FBEAF0]', accent: '#D4537E', text: 'text-[#72243E]' },
                  Learn: { bg: 'bg-[#E1F5EE]', accent: '#1D9E75', text: 'text-[#085041]' },
                  Practice: { bg: 'bg-[#FFF8EC]', accent: '#BA7517', text: 'text-[#633806]' },
                  Build: { bg: 'bg-[#FBEAF0]', accent: '#D4537E', text: 'text-[#72243E]' },
                };
                const styles = colors[m.type] || colors.LEARN;
                const mText = m.text || m.task || m.title || m.description;
                const today = new Date().toISOString().split('T')[0];
                const isDone = user.completedMissions?.includes(today + ':' + mText);

                return (
                  <div key={idx} className={`p-8 rounded-[2.5rem] border transition-all ${isDone ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1'}`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDone ? 'bg-slate-200 text-slate-400' : styles.bg + " " + styles.text}`}>
                        {isDone ? <CheckCircle2 size={24} /> : (
                          m.type?.toUpperCase() === 'LEARN' ? <Star size={24} fill="currentColor" /> : 
                          m.type?.toUpperCase() === 'PRACTICE' ? <Flame size={24} fill="currentColor" /> : 
                          <Zap size={24} fill="currentColor" />
                        )}
                      </div>
                    </div>

                    <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDone ? 'text-slate-400' : styles.text}`}>{m.type}</div>
                    <p className={`font-black text-lg leading-snug mb-6 ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {mText}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className={`px-3 py-1.5 rounded-full text-[11px] font-black inline-block ${isDone ? 'bg-slate-100 text-slate-400' : styles.bg + " " + styles.text}`}>
                        +{m.xp} XP
                      </div>
                      {!isDone && (
                        <button
                          onClick={() => handleStartQuiz(mText, m.xp)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#F0EDFF] text-[#7F77DD] rounded-xl font-black text-xs hover:bg-[#7F77DD] hover:text-white transition-all"
                        >
                          <Sparkles size={12} /> Take Quiz
                        </button>
                      )}
                      {isDone && (
                        <span className="text-[10px] font-black text-[#1D9E75] bg-[#E1F5EE] px-3 py-1 rounded-full">✓ Verified</span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {missions.length === 0 && (
                 <div className="col-span-full text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold mb-4">No missions active for today.</p>
                    <button onClick={handleRefresh} disabled={refreshing} className="bg-[#7F77DD] text-white px-8 py-3 rounded-full font-black text-sm shadow-lg shadow-[#7F77DD30]">
                      {refreshing ? <Spinner size={16} /> : 'Generate My Tasks'}
                    </button>
                 </div>
              )}
            </div>

            {/* Level Progress bottom */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-12">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800 font-black text-lg">Level {user.level || 1} progress</h3>
                <span className="text-slate-400 font-bold text-sm">{(user.xp || 0)} / {(user.level || 1) * 100} XP</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                 <div 
                   className="h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${(user.xp || 0) % 100}%`, backgroundColor: 'var(--accent)' }}
                />
              </div>
              <p style={{ color: 'var(--accent)' }} className="font-bold text-[13px]">
                {100 - ((user.xp || 0) % 100)} XP to Level {(user.level || 1) + 1}
              </p>
            </div>

            {/* Badges Section */}
            <h2 className="text-2xl font-black text-slate-900 mb-6">Badges</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { id: 'First Step', icon: '🏅', meta: 'Week 1 done', color: '#F0EDFF', accent: '#7F77DD' },
                { id: 'On Fire', icon: '🔥', meta: '7-day streak', color: '#FFF8EC', accent: '#BA7517' },
                { id: 'Battle Ready', icon: '🎤', meta: 'Do mock interview', color: '#E1F5EE', accent: '#1D9E75' },
                { id: 'Legend', icon: '👑', meta: '30-day streak', color: '#FBEAF0', accent: '#D4537E' }
              ].map(b => {
                 const unlocked = user.badges?.some(ub => ub.includes(b.id));
                 return (
                   <div key={b.id} className={`p-6 rounded-3xl border transition-all text-center ${unlocked ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-transparent opacity-40 grayscale'}`}>
                      <div className="text-4xl mb-3">{b.icon}</div>
                      <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">{b.id}</div>
                      <div className="text-[10px] font-bold text-slate-400">{b.meta}</div>
                   </div>
                 )
              })}
            </div>
          </>
        )}
      </main>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={quizOpen}
        onClose={handleQuizClose}
        questions={quizQuestions}
        loading={quizLoading}
        result={quizResult}
        onSubmit={handleQuizSubmit}
      />
    </div>
  );
};

export default Missions;
