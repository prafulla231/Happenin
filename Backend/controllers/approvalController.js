import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { apiResponse } from '../utils/apiResponse.js';
import { apiError } from '../utils/apiError.js';
import mongoose from 'mongoose';
import { Approval } from '../models/approval.js';

export const approveEvent = async (req, res) => {
  try {
    const {
      title, description, date, timeSlot, duration, location,
      category, price, maxRegistrations, createdBy,
      artist, organization,
    } = req.body;

    console.log('Authenticated user:', req.user);

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

    const newEvent = new Event({
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
      isDeleted: false, // Soft delete flag
    });

    await newEvent.save();

    return apiResponse(res, 201, 'Event created successfully', newEvent);
  } catch (error) {
    console.error('❌ Create Event error:', error.message);
    return apiError(res, 500, 'Server error while creating event', error);
  }
};

export const viewApprovalRequest = async (req, res) => {
  try {
    const events = await Approval.find().populate('createdBy', 'name email role');
    return apiResponse(res, 200, 'Events fetched successfully', events);
  } catch (error) {
    console.error('❌ Get Events error:', error.message);
    return apiError(res, 500, 'Server error while fetching events', error);
  }
};