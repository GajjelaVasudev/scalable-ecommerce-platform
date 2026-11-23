const mongoose = require('mongoose');
const crypto = require('crypto');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Inventory = require('../models/inventory.model');
const Reservation = require('../models/reservation.model');
const { sendNotification } = require('../services/notification.service');

const VALID_PAYMENT_METHODS = ['UPI', 'CARD', 'NETBANKING', 'EMI', 'COD'];

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

    const rawPaymentMethod = typeof req.body.paymentMethod === 'string' && req.body.paymentMethod.trim()
        ? req.body.paymentMethod.trim().toUpperCase()
        : 'UPI';

    if (!VALID_PAYMENT_METHODS.includes(rawPaymentMethod)) {
        return res.status(400).json({
            message: `Invalid payment method '${req.body.paymentMethod}'. Supported methods: ${VALID_PAYMENT_METHODS.join(', ')}`
        });
    }

    const paymentMethod = rawPaymentMethod;

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
            const trackingNumber = `FX-IN-${Math.floor(1000000 + Math.random() * 9000000)}`;

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
                paymentStatus: 'pending',
                trackingNumber,
                paymentMethod
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

                let updatedInventory = await Inventory.findOneAndUpdate(
                    invFilter,
                    invUpdate,
                    invOptions
                );

                if (!updatedInventory) {
                    // Safe variant fallback: ONLY fallback if product genuinely has 1 default variant
                    const inventoryDoc = await Inventory.findOne({ product: item.product._id });
                    if (inventoryDoc && inventoryDoc.variants.length === 1 && inventoryDoc.variants[0].name === 'default') {
                        const fallbackFilter = {
                            product: item.product._id,
                            variants: {
                                $elemMatch: {
                                    name: 'default',
                                    availableStock: { $gte: item.quantity }
                                }
                            }
                        };
                        updatedInventory = await Inventory.findOneAndUpdate(
                            fallbackFilter,
                            invUpdate,
                            invOptions
                        );
                    }
                }

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
                    expiresAt: new Date(Date.now() + (paymentMethod === 'COD' ? 30 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000))
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

        if (order && order.user) {
            sendNotification({
                userId: order.user,
                category: 'orders',
                title: 'Order confirmed',
                message: `Your order #${order.trackingNumber || order._id} has been confirmed.`,
                icon: 'shopping_bag',
                actionUrl: '/account/orders',
                actionLabel: 'View order',
                dedupeKey: `order_confirmed_${order._id}`,
                prefKey: 'orderConfirmation',
                metadata: { orderId: order._id }
            }).catch(() => {});
        }

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

