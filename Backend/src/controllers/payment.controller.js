const mongoose = require('mongoose');
const crypto = require('crypto');

const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Reservation = require('../models/reservation.model');
const Inventory = require('../models/inventory.model');

const {
    createRazorpayOrder
} = require('../services/payment.service');


// ======================================================
// CREATE PAYMENT
// ======================================================

async function createPayment(req, res) {
    const { orderId } = req.params;
    const userId = req.user.id;

    try {

        // Find user's order
        const order = await Order.findOne({
            _id: orderId,
            user: userId
        });

        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        // Order already paid
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                message: 'Order is already paid'
            });
        }

        // Find existing payment
        let payment = await Payment.findOne({
            order: orderId
        });

        // Already paid/refunded payment cannot be retried
        if (
            payment &&
            ['paid', 'refunded'].includes(payment.status)
        ) {
            return res.status(400).json({
                message: 'Payment cannot be retried'
            });
        }

        // Existing active payment
        if (payment && payment.status === 'created') {
            return res.status(200).json({
                message: 'Payment already created',
                payment
            });
        }

        // Create new Razorpay order
        const razorpayOrder = await createRazorpayOrder({
            amount: order.totalAmount,
            currency: 'INR',
            receipt: order._id.toString()
        });

        // Create payment if it doesn't exist
        if (!payment) {

            payment = await Payment.create({
                order: order._id,
                user: userId,
                amount: order.totalAmount,
                currency: 'INR',
                provider: 'razorpay',
                providerOrderId: razorpayOrder.id,
                status: 'created'
            });

        } else {

            // Retry failed payment
            payment.providerOrderId = razorpayOrder.id;
            payment.providerPaymentId = null;
            payment.status = 'created';
            payment.failureReason = null;
            payment.paidAt = null;

            await payment.save();
        }

        return res.status(201).json({
            message: 'Payment created successfully',

            payment: {
                id: payment._id,
                orderId: order._id,
                amount: payment.amount,
                currency: payment.currency,
                provider: payment.provider,
                providerOrderId: payment.providerOrderId,
                status: payment.status
            },

            razorpay: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            }
        });

    } catch (error) {

        console.error(
            'Create payment error:',
            error
        );

        return res.status(500).json({
            message:
                error.message ||
                'Failed to create payment'
        });
    }
}


// ======================================================
// RAZORPAY WEBHOOK
// ======================================================

