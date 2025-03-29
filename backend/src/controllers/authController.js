const User = require('../models/User');
const jwt = require('jsonwebtoken');
// dotenv should be loaded in server.js

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
  process.exit(1); // Exit if JWT secret is missing
}

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN || '1d' // Default expiry if not set
  });
};

exports.register = async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;

  // Basic validation
  if (!username || !email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Please provide all required fields.' });
  }

  try {
    // Check if user already exists
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username already exists.' });
    }
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // Create user
    const result = await User.create(username, email, password, firstName, lastName);

    // Find the newly created user to get their ID (since create returns insert result)
    const newUser = await User.findById(result.insertId);
    if (!newUser) {
        // This case should ideally not happen if insert was successful
        return res.status(500).json({ message: 'Error retrieving user after creation.' });
    }

    // Generate token for the new user (optional: log them in immediately)
    const token = generateToken(newUser.user_id);

    res.status(201).json({
      message: 'User registered successfully.',
      token: token, // Send token so user is logged in
      user: { // Send back user info (excluding password)
        id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password.' });
  }

  try {
    // Find user by username
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // Use generic message
    }

    // Compare password
    const isMatch = await User.comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' }); // Use generic message
    }

    // Generate token
    const token = generateToken(user.user_id);

    res.status(200).json({
      message: 'Login successful.',
      token: token,
      user: { // Send back user info (excluding password)
        id: user.user_id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// Optional: Add a controller to get the current user's info based on token
exports.getMe = async (req, res) => {
    // This assumes an authentication middleware has run and attached user info to req.user
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized.' });
    }
    // req.user should contain the user object fetched by the middleware
    res.status(200).json({ user: req.user });
};
