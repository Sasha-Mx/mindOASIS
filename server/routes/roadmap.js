const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

router.patch('/update-task', authMiddleware, async (req, res) => {
  try {
    const { weekIndex, taskIndex, completed } = req.body;
    
    // We update the specific task's completed status using MongoDB dot notation
    // The roadmap field contains { roadmap: [{ week: 1, tasks: [...] }, ...] }
    // Wait, the User schema roadmap is Mixed, but the structure is { roadmap: [ weeks ] }. So to access the week array, it's roadmap.roadmap.
    const updatePath = `roadmap.roadmap.${weekIndex}.tasks.${taskIndex}.completed`;
    
    await User.findByIdAndUpdate(req.user._id, { $set: { [updatePath]: completed } });

    // Recalculate roadmap progress
    const user = await User.findById(req.user._id);
    const roadmapArr = user.roadmap?.roadmap || [];
    
    // A week is done if ALL its tasks are explicitly completed (true)
    const completedWeeks = roadmapArr.filter(w =>
      w.tasks && w.tasks.length > 0 && w.tasks.every(t => t.completed === true)
    ).length;
    
    const progress = roadmapArr.length > 0 ? Math.round((completedWeeks / roadmapArr.length) * 100) : 0;
    
    await User.findByIdAndUpdate(req.user._id, { $set: { roadmapProgress: progress } });

    res.json({ success: true, progress });
  } catch (error) {
    console.error("Error updating roadmap task:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
