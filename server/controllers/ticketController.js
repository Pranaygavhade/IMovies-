const Booking = require('../models/Booking');
const { verifyTicketToken } = require('../services/qrService');
const { isShowPast } = require('../utils/dateUtils');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @desc    Verify ticket QR token or booking code (Entry validation)
 * @route   GET /api/v1/tickets/verify?token=&bookingCode=
 * @access  Private (Admin / Cinema Staff)
 */
exports.verifyTicket = async (req, res, next) => {
  try {
    const { token, bookingCode } = req.query;

    if (!token && !bookingCode) {
      return sendError(res, 'Ticket token or bookingCode parameter is required', 400);
    }

    let bookingId = null;
    let tokenData = null;

    if (token) {
      const verification = verifyTicketToken(token);
      if (!verification.valid) {
        return res.status(200).json({
          success: true,
          data: {
            state: 'invalid',
            message: 'Tampered, malformed, or invalid ticket QR token. Digital signature verification failed.',
            booking: null,
          },
        });
      }
      bookingId = verification.data.bookingId;
      tokenData = verification.data;
    }

    // Query booking with full references
    const query = bookingId ? { _id: bookingId } : { bookingCode: bookingCode.trim().toUpperCase() };
    const booking = await Booking.findOne(query)
      .populate('user', 'name email phone avatar')
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title poster certification duration language genres' },
          { path: 'theatre', select: 'name city address location' },
        ],
      })
      .populate('payment');

    if (!booking) {
      return res.status(200).json({
        success: true,
        data: {
          state: 'invalid',
          message: 'Booking not found in cinema ticketing database.',
          booking: null,
        },
      });
    }

    // 1. Check if cancelled
    if (booking.status === 'cancelled') {
      return res.status(200).json({
        success: true,
        data: {
          state: 'cancelled',
          message: 'This ticket is invalid because the booking was CANCELLED and refunded.',
          booking,
        },
      });
    }

    // 2. Check if confirmed / paid
    if (booking.status !== 'confirmed') {
      return res.status(200).json({
        success: true,
        data: {
          state: 'invalid',
          message: `Booking has status '${booking.status}'. Only confirmed and paid tickets are valid for entry.`,
          booking,
        },
      });
    }

    // 3. Check if show has ended
    const show = booking.show;
    if (show) {
      // Use endTime or showTime to check if show has already concluded
      const checkTime = show.endTime || show.showTime;
      if (isShowPast(show.showDate, checkTime)) {
        return res.status(200).json({
          success: true,
          data: {
            state: 'wrong_show',
            message: `Show screening on ${show.showDate} at ${show.showTime} has already concluded.`,
            booking,
          },
        });
      }
    }

    // 4. Check if already used (Single Use Enforcement)
    if (booking.ticketUsed) {
      return res.status(200).json({
        success: true,
        data: {
          state: 'already_used',
          message: `Ticket has ALREADY BEEN USED! Scanned at ${
            booking.ticketUsedAt
              ? new Date(booking.ticketUsedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
              : 'earlier today'
          }.`,
          booking,
        },
      });
    }

    // 5. Valid! Mark as used (Atomic single-use)
    booking.ticketUsed = true;
    booking.ticketUsedAt = new Date();
    booking.ticketScannedBy = req.user._id;
    await booking.save();

    return res.status(200).json({
      success: true,
      data: {
        state: 'valid',
        message: 'Ticket verified successfully. ENTRY GRANTED! Enjoy the show.',
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};
