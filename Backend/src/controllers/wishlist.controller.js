const mongoose = require('mongoose');
const Wishlist = require('../models/wishlist.model');
const Product = require('../models/product.model');

/**
 * Helper to populate product fields consistently
 */
function populateWishlistQuery(query) {
    return query.populate({
        path: 'items.product',
        select: '_id name description price originalPrice stock category seller image images brand rating reviewCount status specs'
    });
}

/**
 * Formats a wishlist document into a clean API response
 */
function formatWishlistResponse(wishlistDoc) {
    if (!wishlistDoc) {
        return {
            items: [],
            itemCount: 0
        };
    }

    const raw = typeof wishlistDoc.toObject === 'function' ? wishlistDoc.toObject() : wishlistDoc;

    const validItems = (raw.items || [])
        .filter(item => item && item.product)
        .map(item => {
            const prod = item.product;
            const isAvailable = prod.status === 'active' && (typeof prod.stock === 'number' ? prod.stock > 0 : true);
            return {
                _id: item._id,
                id: prod._id ? prod._id.toString() : item.product.toString(),
                product: prod,
                addedAt: item.addedAt || new Date(),
                isAvailable,
                inStock: isAvailable,
                stockCount: typeof prod.stock === 'number' ? prod.stock : 0
            };
        });

    return {
        _id: raw._id,
        user: raw.user,
        items: validItems,
        itemCount: validItems.length,
        updatedAt: raw.updatedAt,
        createdAt: raw.createdAt
    };
}

/**
 * Safely finds or creates a user's wishlist document.
 * Gracefully handles race conditions and E11000 duplicate key errors.
 */
