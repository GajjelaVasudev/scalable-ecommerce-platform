const express = require('express');
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    requestReturn,
    updateOrderStatus
} = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

router.post('/create', authMiddleware, authorize('buyer'), createOrder);
router.get('/', authMiddleware, authorize('buyer', 'seller', 'admin'), getUserOrders);
router.get('/:id', authMiddleware, authorize('buyer', 'seller', 'admin'), getOrderById);
router.patch('/:id/cancel', authMiddleware, authorize('buyer', 'admin'), cancelOrder);
router.post('/:id/return', authMiddleware, authorize('buyer', 'admin'), requestReturn);
router.patch('/:id/status', authMiddleware, authorize('seller', 'admin'), updateOrderStatus);

module.exports = router;