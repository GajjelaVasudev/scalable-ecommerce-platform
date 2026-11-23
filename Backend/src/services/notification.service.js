const mongoose = require('mongoose');
const { Notification, NOTIFICATION_CATEGORIES } = require('../models/notification.model');
const NotificationPreference = require('../models/notificationPreference.model');

const CATEGORY_DEFAULT_ICONS = {
    orders: 'shopping_bag',
    payments: 'payments',
    delivery: 'local_shipping',
    returns: 'assignment_return',
    offers: 'sell',
    account: 'manage_accounts',
    system: 'notifications'
};

/**
 * Checks if user has enabled notifications for this specific type.
 */
async function isNotificationEnabled(userId, prefKey) {
    try {
        if (!userId) return false;
        const prefs = await NotificationPreference.findOne({ user: userId }).lean();
        if (!prefs) return true; // Default is true for most preferences

        // Check channel setting first
        if (prefs.inApp === false) return false;

        // Check specific preference setting if provided
        if (prefKey && prefs[prefKey] === false) return false;

        return true;
    } catch (err) {
        console.warn('[NotificationService] Preference check error:', err.message);
        return true; // Fail open to allow notification
    }
}

/**
 * Safe notification creation with preference check and deduplication.
 */
async function sendNotification({
    userId,
    category = 'system',
    title,
    message,
    icon,
    actionUrl = '',
    actionLabel = '',
    dedupeKey = null,
    metadata = {},
    prefKey = null
}) {
    if (!userId || !title || !message) {
        return null;
    }

    try {
        const enabled = await isNotificationEnabled(userId, prefKey);
        if (!enabled) {
            return null;
        }

        const resolvedCategory = NOTIFICATION_CATEGORIES.includes(category) ? category : 'system';
        const resolvedIcon = icon || CATEGORY_DEFAULT_ICONS[resolvedCategory] || 'notifications';

        const notificationData = {
            user: userId,
            category: resolvedCategory,
            title: title.trim(),
            message: message.trim(),
            icon: resolvedIcon,
            actionUrl: actionUrl ? String(actionUrl).trim() : '',
            actionLabel: actionLabel ? String(actionLabel).trim() : '',
            metadata
        };

        if (dedupeKey && typeof dedupeKey === 'string' && dedupeKey.trim()) {
            const cleanDedupeKey = dedupeKey.trim();
            const notification = await Notification.findOneAndUpdate(
                { dedupeKey: cleanDedupeKey },
                {
                    $setOnInsert: {
                        ...notificationData,
                        dedupeKey: cleanDedupeKey,
                        isRead: false,
                        readAt: null
                    }
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
            return notification;
        }

        const notification = await Notification.create(notificationData);
        return notification;
    } catch (err) {
        // Log without crashing the caller
        console.warn('[NotificationService] sendNotification warning:', err.message);
        return null;
    }
}

module.exports = {
    sendNotification,
    isNotificationEnabled,
    CATEGORY_DEFAULT_ICONS
};
