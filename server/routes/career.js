const express = require('express');
const router = express.Router();
const { generateAIResponse } = require('../utils/ai');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const RoadmapEngine = require('../utils/RoadmapEngine');

/**
 * Career Routes — Onboarding, Interviews, Gap Analysis
 *
 * Interview generation is grounded in:
 * [C1] HackerRank Developer Skills Report 2024 — Interview question patterns, pass rates
 * [C2] Cracking the Coding Interview, 6th Ed. (Gayle Laakmann McDowell) — FAANG interview framework
 * [C3] LinkedIn Talent Solutions 2024 — Recruiter behavior and interview structure data
 * [C4] NACE Job Outlook 2024 — Campus interview patterns, STAR method adoption
 * [C5] System Design Primer (Donne Martin, 250K+ GitHub stars) — System design interview framework
 */

// Onboarding: Analyze Skills & Save Profile
router.post('/onboard', authMiddleware, async (req, res) => {
  try {
    const { profile } = req.body;
    
    // Use the standardized RoadmapEngine to build a robust prompt
    const prompt = RoadmapEngine.buildRoadmapPrompt({
      role: profile.targetRole || "Software Developer",
      skills: profile.skills || [],
      mode: profile.mode || "Placement",
      months: profile.months || 6,
      hours: profile.hours || "3-4 hours",
      year: profile.year || "3rd Year"
    });

    const result = await generateAIResponse(prompt);
    
    // Calculate precise data-driven readiness and categorized gaps for the dashboard
    const gaps = RoadmapEngine.calculateCategorizedGaps(profile.skills || [], profile.targetRole || "Software Developer");
    const readiness = RoadmapEngine.calculateDataDrivenReadiness(
      profile.skills || [], 
      [], // No quiz history yet
      [], // No interview history yet
      0   // No roadmap progress yet
    );

    // Save to user
    const user = await User.findByIdAndUpdate(req.user._id, {
      profile: profile,
      roadmap: result,
      gapReport: {
        ...gaps,
        readinessScore: readiness.readinessScore,
        insight: readiness.insight,
        currentSalary: "4LPA",
        targetSalary: "12LPA"
      },
      confidenceScore: readiness.readinessScore,
      onboardingDone: true
    }, { new: true }).select('-password');

    res.json({ user, result });

  } catch (error) {
    console.error("FULL ERROR:", error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Update Confidence Score
router.post('/update-score', authMiddleware, async (req, res) => {
  try {
    const { points } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      { $inc: { confidenceScore: points } }, 
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update score' });
  }
});

// Regenerate Gap Report for existing users who have old format
router.get('/regenerate-gaps', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.profile) return res.status(400).json({ error: 'No profile found' });
    
    const role = user.profile.targetRole || user.profile.role || "Software Developer";
    const skills = user.profile.skills || [];
    
    const gaps = RoadmapEngine.calculateCategorizedGaps(skills, role);
    const readiness = RoadmapEngine.calculateDataDrivenReadiness(
      skills,
      user.quizHistory || [],
      user.interviewHistory || [],
      user.roadmapProgress || 0
    );
    
    const gapReport = {
      ...gaps,
      readinessScore: readiness.readinessScore,
      insight: readiness.insight,
      currentSalary: "4LPA",
      targetSalary: "12LPA"
    };
    
    user.gapReport = gapReport;
    user.confidenceScore = readiness.readinessScore;
    await user.save();
    
    res.json({ success: true, gapReport, user });
  } catch (error) {
    console.error('Regenerate gaps error:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// Mock Interview: Get a set of 5 questions
router.post('/mock-interview/questions-set', authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;
    const user = await User.findById(req.user._id);
    const role = user.profile?.targetRole || user.profile?.role || "Software Developer";
    const mode = user.profile?.mode || "Placement";
    const year = user.profile?.year || "3rd Year";
    const skills = user.profile?.skills || [];
    const gaps = user.roadmap?.skill_gap?.map(g => g.skill).join(', ') || "No specific gaps";

    // Compute experience tier
    const lvlScore = { beginner: 1, intermediate: 2, advanced: 3 };
    const levels = skills.map(s => lvlScore[s.level?.toLowerCase()] || 1);
    const avgLevel = levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 1;
    const expTier = avgLevel >= 2.5 ? 'Advanced' : avgLevel >= 1.5 ? 'Intermediate' : 'Beginner';

    // Build skill context
    const weakSkills = skills.filter(s => lvlScore[s.level?.toLowerCase()] <= 1).map(s => s.name);
    const strongSkills = skills.filter(s => lvlScore[s.level?.toLowerCase()] >= 3).map(s => s.name);
    const skillProfile = skills.map(s => {
      const lvl = lvlScore[s.level?.toLowerCase()] || 1;
      const tier = lvl >= 3 ? 'Advanced' : lvl >= 2 ? 'Intermediate' : 'Beginner';
      return `  - ${s.name} (${tier})${s.knownTopics ? `: knows ${s.knownTopics}` : ''}`;
    }).join('\n');
    
    const prompt = `You are a JSON API. You must respond with valid JSON only. No text before or after. No markdown.

YOUR INTERVIEW DATA SOURCES:
- HackerRank 2024: 72% of tech interviews include at least one coding problem [C1]
- Cracking the Coding Interview: FAANG-style question patterns and difficulty tiers [C2]
- LinkedIn Talent: Average technical interview has 4-5 questions across 45-60 min [C3]
- NACE 2024: 67% of campus interviews use structured behavioral questions [C4]
- System Design Primer: Scalability and architecture patterns tested at L4+ [C5]

═══════════════════════════════════════
CANDIDATE PROFILE (PERSONALIZE ALL QUESTIONS TO THIS)
═══════════════════════════════════════
- Role: ${role}
- Mode: ${mode}
- Academic Year: ${year}
- Experience Tier: ${expTier} (avg skill: ${avgLevel.toFixed(1)}/3)
- Weak Areas: [${weakSkills.join(', ') || 'None'}]
- Strong Areas: [${strongSkills.join(', ') || 'None'}]
- Known Gaps: ${gaps}

DETAILED SKILLS:
${skillProfile || '  No skills recorded.'}

═══════════════════════════════════════
DIFFICULTY CALIBRATION (MANDATORY)
═══════════════════════════════════════
${expTier === 'Beginner' ? `
BEGINNER: Ask foundational questions. Focus on concept understanding.
- 3 Easy + 2 Medium difficulty questions.
- NO system design or advanced architecture questions.
- Focus on: basic coding, simple data structures, and tool usage.
- Example: "What is the difference between let and const in JavaScript?"` : expTier === 'Intermediate' ? `
INTERMEDIATE: Ask applied questions. Test beyond tutorials.
- 2 Medium + 3 Hard difficulty questions.
- Include 1 system design question at basic level (e.g., "Design a todo list API").
- Focus on: patterns, edge cases, optimization, and real-world scenarios.
- Example: "How would you implement pagination in a REST API with cursor-based navigation?"` : `
ADVANCED: Ask expert-level questions. Test depth and trade-offs.
- 1 Medium + 3 Hard + 1 Expert difficulty questions.
- Include 1 full system design + 1 optimization question.
- Focus on: internals, architecture trade-offs, scalability, and production edge cases.
- Example: "Design a real-time notification system that handles 1M concurrent connections."`}

Generate exactly 5 interview questions for a ${role} role ${type ? `specializing in ${type}` : ''}.

QUESTION QUALITY RULES:
1. Questions MUST match the difficulty calibration above.
2. Skip topics the candidate already knows well (see knownTopics) — test the NEXT level.
3. Each question must have 3 expected key points that a strong answer would cover.
4. Questions should be specific — never "Tell me about [topic]".

Return ONLY a valid JSON object:
{
  "questions": [
    { "id": 1, "text": "...", "context": "...", "expected_points": ["", "", ""] },
    { "id": 2, "text": "...", "context": "...", "expected_points": ["", "", ""] },
    { "id": 3, "text": "...", "context": "...", "expected_points": ["", "", ""] },
    { "id": 4, "text": "...", "context": "...", "expected_points": ["", "", ""] },
    { "id": 5, "text": "...", "context": "...", "expected_points": ["", "", ""] }
  ]
}
IMPORTANT: Return ONLY the JSON object. Start your response with { directly.
    `;
    const result = await generateAIResponse(prompt);
    res.json(result);
  } catch (error) {
    console.error("FULL ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mock Interview: Evaluate single answer
router.post('/mock-interview/evaluate', authMiddleware, async (req, res) => {
  try {
    const { question, answer, type } = req.body;
    const user = await User.findById(req.user._id);
    const role = user.profile?.targetRole || "Software Developer";

    const prompt = `You are a strict technical interviewer for a ${role} role. 

EVALUATION FRAMEWORK:
- Use the rubric from "Cracking the Coding Interview" by Gayle Laakmann McDowell [C2]:
  * Problem-solving approach (did they clarify, plan, then code?)
  * Code correctness (does the solution handle edge cases?)
  * Optimization awareness (time/space complexity discussed?)
  * Communication (did they explain their thought process?)
- Score against HackerRank percentile benchmarks [C1]:
  * 8-10: Top 10% of candidates (Strong Hire)
  * 6-7: Top 30% (Hire with reservations)
  * 4-5: Average (Lean No Hire)
  * 0-3: Below average (No Hire)

Evaluate the candidate's response to this ${type || ''} question.
Question: ${question}
Answer: ${answer}

Return ONLY a valid JSON object:
{
  "score": 0-10 (integer),
  "feedback": "concise feedback grounded in the evaluation framework",
  "improvement": "one specific, actionable tip to improve this exact answer",
  "isStrong": boolean
}
IMPORTANT: Return ONLY the JSON object. Start your response with { directly.
    `;
    const result = await generateAIResponse(prompt);
    res.json(result);
  } catch (error) {
    console.error("FULL ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mock Interview: Save session
router.post('/mock-interview/session-save', authMiddleware, async (req, res) => {
  try {
    const { type, score, questionBreakdown } = req.body;
    const user = await User.findById(req.user._id);
    
    const interviewResult = {
      date: new Date().toISOString(),
      type,
      score,
      questionBreakdown
    };

    if (!user.interviewHistory) user.interviewHistory = [];
    user.interviewHistory.unshift(interviewResult);
    
    // Update confidence score: existing * 0.7 + interview score * 3 (scaled to 100) * 0.3
    const scaledSessionScore = score * 10;
    user.confidenceScore = Math.round((user.confidenceScore * 0.7) + (scaledSessionScore * 0.3));
    
    await user.save();
    res.json({ success: true, newConfidenceScore: user.confidenceScore });
  } catch (error) {
    console.error("FULL ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
