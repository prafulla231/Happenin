import express from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';

const router = express.Router();

// Create new event
router.post('/', createEvent);

// Get all events
router.get('/', getEvents);

// Get event by ID
router.get('/:id', getEventById);

// Update event by ID
router.put('/:id', updateEvent);

// Delete event by ID
router.delete('/:id', deleteEvent);

export default router;
