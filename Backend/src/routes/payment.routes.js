const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

const {
    createPayment
} = require('../controllers/payment.controller');

router.post('/:orderId', authMiddleware, authorize('buyer'), createPayment);
router.post(
    '/webhook',
    handleWebhook
);

module.exports = router;