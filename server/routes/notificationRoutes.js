const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { protectRoute } = require('../middleware/auth');

router.use(protectRoute);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;
