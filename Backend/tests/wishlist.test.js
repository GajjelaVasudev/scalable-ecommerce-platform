const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Wishlist = require('../src/models/wishlist.model');
const Product = require('../src/models/product.model');
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    mergeWishlist,
    formatWishlistResponse,
    getOrCreateWishlist
} = require('../src/controllers/wishlist.controller');

describe('OMIZON Wishlist — Backend Unit & Integration Tests', () => {
    function createMockRes() {
        return {
            statusCode: 200,
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

    const originalFindById = Product.findById;
    const originalFind = Product.find;
    const originalWishlistFindOne = Wishlist.findOne;
    const originalWishlistFindById = Wishlist.findById;
    const originalWishlistCreate = Wishlist.create;
    const originalWishlistFindOneAndUpdate = Wishlist.findOneAndUpdate;

    after(() => {
        Product.findById = originalFindById;
        Product.find = originalFind;
        Wishlist.findOne = originalWishlistFindOne;
        Wishlist.findById = originalWishlistFindById;
        Wishlist.create = originalWishlistCreate;
        Wishlist.findOneAndUpdate = originalWishlistFindOneAndUpdate;
    });

    const userA_Id = '654321000000000000000001';
    const userB_Id = '654321000000000000000002';
    const product1_Id = '654321000000000000000011';
    const product2_Id = '654321000000000000000012';
    const product3_Id = '654321000000000000000013';

    const mockProduct1 = {
        _id: new mongoose.Types.ObjectId(product1_Id),
        name: 'SoundPulse Studio Pro Headphones',
        price: 24999,
        originalPrice: 32999,
        stock: 15,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1.jpg',
        category: new mongoose.Types.ObjectId(),
        seller: new mongoose.Types.ObjectId()
    };

    const mockProduct2 = {
        _id: new mongoose.Types.ObjectId(product2_Id),
        name: 'AuraGlow Desk Lamp',
        price: 8499,
        originalPrice: 11999,
        stock: 0,
        status: 'out_of_stock',
        image: 'https://images.unsplash.com/photo-2.jpg',
        category: new mongoose.Types.ObjectId(),
        seller: new mongoose.Types.ObjectId()
    };

    const mockProduct3 = {
        _id: new mongoose.Types.ObjectId(product3_Id),
        name: 'Artisan Dining Set',
        price: 4899,
        originalPrice: 6499,
        stock: 5,
        status: 'active',
        image: 'https://images.unsplash.com/photo-3.jpg',
        category: new mongoose.Types.ObjectId(),
        seller: new mongoose.Types.ObjectId()
    };

    // -------------------------------------------------------------------------
    // 1. Fetch Wishlist Tests
    // -------------------------------------------------------------------------
    describe('GET /api/wishlist', () => {
        test('creates and returns an empty wishlist for new buyer', async () => {
            let created = false;
            Wishlist.findOne = ({ user }) => ({
                populate: async () => {
                    if (!created) return null;
                    return { _id: 'mock_wishlist_id', user, items: [], toObject() { return this; } };
                }
            });
            Wishlist.findOneAndUpdate = async ({ user }, update, options) => {
                created = true;
                return { _id: 'mock_wishlist_id', user, items: [] };
            };

            const req = { user: { id: userA_Id } };
            const res = createMockRes();

            await getWishlist(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.itemCount, 0);
            assert.deepEqual(res.body.wishlist.items, []);
        });

        test('returns populated wishlist with computed availability', async () => {
            const mockDoc = {
                _id: 'mock_wishlist_1',
                user: userA_Id,
                items: [
                    {
                        _id: new mongoose.Types.ObjectId(),
                        product: mockProduct1,
                        addedAt: new Date()
                    },
                    {
                        _id: new mongoose.Types.ObjectId(),
                        product: mockProduct2,
                        addedAt: new Date()
                    }
                ],
                toObject() { return this; }
            };

            Wishlist.findOne = () => ({
                populate: async () => mockDoc
            });

            const req = { user: { id: userA_Id } };
            const res = createMockRes();

            await getWishlist(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.itemCount, 2);
            assert.equal(res.body.wishlist.items[0].product.name, 'SoundPulse Studio Pro Headphones');
            assert.equal(res.body.wishlist.items[0].isAvailable, true);
            assert.equal(res.body.wishlist.items[1].isAvailable, false); // Stock 0
        });

        test('safely filters out deleted products from wishlist', async () => {
            let saved = false;
            const mockDocWithNull = {
                _id: 'mock_wishlist_2',
                user: userA_Id,
                items: [
                    {
                        _id: new mongoose.Types.ObjectId(),
                        product: null, // Product was deleted from catalog
                        addedAt: new Date()
                    },
                    {
                        _id: new mongoose.Types.ObjectId(),
                        product: mockProduct1,
                        addedAt: new Date()
                    }
                ],
                save: async function() { saved = true; return this; },
                toObject() { return this; }
            };

            let callCount = 0;
            Wishlist.findOne = () => ({
                populate: async () => {
                    callCount++;
                    if (callCount === 1) return mockDocWithNull;
                    return {
                        _id: 'mock_wishlist_2',
                        user: userA_Id,
                        items: [{ _id: new mongoose.Types.ObjectId(), product: mockProduct1, addedAt: new Date() }],
                        toObject() { return this; }
                    };
                }
            });

            const req = { user: { id: userA_Id } };
            const res = createMockRes();

            await getWishlist(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.itemCount, 1);
            assert.equal(res.body.wishlist.items[0].product.name, 'SoundPulse Studio Pro Headphones');
            assert.equal(saved, true); // Cleaned up dead references
        });
    });

    // -------------------------------------------------------------------------
    // 2. Add to Wishlist & Atomic Concurrency Tests
    // -------------------------------------------------------------------------
    describe('POST /api/wishlist/items', () => {
        test('rejects missing or invalid product ID with 400', async () => {
            const req = { user: { id: userA_Id }, body: { productId: 'invalid_id_format' } };
            const res = createMockRes();

            await addToWishlist(req, res);
            assert.equal(res.statusCode, 400);
            assert.match(res.body.message, /valid product ID/i);
        });

        test('rejects non-existent product ID with 404', async () => {
            Product.findById = async () => null;

            const req = { user: { id: userA_Id }, body: { productId: product1_Id } };
            const res = createMockRes();

            await addToWishlist(req, res);
            assert.equal(res.statusCode, 404);
            assert.match(res.body.message, /product not found/i);
        });

        test('adds product atomically and prevents duplicate entries (idempotent)', async () => {
            Product.findById = async (id) => mockProduct1;

            const inMemoryItems = [];
            Wishlist.findOneAndUpdate = async (query, update, options) => {
                if (update.$setOnInsert) {
                    return { user: userA_Id, items: inMemoryItems };
                }
                // Atomic duplicate check: query has 'items.product': { $ne: productObjectId }
                const isNeQuery = query['items.product'] && query['items.product'].$ne;
                if (isNeQuery) {
                    const targetNeId = query['items.product'].$ne.toString();
                    const alreadyPresent = inMemoryItems.some(i => i.product.toString() === targetNeId);
                    if (alreadyPresent) {
                        return null; // Atomic check blocked duplicate
                    }
                    if (update.$push && update.$push.items) {
                        inMemoryItems.push(update.$push.items);
                        return { user: userA_Id, items: inMemoryItems };
                    }
                }
                return null;
            };

            Wishlist.findOne = () => ({
                populate: async () => ({
                    _id: 'mock_wishlist_atomic',
                    user: userA_Id,
                    items: inMemoryItems.map(i => ({ ...i, product: mockProduct1 })),
                    toObject() { return this; }
                })
            });

            // 1st Add
            const req1 = { user: { id: userA_Id }, body: { productId: product1_Id } };
            const res1 = createMockRes();
            await addToWishlist(req1, res1);

            assert.equal(res1.statusCode, 201);
            assert.equal(res1.body.itemCount, 1);

            // 2nd Add of same product (duplicate test)
            const req2 = { user: { id: userA_Id }, body: { productId: product1_Id } };
            const res2 = createMockRes();
            await addToWishlist(req2, res2);

            assert.equal(res2.statusCode, 200);
            assert.match(res2.body.message, /already in your wishlist/i);
            assert.equal(res2.body.itemCount, 1); // Length did NOT increase!
        });

        test('handles concurrent requests adding the exact same product without duplicates', async () => {
            Product.findById = async () => mockProduct1;

            const inMemoryItems = [];
            // Simulate MongoDB's atomic document locking for findOneAndUpdate
            Wishlist.findOneAndUpdate = async (query, update) => {
                if (update.$setOnInsert) {
                    return { user: userA_Id, items: inMemoryItems };
                }
                if (query['items.product'] && query['items.product'].$ne) {
                    const targetId = query['items.product'].$ne.toString();
                    const exists = inMemoryItems.some(i => i.product.toString() === targetId);
                    if (exists) {
                        return null; // Atomic rejection
                    }
                    inMemoryItems.push(update.$push.items);
                    return { user: userA_Id, items: inMemoryItems };
                }
                return null;
            };

            Wishlist.findOne = () => ({
                populate: async () => ({
                    _id: 'mock_concurrent_wishlist',
                    user: userA_Id,
                    items: inMemoryItems.map(i => ({ ...i, product: mockProduct1 })),
                    toObject() { return this; }
                })
            });

            // Fire 5 concurrent requests adding the same product
            const concurrentReqs = Array.from({ length: 5 }, () => {
                const req = { user: { id: userA_Id }, body: { productId: product1_Id } };
                const res = createMockRes();
                return addToWishlist(req, res).then(() => res);
            });

            const results = await Promise.all(concurrentReqs);

            // Exactly ONE request must get 201 Created; the other 4 get 200 Idempotent
            const createdCount = results.filter(r => r.statusCode === 201).length;
            const idempotentCount = results.filter(r => r.statusCode === 200).length;

            assert.equal(createdCount, 1);
            assert.equal(idempotentCount, 4);
            assert.equal(inMemoryItems.length, 1); // Absolutely no duplicate entries in MongoDB array
        });

        test('getOrCreateWishlist gracefully handles E11000 duplicate key race on document creation', async () => {
            let firstCall = true;
            Wishlist.findOneAndUpdate = async () => {
                if (firstCall) {
                    firstCall = false;
                    const err = new Error('E11000 duplicate key error');
                    err.code = 11000;
                    throw err;
                }
                return { user: userA_Id, items: [] };
            };
            Wishlist.findOne = async () => ({ user: userA_Id, items: [] });

            // Should safely catch 11000 and return existing document without throwing
            const result = await getOrCreateWishlist(userA_Id);
            assert.ok(result);
            assert.equal(result.user, userA_Id);
        });

        test('never trusts client-supplied product price or details', async () => {
            Product.findById = async (id) => mockProduct1; // Authentic DB price is 24999

            Wishlist.findOneAndUpdate = async (query, update) => {
                if (update.$setOnInsert) return { user: userA_Id, items: [] };
                return { user: userA_Id, items: [{ product: mockProduct1._id }] };
            };

            Wishlist.findOne = () => ({
                populate: async () => ({
                    _id: 'mock_wishlist_spoof',
                    user: userA_Id,
                    items: [{ product: mockProduct1, addedAt: new Date() }],
                    toObject() { return this; }
                })
            });

            // Client attempts to spoof price: 1 Rupee!
            const req = {
                user: { id: userA_Id },
                body: { productId: product1_Id, price: 1, name: 'Spoofed Cheap Name' }
            };
            const res = createMockRes();
            await addToWishlist(req, res);

            assert.equal(res.statusCode, 201);
            // Returned product price comes exclusively from MongoDB
            assert.equal(res.body.wishlist.items[0].product.price, 24999);
            assert.equal(res.body.wishlist.items[0].product.name, 'SoundPulse Studio Pro Headphones');
        });
    });

    // -------------------------------------------------------------------------
    // 3. Remove & Clear Wishlist Tests
    // -------------------------------------------------------------------------
    describe('DELETE /api/wishlist/items/:productId and DELETE /api/wishlist', () => {
        test('removes specified product from user wishlist atomically', async () => {
            let pulledId = null;
            Wishlist.findOneAndUpdate = async (query, update) => {
                if (update.$pull && update.$pull.items) {
                    pulledId = update.$pull.items.product.toString();
                }
                return { user: userA_Id };
            };

            Wishlist.findOne = () => ({
                populate: async () => ({
                    _id: 'mock_wishlist_del',
                    user: userA_Id,
                    items: [{ _id: new mongoose.Types.ObjectId(), product: mockProduct2, addedAt: new Date() }],
                    toObject() { return this; }
                })
            });

            const req = { user: { id: userA_Id }, params: { productId: product1_Id } };
            const res = createMockRes();

            await removeFromWishlist(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.itemCount, 1);
            assert.equal(pulledId, product1_Id);
        });

        test('clearWishlist resets wishlist items to empty array atomically', async () => {
            let cleared = false;
            Wishlist.findOneAndUpdate = async (query, update) => {
                if (update.$set && Array.isArray(update.$set.items) && update.$set.items.length === 0) {
                    cleared = true;
                }
                return { user: userA_Id };
            };

            const req = { user: { id: userA_Id } };
            const res = createMockRes();

            await clearWishlist(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.itemCount, 0);
            assert.equal(cleared, true);
        });
    });

    // -------------------------------------------------------------------------
    // 4. Guest Wishlist Merge Tests
    // -------------------------------------------------------------------------
    describe('POST /api/wishlist/merge', () => {
        test('merges guest items, skips duplicates and discards non-existent products', async () => {
            const inMemoryItems = [new mongoose.Types.ObjectId(product1_Id)];

            Wishlist.findOneAndUpdate = async (query, update) => {
                if (update.$setOnInsert) return { user: userA_Id, items: inMemoryItems };
                if (query['items.product'] && query['items.product'].$ne) {
                    const targetId = query['items.product'].$ne.toString();
                    if (!inMemoryItems.some(id => id.toString() === targetId)) {
                        inMemoryItems.push(query['items.product'].$ne);
                    }
                }
                return { user: userA_Id, items: inMemoryItems };
            };

            // Only product 1 and product 3 exist in DB. Non-existent product 999 is omitted
            Product.find = () => ({
                select: async () => [
                    { _id: new mongoose.Types.ObjectId(product1_Id), status: 'active' },
                    { _id: new mongoose.Types.ObjectId(product3_Id), status: 'active' }
                ]
            });

            Wishlist.findOne = () => ({
                populate: async () => ({
                    _id: 'mock_wishlist_merge',
                    user: userA_Id,
                    items: inMemoryItems.map(id => ({
                        product: id.toString() === product1_Id ? mockProduct1 : mockProduct3,
                        addedAt: new Date()
                    })),
                    toObject() { return this; }
                })
            });

            // Guest sends: product 1 (duplicate), product 3 (new), and product 999 (non-existent)
            const fakeNonExistentId = new mongoose.Types.ObjectId().toString();
            const req = {
                user: { id: userA_Id },
                body: { items: [product1_Id, product3_Id, fakeNonExistentId, 'invalid_id_ignored'] }
            };
            const res = createMockRes();

            await mergeWishlist(req, res);

            assert.equal(res.statusCode, 200);
            // Items should now be product 1 and product 3 (2 items total)
            assert.equal(res.body.itemCount, 2);
            const productIds = res.body.wishlist.items.map(i => i.id);
            assert.ok(productIds.includes(product1_Id));
            assert.ok(productIds.includes(product3_Id));
            assert.equal(productIds.includes(fakeNonExistentId), false);
        });

        test('repeated merge calls are idempotent and never create duplicate entries', async () => {
            const inMemoryItems = [
                new mongoose.Types.ObjectId(product1_Id),
                new mongoose.Types.ObjectId(product3_Id)
            ];

            Wishlist.findOneAndUpdate = async (query, update) => {
                if (update.$setOnInsert) return { user: userA_Id, items: inMemoryItems };
                if (query['items.product'] && query['items.product'].$ne) {
                    const targetId = query['items.product'].$ne.toString();
                    if (!inMemoryItems.some(id => id.toString() === targetId)) {
                        inMemoryItems.push(query['items.product'].$ne);
                    }
                }
                return { user: userA_Id, items: inMemoryItems };
            };

            Product.find = () => ({
                select: async () => [
                    { _id: new mongoose.Types.ObjectId(product1_Id), status: 'active' },
                    { _id: new mongoose.Types.ObjectId(product3_Id), status: 'active' }
                ]
            });

            Wishlist.findOne = () => ({
                populate: async () => ({
                    _id: 'mock_wishlist_idempotent',
                    user: userA_Id,
                    items: inMemoryItems.map(id => ({
                        product: id.toString() === product1_Id ? mockProduct1 : mockProduct3,
                        addedAt: new Date()
                    })),
                    toObject() { return this; }
                })
            });

            // Send same items again
            const req = {
                user: { id: userA_Id },
                body: { items: [product1_Id, product3_Id] }
            };
            const res = createMockRes();

            await mergeWishlist(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(res.body.itemCount, 2); // Exactly 2, no duplicates!
        });
    });

    // -------------------------------------------------------------------------
    // 5. User Isolation Tests
    // -------------------------------------------------------------------------
    describe('User Isolation & Data Boundaries', () => {
        test('User A and User B wishlists are strictly isolated', async () => {
            const userA_Doc = {
                _id: 'wishlist_A',
                user: userA_Id,
                items: [{ product: mockProduct1, addedAt: new Date() }],
                toObject() { return this; }
            };
            const userB_Doc = {
                _id: 'wishlist_B',
                user: userB_Id,
                items: [{ product: mockProduct3, addedAt: new Date() }],
                toObject() { return this; }
            };

            Wishlist.findOne = ({ user }) => ({
                populate: async () => (user === userA_Id ? userA_Doc : userB_Doc)
            });

            // Request as User A
            const resA = createMockRes();
            await getWishlist({ user: { id: userA_Id } }, resA);

            // Request as User B
            const resB = createMockRes();
            await getWishlist({ user: { id: userB_Id } }, resB);

            assert.equal(resA.body.wishlist.items[0].product.name, 'SoundPulse Studio Pro Headphones');
            assert.equal(resB.body.wishlist.items[0].product.name, 'Artisan Dining Set');
            assert.notEqual(resA.body.wishlist.items[0].id, resB.body.wishlist.items[0].id);
        });
    });
});
