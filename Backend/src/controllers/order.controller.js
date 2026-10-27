const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Inventory = require('../models/inventory.model');
const Reservation = require('../models/reservation.model');

// Helper to run operations within a transaction if supported, or without if standalone
async function withOptionalTransaction(workFn) {
    let session = null;
    let useTransaction = false;

    try {
        session = await mongoose.startSession();
        session.startTransaction();
        useTransaction = true;
    } catch {
        // Not a replica set member or transactions not supported on this connection
        useTransaction = false;
        if (session) {
            try { await session.endSession(); } catch {}
            session = null;
        }
    }

    try {
        const result = await workFn(useTransaction ? session : null);
        if (useTransaction && session) {
            await session.commitTransaction();
        }
        return result;
    } catch (err) {
        if (useTransaction && session) {
            try { await session.abortTransaction(); } catch {}
        }
        throw err;
    } finally {
        if (session) {
            try { await session.endSession(); } catch {}
        }
    }
}

async function createOrder(req, res) {
    const userId = req.user.id;
    const { shippingAddress } = req.body;

    if (
        !shippingAddress ||
        typeof shippingAddress !== 'object' ||
        !shippingAddress.fullName?.trim() ||
        !shippingAddress.phone?.trim() ||
        !shippingAddress.addressLine?.trim() ||
        !shippingAddress.city?.trim() ||
        !shippingAddress.state?.trim() ||
        !shippingAddress.postalCode?.trim() ||
        !shippingAddress.country?.trim()
    ) {
        return res.status(400).json({
            message: 'Valid shippingAddress is required with fullName, phone, addressLine, city, state, postalCode, and country'
        });
    }

    try {
        const order = await withOptionalTransaction(async (session) => {
            const cartQuery = Cart.findOne({ user: userId });
            if (session) cartQuery.session(session);
            const cart = await cartQuery.populate('items.product', 'name price status');

            if (!cart || cart.items.length === 0) {
                const err = new Error('Cart is empty');
                err.statusCode = 400;
                throw err;
            }

            let totalAmount = 0;
            const orderItems = [];

            for (const item of cart.items) {
                const productQuery = Product.findById(item.product._id);
                if (session) productQuery.session(session);
                const product = await productQuery;

                if (!product) {
                    const err = new Error('One or more products in your cart no longer exist');
                    err.statusCode = 400;
                    throw err;
                }

                if (product.status !== 'active') {
                    const err = new Error(`Product '${product.name}' is no longer active`);
                    err.statusCode = 400;
                    throw err;
                }

                // Strictly recalculate price from trusted database record
                totalAmount += product.price * item.quantity;

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    variant: item.variant,
                    quantity: item.quantity,
                    price: product.price
                });
            }

            // Create order document
            const orderDocData = {
                user: userId,
                items: orderItems,
                totalAmount,
                shippingAddress: {
                    fullName: shippingAddress.fullName.trim(),
                    phone: shippingAddress.phone.trim(),
                    addressLine: shippingAddress.addressLine.trim(),
                    city: shippingAddress.city.trim(),
                    state: shippingAddress.state.trim(),
                    postalCode: shippingAddress.postalCode.trim(),
                    country: shippingAddress.country.trim()
                },
                paymentStatus: 'pending'
            };

            let createdOrder;
            if (session) {
                const [created] = await Order.create([orderDocData], { session });
                createdOrder = created;
            } else {
                createdOrder = await Order.create(orderDocData);
            }

            // Reserve inventory and create reservations atomically
            const reservations = [];

            for (const item of cart.items) {
                const invFilter = {
                    product: item.product._id,
                    variants: {
                        $elemMatch: {
                            name: item.variant,
                            availableStock: { $gte: item.quantity }
                        }
                    }
                };
                const invUpdate = {
                    $inc: {
                        'variants.$.availableStock': -item.quantity,
                        'variants.$.reservedStock': item.quantity
                    }
                };
                const invOptions = { new: true };
                if (session) invOptions.session = session;

                const updatedInventory = await Inventory.findOneAndUpdate(
                    invFilter,
                    invUpdate,
                    invOptions
                );

                if (!updatedInventory) {
                    const err = new Error(
                        `Insufficient available stock for variant '${item.variant}' of product`
                    );
                    err.statusCode = 409;
                    throw err;
                }

                reservations.push({
                    order: createdOrder._id,
                    product: item.product._id,
                    variant: item.variant,
                    quantity: item.quantity,
                    status: 'reserved',
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
                });
            }

            if (session) {
                await Reservation.create(reservations, { session });
            } else {
                await Reservation.create(reservations);
            }

            // Clear the user's cart
            const cartUpdateOptions = {};
            if (session) cartUpdateOptions.session = session;
            await Cart.findByIdAndUpdate(cart._id, { items: [] }, cartUpdateOptions);

            return createdOrder;
        });

        return res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        console.error('createOrder error:', error.message);
        const status = error.statusCode || 500;
        return res.status(status).json({
            message: error.message || 'Failed to create order'
        });
    }
}

