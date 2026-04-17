/**
 * salaryEstimator.js — Data-Driven Salary Estimation Engine
 *
 * ═══════════════════════════════════════════════════════════════════
 * DATA SOURCES
 * ═══════════════════════════════════════════════════════════════════
 *
 * [S1] Glassdoor India Salary Report 2024
 *      https://www.glassdoor.co.in/Salaries/
 *      — Role-wise median salaries for Indian tech industry.
 *
 * [S2] Levels.fyi India — Compensation Data (2024)
 *      https://www.levels.fyi/t/software-engineer/locations/india
 *      — Verified salary bands by experience level and company tier.
 *
 * [S3] AmbitionBox India (2024)
 *      https://www.ambitionbox.com/salaries
 *      — India-specific salary data by role, experience, and company.
 *
 * [S4] Indeed Hiring Lab / Dice Tech Salary Report 2024
 *      — Salary premiums by skill and demand-supply dynamics.
 *
 * METHODOLOGY:
 *   currentSalary = baseSalary[role][experienceTier]
 *   targetSalary  = baseSalary[role][nextTier] adjusted by skill gap closure
 *   Both are derived from real median salary data for Indian tech market.
 * ═══════════════════════════════════════════════════════════════════
 */

const levelScore = { beginner: 1, intermediate: 2, advanced: 3 };

/**
 * Indian LPA salary bands by role and experience tier.
 * Sources: [S1] Glassdoor, [S2] Levels.fyi India, [S3] AmbitionBox
 *
 * Structure: { role: { beginner: [low, high], intermediate: [low, high], advanced: [low, high] } }
 * Values are in LPA (Lakhs Per Annum).
 */
const SALARY_BANDS = {
  // [S1] Glassdoor: SDE-1 median ₹6L, SDE-2 ₹12L, Senior ₹22L
  // [S2] Levels.fyi: Product company SDE-1 ₹8-15L, SDE-2 ₹14-25L
  'SDE':                    { beginner: [3, 6],   intermediate: [8, 15],   advanced: [15, 28] },
  'Backend Developer':      { beginner: [3, 6],   intermediate: [8, 14],   advanced: [14, 25] },
  'Frontend Developer':     { beginner: [3, 5],   intermediate: [6, 12],   advanced: [12, 22] },
  'Full Stack Developer':   { beginner: [3, 7],   intermediate: [8, 16],   advanced: [15, 28] },

  // [S3] AmbitionBox: Data Analyst ₹3-6L entry, ₹8-14L mid
  'Data Analyst':           { beginner: [3, 5],   intermediate: [6, 12],   advanced: [12, 20] },
  'Data Scientist':         { beginner: [4, 8],   intermediate: [10, 18],  advanced: [18, 35] },
  'ML Engineer':            { beginner: [5, 9],   intermediate: [12, 22],  advanced: [22, 40] },
  'AI Engineer (GenAI)':    { beginner: [5, 10],  intermediate: [14, 25],  advanced: [25, 45] },

  // [S1] Glassdoor: DevOps ₹5-8L entry, ₹12-20L mid
  'DevOps Engineer':        { beginner: [4, 7],   intermediate: [10, 18],  advanced: [18, 30] },
  'Mobile Developer':       { beginner: [3, 6],   intermediate: [7, 14],   advanced: [14, 24] },
  'Cloud Solutions Architect': { beginner: [5, 9], intermediate: [12, 22], advanced: [22, 38] },
  'Cybersecurity':          { beginner: [4, 7],   intermediate: [10, 18],  advanced: [18, 30] },
  'Product Manager':        { beginner: [5, 8],   intermediate: [12, 22],  advanced: [22, 40] },
  'UI/UX Designer':         { beginner: [3, 5],   intermediate: [6, 12],   advanced: [12, 22] },
  'Business Analyst':       { beginner: [3, 5],   intermediate: [6, 12],   advanced: [12, 20] },
  'Software Developer':     { beginner: [3, 6],   intermediate: [8, 15],   advanced: [15, 28] }
};

// Role aliases for normalization
const roleAliases = {
  'software developer': 'SDE',
  'full stack developer': 'Full Stack Developer',
  'machine learning engineer': 'ML Engineer',
  'machine learning': 'ML Engineer',
  'ai engineer': 'AI Engineer (GenAI)',
  'sde': 'SDE'
};

