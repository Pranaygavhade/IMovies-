const Seat = require('../models/Seat');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const { broadcastSeatLocked, broadcastSeatReleased } = require('../sockets/socketHandler');

const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Atomically lock a set of seats for a specific user with 5-minute TTL
 */
const lockSeatsForUser = async (showId, seatNumbers, userId) => {
  const show = await Show.findById(showId);
  if (!show) {
    throw new Error('Show not found');
  }

  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + LOCK_TTL_MS);

  // Find all requested seats
  const seats = await Seat.find({
    show: showId,
    seatNumber: { $in: seatNumbers },
  });

  if (seats.length !== seatNumbers.length) {
    throw new Error('One or more selected seats do not exist');
  }

  // Validate that no seat is booked or locked by someone else
  for (const seat of seats) {
    if (seat.status === 'booked') {
      throw new Error(`Seat ${seat.seatNumber} is already booked.`);
    }
    if (
      seat.status === 'locked' &&
      seat.lockExpiresAt &&
      seat.lockExpiresAt > now &&
      seat.lockedBy &&
      seat.lockedBy.toString() !== userId.toString()
    ) {
      throw new Error(`Seat ${seat.seatNumber} is currently held by another user.`);
    }
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

  // Broadcast lock event to show room
  broadcastSeatLocked(showId, seatNumbers, userId.toString(), lockExpiresAt);

  return {
    showId,
    lockedSeats: seatNumbers,
    lockExpiresAt,
    ttlSeconds: LOCK_TTL_MS / 1000,
  };
};

/**
 * Manually release locked seats (e.g. user unselected or cancelled)
 */
const releaseSeatsForUser = async (showId, seatNumbers, userId, isAdmin = false) => {
  const query = {
    show: showId,
    seatNumber: { $in: seatNumbers },
    status: 'locked',
  };

  if (!isAdmin) {
    query.lockedBy = userId;
  }

  const res = await Seat.updateMany(query, {
    $set: {
      status: 'available',
      lockedBy: null,
      lockExpiresAt: null,
    },
  });

  broadcastSeatReleased(showId, seatNumbers);
  return res.modifiedCount;
};

/**
 * Cleanup expired seat locks and mark pending bookings as expired
 */
const releaseExpiredLocks = async () => {
  try {
    const now = new Date();

    // 1. Find seats whose lock has expired
    const expiredSeats = await Seat.find({
      status: 'locked',
      lockExpiresAt: { $lt: now },
    }).select('show seatNumber');

    if (expiredSeats.length > 0) {
      const showMap = {};
      for (const s of expiredSeats) {
        const sId = s.show.toString();
        if (!showMap[sId]) showMap[sId] = [];
        showMap[sId].push(s.seatNumber);
      }

      await Seat.updateMany(
        { _id: { $in: expiredSeats.map((s) => s._id) } },
        {
          $set: {
            status: 'available',
            lockedBy: null,
            lockExpiresAt: null,
          },
        }
      );

      for (const showId in showMap) {
        broadcastSeatReleased(showId, showMap[showId]);
      }
    }

    // 2. Mark pending bookings that passed their expiry as 'expired'
    await Booking.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: now },
      },
      {
        $set: { status: 'expired' },
      }
    );
  } catch (err) {
    console.error('[SeatLockService Cleanup Error]:', err.message);
  }
};

module.exports = {
  LOCK_TTL_MS,
  lockSeatsForUser,
  releaseSeatsForUser,
  releaseExpiredLocks,
};
