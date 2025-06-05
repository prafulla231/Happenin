// models/locationModel.js
import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    state: { type: String, required: true },
    district: { type: String, required: true },
    placeName: { type: String, required: true },
    address: { type: String, required: true },
    maxSeatingCapacity: { type: Number, required: true },
    amenities: [{ type: String }], // e.g., ['Wi-Fi', 'AC', 'Parking']
    
  },
  { timestamps: true }
);

export const Location = mongoose.model('Location', locationSchema);
