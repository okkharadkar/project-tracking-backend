const Project = require('../models/Project');
const Candidate = require('../models/Candidate');
const mongoose = require('mongoose');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');
    res.status(200).json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ 
        message: 'Please provide both title and description' 
      });
    }

    // Create project with admin ID
    const project = await Project.create({
      title,
      description,
      status: 'pending',
      createdBy: req.user._id
    });

    // Populate the created project
    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.status(201).json(populatedProject);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ 
      message: 'Failed to create project',
      error: error.message 
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
  try {
    const { progress } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (progress !== undefined) {
      project.progress = progress;
      
      // Update candidate progress
      if (project.assignedTo) {
        const candidate = await Candidate.findById(project.assignedTo);
        if (candidate) {
          const progressIndex = candidate.progress.findIndex(
            p => p.project.toString() === project._id.toString()
          );
          
          if (progressIndex !== -1) {
            candidate.progress[progressIndex].score = Math.floor(progress / 10);
            await candidate.calculateScores();
          }
        }
      }
    }

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project with details
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project summary
// @route   GET /api/projects/summary
// @access  Public
const getProjectSummary = async (req, res) => {
  try {
    const projects = await Project.find();
    
    const result = {
      pending: projects.filter(p => p.status === 'pending').length,
      'in-progress': projects.filter(p => p.status === 'in-progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      total: projects.length
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Project summary error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await project.deleteOne();
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's projects
// @route   GET /api/projects/user
// @access  Private
const getUserProjects = async (req, res) => {
  try {
    // Fetch both assigned projects and available (pending) projects
    const projects = await Project.find({
      $or: [
        { assignedTo: req.user._id },  // Projects assigned to user
        { status: 'pending' }          // Available projects
      ]
    })
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort('-createdAt');  // Show newest first

    // Calculate stats only for user's assigned projects
    const userProjects = projects.filter(p => p.assignedTo?._id?.toString() === req.user._id.toString());
    const completedProjects = userProjects.filter(p => p.status === 'completed');
    const inProgressProjects = userProjects.filter(p => p.status === 'in-progress');
    
    const stats = {
      total: userProjects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      inProgress: inProgressProjects.length,
      completed: completedProjects.length,
      averageProgress: Math.round(
        userProjects.reduce((acc, curr) => acc + (curr.progress || 0), 0) / Math.max(userProjects.length, 1)
      ),
      totalScore: completedProjects.length * 10,
      completionRate: Math.round((completedProjects.length / Math.max(userProjects.length, 1)) * 100)
    };

    res.json({ 
      projects,
      stats,
      availableProjects: projects.filter(p => p.status === 'pending'),
      myProjects: userProjects
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept project
// @route   PUT /api/projects/:id/accept
// @access  Private
const acceptProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status !== 'pending') {
      return res.status(400).json({ message: 'Project is not available' });
    }

    project.status = 'in-progress';
    project.assignedTo = req.user._id;
    project.acceptedBy = req.user._id;
    project.acceptedAt = new Date();
    
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('acceptedBy', 'name email')
      .populate('completedBy', 'name email');

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete project
// @route   PUT /api/projects/:id/complete
// @access  Private
const completeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.status = 'completed';
    project.completedBy = req.user._id;
    project.completedAt = new Date();
    project.progress = 100;
    
    await project.save();

    // Update candidate score
    const candidate = await Candidate.findOne({ user: req.user._id });
    if (candidate) {
      candidate.totalScore += 10; // Add 10 points for completion
      await candidate.save();
    }

    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllProjects,
  createProject,
  updateProject,
  getProjectById,
  getProjectSummary,
  deleteProject,
  getUserProjects,
  acceptProject,
  completeProject
}; 