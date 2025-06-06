import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { apiResponse } from '../utils/apiResponse.js';
import { apiError } from '../utils/apiError.js';
import mongoose from 'mongoose';

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      timeSlot,
      duration,
      location,
      category,
      price,
      // image,
      // poster,
      maxRegistrations,
      createdBy,
      artist,
      organization,
    } = req.body;

    // console.log('Creating event with data:', req.body);
    console.log('Authenticated user:', req.user);

    // Basic validations
    if (!title || !date || !maxRegistrations || !createdBy) {
      return apiError(res, 400, 'Title, Date, MaxRegistrations and CreatedBy are required fields.');
    }

    // Validate ObjectId for createdBy
    // if (!mongoose.Types.ObjectId.isValid(createdBy)) {
    //   return apiError(res, 400, 'Invalid createdBy user ID.');
    // }

    // Validate date is valid date
    if (isNaN(Date.parse(date))) {
      return apiError(res, 400, 'Invalid date format.');
    }

    // Validate price is number >= 0 if provided
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return apiError(res, 400, 'Price must be a positive number.');
    }

    // Validate maxRegistrations is positive integer
    if (!Number.isInteger(maxRegistrations) || maxRegistrations <= 0) {
      return apiError(res, 400, 'maxRegistrations must be a positive integer.');
    }

    // Create event object
    const newEvent = new Event({
      title,
      description,
      date,
      timeSlot,
      duration,
      location,
      category,
      price: price || 0,
      // image,
      // poster,
      maxRegistrations,
      currentRegistrations: 0, // Initialize to 0
      createdBy,
      artist,
      organization,
    });

    console.log('Creating new event:', newEvent);

    await newEvent.save();

    return apiResponse(res, 201, 'Event created successfully', newEvent);
  } catch (error) {
    console.error('❌ Create Event error:', error.message);
    return apiError(res, 500, 'Server error while creating event', error);
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name email role');
    return apiResponse(res, 200, 'Events fetched successfully', events);
  } catch (error) {
    console.error('❌ Get Events error:', error.message);
    return apiError(res, 500, 'Server error while fetching events', error);
  }
};

export const getEventById = async (req, res) => {
   try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, 'Invalid user ID.');
    }

    const events = await Event.find({ createdBy: id }).populate('createdBy', 'name email role');

    return apiResponse(res, 200, 'Events fetched successfully', events);
  } catch (error) {
    console.error('❌ Error fetching events by user ID:', error.message);
    return apiError(res, 500, 'Server error while fetching events', error);
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, 'Invalid event ID.');
    }

    // Optional: Validate updateData fields here if needed

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent) {
      return apiError(res, 404, 'Event not found.');
    }

    return apiResponse(res, 200, 'Event updated successfully', updatedEvent);
  } catch (error) {
    console.error('❌ Update Event error:', error.message);
    return apiError(res, 500, 'Server error while updating event', error);
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, 'Invalid event ID.');
    }

    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return apiError(res, 404, 'Event not found.');
    }

    return apiResponse(res, 200, 'Event deleted successfully', deletedEvent);
  } catch (error) {
    console.error('❌ Delete Event error:', error.message);
    return apiError(res, 500, 'Server error while deleting event', error);
  }
};

export const removeUserFromEvent = async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    const deleted = await Registration.findOneAndDelete({
      eventId: new mongoose.Types.ObjectId(eventId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Optionally, decrement currentRegistrations in Event
    await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: -1 } });

    return res.status(200).json({ message: 'User removed from event successfully' });
  } catch (error) {
    console.error('Error removing user from event:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
