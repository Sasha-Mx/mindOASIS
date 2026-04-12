import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, Trophy, RotateCcw, Loader2, Sparkles } from 'lucide-react';

const QuizModal = ({ isOpen, onClose, questions, onSubmit, loading, result }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState(Array(5).fill(-1));
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (optionIdx) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit(answers);
  };

  const allAnswered = answers.every(a => a !== -1);

  // Loading state
  if (loading && !questions) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-2xl"
        >
          <Loader2 className="w-12 h-12 text-[#7F77DD] animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-800 mb-2">Generating Quiz...</h3>
          <p className="text-slate-400 font-medium">AI is creating 5 questions to verify your learning</p>
        </motion.div>
      </div>
    );
  }

  if (!questions) return null;

  // Result state
  if (result) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl my-8"
        >
          {/* Header */}
          <div className={`p-8 rounded-t-3xl text-center ${result.passed ? 'bg-gradient-to-br from-[#1D9E75] to-[#0E7A5A]' : 'bg-gradient-to-br from-[#D4537E] to-[#B03062]'} text-white`}>
            {result.passed ? (
              <>
                <Trophy className="w-16 h-16 mx-auto mb-3" />
                <h2 className="text-3xl font-black mb-1">
                  {result.isPerfect ? '🎯 Perfect Score!' : '✅ Quiz Passed!'}
                </h2>
                <p className="text-white/80 font-bold text-lg">{result.score}/5 correct • +{result.totalXP} XP earned</p>
                {result.bonusXP > 0 && <p className="text-yellow-200 font-black text-sm mt-1">🌟 +{result.bonusXP} Bonus XP for perfect score!</p>}
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 mx-auto mb-3" />
                <h2 className="text-3xl font-black mb-1">Not Quite!</h2>
                <p className="text-white/80 font-bold text-lg">{result.score}/5 correct • Need 3/5 to pass</p>
              </>
            )}
          </div>

          {/* Answer Review */}
          <div className="p-6 max-h-[50vh] overflow-y-auto">
            {result.results.map((r, i) => (
              <div key={i} className={`p-4 rounded-2xl mb-3 border ${r.isCorrect ? 'bg-[#E1F5EE] border-[#1D9E7530]' : 'bg-[#FFF0F0] border-[#D4537E30]'}`}>
                <div className="flex items-start gap-3">
                  {r.isCorrect ? <CheckCircle2 className="text-[#1D9E75] shrink-0 mt-0.5" size={20} /> : <XCircle className="text-[#D4537E] shrink-0 mt-0.5" size={20} />}
                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-1">Q{i + 1}: {r.question}</p>
                    {!r.isCorrect && <p className="text-[#D4537E] text-xs font-bold">Your answer: {r.yourAnswer}</p>}
                    <p className="text-[#1D9E75] text-xs font-bold">Correct: {r.correctAnswer}</p>
                    <p className="text-slate-500 text-xs mt-1 italic">{r.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action */}
          <div className="p-6 pt-0">
            {result.passed ? (
              <button onClick={onClose} className="w-full py-4 bg-gradient-to-br from-[#7F77DD] to-[#6359CC] text-white rounded-2xl font-black text-lg shadow-lg shadow-[#7F77DD30] hover:brightness-110 transition-all">
                Continue Learning →
              </button>
            ) : (
              <button onClick={() => { setSubmitted(false); setAnswers(Array(5).fill(-1)); setCurrentQ(0); onClose(); }} className="w-full py-4 bg-gradient-to-br from-[#D4537E] to-[#B03062] text-white rounded-2xl font-black text-lg shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <RotateCcw size={20} /> Review & Try Again
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Quiz state
  const q = questions[currentQ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#7F77DD] to-[#6359CC] p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} />
              <span className="text-white/70 text-xs font-black uppercase tracking-widest">Verification Quiz</span>
            </div>
            <h3 className="text-xl font-black">Question {currentQ + 1} of 5</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-[#F0EDFF]">
          <div className="h-full bg-[#7F77DD] transition-all duration-300" style={{ width: `${((currentQ + 1) / 5) * 100}%` }} />
        </div>

        {/* Question */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <p className="text-lg font-bold text-slate-800 mb-6 leading-snug">{q.question}</p>

              <div className="space-y-3">
                {q.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-medium text-sm ${
                      answers[currentQ] === idx
                        ? 'border-[#7F77DD] bg-[#F0EDFF] text-[#3C3489] scale-[1.02] shadow-md'
                        : 'border-slate-100 bg-white text-slate-600 hover:border-[#7F77DD40] hover:bg-[#F9F8FF]'
                    }`}
                  >
                    <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-xs font-black mr-3 ${
                      answers[currentQ] === idx ? 'bg-[#7F77DD] text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8 flex justify-between items-center">
          <button
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            className="px-6 py-3 rounded-2xl font-black text-sm text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
          >
            ← Previous
          </button>

          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <button key={i} onClick={() => setCurrentQ(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentQ ? 'bg-[#7F77DD] scale-125' : answers[i] !== -1 ? 'bg-[#1D9E75]' : 'bg-slate-200'
              }`} />
            ))}
          </div>

          {currentQ < 4 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              disabled={answers[currentQ] === -1}
              className="px-6 py-3 rounded-2xl font-black text-sm bg-[#F0EDFF] text-[#7F77DD] hover:bg-[#7F77DD] hover:text-white disabled:opacity-30 transition-all"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || loading}
              className="px-6 py-3 rounded-2xl font-black text-sm bg-gradient-to-br from-[#7F77DD] to-[#6359CC] text-white shadow-lg shadow-[#7F77DD30] hover:brightness-110 disabled:opacity-30 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Submit Quiz
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default QuizModal;
