const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        // 01 Order updates
        orderConfirmation: {
            type: Boolean,
            default: true
        },
        paymentUpdates: {
            type: Boolean,
            default: true
        },
        shippingUpdates: {
            type: Boolean,
            default: true
        },
        deliveryUpdates: {
            type: Boolean,
            default: true
        },
        cancellationUpdates: {
            type: Boolean,
            default: true
        },
        // 02 Returns and refunds
        returnStatus: {
            type: Boolean,
            default: true
        },
        refundStatus: {
            type: Boolean,
            default: true
        },
        // 03 Wishlist and shopping
        priceDropAlerts: {
            type: Boolean,
            default: true
        },
        backInStockAlerts: {
            type: Boolean,
            default: true
        },
        promotionalOffers: {
            type: Boolean,
            default: false
        },
        // 04 Account
        profileChanges: {
            type: Boolean,
            default: true
        },
        securityAlerts: {
            type: Boolean,
            default: true
        },
        // 05 Channels
        inApp: {
            type: Boolean,
            default: true
        },
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const NotificationPreference = mongoose.model(
    'NotificationPreference',
    notificationPreferenceSchema
);

module.exports = NotificationPreference;
