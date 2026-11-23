const mongoose = require('mongoose');
const crypto = require('crypto');

const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const PaymentIssue = require('../models/paymentIssue.model');
const Reservation = require('../models/reservation.model');
const Inventory = require('../models/inventory.model');
const Product = require('../models/product.model');
const WebhookEvent = require('../models/webhookEvent.model');
const { sendNotification } = require('../services/notification.service');

const { createRazorpayOrder } = require('../services/payment.service');
const { verifyRazorpaySignature } = require('../services/webhook.service');

async function withOptionalTransaction(workFn) {
    let session = null;
    let useTransaction = false;

    try {
        session = await mongoose.startSession();
        session.startTransaction();
        useTransaction = true;
    } catch {
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

function reservationsMatchOrder(orderItems, reservations) {
    if (!Array.isArray(orderItems) || orderItems.length === 0) return false;
    if (orderItems.length !== reservations.length) return false;

    const quantities = new Map();

    for (const item of orderItems) {
        const key = `${String(item.product)}:${item.variant}`;
        quantities.set(key, (quantities.get(key) || 0) + Number(item.quantity));
    }

    for (const reservation of reservations) {
        const key = `${String(reservation.product)}:${reservation.variant}`;
        const quantity = quantities.get(key);

        if (quantity === undefined || quantity !== Number(reservation.quantity)) {
            return false;
        }

        quantities.delete(key);
    }

    return quantities.size === 0;
}

async function recordPaymentIssue({
    payment,
    order,
    razorpayPayment,
    type,
    reason,
    session
}) {
    await PaymentIssue.findOneAndUpdate(
        { providerPaymentId: razorpayPayment.id },
        {
            $setOnInsert: {
                payment: payment._id,
                order: order._id,
                providerPaymentId: razorpayPayment.id,
                providerOrderId: razorpayPayment.order_id,
                type,
                reason,
                amountMinor: Number(razorpayPayment.amount),
                currency: razorpayPayment.currency
            }
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            session
        }
    );
}

// CREATE PAYMENT
async function createPayment(req, res) {
    try {
        const { orderId } = req.params;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findOne({
            _id: orderId,
            user: req.user.id
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Order is already paid' });
        }

        if (order.paymentMethod === 'COD') {
            return res.status(400).json({ message: 'Payment attempts cannot be created for Cash on Delivery (COD) orders' });
        }

        if (!Number.isFinite(Number(order.totalAmount)) || Number(order.totalAmount) <= 0) {
            return res.status(400).json({ message: 'Order amount is invalid' });
        }

        const reservations = await Reservation.find({
            order: order._id,
            status: 'reserved',
            expiresAt: { $gt: new Date() }
        });

        if (!reservationsMatchOrder(order.items, reservations)) {
            return res.status(409).json({
                message: 'Inventory reservation expired or incomplete. Please checkout again.'
            });
        }

        const activePayment = await Payment.findOne({
            order: order._id,
            activeAttempt: true
        }).sort({ createdAt: -1 });

        if (activePayment && ['created', 'pending'].includes(activePayment.status)) {
            return res.status(200).json({
                message: 'Payment attempt already exists',
                payment: activePayment,
                razorpayOrderId: activePayment.providerOrderId,
                keyId: process.env.RAZORPAY_KEY_ID
            });
        }

        // Razorpay expects the amount in the smallest currency unit (paise).
        const razorpayOrder = await createRazorpayOrder({
            amount: order.totalAmount,
            currency: 'INR',
            receipt: `${order._id}-${Date.now()}`
        });

        try {
            const payment = await Payment.create({
                order: order._id,
                user: req.user.id,
                amount: order.totalAmount,
                currency: 'INR',
                provider: 'razorpay',
                providerOrderId: razorpayOrder.id,
                status: 'created',
                activeAttempt: true
            });

            return res.status(201).json({
                message: 'Payment attempt created',
                payment,
                razorpayOrderId: razorpayOrder.id,
                keyId: process.env.RAZORPAY_KEY_ID
            });
        } catch (error) {
            // A concurrent request may have claimed the active attempt first.
            if (error.code === 11000) {
                const existingPayment = await Payment.findOne({
                    order: order._id,
                    activeAttempt: true
                }).sort({ createdAt: -1 });

                if (existingPayment) {
                    return res.status(200).json({
                        message: 'Payment attempt already exists',
                        payment: existingPayment,
                        razorpayOrderId: existingPayment.providerOrderId,
                        keyId: process.env.RAZORPAY_KEY_ID
                    });
                }
            }

            throw error;
        }
    } catch (error) {
        console.error('Create payment error:', error.message);
        return res.status(500).json({ message: 'Failed to create payment' });
    }
}

async function createGuestPayment(req, res) {
    try {
        const { orderId } = req.params;
        const guestToken = req.headers['x-guest-token'] || req.body?.guestAccessToken;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        if (!guestToken || typeof guestToken !== 'string') {
            return res.status(403).json({ message: 'Guest access token is required' });
        }

        const order = await Order.findOne({
            _id: orderId,
            isGuest: true
        }).select('+guestAccessTokenHash');

        if (!order || !order.guestAccessTokenHash) {
            return res.status(404).json({ message: 'Guest order not found or access denied' });
        }

        const incomingHash = crypto.createHash('sha256').update(guestToken).digest('hex');
        const storedBuffer = Buffer.from(order.guestAccessTokenHash, 'hex');
        const incomingBuffer = Buffer.from(incomingHash, 'hex');

        if (storedBuffer.length !== incomingBuffer.length || !crypto.timingSafeEqual(storedBuffer, incomingBuffer)) {
            return res.status(403).json({ message: 'Forbidden: invalid guest access token' });
        }

        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Order is already paid' });
        }

        if (order.paymentMethod === 'COD') {
            return res.status(400).json({ message: 'Payment attempts cannot be created for Cash on Delivery (COD) orders' });
        }

        if (!Number.isFinite(Number(order.totalAmount)) || Number(order.totalAmount) <= 0) {
            return res.status(400).json({ message: 'Order amount is invalid' });
        }

        const reservations = await Reservation.find({
            order: order._id,
            status: 'reserved',
            expiresAt: { $gt: new Date() }
        });

        if (!reservations || reservations.length === 0) {
            return res.status(409).json({ message: 'Inventory reservation expired. Please review your order.' });
        }

        const amountInPaise = Math.round(order.totalAmount * 100);
        let razorpayOrder;

        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'mock_secret') {
            try {
                razorpayOrder = await razorpay.orders.create({
                    amount: amountInPaise,
                    currency: 'INR',
                    receipt: `rcpt_${order._id.toString().slice(-8)}`,
                    notes: { orderId: order._id.toString(), isGuest: 'true' }
                });
            } catch (rzpErr) {
                console.warn('Razorpay live guest order create warning:', rzpErr.message);
                razorpayOrder = { id: `order_rzp_mock_${Date.now()}` };
            }
        } else {
            razorpayOrder = { id: `order_rzp_mock_${Date.now()}` };
        }

        let payment;
        try {
            payment = await Payment.create({
                order: order._id,
                user: null,
                amount: order.totalAmount,
                currency: 'INR',
                provider: 'razorpay',
                providerOrderId: razorpayOrder.id,
                status: 'created',
                activeAttempt: true
            });
        } catch (dbErr) {
            if (dbErr.code === 11000) {
                const existingPayment = await Payment.findOne({
                    order: order._id,
                    activeAttempt: true
                }).sort({ createdAt: -1 });

                if (existingPayment) {
                    return res.status(200).json({
                        message: 'Payment attempt already exists',
                        payment: existingPayment,
                        razorpayOrderId: existingPayment.providerOrderId,
                        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock'
                    });
                }
            }
            throw dbErr;
        }

        return res.status(201).json({
            message: 'Payment attempt created successfully',
            payment,
            razorpayOrderId: razorpayOrder.id,
            keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock'
        });
    } catch (error) {
        console.error('Create guest payment error:', error.message);
        return res.status(500).json({ message: 'Failed to create guest payment attempt' });
    }
}

// RAZORPAY WEBHOOK
async function handleWebhook(req, res) {
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
        return res.status(400).json({ message: 'Missing Razorpay signature' });
    }

    if (!Buffer.isBuffer(req.body)) {
        return res.status(400).json({
            message: 'Webhook requires a raw request body'
        });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('Razorpay webhook secret is not configured');
        return res.status(500).json({ message: 'Webhook configuration error' });
    }

    let session;

    try {
        if (!verifyRazorpaySignature(req.body, signature, webhookSecret)) {
            return res.status(400).json({ message: 'Invalid webhook signature' });
        }

        let event;

        try {
            event = JSON.parse(req.body.toString('utf8'));
        } catch {
            return res.status(400).json({ message: 'Invalid webhook JSON' });
        }

        if (!['payment.captured', 'payment.failed'].includes(event.event)) {
            return res.status(200).json({ message: 'Event ignored' });
        }

        const razorpayPayment = event.payload?.payment?.entity;

        if (
            !razorpayPayment?.id ||
            !razorpayPayment?.order_id ||
            !Number.isFinite(Number(razorpayPayment.amount)) ||
            !razorpayPayment.currency
        ) {
            return res.status(400).json({ message: 'Invalid payment payload' });
        }

        // Razorpay supplies a stable event ID. Hash the raw body as a safe
        // fallback for local/manual webhook tests where that header is absent.
        const suppliedEventId = req.headers['x-razorpay-event-id'];
        const eventId = suppliedEventId
            ? String(suppliedEventId)
            : crypto.createHash('sha256').update(req.body).digest('hex');

        const alreadyProcessed = await WebhookEvent.exists({ eventId });
        if (alreadyProcessed) {
            return res.status(200).json({ message: 'Duplicate webhook event ignored' });
        }

        let outcome = 'Webhook processed successfully';

        await withOptionalTransaction(async (session) => {
            // Unique eventId index makes webhook processing idempotent. If two
            // copies race, the losing transaction aborts and is acknowledged below.
            await WebhookEvent.create([{
                eventId,
                event: event.event,
                providerPaymentId: razorpayPayment.id,
                providerOrderId: razorpayPayment.order_id
            }], { session });

            const payment = await Payment.findOne({
                providerOrderId: razorpayPayment.order_id
            }).session(session);

            if (!payment) {
                throw new Error('Payment record not found');
            }

            const expectedAmount = Math.round(payment.amount * 100);

            if (
                Number(razorpayPayment.amount) !== expectedAmount ||
                razorpayPayment.currency !== payment.currency
            ) {
                throw new Error('Payment amount or currency mismatch');
            }

            const order = await Order.findById(payment.order).session(session);

            if (!order) {
                throw new Error('Order not found');
            }

            if (event.event === 'payment.failed') {
                // A late failure must never reverse a successful payment.
                if (payment.status === 'paid') {
                    outcome = 'Failure event ignored for an already paid attempt';
                    return;
                }

                if (
                    payment.status === 'failed' &&
                    payment.providerPaymentId === razorpayPayment.id
                ) {
                    outcome = 'Payment failure already processed';
                    return;
                }

                payment.providerPaymentId = razorpayPayment.id;
                payment.status = 'failed';
                payment.activeAttempt = false;
                payment.failureReason =
                    razorpayPayment.error_description || 'Payment failed';

                await payment.save({ session });

                // Keep reserved inventory available for a retry until expiry.
                if (order.paymentStatus !== 'paid') {
                    order.paymentStatus = 'unpaid';
                    await order.save({ session });
                }

                outcome = 'Payment failure recorded; reservation retained';
                return;
            }

            // Captured event: same payment ID means this is a duplicate delivery.
            if (
                payment.status === 'paid' &&
                payment.providerPaymentId === razorpayPayment.id
            ) {
                outcome = 'Payment already processed';
                return;
            }

            // Same Razorpay order but a second captured payment ID is a real
            // extra charge; persist it for manual refund/reconciliation.
            if (payment.status === 'paid') {
                await recordPaymentIssue({
                    payment,
                    order,
                    razorpayPayment,
                    type: 'duplicate_charge',
                    reason: 'A second distinct payment was captured for an already-paid payment attempt.',
                    session
                });

                outcome = 'Duplicate charge recorded for reconciliation';
                return;
            }

            payment.providerPaymentId = razorpayPayment.id;
            payment.status = 'paid';
            payment.activeAttempt = false;
            payment.paidAt = new Date();
            payment.failureReason = null;
            await payment.save({ session });

            // A different payment attempt has already paid this order.
            if (order.paymentStatus === 'paid') {
                await recordPaymentIssue({
                    payment,
                    order,
                    razorpayPayment,
                    type: 'duplicate_charge',
                    reason: 'Another payment attempt had already paid this order.',
                    session
                });

                outcome = 'Duplicate charge recorded for reconciliation';
                return;
            }

            const reservations = await Reservation.find({
                order: order._id,
                status: 'reserved',
                expiresAt: { $gt: new Date() }
            }).session(session);

            if (!reservationsMatchOrder(order.items, reservations)) {
                await recordPaymentIssue({
                    payment,
                    order,
                    razorpayPayment,
                    type: 'inventory_unavailable',
                    reason: 'Payment was captured but the complete active inventory reservation was unavailable.',
                    session
                });

                outcome = 'Payment captured; inventory issue recorded for reconciliation';
                return;
            }

            // Preflight all inventory before changing any stock.
            for (const reservation of reservations) {
                const inventory = await Inventory.findOne({
                    product: reservation.product,
                    variants: {
                        $elemMatch: {
                            name: reservation.variant,
                            reservedStock: { $gte: reservation.quantity }
                        }
                    }
                }).session(session);

                if (!inventory) {
                    await recordPaymentIssue({
                        payment,
                        order,
                        razorpayPayment,
                        type: 'inventory_unavailable',
                        reason: `Payment was captured but reserved stock could not be confirmed for variant ${reservation.variant}.`,
                        session
                    });

                    outcome = 'Payment captured; inventory issue recorded for reconciliation';
                    return;
                }
            }

            // Confirm every reservation in the same MongoDB transaction.
            for (const reservation of reservations) {
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
                    { new: true, session }
                );

                if (!updatedInventory) {
                    // Abort and let Razorpay retry; no partial stock change commits.
                    throw new Error(
                        `Inventory changed while confirming ${reservation.variant}`
                    );
                }

                reservation.status = 'confirmed';
                if (session) {
                    await reservation.save({ session });
                } else {
                    await reservation.save();
                }

                // Keep product stock synchronized
                const totalStock = updatedInventory.variants.reduce((sum, v) => sum + (v.totalStock || 0), 0);
                await Product.findByIdAndUpdate(reservation.product, { stock: totalStock });
            }

            order.paymentStatus = 'paid';
            if (session) {
                await order.save({ session });
            } else {
                await order.save();
            }
        });

        // Emit payment notification
        try {
            const paymentDoc = await Payment.findOne({ providerOrderId: razorpayPayment.order_id });
            if (paymentDoc && paymentDoc.order) {
                const paidOrder = await Order.findById(paymentDoc.order);
                if (paidOrder && paidOrder.user) {
                    if (event.event === 'payment.captured' && paymentDoc.status === 'paid') {
                        const amountStr = Number(paidOrder.totalAmount).toLocaleString('en-IN');
                        sendNotification({
                            userId: paidOrder.user,
                            category: 'payments',
                            title: 'Payment successful',
                            message: `Your payment of ₹${amountStr} was received.`,
                            icon: 'payments',
                            actionUrl: '/account/orders',
                            actionLabel: 'View receipt',
                            dedupeKey: `payment_success_${paymentDoc._id}`,
                            prefKey: 'paymentUpdates',
                            metadata: { orderId: paidOrder._id, paymentId: paymentDoc._id }
                        }).catch(() => {});
                    } else if (event.event === 'payment.failed') {
                        sendNotification({
                            userId: paidOrder.user,
                            category: 'payments',
                            title: 'Payment failed',
                            message: `Payment could not be processed for order #${paidOrder.trackingNumber || paidOrder._id}.`,
                            icon: 'payments',
                            actionUrl: '/account/orders',
                            actionLabel: 'Retry payment',
                            dedupeKey: `payment_failed_${paymentDoc._id}`,
                            prefKey: 'paymentUpdates',
                            metadata: { orderId: paidOrder._id, paymentId: paymentDoc._id }
                        }).catch(() => {});
                    }
                }
            }
        } catch (notifErr) {
            console.warn('Payment notification error:', notifErr.message);
        }

        return res.status(200).json({ message: outcome });
    } catch (error) {
        if (error.code === 11000 && error.keyPattern?.eventId) {
            return res.status(200).json({ message: 'Duplicate webhook event ignored' });
        }
        console.error('Webhook error:', error.message);
        return res.status(500).json({ message: 'Webhook processing failed' });
    }
}

