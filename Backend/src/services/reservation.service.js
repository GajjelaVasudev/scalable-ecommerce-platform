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
                    const resQuery = Reservation.findById(candidate._id);
                    if (session) resQuery.session(session);
                    const reservation = await resQuery;

                    if (!reservation || reservation.status !== 'reserved' || reservation.expiresAt > new Date()) return;

                    const orderQuery = Order.findById(reservation.order);
                    if (session) orderQuery.session(session);
                    const order = await orderQuery;

                    if (!order) {
                        throw new Error('Order not found');
                    }

                    // Never expire reservations for Cash on Delivery (COD) orders or paid/shipped orders.
                    // COD orders do not receive online payment; their stock must remain reserved until delivery/settlement or explicit cancellation.
                    if (order.paymentMethod === 'COD' || order.paymentStatus === 'paid' || order.deliveryStatus === 'shipped' || order.deliveryStatus === 'delivered') {
                        return;
                    }

                    reservation.status = 'expired';
                    if (session) {
                        await reservation.save({ session });
                    } else {
                        await reservation.save();
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
