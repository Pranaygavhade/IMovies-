const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  refundPayment,
  submitManualPhonePePayment,
  getPendingPaymentsAdmin,
  approveManualPaymentAdmin,
  rejectManualPaymentAdmin,
  getPaymentStatus,
} = require('../controllers/paymentController');
const { protectRoute, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  validate,
  paymentInitiateValidation,
  paymentVerifyValidation,
} = require('../middleware/validator');

// Razorpay standard & alias endpoints
router.post('/initiate', protectRoute, validate(paymentInitiateValidation), initiatePayment);
router.post('/create-order', protectRoute, initiatePayment);
router.post('/phonepe/create-order', protectRoute, initiatePayment);
router.post('/verify', protectRoute, validate(paymentVerifyValidation), verifyPayment);
router.get('/status/:bookingId', getPaymentStatus);
router.post('/webhook', handleWebhook);
router.post('/:id/refund', protectRoute, authorizeRoles('admin'), refundPayment);

// PhonePe & UPI QR Manual Verification Flow
router.post('/submit-manual-qr', protectRoute, upload.single('screenshot'), submitManualPhonePePayment);
router.post('/phonepe/submit', protectRoute, upload.single('screenshot'), submitManualPhonePePayment);
router.post('/upi-qr/submit', protectRoute, upload.single('screenshot'), submitManualPhonePePayment);
router.get('/pending-admin', protectRoute, authorizeRoles('admin'), getPendingPaymentsAdmin);
router.post('/:bookingId/approve', protectRoute, authorizeRoles('admin'), approveManualPaymentAdmin);
router.post('/:bookingId/reject', protectRoute, authorizeRoles('admin'), rejectManualPaymentAdmin);

module.exports = router;
