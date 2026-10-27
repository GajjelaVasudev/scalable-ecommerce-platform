
const mongoose = require('mongoose');
const productModel = require('../models/product.model');
const Category = require('../models/category.model');
const Inventory = require('../models/inventory.model');
const Reservation = require('../models/reservation.model');
const Order = require('../models/order.model');

const {
    getCachedProductList,
    cacheProductList,
    invalidateProductLists,
    getCachedProduct,
    cacheProduct,
    invalidateProduct
} = require('../services/productCache.service');

// Safely invalidate product listing caches
async function safelyInvalidateProductLists() {
    try {
        await invalidateProductLists();
    } catch (error) {
        console.error(
            'Product list cache invalidation failed:',
            error.message
        );
    }
}

// Safely invalidate a single product cache
async function safelyInvalidateProduct(productId) {
    try {
        await invalidateProduct(productId);
    } catch (error) {
        console.error(
            'Product detail cache invalidation failed:',
            error.message
        );
    }
}

// Create a product
async function createProduct(req, res) {
    try {
        const {
            name,
            description,
            price,
            stock,
            category,
            image
        } = req.body;

        if (
            !name?.trim() ||
            !description?.trim() ||
            price === undefined ||
            price === null ||
            price === '' ||
            stock === undefined ||
            stock === null ||
            stock === '' ||
            !category ||
            !image?.trim()
        ) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            !Number.isFinite(Number(stock)) ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
        ) {
            return res.status(400).json({
                message: 'Price must be non-negative and stock must be a non-negative integer'
            });
        }

        if (!mongoose.isValidObjectId(category)) {
            return res.status(400).json({
                message: 'Invalid category ID'
            });
        }

        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({
                message: 'Category not found'
            });
        }

        const product = await productModel.create({
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            stock: Number(stock),
            category,
            image: image.trim(),
            seller: req.user.id
        });

        // Automatically create and link inventory with default variant
        await Inventory.findOneAndUpdate(
            { product: product._id },
            {
                $setOnInsert: {
                    product: product._id,
                    variants: [
                        {
                            name: 'default',
                            totalStock: Number(stock),
                            availableStock: Number(stock),
                            reservedStock: 0
                        }
                    ]
                }
            },
            { upsert: true, new: true }
        );

        await safelyInvalidateProductLists();

        return res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Create product error:', error.message);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: 'Failed to create product'
        });
    }
}

// Get products with pagination, filtering, sorting and Redis caching
async function getProducts(req, res) {
    try {
        const { category, minprice, maxprice, sort } = req.query;

        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);

        if (
            !Number.isInteger(page) ||
            page < 1 ||
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                message: 'Page must be a positive integer and limit must be between 1 and 100'
            });
        }

        if (category && !mongoose.isValidObjectId(category)) {
            return res.status(400).json({
                message: 'Invalid category ID'
            });
        }

        const validPrice = (value) =>
            value === undefined ||
            (
                value.trim() !== '' &&
                Number.isFinite(Number(value)) &&
                Number(value) >= 0
            );

        if (!validPrice(minprice) || !validPrice(maxprice)) {
            return res.status(400).json({
                message: 'Price filters must be non-negative numbers'
            });
        }

        if (
            minprice !== undefined &&
            maxprice !== undefined &&
            Number(minprice) > Number(maxprice)
        ) {
            return res.status(400).json({
                message: 'Minimum price cannot exceed maximum price'
            });
        }

        const validSortOptions = [
            'price_asc',
            'price_desc',
            'newest'
        ];

        if (sort && !validSortOptions.includes(sort)) {
            return res.status(400).json({
                message: 'Invalid sort option'
            });
        }

        const skip = (page - 1) * limit;

        const filter = {};
        const sortOption = {};

        if (category) {
            filter.category = category;
        }

        if (minprice !== undefined || maxprice !== undefined) {
            filter.price = {};

            if (minprice !== undefined) {
                filter.price.$gte = Number(minprice);
            }

            if (maxprice !== undefined) {
                filter.price.$lte = Number(maxprice);
            }
        }

        if (sort === 'price_asc') {
            sortOption.price = 1;
        } else if (sort === 'price_desc') {
            sortOption.price = -1;
        } else if (sort === 'newest') {
            sortOption.createdAt = -1;
        }

        // Generate a unique cache key for each query combination
        const cacheKey = JSON.stringify({
            page,
            limit,
            category: category || '',
            minprice: minprice ?? '',
            maxprice: maxprice ?? '',
            sort: sort || ''
        });

        // Try Redis first; continue to MongoDB if Redis fails
        try {
            const cachedData = await getCachedProductList(cacheKey);

            if (cachedData !== null) {
                return res.status(200).json(cachedData);
            }
        } catch (error) {
            console.error(
                'Redis product-list read failed:',
                error.message
            );
        }

        const [products, total] = await Promise.all([
            productModel
                .find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean(),
            productModel.countDocuments(filter)
        ]);

        const response = {
            message: 'Products fetched successfully',
            products,
            pagination: {
                page,
                limit,
                totalProducts: total,
                totalPages: Math.ceil(total / limit)
            }
        };

        // Cache the MongoDB result for subsequent requests
        try {
            await cacheProductList(cacheKey, response);
        } catch (error) {
            console.error(
                'Redis product-list write failed:',
                error.message
            );
        }

        return res.status(200).json(response);
    } catch (error) {
        console.error('Get products error:', error.message);

        return res.status(500).json({
            message: 'Failed to fetch products'
        });
    }
}