async function handleWebhook(req, res) {

    const signature =
        req.headers['x-razorpay-signature'];

    if (!signature) {
        return res.status(400).json({
            message: 'Missing Razorpay signature'
        });
    }

    try {

        // ==================================================
        // VERIFY WEBHOOK SIGNATURE
        // ==================================================

        const expectedSignature =
            crypto
                .createHmac(
                    'sha256',
                    process.env.RAZORPAY_WEBHOOK_SECRET
                )
                .update(req.body)
                .digest('hex');

        if (
            expectedSignature.length !==
                signature.length ||
            !crypto.timingSafeEqual(
                Buffer.from(expectedSignature),
                Buffer.from(signature)
            )
        ) {
            return res.status(400).json({
                message: 'Invalid webhook signature'
            });
        }

        // Parse raw body
        const event = JSON.parse(
            req.body.toString()
        );

        // We only handle these two events
        if (
            event.event !== 'payment.captured' &&
            event.event !== 'payment.failed'
        ) {
            return res.status(200).json({
                message: 'Event ignored'
            });
        }

        const razorpayPayment =
            event.payload.payment.entity;

        const session =
            await mongoose.startSession();

        session.startTransaction();

        try {

            // ==================================================
            // FIND PAYMENT
            // ==================================================

            const payment =
                await Payment.findOne({
                    providerOrderId:
                        razorpayPayment.order_id
                }).session(session);

            if (!payment) {
                throw new Error(
                    'Payment record not found'
                );
            }


            // ==================================================
            // PAYMENT CAPTURED
            // ==================================================

            if (event.event === 'payment.captured') {

                // Idempotency
                if (payment.status === 'paid') {

                    await session.abortTransaction();
                    await session.endSession();

                    return res.status(200).json({
                        message:
                            'Payment already processed'
                    });
                }

                // Update payment
                payment.providerPaymentId =
                    razorpayPayment.id;

                payment.status = 'paid';

                payment.paidAt = new Date();

                payment.failureReason = null;

                await payment.save({
                    session
                });


                // Find order
                const order =
                    await Order.findById(
                        payment.order
                    ).session(session);

                if (!order) {
                    throw new Error(
                        'Order not found'
                    );
                }


                // Mark order paid
                order.paymentStatus = 'paid';

                await order.save({
                    session
                });


                // Find active reservations
                const reservations =
                    await Reservation.find({
                        order: order._id,
                        status: 'reserved'
                    }).session(session);

                if (reservations.length === 0) {
                    throw new Error(
                        'No active reservations found for this order'
                    );
                }


                // Confirm reservations
                for (const reservation of reservations) {

                    const updatedInventory =
                        await Inventory.findOneAndUpdate(
                            {
                                product:
                                    reservation.product,

                                variants: {
                                    $elemMatch: {
                                        name:
                                            reservation.variant,

                                        reservedStock: {
                                            $gte:
                                                reservation.quantity
                                        }
                                    }
                                }
                            },

                            {
                                $inc: {
                                    'variants.$.totalStock':
                                        -reservation.quantity,

                                    'variants.$.reservedStock':
                                        -reservation.quantity
                                }
                            },

                            {
                                session,
                                new: true
                            }
                        );

                    if (!updatedInventory) {
                        throw new Error(
                            `Unable to confirm stock for ${reservation.variant}`
                        );
                    }

                    reservation.status =
                        'confirmed';

                    await reservation.save({
                        session
                    });
                }
            }


            // ==================================================
            // PAYMENT FAILED
            // ==================================================

            if (event.event === 'payment.failed') {

                // Ignore duplicate failure webhook
                if (payment.status === 'failed') {

                    await session.abortTransaction();
                    await session.endSession();

                    return res.status(200).json({
                        message:
                            'Payment failure already processed'
                    });
                }

                // Update payment
                payment.providerPaymentId =
                    razorpayPayment.id || null;

                payment.status = 'failed';

                payment.failureReason =
                    razorpayPayment.error_description ||
                    'Payment failed';

                await payment.save({
                    session
                });


                // Find order
                const order =
                    await Order.findById(
                        payment.order
                    ).session(session);

                if (!order) {
                    throw new Error(
                        'Order not found'
                    );
                }

                // Keep order unpaid so payment can be retried
                order.paymentStatus = 'unpaid';

                await order.save({
                    session
                });


                // Find active reservations
                const reservations =
                    await Reservation.find({
                        order: order._id,
                        status: 'reserved'
                    }).session(session);


                // Release inventory
                for (const reservation of reservations) {

                    const updatedInventory =
                        await Inventory.findOneAndUpdate(
                            {
                                product:
                                    reservation.product,

                                variants: {
                                    $elemMatch: {
                                        name:
                                            reservation.variant,

                                        reservedStock: {
                                            $gte:
                                                reservation.quantity
                                        }
                                    }
                                }
                            },

                            {
                                $inc: {
                                    'variants.$.availableStock':
                                        reservation.quantity,

                                    'variants.$.reservedStock':
                                        -reservation.quantity
                                }
                            },

                            {
                                session,
                                new: true
                            }
                        );

                    if (!updatedInventory) {
                        throw new Error(
                            `Unable to release stock for ${reservation.variant}`
                        );
                    }

                    reservation.status =
                        'released';

                    await reservation.save({
                        session
                    });
                }
            }


            // ==================================================
            // COMMIT
            // ==================================================

            await session.commitTransaction();
            await session.endSession();

            return res.status(200).json({
                message:
                    'Webhook processed successfully'
            });

        } catch (error) {

            await session.abortTransaction();
            await session.endSession();

            throw error;
        }

    } catch (error) {

        console.error(
            'Webhook error:',
            error
        );

        return res.status(500).json({
            message:
                'Webhook processing failed'
        });
    }
}


module.exports = {
    createPayment,
    handleWebhook
};