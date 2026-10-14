
const express = require('express');
const cookieParser = require('cookie-parser');

function createApp() {
    const app = express();

    // Razorpay requires the raw body for signature verification.
    app.use('/api/payments/webhook', express.raw({
        type: 'application/json'
    }));

    app.use(express.json());
    app.use(cookieParser());

    // Load routes after Redis has connected.
    const productRoutes = require('./routes/product.routes');
    const cartRoutes = require('./routes/cart.routes');
    const authRoutes = require('./routes/auth.routes');
    const orderRoutes = require('./routes/order.routes');
    const categoryRoutes = require('./routes/category.routes');
    const inventoryRoutes = require('./routes/inventory.routes');
    const reservationRoutes = require('./routes/reservation.routes');
    const paymentRoutes = require('./routes/payment.routes');

    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/order', orderRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/reservations', reservationRoutes);
    app.use('/api/payments', paymentRoutes);

    return app;
}

module.exports = createApp;
