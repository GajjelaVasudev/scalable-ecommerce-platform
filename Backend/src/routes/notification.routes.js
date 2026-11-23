const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences
} = require('../controllers/notification.controller');

// All notification routes require authenticated buyer/admin
router.use(authMiddleware);
router.use(authorize('buyer', 'admin'));

// Specific endpoints before parameterized :id
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/mark-all-read', markAllAsRead);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// Item-specific actions
router.patch('/:id/read', markAsRead);
router.patch('/:id/unread', markAsUnread);
router.delete('/:id', deleteNotification);

module.exports = router;
