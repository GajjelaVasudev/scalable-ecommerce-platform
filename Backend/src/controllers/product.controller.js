
const productModel = require('../models/product.model');

const {
    getCachedProductList,
    cacheProductList,
    invalidateProductLists
} = require('../services/productCache.service');

// Redis failures must not prevent product operations.
async function safelyInvalidateProductLists() {
    try {
        await invalidateProductLists();
    } catch (error) {
        console.error('Product cache invalidation failed:', error.message);
    }
}

async function createProduct(req, res) {
    const { name, description, price, stock, category, image } = req.body;

    if (
        !name ||
        !description ||
        price === undefined ||
        price === null ||
        price === '' ||
        stock === undefined ||
        stock === null ||
        stock === '' ||
        !category ||
        !image
    ) {
        return res.status(400).json({
            message: 'All fields are required'
        });
    }

    const product = await productModel.create({
        name,
        description,
        price,
        stock,
        category,
        image,
        seller: req.user.id
    });

    await safelyInvalidateProductLists();

    return res.status(201).json({
        message: 'Product created successfully',
        product
    });
}

async function getProducts(req, res) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
        100,
        Math.max(1, Number(req.query.limit) || 10)
    );
    const skip = (page - 1) * limit;

    const { category, minprice, maxprice, sort } = req.query;

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

    // Different query parameters must produce different cache keys.
    const cacheKey = JSON.stringify({
        page,
        limit,
        category: category || '',
        minprice: minprice ?? '',
        maxprice: maxprice ?? '',
        sort: sort || ''
    });

    // Try Redis first. If Redis fails, continue to MongoDB.
    try {
        const cachedData = await getCachedProductList(cacheKey);

        if (cachedData !== null) {
            console.log('PRODUCT CACHE: HIT');
            return res.status(200).json(cachedData);
        }
        console.log('PRODUCT CACHE: MISS');
    } catch (error) {
        console.error('Redis cache read failed:', error.message);
    }

    const products = await productModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sortOption);

    const total = await productModel.countDocuments(filter);

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

    // Cache successful database results for 60 seconds.
    try {
        await cacheProductList(cacheKey, response);
    } catch (error) {
        console.error('Redis cache write failed:', error.message);
    }

    return res.status(200).json(response);
}

async function updateProduct(req, res) {
    const { id } = req.params;

    const product = await productModel.findById(id);

    if (!product) {
        return res.status(404).json({
            message: 'Product not found'
        });
    }

    if (req.user.id !== product.seller.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const updatedProduct = await productModel.findByIdAndUpdate(
        id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    await safelyInvalidateProductLists();

    return res.status(200).json({
        message: 'Product updated successfully',
        updatedProduct
    });
}

async function deleteProduct(req, res) {
    const { id } = req.params;

    const product = await productModel.findById(id);

    if (!product) {
        return res.status(404).json({
            message: 'Product not found'
        });
    }

    if (req.user.id !== product.seller.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const deletedProduct = await productModel.findByIdAndDelete(id);

    await safelyInvalidateProductLists();

    return res.status(200).json({
        message: 'Product deleted successfully',
        deletedProduct
    });
}

async function getProductById(req, res) {
    const { id } = req.params;

    const product = await productModel.findById(id);

    if (!product) {
        return res.status(404).json({
            message: 'Product not found'
        });
    }

    return res.status(200).json({
        message: 'Product fetched successfully',
        product
    });
}

module.exports = {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    getProductById
};
