const Notification = require('../models/Notification');
const User = require('../models/User');

// Отримати всі сповіщення користувача
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipientId: userId })
      .populate('senderId', 'username fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipientId: userId });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: err.message
    });
  }
};

// Отримати непрочитані сповіщення
exports.getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ 
      recipientId: userId,
      isRead: false 
    })
      .populate('senderId', 'username fullName avatar')
      .sort({ createdAt: -1 });

    const count = notifications.length;

    res.status(200).json({
      success: true,
      count,
      data: notifications
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unread notifications',
      error: err.message
    });
  }
};

// Позначити сповіщення як прочитане
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: err.message
    });
  }
};

// Позначити всі сповіщення як прочитані
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: err.message
    });
  }
};

// Видалити сповіщення
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: err.message
    });
  }
};

// Допоміжна функція для створення сповіщення
exports.createNotification = async (recipientId, type, title, message, senderId = null, relatedId = null, relatedModel = null) => {
  try {
    const notification = await Notification.create({
      recipientId,
      senderId,
      type,
      title,
      message,
      relatedId,
      relatedModel
    });
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};
