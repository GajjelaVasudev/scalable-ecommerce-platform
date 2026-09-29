const mongoose = require('mongoose');

//create inventory model
const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    variants: [
        {
            totalstock: {
                type: Number,
                required: true
            },
            reservedStock: {
                type: Number,
                default: 0
            },
            availableStock: {
                type: Number,
                default: 0
            }
        }
    ]
    
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;