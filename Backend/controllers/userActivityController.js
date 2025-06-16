// userActivityController.js 
import { Registration } from '../models/Registration.js';
import { Event } from '../models/Event.js';
import { User } from '../models/Users.js';

// REGISTER
export const registerForEvent = async (req, res) => {
  try {
    // console.log('=== REGISTRATION REQUEST START ===');
    // console.log('Request body:', req.body);
    // console.log('Request headers:', req.headers);
    
    const { userId, eventId } = req.body;

    // Validate input data
    if (!userId || !eventId) {
      console.log('Missing required fields - userId:', userId, 'eventId:', eventId);
      return res.status(400).json({ message: 'userId and eventId are required' });
    }

    // console.log('Searching for user with ID:', userId);
    // console.log('User ID type:', typeof userId);
    
    // Check if the userId is a valid ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid userId format:', userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId);
    // console.log('User found:', !!user);
    if (user) {
      // console.log('User details:', { id: user._id, name: user.name || user.userName });
    }
    
    if (!user) {
      // console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    // console.log('Searching for event with ID:', eventId);
    // console.log('Event ID type:', typeof eventId);
    
    // Check if the eventId is a valid ObjectId format
    if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid eventId format:', eventId);
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    // console.log('Event found:', !!event);
    if (event) {
      // console.log('Event details:', { id: event._id, title: event.title });
    }
    
    if (!event) {
      console.log('Event not found or deleted');
      return res.status(404).json({ message: 'Event not found or deleted' });
    }

    // console.log('Checking registration capacity...');
    const registeredCount = await Registration.countDocuments({ eventId, isDeleted: false });
    // console.log('Current registrations:', registeredCount, 'Max allowed:', event.maxRegistrations);
    
    if (registeredCount >= event.maxRegistrations) {
      console.log('Event registration full');
      return res.status(400).json({ message: 'Event registration full' });
    }

    // console.log('Checking for existing registration...');
    // Check if registration exists but is soft-deleted
    let registration = await Registration.findOne({ userId, eventId });
    // console.log('Existing registration found:', !!registration);
    
    if (registration) {
      // console.log('Registration status - isDeleted:', registration.isDeleted);
      if (!registration.isDeleted) {
        // Already registered
        console.log('User already registered');
        return res.status(400).json({ message: 'User already registered for this event' });
      } else {
        // Reactivate the soft-deleted registration
        // console.log('Reactivating soft-deleted registration');
        registration.isDeleted = false;
        await registration.save();
        await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: 1 } });
        // console.log('Registration reactivated successfully');
        return res.status(200).json({ message: 'Successfully registered!' });
      }
    }

    // No registration found, create new
    // console.log('Creating new registration...');
    registration = new Registration({ userId, eventId, isDeleted: false });
    await registration.save();
    // console.log('New registration created');

    await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: 1 } });
    // console.log('Event registration count updated');

    // console.log('=== REGISTRATION SUCCESS ===');
    res.status(200).json({ message: 'Successfully registered!' });
  } catch (error) {
    // console.error('=== REGISTRATION ERROR ===');
    // console.error('Error details:', error);
    // console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET ALL REGISTERED EVENTS FOR USER
export const getRegisteredEvents = async (req, res) => {
  try {
    // console.log('=== GET REGISTERED EVENTS START ===');
    const { userId } = req.params;
    // console.log('Getting registered events for user:', userId);

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      // console.log('Invalid userId format:', userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const registrations = await Registration.find({ userId, isDeleted: false }).select('eventId');
    // console.log('Found registrations:', registrations.length);

    const eventIds = registrations.map((reg) => reg.eventId);
    // console.log('Event IDs:', eventIds);

    const events = await Event.find({ _id: { $in: eventIds }, isDeleted: false });
    // console.log('Found events:', events.length);

    // console.log('=== GET REGISTERED EVENTS SUCCESS ===');
    res.status(200).json({ events });
  } catch (error) {
    console.error('Error fetching registered events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DEREGISTER (Soft delete)
export const deregisterEvent = async (req, res) => {
  try {
    // console.log('=== DEREGISTRATION START ===');
    // console.log('Request body:', req.body);
    
    const { userId, eventId } = req.body;

    if (!userId || !eventId) {
      return res.status(400).json({ message: 'userId and eventId are required.' });
    }

    // Validate IDs format
    if (!userId.match(/^[0-9a-fA-F]{24}$/) || !eventId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // console.log('Deregistering user:', userId, 'from event:', eventId);

    const registration = await Registration.findOneAndUpdate(
      { userId, eventId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!registration) {
      console.log('Registration not found');
      return res.status(404).json({ message: 'Registration not found.' });
    }

    await Event.findByIdAndUpdate(eventId, { $inc: { currentRegistrations: -1 } });
    // console.log('=== DEREGISTRATION SUCCESS ===');

    return res.status(200).json({ message: 'Deregistered successfully.' });
  } catch (error) {
    console.error('Error deregistering:', error);
    return res.status(500).json({ message: 'Server error while deregistering.', error: error.message });
  }
};

// GET USERS REGISTERED FOR AN EVENT
export const getEventDetails = async (req, res) => {
  try {
    // console.log('=== GET EVENT DETAILS START ===');
    const eventId = req.params.eventId;
    // console.log('Getting details for event:', eventId);

    // Validate eventId format
    if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    const event = await Event.findOne({ _id: eventId, isDeleted: false }).select('currentRegistrations');
    if (!event) {
      console.log('Event not found');
      return res.status(404).json({ message: 'Event not found or deleted' });
    }

    const registrations = await Registration.find({ eventId, isDeleted: false }).select('userId');
    // console.log('Found registrations:', registrations.length);

    const userIds = registrations.map(reg => reg.userId);
    const users = await User.find({ _id: { $in: userIds } }).select('name email');
    // console.log('Found users:', users.length);

    // console.log('=== GET EVENT DETAILS SUCCESS ===');
    return res.status(200).json({
      message: 'Registered users fetched',
      data: {
        users,
        currentRegistration: event.currentRegistrations
      }
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};