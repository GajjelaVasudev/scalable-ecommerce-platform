const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

const {
    getOrderEligibility,
    createReturn,
    getMyReturns,
    getReturnById,
    cancelReturn,
    uploadEvidence,
    raiseDispute,
    getSellerReturnsList,
    sellerReview,
    updateLogistics,
    performInspection,
    getAdminReturnsList,
    resolveDispute,
    triggerGatewayRefund,
    confirmCODTransfer
} = require('../controllers/return.controller');

// All return routes require authentication
router.use(authMiddleware);

// --- Specific / Nested Static Routes (Must precede /:id) ---
router.get('/eligibility/:orderId', authorize('buyer', 'admin'), getOrderEligibility);
router.get('/my-returns', authorize('buyer', 'admin'), getMyReturns);
router.post('/upload-evidence', authorize('buyer', 'seller', 'admin'), uploadEvidence);

// --- Seller Routes ---
router.get('/seller/list', authorize('seller', 'admin'), getSellerReturnsList);
router.post('/seller/:id/review', authorize('seller', 'admin'), sellerReview);
router.post('/seller/:id/logistics', authorize('seller', 'admin'), updateLogistics);
router.post('/seller/:id/inspect', authorize('seller', 'admin'), performInspection);

// --- Admin Routes ---
router.get('/admin/list', authorize('admin'), getAdminReturnsList);
router.post('/admin/:id/dispute/resolve', authorize('admin'), resolveDispute);
router.post('/admin/:id/refund/gateway', authorize('admin'), triggerGatewayRefund);
router.post('/admin/:id/refund/cod-confirm', authorize('admin'), confirmCODTransfer);

// --- Customer General / Param Routes ---
router.post('/', authorize('buyer', 'admin'), createReturn);
router.get('/:id', authorize('buyer', 'seller', 'admin'), getReturnById);
router.post('/:id/cancel', authorize('buyer', 'admin'), cancelReturn);
router.post('/:id/dispute', authorize('buyer', 'seller', 'admin'), raiseDispute);

module.exports = router;
