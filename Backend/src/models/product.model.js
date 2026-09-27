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
    status:{
        type: String,
        enum: ['active', 'inactive', 'out_of_stock'],
        default: 'active'
    }
},{
    timestamps:true
}) 

//indexing
productSchema.index({ category: 1, price: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;  