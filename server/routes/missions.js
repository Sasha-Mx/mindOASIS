const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const { generateAIResponse } = require('../utils/ai');

/**
 * Daily Missions Routes
 *
 * Mission generation follows the Learn → Practice → Build pedagogy model,
 * grounded in:
 * [D1] Bloom's Taxonomy (Revised, Anderson & Krathwohl 2001)
 *      — Remember → Understand → Apply → Analyze → Evaluate → Create
 *      — Our 3-tier mission structure maps to: Understand, Apply, Create
 *
 * [D2] Spaced Repetition Research (Ebbinghaus, Pimsleur)
 *      — Skills decay without practice; daily low-friction tasks prevent attrition.
 *
 * [D3] NACE Career Readiness Competencies 2024
 *      https://www.naceweb.org/career-readiness/competencies/
 *      — "Technology" and "Critical Thinking" are 2 of 8 employer-valued competencies.
 *
 * [D4] freeCodeCamp Curriculum Structure
 *      https://www.freecodecamp.org/learn/
 *      — Industry-proven Learn-Practice-Build progression for tech skill development.
 */

// Mark a mission complete (accepts both POST and PATCH)
router.post('/complete', authMiddleware, async (req, res) => {
  try {
    const { missionText, xpReward, type } = req.body;
    const user = await User.findById(req.user._id);
    const today = new Date().toISOString().split('T')[0];
    
    const missionId = today + ':' + missionText;
    
    if (!user.completedMissions.includes(missionId)) {
      user.completedMissions.push(missionId);
      
      // Update XP and Level
      user.xp += xpReward || 10;
      user.level = Math.floor(user.xp / 100) + 1;
      
      // Update Confidence Score (Legacy support)
      user.confidenceScore = Math.min(100, user.confidenceScore + Math.floor((xpReward || 10) / 5));

      // Streak Logic
      const todayMissions = user.roadmap?.daily_missions || [];
      const completedToday = user.completedMissions.filter(m => m.startsWith(today + ':'));
      
      if (completedToday.length === todayMissions.length && todayMissions.length > 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (user.lastActiveDate === yesterdayStr) {
          user.streakDays += 1;
        } else if (user.lastActiveDate !== today) {
          user.streakDays = 1;
        }

        if (user.streakDays >= 7 && !user.badges.includes('On Fire 🔥')) {
          user.badges.push('On Fire 🔥');
        }
        
        if (user.streakDays >= 1 && !user.badges.includes('First Step 🏅')) {
          user.badges.push('First Step 🏅');
        }
      }

      user.lastActiveDate = today;
      await user.save();
    }
    
    const freshUser = await User.findById(req.user._id).select('-password');
    
    const todayMissions = user.roadmap?.daily_missions || [];
    const completedToday = freshUser.completedMissions.filter(m => m.startsWith(new Date().toISOString().split('T')[0] + ':'));
    const dailyCompleted = completedToday.length >= todayMissions.length && todayMissions.length > 0;
    
    res.json({ 
      user: freshUser,
      dailyCompleted,
      xp: freshUser.xp, 
      level: freshUser.level, 
      streakDays: freshUser.streakDays,
      badges: freshUser.badges,
      completedMissions: freshUser.completedMissions 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refresh missions via AI
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const week = user.roadmap?.roadmap?.[0]?.week || 1;
    const role = user.profile?.role || "Software Developer";
    const mode = user.profile?.mode || "Placement";
    const year = user.profile?.year || "3rd Year";
    const hours = user.profile?.hours || "2-4 hours";
    const skills = user.profile?.skills || [];

    // Compute experience tier from skill levels
    const levelScore = { beginner: 1, intermediate: 2, advanced: 3 };
    const levels = skills.map(s => levelScore[s.level?.toLowerCase()] || 1);
    const avgLevel = levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 1;
    const expTier = avgLevel >= 2.5 ? 'Advanced' : avgLevel >= 1.5 ? 'Intermediate' : 'Beginner';

    // Build skill context with levels and known topics
    const skillProfile = skills.map(s => {
      const lvl = levelScore[s.level?.toLowerCase()] || 1;
      const tier = lvl >= 3 ? 'Advanced' : lvl >= 2 ? 'Intermediate' : 'Beginner';
      return `  - ${s.name} (${tier})${s.knownTopics ? `: knows ${s.knownTopics}` : ''}`;
    }).join('\n');

    // Identify weak areas to focus missions on
    const weakSkills = skills.filter(s => levelScore[s.level?.toLowerCase()] <= 1).map(s => s.name);
    const mediumSkills = skills.filter(s => levelScore[s.level?.toLowerCase()] === 2).map(s => s.name);

    const prompt = `You are a JSON API. You must respond with valid JSON only. No text before or after. No markdown.

MISSION DESIGN FRAMEWORK:
You generate daily learning missions based on established pedagogy:
- Bloom's Taxonomy (Revised): Missions progress from Understanding → Application → Creation
- Spaced Repetition: Tasks reinforce previously learned skills alongside new ones
- freeCodeCamp model: Learn (theory) → Practice (exercises) → Build (real projects)
- NACE 2024: Focus on employer-valued technical competencies

═══════════════════════════════════════
STUDENT PROFILE (PERSONALIZE ALL MISSIONS TO THIS)
═══════════════════════════════════════
- Role: ${role}
- Mode: ${mode} (${mode === 'Internship' ? 'focus on fundamentals' : 'focus on interview readiness'})
- Academic Year: ${year}
- Daily Time Available: ${hours}
- Experience Tier: ${expTier} (avg skill level: ${avgLevel.toFixed(1)}/3)
- Current Roadmap Week: ${week}
- Weak Areas (prioritize these): [${weakSkills.join(', ') || 'None identified'}]
- Medium Areas (polish these): [${mediumSkills.join(', ') || 'None identified'}]

DETAILED SKILLS:
${skillProfile || '  No skills recorded — generate foundational tasks.'}

═══════════════════════════════════════
DIFFICULTY CALIBRATION (MANDATORY)
═══════════════════════════════════════
${expTier === 'Beginner' ? `
BEGINNER TIER: Generate ACCESSIBLE tasks with step-by-step guidance.
- Learn: "Read about [specific concept] in [official docs link]" — pick topics from their WEAK areas.
- Practice: "Solve [Easy] problem on LeetCode/HackerRank" — concept-check level.
- Build: "Add [simple feature] to a practice project" — e.g., "Create a counter app with React useState".
DO NOT assign advanced topics like System Design, Docker, or microservices.` : expTier === 'Intermediate' ? `
INTERMEDIATE TIER: Generate APPLIED tasks that push beyond tutorials.
- Learn: "Study [intermediate concept] in [official docs]" — focus on WHY, not just HOW.
- Practice: "Solve [Medium] problem on LeetCode" — test pattern recognition.
- Build: "Implement [production feature]" — e.g., "Add JWT auth with refresh tokens to your API".
Skip basic concepts they already know (see knownTopics above).` : `
ADVANCED TIER: Generate CHALLENGING tasks focused on edge cases and optimization.
- Learn: "Deep-dive into [advanced topic] internals" — e.g., "Read React Fiber reconciliation source".
- Practice: "Solve [Hard] problem on LeetCode" — expect optimization discussion.
- Build: "Implement [production-grade feature]" — e.g., "Add rate limiting with Redis + sliding window".
Skip ALL fundamentals. Focus on system-level thinking.`}

Generate 3 entirely fresh daily missions for today:

1. "Learn" task — Concept understanding (Bloom's Level 2: Understand) — XP: 10
2. "Practice" task — Hands-on coding exercise (Bloom's Level 3: Apply) — XP: 20
3. "Build" task — Real project feature (Bloom's Level 6: Create) — XP: 30

Return ONLY a valid JSON object:
{
  "tasks": [
    { "type": "Learn", "text": "...", "xp": 10 },
    { "type": "Practice", "text": "...", "xp": 20 },
    { "type": "Build", "text": "...", "xp": 30 }
  ]
}
IMPORTANT: Return ONLY the JSON object. Start your response with { directly.`;

    const result = await generateAIResponse(prompt);
    const missions = result.tasks;
    
    if (!user.roadmap) user.roadmap = {};
    user.roadmap.daily_missions = missions;
    
    // Mongoose needs marking modified for mixed types
    user.markModified('roadmap');
    await user.save();
    
    res.json({ daily_missions: missions });
  } catch (err) {
    console.error("FULL ERROR:", err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
