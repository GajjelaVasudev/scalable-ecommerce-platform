const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('../config/redis');

function safeSendCommand(...args) {
    if (!redisClient || !redisClient.isOpen) {
        throw new Error('Redis client is not connected');
    }
    return redisClient.sendCommand(args);
}

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    passOnStoreError: true,

    store: new RedisStore({
        prefix: 'rl:login:',
        sendCommand: (...args) => safeSendCommand(...args)
    }),

    handler: (req, res) => {
        res.status(429).json({
            message: 'Too many login attempts. Please try again later.'
        });
    }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,

    store: new RedisStore({
        prefix: 'rl:register:',
        sendCommand: (...args) => safeSendCommand(...args)
    }),

    handler: (req, res) => {
        res.status(429).json({
            message: 'Too many registration attempts. Please try again later.'
        });
    }
});

module.exports = {
    loginLimiter,
    registerLimiter
};