async function createGuestOrder(req, res) {
    const { shippingAddress, items, paymentMethod: rawPaymentMethod } = req.body || {};

    // 1. Validate shippingAddress
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

    // 2. Validate paymentMethod
    const paymentMethod = typeof rawPaymentMethod === 'string' && rawPaymentMethod.trim()
        ? rawPaymentMethod.trim().toUpperCase()
        : 'UPI';

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        return res.status(400).json({
            message: `Invalid payment method '${rawPaymentMethod}'. Supported methods: ${VALID_PAYMENT_METHODS.join(', ')}`
        });
    }

    // 3. Validate items
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            message: 'Items array with at least one item is required for guest checkout'
        });
    }

    try {
        const rawGuestAccessToken = crypto.randomBytes(32).toString('hex');
        const guestAccessTokenHash = crypto.createHash('sha256').update(rawGuestAccessToken).digest('hex');

        const order = await withOptionalTransaction(async (session) => {
            let totalAmount = 0;
            const orderItems = [];

            for (const item of items) {
                const productId = typeof item.product === 'object' ? item.product._id : item.product;
                if (!productId || !mongoose.isValidObjectId(productId)) {
                    const err = new Error('Valid product ID is required for each item');
                    err.statusCode = 400;
                    throw err;
                }

                const qty = Number(item.quantity);
                if (!Number.isInteger(qty) || qty < 1) {
                    const err = new Error('Item quantity must be an integer of at least 1');
                    err.statusCode = 400;
                    throw err;
                }

                const productQuery = Product.findById(productId);
                if (session) productQuery.session(session);
                const product = await productQuery;

                if (!product) {
                    const err = new Error(`Product '${productId}' no longer exists`);
                    err.statusCode = 404;
                    throw err;
                }

                if (product.status !== 'active') {
                    const err = new Error(`Product '${product.name}' is no longer active`);
                    err.statusCode = 400;
                    throw err;
                }

                // Check variant safe handling
                const inventory = await ensureInventory(product);
                const variantName = (item.variant || 'default').trim();

                let selectedVariant = inventory.variants.find(v => v.name === variantName);
                if (!selectedVariant) {
                    const hasSingleDefaultVariant = inventory.variants.length === 1 && inventory.variants[0].name === 'default';
                    if (hasSingleDefaultVariant) {
                        selectedVariant = inventory.variants[0];
                    } else {
                        const err = new Error(
                            `Invalid variant '${variantName}' for product '${product.name}'. Available: ${inventory.variants.map(v => v.name).join(', ')}`
                        );
                        err.statusCode = 400;
                        throw err;
                    }
                }

                if (selectedVariant.availableStock < qty) {
                    const err = new Error(`Insufficient available stock for variant '${selectedVariant.name}' of product '${product.name}'`);
                    err.statusCode = 409;
                    throw err;
                }

                // Strictly recalculate price from trusted database record
                totalAmount += product.price * qty;

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    variant: selectedVariant.name,
                    quantity: qty,
                    price: product.price
                });
            }

            const trackingNumber = `FX-IN-${Math.floor(1000000 + Math.random() * 9000000)}`;

            const orderDocData = {
                user: null,
                isGuest: true,
                guestEmail: shippingAddress.email ? shippingAddress.email.trim().toLowerCase() : '',
                guestAccessTokenHash,
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
                paymentStatus: 'pending',
                deliveryStatus: 'pending',
                trackingNumber,
                paymentMethod
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
            for (const item of orderItems) {
                const invFilter = {
                    product: item.product,
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

                let updatedInventory = await Inventory.findOneAndUpdate(
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
                    product: item.product,
                    variant: item.variant,
                    quantity: item.quantity,
                    status: 'reserved',
                    expiresAt: new Date(Date.now() + (paymentMethod === 'COD' ? 30 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000))
                });
            }

            if (session) {
                await Reservation.insertMany(reservations, { session });
            } else {
                await Reservation.insertMany(reservations);
            }

            return createdOrder;
        });

        const returnedOrder = order && order.toObject ? order.toObject() : { ...order };
        delete returnedOrder.guestAccessTokenHash;

        return res.status(201).json({
            message: 'Guest order created successfully',
            order: returnedOrder,
            guestAccessToken: rawGuestAccessToken
        });
    } catch (error) {
        console.error('createGuestOrder error:', error.message);
        const status = error.statusCode || 500;
        return res.status(status).json({
            message: error.message || 'Failed to create guest order'
        });
    }
}

async function getGuestOrder(req, res) {
    try {
        const { id } = req.params;
        const guestToken = req.headers['x-guest-token'];

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        if (!guestToken || typeof guestToken !== 'string') {
            return res.status(403).json({ message: 'Forbidden: missing or invalid guest access token' });
        }

        const order = await Order.findById(id).select('+guestAccessTokenHash').lean();
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (!order.isGuest) {
            return res.status(403).json({ message: 'Access denied: not a guest order' });
        }

        if (!order.guestAccessTokenHash) {
            return res.status(403).json({ message: 'Forbidden: order does not have guest access credentials' });
        }

        const incomingHash = crypto.createHash('sha256').update(guestToken).digest('hex');
        const storedBuffer = Buffer.from(order.guestAccessTokenHash, 'hex');
        const incomingBuffer = Buffer.from(incomingHash, 'hex');

        if (storedBuffer.length !== incomingBuffer.length || !crypto.timingSafeEqual(storedBuffer, incomingBuffer)) {
            return res.status(403).json({ message: 'Forbidden: invalid guest access token' });
        }

        delete order.guestAccessTokenHash;

        return res.status(200).json({
            message: 'Guest order fetched successfully',
            order
        });
    } catch (error) {
        console.error('getGuestOrder error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch guest order' });
    }
}