async function getUserOrders(req, res) {
    try {
        const userId = req.user.id;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = req.user.role === 'admin' && req.query.all === 'true'
            ? {}
            : { user: userId };

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(filter)
        ]);

        return res.status(200).json({
            message: 'Orders fetched successfully',
            orders,
            pagination: {
                page,
                limit,
                totalOrders: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('getUserOrders error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch orders' });
    }
}

async function getOrderById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findById(id).lean();
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        return res.status(200).json({
            message: 'Order fetched successfully',
            order
        });
    } catch (error) {
        console.error('getOrderById error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch order' });
    }
}

async function cancelOrder(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (order.deliveryStatus === 'cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                message: 'Cannot cancel an already paid order via this endpoint; please request a refund'
            });
        }

        // Release any active reservations back to inventory
        const activeReservations = await Reservation.find({
            order: order._id,
            status: 'reserved'
        });

        for (const reservation of activeReservations) {
            await Inventory.findOneAndUpdate(
                {
                    product: reservation.product,
                    variants: {
                        $elemMatch: {
                            name: reservation.variant,
                            reservedStock: { $gte: reservation.quantity }
                        }
                    }
                },
                {
                    $inc: {
                        'variants.$.availableStock': reservation.quantity,
                        'variants.$.reservedStock': -reservation.quantity
                    }
                }
            );

            reservation.status = 'released';
            await reservation.save();
        }

        order.deliveryStatus = 'cancelled';
        await order.save();

        return res.status(200).json({
            message: 'Order cancelled successfully and reserved stock released',
            order
        });
    } catch (error) {
        console.error('cancelOrder error:', error.message);
        return res.status(500).json({ message: 'Failed to cancel order' });
    }
}

async function updateOrderStatus(req, res) {
    try {
        const { id } = req.params;
        const { deliveryStatus } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(deliveryStatus)) {
            return res.status(400).json({
                message: `Invalid delivery status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If transitioning to cancelled, release any lingering reservations
        if (deliveryStatus === 'cancelled' && order.deliveryStatus !== 'cancelled') {
            const activeReservations = await Reservation.find({
                order: order._id,
                status: 'reserved'
            });

            for (const reservation of activeReservations) {
                await Inventory.findOneAndUpdate(
                    {
                        product: reservation.product,
                        variants: {
                            $elemMatch: {
                                name: reservation.variant,
                                reservedStock: { $gte: reservation.quantity }
                            }
                        }
                    },
                    {
                        $inc: {
                            'variants.$.availableStock': reservation.quantity,
                            'variants.$.reservedStock': -reservation.quantity
                        }
                    }
                );

                reservation.status = 'released';
                await reservation.save();
            }
        }

        order.deliveryStatus = deliveryStatus;
        await order.save();

        return res.status(200).json({
            message: 'Order delivery status updated successfully',
            order
        });
    } catch (error) {
        console.error('updateOrderStatus error:', error.message);
        return res.status(500).json({ message: 'Failed to update order status' });
    }
}

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus
};