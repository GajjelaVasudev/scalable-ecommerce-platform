const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true
            },
            variant: {
                type: String,
                required: true,
                default: 'default',
                trim: true  
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    deliveryStatus: {
        type: String,
        enum: ['pending', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'unpaid', 'pending', 'refunded'],
        default: 'unpaid'
    },
    trackingNumber: {
        type: String,
        default: ''
    },
    paymentMethod: {
        type: String,
        enum: ['UPI', 'CARD', 'NETBANKING', 'EMI', 'COD'],
        default: 'UPI'
    },
    cancellationReason: {
        type: String,
        default: ''
    },
    returnReason: {
        type: String,
        default: ''
    },
    refundStatus: {
        type: String,
        enum: ['none', 'pending', 'completed', 'failed'],
        default: 'none'
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    shippingAddress: {
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    addressLine: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    postalCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    }
}
    
}, {
    timestamps: true
});

// indexing
orderSchema.index({ user: 1 });
orderSchema.index({ deliveryStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

const OrderModel = mongoose.model('Order', orderSchema);

module.exports = OrderModel;