const pool = require('../config/db');

const Flight = {
  /**
   * Searches for flights based on criteria.
   * Includes details from the AIRPORTS table for departure and arrival.
   * @param {string} fromAirport - Departure airport code (e.g., 'SFO').
   * @param {string} toAirport - Arrival airport code (e.g., 'JFK').
   * @param {string} departureDate - Departure date (e.g., 'YYYY-MM-DD').
   * @returns {Promise<Array<object>>} An array of flight objects matching the criteria.
   */
  async search(fromAirport, toAirport, departureDate) {
    // Basic query structure
    let sql = `
      SELECT
        f.flight_id,
        f.flight_number,
        f.departure_airport_code,
        dep_ap.name AS departure_airport_name,
        dep_ap.city AS departure_city,
        dep_ap.country AS departure_country,
        f.arrival_airport_code,
        arr_ap.name AS arrival_airport_name,
        arr_ap.city AS arrival_city,
        arr_ap.country AS arrival_country,
        f.departure_time,
        f.arrival_time,
        f.price,
        f.available_seats
      FROM FLIGHTS f
      JOIN AIRPORTS dep_ap ON f.departure_airport_code = dep_ap.airport_code
      JOIN AIRPORTS arr_ap ON f.arrival_airport_code = arr_ap.airport_code
      WHERE f.departure_airport_code = ?
        AND f.arrival_airport_code = ?
        -- Search within a 3-day window: day before, selected day, day after
        AND DATE(f.departure_time) BETWEEN DATE_SUB(?, INTERVAL 1 DAY) AND DATE_ADD(?, INTERVAL 1 DAY)
        AND f.available_seats > 0 -- Only show flights with available seats
      ORDER BY f.departure_time ASC
    `;
    // Use the same date parameter twice for DATE_SUB and DATE_ADD
    const params = [fromAirport, toAirport, departureDate, departureDate];

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  /**
   * Finds a specific flight by its ID, including airport details.
   * @param {number} flightId - The ID of the flight.
   * @returns {Promise<object|null>} The flight object if found, otherwise null.
   */
  async findById(flightId) {
    const sql = `
      SELECT
        f.flight_id,
        f.flight_number,
        f.departure_airport_code,
        dep_ap.name AS departure_airport_name,
        dep_ap.city AS departure_city,
        dep_ap.country AS departure_country,
        f.arrival_airport_code,
        arr_ap.name AS arrival_airport_name,
        arr_ap.city AS arrival_city,
        arr_ap.country AS arrival_country,
        f.departure_time,
        f.arrival_time,
        f.price,
        f.total_seats,
        f.available_seats
      FROM FLIGHTS f
      JOIN AIRPORTS dep_ap ON f.departure_airport_code = dep_ap.airport_code
      JOIN AIRPORTS arr_ap ON f.arrival_airport_code = arr_ap.airport_code
      WHERE f.flight_id = ?
    `;
    const [rows] = await pool.execute(sql, [flightId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Updates the available seats for a flight.
   * Typically used when a booking is made or cancelled.
   * @param {number} flightId - The ID of the flight to update.
   * @param {number} changeInSeats - The number of seats to add (positive for cancellation) or remove (negative for booking).
   * @returns {Promise<object>} The result object from the database operation.
   */
  async updateAvailableSeats(flightId, changeInSeats) {
    // Ensure atomicity and prevent negative seats using constraints or checks if necessary
    // For simplicity, we directly update here. Consider transactions for booking flow.
    const sql = 'UPDATE FLIGHTS SET available_seats = available_seats + ? WHERE flight_id = ? AND available_seats + ? >= 0';
    const [result] = await pool.execute(sql, [changeInSeats, flightId, changeInSeats]);
    return result;
  }

  // Add methods for creating/updating flights if admin functionality is needed later
};

module.exports = Flight;
