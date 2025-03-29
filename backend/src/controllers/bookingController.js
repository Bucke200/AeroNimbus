const Booking = require('../models/Booking');
const Flight = require('../models/Flight'); // Needed for validation? Maybe not if model handles it.

// Controller to create a new booking
exports.createBooking = async (req, res) => {
  const { flightId, numSeats } = req.body;
  const userId = req.user.user_id; // Assumes authMiddleware added user to req

  // Basic validation
  if (!flightId || !numSeats || isNaN(parseInt(flightId)) || isNaN(parseInt(numSeats)) || parseInt(numSeats) <= 0) {
    return res.status(400).json({ message: 'Invalid input: flightId and a positive number of seats are required.' });
  }

  try {
    const newBooking = await Booking.create(userId, parseInt(flightId), parseInt(numSeats));
    res.status(201).json({ message: 'Booking created successfully (pending payment).', booking: newBooking });
  } catch (error) {
    console.error('Create booking controller error:', error);
    // Provide specific feedback if possible
    if (error.message.includes('Not enough available seats') || error.message.includes('Flight not found')) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during booking creation.' });
  }
};

// Controller to get bookings for the current user
exports.getMyBookings = async (req, res) => {
  const userId = req.user.user_id; // From authMiddleware

  try {
    const bookings = await Booking.findByUserId(userId);
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get my bookings controller error:', error);
    res.status(500).json({ message: 'Server error retrieving your bookings.' });
  }
};

// Controller to get details of a specific booking
exports.getBookingById = async (req, res) => {
  const { booking_id } = req.params;
  const userId = req.user.user_id; // From authMiddleware

   if (!booking_id || isNaN(parseInt(booking_id))) {
      return res.status(400).json({ message: 'Invalid booking ID provided.' });
  }

  try {
    const booking = await Booking.findById(parseInt(booking_id));

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Authorization check: Ensure the logged-in user owns the booking
    if (booking.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this booking.' });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error('Get booking by ID controller error:', error);
    res.status(500).json({ message: 'Server error retrieving booking details.' });
  }
};

// Controller to cancel a booking
exports.cancelBooking = async (req, res) => {
  const { booking_id } = req.params;
  const userId = req.user.user_id; // From authMiddleware

   if (!booking_id || isNaN(parseInt(booking_id))) {
      return res.status(400).json({ message: 'Invalid booking ID provided.' });
  }

  try {
    // The model's cancel method includes ownership check and transaction logic
    await Booking.cancel(parseInt(booking_id), userId);
    res.status(200).json({ message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('Cancel booking controller error:', error);
     // Provide specific feedback if possible
    if (error.message.includes('not found') || error.message.includes('authorized') || error.message.includes('already cancelled')) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during booking cancellation.' });
  }
};
