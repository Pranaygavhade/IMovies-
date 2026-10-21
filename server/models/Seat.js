const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true,
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    row: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Regular', 'Premium', 'Recliner'],
      default: 'Regular',
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'locked', 'booked'],
      default: 'available',
      index: true,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to guarantee uniqueness of a seat within a show
seatSchema.index({ show: 1, seatNumber: 1 }, { unique: true });
seatSchema.index({ show: 1, status: 1 });

module.exports = mongoose.model('Seat', seatSchema);
