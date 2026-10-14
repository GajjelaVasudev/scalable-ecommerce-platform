const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

const {
    createPayment,
    handleWebhook,
    listPaymentIssues,
    resolvePaymentIssue
} = require('../controllers/payment.controller');

// Admin reconciliation endpoints must be declared before parameterized routes.
router.get(
    '/reconciliation',
    authMiddleware,
    authorize('admin'),
    listPaymentIssues
);

router.patch(
    '/reconciliation/:issueId/resolve',
    authMiddleware,
    authorize('admin'),
    resolvePaymentIssue
);

router.post('/webhook', handleWebhook);
router.post('/:orderId', authMiddleware, authorize('buyer'), createPayment);

module.exports = router;
