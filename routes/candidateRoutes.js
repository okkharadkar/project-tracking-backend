const express = require('express');
const router = express.Router();
const {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate
} = require('../controllers/candidateController');

// Route: POST /api/candidates
router.post('/', createCandidate);

// Route: GET /api/candidates
router.get('/', getAllCandidates);

// Route: GET /api/candidates/:id
router.get('/:id', getCandidateById);

// Route: PUT /api/candidates/:id
router.put('/:id', updateCandidate);

// Route: DELETE /api/candidates/:id
router.delete('/:id', deleteCandidate);

module.exports = router; 