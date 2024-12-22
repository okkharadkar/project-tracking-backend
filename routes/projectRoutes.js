const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  createProject,
  updateProject,
  getProjectById,
  getProjectSummary,
  deleteProject,
  getUserProjects,
  acceptProject,
  completeProject
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

// User projects route (must come before /:id routes)
router.get('/user', protect, getUserProjects);
router.get('/summary', getProjectSummary);

// Admin routes
router.post('/', adminAuth, createProject);
router.delete('/:id', adminAuth, deleteProject);

// Project action routes
router.put('/:id/accept', protect, acceptProject);
router.put('/:id/complete', protect, completeProject);
router.put('/:id', protect, updateProject);

// General routes
router.get('/', getAllProjects);
router.get('/:id', getProjectById);

module.exports = router; 