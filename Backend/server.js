
require('dotenv').config();

const connectDB = require('./src/db/db');
const { connectRedis } = require('./src/config/redis');

async function startServer() {
    try {
        await connectDB();
        await connectRedis();

        // Import and create the app only after Redis connects.
        const createApp = require('./src/app');
        const app = createApp();

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
