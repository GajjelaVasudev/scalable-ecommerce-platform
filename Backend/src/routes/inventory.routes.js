const express = require('express');
const router = express.Router();
const {createInventory, getInventory, updateInventory, reserveStock, releaseStock, confirmStock} = require('../controllers/inventory.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

router.post('/', authMiddleware, authorize('admin', 'seller'), createInventory);

router.get('/:productId', authMiddleware, authorize('admin', 'seller', 'buyer'), getInventory);

router.patch('/:productId/reserve', authMiddleware, authorize('buyer'), reserveStock);

router.patch('/:productId/release', authMiddleware, authorize('admin', 'seller'), releaseStock);

router.patch('/:productId', authMiddleware, authorize('admin', 'seller'), updateInventory);

router.patch('/:productId/confirm', authMiddleware, authorize('admin'), confirmStock);

module.exports = router;