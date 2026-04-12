const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const authMiddleware = require('../middleware/authMiddleware');

// Get all applications for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const apps = await Application.find({ userId: req.user._id }).sort({ dateApplied: -1 });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Add a new application
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { company, role, status, dateApplied, notes, link } = req.body;
    const app = new Application({
      userId: req.user._id,
      company,
      role,
      status,
      dateApplied,
      notes,
      link
    });
    const savedApp = await app.save();
    res.status(201).json(savedApp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add application' });
  }
});

// Update an application
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json(app);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete an application
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const app = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json({ message: 'Application deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

module.exports = router;
