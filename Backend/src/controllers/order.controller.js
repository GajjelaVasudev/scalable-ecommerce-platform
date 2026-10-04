const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Inventory = require('../models/inventory.model');
const Reservation = require('../models/reservation.model');

async function createOrder(req, res) {
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        // Get cart items
        const cart = await Cart.findOne({ user: userId })
            .populate('items.product', 'name price status')
            .session(session);

        if (!cart || cart.items.length === 0) {
            await session.abortTransaction();
            await session.endSession();

            return res.status(400).json({
                message: 'Cart is empty'
            });
        }

        // Check products and calculate total
        let totalAmount = 0;
        const orderItems = [];

        for (const item of cart.items) {

            const product = await Product.findById(item.product._id)
                .session(session);

            if (!product) {
                throw new Error('Product not found');
            }

            if (product.status !== 'active') {
                throw new Error('Product is not active');
            }

            totalAmount += product.price * item.quantity;

            orderItems.push({
                product: product._id,
                name: product.name,
                variant: item.variant,
                quantity: item.quantity,
                price: product.price
            });
        }

        // Create order first
        // We need the order ID for reservation documents
        const [order] = await Order.create([
            {
                user: userId,
                items: orderItems,
                totalAmount,
                shippingAddress: req.body.shippingAddress,
                paymentStatus: 'pending'
            }
        ], { session });

        // Reserve inventory and create reservations
        const reservations = [];

        for (const item of cart.items) {

            const updatedInventory = await Inventory.findOneAndUpdate(
                {
                    product: item.product._id,
                    variants: {
                        $elemMatch: {
                            name: item.variant,
                            availableStock: {
                                $gte: item.quantity
                            }
                        }
                    }
                },
                {
                    $inc: {
                        'variants.$.availableStock': -item.quantity,
                        'variants.$.reservedStock': item.quantity
                    }
                },
                {
                    session,
                    new: true
                }
            );

            if (!updatedInventory) {
                throw new Error(
                    `Insufficient stock for ${item.variant} variant`
                );
            }

            reservations.push({
                order: order._id,
                product: item.product._id,
                variant: item.variant,
                quantity: item.quantity,
                status: 'reserved',
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            });
        }

        // Create reservation records
        await Reservation.create(reservations, { session });

        // Clear cart
        await Cart.findByIdAndUpdate(
            cart._id,
            { items: [] },
            { session }
        );

        // Commit transaction
        await session.commitTransaction();
        await session.endSession();

        return res.status(201).json({
            message: 'Order created successfully',
            order
        });

    } catch (error) {

        await session.abortTransaction();
        await session.endSession();

        return res.status(500).json({
            message: error.message || 'Failed to create order'
        });
    }
}

module.exports = { createOrder };