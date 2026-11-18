const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Order = require('../src/models/order.model');
const Cart = require('../src/models/cart.model');
const Product = require('../src/models/product.model');
const Inventory = require('../src/models/inventory.model');
const Reservation = require('../src/models/reservation.model');

const {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus
} = require('../src/controllers/order.controller');
const { createPayment } = require('../src/controllers/payment.controller');

describe('Phase 3 - Cart, Orders, and Checkout Concurrency Unit Tests', () => {
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
    const originalOrderFindById = Order.findById;
    const originalOrderFind = Order.find;
    const originalOrderFindOne = Order.findOne;
    const originalOrderCountDocuments = Order.countDocuments;
    const originalInventoryFindOneAndUpdate = Inventory.findOneAndUpdate;
    const originalReservationCreate = Reservation.create;
    const originalReservationFind = Reservation.find;
    const originalMongooseStartSession = mongoose.startSession;

    mongoose.startSession = async () => {
        throw new Error('Transactions disabled in unit tests');
    };

    after(() => {
        mongoose.startSession = originalMongooseStartSession;
        Cart.findOne = originalCartFindOne;
        Cart.findByIdAndUpdate = originalCartFindByIdAndUpdate;
        Product.findById = originalProductFindById;
        Order.create = originalOrderCreate;
        Order.findById = originalOrderFindById;
        Order.find = originalOrderFind;
        Order.findOne = originalOrderFindOne;
        Order.countDocuments = originalOrderCountDocuments;
        Inventory.findOneAndUpdate = originalInventoryFindOneAndUpdate;
        Reservation.create = originalReservationCreate;
        Reservation.find = originalReservationFind;
    });

    test('createOrder rejects invalid or missing shippingAddress', async () => {
        const req = {
            user: { id: 'buyer_1', role: 'buyer' },
            body: {
                shippingAddress: { fullName: 'Alice' } // Incomplete
            }
        };
        const res = createMockRes();

        await createOrder(req, res);

        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /shippingAddress is required/i);
    });

    test('createOrder recalculates prices from DB and creates reservations', async () => {
        const buyerId = new mongoose.Types.ObjectId().toString();
        const prodId = new mongoose.Types.ObjectId().toString();

        Cart.findOne = () => ({
            session() { return this; },
            populate: async () => ({
                _id: 'cart_1',
                user: buyerId,
                items: [
                    {
                        product: { _id: prodId },
                        variant: 'default',
                        quantity: 2,
                        price: 1 // Client price is 1
                    }
                ]
            })
        });

        Product.findById = () => ({
            session() { return this; },
            then(resolve) {
                resolve({
                    _id: prodId,
                    name: 'Test Product',
                    price: 250, // Trusted DB price is 250
                    status: 'active'
                });
            }
        });

        let savedOrderDoc = null;
        Order.create = async (doc) => {
            savedOrderDoc = Array.isArray(doc) ? doc[0] : doc;
            return [{ _id: 'order_123', ...savedOrderDoc }];
        };

        let reservedInventory = null;
        Inventory.findOneAndUpdate = async (filter, update) => {
            reservedInventory = { filter, update };
            return { _id: 'inv_1' };
        };

        let createdReservations = null;
        Reservation.create = async (docs) => {
            createdReservations = docs;
            return docs;
        };

        Cart.findByIdAndUpdate = async () => ({ _id: 'cart_1', items: [] });

        const req = {
            user: { id: buyerId, role: 'buyer' },
            body: {
                shippingAddress: {
                    fullName: 'Alice Johnson',
                    phone: '1234567890',
                    addressLine: '123 Main St',
                    city: 'Metropolis',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'USA'
                }
            }
        };
        const res = createMockRes();

        await createOrder(req, res);

        assert.equal(res.statusCode, 201);
        assert.equal(savedOrderDoc.totalAmount, 500, 'Total amount must be 2 * 250 = 500 from DB, not client price');
        assert.equal(createdReservations.length, 1);
        assert.equal(createdReservations[0].quantity, 2);
        assert.equal(createdReservations[0].status, 'reserved');
    });

    test('cancelOrder releases reservations back to inventory availableStock', async () => {
        const orderId = new mongoose.Types.ObjectId().toString();
        const buyerId = new mongoose.Types.ObjectId().toString();
        const prodId = new mongoose.Types.ObjectId().toString();

        const mockOrder = {
            _id: orderId,
            user: buyerId,
            deliveryStatus: 'pending',
            paymentStatus: 'pending',
            save: async function() { return this; }
        };

        Order.findById = async () => mockOrder;

        const mockReservation = {
            _id: 'res_1',
            order: orderId,
            product: prodId,
            variant: 'default',
            quantity: 3,
            status: 'reserved',
            save: async function() { return this; }
        };

        Reservation.find = async () => [mockReservation];

        let releasedInventory = null;
        Inventory.findOneAndUpdate = async (filter, update) => {
            releasedInventory = { filter, update };
            return { _id: 'inv_1' };
        };

        const req = {
            user: { id: buyerId, role: 'buyer' },
            params: { id: orderId }
        };
        const res = createMockRes();

        await cancelOrder(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(mockOrder.deliveryStatus, 'cancelled');
        assert.equal(mockReservation.status, 'released');
        assert.equal(releasedInventory.update.$inc['variants.$.availableStock'], 3);
        assert.equal(releasedInventory.update.$inc['variants.$.reservedStock'], -3);
    });

    test('getOrderById forbids another user from viewing the order', async () => {
        const orderId = new mongoose.Types.ObjectId().toString();

        Order.findById = () => ({
            lean: async () => ({
                _id: orderId,
                user: new mongoose.Types.ObjectId('555555555555555555555555')
            })
        });

        const req = {
            user: { id: '666666666666666666666666', role: 'buyer' }, // Different user
            params: { id: orderId }
        };
        const res = createMockRes();

        await getOrderById(req, res);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, 'Forbidden');
    });

    test('createOrder accepts valid paymentMethod and persists it in uppercase', async () => {
        const buyerId = new mongoose.Types.ObjectId().toString();
        const prodId = new mongoose.Types.ObjectId().toString();

        Cart.findOne = () => ({
            session() { return this; },
            populate: async () => ({
                _id: 'cart_pm',
                user: buyerId,
                items: [
                    {
                        product: { _id: prodId },
                        variant: 'default',
                        quantity: 1,
                        price: 500
                    }
                ]
            })
        });

        Product.findById = () => ({
            session() { return this; },
            then(resolve) {
                resolve({
                    _id: prodId,
                    name: 'PM Test Product',
                    price: 500,
                    status: 'active'
                });
            }
        });

        let savedOrderDoc = null;
        Order.create = async (doc) => {
            savedOrderDoc = Array.isArray(doc) ? doc[0] : doc;
            return [{ _id: 'order_pm_123', ...savedOrderDoc }];
        };

        Inventory.findOneAndUpdate = async () => ({ _id: 'inv_pm' });
        Reservation.create = async (docs) => docs;
        Cart.findByIdAndUpdate = async () => ({ _id: 'cart_pm', items: [] });

        for (const method of ['upi', 'CARD', 'netbanking', 'emi', 'COD']) {
            const req = {
                user: { id: buyerId, role: 'buyer' },
                body: {
                    shippingAddress: {
                        fullName: 'Bob Smith',
                        phone: '9876543210',
                        addressLine: '456 Market St',
                        city: 'Mumbai',
                        state: 'MH',
                        postalCode: '400001',
                        country: 'India'
                    },
                    paymentMethod: method
                }
            };
            const res = createMockRes();

            await createOrder(req, res);

            assert.equal(res.statusCode, 201);
            assert.equal(savedOrderDoc.paymentMethod, method.toUpperCase());
        }
    });

    test('createOrder rejects invalid paymentMethod with HTTP 400', async () => {
        const req = {
            user: { id: 'buyer_pm_fail', role: 'buyer' },
            body: {
                shippingAddress: {
                    fullName: 'Bob Smith',
                    phone: '9876543210',
                    addressLine: '456 Market St',
                    city: 'Mumbai',
                    state: 'MH',
                    postalCode: '400001',
                    country: 'India'
                },
                paymentMethod: 'BITCOIN'
            }
        };
        const res = createMockRes();

        await createOrder(req, res);

        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /Invalid payment method/i);
    });

    test('createPayment rejects Cash on Delivery (COD) order with HTTP 400', async () => {
        const orderId = new mongoose.Types.ObjectId().toString();
        const buyerId = new mongoose.Types.ObjectId().toString();

        Order.findOne = async () => ({
            _id: orderId,
            user: buyerId,
            paymentStatus: 'pending',
            paymentMethod: 'COD',
            totalAmount: 1499
        });

        const req = {
            user: { id: buyerId, role: 'buyer' },
            params: { orderId }
        };
        const res = createMockRes();

        await createPayment(req, res);

        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /Cash on Delivery \(COD\)/i);
    });
});
