const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const { generateAIResponse } = require('../utils/ai');
const RoadmapEngine = require('../utils/RoadmapEngine');

// Generate a Personalized Quiz
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const role = user.profile?.role || 'Software Developer';
    const mode = user.profile?.mode || 'Placement';
    const skills = user.profile?.skills || [];

    const prompt = RoadmapEngine.buildPersonalizedQuizPrompt({
      role, mode, skills
    });

    const result = await generateAIResponse(prompt);
    
    if (!result.questions || result.questions.length === 0) {
      return res.status(500).json({ error: 'Quiz generation failed' });
    }

    res.json(result);
  } catch (err) {
    console.error('Quiz generate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Verify quiz answers and award XP + Update quizHistory
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { answers, questions, topic, weekIndex, taskIndex } = req.body;
    
    // Calculate score
    let correct = 0;
    const results = questions.map((q, i) => {
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

    const score = correct;
    const total = questions.length;
    const passed = score >= Math.ceil(total * 0.6);
    
    const user = await User.findById(req.user._id);

    // Update quizHistory for readiness tracking
    user.quizHistory.unshift({
      topic: topic || "General",
      score,
      total,
      date: new Date()
    });
    // Keep last 20
    user.quizHistory = user.quizHistory.slice(0, 20);

    // Gamification & Roadmap Progress Sync
    if (passed) {
      user.xp = (user.xp || 0) + (score * 10);
      user.level = Math.floor(user.xp / 100) + 1;
      
      // 1. Mark roadmap task complete
      if (weekIndex !== undefined && taskIndex !== undefined && user.roadmap?.roadmap) {
        if (user.roadmap.roadmap[weekIndex] && user.roadmap.roadmap[weekIndex].tasks) {
          user.roadmap.roadmap[weekIndex].tasks[taskIndex].completed = true;
          user.markModified('roadmap'); // Essential to save mixed objects in Mongoose
        }
      }

      // 2. Calculate newly completed weeks
      let completedWeeksCount = 0;
      if (user.roadmap?.roadmap) {
        completedWeeksCount = user.roadmap.roadmap.filter(w => w.tasks && w.tasks.length > 0 && w.tasks.every(t => t.completed)).length;
      }
      const progressPercent = user.roadmap?.roadmap?.length ? (completedWeeksCount / user.roadmap.roadmap.length) * 100 : 0;

      // 3. Sync Skill Analyzer Gap Report dynamically
      const skills = user.profile?.skills || [];
      const readiness = RoadmapEngine.calculateDataDrivenReadiness(
        skills,
        user.quizHistory || [],
        user.interviewHistory || [],
        progressPercent
      );

      if (!user.gapReport) user.gapReport = {};
      user.gapReport.readinessScore = readiness.readinessScore;
      user.markModified('gapReport');
      user.confidenceScore = readiness.readinessScore;
    }

    await user.save();
    
    // Fetch fresh user object without password to return to frontend context
    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      passed,
      score,
      total,
      results,
      user: updatedUser
    });
  } catch (err) {
    console.error('Quiz verify error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
