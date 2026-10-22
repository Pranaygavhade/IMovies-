const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { broadcastSeatReleased } = require('../sockets/socketHandler');
const { processGatewayRefund } = require('../services/paymentService');
const { sendCancellationEmail } = require('../services/emailService');

// Helper to generate unique booking code IMV-XXXXXX
const generateBookingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'IMV-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// @desc    Create a "pending" booking after seats have been locked
// @route   POST /api/v1/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    const { showId, seatNumbers } = req.body;
    const userId = req.user.id;

    if (!showId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return sendError(res, 'Please provide showId and an array of seatNumbers', 400);
    }

    const show = await Show.findById(showId).populate('movie theatre');
    if (!show) {
      return sendError(res, 'Show not found', 404);
    }

    const now = new Date();

    // Verify all seats exist and are actively locked by THIS user
    const seats = await Seat.find({
      show: showId,
      seatNumber: { $in: seatNumbers },
    });

    if (seats.length !== seatNumbers.length) {
      return sendError(res, 'One or more selected seats were not found', 400);
    }

    for (const seat of seats) {
      if (seat.status === 'booked') {
        return sendError(res, `Seat ${seat.seatNumber} has already been booked`, 409);
      }
      if (
        seat.status !== 'locked' ||
        !seat.lockedBy ||
        seat.lockedBy.toString() !== userId.toString() ||
        !seat.lockExpiresAt ||
        seat.lockExpiresAt <= now
      ) {
        return sendError(
          res,
          `Seat ${seat.seatNumber} is no longer locked by you or the lock has expired. Please select seats again.`,
          409
        );
      }
    }

    // Always calculate amount strictly on the server from database seat prices!
    const totalAmount = seats.reduce((sum, s) => sum + s.price, 0);

    // Shortest lock expiration
    const earliestExpiry = seats.reduce((min, s) => {
      return s.lockExpiresAt < min ? s.lockExpiresAt : min;
    }, seats[0].lockExpiresAt);

    // Generate unique booking code
    let bookingCode = generateBookingCode();
    let existing = await Booking.findOne({ bookingCode });
    while (existing) {
      bookingCode = generateBookingCode();
      existing = await Booking.findOne({ bookingCode });
    }

    // Create pending booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      seats: seats.map((s) => ({
        seatId: s._id,
        seatNumber: s.seatNumber,
        row: s.row,
        tier: s.tier || 'middle',
        category: s.category || 'middle',
        price: s.price,
      })),
      totalAmount,
      status: 'pending',
      bookingCode,
      refundStatus: 'none',
      expiresAt: earliestExpiry,
    });

    const populated = await Booking.findById(booking._id)
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title poster certificate runtime duration language backdrop' },
          { path: 'theatre', select: 'name city address' },
        ],
      });

    return sendSuccess(
      res,
      {
        booking: populated,
        totalAmount,
        expiresAt: earliestExpiry,
      },
      'Pending booking created successfully. Proceed to payment.',
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
          { path: 'movie', select: 'title poster certificate runtime duration language backdrop genres genre' },
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
      const showDate = (b.show && (b.show.showDate || b.show.date)) || '';
      if (b.status === 'payment_under_review' || (showDate >= todayStr && b.status === 'confirmed')) {
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
          { path: 'movie', select: 'title poster certificate runtime duration language backdrop director' },
          { path: 'theatre', select: 'name city address screens' },
        ],
      })
      .populate('payment')
      .populate('user', 'name email phone');

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to view this booking', 403);
    }

    return sendSuccess(res, { booking }, 'Booking details retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking with cancellation & refund rules
// @route   PUT /api/v1/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('show')
      .populate('payment')
      .populate('user', 'name email');

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to cancel this booking', 403);
    }

    if (booking.status === 'cancelled') {
      return sendError(res, 'This booking has already been cancelled', 400);
    }

    if (booking.status !== 'confirmed') {
      return sendError(res, `Cannot cancel booking with status '${booking.status}'`, 400);
    }

    // Cancellation policy:
    // - full refund (100%) if > 2 hours before the show
    // - 50% partial refund if < 2 hours before the show
    // - none (0%) after the show starts
    const showDateStr = booking.show.showDate || booking.show.date;
    const showTimeStr = booking.show.showTime || booking.show.startTime;

    let showDateTime = new Date(`${showDateStr} ${showTimeStr}`);
    if (isNaN(showDateTime.getTime())) {
      showDateTime = new Date(showDateStr);
    }

    const now = new Date();
    const hoursDiff = (showDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundStatus = 'none';
    let refundPercentage = 0;

    if (hoursDiff > 2) {
      refundStatus = 'full';
      refundPercentage = 100;
    } else if (hoursDiff > 0 && hoursDiff <= 2) {
      refundStatus = 'partial';
      refundPercentage = 50;
    } else {
      refundStatus = 'ineligible';
      refundPercentage = 0;
    }

    const refundAmount = Math.round((booking.totalAmount * (refundPercentage / 100)) * 100) / 100;

    // Process gateway refund if applicable
    if (booking.payment && refundAmount > 0) {
      try {
        await processGatewayRefund({
          gateway: booking.payment.gateway,
          paymentId: booking.payment.gatewayPaymentId,
          amount: refundAmount,
          notes: {
            bookingCode: booking.bookingCode,
            reason: `Customer cancellation (${refundPercentage}% refund per policy)`,
          },
        });

        await Payment.findByIdAndUpdate(booking.payment._id, {
          $set: {
            status: 'refunded',
            'gatewayResponse.refundAmount': refundAmount,
            'gatewayResponse.refundStatus': refundStatus,
          },
        });
      } catch (refundErr) {
        console.error('[Refund Error]:', refundErr.message);
      }
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.refundStatus = refundStatus;
    await booking.save();

    // Release seats back to available
    const seatNumbers = booking.seats.map((s) => s.seatNumber);
    await Seat.updateMany(
      {
        show: booking.show._id,
        seatNumber: { $in: seatNumbers },
      },
      {
        $set: {
          status: 'available',
          lockedBy: null,
          lockExpiresAt: null,
          booking: null,
        },
      }
    );

    // Broadcast seat release via socket
    broadcastSeatReleased(booking.show._id.toString(), seatNumbers);

    // Send notifications & email
    const refundMessage = refundStatus === 'full'
      ? `Full refund of ₹${refundAmount} has been processed.`
      : refundStatus === 'partial'
      ? `Partial refund of ₹${refundAmount} (50%) has been processed as cancellation occurred within 2 hours of showtime.`
      : 'No refund issued as the show has already commenced.';

    await Notification.create({
      user: booking.user._id,
      title: 'Booking Cancelled',
      message: `Booking ${booking.bookingCode} was cancelled. ${refundMessage}`,
      type: 'cancellation',
      isRead: false,
    });

    await sendCancellationEmail({
      to: booking.user.email,
      name: booking.user.name,
      bookingCode: booking.bookingCode,
      refundStatus,
      refundAmount,
    });

    return sendSuccess(
      res,
      {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        status: 'cancelled',
        refundStatus,
        refundAmount,
        message: refundMessage,
      },
      'Booking cancelled successfully'
    );
  } catch (error) {
    next(error);
  }
};
