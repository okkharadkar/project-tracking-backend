const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  progress: [{
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-progress', 'completed'],
      default: 'pending'
    },
    completedAt: Date,
    score: {
      type: Number,
      default: 0
    }
  }],
  totalScore: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate scores when progress updates
candidateSchema.methods.calculateScores = function() {
  const completedProjects = this.progress.filter(p => p.status === 'completed').length;
  const totalProjects = this.progress.length || 1;
  
  this.completionRate = (completedProjects / totalProjects) * 100;
  this.totalScore = completedProjects * 10; // 10 points per completed project
  
  return this.save();
};

module.exports = mongoose.model('Candidate', candidateSchema); 