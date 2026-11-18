const mongoose = require('mongoose');
const productModel = require('../models/product.model');
const cartModel = require('../models/cart.model');
const Inventory = require('../models/inventory.model');

// Helper to ensure inventory exists for a product
async function ensureInventory(product) {
    let inventory = await Inventory.findOne({ product: product._id });
    if (!inventory) {
        inventory = await Inventory.create({
            product: product._id,
            variants: [
                {
                    name: 'default',
                    totalStock: product.stock || 0,
                    availableStock: product.stock || 0,
                    reservedStock: 0
                }
            ]
        });
    }
    return inventory;
}

async function addToCart(req, res) {
    try {
        const { product: productId, quantity, variant = 'default' } = req.body;
        const userId = req.user.id;

        if (!productId || !mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                message: 'Valid product ID is required'
            });
        }

        const numQuantity = Number(quantity);
        if (!Number.isInteger(numQuantity) || numQuantity < 1) {
            return res.status(400).json({
                message: 'Quantity must be an integer of at least 1'
            });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        if (product.status !== 'active') {
            return res.status(400).json({
                message: 'Product is not available'
            });
        }

        const inventory = await ensureInventory(product);

        let selectedVariant = inventory.variants.find(
            item => item.name === variant
        );

        if (!selectedVariant) {
            // Allow default fallback ONLY for products that genuinely have one default variant
            const hasSingleDefaultVariant = inventory.variants.length === 1 && inventory.variants[0].name === 'default';
            if (hasSingleDefaultVariant) {
                selectedVariant = inventory.variants[0];
            } else {
                return res.status(400).json({
                    message: `Invalid variant '${variant}'. Available variants: ${inventory.variants.map(v => v.name).join(', ')}`
                });
            }
        }

        let cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            cart = new cartModel({
                user: userId,
                items: []
            });
        }

        const matchedVariantName = selectedVariant.name;
        const item = cart.items.find(
            i => i.product.toString() === productId && (i.variant === variant || i.variant === matchedVariantName)
        );

        if (item) {
            if (item.quantity + numQuantity > selectedVariant.availableStock) {
                return res.status(400).json({
                    message: 'Requested quantity exceeds available stock'
                });
            }
            item.quantity += numQuantity;
            item.variant = matchedVariantName;
            item.price = product.price;
        } else {
            if (numQuantity > selectedVariant.availableStock) {
                return res.status(400).json({
                    message: 'Requested quantity exceeds available stock'
                });
            }

            cart.items.push({
                product: product._id,
                variant: matchedVariantName,
                quantity: numQuantity,
                price: product.price
            });
        }

        await cart.save();

        return res.status(200).json({
            message: 'Item added to cart successfully',
            cart
        });
    } catch (error) {
        console.error('addToCart error:', error.message);
        return res.status(500).json({ message: 'Failed to add item to cart' });
    }
}

async function getCart(req, res) {
    try {
        const userId = req.user.id;

        const cart = await cartModel
            .findOne({ user: userId })
            .populate('items.product', 'name price image status');

        if (!cart) {
            return res.status(200).json({
                message: 'Cart is empty',
                cart: { items: [] }
            });
        }

        return res.status(200).json({
            message: 'Cart fetched successfully',
            cart
        });
    } catch (error) {
        console.error('getCart error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch cart' });
    }
}

async function removeFromCart(req, res) {
    try {
        const { productId } = req.params;
        const variant = req.body?.variant || req.query?.variant || 'default';
        const userId = req.user.id;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(
            item =>
                !(item.product.toString() === productId && (item.variant === variant || (!variant && item.variant === 'default')))
        );

        if (cart.items.length === initialLength) {
            const matchCount = cart.items.filter(i => i.product.toString() === productId).length;
            if (matchCount === 1) {
                cart.items = cart.items.filter(i => i.product.toString() !== productId);
            }
        }

        if (cart.items.length === initialLength) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        await cart.save();

        return res.status(200).json({
            message: 'Item removed from cart successfully',
            cart
        });
    } catch (error) {
        console.error('removeFromCart error:', error.message);
        return res.status(500).json({ message: 'Failed to remove item from cart' });
    }
}

async function updateCartItem(req, res) {
    try {
        const { productId } = req.params;
        const { quantity, variant = 'default' } = req.body;
        const userId = req.user.id;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const numQuantity = Number(quantity);
        if (!Number.isInteger(numQuantity) || numQuantity < 1) {
            return res.status(400).json({
                message: 'Quantity must be an integer of at least 1'
            });
        }

        const cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        let item = cart.items.find(
            i => i.product.toString() === productId && (i.variant === variant || (!variant && i.variant === 'default'))
        );

        if (!item) {
            item = cart.items.find(i => i.product.toString() === productId);
        }

        if (!item) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.status !== 'active') {
            return res.status(400).json({ message: 'Product is not available' });
        }

        const inventory = await ensureInventory(product);
        let selectedVariant = inventory.variants.find(
            i => i.name === variant || i.name === item.variant
        );

        if (!selectedVariant) {
            const hasSingleDefaultVariant = inventory.variants.length === 1 && inventory.variants[0].name === 'default';
            if (hasSingleDefaultVariant) {
                selectedVariant = inventory.variants[0];
            } else {
                return res.status(400).json({
                    message: `Invalid variant '${variant}'. Available variants: ${inventory.variants.map(v => v.name).join(', ')}`
                });
            }
        }

        if (numQuantity > selectedVariant.availableStock) {
            return res.status(400).json({
                message: 'Requested quantity exceeds available stock'
            });
        }

        item.quantity = numQuantity;
        item.price = product.price;

        await cart.save();

        return res.status(200).json({
            message: 'Cart item updated successfully',
            cart
        });
    } catch (error) {
        console.error('updateCartItem error:', error.message);
        return res.status(500).json({ message: 'Failed to update cart item' });
    }
}

async function clearCart(req, res) {
    try {
        const userId = req.user.id;

        const cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = [];
        await cart.save();

        return res.status(200).json({
            message: 'Cart cleared successfully',
            cart
        });
    } catch (error) {
        console.error('clearCart error:', error.message);
        return res.status(500).json({ message: 'Failed to clear cart' });
    }
}

module.exports = {
    addToCart,
    getCart,
    removeFromCart,
    updateCartItem,
    clearCart
};