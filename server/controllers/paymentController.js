const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Seat = require('../models/Seat');
const Show = require('../models/Show');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const {
  createGatewayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getPaymentGatewayMode,
  processGatewayRefund,
} = require('../services/paymentService');
const { generateBookingQRCode } = require('../services/qrService');
const {
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
} = require('../services/emailService');
const { broadcastSeatBooked, broadcastSeatReleased } = require('../sockets/socketHandler');

// @desc    Initiate payment order (Razorpay or Simulated)
// @route   POST /api/v1/payments/initiate
// @access  Private
exports.initiatePayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id;

    if (!bookingId) {
      return sendError(res, 'Booking ID is required to initiate payment', 400);
    }

    const booking = await Booking.findById(bookingId).populate('show');
    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.user.toString() !== userId && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to pay for this booking', 403);
    }

    if (booking.status === 'confirmed') {
      return sendError(res, 'This booking has already been paid and confirmed', 400);
    }

    if (booking.status === 'cancelled' || booking.status === 'expired') {
      return sendError(res, `Booking is ${booking.status}. Please select new seats.`, 400);
    }

    // Check if seats lock has expired
    const now = new Date();
    if (booking.expiresAt && booking.expiresAt <= now) {
      booking.status = 'expired';
      await booking.save();
      return sendError(res, 'Seat reservation has expired (5-minute limit). Please re-select your seats.', 400);
    }

    // Create gateway order
    const gatewayOrder = await createGatewayOrder({
      amount: booking.totalAmount,
      bookingId: booking._id,
      currency: 'INR',
      receipt: `imv_${booking.bookingCode}`,
    });

    // Create or update Payment record with status 'created'
    let payment = await Payment.findOne({ booking: booking._id, status: 'created' });
    if (!payment) {
      payment = await Payment.create({
        booking: booking._id,
        user: userId,
        amount: booking.totalAmount,
        currency: 'INR',
        gateway: gatewayOrder.gateway,
        gatewayOrderId: gatewayOrder.orderId,
        status: 'created',
      });
    } else {
      payment.gateway = gatewayOrder.gateway;
      payment.gatewayOrderId = gatewayOrder.orderId;
      await payment.save();
    }

    booking.payment = payment._id;
    await booking.save();

    return sendSuccess(
      res,
      {
        orderId: gatewayOrder.orderId,
        amount: booking.totalAmount,
        currency: gatewayOrder.currency,
        key: gatewayOrder.keyId,
        gateway: gatewayOrder.gateway,
        simulationToken: gatewayOrder.simulationToken || null,
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      },
      'Payment order initiated successfully'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment and finalize booking (Idempotent)
// @route   POST /api/v1/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      orderId,
      paymentId,
      signature,
      simulationToken,
      paymentMethod = 'card',
      cardNumber,
      upiId,
      simulateFailure = false,
    } = req.body;

    const userId = req.user.id;

    if (!orderId) {
      return sendError(res, 'Order ID is required for verification', 400);
    }

    // Find the payment record
    const payment = await Payment.findOne({
      $or: [{ gatewayOrderId: orderId }, { booking: bookingId }],
    }).populate('booking');

    if (!payment) {
      return sendError(res, 'Payment record not found for this order', 404);
    }

    const booking = await Booking.findById(payment.booking._id || bookingId)
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title poster certificate runtime duration language backdrop genres genre' },
          { path: 'theatre', select: 'name city address' },
        ],
      })
      .populate('user', 'name email phone');

    if (!booking) {
      return sendError(res, 'Associated booking not found', 404);
    }

    // Idempotency: If already confirmed, return success without double-booking
    if (booking.status === 'confirmed' && payment.status === 'success') {
      return sendSuccess(
        res,
        {
          booking,
          verified: true,
          message: 'Booking was already confirmed.',
        },
        'Payment verified successfully'
      );
    }

    // Test failure conditions (simulated failure test cases)
    const isExplicitTestFailure =
      simulateFailure === true ||
      (cardNumber && (cardNumber.endsWith('0002') || cardNumber.replace(/\s/g, '').endsWith('0002'))) ||
      (upiId && upiId.toLowerCase().endsWith('@fail'));

    if (isExplicitTestFailure) {
      payment.status = 'failed';
      payment.failureReason = 'Transaction declined by bank issuer (Test failure triggered).';
      await payment.save();

      return sendError(
        res,
        'Payment failed: Transaction declined by bank issuer. Seats remain reserved until expiry; you may retry payment.',
        400
      );
    }

    // Verify signature
    const isValid = verifyPaymentSignature({
      gateway: payment.gateway,
      orderId,
      paymentId: paymentId || `pay_sim_${Date.now()}`,
      signature,
      simulationToken,
      amount: booking.totalAmount,
      bookingId: booking._id,
    });

    if (!isValid) {
      payment.status = 'failed';
      payment.failureReason = 'Invalid cryptographic signature or security token mismatch';
      await payment.save();

      return sendError(res, 'Payment verification failed: Signature mismatch or tampering detected.', 400);
    }

    // Generate QR Code data URL
    const showDate = booking.show.showDate || booking.show.date;
    const showTime = booking.show.showTime || booking.show.startTime;
    const seatNumbers = booking.seats.map((s) => s.seatNumber);

    const qrResult = await generateBookingQRCode({
      bookingId: booking._id,
      showId: booking.show._id,
      bookingCode: booking.bookingCode,
      movieTitle: booking.show.movie.title,
      theatreName: booking.show.theatre.name,
      showDate,
      showTime,
      seats: seatNumbers,
      amount: booking.totalAmount,
      userName: booking.user.name,
    });

    const qrCode = qrResult.qrCode || qrResult;
    const ticketToken = qrResult.ticketToken || '';

    // Mark payment success
    const finalPaymentId = paymentId || `pay_sim_${Date.now()}`;
    payment.status = 'success';
    payment.gatewayPaymentId = finalPaymentId;
    payment.gatewaySignature = signature || simulationToken || 'verified';
    payment.transactionId = finalPaymentId;
    payment.method = paymentMethod;
    payment.gatewayResponse = {
      verifiedAt: new Date().toISOString(),
      method: paymentMethod,
      gateway: payment.gateway,
    };
    await payment.save();

    // Convert locked seats to booked
    await Seat.updateMany(
      {
        show: booking.show._id,
        seatNumber: { $in: seatNumbers },
      },
      {
        $set: {
          status: 'booked',
          booking: booking._id,
          lockedBy: null,
          lockExpiresAt: null,
        },
      }
    );

    // Confirm booking
    booking.status = 'confirmed';
    booking.qrCode = qrCode;
    booking.ticketToken = ticketToken;
    booking.ticketUsed = false;
    booking.payment = payment._id;
    await booking.save();

    // Broadcast seat-booked socket event
    broadcastSeatBooked(booking.show._id.toString(), seatNumbers);

    // User Notification
    await Notification.create({
      user: userId,
      title: 'Booking Confirmed! 🎟️',
      message: `Your booking ${booking.bookingCode} for "${booking.show.movie.title}" is confirmed!`,
      type: 'booking',
      isRead: false,
    });

    // Send emails (confirmation and receipt)
    await sendBookingConfirmationEmail({
      to: booking.user.email,
      name: booking.user.name,
      bookingCode: booking.bookingCode,
      movieTitle: booking.show.movie.title,
      theatreName: booking.show.theatre.name,
      showDate,
      showTime,
      seats: seatNumbers,
      totalAmount: booking.totalAmount,
    });

    await sendPaymentReceiptEmail({
      to: booking.user.email,
      name: booking.user.name,
      transactionId: finalPaymentId,
      amount: booking.totalAmount,
      method: paymentMethod,
      bookingCode: booking.bookingCode,
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title poster certificate runtime duration language backdrop genres genre' },
          { path: 'theatre', select: 'name city address' },
        ],
      })
      .populate('payment')
      .populate('user', 'name email phone');

    return sendSuccess(
      res,
      {
        booking: populatedBooking,
        verified: true,
      },
      'Payment verified successfully. Enjoy the movie!'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Razorpay Webhook endpoint (Raw body signature verified)
// @route   POST /api/v1/payments/webhook
// @access  Public
exports.handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return res.status(400).json({ status: 'invalid_signature' });
      }
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const entity = event.payload?.payment?.entity || event.payload?.order?.entity;
      const orderId = entity?.order_id || entity?.id;

      if (orderId) {
        const payment = await Payment.findOne({ gatewayOrderId: orderId }).populate('booking');
        if (payment && payment.booking && payment.booking.status === 'pending') {
          // Confirm booking via webhook backup path
          const booking = await Booking.findById(payment.booking._id).populate('show user');
          if (booking) {
            const showDate = booking.show.showDate || booking.show.date;
            const showTime = booking.show.showTime || booking.show.startTime;
            const seatNumbers = booking.seats.map((s) => s.seatNumber);

            const qrCode = await generateBookingQRCode({
              bookingCode: booking.bookingCode,
              movieTitle: booking.show.movie.title,
              theatreName: booking.show.theatre.name,
              showDate,
              showTime,
              seats: seatNumbers,
              amount: booking.totalAmount,
              userName: booking.user.name,
            });

            payment.status = 'success';
            payment.gatewayPaymentId = entity.id || 'pay_webhook';
            await payment.save();

            await Seat.updateMany(
              {
                show: booking.show._id,
                seatNumber: { $in: seatNumbers },
              },
              {
                $set: {
                  status: 'booked',
                  booking: booking._id,
                  lockedBy: null,
                  lockExpiresAt: null,
                },
              }
            );

            booking.status = 'confirmed';
            booking.qrCode = qrCode;
            await booking.save();

            broadcastSeatBooked(booking.show._id.toString(), seatNumbers);
          }
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Webhook Error]:', error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Admin refund payment
// @route   POST /api/v1/payments/:id/refund
// @access  Private/Admin
exports.refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return sendError(res, 'Payment not found', 404);
    }

    const { amount, reason } = req.body;
    const refundAmount = amount || payment.amount;

    const refundResult = await processGatewayRefund({
      gateway: payment.gateway,
      paymentId: payment.gatewayPaymentId,
      amount: refundAmount,
      notes: { reason: reason || 'Admin initiated refund' },
    });

    payment.status = 'refunded';
    payment.gatewayResponse.refund = refundResult;
    await payment.save();

    return sendSuccess(res, { payment, refund: refundResult }, 'Refund processed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Submit PhonePe QR Manual Payment (UTR + optional screenshot)
// @route   POST /api/v1/payments/submit-manual-qr
// @access  Private (Audience user)
exports.submitManualPhonePePayment = async (req, res, next) => {
  try {
    const { bookingId, utrNumber } = req.body;
    const userId = req.user.id;

    if (!bookingId) {
      return sendError(res, 'Booking ID is required', 400);
    }

    if (!utrNumber || typeof utrNumber !== 'string') {
      return sendError(res, '12-digit UPI / UTR Transaction ID is required', 400);
    }

    const cleanUtr = utrNumber.trim();
    // Validate 12 digits strictly
    if (!/^\d{12}$/.test(cleanUtr)) {
      return sendError(res, 'Invalid UTR format. UPI Transaction ID / UTR must be exactly 12 numeric digits (e.g. 429182736451).', 400);
    }

    // Check UTR uniqueness across existing bookings and payments
    const existingUtrBooking = await Booking.findOne({
      'manualPayment.utrNumber': cleanUtr,
      _id: { $ne: bookingId },
    });
    const existingUtrPayment = await Payment.findOne({
      utrNumber: cleanUtr,
    });

    if (existingUtrBooking || existingUtrPayment) {
      return sendError(res, 'This 12-digit UTR has already been submitted for another booking. Each payment can only be submitted once.', 409);
    }

    const booking = await Booking.findById(bookingId).populate('show');
    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.user.toString() !== userId && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to submit payment for this booking', 403);
    }

    if (booking.status === 'confirmed') {
      return sendError(res, 'This booking is already confirmed.', 400);
    }

    if (booking.status === 'cancelled' || booking.status === 'expired') {
      return sendError(res, `Booking is ${booking.status}. Please re-select your seats.`, 400);
    }

    // Check screenshot if uploaded via multer
    let screenshotUrl = null;
    if (req.file) {
      screenshotUrl = `/uploads/${req.file.filename}`;
    }

    // Extend reservation to 15 minutes for manual verification
    const fifteenMinutes = new Date(Date.now() + 15 * 60 * 1000);
    booking.expiresAt = fifteenMinutes;
    booking.status = 'payment_under_review';
    booking.manualPayment = {
      utrNumber: cleanUtr,
      screenshotUrl,
      submittedAt: new Date(),
    };
    await booking.save();

    // Extend seat locks to 15 minutes
    const seatNumbers = booking.seats.map((s) => s.seatNumber);
    await Seat.updateMany(
      { show: booking.show._id, seatNumber: { $in: seatNumbers } },
      { $set: { lockExpiresAt: fifteenMinutes } }
    );

    // Create pending Payment record
    await Payment.create({
      booking: booking._id,
      user: userId,
      amount: booking.totalAmount,
      currency: 'INR',
      method: 'phonepe_qr',
      gateway: 'manual_phonepe_qr',
      utrNumber: cleanUtr,
      status: 'created',
      gatewayResponse: {
        submittedAt: new Date().toISOString(),
        screenshotUrl,
        mode: 'manual_verification',
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        booking,
        message: 'Payment submitted for manual verification. Your seats are locked for 15 minutes while an administrator reviews the transaction.',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending payments awaiting manual review
// @route   GET /api/v1/admin/pending-payments
// @access  Private/Admin
exports.getPendingPaymentsAdmin = async (req, res, next) => {
  try {
    const pendingBookings = await Booking.find({ status: 'payment_under_review' })
      .populate('user', 'name email phone avatar')
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title poster certification runtime language' },
          { path: 'theatre', select: 'name city address' },
        ],
      })
      .sort({ 'manualPayment.submittedAt': -1 });

    return sendSuccess(res, { count: pendingBookings.length, pendingBookings }, 'Pending payments retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Approve manual PhonePe QR payment
// @route   POST /api/v1/admin/payments/:bookingId/approve
// @access  Private/Admin
exports.approveManualPaymentAdmin = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title poster certificate runtime duration language' },
          { path: 'theatre', select: 'name city address' },
        ],
      })
      .populate('user', 'name email phone');

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.status !== 'payment_under_review') {
      return sendError(res, `Booking is currently in '${booking.status}' status, cannot approve.`, 400);
    }

    const showDate = booking.show.showDate || booking.show.date;
    const showTime = booking.show.showTime || booking.show.startTime;
    const seatNumbers = booking.seats.map((s) => s.seatNumber);

    // Generate signed Ticket QR
    const qrResult = await generateBookingQRCode({
      bookingId: booking._id,
      showId: booking.show._id,
      bookingCode: booking.bookingCode,
      movieTitle: booking.show.movie.title,
      theatreName: booking.show.theatre.name,
      showDate,
      showTime,
      seats: seatNumbers,
      amount: booking.totalAmount,
      userName: booking.user.name,
    });

    const qrCode = qrResult.qrCode || qrResult;
    const ticketToken = qrResult.ticketToken || '';

    // Update or create Payment
    let payment = await Payment.findOne({ booking: booking._id });
    if (!payment) {
      payment = new Payment({
        booking: booking._id,
        user: booking.user._id,
        amount: booking.totalAmount,
        currency: 'INR',
        method: 'phonepe_qr',
        gateway: 'manual_phonepe_qr',
        utrNumber: booking.manualPayment?.utrNumber,
      });
    }

    payment.status = 'success';
    payment.gatewayPaymentId = booking.manualPayment?.utrNumber || `utr_${Date.now()}`;
    payment.transactionId = booking.manualPayment?.utrNumber || `utr_${Date.now()}`;
    payment.gatewayResponse = {
      verifiedByAdminId: req.user._id,
      approvedAt: new Date().toISOString(),
      utrNumber: booking.manualPayment?.utrNumber,
      screenshotUrl: booking.manualPayment?.screenshotUrl,
    };
    await payment.save();

    // Mark seats as booked
    await Seat.updateMany(
      { show: booking.show._id, seatNumber: { $in: seatNumbers } },
      {
        $set: {
          status: 'booked',
          booking: booking._id,
          lockedBy: null,
          lockExpiresAt: null,
        },
      }
    );

    // Confirm booking
    booking.status = 'confirmed';
    booking.qrCode = qrCode;
    booking.ticketToken = ticketToken;
    booking.ticketUsed = false;
    booking.payment = payment._id;
    if (booking.manualPayment) {
      booking.manualPayment.reviewedAt = new Date();
      booking.manualPayment.reviewedBy = req.user._id;
    }
    await booking.save();

    // Broadcast seat-booked socket event
    broadcastSeatBooked(booking.show._id.toString(), seatNumbers);

    // Send emails & user notifications
    await Notification.create({
      user: booking.user._id,
      title: 'Payment Approved! 🎟️',
      message: `Your PhonePe payment of ₹${booking.totalAmount} has been verified by the administrator. Your ticket ${booking.bookingCode} for "${booking.show.movie.title}" is confirmed!`,
      type: 'booking',
      isRead: false,
    });

    sendBookingConfirmationEmail({
      to: booking.user.email,
      userName: booking.user.name,
      movieTitle: booking.show.movie.title,
      theatreName: booking.show.theatre.name,
      showDate,
      showTime,
      seats: seatNumbers,
      totalAmount: booking.totalAmount,
      bookingCode: booking.bookingCode,
    });

    return sendSuccess(res, { booking, payment }, 'Manual payment approved and booking confirmed successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Reject manual PhonePe QR payment and release seats
// @route   POST /api/v1/admin/payments/:bookingId/reject
// @access  Private/Admin
exports.rejectManualPaymentAdmin = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { reason = 'Transaction ID / UTR could not be verified in PhonePe account' } = req.body;

    const booking = await Booking.findById(bookingId).populate('show user');
    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.status !== 'payment_under_review') {
      return sendError(res, `Booking is in '${booking.status}' status, cannot reject.`, 400);
    }

    const seatNumbers = booking.seats.map((s) => s.seatNumber);

    // Release seats back to available
    await Seat.updateMany(
      { show: booking.show._id, seatNumber: { $in: seatNumbers } },
      {
        $set: {
          status: 'available',
          lockedBy: null,
          lockExpiresAt: null,
          booking: null,
        },
      }
    );

    // Broadcast seat-released socket event
    broadcastSeatReleased(booking.show._id.toString(), seatNumbers);

    // Mark booking cancelled
    booking.status = 'cancelled';
    booking.refundStatus = 'ineligible';
    if (booking.manualPayment) {
      booking.manualPayment.reviewedAt = new Date();
      booking.manualPayment.reviewedBy = req.user._id;
      booking.manualPayment.rejectionReason = reason;
    }
    await booking.save();

    // Mark payment failed
    await Payment.updateMany(
      { booking: booking._id },
      { $set: { status: 'failed', failureReason: reason } }
    );

    // Notify user
    await Notification.create({
      user: booking.user._id,
      title: 'Payment Verification Failed ❌',
      message: `Your payment for booking ${booking.bookingCode} could not be verified: ${reason}. Your seats have been released.`,
      type: 'system',
      isRead: false,
    });

    return sendSuccess(res, { booking, reason }, 'Payment rejected and seats released back to availability');
  } catch (error) {
    next(error);
  }
};


// @desc    Get payment and booking status
// @route   GET /api/v1/payments/status/:bookingId
// @access  Public / Private
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate('payment');
    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }
    return sendSuccess(res, {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      bookingStatus: booking.status,
      paymentStatus: booking.payment ? booking.payment.status : 'pending',
      booking,
    });
  } catch (error) {
    next(error);
  }
};
