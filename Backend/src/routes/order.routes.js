const express = require('express');
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus
} = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

router.post('/create', authMiddleware, authorize('buyer'), createOrder);
router.get('/', authMiddleware, authorize('buyer', 'admin'), getUserOrders);
router.get('/:id', authMiddleware, authorize('buyer', 'admin'), getOrderById);
router.patch('/:id/cancel', authMiddleware, authorize('buyer', 'admin'), cancelOrder);
router.patch('/:id/status', authMiddleware, authorize('admin'), updateOrderStatus);

module.exports = router;