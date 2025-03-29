const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  /**
   * Creates a new user in the database.
   * @param {string} username - The user's username.
   * @param {string} email - The user's email address.
   * @param {string} password - The user's plain text password.
   * @param {string} firstName - The user's first name.
   * @param {string} lastName - The user's last name.
   * @returns {Promise<object>} The result object from the database operation.
   */
  async create(username, email, password, firstName, lastName) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const sql = 'INSERT INTO USERS (username, email, password_hash, first_name, last_name, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
    const [result] = await pool.execute(sql, [username, email, passwordHash, firstName, lastName]);
    return result;
  },

  /**
   * Finds a user by their username.
   * @param {string} username - The username to search for.
   * @returns {Promise<object|null>} The user object if found, otherwise null.
   */
  async findByUsername(username) {
    const sql = 'SELECT * FROM USERS WHERE username = ?';
    const [rows] = await pool.execute(sql, [username]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Finds a user by their email address.
   * @param {string} email - The email address to search for.
   * @returns {Promise<object|null>} The user object if found, otherwise null.
   */
  async findByEmail(email) {
    const sql = 'SELECT * FROM USERS WHERE email = ?';
    const [rows] = await pool.execute(sql, [email]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Finds a user by their ID.
   * @param {number} userId - The ID of the user to search for.
   * @returns {Promise<object|null>} The user object if found, otherwise null.
   */
  async findById(userId) {
    const sql = 'SELECT user_id, username, email, first_name, last_name, created_at FROM USERS WHERE user_id = ?';
    const [rows] = await pool.execute(sql, [userId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Compares a plain text password with the user's stored hash.
   * @param {string} candidatePassword - The plain text password to check.
   * @param {string} userPasswordHash - The hashed password stored in the database.
   * @returns {Promise<boolean>} True if the passwords match, false otherwise.
   */
  async comparePassword(candidatePassword, userPasswordHash) {
    return bcrypt.compare(candidatePassword, userPasswordHash);
  }
};

module.exports = User;
