const mongoose = require('mongoose');
const Inventory = require('../models/inventory.model');
const Product = require('../models/product.model');

// Helper to keep Product.stock in sync with total of variants
async function syncProductStock(productId) {
    const inventory = await Inventory.findOne({ product: productId });
    if (inventory) {
        const totalStock = inventory.variants.reduce((sum, v) => sum + (v.totalStock || 0), 0);
        await Product.findByIdAndUpdate(productId, { stock: totalStock });
    }
}

// POST create inventory which supports variants
async function createInventory(req, res) {
    try {
        const { productId, variants } = req.body;

        if (!productId || !mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: 'Valid productId is required' });
        }

        if (!variants || !Array.isArray(variants) || variants.length === 0) {
            return res.status(400).json({
                message: 'At least one variant with name and non-negative totalStock is required'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Enforce seller ownership
        if (req.user.role !== 'admin' && product.seller.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Forbidden: You can only manage inventory for your own products'
            });
        }

        const existingInventory = await Inventory.findOne({ product: productId });
        if (existingInventory) {
            return res.status(400).json({
                message: 'Inventory already exists for this product'
            });
        }

        for (const v of variants) {
            if (!v.name || typeof v.name !== 'string' || !v.name.trim()) {
                return res.status(400).json({ message: 'Variant name must be a non-empty string' });
            }
            const stock = Number(v.totalStock);
            if (!Number.isInteger(stock) || stock < 0) {
                return res.status(400).json({ message: `Total stock for variant '${v.name}' must be a non-negative integer` });
            }
        }

        const inventoryVariants = variants.map(variant => ({
            name: variant.name.trim(),
            totalStock: Number(variant.totalStock),
            availableStock: Number(variant.totalStock),
            reservedStock: 0
        }));

        const inventory = await Inventory.create({
            product: productId,
            variants: inventoryVariants
        });

        await syncProductStock(productId);

        return res.status(201).json({
            message: 'Inventory created successfully',
            inventory
        });
    } catch (error) {
        console.error('createInventory error:', error.message);
        return res.status(500).json({ message: 'Failed to create inventory' });
    }
}

// GET inventory
async function getInventory(req, res) {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const inventory = await Inventory.findOne({ product: productId }).lean();
        if (!inventory) {
            return res.status(404).json({ message: 'Inventory not found' });
        }

        return res.status(200).json({
            message: 'Inventory fetched successfully',
            inventory
        });
    } catch (error) {
        console.error('getInventory error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch inventory' });
    }
}

