const Candidate = require('../models/Candidate');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// @desc    Get candidate progress
// @route   GET /api/progress/:candidateId
// @access  Public
const getCandidateProgress = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId)
      .populate({
        path: 'progress.project',
        populate: [
          { path: 'assignedTo', select: 'name email' },
          { path: 'completedBy', select: 'name email' }
        ]
      });
    
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Sort progress by date if requested
    if (req.query.sortBy === 'date') {
      candidate.progress.sort((a, b) => 
        new Date(b.project.createdAt).getTime() - new Date(a.project.createdAt).getTime()
      );
    }
    // Sort by status
    else if (req.query.sortBy === 'status') {
      const priorities = { 'completed': 2, 'in-progress': 1, 'pending': 0 };
      candidate.progress.sort((a, b) => priorities[b.status] - priorities[a.status]);
    }
    // Sort by project name
    else if (req.query.sortBy === 'name') {
      candidate.progress.sort((a, b) => a.project.title.localeCompare(b.project.title));
    }

    res.status(200).json({
      name: candidate.name,
      email: candidate.email,
      progress: candidate.progress,
      score: candidate.score
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update candidate progress
// @route   PUT /api/progress/:candidateId
// @access  Private
const updateProgress = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { projectId, status } = req.body;

    // Find candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Update progress
    const progressIndex = candidate.progress.findIndex(
      p => p.project.toString() === projectId
    );

    if (progressIndex === -1) {
      candidate.progress.push({
        project: projectId,
        status
      });
    } else {
      candidate.progress[progressIndex].status = status;
    }

    // Update score if project is completed
    if (status === 'completed') {
      const completedProjects = candidate.progress.filter(p => p.status === 'completed').length;
      candidate.score = completedProjects * 10;
    }

    await candidate.save();

    // Get updated data with populated fields
    const updatedCandidate = await Candidate.findById(candidateId)
      .populate({
        path: 'progress.project',
        populate: [
          { path: 'assignedTo', select: 'name email' },
          { path: 'completedBy', select: 'name email' }
        ]
      });

    res.status(200).json({
      message: 'Progress updated successfully',
      progress: updatedCandidate.progress,
      score: updatedCandidate.score
    });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCandidateProgress,
  updateProgress
}; 