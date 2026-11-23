const mongoose = require('mongoose');
const {
    VALID_RETURN_STATUSES,
    VALID_REFUND_STATUSES,
    VALID_INSPECTION_CONDITIONS,
    VALID_DISPOSITIONS
} = require('../config/returnPolicy.config');

const returnItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    variant: {
        type: String,
        default: 'default',
        trim: true
    },
    image: {
        type: String,
        trim: true,
        default: ''
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    customerNotes: {
        type: String,
        default: '',
        trim: true
    },
    evidenceImages: [{
        type: String,
        trim: true
    }],
    inspection: {
        condition: {
            type: String,
            enum: VALID_INSPECTION_CONDITIONS,
            default: 'uninspected'
        },
        disposition: {
            type: String,
            enum: VALID_DISPOSITIONS,
            default: 'pending'
        },
        isRestocked: {
            type: Boolean,
            default: false
        },
        notes: {
            type: String,
            default: '',
            trim: true
        },
        inspectedAt: {
            type: Date,
            default: null
        },
        inspectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    }
}, { _id: true });

const returnRequestSchema = new mongoose.Schema({
    rmaNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    items: {
        type: [returnItemSchema],
        validate: {
            validator: (items) => Array.isArray(items) && items.length > 0,
            message: 'A return request must contain at least one item'
        }
    },
    totalRefundAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: VALID_RETURN_STATUSES,
        default: 'requested',
        index: true
    },
    rejectionReason: {
        type: String,
        default: '',
        trim: true
    },
    pickupDetails: {
        address: {
            fullName: { type: String, default: '' },
            phone: { type: String, default: '' },
            addressLine: { type: String, default: '' },
            city: { type: String, default: '' },
            state: { type: String, default: '' },
            postalCode: { type: String, default: '' },
            country: { type: String, default: 'India' }
        },
        scheduledDate: { type: Date, default: null },
        carrier: { type: String, default: 'OMIZON Logistics (Reverse)' },
        trackingNumber: { type: String, default: '' },
        pickupInstructions: { type: String, default: '' }
    },
    refundMethod: {
        type: {
            type: String,
            enum: ['ORIGINAL_GATEWAY', 'COD_BANK_TRANSFER', 'COD_UPI'],
            required: true
        },
        paymentMethod: {
            type: String,
            default: 'UPI'
        },
        codBankDetails: {
            accountHolderName: { type: String, default: '' },
            accountNumberMasked: { type: String, default: '' },
            accountNumberEncrypted: { type: String, default: '', select: false },
            ifsc: { type: String, default: '' },
            bankName: { type: String, default: '' },
            upiId: { type: String, default: '' }
        }
    },
    refundDetails: {
        status: {
            type: String,
            enum: VALID_REFUND_STATUSES,
            default: 'none',
            index: true
        },
        amount: {
            type: Number,
            default: 0,
            min: 0
        },
        gatewayRefundId: {
            type: String,
            default: null
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment',
            default: null
        },
        providerPaymentId: {
            type: String,
            default: null
        },
        bankReferenceNumber: {
            type: String,
            default: null
        },
        failureReason: {
            type: String,
            default: null
        },
        initiatedAt: {
            type: Date,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    disputeDetails: {
        isDisputed: {
            type: Boolean,
            default: false,
            index: true
        },
        disputedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        reason: {
            type: String,
            default: ''
        },
        evidence: [{
            type: String
        }],
        adminDecision: {
            type: String,
            enum: ['pending', 'upheld_seller', 'upheld_buyer', 'settled_split'],
            default: 'pending'
        },
        adminNotes: {
            type: String,
            default: ''
        },
        resolvedAt: {
            type: Date,
            default: null
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    statusHistory: [
        {
            status: { type: String, required: true },
            changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            role: { type: String, enum: ['buyer', 'seller', 'admin', 'system'], required: true },
            note: { type: String, default: '' },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, {
    timestamps: true
});

// Indexes for high-frequency queries
returnRequestSchema.index({ customer: 1, createdAt: -1 });
returnRequestSchema.index({ seller: 1, status: 1, createdAt: -1 });
returnRequestSchema.index({ order: 1, seller: 1 });
returnRequestSchema.index({ 'refundDetails.status': 1 });

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);

module.exports = ReturnRequest;
