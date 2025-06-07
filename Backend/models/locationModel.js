// models/locationModel.js
import mongoose from 'mongoose';


const bookingSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  isBooked: { type: Boolean, default: true },
}, { _id: false });

const locationSchema = new mongoose.Schema(
  {
    state: { type: String, required: true },
    city: { type: String, required: true },
    placeName: { type: String, required: true },
    address: { type: String, required: true },
    maxSeatingCapacity: { type: Number, required: true },
    amenities: [{ type: String }],
    bookings: [bookingSchema],
  },
  { timestamps: true }
);


export const Location = mongoose.model('Location', locationSchema);
