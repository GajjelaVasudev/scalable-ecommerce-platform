const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    image: {
        type: String,
        required: true,
        trim: true
    },
    images: [{
        type: String,
        trim: true
    }],
    brand: {
        type: String,
        trim: true
    },
    brandTag: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        default: 4.8,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 100,
        min: 0
    },
    badge: {
        type: String,
        trim: true
    },
    badgeVariant: {
        type: String,
        trim: true
    },
    fastPrime: {
        type: Boolean,
        default: false
    },
    twoDayDelivery: {
        type: Boolean,
        default: false
    },
    codEligible: {
        type: Boolean,
        default: false
    },
    specs: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    featured: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Indexing for search, filtering, and sorting
productSchema.index({ category: 1, price: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ rating: -1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
  