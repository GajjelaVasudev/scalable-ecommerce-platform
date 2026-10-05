const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        unique: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
        enum: [
            'created',
            'pending',
            'paid',
            'failed',
            'refunded'
        ],
        default: 'created'
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

paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ providerPaymentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;