const Reservation = require('../models/reservation.model');
const Inventory = require('../models/inventory.model');
const Order = require('../models/order.model');

async function expireReservations() {
    const now = new Date();

    const reservations = await Reservation.find({
        status: 'reserved',
        expiresAt: { $lte: now }
    });

    for (const reservation of reservations) {

        try {

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
                            'variants.$.availableStock':
                                reservation.quantity,

                            'variants.$.reservedStock':
                                -reservation.quantity
                        }
                    },
                    {
                        new: true
                    }
                );

            if (!updatedInventory) {
                continue;
            }

            reservation.status = 'expired';

            await reservation.save();

            await Order.findByIdAndUpdate(
                reservation.order,
                {
                    paymentStatus: 'unpaid'
                }
            );

        } catch (error) {

            console.error(
                `Failed to expire reservation ${reservation._id}:`,
                error.message
            );
        }
    }
}

module.exports = {
    expireReservations
};