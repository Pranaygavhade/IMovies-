const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Initiate payment order (simulating Razorpay/Stripe order creation)
// @route   POST /api/v1/payments/initiate
// @access  Private
exports.initiatePayment = async (req, res, next) => {
  try {
    const { amount, currency = 'USD', bookingId } = req.body;

    if (!amount || amount <= 0) {
      return sendError(res, 'Valid payment amount is required', 400);
    }

    // In a live Stripe/Razorpay setup, this calls razorpay.orders.create or stripe.paymentIntents.create
    const orderId = 'order_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);

    return sendSuccess(
      res,
      {
        orderId,
        amount,
        currency,
        key: process.env.PAYMENT_KEY || 'rzp_test_imovies_mock',
        gateway: 'IMovies Simulated Gateway',
        supportedMethods: ['card', 'UPI', 'netbanking', 'wallet'],
      },
      'Payment order initiated'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment signature / authorization
// @route   POST /api/v1/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      transactionId,
      orderId,
      method = 'card',
      amount,
      simulateFailure = false,
      failureReason,
    } = req.body;

    // Simulate failure outcome if test card number / trigger is passed
    if (simulateFailure) {
      return sendError(
        res,
        failureReason || 'Transaction declined by issuer: Insufficient funds or invalid CVV',
        400
      );
    }

    const verifiedTxnId = transactionId || 'TXN-' + Date.now();

    return sendSuccess(
      res,
      {
        verified: true,
        transactionId: verifiedTxnId,
        orderId,
        method,
        amount,
        status: 'success',
        timestamp: new Date().toISOString(),
      },
      'Payment verified successfully'
    );
  } catch (error) {
    next(error);
  }
};
