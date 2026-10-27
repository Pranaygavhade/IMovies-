const express = require('express');
const router = express.Router();
const {
  getShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow,
} = require('../controllers/showController');
const { lockSeats, releaseSeats } = require('../controllers/seatController');
const { protectRoute, authorizeRoles } = require('../middleware/auth');
const { validate, showValidation } = require('../middleware/validator');

router.get('/', getShows);
router.get('/:id', getShowById);
router.get('/:id/seats', getShowById);

// Seat locking & releasing
router.post('/:id/lock-seats', protectRoute, lockSeats);
router.post('/:id/release-seats', protectRoute, releaseSeats);
router.post('/:id/unlock-seats', protectRoute, releaseSeats);

router.post('/', protectRoute, authorizeRoles('admin'), validate(showValidation), createShow);
router.put('/:id', protectRoute, authorizeRoles('admin'), updateShow);
router.delete('/:id', protectRoute, authorizeRoles('admin'), deleteShow);

module.exports = router;
