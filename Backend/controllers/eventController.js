import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { apiResponse } from '../utils/apiResponse.js';
import { apiError } from '../utils/apiError.js';
import mongoose from 'mongoose';
import { Approval } from '../models/approval.js';
import {Location} from '../models/locationModel.js';
// CREATE EVENT
export const createApproval = async (req, res) => {
  try {
    const {
      title, description, date, timeSlot, duration, location,city,
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
      city,
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
    //console.log("Get events is called");
    const events = await Event.find({ isDeleted: false }).populate('createdBy', 'name email role');
    return apiResponse(res, 200, 'Events fetched successfully', events);
  } catch (error) {
    console.error('❌ Get Events error:', error.message);
    return apiError(res, 500, 'Server error while fetching events', error);
  }
};

/*pagination */
// 📁 controllers/eventController.js

// export const getPaginatedEvents = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const filter = { isDeleted: false };

//     if (req.query.search) {
//       filter.title = { $regex: req.query.search, $options: 'i' };
//     }

//     if (req.query.category) {
//       filter.category = req.query.category;
//     }

//     if (req.query.city) {
//       filter.location = req.query.city;
//     }

//     if (req.query.fromDate || req.query.toDate) {
//       filter.date = {};
//       if (req.query.fromDate) filter.date.$gte = new Date(req.query.fromDate);
//       if (req.query.toDate) filter.date.$lte = new Date(req.query.toDate);
//     }

//     if (req.query.priceRange) {
//       const [min, max] = req.query.priceRange.split('-').map(Number);
//       filter.price = { $gte: min, $lte: max };
//     }

//     const events = await Event.find(filter)
//       .skip(skip)
//       .limit(limit)
//       .populate('createdBy', 'name email role');

//     const total = await Event.countDocuments(filter);

//     const pagination = {
//       totalItems: total,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//       perPage: limit,
//     };

//     return apiResponse(res, 200, 'Paginated events fetched successfully', {
//       events,
//       pagination,
//     });
//   } catch (error) {
//     console.error('❌ Get Paginated Events error:', error.message);
//     return apiError(res, 500, 'Server error while fetching paginated events', error);
//   }
// };
// export const getPaginatedEvents = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const filter = { isDeleted: false };

//     console.log('🛬 API HIT: /paginatedEvents');
//     console.log('📨 Query Params:', req.query);

//     if (req.query.search) {
//       filter.title = { $regex: req.query.search, $options: 'i' };
//     }

//     if (req.query.category) {
//       filter.category = req.query.category;
//     }

//     if (req.query.city) {
//       filter.location = req.query.city;
//     }

//     if (req.query.fromDate || req.query.toDate) {
//       filter.date = {};
//       if (req.query.fromDate) filter.date.$gte = new Date(req.query.fromDate);
//       if (req.query.toDate) filter.date.$lte = new Date(req.query.toDate);
//     }

//     if (req.query.priceRange) {
//       const [min, max] = req.query.priceRange.split('-').map(Number);
//       filter.price = { $gte: min, $lte: max };
//     }

//     console.log('🔍 Final Filter Used:', filter);

//     const events = await Approval.find(filter)
//       .skip(skip)
//       .limit(limit)
//       .populate('createdBy', 'name email role');

//     const total = await Approval.countDocuments(filter);

//     console.log(`✅ ${events.length} Events Fetched`);
//     console.log(`📊 Total Matching Events: ${total}`);

//     const pagination = {
//       totalItems: total,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//       perPage: limit,
//     };

//     return apiResponse(res, 200, 'Paginated events fetched successfully', {
//       events,
//       pagination
//     });
//   } catch (error) {
//     console.error('❌ Get Paginated Events Error:', error);
//     return apiError(res, 500, 'Server error while fetching paginated events', error);
//   }
// };


export const getUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.find({ 
      date: { $gte: new Date() }, 
      isDeleted: false 
    }).select('-createdAt -updatedAt -__v').sort({ date: 1 }).populate('createdBy', 'name email role');
    // console.log("events : ", events);
    
    return apiResponse(res, 200, "Upcoming events fetched successfully", events);
  } catch (error) {
    console.error('❌ Get Upcoming Events error:', error.message);
    return apiError(res, 500, 'Server error while fetching upcoming events', error);
  }
};


export const getPaginatedEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    // console.log('🛬 API HIT: /paginatedEvents');
    // console.log('📨 Query Params:', req.query);

    // 🔍 Filters
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.city) {
      const locationDocs = await Location.find({ city: req.query.city }).select('placeName');
      const matchingPlaceNames = locationDocs.map(loc => loc.placeName);

      // console.log('🏙 Matching placeNames for city:', req.query.city, matchingPlaceNames);

      if (matchingPlaceNames.length > 0) {
        filter.location = { $in: matchingPlaceNames };
      } else {
        filter.location = '__NO_MATCH__'; // Forces no match
      }
    }

    // 📅 Date filtering
if (req.query.fromDate || req.query.toDate) {
  filter.date = {};
  if (req.query.fromDate) filter.date.$gte = new Date(req.query.fromDate);
  if (req.query.toDate) filter.date.$lte = new Date(req.query.toDate);
} else {
  // 👇 Default: show only today and future events
  filter.date = { $gte: new Date() };
}


    if (req.query.priceRange) {
      const [min, max] = req.query.priceRange.split('-').map(Number);
      filter.price = { $gte: min, $lte: max };
    }

    // ✅ Sort
    let sortOption = { date: -1 }; // Default: Newest First
    if (req.query.sortBy) {
      const [field, direction] = req.query.sortBy.split('_'); // e.g., price_desc
      const sortOrder = direction === 'asc' ? 1 : -1;
      const validFields = ['price', 'date', 'title', 'category'];

      if (validFields.includes(field)) {
        sortOption = { [field]: sortOrder };
      }
    }

    // console.log('🔍 Final Filter Used:', filter);
    // console.log('↕️ Sort Option:', sortOption);

    const events = await Event.find(filter)
     .select('-createdAt -updatedAt -__v')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email role');

    const total = await Event.countDocuments(filter);

    const pagination = {
      totalItems: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      perPage: limit,
    };

    return apiResponse(res, 200, 'Paginated events fetched successfully', {
      events,
      pagination
    });
  } catch (error) {
    console.error('❌ Get Paginated Events Error:', error);
    return apiError(res, 500, 'Server error while fetching paginated events', error);
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
    ).select('-createdAt -updatedAt -__v')
    .sort({ date: -1 })
    .populate('createdBy', 'name email role');

    apiResponse(res, 200, "Events found", events);
    // console.log(events);
  } catch (err) {
    console.error('Error fetching expired events:', err);
    apiError(res, 500, "Server Error", []);
  }
};