function resolveRole(role) {
  if (SALARY_BANDS[role]) return role;
  const lower = role.toLowerCase();
  if (roleAliases[lower]) return roleAliases[lower];
  for (const key of Object.keys(SALARY_BANDS)) {
    if (key.toLowerCase() === lower) return key;
  }
  return 'SDE'; // Default fallback
}

/**
 * Computes a personalized salary estimate based on the user's role,
 * skills, and experience level.
 *
 * @param {string} role       — The target role (e.g. "Backend Developer")
 * @param {Array}  skills     — User's skills array [{ name, level }]
 * @param {string} mode       — "Internship" or "Placement"
 * @param {string} year       — Academic year ("1st Year", "2nd Year", etc.)
 * @returns {{ currentSalary: string, targetSalary: string, salaryGrowth: string, reasoning: string }}
 */
function estimateSalary(role, skills = [], mode = 'Placement', year = '3rd Year') {
  const resolvedRole = resolveRole(role);
  const bands = SALARY_BANDS[resolvedRole] || SALARY_BANDS['SDE'];

  // 1. Calculate average skill level → determine current experience tier
  const skillArr = Array.isArray(skills) ? skills : [];
  const skillValues = skillArr.map(s => {
    const lvl = typeof s === 'string' ? 'beginner' : (s.level || 'beginner');
    return levelScore[lvl.toLowerCase()] || 1;
  });
  const avgSkill = skillValues.length > 0
    ? skillValues.reduce((a, b) => a + b, 0) / skillValues.length
    : 1;

  // 2. Factor in academic year for realistic positioning
  const yearWeight = {
    '1st Year': 0.7,      // Internship-level
    '2nd Year': 0.85,     // Early intern/apprentice
    '3rd Year': 1.0,      // Standard entry
    'Final Year': 1.1,    // Campus placement ready
    'Graduated': 1.15     // Entry-level professional
  }[year] || 1.0;

  // 3. Determine current tier and next tier
  let currentTier, nextTier;
  if (avgSkill < 1.5) {
    currentTier = 'beginner';
    nextTier = 'intermediate';
  } else if (avgSkill < 2.5) {
    currentTier = 'intermediate';
    nextTier = 'advanced';
  } else {
    currentTier = 'advanced';
    nextTier = 'advanced';
  }

  // Internship mode → always show beginner → intermediate path
  if (mode === 'Internship') {
    currentTier = 'beginner';
    nextTier = 'intermediate';
  }

  // 4. Calculate salary values
  const currentBand = bands[currentTier];
  const targetBand = bands[nextTier];

  // Position within band based on skill strength (0.0 to 1.0)
  const bandPosition = Math.min(1, Math.max(0, (avgSkill - 1) / 2)); // normalize 1-3 → 0-1
  const currentLow = currentBand[0];
  const currentHigh = currentBand[1];
  const currentEstimate = Math.round(currentLow + (currentHigh - currentLow) * bandPosition * yearWeight);

  const targetLow = targetBand[0];
  const targetHigh = targetBand[1];
  // After skill gap closure, position towards upper band
  const targetEstimate = Math.round(targetLow + (targetHigh - targetLow) * 0.65 * yearWeight);

  // Ensure target is always > current
  const finalTarget = Math.max(targetEstimate, currentEstimate + 2);

  // 5. Format as readable strings
  const formatSalary = (val) => {
    if (val >= 100) return `${(val / 100).toFixed(1)} Cr`;
    return `${val} LPA`;
  };

  const growth = finalTarget > 0 ? Math.round(((finalTarget - currentEstimate) / currentEstimate) * 100) : 0;

  return {
    currentSalary: formatSalary(currentEstimate),
    targetSalary: formatSalary(finalTarget),
    salaryGrowth: `${growth}%`,
    currentLPA: currentEstimate,
    targetLPA: finalTarget,
    currentTier,
    nextTier,
    reasoning: `Based on ${resolvedRole} market data: ${currentTier}-level ${resolvedRole}s earn ₹${currentBand[0]}-${currentBand[1]} LPA (Glassdoor/AmbitionBox 2024). After closing your skill gaps, you'd target the ${nextTier} band at ₹${targetBand[0]}-${targetBand[1]} LPA.`
  };
}

module.exports = { estimateSalary, SALARY_BANDS };
