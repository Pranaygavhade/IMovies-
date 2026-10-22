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
    tier: {
      type: String,
      enum: ['lower', 'middle', 'balcony'],
      default: 'middle',
    },
    category: {
      type: String,
      enum: ['lower', 'middle', 'balcony', 'Regular', 'Premium', 'Recliner'],
      default: 'middle',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
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
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias for bookingId
seatSchema.virtual('bookingId').get(function () {
  return this.booking;
});

// Compound unique index guaranteeing single seatNumber per show
seatSchema.index({ show: 1, seatNumber: 1 }, { unique: true });
seatSchema.index({ show: 1, status: 1 });

module.exports = mongoose.model('Seat', seatSchema);