// PUT / PATCH update inventory
async function updateInventory(req, res) {
    try {
        const { productId } = req.params;
        const { variantName, totalStock } = req.body;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        if (!variantName || typeof variantName !== 'string' || !variantName.trim()) {
            return res.status(400).json({ message: 'Valid variantName is required' });
        }

        const numTotalStock = Number(totalStock);
        if (!Number.isInteger(numTotalStock) || numTotalStock < 0) {
            return res.status(400).json({ message: 'Total stock must be a non-negative integer' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Enforce seller ownership
        if (req.user.role !== 'admin' && product.seller.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Forbidden: You can only manage inventory for your own products'
            });
        }

        const inventory = await Inventory.findOne({ product: productId });
        if (!inventory) {
            return res.status(404).json({ message: 'Inventory not found' });
        }

        const variant = inventory.variants.find(
            v => v.name === variantName.trim()
        );

        if (!variant) {
            return res.status(404).json({ message: `Variant '${variantName}' not found` });
        }

        if (numTotalStock < variant.reservedStock) {
            return res.status(400).json({
                message: `Total stock (${numTotalStock}) cannot be less than currently reserved stock (${variant.reservedStock})`
            });
        }

        const stockDifference = numTotalStock - variant.totalStock;
        variant.totalStock = numTotalStock;
        variant.availableStock = Math.max(0, variant.availableStock + stockDifference);

        await inventory.save();
        await syncProductStock(productId);

        return res.status(200).json({
            message: 'Inventory updated successfully',
            inventory
        });
    } catch (error) {
        console.error('updateInventory error:', error.message);
        return res.status(500).json({ message: 'Failed to update inventory' });
    }
}

// Atomic stock reservation
async function reserveStock(req, res) {
    try {
        const { productId } = req.params;
        const { variantName, quantity } = req.body;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const numQuantity = Number(quantity);
        if (!variantName || !Number.isInteger(numQuantity) || numQuantity < 1) {
            return res.status(400).json({
                message: 'Variant name and positive integer quantity are required'
            });
        }

        const updatedInventory = await Inventory.findOneAndUpdate(
            {
                product: productId,
                variants: {
                    $elemMatch: {
                        name: variantName.trim(),
                        availableStock: { $gte: numQuantity }
                    }
                }
            },
            {
                $inc: {
                    'variants.$.availableStock': -numQuantity,
                    'variants.$.reservedStock': numQuantity
                }
            },
            { new: true }
        );

        if (!updatedInventory) {
            return res.status(400).json({
                message: 'Insufficient available stock'
            });
        }

        return res.status(200).json({
            message: 'Stock reserved successfully',
            inventory: updatedInventory
        });
    } catch (error) {
        console.error('reserveStock error:', error.message);
        return res.status(500).json({ message: 'Failed to reserve stock' });
    }
}

// Release stock if order failed or cancelled
async function releaseStock(req, res) {
    try {
        const { productId } = req.params;
        const { variantName, quantity } = req.body;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const numQuantity = Number(quantity);
        if (!variantName || !Number.isInteger(numQuantity) || numQuantity < 1) {
            return res.status(400).json({
                message: 'Variant name and positive integer quantity are required'
            });
        }

        const updatedInventory = await Inventory.findOneAndUpdate(
            {
                product: productId,
                variants: {
                    $elemMatch: {
                        name: variantName.trim(),
                        reservedStock: { $gte: numQuantity }
                    }
                }
            },
            {
                $inc: {
                    'variants.$.availableStock': numQuantity,
                    'variants.$.reservedStock': -numQuantity
                }
            },
            { new: true }
        );

        if (!updatedInventory) {
            return res.status(400).json({
                message: 'No reserved stock available to release'
            });
        }

        return res.status(200).json({
            message: 'Stock released successfully',
            inventory: updatedInventory
        });
    } catch (error) {
        console.error('releaseStock error:', error.message);
        return res.status(500).json({ message: 'Failed to release stock' });
    }
}

// Confirm stock when payment is verified
async function confirmStock(req, res) {
    try {
        const { productId } = req.params;
        const { variantName, quantity } = req.body;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const numQuantity = Number(quantity);
        if (!variantName || !Number.isInteger(numQuantity) || numQuantity < 1) {
            return res.status(400).json({
                message: 'Variant name and positive integer quantity are required'
            });
        }

        const updatedInventory = await Inventory.findOneAndUpdate(
            {
                product: productId,
                variants: {
                    $elemMatch: {
                        name: variantName.trim(),
                        reservedStock: { $gte: numQuantity }
                    }
                }
            },
            {
                $inc: {
                    'variants.$.totalStock': -numQuantity,
                    'variants.$.reservedStock': -numQuantity
                }
            },
            { new: true }
        );

        if (!updatedInventory) {
            return res.status(400).json({
                message: 'Insufficient reserved stock to confirm'
            });
        }

        await syncProductStock(productId);

        return res.status(200).json({
            message: 'Stock confirmed successfully',
            inventory: updatedInventory
        });
    } catch (error) {
        console.error('confirmStock error:', error.message);
        return res.status(500).json({ message: 'Failed to confirm stock' });
    }
}

module.exports = {
    createInventory,
    getInventory,
    updateInventory,
    reserveStock,
    releaseStock,
    confirmStock
};