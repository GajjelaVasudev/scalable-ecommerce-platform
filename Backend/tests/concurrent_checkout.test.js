const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Order = require('../src/models/order.model');
const Cart = require('../src/models/cart.model');
const Product = require('../src/models/product.model');
const Inventory = require('../src/models/inventory.model');
const Reservation = require('../src/models/reservation.model');

const { createOrder } = require('../src/controllers/order.controller');

describe('Phase 7 - Concurrent Checkout & Contention Integration Tests', () => {
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

    const originalCartFindOne = Cart.findOne;
    const originalCartFindByIdAndUpdate = Cart.findByIdAndUpdate;
    const originalProductFindById = Product.findById;
    const originalOrderCreate = Order.create;
    const originalInventoryFindOneAndUpdate = Inventory.findOneAndUpdate;
    const originalInventoryFindOne = Inventory.findOne;
    const originalReservationCreate = Reservation.create;

    after(() => {
        Cart.findOne = originalCartFindOne;
        Cart.findByIdAndUpdate = originalCartFindByIdAndUpdate;
        Product.findById = originalProductFindById;
        Order.create = originalOrderCreate;
        Inventory.findOneAndUpdate = originalInventoryFindOneAndUpdate;
        Inventory.findOne = originalInventoryFindOne;
        Reservation.create = originalReservationCreate;
    });

    test('Two concurrent checkout requests with only 1 item in stock: exactly one succeeds and one fails with 409', async () => {
        const buyerId = new mongoose.Types.ObjectId().toString();
        const prodId = new mongoose.Types.ObjectId().toString();

        let stockAvailable = 1;

        Cart.findOne = () => ({
            session() { return this; },
            populate: async () => ({
                _id: 'cart_concurrent_1',
                user: buyerId,
                items: [
                    {
                        product: { _id: prodId },
                        variant: 'default',
                        quantity: 1,
                        price: 100
                    }
                ]
            })
        });

        Product.findById = () => ({
            session() { return this; },
            then(resolve) {
                resolve({
                    _id: prodId,
                    name: 'Scarce Item',
                    price: 100,
                    status: 'active'
                });
            }
        });

        Order.create = async (doc) => {
            const data = Array.isArray(doc) ? doc[0] : doc;
            return [{ _id: new mongoose.Types.ObjectId().toString(), ...data }];
        };

        Reservation.create = async (docs) => docs;
        Cart.findByIdAndUpdate = async () => ({ items: [] });
        Inventory.findOne = async () => null;

        // Simulate atomic findOneAndUpdate with availableStock check
        Inventory.findOneAndUpdate = async (filter, update) => {
            if (stockAvailable >= 1) {
                stockAvailable -= 1;
                return { _id: 'inv_1', product: prodId };
            }
            return null; // Out of stock for second racer
        };

        const shippingAddress = {
            fullName: 'Racer User',
            phone: '9999999999',
            addressLine: 'Fast Lane 1',
            city: 'Speed City',
            state: 'CA',
            postalCode: '90001',
            country: 'USA'
        };

        const req1 = { user: { id: buyerId, role: 'buyer' }, body: { shippingAddress } };
        const req2 = { user: { id: buyerId, role: 'buyer' }, body: { shippingAddress } };

        const res1 = createMockRes();
        const res2 = createMockRes();

        // Run both checkouts concurrently
        await Promise.all([
            createOrder(req1, res1),
            createOrder(req2, res2)
        ]);

        const statuses = [res1.statusCode, res2.statusCode].sort();
        // One must succeed with 201, and one must fail with 409 Conflict (Insufficient stock)
        assert.deepEqual(statuses, [201, 409]);
    });
});
