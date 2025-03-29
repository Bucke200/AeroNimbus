const mysql = require('mysql2/promise');
// dotenv should be loaded in server.js

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'airline_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection (optional, but good for debugging)
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to database:', err.message);
    // Exit process if DB connection fails on startup? Maybe too aggressive.
    // process.exit(1);
  });

module.exports = pool;
