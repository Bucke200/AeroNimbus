const pool = require('../config/db');

const Airport = {
  /**
   * Fetches all airports from the database.
   * @returns {Promise<Array<object>>} An array of airport objects.
   */
  async findAll() {
    const sql = 'SELECT airport_code, name, city, country FROM AIRPORTS ORDER BY city, name';
    const [rows] = await pool.execute(sql);
    return rows;
  },

  /**
   * Finds an airport by its code.
   * @param {string} airportCode - The 3-letter IATA code.
   * @returns {Promise<object|null>} The airport object if found, otherwise null.
   */
  async findByCode(airportCode) {
    const sql = 'SELECT airport_code, name, city, country FROM AIRPORTS WHERE airport_code = ?';
    const [rows] = await pool.execute(sql, [airportCode]);
    return rows.length > 0 ? rows[0] : null;
  }

  // Add methods for creating/updating airports if admin functionality is needed later
};

module.exports = Airport;
