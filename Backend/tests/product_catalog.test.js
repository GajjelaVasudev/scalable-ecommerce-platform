const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Product = require('../src/models/product.model');
const Category = require('../src/models/category.model');
const Inventory = require('../src/models/inventory.model');
const User = require('../src/models/user.model');

const {
    getProducts,
    getProductById
} = require('../src/controllers/product.controller');

const {
    seedDatabase,
    getDeterministicId,
    SEED_CATEGORIES,
    SEED_PRODUCTS
} = require('../src/scripts/seed.js');

describe('Phase 1 - Product Catalog & Seeder Unit Tests', () => {
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

    test('getDeterministicId generates valid 24-character hexadecimal MongoDB ObjectId', () => {
        const id1 = getDeterministicId('product', 'soundpulse-studio-pro');
        const id2 = getDeterministicId('product', 'soundpulse-studio-pro');
        const id3 = getDeterministicId('product', 'apexbook-m3-ultra');

        assert.equal(id1.toString().length, 24);
        assert.equal(id1.toString(), id2.toString(), 'Deterministic ID must match across calls');
        assert.notEqual(id1.toString(), id3.toString(), 'Different keys must generate different IDs');
        assert.ok(mongoose.isValidObjectId(id1.toString()), 'Must be valid MongoDB ObjectId');
    });

    test('getProductById rejects invalid non-ObjectId string with HTTP 400', async () => {
        const req = { params: { id: 'invalid-non-hex-id' } };
        const res = createMockRes();

        await getProductById(req, res);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid product ID');
    });

    test('getProducts validates pagination bounds', async () => {
        const req = { query: { page: '-1' } };
        const res = createMockRes();

        await getProducts(req, res);

        assert.equal(res.statusCode, 400);
        assert.match(res.body.message, /Page must be a positive integer/);
    });

    test('getProducts validates sort options', async () => {
        const req = { query: { sort: 'invalid_sort' } };
        const res = createMockRes();

        await getProducts(req, res);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Invalid sort option');
    });

    test('getProducts sanitizes and executes search query with populated categories', async () => {
        const originalFind = Product.find;
        const originalCount = Product.countDocuments;

        let capturedFilter = null;
        let populatedFields = [];

        Product.find = (filter) => {
            capturedFilter = filter;
            const queryObj = {
                populate: (field, select) => {
                    populatedFields.push({ field, select });
                    return queryObj;
                },
                sort: () => queryObj,
                skip: () => queryObj,
                limit: () => queryObj,
                lean: async () => [
                    {
                        _id: new mongoose.Types.ObjectId(),
                        name: 'SoundPulse Studio Pro Wireless ANC Headphones',
                        price: 24999,
                        category: { _id: new mongoose.Types.ObjectId(), name: 'electronics' }
                    }
                ]
            };
            return queryObj;
        };

        Product.countDocuments = async () => 1;

        try {
            const req = { query: { search: 'SoundPulse', sort: 'featured', page: 1, limit: 12 } };
            const res = createMockRes();

            await getProducts(req, res);

            assert.equal(res.statusCode, 200);
            assert.ok(capturedFilter.$or, 'Must create $or query for search');
            assert.equal(capturedFilter.$or.length, 3);
            assert.equal(res.body.products.length, 1);
            assert.equal(res.body.pagination.totalProducts, 1);
            assert.ok(populatedFields.some(p => p.field === 'category'), 'Must populate category');
        } finally {
            Product.find = originalFind;
            Product.countDocuments = originalCount;
        }
    });

    test('getProducts filters by multi-category query and maps slugs to ObjectIds', async () => {
        const originalFind = Product.find;
        const originalCount = Product.countDocuments;
        const originalCategoryFind = Category.find;

        let capturedFilter = null;
        const mockCat1 = new mongoose.Types.ObjectId();
        const mockCat2 = new mongoose.Types.ObjectId();

        Category.find = () => ({
            select: async () => [{ _id: mockCat1 }, { _id: mockCat2 }]
        });

        Product.find = (filter) => {
            capturedFilter = filter;
            const queryObj = {
                populate: () => queryObj,
                sort: () => queryObj,
                skip: () => queryObj,
                limit: () => queryObj,
                lean: async () => []
            };
            return queryObj;
        };
        Product.countDocuments = async () => 0;

        try {
            const req = { query: { category: 'electronics,home-living' } };
            const res = createMockRes();

            await getProducts(req, res);

            assert.equal(res.statusCode, 200);
            assert.ok(capturedFilter.category, 'Must set category filter');
            assert.ok(capturedFilter.category.$in, 'Must use $in for multiple categories');
            assert.equal(capturedFilter.category.$in.length, 2);
        } finally {
            Product.find = originalFind;
            Product.countDocuments = originalCount;
            Category.find = originalCategoryFind;
        }
    });

    test('getProducts filters by multi-brand query matching brand and brandTag', async () => {
        const originalFind = Product.find;
        const originalCount = Product.countDocuments;

        let capturedFilter = null;

        Product.find = (filter) => {
            capturedFilter = filter;
            const queryObj = {
                populate: () => queryObj,
                sort: () => queryObj,
                skip: () => queryObj,
                limit: () => queryObj,
                lean: async () => []
            };
            return queryObj;
        };
        Product.countDocuments = async () => 0;

        try {
            const req = { query: { brand: 'Apex Tech,SoundPulse' } };
            const res = createMockRes();

            await getProducts(req, res);

            assert.equal(res.statusCode, 200);
            assert.ok(capturedFilter.$or, 'Must contain $or for brand filtering');
            assert.equal(capturedFilter.$or.length, 2);
            assert.ok(capturedFilter.$or[0].brand);
            assert.ok(capturedFilter.$or[1].brandTag);
        } finally {
            Product.find = originalFind;
            Product.countDocuments = originalCount;
        }
    });

    test('getProducts validates minRating and applies rating $gte filter', async () => {
        const originalFind = Product.find;
        const originalCount = Product.countDocuments;

        let capturedFilter = null;

        Product.find = (filter) => {
            capturedFilter = filter;
            const queryObj = {
                populate: () => queryObj,
                sort: () => queryObj,
                skip: () => queryObj,
                limit: () => queryObj,
                lean: async () => []
            };
            return queryObj;
        };
        Product.countDocuments = async () => 0;

        try {
            // Valid rating
            const reqValid = { query: { minRating: '4.5' } };
            const resValid = createMockRes();
            await getProducts(reqValid, resValid);
            assert.equal(resValid.statusCode, 200);
            assert.equal(capturedFilter.rating.$gte, 4.5);

            // Invalid rating > 5
            const reqHigh = { query: { minRating: '5.5' } };
            const resHigh = createMockRes();
            await getProducts(reqHigh, resHigh);
            assert.equal(resHigh.statusCode, 400);
            assert.match(resHigh.body.message, /between 0 and 5/i);

            // Invalid rating < 0
            const reqLow = { query: { minRating: '-1' } };
            const resLow = createMockRes();
            await getProducts(reqLow, resLow);
            assert.equal(resLow.statusCode, 400);
            assert.match(resLow.body.message, /between 0 and 5/i);
        } finally {
            Product.find = originalFind;
            Product.countDocuments = originalCount;
        }
    });

    test('getProducts validates minDiscount and applies $expr percentage filter', async () => {
        const originalFind = Product.find;
        const originalCount = Product.countDocuments;

        let capturedFilter = null;

        Product.find = (filter) => {
            capturedFilter = filter;
            const queryObj = {
                populate: () => queryObj,
                sort: () => queryObj,
                skip: () => queryObj,
                limit: () => queryObj,
                lean: async () => []
            };
            return queryObj;
        };
        Product.countDocuments = async () => 0;

        try {
            // Valid discount
            const reqValid = { query: { minDiscount: '25' } };
            const resValid = createMockRes();
            await getProducts(reqValid, resValid);
            assert.equal(resValid.statusCode, 200);
            assert.ok(capturedFilter.$expr, 'Must use $expr for calculated discount');

            // Invalid discount > 100
            const reqHigh = { query: { minDiscount: '105' } };
            const resHigh = createMockRes();
            await getProducts(reqHigh, resHigh);
            assert.equal(resHigh.statusCode, 400);
            assert.match(resHigh.body.message, /between 0 and 100/i);

            // Invalid discount < 0
            const reqLow = { query: { minDiscount: '-5' } };
            const resLow = createMockRes();
            await getProducts(reqLow, resLow);
            assert.equal(resLow.statusCode, 400);
            assert.match(resLow.body.message, /between 0 and 100/i);
        } finally {
            Product.find = originalFind;
            Product.countDocuments = originalCount;
        }
    });

    test('getProducts filters by fastPrime, twoDayDelivery, and codEligible delivery flags', async () => {
        const originalFind = Product.find;
        const originalCount = Product.countDocuments;

        let capturedFilter = null;

        Product.find = (filter) => {
            capturedFilter = filter;
            const queryObj = {
                populate: () => queryObj,
                sort: () => queryObj,
                skip: () => queryObj,
                limit: () => queryObj,
                lean: async () => []
            };
            return queryObj;
        };
        Product.countDocuments = async () => 0;

        try {
            const req = {
                query: {
                    fastPrime: 'true',
                    twoDayDelivery: 'true',
                    codEligible: 'true'
                }
            };
            const res = createMockRes();

            await getProducts(req, res);

            assert.equal(res.statusCode, 200);
            assert.equal(capturedFilter.fastPrime, true);
            assert.equal(capturedFilter.twoDayDelivery, true);
            assert.equal(capturedFilter.codEligible, true);
        } finally {
            Product.find = originalFind;
            Product.countDocuments = originalCount;
        }
    });

    test('seedDatabase is idempotent: running twice yields identical document counts', async () => {
        const originalUserFindById = User.findById;
        const originalUserCreate = User.create;
        const originalCategoryFindOneAndUpdate = Category.findOneAndUpdate;
        const originalProductFindOneAndUpdate = Product.findOneAndUpdate;
        const originalInventoryFindOneAndUpdate = Inventory.findOneAndUpdate;

        const mockUsers = new Map();
        const mockCategories = new Map();
        const mockProducts = new Map();
        const mockInventories = new Map();

        User.findById = async (id) => mockUsers.get(id.toString()) || null;
        User.create = async (doc) => {
            mockUsers.set(doc._id.toString(), doc);
            return doc;
        };

        Category.findOneAndUpdate = async (filter, update) => {
            const id = filter._id.toString();
            const existing = mockCategories.get(id) || { _id: filter._id };
            const updated = { ...existing, ...update.$set };
            mockCategories.set(id, updated);
            return updated;
        };

        Product.findOneAndUpdate = async (filter, update) => {
            const id = filter._id.toString();
            const existing = mockProducts.get(id) || { _id: filter._id };
            const updated = { ...existing, ...update.$set };
            mockProducts.set(id, updated);
            return updated;
        };

        Inventory.findOneAndUpdate = async (filter, update) => {
            const id = filter.product.toString();
            const existing = mockInventories.get(id) || { product: filter.product };
            const updated = { ...existing, ...update.$set };
            mockInventories.set(id, updated);
            return updated;
        };

        try {
            // First execution
            const run1 = await seedDatabase({ silent: true });
            assert.equal(run1.categoryCount, SEED_CATEGORIES.length);
            assert.equal(run1.productCount, SEED_PRODUCTS.length);
            assert.equal(run1.inventoryCount, SEED_PRODUCTS.length);

            const countProductsRun1 = mockProducts.size;
            const countCategoriesRun1 = mockCategories.size;

            // Second execution (Idempotency test)
            const run2 = await seedDatabase({ silent: true });
            assert.equal(run2.categoryCount, SEED_CATEGORIES.length);
            assert.equal(run2.productCount, SEED_PRODUCTS.length);

            assert.equal(mockProducts.size, countProductsRun1, 'Product count must not grow on rerun');
            assert.equal(mockCategories.size, countCategoriesRun1, 'Category count must not grow on rerun');
        } finally {
            User.findById = originalUserFindById;
            User.create = originalUserCreate;
            Category.findOneAndUpdate = originalCategoryFindOneAndUpdate;
            Product.findOneAndUpdate = originalProductFindOneAndUpdate;
            Inventory.findOneAndUpdate = originalInventoryFindOneAndUpdate;
        }
    });
});
