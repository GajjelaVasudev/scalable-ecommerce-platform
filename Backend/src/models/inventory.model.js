const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    totalStock: {
        type: Number,
        required: true,
        min: 0
    },
    reservedStock: {
        type: Number,
        default: 0,
        min: 0
    },
    availableStock: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variants: {
        type: [variantSchema],
        validate: {
            validator: variants => Array.isArray(variants) && variants.length > 0,
            message: 'At least one inventory variant is required'
        }
    }
}, { timestamps: true });

inventorySchema.index({ product: 1 }, { unique: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
