import {Location} from '../models/locationModel.js';

//  Book a slot
export const bookLocation = async (req, res) => {
  try {
    const { state, city, placeName, startTime_one, endTime_one } = req.body;

    if (!state || !city || !placeName || !startTime_one || !endTime_one) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const location = await Location.findOne({ state, city, placeName });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const newStart = new Date(startTime_one);
    const newEnd = new Date(endTime_one);

    if (newStart >= newEnd) {
      return res.status(400).json({ message: 'Invalid time range' });
    }

    // Check for conflict with existing bookings
    const conflict = location.bookings.find(booking => {
      const existingStart = new Date(booking.startTime);
      const existingEnd = new Date(booking.endTime);
      return (
        booking.isBooked &&
        newStart < existingEnd &&
        newEnd > existingStart
      );
    });

    if (conflict) {
      return res.status(400).json({
        message: 'Time slot conflict with existing booking',
        conflict,
      });
    }

    // Add new booking 
    location.bookings.push({
      startTime: newStart,
      endTime: newEnd,
      isBooked: true,
    });

    await location.save();

    return res.status(201).json({ message: 'Booking confirmed', location });
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


export const cancelBooking = async (req, res) => {
  try {
    const { endTime,eventLocation ,startTime } = req.body;

    if ( !endTime || !eventLocation || !startTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const location = await Location.findOne({ placeName:eventLocation });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    const targetStart = new Date(startTime);
    const targetEnd = new Date(endTime);

    const booking = location.bookings.find(
      (b) =>
        new Date(b.startTime).getTime() === targetStart.getTime() &&
        new Date(b.endTime).getTime() === targetEnd.getTime() &&
        b.isBooked === true
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or already cancelled' });
    }

    booking.isBooked = false;
    await location.save();

    return res.status(200).json({ message: 'Booking cancelled successfully', location });
  } catch (error) {
    console.error('Cancel Booking error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
