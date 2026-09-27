const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

const {
    addToCart,
    getCart,
    removeFromCart,
    updateCartItem,
    clearCart
} = require('../controllers/cart.controller');


router.post('/items', authMiddleware, authorize('buyer'), addToCart);
router.get('/', authMiddleware, authorize('buyer'), getCart);
router.patch('/items/:productId', authMiddleware, authorize('buyer'), updateCartItem);
router.delete('/items/:productId', authMiddleware, authorize('buyer'), removeFromCart);
router.delete('/', authMiddleware, authorize('buyer'), clearCart);

module.exports = router;