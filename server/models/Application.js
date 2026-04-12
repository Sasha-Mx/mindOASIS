const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Applied', 'OA', 'Interview', 'Offer', 'Rejected'], 
    default: 'Applied' 
  },
  dateApplied: { type: Date, default: Date.now },
  notes: { type: String },
  link: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
