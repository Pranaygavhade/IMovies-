const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment } = require('../controllers/paymentController');
const { protectRoute } = require('../middleware/auth');

router.post('/initiate', protectRoute, initiatePayment);
router.post('/verify', protectRoute, verifyPayment);

module.exports = router;
