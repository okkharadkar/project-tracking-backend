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
    console.log('Create project request:', {
      body: req.body,
      user: req.user,
      headers: req.headers
    });

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const project = new Project({
      title: req.body.title,
      description: req.body.description,
      createdBy: req.user._id,
      status: 'pending'
    });

    const savedProject = await project.save();
    console.log('Project created:', savedProject);

    const populatedProject = await Project.findById(savedProject._id)
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

    // Only assigned user can update progress
    if (project.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    if (progress !== undefined) {
      project.progress = progress;
    }

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('acceptedBy', 'name email')
      .populate('completedBy', 'name email');

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
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
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's projects
// @route   GET /api/projects/user/:candidateId
// @access  Private
const getUserProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const projects = await Project.find({
      $or: [
        { assignedTo: userId },
        { status: 'pending' }
      ]
    })
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('acceptedBy', 'name email')
    .populate('completedBy', 'name email')
    .sort('-createdAt');

    const stats = {
      total: projects.length,
      pending: projects.filter(p => p.status === 'pending').length,
      assigned: projects.filter(p => p.status === 'assigned').length,
      inProgress: projects.filter(p => p.status === 'in-progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      averageProgress: projects.length ? 
        Math.round(projects.reduce((acc, curr) => acc + (curr.progress || 0), 0) / projects.length) : 0
    };

    res.status(200).json({
      projects,
      stats
    });
  } catch (error) {
    console.error('Get user projects error:', error);
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

    if (project.status !== 'in-progress') {
      return res.status(400).json({ message: 'Project is not in progress' });
    }

    project.status = 'completed';
    project.completedBy = req.user._id;
    project.completedAt = new Date();
    project.progress = 100;
    
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