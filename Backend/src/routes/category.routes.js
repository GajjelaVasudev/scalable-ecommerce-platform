const express = require('express');
const { createCategory } = require('../controllers/category.controller');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

router.post('/', authMiddleware,authorize(['admin']), createCategory);
router.get('/', authMiddleware,authorize(['admin','seller','buyer']), getAllCategories);
router.get('/:id', authMiddleware,authorize(['admin','seller','buyer']), getCategoryById);
router.put('/:id', authMiddleware,authorize(['admin']), updateCategory);
router.delete('/:id', authMiddleware,authorize(['admin']), deleteCategory);

module.exports = router;