const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const mongoose = require('mongoose');

const { verifyRazorpaySignature } = require('../src/services/webhook.service');
const { createRazorpayOrder, setRazorpayClient } = require('../src/services/payment.service');
const WebhookEvent = require('../src/models/webhookEvent.model');
const Payment = require('../src/models/payment.model');
const PaymentIssue = require('../src/models/paymentIssue.model');
const Order = require('../src/models/order.model');
const Reservation = require('../src/models/reservation.model');

const {
    handleWebhook
} = require('../src/controllers/payment.controller');

describe('Phase 5 - Razorpay Webhook & Payment Reliability Tests', () => {
    const testSecret = 'whsec_test_secret_12345';
    const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    before(() => {
        process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;
    });

    after(() => {
        process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret;
    });

    function generateSignature(rawBody, secret = testSecret) {
        return crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');
    }

    function createMockRes() {
        return {
            statusCode: null,
            body: null,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                this.body = data;
                return this;
            }
        };
    }

    test('verifyRazorpaySignature validates correct signature and rejects invalid/tampered signature', () => {
        const body = Buffer.from(JSON.stringify({ event: 'payment.captured' }), 'utf8');
        const validSig = generateSignature(body, testSecret);
        const invalidSig = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

        assert.equal(verifyRazorpaySignature(body, validSig, testSecret), true);
        assert.equal(verifyRazorpaySignature(body, invalidSig, testSecret), false);
        assert.equal(verifyRazorpaySignature(body, 'short_sig', testSecret), false);
        assert.equal(verifyRazorpaySignature(body, null, testSecret), false);
    });

    test('createRazorpayOrder uses mocked client and converts amount to paise', async () => {
        let calledOptions = null;
        setRazorpayClient({
            orders: {
                create: async (opts) => {
                    calledOptions = opts;
                    return { id: 'order_rzp_mocked_123', ...opts };
                }
            }
        });

        const order = await createRazorpayOrder({
            amount: 499.50,
            currency: 'INR',
            receipt: 'rec_123'
        });

        assert.equal(order.id, 'order_rzp_mocked_123');
        assert.equal(calledOptions.amount, 49950, 'Amount must be converted to minor unit (paise)');
        assert.equal(calledOptions.currency, 'INR');
    });

    test('handleWebhook rejects request with missing or invalid signature', async () => {
        const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
        const req = {
            headers: { 'x-razorpay-signature': 'invalid_sig' },
            body: rawBody
        };
        const res = createMockRes();

        await handleWebhook(req, res);

        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /invalid webhook signature/i);
    });

    test('handleWebhook safely ignores duplicate webhook deliveries', async () => {
        const rawBody = Buffer.from(JSON.stringify({
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_test_dup',
                        order_id: 'order_test_dup',
                        amount: 50000,
                        currency: 'INR'
                    }
                }
            }
        }));
        const validSig = generateSignature(rawBody, testSecret);

        // Mock WebhookEvent.exists returning true
        const originalExists = WebhookEvent.exists;
        WebhookEvent.exists = async () => ({ _id: 'existing_event' });

        const req = {
            headers: {
                'x-razorpay-signature': validSig,
                'x-razorpay-event-id': 'evt_test_duplicate_123'
            },
            body: rawBody
        };
        const res = createMockRes();

        await handleWebhook(req, res);

        WebhookEvent.exists = originalExists;

        assert.equal(res.statusCode, 200);
        assert.match(res.body.message, /duplicate webhook event ignored/i);
    });

    test('handleWebhook records payment failure and preserves reservations for retry', async () => {
        const rawBody = Buffer.from(JSON.stringify({
            event: 'payment.failed',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_failed_123',
                        order_id: 'order_rzp_123',
                        amount: 50000,
                        currency: 'INR',
                        error_description: 'Card declined'
                    }
                }
            }
        }));
        const validSig = generateSignature(rawBody, testSecret);

        const originalExists = WebhookEvent.exists;
        const originalEventCreate = WebhookEvent.create;
        const originalPaymentFindOne = Payment.findOne;
        const originalOrderFindById = Order.findById;

        WebhookEvent.exists = async () => null;
        WebhookEvent.create = async (doc) => doc;

        const mockPayment = {
            _id: 'payment_1',
            providerOrderId: 'order_rzp_123',
            amount: 500,
            currency: 'INR',
            status: 'created',
            activeAttempt: true,
            order: 'order_db_1',
            save: async function() { return this; }
        };

        const mockOrder = {
            _id: 'order_db_1',
            paymentStatus: 'pending',
            save: async function() { return this; }
        };

        Payment.findOne = () => ({
            session() { return this; },
            then(resolve) { resolve(mockPayment); }
        });

        Order.findById = () => ({
            session() { return this; },
            then(resolve) { resolve(mockOrder); }
        });

        const req = {
            headers: {
                'x-razorpay-signature': validSig,
                'x-razorpay-event-id': 'evt_fail_1'
            },
            body: rawBody
        };
        const res = createMockRes();

        await handleWebhook(req, res);

        WebhookEvent.exists = originalExists;
        WebhookEvent.create = originalEventCreate;
        Payment.findOne = originalPaymentFindOne;
        Order.findById = originalOrderFindById;

        assert.equal(res.statusCode, 200);
        assert.equal(mockPayment.status, 'failed');
        assert.equal(mockPayment.activeAttempt, false);
        assert.equal(mockPayment.failureReason, 'Card declined');
        assert.equal(mockOrder.paymentStatus, 'unpaid'); // Allowed to retry until reservation expiry
    });
});
