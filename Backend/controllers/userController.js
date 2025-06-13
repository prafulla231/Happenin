import { Registration } from '../models/Registration.js';
import { Event } from '../models/Event.js';
import { apiError, apiResponse } from '../utils/apiResponse.js';


export const getUserRegisteredEvents = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all registrations by this user and populate event details
    const registrations = await Registration.find({ userId }).populate('eventId');

    // Extract event details
    const events = registrations.map(reg => reg.eventId);

    return apiResponse(res, 200, 'User registered events fetched successfully', events);
  } catch (error) {
    console.error('Error fetching user registered events:', error);
    return apiError(res, 500, 'Server error', error);
  }
};
