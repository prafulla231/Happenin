import { Event } from '../models/Event.js';
import { apiResponse } from '../utils/apiResponse.js';
import { apiError } from '../utils/apiError.js';
import mongoose from 'mongoose';
import { Approval } from '../models/approval.js';

export const approveEvent = async (req, res) => {
  try {
    const {
      _id, 
      title, description, date, timeSlot, duration,city,location,
      category, price, maxRegistrations, createdBy,
      artist, organization
    } = req.body;

    if (!_id) {
      return apiError(res, 400, 'Approval document ID  is required.');
    }

    if (!title || !date || !maxRegistrations || !createdBy) {
      return apiError(res, 400, 'Missing required fields.');
    }

    const newEvent = new Event({
      title,
      description,
      date,
      timeSlot,
      location,
      city,
      duration,
      category,
      price: price || 0,
      maxRegistrations,
      currentRegistrations: 0,
      createdBy,
      artist,
      organization,
      isDeleted: false,
      
    });

    await newEvent.save();

    
    const deletedApproval = await Approval.findByIdAndDelete(_id);

    if (!deletedApproval) {
      console.warn('Approval record not found for deletion.');
    }

    return apiResponse(res, 201, 'Event created and approval deleted successfully', newEvent);

  } catch (error) {
    console.error('Approval error:', error.message);
    return apiError(res, 500, 'Server error during approval.', error);
  }
};


export const viewApprovalRequest = async (req, res) => {
  try {
    const events = await Approval.find().select('-createdAt -updatedAt -__v').populate('createdBy', 'name email role');
    return apiResponse(res, 200, 'Events fetched successfully', events);
  } catch (error) {
    console.error('Get Events error:', error.message);
    return apiError(res, 500, 'Server error while fetching events', error);
  }
};

export const denyRequest = async (req, res) => {
  const eventId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: 'Invalid event id' });
  }

  try {
    const event = await Approval.findByIdAndDelete(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found or already deleted.' });
    }

    res.status(200).json({ message: 'Event deleted successfully.', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const viewApprovalRequestforOrganizer = async (req, res) => {
  
  try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return apiError(res, 400, 'Invalid user ID.');
      }
  
      const events = await Approval.find({
        createdBy: id,
      }).populate('createdBy', 'name email role');
  
      return apiResponse(res, 200, 'Events fetched successfully', events);
    } catch (error) {
      console.error('Error fetching events by user ID:', error.message);
      return apiError(res, 500, 'Server error while fetching events', error);
    }
};