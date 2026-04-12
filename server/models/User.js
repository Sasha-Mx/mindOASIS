const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  
  // Profile data from onboarding
  profile: mongoose.Schema.Types.Mixed,
  roadmap: mongoose.Schema.Types.Mixed,
  gapReport: mongoose.Schema.Types.Mixed,  
  onboardingDone: { type: Boolean, default: false },
  // Gamification
  confidenceScore: { type: Number, default: 0 },
  streakCount: { type: Number, default: 0 },
  streakDays: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  lastActiveDate: { type: String },
  completedMissions: { type: [String], default: [] },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: { type: [String], default: [] },
  interviewHistory: { type: Array, default: [] },
  quizHistory: [{
    topic: String,
    score: Number,
    total: Number,
    date: { type: Date, default: Date.now }
  }],
  applications: { type: Array, default: [] },
  roadmapProgress: { type: Number, default: 0 },
  goals: [{
    text: { type: String, required: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    deadline: { type: Date },
    progress: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  jobMarketData: mongoose.Schema.Types.Mixed,
  preferences: {
    notifications: {
      missions: { type: Boolean, default: true },
      streak: { type: Boolean, default: true },
      applications: { type: Boolean, default: true },
      time: { type: String, default: '09:00' }
    },
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    accentColor: { type: String, enum: ['purple', 'teal', 'amber', 'pink'], default: 'purple' }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
