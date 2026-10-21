const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} = require('../controllers/bookingController');
const { protectRoute } = require('../middleware/auth');

router.post('/', protectRoute, createBooking);
router.get('/my', protectRoute, getMyBookings);
router.get('/:id', protectRoute, getBookingById);
router.put('/:id/cancel', protectRoute, cancelBooking);

module.exports = router;
