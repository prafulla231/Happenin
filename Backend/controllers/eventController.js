import { Event } from '../models/Event.js';
import { apiResponse } from '../utils/apiResponse.js';
import { apiError } from '../utils/apiError.js';
import mongoose from 'mongoose';
// eventController.js
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

// Configuration (usually done once in your app startup or config file)
cloudinary.config({ 
    cloud_name: 'deutxiah4', 
    api_key: '684497729275266', 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
      maxRegistrations,
      createdBy,
      artist,
      organization,
    } = req.body;

    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    // Basic validations
    if (!title || !date || !maxRegistrations || !createdBy) {
      return apiError(res, 400, 'Title, Date, MaxRegistrations and CreatedBy are required fields.');
    }

    // Validate date is valid date
    if (isNaN(Date.parse(date))) {
      return apiError(res, 400, 'Invalid date format.');
    }

    // Convert and validate price (FormData sends as string)
    const priceNum = price ? parseFloat(price) : 0;
    if (priceNum < 0) {
      return apiError(res, 400, 'Price must be a positive number.');
    }

    // Convert and validate maxRegistrations (FormData sends as string)
    const maxRegNum = parseInt(maxRegistrations);
    if (!Number.isInteger(maxRegNum) || maxRegNum <= 0) {
      return apiError(res, 400, 'maxRegistrations must be a positive integer.');
    }

    let posterUrl = null;

    // Handle poster upload to Cloudinary
    if (req.file) {
      try {
        console.log('Uploading poster to Cloudinary...');
        
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: 'event-posters',
          public_id: `event-${Date.now()}`,
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });

        posterUrl = uploadResult.secure_url;
        console.log('Poster uploaded successfully:', posterUrl);
        
        // Clean up temporary file
        await unlinkAsync(req.file.path);
        
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        
        // Clean up temporary file even if upload failed
        if (req.file && req.file.path) {
          try {
            await unlinkAsync(req.file.path);
          } catch (cleanupError) {
            console.error('Error cleaning up temporary file:', cleanupError);
          }
        }
        
        return apiError(res, 500, 'Failed to upload poster image');
      }
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
      price: priceNum,
      poster: posterUrl,
      maxRegistrations: maxRegNum,
      createdBy,
      artist,
      organization,
    });

    console.log('Creating new event:', newEvent);

    await newEvent.save();

    return apiResponse(res, 201, 'Event created successfully', newEvent);
  } catch (error) {
    console.error('❌ Create Event error:', error.message);
    
    // Clean up temporary file if it exists
    if (req.file && req.file.path) {
      try {
        await unlinkAsync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }
    
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
