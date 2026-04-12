const router = require('express').Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { generateAIResponse } = require('../utils/ai');
const RoadmapEngine = require('../utils/RoadmapEngine');

// Helper moved to RoadmapEngine or cleaned up if unused
function matchSkill(userSkills, requiredSkill) {
  return userSkills.find(us =>
    us.name.toLowerCase().includes(requiredSkill.toLowerCase()) ||
    requiredSkill.toLowerCase().includes(us.name.toLowerCase())
  );
}

// ─── Generate Roadmap ───────────────────────────────────────────
router.post('/generate', authMiddleware, async (req, res) => {
  console.log("=> /generate hit (Upgraded Engine)");
  try {
    const { answers } = req.body;
    const role = answers.targetRole || answers.role || "SDE";
    const mode = answers.mode || 'Placement';
    const year = answers.year || "3rd Year";
    const months = answers.months || 6;
    const hours = answers.hours || '3-4 hours';
    const skills = answers.skills || [];

    // 1. Calculate gaps and insights using the new engine
    const gaps = RoadmapEngine.calculateSkillGaps(skills, role);
    const insight = RoadmapEngine.generateIntelligentInsight(gaps, skills, mode);
    
    // 2. Generate Roadmap via AI
    const roadmapPrompt = RoadmapEngine.buildRoadmapPrompt({
      role, skills, mode, months, hours, year, gaps, insight
    });

    console.log(`=> Sending optimized prompt to AI`);
    let aiResponse;
    try {
      aiResponse = await generateAIResponse(roadmapPrompt);
    } catch (aiError) {
      console.error(`GENERATION ERROR:`, aiError.message);
      return res.status(503).json({ 
        message: "AI Generation service is currently unavailable. Please try again in a moment.",
        details: aiError.message 
      });
    }

    // 3. Structure the final response
    const finalResult = {
      ...aiResponse,
      readiness_insight: aiResponse.readiness_insight || insight, // Fallback if AI skips it
      gapReport: {
        ...RoadmapEngine.calculateCategorizedGaps(skills, role),
        readinessScore: aiResponse.confidence_score || 0,
        insight: aiResponse.readiness_insight || insight
      }
    };

    res.json(finalResult);

  } catch (err) {
    console.error("GENERATION ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Save onboarding answers + AI roadmap ───────────────────────
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { profile, roadmap } = req.body;
    
    // Always compute categorized gaps & readiness server-side
    const role = profile?.role || profile?.targetRole || "Software Developer";
    const skills = profile?.skills || [];
    
    const categorizedGaps = RoadmapEngine.calculateCategorizedGaps(skills, role);
    const readiness = RoadmapEngine.calculateDataDrivenReadiness(
      skills,
      [], // No quiz history for new users
      [], // No interview history for new users
      0   // No roadmap progress yet
    );
    
    // Build a complete gapReport the Dashboard can render
    const gapReport = {
      ...categorizedGaps,
      readinessScore: readiness.readinessScore,
      insight: readiness.insight,
      currentSalary: "4LPA",
      targetSalary: "12LPA"
    };
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profile: { ...profile, targetRole: role },
        roadmap,
        gapReport,
        confidenceScore: readiness.readinessScore,
        onboardingDone: true,
      },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    console.error('Save error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── Get current user profile ───────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
