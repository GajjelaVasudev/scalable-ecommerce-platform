const mongoose = require('mongoose');
const { Notification, NOTIFICATION_CATEGORIES } = require('../models/notification.model');
const NotificationPreference = require('../models/notificationPreference.model');

const ALLOWED_PREFERENCE_KEYS = [
    'orderConfirmation',
    'paymentUpdates',
    'shippingUpdates',
    'deliveryUpdates',
    'cancellationUpdates',
    'returnStatus',
    'refundStatus',
    'priceDropAlerts',
    'backInStockAlerts',
    'promotionalOffers',
    'profileChanges',
    'securityAlerts',
    'inApp',
    'email',
    'push'
];

async function getNotifications(req, res) {
    try {
        const userId = req.user.id;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = { user: userId };

        const { category, isRead } = req.query;
        if (category && category !== 'all' && NOTIFICATION_CATEGORIES.includes(category)) {
            filter.category = category;
        }

        if (isRead !== undefined && isRead !== '') {
            filter.isRead = isRead === 'true' || isRead === true;
        }

        const [notifications, totalNotifications, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ user: userId, isRead: false })
        ]);

        return res.status(200).json({
            message: 'Notifications fetched successfully',
            notifications,
            pagination: {
                page,
                limit,
                totalNotifications,
                totalPages: Math.ceil(totalNotifications / limit) || 1,
                unreadCount
            }
        });
    } catch (err) {
        console.error('getNotifications error:', err.message);
        return res.status(500).json({ message: 'Failed to fetch notifications' });
    }
}

async function getUnreadCount(req, res) {
    try {
        const userId = req.user.id;
        const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

        return res.status(200).json({
            message: 'Unread count fetched successfully',
            unreadCount
        });
    } catch (err) {
        console.error('getUnreadCount error:', err.message);
        return res.status(500).json({ message: 'Failed to fetch unread count' });
    }
}

async function markAsRead(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid notification ID' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.status(200).json({
            message: 'Notification marked as read',
            notification
        });
    } catch (err) {
        console.error('markAsRead error:', err.message);
        return res.status(500).json({ message: 'Failed to update notification' });
    }
}

async function markAsUnread(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid notification ID' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: userId },
            { isRead: false, readAt: null },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.status(200).json({
            message: 'Notification marked as unread',
            notification
        });
    } catch (err) {
        console.error('markAsUnread error:', err.message);
        return res.status(500).json({ message: 'Failed to update notification' });
    }
}

async function markAllAsRead(req, res) {
    try {
        const userId = req.user.id;
        const result = await Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        return res.status(200).json({
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error('markAllAsRead error:', err.message);
        return res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
}

async function deleteNotification(req, res) {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid notification ID' });
        }

        const notification = await Notification.findOneAndDelete({ _id: id, user: userId });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        return res.status(200).json({
            message: 'Notification dismissed successfully'
        });
    } catch (err) {
        console.error('deleteNotification error:', err.message);
        return res.status(500).json({ message: 'Failed to dismiss notification' });
    }
}

async function getPreferences(req, res) {
    try {
        const userId = req.user.id;

        const preferences = await NotificationPreference.findOneAndUpdate(
            { user: userId },
            { $setOnInsert: { user: userId } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        return res.status(200).json({
            message: 'Notification preferences fetched successfully',
            preferences
        });
    } catch (err) {
        console.error('getPreferences error:', err.message);
        return res.status(500).json({ message: 'Failed to fetch notification preferences' });
    }
}

async function updatePreferences(req, res) {
    try {
        const userId = req.user.id;
        const updates = {};

        for (const key of ALLOWED_PREFERENCE_KEYS) {
            if (typeof req.body[key] === 'boolean') {
                updates[key] = req.body[key];
            }
        }

        const preferences = await NotificationPreference.findOneAndUpdate(
            { user: userId },
            { $set: updates, $setOnInsert: { user: userId } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        return res.status(200).json({
            message: 'Notification preferences updated successfully',
            preferences
        });
    } catch (err) {
        console.error('updatePreferences error:', err.message);
        return res.status(500).json({ message: 'Failed to update notification preferences' });
    }
}

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences
};
