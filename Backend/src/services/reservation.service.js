const mongoose = require('mongoose');

const Reservation = require('../models/reservation.model');
const Inventory = require('../models/inventory.model');
const Order = require('../models/order.model');

let expiryJobRunning = false;

async function expireReservations() {
    if (expiryJobRunning) return;

    expiryJobRunning = true;

    try {
        const candidates = await Reservation.find({
            status: 'reserved',
            expiresAt: { $lte: new Date() }
        }).select('_id');

        for (const candidate of candidates) {
            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    const reservation = await Reservation.findOneAndUpdate(
                        {
                            _id: candidate._id,
                            status: 'reserved',
                            expiresAt: { $lte: new Date() }
                        },
                        { $set: { status: 'expired' } },
                        { new: true, session }
                    );

                    if (!reservation) return;

                    const order = await Order.findById(reservation.order)
                        .session(session);

                    if (!order) {
                        throw new Error('Order not found');
                    }

                    // The payment webhook and expiry job are transactionally
                    // competing for this reservation. Never release stock for
                    // an order that has already been paid.
                    if (order.paymentStatus === 'paid') {
                        throw new Error(
                            `Paid order ${order._id} still has a reserved item; manual reconciliation required`
                        );
                    }

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
                                'variants.$.availableStock': reservation.quantity,
                                'variants.$.reservedStock': -reservation.quantity
                            }
                        },
                        { new: true, session }
                    );

                    if (!updatedInventory) {
                        throw new Error(
                            `Unable to release stock for reservation ${reservation._id}`
                        );
                    }

                    const remainingReservations = await Reservation.exists({
                        order: reservation.order,
                        status: 'reserved'
                    }).session(session);

                    if (!remainingReservations && order.paymentStatus !== 'paid') {
                        order.paymentStatus = 'unpaid';
                        await order.save({ session });
                    }
                });
            } catch (error) {
                console.error(
                    `Failed to expire reservation ${candidate._id}:`,
                    error.message
                );
            } finally {
                await session.endSession();
            }
        }
    } catch (error) {
        console.error('Reservation expiry job failed:', error.message);
    } finally {
        expiryJobRunning = false;
    }
}

module.exports = { expireReservations };
