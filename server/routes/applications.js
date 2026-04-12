const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const { generateAIResponse } = require('../utils/ai');

// Stage-specific checklists
const STAGE_CHECKLISTS = {
  'Applied': [
    { text: 'Resume tailored for this role', key: 'resume_tailored' },
    { text: 'Cover letter written', key: 'cover_letter' },
    { text: 'Job posting saved/bookmarked', key: 'posting_saved' },
    { text: 'Referral requested (if possible)', key: 'referral' },
  ],
  'OA': [
    { text: 'Practiced similar OA problems on LeetCode', key: 'oa_practice' },
    { text: 'Reviewed time management strategy', key: 'oa_time' },
    { text: 'Tested system setup (IDE, browser, etc.)', key: 'oa_setup' },
    { text: 'Reviewed company-specific OA patterns', key: 'oa_patterns' },
  ],
  'Interview': [
    { text: 'Researched company culture & values', key: 'company_research' },
    { text: 'Prepared STAR answers for behavioral', key: 'star_prep' },
    { text: 'Practiced DSA/coding problems', key: 'dsa_practice' },
    { text: 'Reviewed system design basics', key: 'system_design' },
    { text: 'Completed a mock interview', key: 'mock_done' },
    { text: 'Questions prepared for interviewer', key: 'questions_ready' },
  ],
  'Offer': [
    { text: 'Compared CTC with market standards', key: 'ctc_compare' },
    { text: 'Reviewed benefits package', key: 'benefits_review' },
    { text: 'Negotiation strategy planned', key: 'negotiation' },
    { text: 'Deadline to accept noted', key: 'deadline_noted' },
  ],
  'Rejected': [
    { text: 'Requested feedback from recruiter', key: 'feedback_requested' },
    { text: 'Noted learnings for next time', key: 'learnings_noted' },
  ],
};

