import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    timeSlot: { type: String },
    duration: { type: String },
    location: { type: String },
    category: { type: String },
    state : {type : String},
    city : {type: String},
    price: { type: Number, default: 0 },
    isDeleted: {
    type: Boolean,
    default: false
  },
    currentRegistrations : { type: Number, default:0 },
    maxRegistrations: { type: Number, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    artist: { type: String },
    organization: { type: String },
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', eventSchema);
