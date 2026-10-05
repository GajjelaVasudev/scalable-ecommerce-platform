const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

const {
    createPayment,
    handleWebhook
} = require('../controllers/payment.controller');

router.post('/:orderId', authMiddleware, authorize('buyer'), createPayment);
router.post(
    '/webhook',
    handleWebhook
);

module.exports = router;