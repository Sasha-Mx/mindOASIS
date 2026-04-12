const express = require('express');
const router = express.Router();
const { callAI } = require('../utils/ai');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

/**
 * Resume Analysis Routes
 * 
 * All analysis prompts are grounded in the following industry standards:
 *
 * [A1] Jobscan ATS Research (2024)
 *      https://www.jobscan.co/blog/ats-statistics/
 *      — 98.8% of Fortune 500 companies use ATS; keyword density,
 *        header format, and file structure impact parse rates.
 *
 * [A2] Google XYZ Formula for Resume Bullets
 *      https://www.inc.com/bill-murphy-jr/google-recruiters-say-these-5-resume-tips-work.html
 *      — "Accomplished [X] as measured by [Y] by doing [Z]"
 *        Structure shown to increase callback rates by 40%.
 *
 * [A3] Harvard Office of Career Services Resume Guidelines
 *      https://ocs.fas.harvard.edu/resumes-cvs-cover-letters
 *      — Standard formatting rules, section ordering, and
 *        action-verb led bullets.
 *
 * [A4] TopResume / ResumeWorded ATS Scoring Methodology
 *      https://www.resumeworded.com/
 *      — Keyword match scoring, section completeness checks,
 *        and impact-driven bullet analysis.
 *
 * [A5] NACE (National Association of Colleges & Employers) 2024
 *      https://www.naceweb.org/
 *      — Employer skill priorities, campus resume expectations,
 *        and internship-to-hire conversion factors.
 *
 * [A6] LinkedIn Talent Solutions: What Recruiters Look For (2024)
 *      https://business.linkedin.com/talent-solutions
 *      — Recruiter eye-tracking data: 7.4 seconds average resume scan,
 *        top-third placement importance, quantified achievements preferred.
 */

