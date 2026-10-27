const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Inventory = require('../src/models/inventory.model');
const Product = require('../src/models/product.model');
const Reservation = require('../src/models/reservation.model');
const Order = require('../src/models/order.model');

const {
    createInventory,
    updateInventory,
    reserveStock
} = require('../src/controllers/inventory.controller');

const {
    confirmReservations,
    releaseReservations
} = require('../src/controllers/reservation.controller');

describe('Phase 4 - Inventory, Reservation, and Concurrency Unit Tests', () => {
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

    const originalProductFindById = Product.findById;
    const originalInventoryFindOne = Inventory.findOne;
    const originalInventoryFindOneAndUpdate = Inventory.findOneAndUpdate;
    const originalReservationFind = Reservation.find;

    after(() => {
        Product.findById = originalProductFindById;
        Inventory.findOne = originalInventoryFindOne;
        Inventory.findOneAndUpdate = originalInventoryFindOneAndUpdate;
        Reservation.find = originalReservationFind;
    });

    test('updateInventory forbids seller who does not own the product', async () => {
        const prodId = new mongoose.Types.ObjectId().toString();
        const realSellerId = new mongoose.Types.ObjectId('111111111111111111111111');
        const rogueSellerId = new mongoose.Types.ObjectId('222222222222222222222222');

        Product.findById = async () => ({
            _id: prodId,
            seller: realSellerId
        });

        const req = {
            user: { id: rogueSellerId.toString(), role: 'seller' },
            params: { productId: prodId },
            body: { variantName: 'default', totalStock: 50 }
        };
        const res = createMockRes();

        await updateInventory(req, res);

        assert.equal(res.statusCode, 403);
        assert.match(res.body.message, /Forbidden/i);
    });

    test('reserveStock prevents overselling when available stock is insufficient', async () => {
        const prodId = new mongoose.Types.ObjectId().toString();

        // findOneAndUpdate with $elemMatch returns null when availableStock < quantity
        Inventory.findOneAndUpdate = async () => null;

        const req = {
            params: { productId: prodId },
            body: { variantName: 'default', quantity: 999 }
        };
        const res = createMockRes();

        await reserveStock(req, res);

        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /Insufficient available stock/i);
    });

    test('confirmReservations rejects expired reservations', async () => {
        const orderId = new mongoose.Types.ObjectId().toString();
        const prodId = new mongoose.Types.ObjectId().toString();

        Reservation.find = async () => [
            {
                _id: 'res_expired',
                order: orderId,
                product: prodId,
                variant: 'default',
                quantity: 2,
                status: 'reserved',
                expiresAt: new Date(Date.now() - 60 * 1000) // Expired 1 minute ago
            }
        ];

        const req = { params: { orderId } };
        const res = createMockRes();

        await confirmReservations(req, res);

        assert.equal(res.statusCode, 409);
        assert.match(res.body.message, /expired/i);
    });

    test('confirmReservations is idempotent when reservations are already confirmed', async () => {
        const orderId = new mongoose.Types.ObjectId().toString();

        Reservation.find = async () => [
            {
                _id: 'res_already_confirmed',
                order: orderId,
                status: 'confirmed'
            }
        ];

        const req = { params: { orderId } };
        const res = createMockRes();

        await confirmReservations(req, res);

        assert.equal(res.statusCode, 200);
        assert.match(res.body.message, /confirmed/i);
    });

    test('releaseReservations is idempotent when reservations are already released', async () => {
        const orderId = new mongoose.Types.ObjectId().toString();

        Reservation.find = async () => [
            {
                _id: 'res_already_released',
                order: orderId,
                status: 'released'
            }
        ];

        const req = { params: { orderId } };
        const res = createMockRes();

        await releaseReservations(req, res);

        assert.equal(res.statusCode, 200);
        assert.match(res.body.message, /released/i);
    });
});
