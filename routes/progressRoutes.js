const express = require('express');
const router = express.Router();
const {
  getCandidateProgress,
  updateProgress
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

// Route: GET /api/progress/:candidateId?sortBy=status
router.get('/:candidateId', protect, getCandidateProgress);

// Route: PUT /api/progress/:candidateId
router.put('/:candidateId', protect, updateProgress);

module.exports = router; 