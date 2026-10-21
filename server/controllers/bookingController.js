const QRCode = require('qrcode');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { broadcastSeatBooked, broadcastSeatReleased } = require('../sockets/socketHandler');

// Helper to generate unique booking code
const generateBookingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'IMV-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// @desc    Create new booking with real-time seat lock verification & payment
// @route   POST /api/v1/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const { showId, seatNumbers, paymentMethod = 'card', paymentDetails = {} } = req.body;
    const userId = req.user.id;

    if (!showId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return sendError(res, 'Please provide showId and an array of seatNumbers', 400);
    }

    const show = await Show.findById(showId).populate('movie theatre');
    if (!show) {
      return sendError(res, 'Show not found', 404);
    }

    const now = new Date();

    // Verify all seats exist and are either locked by this user or currently available
    const seats = await Seat.find({
      show: showId,
      seatNumber: { $in: seatNumbers },
    });

    if (seats.length !== seatNumbers.length) {
      return sendError(res, 'One or more selected seats were not found', 400);
    }

    for (const seat of seats) {
      if (seat.status === 'booked') {
        return sendError(res, `Seat ${seat.seatNumber} has already been booked by another user`, 409);
      }
      if (
        seat.status === 'locked' &&
        seat.lockExpiresAt &&
        seat.lockExpiresAt > now &&
        seat.lockedBy &&
        seat.lockedBy.toString() !== userId
      ) {
        return sendError(res, `Seat ${seat.seatNumber} is temporarily locked by another user`, 409);
      }
    }

    // Calculate total amount from seat prices
    const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);

    // Generate unique booking code
    let bookingCode = generateBookingCode();
    let existing = await Booking.findOne({ bookingCode });
    while (existing) {
      bookingCode = generateBookingCode();
      existing = await Booking.findOne({ bookingCode });
    }

    // Generate QR Code data URL
    const qrPayload = JSON.stringify({
      code: bookingCode,
      movie: show.movie.title,
      theatre: show.theatre.name,
      date: show.date,
      time: show.startTime,
      seats: seatNumbers,
      user: req.user.name,
      amount: totalAmount,
    });
    const qrData = await QRCode.toDataURL(qrPayload, {
      color: { dark: '#0b0b12', light: '#ffffff' },
      width: 256,
      margin: 1,
    });

    // Create Booking record
    const booking = await Booking.create({
      user: userId,
      show: showId,
      seats: seats.map((s) => ({
        seatId: s._id,
        seatNumber: s.seatNumber,
        row: s.row,
        category: s.category,
        price: s.price,
      })),
      totalAmount,
      status: 'confirmed',
      bookingCode,
      qrData,
      refundStatus: 'none',
    });

    // Create Payment record (realistic simulated gateway transaction)
    const transactionId = 'TXN-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
    const payment = await Payment.create({
      booking: booking._id,
      user: userId,
      amount: totalAmount,
      method: paymentMethod,
      transactionId,
      status: 'success',
      gatewayResponse: {
        gateway: 'IMovies Gateway Simulator',
        authCode: 'APPRV-' + Math.floor(100000 + Math.random() * 900000),
        method: paymentMethod,
        cardLast4: paymentDetails.cardNumber ? paymentDetails.cardNumber.slice(-4) : '4242',
        upiId: paymentDetails.upiId || null,
        timestamp: new Date().toISOString(),
      },
    });

    booking.payment = payment._id;
    await booking.save();

    // Atomically mark seats as booked
    await Seat.updateMany(
      {
        show: showId,
        seatNumber: { $in: seatNumbers },
      },
      {
        $set: {
          status: 'booked',
          bookingId: booking._id,
          lockedBy: null,
          lockExpiresAt: null,
        },
      }
    );

    // Broadcast seat-booked event via socket
    broadcastSeatBooked(showId, seatNumbers);

    // Create user notification
    await Notification.create({
      user: userId,
      title: 'Booking Confirmed!',
      message: `Your tickets for "${show.movie.title}" on ${show.date} at ${show.startTime} are confirmed! Booking code: ${bookingCode}`,
      type: 'booking',
      isRead: false,
    });

    // Populate booking response
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title poster certificate duration language backdrop' },
          { path: 'theatre', select: 'name city address' },
        ],
      })
      .populate('payment');

    return sendSuccess(
      res,
      { booking: populatedBooking },
      'Tickets booked successfully!',
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's bookings (upcoming & past)
// @route   GET /api/v1/bookings/my
// @access  Private
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title poster certificate duration language backdrop genre' },
          { path: 'theatre', select: 'name city address' },
        ],
      })
      .populate('payment')
      .sort({ createdAt: -1 })
      .lean();

    const todayStr = new Date().toISOString().split('T')[0];

    const upcoming = [];
    const past = [];

    bookings.forEach((b) => {
      if (b.show && b.show.date >= todayStr && b.status !== 'cancelled') {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    });

    return sendSuccess(
      res,
      {
        all: bookings,
        upcoming,
        past,
        total: bookings.length,
      },
      'User bookings retrieved'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by ID
// @route   GET /api/v1/bookings/:id
// @access  Private
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title poster certificate duration language backdrop director' },
          { path: 'theatre', select: 'name city address screens' },
        ],
      })
      .populate('payment')
      .populate('user', 'name email phone');

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    // Role check: user can only see their own booking, unless admin
    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to view this booking', 403);
    }

    return sendSuccess(res, { booking }, 'Booking details retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking (Full refund if >2 hours before show)
// @route   PUT /api/v1/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('show payment');

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to cancel this booking', 403);
    }

    if (booking.status === 'cancelled') {
      return sendError(res, 'This booking has already been cancelled', 400);
    }

    // Check cancellation deadline: parse show date and start time
    // Show format: date = "2026-10-22", startTime = "01:30 PM" or "14:00"
    let showDateTime = new Date(`${booking.show.date} ${booking.show.startTime}`);
    if (isNaN(showDateTime.getTime())) {
      // Fallback parser for "10:00 AM"
      showDateTime = new Date(booking.show.date);
    }

    const now = new Date();
    const hoursDiff = (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundStatus = 'none';
    if (hoursDiff >= 2) {
      refundStatus = 'full';
    } else {
      refundStatus = 'ineligible';
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.refundStatus = refundStatus;
    await booking.save();

    // Release seats in the Seat collection back to available
    const seatIds = booking.seats.map((s) => s.seatId);
    const seatNumbers = booking.seats.map((s) => s.seatNumber);

    await Seat.updateMany(
      { _id: { $in: seatIds } },
      {
        $set: {
          status: 'available',
          lockedBy: null,
          lockExpiresAt: null,
          bookingId: null,
        },
      }
    );

    // Update payment record if exists
    if (booking.payment) {
      await Payment.findByIdAndUpdate(booking.payment._id, {
        $set: {
          status: refundStatus === 'full' ? 'refunded' : 'success',
          'gatewayResponse.refundNote': refundStatus === 'full' ? 'Full refund processed to original payment method' : 'Ineligible for refund (<2h prior to show)',
        },
      });
    }

    // Broadcast seats released via socket
    broadcastSeatReleased(booking.show._id.toString(), seatNumbers);

    // Notify user
    const refundMsg = refundStatus === 'full'
      ? `Full refund of $${booking.totalAmount} will be processed within 3-5 business days.`
      : 'Cancelled within 2 hours of showtime; tickets are non-refundable per cinema policy.';

    await Notification.create({
      user: booking.user,
      title: 'Booking Cancelled',
      message: `Your booking ${booking.bookingCode} was cancelled. ${refundMsg}`,
      type: 'cancellation',
      isRead: false,
    });

    return sendSuccess(
      res,
      {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        status: 'cancelled',
        refundStatus,
        message: refundMsg,
      },
      'Booking cancelled successfully'
    );
  } catch (error) {
    next(error);
  }
};
