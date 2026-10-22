const express = require('express');
const router = express.Router();
const { verifyTicket } = require('../controllers/ticketController');
const { protectRoute, authorizeRoles } = require('../middleware/auth');

// All ticket verification endpoints require authentication and admin/staff role
router.get('/verify', protectRoute, authorizeRoles('admin'), verifyTicket);

module.exports = router;
