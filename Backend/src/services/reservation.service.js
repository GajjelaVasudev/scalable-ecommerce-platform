const mongoose = require('mongoose');

const Reservation = require('../models/reservation.model');
const Inventory = require('../models/inventory.model');
const Order = require('../models/order.model');

let expiryJobRunning = false;

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

async function expireReservations() {
    if (expiryJobRunning) return;

    expiryJobRunning = true;

    try {
        const candidates = await Reservation.find({
            status: 'reserved',
            expiresAt: { $lte: new Date() }
        }).select('_id');

        for (const candidate of candidates) {
            try {
                await withOptionalTransaction(async (session) => {
                    const reservationFindOptions = { new: true };
                    if (session) reservationFindOptions.session = session;

                    const reservation = await Reservation.findOneAndUpdate(
                        {
                            _id: candidate._id,
                            status: 'reserved',
                            expiresAt: { $lte: new Date() }
                        },
                        { $set: { status: 'expired' } },
                        reservationFindOptions
                    );

                    if (!reservation) return;

                    const orderQuery = Order.findById(reservation.order);
                    if (session) orderQuery.session(session);
                    const order = await orderQuery;

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

                    const invFilter = {
                        product: reservation.product,
                        variants: {
                            $elemMatch: {
                                name: reservation.variant,
                                reservedStock: { $gte: reservation.quantity }
                            }
                        }
                    };
                    const invUpdate = {
                        $inc: {
                            'variants.$.availableStock': reservation.quantity,
                            'variants.$.reservedStock': -reservation.quantity
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
                        throw new Error(
                            `Unable to release stock for reservation ${reservation._id}`
                        );
                    }

                    const remainingReservationsQuery = Reservation.exists({
                        order: reservation.order,
                        status: 'reserved'
                    });
                    if (session) remainingReservationsQuery.session(session);
                    const remainingReservations = await remainingReservationsQuery;

                    if (!remainingReservations && order.paymentStatus !== 'paid') {
                        order.paymentStatus = 'unpaid';
                        if (session) {
                            await order.save({ session });
                        } else {
                            await order.save();
                        }
                    }
                });
            } catch (error) {
                console.error(
                    `Failed to expire reservation ${candidate._id}:`,
                    error.message
                );
            }
        }
    } catch (error) {
        console.error('Reservation expiry job failed:', error.message);
    } finally {
        expiryJobRunning = false;
    }
}

module.exports = { expireReservations };