// POST /api/resume/analyze
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || resumeText.trim().length < 100) {
      return res.status(400).json({ error: 'Resume text too short' });
    }

    const user = await User.findById(req.user._id);
    const targetRole = user?.profile?.role || 'Software Developer';
    const targetMode = user?.profile?.mode || 'Placement';
    const targetYear = user?.profile?.year || '3rd Year';
    const userSkills = user?.profile?.skills || [];
    
    // Compute experience tier for calibrated expectations
    const lvlScore = { beginner: 1, intermediate: 2, advanced: 3 };
    const levels = userSkills.map(s => lvlScore[s.level?.toLowerCase()] || 1);
    const avgLvl = levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 1;
    const expTier = avgLvl >= 2.5 ? 'Advanced' : avgLvl >= 1.5 ? 'Intermediate' : 'Beginner';
    const skillNames = userSkills.map(s => s.name).join(', ');

    const result = await callAI('RESUME_ANALYZE', `
      You are a senior technical recruiter with 10+ years of experience at top tech companies.
      You use INDUSTRY-STANDARD evaluation criteria to score resumes:

      EVALUATION FRAMEWORK (cite these standards in your feedback):
      1. ATS COMPATIBILITY [Jobscan Research]: Check for parseable headers, standard section names
         (Experience, Education, Skills), no tables/columns, and proper keyword density.
         — 98.8% of Fortune 500 companies use ATS systems that reject poorly formatted resumes.
      2. IMPACT SCORING [Google XYZ Formula]: Each bullet should follow "Accomplished X as measured by Y by doing Z."
         — Resumes with quantified achievements get 40% more callbacks (Google recruiting data).
      3. SECTION STRUCTURE [Harvard OCS Guidelines]: Summary → Experience → Skills → Education → Projects.
         — Recruiter eye-tracking shows top 1/3 of resume gets 80% of attention (LinkedIn 2024).
      4. KEYWORD OPTIMIZATION [ResumeWorded methodology]: Match rate against standard ${targetRole} job postings.
         — Industry benchmark: 60%+ keyword match rate needed to pass most ATS filters.
      5. BULLET QUALITY [NACE employer data]: Action-verb led, specific, and outcome-driven.
         — NACE 2024: Employers rate "demonstrated impact" as #1 resume quality signal.

      ═══════════════════════════════════════
      CANDIDATE PROFILE (calibrate expectations to this)
      ═══════════════════════════════════════
      - Target Role: ${targetRole}
      - Mode: ${targetMode}
      - Academic Year: ${targetYear}
      - Experience Tier: ${expTier}
      - Known Skills: ${skillNames || 'Not specified'}

      CALIBRATION RULES:
      ${targetYear === '1st Year' || targetYear === '2nd Year' ? `
      EARLY STUDENT: This is a junior candidate. Be encouraging.
      - Do NOT penalize for lack of work experience — focus on projects and coursework.
      - Prioritize: skills section completeness, project descriptions, and learning signals.
      - Important keywords: "built", "learned", "collaborated", "contributed".` : 
      targetYear === 'Final Year' || targetYear === 'Graduated' ? `
      PLACEMENT-READY: This candidate needs to compete with experienced hires.
      - STRICTLY evaluate: quantified impact, technical depth, leadership signals.
      - Penalize: vague bullets, missing metrics, tutorial-level projects.
      - Important keywords: "optimized", "reduced", "scaled", "architected", "led".` : `
      MID-STAGE STUDENT: Balance encouragement with professional standards.
      - Evaluate projects with moderate rigor — look for specificity.
      - Flag missing keywords but don't over-penalize missing experience.`}

      Analyze this resume for a ${targetRole} position (${targetMode}).

      Resume text:
      """
      ${resumeText.slice(0, 4000)}
      """

      Analyze deeply and return ONLY this JSON:
      {
        "overallScore": <0-100>,
        "atsScore": <0-100 based on Jobscan ATS parsing standards>,
        "impactScore": <0-100 based on Google XYZ formula compliance>,
        "clarityScore": <0-100 based on Harvard formatting guidelines>,
        "sections": {
          "summary":     { "score": <0-100>, "feedback": "specific, standard-referenced feedback", "hasSummary": true|false },
          "experience":  { "score": <0-100>, "feedback": "reference Google XYZ and NACE standards", "bulletCount": <number> },
          "skills":      { "score": <0-100>, "feedback": "reference ATS keyword optimization", "skillsFound": ["skill1","skill2"] },
          "education":   { "score": <0-100>, "feedback": "string" },
          "projects":    { "score": <0-100>, "feedback": "reference demonstrated impact", "projectCount": <number> }
        },
        "missingKeywords": ["keyword1","keyword2"],
        "presentKeywords": ["keyword1","keyword2"],
        "weakBullets": [
          { "original": "string", "issue": "specifically why it fails the XYZ/STAR framework" }
        ],
        "strongBullets": ["string"],
        "improvements": [
          { "priority": "critical|important|optional", "action": "string", "why": "reference specific industry standard" }
        ],
        "verdict": "Needs Work|Average|Good|Strong|Excellent",
        "summary": "3 sentence overall assessment referencing applicable standards"
      }
    `);

    res.json(result);
  } catch (err) {
    console.error('[RESUME ANALYZE ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resume/rewrite-bullet
router.post('/rewrite-bullet', authMiddleware, async (req, res) => {
  try {
    const { bullet, role } = req.body;

    const result = await callAI('RESUME_REWRITE', `
      You are a professional resume writer who uses the Google XYZ formula:
      "Accomplished [X] as measured by [Y] by doing [Z]."

      This formula is proven to increase callback rates by 40% (Google recruiting research).
      Also apply the CAR framework: Context → Action → Result.

      RULES:
      1. Start with a STRONG action verb (Engineered, Architected, Optimized, Spearheaded, etc.)
         Reference: Harvard OCS top-50 action verbs list.
      2. Include at least ONE quantified metric (%, $, time saved, users impacted).
         Reference: ResumeWorded data shows quantified bullets score 2.3x higher.
      3. Be specific to the ${role} domain — use industry terminology.
      4. Keep it to 1-2 lines maximum.

      Original: "${bullet}"

      Return ONLY JSON:
      {
        "rewritten": "improved bullet point following XYZ formula",
        "improvements": ["what changed 1", "what changed 2"],
        "actionVerb": "verb used",
        "hasMetrics": true|false
      }
    `);

    res.json(result);
  } catch (err) {
    console.error('[RESUME REWRITE ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resume/check-keywords
router.post('/check-keywords', authMiddleware, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    const user = await User.findById(req.user._id);
    const role = user?.profile?.role || 'SDE';

    const result = await callAI('RESUME_KEYWORDS', `
      You are an ATS keyword optimization engine.

      METHODOLOGY (based on Jobscan ATS Research 2024):
      - ATS systems parse resumes for EXACT keyword matches against job descriptions.
      - A match score of 60%+ is the industry threshold for passing most ATS filters.
      - Hard skills (technologies, tools) matter more than soft skills for ATS.
      - Keywords should appear in CONTEXT (within achievement bullets), not just skill lists.

      Compare this resume against ${jobDescription ? 'this specific job description' : `standard ${role} job requirements from LinkedIn's top 100 ${role} postings`}.

      Resume: "${resumeText.slice(0, 2000)}"
      ${jobDescription ? `Job Description: "${jobDescription.slice(0, 1000)}"` : ''}

      ANALYSIS RULES:
      1. For missing keywords: only flag skills that appear in 30%+ of ${role} job postings.
      2. For matched keywords: verify they appear in proper context, not just mentioned once.
      3. Critical keywords: skills that would cause immediate ATS rejection if missing.

      Return ONLY JSON:
      {
        "matchScore": <0-100, using Jobscan methodology>,
        "matched": ["keyword1","keyword2"],
        "missing": ["keyword1","keyword2"],
        "critical": ["must-have missing keywords that appear in 50%+ of postings"],
        "recommendation": "2 sentence advice referencing ATS pass rate data"
      }
    `);

    res.json(result);
  } catch (err) {
    console.error('[RESUME KEYWORDS ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
