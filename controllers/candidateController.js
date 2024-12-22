const Candidate = require('../models/Candidate');

// @desc    Create new candidate
// @route   POST /api/candidates
// @access  Public
const createCandidate = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if candidate with email already exists
    const candidateExists = await Candidate.findOne({ email });
    if (candidateExists) {
      return res.status(400).json({ message: 'Candidate with this email already exists' });
    }

    const candidate = await Candidate.create({
      name,
      email
    });

    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public
const getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().populate('progress.project');
    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get candidate by ID
// @route   GET /api/candidates/:id
// @access  Public
const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('progress.project');
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    res.status(200).json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update candidate
// @route   PUT /api/candidates/:id
// @access  Public
const updateCandidate = async (req, res) => {
  try {
    const { name, email } = req.body;
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    candidate.name = name || candidate.name;
    candidate.email = email || candidate.email;

    const updatedCandidate = await candidate.save();
    res.status(200).json(updatedCandidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete candidate
// @route   DELETE /api/candidates/:id
// @access  Public
const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    await candidate.deleteOne();
    res.status(200).json({ message: 'Candidate removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate
}; 