async function cancelGuestOrder(req, res) {
    try {
        const { id } = req.params;
        const guestToken = req.headers['x-guest-token'] || req.body?.guestAccessToken;
        const { reason } = req.body || {};

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        if (!guestToken || typeof guestToken !== 'string') {
            return res.status(403).json({ message: 'Guest access token is required' });
        }

        const order = await Order.findById(id).select('+guestAccessTokenHash');
        if (!order || !order.isGuest || !order.guestAccessTokenHash) {
            return res.status(404).json({ message: 'Guest order not found' });
        }

        const incomingHash = crypto.createHash('sha256').update(guestToken).digest('hex');
        const storedBuffer = Buffer.from(order.guestAccessTokenHash, 'hex');
        const incomingBuffer = Buffer.from(incomingHash, 'hex');

        if (storedBuffer.length !== incomingBuffer.length || !crypto.timingSafeEqual(storedBuffer, incomingBuffer)) {
            return res.status(403).json({ message: 'Forbidden: invalid guest access token' });
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
        if (reason) {
            order.cancellationReason = reason;
        }
        await order.save();

        const returnedOrder = order.toObject();
        delete returnedOrder.guestAccessTokenHash;

        return res.status(200).json({
            message: 'Guest order cancelled successfully and reserved stock released',
            order: returnedOrder
        });
    } catch (error) {
        console.error('cancelGuestOrder error:', error.message);
        return res.status(500).json({ message: 'Failed to cancel guest order' });
    }
}

async function getUserOrders(req, res) {
    try {
        const userId = req.user.id;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        let filter = {};
        if (req.user.role === 'admin' && req.query.all === 'true') {
            filter = {};
        } else if (req.user.role === 'seller') {
            const sellerProducts = await Product.find({ seller: userId }).select('_id');
            const productIds = sellerProducts.map(p => p._id);
            if (req.query.scope === 'buyer') {
                filter = { user: userId };
            } else {
                filter = { 'items.product': { $in: productIds } };
            }
        } else {
            filter = { user: userId };
        }

        if (req.query.status && req.query.status !== 'all') {
            if (req.query.status === 'transit') {
                filter.deliveryStatus = { $in: ['shipped', 'pending'] };
            } else if (req.query.status === 'returns') {
                filter.deliveryStatus = 'returned';
            } else {
                filter.deliveryStatus = req.query.status;
            }
        }

        if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
            const s = req.query.search.trim();
            filter.$or = [
                { 'items.name': { $regex: s, $options: 'i' } },
                { trackingNumber: { $regex: s, $options: 'i' } }
            ];
            if (mongoose.isValidObjectId(s)) {
                filter.$or.push({ _id: s });
            }
        }

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'username email')
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

        if (order.isGuest || !order.user) {
            if (req.user.role === 'admin') {
                return res.status(200).json({ message: 'Order fetched successfully', order });
            }
            if (req.user.role === 'seller') {
                const productIds = (order.items || []).map(i => i.product?.toString() || i.product);
                const sellerProduct = await Product.findOne({ _id: { $in: productIds }, seller: req.user.id });
                if (sellerProduct) {
                    return res.status(200).json({ message: 'Order fetched successfully', order });
                }
            }
            return res.status(403).json({ message: 'Forbidden' });
        }

        const orderOwnerId = order.user?._id ? order.user._id.toString() : order.user.toString();
        if (orderOwnerId !== req.user.id && req.user.role !== 'admin') {
            if (req.user.role === 'seller') {
                const productIds = (order.items || []).map(i => i.product?.toString() || i.product);
                const sellerProduct = await Product.findOne({ _id: { $in: productIds }, seller: req.user.id });
                if (!sellerProduct) {
                    return res.status(403).json({ message: 'Forbidden' });
                }
            } else {
                return res.status(403).json({ message: 'Forbidden' });
            }
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
        const { reason } = req.body || {};

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const orderUserId = order.user ? (order.user._id ? order.user._id.toString() : order.user.toString()) : null;
        if (req.user.role !== 'admin' && orderUserId !== req.user.id) {
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
        if (reason) {
            order.cancellationReason = reason;
        }
        await order.save();

        if (order.user) {
            sendNotification({
                userId: order.user._id || order.user,
                category: 'orders',
                title: 'Order cancelled',
                message: `Your order #${order.trackingNumber || order._id} has been cancelled.`,
                icon: 'cancel',
                actionUrl: '/account/orders',
                actionLabel: 'View order',
                dedupeKey: `order_cancelled_${order._id}`,
                prefKey: 'cancellationUpdates',
                metadata: { orderId: order._id }
            }).catch(() => {});
        }

        return res.status(200).json({
            message: 'Order cancelled successfully and reserved stock released',
            order
        });
    } catch (error) {
        console.error('cancelOrder error:', error.message);
        return res.status(500).json({ message: 'Failed to cancel order' });
    }
}

async function requestReturn(req, res) {
    try {
        const { id } = req.params;
        const { reason } = req.body || {};

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const orderUserId = order.user ? (order.user._id ? order.user._id.toString() : order.user.toString()) : null;
        if (req.user.role !== 'admin' && orderUserId !== req.user.id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (order.deliveryStatus !== 'delivered') {
            return res.status(400).json({ message: 'Returns can only be requested for delivered orders' });
        }

        if (order.deliveryStatus === 'returned' || order.refundStatus === 'completed' || order.refundStatus === 'pending') {
            return res.status(400).json({ message: 'Return or refund has already been processed for this order' });
        }

        const isCOD = order.paymentMethod === 'COD';
        order.deliveryStatus = 'returned';
        order.refundStatus = 'pending';
        order.refundAmount = order.totalAmount;
        order.returnReason = reason || 'Customer requested return';
        await order.save();

        if (order.user) {
            const uid = order.user._id || order.user;
            sendNotification({
                userId: uid,
                category: 'returns',
                title: 'Return requested',
                message: `Your return request for order #${order.trackingNumber || order._id} has been received.`,
                icon: 'assignment_return',
                actionUrl: '/account/orders',
                actionLabel: 'View return',
                dedupeKey: `return_requested_${order._id}`,
                prefKey: 'returnStatus',
                metadata: { orderId: order._id }
            }).catch(() => {});

            sendNotification({
                userId: uid,
                category: 'returns',
                title: 'Return approved',
                message: `Your return request for order #${order.trackingNumber || order._id} has been approved.`,
                icon: 'assignment_return',
                actionUrl: '/account/orders',
                actionLabel: 'View return',
                dedupeKey: `return_approved_${order._id}`,
                prefKey: 'returnStatus',
                metadata: { orderId: order._id }
            }).catch(() => {});

            const refundTitle = isCOD ? 'Refund pending inspection' : 'Refund pending';
            const refundMessage = isCOD
                ? 'Your return has been approved. Your refund will be processed via bank transfer after the returned item passes inspection.'
                : `Your return has been approved. Your refund of ₹${(order.refundAmount || order.totalAmount).toLocaleString('en-IN')} is awaiting processing. We'll notify you when it has been completed.`;

            sendNotification({
                userId: uid,
                category: 'returns',
                title: refundTitle,
                message: refundMessage,
                icon: 'currency_rupee',
                actionUrl: '/account/orders',
                actionLabel: 'View details',
                dedupeKey: `order_refund_${order._id}`,
                prefKey: 'refundStatus',
                metadata: { orderId: order._id, paymentMethod: order.paymentMethod, refundStatus: 'pending' }
            }).catch(() => {});
        }

        const responseMessage = isCOD
            ? 'Return request approved. Refund for COD order will be processed via bank transfer after item inspection.'
            : 'Return request processed and refund is awaiting processing';

        return res.status(200).json({
            message: responseMessage,
            order
        });
    } catch (error) {
        console.error('requestReturn error:', error.message);
        return res.status(500).json({ message: 'Failed to process return request' });
    }
}

async function updateOrderStatus(req, res) {
    try {
        const { id } = req.params;
        const { deliveryStatus, trackingNumber } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled', 'returned'];
        if (!validStatuses.includes(deliveryStatus)) {
            return res.status(400).json({
                message: `Invalid delivery status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'seller') {
            return res.status(403).json({ message: 'Forbidden' });
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

        // If transitioning to shipped or delivered, confirm the reserved stock permanently
        if ((deliveryStatus === 'shipped' || deliveryStatus === 'delivered') && order.deliveryStatus !== 'cancelled') {
            const activeReservations = await Reservation.find({
                order: order._id,
                status: 'reserved'
            });

            for (const reservation of activeReservations) {
                const updatedInventory = await Inventory.findOneAndUpdate(
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
                            'variants.$.totalStock': -reservation.quantity,
                            'variants.$.reservedStock': -reservation.quantity
                        }
                    },
                    { new: true }
                );

                if (updatedInventory) {
                    reservation.status = 'confirmed';
                    await reservation.save();

                    const totalStock = updatedInventory.variants.reduce((sum, v) => sum + (v.totalStock || 0), 0);
                    await Product.findByIdAndUpdate(reservation.product, { stock: totalStock });
                }
            }

            if (order.paymentMethod === 'COD' && deliveryStatus === 'delivered') {
                order.paymentStatus = 'paid';
            }
        }

        order.deliveryStatus = deliveryStatus;
        if (trackingNumber) {
            order.trackingNumber = trackingNumber;
        } else if (deliveryStatus === 'shipped' && !order.trackingNumber) {
            order.trackingNumber = `FX-IN-${Math.floor(1000000 + Math.random() * 9000000)}`;
        }

        await order.save();

        if (order.user) {
            const uid = order.user._id || order.user;
            if (deliveryStatus === 'shipped') {
                sendNotification({
                    userId: uid,
                    category: 'delivery',
                    title: 'Order shipped',
                    message: `Your package #${order.trackingNumber || order._id} is on its way.`,
                    icon: 'local_shipping',
                    actionUrl: '/account/orders',
                    actionLabel: 'Track package',
                    dedupeKey: `order_shipped_${order._id}`,
                    prefKey: 'shippingUpdates',
                    metadata: { orderId: order._id, trackingNumber: order.trackingNumber }
                }).catch(() => {});
            } else if (deliveryStatus === 'delivered') {
                sendNotification({
                    userId: uid,
                    category: 'orders',
                    title: 'Order delivered',
                    message: `Your order #${order.trackingNumber || order._id} was delivered successfully.`,
                    icon: 'inventory_2',
                    actionUrl: '/account/orders',
                    actionLabel: 'Rate & review',
                    dedupeKey: `order_delivered_${order._id}`,
                    prefKey: 'deliveryUpdates',
                    metadata: { orderId: order._id }
                }).catch(() => {});
            } else if (deliveryStatus === 'returned') {
                sendNotification({
                    userId: uid,
                    category: 'returns',
                    title: 'Return approved',
                    message: `Your return for order #${order.trackingNumber || order._id} has been approved.`,
                    icon: 'assignment_return',
                    actionUrl: '/account/orders',
                    actionLabel: 'View return',
                    dedupeKey: `return_approved_${order._id}`,
                    prefKey: 'returnStatus',
                    metadata: { orderId: order._id }
                }).catch(() => {});
            }
        }

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
    createGuestOrder,
    getGuestOrder,
    cancelGuestOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    requestReturn,
    updateOrderStatus
};