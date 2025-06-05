import express from 'express';
import { createLocation, getAllLocations } from '../controllers/locationController.js';
// import asyncHandler from 'express-async-handler';

const router = express.Router();

// POST /api/locations - Create new location
router.post('/',createLocation);

// GET /api/locations - Get all locations
router.get('/', getAllLocations);

export default router;
