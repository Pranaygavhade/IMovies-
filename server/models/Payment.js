const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    method: {
      type: String,
      enum: ['card', 'UPI', 'netbanking', 'wallet', 'phonepe_qr'],
      default: 'card',
    },
    gateway: {
      type: String,
      enum: ['razorpay', 'simulated', 'phonepe', 'manual_phonepe_qr'],
      default: 'simulated',
      required: true,
    },
    utrNumber: {
      type: String,
      trim: true,
      default: null,
    },
    gatewayOrderId: {
      type: String,
      default: '',
      trim: true,
    },
    gatewayPaymentId: {
      type: String,
      default: '',
      trim: true,
    },
    gatewaySignature: {
      type: String,
      default: '',
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['created', 'success', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    failureReason: {
      type: String,
      default: '',
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
