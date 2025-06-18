import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { apiResponse } from '../utils/apiResponse.js';
import { apiError } from '../utils/apiError.js';
import mongoose from 'mongoose';
import { Approval } from '../models/approval.js';

// CREATE EVENT
export const createApproval = async (req, res) => {
  try {
    const {
      title, description, date, timeSlot, duration, location,
      category, price, maxRegistrations, createdBy,  
      artist, organization 
    } = req.body;

    // console.log('Authenticated user:', req.user);

    if (!title || !date || !maxRegistrations || !createdBy) {
      return apiError(res, 400, 'Title, Date, MaxRegistrations and CreatedBy are required fields.');
    }

    if (isNaN(Date.parse(date))) {
      return apiError(res, 400, 'Invalid date format.');
    }

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return apiError(res, 400, 'Price must be a positive number.');
    }

    if (!Number.isInteger(maxRegistrations) || maxRegistrations <= 0) {
      return apiError(res, 400, 'maxRegistrations must be a positive integer.');
    }

    const newEvent = new Approval({
      title,
      description,
      date,
      timeSlot,
      duration,
      location,
      category,
      price: price || 0,
      maxRegistrations,
      currentRegistrations: 0,
      createdBy,
      artist,
      organization,
       // Soft delete flag
    });

    await newEvent.save();

    return apiResponse(res, 201, 'Event created successfully', newEvent);
  } catch (error) {
    console.error('❌ Create Event error:', error.message);
    return apiError(res, 500, 'Server error while creating event', error);
  }
};

// GET ALL EVENTS (only not deleted)
export const getEvents = async (req, res) => {
  try {
    console.log("Get events is called");
    const events = await Event.find({ isDeleted: false }).populate('createdBy', 'name email role');
    return apiResponse(res, 200, 'Events fetched successfully', events);
  } catch (error) {
    console.error('❌ Get Events error:', error.message);
    return apiError(res, 500, 'Server error while fetching events', error);
  }
};
export const getUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.find({ 
      date: { $gte: new Date() }, 
      isDeleted: false 
    }).sort({ date: 1 }).populate('createdBy', 'name email role');
    
    return apiResponse(res, 200, "Upcoming events fetched successfully", events);
  } catch (error) {
    console.error('❌ Get Upcoming Events error:', error.message);
    return apiError(res, 500, 'Server error while fetching upcoming events', error);
  }
};

// GET EVENTS BY USER ID (only not deleted)
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, 'Invalid user ID.');
    }

    const events = await Event.find({
      createdBy: id,
      isDeleted: false,
    }).populate('createdBy', 'name email role');

    return apiResponse(res, 200, 'Events fetched successfully', events);
  } catch (error) {
    console.error('❌ Error fetching events by user ID:', error.message);
    return apiError(res, 500, 'Server error while fetching events', error);
  }
};

// UPDATE EVENT (only if not deleted)
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, 'Invalid event ID.');
    }

    const updatedEvent = await Event.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return apiError(res, 404, 'Event not found or already deleted.');
    }

    return apiResponse(res, 200, 'Event updated successfully', updatedEvent);
  } catch (error) {
    console.error('❌ Update Event error:', error.message);
    return apiError(res, 500, 'Server error while updating event', error);
  }
};

// SOFT DELETE EVENT
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, 'Invalid event ID.');
    }

    const deletedEvent = await Event.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!deletedEvent) {
      return apiError(res, 404, 'Event not found or already deleted.');
    }

    return apiResponse(res, 200, 'Event soft-deleted successfully', deletedEvent);
  } catch (error) {
    console.error('❌ Delete Event error:', error.message);
    return apiError(res, 500, 'Server error while deleting event', error);
  }
};

// REMOVE USER FROM EVENT (optional: support soft delete in future here too)
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

    await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: -1 } });

    return res.status(200).json({ message: 'User removed from event successfully' });
  } catch (error) {
    console.error('Error removing user from event:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};



export const getExpiredEvents = async (req, res) => {
  try {
    const events = await Event.find(
      { 
        date: { $lt: new Date() },
        isDeleted: false 
      }
    )
    .sort({ date: -1 })
    .populate('createdBy', 'name email role');

    apiResponse(res, 200, "Events found", events);
    // console.log(events);
  } catch (err) {
    console.error('Error fetching expired events:', err);
    apiError(res, 500, "Server Error", []);
  }
};

