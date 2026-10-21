const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get current user's notifications
// @route   GET /api/v1/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
    });

    return sendSuccess(res, { notifications, unreadCount }, 'Notifications retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    return sendSuccess(res, { notification }, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    return sendSuccess(res, {}, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};
