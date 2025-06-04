import { Event } from '../models/Event.js';
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
      image,
      poster,
      maxRegistrations,
      createdBy,
      artist,
      organization,
    } = req.body;

    // Basic validations
    if (!title || !date || !maxRegistrations || !createdBy) {
      return apiError(res, 400, 'Title, Date, MaxRegistrations and CreatedBy are required fields.');
    }

    // Validate ObjectId for createdBy
    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return apiError(res, 400, 'Invalid createdBy user ID.');
    }

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
      image,
      poster,
      maxRegistrations,
      createdBy,
      artist,
      organization,
    });

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
      return apiError(res, 400, 'Invalid event ID.');
    }

    const event = await Event.findById(id).populate('createdBy', 'name email role');

    if (!event) {
      return apiError(res, 404, 'Event not found.');
    }

    return apiResponse(res, 200, 'Event fetched successfully', event);
  } catch (error) {
    console.error('❌ Get Event by ID error:', error.message);
    return apiError(res, 500, 'Server error while fetching event', error);
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
