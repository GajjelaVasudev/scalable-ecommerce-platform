const Inventory = require('../models/inventory.model');
const Product = require('../models/product.model');

//POST create inventory which supports variants
//build inventory controller here using above inventorymodel
async function createInventory(req, res) {
    const { productId, variants } = req.body;

    if (!productId || !variants || variants.length === 0) {
        return res.status(400).json({
            message: 'Product ID and variants are required'
        });
    }

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            message: 'Product not found'
        });
    }

    const existingInventory = await Inventory.findOne({
        product: productId
    });

    if (existingInventory) {
        return res.status(400).json({
            message: 'Inventory already exists for this product'
        });
    }

    const inventoryVariants = variants.map(variant => ({
        name: variant.name,
        totalStock: variant.totalStock,
        availableStock: variant.totalStock,
        reservedStock: 0
    }));

    const inventory = await Inventory.create({
        product: productId,
        variants: inventoryVariants
    });

    return res.status(201).json({
        message: 'Inventory created successfully',
        inventory
    });
}

//GET inventory
async function getInventory(req, res){
    const {productId} = req.params;
    const inventory = await Inventory.findOne({product: productId});
    if(!inventory){
        return res.status(404).json({message: 'Inventory not found'});
    }
    return res.status(200).json({message: 'Inventory fetched successfully', inventory});
}

//PUT update inventory
async function updateInventory(req, res) {
    const { productId } = req.params;
    const { variantName, totalStock } = req.body;

    if (!variantName || totalStock === undefined) {
        return res.status(400).json({
            message: 'Variant name and total stock are required'
        });
    }

    if (totalStock < 0) {
        return res.status(400).json({
            message: 'Total stock cannot be negative'
        });
    }

    const inventory = await Inventory.findOne({
        product: productId
    });

    if (!inventory) {
        return res.status(404).json({
            message: 'Inventory not found'
        });
    }

    const variant = inventory.variants.find(
        variant => variant.name === variantName
    );

    if (!variant) {
        return res.status(404).json({
            message: 'Variant not found'
        });
    }

    if (totalStock < variant.reservedStock) {
        return res.status(400).json({
            message: 'Total stock cannot be less than reserved stock'
        });
    }

    const stockDifference = totalStock - variant.totalStock;

    variant.totalStock = totalStock;
    variant.availableStock += stockDifference;

    if (variant.availableStock < 0) {
        variant.availableStock = 0;
    }

    await inventory.save();

    return res.status(200).json({
        message: 'Inventory updated successfully',
        inventory
    });
}

async function reserveStock(req, res) {
    const { productId } = req.params;
    const { variantName, quantity } = req.body;

    if (!variantName || !quantity || quantity < 1) {
        return res.status(400).json({
            message: 'Variant name and valid quantity are required'
        });
    }

    const inventory = await Inventory.findOne({
        product: productId
    });

    if (!inventory) {
        return res.status(404).json({
            message: 'Inventory not found'
        });
    }

    const variant = inventory.variants.find(
        variant => variant.name === variantName
    );

    if (!variant) {
        return res.status(404).json({
            message: 'Variant not found'
        });
    }

    const updatedInventory = await Inventory.findOneAndUpdate(
        {
            product: productId,
            variants: {
                $elemMatch: {
                    name: variantName,
                    availableStock: { $gte: quantity }
                }
            }
        },
        {
            $inc: {
                'variants.$.availableStock': -quantity,
                'variants.$.reservedStock': quantity
            }
        },
        {
            new: true
        }
    );

    if (!updatedInventory) {
        return res.status(400).json({
            message: 'Insufficient stock'
        });
    }

    return res.status(200).json({
        message: 'Stock reserved successfully',
        inventory: updatedInventory
    });
}

//release stock if order failed
async function releaseStock(req, res) {
    const { productId } = req.params;
    const { variantName, quantity } = req.body;

    if (!variantName || !quantity || quantity < 1) {
        return res.status(400).json({
            message: 'Variant name and valid quantity are required'
        });
    }

    const inventory = await Inventory.findOne({
        product: productId
    });

    if (!inventory) {
        return res.status(404).json({
            message: 'Inventory not found'
        });
    }

    const variant = inventory.variants.find(
        variant => variant.name === variantName
    );

    if (!variant) {
        return res.status(404).json({
            message: 'Variant not found'
        });
    }

    const updatedInventory = await Inventory.findOneAndUpdate(
        {
            product: productId,
            variants: {
                $elemMatch: {
                    name: variantName,
                    reservedStock: { $gte: quantity }
                }
            }
        },
        {
            $inc: {
                'variants.$.availableStock': quantity,
                'variants.$.reservedStock': -quantity
            }
        },
        {
            new: true
        }
    );

    if (!updatedInventory) {
        return res.status(400).json({
            message: 'No stock reserved to release'
        });
    }

    return res.status(200).json({
        message: 'Stock released successfully',
        inventory: updatedInventory
    });
}

module.exports = {createInventory, getInventory, updateInventory, reserveStock, releaseStock};