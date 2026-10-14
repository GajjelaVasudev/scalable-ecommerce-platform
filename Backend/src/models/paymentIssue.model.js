const mongoose = require('mongoose');

const paymentIssueSchema = new mongoose.Schema({
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    providerPaymentId: {
        type: String,
        required: true
    },
    providerOrderId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['duplicate_charge', 'inventory_unavailable'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    amountMinor: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending_review', 'resolved'],
        default: 'pending_review'
    },
    resolutionNote: {
        type: String,
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

paymentIssueSchema.index({ providerPaymentId: 1 }, { unique: true });
paymentIssueSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentIssue', paymentIssueSchema);
