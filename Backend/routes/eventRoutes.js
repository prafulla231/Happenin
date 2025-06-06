import express from 'express';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent, removeUserFromEvent
} from '../controllers/eventController.js';

import { registerForEvent , getRegisteredEvents , deregisterEvent , getEventDetails } from '../controllers/userActivityController.js';



const router = express.Router();

// Create new event
router.post('/',createEvent);

router.post('/register', registerForEvent);
router.get('/registered-events/:userId', getRegisteredEvents);
router.delete('/deregister', deregisterEvent);
router.get('/registered-users/:eventId', getEventDetails);
router.delete('/removeuser/:eventId/users/:userId', removeUserFromEvent);





// Get all events
router.get('/', getEvents);

// Get event by ID
router.get('/:id', getEventById);

// Update event by ID
router.put('/:id', updateEvent);

// Delete event by ID
router.delete('/:id', deleteEvent);

export default router;
