const QRCode = require('qrcode');

/**
 * Generate a QR code data URL for a confirmed booking
 * @param {Object} bookingData - Details of the booking
 * @returns {Promise<string>} Base64 data URL string of QR code
 */
const generateBookingQRCode = async (bookingData) => {
  try {
    const payload = JSON.stringify({
      bookingCode: bookingData.bookingCode,
      movie: bookingData.movieTitle,
      theatre: bookingData.theatreName,
      date: bookingData.showDate,
      time: bookingData.showTime,
      seats: bookingData.seats,
      amount: bookingData.amount,
      user: bookingData.userName,
      issuedAt: new Date().toISOString(),
    });

    const qrDataUrl = await QRCode.toDataURL(payload, {
      color: {
        dark: '#0b0b12',
        light: '#ffffff',
      },
      width: 300,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    return qrDataUrl;
  } catch (error) {
    console.error('Failed to generate QR Code:', error.message);
    return '';
  }
};

module.exports = { generateBookingQRCode };
