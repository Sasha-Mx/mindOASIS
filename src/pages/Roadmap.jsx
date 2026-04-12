import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import RoadmapCard from '../components/RoadmapCard';
import QuizModal from '../components/QuizModal';
import { motion } from 'framer-motion';
import { Award, Star, Flame, Trophy, Map } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import GoalTracker from '../components/GoalTracker';
import api from '../services/api';

const Roadmap = () => {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizContext, setQuizContext] = useState({ weekIndex: 0, taskIndex: 0, taskText: '', weekFocus: '' });

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  const roadmap = user?.roadmap;
  const confidenceScore = user?.confidenceScore || 0;
  
  // A week is done ONLY if all its tasks are explicitly checked
  const isWeekDone = (week) => week?.tasks && week.tasks.length > 0 && week.tasks.every(t => t.completed === true);
  
  // Calculate completed weeks
  const roadmapArray = Array.isArray(roadmap) ? roadmap : (roadmap?.roadmap || []);
  const completedWeeksCount = Array.isArray(roadmapArray) ? roadmapArray.filter(isWeekDone).length : 0;
  const progressPercent = roadmapArray?.length ? (completedWeeksCount / roadmapArray.length) * 100 : 0;


  // Start quiz for a task
  const handleQuizStart = async (weekIndex, taskIndex, taskText, weekFocus) => {
    setQuizContext({ weekIndex, taskIndex, taskText, weekFocus });
    setQuizQuestions(null);
    setQuizResult(null);
    setQuizOpen(true);
    setQuizLoading(true);

    try {
      const res = await api.post('/quiz/generate', { weekFocus, taskText });
      setQuizQuestions(res.data.questions);
    } catch (err) {
      console.error('Quiz generation failed:', err);
      alert('Failed to generate quiz. Please try again.');
      setQuizOpen(false);
    } finally {
      setQuizLoading(false);
    }
  };

  // Submit quiz answers
  const handleQuizSubmit = async (answers) => {
    setQuizLoading(true);
    try {
      const res = await api.post('/quiz/verify', {
        weekIndex: quizContext.weekIndex,
        taskIndex: quizContext.taskIndex,
        answers,
        questions: quizQuestions
      });
      setQuizResult(res.data);
      
      // Update user if quiz passed
      if (res.data.passed && res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error('Quiz verification failed:', err);
      alert('Quiz verification failed. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizClose = () => {
    setQuizOpen(false);
    setQuizQuestions(null);
    setQuizResult(null);
  };

  return (
    <div className="flex min-h-screen bg-white font-dm-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-[#7F77DD] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-400 font-medium">Loading your journey...</p>
          </div>
        ) : (!roadmapArray || roadmapArray.length === 0) ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 mx-auto">
                <Map size={32} className="text-slate-300" />
             </div>
             <h2 className="text-xl font-bold text-slate-800 mb-2">Roadmap Not Ready Yet</h2>
             <p className="text-slate-500 max-w-sm mb-8 leading-relaxed text-sm">
                We're missing your data. Please complete the onboarding or refresh your profile to generate your AI journey.
             </p>
             <button onClick={() => window.location.href='/onboarding'} className="px-8 py-3 bg-[#7F77DD] text-white rounded-2xl font-black shadow-lg shadow-purple-900/10 active:scale-95 transition-all">
                Generate Roadmap →
             </button>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
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
                <div className="text-[32px] font-black text-[#633806]">{confidenceScore}%</div>
                <div className="text-[#63380680] text-[11px] font-bold mt-1">job readiness</div>
              </div>

              <div className="bg-[#FBEAF0] p-6 rounded-3xl border border-[#D4537E20]">
                <div className="text-[#72243E] text-[10px] font-black uppercase tracking-widest mb-1">Roadmap</div>
                <div className="text-[32px] font-black text-[#72243E]">{completedWeeksCount}/{roadmapArray?.length || 0}</div>
                <div className="text-[#72243E80] text-[11px] font-bold mt-1">weeks done</div>
              </div>

            </div>

            <div className="mb-12">
              <h1 className="text-3xl font-black text-slate-900 mb-1">Your Roadmap</h1>
              <p className="text-slate-500 font-medium mb-8">{user.profile?.role || 'Developer'} — 8 week plan</p>
              
              <div className="flex items-center justify-between mb-3 text-xs font-black uppercase text-slate-400">
                <span>Overall progress</span>
                <span className="text-[#7F77DD]">{completedWeeksCount} of {roadmap.roadmap.length} weeks</span>
              </div>
              <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-[#7F77DD] rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <div className="relative">
                  {roadmapArray.map((week, idx) => {
                    const num = week.week || idx + 1;
                    const isCompleted = isWeekDone(week);
                    const isCurrent = !isCompleted && (idx === 0 || isWeekDone(roadmapArray[idx - 1]));
                    const isUnlocked = isCompleted || isCurrent || (idx > 0 && isWeekDone(roadmapArray[idx - 1]));
                    
                    return (
                      <RoadmapCard 
                        key={idx}
                        week={num}
                        focus={week.focus}
                        tasks={week.tasks}
                        resources={week.resources}
                        project={week.project}
                        isUnlocked={isUnlocked}
                        isCurrent={isCurrent}
                        isCompleted={isCompleted}
                        onQuizStart={(taskIndex, taskText) => handleQuizStart(idx, taskIndex, taskText, week.focus)}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="space-y-8">
                <GoalTracker initialGoals={user?.goals || []} onUpdate={() => {}} />
              </div>
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

export default Roadmap;
