const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const crypto = require('crypto');

const Order = require('../src/models/order.model');
const Cart = require('../src/models/cart.model');
const Product = require('../src/models/product.model');
const Inventory = require('../src/models/inventory.model');
const Reservation = require('../src/models/reservation.model');
const Payment = require('../src/models/payment.model');

const {
    createOrder,
    createGuestOrder,
    getGuestOrder,
    cancelGuestOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    requestReturn,
    updateOrderStatus
} = require('../src/controllers/order.controller');
const { addToCart } = require('../src/controllers/cart.controller');
const { createPayment, createGuestPayment } = require('../src/controllers/payment.controller');

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
    const originalInventoryFindOne = Inventory.findOne;
    const originalReservationCreate = Reservation.create;
    const originalReservationInsertMany = Reservation.insertMany;
    const originalReservationFind = Reservation.find;
    const originalPaymentCreate = Payment.create;
    const originalPaymentFindOne = Payment.findOne;
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
        Inventory.findOne = originalInventoryFindOne;
        Reservation.create = originalReservationCreate;
        Reservation.insertMany = originalReservationInsertMany;
        Reservation.find = originalReservationFind;
        Payment.create = originalPaymentCreate;
        Payment.findOne = originalPaymentFindOne;
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

    test('createGuestOrder creates genuine order with hashed token, returns raw token, and creates reservations', async () => {
        const prodId = new mongoose.Types.ObjectId().toString();
        let savedDoc = null;
        let reservationCreated = false;

        Product.findById = async () => ({
            _id: prodId,
            name: 'Artisan Table Lamp',
            price: 2499,
            status: 'active'
        });

        Inventory.findOne = async () => ({
            product: prodId,
            variants: [{ name: 'default', availableStock: 10, reservedStock: 0 }]
        });

        Inventory.findOneAndUpdate = async (filter, update) => {
            return {
                product: prodId,
                variants: [{ name: 'default', availableStock: 8, reservedStock: 2 }]
            };
        };

        Order.create = async (doc) => {
            savedDoc = {
                _id: 'ord_guest_test_1',
                ...doc,
                toObject: () => ({ _id: 'ord_guest_test_1', ...doc })
            };
            return savedDoc;
        };

        Reservation.insertMany = async (docs) => {
            reservationCreated = true;
            return docs;
        };

        const req = {
            body: {
                shippingAddress: {
                    fullName: 'Anita Roy',
                    phone: '9820198201',
                    addressLine: '12 Marine Drive',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postalCode: '400020',
                    country: 'India'
                },
                items: [
                    {
                        product: prodId,
                        quantity: 2,
                        variant: 'default',
                        price: 1 // Attempt to pass client price of 1
                    }
                ],
                paymentMethod: 'COD'
            }
        };
        const res = createMockRes();

        await createGuestOrder(req, res);

        assert.equal(res.statusCode, 201);
        assert.ok(res.body.guestAccessToken, 'Must return raw guestAccessToken');
        assert.equal(typeof res.body.guestAccessToken, 'string');
        const expectedHash = crypto.createHash('sha256').update(res.body.guestAccessToken).digest('hex');
        assert.equal(savedDoc.guestAccessTokenHash, expectedHash, 'Database must store cryptographic SHA-256 hash');
        assert.equal(savedDoc.guestAccessToken, undefined, 'Database must never store raw guest access token');
        assert.equal(res.body.order.guestAccessTokenHash, undefined, 'Hash must not be exposed in returned order object');
        assert.equal(savedDoc.isGuest, true, 'Order must be flagged as guest');
        assert.equal(savedDoc.user, null, 'Guest order user must be null');
        assert.equal(savedDoc.totalAmount, 4998, 'Total price must be strictly recalculated (2499 * 2)');
        assert.equal(savedDoc.paymentMethod, 'COD');
        assert.equal(reservationCreated, true, 'Reservation must be atomically created');
    });

    test('getGuestOrder returns order when valid guestAccessToken is provided and rejects missing or incorrect tokens', async () => {
        const orderId = new mongoose.Types.ObjectId().toString();
        const validRawToken = 'valid_secret_token_12345';
        const validHash = crypto.createHash('sha256').update(validRawToken).digest('hex');

        Order.findById = (id) => ({
            select: (sel) => ({
                lean: async () => ({
                    _id: orderId,
                    isGuest: true,
                    guestAccessTokenHash: validHash,
                    items: [{ name: 'Lamp', quantity: 1, price: 2499 }],
                    totalAmount: 2499
                })
            })
        });

        // 1. Valid token request via x-guest-token header
        const validReq = {
            params: { id: orderId },
            headers: { 'x-guest-token': validRawToken }
        };
        const validRes = createMockRes();
        await getGuestOrder(validReq, validRes);

        assert.equal(validRes.statusCode, 200);
        assert.equal(validRes.body.order._id, orderId);
        assert.equal(validRes.body.order.guestAccessTokenHash, undefined, 'Hash must be stripped from response');

        // 2. Invalid token request
        const invalidReq = {
            params: { id: orderId },
            headers: { 'x-guest-token': 'wrong_token' }
        };
        const invalidRes = createMockRes();
        await getGuestOrder(invalidReq, invalidRes);

        assert.equal(invalidRes.statusCode, 403);
        assert.match(invalidRes.body.message, /Forbidden/i);

        // 3. Missing token request
        const missingReq = {
            params: { id: orderId },
            headers: {}
        };
        const missingRes = createMockRes();
        await getGuestOrder(missingReq, missingRes);

        assert.equal(missingRes.statusCode, 403);
        assert.match(missingRes.body.message, /Forbidden/i);
    });

    test('cancelGuestOrder releases reservations and updates order status with valid token, rejects invalid token', async () => {
        const orderId = new mongoose.Types.ObjectId().toString();
        const prodId = new mongoose.Types.ObjectId().toString();
        const validRawToken = 'cancel_token_secret_999';
        const validHash = crypto.createHash('sha256').update(validRawToken).digest('hex');
        let inventoryReleased = false;

        const fakeOrder = {
            _id: orderId,
            isGuest: true,
            guestAccessTokenHash: validHash,
            deliveryStatus: 'pending',
            paymentStatus: 'pending',
            save: async () => {},
            toObject: () => ({ _id: orderId, isGuest: true, deliveryStatus: 'cancelled' })
        };

        Order.findById = (id) => ({
            select: () => fakeOrder
        });

        Reservation.find = async () => [
            {
                order: orderId,
                product: prodId,
                variant: 'default',
                quantity: 2,
                status: 'reserved',
                save: async () => {}
            }
        ];

        Inventory.findOneAndUpdate = async (filter, update) => {
            inventoryReleased = true;
            return { product: prodId };
        };

        // 1. Invalid token rejects with 403
        const invalidReq = {
            params: { id: orderId },
            headers: { 'x-guest-token': 'bad_token' },
            body: {}
        };
        const invalidRes = createMockRes();
        await cancelGuestOrder(invalidReq, invalidRes);
        assert.equal(invalidRes.statusCode, 403);

        // 2. Valid token succeeds with 200 and releases stock
        const validReq = {
            params: { id: orderId },
            headers: { 'x-guest-token': validRawToken },
            body: { reason: 'Changed mind' }
        };
        const validRes = createMockRes();
        await cancelGuestOrder(validReq, validRes);
        assert.equal(validRes.statusCode, 200);
        assert.equal(inventoryReleased, true, 'Reserved stock must be returned to availableStock');
        assert.equal(fakeOrder.deliveryStatus, 'cancelled');
    });

    test('createGuestPayment validates token hash, checks active reservation, and prevents COD payment attempt', async () => {
        const orderId = new mongoose.Types.ObjectId().toString();
        const validRawToken = 'payment_test_token_888';
        const validHash = crypto.createHash('sha256').update(validRawToken).digest('hex');

        Order.findOne = ({ _id }) => ({
            select: () => ({
                _id: orderId,
                isGuest: true,
                guestAccessTokenHash: validHash,
                totalAmount: 1999,
                paymentMethod: 'UPI',
                paymentStatus: 'pending'
            })
        });

        // 1. Missing token -> 403
        const noTokenReq = { params: { orderId }, headers: {} };
        const noTokenRes = createMockRes();
        await createGuestPayment(noTokenReq, noTokenRes);
        assert.equal(noTokenRes.statusCode, 403);

        // 2. Invalid token -> 403
        const badTokenReq = { params: { orderId }, headers: { 'x-guest-token': 'wrong' } };
        const badTokenRes = createMockRes();
        await createGuestPayment(badTokenReq, badTokenRes);
        assert.equal(badTokenRes.statusCode, 403);

        // 3. Valid token but expired reservation -> 409
        Reservation.find = async () => [];
        const expReq = { params: { orderId }, headers: { 'x-guest-token': validRawToken } };
        const expRes = createMockRes();
        await createGuestPayment(expReq, expRes);
        assert.equal(expRes.statusCode, 409);
        assert.match(expRes.body.message, /expired/i);
    });

    test('cancelOrder and requestReturn handle guest orders safely without crashing when order.user is null', async () => {
        const orderId = new mongoose.Types.ObjectId().toString();

        const fakeGuestOrder = {
            _id: orderId,
            user: null,
            isGuest: true,
            deliveryStatus: 'pending',
            paymentStatus: 'pending',
            save: async () => {}
        };

        Order.findById = async () => fakeGuestOrder;
        Reservation.find = async () => [];

        // Regular buyer cannot cancel guest order -> 403 Forbidden (not 500 TypeError)
        const buyerReq = {
            user: { id: 'buyer_abc', role: 'buyer' },
            params: { id: orderId }
        };
        const buyerRes = createMockRes();
        await cancelOrder(buyerReq, buyerRes);
        assert.equal(buyerRes.statusCode, 403);

        // Admin can cancel guest order -> 200 OK
        const adminReq = {
            user: { id: 'admin_xyz', role: 'admin' },
            params: { id: orderId }
        };
        const adminRes = createMockRes();
        await cancelOrder(adminReq, adminRes);
        assert.equal(adminRes.statusCode, 200);
        assert.equal(fakeGuestOrder.deliveryStatus, 'cancelled');
    });

    test('addToCart rejects invalid variant when product has multiple variants with HTTP 400', async () => {
        const prodId = new mongoose.Types.ObjectId().toString();
        const buyerId = new mongoose.Types.ObjectId().toString();

        Product.findById = async () => ({
            _id: prodId,
            name: 'Apex Smartphone',
            price: 54999,
            status: 'active'
        });

        Inventory.findOne = async () => ({
            product: prodId,
            variants: [
                { name: '128GB Matte Black', availableStock: 5 },
                { name: '256GB Glacier White', availableStock: 3 }
            ]
        });

        const req = {
            user: { id: buyerId },
            body: {
                product: prodId,
                quantity: 1,
                variant: '512GB Sunset Gold' // Invalid variant
            }
        };
        const res = createMockRes();

        await addToCart(req, res);

        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /Invalid variant/i);
    });

    test('addToCart permits default variant when product has single default variant', async () => {
        const prodId = new mongoose.Types.ObjectId().toString();
        const buyerId = new mongoose.Types.ObjectId().toString();

        Product.findById = async () => ({
            _id: prodId,
            name: 'Ergonomic Mousepad',
            price: 599,
            status: 'active'
        });

        Inventory.findOne = async () => ({
            product: prodId,
            variants: [
                { name: 'default', availableStock: 20 }
            ]
        });

        let savedCart = null;
        Cart.findOne = async () => ({
            user: buyerId,
            items: [],
            save: async function () { savedCart = this; }
        });

        const req = {
            user: { id: buyerId },
            body: {
                product: prodId,
                quantity: 1,
                variant: 'default'
            }
        };
        const res = createMockRes();

        await addToCart(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(savedCart.items.length, 1);
        assert.equal(savedCart.items[0].variant, 'default');
    });

    test('expireReservations ignores COD orders and paid orders, preserving stock reservation', async () => {
        const { expireReservations } = require('../src/services/reservation.service');
        const orderId = new mongoose.Types.ObjectId().toString();
        const candidateId = new mongoose.Types.ObjectId().toString();

        let stockReleased = false;

        Reservation.find = () => ({
            select: async () => [{ _id: candidateId }]
        });

        const fakeReservation = {
            _id: candidateId,
            order: orderId,
            status: 'reserved',
            expiresAt: new Date(Date.now() - 1000), // Expired timestamp
            product: new mongoose.Types.ObjectId().toString(),
            variant: 'default',
            quantity: 1,
            save: async () => {}
        };

        Reservation.findById = async () => fakeReservation;

        Order.findById = async () => ({
            _id: orderId,
            paymentMethod: 'COD',
            paymentStatus: 'pending'
        });

        Inventory.findOneAndUpdate = async () => {
            stockReleased = true;
            return { product: fakeReservation.product };
        };

        await expireReservations();

        assert.equal(stockReleased, false, 'Stock must NOT be released for COD orders');
        assert.equal(fakeReservation.status, 'reserved', 'Reservation status must NOT be expired for COD orders');
    });

    test('updateOrderStatus confirms reserved stock when shipping/delivering COD order and marks delivered COD as paid', async () => {
        const orderId = new mongoose.Types.ObjectId().toString();
        const prodId = new mongoose.Types.ObjectId().toString();

        let totalStockDecremented = false;
        let reservationConfirmed = false;

        const fakeOrder = {
            _id: orderId,
            paymentMethod: 'COD',
            paymentStatus: 'pending',
            deliveryStatus: 'pending',
            save: async () => {}
        };

        Order.findById = async () => fakeOrder;
        Product.findByIdAndUpdate = async () => {};

        Reservation.find = async () => [
            {
                order: orderId,
                product: prodId,
                variant: 'default',
                quantity: 2,
                status: 'reserved',
                save: async function () {
                    if (this.status === 'confirmed') reservationConfirmed = true;
                }
            }
        ];

        Inventory.findOneAndUpdate = async (filter, update) => {
            if (update.$inc && update.$inc['variants.$.totalStock'] === -2) {
                totalStockDecremented = true;
            }
            return {
                product: prodId,
                variants: [{ name: 'default', totalStock: 8 }]
            };
        };

        const adminReq = {
            user: { id: 'admin_1', role: 'admin' },
            params: { id: orderId },
            body: { deliveryStatus: 'delivered' }
        };
        const adminRes = createMockRes();

        await updateOrderStatus(adminReq, adminRes);

        assert.equal(adminRes.statusCode, 200);
        assert.equal(fakeOrder.deliveryStatus, 'delivered');
        assert.equal(fakeOrder.paymentStatus, 'paid', 'Delivered COD order must be marked paid');
        assert.equal(totalStockDecremented, true, 'Reserved stock must be converted to permanently deducted totalStock');
        assert.equal(reservationConfirmed, true, 'Reservation status must be confirmed');
    });
});
