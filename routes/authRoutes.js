const express = require('express');
const router = express.Router();
const { 
  signup, 
  login, 
  getUser, 
  adminLogin,
  createAdmin 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/admin/login', adminLogin);

// Protected routes
router.get('/user', protect, getUser);
router.post('/admin/create', protect, adminAuth, createAdmin);

module.exports = router; 