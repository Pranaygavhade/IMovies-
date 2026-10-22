const mongoose = require('mongoose');

const bookingSeatSchema = new mongoose.Schema({
  seatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat',
    required: true,
  },
  seatNumber: { type: String, required: true },
  row: { type: String, required: true },
  tier: { type: String, enum: ['lower', 'middle', 'balcony'], default: 'middle' },
  category: { type: String, default: 'middle' },
  price: { type: Number, required: true },
});

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true,
    },
    seats: [bookingSeatSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    qrCode: {
      type: String,
      default: '',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'full', 'partial', 'ineligible'],
      default: 'none',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for qrData
bookingSchema.virtual('qrData').get(function () {
  return this.qrCode;
});

bookingSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
