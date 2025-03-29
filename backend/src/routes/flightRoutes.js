const express = require('express');
const flightController = require('../controllers/flightController');
// No authentication needed for searching flights or listing airports (public access)

const router = express.Router();

// @route   GET api/flights
// @desc    Search for available flights
// @access  Public
// @query   fromAirport=XXX&toAirport=YYY&departureDate=YYYY-MM-DD
router.get('/', flightController.searchFlights);

// @route   GET api/flights/airports
// @desc    Get a list of all airports
// @access  Public
router.get('/airports', flightController.getAirports); // Define before /:flight_id to avoid conflict

// @route   GET api/flights/:flight_id
// @desc    Get details for a specific flight
// @access  Public
router.get('/:flight_id', flightController.getFlightById);


module.exports = router;