// Admin-only reconciliation queue. Resolve only after the refund or corrective
// action has actually been completed outside this endpoint.
async function listPaymentIssues(req, res) {
    try {
        const issues = await PaymentIssue.find({ status: 'pending_review' })
            .populate('order', 'totalAmount paymentStatus')
            .populate('payment', 'amount currency status providerOrderId providerPaymentId')
            .sort({ createdAt: 1 })
            .limit(100);

        return res.status(200).json({ issues });
    } catch (error) {
        console.error('List payment issues error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch payment issues' });
    }
}

async function resolvePaymentIssue(req, res) {
    try {
        const { issueId } = req.params;
        const { resolutionNote } = req.body;

        if (!mongoose.isValidObjectId(issueId)) {
            return res.status(400).json({ message: 'Invalid payment issue ID' });
        }

        if (!resolutionNote || !resolutionNote.trim()) {
            return res.status(400).json({
                message: 'Resolution note is required'
            });
        }

        const issue = await PaymentIssue.findOneAndUpdate(
            { _id: issueId, status: 'pending_review' },
            {
                $set: {
                    status: 'resolved',
                    resolutionNote: resolutionNote.trim(),
                    resolvedAt: new Date()
                }
            },
            { new: true, runValidators: true }
        );

        if (!issue) {
            return res.status(404).json({
                message: 'Pending payment issue not found'
            });
        }

        return res.status(200).json({
            message: 'Payment issue marked resolved',
            issue
        });
    } catch (error) {
        console.error('Resolve payment issue error:', error.message);
        return res.status(500).json({ message: 'Failed to resolve payment issue' });
    }
}

module.exports = {
    createPayment,
    createGuestPayment,
    handleWebhook,
    listPaymentIssues,
    resolvePaymentIssue
};
