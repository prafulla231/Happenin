// models/Approval.js
import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: String,
  timeSlot: String,
  duration: String,
  location: String,
  category: String,
  price: Number,
  maxRegistrations: Number,
  artist: String,
  organization: String,
  state: String,
  city: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 👈 Added
  createdAt: { type: Date, default: Date.now },
});

export const Approval =  mongoose.model('Approval', approvalSchema);
