const mongoose = require('mongoose');

const bookingSeatSchema = new mongoose.Schema({
  seatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seat',
    required: true,
  },
  seatNumber: { type: String, required: true },
  row: { type: String, required: true },
  category: { type: String, required: true },
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
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    bookingCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    qrData: {
      type: String,
      default: '',
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
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
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
