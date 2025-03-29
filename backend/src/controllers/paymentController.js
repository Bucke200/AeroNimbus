const Payment = require('../models/Payment');
const Booking = require('../models/Booking'); // To potentially fetch booking details like amount

// Controller to process a mock payment for a booking
exports.processMockPayment = async (req, res) => {
  // bookingId could come from route params or request body
  const { bookingId, paymentMethod, cardDetails } = req.body;
  const userId = req.user.user_id; // From authMiddleware

  // Basic validation
  if (!bookingId || !paymentMethod || !cardDetails || !cardDetails.number) {
    return res.status(400).json({ message: 'Missing required payment details: bookingId, paymentMethod, cardDetails (with number).' });
  }
   if (isNaN(parseInt(bookingId))) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
  }
   if (!['credit_card', 'debit_card'].includes(paymentMethod)) {
       return res.status(400).json({ message: 'Invalid payment method.' });
   }

  // Basic card number format check (very basic)
  const cardNumber = cardDetails.number.replace(/\s+/g, ''); // Remove spaces
  if (!/^\d{13,19}$/.test(cardNumber)) {
      return res.status(400).json({ message: 'Invalid card number format.' });
  }
  const cardNumberLast4 = cardNumber.slice(-4);


  try {
    // Optional: Verify user owns the booking before processing payment
    const booking = await Booking.findById(parseInt(bookingId));
    if (!booking) {
        return res.status(404).json({ message: 'Booking not found.' });
    }
    if (booking.user_id !== userId) {
        return res.status(403).json({ message: 'Not authorized to pay for this booking.' });
    }
     if (booking.status !== 'pending_payment') {
        return res.status(400).json({ message: `Booking status is already ${booking.status}. Payment cannot be processed.` });
    }

    // Process the mock payment using the model
    const payment = await Payment.processMockPayment(
      parseInt(bookingId),
      paymentMethod,
      cardNumberLast4,
      booking.total_price // Use the actual booking price
    );

    res.status(200).json({ message: 'Mock payment successful. Booking confirmed.', payment });

  } catch (error) {
    console.error('Mock payment controller error:', error);
     // Provide specific feedback if possible
    if (error.message.includes('not found') || error.message.includes('status is already')) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during mock payment processing.' });
  }
};

// Optional: Controller to get payment status for a booking
exports.getPaymentStatus = async (req, res) => {
    const { booking_id } = req.params;
    const userId = req.user.user_id;

    if (!booking_id || isNaN(parseInt(booking_id))) {
      return res.status(400).json({ message: 'Invalid booking ID provided.' });
    }

    try {
        // Verify user owns the booking first
        const booking = await Booking.findById(parseInt(booking_id));
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        if (booking.user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to view payment for this booking.' });
        }

        const payment = await Payment.findByBookingId(parseInt(booking_id));
        if (!payment) {
            // If no payment record, the status is implicitly pending or failed pre-payment
             return res.status(200).json({ bookingStatus: booking.status, paymentStatus: 'pending' });
        }

        res.status(200).json({ bookingStatus: booking.status, payment: payment });

    } catch (error) {
        console.error('Get payment status controller error:', error);
        res.status(500).json({ message: 'Server error retrieving payment status.' });
    }
};
