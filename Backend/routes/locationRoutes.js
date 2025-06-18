import express from 'express';
import { createLocation, getAllLocations , viewLocations , deleteLocation } from '../controllers/locationController.js';
import { bookLocation , cancelBooking } from '../controllers/bookingController.js';
// import asyncHandler from 'express-async-handler';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
// router.use(authenticateToken);

/**
 * @swagger
 * /locations/:
 *   post:
 *     summary: Create a new location
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - state
 *               - city
 *               - placeName
 *               - address
 *               - maxSeatingCapacity
 *             properties:
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *               placeName:
 *                 type: string
 *               address:
 *                 type: string
 *               maxSeatingCapacity:
 *                 type: integer
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Location created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/',authenticateToken, createLocation);


/**
 * @swagger
 * /locations/:
 *   get:
 *     summary: Get all locations
 *     tags:
 *       - Locations
 *     responses:
 *       200:
 *         description: Successfully fetched all locations
 *       500:
 *         description: Server error
 */
router.get('/',authenticateToken, getAllLocations);


/**
 * @swagger
 * /locations/book:
 *   post:
 *     summary: Book a location
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               locationId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               timeSlot:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location booked successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/book', authenticateToken,bookLocation);


/**
 * @swagger
 * /locations/cancel:
 *   post:
 *     summary: Cancel booking
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/cancel', authenticateToken,cancelBooking);


/**
 * @swagger
 * /locations/getLocations:
 *   get:
 *     summary: View locations (duplicate of GET /)
 *     tags:
 *       - Locations
 *     responses:
 *       200:
 *         description: Locations fetched successfully
 *       500:
 *         description: Server error
 */
router.get('/getLocations',authenticateToken, viewLocations);


/**
 * @swagger
 * /locations/deleteLocation:
 *   delete:
 *     summary: Delete location by state, city, and placeName
 *     tags:
 *       - Locations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - state
 *               - city
 *               - placeName
 *             properties:
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *               placeName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Location not found
 *       500:
 *         description: Server error
 */
router.delete('/deleteLocation', authenticateToken,deleteLocation);


export default router;
