const express = require('express');
const router = express.Router();

const {
  getNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

const { protect } = require('../middleware/auth');

// Отримати всі сповіщення користувача
router.get('/', protect, getNotifications);

// Отримати тільки непрочитані сповіщення
router.get('/unread', protect, getUnreadNotifications);

// Позначити одне сповіщення як прочитане
router.put('/:notificationId/read', protect, markAsRead);

// Позначити всі сповіщення як прочитані
router.put('/read-all', protect, markAllAsRead);

// Видалити сповіщення
router.delete('/:notificationId', protect, deleteNotification);

module.exports = router;
