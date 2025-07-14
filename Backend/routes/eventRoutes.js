import express from 'express';
import {createApproval,getEvents,getEventById,updateEvent,deleteEvent, removeUserFromEvent , getUpcomingEvents , getExpiredEvents, getPaginatedEvents} from '../controllers/eventController.js';

import { registerForEvent , getRegisteredEvents , deregisterEvent , getEventDetails } from '../controllers/userActivityController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';



const router = express.Router();
// router.use(authenticateToken);


router.get('/upcoming' ,authenticateToken, getUpcomingEvents);
router.get('/expired' ,authenticateToken, getExpiredEvents);
router.get('/paginatedEvents',getPaginatedEvents ); 


// Create new event
/**
 * @swagger
 * /events/:
 *   post:
 *     summary: Create a new event approval request
 *     tags:
 *       - Events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - maxRegistrations
 *               - createdBy
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               timeSlot:
 *                 type: string
 *               duration:
 *                 type: string
 *               location:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               maxRegistrations:
 *                 type: integer
 *               createdBy:
 *                 type: string
 *               artist:
 *                 type: string
 *               organization:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Bad request (missing fields)
 *       500:
 *         description: Server error
 */
router.post('/',authenticateToken, createApproval);


/**
 * @swagger
 * /events/register:
 *   post:
 *     summary: Register user for an event
 *     tags:
 *       - Registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - eventId
 *             properties:
 *               userId:
 *                 type: string
 *               eventId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully registered
 *       400:
 *         description: Validation error or already registered
 *       500:
 *         description: Server error
 */
router.post('/register',authenticateToken, registerForEvent);


/**
 * @swagger
 * /events/registered-events/{userId}:
 *   get:
 *     summary: Get all events registered by a user
 *     tags:
 *       - Registration
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully fetched registered events
 *       400:
 *         description: User ID missing or invalid
 *       500:
 *         description: Server error
 */
router.get('/registered-events/:userId', authenticateToken,getRegisteredEvents);


/**
 * @swagger
 * /events/deregister:
 *   delete:
 *     summary: Deregister user from event
 *     tags:
 *       - Registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - eventId
 *             properties:
 *               userId:
 *                 type: string
 *               eventId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully deregistered
 *       400:
 *         description: Validation error
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
router.delete('/deregister',authenticateToken, deregisterEvent);


/**
 * @swagger
 * /events/registered-users/{eventId}:
 *   get:
 *     summary: Get all users registered for a specific event
 *     tags:
 *       - Registration
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully fetched registered users
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get('/registered-users/:eventId',authenticateToken, getEventDetails);


/**
 * @swagger
 * /events/removeuser/{eventId}/users/{userId}:
 *   delete:
 *     summary: Remove a specific user from an event
 *     tags:
 *       - Registration
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User removed successfully
 *       404:
 *         description: Registration not found
 *       500:
 *         description: Server error
 */
router.delete('/removeuser/:eventId/users/:userId',authenticateToken, removeUserFromEvent);


/**
 * @swagger
 * /events/:
 *   get:
 *     summary: Get all events (not deleted)
 *     tags:
 *       - Events
 *     responses:
 *       200:
 *         description: Events fetched successfully
 *       500:
 *         description: Server error
 */
router.get('/',authenticateToken, getEvents);


/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by user ID
 *     tags:
 *       - Events
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Events fetched successfully
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Server error
 */
router.get('/:id',authenticateToken, getEventById);


/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update event details
 *     tags:
 *       - Events
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Invalid event ID
 *       404:
 *         description: Event not found or already deleted
 *       500:
 *         description: Server error
 */
router.put('/:id',authenticateToken, updateEvent);


/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Soft delete event
 *     tags:
 *       - Events
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event soft-deleted successfully
 *       400:
 *         description: Invalid event ID
 *       404:
 *         description: Event not found or already deleted
 *       500:
 *         description: Server error
 */
router.delete('/:id',authenticateToken, deleteEvent);


export default router;
