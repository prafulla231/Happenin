import asyncHandler from 'express-async-handler';
import { Location } from '../models/locationModel.js';

// @desc    Create a new location
// @route   POST /api/locations
// @access  Private/Admin
export const createLocation = asyncHandler(async (req, res) => {
  console.log('🟢 Received location creation request');

  const {
    state,
    city,
    placeName,
    address,
    maxSeatingCapacity,
    amenities
  } = req.body;

  console.log('🔍 Request Body:', req.body);

  // Validate required fields
  if (!state || !city || !placeName || !address || !maxSeatingCapacity) {
    console.error('❌ Missing required fields');
    res.status(400).json({ message: 'Please fill all required fields' });
    return;
  }

  // Ensure `req.user` is populated (e.g. by an auth middleware)
//   if (!req.user || !req.user._id) {
//     console.error('🔒 Unauthorized: User not authenticated');
//     res.status(401).json({ message: 'Unauthorized access' });
//     return;
//   }

  // Create and save the location
  const location = new Location({
    state,
    city,
    placeName,
    address,
    maxSeatingCapacity,
    amenities,
  
  });

  const createdLocation = await location.save();
  console.log('✅ Location created successfully:', createdLocation);

  res.status(201).json(createdLocation);
});

// @desc    Get all locations
// @route   GET /api/locations
// @access  Private/Admin
export const getAllLocations = asyncHandler(async (req, res) => {
  // console.log('📥 Fetching all locations');
  const locations = await Location.find({}, {
    bookings: 0,
    createdAt: 0,
    updatedAt: 0,
    __v: 0
  });
  res.status(200).json(locations);
});

// DELETE /locations/delete
export const deleteLocation = async (req, res) => {
  const { state, city, placeName } = req.body;

  if (!state || !city || !placeName) {
    return res.status(400).json({ message: "Missing required fields: state, city, or placeName" });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await Location.findOneAndDelete({ state, city, placeName });

    if (!result) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.status(200).json({ message: "Location deleted successfully", deletedLocation: result });
  } catch (err) {
    console.error("Delete location error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// GET /locations
export const viewLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    res.status(200).json({ data: locations });
  } catch (err) {
    console.error("Get all locations error:", err);
    res.status(500).json({ message: "Failed to fetch locations" });
  }
};

