const productModel = require('../models/product.model');
const cartModel = require('../models/cart.model');

async function addToCart(req, res) {
    const { product: productId, quantity } = req.body;
    const userId = req.user.id;

    // Validate quantity
    if (!quantity || quantity < 1) {
        return res.status(400).json({
            message: 'Quantity must be at least 1'
        });
    }

    // Find product
    const product = await productModel.findById(productId);

    if (!product) {
        return res.status(404).json({
            message: 'Product not found'
        });
    }

    // Check product availability
    if (product.status !== 'active') {
        return res.status(400).json({
            message: 'Product is not available'
        });
    }

    // Find or create cart
    let cart = await cartModel.findOne({ user: userId });

    if (!cart) {
        cart = new cartModel({
            user: userId,
            items: []
        });
    }

    // Check if product already exists in cart
    const item = cart.items.find(
        item => item.product.toString() === productId
    );

    if (item) {
        //if item is already in cart 
        // Check total quantity against stock
        if (item.quantity + quantity > product.stock) {
            return res.status(400).json({
                message: 'Requested quantity exceeds available stock'
            });
        }

        item.quantity += quantity;
        item.price = product.price;
    } else {
        //if item not in cart already
        // Check quantity against stock
        if (quantity > product.stock) {
            return res.status(400).json({
                message: 'Requested quantity exceeds available stock'
            });
        }

        cart.items.push({
            product: product._id,
            quantity,
            price: product.price
        });
    }

    await cart.save();

    return res.status(200).json({
        message: 'Item added to cart successfully',
        cart
    });
}

async function getCart(req, res){
    const userId = req.user.id;
    const cart = await cartModel.findOne({ user: userId }).populate('items.product');
    if (!cart) {
        return res.status(200).json({
            message: 'Cart is empty'
        });
    }
    return res.status(200).json({
        message: 'Cart fetched successfully',
        cart
    });
}

async function removeFromCart(req, res) {
    const { productId } = req.params;
    const userId = req.user.id;

    const cart = await cartModel.findOne({ user: userId });

    if (!cart) {
        return res.status(404).json({
            message: 'Cart not found'
        });
    }

    const item = cart.items.find(
        item => item.product.toString() === productId
    );

    if (!item) {
        return res.status(404).json({
            message: 'Item not found in cart'
        });
    }

    cart.items = cart.items.filter(
        item => item.product.toString() !== productId
    );

    await cart.save();

    return res.status(200).json({
        message: 'Item removed from cart successfully',
        cart
    });
}

async function updateCartItem(req, res) {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    if (!quantity || quantity < 1) {
        return res.status(400).json({
            message: 'Quantity must be at least 1'
        });
    }

    const cart = await cartModel.findOne({ user: userId });

    if (!cart) {
        return res.status(404).json({
            message: 'Cart not found'
        });
    }

    const item = cart.items.find(
        item => item.product.toString() === productId
    );

    if (!item) {
        return res.status(404).json({
            message: 'Item not found in cart'
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

    if (quantity > product.stock) {
        return res.status(400).json({
            message: 'Requested quantity exceeds available stock'
        });
    }

    item.quantity = quantity;
    item.price = product.price;

    await cart.save();

    return res.status(200).json({
        message: 'Cart item updated successfully',
        cart
    });
}

async function clearCart(req, res){
    const userId = req.user.id;
    const cart = await cartModel.findOne({ user: userId });
    if (!cart) {
        return res.status(404).json({
            message: 'Cart not found'
        });
    }
    cart.items = [];
    await cart.save();
    return res.status(200).json({
        message: 'Cart cleared successfully',
        cart
    });
}





module.exports = { addToCart, getCart, removeFromCart, updateCartItem, clearCart };