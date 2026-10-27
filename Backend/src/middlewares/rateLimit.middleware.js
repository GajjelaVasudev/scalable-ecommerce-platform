const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('../config/redis');

function createStore(prefix) {
    if (process.env.NODE_ENV === 'test' || !redisClient || !redisClient.isOpen) {
        return undefined; // Uses built-in memory store gracefully
    }

    return new RedisStore({
        prefix,
        sendCommand: (...args) => {
            if (!redisClient || !redisClient.isOpen) {
                throw new Error('Redis client is not connected');
            }
            return redisClient.sendCommand(args);
        }
    });
}

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    passOnStoreError: true,
    store: createStore('rl:login:'),

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
    store: createStore('rl:register:'),

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
