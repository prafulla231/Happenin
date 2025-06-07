import { Registration } from '../models/Registration.js';
import { Event } from '../models/Event.js';
import { User } from '../models/Users.js';

// REGISTER
export const registerForEvent = async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) return res.status(404).json({ message: 'Event not found or deleted' });

    const registeredCount = await Registration.countDocuments({ eventId, isDeleted: false });
    if (registeredCount >= event.maxRegistrations) {
      return res.status(400).json({ message: 'Event registration full' });
    }

    // Check if registration exists but is soft-deleted
    let registration = await Registration.findOne({ userId, eventId });
    if (registration) {
      if (!registration.isDeleted) {
        // Already registered
        return res.status(400).json({ message: 'User already registered for this event' });
      } else {
        // Reactivate the soft-deleted registration
        registration.isDeleted = false;
        await registration.save();
        await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: 1 } });
        return res.status(200).json({ message: 'Successfully registered!' });
      }
    }

    // No registration found, create new
    registration = new Registration({ userId, eventId, isDeleted: false });
    await registration.save();

    await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: 1 } });

    res.status(200).json({ message: 'Successfully registered!' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL REGISTERED EVENTS FOR USER
export const getRegisteredEvents = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const registrations = await Registration.find({ userId, isDeleted: false }).select('eventId');

    const eventIds = registrations.map((reg) => reg.eventId);

    const events = await Event.find({ _id: { $in: eventIds }, isDeleted: false });

    res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching registered events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DEREGISTER (Soft delete)
export const deregisterEvent = async (req, res) => {
  const { userId, eventId } = req.body;

  if (!userId || !eventId) {
    return res.status(400).json({ message: 'userId and eventId are required.' });
  }

  try {
    const registration = await Registration.findOneAndUpdate(
      { userId, eventId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found.' });
    }

    await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: -1 } });

    return res.status(200).json({ message: 'Deregistered successfully.' });
  } catch (error) {
    console.error('Error deregistering:', error);
    return res.status(500).json({ message: 'Server error while deregistering.' });
  }
};

// GET USERS REGISTERED FOR AN EVENT
export const getEventDetails = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const event = await Event.findOne({ _id: eventId, isDeleted: false }).select('currentRegistrations');
    if (!event) {
      return res.status(404).json({ message: 'Event not found or deleted' });
    }

    const registrations = await Registration.find({ eventId, isDeleted: false }).select('userId');

    const userIds = registrations.map(reg => reg.userId);

    const users = await User.find({ _id: { $in: userIds } }).select('name email');

    return res.status(200).json({
      message: 'Registered users fetched',
      data: {
        users,
        currentRegistration: event.currentRegistrations
      }
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