async function getOrCreateWishlist(userId) {
    try {
        const wishlist = await Wishlist.findOneAndUpdate(
            { user: userId },
            { $setOnInsert: { user: userId, items: [] } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return wishlist;
    } catch (err) {
        if (err.code === 11000) {
            // Concurrent request created the document; safely fetch existing
            return await Wishlist.findOne({ user: userId });
        }
        throw err;
    }
}

/**
 * GET /api/wishlist
 * Fetches the persistent wishlist for the authenticated buyer.
 */
async function getWishlist(req, res) {
    try {
        const userId = req.user.id;

        let wishlist = await populateWishlistQuery(Wishlist.findOne({ user: userId }));

        if (!wishlist) {
            await getOrCreateWishlist(userId);
            wishlist = await populateWishlistQuery(Wishlist.findOne({ user: userId }));
        } else {
            // Clean up any items whose products were deleted from MongoDB
            const hasDeadItems = (wishlist.items || []).some(item => !item.product);
            if (hasDeadItems) {
                wishlist.items = wishlist.items.filter(item => item.product);
                await wishlist.save();
                wishlist = await populateWishlistQuery(Wishlist.findOne({ user: userId }));
            }
        }

        const formatted = formatWishlistResponse(wishlist);
        return res.status(200).json({
            message: 'Wishlist retrieved successfully',
            wishlist: formatted,
            itemCount: formatted.itemCount
        });
    } catch (error) {
        console.error('getWishlist error:', error.message);
        return res.status(500).json({ message: 'Failed to retrieve wishlist' });
    }
}

/**
 * POST /api/wishlist/items  (or POST /api/wishlist)
 * Adds a product to the user's wishlist atomically and idempotently.
 */
async function addToWishlist(req, res) {
    try {
        const userId = req.user.id;
        const productId = req.body.productId || req.body.product;

        if (!productId || typeof productId !== 'string' || !mongoose.isValidObjectId(productId.trim())) {
            return res.status(400).json({ message: 'A valid product ID is required' });
        }

        const cleanProductId = productId.trim();
        const productObjectId = new mongoose.Types.ObjectId(cleanProductId);

        // Validate product existence in database
        const product = await Product.findById(cleanProductId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // 1. Ensure wishlist document exists (handles concurrent creation safely)
        await getOrCreateWishlist(userId);

        // 2. Atomic push only if product is NOT already present in items.product
        // Guarantees duplicate prevention under concurrent requests!
        const updatedDoc = await Wishlist.findOneAndUpdate(
            {
                user: userId,
                'items.product': { $ne: productObjectId }
            },
            {
                $push: {
                    items: {
                        product: productObjectId,
                        addedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        // Fetch populated wishlist
        const wishlist = await populateWishlistQuery(Wishlist.findOne({ user: userId }));
        const formatted = formatWishlistResponse(wishlist);

        if (!updatedDoc) {
            // Product was already present in wishlist
            return res.status(200).json({
                message: 'Product is already in your wishlist',
                wishlist: formatted,
                itemCount: formatted.itemCount
            });
        }

        return res.status(201).json({
            message: 'Product added to wishlist successfully',
            wishlist: formatted,
            itemCount: formatted.itemCount
        });
    } catch (error) {
        console.error('addToWishlist error:', error.message);
        return res.status(500).json({ message: 'Failed to add product to wishlist' });
    }
}

/**
 * DELETE /api/wishlist/items/:productId (or DELETE /api/wishlist/:productId)
 * Removes a product from the authenticated user's wishlist atomically.
 */
async function removeFromWishlist(req, res) {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        if (!productId || typeof productId !== 'string' || !mongoose.isValidObjectId(productId.trim())) {
            return res.status(400).json({ message: 'A valid product ID is required' });
        }

        const cleanProductId = productId.trim();
        const productObjectId = new mongoose.Types.ObjectId(cleanProductId);

        // Atomically pull the item with productObjectId
        await Wishlist.findOneAndUpdate(
            { user: userId },
            { $pull: { items: { product: productObjectId } } }
        );

        const wishlist = await populateWishlistQuery(Wishlist.findOne({ user: userId }));
        const formatted = formatWishlistResponse(wishlist);

        return res.status(200).json({
            message: 'Product removed from wishlist',
            wishlist: formatted,
            itemCount: formatted.itemCount
        });
    } catch (error) {
        console.error('removeFromWishlist error:', error.message);
        return res.status(500).json({ message: 'Failed to remove product from wishlist' });
    }
}

/**
 * DELETE /api/wishlist
 * Clears all items from the user's wishlist atomically.
 */
async function clearWishlist(req, res) {
    try {
        const userId = req.user.id;

        await Wishlist.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } }
        );

        return res.status(200).json({
            message: 'Wishlist cleared successfully',
            wishlist: { items: [], itemCount: 0 },
            itemCount: 0
        });
    } catch (error) {
        console.error('clearWishlist error:', error.message);
        return res.status(500).json({ message: 'Failed to clear wishlist' });
    }
}

/**
 * POST /api/wishlist/merge
 * Merges guest wishlist items into an authenticated user's persistent wishlist.
 * Deduplicates entries, verifies product existence, and executes atomic inserts.
 */
async function mergeWishlist(req, res) {
    try {
        const userId = req.user.id;
        const rawItems = req.body.items;

        if (!Array.isArray(rawItems)) {
            return res.status(400).json({ message: 'Items array is required for merging' });
        }

        // Extract and deduplicate candidate product IDs
        const candidateIds = new Set();
        for (const item of rawItems) {
            let id = null;
            if (typeof item === 'string') {
                id = item;
            } else if (item && typeof item === 'object') {
                id = item.productId || item.product || item.id || item._id;
                if (typeof id === 'object' && id !== null) {
                    id = id._id || id.id;
                }
            }
            if (id && typeof id === 'string' && mongoose.isValidObjectId(id.trim())) {
                candidateIds.add(id.trim());
            }
        }

        // 1. Ensure wishlist document exists
        await getOrCreateWishlist(userId);

        if (candidateIds.size > 0) {
            // Verify product existence in DB
            const existingProducts = await Product.find({
                _id: { $in: Array.from(candidateIds) }
            }).select('_id status');

            // For each valid product, push atomically if not already present
            for (const prod of existingProducts) {
                const prodObjectId = prod._id;
                await Wishlist.findOneAndUpdate(
                    {
                        user: userId,
                        'items.product': { $ne: prodObjectId }
                    },
                    {
                        $push: {
                            items: {
                                product: prodObjectId,
                                addedAt: new Date()
                            }
                        }
                    }
                );
            }
        }

        const wishlist = await populateWishlistQuery(Wishlist.findOne({ user: userId }));
        const formatted = formatWishlistResponse(wishlist);

        return res.status(200).json({
            message: 'Wishlist merged successfully',
            wishlist: formatted,
            itemCount: formatted.itemCount
        });
    } catch (error) {
        console.error('mergeWishlist error:', error.message);
        return res.status(500).json({ message: 'Failed to merge wishlist' });
    }
}

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    mergeWishlist,
    formatWishlistResponse,
    getOrCreateWishlist
};
