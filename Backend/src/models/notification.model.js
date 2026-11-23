const mongoose = require('mongoose');

const NOTIFICATION_CATEGORIES = [
    'orders',
    'payments',
    'delivery',
    'returns',
    'offers',
    'account',
    'system'
];

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        category: {
            type: String,
            enum: NOTIFICATION_CATEGORIES,
            default: 'system',
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        icon: {
            type: String,
            default: 'notifications',
            trim: true
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: {
            type: Date,
            default: null
        },
        actionUrl: {
            type: String,
            default: '',
            trim: true
        },
        actionLabel: {
            type: String,
            default: '',
            trim: true
        },
        dedupeKey: {
            type: String,
            sparse: true,
            unique: true,
            trim: true,
            set: function(val) {
                if (val === null || val === undefined || (typeof val === 'string' && !val.trim())) {
                    return undefined;
                }
                return typeof val === 'string' ? val.trim() : val;
            }
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

// Guarantee dedupeKey is completely undefined (not null or empty string)
// when absent so MongoDB's sparse index never collides on null values.
notificationSchema.pre('validate', function(next) {
    if (this.dedupeKey === null || this.dedupeKey === '' || (typeof this.dedupeKey === 'string' && !this.dedupeKey.trim())) {
        this.dedupeKey = undefined;
    }
    next();
});

notificationSchema.pre('save', function(next) {
    if (this.dedupeKey === null || this.dedupeKey === '' || (typeof this.dedupeKey === 'string' && !this.dedupeKey.trim())) {
        this.dedupeKey = undefined;
    }
    next();
});

// Compound indexes for optimal querying
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, category: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
    Notification,
    NOTIFICATION_CATEGORIES
};
