const pool = require('../config/db');
const Booking = require('./Booking'); // Needed to update booking status

const Payment = {
  /**
   * Creates a payment record and updates the associated booking's status to 'confirmed'.
   * This is part of the mock payment process.
   * @param {number} bookingId - The ID of the booking being paid for.
   * @param {string} paymentMethod - e.g., 'credit_card', 'debit_card'.
   * @param {string} cardNumberLast4 - Last 4 digits of the card (mock).
   * @param {number} amount - The amount paid (should match booking total).
   * @returns {Promise<object>} The newly created payment record.
   */
  async processMockPayment(bookingId, paymentMethod, cardNumberLast4, amount) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Verify the booking exists and is pending payment (optional but good practice)
      const [bookingRows] = await connection.execute(
        'SELECT status, total_price FROM BOOKINGS WHERE booking_id = ? FOR UPDATE',
        [bookingId]
      );
      if (bookingRows.length === 0) {
        throw new Error('Booking not found.');
      }
      const booking = bookingRows[0];
      if (booking.status !== 'pending_payment') {
        throw new Error(`Booking status is already ${booking.status}.`);
      }
      // Optional: Verify amount matches booking total_price
      if (parseFloat(booking.total_price) !== parseFloat(amount)) {
          console.warn(`Payment amount ${amount} does not match booking total ${booking.total_price} for booking ${bookingId}`);
          // Decide whether to throw an error or proceed. For mock, let's proceed but log.
          // throw new Error('Payment amount does not match booking total.');
      }


      // 2. Create the payment record (simulating success)
      const paymentSql = `
        INSERT INTO PAYMENTS (booking_id, payment_method, card_number_last4, amount, status, transaction_id, payment_time)
        VALUES (?, ?, ?, ?, 'success', ?, NOW())
      `;
      // Generate a mock transaction ID
      const mockTransactionId = `mock_txn_${Date.now()}`;
      const [paymentResult] = await connection.execute(paymentSql, [
        bookingId,
        paymentMethod,
        cardNumberLast4, // Store only last 4
        amount,
        mockTransactionId
      ]);
      const newPaymentId = paymentResult.insertId;

      // 3. Update the booking status to 'confirmed'
      const updateBookingResult = await Booking.updateStatus(bookingId, 'confirmed', connection);
       if (updateBookingResult.affectedRows === 0) {
           throw new Error('Failed to update booking status to confirmed.');
       }

      // 4. Commit transaction
      await connection.commit();

      // 5. Fetch and return the newly created payment details
      const [newPaymentRows] = await connection.execute('SELECT * FROM PAYMENTS WHERE payment_id = ?', [newPaymentId]);
      return newPaymentRows[0];

    } catch (error) {
      await connection.rollback();
      console.error("Mock payment processing error:", error);
      throw error;
    } finally {
      connection.release();
    }
  },

   /**
   * Finds a payment by its booking ID.
   * @param {number} bookingId - The ID of the associated booking.
   * @returns {Promise<object|null>} The payment object if found, otherwise null.
   */
  async findByBookingId(bookingId) {
    const sql = 'SELECT * FROM PAYMENTS WHERE booking_id = ?';
    const [rows] = await pool.execute(sql, [bookingId]);
    return rows.length > 0 ? rows[0] : null;
  }
};

module.exports = Payment;
