const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const { generateAIResponse } = require('../utils/ai');
const RoadmapEngine = require('../utils/RoadmapEngine');

// 1. Data-Driven Readiness Check
router.get('/readiness', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const role = user.profile?.role || "Software Developer";
    const skills = user.profile?.skills || [];
    const quizHistory = user.quizHistory || [];
    const interviewHistory = user.interviewHistory || [];
    const progress = user.roadmapProgress || 0;
    
    const readiness = RoadmapEngine.calculateDataDrivenReadiness(
      skills, quizHistory, interviewHistory, progress
    );
    res.json(readiness);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Start Master Interview (Multi-mode/Multi-type)
router.post('/start', auth, async (req, res) => {
  try {
    const { interviewType, mode } = req.body; 
    const user = await User.findById(req.user._id);
    const role = user.profile?.role || "Software Developer";
    const skills = user.profile?.skills || [];
    
    const gaps = RoadmapEngine.calculateSkillGaps(skills, role);
    
    const prompt = RoadmapEngine.buildInterviewPrompt({
      role, interviewType, mode, skills, gaps
    });

    const result = await generateAIResponse(prompt);
    res.json({
      ...result,
      mode,
      interviewType
    });
  } catch (err) {
    console.error('Interview start error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// 3. Evaluate Single Answer
router.post('/evaluate', auth, async (req, res) => {
  try {
    const { question, answer } = req.body;
    const user = await User.findById(req.user._id);
    const role = user.profile?.role || "Software Developer";

    const prompt = RoadmapEngine.buildEvaluationPrompt(question, answer, role);
    const result = await generateAIResponse(prompt);
    
    res.json(result);
  } catch (err) {
    console.error('Evaluation error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// 4. Save interview session result
router.post('/save', auth, async (req, res) => {
  try {
    const { interviewType, mode, overallScore, questionBreakdown } = req.body;
    const user = await User.findById(req.user._id);
    
    const session = {
      date: new Date().toISOString(),
      type: interviewType,
      mode: mode,
      score: overallScore,
      breakdown: questionBreakdown 
    };

    if (!user.interviewHistory) user.interviewHistory = [];
    user.interviewHistory.unshift(session);
    
    const scaledScore = parseInt(overallScore) || 0;
    user.confidenceScore = Math.round((user.confidenceScore * 0.8) + (scaledScore * 0.2));
    
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
