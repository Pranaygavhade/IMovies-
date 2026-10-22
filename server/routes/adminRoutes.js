const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  toggleUserStatus,
  getAllBookings,
  getAllPayments,
  exportRevenueReportCSV,
  syncMoviesAdmin,
  generateShowsAdmin,
} = require('../controllers/adminController');
const { protectRoute, authorizeRoles } = require('../middleware/auth');

const {
  getPendingPaymentsAdmin,
  approveManualPaymentAdmin,
  rejectManualPaymentAdmin,
} = require('../controllers/paymentController');

router.use(protectRoute);
router.use(authorizeRoles('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);
router.get('/sync/movies', syncMoviesAdmin);
router.post('/generate-shows', generateShowsAdmin);
router.get('/generate-shows', generateShowsAdmin);
router.get('/reports/revenue-csv', exportRevenueReportCSV);
router.get('/reports/revenue/csv', exportRevenueReportCSV);

// Pending Manual Payments Review & Approval
router.get('/pending-payments', getPendingPaymentsAdmin);
router.post('/payments/:bookingId/approve', approveManualPaymentAdmin);
router.post('/payments/:bookingId/reject', rejectManualPaymentAdmin);

module.exports = router;
