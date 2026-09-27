const express = require('express');
const { createProduct, getProducts, updateProduct, deleteProduct, getProductById } = require('../controllers/product.controller');
const router = express.Router();
const authorize = require('../middlewares/authorize.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, authorize('seller', 'admin'), createProduct);
router.get('/', authMiddleware, authorize('seller', 'buyer', 'admin'), getProducts);
router.put('/:id', authMiddleware, authorize('seller', 'admin'), updateProduct);
router.delete('/:id', authMiddleware, authorize('seller', 'admin'), deleteProduct);
router.get('/:id', authMiddleware, authorize('seller', 'buyer', 'admin'), getProductById);

module.exports = router;