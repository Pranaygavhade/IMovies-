const crypto = require('crypto');
const QRCode = require('qrcode');

const getTicketSecret = () => {
  return process.env.TICKET_QR_SECRET || process.env.JWT_SECRET || 'imovies_ticket_hmac_secret_2026_cinema';
};

/**
 * Creates a signed ticket token using HMAC-SHA256
 * @param {Object} params - { bookingId, showId, seats, expiry }
 * @returns {string} Signed token
 */
const signTicketToken = ({ bookingId, showId, seats, expiry }) => {
  const secret = getTicketSecret();
  const seatList = Array.isArray(seats)
    ? seats
        .map((s) => (typeof s === 'string' ? s : s.seatNumber || s.seatId || String(s)))
        .sort()
        .join(',')
    : String(seats);

  const expTime = expiry instanceof Date ? expiry.getTime() : typeof expiry === 'number' ? expiry : Date.now() + 14 * 24 * 60 * 60 * 1000;
  const payloadData = `${bookingId}:${showId}:${seatList}:${expTime}`;
  const signature = crypto.createHmac('sha256', secret).update(payloadData).digest('hex');

  const tokenObj = {
    bId: String(bookingId),
    sId: String(showId),
    sts: seatList,
    exp: expTime,
    sig: signature,
  };

  return Buffer.from(JSON.stringify(tokenObj)).toString('base64url');
};

/**
 * Verifies a ticket token's HMAC-SHA256 signature and expiry
 * @param {string} token
 * @returns {Object} { valid: boolean, reason?: string, data?: Object }
 */
const verifyTicketToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, reason: 'missing_token' };
    }

    const secret = getTicketSecret();
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
    const { bId, sId, sts, exp, sig } = JSON.parse(jsonStr);

    if (!bId || !sId || !sig) {
      return { valid: false, reason: 'invalid_format' };
    }

    const payloadData = `${bId}:${sId}:${sts}:${exp}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadData).digest('hex');

    // Constant-time signature comparison to prevent timing attacks
    const sigBuffer = Buffer.from(sig, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return { valid: false, reason: 'invalid_signature' };
    }

    return {
      valid: true,
      data: {
        bookingId: bId,
        showId: sId,
        seats: sts ? sts.split(',') : [],
        expiry: exp,
      },
    };
  } catch (err) {
    return { valid: false, reason: 'malformed_token', error: err.message };
  }
};

/**
 * Generate a QR code data URL for a confirmed booking encoding the signed token
 * @param {Object} bookingData - Details of the booking
 * @returns {Promise<{ qrCode: string, ticketToken: string }>} Base64 data URL string of QR code & raw token
 */
const generateBookingQRCode = async (bookingData) => {
  try {
    const bookingId = bookingData._id || bookingData.id || bookingData.bookingId;
    const showId = bookingData.show?._id || bookingData.show || bookingData.showId;
    const seats = bookingData.seats || [];
    const expiry = bookingData.expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000;

    // Generate signed HMAC-SHA256 token
    const ticketToken = signTicketToken({
      bookingId,
      showId,
      seats,
      expiry,
    });

    // The QR encodes ONLY the signed token, NEVER plain booking data
    const qrCode = await QRCode.toDataURL(ticketToken, {
      color: {
        dark: '#0b0b12',
        light: '#ffffff',
      },
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    return { qrCode, ticketToken };
  } catch (error) {
    console.error('[QR Service] Failed to generate signed QR Code:', error.message);
    return { qrCode: '', ticketToken: '' };
  }
};

module.exports = {
  signTicketToken,
  verifyTicketToken,
  generateBookingQRCode,
};
