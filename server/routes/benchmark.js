const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const benchmarkData = require('../data/benchmarkData');
const { generateAIResponse } = require('../utils/ai');

function calcPercentile(userSkills, benchmark) {
  let totalScore = 0;
  let numSkills = 0;

  for (const skill of Object.keys(benchmark)) {
    const b = benchmark[skill];
    const u = userSkills[skill] || 0;
    
    // Avoid division by zero if avg or top is 0
    const avgScore = b.avg > 0 ? (Math.min(u, b.avg) / b.avg) * 50 : (u > 0 ? 50 : 0);
    const topScore = b.top > 0 ? (Math.min(u, b.top) / b.top) * 50 : (u > 0 ? 50 : 0);
    
    let score = avgScore + topScore;

    if (score > 100) score = 100;

    totalScore += score;
    numSkills += 1;
  }

  return numSkills > 0 ? Math.round(totalScore / numSkills) : 0;
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { userSkills, targetCohort } = req.body;
    
    const cohortKey = targetCohort || 'placement_product';
    const benchmark = benchmarkData[cohortKey];

    if (!benchmark) {
      return res.status(400).json({ error: 'Invalid cohort specified' });
    }

    const percentile = calcPercentile(userSkills, benchmark);
    const readiness = percentile; // As requested, keep it simple for hackathon

    // Gap Analysis
    const critical_gaps = [];
    const strong_areas = [];
    
    // Create an array to sort weakest skills first
    const skillList = [];

    for (const skill of Object.keys(benchmark)) {
      const u = userSkills[skill] || 0;
      const b = benchmark[skill];
      
      skillList.push({ skill, userLevel: u, avgLevel: b.avg, topLevel: b.top, gap: b.avg - u });

      if (u < b.avg) {
        critical_gaps.push(skill);
      } else {
        strong_areas.push(skill);
      }
    }

    const improvement_priority = skillList
      .filter(s => s.gap > 0)
      .sort((a, b) => b.gap - a.gap)
      .map(s => s.skill);

    // Save benchmark to user profile
    const user = await User.findById(req.user._id);
    if (user) {
      user.benchmark = {
        percentile,
        readiness,
        cohort: cohortKey,
        lastUpdated: new Date()
      };
      await user.save();
    }

    // AI Explanation (async to not block immediate calculation response, but since it's an API, we await it)
    const prompt = `You are a career guidance API. Output valid JSON only. No markdown. No thinking tags.
    
User Skills: ${JSON.stringify(userSkills)}
Target Cohort: ${cohortKey}
Percentile Rank: ${percentile}%
Critical Gaps: ${critical_gaps.join(', ')}
Strong Areas: ${strong_areas.join(', ')}

Explain realistically where the user stands compared to peers in this cohort.
Explain what the top 20% of students in this cohort typically have.
Provide 2-3 actionable, concrete improvement steps based on their weakest skill (${improvement_priority[0] || 'projects'}).

Format:
{
  "peer_comparison": "string explaining where they stand vs peers",
  "top_20_insight": "string explaining what top 20% students have",
  "actionable_improvements": ["string", "string", "string"]
}
Keep it realistic. No fake stats. No generic advice. Direct and actionable. Start with { immediately.`;

    const ai_explanation = await generateAIResponse(prompt);

    res.json({
      percentile,
      readiness,
      gaps: {
        critical: critical_gaps,
        strong: strong_areas,
        priority: improvement_priority
      },
      ai_explanation
    });

  } catch (err) {
    console.error("Benchmark Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET route to fetch user's last benchmark and their raw skills if needed
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ benchmark: user.benchmark || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
