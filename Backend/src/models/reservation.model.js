const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variant: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['reserved', 'confirmed', 'released', 'expired'],
        default: 'reserved'
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

reservationSchema.index({ order: 1 });
reservationSchema.index({ status: 1, expiresAt: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;