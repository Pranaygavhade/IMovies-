const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  toggleUserStatus,
  getAllBookings,
  getAllPayments,
  exportRevenueReportCSV,
} = require('../controllers/adminController');
const { protectRoute, authorizeRoles } = require('../middleware/auth');

router.use(protectRoute);
router.use(authorizeRoles('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);
router.get('/reports/revenue-csv', exportRevenueReportCSV);
router.get('/reports/revenue/csv', exportRevenueReportCSV);

module.exports = router;
