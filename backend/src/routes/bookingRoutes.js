const express = require('express');
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// @route   POST api/bookings
// @desc    Create a new flight booking
// @access  Private
router.post('/', bookingController.createBooking);

// @route   GET api/bookings
// @desc    Get all bookings for the logged-in user
// @access  Private
router.get('/', bookingController.getMyBookings);

// @route   GET api/bookings/:booking_id
// @desc    Get details of a specific booking
// @access  Private (User must own booking)
router.get('/:booking_id', bookingController.getBookingById);

// @route   DELETE api/bookings/:booking_id
// @desc    Cancel a booking
// @access  Private (User must own booking)
router.delete('/:booking_id', bookingController.cancelBooking);

module.exports = router;
