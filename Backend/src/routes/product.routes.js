const express = require('express');
const { createProduct, getProducts, updateProduct, deleteProduct, getProductById } = require('../controllers/product.controller');
const router = express.Router();
const authorize = require('../middlewares/authorize.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

// Public catalog endpoints (accessible to guests, buyers, sellers, and admins)
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected merchant & administrative management endpoints
router.post('/', authMiddleware, authorize('seller', 'admin'), createProduct);
router.put('/:id', authMiddleware, authorize('seller', 'admin'), updateProduct);
router.delete('/:id', authMiddleware, authorize('seller', 'admin'), deleteProduct);

module.exports = router;
