const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  toggleUserStatus,
  getAllBookings,
} = require('../controllers/adminController');
const { protectRoute, authorizeRoles } = require('../middleware/auth');

// All admin routes require protectRoute and authorizeRoles('admin')
router.use(protectRoute);
router.use(authorizeRoles('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/bookings', getAllBookings);

module.exports = router;
