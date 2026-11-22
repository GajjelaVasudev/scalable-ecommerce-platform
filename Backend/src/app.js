const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const { redisClient } = require('./config/redis');

function createApp() {
    const app = express();

    // Health check endpoint (Liveness probe)
    app.get('/health', (req, res) => {
        return res.status(200).json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    });

    // Readiness check endpoint (Readiness probe)
    app.get('/ready', (req, res) => {
        const isDbConnected = mongoose.connection.readyState === 1;
        const isRedisConnected = Boolean(redisClient && redisClient.isOpen);

        if (!isDbConnected) {
            return res.status(503).json({
                status: 'unavailable',
                database: 'disconnected',
                redis: isRedisConnected ? 'connected' : 'disconnected'
            });
        }

        return res.status(200).json({
            status: 'ready',
            database: 'connected',
            redis: isRedisConnected ? 'connected' : 'degraded'
        });
    });

    // Razorpay requires the raw body for signature verification.
    app.use('/api/payments/webhook', express.raw({
        type: 'application/json'
    }));

    app.use(express.json());
    app.use(cookieParser());

    // Structured request logger (sanitizes sensitive data)
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            if (process.env.NODE_ENV !== 'test') {
                console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
            }
        });
        next();
    });

    // Application Routes
    const productRoutes = require('./routes/product.routes');
    const cartRoutes = require('./routes/cart.routes');
    const authRoutes = require('./routes/auth.routes');
    const orderRoutes = require('./routes/order.routes');
    const categoryRoutes = require('./routes/category.routes');
    const inventoryRoutes = require('./routes/inventory.routes');
    const reservationRoutes = require('./routes/reservation.routes');
    const paymentRoutes = require('./routes/payment.routes');
    const addressRoutes = require('./routes/address.routes');

    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/order', orderRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/reservations', reservationRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/addresses', addressRoutes);

    // 404 Route Not Found Handler
    app.use((req, res) => {
        return res.status(404).json({
            message: `Route not found: ${req.method} ${req.originalUrl}`
        });
    });

    // Centralized Express Error Handler
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || err.status || 500;
        const message = err.message || 'Internal Server Error';

        if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
            console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err.message);
        }

        return res.status(statusCode).json({
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    });

    return app;
}

module.exports = createApp;
