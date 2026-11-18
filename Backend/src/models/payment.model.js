const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    provider: {
        type: String,
        enum: ['razorpay'],
        default: 'razorpay'
    },
    providerPaymentId: {
        type: String,
        default: null
    },
    providerOrderId: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['created', 'pending', 'paid', 'failed', 'refunded'],
        default: 'created'
    },
    activeAttempt: {
        type: Boolean,
        default: false
    },
    failureReason: {
        type: String,
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

paymentSchema.index({ order: 1, createdAt: -1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });

// Permit only one active payment attempt per order.
paymentSchema.index(
    { order: 1 },
    {
        unique: true,
        partialFilterExpression: { activeAttempt: true }
    }
);

paymentSchema.index(
    { providerOrderId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            providerOrderId: { $type: 'string' }
        }
    }
);

paymentSchema.index(
    { providerPaymentId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            providerPaymentId: { $type: 'string' }
        }
    }
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
