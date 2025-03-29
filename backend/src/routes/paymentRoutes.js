const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All payment routes require authentication
router.use(protect);

// @route   POST api/payments/mock
// @desc    Process a mock payment for a booking
// @access  Private
router.post('/mock', paymentController.processMockPayment);

// @route   GET api/payments/status/:booking_id
// @desc    Get payment status for a specific booking
// @access  Private (User must own booking)
router.get('/status/:booking_id', paymentController.getPaymentStatus);


module.exports = router;
