const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  refundPayment,
} = require('../controllers/paymentController');
const { protectRoute, authorizeRoles } = require('../middleware/auth');
const {
  validate,
  paymentInitiateValidation,
  paymentVerifyValidation,
} = require('../middleware/validator');

router.post('/initiate', protectRoute, validate(paymentInitiateValidation), initiatePayment);
router.post('/verify', protectRoute, validate(paymentVerifyValidation), verifyPayment);
router.post('/webhook', handleWebhook);
router.post('/:id/refund', protectRoute, authorizeRoles('admin'), refundPayment);

module.exports = router;
