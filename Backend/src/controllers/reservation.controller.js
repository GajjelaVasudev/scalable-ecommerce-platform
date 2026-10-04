const mongoose = require('mongoose');
const Reservation = require('../models/reservation.model');
const Inventory = require('../models/inventory.model');

async function confirmReservations(req, res) {
    const { orderId } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const reservations = await Reservation.find({
            order: orderId,
            status: 'reserved'
        }).session(session);

        if (reservations.length === 0) {
            throw new Error('No active reservations found for this order');
        }

        for (const reservation of reservations) {

            const updatedInventory = await Inventory.findOneAndUpdate(
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
                        'variants.$.totalStock': -reservation.quantity,
                        'variants.$.reservedStock': -reservation.quantity
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

            reservation.status = 'confirmed';
            await reservation.save({ session });
        }

        await session.commitTransaction();
        await session.endSession();

        return res.status(200).json({
            message: 'Reservations confirmed successfully'
        });

    } catch (error) {

        await session.abortTransaction();
        await session.endSession();

        return res.status(500).json({
            message: error.message || 'Failed to confirm reservations'
        });
    }
}


async function releaseReservations(req, res) {
    const { orderId } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const reservations = await Reservation.find({
            order: orderId,
            status: 'reserved'
        }).session(session);

        if (reservations.length === 0) {
            throw new Error('No active reservations found for this order');
        }

        for (const reservation of reservations) {

            const updatedInventory = await Inventory.findOneAndUpdate(
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
                        'variants.$.availableStock': reservation.quantity,
                        'variants.$.reservedStock': -reservation.quantity
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

            reservation.status = 'released';
            await reservation.save({ session });
        }

        await session.commitTransaction();
        await session.endSession();

        return res.status(200).json({
            message: 'Reservations released successfully'
        });

    } catch (error) {

        await session.abortTransaction();
        await session.endSession();

        return res.status(500).json({
            message: error.message || 'Failed to release reservations'
        });
    }
}


module.exports = {
    confirmReservations,
    releaseReservations
};