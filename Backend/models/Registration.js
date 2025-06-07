import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
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

registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });


export const Registration = mongoose.model('Registration', registrationSchema);
