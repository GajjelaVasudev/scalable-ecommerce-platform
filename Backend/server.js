require('dotenv').config();

const { connectDB, closeDB } = require('./src/db/db');
const { connectRedis, closeRedis } = require('./src/config/redis');
const { expireReservations } = require('./src/services/reservation.service');
const createApp = require('./src/app');

let server = null;
let reservationExpiryTimer = null;

async function startServer() {
    try {
        await connectDB();
        await connectRedis();

        const app = createApp();

        // Expire stale inventory reservations periodically.
        reservationExpiryTimer = setInterval(() => {
            expireReservations().catch((error) => {
                console.error('Reservation expiry scheduler error:', error.message);
            });
        }, 60 * 1000);
        reservationExpiryTimer.unref();

        expireReservations().catch((error) => {
            console.error('Initial reservation expiry error:', error.message);
        });

        const PORT = process.env.PORT || 3000;

        server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        return server;
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

async function shutdown(signal) {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    if (reservationExpiryTimer) {
        clearInterval(reservationExpiryTimer);
        reservationExpiryTimer = null;
    }

    if (server) {
        await new Promise((resolve) => server.close(resolve));
        console.log('HTTP server closed');
    }

    await closeRedis();
    await closeDB();

    console.log('Graceful shutdown completed');
    process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (require.main === module) {
    startServer();
}

module.exports = { startServer, shutdown };
