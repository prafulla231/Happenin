import express from 'express';
import { createLocation, getAllLocations } from '../controllers/locationController.js';
import { bookLocation , cancelBooking } from '../controllers/bookingController.js';
// import asyncHandler from 'express-async-handler';

const router = express.Router();

// POST /api/locations - Create new location
router.post('/',createLocation);

// GET /api/locations - Get all locations
router.get('/', getAllLocations);

router.post('/book', bookLocation);

router.post('/cancel', cancelBooking);



export default router;
