const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    event: {
        type: String,
        required: true
    },
    providerPaymentId: {
        type: String,
        required: true
    },
    providerOrderId: {
        type: String,
        required: true
    }
}, { timestamps: true });

webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
