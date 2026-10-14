
require('dotenv').config();

const connectDB = require('./src/db/db');
const { connectRedis } = require('./src/config/redis');
const { expireReservations } = require('./src/services/reservation.service');

async function startServer() {
    try {
        await connectDB();
        await connectRedis();

        // Import and create the app only after Redis connects.
        const createApp = require('./src/app');
        const app = createApp();

        // Expire stale inventory reservations periodically. The service guards
        // against overlapping runs and uses transactions for each reservation.
        const reservationExpiryTimer = setInterval(() => {
            expireReservations().catch((error) => {
                console.error('Reservation expiry scheduler error:', error.message);
            });
        }, 60 * 1000);
        reservationExpiryTimer.unref();
        expireReservations().catch((error) => {
            console.error('Initial reservation expiry error:', error.message);
        });

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
