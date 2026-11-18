const express = require('express');
const { createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory } = require('../controllers/category.controller');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

// Public category taxonomies (accessible to guests, buyers, sellers, and admins)
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Protected administrative management endpoints
router.post('/', authMiddleware, authorize('admin'), createCategory);
router.put('/:id', authMiddleware, authorize('admin'), updateCategory);
router.delete('/:id', authMiddleware, authorize('admin'), deleteCategory);

module.exports = router;