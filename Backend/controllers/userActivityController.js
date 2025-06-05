import { Registration } from '../models/Registration.js'; // your schema file path
import {Event} from '../models/Event.js';
import {User} from '../models/Users.js';

export const registerForEvent = async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if event is full
    const registeredCount = await Registration.countDocuments({ eventId });
    if (registeredCount >= event.maxRegistrations) {
      return res.status(400).json({ message: 'Event registration full' });
    }

    // Attempt to register (unique index ensures no duplicates)
    const registration = new Registration({ userId, eventId });
    await registration.save();

    await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistration: 1 } });

    res.status(200).json({ message: 'Successfully registered!' });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error: user already registered for this event
      return res.status(400).json({ message: 'User already registered for this event' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getRegisteredEvents = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Step 1: Find all registrations by this user
    const registrations = await Registration.find({ userId }).select('eventId');

    // Step 2: Extract all event IDs
    const eventIds = registrations.map((reg) => reg.eventId);

    // Step 3: Find all events with those IDs
    const events = await Event.find({ _id: { $in: eventIds } });

    res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching registered events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deregisterEvent = async (req, res) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ message: 'userId and eventId are required.' });
  }

  try {
    const deleted = await Registration.findOneAndDelete({ userId, eventId });

    if (!deleted) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistration: -1 } });


    return res.status(200).json({ message: 'Deregistered successfully.' });
  } catch (error) {
    console.error('Error deregistering:', error);
    return res.status(500).json({ message: 'Server error while deregistering.' });
  }
};

export const getEventDetails = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // 1. Find event to get currentRegistration count
    const event = await Event.findById(eventId).select('currentRegistrations');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 2. Find registrations for event
    const registrations = await Registration.find({ eventId }).select('userId');

    // 3. Extract userIds
    const userIds = registrations.map(reg => reg.userId);

    // 4. Find users by userIds
    const users = await User.find({ _id: { $in: userIds } }).select('name email');

    // 5. Return users and currentRegistration count
    return res.status(200).json({
      message: 'Registered users fetched',
      data: {
        users,
        currentRegistration: event.currentRegistrations || 0
      }
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};