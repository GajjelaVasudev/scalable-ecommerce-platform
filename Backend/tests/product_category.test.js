const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const productModel = require('../src/models/product.model');
const Category = require('../src/models/category.model');
const Inventory = require('../src/models/inventory.model');
const Reservation = require('../src/models/reservation.model');
const Order = require('../src/models/order.model');

const {
    createProduct,
    updateProduct,
    deleteProduct
} = require('../src/controllers/product.controller');

const {
    createCategory,
    deleteCategory
} = require('../src/controllers/category.controller');

describe('Phase 2 - Product, Category, and Cache Hardening Unit Tests', () => {
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

    const originalCategoryFindById = Category.findById;
    const originalProductCreate = productModel.create;
    const originalProductFindById = productModel.findById;
    const originalProductFindByIdAndDelete = productModel.findByIdAndDelete;
    const originalInventoryFindOneAndUpdate = Inventory.findOneAndUpdate;
    const originalReservationFindOne = Reservation.findOne;
    const originalOrderFindOne = Order.findOne;
    const originalCategoryFindOne = Category.findOne;
    const originalCategoryCreate = Category.create;
    const originalProductCountDocuments = productModel.countDocuments;

    after(() => {
        Category.findById = originalCategoryFindById;
        productModel.create = originalProductCreate;
        productModel.findById = originalProductFindById;
        productModel.findByIdAndDelete = originalProductFindByIdAndDelete;
        Inventory.findOneAndUpdate = originalInventoryFindOneAndUpdate;
        Reservation.findOne = originalReservationFindOne;
        Order.findOne = originalOrderFindOne;
        Category.findOne = originalCategoryFindOne;
        Category.create = originalCategoryCreate;
        productModel.countDocuments = originalProductCountDocuments;
    });

    test('createProduct rejects non-existent category', async () => {
        Category.findById = async () => null; // Category does not exist

        const req = {
            user: { id: 'seller_1', role: 'seller' },
            body: {
                name: 'Laptop',
                description: 'A great laptop',
                price: 999,
                stock: 10,
                category: new mongoose.Types.ObjectId().toString(),
                image: 'https://example.com/laptop.jpg'
            }
        };
        const res = createMockRes();

        await createProduct(req, res);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.message, 'Category not found');
    });

    test('createProduct creates product and initializes linked Inventory record', async () => {
        const catId = new mongoose.Types.ObjectId().toString();
        Category.findById = async () => ({ _id: catId, name: 'electronics' });

        let createdInventory = null;
        Inventory.findOneAndUpdate = async (filter, update) => {
            createdInventory = { filter, update };
            return createdInventory;
        };

        const prodId = new mongoose.Types.ObjectId().toString();
        productModel.create = async (doc) => ({ _id: prodId, ...doc });

        const req = {
            user: { id: 'seller_1', role: 'seller' },
            body: {
                name: 'Laptop',
                description: 'A great laptop',
                price: 999,
                stock: 15,
                category: catId,
                image: 'https://example.com/laptop.jpg'
            }
        };
        const res = createMockRes();

        await createProduct(req, res);

        assert.equal(res.statusCode, 201);
        assert.equal(res.body.product.name, 'Laptop');
        assert.ok(createdInventory, 'Inventory should have been created');
        assert.equal(createdInventory.update.$setOnInsert.variants[0].totalStock, 15);
        assert.equal(createdInventory.update.$setOnInsert.variants[0].availableStock, 15);
    });

    test('updateProduct forbids seller who does not own the product', async () => {
        const prodId = new mongoose.Types.ObjectId().toString();
        productModel.findById = async () => ({
            _id: prodId,
            seller: new mongoose.Types.ObjectId('666666666666666666666666')
        });

        const req = {
            user: { id: '666666666666666666666667', role: 'seller' }, // Different seller
            params: { id: prodId },
            body: { price: 800 }
        };
        const res = createMockRes();

        await updateProduct(req, res);

        assert.equal(res.statusCode, 403);
        assert.equal(res.body.message, 'Forbidden');
    });

    test('updateProduct allows admin even if not seller', async () => {
        const prodId = new mongoose.Types.ObjectId().toString();
        productModel.findById = async () => ({
            _id: prodId,
            seller: new mongoose.Types.ObjectId('666666666666666666666666')
        });
        productModel.findByIdAndUpdate = async (id, update) => ({
            _id: prodId,
            price: 750
        });

        const req = {
            user: { id: 'admin_user_id', role: 'admin' }, // Admin
            params: { id: prodId },
            body: { price: 750 }
        };
        const res = createMockRes();

        await updateProduct(req, res);

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.message, 'Product updated successfully');
    });

    test('deleteProduct blocks deletion when active reservations exist', async () => {
        const prodId = new mongoose.Types.ObjectId().toString();
        const sellerId = new mongoose.Types.ObjectId().toString();

        productModel.findById = async () => ({
            _id: prodId,
            seller: new mongoose.Types.ObjectId(sellerId)
        });

        Reservation.findOne = async () => ({
            _id: 'res_active',
            product: prodId,
            status: 'reserved'
        });

        const req = {
            user: { id: sellerId, role: 'seller' },
            params: { id: prodId }
        };
        const res = createMockRes();

        await deleteProduct(req, res);

        assert.equal(res.statusCode, 409);
        assert.match(res.body.message, /active reservations/i);
    });

    test('deleteCategory blocks deletion if products are assigned to the category', async () => {
        const catId = new mongoose.Types.ObjectId().toString();
        Category.findById = async () => ({ _id: catId, name: 'electronics' });
        productModel.countDocuments = async () => 3; // 3 products in this category

        const req = { params: { id: catId } };
        const res = createMockRes();

        await deleteCategory(req, res);

        assert.equal(res.statusCode, 409);
        assert.match(res.body.message, /assigned to existing products/i);
    });
});
