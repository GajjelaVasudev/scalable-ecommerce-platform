const mongoose = require('mongoose');
const Reservation = require('../models/reservation.model');
const Inventory = require('../models/inventory.model');
const Product = require('../models/product.model');

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

async function confirmReservations(req, res) {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
    }

    try {
        await withOptionalTransaction(async (session) => {
            const query = { order: orderId };
            const allReservations = await Reservation.find(query);

            if (allReservations.length === 0) {
                const err = new Error('No reservations found for this order');
                err.statusCode = 404;
                throw err;
            }

            const unconfirmed = allReservations.filter(r => r.status === 'reserved');

            // Idempotent: already confirmed
            if (unconfirmed.length === 0 && allReservations.every(r => r.status === 'confirmed')) {
                return;
            }

            if (unconfirmed.length === 0) {
                const err = new Error('No active reservations available to confirm');
                err.statusCode = 400;
                throw err;
            }

            const now = new Date();
            for (const reservation of unconfirmed) {
                // Prevent expired reservations from being confirmed
                if (reservation.expiresAt <= now) {
                    const err = new Error(
                        `Reservation for ${reservation.variant} has expired and cannot be confirmed`
                    );
                    err.statusCode = 409;
                    throw err;
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
                        'variants.$.totalStock': -reservation.quantity,
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
                    const err = new Error(
                        `Unable to confirm stock for ${reservation.variant}: reserved stock missing or altered`
                    );
                    err.statusCode = 409;
                    throw err;
                }

                reservation.status = 'confirmed';
                if (session) {
                    await reservation.save({ session });
                } else {
                    await reservation.save();
                }

                // Sync product total stock
                const totalStock = updatedInventory.variants.reduce((sum, v) => sum + (v.totalStock || 0), 0);
                await Product.findByIdAndUpdate(reservation.product, { stock: totalStock });
            }
        });

        return res.status(200).json({
            message: 'Reservations confirmed successfully'
        });
    } catch (error) {
        console.error('confirmReservations error:', error.message);
        const status = error.statusCode || 500;
        return res.status(status).json({
            message: error.message || 'Failed to confirm reservations'
        });
    }
}

async function releaseReservations(req, res) {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID' });
    }

    try {
        await withOptionalTransaction(async (session) => {
            const allReservations = await Reservation.find({ order: orderId });

            if (allReservations.length === 0) {
                const err = new Error('No reservations found for this order');
                err.statusCode = 404;
                throw err;
            }

            const unreleased = allReservations.filter(r => r.status === 'reserved');

            // Idempotent: already released
            if (unreleased.length === 0 && allReservations.every(r => ['released', 'expired'].includes(r.status))) {
                return;
            }

            if (unreleased.length === 0) {
                const err = new Error('No active reservations available to release');
                err.statusCode = 400;
                throw err;
            }

            for (const reservation of unreleased) {
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
                    const err = new Error(
                        `Unable to release stock for ${reservation.variant}: reserved stock missing or altered`
                    );
                    err.statusCode = 409;
                    throw err;
                }

                reservation.status = 'released';
                if (session) {
                    await reservation.save({ session });
                } else {
                    await reservation.save();
                }
            }
        });

        return res.status(200).json({
            message: 'Reservations released successfully'
        });
    } catch (error) {
        console.error('releaseReservations error:', error.message);
        const status = error.statusCode || 500;
        return res.status(status).json({
            message: error.message || 'Failed to release reservations'
        });
    }
}

module.exports = {
    confirmReservations,
    releaseReservations
};