// Get all applications
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('applications');
    res.json(user.applications || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('applications');
    const apps = user.applications || [];
    
    const total = apps.length;
    const statusCounts = {};
    const companyCounts = {};
    let totalDaysToResponse = 0;
    let responseCount = 0;

    apps.forEach(app => {
      // Status distribution
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;

      // Company frequency
      companyCounts[app.company] = (companyCounts[app.company] || 0) + 1;

      // Average days to response (from Applied to next stage)
      if (app.status !== 'Applied' && app.date && app.statusUpdatedAt) {
        const applied = new Date(app.date);
        const responded = new Date(app.statusUpdatedAt);
        const days = Math.ceil((responded - applied) / (1000 * 60 * 60 * 24));
        if (days > 0 && days < 365) {
          totalDaysToResponse += days;
          responseCount++;
        }
      }
    });

    const responseRate = total > 0 ? Math.round(((total - (statusCounts['Applied'] || 0)) / total) * 100) : 0;
    const interviewRate = total > 0 ? Math.round((((statusCounts['Interview'] || 0) + (statusCounts['Offer'] || 0)) / total) * 100) : 0;
    const offerRate = total > 0 ? Math.round(((statusCounts['Offer'] || 0) / total) * 100) : 0;
    const avgDaysToResponse = responseCount > 0 ? Math.round(totalDaysToResponse / responseCount) : 0;

    // Ghosted (applied > 14 days ago, still in "Applied")
    const ghosted = apps.filter(a => {
      if (a.status !== 'Applied') return false;
      const daysSince = Math.ceil((Date.now() - new Date(a.date)) / (1000 * 60 * 60 * 24));
      return daysSince > 14;
    }).length;

    // Follow-ups needed (applied > 7 days, still Applied, no followUp sent)
    const needsFollowUp = apps.filter(a => {
      if (a.status !== 'Applied') return false;
      const daysSince = Math.ceil((Date.now() - new Date(a.date)) / (1000 * 60 * 60 * 24));
      return daysSince >= 7 && !a.followedUp;
    }).map(a => ({ _id: a._id, company: a.company, role: a.role, daysSince: Math.ceil((Date.now() - new Date(a.date)) / (1000 * 60 * 60 * 24)) }));

    // Upcoming deadlines (OA or Interview with deadlineDate set)
    const upcomingDeadlines = apps.filter(a => a.deadlineDate && new Date(a.deadlineDate) > new Date())
      .map(a => ({ _id: a._id, company: a.company, role: a.role, status: a.status, deadlineDate: a.deadlineDate }))
      .sort((a, b) => new Date(a.deadlineDate) - new Date(b.deadlineDate));

    res.json({
      total,
      statusCounts,
      responseRate,
      interviewRate,
      offerRate,
      avgDaysToResponse,
      ghosted,
      needsFollowUp,
      upcomingDeadlines,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add application
router.post('/', auth, async (req, res) => {
  try {
    const { company, role, status, date, url, notes, ctc, deadlineDate } = req.body;
    const newApp = {
      _id: new Date().getTime().toString(),
      company,
      role,
      status: status || 'Applied',
      date: date || new Date().toISOString(),
      url,
      notes,
      ctc,
      deadlineDate: deadlineDate || null,
      checklist: {},
      followedUp: false,
      statusUpdatedAt: new Date().toISOString(),
      companyResearch: null,
      interviewPrep: null,
      createdAt: new Date().toISOString(),
    };
    const user = await User.findById(req.user._id);
    if (!user.applications) user.applications = [];
    user.applications.unshift(newApp);
    user.markModified('applications');
    await user.save();
    res.json(newApp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update application
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.applications) user.applications = [];
    const idx = user.applications.findIndex(a => a._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Not found' });
    user.applications[idx] = { ...user.applications[idx]._doc || user.applications[idx], ...req.body };
    user.markModified('applications');
    await user.save();
    res.json(user.applications[idx]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete application
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.applications) user.applications = [];
    user.applications = user.applications.filter(a => a._id !== req.params.id);
    user.markModified('applications');
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Move application to new status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.applications) user.applications = [];
    const app = user.applications.find(a => a._id === req.params.id);
    if (!app) return res.status(404).json({ message: 'Not found' });
    app.status = req.body.status;
    app.statusUpdatedAt = new Date().toISOString();
    user.markModified('applications');
    await user.save();
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update checklist item
router.patch('/:id/checklist', auth, async (req, res) => {
  try {
    const { key, checked } = req.body;
    const user = await User.findById(req.user._id);
    const app = user.applications.find(a => a._id === req.params.id);
    if (!app) return res.status(404).json({ message: 'Not found' });
    if (!app.checklist) app.checklist = {};
    app.checklist[key] = checked;
    user.markModified('applications');
    await user.save();
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark as followed up
router.patch('/:id/followup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const app = user.applications.find(a => a._id === req.params.id);
    if (!app) return res.status(404).json({ message: 'Not found' });
    app.followedUp = true;
    app.followedUpAt = new Date().toISOString();
    user.markModified('applications');
    await user.save();
    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get stage checklist template
router.get('/checklists', auth, (req, res) => {
  res.json(STAGE_CHECKLISTS);
});

// AI: Company research
router.post('/:id/research', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const app = user.applications.find(a => a._id === req.params.id);
    if (!app) return res.status(404).json({ message: 'Not found' });

    const prompt = `You are a JSON API. Respond with valid JSON only. No markdown. No thinking tags.

Research this company for a job applicant:
Company: ${app.company}
Role applied for: ${app.role}

Return ONLY this JSON:
{
  "about": "1-2 sentence company description",
  "techStack": ["list", "of", "main", "technologies"],
  "culture": "Brief description of work culture",
  "interviewStyle": "What their interview process typically looks like",
  "glassdoorRating": "Approximate rating if well-known, or 'N/A'",
  "tips": ["2-3 specific tips for applying/interviewing at this company"],
  "avgSalary": "Approximate salary range for this role"
}
Start with { directly.`;

    const result = await generateAIResponse(prompt);
    app.companyResearch = result;
    user.markModified('applications');
    await user.save();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// AI: Interview prep
router.post('/:id/interview-prep', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const app = user.applications.find(a => a._id === req.params.id);
    if (!app) return res.status(404).json({ message: 'Not found' });
    const role = user.profile?.role || app.role;

    const prompt = `You are a JSON API. Respond with valid JSON only. No markdown. No thinking tags.

Generate interview preparation material for:
Company: ${app.company}
Role: ${app.role}
Student's target role: ${role}

Return ONLY this JSON:
{
  "commonQuestions": [
    { "question": "Technical or behavioral question", "tip": "Brief tip on how to answer", "category": "technical|behavioral|system-design" }
  ],
  "dsaTopics": ["Key DSA topics to revise for this company"],
  "systemDesignTopics": ["System design topics if applicable"],
  "behavioralTips": ["3-4 behavioral interview tips specific to this company"],
  "resources": [
    { "title": "Resource name", "url": "https://www.youtube.com/results?search_query=COMPANY+interview+preparation", "type": "youtube" }
  ]
}
Include 8-10 common questions, 4-5 DSA topics, 2-3 system design topics, and 3-4 resources.
Start with { directly.`;

    const result = await generateAIResponse(prompt);
    app.interviewPrep = result;
    user.markModified('applications');
    await user.save();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// AI: Analyze Rejection and Generate Recovery Plan
router.post('/:id/analyze-rejection', auth, async (req, res) => {
  try {
    const { stage, feedback } = req.body;
    const user = await User.findById(req.user._id);
    const app = user.applications.find(a => a._id === req.params.id);
    
    if (!app) return res.status(404).json({ message: 'Application not found' });
    
    const role = user.profile?.role || app.role;
    const weakSkills = user.gapReport?.gaps?.filter(g => g.priority === 'HIGH PRIORITY').map(g => g.skill).join(', ') || 'None specifically tracked';

    const prompt = `You are a career coach API responding with valid JSON ONLY. No text before or after, no markdown, no thinking tags.
Your student was just rejected from a job opportunity. Provide a specific, actionable, and encouraging Recovery Plan.

CONTEXT:
- Target Role: ${role}
- Company: ${app.company}
- Rejection Stage: ${stage || 'Not specified'}
- User's Feedback/Notes: "${feedback || 'None provided'}"
- Known Weaknesses: ${weakSkills}

Return ONLY this JSON format:
{
  "empathy_message": "A short, highly encouraging message acknowledging the rejection and rebuilding confidence.",
  "diagnosis": "What likely went wrong based on the stage and feedback.",
  "roadmap_adjustment": [
    {
      "skill_to_prioritize": "string",
      "action_item": "Specific 3-day recovery task"
    }
  ],
  "interview_strategy_shift": "One specific tip to change their approach for the next application/interview."
}
Start with { directly.`;

    const result = await generateAIResponse(prompt);
    
    // Save recovery plan and mark status as Rejected
    app.recoveryPlan = result;
    app.status = 'Rejected';
    app.statusUpdatedAt = new Date().toISOString();
    user.markModified('applications');
    
    // Impact confidence score slightly but add XP for logging it
    user.confidenceScore = Math.max(0, (user.confidenceScore || 50) - 5);
    user.xp = (user.xp || 0) + 50; 
    
    await user.save();
    
    res.json(result);
  } catch (err) {
    console.error('Rejection analysis error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
