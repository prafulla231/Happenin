import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId, //many-to-many relationship
      ref: 'Event',
      required: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
    type: Boolean,
    default: false
  },
  },
  { timestamps: false }
);

// Unique Constraint -> prevents duplicate registrations for the same user and event
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });


export const Registration = mongoose.model('Registration', registrationSchema);
