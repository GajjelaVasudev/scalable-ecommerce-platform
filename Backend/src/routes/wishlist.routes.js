const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    mergeWishlist
} = require('../controllers/wishlist.controller');

// All wishlist routes require authenticated buyer/admin
router.use(authMiddleware);
router.use(authorize('buyer', 'admin'));

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.post('/items', addToWishlist);
router.post('/merge', mergeWishlist);
router.delete('/:productId', removeFromWishlist);
router.delete('/items/:productId', removeFromWishlist);
router.delete('/', clearWishlist);

module.exports = router;
