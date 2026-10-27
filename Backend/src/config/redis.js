const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 3) {
                return false; // Stop retrying to allow graceful degradation
            }
            return Math.min(retries * 500, 2000);
        },
        connectTimeout: 3000
    }
});

redisClient.on('error', (error) => {
    // Suppress spammy connection errors when offline
    if (redisClient.isOpen) {
        console.error('Redis error:', error.message);
    }
});

async function connectRedis() {
    try {
        await redisClient.connect();
        console.log('Redis connected successfully');
    } catch (error) {
        console.warn('Redis connection unavailable; caching and distributed rate limiting will degrade gracefully:', error.message);
    }
}

async function closeRedis() {
    if (redisClient && redisClient.isOpen) {
        try {
            await redisClient.quit();
            console.log('Redis disconnected gracefully');
        } catch (error) {
            console.error('Error closing Redis connection:', error.message);
        }
    }
}

module.exports = {
    redisClient,
    connectRedis,
    closeRedis
};