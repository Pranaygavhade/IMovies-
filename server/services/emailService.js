const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('[EmailService] SMTP transporter configured with host:', process.env.SMTP_HOST);
} else {
  console.log('[EmailService] SMTP credentials not set. Emails will be logged to console in demo mode.');
}

/**
 * Send Booking Confirmation Email
 */
const sendBookingConfirmationEmail = async ({ to, name, bookingCode, movieTitle, theatreName, showDate, showTime, seats, totalAmount }) => {
  const subject = `🎬 Booking Confirmed! Ticket #${bookingCode} – IMovies`;
  const textContent = `Hello ${name},\n\nYour tickets for "${movieTitle}" at ${theatreName} on ${showDate} at ${showTime} are confirmed!\nSeats: ${seats.join(', ')}\nTotal Paid: ₹${totalAmount}\nBooking Code: ${bookingCode}\n\nEnjoy the movie!\nTeam IMovies`;
  
  const htmlContent = `
    <div style="background-color: #0b0b12; color: #ffffff; font-family: 'Poppins', Arial, sans-serif; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
      <div style="text-align: center; border-bottom: 2px solid #e50914; padding-bottom: 16px;">
        <h1 style="color: #e50914; margin: 0; font-size: 28px; letter-spacing: 1px;">IMOVIES</h1>
        <p style="color: #9494a8; margin: 4px 0 0 0; font-size: 13px;">Movie ticket booking made simple</p>
      </div>
      <div style="padding: 24px 0;">
        <h2 style="color: #ffffff; margin-top: 0;">Booking Confirmed! 🍿</h2>
        <p style="color: #d1d1db;">Hi <strong>${name}</strong>, your movie tickets are ready!</p>
        
        <div style="background-color: #141422; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 18px; margin: 20px 0;">
          <h3 style="color: #ffffff; margin: 0 0 10px 0; font-size: 20px;">${movieTitle}</h3>
          <p style="margin: 4px 0; color: #9494a8;"><strong>Cinema:</strong> <span style="color: #e50914;">${theatreName}</span></p>
          <p style="margin: 4px 0; color: #9494a8;"><strong>Date & Time:</strong> ${showDate} • ${showTime}</p>
          <p style="margin: 4px 0; color: #9494a8;"><strong>Seats:</strong> <span style="color: #d4af37; font-weight: bold;">${seats.join(', ')}</span></p>
          <p style="margin: 4px 0; color: #9494a8;"><strong>Total Paid:</strong> ₹${totalAmount}</p>
          <p style="margin: 4px 0; color: #9494a8;"><strong>Booking Reference:</strong> <span style="color: #00e676; font-weight: bold;">${bookingCode}</span></p>
        </div>
        <p style="color: #9494a8; font-size: 12px;">Please present your digital QR code at the cinema entry gate.</p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || '"IMovies Tickets" <tickets@imovies.com>',
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[EmailService] Confirmation email sent to ${to}`);
    } catch (err) {
      console.error('[EmailService Error]:', err.message);
    }
  } else {
    console.log(`[Email Log] To: ${to} | Subject: ${subject}`);
    console.log(`[Email Log Content]:\n${textContent}\n`);
  }
};

/**
 * Send Payment Receipt Email
 */
const sendPaymentReceiptEmail = async ({ to, name, transactionId, amount, method, bookingCode }) => {
  const subject = `Receipt for Booking ${bookingCode} – IMovies Payment`;
  const textContent = `Hi ${name},\n\nPayment of ₹${amount} received via ${method}.\nTransaction ID: ${transactionId}\nBooking Code: ${bookingCode}\n\nThank you for choosing IMovies!`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || '"IMovies Payments" <billing@imovies.com>',
        to,
        subject,
        text: textContent,
      });
    } catch (err) {
      console.error('[EmailService Error]:', err.message);
    }
  } else {
    console.log(`[Email Log Receipt] To: ${to} | Amount: ₹${amount} | Txn: ${transactionId}`);
  }
};

/**
 * Send Cancellation and Refund Notification
 */
const sendCancellationEmail = async ({ to, name, bookingCode, refundStatus, refundAmount }) => {
  const subject = `Booking Cancelled: ${bookingCode} – IMovies`;
  const textContent = `Hi ${name},\n\nYour booking ${bookingCode} has been cancelled.\nRefund Status: ${refundStatus}\nRefund Amount: ₹${refundAmount}\n\nIf you have any questions, please contact support@imovies.com.`;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || '"IMovies Support" <support@imovies.com>',
        to,
        subject,
        text: textContent,
      });
    } catch (err) {
      console.error('[EmailService Error]:', err.message);
    }
  } else {
    console.log(`[Email Log Cancellation] To: ${to} | Code: ${bookingCode} | Refund: ₹${refundAmount} (${refundStatus})`);
  }
};

module.exports = {
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
  sendCancellationEmail,
};
