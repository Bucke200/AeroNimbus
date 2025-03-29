const Flight = require('../models/Flight');
const Airport = require('../models/Airport');

// Controller function to search for flights
exports.searchFlights = async (req, res) => {
  const { fromAirport, toAirport, departureDate } = req.query;

  // Basic validation
  if (!fromAirport || !toAirport || !departureDate) {
    return res.status(400).json({ message: 'Missing required search parameters: fromAirport, toAirport, departureDate.' });
  }

  // Optional: Add date validation (e.g., ensure it's a valid date format and not in the past)

  try {
    const flights = await Flight.search(fromAirport, toAirport, departureDate);
    if (flights.length === 0) {
      return res.status(404).json({ message: 'No flights found matching your criteria.' });
    }
    res.status(200).json(flights);
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ message: 'Server error during flight search.' });
  }
};

// Controller function to get details of a specific flight
exports.getFlightById = async (req, res) => {
  const { flight_id } = req.params;

  if (!flight_id || isNaN(parseInt(flight_id))) {
      return res.status(400).json({ message: 'Invalid flight ID provided.' });
  }

  try {
    const flight = await Flight.findById(parseInt(flight_id));
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found.' });
    }
    res.status(200).json(flight);
  } catch (error) {
    console.error('Get flight by ID error:', error);
    res.status(500).json({ message: 'Server error retrieving flight details.' });
  }
};

// Controller function to get a list of all airports
exports.getAirports = async (req, res) => {
  try {
    const airports = await Airport.findAll();
    res.status(200).json(airports);
  } catch (error) {
    console.error('Get airports error:', error);
    res.status(500).json({ message: 'Server error retrieving airports.' });
  }
};
