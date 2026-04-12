const router = require('express').Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Update streak
router.patch('/streak', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (user.lastActiveDate === yesterday) {
      user.streakDays = (user.streakDays || 0) + 1;
    } else if (user.lastActiveDate !== today) {
      user.streakDays = 1;
    }
    
    user.lastActiveDate = today;
    await user.save();
    
    res.json({ streakDays: user.streakDays });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Goals: Add a new goal
router.post('/goals', authMiddleware, async (req, res) => {
  try {
    const { text, priority, deadline } = req.body;
    const user = await User.findById(req.user._id);
    
    const newGoal = {
      text,
      priority: priority || 'Medium',
      deadline: deadline ? new Date(deadline) : null,
      progress: 0
    };

    user.goals.push(newGoal);
    await user.save();
    res.status(201).json(user.goals[user.goals.length - 1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Goals: Update a goal
router.patch('/goals/:id', authMiddleware, async (req, res) => {
  try {
    const { progress, priority, text, deadline } = req.body;
    const user = await User.findById(req.user._id);
    
    const goal = user.goals.id(req.params.id);
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (progress !== undefined) goal.progress = progress;
    if (priority) goal.priority = priority;
    if (text) goal.text = text;
    if (deadline) goal.deadline = new Date(deadline);

    await user.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Goals: Delete a goal
router.delete('/goals/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.goals.pull({ _id: req.params.id });
    await user.save();
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.patch('/profile-update', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findById(req.user._id);
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /preferences — fetch theme + accent color
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');
    res.json(user.preferences || { theme: 'light', accentColor: 'purple' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update preferences
router.patch('/preferences', authMiddleware, async (req, res) => {
  try {
    const { notifications, theme, accentColor } = req.body;
    const user = await User.findById(req.user._id);
    if (notifications) user.preferences.notifications = { ...user.preferences.notifications, ...notifications };
    if (theme) user.preferences.theme = theme;
    if (accentColor) user.preferences.accentColor = accentColor;
    user.markModified('preferences');
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Reset progress
router.post('/reset-progress', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.roadmap = null;
    user.goals = [];
    user.completedMissions = [];
    user.xp = 0;
    user.level = 1;
    user.confidenceScore = 0;
    user.streakDays = 0;
    await user.save();
    res.json({ message: 'Progress reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /rerun-onboarding — clear roadmap + gap report only
router.post('/rerun-onboarding', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { roadmap: '', gapReport: '', dailyMissions: '' }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Delete account
router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
