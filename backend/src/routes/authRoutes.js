const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // We will create this next

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/me
// @desc    Get current logged-in user details
// @access  Private (Requires token)
router.get('/me', authMiddleware.protect, authController.getMe);

// Optional: Add a logout route if needed (e.g., for token blacklisting)
// router.post('/logout', authMiddleware.protect, authController.logout);

module.exports = router;
