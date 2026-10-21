const Seat = require('../models/Seat');
const Show = require('../models/Show');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { broadcastSeatLocked, broadcastSeatReleased } = require('../sockets/socketHandler');

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// @desc    Lock seats for 5 minutes during checkout
// @route   POST /api/v1/shows/:id/lock-seats
// @access  Private
exports.lockSeats = async (req, res, next) => {
  try {
    const showId = req.params.id;
    const { seatNumbers } = req.body;
    const userId = req.user.id;

    if (!seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return sendError(res, 'Please provide an array of seatNumbers to lock', 400);
    }

    if (seatNumbers.length > 8) {
      return sendError(res, 'You cannot lock more than 8 seats in a single booking', 400);
    }

    const show = await Show.findById(showId);
    if (!show) {
      return sendError(res, 'Show not found', 404);
    }

    const now = new Date();
    const lockExpiresAt = new Date(now.getTime() + LOCK_DURATION_MS);

    // Find requested seats
    const seats = await Seat.find({
      show: showId,
      seatNumber: { $in: seatNumbers },
    });

    if (seats.length !== seatNumbers.length) {
      return sendError(res, 'One or more selected seats do not exist in this show', 400);
    }

    // Check if any seat is already booked or currently locked by another active user
    const unavailableSeats = [];
    for (const seat of seats) {
      if (seat.status === 'booked') {
        unavailableSeats.push(`${seat.seatNumber} (already booked)`);
      } else if (
        seat.status === 'locked' &&
        seat.lockExpiresAt &&
        seat.lockExpiresAt > now &&
        seat.lockedBy &&
        seat.lockedBy.toString() !== userId
      ) {
        unavailableSeats.push(`${seat.seatNumber} (locked by another user)`);
      }
    }

    if (unavailableSeats.length > 0) {
      return sendError(
        res,
        `Some seats are no longer available: ${unavailableSeats.join(', ')}`,
        409
      );
    }

    // Atomically lock all seats for this user
    await Seat.updateMany(
      {
        show: showId,
        seatNumber: { $in: seatNumbers },
      },
      {
        $set: {
          status: 'locked',
          lockedBy: userId,
          lockExpiresAt,
        },
      }
    );

    // Broadcast seat lock event to all clients watching this show
    broadcastSeatLocked(showId, seatNumbers, userId, lockExpiresAt);

    return sendSuccess(
      res,
      {
        showId,
        lockedSeats: seatNumbers,
        lockExpiresAt,
        lockDurationSeconds: LOCK_DURATION_MS / 1000,
      },
      'Seats successfully locked for 5 minutes'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Release locked seats manually (e.g. user changes mind or navigates away)
// @route   POST /api/v1/shows/:id/release-seats
// @access  Private
exports.releaseSeats = async (req, res, next) => {
  try {
    const showId = req.params.id;
    const { seatNumbers } = req.body;
    const userId = req.user.id;

    if (!seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return sendError(res, 'Please provide seatNumbers to release', 400);
    }

    // Only release seats that were locked by this user (or if admin)
    const query = {
      show: showId,
      seatNumber: { $in: seatNumbers },
      status: 'locked',
    };

    if (req.user.role !== 'admin') {
      query.lockedBy = userId;
    }

    const updated = await Seat.updateMany(query, {
      $set: {
        status: 'available',
        lockedBy: null,
        lockExpiresAt: null,
      },
    });

    // Broadcast release
    broadcastSeatReleased(showId, seatNumbers);

    return sendSuccess(
      res,
      { releasedCount: updated.modifiedCount, seatNumbers },
      'Seats released successfully'
    );
  } catch (error) {
    next(error);
  }
};
