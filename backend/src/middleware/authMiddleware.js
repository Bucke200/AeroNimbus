const jwt = require('jsonwebtoken');
const User = require('../models/User');
// dotenv should be loaded in server.js

const JWT_SECRET = process.env.JWT_SECRET;

exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from the token payload (using the user ID)
      // Exclude password hash from being attached to the request object
      req.user = await User.findById(decoded.id);

      if (!req.user) {
          // Handle case where user associated with token no longer exists
          return res.status(401).json({ message: 'Not authorized, user not found.' });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Token verification failed:', error.message);
      // Handle different JWT errors specifically if needed (e.g., TokenExpiredError)
      if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Not authorized, token expired.' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided.' });
  }
};

// Optional: Middleware for role-based access control
// exports.authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!req.user || !roles.includes(req.user.role)) { // Assumes user object has a 'role' property
//       return res.status(403).json({ message: `User role ${req.user?.role} is not authorized to access this route` });
//     }
//     next();
//   };
// };
