const pool = require('../config/db');

const Booking = {
  /**
   * Creates a new booking and updates flight availability within a transaction.
   * @param {number} userId - ID of the user making the booking.
   * @param {number} flightId - ID of the flight being booked.
   * @param {number} numSeats - Number of seats to book.
   * @returns {Promise<object>} The newly created booking object or throws error.
   */
  async create(userId, flightId, numSeats) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Check flight existence and available seats
      const [flightRows] = await connection.execute(
        'SELECT price, available_seats FROM FLIGHTS WHERE flight_id = ? FOR UPDATE', // Lock row
        [flightId]
      );

      if (flightRows.length === 0) {
        throw new Error('Flight not found.');
      }

      const flight = flightRows[0];
      if (flight.available_seats < numSeats) {
        throw new Error('Not enough available seats on this flight.');
      }

      // 2. Calculate total price
      const totalPrice = flight.price * numSeats;

      // 3. Create the booking record
      const bookingSql = `
        INSERT INTO BOOKINGS (user_id, flight_id, num_seats, total_price, status, booking_time)
        VALUES (?, ?, ?, ?, 'pending_payment', NOW())
      `;
      const [bookingResult] = await connection.execute(bookingSql, [userId, flightId, numSeats, totalPrice]);
      const newBookingId = bookingResult.insertId;

      // 4. Update available seats on the flight
      const updateSeatsSql = 'UPDATE FLIGHTS SET available_seats = available_seats - ? WHERE flight_id = ?';
      const [updateResult] = await connection.execute(updateSeatsSql, [numSeats, flightId]);

      if (updateResult.affectedRows === 0) {
          // Should not happen if flight existed, but good safety check
          throw new Error('Failed to update flight seat count.');
      }

      // 5. Commit transaction
      await connection.commit();

      // 6. Fetch and return the newly created booking details
      const newBooking = await this.findById(newBookingId, connection); // Use the same connection
      return newBooking;

    } catch (error) {
      await connection.rollback(); // Rollback on any error
      console.error("Booking creation error:", error);
      throw error; // Re-throw the error to be handled by the controller
    } finally {
      connection.release(); // Always release connection
    }
  },

  /**
   * Finds bookings for a specific user.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<Array<object>>} An array of booking objects with flight details.
   */
  async findByUserId(userId) {
    const sql = `
      SELECT
        b.booking_id, b.booking_time, b.status, b.num_seats, b.total_price,
        f.flight_id, f.flight_number, f.departure_time, f.arrival_time,
        dep_ap.city AS departure_city, dep_ap.airport_code AS departure_airport_code,
        arr_ap.city AS arrival_city, arr_ap.airport_code AS arrival_airport_code
      FROM BOOKINGS b
      JOIN FLIGHTS f ON b.flight_id = f.flight_id
      JOIN AIRPORTS dep_ap ON f.departure_airport_code = dep_ap.airport_code
      JOIN AIRPORTS arr_ap ON f.arrival_airport_code = arr_ap.airport_code
      WHERE b.user_id = ?
      ORDER BY b.booking_time DESC
    `;
    const [rows] = await pool.execute(sql, [userId]);
    return rows;
  },

  /**
   * Finds a specific booking by its ID. Can optionally use an existing connection.
   * @param {number} bookingId - The ID of the booking.
   * @param {object} [connection=pool] - Optional existing DB connection.
   * @returns {Promise<object|null>} The booking object with flight details if found, otherwise null.
   */
  async findById(bookingId, connection = pool) {
     const sql = `
      SELECT
        b.booking_id, b.user_id, b.booking_time, b.status, b.num_seats, b.total_price,
        f.flight_id, f.flight_number, f.departure_time, f.arrival_time, f.price AS price_per_seat,
        dep_ap.city AS departure_city, dep_ap.airport_code AS departure_airport_code, dep_ap.name AS departure_airport_name,
        arr_ap.city AS arrival_city, arr_ap.airport_code AS arrival_airport_code, arr_ap.name AS arrival_airport_name
      FROM BOOKINGS b
      JOIN FLIGHTS f ON b.flight_id = f.flight_id
      JOIN AIRPORTS dep_ap ON f.departure_airport_code = dep_ap.airport_code
      JOIN AIRPORTS arr_ap ON f.arrival_airport_code = arr_ap.airport_code
      WHERE b.booking_id = ?
    `;
    const [rows] = await connection.execute(sql, [bookingId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Updates the status of a booking. Used for confirming payment or cancellation.
   * @param {number} bookingId - The ID of the booking.
   * @param {string} status - The new status ('confirmed', 'cancelled').
   * @param {object} [connection=pool] - Optional existing DB connection.
   * @returns {Promise<object>} The result object from the database operation.
   */
  async updateStatus(bookingId, status, connection = pool) {
    const sql = 'UPDATE BOOKINGS SET status = ? WHERE booking_id = ?';
    const [result] = await connection.execute(sql, [status, bookingId]);
    return result;
  },

  /**
   * Cancels a booking and restores flight availability within a transaction.
   * @param {number} bookingId - The ID of the booking to cancel.
   * @param {number} userId - The ID of the user requesting cancellation (for verification).
   * @returns {Promise<object>} The result of the status update.
   */
   async cancel(bookingId, userId) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Find the booking and verify ownership and status
        const booking = await this.findById(bookingId, connection);

        if (!booking) {
            throw new Error('Booking not found.');
        }
        if (booking.user_id !== userId) {
            throw new Error('User not authorized to cancel this booking.');
        }
        // Prevent cancelling already cancelled or potentially completed bookings
        if (booking.status === 'cancelled') {
            throw new Error('Booking is already cancelled.');
        }
         if (booking.status === 'confirmed') {
             // Policy decision: Allow cancelling confirmed bookings? Maybe with penalties?
             // For now, let's allow cancelling confirmed (before flight time ideally)
             console.log(`Cancelling confirmed booking ${bookingId}`);
         }

        // 2. Update booking status to 'cancelled'
        const updateResult = await this.updateStatus(bookingId, 'cancelled', connection);
         if (updateResult.affectedRows === 0) {
             throw new Error('Failed to update booking status.');
         }

        // 3. Restore available seats on the flight
        const restoreSeatsSql = 'UPDATE FLIGHTS SET available_seats = available_seats + ? WHERE flight_id = ?';
        // Ensure we don't exceed total_seats if something went wrong, though unlikely
        // const restoreSeatsSql = 'UPDATE FLIGHTS SET available_seats = LEAST(total_seats, available_seats + ?) WHERE flight_id = ?';
        const [restoreResult] = await connection.execute(restoreSeatsSql, [booking.num_seats, booking.flight_id]);

        if (restoreResult.affectedRows === 0) {
            // Flight might have been deleted? Log warning.
            console.warn(`Could not restore seats for flight ${booking.flight_id} during booking ${bookingId} cancellation.`);
            // Decide if this should fail the transaction. For now, let's allow cancellation even if seat restore fails.
        }

        // 4. Commit transaction
        await connection.commit();
        return updateResult;

    } catch (error) {
        await connection.rollback();
        console.error("Booking cancellation error:", error);
        throw error;
    } finally {
        connection.release();
    }
  }

};

module.exports = Booking;
