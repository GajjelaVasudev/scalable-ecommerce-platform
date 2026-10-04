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

        // Prevent payment for already paid order
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                message: 'Order is already paid'
            });
        }

        // Check existing payment
        let payment = await Payment.findOne({
            order: orderId
        });

        // Return existing payment
        if (payment && payment.status === 'created') {
            return res.status(200).json({
                message: 'Payment already created',
                payment
            });
        }

        // Create Razorpay order
        const razorpayOrder = await createRazorpayOrder({
            amount: order.totalAmount,
            currency: 'INR',
            receipt: order._id.toString()
        });

        // Create payment record
        payment = await Payment.create({
            order: order._id,
            user: userId,
            amount: order.totalAmount,
            currency: 'INR',
            provider: 'razorpay',
            providerOrderId: razorpayOrder.id,
            status: 'created'
        });

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

        console.error('Create payment error:', error);

        return res.status(500).json({
            message: error.message || 'Failed to create payment'
        });
    }
}


// ======================================================
// RAZORPAY WEBHOOK
// ======================================================

async function handleWebhook(req, res) {

    const signature = req.headers['x-razorpay-signature'];

    // Check signature exists
    if (!signature) {
        return res.status(400).json({
            message: 'Missing Razorpay signature'
        });
    }

    try {

        // Generate expected signature
        const expectedSignature = crypto
            .createHmac(
                'sha256',
                process.env.RAZORPAY_WEBHOOK_SECRET
            )
            .update(req.body)
            .digest('hex');

        // Prevent timingSafeEqual from throwing
        // when lengths are different
        if (
            expectedSignature.length !== signature.length ||
            !crypto.timingSafeEqual(
                Buffer.from(expectedSignature),
                Buffer.from(signature)
            )
        ) {
            return res.status(400).json({
                message: 'Invalid webhook signature'
            });
        }

        // Convert raw body into JSON
        const event = JSON.parse(
            req.body.toString()
        );

        // We only process successful captured payments
        if (event.event !== 'payment.captured') {
            return res.status(200).json({
                message: 'Event ignored'
            });
        }

        const razorpayPayment =
            event.payload.payment.entity;

        const session = await mongoose.startSession();

        session.startTransaction();

        try {

            // Find our payment using Razorpay order ID
            const payment = await Payment.findOne({
                providerOrderId: razorpayPayment.order_id
            }).session(session);

            if (!payment) {
                throw new Error(
                    'Payment record not found'
                );
            }

            // ==================================================
            // IDEMPOTENCY CHECK
            // ==================================================

            if (payment.status === 'paid') {

                await session.abortTransaction();
                await session.endSession();

                return res.status(200).json({
                    message: 'Payment already processed'
                });
            }

            // ==================================================
            // UPDATE PAYMENT
            // ==================================================

            payment.providerPaymentId =
                razorpayPayment.id;

            payment.status = 'paid';

            payment.paidAt = new Date();

            await payment.save({
                session
            });


            // ==================================================
            // FIND ORDER
            // ==================================================

            const order = await Order.findById(
                payment.order
            ).session(session);

            if (!order) {
                throw new Error(
                    'Order not found'
                );
            }


            // ==================================================
            // MARK ORDER AS PAID
            // ==================================================

            order.paymentStatus = 'paid';

            await order.save({
                session
            });


            // ==================================================
            // FIND ACTIVE RESERVATIONS
            // ==================================================

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


            // ==================================================
            // CONFIRM EACH RESERVATION
            // ==================================================

            for (const reservation of reservations) {

                const updatedInventory =
                    await Inventory.findOneAndUpdate(
                        {
                            product: reservation.product,

                            variants: {
                                $elemMatch: {
                                    name: reservation.variant,

                                    reservedStock: {
                                        $gte: reservation.quantity
                                    }
                                }
                            }
                        },

                        {
                            $inc: {

                                // Physical stock decreases
                                'variants.$.totalStock':
                                    -reservation.quantity,

                                // Reservation disappears
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

                // Mark reservation confirmed
                reservation.status = 'confirmed';

                await reservation.save({
                    session
                });
            }


            // ==================================================
            // COMMIT EVERYTHING
            // ==================================================

            await session.commitTransaction();

            await session.endSession();

            return res.status(200).json({
                message: 'Payment processed successfully'
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
            message: 'Webhook processing failed'
        });
    }
}


module.exports = {
    createPayment,
    handleWebhook
};