// Update a product
async function updateProduct(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: 'Invalid product ID'
            });
        }

        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        const isOwner = req.user.id === product.seller.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: 'Forbidden'
            });
        }

        // Prevent clients from changing ownership or supplying MongoDB operators
        const allowedFields = [
            'name',
            'description',
            'price',
            'stock',
            'category',
            'image'
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (
            updates.price !== undefined &&
            (
                updates.price === '' ||
                !Number.isFinite(Number(updates.price)) ||
                Number(updates.price) < 0
            )
        ) {
            return res.status(400).json({
                message: 'Price must be a non-negative number'
            });
        }

        if (
            updates.stock !== undefined &&
            (
                updates.stock === '' ||
                !Number.isInteger(Number(updates.stock)) ||
                Number(updates.stock) < 0
            )
        ) {
            return res.status(400).json({
                message: 'Stock must be a non-negative integer'
            });
        }

        if (updates.category !== undefined) {
            if (!mongoose.isValidObjectId(updates.category)) {
                return res.status(400).json({
                    message: 'Invalid category ID'
                });
            }

            const categoryExists = await Category.findById(updates.category);
            if (!categoryExists) {
                return res.status(400).json({
                    message: 'Category not found'
                });
            }
        }

        for (const field of ['name', 'description', 'image']) {
            if (
                updates[field] !== undefined &&
                (
                    typeof updates[field] !== 'string' ||
                    !updates[field].trim()
                )
            ) {
                return res.status(400).json({
                    message: `${field} must be a non-empty string`
                });
            }

            if (typeof updates[field] === 'string') {
                updates[field] = updates[field].trim();
            }
        }

        if (updates.price !== undefined) {
            updates.price = Number(updates.price);
        }

        if (updates.stock !== undefined) {
            updates.stock = Number(updates.stock);
        }

        const updatedProduct = await productModel.findByIdAndUpdate(
            id,
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        );

        // Keep inventory default variant in sync with product stock
        if (updates.stock !== undefined) {
            const inventory = await Inventory.findOne({ product: id });
            if (inventory) {
                const defaultVariant = inventory.variants.find(v => v.name === 'default');
                if (defaultVariant) {
                    const diff = updates.stock - defaultVariant.totalStock;
                    defaultVariant.totalStock = updates.stock;
                    defaultVariant.availableStock = Math.max(0, defaultVariant.availableStock + diff);
                    await inventory.save();
                }
            }
        }

        await Promise.all([
            safelyInvalidateProductLists(),
            safelyInvalidateProduct(id)
        ]);

        return res.status(200).json({
            message: 'Product updated successfully',
            updatedProduct
        });
    } catch (error) {
        console.error('Update product error:', error.message);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: 'Failed to update product'
        });
    }
}

// Delete a product
async function deleteProduct(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: 'Invalid product ID'
            });
        }

        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        const isOwner = req.user.id === product.seller.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: 'Forbidden'
            });
        }

        // Prevent deletion if active reservations or orders reference this product
        const activeReservation = await Reservation.findOne({
            product: id,
            status: { $in: ['reserved', 'confirmed'] }
        });

        if (activeReservation) {
            return res.status(409).json({
                message: 'Cannot delete product with active reservations or orders'
            });
        }

        const activeOrder = await Order.findOne({
            'items.product': id,
            deliveryStatus: { $in: ['pending', 'shipped'] }
        });

        if (activeOrder) {
            return res.status(409).json({
                message: 'Cannot delete product with pending or shipped orders'
            });
        }

        const deletedProduct = await productModel.findByIdAndDelete(id);
        await Inventory.findOneAndDelete({ product: id });

        await Promise.all([
            safelyInvalidateProductLists(),
            safelyInvalidateProduct(id)
        ]);

        return res.status(200).json({
            message: 'Product deleted successfully',
            deletedProduct
        });
    } catch (error) {
        console.error('Delete product error:', error.message);

        return res.status(500).json({
            message: 'Failed to delete product'
        });
    }
}

// Get one product with Redis caching
async function getProductById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: 'Invalid product ID'
            });
        }

        try {
            const cachedProduct = await getCachedProduct(id);

            if (cachedProduct !== null) {
                return res.status(200).json({
                    message: 'Product fetched successfully',
                    product: cachedProduct
                });
            }
        } catch (error) {
            console.error(
                'Redis product-detail read failed:',
                error.message
            );
        }

        const product = await productModel.findById(id).lean();

        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        try {
            await cacheProduct(id, product);
        } catch (error) {
            console.error(
                'Redis product-detail write failed:',
                error.message
            );
        }

        return res.status(200).json({
            message: 'Product fetched successfully',
            product
        });
    } catch (error) {
        console.error('Get product error:', error.message);

        return res.status(500).json({
            message: 'Failed to fetch product'
        });
    }
}

module.exports = {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    getProductById
};
