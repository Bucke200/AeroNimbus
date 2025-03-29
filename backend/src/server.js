const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file in the backend directory
// Assuming the script runs with 'backend' as the working directory
dotenv.config({ path: '.env' });

// Import database connection to ensure it's initialized (logs connection status)
require('./config/db');

// Import route handlers
const authRoutes = require('./routes/authRoutes');
const flightRoutes = require('./routes/flightRoutes'); // Import flight routes
const bookingRoutes = require('./routes/bookingRoutes'); // Import booking routes
const paymentRoutes = require('./routes/paymentRoutes'); // Import payment routes
// Import other route handlers here as they are created

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend communication
app.use(express.json()); // Parse JSON request bodies

// Define API routes
app.use('/api/auth', authRoutes);
app.use('/api/flights', flightRoutes); // Mount flight routes
app.use('/api/bookings', bookingRoutes); // Mount booking routes
app.use('/api/payments', paymentRoutes); // Mount payment routes
// Mount other routes here

// Basic root route (optional)
app.get('/', (req, res) => {
  res.send('Airline Reservation System API is running...');
});

// Basic Error Handling Middleware (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5001; // Use port 5001 for backend to avoid conflict with React default 3000

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
