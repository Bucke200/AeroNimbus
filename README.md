# Airline Booking System

This is a full-stack web application for booking airline flights. It features a React frontend and a Node.js/Express backend with a MySQL database.

## Features

*   User Authentication (Register/Login)
*   Flight Search
*   View Flight Details
*   Book Flights
*   View User Bookings
*   Manage User Profile
*   Payment Processing (Conceptual)

## Technology Stack

**Backend:**
*   Node.js
*   Express.js
*   MySQL (using `mysql2`)
*   JSON Web Tokens (JWT) for authentication (`jsonwebtoken`)
*   Password Hashing (`bcryptjs`)
*   Environment Variables (`dotenv`)
*   CORS (`cors`)

**Frontend:**
*   React
*   React Router (`react-router-dom`) for navigation
*   Axios for API calls
*   CSS for styling

## Setup and Installation

**Prerequisites:**
*   Node.js and npm installed
*   MySQL server running

**1. Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd airline
   ```

**2. Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   *   Create a `.env` file in the `backend` directory.
   *   Add the following environment variables (replace with your actual values):
      ```
      DB_HOST=your_db_host
      DB_USER=your_db_user
      DB_PASSWORD=your_db_password
      DB_NAME=your_db_name
      JWT_SECRET=your_jwt_secret_key
      PORT=5000 # Or your desired backend port
      ```
   *   Ensure your MySQL database schema matches the models defined in `backend/src/models/`. You might need to create the tables manually.

**3. Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```
   *   The frontend is configured to connect to the backend API, likely assuming it runs on `http://localhost:5000` (check `frontend/src/services/api.js` or similar if needed).

## Running the Application

**1. Start the Backend Server:**
   ```bash
   cd backend
   npm start
   ```
   The backend server will typically run on `http://localhost:5000`.

**2. Start the Frontend Development Server:**
   ```bash
   cd ../frontend
   npm start
   ```
   The frontend application will open in your browser, usually at `http://localhost:3000`.

## Project Structure

*   `/backend`: Contains the Node.js/Express server code.
    *   `/src/config`: Database configuration.
    *   `/src/controllers`: Request handling logic.
    *   `/src/middleware`: Custom middleware (e.g., authentication).
    *   `/src/models`: Database models/schemas.
    *   `/src/routes`: API route definitions.
    *   `server.js`: Main server entry point.
*   `/frontend`: Contains the React client-side code.
    *   `/public`: Static assets and `index.html`.
    *   `/src`: React application source code.
        *   `/components`: Reusable UI components.
        *   `/contexts`: React context providers (e.g., AuthContext).
        *   `/hooks`: Custom React hooks.
        *   `/pages`: Page-level components.
        *   `/services`: API interaction logic.
        *   `App.js`: Main application component with routing.
        *   `index.js`: Application entry point.
