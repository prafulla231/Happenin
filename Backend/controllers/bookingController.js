import Location from '../models/locationModel.js';

// 📌 Book a slot
export const bookLocationSlot = async (req, res) => {
  try {
    const { state, city, placeName, date, startTime, endTime } = req.body;

    const location = await Location.findOne({ state, city, placeName });
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Check for overlapping booked slots
    const conflict = location.bookings.find(booking =>
      booking.status === 'booked' &&
      booking.date === date &&
      booking.startTime < endTime &&
      startTime < booking.endTime
    );

    if (conflict) {
      return res.status(400).json({
        message: `Slot already booked from ${conflict.startTime} to ${conflict.endTime}`
      });
    }

    // Add new booking
    location.bookings.push({ date, startTime, endTime });
    await location.save();

    return res.status(200).json({ message: 'Slot booked successfully', location });
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ❌ Cancel a slot
export const cancelBooking = async (req, res) => {
  try {
    const { state, city, placeName, date, startTime, endTime } = req.body;

    const location = await Location.findOne({ state, city, placeName });
    if (!location) return res.status(404).json({ message: 'Location not found' });

    const booking = location.bookings.find(b =>
      b.date === date &&
      b.startTime === startTime &&
      b.endTime === endTime &&
      b.status === 'booked'
    );

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'cancelled';
    await location.save();

    return res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
