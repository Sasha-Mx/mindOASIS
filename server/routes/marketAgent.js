const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getJobMarketTrends, generateFromProfile } = require('../utils/jobMarket');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/market/generate — form-based, no profile cache needed
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { name, collegeYear, currentSkills, targetRole, timelineMonths, hoursPerDay, preferredCompanyType } = req.body;
    if (!targetRole || !currentSkills) {
      return res.status(400).json({ error: 'targetRole and currentSkills are required.' });
    }
    const result = await generateFromProfile({ name, collegeYear, currentSkills, targetRole, timelineMonths, hoursPerDay, preferredCompanyType });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[MARKET/GENERATE ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});



// GET /api/market/status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const user = await User.findById(userId);
    if (!user?.onboardingDone) {
      return res.json({ available: false });
    }

    const lastFetched = user.jobMarketData?.lastFetched;
    const hoursSince = lastFetched
      ? (Date.now() - new Date(lastFetched)) / (1000*60*60) : 999;

    // Invalidate cache if legacy format (missing impactCards or growthPath)
    const hasNewSchema = user.jobMarketData?.impactCards && 
                         user.jobMarketData?.growthPath;

    if (hoursSince < 6 && hasNewSchema) {
      return res.json({ available: true, cached: true, data: user.jobMarketData });
    }

    // Otherwise, force fresh fetch from AI
    const marketData = await getJobMarketTrends(
      user.profile?.role || user.answers?.role || 'SDE',
      16, // Default baseline for this specialized UI
      user.gapReport?.fullyMissing?.map(s => s.skill) || [],
      user.profile?.skills?.map(s => typeof s === 'string' ? s : s.name) || []
    );

    user.jobMarketData = {
      lastFetched: new Date(),
      ...marketData
    };
    user.markModified('jobMarketData');
    await user.save();

    res.json({ available: true, cached: false, data: user.jobMarketData });

  } catch (err) {
    console.error('[MARKET ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/market/download-report
router.get('/download-report', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const user = await User.findById(userId);
    
    if (!user || !user.jobMarketData || !user.jobMarketData.marketAlignment) {
      return res.status(404).send('Market Intelligence Report not available yet. Please generate it first.');
    }

    const role = user.profile?.role || user.answers?.role || 'SDE';
    const data = user.jobMarketData;
    
    // Strict Markdown Report Content per spec
    const markdownReport = `
# CAREER DECISION INTELLIGENCE REPORT
Generated for: ${user.firstName} ${user.lastName || ''}
Date: ${new Date().toLocaleDateString()}

---

## 👤 USER PROFILE
- **Target Role:** ${role}
- **Experience Level:** ${user.profile?.experience || 'Entry'}
- **Key Skills:** ${(user.profile?.skills || []).join(', ')}
- **Primary Goal:** ${user.profile?.goal || 'Growth'}

## 💹 MARKET FIT JUMP
- **Current Fit:** ${data.marketAlignment?.currentScore}%
- **Target Fit:** ${data.marketAlignment?.targetScore}%
- **Fastest Path:** ${data.marketAlignment?.fastestPath}

## ⚡ SKILL IMPACT ANALYTICS
${(data.impactCards || []).map(card => `
### ${card.skill} (+${card.impactIncrease}% Jump)
- **Demand:** ${card.demand}
- **Target Companies:** ${card.companies?.join(', ')}
- **payoff:** ${card.impactSummary}
`).join('\n')}

## 📊 GROWTH PATH
${(data.growthPath || []).map(p => `- **${p.label}**: ${p.score}% Readiness`).join('\n')}

## 🏢 COMPANY EXPECTATIONS
${Object.entries(data.companyExpectationMap || {}).map(([type, skills]) => `- **${type}**: Requires ${skills.join(', ')}`).join('\n')}

## 🧠 FINAL ACTION PLAN
- **Must Learn:** ${(data.finalActionPlan?.mustLearn || []).join(', ')}
- **Next Step:** ${data.finalActionPlan?.nextStep}
- **Bonus:** ${(data.finalActionPlan?.bonus || []).join(', ')}

---
*Mentra.AI - Career Decision Engine*
    `;

    res.setHeader('Content-disposition', `attachment; filename=Career_Report_${user.firstName}.md`);
    res.set('Content-Type', 'text/markdown');
    res.send(markdownReport.trim());

  } catch (err) {
    console.error('[DOWNLOAD REPORT ERROR]', err.message);
    res.status(500).send('Failed to generate report.');
  }
});

module.exports = router;
